import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";
import { request } from "$lib/fetch";
import { decode64, encode64 } from "$lib/tools";
import type { GitHubFile } from "$lib/types";

export class GitHubService {
    private token: string;
    private owner: string;
    private repo: string;
    private baseUrl = 'https://api.github.com';
    private rawUrl = 'https://raw.githubusercontent.com';

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
        if (dev) {
            return this.getFileContent(path);
        }
        try {
            // https://cdn.jsdelivr.net/gh/excing/testnote/todo.cvs
            const rawUrl = `${this.rawUrl}/${this.owner}/${this.repo}/refs/heads/main/${path}`;

            const file = await request(rawUrl)
            const content = await file.text();

            return content;
        } catch (error) {
            if (error instanceof Error && error.message.includes('404')) {
                // 文件不存在，返回空内容
                return '';
            }
            throw error;
        }
    }

    /**
     * 获取文件内容
     */
    async getFileContent(path: string): Promise<string> {
        try {
            const file = await this.api<GitHubFile>(
                `/repos/${this.owner}/${this.repo}/contents/${path}`
            );

            const content = file.encoding === 'base64'
                ? decode64(file.content)
                : file.content;

            return content;
        } catch (error) {
            throw error;
        }
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
    async updateFile(path: string, content: string, message: string, sha?: string): Promise<void> {
        const body: any = {
            message,
            content: encode64(content)
        };

        if (sha) {
            body.sha = sha;
        }

        return await this.api(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
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