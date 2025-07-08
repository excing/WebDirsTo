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