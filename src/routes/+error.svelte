<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	
	// 获取错误信息
	$: error = $page.error;
	$: status = $page.status;
	
	function getErrorMessage(status: number): string {
		switch (status) {
			case 404:
				return '页面未找到';
			case 500:
				return '服务器内部错误';
			case 503:
				return '服务暂时不可用';
			default:
				return '发生了未知错误';
		}
	}
	
	function getErrorDescription(status: number): string {
		switch (status) {
			case 404:
				return '您访问的页面不存在，可能已被删除或移动。';
			case 500:
				return '服务器遇到了问题，我们正在努力修复。';
			case 503:
				return '服务器正在维护中，请稍后再试。';
			default:
				return '请刷新页面重试，如果问题持续存在，请联系我们。';
		}
	}
	
	function goHome() {
		if (browser) {
			window.location.href = '/';
		}
	}
	
	function goBack() {
		if (browser) {
			window.history.back();
		}
	}
</script>

<svelte:head>
	<title>{status} - {getErrorMessage(status)} | 探索导航</title>
	<meta name="description" content="页面加载出现错误，请返回首页继续浏览。" />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
	<div class="max-w-md w-full text-center">
		<!-- 错误图标 -->
		<div class="mb-8">
			<div class="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
				<svg class="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
				</svg>
			</div>
		</div>
		
		<!-- 错误信息 -->
		<div class="mb-8">
			<h1 class="text-6xl font-bold text-gray-900 dark:text-white mb-4">{status}</h1>
			<h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
				{getErrorMessage(status)}
			</h2>
			<p class="text-gray-600 dark:text-gray-400 leading-relaxed">
				{getErrorDescription(status)}
			</p>
		</div>
		
		<!-- 错误详情（开发环境） -->
		{#if error && browser && import.meta.env.DEV}
			<div class="mb-8 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-left">
				<h3 class="font-semibold text-red-800 dark:text-red-400 mb-2">错误详情 (开发模式)</h3>
				<pre class="text-sm text-red-700 dark:text-red-300 overflow-auto">{error.message || error}</pre>
			</div>
		{/if}
		
		<!-- 操作按钮 -->
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<button
				onclick={goHome}
				class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
			>
				返回首页
			</button>
			<button
				onclick={goBack}
				class="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
			>
				返回上页
			</button>
		</div>
		
		<!-- 帮助链接 -->
		<div class="mt-8 text-sm text-gray-500 dark:text-gray-400">
			<p>需要帮助？ <a href="mailto:support@example.com" class="text-blue-600 dark:text-blue-400 hover:underline">联系我们</a></p>
		</div>
	</div>
</div>
