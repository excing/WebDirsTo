<script lang="ts">
  import { APP_NAME } from '$lib/constants.js';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import AdminNavigation from '$lib/components/admin/AdminNavigation.svelte';
  import SystemStatusPanel from '$lib/components/admin/SystemStatusPanel.svelte';
  import DataAnalysisPanel from '$lib/components/admin/DataAnalysisPanel.svelte';
  import PerformanceMonitor from '$lib/components/PerformanceMonitor.svelte';
  import QuickActionsPanel from '$lib/components/admin/QuickActionsPanel.svelte';

  // 导入 sites 模块
  import {
    loading,
    error,
    stats,
    sites,
    todos,
    loadData
  } from '$lib/client/sites';

  let { data }: { data: PageData } = $props();

  let activeTab = $state('overview');

  // 统计卡片配置
  let statsCards = $derived([
    {
      title: '系统运行时间',
      value: '正常',
      iconColor: 'text-green-600',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      title: '数据完整性',
      value: '100%',
      iconColor: 'text-blue-600',
      iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    },
    {
      title: '服务状态',
      value: '在线',
      iconColor: 'text-green-600',
      iconPath: 'M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z'
    },
    {
      title: '响应时间',
      value: '< 100ms',
      iconColor: 'text-yellow-600',
      iconPath: 'M13 10V3L4 14h7v7l9-11h-7z'
    }
  ]);

  // 标签页配置
  const tabs = [
    { id: 'overview', name: '概览', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'system', name: '系统状态', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
    { id: 'data', name: '数据分析', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'performance', name: '性能监控', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
  ];

  // 客户端渲染完成后设置加载状态
  onMount(() => {
    if (!$sites || $sites.length === 0) loadData();
  });

  function setActiveTab(tabId: string) {
    activeTab = tabId;
  }
</script>

<svelte:head>
  <title>系统分析 - {APP_NAME}</title>
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
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">系统分析</h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        监控系统状态、分析数据趋势和性能指标
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

    <!-- 标签页导航 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-8 px-4 sm:px-6" aria-label="Tabs">
          {#each tabs as tab}
            <button
              onclick={() => setActiveTab(tab.id)}
              class="group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm {activeTab === tab.id 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'} transition-colors"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tab.icon}></path>
              </svg>
              {tab.name}
            </button>
          {/each}
        </nav>
      </div>
    </div>

    <!-- 标签页内容 -->
    <div class="tab-content">
      {#if activeTab === 'overview'}
        <!-- 概览页面 -->
        <div class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
              <SystemStatusPanel />
              <DataAnalysisPanel sites={$sites} todos={$todos} stats={$stats} />
            </div>
            <div>
              <QuickActionsPanel />
            </div>
          </div>
        </div>
      {:else if activeTab === 'system'}
        <!-- 系统状态页面 -->
        <SystemStatusPanel />
      {:else if activeTab === 'data'}
        <!-- 数据分析页面 -->
        <DataAnalysisPanel sites={$sites} todos={$todos} stats={$stats} />
      {:else if activeTab === 'performance'}
        <!-- 性能监控页面 -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="px-4 py-4 sm:px-6 sm:py-5">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              性能监控
            </h3>
            <PerformanceMonitor />
          </div>
        </div>
      {/if}
    </div>
  </div>
  {/if}
</div>
