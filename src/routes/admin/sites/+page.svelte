<script lang="ts">

  import { APP_NAME } from '$lib/constants.js';
  import type { Site } from '$lib/types.js';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import EditSiteModal from '$lib/components/EditSiteModal.svelte';
  import SiteListItem from '$lib/components/admin/SiteListItem.svelte';
  import AdminNavigation from '$lib/components/admin/AdminNavigation.svelte';
  import SiteStatsPanel from '$lib/components/admin/SiteStatsPanel.svelte';

  // 导入 sites 模块
  import {
    loading,
    error,
    stats,
    sites,
    loadData,
    deleteSite as deleteSiteAction,
    editSite as editSiteAction
  } from '$lib/client/sites';

  export let data: PageData;

  let successMessage = '';
  let errorMessage = '';

  // 编辑网站模态框状态
  let showEditModal = false;
  let editingSite: Site | null = null;

  // 搜索和过滤状态
  let searchQuery = '';
  let selectedCategory = '';
  let selectedLanguage = '';
  let showStarredOnly = false;
  let showAdultOnly = false;
  let sortBy = 'createdAt'; // createdAt, title, category
  let sortOrder = 'desc'; // asc, desc

  // 分页状态
  let currentPage = 1;
  let itemsPerPage = 20;

  // 统计卡片配置
  $: statsCards = [
    {
      title: '总网站数',
      value: $stats.totalSites,
      iconColor: 'text-blue-600',
      iconPath: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9'
    },
    {
      title: '置顶网站',
      value: $stats.starredSites,
      iconColor: 'text-yellow-600',
      iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
    },
    {
      title: 'PWA 支持',
      value: $stats.pwaSites,
      iconColor: 'text-indigo-600',
      iconPath: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'
    },
    {
      title: 'HTTPS 支持',
      value: $stats.httpsSites,
      iconColor: 'text-green-600',
      iconPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
    }
  ];

  // 过滤和排序网站
  $: filteredSites = $sites
    .filter(site => {
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = site.title.toLowerCase().includes(query);
        const matchesUrl = site.url.toLowerCase().includes(query);
        const matchesDescription = site.description?.toLowerCase().includes(query);
        const matchesTags = site.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesUrl && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      // 分类过滤
      if (selectedCategory && site.category !== selectedCategory) {
        return false;
      }

      // 语言过滤
      if (selectedLanguage && site.language !== selectedLanguage) {
        return false;
      }

      // 置顶过滤
      if (showStarredOnly && !site.starred) {
        return false;
      }

      // 成人内容过滤
      if (showAdultOnly && site.ageRating !== '18+') {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // 分页计算
  $: totalPages = Math.ceil(filteredSites.length / itemsPerPage);
  $: paginatedSites = filteredSites.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 获取所有分类和语言选项
  $: categories = $stats.categories || [];
  $: languages = [...new Set($sites.map(site => site.language).filter(Boolean))].sort();

  // 客户端渲染完成后设置加载状态
  onMount(() => {
    if (!$sites || $sites.length === 0) loadData();
  });

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

  // 切换置顶状态
  async function toggleStar(site: Site) {
    const updatedSite = { ...site, starred: !site.starred };

    try {
      const result = await editSiteAction(updatedSite);

      if (result.success) {
        successMessage = updatedSite.starred ? '已设为置顶' : '已取消置顶';
        setTimeout(() => successMessage = '', 3000);
      } else {
        errorMessage = result.message || '操作失败';
        setTimeout(() => errorMessage = '', 5000);
      }
    } catch (err) {
      console.error('Toggle star error:', err);
      errorMessage = '操作失败，请稍后重试';
      setTimeout(() => errorMessage = '', 5000);
    }
  }

  // 关闭编辑模态框
  function closeEditModal() {
    showEditModal = false;
    editingSite = null;
  }

  // 处理网站保存
  async function handleSiteSave(updatedSite: Site): Promise<boolean> {
    try {
      const result = await editSiteAction(updatedSite);

      if (result.success) {
        successMessage = result.message || '网站信息已更新';
        setTimeout(() => successMessage = '', 3000);
      } else {
        errorMessage = result.message || '更新失败';
        setTimeout(() => errorMessage = '', 5000);
      }
    } catch (error) {
      console.error('更新网站信息失败:', error);
      errorMessage = '更新失败，请稍后重试';
      setTimeout(() => errorMessage = '', 5000);
      return false;
    }
    return true;
  }

  // 重置过滤器
  function resetFilters() {
    searchQuery = '';
    selectedCategory = '';
    selectedLanguage = '';
    showStarredOnly = false;
    showAdultOnly = false;
    currentPage = 1;
  }

  // 当过滤条件改变时重置到第一页
  $: if (searchQuery || selectedCategory || selectedLanguage || showStarredOnly || showAdultOnly) {
    currentPage = 1;
  }
</script>

<svelte:head>
  <title>网站管理 - {APP_NAME}</title>
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

    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">网站管理</h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        管理所有已收录的网站，包括编辑、删除和置顶操作
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

    <!-- 详细统计面板 -->
    <div class="mb-8">
      <SiteStatsPanel stats={$stats} />
    </div>

    <!-- 搜索和过滤 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
      <div class="px-4 py-4 sm:px-6 sm:py-5">
        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
          搜索和过滤
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
          <!-- 搜索框 -->
          <div class="lg:col-span-2">
            <label for="search" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              搜索网站
            </label>
            <div class="relative">
              <input
                type="text"
                id="search"
                bind:value={searchQuery}
                placeholder="搜索标题、URL、描述或标签..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- 分类过滤 -->
          <div>
            <label for="category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              分类
            </label>
            <select
              id="category"
              bind:value={selectedCategory}
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">所有分类</option>
              {#each categories as category}
                <option value={category}>{category}</option>
              {/each}
            </select>
          </div>

          <!-- 语言过滤 -->
          <div>
            <label for="language" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              语言
            </label>
            <select
              id="language"
              bind:value={selectedLanguage}
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">所有语言</option>
              {#each languages as language}
                <option value={language}>{language}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4 mb-4">
          <!-- 置顶过滤 -->
          <label class="flex items-center">
            <input
              type="checkbox"
              bind:checked={showStarredOnly}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">仅显示置顶</span>
          </label>

          <!-- 成人内容过滤 -->
          <label class="flex items-center">
            <input
              type="checkbox"
              bind:checked={showAdultOnly}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">仅显示成人内容</span>
          </label>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-4">
          <!-- 排序选项 -->
          <div class="flex items-center space-x-4">
            <div>
              <label for="sortBy" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                排序方式
              </label>
              <select
                id="sortBy"
                bind:value={sortBy}
                class="block px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="createdAt">创建时间</option>
                <option value="title">标题</option>
                <option value="category">分类</option>
              </select>
            </div>
            <div>
              <label for="sortOrder" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                排序顺序
              </label>
              <select
                id="sortOrder"
                bind:value={sortOrder}
                class="block px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>

          <!-- 重置按钮 -->
          <button
            onclick={resetFilters}
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            重置过滤器
          </button>
        </div>

        <!-- 结果统计 -->
        <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
          显示 {filteredSites.length} 个网站中的 {Math.min((currentPage - 1) * itemsPerPage + 1, filteredSites.length)}-{Math.min(currentPage * itemsPerPage, filteredSites.length)} 个
        </div>
      </div>
    </div>

    <!-- 网站列表 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
      <div class="px-4 py-4 sm:px-6 sm:py-5">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            网站列表
          </h3>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              每页显示
            </span>
            <select
              bind:value={itemsPerPage}
              class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span class="text-sm text-gray-500 dark:text-gray-400">条</span>
          </div>
        </div>

        {#if paginatedSites.length > 0}
          <div class="space-y-4">
            {#each paginatedSites as site}
              <SiteListItem
                {site}
                onEdit={editSite}
                onDelete={deleteSite}
                onToggleStar={toggleStar}
              />
            {/each}
          </div>
        {:else}
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">没有找到网站</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {#if searchQuery || selectedCategory || selectedLanguage || showStarredOnly || showAdultOnly}
                尝试调整搜索条件或过滤器
              {:else}
                暂无网站数据
              {/if}
            </p>
            {#if searchQuery || selectedCategory || selectedLanguage || showStarredOnly || showAdultOnly}
              <div class="mt-6">
                <button
                  onclick={resetFilters}
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  清除所有过滤器
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- 分页 -->
    {#if totalPages > 1}
      <div class="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-lg shadow">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            onclick={() => currentPage = Math.max(1, currentPage - 1)}
            disabled={currentPage === 1}
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <button
            onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
            disabled={currentPage === totalPages}
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              显示第 <span class="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> 到
              <span class="font-medium">{Math.min(currentPage * itemsPerPage, filteredSites.length)}</span> 条，
              共 <span class="font-medium">{filteredSites.length}</span> 条结果
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onclick={() => currentPage = Math.max(1, currentPage - 1)}
                disabled={currentPage === 1}
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">上一页</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>

              {#each Array.from({length: Math.min(7, totalPages)}, (_, i) => {
                const start = Math.max(1, Math.min(currentPage - 3, totalPages - 6));
                return start + i;
              }) as page}
                <button
                  onclick={() => currentPage = page}
                  class="relative inline-flex items-center px-4 py-2 border text-sm font-medium {currentPage === page
                    ? 'z-10 bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'}"
                >
                  {page}
                </button>
              {/each}

              <button
                onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
                disabled={currentPage === totalPages}
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">下一页</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    {/if}
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
