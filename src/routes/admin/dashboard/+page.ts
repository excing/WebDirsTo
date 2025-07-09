import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import type { Site, Todo } from '$lib/types';

export const ssr = false; // 启用客户端渲染

export const load: PageLoad = async ({ fetch }) => {
  try {
    // 检查管理员认证状态
    const authResponse = await fetch('/api/admin/auth');
    const authResult = await authResponse.json();
    
    if (!authResult.success || !authResult.data.isAuthenticated) {
      throw redirect(302, '/admin');
    }

    // 并行获取所有数据
    const [sitesResponse] = await Promise.all([
      fetch('/api/admin/sites').catch(() => null),
    ]);

    let sites: Site[] = [];
    let todos: Todo[] = [];
    let archivedSites: Site[] = [];

    // 处理网站数据
    if (sitesResponse?.ok) {
      const sitesResult = await sitesResponse.json();
      if (sitesResult.success) {
        // 解析返回的数据
        const { parseSites, parseTodo } = await import('$lib/conv');
        
        sites = parseSites(sitesResult.data.sites.content || '');
        todos = parseTodo(sitesResult.data.pendingList.content || '');
        archivedSites = parseSites(sitesResult.data.archivedList.content || '');
      }
    }

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
        username: authResult.data.username,
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
