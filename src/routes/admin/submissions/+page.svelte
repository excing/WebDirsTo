<script lang="ts">
  import { APP_NAME } from '$lib/constants.js';
  import type { Site, Todo } from '$lib/types.js';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import EditSiteModal from '$lib/components/EditSiteModal.svelte';
  import SubmissionListItem from '$lib/components/admin/SubmissionListItem.svelte';
  import AdminNavigation from '$lib/components/admin/AdminNavigation.svelte';
  import SubmissionStatsPanel from '$lib/components/admin/SubmissionStatsPanel.svelte';
  import BatchOperations from '$lib/components/admin/BatchOperations.svelte';

  // 导入 sites 模块
  import {
    loading,
    error,
    stats,
    todos,
    loadData,
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

  // 搜索和过滤状态
  let searchQuery = '';
  let selectedStatus = '';
  let selectedOS = '';
  let selectedBrowser = '';
  let selectedLanguage = '';
  let sortBy = 'submittedAt'; // submittedAt, url, status
  let sortOrder = 'desc'; // asc, desc

  // 分页状态
  let currentPage = 1;
  let itemsPerPage = 20;

  // 选择状态
  let selectedSubmissions = new Set<string>();
  let showBatchOperations = false;

  // 统计卡片配置
  $: statsCards = [
    {
      title: '总提交数',
      value: $todos.length,
      iconColor: 'text-blue-600',
      iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    },
    {
      title: '待审核',
      value: $stats.pendingSubmissions,
      iconColor: 'text-yellow-600',
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      title: '已批准',
      value: $stats.approvedSubmissions,
      iconColor: 'text-green-600',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      title: '已拒绝',
      value: $stats.rejectedSubmissions,
      iconColor: 'text-red-600',
      iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  ];

  // 过滤和排序提交
  $: filteredTodos = $todos
    .filter(todo => {
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!todo.url.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 状态过滤
      if (selectedStatus && todo.status !== selectedStatus) {
        return false;
      }

      // 操作系统过滤
      if (selectedOS && todo.os !== selectedOS) {
        return false;
      }

      // 浏览器过滤
      if (selectedBrowser && todo.browser !== selectedBrowser) {
        return false;
      }

      // 语言过滤
      if (selectedLanguage && todo.language !== selectedLanguage) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'url':
          aValue = a.url.toLowerCase();
          bValue = b.url.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'submittedAt':
        default:
          aValue = new Date(a.submittedAt).getTime();
          bValue = new Date(b.submittedAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // 分页计算
  $: totalPages = Math.ceil(filteredTodos.length / itemsPerPage);
  $: paginatedTodos = filteredTodos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 获取所有选项
  $: statusOptions = ['pending', 'approved', 'rejected'];
  $: osOptions = [...new Set($todos.map(todo => todo.os).filter(Boolean))].sort();
  $: browserOptions = [...new Set($todos.map(todo => todo.browser).filter(Boolean))].sort();
  $: languageOptions = [...new Set($todos.map(todo => todo.language).filter(Boolean))].sort();

  // 客户端渲染完成后设置加载状态
  onMount(() => {
    if (!$todos || $todos.length === 0) loadData();
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
    // 这里可以实现保存逻辑，或者直接批准
    return true;
  }

  // 重置过滤器
  function resetFilters() {
    searchQuery = '';
    selectedStatus = '';
    selectedOS = '';
    selectedBrowser = '';
    selectedLanguage = '';
    currentPage = 1;
  }

  function addSetItem(item: string) {
    processingSubmissions.add(item);
    processingSubmissions = new Set(processingSubmissions);
  }

  function delSetItem(item: string) {
    processingSubmissions.delete(item);
    processingSubmissions = new Set(processingSubmissions);
  }

  // 获取选中的提交对象
  $: selectedSubmissionObjects = paginatedTodos.filter(todo => selectedSubmissions.has(todo.url));

  // 选择处理函数
  function handleSelect(submission: Todo, selected: boolean) {
    if (selected) {
      selectedSubmissions.add(submission.url);
    } else {
      selectedSubmissions.delete(submission.url);
    }
    selectedSubmissions = new Set(selectedSubmissions);
  }

  // 全选当前页面
  function selectAll() {
    paginatedTodos.forEach(todo => {
      if (todo.status === 'pending') {
        selectedSubmissions.add(todo.url);
      }
    });
    selectedSubmissions = new Set(selectedSubmissions);
  }

  // 清除选择
  function clearSelection() {
    selectedSubmissions.clear();
    selectedSubmissions = new Set(selectedSubmissions);
  }

  // 批量批准
  async function batchApprove(submissions: Todo[]) {
    for (const submission of submissions) {
      if (submission.status === 'pending') {
        await quickApprove(submission);
      }
    }
    clearSelection();
  }

  // 批量拒绝
  async function batchReject(submissions: Todo[]) {
    for (const submission of submissions) {
      if (submission.status === 'pending') {
        await quickReject(submission);
      }
    }
    clearSelection();
  }

  // 当过滤条件改变时重置到第一页
  $: if (searchQuery || selectedStatus || selectedOS || selectedBrowser || selectedLanguage) {
    currentPage = 1;
  }
</script>

<svelte:head>
  <title>提交管理 - {APP_NAME}</title>
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
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">提交管理</h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        管理所有网站提交，包括审核、批准和拒绝操作
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
      <SubmissionStatsPanel stats={$stats} todos={$todos} />
    </div>

    <!-- 搜索和过滤 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
      <div class="px-4 py-4 sm:px-6 sm:py-5">
        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
          搜索和过滤
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
          <!-- 搜索框 -->
          <div class="lg:col-span-2">
            <label for="search" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              搜索提交
            </label>
            <div class="relative">
              <input
                type="text"
                id="search"
                bind:value={searchQuery}
                placeholder="搜索网站URL..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- 状态过滤 -->
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              状态
            </label>
            <select
              id="status"
              bind:value={selectedStatus}
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">所有状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已批准</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>

          <!-- 操作系统过滤 -->
          <div>
            <label for="os" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              操作系统
            </label>
            <select
              id="os"
              bind:value={selectedOS}
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">所有系统</option>
              {#each osOptions as os}
                <option value={os}>{os}</option>
              {/each}
            </select>
          </div>

          <!-- 浏览器过滤 -->
          <div>
            <label for="browser" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              浏览器
            </label>
            <select
              id="browser"
              bind:value={selectedBrowser}
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">所有浏览器</option>
              {#each browserOptions as browser}
                <option value={browser}>{browser}</option>
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
              {#each languageOptions as language}
                <option value={language}>{language}</option>
              {/each}
            </select>
          </div>
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
                <option value="submittedAt">提交时间</option>
                <option value="url">网站URL</option>
                <option value="status">状态</option>
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
          显示 {filteredTodos.length} 个提交中的 {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTodos.length)}-{Math.min(currentPage * itemsPerPage, filteredTodos.length)} 个
        </div>
      </div>
    </div>

    <!-- 批量操作 -->
    <BatchOperations
      selectedSubmissions={selectedSubmissionObjects}
      onBatchApprove={batchApprove}
      onBatchReject={batchReject}
      onSelectAll={selectAll}
      onClearSelection={clearSelection}
      isProcessing={processingSubmissions.size > 0}
    />

    <!-- 提交列表 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
      <div class="px-4 py-4 sm:px-6 sm:py-5">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            提交列表
            {#if selectedSubmissions.size > 0}
              <span class="ml-2 text-sm text-blue-600 dark:text-blue-400">
                (已选择 {selectedSubmissions.size} 个)
              </span>
            {/if}
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

        {#if paginatedTodos.length > 0}
          <div class="space-y-4">
            {#each paginatedTodos as submission}
              <SubmissionListItem
                {submission}
                isProcessing={processingSubmissions.has(submission.url)}
                onApprove={quickApprove}
                onReject={quickReject}
                onAnalyze={quickAnalyze}
                showDetails={true}
                showCheckbox={submission.status === 'pending'}
                isSelected={selectedSubmissions.has(submission.url)}
                onSelect={handleSelect}
              />
            {/each}
          </div>
        {:else}
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">没有找到提交</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {#if searchQuery || selectedStatus || selectedOS || selectedBrowser || selectedLanguage}
                尝试调整搜索条件或过滤器
              {:else}
                暂无提交数据
              {/if}
            </p>
            {#if searchQuery || selectedStatus || selectedOS || selectedBrowser || selectedLanguage}
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
              <span class="font-medium">{Math.min(currentPage * itemsPerPage, filteredTodos.length)}</span> 条，
              共 <span class="font-medium">{filteredTodos.length}</span> 条结果
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
