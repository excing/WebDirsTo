<script lang="ts">
	import type { Site } from '$lib/types';

	interface Props {
		site: Site;
		onEdit?: (site: Site) => void;
		onDelete?: (site: Site) => void;
	}

	let { site, onEdit, onDelete }: Props = $props();

	function handleEdit() {
		onEdit?.(site);
	}

	function handleDelete() {
		onDelete?.(site);
	}

	function formatDate(dateString: string | undefined): string {
		if (!dateString) return '未知';
		return new Date(dateString).toLocaleString('zh-CN');
	}
</script>

<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
	<div class="flex justify-between items-start">
		<div class="flex-1 min-w-0">
			<!-- 网站标题和链接 -->
			<div class="flex items-center space-x-2 mb-1">
				{#if site.favicon}
					<img
						src={site.favicon}
						alt=""
						class="w-4 h-4 rounded-sm flex-shrink-0"
						onerror={(e) => {
							const target = e.target as HTMLImageElement;
							if (target) target.style.display = 'none';
						}}
					/>
				{/if}
				<p class="text-sm font-medium text-gray-900 dark:text-white truncate">
					<a 
						href={site.url} 
						target="_blank" 
						class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
						rel="noopener noreferrer"
						title={site.title}
					>
						{site.title}
					</a>
				</p>
			</div>

			<!-- 网站URL -->
			<p class="text-xs text-gray-500 dark:text-gray-400 truncate mb-2" title={site.url}>
				{site.url}
			</p>

			<!-- 网站描述 -->
			{#if site.description}
				<p class="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2" title={site.description}>
					{site.description}
				</p>
			{/if}

			<!-- 标签和状态 -->
			<div class="flex items-center flex-wrap gap-1 mb-2">
				<!-- 分类标签 -->
				{#if site.category}
					<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
						<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
						</svg>
						{site.category}
					</span>
				{/if}

				<!-- 置顶标签 -->
				{#if site.starred}
					<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
						<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
						</svg>
						置顶
					</span>
				{/if}

				<!-- 年龄分级标签 -->
				{#if site.ageRating === '18+'}
					<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
						<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
						</svg>
						18+
					</span>
				{/if}

				<!-- 推荐级别标签 -->
				{#if site.recommendation && site.recommendation !== 'None'}
					<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
						<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
						</svg>
						{site.recommendation}
					</span>
				{/if}

				<!-- 功能支持标签 -->
				{#if site.supportsHTTPS}
					<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
						<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
						</svg>
						HTTPS
					</span>
				{/if}

				{#if site.supportsPWA}
					<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
						<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
						</svg>
						PWA
					</span>
				{/if}
			</div>

			<!-- 创建时间 -->
			<p class="text-xs text-gray-400 dark:text-gray-500">
				<svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				创建于 {formatDate(site.createdAt)}
			</p>
		</div>

		<!-- 操作按钮 -->
		<div class="flex flex-col space-y-1 ml-3">
			<button
				onclick={handleEdit}
				class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
				title="编辑网站信息"
			>
				<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
				</svg>
				编辑
			</button>
			<button
				onclick={handleDelete}
				class="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
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
