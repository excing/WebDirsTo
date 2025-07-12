<script lang="ts">
	import type { Writable } from 'svelte/store';

	interface Props {
		stats: any;
	}

	let { stats }: Props = $props();

	// 获取前10个分类
	let topCategories = $derived(Object.entries(stats.categoryCounts || {})
		.sort(([,a], [,b]) => (b as number) - (a as number))
		.slice(0, 10));

	// 获取前10个标签
	let topTags = $derived(Object.entries(stats.tagCounts || {})
		.sort(([,a], [,b]) => (b as number) - (a as number))
		.slice(0, 10));

	// 计算百分比
	function getPercentage(count: number, total: number): number {
		return total > 0 ? Math.round((count / total) * 100) : 0;
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
	<!-- 分类统计 -->
	<div class="bg-white dark:bg-gray-800 shadow rounded-lg">
		<div class="px-4 py-4 sm:px-6 sm:py-5">
			<h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
				分类统计
			</h3>
			{#if topCategories.length > 0}
				<div class="space-y-3">
					{#each topCategories as [category, count]}
						<div class="flex items-center justify-between">
							<div class="flex items-center min-w-0 flex-1">
								<span class="text-sm font-medium text-gray-900 dark:text-white truncate">
									{category}
								</span>
							</div>
							<div class="flex items-center space-x-2 ml-4">
								<div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
									<div 
										class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
										style="width: {getPercentage(count as number, stats.totalSites)}%"
									></div>
								</div>
								<span class="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
									{count}
								</span>
								<span class="text-xs text-gray-500 dark:text-gray-500 w-10 text-right">
									{getPercentage(count as number, stats.totalSites)}%
								</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-gray-500 dark:text-gray-400">暂无分类数据</p>
			{/if}
		</div>
	</div>

	<!-- 标签统计 -->
	<div class="bg-white dark:bg-gray-800 shadow rounded-lg">
		<div class="px-4 py-4 sm:px-6 sm:py-5">
			<h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
				热门标签
			</h3>
			{#if topTags.length > 0}
				<div class="space-y-3">
					{#each topTags as [tag, count]}
						<div class="flex items-center justify-between">
							<div class="flex items-center min-w-0 flex-1">
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
									#{tag}
								</span>
							</div>
							<div class="flex items-center space-x-2 ml-4">
								<div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
									<div 
										class="bg-purple-600 h-2 rounded-full transition-all duration-300" 
										style="width: {getPercentage(count as number, stats.totalSites)}%"
									></div>
								</div>
								<span class="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
									{count}
								</span>
								<span class="text-xs text-gray-500 dark:text-gray-500 w-10 text-right">
									{getPercentage(count as number, stats.totalSites)}%
								</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-gray-500 dark:text-gray-400">暂无标签数据</p>
			{/if}
		</div>
	</div>
</div>

<!-- 额外统计信息 -->
<div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
	<div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
		<div class="flex items-center">
			<div class="flex-shrink-0">
				<svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
				</svg>
			</div>
			<div class="ml-3">
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400">成人内容</p>
				<p class="text-lg font-semibold text-gray-900 dark:text-white">{stats.adultSites || 0}</p>
			</div>
		</div>
	</div>

	<div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
		<div class="flex items-center">
			<div class="flex-shrink-0">
				<svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
				</svg>
			</div>
			<div class="ml-3">
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400">已归档</p>
				<p class="text-lg font-semibold text-gray-900 dark:text-white">{stats.archivedSites || 0}</p>
			</div>
		</div>
	</div>

	<div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
		<div class="flex items-center">
			<div class="flex-shrink-0">
				<svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
			</div>
			<div class="ml-3">
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400">已批准</p>
				<p class="text-lg font-semibold text-gray-900 dark:text-white">{stats.approvedSubmissions || 0}</p>
			</div>
		</div>
	</div>

	<div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
		<div class="flex items-center">
			<div class="flex-shrink-0">
				<svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
				</svg>
			</div>
			<div class="ml-3">
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400">已拒绝</p>
				<p class="text-lg font-semibold text-gray-900 dark:text-white">{stats.rejectedSubmissions || 0}</p>
			</div>
		</div>
	</div>
</div>
