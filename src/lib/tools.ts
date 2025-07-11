export function getFallbackFavicon(url: string): string {
    // fallbac = `https://icon.horse/icon/${domain}`
    let domain = new URL(url).hostname;
    return `https://icon.horse/icon/${domain}`;
}

export function getScreenshotUrl(url: string): string {
    return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&embed=screenshot.url`;
}

export function getFallbackScreenshot(url: string): string {
    return `https://image.thum.io/get/maxAge/12/width/700/${url}`;
}

// 用于 github 内容解码使用, 主要是中文
export function decode64(text: string): string {
    return new TextDecoder().decode(
        Uint8Array.from(atob(text), (c) => c.charCodeAt(0)),
    );
}

export function encode64(text: string): string {
    return btoa(unescape(encodeURIComponent(text)))
    // return btoa(String.fromCharCode(...new TextEncoder().encode(text)));
}

// md5 处理
export const md5 = async (str: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashHex = [...new Uint8Array(hashBuffer)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    return hashHex;
};
