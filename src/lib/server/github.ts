import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";
import { request } from "$lib/fetch";
import { Octokit } from 'octokit';
import { decode64, encode64 } from "$lib/tools";
import type { GitHubBlob, GitHubFile, GitHubFileResponse } from "$lib/types";

export class GitHubService {
    private octokit: Octokit;
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
        this.octokit = new Octokit({
            auth: token
        });
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

    async commits(message: string, blobs: GitHubBlob[], branch: string = "main") {
        const owner = this.owner;
        const repo = this.repo;
        // console.log('1. 获取当前分支的最新 commit');

        // 1. 获取当前分支的最新 commit
        const currentCommit = await this.octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${branch}`
        });
        // console.log('2. 获取当前 commit 的 tree');

        // 2. 获取当前 commit 的 tree
        const currentTree = await this.octokit.rest.git.getCommit({
            owner,
            repo,
            commit_sha: currentCommit.data.object.sha
        });
        // console.log('3. 创建新的 tree（包含所有文件更改）');

        // 3. 创建新的 tree（包含所有文件更改）
        const newTree = await this.octokit.rest.git.createTree({
            owner,
            repo,
            base_tree: currentTree.data.tree.sha,
            tree: blobs.map(blob => {
                return {
                    path: blob.path,
                    mode: '100644',
                    type: 'blob',
                    content: blob.content
                };
            })
        });
        // console.log('4. 创建新的 commit');

        // 4. 创建新的 commit
        const newCommit = await this.octokit.rest.git.createCommit({
            owner,
            repo,
            message,
            tree: newTree.data.sha,
            parents: [currentCommit.data.object.sha]
        });
        // console.log('5. 更新分支引用');

        // 5. 更新分支引用
        return await this.octokit.rest.git.updateRef({
            owner,
            repo,
            ref: `heads/${branch}`,
            sha: newCommit.data.sha
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