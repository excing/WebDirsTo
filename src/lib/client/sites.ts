// 管理员页面
// 客户端网站处理模块, 使用 Svelte store 状态管理
// 功能如下(相关函数接口可见 `/src/lib/client/api.ts`):
// 1, 提交新网站: 调用 `/api/submit-site` 接口
// 2, 编辑网站, 删除网站, 批准网站和拒绝网站最终均调用 `POST /api/admin/github` 接口
// 2.1 删除网站: 从 sites.txt 中删除, 并移动到 404.txt 中
// 2.2 编辑网站: 直接修改 sites.txt 中的内容
// 2.3 批准网站: 从 todo.csv 中更新状态为 approved, 并添加到 sites.txt 中
// 2.4 拒绝网站: 从 todo.csv 中更新状态为 rejected

import { writable, derived } from 'svelte/store';
import { request } from '$lib/fetch';
import { API } from './api';
import { parseSites, parseTodo, serializeSites, serializeTodo } from '$lib/conv';
import { DATA_FILES, DEFAULT_CATEGORIES } from '$lib/constants';
import type { Site, Todo, GitHubBlob } from '$lib/types';
import { isSameUrl } from '$lib/url';

// 使用 Svelte store 进行状态管理
export const sites = writable<Site[]>([]);
export const todos = writable<Todo[]>([]);
export const archived = writable<Site[]>([]);
export const loading = writable<boolean>(true);
export const error = writable<string | null>(null);

// 计算统计信息
export const stats = derived(
    [sites, todos, archived],
    ([$sites, $todos, $archived]) => {
        const categoryCounts: Record<string, number> = {};
        const tagCounts: Record<string, number> = {};
        const dayCounts: Record<string, number> = {}; // 每天的添加数量
        const monthCounts: Record<string, number> = {}; // 每月的添加数量
        const categories: string[] = [];
        $sites.forEach(site => {
            categoryCounts[site.category] = (categoryCounts[site.category] || 0) + 1;
            if (!categories.includes(site.category)) {
                categories.unshift(site.category);
            }
            site.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
            const createdAt = new Date(site.createdAt);
            const dateKey = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}-${createdAt.getDate()}`;
            dayCounts[dateKey] = (dayCounts[dateKey] || 0) + 1;
            const monthKey = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}}`;
            monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
        });
        DEFAULT_CATEGORIES.forEach(element => {
            if (!categories.includes(element)) {
                categories.push(element);
            }
        });

        return {
            totalSites: $sites.length,
            pendingSubmissions: $todos.filter(todo => todo.status === 'pending').length,
            approvedSubmissions: $todos.filter(todo => todo.status === 'approved').length,
            rejectedSubmissions: $todos.filter(todo => todo.status === 'rejected').length,
            starredSites: $sites.filter(site => site.starred).length,
            archivedSites: $archived.length,
            pwaSites: $sites.filter(site => site.supportsPWA).length,
            httpsSites: $sites.filter(site => site.supportsHTTPS).length,
            adultSites: $sites.filter(site => site.ageRating === '18+').length,
            categoryCounts,
            tagCounts,
            dayCounts,
            monthCounts,
            categories,
        };
    }
);

// 获取最近的网站
export const recentSites = derived(
    sites,
    ($sites) => $sites
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
);

// 获取待审核提交
export const pendingTodos = derived(
    todos,
    ($todos) => $todos.filter(todo => todo.status === 'pending').slice(0, 10)
);

/**
 * 加载所有数据
 */
export async function loadData(): Promise<boolean> {
    loading.set(true);
    const ok = await frefreshData();
    loading.set(false);
    return ok;
}

export async function frefreshData(): Promise<boolean> {
    error.set(null);

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

        const _sites = parseSites(sitesData.content);
        const _todos = parseTodo(pendingList.content);
        const _archived = parseSites(archivedList.content);

        // 更新状态
        updateStores({ sites: _sites, todos: _todos, archived: _archived });

        // 校验并更新 todos 的状态
        await verifyAndUpdateTodos(_todos, _sites, _archived);

        return true;
    } catch (err) {
        console.error('Failed to load sites data:', err);
        error.set(err instanceof Error ? err.message : '加载数据失败');

        throw err;
    }
}

// 校验并更新 todos 的状态
// 1. sites 里的内容需要更新 todo 的 approved 的状态, 如果没有, 则需要添加
// 2. archived 里的内容需要更新 todo 的 rejected 的状态, 如果没有, 则需要添加
async function verifyAndUpdateTodos(todos: Todo[], sites: Site[], archived: Site[]) {
    const updatedTodos = [...todos];
    let haveUpdate = false;

    sites.forEach(site => {
        const todoIndex = updatedTodos.findIndex(todo => isSameUrl(todo.url, site.url));
        if (todoIndex === -1) {
            updatedTodos.push({
                url: site.url,
                ip: 'localhost',
                language: site.language,
                os: 'EXC',
                browser: 'WebDirsTo',
                submittedAt: new Date().toISOString(),
                status: 'approved'
            });
            haveUpdate = true;
        } else if (updatedTodos[todoIndex].status !== 'approved') {
            updatedTodos[todoIndex].status = 'approved';
            haveUpdate = true;
        }
    });
    archived.forEach(site => {
        const todoIndex = updatedTodos.findIndex(todo => isSameUrl(todo.url, site.url));
        if (todoIndex === -1) {
            updatedTodos.push({
                url: site.url,
                ip: 'localhost',
                language: site.language,
                os: 'EXC',
                browser: 'WebDirsTo',
                submittedAt: new Date().toISOString(),
                status: 'rejected'
            });
            haveUpdate = true;
        } else if (updatedTodos[todoIndex].status !== 'rejected') {
            updatedTodos[todoIndex].status = 'rejected';
            haveUpdate = true;
        }
    });

    // 没有需要修改的
    if (!haveUpdate) return;

    try {
        // 准备 GitHub 更新
        const blobs: GitHubBlob[] = [
            {
                path: DATA_FILES.PENDING,
                content: serializeTodo(updatedTodos)
            }
        ];

        const result = await commitToGitHub(blobs, 'todo 校验和更新成功', 'todo 校验和更新失败');

        if (result.success) {
            // 更新状态
            updateStores({ todos: updatedTodos });
        }

    } catch (err) {
        console.error('Reject site error:', err);
        return {
            success: false,
            message: err instanceof Error ? err.message : 'todo 校验和更新失败'
        };
    }
}

// 通用的获取当前状态函数
function getCurrentStoreValues() {
    let currentSites: Site[] = [];
    let currentTodos: Todo[] = [];
    let currentArchived: Site[] = [];

    sites.subscribe(value => currentSites = value)();
    todos.subscribe(value => currentTodos = value)();
    archived.subscribe(value => currentArchived = value)();

    return { currentSites, currentTodos, currentArchived };
}

// 通用的 GitHub 提交处理函数
async function commitToGitHub(
    blobs: GitHubBlob[],
    successMessage: string,
    errorMessage: string = '操作失败'
): Promise<{ success: boolean; message: string }> {
    try {
        const response = await API.commits(blobs);

        if (!response.ok) {
            const result = await response.json();
            return {
                success: false,
                message: result.message || errorMessage
            };
        }

        const result = await response.json();

        if (result.success) {
            return {
                success: true,
                message: successMessage
            };
        } else {
            return {
                success: false,
                message: result.message || errorMessage
            };
        }
    } catch (err) {
        console.error('GitHub commit error:', err);
        return {
            success: false,
            message: err instanceof Error ? err.message : errorMessage
        };
    }
}

// 通用的状态更新函数
function updateStores(updates: {
    sites?: Site[];
    todos?: Todo[];
    archived?: Site[];
}) {
    if (updates.sites !== undefined) sites.set(updates.sites);
    if (updates.todos !== undefined) todos.set(updates.todos);
    if (updates.archived !== undefined) archived.set(updates.archived);
}

/**
 * 2.1 删除网站: 从 sites.txt 中删除, 并移动到 404.txt 中
 */
export async function deleteSite(siteToDelete: Site): Promise<{ success: boolean; message?: string }> {
    try {
        // 获取当前状态
        const { currentSites, currentTodos, currentArchived } = getCurrentStoreValues();

        // 从 sites 中移除
        const siteIndex = currentSites.findIndex(site => isSameUrl(site.url, siteToDelete.url));
        if (siteIndex === -1) {
            return {
                success: false,
                message: '未找到要删除的网站'
            };
        }

        // 更新 todo 状态为 rejected
        const todoIndex = currentTodos.findIndex(todo => isSameUrl(todo.url, siteToDelete.url));
        const updatedTodos = [...currentTodos];
        if (todoIndex === -1) {
            updatedTodos.push({
                url: siteToDelete.url,
                ip: 'localhost',
                language: siteToDelete.language,
                os: 'EXC',
                browser: 'WebDirsTo',
                submittedAt: new Date().toISOString(),
                status: 'rejected'
            });
        } else {
            updatedTodos[todoIndex].status = 'rejected';
        }

        const updatedSites = currentSites.filter(site => !isSameUrl(site.url, siteToDelete.url));
        const updatedArchived = [siteToDelete, ...currentArchived];

        // 准备 GitHub 更新
        const blobs: GitHubBlob[] = [
            {
                path: DATA_FILES.SITES,
                content: serializeSites(updatedSites)
            },
            {
                path: DATA_FILES.ARCHIVED,
                content: serializeSites(updatedArchived)
            },
            {
                path: DATA_FILES.PENDING,
                content: serializeTodo(updatedTodos)
            }
        ];

        const result = await commitToGitHub(blobs, '网站已删除并归档', '删除失败');

        if (result.success) {
            // 更新状态
            updateStores({
                sites: updatedSites,
                archived: updatedArchived,
                todos: updatedTodos
            });
        }

        return result;
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
export async function editSite(updatedSite: Site): Promise<{ success: boolean; message?: string }> {
    try {
        // 获取当前状态
        const { currentSites, currentTodos } = getCurrentStoreValues();

        const updatedSites = [...currentSites];

        // 找到并更新网站, 或者新增网站
        const siteIndex = currentSites.findIndex(site => isSameUrl(site.url, updatedSite.url));
        if (siteIndex === -1) { // 新增网站
            updatedSites.unshift(updatedSite);
        } else {
            updatedSites[siteIndex] = { ...updatedSite };
        }

        // 准备 GitHub 更新
        let blobs: GitHubBlob[] = [
            {
                path: DATA_FILES.SITES,
                content: serializeSites(updatedSites)
            }
        ];

        // 更新 todo 状态为 approved
        const todoIndex = currentTodos.findIndex(todo => isSameUrl(todo.url, updatedSite.url));
        if (todoIndex != -1) {
            const updatedTodos = [...currentTodos];
            updatedTodos[todoIndex].status = 'approved';
            blobs = [...blobs, {
                path: DATA_FILES.PENDING,
                content: serializeTodo(updatedTodos)
            }]
        }

        const result = await commitToGitHub(blobs, '网站信息已更新', '编辑失败');

        if (result.success) {
            // 更新状态
            updateStores({ sites: updatedSites, todos: currentTodos });
        }

        return result;
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
        // 获取当前状态
        const { currentTodos, currentSites } = getCurrentStoreValues();

        // 更新 todo 状态为 approved
        const todoIndex = currentTodos.findIndex(todo => isSameUrl(todo.url, todoToApprove.url));
        if (todoIndex === -1) {
            return {
                success: false,
                message: '未找到要批准的提交'
            };
        }

        const updatedTodos = [...currentTodos];
        updatedTodos[todoIndex] = { ...todoToApprove, status: 'approved' };
        const updatedSites = [siteData, ...currentSites];

        // 准备 GitHub 更新
        const blobs: GitHubBlob[] = [
            {
                path: DATA_FILES.PENDING,
                content: serializeTodo(updatedTodos)
            },
            {
                path: DATA_FILES.SITES,
                content: serializeSites(updatedSites)
            }
        ];

        const result = await commitToGitHub(blobs, '网站已批准并上线', '批准失败');

        if (result.success) {
            // 更新状态
            updateStores({
                todos: updatedTodos,
                sites: updatedSites
            });
        }

        return result;
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
        // 获取当前状态
        const { currentTodos } = getCurrentStoreValues();

        // 更新 todo 状态为 rejected
        const todoIndex = currentTodos.findIndex(todo => isSameUrl(todo.url, todoToReject.url));
        if (todoIndex === -1) {
            return {
                success: false,
                message: '未找到要拒绝的提交'
            };
        }

        const updatedTodos = [...currentTodos];
        updatedTodos[todoIndex] = { ...todoToReject, status: 'rejected' };

        // 准备 GitHub 更新
        const blobs: GitHubBlob[] = [
            {
                path: DATA_FILES.PENDING,
                content: serializeTodo(updatedTodos)
            }
        ];

        const successMessage = reason ? `网站已拒绝: ${reason}` : '网站已拒绝';
        const result = await commitToGitHub(blobs, successMessage, '拒绝失败');

        if (result.success) {
            // 更新状态
            updateStores({ todos: updatedTodos });
        }

        return result;
    } catch (err) {
        console.error('Reject site error:', err);
        return {
            success: false,
            message: err instanceof Error ? err.message : '拒绝失败'
        };
    }
}

/**
 * 管理员登出
 */
export async function logout(): Promise<{ success: boolean; message?: string }> {
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

        console.log('Logout success');

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
    }
}