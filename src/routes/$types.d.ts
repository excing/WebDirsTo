import type { Site } from '$lib/types';

export interface PageData {
	sites: Site[];
	starredSites: Site[];
	categorizedSites: Record<string, Site[]>;
	stats: {
		totalSites: number;
		totalCategories: number;
		starredCount: number;
	};
	meta: {
		title: string;
		description: string;
		keywords: string;
	};
}
