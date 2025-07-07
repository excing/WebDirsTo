<script lang="ts">
	import type { Site } from '../types.js';
	
	interface Props {
		site: Site;
		onFavorite?: (site: Site) => void;
	}
	
	let { site, onFavorite }: Props = $props();
	
	let isFavorited = $state(false);
	
	function handleFavorite(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		isFavorited = !isFavorited;
		onFavorite?.(site);
	}
	
	function getScreenshotUrl(url: string): string {
		return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&embed=screenshot.url`;
	}
	
	function getFallbackImage(title: string): string {
		return `https://placehold.co/600x400/333/fff?text=${encodeURIComponent(title)}`;
	}

	function handleImageError(event: Event) {
		const img = event.target as HTMLImageElement;
		img.src = getFallbackImage(site.title);
	}
</script>

<div class="site-card" data-title={site.title} data-tags={site.tags.join(',')}>
	<div class="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl dark:shadow-gray-950/50 transition-all duration-300 overflow-hidden group relative">
		<img
			class="screenshot-img w-full"
			src={getScreenshotUrl(site.url)}
			alt="{site.title} Screenshot"
			onerror={handleImageError}
		/>
		<div class="p-4">
			<div class="flex items-center mb-2">
				<img src={site.favicon} class="w-5 h-5 mr-2 rounded-sm" alt="favicon" />
				<a 
					href={site.url} 
					target="_blank"
					class="font-bold text-lg text-gray-900 dark:text-white stretched-link"
				>
					{site.title}
				</a>
			</div>
			<p class="text-sm text-gray-600 dark:text-gray-400 truncate">{site.description}</p>
		</div>
		<button
			onclick={handleFavorite}
			class="favorite-btn absolute top-2 right-2 p-2 bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-full text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity z-10"
			aria-label={isFavorited ? '取消收藏' : '收藏网站'}
		>
			<svg 
				xmlns="http://www.w3.org/2000/svg" 
				width="20" 
				height="20" 
				viewBox="0 0 24 24"
				fill={isFavorited ? 'currentColor' : 'none'}
				stroke="currentColor" 
				stroke-width="2" 
				stroke-linecap="round"
				stroke-linejoin="round"
				class={isFavorited ? 'text-red-500' : ''}
			>
				<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
			</svg>
		</button>
	</div>
</div>
