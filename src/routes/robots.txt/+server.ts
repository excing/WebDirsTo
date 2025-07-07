import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${url.origin}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Disallow admin areas
Disallow: /admin

# Allow all other content
Allow: /
`;

	return new Response(robotsTxt, {
		headers: {
			'Content-Type': 'text/plain'
		}
	});
};
