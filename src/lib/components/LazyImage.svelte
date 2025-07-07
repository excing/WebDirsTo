<script lang="ts">
	import { onMount } from "svelte";
	import { browser } from "$app/environment";

	interface Props {
		src: string;
		alt: string;
		fallback: string;
		class?: string;
		loading?: "lazy" | "eager";
	}

	let {
		src,
		alt,
		fallback,
		class: className = "",
		loading = "lazy",
	}: Props = $props();

	let imgElement: HTMLImageElement;
	let lazyImage: HTMLDivElement;
	let isLoaded = $state(false);
	let hasError = $state(false);
	let currentSrc = $state(src);

	onMount(() => {
		if (!browser) return;

		// 使用Intersection Observer实现懒加载
		if (loading === "lazy" && "IntersectionObserver" in window) {
			const observer = new IntersectionObserver(
				([entry]) => {
					if (entry.isIntersecting) {
						loadImage();
						observer.unobserve(lazyImage);
					}
				},
				{
					root: null,
					threshold: 0.1,
				},
			);

			if (lazyImage) {
				observer.observe(lazyImage);
			}

			return () => {
				if (lazyImage) {
					observer.unobserve(lazyImage);
				}
			};
		} else {
			// 如果不支持IntersectionObserver或设置为eager，直接加载
			loadImage();
		}
	});

	function loadImage() {
		if (hasError) return;
		console.log("load image: ", src);

		const img = imgElement;
		img.onload = () => {
			isLoaded = true;
		};
		img.onerror = () => {
			hasError = true;
			currentSrc = fallback;
			img.src = fallback;
		};
		img.src = src;
	}

	function handleImageError() {
		if (!hasError) {
			hasError = true;
			currentSrc = fallback;
		}
	}
</script>

<div class="relative overflow-hidden {className}" bind:this={lazyImage}>
	{#if !isLoaded && !hasError}
		<!-- 加载占位符 -->
		<div
			class="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center"
		>
			<svg
				class="w-8 h-8 text-gray-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
				></path>
			</svg>
		</div>
	{/if}

	<img
		bind:this={imgElement}
		{alt}
		class="w-full h-full object-cover transition-opacity duration-300 {isLoaded ||
		hasError
			? 'opacity-100'
			: 'opacity-0'}"
		onerror={handleImageError}
		{loading}
	/>
</div>
