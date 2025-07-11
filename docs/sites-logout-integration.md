# Sites.ts 登出函数集成说明

## 🎯 概述

将登出功能集成到 `/src/lib/client/sites.ts` 模块中，实现统一的状态管理和更好的代码组织。

## ✅ 主要改进

### 1. 统一状态管理
- **全局登出状态**：使用 Svelte store 管理 `isLoggingOut` 状态
- **状态同步**：所有使用 AdminNavigation 的页面自动同步登出状态
- **数据清理**：登出时自动清除所有本地状态

### 2. 简化组件接口
- **移除 props**：AdminNavigation 不再需要 `isLoggingOut` 参数
- **自动状态**：组件直接使用 store 中的状态
- **向后兼容**：保持 `onLogout` 回调支持自定义逻辑

## 🔧 实现细节

### 1. Sites.ts 中的登出函数

```typescript
// 登出状态管理
export const isLoggingOut = writable<boolean>(false);

/**
 * 管理员登出
 */
export async function logout(): Promise<{ success: boolean; message?: string }> {
    isLoggingOut.set(true);
    
    try {
        await request('/api/admin/auth', {
            method: 'DELETE'
        });
        
        // 清除本地状态
        sites.set([]);
        todos.set([]);
        archived.set([]);
        loading.set(true);
        error.set(null);
        
        // 跳转到登录页面
        goto('/admin');
        
        return {
            success: true,
            message: '登出成功'
        };
    } catch (err) {
        console.error('Logout error:', err);
        return {
            success: false,
            message: err instanceof Error ? err.message : '登出失败'
        };
    } finally {
        isLoggingOut.set(false);
    }
}
```

### 2. AdminNavigation 组件改进

#### Props 接口简化
```typescript
// 修改前
interface Props {
    username?: string;
    isRefreshing?: boolean;
    isLoggingOut?: boolean;  // ❌ 移除
    showBackButton?: boolean;
    backUrl?: string;
    backText?: string;
    onRefresh?: () => void;
    onLogout?: () => void;
    onBack?: () => void;
}

// 修改后
interface Props {
    username?: string;
    isRefreshing?: boolean;
    showBackButton?: boolean;
    backUrl?: string;
    backText?: string;
    onRefresh?: () => void;
    onLogout?: () => void;
    onBack?: () => void;
}
```

#### 登出逻辑简化
```typescript
// 修改前
async function handleLogout() {
    if (onLogout) {
        onLogout();
    } else {
        // 复杂的默认登出逻辑
        isLoggingOut = true;
        try {
            await request('/api/admin/auth', { method: 'DELETE' });
            goto('/admin');
        } catch (error) {
            console.error('登出失败:', error);
        } finally {
            isLoggingOut = false;
        }
    }
}

// 修改后
async function handleLogout() {
    if (onLogout) {
        onLogout();
    } else {
        // 使用 sites.ts 中的统一登出逻辑
        await logout();
    }
}
```

#### 模板中使用 Store
```svelte
<!-- 修改前 -->
<button disabled={isLoggingOut}>
    {#if isLoggingOut}
        <!-- 加载状态 -->
    {:else}
        <!-- 正常状态 -->
    {/if}
    <span>{isLoggingOut ? '登出中...' : '登出'}</span>
</button>

<!-- 修改后 -->
<button disabled={$isLoggingOut}>
    {#if $isLoggingOut}
        <!-- 加载状态 -->
    {:else}
        <!-- 正常状态 -->
    {/if}
    <span>{$isLoggingOut ? '登出中...' : '登出'}</span>
</button>
```

## 🚀 使用方式

### 1. 基础使用（推荐）
```svelte
<script>
    import AdminNavigation from '$lib/components/admin/AdminNavigation.svelte';
    
    export let data: PageData;
    let isRefreshing = false;
</script>

<!-- 不需要传递 isLoggingOut，组件自动管理 -->
<AdminNavigation
    username={data.session.username}
    {isRefreshing}
    onRefresh={refreshData}
/>
```

### 2. 自定义登出逻辑
```svelte
<script>
    import AdminNavigation from '$lib/components/admin/AdminNavigation.svelte';
    import { logout } from '$lib/client/sites';
    
    async function customLogout() {
        // 执行自定义逻辑
        console.log('执行自定义登出前的清理工作');
        
        // 调用统一的登出函数
        const result = await logout();
        
        if (result.success) {
            console.log('登出成功');
        } else {
            console.error('登出失败:', result.message);
        }
    }
</script>

<AdminNavigation
    username={data.session.username}
    onLogout={customLogout}
/>
```

### 3. 在其他地方使用登出功能
```svelte
<script>
    import { logout, isLoggingOut } from '$lib/client/sites';
    
    async function handleLogout() {
        await logout();
    }
</script>

<button onclick={handleLogout} disabled={$isLoggingOut}>
    {$isLoggingOut ? '登出中...' : '登出'}
</button>
```

## 📊 优势对比

| 特性 | 修改前 | 修改后 | 改进 |
|------|--------|--------|------|
| 状态管理 | 每个页面独立管理 | 统一的 store 管理 | ✅ 一致性 |
| 代码复用 | 重复的登出逻辑 | 统一的登出函数 | ✅ DRY 原则 |
| 组件接口 | 需要传递 isLoggingOut | 自动管理状态 | ✅ 简化 |
| 数据清理 | 手动清理 | 自动清理所有状态 | ✅ 完整性 |
| 错误处理 | 分散处理 | 统一错误处理 | ✅ 一致性 |
| 维护性 | 多处修改 | 单点修改 | ✅ 易维护 |

## 🔄 迁移指南

### 对于现有页面
1. **移除 isLoggingOut 变量**：不再需要本地管理
2. **移除 handleLogout 函数**：使用组件默认逻辑
3. **简化 AdminNavigation 调用**：移除 isLoggingOut 和 onLogout 参数

### 对于新页面
直接使用简化的 AdminNavigation 组件，无需额外的登出逻辑。

## 🎯 最佳实践

1. **优先使用默认逻辑**：除非有特殊需求，否则使用组件的默认登出行为
2. **状态监听**：如需监听登出状态，直接使用 `$isLoggingOut` store
3. **自定义逻辑**：如需自定义登出逻辑，调用 `logout()` 函数而不是重新实现
4. **错误处理**：登出函数返回结果对象，可根据需要处理错误

这次改进实现了更好的代码组织和状态管理，提高了开发效率和用户体验。
