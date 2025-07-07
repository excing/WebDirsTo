<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	let performanceData = $state({
		loadTime: 0,
		renderTime: 0,
		hydrationTime: 0,
		isSSR: false
	});
	
	let showDetails = $state(false);
	
	onMount(() => {
		if (!browser) return;
		
		// 检测是否为服务端渲染
		performanceData.isSSR = document.documentElement.hasAttribute('data-sveltekit-hydrated');
		
		// 获取性能指标
		if ('performance' in window && performance.timing) {
			const timing = performance.timing;
			performanceData.loadTime = timing.loadEventEnd - timing.navigationStart;
			performanceData.renderTime = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;
		}
		
		// 监听水合完成事件
		const hydrationStart = Date.now();
		const checkHydration = () => {
			if (document.documentElement.hasAttribute('data-sveltekit-hydrated')) {
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
