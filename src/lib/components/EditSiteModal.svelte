<script lang="ts">
  import { API } from "$lib/client/api";
  import type { Site } from "$lib/types";
    import { isValidUrl } from "$lib/url";

  interface Props {
    isOpen: boolean;
    site: Site | null;
    onclose?: () => void;
    onsave?: (site: Site) => boolean;
  }

  let { isOpen, site, onclose, onsave }: Props = $props();

  // 表单状态
  let formData = $state<Site>({
    title: "",
    url: "",
    favicon: "",
    description: "",
    category: "",
    tags: [],
    ageRating: "SFW" as "SFW" | "18+",
    language: "zh-CN",
    starred: false,
    supportsPWA: false,
    supportsHTTPS: true,
    recommendation: "",
    createdAt: "",
    ogImage: "",
  });

  let tagsInput = $state("");
  let isSubmitting = $state(false);
  let isAnalyzing = $state(false);
  let error = $state("");
  let successMessage = $state("");

  // 当 site 变化时更新表单数据
  $effect(() => {
    if (site) {
      formData = { ...site };
      tagsInput = site.tags.join(", ");
    } else {
      resetForm();
    }
  });

  // 当 isOpen 变化时更新 body 滚动条状态
  $effect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-y-hidden");
    } else {
      document.body.classList.remove("overflow-y-hidden");
    }
  });

  // 重置表单
  function resetForm() {
    formData = {
      title: "",
      url: "",
      favicon: "",
      description: "",
      category: "",
      tags: [],
      ageRating: "SFW",
      language: "zh-CN",
      starred: false,
      supportsPWA: false,
      supportsHTTPS: true,
      recommendation: "",
      createdAt: new Date().toISOString(),
      ogImage: "",
    };
    tagsInput = "";
    error = "";
    successMessage = "";
    isSubmitting = false;
    isAnalyzing = false;
  }

  // 关闭模态框
  function closeModal() {
    resetForm();
    onclose?.();
  }

  // 分析网站
  async function analyzeSite() {
    if (!formData.url.trim()) {
      error = "请先输入网址";
      return;
    }

    // 验证 URL 格式
    let formattedUrl = formData.url.trim();
    if (
      !formattedUrl.startsWith("http://") &&
      !formattedUrl.startsWith("https://")
    ) {
      formattedUrl = "https://" + formattedUrl;
    }

    if (!isValidUrl(formattedUrl)) {
      error = "请输入有效的网址";
      return;
    }

    isAnalyzing = true;
    error = "";
    successMessage = "";

    try {
      const response = await API.analyzeSite(formattedUrl);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(`${result.error}: ${result.message}` || "分析失败");
      }

      // 更新表单数据
      const analyzedSite = result.data as Site;
      formData = {
        ...formData,
        ...analyzedSite,
        // 保留用户可能已经修改的字段
        starred: formData.starred,
        recommendation: formData.recommendation || analyzedSite.recommendation,
      };
      tagsInput = analyzedSite.tags.join(", ");
      successMessage = "网站分析完成！";
    } catch (err) {
      console.log(err);
      
      error = err instanceof Error ? err.message : "分析失败，请稍后重试";
    } finally {
      isAnalyzing = false;
    }
  }

  // 保存网站信息
  async function handleSave(event: Event) {
    event.preventDefault();
    error = "";
    successMessage = "";

    // 验证必填字段
    if (!formData.title.trim()) {
      error = "请输入网站标题";
      return;
    }

    if (!formData.url.trim()) {
      error = "请输入网址";
      return;
    }

    // 验证 URL 格式
    let formattedUrl = formData.url.trim();
    if (
      !formattedUrl.startsWith("http://") &&
      !formattedUrl.startsWith("https://")
    ) {
      formattedUrl = "https://" + formattedUrl;
    }

    if (!isValidUrl(formattedUrl)) {
      error = "请输入有效的网址";
      return;
    }

    isSubmitting = true;

    try {
      // 处理标签
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // 准备保存的数据
      const siteToSave: Site = {
        ...formData,
        url: formattedUrl,
        tags,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        createdAt: formData.createdAt || new Date().toISOString(),
      };

      // 触发保存事件
      if (onsave?.(siteToSave)) {
        successMessage = "保存成功！";

        // 延迟关闭模态框
        setTimeout(() => {
          closeModal();
        }, 200);
      } else {
        throw new Error("保存失败");
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "保存失败，请稍后重试";
    } finally {
      isSubmitting = false;
    }
  }

  // 处理键盘事件
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeModal();
    } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      handleSave(event);
    }
  }

  // 点击背景关闭
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  // 常用分类选项
  const categories = [
    "搜索引擎",
    "社交媒体",
    "新闻资讯",
    "在线工具",
    "开发工具",
    "设计资源",
    "学习教育",
    "娱乐休闲",
    "购物商城",
    "金融理财",
    "生活服务",
    "科技数码",
    "游戏娱乐",
    "音乐视频",
    "图片素材",
    "云存储",
    "办公软件",
    "其他",
  ];

  // 常用语言选项
  const languages = [
    { code: "zh-CN", name: "简体中文" },
    { code: "zh-TW", name: "繁体中文" },
    { code: "en", name: "English" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "es", name: "Español" },
    { code: "ru", name: "Русский" },
    { code: "ar", name: "العربية" },
  ];
</script>

<!-- 模态框背景 -->
{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex justify-center p-4 h-full bg-gray-100 dark:bg-black bg-opacity-50 backdrop-blur-sm"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
  >
    <!-- 模态框内容 -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-y-auto"
    >
      <!-- 头部 -->
      <div
        class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700"
      >
        <h2
          id="modal-title"
          class="text-xl font-semibold text-gray-900 dark:text-white"
        >
          {site ? "编辑网站信息" : "添加新网站"}
        </h2>
        <button
          type="button"
          onclick={closeModal}
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="关闭"
        >
          <svg
            class="w-6 h-6"
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
        </button>
      </div>

      <!-- 表单内容 -->
      <form onsubmit={handleSave} class="p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 左列 - 基本信息 -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              基本信息
            </h3>

            <!-- 网址输入 -->
            <div>
              <label
                for="url"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                网址 <span class="text-red-500">*</span>
              </label>
              <div class="flex space-x-2">
                <input
                  id="url"
                  type="text"
                  bind:value={formData.url}
                  placeholder="https://example.com"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
									       focus:ring-2 focus:ring-blue-500 focus:border-transparent
									       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
									       placeholder-gray-500 dark:placeholder-gray-400"
                  required
                  disabled={isSubmitting || isAnalyzing}
                />
                <button
                  type="button"
                  onclick={analyzeSite}
                  disabled={isAnalyzing || isSubmitting}
                  class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700
									       disabled:bg-green-400 disabled:cursor-not-allowed rounded-lg transition-colors
									       flex items-center space-x-2"
                >
                  {#if isAnalyzing}
                    <svg
                      class="w-4 h-4 animate-spin"
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
                    <span>分析中...</span>
                  {:else}
                    <svg
                      class="w-4 h-4"
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
                    <span>分析</span>
                  {/if}
                </button>
              </div>
            </div>

            <!-- 标题 -->
            <div>
              <label
                for="title"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                标题 <span class="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                bind:value={formData.title}
                placeholder="网站标题"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
								       focus:ring-2 focus:ring-blue-500 focus:border-transparent
								       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
								       placeholder-gray-500 dark:placeholder-gray-400"
                required
                disabled={isSubmitting}
              />
            </div>

            <!-- Favicon -->
            <div>
              <label
                for="favicon"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                网站图标 (Favicon)
              </label>
              <input
                id="favicon"
                type="url"
                bind:value={formData.favicon}
                placeholder="https://example.com/favicon.ico"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
									       focus:ring-2 focus:ring-blue-500 focus:border-transparent
									       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
									       placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isSubmitting}
              />
              <img class="my-2" src={formData.favicon} alt="Site favicon" />
            </div>

            <!-- 描述 -->
            <div>
              <label
                for="description"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                描述
              </label>
              <textarea
                id="description"
                bind:value={formData.description}
                placeholder="网站描述"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
								       focus:ring-2 focus:ring-blue-500 focus:border-transparent
								       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
								       placeholder-gray-500 dark:placeholder-gray-400 resize-vertical"
                disabled={isSubmitting}
              ></textarea>
            </div>

            <!-- 分类 -->
            <div>
              <label
                for="category"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                分类
              </label>
              <select
                id="category"
                bind:value={formData.category}
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
								       focus:ring-2 focus:ring-blue-500 focus:border-transparent
								       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isSubmitting}
              >
                <option value="">请选择分类</option>
                {#each categories as category}
                  <option value={category}>{category}</option>
                {/each}
              </select>
            </div>

            <!-- 标签 -->
            <div>
              <label
                for="tags"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                标签 <span class="text-sm text-gray-500">(用逗号分隔)</span>
              </label>
              <input
                id="tags"
                type="text"
                bind:value={tagsInput}
                placeholder="标签1, 标签2, 标签3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
								       focus:ring-2 focus:ring-blue-500 focus:border-transparent
								       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
								       placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <!-- 右列 - 高级设置 -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              高级设置
            </h3>

            <!-- 年龄分级 -->
            <div>
              <fieldset>
                <legend
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  年龄分级
                </legend>
                <div class="flex space-x-4">
                  <label class="flex items-center">
                    <input
                      type="radio"
                      bind:group={formData.ageRating}
                      value="SFW"
                      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300
										       focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800
										       focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      disabled={isSubmitting}
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                      >SFW (全年龄)</span
                    >
                  </label>
                  <label class="flex items-center">
                    <input
                      type="radio"
                      bind:group={formData.ageRating}
                      value="18+"
                      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300
										       focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800
										       focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      disabled={isSubmitting}
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                      >18+ (成人内容)</span
                    >
                  </label>
                </div>
              </fieldset>
            </div>

            <!-- 语言 -->
            <div>
              <label
                for="language"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                语言
              </label>
              <select
                id="language"
                bind:value={formData.language}
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
								       focus:ring-2 focus:ring-blue-500 focus:border-transparent
								       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isSubmitting}
              >
                {#each languages as lang}
                  <option value={lang.code}>{lang.name}</option>
                {/each}
              </select>
            </div>

            <!-- OG Image -->
            <div>
              <label
                for="ogImage"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                预览图片 (OG Image)
              </label>
              <input
                id="ogImage"
                type="url"
                bind:value={formData.ogImage}
                placeholder="https://example.com/og-image.jpg"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
									       focus:ring-2 focus:ring-blue-500 focus:border-transparent
									       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
									       placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isSubmitting}
              />
              <img
                class="my-2"
                src={formData.ogImage}
                alt=""
                title="OG image"
                aria-label="OG Image"
              />
            </div>
            <!-- 功能支持 -->
            <div class="space-y-3">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
                功能支持
              </h4>

              <div class="flex items-center">
                <input
                  id="supportsHTTPS"
                  type="checkbox"
                  bind:checked={formData.supportsHTTPS}
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded
									       focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800
									       focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  disabled={isSubmitting}
                />
                <label
                  for="supportsHTTPS"
                  class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  支持 HTTPS
                </label>
              </div>

              <div class="flex items-center">
                <input
                  id="supportsPWA"
                  type="checkbox"
                  bind:checked={formData.supportsPWA}
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded
									       focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800
									       focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  disabled={isSubmitting}
                />
                <label
                  for="supportsPWA"
                  class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  支持 PWA (渐进式网页应用)
                </label>
              </div>

              <div class="flex items-center">
                <input
                  id="starred"
                  type="checkbox"
                  bind:checked={formData.starred}
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded
									       focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800
									       focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  disabled={isSubmitting}
                />
                <label
                  for="starred"
                  class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  标记为置顶
                </label>
              </div>
            </div>

            <!-- 推荐语 -->
            <div>
              <label
                for="recommendation"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                推荐语
              </label>
              <textarea
                id="recommendation"
                bind:value={formData.recommendation}
                placeholder="推荐语"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
								       focus:ring-2 focus:ring-blue-500 focus:border-transparent
								       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
								       placeholder-gray-500 dark:placeholder-gray-400 resize-vertical"
                disabled={isSubmitting}
              ></textarea>
            </div>
          </div>
        </div>

        <!-- 错误和成功信息 -->
        {#if error}
          <div
            class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <p class="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        {/if}

        {#if successMessage}
          <div
            class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <p class="text-sm text-green-600 dark:text-green-400">
              {successMessage}
            </p>
          </div>
        {/if}

        <!-- 按钮组 -->
        <div
          class="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700"
        >
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
            disabled={isSubmitting || isAnalyzing}
          >
            {#if isSubmitting}
              <svg
                class="w-4 h-4 animate-spin"
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
              <span>保存中...</span>
            {:else}
              <svg
                class="w-4 h-4"
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
              <span>保存</span>
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
