# GitHub API 批量更新使用说明

## 概述

`/api/admin/github` 端点支持批量更新 GitHub 文件，现在能够处理部分成功的情况，返回详细的成功和失败信息。

## API 响应格式

### 全部成功时
```json
{
  "success": true,
  "data": {
    "success": [
      // GitHub API 响应数组
    ],
    "totalCount": 3,
    "successCount": 3
  },
  "message": "成功更新 3 个文件"
}
```

### 部分成功时
```json
{
  "success": true,
  "data": {
    "success": [
      // 成功的 GitHub API 响应
    ],
    "failures": [
      {
        "commit": {
          "path": "failed-file.txt",
          "content": "content",
          "message": "update message"
        },
        "error": "GitHub API Error: 404 - Not Found"
      }
    ],
    "totalCount": 3,
    "successCount": 2,
    "failureCount": 1
  },
  "message": "批量更新完成: 2/3 个文件成功，1 个失败"
}
```

### 全部失败时
```json
{
  "success": false,
  "error": "GITHUB_API_ERROR",
  "message": "所有文件更新失败: ..."
}
```

## 客户端处理示例

```typescript
import { API } from '$lib/client/api';
import type { GithubCommit } from '$lib/types';

async function handleBatchUpdate(commits: GithubCommit[]) {
  try {
    const response = await API.putCommits(commits);
    
    if (response.success) {
      const { data } = response;
      
      if (data.failureCount === 0) {
        // 全部成功
        console.log(`✅ 所有 ${data.successCount} 个文件更新成功`);
        showSuccessMessage(response.message);
      } else {
        // 部分成功
        console.log(`⚠️ 部分更新成功: ${data.successCount}/${data.totalCount}`);
        
        // 处理成功的文件
        data.success.forEach((result, index) => {
          console.log(`✅ 文件更新成功:`, result);
        });
        
        // 处理失败的文件
        data.failures.forEach(({ commit, error }) => {
          console.error(`❌ 文件 ${commit.path} 更新失败:`, error);
        });
        
        showPartialSuccessMessage(response.message, data.failures);
      }
    } else {
      // 全部失败
      console.error('❌ 批量更新失败:', response.message);
      showErrorMessage(response.message);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error);
    showErrorMessage('网络错误，请重试');
  }
}

// UI 提示函数示例
function showSuccessMessage(message: string) {
  // 显示成功提示
}

function showPartialSuccessMessage(message: string, failures: any[]) {
  // 显示部分成功提示，可能包含重试失败文件的选项
}

function showErrorMessage(message: string) {
  // 显示错误提示
}
```

## 错误处理

API 现在能够区分以下错误类型：

1. **认证错误** (401): 未登录或权限不足
2. **验证错误** (400): 请求格式错误、数据无效等
3. **GitHub API 错误** (502): GitHub 服务问题
4. **权限错误** (403): GitHub 权限不足
5. **文件不存在** (404): 文件或仓库不存在
6. **频率限制** (429): GitHub API 调用频率过高

## 最佳实践

1. **批量大小**: 建议单次最多更新 10 个文件
2. **错误重试**: 对于部分失败的情况，可以提供重试失败文件的选项
3. **用户反馈**: 清晰地向用户展示哪些文件成功、哪些失败
4. **日志记录**: 在控制台记录详细的操作结果用于调试
