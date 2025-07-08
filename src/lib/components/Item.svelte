<script lang="ts">
    export let layout: "vertical" | "horizontal" = "vertical";
</script>

<div
    class="flex items-center px-1 py-3 rounded-lg transition-all duration-200
						bg-white dark:bg-gray-800
						hover:bg-gray-50 dark:hover:bg-gray-700
						hover:shadow-md dark:hover:shadow-gray-900/50
						focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
						border border-gray-200 dark:border-gray-700
						hover:border-gray-300 dark:hover:border-gray-600 {layout === 'vertical'
        ? 'flex-col space-y-2'
        : 'flex-row space-x-2'}"
>
    <slot />
</div>
