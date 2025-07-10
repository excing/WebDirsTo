// 管理员页面
// 客户端网站处理模块, 使用 Svelte 5 runes 状态管理
// 功能如下(相关函数接口可见 `/src/lib/client/api.ts`):
// 1, 提交新网站: 调用 `/api/submit-site` 接口
// 2, 编辑网站, 删除网站, 批准网站和拒绝网站最终均调用 `POST /api/admin/github` 接口
// 2.1 删除网站: 从 sites.txt 中删除, 并移动到 404.txt 中
// 2.2 编辑网站: 直接修改 sites.txt 中的内容
// 2.3 批准网站: 从 todo.csv 中更新状态为 approved, 并添加到 sites.txt 中
// 2.4 拒绝网站: 从 todo.csv 中更新状态为 rejected

import { API } from './api';
import { parseSites, parseTodo, serializeSites, serializeTodo } from '$lib/conv';
import { DATA_FILES } from '$lib/constants';
import type { Site, Todo, GitHubBlob } from '$lib/types';

// 使用 Svelte 5 runes 进行状态管理
export let sites = $state<Site[]>([]);
export let todos = $state<Todo[]>([]);
export let archived = $state<Site[]>([]);
export let loading = $state(false);
export let error = $state<string | null>(null);

// 计算统计信息
export const stats = $derived.by(() => {
    const categoryCounts: Record<string, number> = {};
    sites.forEach(site => {
        categoryCounts[site.category] = (categoryCounts[site.category] || 0) + 1;
    });

    return {
        totalSites: sites.length,
        pendingSubmissions: todos.filter(todo => todo.status === 'pending').length,
        approvedSubmissions: todos.filter(todo => todo.status === 'approved').length,
        rejectedSubmissions: todos.filter(todo => todo.status === 'rejected').length,
        starredSites: sites.filter(site => site.starred).length,
        archivedSites: archived.length,
        categoryCounts
    };
});

// 获取最近的网站
export const recentSites = $derived(
    sites
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
);

// 获取待审核提交
export const pendingTodos = $derived(
    todos.filter(todo => todo.status === 'pending').slice(0, 10)
);

/**
 * 加载所有数据
 */
export async function loadData(): Promise<void> {
    loading = true;
    error = null;

    try {
        const response = await API.getSites();

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || '获取数据失败');
        }

        const { sites: sitesData, pendingList, archivedList } = result.data;

        // 更新状态
        sites.splice(0, sites.length, ...parseSites(sitesData.content));
        todos.splice(0, todos.length, ...parseTodo(pendingList.content));
        archived.splice(0, archived.length, ...parseSites(archivedList.content));

        loading = false;
    } catch (err) {
        console.error('Failed to load sites data:', err);
        error = err instanceof Error ? err.message : '加载数据失败';
        loading = false;
    }
}

/**
 * 1. 提交新网站
 */
export async function submitSite(url: string): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await API.submitSite(url);

        if (!response.ok) {
            const result = await response.json();
            return {
                success: false,
                message: result.error || result.message || '提交失败'
            };
        }

        const result = await response.json();

        if (result.success) {
            // 重新加载数据以获取最新状态
            await loadData();
            return {
                success: true,
                message: result.message || '提交成功'
            };
        } else {
            return {
                success: false,
                message: result.error || result.message || '提交失败'
            };
        }
    } catch (err) {
        console.error('Submit site error:', err);
        return {
            success: false,
            message: err instanceof Error ? err.message : '网络错误'
        };
    }
}

/**
 * 2.1 删除网站: 从 sites.txt 中删除, 并移动到 404.txt 中
 */
export async function deleteSite(siteToDelete: Site): Promise<{ success: boolean; message?: string }> {
    try {
        // 从 sites 中移除
        const siteIndex = sites.findIndex(site => site.url === siteToDelete.url);
        if (siteIndex === -1) {
            return {
                success: false,
                message: '未找到要删除的网站'
            };
        }

        sites.splice(siteIndex, 1);
        archived.push(siteToDelete);

        // 准备 GitHub 更新
        const blobs: GitHubBlob[] = [
            {
                path: DATA_FILES.SITES,
                content: serializeSites(sites)
            },
            {
                path: DATA_FILES.ARCHIVED,
                content: serializeSites(archived)
            }
        ];

        const response = await API.commits(blobs);

        if (!response.ok) {
            // 回滚状态
            sites.push(siteToDelete);
            archived.splice(archived.length - 1, 1);

            const result = await response.json();
            return {
                success: false,
                message: result.message || '删除失败'
            };
        }

        const result = await response.json();

        if (result.success) {
            return {
                success: true,
                message: '网站已删除并归档'
            };
        } else {
            // 回滚状态
            sites.push(siteToDelete);
            archived.splice(archived.length - 1, 1);

            return {
                success: false,
                message: result.message || '删除失败'
            };
        }
    } catch (err) {
        console.error('Delete site error:', err);
        return {
            success: false,
            message: err instanceof Error ? err.message : '删除失败'
        };
    }
}

/**
 * 2.2 编辑网站: 直接修改 sites.txt 中的内容
 */
export async function editSite(originalSite: Site, updatedSite: Site): Promise<{ success: boolean; message?: string }> {
    try {
        // 找到并更新网站
        const siteIndex = sites.findIndex(site => site.url === originalSite.url);
        if (siteIndex === -1) {
            return {
                success: false,
                message: '未找到要编辑的网站'
            };
        }

        const oldSite = sites[siteIndex];
        sites[siteIndex] = { ...updatedSite };

        // 准备 GitHub 更新
        const blobs: GitHubBlob[] = [
            {
                path: DATA_FILES.SITES,
                content: serializeSites(sites)
            }
        ];

        const response = await API.commits(blobs);

        if (!response.ok) {
            // 回滚状态
            sites[siteIndex] = oldSite;

            const result = await response.json();
            return {
                success: false,
                message: result.message || '编辑失败'
            };
        }

        const result = await response.json();

        if (result.success) {
            return {
                success: true,
                message: '网站信息已更新'
            };
        } else {
            // 回滚状态
            sites[siteIndex] = oldSite;

            return {
                success: false,
                message: result.message || '编辑失败'
            };
        }
    } catch (err) {
        console.error('Edit site error:', err);
        return {
            success: false,
            message: err instanceof Error ? err.message : '编辑失败'
        };
    }
}

/**
 * 2.3 批准网站: 从 todo.csv 中更新状态为 approved, 并添加到 sites.txt 中
 */
export async function approveSite(todoToApprove: Todo, siteData: Site): Promise<{ success: boolean; message?: string }> {
    try {
        // 更新 todo 状态为 approved
        const todoIndex = todos.findIndex(todo => todo.url === todoToApprove.url);
        if (todoIndex === -1) {
            return {
                success: false,
                message: '未找到要批准的提交'
            };
        }

        const oldTodo = todos[todoIndex];
        todos[todoIndex] = { ...todoToApprove, status: 'approved' };
        sites.push(siteData);

        // 准备 GitHub 更新
        const blobs: GitHubBlob[] = [
            {
                path: DATA_FILES.PENDING,
                content: serializeTodo(todos)
            },
            {
                path: DATA_FILES.SITES,
                content: serializeSites(sites)
            }
        ];

        const response = await API.commits(blobs);

        if (!response.ok) {
            // 回滚状态
            todos[todoIndex] = oldTodo;
            sites.splice(sites.length - 1, 1);

            const result = await response.json();
            return {
                success: false,
                message: result.message || '批准失败'
            };
        }

        const result = await response.json();

        if (result.success) {
            return {
                success: true,
                message: '网站已批准并上线'
            };
        } else {
            // 回滚状态
            todos[todoIndex] = oldTodo;
            sites.splice(sites.length - 1, 1);

            return {
                success: false,
                message: result.message || '批准失败'
            };
        }
    } catch (err) {
        console.error('Approve site error:', err);
        return {
            success: false,
            message: err instanceof Error ? err.message : '批准失败'
        };
    }
}

/**
 * 2.4 拒绝网站: 从 todo.csv 中更新状态为 rejected
 */
export async function rejectSite(todoToReject: Todo, reason?: string): Promise<{ success: boolean; message?: string }> {
    try {
        // 更新 todo 状态为 rejected
        const todoIndex = todos.findIndex(todo => todo.url === todoToReject.url);
        if (todoIndex === -1) {
            return {
                success: false,
                message: '未找到要拒绝的提交'
            };
        }

        const oldTodo = todos[todoIndex];
        todos[todoIndex] = { ...todoToReject, status: 'rejected' };

        // 准备 GitHub 更新
        const blobs: GitHubBlob[] = [
            {
                path: DATA_FILES.PENDING,
                content: serializeTodo(todos)
            }
        ];

        const response = await API.commits(blobs);

        if (!response.ok) {
            // 回滚状态
            todos[todoIndex] = oldTodo;

            const result = await response.json();
            return {
                success: false,
                message: result.message || '拒绝失败'
            };
        }

        const result = await response.json();

        if (result.success) {
            return {
                success: true,
                message: reason ? `网站已拒绝: ${reason}` : '网站已拒绝'
            };
        } else {
            // 回滚状态
            todos[todoIndex] = oldTodo;

            return {
                success: false,
                message: result.message || '拒绝失败'
            };
        }
    } catch (err) {
        console.error('Reject site error:', err);
        return {
            success: false,
            message: err instanceof Error ? err.message : '拒绝失败'
        };
    }
}