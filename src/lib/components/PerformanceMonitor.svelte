<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	let performanceData = $state({
		loadTime: 0,
		renderTime: 0,
		hydrationTime: 0,
		isSSR: false,
		// Core Web Vitals
		fcp: 0,  // First Contentful Paint
		lcp: 0,  // Largest Contentful Paint
		cls: 0,  // Cumulative Layout Shift
		fid: 0   // First Input Delay
	});
	
	let showDetails = $state(false);

	// 测量 Core Web Vitals
	function measureCoreWebVitals() {
		// First Contentful Paint (FCP)
		const paintEntries = performance.getEntriesByType('paint');
		const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
		if (fcpEntry) {
			performanceData.fcp = Math.round(fcpEntry.startTime);
		}

		// Largest Contentful Paint (LCP)
		if ('PerformanceObserver' in window) {
			try {
				const lcpObserver = new PerformanceObserver((list) => {
					const entries = list.getEntries();
					const lastEntry = entries[entries.length - 1] as any;
					if (lastEntry) {
						performanceData.lcp = Math.round(lastEntry.startTime);
					}
				});
				lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

				// Cumulative Layout Shift (CLS)
				let clsValue = 0;
				const clsObserver = new PerformanceObserver((list) => {
					for (const entry of list.getEntries() as any[]) {
						if (!entry.hadRecentInput) {
							clsValue += entry.value;
						}
					}
					performanceData.cls = Math.round(clsValue * 1000) / 1000;
				});
				clsObserver.observe({ entryTypes: ['layout-shift'] });

				// First Input Delay (FID)
				const fidObserver = new PerformanceObserver((list) => {
					for (const entry of list.getEntries() as any[]) {
						performanceData.fid = Math.round(entry.processingStart - entry.startTime);
					}
				});
				fidObserver.observe({ entryTypes: ['first-input'] });
			} catch (e) {
				console.warn('Performance Observer not fully supported:', e);
			}
		}
	}
	
	onMount(() => {
		if (!browser) return;
		
		// 检测是否为服务端渲染
		performanceData.isSSR = document.body.hasAttribute('data-sveltekit-preload-data');
		
		// 获取性能指标 - 使用现代 PerformanceNavigationTiming API
		if ('performance' in window && 'getEntriesByType' in performance) {
			const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
			if (navigationEntries.length > 0) {
				const timing = navigationEntries[0];
				performanceData.loadTime = Math.round(timing.loadEventEnd - timing.fetchStart);
				performanceData.renderTime = Math.round(timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart);
			}
		}

		// 获取 Core Web Vitals
		measureCoreWebVitals();
		
		// 监听水合完成事件
		const hydrationStart = Date.now();
		const checkHydration = () => {
			if (document.body.hasAttribute('data-sveltekit-preload-data')) {
				performanceData.hydrationTime = Date.now() - hydrationStart;
			} else {
				requestAnimationFrame(checkHydration);
			}
		};
		checkHydration();
	});
	
	function formatTime(ms: number): string {
		return ms > 0 ? `${ms}ms` : '测量中...';
	}

	// 获取性能评分颜色
	function getScoreColor(metric: string, value: number): string {
		const thresholds = {
			fcp: { good: 1800, poor: 3000 },
			lcp: { good: 2500, poor: 4000 },
			cls: { good: 0.1, poor: 0.25 },
			fid: { good: 100, poor: 300 }
		};

		const threshold = thresholds[metric as keyof typeof thresholds];
		if (!threshold || value === 0) return 'text-gray-500';

		if (metric === 'cls') {
			if (value <= threshold.good) return 'text-green-600';
			if (value <= threshold.poor) return 'text-yellow-600';
			return 'text-red-600';
		} else {
			if (value <= threshold.good) return 'text-green-600';
			if (value <= threshold.poor) return 'text-yellow-600';
			return 'text-red-600';
		}
	}

	// 获取总体性能评分
	function getOverallScore(): { score: number; label: string; color: string } {
		const scores = [];

		if (performanceData.fcp > 0) {
			scores.push(performanceData.fcp <= 1800 ? 100 : performanceData.fcp <= 3000 ? 75 : 50);
		}
		if (performanceData.lcp > 0) {
			scores.push(performanceData.lcp <= 2500 ? 100 : performanceData.lcp <= 4000 ? 75 : 50);
		}
		if (performanceData.cls > 0) {
			scores.push(performanceData.cls <= 0.1 ? 100 : performanceData.cls <= 0.25 ? 75 : 50);
		}

		const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

		if (avgScore >= 90) return { score: avgScore, label: '优秀', color: 'text-green-600' };
		if (avgScore >= 75) return { score: avgScore, label: '良好', color: 'text-yellow-600' };
		if (avgScore >= 50) return { score: avgScore, label: '需要改进', color: 'text-orange-600' };
		return { score: avgScore, label: '较差', color: 'text-red-600' };
	}
</script>

{#if browser}
	<div class="fixed bottom-4 right-4 z-50">
		<button
			onclick={() => showDetails = !showDetails}
			class="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors text-sm"
		>
			⚡ 性能
		</button>
		
		{#if showDetails}
			<div class="absolute bottom-12 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 min-w-64">
				<h3 class="font-bold text-sm mb-3 text-gray-900 dark:text-white">性能指标</h3>
				
				<div class="space-y-2 text-xs">
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400">渲染模式:</span>
						<span class="font-mono {performanceData.isSSR ? 'text-green-600' : 'text-orange-600'}">
							{performanceData.isSSR ? 'SSR' : 'CSR'}
						</span>
					</div>
					
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400">页面加载:</span>
						<span class="font-mono text-blue-600">{formatTime(performanceData.loadTime)}</span>
					</div>
					
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400">DOM渲染:</span>
						<span class="font-mono text-purple-600">{formatTime(performanceData.renderTime)}</span>
					</div>
					
					{#if performanceData.isSSR}
						<div class="flex justify-between">
							<span class="text-gray-600 dark:text-gray-400">水合时间:</span>
							<span class="font-mono text-green-600">{formatTime(performanceData.hydrationTime)}</span>
						</div>
					{/if}

					<!-- Core Web Vitals -->
					<div class="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
						<div class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Core Web Vitals</div>

						<div class="flex justify-between">
							<span class="text-gray-600 dark:text-gray-400">FCP:</span>
							<span class="font-mono {getScoreColor('fcp', performanceData.fcp)}">{formatTime(performanceData.fcp)}</span>
						</div>

						<div class="flex justify-between">
							<span class="text-gray-600 dark:text-gray-400">LCP:</span>
							<span class="font-mono {getScoreColor('lcp', performanceData.lcp)}">{formatTime(performanceData.lcp)}</span>
						</div>

						<div class="flex justify-between">
							<span class="text-gray-600 dark:text-gray-400">CLS:</span>
							<span class="font-mono {getScoreColor('cls', performanceData.cls)}">{performanceData.cls > 0 ? performanceData.cls.toFixed(3) : '测量中...'}</span>
						</div>

						<div class="flex justify-between">
							<span class="text-gray-600 dark:text-gray-400">FID:</span>
							<span class="font-mono {getScoreColor('fid', performanceData.fid)}">{formatTime(performanceData.fid)}</span>
						</div>

						<!-- 总体评分 -->
						{#if performanceData.fcp > 0 || performanceData.lcp > 0}
							{@const score = getOverallScore()}
							<div class="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-600">
								<span class="text-gray-600 dark:text-gray-400 font-semibold">总体评分:</span>
								<span class="font-mono {score.color}">{score.score}分 ({score.label})</span>
							</div>
						{/if}
					</div>
				</div>
				
				<div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
					<div class="text-xs text-gray-500 dark:text-gray-400">
						{#if performanceData.isSSR}
							✅ 服务端渲染已启用
							<br>• 更快的首屏加载
							<br>• 更好的SEO支持
							<br>• 改善的用户体验
						{:else}
							⚠️ 客户端渲染模式
							<br>• 可能影响SEO
							<br>• 首屏加载较慢
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}
