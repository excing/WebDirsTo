<script lang="ts">
  import { APP_NAME } from '$lib/constants.js';
  import type { Site } from '$lib/types.js';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import AdminNavigation from '$lib/components/admin/AdminNavigation.svelte';
  import SiteForm from '$lib/components/admin/SiteForm.svelte';

  // 导入 sites 模块
  import {
    loading,
    error,
    stats,
    sites,
    loadData,
    editSite,
  } from '$lib/client/sites';

  let { data }: { data: PageData } = $props();

  let successMessage = $state('');
  let errorMessage = $state('');

  // 统计卡片配置
  let statsCards = $derived([
    {
      title: '总网站数',
      value: $stats.totalSites,
      iconColor: 'text-blue-600',
      iconPath: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9'
    },
    {
      title: '待审核提交',
      value: $stats.pendingSubmissions,
      iconColor: 'text-yellow-600',
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      title: '置顶网站',
      value: $stats.starredSites,
      iconColor: 'text-yellow-600',
      iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
    },
    {
      title: '最近添加',
      value: getRecentSitesCount(),
      iconColor: 'text-green-600',
      iconPath: 'M12 6v6m0 0v6m0-6h6m-6 0H6'
    }
  ]);

  // 获取最近24小时添加的网站数量
  function getRecentSitesCount(): number {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return $sites.filter(site => new Date(site.createdAt) >= yesterday).length;
  }

  // 客户端渲染完成后设置加载状态
  onMount(() => {
    if (!$sites || $sites.length === 0) loadData();
  });

  // 处理网站保存
  async function handleSiteSave(siteData: Site): Promise<boolean> {
    try {
      const result = await editSite(siteData);

      if (result.success) {
        successMessage = result.message || '网站添加成功！';
        setTimeout(() => successMessage = '', 5000);
        return true;
      } else {
        errorMessage = result.message || '添加失败，请重试';
        setTimeout(() => errorMessage = '', 5000);
        return false;
      }
    } catch (error) {
      console.error('添加网站失败:', error);
      errorMessage = '添加失败，请稍后重试';
      setTimeout(() => errorMessage = '', 5000);
      return false;
    }
  }
</script>

<svelte:head>
  <title>添加网站 - {APP_NAME}</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- 加载状态 -->
  {#if $loading}
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
  <AdminNavigation
    username={data.session.username}
    showBackButton={true}
    backUrl="/admin/dashboard"
    backText="返回仪表板"
  />

  <div class="max-w-4xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
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
    {#if $error}
      <div class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <p class="text-sm text-red-800 dark:text-red-200">{$error}</p>
        </div>
      </div>
    {/if}

    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">添加网站</h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        手动添加新网站到目录中，支持自动分析网站信息
      </p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      {#each statsCards as card}
        <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div class="p-3 sm:p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 {card.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={card.iconPath}></path>
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {card.title}
                  </dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">
                    {card.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- 网站表单 -->
    <SiteForm
      categories={[...$stats.categories]}
      onSave={handleSiteSave}
      isEditing={false}
    />

    <!-- 快速操作提示 -->
    <div class="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div class="flex">
        <svg class="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div class="text-sm text-blue-800 dark:text-blue-200">
          <h4 class="font-medium mb-1">使用提示</h4>
          <ul class="list-disc list-inside space-y-1 text-xs">
            <li>输入网站URL后点击"分析"按钮可以自动获取网站信息</li>
            <li>标签用逗号分隔，如：工具, 设计, 开发</li>
            <li>推荐级别会影响网站在目录中的排序和展示</li>
            <li>置顶的网站会优先显示在分类页面顶部</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 快速链接 -->
    <div class="mt-6 flex flex-wrap gap-3">
      <a
        href="/admin/sites"
        class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
        </svg>
        管理网站
      </a>
      <a
        href="/admin/submissions"
        class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        审核提交
      </a>
      <a
        href="/admin/analyze"
        class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
        系统分析
      </a>
    </div>
  </div>
  {/if}
</div>
