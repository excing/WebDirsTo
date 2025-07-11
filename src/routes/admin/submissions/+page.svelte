<script lang="ts">
  import { APP_NAME } from '$lib/constants.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { Todo } from '$lib/types.js';
  import AdminNavigation from '$lib/components/admin/AdminNavigation.svelte';
  import PendingSubmissionItem from '$lib/components/admin/PendingSubmissionItem.svelte';
  import type { PageData } from './$types';

  // 导入 sites 模块
  import {
    loading,
    error,
    stats,
    pendingTodos,
    loadData,
    approveSite,
    rejectSite
  } from '$lib/client/sites';

  export let data: PageData;

  // 状态管理
  let searchQuery = '';
  let sortBy = 'createdAt'; // createdAt, name, category
  let sortOrder = 'desc'; // asc, desc
  let currentPage = 1;
  let itemsPerPage = 10;
  let processingSubmissions = new Set<string>();
  let successMessage = '';
  let errorMessage = '';

  // 过滤和排序提交
  $: filteredSubmissions = $pendingTodos
    .filter(todo => {
      if (!searchQuery) return true;

      const searchLower = searchQuery.toLowerCase();
      return (
        todo.url.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.url;
          bValue = b.url;
          break;
        case 'category':
          aValue = a.url;
          bValue = b.url;
          break;
        default:
          aValue = new Date(a.submittedAt || 0).getTime();
          bValue = new Date(b.submittedAt || 0).getTime();
      }

      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

  // 分页
  $: totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  $: paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 统计信息
  $: submissionStats = {
    total: $pendingTodos.length,
    filtered: filteredSubmissions.length,
    processing: processingSubmissions.size,
    categories: 1 // Todo 类型没有 category 字段，暂时设为 1
  };

  // 初始化数据
  onMount(() => {
    if ($pendingTodos.length === 0) {
      loadData();
    }
  });

  // 批准提交
  async function handleApprove(todo: Todo) {
    const todoId = todo.url;
    processingSubmissions.add(todoId);
    processingSubmissions = processingSubmissions;

    try {
      // 创建一个临时的 Site 对象用于 approveSite 函数
      const tempSite = {
        name: todo.url,
        url: todo.url,
        description: '',
        category: 'Other',
        tags: [],
        recommendation: '',
        createdAt: todo.submittedAt,
        ogImage: ''
      };
      const result = await approveSite(todo, tempSite);
      if (result.success) {
        successMessage = `网站 "${todo.url}" 已批准`;
        setTimeout(() => successMessage = '', 3000);
      } else {
        errorMessage = result.message || '批准失败';
        setTimeout(() => errorMessage = '', 5000);
      }
    } catch (error) {
      console.error('Approve error:', error);
      errorMessage = '批准失败，请稍后重试';
      setTimeout(() => errorMessage = '', 5000);
    } finally {
      processingSubmissions.delete(todoId);
      processingSubmissions = processingSubmissions;
    }
  }

  // 拒绝提交
  async function handleReject(todo: Todo) {
    const todoId = todo.url;
    processingSubmissions.add(todoId);
    processingSubmissions = processingSubmissions;

    try {
      const result = await rejectSite(todo);
      if (result.success) {
        successMessage = `网站 "${todo.url}" 已拒绝`;
        setTimeout(() => successMessage = '', 3000);
      } else {
        errorMessage = result.message || '拒绝失败';
        setTimeout(() => errorMessage = '', 5000);
      }
    } catch (error) {
      console.error('Reject error:', error);
      errorMessage = '拒绝失败，请稍后重试';
      setTimeout(() => errorMessage = '', 5000);
    } finally {
      processingSubmissions.delete(todoId);
      processingSubmissions = processingSubmissions;
    }
  }

  // 排序切换
  function toggleSort(field: string) {
    if (sortBy === field) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = field;
      sortOrder = field === 'createdAt' ? 'desc' : 'asc';
    }
    currentPage = 1; // 重置到第一页
  }

  // 重置筛选
  function resetFilters() {
    searchQuery = '';
    sortBy = 'createdAt';
    sortOrder = 'desc';
    currentPage = 1;
  }

  // 批量操作
  let selectedSubmissions = new Set<string>();

  function toggleSelection(todoId: string) {
    if (selectedSubmissions.has(todoId)) {
      selectedSubmissions.delete(todoId);
    } else {
      selectedSubmissions.add(todoId);
    }
    selectedSubmissions = selectedSubmissions;
  }

  function selectAll() {
    selectedSubmissions = new Set(paginatedSubmissions.map(todo => todo.url));
  }

  function clearSelection() {
    selectedSubmissions = new Set();
  }

  async function batchApprove() {
    if (selectedSubmissions.size === 0) return;

    if (!confirm(`确定要批准选中的 ${selectedSubmissions.size} 个提交吗？`)) {
      return;
    }

    const selectedTodos = paginatedSubmissions.filter(todo =>
      selectedSubmissions.has(todo.url)
    );

    for (const todo of selectedTodos) {
      await handleApprove(todo);
    }

    clearSelection();
  }

  async function batchReject() {
    if (selectedSubmissions.size === 0) return;

    if (!confirm(`确定要拒绝选中的 ${selectedSubmissions.size} 个提交吗？此操作不可撤销。`)) {
      return;
    }

    const selectedTodos = paginatedSubmissions.filter(todo =>
      selectedSubmissions.has(todo.url)
    );

    for (const todo of selectedTodos) {
      await handleReject(todo);
    }

    clearSelection();
  }
</script>

<svelte:head>
  <title>提交审核 - {APP_NAME}</title>
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
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">提交审核</h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        审核用户提交的网站，决定是否批准或拒绝
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
              <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  待审核
                </dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">
                  {submissionStats.total}
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
                  {submissionStats.filtered}
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
              <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  已选择
                </dt>
                <dd class="text-lg font-medium text-gray-900 dark:text-white">
                  {selectedSubmissions.size}
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
                  {submissionStats.categories}
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
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">正在获取提交数据</p>
        </div>
      </div>
    {:else if $pendingTodos.length === 0}
      <!-- 空状态 -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div class="px-4 py-12 sm:px-6 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">暂无待审核提交</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            所有提交都已处理完毕，或者还没有新的提交
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
      <!-- 搜索和筛选 -->
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
                  placeholder="搜索提交内容..."
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <!-- 排序选择 -->
            <div class="flex-shrink-0">
              <select
                bind:value={sortBy}
                on:change={() => currentPage = 1}
                class="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="createdAt">按时间排序</option>
                <option value="name">按名称排序</option>
                <option value="category">按分类排序</option>
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

      <!-- 批量操作 -->
      {#if selectedSubmissions.size > 0}
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6 p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <svg class="h-5 w-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-sm font-medium text-blue-800 dark:text-blue-200">
                已选择 {selectedSubmissions.size} 个提交
              </span>
            </div>
            <div class="flex items-center space-x-3">
              <button
                type="button"
                on:click={batchApprove}
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg class="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                批量批准
              </button>
              <button
                type="button"
                on:click={batchReject}
                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg class="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                批量拒绝
              </button>
              <button
                type="button"
                on:click={clearSelection}
                class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                取消选择
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- 提交列表 -->
      {#if filteredSubmissions.length === 0}
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="px-4 py-12 sm:px-6 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">没有找到匹配的提交</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              尝试调整搜索条件
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
        <!-- 列表头部 -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="px-4 py-3 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedSubmissions.size === paginatedSubmissions.length && paginatedSubmissions.length > 0}
                  on:change={(e) => (e.target as HTMLInputElement).checked ? selectAll() : clearSelection()}
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <h3 class="ml-3 text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  待审核提交 ({filteredSubmissions.length})
                </h3>
              </div>
              <div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>第 {currentPage} 页，共 {totalPages} 页</span>
              </div>
            </div>
          </div>

          <!-- 提交项目列表 -->
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            {#each paginatedSubmissions as todo}
              {@const todoId = todo.url}
              {@const isProcessing = processingSubmissions.has(todoId)}
              {@const isSelected = selectedSubmissions.has(todoId)}

              <div class="px-4 py-4 sm:px-6">
                <div class="flex items-start">
                  <!-- 选择框 -->
                  <div class="flex items-center h-5 mt-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      on:change={() => toggleSelection(todoId)}
                      disabled={isProcessing}
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                    />
                  </div>

                  <!-- 内容 -->
                  <div class="ml-4 flex-1 min-w-0">
                    <PendingSubmissionItem
                      submission={todo}
                      {isProcessing}
                      onApprove={() => handleApprove(todo)}
                      onReject={() => handleReject(todo)}
                    />
                  </div>
                </div>
              </div>
            {/each}
          </div>

          <!-- 分页 -->
          {#if totalPages > 1}
            <div class="bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <div class="flex-1 flex justify-between sm:hidden">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    on:click={() => currentPage = Math.max(1, currentPage - 1)}
                    class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
                    class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
                <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p class="text-sm text-gray-700 dark:text-gray-300">
                      显示第 <span class="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> 到
                      <span class="font-medium">{Math.min(currentPage * itemsPerPage, filteredSubmissions.length)}</span> 项，
                      共 <span class="font-medium">{filteredSubmissions.length}</span> 项
                    </p>
                  </div>
                  <div>
                    <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="分页">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        on:click={() => currentPage = Math.max(1, currentPage - 1)}
                        class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span class="sr-only">上一页</span>
                        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      </button>

                      {#each Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                        const start = Math.max(1, currentPage - 2);
                        return start + i;
                      }).filter(page => page <= totalPages) as page}
                        <button
                          type="button"
                          on:click={() => currentPage = page}
                          class="relative inline-flex items-center px-4 py-2 border text-sm font-medium {page === currentPage
                            ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-200'
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'}"
                        >
                          {page}
                        </button>
                      {/each}

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
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
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>
