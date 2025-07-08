import type { Site, Todo } from "./types";

// sites.txt 解析为 Site 对象
export function parseSites(content: string): Site[] {
    const sites = content.split('\n\n')
        .map(part => part.split('\n'))
        .filter(lines => lines.length === 13)
        .map(lines => {
            return {
                title: stringDef(lines[0], 'Example'),
                url: stringDef(lines[1], 'https://example.com'),
                favicon: stringDef(lines[2], 'https://example.com/favicon.ico'),
                description: stringDef(lines[3], 'None'),
                category: stringDef(lines[4], 'Other'),
                tags: lines[5].split(',').map(tag => tag.trim()) || ['other'],
                ageRating: lines[6] as 'SFW' | '18+' || 'SFW',
                language: stringDef(lines[7], 'en-US'),
                starred: lines[8] === '1',
                supportsPWA: lines[9] === 'true',
                supportsHTTPS: lines[10] === 'true',
                recommendation: stringDef(lines[11], 'None'),
                createdAt: stringDef(lines[12], new Date().toISOString())
            } as Site;
        });

    return sites;
}

// Site 对象序列化为 sites.txt 格式
export function serializeSites(sites: Site[]): string {
    // 检查每个字段不为空行, 如果有空值, 则用默认值替代
    return sites.map(site => [
        stringDef(site.title, 'Example'),
        stringDef(site.url, 'https://example.com'),
        stringDef(site.favicon, 'https://example.com/favicon.ico'),
        stringDef(site.description, 'None'),
        stringDef(site.category, 'Other'),
        site.tags.join(',') || 'other',
        site.ageRating || 'SFW',
        stringDef(site.language, 'en-US'),
        site.starred ? '1' : '0',
        site.supportsPWA ? 'true' : 'false',
        site.supportsHTTPS ? 'true' : 'false',
        stringDef(site.recommendation, 'None'),
        stringDef(site.createdAt, new Date().toISOString())
    ].join('\n')).join('\n\n');
}

// todo.csv 解析为 Todo 对象
export function parseTodo(content: string): Todo[] {
    const todos: Todo[] = [];

    // url,ip_address,language,os,browser,submitted_at,status
    const lines = content.split('\n').filter(line => line.trim() !== '');
    for (const line of lines) {
        const [url, ip, language, os, browser, submittedAt, status] = line.split(',');
        const todo: Todo = {
            url: stringDef(url, 'https://example.com'),
            ip: stringDef(ip, '0.0.0.0'),
            language: stringDef(language, 'en-US'),
            os: stringDef(os, 'Windows'),
            browser: stringDef(browser, 'Chrome'),
            submittedAt: stringDef(submittedAt, new Date().toISOString()),
            status: status as 'pending' | 'approved' | 'rejected'
        };
        todos.push(todo);
    }
    return todos;
}

// Todo 对象序列化为 todo.csv 格式
export function serializeTodo(todos: Todo[]): string {
    return todos.map(todo => [
        stringDef(todo.url, 'https://example.com'),
        stringDef(todo.ip, '0.0.0.0'),
        stringDef(todo.language, 'en-US'),
        stringDef(todo.os, 'Windows'),
        stringDef(todo.browser, 'Chrome'),
        stringDef(todo.submittedAt, new Date().toISOString()),
        todo.status || 'pending'
    ].join(',')).join('\n');
}

export function stringDef(s: string, def: string) {
    return s ? (s.trim() || def) : def;
}