import { request } from "$lib/fetch";
import type { GithubCommit } from "$lib/types";

export const API = {
    // 一次获取 sites, pendingList, archivedList 网站列表
    getSites: async () => {
        return await request('/api/admin/sites');
    },
    // 支持批量更新 GitHub 文件
    putCommits: async (commits: GithubCommit[]) => {
        return await request('/api/admin/sites', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commits),
        });
    },
    // 提交网站
    // 如果是普通用户提交, 则网站进入 todo 列表
    // 如果是管理员提交, 则网站进入 sites 列表
    submitSite: async (url: string) => {
        return await request('/api/submit-site', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url,
            }),
        });
    },
    // 分析网站
    analyzeSite: async (url: string) => {
        return await request('/api/analyze-site', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url,
            }),
        });
    },
}