<script lang="ts">
  import { APP_NAME } from '$lib/constants.js';
  import AdminNavigation from '$lib/components/admin/AdminNavigation.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let isRefreshing = false;
  let isLoggingOut = false;

  async function refreshData() {
    isRefreshing = true;
    try {
      // 模拟刷新数据
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('网站数据已刷新');
    } catch (error) {
      console.error('刷新失败:', error);
    } finally {
      isRefreshing = false;
    }
  }

  async function handleLogout() {
    isLoggingOut = true;
    // 这里会使用 AdminNavigation 组件的默认登出逻辑
  }
</script>

<svelte:head>
  <title>网站管理 - {APP_NAME}</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- 顶部导航 - 带返回按钮 -->
  <AdminNavigation
    username={data.session.username}
    {isRefreshing}
    {isLoggingOut}
    showBackButton={true}
    backUrl="/admin/dashboard"
    backText="返回仪表板"
    onRefresh={refreshData}
    onLogout={handleLogout}
  />

  <div class="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">网站管理</h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        管理所有已提交的网站，包括编辑、删除和状态更新
      </p>
    </div>

    <!-- 示例内容 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
          网站列表
        </h3>
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">暂无网站数据</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            网站管理功能正在开发中...
          </p>
          <div class="mt-6">
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              添加网站
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 返回按钮示例 -->
    <div class="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
      <div class="flex">
        <svg class="w-5 h-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
        </svg>
        <div>
          <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200">导航功能说明</h4>
          <p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
            这个页面使用了带返回功能的 AdminNavigation 组件。点击左上角的返回按钮可以返回到仪表板页面。
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
