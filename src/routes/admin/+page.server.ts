import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { AdminAuthService } from '$lib/server/auth.js';

export const load: PageServerLoad = async ({ cookies }) => {
  // 检查是否已经登录
  const session = AdminAuthService.getSession(cookies);
  
  if (session?.isAuthenticated) {
    // 已登录，重定向到管理面板
    throw redirect(302, '/admin/dashboard');
  }
  
  // 未登录，显示登录页面
  return {};
};

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username')?.toString();
    const password = data.get('password')?.toString();
    
    // 验证表单数据
    if (!username || !password) {
      return fail(400, {
        error: '请输入用户名和密码',
        username: username || ''
      });
    }
    
    // 使用认证服务验证凭据
    const validation = AdminAuthService.validateCredentials({
      username: username.trim(),
      password: password.trim()
    });
    
    if (!validation.isValid) {
      return fail(401, {
        error: validation.error || '登录失败',
        username: username
      });
    }
    
    // 创建会话并设置 Cookie
    const session = AdminAuthService.createSession(username.trim());
    AdminAuthService.setSessionCookie(cookies, session);
    
    // 登录成功，重定向到管理面板
    throw redirect(302, '/admin/dashboard');
  }
};
