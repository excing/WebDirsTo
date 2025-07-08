import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ApiResponse, Site } from '$lib/types.js';
import { ERROR_CODES, ERROR_MESSAGES } from '$lib/constants';
import { verifyAdminApiAccess } from '$lib/server/auth.js';
import { getSites } from '$lib/server/data.js';

/**
 * GET /api/admin/sites - 获取所有网站数据（需要管理员权限）
 */
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    // 验证管理员权限
    const authResult = verifyAdminApiAccess(cookies);
    
    if (!authResult.isAuthorized) {
      const response: ApiResponse<never> = {
        success: false,
        error: ERROR_CODES.UNAUTHORIZED,
        message: authResult.error || '需要管理员权限'
      };
      return json(response, { status: 401 });
    }

    // 获取网站数据
    const sites = await getSites();
    
    const response: ApiResponse<Site[]> = {
      success: true,
      data: sites,
      message: `成功获取 ${sites.length} 个网站数据`
    };
    
    return json(response);
    
  } catch (error) {
    console.error('Error fetching sites for admin:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: ERROR_CODES.FETCH_FAILED,
      message: ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED]
    };
    
    return json(response, { status: 500 });
  }
};

/**
 * POST /api/admin/sites - 添加新网站（需要管理员权限）
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // 验证管理员权限
    const authResult = verifyAdminApiAccess(cookies);
    
    if (!authResult.isAuthorized) {
      const response: ApiResponse<never> = {
        success: false,
        error: ERROR_CODES.UNAUTHORIZED,
        message: authResult.error || '需要管理员权限'
      };
      return json(response, { status: 401 });
    }

    // 解析请求数据
    const siteData: Partial<Site> = await request.json();
    
    // 验证必填字段
    if (!siteData.title || !siteData.url) {
      const response: ApiResponse<never> = {
        success: false,
        error: ERROR_CODES.VALIDATION_ERROR,
        message: '网站标题和URL是必填字段'
      };
      return json(response, { status: 400 });
    }

    // 这里应该实现添加网站的逻辑
    // 目前只是模拟响应

    const response: ApiResponse<Site> = {
      success: true,
      message: '网站添加成功'
    };
    
    return json(response, { status: 201 });
    
  } catch (error) {
    console.error('Error adding site:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: ERROR_CODES.FETCH_FAILED,
      message: ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED]
    };
    
    return json(response, { status: 500 });
  }
};

/**
 * PUT /api/admin/sites - 更新网站数据（需要管理员权限）
 */
export const PUT: RequestHandler = async ({ request, cookies }) => {
  try {
    // 验证管理员权限
    const authResult = verifyAdminApiAccess(cookies);
    
    if (!authResult.isAuthorized) {
      const response: ApiResponse<never> = {
        success: false,
        error: ERROR_CODES.UNAUTHORIZED,
        message: authResult.error || '需要管理员权限'
      };
      return json(response, { status: 401 });
    }

    // 解析请求数据
    const updateData: Partial<Site> & { url: string } = await request.json();
    
    // 验证必填字段
    if (!updateData.url) {
      const response: ApiResponse<never> = {
        success: false,
        error: ERROR_CODES.VALIDATION_ERROR,
        message: '网站URL是必填字段'
      };
      return json(response, { status: 400 });
    }

    // 这里应该实现更新网站的逻辑
    // 目前只是模拟响应
    const response: ApiResponse<{ url: string }> = {
      success: true,
      data: { url: updateData.url },
      message: '网站更新成功'
    };
    
    return json(response);
    
  } catch (error) {
    console.error('Error updating site:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: ERROR_CODES.FETCH_FAILED,
      message: ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED]
    };
    
    return json(response, { status: 500 });
  }
};

/**
 * DELETE /api/admin/sites - 删除网站（需要管理员权限）
 */
export const DELETE: RequestHandler = async ({ request, cookies }) => {
  try {
    // 验证管理员权限
    const authResult = verifyAdminApiAccess(cookies);
    
    if (!authResult.isAuthorized) {
      const response: ApiResponse<never> = {
        success: false,
        error: ERROR_CODES.UNAUTHORIZED,
        message: authResult.error || '需要管理员权限'
      };
      return json(response, { status: 401 });
    }

    // 解析请求数据
    const { url }: { url: string } = await request.json();
    
    // 验证必填字段
    if (!url) {
      const response: ApiResponse<never> = {
        success: false,
        error: ERROR_CODES.VALIDATION_ERROR,
        message: '网站URL是必填字段'
      };
      return json(response, { status: 400 });
    }

    // 这里应该实现删除网站的逻辑
    // 目前只是模拟响应
    const response: ApiResponse<{ url: string }> = {
      success: true,
      data: { url },
      message: '网站删除成功'
    };
    
    return json(response);
    
  } catch (error) {
    console.error('Error deleting site:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: ERROR_CODES.FETCH_FAILED,
      message: ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED]
    };
    
    return json(response, { status: 500 });
  }
};
