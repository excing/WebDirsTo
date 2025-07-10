# GitHub API 接口边界检测和参数校验

## 概述

为 `/api/admin/github` 接口添加了完善的边界检测、参数校验和错误处理机制，确保接口的安全性和稳定性。

## 实现的验证功能

### 1. 认证验证
- 使用 `AdminAuthService.verifyApiAccess()` 验证管理员权限
- 未认证请求返回 401 状态码

### 2. 请求体格式验证
- **JSON 解析验证**: 确保请求体是有效的 JSON 格式
- **数据类型验证**: 确保请求体是数组类型
- **数组长度验证**: 
  - 不允许空数组
  - 单次最多更新 10 个文件

### 3. 文件对象验证 (`GitHubBlob`)
每个文件对象必须满足以下条件：

#### 必需字段验证
- `path`: 必须是非空字符串
- `content`: 必须是字符串

#### 路径验证
- **非空验证**: 路径不能为空或只包含空白字符
- **字符验证**: 不能包含非法字符 `<>:"|?*` 和控制字符
- **长度限制**: 路径长度不能超过 255 字符
- **重复检查**: 同一请求中不能有重复的文件路径

#### 内容验证
- **大小限制**: 单个文件内容不能超过 50MB

### 4. GitHub 服务验证
- **配置验证**: 检查环境变量是否正确配置
- **服务实例化**: 安全地创建 GitHub 服务实例

## 错误处理机制

### 1. 认证错误 (401)
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "需要管理员权限"
}
```

### 2. 参数验证错误 (400)
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "具体的验证错误信息"
}
```

可能的验证错误信息：
- "请求体格式错误：无法解析 JSON"
- "请求体必须是一个数组"
- "请求体不能为空数组"
- "单次最多只能更新 10 个文件"
- "第 X 个文件对象格式无效：必须包含有效的 path 和 content 字段"
- "文件路径重复：{path}"

### 3. GitHub 配置错误 (502)
```json
{
  "success": false,
  "error": "GITHUB_API_ERROR",
  "message": "GitHub 服务配置错误，请检查环境变量"
}
```

### 4. GitHub API 错误

#### 权限不足 (403)
```json
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "GitHub 权限不足，请检查 Token 权限"
}
```

#### 资源不存在 (404)
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "仓库或分支不存在"
}
```

#### 频率限制 (429)
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "请求频率过高，请稍后再试"
}
```

#### 其他 GitHub API 错误 (502)
```json
{
  "success": false,
  "error": "GITHUB_API_ERROR",
  "message": "GitHub API 错误: {具体错误信息}"
}
```

### 5. 未知错误 (500)
```json
{
  "success": false,
  "error": "FETCH_FAILED",
  "message": "具体的错误信息"
}
```

## 成功响应格式

```json
{
  "success": true,
  "data": {
    // GitHub API 返回的提交信息
  },
  "message": "成功更新 X 个文件"
}
```

## 安全特性

1. **输入清理**: 自动清理路径中的前后空白字符
2. **路径安全**: 防止路径注入攻击
3. **大小限制**: 防止过大文件导致的内存问题
4. **数量限制**: 防止批量操作过载
5. **重复检查**: 防止意外的重复操作

## 使用建议

1. **批量大小**: 建议单次更新 1-5 个文件以获得最佳性能
2. **错误重试**: 对于 GitHub API 错误，可以实现指数退避重试机制
3. **用户反馈**: 根据不同的错误类型提供相应的用户提示
4. **日志记录**: 所有错误都会记录到控制台，便于调试

## 相关文件

- `src/routes/api/admin/github/+server.ts` - 主要实现文件
- `src/lib/types.ts` - 类型定义
- `src/lib/constants.ts` - 错误代码和消息
- `src/routes/api/admin/github/test-validation.md` - 测试用例
