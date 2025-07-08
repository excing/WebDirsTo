import { parseSites } from '$lib/conv';
import type { Site } from '$lib/types.js';
import { createGitHubService } from './github';
import { DATA_FILES } from '$lib/constants';

// 获取网站数据
export async function fetchSitesFromSource(): Promise<Site[]> {
	const github = createGitHubService();
	const content = await github.getRawFileContent(DATA_FILES.SITES);
	// console.log(content);
	
	const sites = parseSites(content);
	return sites;
}

// 生成sitemap数据
export function generateSitemap(sites: Site[]): string {
	const baseUrl = 'https://your-domain.com'; // 在实际应用中从环境变量获取

	const urls = sites.map(site => `
		<url>
			<loc>${baseUrl}/site/${encodeURIComponent(site.url)}</loc>
			<lastmod>${site.createdAt}</lastmod>
			<changefreq>weekly</changefreq>
			<priority>0.8</priority>
		</url>
	`).join('');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>${baseUrl}</loc>
		<lastmod>${new Date().toISOString()}</lastmod>
		<changefreq>daily</changefreq>
		<priority>1.0</priority>
	</url>
	${urls}
</urlset>`;
}

// 微服务环境下的数据获取（无缓存）
export async function getSites(): Promise<Site[]> {
	return await fetchSitesFromSource();
}

// 健康检查函数
export async function healthCheck(): Promise<{ status: string; timestamp: string; sitesCount: number }> {
	const sites = await fetchSitesFromSource();
	return {
		status: 'healthy',
		timestamp: new Date().toISOString(),
		sitesCount: sites.length
	};
}
