# EditSiteModal 分类功能示例

## 概述

EditSiteModal 组件现在支持可配置的分类选项，分类字段支持手动输入和下拉选择两种方式。

## 新功能特性

### 1. 可配置分类选项
- 通过 `categories` 参数传递分类选项数组
- 如果不提供 `categories` 参数，默认为空数组
- 支持动态更新分类选项

### 2. 手动输入 + 下拉选择
- 使用 HTML5 `<input>` + `<datalist>` 组合
- 用户可以手动输入任意分类名称
- 也可以从下拉列表中选择预定义的分类
- 支持自动补全功能

## 使用示例

### 基本用法（使用默认分类）

```svelte
<script lang="ts">
  import EditSiteModal from '$lib/components/EditSiteModal.svelte';
  import { DEFAULT_CATEGORIES } from '$lib/constants';
  
  let showModal = $state(false);
  let editingSite = $state<Site | null>(null);
  
  async function handleSave(site: Site): Promise<boolean> {
    // 保存逻辑
    return true;
  }
</script>

<EditSiteModal
  isOpen={showModal}
  site={editingSite}
  categories={[...DEFAULT_CATEGORIES]}
  onclose={() => showModal = false}
  onsave={handleSave}
/>
```

### 自定义分类选项

```svelte
<script lang="ts">
  import EditSiteModal from '$lib/components/EditSiteModal.svelte';
  
  // 自定义分类列表
  const customCategories = [
    "技术博客",
    "开源项目", 
    "在线课程",
    "API 文档",
    "设计灵感",
    "工具软件"
  ];
  
  let showModal = $state(false);
  let editingSite = $state<Site | null>(null);
</script>

<EditSiteModal
  isOpen={showModal}
  site={editingSite}
  categories={customCategories}
  onclose={() => showModal = false}
  onsave={handleSave}
/>
```

### 动态分类选项

```svelte
<script lang="ts">
  import EditSiteModal from '$lib/components/EditSiteModal.svelte';
  import { DEFAULT_CATEGORIES } from '$lib/constants';
  
  let showModal = $state(false);
  let editingSite = $state<Site | null>(null);
  let dynamicCategories = $state([...DEFAULT_CATEGORIES]);
  
  // 根据用户角色或其他条件动态调整分类
  function updateCategories(userRole: string) {
    if (userRole === 'admin') {
      dynamicCategories = [
        ...DEFAULT_CATEGORIES,
        "管理工具",
        "系统监控",
        "数据分析"
      ];
    } else if (userRole === 'developer') {
      dynamicCategories = [
        "开发工具",
        "代码仓库", 
        "技术文档",
        "API 服务",
        "测试工具"
      ];
    }
  }
</script>

<EditSiteModal
  isOpen={showModal}
  site={editingSite}
  categories={dynamicCategories}
  onclose={() => showModal = false}
  onsave={handleSave}
/>
```

### 从 API 获取分类选项

```svelte
<script lang="ts">
  import EditSiteModal from '$lib/components/EditSiteModal.svelte';
  import { onMount } from 'svelte';
  
  let showModal = $state(false);
  let editingSite = $state<Site | null>(null);
  let categories = $state<string[]>([]);
  
  onMount(async () => {
    try {
      // 从 API 获取分类选项
      const response = await fetch('/api/categories');
      const data = await response.json();
      categories = data.categories || [];
    } catch (error) {
      console.error('获取分类失败:', error);
      // 使用默认分类作为后备
      categories = ["搜索引擎", "社交媒体", "在线工具", "其他"];
    }
  });
</script>

<EditSiteModal
  isOpen={showModal}
  site={editingSite}
  categories={categories}
  onclose={() => showModal = false}
  onsave={handleSave}
/>
```

## 用户体验

### 输入方式
1. **手动输入**: 用户可以直接在输入框中输入任意分类名称
2. **下拉选择**: 点击输入框或输入时会显示可选的分类列表
3. **自动补全**: 输入时会根据已有分类进行智能匹配

### 交互特性
- 支持键盘导航（上下箭头选择，回车确认）
- 支持鼠标点击选择
- 输入框获得焦点时自动显示所有可选项
- 输入时实时过滤匹配的选项

## 技术实现

### HTML 结构
```html
<input
  type="text"
  list="category-options"
  placeholder="请输入或选择分类"
  bind:value={formData.category}
/>
<datalist id="category-options">
  {#each categories as category}
    <option value={category}></option>
  {/each}
</datalist>
```

### 优势
- 使用原生 HTML5 功能，无需额外 JavaScript
- 良好的浏览器兼容性
- 自动支持无障碍访问
- 轻量级实现，性能优秀

## 注意事项

1. **类型安全**: `categories` 参数是可选的，默认为空数组
2. **数据验证**: 用户输入的分类名称会被保存，无论是否在预定义列表中
3. **性能考虑**: 对于大量分类选项，建议实现搜索过滤功能
4. **浏览器支持**: datalist 在所有现代浏览器中都有良好支持

## 迁移指南

### 从旧版本升级
如果你之前使用的是旧版本的 EditSiteModal，需要进行以下更改：

```diff
<EditSiteModal
  isOpen={showModal}
  site={editingSite}
+ categories={[...DEFAULT_CATEGORIES]}
  onclose={closeModal}
  onsave={handleSave}
/>
```

### 保持向后兼容
如果不提供 `categories` 参数，组件仍然可以正常工作，只是分类字段变成了纯文本输入框。
