import type { Todo } from "$lib/types";

/**
 * 从 User-Agent 解析操作系统信息
 */
function parseOS(userAgent: string): string {
    if (userAgent.includes('Windows NT')) return 'Windows';
    if (userAgent.includes('Mac OS X') || userAgent.includes('macOS')) return 'macOS';
    if (userAgent.includes('Linux') && !userAgent.includes('Android')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'unknown';
}

/**
 * 从 User-Agent 解析浏览器信息
 */
function parseBrowser(userAgent: string): string {
    if (userAgent.includes('Edg/')) return 'Edge';
    if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) return 'Chrome';
    if (userAgent.includes('Firefox/')) return 'Firefox';
    if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) return 'Safari';
    if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) return 'Opera';
    return 'unknown';
}


// 记录提交信息
// todo.csv
// url,ip_address,language,os,browser,submitted_at,status
// "https://example.com","203.0.113.1","zh-CN,zh;q=0.9","Windows","Chrome",2025-07-06T12:34:56Z,pending
export function todo(url: string, ip: string, request: Request) {
    const realip = ip || request.headers.get('x-real-ip') || '0.0.0.0';

    // 从请求头获取客户端信息
    const userAgent = request.headers.get('user-agent') || '';
    const acceptLanguage = request.headers.get('accept-language') || 'zh-CN';

    // 解析客户端信息
    const language = acceptLanguage.split(',')[0].trim() || 'zh-CN';
    const os = parseOS(userAgent);
    const browser = parseBrowser(userAgent);

    const submittedAt = new Date().toISOString();
    const status = "pending";

    return {
        url,
        ip: realip,
        language,
        os,
        browser,
        submittedAt,
        status
    } as Todo;
}