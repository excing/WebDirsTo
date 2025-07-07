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