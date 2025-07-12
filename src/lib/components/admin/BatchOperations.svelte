<script lang="ts">
	import type { Todo } from '$lib/types';

	interface Props {
		selectedSubmissions: Todo[];
		onBatchApprove?: (submissions: Todo[]) => void;
		onBatchReject?: (submissions: Todo[]) => void;
		onSelectAll?: () => void;
		onClearSelection?: () => void;
		isProcessing?: boolean;
	}

	let {
		selectedSubmissions,
		onBatchApprove,
		onBatchReject,
		onSelectAll,
		onClearSelection,
		isProcessing = false,
	}: Props = $props();

	function handleBatchApprove() {
		if (selectedSubmissions.length > 0) {
			onBatchApprove?.(selectedSubmissions);
		}
	}

	function handleBatchReject() {
		if (selectedSubmissions.length > 0) {
			onBatchReject?.(selectedSubmissions);
		}
	}

	function handleSelectAll() {
		onSelectAll?.();
	}

	function handleClearSelection() {
		onClearSelection?.();
	}
</script>

{#if selectedSubmissions.length > 0}
	<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center">
				<svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				<span class="text-sm font-medium text-blue-800 dark:text-blue-200">
					已选择 {selectedSubmissions.length} 个提交
				</span>
			</div>
			
			<div class="flex items-center space-x-3">
				<!-- 批量批准 -->
				<button
					onclick={handleBatchApprove}
					disabled={isProcessing}
					class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					title="批量批准选中的提交"
				>
					{#if isProcessing}
						<svg class="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
						</svg>
						处理中
					{:else}
						<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						批量批准
					{/if}
				</button>

				<!-- 批量拒绝 -->
				<button
					onclick={handleBatchReject}
					disabled={isProcessing}
					class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					title="批量拒绝选中的提交"
				>
					{#if isProcessing}
						<svg class="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
						</svg>
						处理中
					{:else}
						<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
						批量拒绝
					{/if}
				</button>

				<!-- 全选 -->
				<button
					onclick={handleSelectAll}
					class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
					title="全选当前页面的提交"
				>
					<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
					全选
				</button>

				<!-- 清除选择 -->
				<button
					onclick={handleClearSelection}
					class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
					title="清除所有选择"
				>
					<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
					清除选择
				</button>
			</div>
		</div>
	</div>
{/if}
