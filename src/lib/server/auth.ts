import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import type { AdminSession, AdminCredentials } from '$lib/types.js';

/**
 * 管理员认证服务
 * 提供统一的认证逻辑，供 API 和其他服务使用
 */
export class AdminAuthService {
  private static readonly COOKIE_NAME = 'admin-session';
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24小时

  /**
   * 验证管理员凭据
   * @param credentials 登录凭据
   * @returns 验证结果
   */
  static validateCredentials(credentials: AdminCredentials): {
    isValid: boolean;
    error?: string;
  } {
    // 验证必填字段
    if (!credentials.username || !credentials.password) {
      return {
        isValid: false,
        error: '用户名和密码是必填字段'
      };
    }

    // 获取环境变量中的管理员凭据
    const adminUsername = env.ADMIN_USERNAME;
    const adminPassword = env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      console.error('Admin credentials not configured in environment variables');
      return {
        isValid: false,
        error: '服务器配置错误'
      };
    }

    // 验证凭据
    if (credentials.username !== adminUsername || credentials.password !== adminPassword) {
      return {
        isValid: false,
        error: '用户名或密码错误'
      };
    }

    return { isValid: true };
  }

  /**
   * 创建管理员会话
   * @param username 用户名
   * @returns 会话对象
   */
  static createSession(username: string): AdminSession {
    return {
      isAuthenticated: true,
      username,
      expiresAt: Date.now() + this.SESSION_DURATION
    };
  }

  /**
   * 设置会话 Cookie
   * @param cookies SvelteKit cookies 对象
   * @param session 会话对象
   */
  static setSessionCookie(cookies: Cookies, session: AdminSession): void {
    cookies.set(this.COOKIE_NAME, JSON.stringify(session), {
      httpOnly: true,
      secure: !dev,
      sameSite: 'strict',
      maxAge: this.SESSION_DURATION / 1000, // 转换为秒
      path: '/'
    });
  }

  /**
   * 获取当前会话
   * @param cookies SvelteKit cookies 对象
   * @returns 会话对象或 null
   */
  static getSession(cookies: Cookies): AdminSession | null {
    const sessionCookie = cookies.get(this.COOKIE_NAME);
    
    if (!sessionCookie) {
      return null;
    }

    try {
      const session: AdminSession = JSON.parse(sessionCookie);
      
      // 检查会话是否过期
      if (session.expiresAt && Date.now() > session.expiresAt) {
        this.clearSession(cookies);
        return null;
      }

      return session;
    } catch (error) {
      // Cookie 格式错误，清除 cookie
      this.clearSession(cookies);
      return null;
    }
  }

  /**
   * 检查管理员是否已认证
   * @param cookies SvelteKit cookies 对象
   * @returns 认证状态
   */
  static isAuthenticated(cookies: Cookies): boolean {
    const session = this.getSession(cookies);
    return session?.isAuthenticated === true;
  }

  /**
   * 获取当前认证的管理员用户名
   * @param cookies SvelteKit cookies 对象
   * @returns 用户名或 null
   */
  static getAuthenticatedUsername(cookies: Cookies): string | null {
    const session = this.getSession(cookies);
    return session?.username || null;
  }

  /**
   * 清除会话
   * @param cookies SvelteKit cookies 对象
   */
  static clearSession(cookies: Cookies): void {
    cookies.delete(this.COOKIE_NAME, { path: '/' });
  }

  /**
   * 验证 API 请求的管理员权限
   * @param cookies SvelteKit cookies 对象
   * @returns 验证结果
   */
  static verifyApiAccess(cookies: Cookies): {
    isAuthorized: boolean;
    session?: AdminSession;
    error?: string;
  } {
    const session = this.getSession(cookies);
    
    if (!session) {
      return {
        isAuthorized: false,
        error: '未登录或会话已过期'
      };
    }

    if (!session.isAuthenticated) {
      return {
        isAuthorized: false,
        error: '认证失败'
      };
    }

    return {
      isAuthorized: true,
      session
    };
  }

  /**
   * 刷新会话过期时间
   * @param cookies SvelteKit cookies 对象
   * @returns 是否成功刷新
   */
  static refreshSession(cookies: Cookies): boolean {
    const session = this.getSession(cookies);
    
    if (!session || !session.isAuthenticated) {
      return false;
    }

    // 更新过期时间
    session.expiresAt = Date.now() + this.SESSION_DURATION;
    this.setSessionCookie(cookies, session);
    
    return true;
  }

  /**
   * 获取会话状态信息
   * @param cookies SvelteKit cookies 对象
   * @returns 会话状态
   */
  static getSessionStatus(cookies: Cookies): {
    isAuthenticated: boolean;
    username?: string;
    expiresAt?: number;
    timeRemaining?: number;
  } {
    const session = this.getSession(cookies);
    
    if (!session || !session.isAuthenticated) {
      return { isAuthenticated: false };
    }

    const timeRemaining = session.expiresAt ? session.expiresAt - Date.now() : 0;

    return {
      isAuthenticated: true,
      username: session.username,
      expiresAt: session.expiresAt,
      timeRemaining: Math.max(0, timeRemaining)
    };
  }
}

/**
 * 便捷函数：检查管理员登录状态
 * @param cookies SvelteKit cookies 对象
 * @returns 管理员会话信息
 */
export function checkAdminAuth(cookies: Cookies): AdminSession {
  const session = AdminAuthService.getSession(cookies);
  return session || { isAuthenticated: false };
}

/**
 * 便捷函数：要求管理员权限
 * @param cookies SvelteKit cookies 对象
 * @throws 如果未认证则抛出错误
 * @returns 管理员会话信息
 */
export function requireAdminAuth(cookies: Cookies): AdminSession {
  const session = AdminAuthService.getSession(cookies);
  
  if (!session || !session.isAuthenticated) {
    throw new Error('Unauthorized: Admin authentication required');
  }
  
  return session;
}

/**
 * 便捷函数：验证 API 访问权限
 * @param cookies SvelteKit cookies 对象
 * @returns API 访问验证结果
 */
export function verifyAdminApiAccess(cookies: Cookies) {
  return AdminAuthService.verifyApiAccess(cookies);
}

/**
 * 页面级别的管理员认证中间件
 * 用于 +page.server.ts 或 +layout.server.ts 中的 load 函数
 * @param cookies SvelteKit cookies 对象
 * @param redirectTo 未认证时重定向的路径，默认为 '/admin'
 * @returns 管理员会话信息
 * @throws 如果未认证则抛出重定向响应
 */
export function requireAdminPage(cookies: Cookies, redirectTo: string = '/admin'): AdminSession {
  const session = AdminAuthService.getSession(cookies);

  if (!session || !session.isAuthenticated) {
    throw new Response(null, {
      status: 302,
      headers: {
        location: redirectTo
      }
    });
  }

  return session;
}

/**
 * 检查管理员权限但不强制重定向
 * 用于可选的管理员功能
 * @param cookies SvelteKit cookies 对象
 * @returns 管理员会话信息和权限状态
 */
export function checkAdminPage(cookies: Cookies): {
  isAdmin: boolean;
  session?: AdminSession;
} {
  const session = AdminAuthService.getSession(cookies);

  return {
    isAdmin: session?.isAuthenticated === true,
    session: session || undefined
  };
}
