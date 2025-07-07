<script lang="ts">
	interface Props {
		value?: string;
		onSearch?: (query: string) => void;
		placeholder?: string;
	}
	
	let { value = '', onSearch, placeholder = '搜索网站...' }: Props = $props();
	
	let searchQuery = $state(value);
	
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;
		onSearch?.(searchQuery);
	}
</script>

<div class="relative w-full md:w-64">
	<input 
		type="search" 
		bind:value={searchQuery}
		oninput={handleInput}
		{placeholder}
		class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
	/>
	<svg 
		class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
		xmlns="http://www.w3.org/2000/svg" 
		fill="none" 
		viewBox="0 0 24 24" 
		stroke="currentColor"
	>
		<path 
			stroke-linecap="round" 
			stroke-linejoin="round" 
			stroke-width="2"
			d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
		/>
	</svg>
</div>
