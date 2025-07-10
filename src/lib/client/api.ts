import { request } from "$lib/fetch";
import type { GithubCommit } from "$lib/types";

export const API = {
    getSites: async () => {
        return await request('/api/admin/sites');
    },
    putSite: async (commits: GithubCommit[]) => {
        return await request('/api/admin/sites', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commits),
        });
    },
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