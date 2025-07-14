<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface SystemStatus {
		uptime: number;
		memoryUsage: number;
		connectionStatus: 'online' | 'offline';
		lastUpdate: string;
		apiResponseTime: number;
		githubStatus: 'connected' | 'error' | 'checking';
		geminiStatus: 'connected' | 'error' | 'checking';
	}

	let systemStatus = $state<SystemStatus>({
		uptime: 0,
		memoryUsage: 0,
		connectionStatus: 'online',
		lastUpdate: new Date().toISOString(),
		apiResponseTime: 0,
		githubStatus: 'checking',
		geminiStatus: 'checking'
	});

	let isRefreshing = $state(false);

	// 格式化时间
	function formatUptime(seconds: number): string {
		const days = Math.floor(seconds / 86400);
		const hours = Math.floor((seconds % 86400) / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		
		if (days > 0) {
			return `${days}天 ${hours}小时`;
		} else if (hours > 0) {
			return `${hours}小时 ${minutes}分钟`;
		} else {
			return `${minutes}分钟`;
		}
	}

	// 格式化内存使用
	function formatMemory(bytes: number): string {
		const mb = bytes / (1024 * 1024);
		return `${mb.toFixed(1)} MB`;
	}

	// 检查API响应时间
	async function checkApiResponseTime(): Promise<number> {
		const startTime = performance.now();
		try {
			const response = await fetch('/api/admin/sites', {
				method: 'HEAD'
			});
			const endTime = performance.now();
			return Math.round(endTime - startTime);
		} catch (error) {
			return -1;
		}
	}

	// 检查GitHub连接状态
	async function checkGitHubStatus(): Promise<'connected' | 'error'> {
		try {
			const response = await fetch('/api/admin/sites');
			if (response.ok) {
				return 'connected';
			} else {
				return 'error';
			}
		} catch (error) {
			return 'error';
		}
	}

	// 检查Gemini状态
	async function checkGeminiStatus(): Promise<'connected' | 'error'> {
		try {
			// 这里可以添加一个专门的Gemini健康检查端点
			// 暂时使用分析API作为代理检查
			const response = await fetch('/api/analyze-site', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ url: 'https://example.com' })
			});
			// 即使返回错误，只要能连接到服务就算正常
			return 'connected';
		} catch (error) {
			return 'error';
		}
	}

	// 更新系统状态
	async function updateSystemStatus() {
		if (!browser) return;
		
		isRefreshing = true;
		
		try {
			// 更新基本信息
			systemStatus.lastUpdate = new Date().toISOString();
			
			// 检查内存使用（如果支持）
			if ('memory' in performance) {
				const memInfo = (performance as any).memory;
				systemStatus.memoryUsage = memInfo.usedJSHeapSize;
			}
			
			// 检查网络状态
			systemStatus.connectionStatus = navigator.onLine ? 'online' : 'offline';
			
			// 检查API响应时间
			systemStatus.apiResponseTime = await checkApiResponseTime();
			
			// 检查外部服务状态
			const [githubStatus, geminiStatus] = await Promise.all([
				checkGitHubStatus(),
				checkGeminiStatus()
			]);
			
			systemStatus.githubStatus = githubStatus;
			systemStatus.geminiStatus = geminiStatus;
			
		} catch (error) {
			console.error('更新系统状态失败:', error);
		} finally {
			isRefreshing = false;
		}
	}

	// 获取状态颜色
	function getStatusColor(status: string): string {
		switch (status) {
			case 'connected':
			case 'online':
				return 'text-green-600 dark:text-green-400';
			case 'error':
			case 'offline':
				return 'text-red-600 dark:text-red-400';
			case 'checking':
				return 'text-yellow-600 dark:text-yellow-400';
			default:
				return 'text-gray-600 dark:text-gray-400';
		}
	}

	// 获取状态文本
	function getStatusText(status: string): string {
		switch (status) {
			case 'connected':
				return '正常';
			case 'online':
				return '在线';
			case 'error':
				return '错误';
			case 'offline':
				return '离线';
			case 'checking':
				return '检查中';
			default:
				return '未知';
		}
	}

	onMount(() => {
		// 初始化系统状态
		updateSystemStatus();
		
		// 设置定时更新
		// const interval = setInterval(updateSystemStatus, 30000); // 每30秒更新一次
		
		// 监听网络状态变化
		const handleOnline = () => {
			systemStatus.connectionStatus = 'online';
			updateSystemStatus();
		};
		const handleOffline = () => {
			systemStatus.connectionStatus = 'offline';
		};
		
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);
		
		return () => {
			// clearInterval(interval);
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});
</script>

<div class="bg-white dark:bg-gray-800 shadow rounded-lg">
	<div class="px-4 py-4 sm:px-6 sm:py-5">
		<div class="flex justify-between items-center mb-4">
			<h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
				系统状态监控
			</h3>
			<button
				onclick={updateSystemStatus}
				disabled={isRefreshing}
				class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if isRefreshing}
					<svg class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
					</svg>
					刷新中
				{:else}
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
					</svg>
					刷新
				{/if}
			</button>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<!-- 网络状态 -->
			<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<svg class="w-5 h-5 mr-2 {getStatusColor(systemStatus.connectionStatus)}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
						</svg>
						<span class="text-sm font-medium text-gray-900 dark:text-white">网络状态</span>
					</div>
					<span class="text-sm font-medium {getStatusColor(systemStatus.connectionStatus)}">
						{getStatusText(systemStatus.connectionStatus)}
					</span>
				</div>
			</div>

			<!-- API响应时间 -->
			<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<svg class="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
						</svg>
						<span class="text-sm font-medium text-gray-900 dark:text-white">API响应</span>
					</div>
					<span class="text-sm font-medium text-gray-900 dark:text-white">
						{systemStatus.apiResponseTime > 0 ? `${systemStatus.apiResponseTime}ms` : '错误'}
					</span>
				</div>
			</div>

			<!-- 内存使用 -->
			{#if systemStatus.memoryUsage > 0}
				<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<svg class="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
							</svg>
							<span class="text-sm font-medium text-gray-900 dark:text-white">内存使用</span>
						</div>
						<span class="text-sm font-medium text-gray-900 dark:text-white">
							{formatMemory(systemStatus.memoryUsage)}
						</span>
					</div>
				</div>
			{/if}

			<!-- GitHub状态 -->
			<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<svg class="w-5 h-5 mr-2 {getStatusColor(systemStatus.githubStatus)}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
						</svg>
						<span class="text-sm font-medium text-gray-900 dark:text-white">GitHub</span>
					</div>
					<span class="text-sm font-medium {getStatusColor(systemStatus.githubStatus)}">
						{getStatusText(systemStatus.githubStatus)}
					</span>
				</div>
			</div>

			<!-- Gemini状态 -->
			<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<svg class="w-5 h-5 mr-2 {getStatusColor(systemStatus.geminiStatus)}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
						</svg>
						<span class="text-sm font-medium text-gray-900 dark:text-white">Gemini AI</span>
					</div>
					<span class="text-sm font-medium {getStatusColor(systemStatus.geminiStatus)}">
						{getStatusText(systemStatus.geminiStatus)}
					</span>
				</div>
			</div>

			<!-- 最后更新时间 -->
			<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<svg class="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						<span class="text-sm font-medium text-gray-900 dark:text-white">最后更新</span>
					</div>
					<span class="text-sm text-gray-600 dark:text-gray-400">
						{new Date(systemStatus.lastUpdate).toLocaleTimeString('zh-CN')}
					</span>
				</div>
			</div>
		</div>
	</div>
</div>
