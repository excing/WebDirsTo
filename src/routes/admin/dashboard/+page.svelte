<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { APP_NAME } from '$lib/constants.js';
  import type { Todo, Site } from '$lib/types.js';

  export let data: PageData;

  let processingSubmissions = new Set<string>();
  
  let isLoggingOut = false;
  
  async function handleLogout() {
    isLoggingOut = true;
    
    try {
      await fetch('/api/admin/auth', {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      goto('/admin');
    }
  }
  
  function formatDate(dateString: string | undefined): string {
    if (!dateString) return '未知';
    return new Date(dateString).toLocaleString('zh-CN');
  }

  async function quickApprove(submission: Todo) {

  }

  async function quickReject(submission: Todo) {

  }
</script>

<svelte:head>
  <title>管理员仪表板 - {APP_NAME}</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- 顶部导航 -->
  <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
            {APP_NAME} 管理后台
          </h1>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            欢迎，{data.session.username}
          </span>
          <a 
            href="/" 
            target="_blank"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
          >
            查看网站
          </a>
          <button
            on:click={handleLogout}
            disabled={isLoggingOut}
            class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm disabled:opacity-50"
          >
            {isLoggingOut ? '登出中...' : '登出'}
          </button>
        </div>
      </div>
    </div>
  </nav>

  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <!-- 错误提示 -->
    {#if data.error}
      <div class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <p class="text-sm text-red-800 dark:text-red-200">{data.error}</p>
        </div>
      </div>
    {/if}

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  总网站数
                </dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">
                  {data.stats.totalSites}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  待审核提交
                </dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">
                  {data.stats.pendingSubmissions}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  置顶网站
                </dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">
                  {data.stats.starredSites}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  已归档网站
                </dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">
                  {data.stats.archivedSites}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div class="lg:col-span-2">
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              快速操作
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="/admin/sites/add"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                添加新网站
              </a>
              
              <a
                href="/admin/submissions"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                审核提交 ({data.stats.pendingSubmissions})
              </a>
              
              <a
                href="/admin/sites"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                </svg>
                管理网站
              </a>
              
              <a
                href="/admin/analytics"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                数据分析
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- 分类统计 -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            分类统计
          </h3>
          <div class="space-y-3">
            {#each Object.entries(data.stats.categoryCounts) as [category, count]}
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 dark:text-gray-400">{category}</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
              </div>
            {/each}
            {#if Object.keys(data.stats.categoryCounts).length === 0}
              <p class="text-sm text-gray-500 dark:text-gray-400">暂无数据</p>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- 最近提交和网站列表 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 待审核提交 -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              待审核提交
            </h3>
            <a
              href="/admin/submissions"
              class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              查看全部
            </a>
          </div>

          {#if data.Todos.length > 0}
            <div class="space-y-3">
              {#each data.Todos.slice(0, 10) as submission}
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {submission.url}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        提交时间: {formatDate(submission.submittedAt)}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        来源: {submission.os} / {submission.browser}
                      </p>
                    </div>
                    <div class="flex space-x-2 ml-2">
                      <button
                        on:click={() => quickApprove(submission)}
                        disabled={processingSubmissions.has(submission.url)}
                        class="text-green-600 hover:text-green-800 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingSubmissions.has(submission.url) ? '处理中...' : '批准'}
                      </button>
                      <button
                        on:click={() => quickReject(submission)}
                        disabled={processingSubmissions.has(submission.url)}
                        class="text-red-600 hover:text-red-800 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingSubmissions.has(submission.url) ? '处理中...' : '拒绝'}
                      </button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-sm text-gray-500 dark:text-gray-400">暂无待审核提交</p>
          {/if}
        </div>
      </div>

      <!-- 最近添加的网站 -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              最近添加的网站
            </h3>
            <a
              href="/admin/sites"
              class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              查看全部
            </a>
          </div>

          {#if data.sites.length > 0}
            <div class="space-y-3">
              {#each data.sites as site}
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {site.title}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {site.url}
                      </p>
                      <div class="flex items-center space-x-2 mt-1">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {site.category}
                        </span>
                        {#if site.starred}
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                            置顶
                          </span>
                        {/if}
                        {#if site.ageRating === '18+'}
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                            18+
                          </span>
                        {/if}
                      </div>
                    </div>
                    <div class="flex space-x-2 ml-2">
                      <button
                        on:click={() => goto(`/admin/sites?edit=${encodeURIComponent(site.url)}`)}
                        class="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        编辑
                      </button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-sm text-gray-500 dark:text-gray-400">暂无网站数据</p>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
