<script lang="ts">
	import { APP_NAME } from '$lib/constants.js';
	import { request } from '$lib/fetch';
	import { goto } from '$app/navigation';

	interface Props {
		username?: string;
		isRefreshing?: boolean;
		isLoggingOut?: boolean;
		showBackButton?: boolean;
		backUrl?: string;
		backText?: string;
		onRefresh?: () => void;
		onLogout?: () => void;
		onBack?: () => void;
	}

	let {
		username,
		isRefreshing = false,
		isLoggingOut = false,
		showBackButton = false,
		backUrl = '/admin/dashboard',
		backText = '返回',
		onRefresh,
		onLogout,
		onBack
	}: Props = $props();

	async function handleLogout() {
		if (onLogout) {
			onLogout();
		} else {
			// 默认登出逻辑
			try {
				await request('/api/admin/auth', {
					method: 'DELETE'
				});
				goto('/admin');
			} catch (error) {
				console.error('登出失败:', error);
			}
		}
	}

	function handleRefresh() {
		if (onRefresh) {
			onRefresh();
		}
	}

	function handleBack() {
		if (onBack) {
			onBack();
		} else {
			// 默认返回逻辑
			if (typeof window !== 'undefined') {
				if (window.history.length > 1) {
					window.history.back();
				} else {
					goto(backUrl);
				}
			}
		}
	}
</script>

<nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
	<div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-12 sm:h-16">
			<div class="flex items-center min-w-0 flex-1">
				{#if showBackButton}
					<!-- 返回按钮 -->
					<button
						onclick={handleBack}
						class="mr-1 p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
						title={backText}
						aria-label={backText}
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
						</svg>
					</button>
				{/if}
				<h1 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
					{APP_NAME} 管理后台
				</h1>
			</div>

			<!-- 移动端：简化的操作区域 -->
			<div class="flex items-center space-x-2 sm:space-x-4">
				<!-- 用户信息 - 在小屏幕上隐藏 -->
				<span class="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
					欢迎，{username || '管理员'}
				</span>

				<!-- 刷新按钮 -->
				<button
					onclick={handleRefresh}
					disabled={isRefreshing}
					class="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 text-sm disabled:opacity-50 flex items-center p-1 sm:p-0"
					title="刷新数据"
				>
					<svg class="w-4 h-4 sm:mr-1 {isRefreshing ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
					</svg>
					<span class="hidden sm:inline">{isRefreshing ? '刷新中...' : '刷新'}</span>
				</button>

				<!-- 查看网站链接 -->
				<a
					href="/"
					target="_blank"
					class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm p-1 sm:p-0"
					title="查看网站"
				>
					<svg class="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
					</svg>
					<span class="hidden sm:inline">查看网站</span>
				</a>

				<!-- 登出按钮 -->
				<button
					onclick={handleLogout}
					disabled={isLoggingOut}
					class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm disabled:opacity-50 p-1 sm:p-0"
					title="登出"
				>
					<svg class="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
					</svg>
					<span class="hidden sm:inline">{isLoggingOut ? '登出中...' : '登出'}</span>
				</button>
			</div>
		</div>
	</div>
</nav>
