import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ERROR_CODES, ERROR_MESSAGES } from '$lib/constants';
import { AdminAuthService } from '$lib/server/auth';
import type { GitHubBlob } from '$lib/types';
import { createGitHubService } from '$lib/server/github';

/**
 * 验证 GitHubBlob 对象的有效性
 */
function validateGitHubBlob(blob: any): blob is GitHubBlob {
    if (!blob || typeof blob !== 'object') {
        return false;
    }

    // 检查必需字段
    if (typeof blob.path !== 'string' || typeof blob.content !== 'string') {
        return false;
    }

    // 检查 path 是否为空或只包含空白字符
    if (!blob.path.trim()) {
        return false;
    }

    // 检查 path 是否包含非法字符
    const invalidChars = /[<>:"|?*\x00-\x1f]/;
    if (invalidChars.test(blob.path)) {
        return false;
    }

    // 检查 path 长度限制 (GitHub 限制为 255 字符)
    if (blob.path.length > 255) {
        return false;
    }

    // 检查 content 长度限制 (GitHub 单文件限制为 100MB，这里设置为 50MB)
    const maxContentSize = 50 * 1024 * 1024; // 50MB
    if (blob.content.length > maxContentSize) {
        return false;
    }

    return true;
}

/**
 * 验证请求体的有效性
 */
function validateRequestBody(body: any) {
    // 检查是否为数组
    if (!Array.isArray(body)) {
        return {
            isValid: false,
            error: '请求体必须是一个数组'
        };
    }

    // 检查数组长度限制
    if (body.length === 0) {
        return {
            isValid: false,
            error: '请求体不能为空数组'
        };
    }

    if (body.length > 10) {
        return {
            isValid: false,
            error: '单次最多只能更新 10 个文件'
        };
    }

    // 验证每个 blob 对象
    const validatedBlobs: GitHubBlob[] = [];
    const pathSet = new Set<string>();

    for (let i = 0; i < body.length; i++) {
        const blob = body[i];

        if (!validateGitHubBlob(blob)) {
            return {
                isValid: false,
                error: `第 ${i + 1} 个文件对象格式无效：必须包含有效的 path 和 content 字段`
            };
        }

        // 检查路径重复
        if (pathSet.has(blob.path)) {
            return {
                isValid: false,
                error: `文件路径重复：${blob.path}`
            };
        }

        pathSet.add(blob.path);
        validatedBlobs.push({
            path: blob.path.trim(),
            content: blob.content
        });
    }

    return {
        isValid: true,
        blobs: validatedBlobs
    };
}

/**
 * POST /api/admin/github - 批量更新 GitHub 文件
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        // 1. 验证认证权限
        const authResult = AdminAuthService.verifyApiAccess(cookies);

        if (!authResult.isAuthorized) {
            return json({
                success: false,
                error: ERROR_CODES.UNAUTHORIZED,
                message: authResult.error || '需要管理员权限'
            }, { status: 401 });
        }

        // 2. 解析请求体
        let requestBody: any;
        try {
            requestBody = await request.json();
        } catch (parseError) {
            return json({
                success: false,
                error: ERROR_CODES.VALIDATION_ERROR,
                message: '请求体格式错误：无法解析 JSON'
            }, { status: 400 });
        }

        // 3. 验证请求体
        const validation = validateRequestBody(requestBody);
        if (!validation.isValid) {
            return json({
                success: false,
                error: ERROR_CODES.VALIDATION_ERROR,
                message: validation.error
            }, { status: 400 });
        }

        const blobs = validation.blobs!;

        // 4. 创建 GitHub 服务实例
        let github;
        try {
            github = createGitHubService();
        } catch (configError) {
            console.error('GitHub service configuration error:', configError);
            return json({
                success: false,
                error: ERROR_CODES.GITHUB_API_ERROR,
                message: 'GitHub 服务配置错误，请检查环境变量'
            }, { status: 502 });
        }

        // 5. 执行 GitHub 操作
        try {
            const data = await github.commits('Batch commit message', blobs);

            return json({
                success: true,
                data,
                message: `成功更新 ${blobs.length} 个文件`
            });
        } catch (githubError) {
            console.error('GitHub API error:', githubError);

            // 根据错误类型返回不同的状态码和消息
            if (githubError instanceof Error) {
                const errorMessage = githubError.message.toLowerCase();

                // GitHub API 权限错误
                if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
                    return json({
                        success: false,
                        error: ERROR_CODES.FORBIDDEN,
                        message: 'GitHub 权限不足，请检查 Token 权限'
                    }, { status: 403 });
                }

                // GitHub API 未找到错误
                if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                    return json({
                        success: false,
                        error: ERROR_CODES.NOT_FOUND,
                        message: '仓库或分支不存在'
                    }, { status: 404 });
                }

                // GitHub API 频率限制
                if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
                    return json({
                        success: false,
                        error: ERROR_CODES.RATE_LIMIT_EXCEEDED,
                        message: ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_EXCEEDED]
                    }, { status: 429 });
                }

                // 其他 GitHub API 错误
                return json({
                    success: false,
                    error: ERROR_CODES.GITHUB_API_ERROR,
                    message: `GitHub API 错误: ${githubError.message}`
                }, { status: 502 });
            }

            // 未知错误
            return json({
                success: false,
                error: ERROR_CODES.GITHUB_API_ERROR,
                message: ERROR_MESSAGES[ERROR_CODES.GITHUB_API_ERROR]
            }, { status: 502 });
        }

    } catch (error) {
        console.error('Unexpected error in GitHub API:', error);

        return json({
            success: false,
            error: ERROR_CODES.FETCH_FAILED,
            message: error instanceof Error ? error.message : ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED]
        }, { status: 500 });
    }
}
