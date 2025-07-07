<script lang="ts">
	import { onMount } from 'svelte';
	import SiteCard from '$lib/components/SiteCard.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import SearchBox from '$lib/components/SearchBox.svelte';
	import { sampleSites } from '$lib/data.js';
	import type { Site } from '$lib/types.js';

	let searchQuery = $state('');
	let showAdultContent = $state(false);
	let filteredSites = $state<Site[]>([]);

	// 分组网站数据
	let starredSites = $derived(sampleSites.filter(site => site.starred));
	let categorizedSites = $derived(() => {
		const categories: Record<string, Site[]> = {};
		sampleSites.filter(site => !site.starred).forEach(site => {
			if (!categories[site.category]) {
				categories[site.category] = [];
			}
			categories[site.category].push(site);
		});
		return categories;
	});

	onMount(() => {
		// 检查18+内容显示偏好
		if (typeof localStorage !== 'undefined') {
			showAdultContent = localStorage.getItem('show-18plus') === 'true';
		}
		updateFilteredSites();
	});

	function updateFilteredSites() {
		filteredSites = sampleSites.filter(site => {
			// 年龄分级过滤
			if (site.ageRating === '18+' && !showAdultContent) {
				return false;
			}

			// 搜索过滤
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				return (
					site.title.toLowerCase().includes(query) ||
					site.description.toLowerCase().includes(query) ||
					site.tags.some(tag => tag.toLowerCase().includes(query))
				);
			}

			return true;
		});
	}

	function handleSearch(query: string) {
		searchQuery = query;
		updateFilteredSites();
	}

	function handleAdultContentToggle() {
		if (!showAdultContent) {
			if (confirm('您确认已满18周岁，并希望显示成人内容吗？')) {
				showAdultContent = true;
				if (typeof localStorage !== 'undefined') {
					localStorage.setItem('show-18plus', 'true');
				}
			}
		} else {
			showAdultContent = false;
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('show-18plus', 'false');
			}
		}
		updateFilteredSites();
	}

	function handleFavorite(site: Site) {
		// 在实际应用中，这里会保存到localStorage或发送到服务器
		console.log('收藏网站:', site.title);
	}
</script>

<svelte:head>
	<title>探索导航 - 您的个性化上网主页</title>
</svelte:head>

<div class="min-h-screen container mx-auto px-4 py-8">
	<!-- Header -->
	<header class="flex flex-col md:flex-row justify-between items-center mb-8">
		<h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
			探索导航
		</h1>
		<div class="w-full md:w-auto flex items-center space-x-2">
			<SearchBox onSearch={handleSearch} />
			<ThemeToggle />
		</div>
	</header>

	{#if searchQuery}
		<!-- 搜索结果 -->
		<section class="mb-12">
			<h2 class="text-2xl font-bold mb-4">搜索结果 ({filteredSites.length})</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
				{#each filteredSites as site (site.url)}
					<SiteCard {site} onFavorite={handleFavorite} />
				{/each}
			</div>
			{#if filteredSites.length === 0}
				<div class="text-center py-12">
					<p class="text-gray-500 dark:text-gray-400">没有找到匹配的网站</p>
				</div>
			{/if}
		</section>
	{:else}
		<!-- 置顶推荐 -->
		{#if starredSites.length > 0}
			<section class="mb-12">
				<h2 class="text-2xl font-bold mb-4 flex items-center">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
						stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
						class="text-yellow-400 mr-2">
						<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
					</svg>
					置顶推荐
				</h2>
				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
					{#each starredSites as site (site.url)}
						<SiteCard {site} onFavorite={handleFavorite} />
					{/each}
				</div>
			</section>
		{/if}

		<!-- 分类网站 -->
		<main>
			{#each Object.entries(categorizedSites) as [category, sites] (category)}
				<div class="category-group mb-12">
					<h2 class="text-2xl font-bold mb-4">{category}</h2>
					<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
						{#each sites.filter((site: Site) => showAdultContent || site.ageRating !== '18+') as site (site.url)}
							<SiteCard {site} onFavorite={handleFavorite} />
						{/each}
					</div>
				</div>
			{/each}
		</main>
	{/if}

	<!-- Footer -->
	<footer class="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
		<div class="flex justify-center items-center space-x-4 mb-4">
			<button
				class="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
			>
				提交网站
			</button>
			<div class="flex items-center space-x-2">
				<input
					type="checkbox"
					id="show-18plus"
					class="rounded"
					bind:checked={showAdultContent}
					onchange={handleAdultContentToggle}
				/>
				<label for="show-18plus">显示 18+ 内容</label>
			</div>
		</div>
		<p>&copy; 2025 探索导航. All Rights Reserved.</p>
		<p><a href="/admin" class="hover:underline">管理员登录</a></p>
	</footer>
</div>
