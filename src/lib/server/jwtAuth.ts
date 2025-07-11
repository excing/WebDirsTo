import jwt from 'jsonwebtoken';
import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const SECRET_ACCESS = `${env.JWT_TOKEN}_access`;   // 记得改成读取 env
const SECRET_REFRESH = `${env.JWT_TOKEN}_refresh`;

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

export interface JwtPayload {
  username: string;
  iat?: number;
  exp?: number;
}

const ACCESS_EXPIRE = 60 * 60 * 24; // 24小时
const REFRESH_EXPIRE = 60 * 60 * 24 * 30; // 30天

const cookieBase = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export const jwtAuth = {
  /** 登录：生成两个 token 并写入 cookie */
  login(cookies: Cookies, payload: Omit<JwtPayload, 'iat' | 'exp'>) {
    const accessToken = jwt.sign(payload, SECRET_ACCESS, { expiresIn: ACCESS_EXPIRE });
    const refreshToken = jwt.sign(payload, SECRET_REFRESH, { expiresIn: REFRESH_EXPIRE });

    cookies.set(ACCESS_COOKIE, accessToken, {
      ...cookieBase,
      maxAge: ACCESS_EXPIRE,
    });
    cookies.set(REFRESH_COOKIE, refreshToken, {
      ...cookieBase,
      maxAge: REFRESH_EXPIRE,
    });
  },

  /** 从 access_token 中获取用户信息 */
  getUser(cookies: Cookies): JwtPayload | null {
    const token = cookies.get(ACCESS_COOKIE);
    if (!token) return null;
    try {
      return jwt.verify(token, SECRET_ACCESS) as JwtPayload;
    } catch {
      return null;
    }
  },

  /** 使用 refresh_token 刷新 access_token */
  refresh(cookies: Cookies): JwtPayload | null {
    const token = cookies.get(REFRESH_COOKIE);
    if (!token) return null;

    try {
      const decoded = jwt.verify(token, SECRET_REFRESH) as JwtPayload;
      // refresh 有效，重新生成 access_token
      const newAccess = jwt.sign(
        { username: decoded.username },
        SECRET_ACCESS,
        { expiresIn: ACCESS_EXPIRE }
      );
      cookies.set(ACCESS_COOKIE, newAccess, {
        ...cookieBase,
        maxAge: ACCESS_EXPIRE,
      });
      return decoded;
    } catch {
      return null;
    }
  },

  /** 注销：清除两个 cookie */
  logout(cookies: Cookies) {
    cookies.set(ACCESS_COOKIE, "", {
      ...cookieBase,
      maxAge: 0,
    });
    cookies.set(REFRESH_COOKIE, "", {
      ...cookieBase,
      maxAge: 0,
    });
  },
};
