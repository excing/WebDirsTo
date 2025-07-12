<script lang="ts">
	import type { Todo } from '$lib/types';

	interface Props {
		stats: any;
		todos: Todo[];
	}

	let { stats, todos }: Props = $props();

	// 按状态分组统计
	let statusCounts = $derived({
		pending: todos.filter(todo => todo.status === 'pending').length,
		approved: todos.filter(todo => todo.status === 'approved').length,
		rejected: todos.filter(todo => todo.status === 'rejected').length,
	});

	// 按操作系统统计
	let osCounts = $derived(todos.reduce((acc, todo) => {
		acc[todo.os] = (acc[todo.os] || 0) + 1;
		return acc;
	}, {} as Record<string, number>));

	// 按浏览器统计
	let browserCounts = $derived(todos.reduce((acc, todo) => {
		acc[todo.browser] = (acc[todo.browser] || 0) + 1;
		return acc;
	}, {} as Record<string, number>));

	// 按语言统计
	let languageCounts = $derived(todos.reduce((acc, todo) => {
		acc[todo.language] = (acc[todo.language] || 0) + 1;
		return acc;
	}, {} as Record<string, number>));

	// 获取前5个统计项
	let topOS = $derived(Object.entries(osCounts)
		.sort(([,a], [,b]) => (b as number) - (a as number))
		.slice(0, 5));

	let topBrowsers = $derived(Object.entries(browserCounts)
		.sort(([,a], [,b]) => (b as number) - (a as number))
		.slice(0, 5));

	let topLanguages = $derived(Object.entries(languageCounts)
		.sort(([,a], [,b]) => (b as number) - (a as number))
		.slice(0, 5));

	// 计算百分比
	function getPercentage(count: number, total: number): number {
		return total > 0 ? Math.round((count / total) * 100) : 0;
	}

	// 获取最近7天的提交统计
	let recentSubmissions = $derived(() => {
		const now = new Date();
		const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		
		const recent = todos.filter(todo => {
			const submittedDate = new Date(todo.submittedAt);
			return submittedDate >= sevenDaysAgo;
		});

		const dailyCounts: Record<string, number> = {};
		for (let i = 6; i >= 0; i--) {
			const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
			const dateKey = date.toISOString().split('T')[0];
			dailyCounts[dateKey] = 0;
		}

		recent.forEach(todo => {
			const dateKey = todo.submittedAt.split('T')[0];
			if (dailyCounts.hasOwnProperty(dateKey)) {
				dailyCounts[dateKey]++;
			}
		});

		return Object.entries(dailyCounts).map(([date, count]) => ({
			date,
			count,
			label: new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
		}));
	});
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
	<!-- 状态统计 -->
	<div class="bg-white dark:bg-gray-800 shadow rounded-lg">
		<div class="px-4 py-4 sm:px-6 sm:py-5">
			<h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
				提交状态统计
			</h3>
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<div class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
						<span class="text-sm font-medium text-gray-900 dark:text-white">待审核</span>
					</div>
					<div class="flex items-center space-x-2">
						<div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
							<div 
								class="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
								style="width: {getPercentage(statusCounts.pending, todos.length)}%"
							></div>
						</div>
						<span class="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
							{statusCounts.pending}
						</span>
					</div>
				</div>
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
						<span class="text-sm font-medium text-gray-900 dark:text-white">已批准</span>
					</div>
					<div class="flex items-center space-x-2">
						<div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
							<div 
								class="bg-green-500 h-2 rounded-full transition-all duration-300" 
								style="width: {getPercentage(statusCounts.approved, todos.length)}%"
							></div>
						</div>
						<span class="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
							{statusCounts.approved}
						</span>
					</div>
				</div>
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
						<span class="text-sm font-medium text-gray-900 dark:text-white">已拒绝</span>
					</div>
					<div class="flex items-center space-x-2">
						<div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
							<div 
								class="bg-red-500 h-2 rounded-full transition-all duration-300" 
								style="width: {getPercentage(statusCounts.rejected, todos.length)}%"
							></div>
						</div>
						<span class="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
							{statusCounts.rejected}
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- 操作系统统计 -->
	<div class="bg-white dark:bg-gray-800 shadow rounded-lg">
		<div class="px-4 py-4 sm:px-6 sm:py-5">
			<h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
				操作系统统计
			</h3>
			{#if topOS.length > 0}
				<div class="space-y-3">
					{#each topOS as [os, count]}
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-gray-900 dark:text-white truncate">
								{os}
							</span>
							<div class="flex items-center space-x-2 ml-4">
								<div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
									<div 
										class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
										style="width: {getPercentage(count as number, todos.length)}%"
									></div>
								</div>
								<span class="text-sm text-gray-600 dark:text-gray-400 w-6 text-right">
									{count}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-gray-500 dark:text-gray-400">暂无数据</p>
			{/if}
		</div>
	</div>

	<!-- 浏览器统计 -->
	<div class="bg-white dark:bg-gray-800 shadow rounded-lg">
		<div class="px-4 py-4 sm:px-6 sm:py-5">
			<h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
				浏览器统计
			</h3>
			{#if topBrowsers.length > 0}
				<div class="space-y-3">
					{#each topBrowsers as [browser, count]}
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-gray-900 dark:text-white truncate">
								{browser}
							</span>
							<div class="flex items-center space-x-2 ml-4">
								<div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
									<div 
										class="bg-purple-600 h-2 rounded-full transition-all duration-300" 
										style="width: {getPercentage(count as number, todos.length)}%"
									></div>
								</div>
								<span class="text-sm text-gray-600 dark:text-gray-400 w-6 text-right">
									{count}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-gray-500 dark:text-gray-400">暂无数据</p>
			{/if}
		</div>
	</div>
</div>

<!-- 最近7天提交趋势 -->
<div class="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg">
	<div class="px-4 py-4 sm:px-6 sm:py-5">
		<h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
			最近7天提交趋势
		</h3>
		<div class="flex items-end space-x-2 h-32">
			{#each recentSubmissions() as day}
				<div class="flex-1 flex flex-col items-center">
					<div 
						class="w-full bg-blue-500 rounded-t transition-all duration-300 min-h-[4px]"
						style="height: {Math.max(4, (day.count / Math.max(...recentSubmissions().map(d => d.count), 1)) * 100)}px"
						title="{day.label}: {day.count} 个提交"
					></div>
					<span class="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
						{day.label}
					</span>
					<span class="text-xs font-medium text-gray-900 dark:text-white">
						{day.count}
					</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- 语言统计 -->
{#if topLanguages.length > 0}
	<div class="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg">
		<div class="px-4 py-4 sm:px-6 sm:py-5">
			<h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
				语言偏好统计
			</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each topLanguages as [language, count]}
					<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
						<span class="text-sm font-medium text-gray-900 dark:text-white">
							{language}
						</span>
						<div class="flex items-center space-x-2">
							<span class="text-sm text-gray-600 dark:text-gray-400">
								{count}
							</span>
							<span class="text-xs text-gray-500 dark:text-gray-500">
								({getPercentage(count as number, todos.length)}%)
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
