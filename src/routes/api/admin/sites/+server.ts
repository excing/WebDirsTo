import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ApiResponse, AdminCredentials, AdminSession } from '$lib/types.js';
import { ERROR_CODES, ERROR_MESSAGES } from '$lib/constants';
import { AdminAuthService } from '$lib/server/auth.js';

/**
 * Get /api/admin/sites - 获取所有网站数据
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

        // 继续处理已认证的请求
        // ...

        return json({
            success: true,
            data: '所有网站数据'
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