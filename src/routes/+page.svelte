<script lang="ts">
	import { onMount } from 'svelte';
	import { browser, dev } from '$app/environment';
	import SiteCard from '$lib/components/SiteCard.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import SearchBox from '$lib/components/SearchBox.svelte';
	import PerformanceMonitor from '$lib/components/PerformanceMonitor.svelte';
	import UserSiteSection from '$lib/components/UserSiteSection.svelte';
	import type { Site } from '$lib/types.js';
	import type { PageData } from './$types';

	// 本地存储管理类
	class LocalStorageManager {
		private static STARRED_SITES_KEY = 'webdirsto_starred_sites';
		private static VISIT_COUNTS_KEY = 'webdirsto_visit_counts';

		// 获取收藏网站
		static getStarredSites(): string[] {
			if (!browser) return [];
			try {
				const stored = localStorage.getItem(this.STARRED_SITES_KEY);
				return stored ? JSON.parse(stored) : [];
			} catch {
				return [];
			}
		}

		// 保存收藏网站
		static setStarredSites(siteUrls: string[]): void {
			if (!browser) return;
			try {
				localStorage.setItem(this.STARRED_SITES_KEY, JSON.stringify(siteUrls));
			} catch (e) {
				console.warn('Failed to save starred sites:', e);
			}
		}

		// 获取访问次数
		static getVisitCounts(): Record<string, number> {
			if (!browser) return {};
			try {
				const stored = localStorage.getItem(this.VISIT_COUNTS_KEY);
				return stored ? JSON.parse(stored) : {};
			} catch {
				return {};
			}
		}

		// 保存访问次数
		static setVisitCounts(counts: Record<string, number>): void {
			if (!browser) return;
			try {
				localStorage.setItem(this.VISIT_COUNTS_KEY, JSON.stringify(counts));
			} catch (e) {
				console.warn('Failed to save visit counts:', e);
			}
		}

		// 记录网站访问
		static recordVisit(siteUrl: string): void {
			const counts = this.getVisitCounts();
			counts[siteUrl] = (counts[siteUrl] || 0) + 1;
			this.setVisitCounts(counts);
		}

		// 获取常用网站（按访问次数排序）
		static getFrequentSites(allSites: Site[], limit: number = 6): Site[] {
			const counts = this.getVisitCounts();
			return allSites
				.filter(site => counts[site.url] > 0)
				.sort((a, b) => (counts[b.url] || 0) - (counts[a.url] || 0))
				.slice(0, limit);
		}
	}

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// 从服务端获取的数据
	const { sites, starredSites, categorizedSites, stats, meta } = data;

	// 客户端状态
	let searchQuery = $state('');
	let showAdultContent = $state(false);
	let filteredSites = $state<Site[]>([]);

	// 用户数据状态
	let userStarredSites = $state<string[]>([]);
	let userFrequentSites = $state<Site[]>([]);
	let userStarredSiteObjects = $state<Site[]>([]);

	onMount(() => {
		// 只在浏览器环境中执行
		if (browser) {
			// 检查18+内容显示偏好
			showAdultContent = localStorage.getItem('show-18plus') === 'true';

			// 初始化用户数据
			initializeUserData();
			updateFilteredSites();
		}
	});

	// 初始化用户数据
	function initializeUserData() {
		// 加载收藏网站
		userStarredSites = LocalStorageManager.getStarredSites();
		userStarredSiteObjects = sites.filter(site => userStarredSites.includes(site.url));

		// 加载常用网站
		userFrequentSites = LocalStorageManager.getFrequentSites(sites, 6);

		// 调试信息
		console.log('初始化用户数据:');
		console.log('收藏网站URLs:', userStarredSites);
		console.log('收藏网站对象:', userStarredSiteObjects);
		console.log('常用网站:', userFrequentSites);
	}

	function updateFilteredSites() {
		if (!browser) return;

		filteredSites = sites.filter(site => {
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

	// 切换收藏状态
	function toggleStarred(site: Site) {
		if (!browser) return;

		const isCurrentlyStarred = userStarredSites.includes(site.url);
		console.log(`切换收藏: ${site.title} (${site.url}), 当前状态: ${isCurrentlyStarred ? '已收藏' : '未收藏'}`);

		if (isCurrentlyStarred) {
			// 取消收藏
			userStarredSites = userStarredSites.filter(url => url !== site.url);
			userStarredSiteObjects = userStarredSiteObjects.filter(s => s.url !== site.url);
			console.log('已取消收藏');
		} else {
			// 添加收藏
			userStarredSites = [...userStarredSites, site.url];
			userStarredSiteObjects = [...userStarredSiteObjects, site];
			console.log('已添加收藏');
		}

		// 保存到localStorage
		LocalStorageManager.setStarredSites(userStarredSites);
		console.log('更新后的收藏列表:', userStarredSites);
	}

	// 记录网站访问
	function handleSiteVisit(site: Site) {
		if (!browser) return;

		console.log(`访问网站: ${site.title} (${site.url})`);

		// 记录访问
		LocalStorageManager.recordVisit(site.url);

		// 更新常用网站列表
		userFrequentSites = LocalStorageManager.getFrequentSites(sites, 6);
		console.log('更新后的常用网站:', userFrequentSites);

		// 打开网站
		window.open(site.url, '_blank');
	}

	// 移除常用网站
	function removeSiteVisit(site: Site) {
		if (!browser) return;

		console.log(`移除常用网站: ${site.title} (${site.url})`);

		// 移除访问记录
		const counts = LocalStorageManager.getVisitCounts();
		delete counts[site.url];
		LocalStorageManager.setVisitCounts(counts);

		// 更新常用网站列表
		userFrequentSites = LocalStorageManager.getFrequentSites(sites, 6);
	}

	// 检查网站是否被收藏
	function isStarred(site: Site): boolean {
		return userStarredSites.includes(site.url);
	}

	function handleAdultContentToggle() {
		console.log('handleAdultContentToggle');
		
		if (!browser) return;

		console.log('showAdultContent: ', showAdultContent);

		if (!showAdultContent) {
			if (confirm('您确认已满18周岁，并希望显示成人内容吗？')) {
				showAdultContent = true;
				localStorage.setItem('show-18plus', 'true');
			}
		} else {
			showAdultContent = false;
			localStorage.setItem('show-18plus', 'false');
		}
		updateFilteredSites();
	}



</script>

<svelte:head>
	<title>{meta.title}</title>
	<meta name="description" content={meta.description} />
	<meta name="keywords" content={meta.keywords} />
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
					<SiteCard
						{site}
						onVisit={() => handleSiteVisit(site)}
						onFavorite={() => toggleStarred(site)}
						isStarred={isStarred(site)}
					/>
				{/each}
			</div>
			{#if filteredSites.length === 0}
				<div class="text-center py-12">
					<p class="text-gray-500 dark:text-gray-400">没有找到匹配的网站</p>
				</div>
			{/if}
		</section>
	{:else}
		<!-- 用户常用网站 -->
		<UserSiteSection
			sites={userFrequentSites}
			title="常用网站"
			icon="star"
			iconColor="text-orange-500"
			onVisit={handleSiteVisit}
			onRemove={removeSiteVisit}
			maxItems={2}
		/>

		<!-- 用户收藏网站 -->
		<UserSiteSection
			sites={userStarredSiteObjects}
			title="我的收藏"
			icon="heart"
			iconColor="text-red-500"
			onVisit={handleSiteVisit}
			onRemove={toggleStarred}
		/>
		<!-- 置顶推荐 - 服务端渲染 -->
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
					{#each starredSites.filter(site => showAdultContent || site.ageRating !== '18+') as site (site.url)}
						<SiteCard
							{site}
							onVisit={() => handleSiteVisit(site)}
							onFavorite={() => toggleStarred(site)}
							isStarred={isStarred(site)}
							priority={true}
						/>
					{/each}
				</div>
			</section>
		{/if}

		<!-- 分类网站 - 服务端渲染 -->
		<main>
			{#each Object.entries(categorizedSites) as [category, categorySites] (category)}
				{@const filteredCategorySites = categorySites.filter(site => showAdultContent || site.ageRating !== '18+')}
				{#if filteredCategorySites.length > 0}
					<div class="category-group mb-12">
						<h2 class="text-2xl font-bold mb-4">{category}</h2>
						<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
							{#each filteredCategorySites as site (site.url)}
								<SiteCard
									{site}
									onVisit={() => handleSiteVisit(site)}
									onFavorite={() => toggleStarred(site)}
									isStarred={isStarred(site)}
								/>
							{/each}
						</div>
					</div>
				{/if}
			{/each}
		</main>
	{/if}

	<!-- Footer -->
	<footer class="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
		<!-- 统计信息 -->
		<div class="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
			<div class="grid grid-cols-3 gap-4 text-center">
				<div>
					<div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalSites}</div>
					<div class="text-sm">收录网站</div>
				</div>
				<div>
					<div class="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalCategories}</div>
					<div class="text-sm">网站分类</div>
				</div>
				<div>
					<div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.starredCount}</div>
					<div class="text-sm">置顶推荐</div>
				</div>
			</div>
		</div>

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
					checked={showAdultContent}
					onchange={handleAdultContentToggle}
				/>
				<label for="show-18plus">显示 18+ 内容</label>
			</div>
		</div>
		<p>&copy; 2025 探索导航. All Rights Reserved.</p>
		<div><a href="/admin" target="_blank" class="hover:underline">管理员登录</a>
			|
			<a href="/api/health" target="_blank" class="hover:underline">健康检查</a>
			|
			<a href="/sitemap.xml" target="_blank" class="hover:underline">网站地图</a>
			|
			<a href="/robots.txt" target="_blank" class="hover:underline">robots.txt</a>
			|
			<a href="/api/sites" target="_blank" class="hover:underline">网站数据</a>
		</div>
	</footer>

	<!-- 性能监控组件 -->
	 {#if dev}
		 <PerformanceMonitor />
	 {/if}
</div>
