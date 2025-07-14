<script lang="ts">
  import { goto } from '$app/navigation';
  import { APP_NAME } from '$lib/constants.js';
  import type { Site, Todo } from '$lib/types.js';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import EditSiteModal from '$lib/components/EditSiteModal.svelte';
  import PendingSubmissionItem from '$lib/components/admin/PendingSubmissionItem.svelte';
  import RecentSiteItem from '$lib/components/admin/RecentSiteItem.svelte';
  import AdminNavigation from '$lib/components/admin/AdminNavigation.svelte';

  // 导入 sites 模块
  import {
    loading,
    error,
    stats,
    sites,
    recentSites,
    pendingTodos,
    loadData,
    deleteSite as deleteSiteAction,
    editSite as editSiteAction,
    approveSite,
    rejectSite
  } from '$lib/client/sites';

  import { API } from '$lib/client/api';

  export let data: PageData;

  let processingSubmissions = new Set<string>();
  let successMessage = '';
  let errorMessage = '';

  // 编辑网站模态框状态
  let showEditModal = false;
  let editingSite: Site | null = null;

  // 统计卡片配置 - 使用 store 中的统计数据
  $: statsCards = [
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
      iconColor: 'text-green-600',
      iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
    },
    {
      title: '已归档网站',
      value: $stats.archivedSites,
      iconColor: 'text-red-600',
      iconPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
    }
  ];

  // 客户端渲染完成后设置加载状态
  onMount(() => {
    // 使用 sites 模块加载数据
    // console.log($sites);

    if (!$sites || 0 == $sites.length) loadData();
  });

  // 快速批准提交
  async function quickApprove(submission: Todo) {
    addSetItem(submission.url);

    try {
      // 创建网站数据
      const siteData = await API.analyzeSite(submission.url);

      const result = await approveSite(submission, siteData);

      if (result.success) {
        successMessage = result.message || '批准成功';
        setTimeout(() => successMessage = '', 3000);
      } else {
        errorMessage = result.message || '批准失败';
        setTimeout(() => errorMessage = '', 5000);
      }
    } catch (err) {
      console.error('Approve error:', err);
      errorMessage = '批准失败，请稍后重试';
      setTimeout(() => errorMessage = '', 5000);
    } finally {
      delSetItem(submission.url);
      
    }
  }

  // 快速拒绝提交
  async function quickReject(submission: Todo) {
    addSetItem(submission.url);

    try {
      const result = await rejectSite(submission, '不符合要求');

      if (result.success) {
        successMessage = result.message || '拒绝成功';
        setTimeout(() => successMessage = '', 3000);
      } else {
        errorMessage = result.message || '拒绝失败';
        setTimeout(() => errorMessage = '', 5000);
      }
    } catch (err) {
      console.error('Reject error:', err);
      errorMessage = '拒绝失败，请稍后重试';
      setTimeout(() => errorMessage = '', 5000);
    } finally {
      delSetItem(submission.url);
      
    }
  }

  async function quickAnalyze(submission: Todo) {
    addSetItem(submission.url);

    try {
      const result = await API.analyzeSite(submission.url);

      editSite(result);
    } catch (err) {
      const result = {
        url: submission.url,
        tags: [] as string[],
      } as Site;

      editSite(result);
    } finally {
      delSetItem(submission.url);      
    }
  }

  // 删除网站
  async function deleteSite(site: Site) {
    if (!confirm(`确定要删除网站 "${site.title}" 吗？`)) return;

    try {
      const result = await deleteSiteAction(site);

      if (result.success) {
        successMessage = result.message || '删除成功';
        setTimeout(() => successMessage = '', 3000);
      } else {
        errorMessage = result.message || '删除失败';
        setTimeout(() => errorMessage = '', 5000);
      }
    } catch (err) {
      console.error('Delete error:', err);
      errorMessage = '删除失败，请稍后重试';
      setTimeout(() => errorMessage = '', 5000);
    }
  }

  // 编辑网站
  function editSite(site: Site) {
    editingSite = site;
    showEditModal = true;
  }

  // 关闭编辑模态框
  function closeEditModal() {
    showEditModal = false;
    editingSite = null;
  }

  // 处理网站保存
  async function handleSiteSave(updatedSite: Site): Promise<boolean> {
    console.log('保存的网站信息:', updatedSite);
    
    // 保存操作
      try {
        const result = await editSiteAction(updatedSite);

        if (result.success) {
          successMessage = result.message || '网站信息已更新';
          console.log(successMessage);
          
          setTimeout(() => successMessage = '', 3000);
        } else {
          errorMessage = result.message || '更新失败';
          console.log(errorMessage);
          
          setTimeout(() => errorMessage = '', 5000);
        }
      } catch (error) {
        console.error('更新网站信息失败:', error);
        errorMessage = '更新失败，请稍后重试';
        setTimeout(() => errorMessage = '', 5000);
        return false;
      }
    return true; // 立即返回 true 让模态框关闭
  }

  function addSetItem(item:string) {
    processingSubmissions.add(item);
    processingSubmissions = new Set(processingSubmissions);
  }

  function delSetItem(item:string) {
    processingSubmissions.delete(item);
    processingSubmissions = new Set(processingSubmissions);
  }

</script>

<svelte:head>
  <title>管理员仪表板 - {APP_NAME}</title>
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
  />

  <div class="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
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

    <!-- 快速操作 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div class="lg:col-span-2">
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="px-4 py-4 sm:px-6 sm:py-5">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              快速操作
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <button
                on:click={() => goto('/submit')}
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <span class="truncate">提交新网站</span>
              </button>

              <a
                href="/admin/submissions"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <span class="truncate">审核提交 ({$stats.pendingSubmissions})</span>
              </a>

              <a
                href="/admin/sites"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                </svg>
                <span class="truncate">管理网站</span>
              </a>

              <a
                href="/api/sites"
                target="_blank"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                </svg>
                <span class="truncate">API 数据</span>
              </a>

              <a
                href="/sitemap.xml"
                target="_blank"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span class="truncate">站点地图</span>
              </a>

              <a
                href="/admin/analyze"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="truncate">数据统计</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- 分类统计 -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-4 sm:px-6 sm:py-5">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            分类统计
          </h3>
          <div class="space-y-3">
            {#each Object.entries($stats.categoryCounts) as [category, count], i}
              <!-- 只显示前3个分类 -->
               {#if i < 3}
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 dark:text-gray-400">{category}</span>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                </div>
               {/if}
            {/each}
            {#if Object.keys($stats.categoryCounts).length === 0}
              <p class="text-sm text-gray-500 dark:text-gray-400">暂无数据</p>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- 最近提交和网站列表 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <!-- 待审核提交 -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-4 sm:px-6 sm:py-5">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-base sm:text-lg leading-6 font-medium text-gray-900 dark:text-white">
              待审核提交
            </h3>
            <a
              href="/admin/submissions"
              class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex-shrink-0"
            >
              查看全部
            </a>
          </div>

          {#if $pendingTodos.length > 0}
            <div class="space-y-3">
              {#each $pendingTodos as submission}
                <PendingSubmissionItem
                  {submission}
                  isProcessing={processingSubmissions.has(submission.url)}
                  onApprove={quickApprove}
                  onReject={quickReject}
                  onAnalyze={quickAnalyze}
                />
              {/each}
            </div>
          {:else}
            <p class="text-sm text-gray-500 dark:text-gray-400">暂无待审核提交</p>
          {/if}
        </div>
      </div>

      <!-- 最近添加的网站 -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-4 sm:px-6 sm:py-5">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-base sm:text-lg leading-6 font-medium text-gray-900 dark:text-white">
              最近添加的网站
            </h3>
            <a
              href="/admin/sites"
              class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex-shrink-0"
            >
              查看全部
            </a>
          </div>

          {#if $recentSites.length > 0}
            <div class="space-y-3">
              {#each $recentSites as site}
                <RecentSiteItem
                  {site}
                  onEdit={editSite}
                  onDelete={deleteSite}
                />
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

<!-- 编辑网站模态框 -->
<EditSiteModal
  isOpen={showEditModal}
  site={editingSite}
  categories={[...$stats.categories]}
  onclose={closeEditModal}
  onsave={handleSiteSave}
/>
