<script lang="ts">
	import type { Site } from '$lib/types';

	interface Props {
		site: Site;
		onEdit?: (site: Site) => void;
		onDelete?: (site: Site) => void;
		onToggleStar?: (site: Site) => void;
	}

	let { site, onEdit, onDelete, onToggleStar }: Props = $props();

	function handleEdit() {
		onEdit?.(site);
	}

	function handleDelete() {
		onDelete?.(site);
	}

	function handleToggleStar() {
		onToggleStar?.(site);
	}

	function formatDate(dateString: string | undefined): string {
		if (!dateString) return '未知';
		return new Date(dateString).toLocaleDateString('zh-CN');
	}

	function formatDateTime(dateString: string | undefined): string {
		if (!dateString) return '未知';
		return new Date(dateString).toLocaleString('zh-CN');
	}
</script>

<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
	<div class="flex justify-between items-start">
		<div class="flex-1 min-w-0">
			<!-- 网站标题和链接 -->
			<div class="flex items-center space-x-2 mb-2">
				{#if site.favicon}
					<img
						src={site.favicon}
						alt=""
						class="w-5 h-5 rounded-sm flex-shrink-0"
						onerror={(e) => {
							const target = e.target as HTMLImageElement;
							if (target) target.style.display = 'none';
						}}
					/>
				{/if}
				<h3 class="text-base font-medium text-gray-900 dark:text-white truncate">
					<a 
						href={site.url} 
						target="_blank" 
						class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
						rel="noopener noreferrer"
						title={site.title}
					>
						{site.title}
					</a>
				</h3>
				{#if site.starred}
					<svg class="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
					</svg>
				{/if}
			</div>

			<!-- 网站URL -->
			<p class="text-sm text-gray-500 dark:text-gray-400 truncate mb-2" title={site.url}>
				{site.url}
			</p>

			<!-- 网站描述 -->
			{#if site.description}
				<div class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3" title={site.description}>
					{@html site.description}
				</div>
			{/if}

			<!-- 标签和状态 -->
			<div class="flex items-center flex-wrap gap-2 mb-3">
				<!-- 分类标签 -->
				{#if site.category}
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
						{site.category}
					</span>
				{/if}

				<!-- 语言标签 -->
				{#if site.language}
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
						{site.language}
					</span>
				{/if}

				<!-- 年龄分级标签 -->
				{#if site.ageRating === '18+'}
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
						18+
					</span>
				{/if}

				<!-- 推荐级别标签 -->
				{#if site.recommendation && site.recommendation !== 'None'}
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
						{site.recommendation}
					</span>
				{/if}

				<!-- 功能支持标签 -->
				{#if site.supportsHTTPS}
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
						HTTPS
					</span>
				{/if}

				{#if site.supportsPWA}
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
						PWA
					</span>
				{/if}
			</div>

			<!-- 网站标签 -->
			{#if site.tags && site.tags.length > 0}
				<div class="flex items-center flex-wrap gap-1 mb-3">
					{#each site.tags.slice(0, 5) as tag}
						<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
							#{tag}
						</span>
					{/each}
					{#if site.tags.length > 5}
						<span class="text-xs text-gray-500 dark:text-gray-400">+{site.tags.length - 5} 更多</span>
					{/if}
				</div>
			{/if}

			<!-- 时间信息 -->
			<div class="flex items-center space-x-4 text-xs text-gray-400 dark:text-gray-500">
				<span title={formatDateTime(site.createdAt)}>
					<svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
					创建于 {formatDate(site.createdAt)}
				</span>
			</div>
		</div>

		<!-- 操作按钮 -->
		<div class="flex flex-col gap-2 ml-4">
			<button
				onclick={handleToggleStar}
				class="inline-flex items-center px-3 py-1.5 text-xs font-medium {site.starred 
					? 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30' 
					: 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'} rounded transition-colors"
				title={site.starred ? '取消置顶' : '设为置顶'}
			>
				<svg class="w-3 h-3 mr-1" fill={site.starred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
				</svg>
				{site.starred ? '取消置顶' : '置顶'}
			</button>
			<button
				onclick={handleEdit}
				class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
				title="编辑网站信息"
			>
				<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
				</svg>
				编辑
			</button>
			<button
				onclick={handleDelete}
				class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
				title="删除网站"
			>
				<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
				</svg>
				删除
			</button>
		</div>
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
