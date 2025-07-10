# Svelte Store 使用示例

## 概述

`src/lib/client/sites.ts` 已从 Svelte 5 runes 重构为使用 Svelte store 进行状态管理。这个文档展示了如何在 Svelte 组件中正确使用这些 store。

## 主要变化

### 之前 (Runes)
```typescript
// ❌ 在 .ts 文件中使用 runes (不正确)
export let sites = $state<Site[]>([]);
export let todos = $state<Todo[]>([]);
export const stats = $derived.by(() => { /* ... */ });
```

### 现在 (Store)
```typescript
// ✅ 在 .ts 文件中使用 store (正确)
export const sites = writable<Site[]>([]);
export const todos = writable<Todo[]>([]);
export const stats = derived([sites, todos], ([$sites, $todos]) => { /* ... */ });
```

## 在 Svelte 组件中使用

### 1. 基本使用方式

```svelte
<script lang="ts">
  import { 
    sites, 
    todos, 
    loading, 
    error, 
    stats, 
    recentSites, 
    pendingTodos,
    loadData, 
    submitSite, 
    deleteSite 
  } from '$lib/client/sites';

  // 在组件中使用 store，Svelte 会自动订阅
  // 使用 $ 前缀来访问 store 的值
</script>

<!-- 在模板中直接使用 store 值 -->
{#if $loading}
  <p>加载中...</p>
{:else if $error}
  <p class="text-red-500">错误: {$error}</p>
{:else}
  <div>
    <h2>统计信息</h2>
    <p>总网站数: {$stats.totalSites}</p>
    <p>待审核: {$stats.pendingSubmissions}</p>
    <p>已批准: {$stats.approvedSubmissions}</p>
    <p>已拒绝: {$stats.rejectedSubmissions}</p>
    
    <h3>最近网站</h3>
    {#each $recentSites as site}
      <div>{site.title}</div>
    {/each}
    
    <h3>待审核提交</h3>
    {#each $pendingTodos as todo}
      <div>{todo.url} - {todo.status}</div>
    {/each}
  </div>
{/if}

<button onclick={() => loadData()}>刷新数据</button>
```

### 2. 管理员仪表板示例

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    sites, 
    todos, 
    loading, 
    error, 
    stats,
    loadData, 
    deleteSite, 
    editSite, 
    approveSite, 
    rejectSite 
  } from '$lib/client/sites';
  import type { Site, Todo } from '$lib/types';

  // 组件状态
  let successMessage = $state('');
  let errorMessage = $state('');

  onMount(() => {
    // 组件挂载时加载数据
    loadData();
  });

  async function handleDeleteSite(site: Site) {
    if (!confirm(`确定要删除网站 "${site.title}" 吗？`)) return;
    
    const result = await deleteSite(site);
    if (result.success) {
      successMessage = result.message || '删除成功';
      setTimeout(() => successMessage = '', 3000);
    } else {
      errorMessage = result.message || '删除失败';
      setTimeout(() => errorMessage = '', 5000);
    }
  }

  async function handleApproveSite(todo: Todo, siteData: Site) {
    const result = await approveSite(todo, siteData);
    if (result.success) {
      successMessage = result.message || '批准成功';
      setTimeout(() => successMessage = '', 3000);
    } else {
      errorMessage = result.message || '批准失败';
      setTimeout(() => errorMessage = '', 5000);
    }
  }

  async function handleRejectSite(todo: Todo, reason?: string) {
    const result = await rejectSite(todo, reason);
    if (result.success) {
      successMessage = result.message || '拒绝成功';
      setTimeout(() => successMessage = '', 3000);
    } else {
      errorMessage = result.message || '拒绝失败';
      setTimeout(() => errorMessage = '', 5000);
    }
  }
</script>

<div class="admin-dashboard">
  <h1>管理员仪表板</h1>
  
  <!-- 消息提示 -->
  {#if successMessage}
    <div class="alert alert-success">{successMessage}</div>
  {/if}
  {#if errorMessage}
    <div class="alert alert-error">{errorMessage}</div>
  {/if}
  
  <!-- 加载状态 -->
  {#if $loading}
    <div class="loading">加载中...</div>
  {:else if $error}
    <div class="error">错误: {$error}</div>
  {:else}
    <!-- 统计信息 -->
    <div class="stats-grid">
      <div class="stat-card">
        <h3>总网站数</h3>
        <p class="stat-number">{$stats.totalSites}</p>
      </div>
      <div class="stat-card">
        <h3>待审核</h3>
        <p class="stat-number">{$stats.pendingSubmissions}</p>
      </div>
      <div class="stat-card">
        <h3>已批准</h3>
        <p class="stat-number">{$stats.approvedSubmissions}</p>
      </div>
      <div class="stat-card">
        <h3>已拒绝</h3>
        <p class="stat-number">{$stats.rejectedSubmissions}</p>
      </div>
    </div>
    
    <!-- 待审核提交 -->
    <section class="pending-submissions">
      <h2>待审核提交</h2>
      {#if $todos.filter(t => t.status === 'pending').length > 0}
        <div class="submissions-list">
          {#each $todos.filter(t => t.status === 'pending') as todo}
            <div class="submission-item">
              <div class="submission-info">
                <h4>{todo.url}</h4>
                <p>提交时间: {new Date(todo.submittedAt).toLocaleString()}</p>
              </div>
              <div class="submission-actions">
                <button 
                  class="btn btn-success"
                  onclick={() => handleApproveSite(todo, {
                    title: todo.url,
                    url: todo.url,
                    favicon: '',
                    description: '',
                    category: '其他',
                    tags: [],
                    ageRating: 'SFW',
                    language: 'zh-CN',
                    starred: false,
                    supportsPWA: false,
                    supportsHTTPS: true,
                    recommendation: '',
                    createdAt: new Date().toISOString(),
                    ogImage: ''
                  })}
                >
                  批准
                </button>
                <button 
                  class="btn btn-danger"
                  onclick={() => handleRejectSite(todo, '不符合要求')}
                >
                  拒绝
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p>暂无待审核提交</p>
      {/if}
    </section>
    
    <!-- 最近网站 -->
    <section class="recent-sites">
      <h2>最近网站</h2>
      {#if $sites.length > 0}
        <div class="sites-list">
          {#each $sites.slice(0, 10) as site}
            <div class="site-item">
              <div class="site-info">
                <h4>{site.title}</h4>
                <p>{site.url}</p>
                <p>分类: {site.category}</p>
              </div>
              <div class="site-actions">
                <button 
                  class="btn btn-danger"
                  onclick={() => handleDeleteSite(site)}
                >
                  删除
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p>暂无网站数据</p>
      {/if}
    </section>
  {/if}
</div>

<style>
  .admin-dashboard {
    padding: 20px;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .stat-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .stat-number {
    font-size: 2em;
    font-weight: bold;
    color: #3b82f6;
  }
  
  .alert {
    padding: 10px;
    margin-bottom: 20px;
    border-radius: 4px;
  }
  
  .alert-success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  .alert-error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 8px;
  }
  
  .btn-success {
    background-color: #28a745;
    color: white;
  }
  
  .btn-danger {
    background-color: #dc3545;
    color: white;
  }
  
  .submission-item, .site-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 10px;
  }
</style>
```

## 重要注意事项

### 1. Store 订阅
- 在 Svelte 组件中，使用 `$` 前缀访问 store 值会自动订阅
- Svelte 会在组件销毁时自动取消订阅，无需手动管理

### 2. 响应式更新
- 当 store 值发生变化时，所有使用该 store 的组件会自动更新
- 派生 store (`derived`) 会在依赖的 store 变化时自动重新计算

### 3. 函数调用
- 所有异步函数 (`loadData`, `submitSite`, `deleteSite` 等) 的使用方式保持不变
- 这些函数会自动更新相关的 store，触发 UI 更新

### 4. 类型安全
- 所有 store 都有完整的 TypeScript 类型支持
- 编译时会进行类型检查，确保类型安全

## 迁移指南

如果你有现有的组件使用了旧的 runes 语法，需要进行以下更改：

1. **移除 runes 语法**: 不要在组件中使用 `$state` 或 `$derived` 来处理 sites 数据
2. **使用 store 语法**: 使用 `$sites`, `$todos` 等来访问 store 值
3. **保持函数调用不变**: `loadData()`, `submitSite()` 等函数调用方式不变

这样的重构确保了代码的正确性和可维护性，同时保持了 Svelte 的响应式特性。
