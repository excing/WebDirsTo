<script lang="ts">
	import { onMount } from 'svelte';

	// 主题模式类型
	type ThemeMode = 'light' | 'dark' | 'system';

	// 当前主题模式
	let themeMode = $state<ThemeMode>('system');
	// 当前实际显示的主题（用于图标显示）
	let isDark = $state(false);
	// 系统主题偏好
	let systemPrefersDark = $state(false);

	onMount(() => {
		if (typeof window !== 'undefined') {
			// 检查本地存储的主题设置
			const stored = localStorage.getItem('color-theme') as ThemeMode | null;

			// 获取系统主题偏好
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			systemPrefersDark = mediaQuery.matches;

			// 设置初始主题模式
			if (stored && ['light', 'dark', 'system'].includes(stored)) {
				themeMode = stored;
			} else {
				themeMode = 'system';
			}

			// 应用主题
			updateTheme();

			// 监听系统主题变化
			mediaQuery.addEventListener('change', handleSystemThemeChange);

			// 清理函数
			return () => {
				mediaQuery.removeEventListener('change', handleSystemThemeChange);
			};
		}
	});

	function handleSystemThemeChange(e: MediaQueryListEvent) {
		systemPrefersDark = e.matches;
		if (themeMode === 'system') {
			updateTheme();
		}
	}

	function updateTheme() {
		if (typeof document !== 'undefined') {
			let shouldBeDark: boolean;

			switch (themeMode) {
				case 'dark':
					shouldBeDark = true;
					break;
				case 'light':
					shouldBeDark = false;
					break;
				case 'system':
				default:
					shouldBeDark = systemPrefersDark;
					break;
			}

			isDark = shouldBeDark;

			if (shouldBeDark) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	}

	function toggleTheme() {
		// 循环切换：system -> light -> dark -> system
		switch (themeMode) {
			case 'system':
				themeMode = 'light';
				break;
			case 'light':
				themeMode = 'dark';
				break;
			case 'dark':
				themeMode = 'system';
				break;
		}

		updateTheme();

		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('color-theme', themeMode);
		}
	}

	// 获取当前主题的显示文本
	function getThemeLabel(): string {
		switch (themeMode) {
			case 'light':
				return '浅色模式';
			case 'dark':
				return '深色模式';
			case 'system':
				return `跟随系统 (${systemPrefersDark ? '深色' : '浅色'})`;
			default:
				return '跟随系统';
		}
	}
</script>

<button
	onclick={toggleTheme}
	class="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
	aria-label={getThemeLabel()}
	title={getThemeLabel()}
>
	{#if themeMode === 'system'}
		<!-- 系统主题图标 -->
		<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
			<path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd"></path>
		</svg>
		<!-- 小指示器显示当前系统主题 -->
		<div class="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 {systemPrefersDark ? 'bg-gray-800' : 'bg-yellow-400'}"></div>
	{:else if themeMode === 'light'}
		<!-- 太阳图标 (浅色模式) -->
		<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
			<path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 5.05A1 1 0 003.636 6.464l.707.707a1 1 0 001.414-1.414l-.707-.707zM3 11a1 1 0 100-2H2a1 1 0 100 2h1zM6.464 16.364l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 011.414-1.414z"></path>
		</svg>
	{:else}
		<!-- 月亮图标 (深色模式) -->
		<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
			<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
		</svg>
	{/if}

	<!-- 悬停提示 -->
	<div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
		{getThemeLabel()}
		<div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
	</div>
</button>
