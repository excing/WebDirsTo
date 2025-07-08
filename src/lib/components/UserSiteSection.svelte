<script lang="ts">
	import type { Site } from '../types.js';
    import Item from './Item.svelte';
	import SiteItem from './SiteItem.svelte';

	interface Props {
		sites: Site[];
		title: string;
		icon: 'star' | 'heart' | 'trending' | 'bookmark';
		iconColor?: string;
		onVisit?: (site: Site) => void;
		onRemove?: (site: Site) => void;
		onAdd?: () => void;
		maxItems?: number;
		emptyMessage?: string;
		showEmptyState?: boolean;
		helpText?: string;
	}

	let { 
		sites, 
		title,
		icon,
		iconColor = 'text-gray-500',
		onVisit, 
		onRemove, 
		onAdd,
		maxItems,
		emptyMessage = `暂无${title}`,
		showEmptyState = false,
		helpText
	}: Props = $props();

	let showRemove = $state(false);

	// 限制显示的网站数量
	const displaySites = $derived(maxItems ? sites.slice(0, maxItems) : sites);

	// 图标 SVG 路径
	const iconPaths = {
		star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
		heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
		trending: "M23 6l-9.5 9.5-5-5L1 18",
		bookmark: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
	};

	function onAddUrl() {
		onAdd?.();
	}
</script>

{#if displaySites.length > 0}
	<section class="mb-12">
		<h2 class="flex text-2xl font-bold mb-4 flex items-center">
			<svg 
				xmlns="http://www.w3.org/2000/svg" 
				width="24" 
				height="24" 
				viewBox="0 0 24 24" 
				fill="none" 
				stroke="currentColor" 
				stroke-width="2" 
				stroke-linecap="round" 
				stroke-linejoin="round" 
				class="mr-2 {iconColor}"
			>
				<path d={iconPaths[icon]}/>
			</svg>
			{title}
			<span class="flex-1 ml-2 text-sm text-gray-500 dark:text-gray-400">({displaySites.length})</span>
			{#if onRemove}
				<!-- 为 button 添加 seo 友好, 无障碍的交互样式 -->
				<button 
					class="ml-4 px-2 py-1 rounded-sm text-sm text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 "
					onclick={() => showRemove = !showRemove}
				>
					{showRemove ? '取消' : '管理'}
				</button>
			{/if}
		</h2>
		
		<!-- 响应式网格布局 -->
		<div class="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-6">
			{#each displaySites as site (site.url)}
				<SiteItem
					{site}
					onVisit={onVisit ? () => onVisit(site) : undefined}
					onRemove={onRemove ? () => onRemove(site) : undefined}
					{showRemove}
				/>
			{/each}
			{#if onAdd}
				<button class="site-item relative group block" onclick={onAddUrl}>
					<Item>
						<div class="relative overflow-hidden py-1 rounded-sm font-bold sm:font-light text-center text-md sm:text-5xl text-gray-500 dark:text-gray-300">+</div>
					</Item>
				</button>
			{/if}
		</div>
		
		<!-- 显示更多提示 -->
		{#if maxItems && sites.length > maxItems}
			<div class="mt-4 text-center">
				<p class="text-sm text-gray-500 dark:text-gray-400">
					显示前 {maxItems} 个，共 {sites.length} 个{title}
					<!-- 显示全部 -->
					<button 
						class="text-blue-500 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
						onclick={() => maxItems = sites.length}
					>
						显示全部
					</button>
				</p>
			</div>
		{/if}
		
		<!-- 帮助文本 -->
		{#if helpText}
			<div class="mt-4 text-center">
				<p class="text-xs text-gray-400 dark:text-gray-500">
					{helpText}
				</p>
			</div>
		{/if}
	</section>
{:else if showEmptyState}
	<!-- 空状态提示 -->
	<section class="mb-12">
		<h2 class="text-2xl font-bold mb-4 flex items-center">
			<svg 
				xmlns="http://www.w3.org/2000/svg" 
				width="24" 
				height="24" 
				viewBox="0 0 24 24" 
				fill="none" 
				stroke="currentColor" 
				stroke-width="2" 
				stroke-linecap="round" 
				stroke-linejoin="round" 
				class="mr-2 {iconColor}"
			>
				<path d={iconPaths[icon]}/>
			</svg>
			{title}
			<span class="ml-2 text-sm text-gray-500 dark:text-gray-400">(0)</span>
		</h2>
		
		<div class="text-center py-8">
			<div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
				<svg 
					xmlns="http://www.w3.org/2000/svg" 
					width="32" 
					height="32" 
					viewBox="0 0 24 24" 
					fill="none" 
					stroke="currentColor" 
					stroke-width="1.5" 
					stroke-linecap="round" 
					stroke-linejoin="round" 
					class="text-gray-400"
				>
					<path d={iconPaths[icon]}/>
				</svg>
			</div>
			<p class="text-gray-500 dark:text-gray-400 mb-2">{emptyMessage}</p>
			{#if helpText}
				<p class="text-xs text-gray-400 dark:text-gray-500">
					{helpText}
				</p>
			{/if}
		</div>
	</section>
{/if}
