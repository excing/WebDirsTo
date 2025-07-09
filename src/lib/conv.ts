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
    // console.log(parts);

    const sites = parts.filter(lines => lines.length === 14)
        .map(lines => {
            return {
                title: stringEmpty(lines[0], PLACEHOLDERS.site.title),
                url: stringEmpty(lines[1], PLACEHOLDERS.site.url),
                favicon: stringEmpty(lines[2], PLACEHOLDERS.site.favicon),
                description: stringEmpty(lines[3], PLACEHOLDERS.site.description),
                category: stringEmpty(lines[4], PLACEHOLDERS.site.category),
                tags: stringEmpty(lines[5], PLACEHOLDERS.site.tags).split(',').map(tag => tag.trim()),
                ageRating: stringEmpty(lines[6], PLACEHOLDERS.site.ageRating) as 'SFW' | '18+' || 'SFW',
                language: stringEmpty(lines[7], PLACEHOLDERS.site.language),
                starred: lines[8] === '1',
                supportsPWA: lines[9] === 'true',
                supportsHTTPS: lines[10] === 'true',
                recommendation: stringEmpty(lines[11], PLACEHOLDERS.site.recommendation),
                createdAt: stringEmpty(lines[12], PLACEHOLDERS.site.createdAt),
                ogImage: stringEmpty(lines[13], PLACEHOLDERS.site.ogImage)
            } as Site;
        });

    return sites;
}

// Site 对象序列化为 sites.txt 格式
export function serializeSites(sites: Site[]): string {
    // 检查每个字段不为空行, 如果有空值, 则用默认值替代
    return sites.map(site => [
        stringDef(site.title, PLACEHOLDERS.site.title),
        stringDef(site.url, PLACEHOLDERS.site.url),
        stringDef(site.favicon, PLACEHOLDERS.site.favicon),
        stringDef(site.description, PLACEHOLDERS.site.description),
        stringDef(site.category, PLACEHOLDERS.site.category),
        site.tags.join(',') || PLACEHOLDERS.site.tags,
        site.ageRating || PLACEHOLDERS.site.ageRating,
        stringDef(site.language, PLACEHOLDERS.site.language),
        site.starred ? '1' : '0',
        site.supportsPWA ? 'true' : 'false',
        site.supportsHTTPS ? 'true' : 'false',
        stringDef(site.recommendation, PLACEHOLDERS.site.recommendation),
        stringDef(site.createdAt, new Date().toISOString()),
        stringDef(site.ogImage, PLACEHOLDERS.site.ogImage)
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
            url: stringEmpty(url, PLACEHOLDERS.todo.url),
            ip: stringEmpty(ip, PLACEHOLDERS.todo.ip),
            language: stringEmpty(language, PLACEHOLDERS.todo.language),
            os: stringEmpty(os, PLACEHOLDERS.todo.os),
            browser: stringEmpty(browser, PLACEHOLDERS.todo.browser),
            submittedAt: stringEmpty(submittedAt, PLACEHOLDERS.todo.submittedAt),
            status: stringEmpty(status, PLACEHOLDERS.todo.status) as 'pending' | 'approved' | 'rejected' || 'pending'
        };
        todos.push(todo);
    }
    return todos;
}

// Todo 对象序列化为 todo.csv 格式
export function serializeTodo(todos: Todo[]): string {
    return todos.map(todo => [
        stringDef(todo.url, PLACEHOLDERS.todo.url),
        stringDef(todo.ip, PLACEHOLDERS.todo.ip),
        stringDef(todo.language, PLACEHOLDERS.todo.language),
        stringDef(todo.os, PLACEHOLDERS.todo.os),
        stringDef(todo.browser, PLACEHOLDERS.todo.browser),
        stringDef(todo.submittedAt, new Date().toISOString()),
        todo.status || PLACEHOLDERS.todo.status
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
