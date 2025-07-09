import { redirect } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { jwtAuth } from './jwtAuth.js';
import type { AdminCredentials, AdminSession } from '$lib/types.js';
import { md5 } from '$lib/tools.js';

/**
 * 管理员认证服务类
 * 基于 jwtAuth.ts 实现的简洁认证服务
 */
export class AdminAuthService {
  /**
   * 验证管理员登录凭据
   */
  static async validateCredentials(credentials: AdminCredentials): Promise<{ isValid: boolean; error?: string; }> {
    if (!credentials.username || !credentials.password) {
      return { isValid: false, error: '用户名和密码是必填字段' };
    }

    // 从环境变量获取管理员凭据
    const adminUsername = env.ADMIN_USERNAME;
    // 使用编码后的密码, 编码格式: md5
    const adminPassword = env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return { isValid: false, error: '服务器配置错误' };
    }

    const psdmd5 = await md5(adminPassword.trim());

    if (
      credentials.username.trim() !== adminUsername.trim() ||
      credentials.password.trim() !== psdmd5.trim()
    ) {
      return { isValid: false, error: '用户名或密码错误' };
    }

    return { isValid: true };
  }

  /**
   * 创建管理员会话
   */
  static createSession(username: string): AdminSession {
    return {
      isAuthenticated: true,
      username: username.trim(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24小时
    };
  }

  /**
   * 设置会话 Cookie（使用 JWT）
   */
  static setSessionCookie(cookies: Cookies, session: AdminSession): void {
    if (session.isAuthenticated && session.username) {
      jwtAuth.login(cookies, { username: session.username });
    }
  }

  /**
   * 获取当前会话
   */
  static getSession(cookies: Cookies): AdminSession | null {
    const user = jwtAuth.getUser(cookies);
    if (user) {
      return {
        isAuthenticated: true,
        username: user.username,
        expiresAt: user.exp ? user.exp * 1000 : undefined
      };
    }

    // 尝试刷新 token
    const refreshedUser = jwtAuth.refresh(cookies);
    if (refreshedUser) {
      return {
        isAuthenticated: true,
        username: refreshedUser.username,
        expiresAt: refreshedUser.exp ? refreshedUser.exp * 1000 : undefined
      };
    }

    return null;
  }

  /**
   * 检查是否已认证
   */
  static isAuthenticated(cookies: Cookies): boolean {
    const session = this.getSession(cookies);
    return session?.isAuthenticated ?? false;
  }

  /**
   * 获取当前用户名
   */
  static getAuthenticatedUsername(cookies: Cookies): string | null {
    const session = this.getSession(cookies);
    return session?.username ?? null;
  }

  /**
   * 清除会话
   */
  static clearSession(cookies: Cookies): void {
    jwtAuth.logout(cookies);
  }

  /**
   * 验证 API 访问权限
   */
  static verifyApiAccess(cookies: Cookies): { isAuthorized: boolean; error?: string; username?: string } {
    const session = this.getSession(cookies);

    if (!session?.isAuthenticated) {
      return { isAuthorized: false, error: '未认证' };
    }

    return {
      isAuthorized: true,
      username: session.username
    };
  }

  /**
   * 刷新会话过期时间
   */
  static refreshSession(cookies: Cookies): boolean {
    const refreshedUser = jwtAuth.refresh(cookies);
    return refreshedUser !== null;
  }

  /**
   * 获取详细会话状态
   */
  static getSessionStatus(cookies: Cookies): AdminSession {
    const session = this.getSession(cookies);

    if (!session) {
      return { isAuthenticated: false };
    }

    return {
      isAuthenticated: session.isAuthenticated,
      username: session.username,
      expiresAt: session.expiresAt
    };
  }
}

// 便捷函数

/**
 * 检查管理员登录状态
 */
export function checkAdminAuth(cookies: Cookies): { isAuthenticated: boolean; username?: string } {
  const session = AdminAuthService.getSession(cookies);
  return {
    isAuthenticated: session?.isAuthenticated ?? false,
    username: session?.username
  };
}

/**
 * 要求管理员权限（抛出异常）
 */
export function requireAdminAuth(cookies: Cookies): AdminSession {
  const session = AdminAuthService.getSession(cookies);

  if (!session?.isAuthenticated) {
    throw new Error('需要管理员权限');
  }

  return session;
}

/**
 * 验证 API 访问权限
 */
export function verifyAdminApiAccess(cookies: Cookies): { isAuthorized: boolean; error?: string; username?: string } {
  return AdminAuthService.verifyApiAccess(cookies);
}

/**
 * 页面级认证中间件（强制重定向）
 */
export function requireAdminPage(cookies: Cookies, redirectTo: string = '/admin'): AdminSession {
  const session = AdminAuthService.getSession(cookies);

  if (!session?.isAuthenticated) {
    throw redirect(302, redirectTo);
  }

  return session;
}

/**
 * 可选的管理员功能检查
 */
export function checkAdminPage(cookies: Cookies): { isAdmin: boolean; session?: AdminSession } {
  const session = AdminAuthService.getSession(cookies);

  return {
    isAdmin: session?.isAuthenticated ?? false,
    session: session ?? undefined
  };
}
