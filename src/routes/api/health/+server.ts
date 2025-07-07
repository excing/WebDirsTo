import type { RequestHandler } from './$types';
import { healthCheck } from '$lib/server/data.js';

export const GET: RequestHandler = async () => {
	const health = await healthCheck();

	return new Response(JSON.stringify(health), {
		headers: {
			'Content-Type': 'application/json'
		}
	});
};
