# GitHub API 接口参数校验测试

## 测试用例

### 1. 认证测试
```bash
# 未认证请求
curl -X POST http://localhost:5173/api/admin/github \
  -H "Content-Type: application/json" \
  -d '[]'
# 预期: 401 Unauthorized
```

### 2. 请求体格式测试
```bash
# 非 JSON 格式
curl -X POST http://localhost:5173/api/admin/github \
  -H "Content-Type: application/json" \
  -d 'invalid json'
# 预期: 400 Bad Request - 请求体格式错误

# 非数组格式
curl -X POST http://localhost:5173/api/admin/github \
  -H "Content-Type: application/json" \
  -d '{"path": "test.txt", "content": "test"}'
# 预期: 400 Bad Request - 请求体必须是一个数组

# 空数组
curl -X POST http://localhost:5173/api/admin/github \
  -H "Content-Type: application/json" \
  -d '[]'
# 预期: 400 Bad Request - 请求体不能为空数组
```

### 3. 文件数量限制测试
```bash
# 超过 10 个文件
curl -X POST http://localhost:5173/api/admin/github \
  -H "Content-Type: application/json" \
  -d '[
    {"path": "file1.txt", "content": "content1"},
    {"path": "file2.txt", "content": "content2"},
    {"path": "file3.txt", "content": "content3"},
    {"path": "file4.txt", "content": "content4"},
    {"path": "file5.txt", "content": "content5"},
    {"path": "file6.txt", "content": "content6"},
    {"path": "file7.txt", "content": "content7"},
    {"path": "file8.txt", "content": "content8"},
    {"path": "file9.txt", "content": "content9"},
    {"path": "file10.txt", "content": "content10"},
    {"path": "file11.txt", "content": "content11"}
  ]'
# 预期: 400 Bad Request - 单次最多只能更新 10 个文件
```

### 4. 文件对象格式测试
```bash
# 缺少 path 字段
curl -X POST http://localhost:5173/api/admin/github \
  -H "Content-Type: application/json" \
  -d '[{"content": "test content"}]'
# 预期: 400 Bad Request - 第 1 个文件对象格式无效

# 缺少 content 字段
curl -X POST http://localhost:5173/api/admin/github \
  -H "Content-Type: application/json" \
  -d '[{"path": "test.txt"}]'
# 预期: 400 Bad Request - 第 1 个文件对象格式无效

# path 为空字符串
curl -X POST http://localhost:5173/api/admin/github \
  -H "Content-Type: application/json" \
  -d '[{"path": "", "content": "test"}]'
# 预期: 400 Bad Request - 第 1 个文件对象格式无效

# path 包含非法字符
curl -X POST http://localhost:5173/api/admin/github \
  -H "Content-Type: application/json" \
  -d '[{"path": "test<>.txt", "content": "test"}]'
# 预期: 400 Bad Request - 第 1 个文件对象格式无效
```

### 5. 路径重复测试
```bash
# 重复的文件路径
curl -X POST http://localhost:5173/api/admin/github \
  -H "Content-Type: application/json" \
  -d '[
    {"path": "test.txt", "content": "content1"},
    {"path": "test.txt", "content": "content2"}
  ]'
# 预期: 400 Bad Request - 文件路径重复: test.txt
```

### 6. 有效请求测试
```bash
# 有效的请求
curl -X POST http://localhost:5173/api/admin/github \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=valid_session_token" \
  -d '[
    {"path": "test1.txt", "content": "Hello World 1"},
    {"path": "folder/test2.txt", "content": "Hello World 2"}
  ]'
# 预期: 200 OK - 成功更新 2 个文件
```

## 边界条件测试

### 1. 路径长度限制
```bash
# 路径长度超过 255 字符
curl -X POST http://localhost:5173/api/admin/github \
  -H "Content-Type: application/json" \
  -d '[{"path": "' + 'a'.repeat(256) + '.txt", "content": "test"}]'
# 预期: 400 Bad Request - 第 1 个文件对象格式无效
```

### 2. 内容大小限制
```bash
# 内容超过 50MB (需要生成大文件测试)
# 预期: 400 Bad Request - 第 1 个文件对象格式无效
```

## 错误处理测试

### 1. GitHub 配置错误
- 移除环境变量 GITHUB_TOKEN
- 预期: 502 Bad Gateway - GitHub 服务配置错误

### 2. GitHub API 错误
- 使用无效的 Token
- 预期: 403 Forbidden - GitHub 权限不足

### 3. 仓库不存在
- 配置不存在的仓库
- 预期: 404 Not Found - 仓库或分支不存在

## 成功响应格式
```json
{
  "success": true,
  "data": {
    // GitHub API 返回的数据
  },
  "message": "成功更新 2 个文件"
}
```

## 错误响应格式
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "具体的错误信息"
}
```
