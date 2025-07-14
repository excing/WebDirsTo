<script lang="ts">
	import type { Site, Todo } from '$lib/types';

	interface Props {
		sites: Site[];
		todos: Todo[];
		stats: any;
	}

	let { sites, todos, stats }: Props = $props();

	// 计算增长趋势
	let growthTrends = $derived(() => {
		const now = new Date();
		const periods = [
			{ label: '今天', days: 1 },
			{ label: '本周', days: 7 },
			{ label: '本月', days: 30 },
			{ label: '本季度', days: 90 }
		];

		return periods.map(period => {
			const cutoffDate = new Date(now.getTime() - period.days * 24 * 60 * 60 * 1000);
			
			const newSites = sites.filter(site => 
				new Date(site.createdAt) >= cutoffDate
			).length;
			
			const newSubmissions = todos.filter(todo => 
				new Date(todo.submittedAt) >= cutoffDate
			).length;
			
			const approvedSubmissions = todos.filter(todo => 
				todo.status === 'approved' && new Date(todo.submittedAt) >= cutoffDate
			).length;

			return {
				...period,
				newSites,
				newSubmissions,
				approvedSubmissions,
				approvalRate: newSubmissions > 0 ? Math.round((approvedSubmissions / newSubmissions) * 100) : 0
			};
		});
	});

	// 分类分布分析
	let categoryAnalysis = $derived(() => {
		const categoryCounts = stats.categoryCounts || {};
		const total = Object.values(categoryCounts).reduce((sum: number, count: any) => sum + count, 0);
		
		return Object.entries(categoryCounts)
			.map(([category, count]) => ({
				category,
				count: count as number,
				percentage: total > 0 ? Math.round(((count as number) / total) * 100) : 0
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);
	});

	// 语言分布分析
	let languageAnalysis = $derived(() => {
		const languageCounts: Record<string, number> = {};
		sites.forEach(site => {
			if (site.language) {
				languageCounts[site.language] = (languageCounts[site.language] || 0) + 1;
			}
		});

		const total = Object.values(languageCounts).reduce((sum, count) => sum + count, 0);
		
		return Object.entries(languageCounts)
			.map(([language, count]) => ({
				language,
				count,
				percentage: total > 0 ? Math.round((count / total) * 100) : 0
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 8);
	});

	// 技术特性分析
	let techAnalysis = $derived(() => {
		const httpsCount = sites.filter(site => site.supportsHTTPS).length;
		const pwaCount = sites.filter(site => site.supportsPWA).length;
		const starredCount = sites.filter(site => site.starred).length;
		const adultCount = sites.filter(site => site.ageRating === '18+').length;
		
		const total = sites.length;
		
		return [
			{
				feature: 'HTTPS支持',
				count: httpsCount,
				percentage: total > 0 ? Math.round((httpsCount / total) * 100) : 0,
				color: 'bg-green-500'
			},
			{
				feature: 'PWA支持',
				count: pwaCount,
				percentage: total > 0 ? Math.round((pwaCount / total) * 100) : 0,
				color: 'bg-blue-500'
			},
			{
				feature: '置顶网站',
				count: starredCount,
				percentage: total > 0 ? Math.round((starredCount / total) * 100) : 0,
				color: 'bg-yellow-500'
			},
			{
				feature: '成人内容',
				count: adultCount,
				percentage: total > 0 ? Math.round((adultCount / total) * 100) : 0,
				color: 'bg-red-500'
			}
		];
	});

	// 提交状态分析
	let submissionAnalysis = $derived(() => {
		const statusCounts = {
			pending: todos.filter(todo => todo.status === 'pending').length,
			approved: todos.filter(todo => todo.status === 'approved').length,
			rejected: todos.filter(todo => todo.status === 'rejected').length
		};

		const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

		return [
			{
				status: '待审核',
				count: statusCounts.pending,
				percentage: total > 0 ? Math.round((statusCounts.pending / total) * 100) : 0,
				color: 'bg-yellow-500'
			},
			{
				status: '已批准',
				count: statusCounts.approved,
				percentage: total > 0 ? Math.round((statusCounts.approved / total) * 100) : 0,
				color: 'bg-green-500'
			},
			{
				status: '已拒绝',
				count: statusCounts.rejected,
				percentage: total > 0 ? Math.round((statusCounts.rejected / total) * 100) : 0,
				color: 'bg-red-500'
			}
		];
	});

	// 最近活动分析
	let recentActivity = $derived(() => {
		const now = new Date();
		const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
		const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

		const recentSites = sites.filter(site => new Date(site.createdAt) >= last24h).length;
		const recentSubmissions = todos.filter(todo => new Date(todo.submittedAt) >= last24h).length;
		const weeklySubmissions = todos.filter(todo => new Date(todo.submittedAt) >= last7d).length;

		return {
			sitesLast24h: recentSites,
			submissionsLast24h: recentSubmissions,
			submissionsLast7d: weeklySubmissions,
			avgDailySubmissions: Math.round(weeklySubmissions / 7)
		};
	});
</script>

<div class="space-y-6">
	<!-- 增长趋势 -->
	<div class="bg-white dark:bg-gray-800 shadow rounded-lg">
		<div class="px-4 py-4 sm:px-6 sm:py-5">
			<h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
				增长趋势分析
			</h3>
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{#each growthTrends() as trend}
					<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
						<h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">{trend.label}</h4>
						<div class="space-y-2">
							<div class="flex justify-between text-xs">
								<span class="text-gray-600 dark:text-gray-400">新增网站</span>
								<span class="font-medium text-blue-600 dark:text-blue-400">{trend.newSites}</span>
							</div>
							<div class="flex justify-between text-xs">
								<span class="text-gray-600 dark:text-gray-400">新提交</span>
								<span class="font-medium text-green-600 dark:text-green-400">{trend.newSubmissions}</span>
							</div>
							<div class="flex justify-between text-xs">
								<span class="text-gray-600 dark:text-gray-400">通过率</span>
								<span class="font-medium text-purple-600 dark:text-purple-400">{trend.approvalRate}%</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- 分类和语言分析 -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- 分类分布 -->
		<div class="bg-white dark:bg-gray-800 shadow rounded-lg">
			<div class="px-4 py-4 sm:px-6 sm:py-5">
				<h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
					分类分布 (前10)
				</h3>
				<div class="space-y-3">
					{#each categoryAnalysis() as item}
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-900 dark:text-white truncate flex-1">
								{item.category}
							</span>
							<div class="flex items-center space-x-2 ml-4">
								<div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
									<div 
										class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
										style="width: {item.percentage}%"
									></div>
								</div>
								<span class="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
									{item.count}
								</span>
								<span class="text-xs text-gray-500 dark:text-gray-500 w-10 text-right">
									{item.percentage}%
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- 语言分布 -->
		<div class="bg-white dark:bg-gray-800 shadow rounded-lg">
			<div class="px-4 py-4 sm:px-6 sm:py-5">
				<h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
					语言分布
				</h3>
				<div class="space-y-3">
					{#each languageAnalysis() as item}
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-900 dark:text-white truncate flex-1">
								{item.language}
							</span>
							<div class="flex items-center space-x-2 ml-4">
								<div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
									<div 
										class="bg-purple-600 h-2 rounded-full transition-all duration-300" 
										style="width: {item.percentage}%"
									></div>
								</div>
								<span class="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
									{item.count}
								</span>
								<span class="text-xs text-gray-500 dark:text-gray-500 w-10 text-right">
									{item.percentage}%
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- 技术特性和提交状态 -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- 技术特性分析 -->
		<div class="bg-white dark:bg-gray-800 shadow rounded-lg">
			<div class="px-4 py-4 sm:px-6 sm:py-5">
				<h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
					技术特性分析
				</h3>
				<div class="space-y-4">
					{#each techAnalysis() as item}
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-900 dark:text-white">
								{item.feature}
							</span>
							<div class="flex items-center space-x-2">
								<div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
									<div 
										class="{item.color} h-3 rounded-full transition-all duration-300" 
										style="width: {item.percentage}%"
									></div>
								</div>
								<span class="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
									{item.count}
								</span>
								<span class="text-xs text-gray-500 dark:text-gray-500 w-10 text-right">
									{item.percentage}%
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- 提交状态分析 -->
		<div class="bg-white dark:bg-gray-800 shadow rounded-lg">
			<div class="px-4 py-4 sm:px-6 sm:py-5">
				<h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
					提交状态分析
				</h3>
				<div class="space-y-4">
					{#each submissionAnalysis() as item}
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-900 dark:text-white">
								{item.status}
							</span>
							<div class="flex items-center space-x-2">
								<div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
									<div 
										class="{item.color} h-3 rounded-full transition-all duration-300" 
										style="width: {item.percentage}%"
									></div>
								</div>
								<span class="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
									{item.count}
								</span>
								<span class="text-xs text-gray-500 dark:text-gray-500 w-10 text-right">
									{item.percentage}%
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- 最近活动摘要 -->
	<div class="bg-white dark:bg-gray-800 shadow rounded-lg">
		<div class="px-4 py-4 sm:px-6 sm:py-5">
			<h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
				最近活动摘要
			</h3>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div class="text-center">
					<div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
						{recentActivity().sitesLast24h}
					</div>
					<div class="text-sm text-gray-600 dark:text-gray-400">
						24小时新增网站
					</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-green-600 dark:text-green-400">
						{recentActivity().submissionsLast24h}
					</div>
					<div class="text-sm text-gray-600 dark:text-gray-400">
						24小时新提交
					</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
						{recentActivity().submissionsLast7d}
					</div>
					<div class="text-sm text-gray-600 dark:text-gray-400">
						7天总提交
					</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
						{recentActivity().avgDailySubmissions}
					</div>
					<div class="text-sm text-gray-600 dark:text-gray-400">
						日均提交
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
