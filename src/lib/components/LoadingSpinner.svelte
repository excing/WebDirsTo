<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		color?: string;
		text?: string;
	}
	
	let { size = 'md', color = 'text-blue-600', text = '加载中...' }: Props = $props();
	
	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-8 h-8',
		lg: 'w-12 h-12'
	};
</script>

<div class="flex flex-col items-center justify-center p-8">
	<div class="relative">
		<div class="{sizeClasses[size]} {color} animate-spin">
			<svg class="w-full h-full" fill="none" viewBox="0 0 24 24">
				<circle 
					class="opacity-25" 
					cx="12" 
					cy="12" 
					r="10" 
					stroke="currentColor" 
					stroke-width="4"
				></circle>
				<path 
					class="opacity-75" 
					fill="currentColor" 
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		</div>
	</div>
	{#if text}
		<p class="mt-4 text-sm text-gray-600 dark:text-gray-400">{text}</p>
	{/if}
</div>
