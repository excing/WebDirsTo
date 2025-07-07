import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import type { ApiResponse, AdminCredentials, AdminSession } from '$lib/types.js';
import { dev } from '$app/environment';
import { ERROR_CODES, ERROR_MESSAGES } from '$lib/constants';

/**
 * POST /api/admin/auth - 管理员登录
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const credentials: AdminCredentials = await request.json();
    
    // 验证必填字段
    if (!credentials.username || !credentials.password) {
      const response: ApiResponse<never> = {
        success: false,
        error: ERROR_CODES.VALIDATION_ERROR,
        message: '用户名和密码是必填字段'
      };
      return json(response, { status: 400 });
    }
    
    // 验证凭据
    const adminUsername = env.ADMIN_USERNAME;
    const adminPassword = env.ADMIN_PASSWORD;
    
    if (!adminUsername || !adminPassword) {
      console.error('Admin credentials not configured in environment variables');
      const response: ApiResponse<never> = {
        success: false,
        error: ERROR_CODES.FETCH_FAILED,
        message: '服务器配置错误'
      };
      return json(response, { status: 500 });
    }
    
    if (credentials.username !== adminUsername || credentials.password !== adminPassword) {
      const response: ApiResponse<never> = {
        success: false,
        error: ERROR_CODES.UNAUTHORIZED,
        message: '用户名或密码错误'
      };
      return json(response, { status: 401 });
    }
    
    // 创建会话
    const session: AdminSession = {
      isAuthenticated: true,
      username: credentials.username,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24小时后过期
    };
    
    // 设置安全的HTTP-only cookie
    cookies.set('admin-session', JSON.stringify(session), {
      httpOnly: true,
      secure: !dev,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24小时
      path: '/'
    });
    
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
    const sessionCookie = cookies.get('admin-session');
    
    if (!sessionCookie) {
      const response: ApiResponse<AdminSession> = {
        success: true,
        data: { isAuthenticated: false }
      };
      return json(response);
    }
    
    let session: AdminSession;
    try {
      session = JSON.parse(sessionCookie);
    } catch {
      // Cookie格式错误，清除cookie
      cookies.delete('admin-session', { path: '/' });
      const response: ApiResponse<AdminSession> = {
        success: true,
        data: { isAuthenticated: false }
      };
      return json(response);
    }
    
    // 检查会话是否过期
    if (session.expiresAt && Date.now() > session.expiresAt) {
      cookies.delete('admin-session', { path: '/' });
      const response: ApiResponse<AdminSession> = {
        success: true,
        data: { isAuthenticated: false }
      };
      return json(response);
    }
    
    const response: ApiResponse<AdminSession> = {
      success: true,
      data: {
        isAuthenticated: true,
        username: session.username
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
    cookies.delete('admin-session', { path: '/' });
    
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
