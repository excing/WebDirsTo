<script lang="ts">
	import EditSiteModal from "$lib/components/EditSiteModal.svelte";
	import { DEFAULT_CATEGORIES } from "$lib/constants";
	import type { Site } from "$lib/types";

	// 测试数据
	let testSites: Site[] = $state([
		{
			title: "谷歌搜索",
			url: "https://www.google.com",
			favicon: "https://www.google.com/favicon.ico",
			description: "全球最大的搜索引擎",
			category: "搜索引擎",
			tags: ["搜索", "工具", "谷歌"],
			ageRating: "SFW",
			language: "zh-CN",
			starred: true,
			supportsPWA: false,
			supportsHTTPS: true,
			recommendation: "High",
			createdAt: "2024-01-01T00:00:00.000Z",
			ogImage:
				"https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
		},
	]);

	let showModal = $state(false);
	let editingSite = $state<Site | null>(null);

	function openEditModal(site: Site | null = null) {
		editingSite = site;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingSite = null;
	}

	async function handleSave(site: Site): Promise<boolean> {
		console.log("保存的网站信息:", site);
		// 这里可以添加实际的保存逻辑
		testSites = [...testSites, site];

		return true;
	}
</script>

<svelte:head>
	<title>编辑网站模态框测试</title>
</svelte:head>

<div class="bg-gray-50 dark:bg-gray-900 py-8">
	<div class="container mx-auto px-4">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
			编辑网站模态框测试
		</h1>

		<div class="space-y-4">
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2
					class="text-xl font-semibold text-gray-900 dark:text-white mb-4"
				>
					测试按钮
				</h2>

				<div class="space-x-4">
					<button
						onclick={() => openEditModal(null)}
						class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						添加新网站
					</button>

					<button
						onclick={() => openEditModal(testSites[0])}
						class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
					>
						编辑测试网站
					</button>
				</div>
			</div>

			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2
					class="text-xl font-semibold text-gray-900 dark:text-white mb-4"
				>
					测试网站信息
				</h2>

				{#each testSites as testSite}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
						<div>
							<span
								class="font-medium text-gray-700 dark:text-gray-300"
								>标题:</span
							>
							<span class="text-gray-900 dark:text-white ml-2"
								>{testSite.title}</span
							>
						</div>
						<div>
							<span
								class="font-medium text-gray-700 dark:text-gray-300"
								>URL:</span
							>
							<span class="text-gray-900 dark:text-white ml-2"
								>{testSite.url}</span
							>
						</div>
						<div>
							<span
								class="font-medium text-gray-700 dark:text-gray-300"
								>分类:</span
							>
							<span class="text-gray-900 dark:text-white ml-2"
								>{testSite.category}</span
							>
						</div>
						<div>
							<span
								class="font-medium text-gray-700 dark:text-gray-300"
								>年龄分级:</span
							>
							<span class="text-gray-900 dark:text-white ml-2"
								>{testSite.ageRating}</span
							>
						</div>
						<div>
							<span
								class="font-medium text-gray-700 dark:text-gray-300"
								>语言:</span
							>
							<span class="text-gray-900 dark:text-white ml-2"
								>{testSite.language}</span
							>
						</div>
						<div>
							<span
								class="font-medium text-gray-700 dark:text-gray-300"
								>推荐级别:</span
							>
							<span class="text-gray-900 dark:text-white ml-2"
								>{testSite.recommendation}</span
							>
						</div>
						<div class="md:col-span-2">
							<span
								class="font-medium text-gray-700 dark:text-gray-300"
								>标签:</span
							>
							<span class="text-gray-900 dark:text-white ml-2"
								>{testSite.tags.join(", ")}</span
							>
						</div>
						<div class="md:col-span-2">
							<span
								class="font-medium text-gray-700 dark:text-gray-300"
								>描述:</span
							>
							<span class="text-gray-900 dark:text-white ml-2"
								>{testSite.description}</span
							>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<!-- 编辑网站模态框 -->
<EditSiteModal
	isOpen={showModal}
	site={editingSite}
	categories={[...DEFAULT_CATEGORIES]}
	onclose={closeModal}
	onsave={handleSave}
/>
