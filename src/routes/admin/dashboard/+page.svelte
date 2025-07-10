<script lang="ts">
  import { goto } from '$app/navigation';
  import { APP_NAME } from '$lib/constants.js';
  import { request } from '$lib/fetch';
  import type { Site, Todo } from '$lib/types.js';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  export let session: PageData;

  let data = {
      sites: [] as Site[],
      Todos: [] as Todo[],
      stats: {
        totalSites: 0,
        pendingSubmissions: 0,
        starredSites: 0,
        archivedSites: 0,
        categoryCounts: {}
      },
      error: null
    }

  let processingSubmissions = new Set<string>();
  let isLoggingOut = false;
  let successMessage = '';
  let errorMessage = '';
  let isRefreshing = false;
  let isLoading = true;

  // 客户端渲染完成后设置加载状态
  onMount(() => {
    refreshData();
  });

  async function handleLogout() {
    isLoggingOut = true;

    try {
      await request('/api/admin/auth', {
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

  async function deleteSite(site: Site) {

  }

  async function refreshData() {
    isRefreshing = true;
    try {
      // 重新获取数据
      const [sitesResponse] = await Promise.all([
        request('/api/admin/sites')
      ]);

      if (sitesResponse.ok) {
        const sitesResult = await sitesResponse.json();
        if (sitesResult.success) {
          // 动态导入解析函数
          const { parseSites, parseTodo } = await import('$lib/conv');

          const sites = parseSites(sitesResult.data.sites.content || '');
          const todos = parseTodo(sitesResult.data.pendingList.content || '');
          const archivedSites = parseSites(sitesResult.data.archivedList.content || '');

          // 更新数据
          data.sites = sites
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);

          data.Todos = todos.filter(todo => todo.status === 'pending').slice(0, 10);

          // 重新计算统计信息
          data.stats = calculateClientStats(sites, todos, archivedSites);

          if (!isLoading) {
            successMessage = '数据已刷新';
            setTimeout(() => successMessage = '', 3000);
          }
        }
      } else {
        throw new Error('获取数据失败');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      errorMessage = '刷新失败，请稍后重试';
      setTimeout(() => errorMessage = '', 5000);
    } finally {
      isRefreshing = false;
      isLoading = false;
    }
  }

  function calculateClientStats(sites: any[], todos: any[], archivedSites: any[]) {
    const categoryCounts: Record<string, number> = {};
    sites.forEach(site => {
      const category = site.category || '未分类';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const sortedCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as Record<string, number>);

    return {
      totalSites: sites.length,
      pendingSubmissions: todos.filter(todo => todo.status === 'pending').length,
      starredSites: sites.filter(site => site.starred).length,
      archivedSites: archivedSites.length,
      categoryCounts: sortedCategories
    };
  }
</script>

<svelte:head>
  <title>管理员仪表板 - {APP_NAME}</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- 加载状态 -->
  {#if isLoading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <svg class="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">加载中...</p>
      </div>
    </div>
  {:else}
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
            欢迎，{session?.username}
          </span>
          <button
            on:click={refreshData}
            disabled={isRefreshing}
            class="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 text-sm disabled:opacity-50 flex items-center"
          >
            <svg class="w-4 h-4 mr-1 {isRefreshing ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
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
    <!-- 成功消息 -->
    {#if successMessage}
      <div class="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
        <div class="flex">
          <svg class="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <p class="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      </div>
    {/if}

    <!-- 错误消息 -->
    {#if errorMessage}
      <div class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <p class="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
        </div>
      </div>
    {/if}

    <!-- 服务器错误提示 -->
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
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                on:click={() => goto('/submit')}
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                提交新网站
              </button>

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
                href="/api/sites"
                target="_blank"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                </svg>
                API 数据
              </a>

              <a
                href="/sitemap.xml"
                target="_blank"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                站点地图
              </a>

              <a
                href="/admin/analyze"
                target="_blank"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                数据统计
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
                  <div class="space-y-2">
                    <div class="flex justify-between items-start">
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                          <a href={submission.url} target="_blank" class="hover:text-blue-600 dark:hover:text-blue-400">
                            {submission.url}
                          </a>
                        </p>
                        <div class="flex items-center space-x-4 mt-1">
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(submission.submittedAt)}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {submission.os} / {submission.browser}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            IP: {submission.ip}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            语言: {submission.language}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div class="flex space-x-2">
                      <button
                        on:click={() => quickApprove(submission)}
                        disabled={processingSubmissions.has(submission.url)}
                        class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        {processingSubmissions.has(submission.url) ? '处理中...' : '批准'}
                      </button>
                      <button
                        on:click={() => quickReject(submission)}
                        disabled={processingSubmissions.has(submission.url)}
                        class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        {processingSubmissions.has(submission.url) ? '处理中...' : '拒绝'}
                      </button>
                      <a
                        href={submission.url}
                        target="_blank"
                        class="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                        访问
                      </a>
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
                      <button
                        on:click={() => deleteSite(site)}
                        class="text-red-600 hover:text-red-800 text-xs"
                      >
                        删除
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
  {/if}
</div>
