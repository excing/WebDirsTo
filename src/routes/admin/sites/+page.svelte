<script lang="ts">
  import { APP_NAME } from '$lib/constants.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { Site } from '$lib/types.js';
  import AdminNavigation from '$lib/components/admin/AdminNavigation.svelte';
  import EditSiteModal from '$lib/components/EditSiteModal.svelte';
  import type { PageData } from './$types';

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
    import RecentSiteItem from '$lib/components/admin/RecentSiteItem.svelte';

  export let data: PageData;

  // 状态管理
  let searchQuery = '';
  let selectedCategory = '';
  let sortBy = 'name'; // name, category, createdAt
  let sortOrder = 'asc'; // asc, desc
  let currentPage = 1;
  let itemsPerPage = 10;
  let showEditModal = false;
  let editingSite: Site | null = null;
  let successMessage = '';
  let errorMessage = '';

  // 获取所有分类
  $: categories = [...new Set($sites.map(site => site.category))].sort();

  // 过滤和排序网站
  $: filteredSites = $sites
    .filter(site => {
      const matchesSearch = !searchQuery ||
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !selectedCategory || site.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

  // 分页
  $: totalPages = Math.ceil(filteredSites.length / itemsPerPage);
  $: paginatedSites = filteredSites.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 统计信息
  $: siteStats = {
    total: $sites.length,
    filtered: filteredSites.length,
    categories: categories.length,
    averagePerCategory: categories.length > 0 ? Math.round($sites.length / categories.length) : 0
  };

  // 初始化数据
  onMount(() => {
    if ($sites.length === 0) {
      loadData();
    }
  });

  // 编辑网站
  function handleEditSite(site: Site) {
    editingSite = site;
    showEditModal = true;
  }

  // 删除网站
  async function handleDeleteSite(site: Site) {
    if (!confirm(`确定要删除网站 "${site.name}" 吗？此操作不可撤销。`)) {
      return;
    }

    try {
      const result = await deleteSiteAction(site);
      if (result.success) {
        successMessage = `网站 "${site.name}" 已删除`;
        setTimeout(() => successMessage = '', 3000);
      } else {
        errorMessage = result.message || '删除失败';
        setTimeout(() => errorMessage = '', 5000);
      }
    } catch (error) {
      console.error('Delete error:', error);
      errorMessage = '删除失败，请稍后重试';
      setTimeout(() => errorMessage = '', 5000);
    }
  }

  // 保存编辑
  async function handleSaveEdit(site: Site) {
    const updatedSite = site;

    try {
      const result = await editSiteAction(editingSite!, updatedSite);
      if (result.success) {
        successMessage = `网站 "${updatedSite.name}" 已更新`;
        setTimeout(() => successMessage = '', 3000);
        showEditModal = false;
        editingSite = null;
      } else {
        errorMessage = result.message || '更新失败';
        setTimeout(() => errorMessage = '', 5000);
      }
    } catch (error) {
      console.error('Edit error:', error);
      errorMessage = '更新失败，请稍后重试';
      setTimeout(() => errorMessage = '', 5000);
    }
  }

  // 排序切换
  function toggleSort(field: string) {
    if (sortBy === field) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = field;
      sortOrder = 'asc';
    }
    currentPage = 1; // 重置到第一页
  }

  // 重置筛选
  function resetFilters() {
    searchQuery = '';
    selectedCategory = '';
    sortBy = 'name';
    sortOrder = 'asc';
    currentPage = 1;
  }
</script>

<svelte:head>
  <title>网站管理 - {APP_NAME}</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- 顶部导航 -->
  <AdminNavigation
    username={data.session.username}
    showBackButton={true}
    backUrl="/admin/dashboard"
    backText="返回仪表板"
  />

  <div class="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
    <!-- 页面标题 -->
    <div class="mb-6 sm:mb-8">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">网站管理</h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        管理所有已提交的网站，包括编辑、删除和状态更新
      </p>
    </div>

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
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 sm:mb-8">
      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div class="p-3 sm:p-5">
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
                  {siteStats.total}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div class="p-3 sm:p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  筛选结果
                </dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">
                  {siteStats.filtered}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div class="p-3 sm:p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  分类数量
                </dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">
                  {siteStats.categories}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div class="p-3 sm:p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  平均每类
                </dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">
                  {siteStats.averagePerCategory}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    {#if $loading}
      <!-- 加载状态 -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-12 sm:px-6 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">加载中...</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">正在获取网站数据</p>
        </div>
      </div>
    {:else if $sites.length === 0}
      <!-- 空状态 -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-12 sm:px-6 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">暂无网站数据</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            还没有任何网站被提交，或者数据正在加载中
          </p>
          <div class="mt-6">
            <button
              type="button"
              on:click={() => goto('/submit')}
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              提交新网站
            </button>
          </div>
        </div>
      </div>
    {:else}
      <!-- 筛选和搜索 -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div class="px-4 py-4 sm:px-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <!-- 搜索框 -->
            <div class="flex-1 min-w-0">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  bind:value={searchQuery}
                  placeholder="搜索网站名称、URL 或描述..."
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <!-- 分类筛选 -->
            <div class="flex-shrink-0">
              <select
                bind:value={selectedCategory}
                class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">所有分类</option>
                {#each categories as category}
                  <option value={category}>{category}</option>
                {/each}
              </select>
            </div>

            <!-- 重置按钮 -->
            <div class="flex-shrink-0">
              <button
                type="button"
                on:click={resetFilters}
                class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg class="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                重置
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 网站列表 -->
      {#if filteredSites.length === 0}
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="px-4 py-12 sm:px-6 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">没有找到匹配的网站</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              尝试调整搜索条件或筛选器
            </p>
            <div class="mt-6">
              <button
                type="button"
                on:click={resetFilters}
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                重置筛选
              </button>
            </div>
          </div>
        </div>
      {:else}
        <!-- 网站表格 -->
        <div class="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <!-- 表格头部 -->
          <div class="px-4 py-3 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                网站列表 ({filteredSites.length})
              </h3>
              <div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>第 {currentPage} 页，共 {totalPages} 页</span>
              </div>
            </div>
          </div>

          <!-- 移动端卡片视图 -->
          <div class="block">
            {#each paginatedSites as site, index}
              <RecentSiteItem
                {site}
                onEdit={handleEditSite}
                onDelete={handleDeleteSite}>
              </RecentSiteItem>
            {/each}
          </div>
        </div>
      {/if}
    {/if}

    <!-- 编辑模态框 -->
    {#if showEditModal && editingSite}
      <EditSiteModal
        site={editingSite}
        onsave={handleSaveEdit}
        oncancel={() => {
          showEditModal = false;
          editingSite = null;
        }}
      />
    {/if}
  </div>
</div>
