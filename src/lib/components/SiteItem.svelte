<script lang="ts">
    import { getFallbackFavicon } from "$lib/tools.js";
    import type { Site } from "../types.js";
    import LazyImage from "./LazyImage.svelte";

    interface Props {
        site: Site;
        // 添加布局方式:垂直或水平
        layout?: "vertical" | "horizontal";
        onVisit?: (site: Site) => void;
        onFavorite?: (site: Site) => void;
        onRemove?: (site: Site) => void;
        isStarred?: boolean;
        showRemove?: boolean;
        removable?: boolean;
    }

    let {
        site,
        layout = "vertical",
        onVisit,
        onFavorite,
        onRemove,
        isStarred = false,
        showRemove = false,
        removable = false
    }: Props = $props();

    function handleVisit(event: Event) {
		event.preventDefault();
		if (onVisit) {
			onVisit(site);
		} else {
			// 默认行为：直接打开链接
			window.open(site.url, '_blank');
		}
	}

    function handleFavorite(event: Event) {
        event.preventDefault();
        event.stopPropagation();
        onFavorite?.(site);
    }

    function handleRemove(event: Event) {
        event.preventDefault();
        event.stopPropagation();
        onRemove?.(site);
    }

    function handleKeydown(event: KeyboardEvent) {
        // 支持键盘导航 - Enter 和 Space 键
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleVisit(event);
        }
    }
</script>

<!-- 仅显示网站 favicon 和标题, 以及点击跳转 -->
<a href={site.url} target="_blank" class="site-item" data-title={site.title} data-url={site.url} onclick={handleVisit}>
    <div class="flex items-center {layout === "vertical" ? "flex-col space-y-2" : "flex-row space-x-2"}">
        <!-- 使用 LazyImage 组件 -->
         <LazyImage
            src={site.favicon}
            alt="favicon"
            fallback={getFallbackFavicon(site.url)}
            class="w-6 h-6 rounded-sm rounded-gray-800 bg-white dark:bg-white"
            loading="lazy"
        />
        <!-- 标题仅显示一行,超出则。。。 -->
         {#if layout === "vertical"}
            <p class="font-bold w-full text-center truncate overflow-hidden whitespace-nowrap">{site.title}</p>
        {:else}
            <p class="font-bold flex-1 truncate overflow-hidden whitespace-nowrap">{site.title}</p>
        {/if}
    </div>
</a>
