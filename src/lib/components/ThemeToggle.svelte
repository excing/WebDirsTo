<script lang="ts">
	import { onMount } from 'svelte';
	
	let isDark = $state(false);
	
	onMount(() => {
		// 检查本地存储或系统偏好
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('color-theme');
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			
			isDark = stored === 'dark' || (!stored && prefersDark);
			updateTheme();
		}
	});
	
	function updateTheme() {
		if (typeof document !== 'undefined') {
			if (isDark) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	}
	
	function toggleTheme() {
		isDark = !isDark;
		updateTheme();
		
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
		}
	}
</script>

<button 
	onclick={toggleTheme}
	class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
	aria-label="切换主题"
>
	{#if isDark}
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
</button>
