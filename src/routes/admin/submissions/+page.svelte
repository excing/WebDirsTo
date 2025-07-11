<script lang="ts">
  import { APP_NAME } from '$lib/constants.js';
  import { goto } from '$app/navigation';
  import AdminNavigation from '$lib/components/admin/AdminNavigation.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let isRefreshing = false;

  async function refreshData() {
    isRefreshing = true;
    try {
      // 模拟刷新数据
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('提交数据已刷新');
    } catch (error) {
      console.error('刷新失败:', error);
    } finally {
      isRefreshing = false;
    }
  }

  // 自定义返回逻辑
  function handleCustomBack() {
    console.log('执行自定义返回逻辑');
    goto('/admin/dashboard');
  }
</script>

<svelte:head>
  <title>提交审核 - {APP_NAME}</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- 顶部导航 - 带自定义返回逻辑 -->
  <AdminNavigation
    username={data.session.username}
    {isRefreshing}
    showBackButton={true}
    backText="返回主页"
    onRefresh={refreshData}
    onBack={handleCustomBack}
  />

  <div class="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">提交审核</h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        审核用户提交的网站，决定是否批准或拒绝
      </p>
    </div>

    <!-- 示例内容 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
          待审核提交
        </h3>
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">暂无待审核提交</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            所有提交都已处理完毕
          </p>
        </div>
      </div>
    </div>

    <!-- 功能说明 -->
    <div class="mt-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
      <div class="flex">
        <svg class="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
        </svg>
        <div>
          <h4 class="text-sm font-medium text-green-800 dark:text-green-200">自定义返回功能</h4>
          <p class="mt-1 text-sm text-green-700 dark:text-green-300">
            这个页面使用了自定义的返回逻辑（onBack 回调），点击返回按钮会执行自定义函数而不是默认的浏览器返回行为。
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
