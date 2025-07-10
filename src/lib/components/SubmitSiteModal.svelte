<script lang="ts">
    import { API } from "$lib/client/api";

	interface Props {
		isOpen: boolean;
		hasAddToFrequentSites: boolean;
		onclose?: () => void;
		onsubmit?: (data: { url: string, hasAddToFrequentSites: boolean; successed: boolean }) => void;
	}

	let { isOpen, hasAddToFrequentSites = false, onclose, onsubmit }: Props = $props();

	// 表单状态
	let url = $state('');
	let checked = $state(true);
	let isSubmitting = $state(false);
	let error = $state('');

	// 重置表单
	function resetForm() {
		url = '';
		checked = true;
		error = '';
		isSubmitting = false;
	}

	// 关闭模态框
	function closeModal() {
		resetForm();
		onclose?.();
	}

	// 验证 URL
	function validateUrl(inputUrl: string): boolean {
		try {
			const urlObj = new URL(inputUrl);
			return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
		} catch {
			return false;
		}
	}

	// 提交表单
	async function handleSubmit(event: Event) {
		event.preventDefault();
		error = '';

		// 验证输入
		if (!url.trim()) {
			error = '请输入网址';
			return;
		}

		// 自动添加协议
		let formattedUrl = url.trim();
		if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
			formattedUrl = 'https://' + formattedUrl;
		}

		// 验证 URL 格式
		if (!validateUrl(formattedUrl)) {
			error = '请输入有效的网址';
			return;
		}

		isSubmitting = true;

		const newSubmitToBackend = hasAddToFrequentSites ? checked : true;
		const newAddToFrequentSites = hasAddToFrequentSites ? true : checked;

		try {
			// 如果选择提交到后端，调用 API
			if (newSubmitToBackend) {
				const response = await API.submitSite(formattedUrl);

				const result = await response.json();

				if (!response.ok) {
					throw new Error(result.error || '提交失败');
				}
			}

			// 触发提交事件
			onsubmit?.({
				url: formattedUrl,
				hasAddToFrequentSites: newAddToFrequentSites,
				successed: true,
			});

			// 关闭模态框
			closeModal();
		} catch (err) {
			error = err instanceof Error ? err.message : '提交失败，请稍后重试';
		} finally {
			isSubmitting = false;
		}
	}

	// 处理键盘事件
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		} else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
			handleSubmit(event);
		}
	}

	// 点击背景关闭
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}
</script>

<!-- 模态框背景 -->
{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
	>
		<!-- 模态框内容 -->
		<div
			class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100"
		>
			<!-- 头部 -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
				<h2 id="modal-title" class="text-xl font-semibold text-gray-900 dark:text-white">
					{hasAddToFrequentSites ? '添加常用网站' : '提交网站'}
				</h2>
				<button
					type="button"
					onclick={closeModal}
					class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
					aria-label="关闭"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>

			<!-- 表单内容 -->
			<form onsubmit={handleSubmit} class="p-6 space-y-4">
				<!-- 网址输入 -->
				<div>
					<label for="url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						网址 <span class="text-red-500">*</span>
					</label>
					<input
						id="url"
						type="text"
						bind:value={url}
						placeholder="https://example.com"
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
						       focus:ring-2 focus:ring-blue-500 focus:border-transparent
						       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
						       placeholder-gray-500 dark:placeholder-gray-400"
						required
						disabled={isSubmitting}
					/>
				</div>

				<!-- 提交到后端选项 -->
				<div class="flex items-center">
					<input
						id="submitToBackend"
						type="checkbox"
						bind:checked={checked}
						class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded 
						       focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 
						       focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
						disabled={isSubmitting}
					/>
					<label for="submitToBackend" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
						{hasAddToFrequentSites ? '同时提交到探索导航' : '同时添加到常用网站'}
					</label>
				</div>

				<!-- 错误信息 -->
				{#if error}
					<div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
						<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
					</div>
				{/if}

				<!-- 按钮组 -->
				<div class="flex justify-end space-x-3 pt-4">
					<button
						type="button"
						onclick={closeModal}
						class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
						       bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
						       rounded-lg transition-colors"
						disabled={isSubmitting}
					>
						取消
					</button>
					<button
						type="submit"
						class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
						       disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors
						       flex items-center space-x-2"
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
								      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
							</svg>
							<span>提交中...</span>
						{:else}
							<span>提交</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	/* 模态框动画 */
	@keyframes modalFadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.fixed {
		animation: modalFadeIn 0.2s ease-out;
	}
</style>
