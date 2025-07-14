<script lang="ts">
	import type { Site } from "$lib/types";
	import { API } from "$lib/client/api";

	interface Props {
		site?: Site | null;
		categories: string[];
		onSave?: (site: Site) => Promise<boolean>;
		onCancel?: () => void;
		isEditing?: boolean;
	}

	let {
		site = null,
		categories = [],
		onSave,
		onCancel,
		isEditing = false,
	}: Props = $props();

	// 表单数据
	let formData = $state({
		url: site?.url || "",
		title: site?.title || "",
		description: site?.description || "",
		category: site?.category || "",
		language: site?.language || "zh-CN",
		ageRating: site?.ageRating || "SFW",
		recommendation: site?.recommendation || "",
		tags: site?.tags?.join(", ") || "",
		starred: site?.starred || false,
		supportsHTTPS: site?.supportsHTTPS || false,
		supportsPWA: site?.supportsPWA || false,
		favicon: site?.favicon || "",
	});

	// 表单状态
	let isSubmitting = $state(false);
	let isAnalyzing = $state(false);
	let errors = $state<Record<string, string>>({});
	let successMessage = $state("");

	// 语言选项
	const languageOptions = [
		{ value: "zh-CN", label: "简体中文" },
		{ value: "zh-TW", label: "繁体中文" },
		{ value: "en", label: "English" },
		{ value: "ja", label: "日本語" },
		{ value: "ko", label: "한국어" },
		{ value: "fr", label: "Français" },
		{ value: "de", label: "Deutsch" },
		{ value: "es", label: "Español" },
		{ value: "pt", label: "Português" },
		{ value: "ru", label: "Русский" },
	];

	// 年龄分级选项
	const ageRatingOptions = [
		{ value: "SFW", label: "全年龄" },
		{ value: "18+", label: "18岁以上" },
	];

	// 验证表单
	function validateForm(): boolean {
		errors = {};

		if (!formData.url.trim()) {
			errors.url = "网站URL不能为空";
		} else if (!isValidUrl(formData.url)) {
			errors.url = "请输入有效的URL";
		}

		if (!formData.title.trim()) {
			errors.title = "网站标题不能为空";
		}

		if (!formData.category.trim()) {
			errors.category = "请选择或输入分类";
		}

		return Object.keys(errors).length === 0;
	}

	// 验证URL格式
	function isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	// 自动分析网站
	async function analyzeSite() {
		if (!formData.url.trim() || !isValidUrl(formData.url)) {
			errors.url = "请先输入有效的URL";
			return;
		}

		isAnalyzing = true;
		errors = {};

		try {
			const result = await API.analyzeSite(formData.url);

			// 自动填充分析结果
			if (result.title && !formData.title.trim()) {
				formData.title = result.title;
			}
			if (result.description && !formData.description.trim()) {
				formData.description = result.description;
			}
			if (result.category && !formData.category.trim()) {
				formData.category = result.category;
			}
			if (result.language) {
				formData.language = result.language;
			}
			if (result.ageRating) {
				formData.ageRating = result.ageRating;
			}
			if (
				result.tags &&
				result.tags.length > 0 &&
				!formData.tags.trim()
			) {
				formData.tags = result.tags.join(", ");
			}
			if (result.favicon) {
				formData.favicon = result.favicon;
			}
			if (typeof result.supportsHTTPS === "boolean") {
				formData.supportsHTTPS = result.supportsHTTPS;
			}
			if (typeof result.supportsPWA === "boolean") {
				formData.supportsPWA = result.supportsPWA;
			}

			successMessage = "网站分析完成，已自动填充相关信息";
			setTimeout(() => (successMessage = ""), 3000);
		} catch (error) {
			errors.analyze =
				error instanceof Error
					? error.message
					: "分析失败，请手动填写信息";
		} finally {
			isAnalyzing = false;
		}
	}

	// 提交表单
	async function handleSubmit(event: Event) {
		event.preventDefault();
		if (!validateForm()) return;

		isSubmitting = true;
		errors = {};

		try {
			const siteData: Site = {
				url: formData.url.trim(),
				title: formData.title.trim(),
				description: formData.description.trim(),
				category: formData.category.trim(),
				language: formData.language,
				ageRating: formData.ageRating as "SFW" | "18+",
				recommendation: formData.recommendation,
				tags: formData.tags
					.split(",")
					.map((tag) => tag.trim())
					.filter((tag) => tag.length > 0),
				starred: formData.starred,
				supportsHTTPS: formData.supportsHTTPS,
				supportsPWA: formData.supportsPWA,
				favicon: formData.favicon.trim(),
				createdAt: site?.createdAt || new Date().toISOString(),
				ogImage: site?.ogImage || "",
			};

			const success = await onSave?.(siteData);
			if (success) {
				if (!isEditing) {
					// 重置表单
					resetForm();
				}
			}
		} catch (error) {
			errors.submit =
				error instanceof Error ? error.message : "保存失败，请重试";
		} finally {
			isSubmitting = false;
		}
	}

	// 重置表单
	function resetForm() {
		formData = {
			url: "",
			title: "",
			description: "",
			category: "",
			language: "zh-CN",
			ageRating: "SFW",
			recommendation: "None",
			tags: "",
			starred: false,
			supportsHTTPS: false,
			supportsPWA: false,
			favicon: "",
		};
		errors = {};
		successMessage = "";
	}

	// 取消操作
	function handleCancel() {
		onCancel?.();
	}
</script>

<div class="bg-white dark:bg-gray-800 shadow rounded-lg">
	<div class="px-4 py-4 sm:px-6 sm:py-5">
		<div class="flex justify-between items-center mb-6">
			<h3
				class="text-lg leading-6 font-medium text-gray-900 dark:text-white"
			>
				{isEditing ? "编辑网站" : "添加网站"}
			</h3>
			{#if isEditing}
				<button
					onclick={handleCancel}
					class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
				>
					取消
				</button>
			{/if}
		</div>

		<!-- 成功消息 -->
		{#if successMessage}
			<div
				class="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3"
			>
				<p class="text-sm text-green-800 dark:text-green-200">
					{successMessage}
				</p>
			</div>
		{/if}

		<!-- 表单错误 -->
		{#if errors.submit || errors.analyze}
			<div
				class="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3"
			>
				<p class="text-sm text-red-800 dark:text-red-200">
					{errors.submit || errors.analyze}
				</p>
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- URL和分析 -->
			<div>
				<label
					for="url"
					class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
				>
					网站URL *
				</label>
				<div class="flex space-x-2">
					<input
						type="url"
						id="url"
						bind:value={formData.url}
						placeholder="https://example.com"
						class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 {errors.url
							? 'border-red-500'
							: ''}"
						required
					/>
					<button
						type="button"
						onclick={analyzeSite}
						disabled={isAnalyzing || isSubmitting}
						class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if isAnalyzing}
							<svg
								class="w-4 h-4 mr-2 animate-spin"
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
							分析中
						{:else}
							<svg
								class="w-4 h-4 mr-2"
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
						{/if}
					</button>
				</div>
				{#if errors.url}
					<p class="mt-1 text-sm text-red-600 dark:text-red-400">
						{errors.url}
					</p>
				{/if}
			</div>

			<!-- 基本信息 -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- 标题 -->
				<div>
					<label
						for="title"
						class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>
						网站标题 *
					</label>
					<input
						type="text"
						id="title"
						bind:value={formData.title}
						placeholder="网站标题"
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 {errors.title
							? 'border-red-500'
							: ''}"
						required
					/>
					{#if errors.title}
						<p class="mt-1 text-sm text-red-600 dark:text-red-400">
							{errors.title}
						</p>
					{/if}
				</div>

				<!-- 分类 -->
				<div>
					<label
						for="category"
						class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>
						分类 *
					</label>
					<input
						type="text"
						id="category"
						bind:value={formData.category}
						list="categories"
						placeholder="选择或输入分类"
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 {errors.category
							? 'border-red-500'
							: ''}"
						required
					/>
					<datalist id="categories">
						{#each categories as category}
							<option value={category}></option>
						{/each}
					</datalist>
					{#if errors.category}
						<p class="mt-1 text-sm text-red-600 dark:text-red-400">
							{errors.category}
						</p>
					{/if}
				</div>
			</div>

			<!-- 描述 -->
			<div>
				<label
					for="description"
					class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
				>
					网站描述
				</label>
				<textarea
					id="description"
					bind:value={formData.description}
					rows="3"
					placeholder="网站的详细描述..."
					class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
				></textarea>
			</div>

			<!-- 语言和年龄分级 -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<!-- 语言 -->
				<div>
					<label
						for="language"
						class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>
						语言
					</label>
					<select
						id="language"
						bind:value={formData.language}
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
					>
						{#each languageOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<!-- 年龄分级 -->
				<div>
					<label
						for="ageRating"
						class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>
						年龄分级
					</label>
					<select
						id="ageRating"
						bind:value={formData.ageRating}
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
					>
						{#each ageRatingOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- 标签 -->
			<div>
				<label
					for="tags"
					class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
				>
					标签
				</label>
				<input
					type="text"
					id="tags"
					bind:value={formData.tags}
					placeholder="用逗号分隔多个标签，如：工具, 设计, 开发"
					class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
				/>
				<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
					用逗号分隔多个标签
				</p>
			</div>

			<!-- 图标URL -->
			<div>
				<label
					for="favicon"
					class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
				>
					网站图标URL
				</label>
				<input
					type="url"
					id="favicon"
					bind:value={formData.favicon}
					placeholder="https://example.com/favicon.ico"
					class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>

			<!-- 推荐级别 -->
			<div>
				<label
					for="recommendation"
					class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
				>
					推荐级别
				</label>
				<textarea
					id="recommendation"
					bind:value={formData.recommendation}
					placeholder="推荐语"
					class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
				></textarea>
			</div>
			<!-- 特性选项 -->
			<div>
				<div
					class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
				>
					网站特性
				</div>
				<div class="space-y-3">
					<label class="flex items-center">
						<input
							type="checkbox"
							bind:checked={formData.supportsHTTPS}
							class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
						/>
						<span
							class="ml-2 text-sm text-gray-700 dark:text-gray-300"
							>支持HTTPS</span
						>
					</label>
					<label class="flex items-center">
						<input
							type="checkbox"
							bind:checked={formData.supportsPWA}
							class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
						/>
						<span
							class="ml-2 text-sm text-gray-700 dark:text-gray-300"
							>支持PWA</span
						>
					</label>
					<label class="flex items-center">
						<input
							type="checkbox"
							bind:checked={formData.starred}
							class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
						/>
						<span
							class="ml-2 text-sm text-gray-700 dark:text-gray-300"
							>设为置顶</span
						>
					</label>
				</div>
			</div>

			<!-- 提交按钮 -->
			<div
				class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700"
			>
				{#if !isEditing}
					<button
						type="button"
						onclick={resetForm}
						disabled={isSubmitting}
						class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						重置
					</button>
				{/if}
				<button
					type="submit"
					disabled={isSubmitting}
					class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isSubmitting}
						<svg
							class="w-4 h-4 mr-2 animate-spin"
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
						{isEditing ? "保存中" : "添加中"}
					{:else}
						{isEditing ? "保存网站" : "添加网站"}
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
