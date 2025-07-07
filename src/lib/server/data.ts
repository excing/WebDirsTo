import type { Site } from '$lib/types.js';

// 获取网站数据
export async function fetchSitesFromSource(): Promise<Site[]> {
	// 直接使用本地示例数据
	const { sampleSites } = await import('$lib/data.js');
	return sampleSites;
}

// 解析sites.txt格式的数据
export function parseSitesData(content: string): Site[] {
	const sites: Site[] = [];
	const lines = content.split('\n').filter(line => line.trim() !== '');
	
	// 每个网站占13行
	for (let i = 0; i < lines.length; i += 13) {
		if (i + 12 < lines.length) {
			const site: Site = {
				title: lines[i],
				url: lines[i + 1],
				favicon: lines[i + 2],
				description: lines[i + 3],
				category: lines[i + 4],
				tags: lines[i + 5].split(',').map(tag => tag.trim()),
				ageRating: lines[i + 6] as 'SFW' | '18+',
				language: lines[i + 7],
				starred: lines[i + 8] === '1',
				supportsPWA: lines[i + 9] === 'true',
				supportsHTTPS: lines[i + 10] === 'true',
				recommendation: lines[i + 11],
				createdAt: lines[i + 12]
			};
			sites.push(site);
		}
	}
	
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
