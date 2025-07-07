export interface Site {
	title: string;
	url: string;
	favicon: string;
	description: string;
	category: string;
	tags: string[];
	ageRating: 'SFW' | '18+';
	language: string;
	starred: boolean;
	supportsPWA: boolean;
	supportsHTTPS: boolean;
	recommendation: string;
	createdAt: string;
}

export interface SiteCardProps {
	site: Site;
	onFavorite?: (site: Site) => void;
}

export interface SearchState {
	query: string;
	showAdultContent: boolean;
}

export interface ThemeState {
	isDark: boolean;
}
