<script lang="ts">
    import { getFallbackFavicon } from "$lib/tools.js";
    import type { Site } from "../types.js";
    import LazyImage from "./LazyImage.svelte";

    interface Props {
        site: Site;
        // 添加布局方式:垂直或水平
        layout?: "vertical" | "horizontal";
        // 是否显示移除按钮
        showRemove?: boolean;
        onVisit?: (site: Site) => void;
        onRemove?: (site: Site) => void;
    }

    let {
        site,
        layout = "vertical",
        showRemove = false,
        onVisit,
        onRemove,
    }: Props = $props();

    function handleVisit(event: Event) {
        if (showRemove) {
            handleRemove(event);
            return;
        }
		event.preventDefault();
		if (onVisit) {
			onVisit(site);
		} else {
			// 默认行为：直接打开链接
			window.open(site.url, '_blank');
		}
	}

	function handleRemove(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		onRemove?.(site);
	}

</script>

<!-- 仅显示网站 favicon 和标题, 以及点击跳转 -->
<!-- 右上角显示移除按钮(减号样式), 点击后通知调用者 -->
<div class="site-item relative group" data-title={site.title} data-url={site.url}>
    <a href={site.url} target="_blank" onclick={handleVisit} class="block">
        <div class="flex items-center px-1 py-3 rounded-lg transition-all duration-200
                   bg-white dark:bg-gray-800
                   hover:bg-gray-50 dark:hover:bg-gray-700
                   hover:shadow-md dark:hover:shadow-gray-900/50
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                   border border-gray-200 dark:border-gray-700
                   hover:border-gray-300 dark:hover:border-gray-600 {layout === "vertical" ? "flex-col space-y-2" : "flex-row space-x-2"}">
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
                <p class="font-bold w-full text-center truncate overflow-hidden whitespace-nowrap hidden sm:block">{site.title}</p>
            {:else}
                <p class="font-bold flex-1 truncate overflow-hidden whitespace-nowrap hidden sm:block">{site.title}</p>
            {/if}
        </div>
    </a>

    <!-- 移除按钮 - 右上角显示 -->
    {#if onRemove}
        <button
            onclick={handleRemove}
            class="remove-btn absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full
                   transition-opacity duration-200
                   flex items-center justify-center text-xs font-bold
                   focus:outline-none focus:ring-2 focus:ring-red-500
                   z-10 {showRemove ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}"
            aria-label="移除 {site.title}"
            title="移除 {site.title}"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"/>
            </svg>
        </button>
    {/if}
</div>
