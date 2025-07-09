import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DATA_FILES, ERROR_CODES, ERROR_MESSAGES } from '$lib/constants';
import { AdminAuthService } from '$lib/server/auth';
import { createGitHubService } from '$lib/server/github';
import type { Site } from '$lib/types';
import { parseSites, parseTodo, serializeSites, serializeTodo } from '$lib/conv';
import { isSameUrl } from '$lib/url';

/**
 * Get /api/admin/sites - 获取所有网站数据
 */
export const GET: RequestHandler = async ({ cookies }) => {
    try {
        // 使用认证服务验证 API 访问权限
        const authResult = AdminAuthService.verifyApiAccess(cookies);

        if (!authResult.isAuthorized) {
            return json({
                success: false,
                error: ERROR_CODES.UNAUTHORIZED,
                message: authResult.error || '需要管理员权限'
            }, { status: 401 });
        }

        const github = createGitHubService();
        const sites = await github.getFileContents(DATA_FILES.SITES);
        const pendingList = await github.getFileContents(DATA_FILES.PENDING);
        const archivedList = await github.getFileContents(DATA_FILES.ARCHIVED);

        return json({
            success: true,
            data: { sites, pendingList, archivedList }
        });

    } catch (error) {
        console.error('Error fetching sites data:', error);

        return json({
            success: false,
            error: ERROR_CODES.FETCH_FAILED,
            message: ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED]
        }, { status: 500 });
    }
}

/**
 * POST /api/admin/sites - 更新指定网站数据
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        // 使用认证服务验证 API 访问权限
        const authResult = AdminAuthService.verifyApiAccess(cookies);

        if (!authResult.isAuthorized) {
            return json({
                success: false,
                error: ERROR_CODES.UNAUTHORIZED,
                message: authResult.error || '需要管理员权限'
            }, { status: 401 });
        }

        const github = createGitHubService();
        const site: Site = await request.json();
        const sitesContent = await github.getFileContents(DATA_FILES.SITES);
        const sites = parseSites(sitesContent.content);
        // 先移除再添加到前面
        const updatedSites = sites.filter(s => !isSameUrl(s.url, site.url));
        updatedSites.unshift(site);
        await github.updateFile(DATA_FILES.SITES, serializeSites(updatedSites), `update ${site.title} site`, sitesContent.sha);

        return json({
            success: true,
            message: '更新成功'
        });
    } catch (error) {
        console.error('Error performing action:', error);

        return json({
            success: false,
            error: ERROR_CODES.FETCH_FAILED,
            message: ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED]
        }, { status: 500 });
    }
}

/**
 * PUT /api/admin/sites - 从 todo.csv 添加指定网站数据
 */
export const PUT: RequestHandler = async ({ request, cookies }) => {
    try {
        // 使用认证服务验证 API 访问权限
        const authResult = AdminAuthService.verifyApiAccess(cookies);

        if (!authResult.isAuthorized) {
            return json({
                success: false,
                error: ERROR_CODES.UNAUTHORIZED,
                message: authResult.error || '需要管理员权限'
            }, { status: 401 });
        }
        const github = createGitHubService();
        const site: Site = await request.json();
        const sitesContent = await github.getFileContents(DATA_FILES.SITES);
        const sites = parseSites(sitesContent.content);
        // 先移除再添加到前面
        const updatedSites = sites.filter(s => !isSameUrl(s.url, site.url));
        updatedSites.unshift(site);
        await github.updateFile(DATA_FILES.SITES, serializeSites(updatedSites), `add ${site.title} site`, sitesContent.sha);
        const todoContent = await github.getFileContents(DATA_FILES.PENDING);
        const todos = parseTodo(todoContent.content);
        // 将 todo 状态改为 approved
        const updatedTodos = todos.map(t => {
            if (isSameUrl(t.url, site.url)) {
                t.status = 'approved';
            }
            return t;
        });
        await github.updateFile(DATA_FILES.PENDING, serializeTodo(updatedTodos), `approved ${site.title} todo`, todoContent.sha);

        return json({
            success: true,
            message: '添加成功'
        });
    } catch (error) {
        console.error('Error performing action:', error);

        return json({
            success: false,
            error: ERROR_CODES.FETCH_FAILED,
            message: ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED]
        }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/sites - 从 sites.txt 删除指定网站数据并归档到 archive.txt
 */
export const DELETE: RequestHandler = async ({ request, cookies }) => {
    try {
        // 使用认证服务验证 API 访问权限
        const authResult = AdminAuthService.verifyApiAccess(cookies);

        if (!authResult.isAuthorized) {
            return json({
                success: false,
                error: ERROR_CODES.UNAUTHORIZED,
                message: authResult.error || '需要管理员权限'
            }, { status: 401 });
        }
        const github = createGitHubService();
        const site: Site = await request.json();
        const sitesContent = await github.getFileContents(DATA_FILES.SITES);
        const sites = parseSites(sitesContent.content);
        const updatedSites = sites.filter(s => !isSameUrl(s.url, site.url));
        await github.updateFile(DATA_FILES.SITES, serializeSites(updatedSites), `delete ${site.title} site`, sitesContent.sha);
        const archiveContent = await github.getFileContents(DATA_FILES.ARCHIVED);
        const archivedSites = parseSites(archiveContent.content);
        archivedSites.push(site);
        await github.updateFile(DATA_FILES.ARCHIVED, serializeSites(archivedSites), `archive ${site.title} site`, archiveContent.sha);

        return json({
            success: true,
            message: '删除成功'
        });
    } catch (error) {
        console.error('Error performing action:', error);

        return json({
            success: false,
            error: ERROR_CODES.FETCH_FAILED,
            message: ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED]
        }, { status: 500 });
    }
}


/**
 * PATCH /api/admin/sites - 拒绝(or其他状态) todo.csv 中的指定网站数据
 */
export const PATCH: RequestHandler = async ({ request, cookies }) => {
    try {
        // 使用认证服务验证 API 访问权限
        const authResult = AdminAuthService.verifyApiAccess(cookies);

        if (!authResult.isAuthorized) {
            return json({
                success: false,
                error: ERROR_CODES.UNAUTHORIZED,
                message: authResult.error || '需要管理员权限'
            }, { status: 401 });
        }
        const github = createGitHubService();
        const { url, status = 'rejected' } = await request.json();
        const todoContent = await github.getFileContents(DATA_FILES.PENDING);
        const todos = parseTodo(todoContent.content);
        const updatedTodos = todos.map(t => {
            if (isSameUrl(t.url, url)) {
                t.status = status;
            }
            return t;
        });
        await github.updateFile(DATA_FILES.PENDING, serializeTodo(updatedTodos), `${status} ${url} todo`, todoContent.sha);

        return json({
            success: true,
            message: '操作成功'
        });
    } catch (error) {
        console.error('Error performing action:', error);

        return json({
            success: false,
            error: ERROR_CODES.FETCH_FAILED,
            message: ERROR_MESSAGES[ERROR_CODES.FETCH_FAILED]
        }, { status: 500 });
    }
}
