// 匹配两个 URL 是否相同
export function isSameUrl(url1: string, url2: string): boolean {
    try {
        const urlObj1 = new URL(url1);
        const urlObj2 = new URL(url2);
        return urlObj1.href === urlObj2.href;
    } catch {
        return false;
    }
}

// 检查 url 是否有效
export function isValidUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
            throw new Error('Invalid protocol');
        }
        return true;
    } catch {
        return false;
    }
}