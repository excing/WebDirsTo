<script lang="ts">
	import type { Todo } from "$lib/types";

	interface Props {
		submission: Todo;
		isProcessing?: boolean;
		onApprove?: (submission: Todo) => void;
		onReject?: (submission: Todo) => void;
		onAnalyze?: (submission: Todo) => void;
		showDetails?: boolean;
		isSelected?: boolean;
		onSelect?: (submission: Todo, selected: boolean) => void;
		showCheckbox?: boolean;
	}

	let {
		submission,
		isProcessing = false,
		onApprove,
		onReject,
		onAnalyze,
		showDetails = true,
		isSelected = false,
		onSelect,
		showCheckbox = false,
	}: Props = $props();

	function formatDate(dateString: string | undefined): string {
		if (!dateString) return "未知";
		return new Date(dateString).toLocaleString("zh-CN");
	}

	function formatRelativeTime(dateString: string | undefined): string {
		if (!dateString) return "未知";
		const now = new Date();
		const date = new Date(dateString);
		const diffMs = now.getTime() - date.getTime();
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffHours / 24);

		if (diffDays > 0) {
			return `${diffDays}天前`;
		} else if (diffHours > 0) {
			return `${diffHours}小时前`;
		} else {
			const diffMinutes = Math.floor(diffMs / (1000 * 60));
			return diffMinutes > 0 ? `${diffMinutes}分钟前` : "刚刚";
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'pending':
				return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
			case 'approved':
				return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
			case 'rejected':
				return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
			default:
				return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
		}
	}

	function getStatusText(status: string): string {
		switch (status) {
			case 'pending':
				return '待审核';
			case 'approved':
				return '已批准';
			case 'rejected':
				return '已拒绝';
			default:
				return '未知';
		}
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

	function handleSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		onSelect?.(submission, target.checked);
	}
</script>

<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow {isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}">
	<div class="flex justify-between items-start">
		<div class="flex items-start space-x-3 flex-1 min-w-0">
			{#if showCheckbox}
				<div class="flex items-center pt-1">
					<input
						type="checkbox"
						checked={isSelected}
						onchange={handleSelect}
						class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
					/>
				</div>
			{/if}
			<div class="flex-1 min-w-0">
			<!-- 网站URL和状态 -->
			<div class="flex items-center space-x-3 mb-2">
				<h3 class="text-base font-medium text-gray-900 dark:text-white truncate">
					<a 
						href={submission.url} 
						target="_blank" 
						class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
						rel="noopener noreferrer"
						title={submission.url}
					>
						{submission.url}
					</a>
				</h3>
				<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(submission.status)}">
					{getStatusText(submission.status)}
				</span>
			</div>

			{#if showDetails}
				<!-- 详细信息 -->
				<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm text-gray-600 dark:text-gray-400">
					<div class="flex items-center space-x-1">
						<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
						</svg>
						<span class="truncate">{submission.os} / {submission.browser}</span>
					</div>
					<div class="flex items-center space-x-1">
						<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
						</svg>
						<span class="truncate">{submission.ip}</span>
					</div>
					<div class="flex items-center space-x-1">
						<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
						</svg>
						<span class="truncate">{submission.language}</span>
					</div>
					<div class="flex items-center space-x-1">
						<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						<span class="truncate" title={formatDate(submission.submittedAt)}>
							{formatRelativeTime(submission.submittedAt)}
						</span>
					</div>
				</div>
			{:else}
				<!-- 简化信息 -->
				<div class="flex items-center space-x-4 mb-2 text-sm text-gray-600 dark:text-gray-400">
					<span>{submission.os} / {submission.browser}</span>
					<span title={formatDate(submission.submittedAt)}>
						{formatRelativeTime(submission.submittedAt)}
					</span>
				</div>
			{/if}

			<!-- 提交时间详情 -->
			<p class="text-xs text-gray-500 dark:text-gray-500">
				提交于 {formatDate(submission.submittedAt)}
			</p>
			</div>
		</div>

		<!-- 操作按钮 -->
		<div class="flex flex-col gap-2 ml-4">
			{#if submission.status === 'pending'}
				<button
					onclick={handleAnalyze}
					disabled={isProcessing}
					class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					title="分析此提交"
				>
					{#if isProcessing}
						<svg class="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
						</svg>
						处理中
					{:else}
						<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
						</svg>
						分析
					{/if}
				</button>
				<button
					onclick={handleApprove}
					disabled={isProcessing}
					class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					title="批准此提交"
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
						批准
					{/if}
				</button>
				<button
					onclick={handleReject}
					disabled={isProcessing}
					class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					title="拒绝此提交"
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
						拒绝
					{/if}
				</button>
			{/if}
			<a
				href={submission.url}
				target="_blank"
				class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
				title="访问网站"
				rel="noopener noreferrer"
			>
				<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
				</svg>
				访问
			</a>
		</div>
	</div>
</div>
