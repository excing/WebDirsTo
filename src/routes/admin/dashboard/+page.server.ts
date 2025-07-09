import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { AdminAuthService } from '$lib/server/auth.js';
import { createGitHubService } from '$lib/server/github';
import { DATA_FILES } from '$lib/constants';
import { parseSites, parseTodo } from '$lib/conv';
import type { Site, Todo } from '$lib/types';

export const load: PageServerLoad = async ({ cookies }) => {
  try {
    // 检查管理员权限
    const session = AdminAuthService.getSession(cookies);
    
    if (!session?.isAuthenticated) {
      throw redirect(302, '/admin');
    }

    // 获取数据
    const github = createGitHubService();
    
    // 并行获取所有数据文件
    const [sitesFile, todosFile, archivedFile] = await Promise.all([
      github.getRawFileContent(DATA_FILES.SITES).catch(() => ''),
      github.getRawFileContent(DATA_FILES.PENDING).catch(() => ''),
      github.getRawFileContent(DATA_FILES.ARCHIVED).catch(() => '')
    ]);

    // 解析数据
    const sites = parseSites(sitesFile);
    const todos = parseTodo(todosFile);
    const archivedSites = parseSites(archivedFile);

    // 计算统计信息
    const stats = calculateStats(sites, todos, archivedSites);

    // 获取最近的网站（按创建时间排序，取前10个）
    const recentSites = sites
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // 获取待审核的提交（只显示pending状态的）
    const pendingTodos = todos.filter(todo => todo.status === 'pending').slice(0, 10);

    return {
      session: {
        username: session.username,
        isAuthenticated: true
      },
      sites: recentSites,
      Todos: pendingTodos,
      stats,
      error: null
    };

  } catch (error) {
    console.error('Dashboard load error:', error);
    
    // 如果是重定向错误，重新抛出
    if (error instanceof Response) {
      throw error;
    }

    // 其他错误，返回错误状态
    return {
      session: { username: '', isAuthenticated: false },
      sites: [],
      Todos: [],
      stats: {
        totalSites: 0,
        pendingSubmissions: 0,
        starredSites: 0,
        archivedSites: 0,
        categoryCounts: {}
      },
      error: '加载数据失败，请稍后重试'
    };
  }
};

/**
 * 计算统计信息
 */
function calculateStats(sites: Site[], todos: Todo[], archivedSites: Site[]) {
  // 分类统计
  const categoryCounts: Record<string, number> = {};
  sites.forEach(site => {
    const category = site.category || '未分类';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // 按数量排序分类
  const sortedCategories = Object.entries(categoryCounts)
    .sort(([,a], [,b]) => b - a)
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {} as Record<string, number>);

  return {
    totalSites: sites.length,
    pendingSubmissions: todos.filter(todo => todo.status === 'pending').length,
    starredSites: sites.filter(site => site.starred).length,
    archivedSites: archivedSites.length,
    categoryCounts: sortedCategories
  };
}
