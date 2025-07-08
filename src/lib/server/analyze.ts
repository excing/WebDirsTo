import { request } from "$lib/fetch";
import { gemini } from "./gemini";

/**
 * 从HTML中提取元数据
 */
function extractMetadata(html: string, url: string) {
    const metadata = {
        title: '',
        description: '',
        favicon: '',
        hasManifestInHtml: false
    };

    // 提取标题
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
        metadata.title = titleMatch[1].trim();
    }

    // 提取描述
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
    if (descMatch) {
        metadata.description = descMatch[1].trim();
    }

    // 提取Open Graph描述
    if (!metadata.description) {
        const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["'][^>]*>/i);
        if (ogDescMatch) {
            metadata.description = ogDescMatch[1].trim();
        }
    }

    // 提取favicon
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
        html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon)["'][^>]*>/i);
    if (faviconMatch) {
        let faviconUrl = faviconMatch[1].trim();

        // 处理相对URL
        if (faviconUrl.startsWith('/')) {
            const urlObj = new URL(url);
            faviconUrl = `${urlObj.protocol}//${urlObj.host}${faviconUrl}`;
        } else if (!faviconUrl.startsWith('http')) {
            const urlObj = new URL(url);
            faviconUrl = `${urlObj.protocol}//${urlObj.host}/${faviconUrl}`;
        }

        metadata.favicon = faviconUrl;
    } else {
        // 默认favicon路径
        const urlObj = new URL(url);
        metadata.favicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
    }

    // 检查HTML中是否有manifest链接
    const manifestMatch = html.match(/<link[^>]*rel=["']manifest["'][^>]*>/i);
    metadata.hasManifestInHtml = !!manifestMatch;

    return metadata;
}


/**
 * 检测网站是否支持PWA
 */
async function checkPwaSupport(url: string): Promise<boolean> {
    try {
        const urlObj = new URL(url);
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

        // 检查 manifest.json
        const manifestChecks = [
            '/manifest.json',
            '/manifest.webmanifest',
            '/site.webmanifest'
        ];

        let hasManifest = false;
        for (const manifestPath of manifestChecks) {
            try {
                const manifestResponse = await request(`${baseUrl}${manifestPath}`, {
                    method: 'HEAD',
                    signal: AbortSignal.timeout(3000)
                });
                if (manifestResponse.ok) {
                    hasManifest = true;
                    break;
                }
            } catch {
                // 继续检查下一个路径
            }
        }

        // 检查 service worker
        const swChecks = [
            '/sw.js',
            '/service-worker.js',
            '/serviceworker.js'
        ];

        let hasServiceWorker = false;
        for (const swPath of swChecks) {
            try {
                const swResponse = await request(`${baseUrl}${swPath}`, {
                    method: 'HEAD',
                    signal: AbortSignal.timeout(3000)
                });
                if (swResponse.ok) {
                    hasServiceWorker = true;
                    break;
                }
            } catch {
                // 继续检查下一个路径
            }
        }

        // PWA需要同时有manifest和service worker
        return hasManifest && hasServiceWorker;
    } catch {
        return false;
    }
}

export async function analyzeURL(url: string) {
    try {
        // 首先检测HTTPS支持
        let supportsHttps = true;
        const urlObj = new URL(url);
        const httpsUrl = `https://${urlObj.host}${urlObj.pathname}${urlObj.search}`;
        let fetchResponse = await request(httpsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; WebWhereGo/1.0;)'
            },
            signal: AbortSignal.timeout(10000) // 10秒超时
        });

        supportsHttps = fetchResponse.ok;

        // 根据HTTPS支持情况决定使用哪个URL进行分析
        let analysisUrl = url;
        if (!supportsHttps) {
            analysisUrl = `http://${urlObj.host}${urlObj.pathname}${urlObj.search}`;

            // 获取网站HTML内容
            fetchResponse = await request(analysisUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; WebWhereGo/1.0;)'
                },
                signal: AbortSignal.timeout(10000) // 10秒超时
            });

            if (!fetchResponse.ok) {
                throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
            }
        }

        const html = await fetchResponse.text();

        const htmllang = html.match(/<html[^>]*lang=["']([^"']+)["'][^>]*>/i);
        const language = htmllang ? htmllang[1].trim() : 'en';

        // 提取基本元数据
        const metadata = extractMetadata(html, analysisUrl);

        // 检测PWA支持
        // 如果不支持 https, 那么就不检查 pwa
        const supportsPwa = supportsHttps && (metadata.hasManifestInHtml || await checkPwaSupport(analysisUrl));

        // 自动分类
        const geminiResult = await gemini([
            { text: "请对以下网站进行分类, 年龄分级和打标签. 回复时, 请严格按照以下格式返回. line1: 分类(仅一个分类), line2: 年龄分级(值: SFW 或 18+), line3: 标签(多个标签用逗号分隔). 示例: ```\r\n搜索引擎\r\nSFW\r\nsearch,engine,google\r\n```" },
            { text: `网址: ${analysisUrl}\n标题: ${metadata.title}\n描述: ${metadata.description}` }
        ]);
        // 对文本进行过滤
        // 获取 ``` 与 ``` 之间的文本
        // 然后按行分割
        // 然后按 : 分割, 如果只有一个值, 那么就用这个值, 如果有多个值, 那么就用最后一个值
        // 最后归档

        const text = geminiResult ? geminiResult.content.parts[0].text : '';
        console.log(text);

        const matches = text.match(/```[a-zA-Z]+\s*([\s\S]*?)\s*```/);
        const filteredText = matches ? matches[1].trim() : text.trim();
        const lines = filteredText.split('\n').map(line => line.split(':').pop() || line.trim());
        const category = lines[0] ? lines[0].trim() : '未分类';
        const ageRating = lines[1] ? lines[1].trim() : 'SFW';
        const tags = lines[2] ? lines[2].trim().split(',').map((tag: string) => tag.trim()) : ["其他"];

        // 组合所有分析结果
        const analysisResult = {
            title: metadata.title,
            url: url,
            description: metadata.description,
            category,
            ageRating,
            tags,
            language,
            favicon: metadata.favicon,
            https: supportsHttps,
            pwa: supportsPwa // 如果检测到manifest文件或HTML中有manifest链接
        };

        return analysisResult;
    } catch (e) {
        throw e;
    }
}