import type { RequestHandler } from './$types';
import { getSites, generateSitemap } from '$lib/server/data.js';

export const GET: RequestHandler = async () => {
	const sites = await getSites();
	const sitemap = generateSitemap(sites);

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml'
		}
	});
};
