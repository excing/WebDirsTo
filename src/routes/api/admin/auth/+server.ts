import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ApiResponse, AdminCredentials, AdminSession } from '$lib/types.js';
import { ERROR_CODES, ERROR_MESSAGES } from '$lib/constants';
import { AdminAuthService } from '$lib/server/auth.js';

/**
 * POST /api/admin/auth - 管理员登录
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const credentials: AdminCredentials = await request.json();

    // 使用认证服务验证凭据
    const validation = AdminAuthService.validateCredentials(credentials);

    if (!validation.isValid) {
      const statusCode = validation.error === '服务器配置错误' ? 500 :
                        validation.error === '用户名和密码是必填字段' ? 400 : 401;

      const response: ApiResponse<never> = {
        success: false,
        error: statusCode === 400 ? ERROR_CODES.VALIDATION_ERROR :
               statusCode === 500 ? ERROR_CODES.FETCH_FAILED : ERROR_CODES.UNAUTHORIZED,
        message: validation.error
      };
      return json(response, { status: statusCode });
    }

    // 创建会话并设置 Cookie
    const session = AdminAuthService.createSession(credentials.username);
    AdminAuthService.setSessionCookie(cookies, session);

    const response: ApiResponse<{ username: string }> = {
      success: true,
      data: { username: credentials.username },
      message: '登录成功'
    };

    return json(response);

  } catch (error) {
    console.error('Error during admin authentication:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: ERROR_CODES.FETCH_FAILED,
      message: ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED]
    };

    return json(response, { status: 500 });
  }
};

/**
 * GET /api/admin/auth - 检查管理员登录状态
 */
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    // 使用认证服务检查会话状态
    const sessionStatus = AdminAuthService.getSessionStatus(cookies);

    const response: ApiResponse<AdminSession> = {
      success: true,
      data: {
        isAuthenticated: sessionStatus.isAuthenticated,
        username: sessionStatus.username,
        expiresAt: sessionStatus.expiresAt
      }
    };

    return json(response);

  } catch (error) {
    console.error('Error checking admin session:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: ERROR_CODES.FETCH_FAILED,
      message: ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED]
    };

    return json(response, { status: 500 });
  }
};

/**
 * DELETE /api/admin/auth - 管理员登出
 */
export const DELETE: RequestHandler = async ({ cookies }) => {
  try {
    // 使用认证服务清除会话
    AdminAuthService.clearSession(cookies);

    const response: ApiResponse<never> = {
      success: true,
      message: '登出成功'
    };

    return json(response);

  } catch (error) {
    console.error('Error during admin logout:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: ERROR_CODES.FETCH_FAILED,
      message: ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED]
    };

    return json(response, { status: 500 });
  }
};
