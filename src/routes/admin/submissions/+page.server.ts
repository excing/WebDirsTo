import { AdminAuthService } from "$lib/server/auth";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "../$types";

export const load: PageServerLoad = async ({ cookies }) => {
  // 检查是否已经登录
  const session = AdminAuthService.getSession(cookies);

  if (!session?.isAuthenticated) {
    // 未登录，重定向到登录页面
    throw redirect(302, '/admin');
  }

  // 已登录，显示提交管理页面
  return {
    session: {
      username: session.username,
      isAuthenticated: true
    }
  };
};
