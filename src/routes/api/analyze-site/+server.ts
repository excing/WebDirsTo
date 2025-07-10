import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {  ERROR_CODES, ERROR_MESSAGES } from '$lib/constants';
import { AdminAuthService } from '$lib/server/auth';
import { analyzeURL } from '$lib/server/analyze';
import { isValidUrl } from '$lib/url';

/**
 * PUT /api/admin/sites - 更新指定网站数据
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

        const { url } = await request.json();
        if (isValidUrl(url)) {
            return json({
                success: false,
                error: ERROR_CODES.UNAUTHORIZED,
                message: '请提供有效的网址'
            }, { status: 400 });
        }

        const analysisResult = await analyzeURL(url);

        return json({
            success: true,
            data: analysisResult,
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
