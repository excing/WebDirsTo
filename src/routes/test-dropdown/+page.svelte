<script lang="ts">
  import DropdownSelect from '$lib/components/DropdownSelect.svelte';
  import { DEFAULT_CATEGORIES } from '$lib/constants';

  // 测试数据
  let category1 = $state('');
  let category2 = $state('搜索引擎');
  let category3 = $state('');
  let category4 = $state('');
  let isDisabled = $state(false);

  const shortOptions = ['选项1', '选项2', '选项3'];
  const longOptions = [
    ...DEFAULT_CATEGORIES,
    '人工智能',
    '区块链',
    '物联网',
    '大数据',
    '云计算',
    '机器学习',
    '深度学习',
    '自然语言处理',
    '计算机视觉',
    '数据科学'
  ];

  function handleChange(label: string) {
    return (value: string) => {
      console.log(`${label} 变更为:`, value);
    };
  }
</script>

<svelte:head>
  <title>DropdownSelect 组件测试</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
  <div class="container mx-auto px-4 max-w-4xl">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
      DropdownSelect 组件测试
    </h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 基本用法 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          基本用法
        </h2>
        <div class="space-y-4">
          <div>
            <div class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              允许自定义输入
            </div>
            <DropdownSelect
              bind:value={category1}
              options={[...DEFAULT_CATEGORIES]}
              placeholder="请输入或选择分类"
              allowCustom={true}
              onchange={handleChange('分类1')}
            />
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              当前值: <span class="font-mono">{category1 || '(空)'}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- 仅选择模式 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          仅选择模式
        </h2>
        <div class="space-y-4">
          <div>
            <div class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              不允许自定义输入
            </div>
            <DropdownSelect
              bind:value={category2}
              options={[...DEFAULT_CATEGORIES]}
              placeholder="请选择分类"
              allowCustom={false}
              onchange={handleChange('分类2')}
            />
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              当前值: <span class="font-mono">{category2 || '(空)'}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- 短选项列表 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          短选项列表
        </h2>
        <div class="space-y-4">
          <div>
            <div class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              只有3个选项
            </div>
            <DropdownSelect
              bind:value={category3}
              options={shortOptions}
              placeholder="请选择选项"
              onchange={handleChange('短列表')}
            />
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              当前值: <span class="font-mono">{category3 || '(空)'}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- 长选项列表 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          长选项列表
        </h2>
        <div class="space-y-4">
          <div>
            <div class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              多个选项，带滚动
            </div>
            <DropdownSelect
              bind:value={category4}
              options={longOptions}
              placeholder="搜索或选择..."
              maxHeight="200px"
              onchange={handleChange('长列表')}
            />
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              当前值: <span class="font-mono">{category4 || '(空)'}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- 禁用状态 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          禁用状态
        </h2>
        <div class="space-y-4">
          <div>
            <label class="flex items-center mb-4">
              <input
                type="checkbox"
                bind:checked={isDisabled}
                class="mr-2"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">禁用组件</span>
            </label>
            <DropdownSelect
              bind:value={category1}
              options={[...DEFAULT_CATEGORIES]}
              placeholder="禁用状态"
              disabled={isDisabled}
              onchange={handleChange('禁用测试')}
            />
          </div>
        </div>
      </div>

      <!-- 功能说明 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          功能说明
        </h2>
        <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong class="text-gray-900 dark:text-white">键盘操作:</strong>
            <ul class="mt-1 ml-4 list-disc">
              <li>↑↓ 箭头键选择选项</li>
              <li>Enter 确认选择</li>
              <li>Escape 关闭下拉框</li>
              <li>Tab 关闭并移动焦点</li>
            </ul>
          </div>
          <div>
            <strong class="text-gray-900 dark:text-white">鼠标操作:</strong>
            <ul class="mt-1 ml-4 list-disc">
              <li>点击输入框打开下拉框</li>
              <li>点击箭头切换状态</li>
              <li>悬停高亮选项</li>
              <li>点击外部关闭</li>
            </ul>
          </div>
          <div>
            <strong class="text-gray-900 dark:text-white">搜索过滤:</strong>
            <ul class="mt-1 ml-4 list-disc">
              <li>输入文本实时过滤选项</li>
              <li>支持部分匹配</li>
              <li>不区分大小写</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 返回链接 -->
    <div class="mt-8 text-center">
      <a
        href="/test-edit-modal"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        返回 EditSiteModal 测试
      </a>
    </div>
  </div>
</div>
