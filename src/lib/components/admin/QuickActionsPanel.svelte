<script lang="ts">
	import { API } from '$lib/client/api';

	let isAnalyzing = $state(false);
	let analyzeUrl = $state('');
	let analyzeResult = $state<any>(null);
	let analyzeError = $state('');

	// 快速分析网站
	async function quickAnalyze() {
		if (!analyzeUrl.trim()) {
			analyzeError = '请输入网站URL';
			return;
		}

		isAnalyzing = true;
		analyzeError = '';
		analyzeResult = null;

		try {
			const result = await API.analyzeSite(analyzeUrl.trim());
			analyzeResult = result;
		} catch (error) {
			analyzeError = error instanceof Error ? error.message : '分析失败';
		} finally {
			isAnalyzing = false;
		}
	}

	// 清除分析结果
	function clearAnalysis() {
		analyzeUrl = '';
		analyzeResult = null;
		analyzeError = '';
	}

	// 复制分析结果
	function copyAnalysisResult() {
		if (analyzeResult) {
			const text = JSON.stringify(analyzeResult, null, 2);
			navigator.clipboard.writeText(text);
		}
	}

	// 刷新页面数据
	function refreshData() {
		window.location.reload();
	}

	// 导出数据
	function exportData() {
		// 这里可以实现数据导出功能
		alert('数据导出功能开发中...');
	}

	// 清理缓存
	function clearCache() {
		if (confirm('确定要清理浏览器缓存吗？')) {
			// 清理localStorage
			localStorage.clear();
			// 清理sessionStorage
			sessionStorage.clear();
			alert('缓存已清理');
		}
	}
</script>

<div class="bg-white dark:bg-gray-800 shadow rounded-lg">
	<div class="px-4 py-4 sm:px-6 sm:py-5">
		<h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
			快速操作工具
		</h3>

		<div class="space-y-6">
			<!-- 网站分析工具 -->
			<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
				<h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
					网站分析工具
				</h4>
				
				<div class="flex space-x-2 mb-3">
					<input
						type="url"
						bind:value={analyzeUrl}
						placeholder="输入网站URL进行分析..."
						class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
					/>
					<button
						onclick={quickAnalyze}
						disabled={isAnalyzing}
						class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if isAnalyzing}
							<svg class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
							</svg>
							分析中
						{:else}
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
							</svg>
							分析
						{/if}
					</button>
				</div>

				{#if analyzeError}
					<div class="text-sm text-red-600 dark:text-red-400 mb-3">
						{analyzeError}
					</div>
				{/if}

				{#if analyzeResult}
					<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
						<div class="flex justify-between items-start mb-2">
							<h5 class="text-sm font-medium text-gray-900 dark:text-white">
								分析结果
							</h5>
							<div class="flex space-x-2">
								<button
									onclick={copyAnalysisResult}
									class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
								>
									复制
								</button>
								<button
									onclick={clearAnalysis}
									class="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
								>
									清除
								</button>
							</div>
						</div>
						<div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
							<div><strong>标题:</strong> {analyzeResult.title}</div>
							<div><strong>分类:</strong> {analyzeResult.category}</div>
							<div><strong>语言:</strong> {analyzeResult.language}</div>
							<div><strong>年龄分级:</strong> {analyzeResult.ageRating}</div>
							<div><strong>HTTPS:</strong> {analyzeResult.supportsHTTPS ? '支持' : '不支持'}</div>
							<div><strong>PWA:</strong> {analyzeResult.supportsPWA ? '支持' : '不支持'}</div>
							{#if analyzeResult.tags && analyzeResult.tags.length > 0}
								<div><strong>标签:</strong> {analyzeResult.tags.join(', ')}</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- 系统操作 -->
			<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
				<h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
					系统操作
				</h4>
				
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-1 gap-3">
					<button
						onclick={refreshData}
						class="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
						</svg>
						刷新数据
					</button>

					<button
						onclick={exportData}
						class="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
						</svg>
						导出数据
					</button>

					<button
						onclick={clearCache}
						class="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
						</svg>
						清理缓存
					</button>

					<a
						href="/admin/dashboard"
						class="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z"></path>
						</svg>
						仪表板
					</a>
				</div>
			</div>

			<!-- 快速链接 -->
			<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
				<h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
					快速链接
				</h4>
				
				<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-3">
					<a
						href="/admin/sites"
						class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
						</svg>
						网站管理
					</a>

					<a
						href="/admin/submissions"
						class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
						</svg>
						提交管理
					</a>

					<a
						href="/admin/add-site"
						class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
						</svg>
						添加网站
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
