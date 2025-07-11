# DropdownSelect 组件

## 概述

DropdownSelect 是一个专为移动端优化的下拉选择组件，解决了原生 `datalist` 在移动端的兼容性和用户体验问题。

## 功能特性

### ✅ 移动端友好
- 完全自定义的下拉交互
- 触摸友好的操作体验
- 响应式设计，适配各种屏幕尺寸
- 防误触设计

### ✅ 灵活配置
- 支持手动输入或仅选择模式
- 可配置的最大高度
- 自定义占位符文本
- 禁用状态支持

### ✅ 交互优化
- 实时搜索过滤
- 键盘导航支持
- 鼠标悬停高亮
- 当前选中项标识

### ✅ 无障碍支持
- 正确的 ARIA 标签
- 键盘操作支持
- 屏幕阅读器友好

## 属性 (Props)

```typescript
interface Props {
  value: string;              // 当前值，支持双向绑定
  options: string[];          // 选项列表
  placeholder?: string;       // 占位符文本，默认 "请选择或输入"
  disabled?: boolean;         // 是否禁用，默认 false
  allowCustom?: boolean;      // 是否允许自定义输入，默认 true
  maxHeight?: string;         // 下拉框最大高度，默认 "240px"
  onchange?: (value: string) => void; // 值变化回调
}
```

## 使用示例

### 基本用法

```svelte
<script lang="ts">
  import DropdownSelect from '$lib/components/DropdownSelect.svelte';
  
  let selectedCategory = $state('');
  const categories = ['搜索引擎', '社交媒体', '在线工具', '开发工具'];
  
  function handleCategoryChange(value: string) {
    console.log('分类变更:', value);
  }
</script>

<DropdownSelect
  bind:value={selectedCategory}
  options={categories}
  placeholder="请选择分类"
  onchange={handleCategoryChange}
/>
```

### 仅选择模式（不允许自定义输入）

```svelte
<DropdownSelect
  bind:value={selectedValue}
  options={predefinedOptions}
  allowCustom={false}
  placeholder="请选择选项"
/>
```

### 自定义样式和高度

```svelte
<DropdownSelect
  bind:value={selectedValue}
  options={longOptionsList}
  maxHeight="180px"
  placeholder="搜索或选择..."
/>
```

### 禁用状态

```svelte
<DropdownSelect
  bind:value={selectedValue}
  options={options}
  disabled={isLoading}
  placeholder="加载中..."
/>
```

## 交互行为

### 键盘操作
- `↓` 箭头键：向下选择选项
- `↑` 箭头键：向上选择选项
- `Enter`：确认选择当前高亮选项
- `Escape`：关闭下拉框
- `Tab`：关闭下拉框并移动焦点

### 鼠标操作
- 点击输入框：打开下拉框
- 点击下拉箭头：切换下拉框状态
- 悬停选项：高亮显示
- 点击选项：选择并关闭下拉框
- 点击外部：关闭下拉框

### 触摸操作
- 触摸输入框：打开下拉框
- 触摸下拉箭头：切换下拉框状态
- 触摸选项：选择并关闭下拉框
- 触摸外部：关闭下拉框

## 状态管理

### 内部状态
```typescript
let isOpen = $state(false);              // 下拉框是否打开
let inputRef = $state<HTMLInputElement>(); // 输入框引用
let dropdownRef = $state<HTMLDivElement>(); // 下拉框引用
let highlightedIndex = $state(-1);       // 当前高亮选项索引
```

### 计算属性
```typescript
let filteredOptions = $derived.by(() => {
  // 根据输入值过滤选项
  if (!value.trim()) {
    return options;
  }
  return options.filter(option =>
    option.toLowerCase().includes(value.toLowerCase())
  );
});
```

## 样式设计

### 响应式布局
- 使用相对定位确保下拉框正确对齐
- 最大高度限制，超出时显示滚动条
- 适配深色模式

### 视觉反馈
- 悬停状态：`hover:bg-gray-100`
- 高亮状态：`bg-gray-100`
- 选中状态：`bg-blue-50 text-blue-600`
- 下拉箭头旋转动画

### 移动端优化
- 触摸目标足够大（最小 44px 高度）
- 清晰的视觉层次
- 避免误触的设计
- 流畅的动画过渡

## 技术实现

### 事件处理
```typescript
// 全局点击事件监听
$effect(() => {
  if (isOpen) {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }
});

// 焦点管理
function handleBlur(event: FocusEvent) {
  const relatedTarget = event.relatedTarget as HTMLElement;
  if (dropdownRef && dropdownRef.contains(relatedTarget)) {
    return; // 焦点在下拉框内，不关闭
  }
  setTimeout(() => closeDropdown(), 150);
}
```

### 搜索过滤
```typescript
function getFilteredOptions() {
  if (!value.trim()) {
    return options;
  }
  return options.filter(option =>
    option.toLowerCase().includes(value.toLowerCase())
  );
}
```

## 兼容性

### 浏览器支持
- ✅ iOS Safari 12+
- ✅ Android Chrome 70+
- ✅ 桌面端所有现代浏览器
- ✅ 支持触摸和鼠标交互

### 框架兼容
- ✅ SvelteKit 2.0+
- ✅ Svelte 5.0+ (使用 runes)

## 最佳实践

### 性能优化
1. 对于大量选项，考虑虚拟滚动
2. 使用防抖优化搜索过滤
3. 避免在 options 数组中使用复杂对象

### 用户体验
1. 提供清晰的占位符文本
2. 合理设置最大高度避免遮挡
3. 在加载状态时禁用组件
4. 提供有意义的错误状态

### 无障碍
1. 确保键盘导航流畅
2. 提供适当的 ARIA 标签
3. 支持屏幕阅读器
4. 保持足够的颜色对比度

## 与 EditSiteModal 集成

在 EditSiteModal 中的使用：

```svelte
<DropdownSelect
  bind:value={formData.category}
  options={categories}
  placeholder="请输入或选择分类"
  disabled={isSubmitting}
  allowCustom={true}
  onchange={handleCategoryChange}
/>
```

这种集成方式提供了：
- 统一的用户体验
- 更好的移动端支持
- 可复用的组件设计
- 易于维护的代码结构
