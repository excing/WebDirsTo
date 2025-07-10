import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";
import { request } from "$lib/fetch";
import { decode64, encode64 } from "$lib/tools";
import type { GithubCommit, GitHubFile, GitHubFileResponse } from "$lib/types";

export class GitHubService {
    private token: string;
    private owner: string;
    private repo: string;
    private baseUrl = 'https://api.github.com';
    private rawUrls = [
        'https://raw.githubusercontent.com',
        'https://cdn.jsdelivr.net/gh',
        'https://gcore.jsdelivr.net/gh',
        'https://testingcf.jsdelivr.net/gh',
        'https://quantil.jsdelivr.net/gh',
    ];

    constructor(token: string, owner: string, repo: string) {
        this.token = token;
        this.owner = owner;
        this.repo = repo;
    }

    private async api<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const response = await request(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`GitHub API Error: ${response.status} - ${error.message}`);
        }

        return response.json();
    }

    /**
     * 获取raw文件内容
     */
    async getRawFileContent(path: string): Promise<string> {
        // https://cdn.jsdelivr.net/gh/excing/testnote/todo.cvs
        // https://github.com/excing/testnote/raw/refs/heads/main/sites.txt
        const min = dev ? 2 : 0;
        const index = Math.floor(Math.random() * (this.rawUrls.length - min)) + min;

        const tryGetFile = async (i: number): Promise<string> => {
            try {
                const file = await request(this.getRawFileUrl(i, path));
                if (!file.ok) throw new Error(`HTTP ${file.status}: ${file.statusText}`);
                const content = await file.text();
                return content;
            } catch (error) {
                if (error instanceof Error && error.message.includes('404')) return '';
                throw error;
            }
        };

        try {
            return await tryGetFile(index);
        } catch {
            return await tryGetFile(index + 1);
        }

    }

    getRawFileUrl(index: number, path: string): string {
        const rawBaseUrl = this.rawUrls[index % this.rawUrls.length];
        const rawUrl = rawBaseUrl === this.rawUrls[0]
            ? `${rawBaseUrl}/${this.owner}/${this.repo}/raw/refs/heads/main/${path}`
            : `${rawBaseUrl}/${this.owner}/${this.repo}/${path}`;
        return rawUrl;

    }

    /**
     * 获取文件
     */
    async getFileContents(path: string): Promise<GitHubFile> {
        try {
            const file = await this.api<GitHubFile>(
                `/repos/${this.owner}/${this.repo}/contents/${path}`
            );

            const content = file.encoding === 'base64'
                ? decode64(file.content)
                : file.content;

            return { ...file, content };
        } catch (error) {
            throw error;
        }
    }

    /**
     * 更新文件内容
     */
    async updateFile(path: string, content: string, message: string, sha?: string): Promise<GitHubFileResponse> {
        const body: any = {
            message,
            content: encode64(content)
        };

        if (sha) {
            body.sha = sha;
        }

        return await this.api<GitHubFileResponse>(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    /**
     * 批量更新文件内容
     * 返回包含成功和失败结果的详细信息，由客户端处理
     */
    async updateFiles(commits: GithubCommit[]): Promise<{
        success: GitHubFileResponse[];
        failures: Array<{ commit: GithubCommit; error: string }>;
        totalCount: number;
        successCount: number;
        failureCount: number;
    }> {
        if (commits.length === 0) {
            return {
                success: [],
                failures: [],
                totalCount: 0,
                successCount: 0,
                failureCount: 0
            };
        }

        // 使用 Promise.allSettled 处理部分失败的情况
        const results = await Promise.allSettled(
            commits.map(commit =>
                this.updateFile(commit.path, commit.content, commit.message, commit.sha)
            )
        );

        const success: GitHubFileResponse[] = [];
        const failures: Array<{ commit: GithubCommit; error: string }> = [];

        results.forEach((result, index) => {
            const commit = commits[index];

            if (result.status === 'fulfilled') {
                success.push(result.value);
            } else {
                const errorMsg = result.reason?.message || String(result.reason);
                failures.push({
                    commit,
                    error: errorMsg
                });
                console.error(`[GitHub] 文件 ${commit.path} 更新失败:`, errorMsg);
            }
        });

        const result = {
            success,
            failures,
            totalCount: commits.length,
            successCount: success.length,
            failureCount: failures.length
        };

        // 记录批量操作结果
        console.log(`[GitHub] 批量更新完成: ${result.successCount}/${result.totalCount} 成功`);

        // 只有在全部失败时才抛出异常
        if (result.failureCount === result.totalCount) {
            const errorMessage = `所有文件更新失败:\n${failures.map(f => `${f.commit.path}: ${f.error}`).join('\n')}`;
            throw new Error(errorMessage);
        }

        return result;
    }


}

/**
 * 创建GitHub服务实例
 */
export function createGitHubService(): GitHubService {
    const token = env.GITHUB_TOKEN;
    const owner = env.GITHUB_OWNER;
    const repo = env.GITHUB_REPO;

    if (!token || !owner || !repo) {
        throw new Error('Missing required GitHub configuration. Please check your environment variables.');
    }

    return new GitHubService(token, owner, repo);
}