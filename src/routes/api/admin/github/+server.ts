import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ERROR_CODES, ERROR_MESSAGES } from '$lib/constants';
import { AdminAuthService } from '$lib/server/auth';
import { analyzeURL } from '$lib/server/analyze';
import { isValidUrl } from '$lib/url';
import type { GitHubBlob } from '$lib/types';
import { createGitHubService } from '$lib/server/github';

/**
 * POST /api/admin/github - 批量更新 GitHub 文件
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        // 使用认证服务验证 API 访问权限
        const authResult = AdminAuthService.verifyApiAccess(cookies);

        if (!authResult.isAuthorized) {
            return json({
                success: false,
                error: ERROR_CODES.UNAUTHORIZED,
                message: authResult.error || '需要管理员权限'
            }, { status: 401 });
        }

        const blobs: GitHubBlob[] = await request.json();

        const github = createGitHubService();

        const data = await github.commits(blobs);

        return json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Error performing action:', error);

        return json({
            success: false,
            error: ERROR_CODES.FETCH_FAILED,
            message: error instanceof Error ? error.message : ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED]
        }, { status: 500 });
    }
}
