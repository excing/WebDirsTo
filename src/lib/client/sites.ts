// 管理员页面
// 客户端网站处理模块, 使用全局状态管理
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

/**
 * 网站管理状态
 */
interface SitesState {
    sites: Site[];
    todos: Todo[];
    archived: Site[];
    loading: boolean;
    error: string | null;
}

/**
 * 全局状态管理
 */
class SitesManager {
    private state: SitesState = {
        sites: [],
        todos: [],
        archived: [],
        loading: false,
        error: null
    };

    private listeners: Array<(state: SitesState) => void> = [];

    /**
     * 订阅状态变化
     */
    subscribe(listener: (state: SitesState) => void) {
        this.listeners.push(listener);
        listener(this.state); // 立即调用一次

        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * 更新状态
     */
    private setState(updates: Partial<SitesState>) {
        this.state = { ...this.state, ...updates };
        this.listeners.forEach(listener => listener(this.state));
    }

    /**
     * 获取当前状态
     */
    getState(): SitesState {
        return { ...this.state };
    }

    /**
     * 加载所有数据
     */
    async loadData(): Promise<void> {
        this.setState({ loading: true, error: null });

        try {
            const response = await API.getSites();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || '获取数据失败');
            }

            const { sites, pendingList, archivedList } = result.data;

            this.setState({
                sites: parseSites(sites.content),
                todos: parseTodo(pendingList.content),
                archived: parseSites(archivedList.content),
                loading: false
            });
        } catch (error) {
            console.error('Failed to load sites data:', error);
            this.setState({
                loading: false,
                error: error instanceof Error ? error.message : '加载数据失败'
            });
        }
    }

    /**
     * 1. 提交新网站
     */
    async submitSite(url: string): Promise<{ success: boolean; message?: string }> {
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
                await this.loadData();
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
        } catch (error) {
            console.error('Submit site error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : '网络错误'
            };
        }
    }

    /**
     * 2.1 删除网站: 从 sites.txt 中删除, 并移动到 404.txt 中
     */
    async deleteSite(siteToDelete: Site): Promise<{ success: boolean; message?: string }> {
        try {
            const currentSites = [...this.state.sites];
            const currentArchived = [...this.state.archived];

            // 从 sites 中移除
            const updatedSites = currentSites.filter(site => site.url !== siteToDelete.url);

            // 添加到 archived
            const updatedArchived = [...currentArchived, siteToDelete];

            // 准备 GitHub 更新
            const blobs: GitHubBlob[] = [
                {
                    path: DATA_FILES.SITES,
                    content: serializeSites(updatedSites)
                },
                {
                    path: DATA_FILES.ARCHIVED,
                    content: serializeSites(updatedArchived)
                }
            ];

            const response = await API.commits(blobs);

            if (!response.ok) {
                const result = await response.json();
                return {
                    success: false,
                    message: result.message || '删除失败'
                };
            }

            const result = await response.json();

            if (result.success) {
                // 更新本地状态
                this.setState({
                    sites: updatedSites,
                    archived: updatedArchived
                });

                return {
                    success: true,
                    message: '网站已删除并归档'
                };
            } else {
                return {
                    success: false,
                    message: result.message || '删除失败'
                };
            }
        } catch (error) {
            console.error('Delete site error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : '删除失败'
            };
        }
    }

    /**
     * 2.2 编辑网站: 直接修改 sites.txt 中的内容
     */
    async editSite(originalSite: Site, updatedSite: Site): Promise<{ success: boolean; message?: string }> {
        try {
            const currentSites = [...this.state.sites];

            // 找到并更新网站
            const siteIndex = currentSites.findIndex(site => site.url === originalSite.url);
            if (siteIndex === -1) {
                return {
                    success: false,
                    message: '未找到要编辑的网站'
                };
            }

            currentSites[siteIndex] = { ...updatedSite };

            // 准备 GitHub 更新
            const blobs: GitHubBlob[] = [
                {
                    path: DATA_FILES.SITES,
                    content: serializeSites(currentSites)
                }
            ];

            const response = await API.commits(blobs);

            if (!response.ok) {
                const result = await response.json();
                return {
                    success: false,
                    message: result.message || '编辑失败'
                };
            }

            const result = await response.json();

            if (result.success) {
                // 更新本地状态
                this.setState({
                    sites: currentSites
                });

                return {
                    success: true,
                    message: '网站信息已更新'
                };
            } else {
                return {
                    success: false,
                    message: result.message || '编辑失败'
                };
            }
        } catch (error) {
            console.error('Edit site error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : '编辑失败'
            };
        }
    }

    /**
     * 2.3 批准网站: 从 todo.csv 中更新状态为 approved, 并添加到 sites.txt 中
     */
    async approveSite(todoToApprove: Todo, siteData: Site): Promise<{ success: boolean; message?: string }> {
        try {
            const currentTodos = [...this.state.todos];
            const currentSites = [...this.state.sites];

            // 更新 todo 状态为 approved
            const todoIndex = currentTodos.findIndex(todo => todo.url === todoToApprove.url);
            if (todoIndex === -1) {
                return {
                    success: false,
                    message: '未找到要批准的提交'
                };
            }

            currentTodos[todoIndex] = { ...todoToApprove, status: 'approved' };

            // 添加到 sites
            currentSites.push(siteData);

            // 准备 GitHub 更新
            const blobs: GitHubBlob[] = [
                {
                    path: DATA_FILES.PENDING,
                    content: serializeTodo(currentTodos)
                },
                {
                    path: DATA_FILES.SITES,
                    content: serializeSites(currentSites)
                }
            ];

            const response = await API.commits(blobs);

            if (!response.ok) {
                const result = await response.json();
                return {
                    success: false,
                    message: result.message || '批准失败'
                };
            }

            const result = await response.json();

            if (result.success) {
                // 更新本地状态
                this.setState({
                    todos: currentTodos,
                    sites: currentSites
                });

                return {
                    success: true,
                    message: '网站已批准并上线'
                };
            } else {
                return {
                    success: false,
                    message: result.message || '批准失败'
                };
            }
        } catch (error) {
            console.error('Approve site error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : '批准失败'
            };
        }
    }

    /**
     * 2.4 拒绝网站: 从 todo.csv 中更新状态为 rejected
     */
    async rejectSite(todoToReject: Todo, reason?: string): Promise<{ success: boolean; message?: string }> {
        try {
            const currentTodos = [...this.state.todos];

            // 更新 todo 状态为 rejected
            const todoIndex = currentTodos.findIndex(todo => todo.url === todoToReject.url);
            if (todoIndex === -1) {
                return {
                    success: false,
                    message: '未找到要拒绝的提交'
                };
            }

            currentTodos[todoIndex] = { ...todoToReject, status: 'rejected' };

            // 准备 GitHub 更新
            const blobs: GitHubBlob[] = [
                {
                    path: DATA_FILES.PENDING,
                    content: serializeTodo(currentTodos)
                }
            ];

            const response = await API.commits(blobs);

            if (!response.ok) {
                const result = await response.json();
                return {
                    success: false,
                    message: result.message || '拒绝失败'
                };
            }

            const result = await response.json();

            if (result.success) {
                // 更新本地状态
                this.setState({
                    todos: currentTodos
                });

                return {
                    success: true,
                    message: reason ? `网站已拒绝: ${reason}` : '网站已拒绝'
                };
            } else {
                return {
                    success: false,
                    message: result.message || '拒绝失败'
                };
            }
        } catch (error) {
            console.error('Reject site error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : '拒绝失败'
            };
        }
    }

    /**
     * 批量操作: 批准多个网站
     */
    async batchApproveSites(approvals: Array<{ todo: Todo; site: Site }>): Promise<{
        success: boolean;
        message?: string;
        results?: Array<{ url: string; success: boolean; message?: string }>;
    }> {
        const results: Array<{ url: string; success: boolean; message?: string }> = [];
        let successCount = 0;

        for (const { todo, site } of approvals) {
            try {
                const result = await this.approveSite(todo, site);
                results.push({
                    url: todo.url,
                    success: result.success,
                    message: result.message
                });

                if (result.success) {
                    successCount++;
                }
            } catch (error) {
                results.push({
                    url: todo.url,
                    success: false,
                    message: error instanceof Error ? error.message : '批准失败'
                });
            }
        }

        return {
            success: successCount > 0,
            message: `成功批准 ${successCount}/${approvals.length} 个网站`,
            results
        };
    }

    /**
     * 批量操作: 拒绝多个网站
     */
    async batchRejectSites(rejections: Array<{ todo: Todo; reason?: string }>): Promise<{
        success: boolean;
        message?: string;
        results?: Array<{ url: string; success: boolean; message?: string }>;
    }> {
        const results: Array<{ url: string; success: boolean; message?: string }> = [];
        let successCount = 0;

        for (const { todo, reason } of rejections) {
            try {
                const result = await this.rejectSite(todo, reason);
                results.push({
                    url: todo.url,
                    success: result.success,
                    message: result.message
                });

                if (result.success) {
                    successCount++;
                }
            } catch (error) {
                results.push({
                    url: todo.url,
                    success: false,
                    message: error instanceof Error ? error.message : '拒绝失败'
                });
            }
        }

        return {
            success: successCount > 0,
            message: `成功拒绝 ${successCount}/${rejections.length} 个网站`,
            results
        };
    }

    /**
     * 获取统计信息
     */
    getStats() {
        const { sites, todos, archived } = this.state;

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
    }

    /**
     * 搜索网站
     */
    searchSites(query: string): Site[] {
        if (!query.trim()) {
            return this.state.sites;
        }

        const searchTerm = query.toLowerCase();
        return this.state.sites.filter(site =>
            site.title.toLowerCase().includes(searchTerm) ||
            site.description.toLowerCase().includes(searchTerm) ||
            site.category.toLowerCase().includes(searchTerm) ||
            site.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            site.url.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * 按分类筛选网站
     */
    filterSitesByCategory(category: string): Site[] {
        if (!category) {
            return this.state.sites;
        }

        return this.state.sites.filter(site => site.category === category);
    }

    /**
     * 获取所有分类
     */
    getCategories(): string[] {
        const categories = new Set(this.state.sites.map(site => site.category));
        return Array.from(categories).sort();
    }
}

// 创建全局实例
export const sitesManager = new SitesManager();

// 导出便捷函数
export const {
    subscribe,
    loadData,
    submitSite,
    deleteSite,
    editSite,
    approveSite,
    rejectSite,
    batchApproveSites,
    batchRejectSites,
    getStats,
    searchSites,
    filterSitesByCategory,
    getCategories,
    getState
} = sitesManager;

