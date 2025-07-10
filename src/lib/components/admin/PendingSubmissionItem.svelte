<script lang="ts">
	import type { Todo } from "$lib/types";

	interface Props {
		submission: Todo;
		isProcessing?: boolean;
		onApprove?: (submission: Todo) => void;
		onReject?: (submission: Todo) => void;
		onAnalyze?: (submission: Todo) => void;
	}

	let {
		submission,
		isProcessing = false,
		onApprove,
		onReject,
		onAnalyze,
	}: Props = $props();

	function formatDate(dateString: string | undefined): string {
		if (!dateString) return "未知";
		return new Date(dateString).toLocaleString("zh-CN");
	}

	function handleApprove() {
		onApprove?.(submission);
	}

	function handleReject() {
		onReject?.(submission);
	}

	function handleAnalyze() {
		onAnalyze?.(submission);
	}
</script>

<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
	<div class="space-y-2">
		<div class="flex justify-between items-start">
			<div class="flex-1 min-w-0">
				<p
					class="text-sm font-medium text-gray-900 dark:text-white truncate"
				>
					<a
						href={submission.url}
						target="_blank"
						class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
						rel="noopener noreferrer"
					>
						{submission.url}
					</a>
				</p>
				<div class="flex items-center space-x-3 mt-1">
					<p class="text-xs text-gray-500 dark:text-gray-400">
						<svg
							class="w-3 h-3 inline"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
						{formatDate(submission.submittedAt)}
					</p>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						<svg
							class="w-3 h-3 inline"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							></path>
						</svg>
						{submission.os} / {submission.browser}
					</p>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						<svg
							class="w-3 h-3 inline"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
							></path>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
							></path>
						</svg>
						{submission.ip}
					</p>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						<svg
							class="w-3 h-3 inline"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
							></path>
						</svg>
						{submission.language}
					</p>
				</div>
			</div>
		</div>
		<div class="flex space-x-2">
			<button
				onclick={handleAnalyze}
				disabled={isProcessing}
				class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				title="分析此提交"
			>
				<svg
					class="w-3 h-3 mr-1"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					></path>
				</svg>
				分析
			</button>
			<button
				onclick={handleApprove}
				disabled={isProcessing}
				class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				title="批准此提交"
			>
				{#if isProcessing}
					<svg
						class="w-3 h-3 mr-1 animate-spin"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						></path>
					</svg>
					处理中...
				{:else}
					<svg
						class="w-3 h-3 mr-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						></path>
					</svg>
					批准
				{/if}
			</button>
			<button
				onclick={handleReject}
				disabled={isProcessing}
				class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				title="拒绝此提交"
			>
				{#if isProcessing}
					<svg
						class="w-3 h-3 mr-1 animate-spin"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						></path>
					</svg>
					处理中...
				{:else}
					<svg
						class="w-3 h-3 mr-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
					拒绝
				{/if}
			</button>
			<a
				href={submission.url}
				target="_blank"
				class="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
				title="访问网站"
				rel="noopener noreferrer"
			>
				<svg
					class="w-3 h-3 mr-1"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
					></path>
				</svg>
				访问
			</a>
		</div>
	</div>
</div>
