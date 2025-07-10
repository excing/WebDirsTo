import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ERROR_CODES, ERROR_MESSAGES } from '$lib/constants';
import { verifyAdminApiAccess } from '$lib/server/auth';
import { createGitHubService } from '$lib/server/github';
import type { GithubCommit } from '$lib/types';

/**
 * 验证 GitHub 提交数据格式
 */
function validateCommits(commits: unknown): commits is GithubCommit[] {
    if (!Array.isArray(commits)) {
        return false;
    }

    return commits.every(commit =>
        typeof commit === 'object' &&
        commit !== null &&
        typeof commit.path === 'string' &&
        typeof commit.content === 'string' &&
        typeof commit.message === 'string' &&
        commit.path.trim().length > 0 &&
        commit.message.trim().length > 0 &&
        (commit.sha === undefined || typeof commit.sha === 'string')
    );
}

/**
 * 处理 GitHub API 错误
 */
function handleGitHubError(error: unknown): { error: string; message: string; status: number } {
    if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // GitHub API 特定错误
        if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
            return {
                error: ERROR_CODES.UNAUTHORIZED,
                message: 'GitHub API 认证失败',
                status: 401
            };
        }

        if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
            return {
                error: ERROR_CODES.FORBIDDEN,
                message: 'GitHub API 权限不足',
                status: 403
            };
        }

        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            return {
                error: ERROR_CODES.NOT_FOUND,
                message: '文件或仓库不存在',
                status: 404
            };
        }

        if (errorMessage.includes('rate limit')) {
            return {
                error: ERROR_CODES.RATE_LIMIT_EXCEEDED,
                message: ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_EXCEEDED],
                status: 429
            };
        }

        if (errorMessage.includes('github api')) {
            return {
                error: ERROR_CODES.GITHUB_API_ERROR,
                message: ERROR_MESSAGES[ERROR_CODES.GITHUB_API_ERROR],
                status: 502
            };
        }
    }

    // 默认错误
    return {
        error: ERROR_CODES.FETCH_FAILED,
        message: ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED],
        status: 500
    };
}

/**
 * PUT /api/admin/github - 批量更新 GitHub 文件
 */
export const PUT: RequestHandler = async ({ request, cookies }) => {
    try {
        // 使用便捷函数验证 API 访问权限
        const authResult = verifyAdminApiAccess(cookies);

        if (!authResult.isAuthorized) {
            return json({
                success: false,
                error: ERROR_CODES.UNAUTHORIZED,
                message: authResult.error || '需要管理员权限'
            }, { status: 401 });
        }

        // 检查 Content-Type
        const contentType = request.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            return json({
                success: false,
                error: ERROR_CODES.VALIDATION_ERROR,
                message: '请求必须是 JSON 格式'
            }, { status: 400 });
        }

        // 解析请求体
        let commits: unknown;
        try {
            commits = await request.json();
        } catch (parseError) {
            return json({
                success: false,
                error: ERROR_CODES.VALIDATION_ERROR,
                message: '无效的 JSON 格式'
            }, { status: 400 });
        }

        // 验证数据格式
        if (!validateCommits(commits)) {
            return json({
                success: false,
                error: ERROR_CODES.VALIDATION_ERROR,
                message: '提交数据格式无效。每个提交必须包含 path、content 和 message 字段'
            }, { status: 400 });
        }

        // 检查提交数量限制
        if (commits.length === 0) {
            return json({
                success: false,
                error: ERROR_CODES.VALIDATION_ERROR,
                message: '至少需要一个提交'
            }, { status: 400 });
        }

        if (commits.length > 10) {
            return json({
                success: false,
                error: ERROR_CODES.VALIDATION_ERROR,
                message: '单次最多只能提交 10 个文件'
            }, { status: 400 });
        }

        // 记录操作日志
        console.log(`[GitHub API] 管理员 ${authResult.username} 正在更新 ${commits.length} 个文件:`,
            commits.map(c => c.path).join(', '));

        // 执行 GitHub 操作
        const github = createGitHubService();
        const result = await github.updateFiles(commits);

        // 根据结果生成响应消息
        let message: string;
        let responseData: any;

        if (result.failureCount === 0) {
            // 全部成功
            message = `成功更新 ${result.successCount} 个文件`;
            responseData = {
                success: result.success,
                totalCount: result.totalCount,
                successCount: result.successCount
            };
        } else {
            // 部分成功
            message = `批量更新完成: ${result.successCount}/${result.totalCount} 个文件成功，${result.failureCount} 个失败`;
            responseData = {
                success: result.success,
                failures: result.failures,
                totalCount: result.totalCount,
                successCount: result.successCount,
                failureCount: result.failureCount
            };
        }

        // 记录操作结果
        console.log(`[GitHub API] ${message}`);

        return json({
            success: true,
            data: responseData,
            message
        });

    } catch (error) {
        // 记录错误日志
        console.error('[GitHub API] 更新文件失败:', error);

        // 处理具体错误类型
        const { error: errorCode, message, status } = handleGitHubError(error);

        return json({
            success: false,
            error: errorCode,
            message
        }, { status });
    }
}
