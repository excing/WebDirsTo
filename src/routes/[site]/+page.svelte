<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import SiteCard from '$lib/components/SiteCard.svelte';
	import LazyImage from '$lib/components/LazyImage.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import type { Site } from '$lib/types.js';
	import type { PageData } from './$types';
	import { getFallbackFavicon, getScreenshotUrl } from '$lib/tools.js';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// 从服务端获取的数据
	const { site, relatedSites, categorySites, seoMeta, stats, breadcrumb } = data;

	// 客户端状态
	let isStarred = $state(false);
	let visitCount = $state(0);
	let showFullDescription = $state(false);
	let copySuccess = $state(false);
	let isLoading = $state(false);

	// 本地存储管理类 - 与主页面保持一致
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
			try {
				const url = new URL(siteUrl);
				console.log('记录访问: ', url);

				const counts = this.getVisitCounts();
				counts[siteUrl] = (counts[siteUrl] || 0) + 1;
				this.setVisitCounts(counts);
			} catch (error) {
				console.warn('记录访问失败:', error);
			}
		}

		// 获取单个网站访问次数
		static getVisitCount(siteUrl: string): number {
			const counts = this.getVisitCounts();
			return counts[siteUrl] || 0;
		}

		// 切换收藏状态
		static toggleStarred(siteUrl: string): boolean {
			const starred = this.getStarredSites();
			const index = starred.indexOf(siteUrl);

			if (index > -1) {
				starred.splice(index, 1);
			} else {
				starred.push(siteUrl);
			}

			this.setStarredSites(starred);
			return index === -1; // 返回新的收藏状态
		}

		// 检查是否已收藏
		static isStarred(siteUrl: string): boolean {
			return this.getStarredSites().includes(siteUrl);
		}
	}

	// 响应式状态，用于实时更新UI
	let starredSites = $state<string[]>([]);

	onMount(() => {
		if (browser) {
			// 初始化用户数据
			starredSites = LocalStorageManager.getStarredSites();
			isStarred = starredSites.includes(site.url);
			visitCount = LocalStorageManager.getVisitCount(site.url);
		}
	});

	// 处理收藏操作
	function handleToggleStarred() {
		isStarred = LocalStorageManager.toggleStarred(site.url);
		starredSites = LocalStorageManager.getStarredSites(); // 更新响应式状态
	}

	// 处理访问网站
	function handleVisitSite() {
		LocalStorageManager.recordVisit(site.url);
		visitCount = LocalStorageManager.getVisitCount(site.url);
		window.open(site.url, '_blank');
	}

	// 处理相关网站访问
	function handleRelatedSiteVisit(relatedSite: Site) {
		LocalStorageManager.recordVisit(relatedSite.url);
		window.open(relatedSite.url, '_blank');
	}

	// 处理相关网站收藏
	function handleRelatedSiteToggleStarred(relatedSite: Site) {
		LocalStorageManager.toggleStarred(relatedSite.url);
		starredSites = LocalStorageManager.getStarredSites(); // 更新响应式状态
	}

	// 检查相关网站是否已收藏
	function isRelatedSiteStarred(relatedSite: Site): boolean {
		if (!browser) return false;
		return starredSites.includes(relatedSite.url);
	}

	// 返回上一页
	function goBack() {
		if (browser && window.history.length > 1) {
			window.history.back();
		} else {
			goto('/');
		}
	}

	// 跳转到分类页面
	function goToCategory() {
		goto(`/?category=${encodeURIComponent(site.category)}`);
	}

	// 复制链接
	async function copyLink() {
		if (!browser) return;

		isLoading = true;
		try {
			await navigator.clipboard.writeText(site.url);
			copySuccess = true;
			console.log('链接已复制到剪贴板');

			// 3秒后重置成功状态
			setTimeout(() => {
				copySuccess = false;
			}, 3000);
		} catch {
			// 降级方案 - 使用现代方法
			try {
				const textArea = document.createElement('textarea');
				textArea.value = site.url;
				textArea.style.position = 'fixed';
				textArea.style.opacity = '0';
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();

				// 使用现代的 execCommand 替代方案
				const successful = document.execCommand('copy');
				document.body.removeChild(textArea);

				if (successful) {
					copySuccess = true;
					console.log('链接已复制到剪贴板（降级方案）');

					// 3秒后重置成功状态
					setTimeout(() => {
						copySuccess = false;
					}, 3000);
				} else {
					console.warn('复制失败');
				}
			} catch (fallbackError) {
				console.error('复制链接失败:', fallbackError);
			}
		} finally {
			isLoading = false;
		}
	}
</script>

<!-- SEO Meta Tags -->
<svelte:head>
	<title>{seoMeta.title}</title>
	<meta name="description" content={seoMeta.description} />
	<meta name="keywords" content={seoMeta.keywords} />

	<!-- Open Graph -->
	<meta property="og:title" content={seoMeta.ogTitle} />
	<meta property="og:description" content={seoMeta.ogDescription} />
	<meta property="og:image" content={seoMeta.ogImage} />
	<meta property="og:url" content={seoMeta.ogUrl} />
	<meta property="og:type" content="website" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seoMeta.ogTitle} />
	<meta name="twitter:description" content={seoMeta.ogDescription} />
	<meta name="twitter:image" content={seoMeta.ogImage} />

	<!-- Canonical URL -->
	<link rel="canonical" href={seoMeta.canonicalUrl} />

	<!-- Additional SEO -->
	<meta name="robots" content="index, follow" />
	<meta name="googlebot" content="index, follow" />
	<meta name="bingbot" content="index, follow" />

	<!-- Mobile Optimization -->
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />

	<!-- Structured Data -->
	<script type="application/ld+json">
		{JSON.stringify({
			"@context": "https://schema.org",
			"@type": "WebSite",
			"name": site.title,
			"url": site.url,
			"description": site.description,
			"category": site.category,
			"inLanguage": site.language,
			"isAccessibleForFree": true,
			"publisher": {
				"@type": "Organization",
				"name": "探索导航"
			}
		})}
	</script>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<!-- Header -->
	<header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
		<div class="container mx-auto px-4 py-4">
			<div class="flex items-center justify-between">
				<!-- 左侧：返回按钮和面包屑 -->
				<div class="flex items-center space-x-4">
					<button
						onclick={goBack}
						class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
						aria-label="返回"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
					</button>

					<!-- 面包屑导航 -->
					<nav class="flex items-center space-x-2 text-sm">
						<a href={breadcrumb.home.url} class="text-blue-600 dark:text-blue-400 hover:underline">
							{breadcrumb.home.name}
						</a>
						<span class="text-gray-400">/</span>
						<button onclick={goToCategory} class="text-blue-600 dark:text-blue-400 hover:underline">
							{breadcrumb.category.name}
						</button>
						<span class="text-gray-400">/</span>
						<span class="text-gray-600 dark:text-gray-400 truncate max-w-xs breadcrumb-text">
							{breadcrumb.current.name}
						</span>
					</nav>
				</div>

				<!-- 右侧：主题切换 -->
				<ThemeToggle />
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="container mx-auto px-4 py-8">
		<!-- 网站详情卡片 -->
		<div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
			<div class="md:flex">
				<!-- 左侧：网站截图 -->
				<div class="md:w-1/2">
					<LazyImage
						src={site.ogImage}
						alt="{site.title} Screenshot"
						fallback={getScreenshotUrl(site.url)}
						class="w-full h-64 md:h-full object-cover screenshot-img"
						loading="eager"
					/>
				</div>

				<!-- 右侧：网站信息 -->
				<div class="md:w-1/2 p-6 md:p-8">
					<!-- 网站标题和图标 -->
					<div class="flex items-center mb-4">
						<LazyImage
							src={site.favicon}
							alt="favicon"
							fallback={getFallbackFavicon(site.url)}
							class="w-8 h-8 mr-3 rounded-sm"
							loading="eager"
						/>
						<h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
							{site.title}
						</h1>
						{#if site.starred}
							<span class="ml-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
								置顶
							</span>
						{/if}
					</div>

					<!-- 网站描述 -->
					<div class="mb-6">
						<p class="text-gray-600 dark:text-gray-300 leading-relaxed {showFullDescription ? '' : 'line-clamp-3'}">
							{site.description}
						</p>
						{#if site.description.length > 150}
							<button
								onclick={() => showFullDescription = !showFullDescription}
								class="text-blue-600 dark:text-blue-400 text-sm mt-2 hover:underline"
							>
								{showFullDescription ? '收起' : '展开'}
							</button>
						{/if}
					</div>

					<!-- 网站信息标签 -->
					<div class="grid grid-cols-2 gap-4 mb-6 text-sm">
						<div>
							<span class="text-gray-500 dark:text-gray-400">分类：</span>
							<button onclick={goToCategory} class="text-blue-600 dark:text-blue-400 hover:underline">
								{site.category}
							</button>
						</div>
						<div>
							<span class="text-gray-500 dark:text-gray-400">语言：</span>
							<span class="text-gray-900 dark:text-white">{site.language}</span>
						</div>
						<div>
							<span class="text-gray-500 dark:text-gray-400">HTTPS：</span>
							<span class="text-{site.supportsHTTPS ? 'green' : 'red'}-600">
								{site.supportsHTTPS ? '支持' : '不支持'}
							</span>
						</div>
						<div>
							<span class="text-gray-500 dark:text-gray-400">PWA：</span>
							<span class="text-{site.supportsPWA ? 'green' : 'gray'}-600">
								{site.supportsPWA ? '支持' : '不支持'}
							</span>
						</div>
					</div>

					<!-- 标签 -->
					{#if site.tags.length > 0}
						<div class="mb-6">
							<span class="text-gray-500 dark:text-gray-400 text-sm mb-2 block">标签：</span>
							<div class="flex flex-wrap gap-2">
								{#each site.tags as tag}
									<span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
										{tag}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- 推荐语 -->
					{#if site.recommendation}
						<div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
							<p class="text-blue-800 dark:text-blue-200 italic">
								"{site.recommendation}"
							</p>
						</div>
					{/if}

					<!-- 操作按钮 -->
					<div class="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3">
						<!-- 主要操作按钮 -->
						<button
							onclick={handleVisitSite}
							class="w-full sm:flex-1 sm:min-w-32 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center touch-manipulation"
						>
							<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
							</svg>
							访问网站
						</button>

						<!-- 次要操作按钮 -->
						<div class="flex gap-3">
							<button
								onclick={handleToggleStarred}
								class="flex-1 sm:flex-none px-6 py-3 rounded-lg font-medium transition-colors border-2 flex items-center justify-center touch-manipulation {isStarred
									? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 active:bg-red-200 dark:active:bg-red-900/40'
									: 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500'}"
							>
								<svg class="w-5 h-5 sm:mr-2" fill={isStarred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
								</svg>
								<span class="hidden sm:inline">{isStarred ? '已收藏' : '收藏'}</span>
							</button>

							<button
								onclick={copyLink}
								disabled={isLoading}
								class="flex-1 sm:flex-none px-6 py-3 rounded-lg font-medium transition-colors border-2 flex items-center justify-center touch-manipulation {copySuccess
									? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
									: 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500'} {isLoading ? 'opacity-50 cursor-not-allowed' : ''}"
							>
								{#if isLoading}
									<svg class="w-5 h-5 sm:mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
								{:else if copySuccess}
									<svg class="w-5 h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
								{:else}
									<svg class="w-5 h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
									</svg>
								{/if}
								<span class="hidden sm:inline">
									{copySuccess ? '已复制' : '复制链接'}
								</span>
							</button>
						</div>
					</div>

					<!-- 访问统计 -->
					{#if visitCount > 0}
						<div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
							您已访问此网站 {visitCount} 次
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- 相关网站推荐 -->
		{#if relatedSites.length > 0}
			<section class="mb-8">
				<h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
					<svg class="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
					相关推荐
					<span class="ml-2 text-sm text-gray-500 dark:text-gray-400">({relatedSites.length})</span>
				</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{#each relatedSites as relatedSite (relatedSite.url)}
						<SiteCard
							site={relatedSite}
							onVisit={() => handleRelatedSiteVisit(relatedSite)}
							onFavorite={() => handleRelatedSiteToggleStarred(relatedSite)}
							isStarred={isRelatedSiteStarred(relatedSite)}
						/>
					{/each}
				</div>
			</section>
		{/if}

		<!-- 同分类网站 -->
		{#if categorySites.length > 0}
			<section class="mb-8">
				<h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
					<svg class="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
					</svg>
					更多{site.category}
					<span class="ml-2 text-sm text-gray-500 dark:text-gray-400">({stats.categoryCount}个)</span>
				</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{#each categorySites as categorySite (categorySite.url)}
						<SiteCard
							site={categorySite}
							onVisit={() => handleRelatedSiteVisit(categorySite)}
							onFavorite={() => handleRelatedSiteToggleStarred(categorySite)}
							isStarred={isRelatedSiteStarred(categorySite)}
						/>
					{/each}
				</div>

				{#if stats.categoryCount > categorySites.length}
					<div class="text-center mt-6">
						<button
							onclick={goToCategory}
							class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
						>
							查看全部 {stats.categoryCount} 个{site.category}网站
						</button>
					</div>
				{/if}
			</section>
		{/if}

		<!-- 网站统计信息 -->
		<section class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
			<h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">网站信息</h3>

			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
				<div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
					<div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
						{stats.totalSites}
					</div>
					<div class="text-sm text-gray-600 dark:text-gray-400">总网站数</div>
				</div>

				<div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
					<div class="text-2xl font-bold text-green-600 dark:text-green-400">
						{stats.categoryCount}
					</div>
					<div class="text-sm text-gray-600 dark:text-gray-400">同类网站</div>
				</div>

				<div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
					<div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
						{stats.relatedCount}
					</div>
					<div class="text-sm text-gray-600 dark:text-gray-400">相关推荐</div>
				</div>

				<div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
					<div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
						{visitCount}
					</div>
					<div class="text-sm text-gray-600 dark:text-gray-400">访问次数</div>
				</div>
			</div>

			<!-- 网站详细信息 -->
			<div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div>
						<span class="text-gray-500 dark:text-gray-400">网站地址：</span>
						<a href={site.url} target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline break-all">
							{site.url}
						</a>
					</div>

					{#if site.createdAt}
						<div>
							<span class="text-gray-500 dark:text-gray-400">收录时间：</span>
							<span class="text-gray-900 dark:text-white">
								{new Date(site.createdAt).toLocaleDateString('zh-CN')}
							</span>
						</div>
					{/if}

					<div>
						<span class="text-gray-500 dark:text-gray-400">年龄分级：</span>
						<span class="text-{site.ageRating === 'SFW' ? 'green' : 'red'}-600">
							{site.ageRating === 'SFW' ? '全年龄' : '18+'}
						</span>
					</div>

					<div>
						<span class="text-gray-500 dark:text-gray-400">网站状态：</span>
						<span class="text-green-600">正常运行</span>
					</div>
				</div>
			</div>
		</section>
	</main>
</div>

<style>
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* 触摸优化 */
	.touch-manipulation {
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
	}

	/* 移动端优化 */
	@media (max-width: 640px) {
		.container {
			padding-left: 1rem;
			padding-right: 1rem;
		}

		/* 确保按钮有足够的触摸区域 */
		button {
			min-height: 44px;
		}

		/* 优化面包屑在小屏幕上的显示 */
		.breadcrumb-text {
			max-width: 120px;
		}
	}

	/* 高分辨率屏幕优化 */
	@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
		:global(.screenshot-img) {
			image-rendering: -webkit-optimize-contrast;
			image-rendering: crisp-edges;
		}
	}
</style>