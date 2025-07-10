# Sites Manager 使用指南

## 概述

`src/lib/client/sites.ts` 提供了完整的网站管理功能，包括网站的增删改查、待审核网站的批准/拒绝等操作。

## 功能特性

### 🔄 **状态管理**
- 全局状态管理，支持订阅状态变化
- 自动同步本地状态与服务器数据
- 错误处理和加载状态管理

### 📝 **网站管理**
1. **提交新网站** - 调用 `/api/submit-site` 接口
2. **编辑网站** - 修改 sites.txt 中的内容
3. **删除网站** - 从 sites.txt 移除并归档到 404.txt
4. **批准网站** - 从 todo.csv 移动到 sites.txt
5. **拒绝网站** - 更新 todo.csv 中的状态

### 🔍 **查询功能**
- 搜索网站（标题、描述、分类、标签、URL）
- 按分类筛选
- 获取统计信息
- 获取所有分类列表

## 使用方法

### 1. 基本使用

```typescript
import { sitesManager, subscribe, loadData } from '$lib/client/sites';

// 订阅状态变化
const unsubscribe = subscribe((state) => {
  console.log('Sites:', state.sites.length);
  console.log('Pending:', state.todos.length);
  console.log('Loading:', state.loading);
  console.log('Error:', state.error);
});

// 加载数据
await loadData();

// 取消订阅
unsubscribe();
```

### 2. 在 Svelte 组件中使用

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { sitesManager } from '$lib/client/sites';
  
  let sitesState = $state(sitesManager.getState());
  
  onMount(() => {
    // 订阅状态变化
    const unsubscribe = sitesManager.subscribe((state) => {
      sitesState = state;
    });
    
    // 加载数据
    sitesManager.loadData();
    
    return unsubscribe;
  });
</script>

{#if sitesState.loading}
  <p>加载中...</p>
{:else if sitesState.error}
  <p>错误: {sitesState.error}</p>
{:else}
  <p>共有 {sitesState.sites.length} 个网站</p>
  <p>待审核 {sitesState.todos.filter(t => t.status === 'pending').length} 个</p>
{/if}
```

### 3. 网站操作

#### 提交新网站
```typescript
import { submitSite } from '$lib/client/sites';

const result = await submitSite('https://example.com');
if (result.success) {
  console.log('提交成功:', result.message);
} else {
  console.error('提交失败:', result.message);
}
```

#### 编辑网站
```typescript
import { editSite } from '$lib/client/sites';

const originalSite = { /* 原始网站数据 */ };
const updatedSite = { 
  ...originalSite, 
  title: '新标题',
  description: '新描述'
};

const result = await editSite(originalSite, updatedSite);
if (result.success) {
  console.log('编辑成功:', result.message);
}
```

#### 删除网站
```typescript
import { deleteSite } from '$lib/client/sites';

const siteToDelete = { /* 要删除的网站数据 */ };

const result = await deleteSite(siteToDelete);
if (result.success) {
  console.log('删除成功:', result.message);
}
```

#### 批准网站
```typescript
import { approveSite } from '$lib/client/sites';

const todoItem = { /* 待审核的提交 */ };
const siteData = { /* 网站数据 */ };

const result = await approveSite(todoItem, siteData);
if (result.success) {
  console.log('批准成功:', result.message);
}
```

#### 拒绝网站
```typescript
import { rejectSite } from '$lib/client/sites';

const todoItem = { /* 待审核的提交 */ };
const reason = '不符合收录标准';

const result = await rejectSite(todoItem, reason);
if (result.success) {
  console.log('拒绝成功:', result.message);
}
```

### 4. 批量操作 (优化版 - 一次性提交)

#### 批量批准
```typescript
import { batchApproveSites } from '$lib/client/sites';

const approvals = [
  { todo: todoItem1, site: siteData1 },
  { todo: todoItem2, site: siteData2 }
];

const result = await batchApproveSites(approvals);
console.log(result.message); // "成功批准 2/2 个网站"
console.log(result.results); // 详细结果
```

#### 批量拒绝
```typescript
import { batchRejectSites } from '$lib/client/sites';

const rejections = [
  { todo: todoItem1, reason: '重复网站' },
  { todo: todoItem2, reason: '内容不当' }
];

const result = await batchRejectSites(rejections);
console.log(result.message); // "成功拒绝 2/2 个网站"
```

#### 混合批量操作 (推荐)
```typescript
import { batchProcessSites } from '$lib/client/sites';

// 同时处理批准和拒绝，只发送一次请求
const result = await batchProcessSites({
  approvals: [
    { todo: todoItem1, site: siteData1 },
    { todo: todoItem2, site: siteData2 }
  ],
  rejections: [
    { todo: todoItem3, reason: '重复网站' },
    { todo: todoItem4, reason: '内容不当' }
  ]
});

console.log(result.message); // "成功批准 2 个，拒绝 2 个网站"
console.log(result.results.approvals); // 批准结果
console.log(result.results.rejections); // 拒绝结果
```

### 5. 查询和筛选

#### 搜索网站
```typescript
import { searchSites } from '$lib/client/sites';

const results = searchSites('搜索引擎');
console.log('搜索结果:', results);
```

#### 按分类筛选
```typescript
import { filterSitesByCategory } from '$lib/client/sites';

const categoryResults = filterSitesByCategory('工具');
console.log('工具类网站:', categoryResults);
```

#### 获取统计信息
```typescript
import { getStats } from '$lib/client/sites';

const stats = getStats();
console.log('统计信息:', {
  totalSites: stats.totalSites,
  pendingSubmissions: stats.pendingSubmissions,
  starredSites: stats.starredSites,
  categoryCounts: stats.categoryCounts
});
```

#### 获取所有分类
```typescript
import { getCategories } from '$lib/client/sites';

const categories = getCategories();
console.log('所有分类:', categories);
```

## 错误处理

所有操作都返回统一的结果格式：

```typescript
interface OperationResult {
  success: boolean;
  message?: string;
  results?: Array<{ url: string; success: boolean; message?: string }>; // 仅批量操作
}
```

建议在 UI 中根据结果显示相应的提示信息：

```typescript
const result = await submitSite(url);
if (result.success) {
  showSuccessToast(result.message);
} else {
  showErrorToast(result.message);
}
```

## 最佳实践

1. **状态订阅**: 在组件挂载时订阅状态，卸载时取消订阅
2. **错误处理**: 始终检查操作结果并给用户反馈
3. **批量操作**: 对于多个操作，优先使用批量方法以提高性能
4. **数据同步**: 重要操作后可以调用 `loadData()` 确保数据同步

## 相关文件

- `src/lib/client/sites.ts` - 主要实现
- `src/lib/client/api.ts` - API 接口
- `src/lib/conv.ts` - 数据转换函数
- `src/lib/types.ts` - 类型定义
