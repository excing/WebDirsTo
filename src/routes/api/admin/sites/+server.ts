import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DATA_FILES, ERROR_CODES, ERROR_MESSAGES } from '$lib/constants';
import { AdminAuthService } from '$lib/server/auth';
import { createGitHubService } from '$lib/server/github';
import type { GithubCommit, Site } from '$lib/types';
import { parseSites, serializeSites } from '$lib/conv';
import { isSameUrl } from '$lib/url';

/**
 * Get /api/admin/sites - 获取所有网站数据
 */
export const GET: RequestHandler = async ({ cookies }) => {
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

        const github = createGitHubService();
        // 请改写 Promise.all 写法
        const [sites, pendingList, archivedList] = await Promise.all([
            github.getFileContents(DATA_FILES.SITES),
            github.getFileContents(DATA_FILES.PENDING),
            github.getFileContents(DATA_FILES.ARCHIVED)
        ]);

        return json({
            success: true,
            data: { sites, pendingList, archivedList }
        });

    } catch (error) {
        console.error('Error fetching sites data:', error);

        return json({
            success: false,
            error: ERROR_CODES.FETCH_FAILED,
            message: ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED]
        }, { status: 500 });
    }
}

/**
 * POST /api/admin/sites - 更新指定网站数据
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

        const github = createGitHubService();
        const commits: GithubCommit[] = await request.json();
        for (let index = 0; index < commits.length; index++) {
            const commit = commits[index];
            await github.updateFile(commit.path, commit.content, commit.message, commit.sha);
        }

        return json({
            success: true,
            message: '更新成功'
        });
    } catch (error) {
        console.error('Error performing action:', error);

        return json({
            success: false,
            error: ERROR_CODES.FETCH_FAILED,
            message: ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED]
        }, { status: 500 });
    }
}
