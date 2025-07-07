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


// API 响应类型
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// 管理员认证
export interface AdminCredentials {
	username: string;
	password: string;
}

export interface AdminSession {
	isAuthenticated: boolean;
	username?: string;
	expiresAt?: number;
}
