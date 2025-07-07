import type { RequestHandler } from './$types';
import { getSites } from '$lib/server/data.js';
import { json } from '@sveltejs/kit';

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
