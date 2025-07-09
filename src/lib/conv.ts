import type { Site, Todo } from "./types";

const PLACEHOLDERS = {
    site: {
        title: '[title]',
        url: '[url]',
        favicon: '[favicon]',
        description: '[description]',
        category: '[category]',
        tags: '[tags]',
        ageRating: '[ageRating]',
        language: '[language]',
        recommendation: '[recommendation]',
        createdAt: '[createdAt]',
        ogImage: '[ogImage]'
    },
    todo: {
        url: '[url]',
        ip: '[ip]',
        language: '[language]',
        os: '[os]',
        browser: '[browser]',
        submittedAt: '[submittedAt]',
        status: '[status]'
    }
};

// sites.txt 解析为 Site 对象
export function parseSites(content: string): Site[] {
    const parts = content.split(/\n{2,}/)
        .map(part => part.trim().split('\n'));
    console.log(parts);

    const sites = parts.filter(lines => lines.length === 14)
        .map(lines => {
            return {
                title: stringEmpty(lines[0], '[title]'),
                url: stringEmpty(lines[1], '[url]'),
                favicon: stringEmpty(lines[2], `[favicon]`),
                description: stringEmpty(lines[3], '[description]'),
                category: stringEmpty(lines[4], '[category]'),
                tags: stringEmpty(lines[5], '[tags]').split(',').map(tag => tag.trim()),
                ageRating: stringEmpty(lines[6], '[ageRating]') as 'SFW' | '18+' || 'SFW',
                language: stringEmpty(lines[7], '[language]'),
                starred: lines[8] === '1',
                supportsPWA: lines[9] === 'true',
                supportsHTTPS: lines[10] === 'true',
                recommendation: stringEmpty(lines[11], '[recommendation]'),
                createdAt: stringDef(lines[12], new Date().toISOString()),
                ogImage: stringEmpty(lines[13], '[ogImage]')
            } as Site;
        });

    return sites;
}

// Site 对象序列化为 sites.txt 格式
export function serializeSites(sites: Site[]): string {
    // 检查每个字段不为空行, 如果有空值, 则用默认值替代
    return sites.map(site => [
        stringDef(site.title, '[title]'),
        stringDef(site.url, '[url]'),
        stringDef(site.favicon, `[favicon]`),
        stringDef(site.description, '[description]'),
        stringDef(site.category, '[category]'),
        site.tags.join(',') || '[tags]',
        site.ageRating || '[ageRating]',
        stringDef(site.language, '[language]'),
        site.starred ? '1' : '0',
        site.supportsPWA ? 'true' : 'false',
        site.supportsHTTPS ? 'true' : 'false',
        stringDef(site.recommendation, '[recommendation]'),
        stringDef(site.createdAt, new Date().toISOString()),
        stringDef(site.ogImage, "[ogImage]")
    ].map(line => line.replace("\n", " ↵ ")).join('\n')).join('\n\n');
}

// todo.csv 解析为 Todo 对象
export function parseTodo(content: string): Todo[] {
    const todos: Todo[] = [];

    // url,ip_address,language,os,browser,submitted_at,status
    const lines = content.split('\n').filter(line => line.trim() !== '');
    for (const line of lines) {
        const [url, ip, language, os, browser, submittedAt, status]
            = line.split(',').map(field => field.replace(/^"|"$/g, ''));
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
    ].map(line => `"${line.replace("\n", " ↵ ")}"`).join(',')).join('\n');
}

export function stringDef(s: string, def: string) {
    return s ? (s.trim() || def) : def;
}

// 如果 string 等于某值, 则用一个指定的值替换
export function stringReplace(s: string, old: string, def: string) {
    return s === old ? def : s;
}

// 如果 string 等于某值, 则用一个空值替换
export function stringEmpty(s: string, old: string) {
    return s === old ? "" : s;
}
