import type { RequestHandler } from './$types';
import { getCachedSites, generateSitemap } from '$lib/server/data.js';

export const GET: RequestHandler = async () => {
	try {
		const sites = await getCachedSites();
		const sitemap = generateSitemap(sites);
		
		return new Response(sitemap, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'public, max-age=3600' // 1小时缓存
			}
		});
	} catch (error) {
		console.error('Failed to generate sitemap:', error);
		
		return new Response('Error generating sitemap', {
			status: 500
		});
	}
};
