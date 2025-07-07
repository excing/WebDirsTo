import type { RequestHandler } from './$types';
import { getSites } from '$lib/server/data.js';
import { json } from '@sveltejs/kit';

// https://metatags.io/api/hello?url=https:%2F%2Fwww.bing.com%2F%3FtoWww%3D1%26redig%3DDE0B609C7F0E43CBA2D3DA414996AC50

export const GET: RequestHandler = async () => {
	const sites = await getSites();

	return json({
		sites,
		meta: {
			timestamp: new Date().toISOString(),
			total: sites.length
		}
	});
};
