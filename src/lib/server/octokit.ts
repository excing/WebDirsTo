import { Octokit } from 'octokit';

async function commits(owner: string, repo: string, branch: string) {
    const octokit = new Octokit({
        auth: 'YOUR_GITHUB_TOKEN'
    });

    // 1. 获取当前分支的最新 commit
    const currentCommit = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`
    });

    // 2. 获取当前 commit 的 tree
    const currentTree = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: currentCommit.data.object.sha
    });

    // 3. 创建新的 tree（包含所有文件更改）
    const newTree = await octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: currentTree.data.tree.sha,
        tree: [
            {
                path: 'file1.txt',
                mode: '100644',
                type: 'blob',
                content: 'file1 content'
            },
            {
                path: 'file2.txt',
                mode: '100644',
                type: 'blob',
                content: 'file2 content'
            }
            // ... 更多文件
        ]
    });

    // 4. 创建新的 commit
    const newCommit = await octokit.rest.git.createCommit({
        owner,
        repo,
        message: 'Batch commit message',
        tree: newTree.data.sha,
        parents: [currentCommit.data.object.sha]
    });

    // 5. 更新分支引用
    await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.data.sha
    });
}