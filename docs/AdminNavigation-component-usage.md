# AdminNavigation 组件使用说明

## 📋 概述

`AdminNavigation` 是一个可复用的管理后台导航组件，支持返回功能、用户信息显示、刷新和登出操作。

## 🎯 主要特性

### ✅ 基础功能
- 应用名称显示
- 用户欢迎信息
- 刷新按钮（带动画状态）
- 查看网站链接
- 登出按钮

### ✅ 返回功能
- 可选的返回按钮
- 智能返回逻辑（浏览器历史 or 指定URL）
- 自定义返回回调
- 可配置返回文本

### ✅ 响应式设计
- 移动端优化布局
- 自适应图标和文本显示
- 暗色模式支持

## 🔧 Props 接口

```typescript
interface Props {
  username?: string;           // 用户名（可选）
  isRefreshing?: boolean;      // 刷新状态
  isLoggingOut?: boolean;      // 登出状态
  showBackButton?: boolean;    // 是否显示返回按钮
  backUrl?: string;           // 默认返回URL
  backText?: string;          // 返回按钮文本
  onRefresh?: () => void;     // 刷新回调
  onLogout?: () => void;      // 登出回调
  onBack?: () => void;        // 返回回调
}
```

## 📖 使用示例

### 1. 基础使用（仪表板页面）

```svelte
<script lang="ts">
  import AdminNavigation from '$lib/components/admin/AdminNavigation.svelte';
  
  export let data: PageData;
  let isRefreshing = false;
  let isLoggingOut = false;
  
  async function refreshData() {
    isRefreshing = true;
    // 刷新逻辑
    isRefreshing = false;
  }
  
  async function handleLogout() {
    isLoggingOut = true;
    // 登出逻辑
  }
</script>

<!-- 不显示返回按钮 -->
<AdminNavigation
  username={data.session.username}
  {isRefreshing}
  {isLoggingOut}
  onRefresh={refreshData}
  onLogout={handleLogout}
/>
```

### 2. 带返回功能（子页面）

```svelte
<script lang="ts">
  import AdminNavigation from '$lib/components/admin/AdminNavigation.svelte';
  
  export let data: PageData;
  let isRefreshing = false;
  let isLoggingOut = false;
  
  async function refreshData() {
    isRefreshing = true;
    // 刷新逻辑
    isRefreshing = false;
  }
</script>

<!-- 显示返回按钮，使用默认返回逻辑 -->
<AdminNavigation
  username={data.session.username}
  {isRefreshing}
  {isLoggingOut}
  showBackButton={true}
  backUrl="/admin/dashboard"
  backText="返回仪表板"
  onRefresh={refreshData}
/>
```

### 3. 自定义返回逻辑

```svelte
<script lang="ts">
  import AdminNavigation from '$lib/components/admin/AdminNavigation.svelte';
  import { goto } from '$app/navigation';
  
  export let data: PageData;
  let isRefreshing = false;
  let isLoggingOut = false;
  
  // 自定义返回逻辑
  function handleCustomBack() {
    // 执行自定义操作
    console.log('执行自定义返回逻辑');
    goto('/admin/dashboard');
  }
</script>

<!-- 使用自定义返回回调 -->
<AdminNavigation
  username={data.session.username}
  {isRefreshing}
  {isLoggingOut}
  showBackButton={true}
  backText="返回主页"
  onRefresh={refreshData}
  onBack={handleCustomBack}
/>
```

## 🔄 返回逻辑说明

### 默认返回行为
当 `showBackButton={true}` 且没有提供 `onBack` 回调时：

1. **有浏览器历史**：执行 `window.history.back()`
2. **无浏览器历史**：跳转到 `backUrl`（默认：`/admin/dashboard`）

### 自定义返回行为
当提供 `onBack` 回调时，完全由回调函数控制返回逻辑。

## 🎨 样式特性

### 响应式布局
- **桌面端**：显示完整文本和图标
- **移动端**：隐藏部分文本，只显示图标

### 状态指示
- **刷新状态**：按钮禁用 + 旋转动画
- **登出状态**：按钮禁用 + 状态文本
- **悬停效果**：颜色变化 + 背景高亮

### 暗色模式
- 自动适配系统主题
- 一致的颜色方案
- 平滑的过渡动画

## 📁 文件结构

```
src/lib/components/admin/
├── AdminNavigation.svelte     # 导航组件
├── PendingSubmissionItem.svelte
└── RecentSiteItem.svelte

src/routes/admin/
├── dashboard/+page.svelte     # 仪表板（无返回按钮）
├── sites/+page.svelte         # 网站管理（有返回按钮）
└── submissions/+page.svelte   # 提交审核（自定义返回）
```

## 🚀 最佳实践

### 1. 页面层级规划
- **一级页面**（如仪表板）：不显示返回按钮
- **二级页面**（如网站管理）：显示返回按钮
- **三级页面**（如编辑页面）：使用自定义返回逻辑

### 2. 返回文本建议
- 明确指示返回目标：`"返回仪表板"`、`"返回网站列表"`
- 保持简洁：避免过长的文本
- 移动端友好：考虑小屏幕显示

### 3. 状态管理
- 统一管理 `isRefreshing` 和 `isLoggingOut` 状态
- 在异步操作前后正确设置状态
- 提供用户友好的加载提示

## 🔧 扩展建议

### 可能的增强功能
1. **面包屑导航**：显示完整的页面路径
2. **快捷操作**：添加常用功能的快捷按钮
3. **通知中心**：集成消息通知功能
4. **多语言支持**：国际化文本内容

这个组件现在完全支持在其他管理页面中使用，并提供了灵活的返回功能配置。
