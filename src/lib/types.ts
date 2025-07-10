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
	recommendation: string; // 推荐语
	createdAt: string;
	ogImage: string;
}

export interface Todo {
	url: string;
	ip: string;
	language: string;
	os: string;
	browser: string;
	submittedAt: string;
	status: 'pending' | 'approved' | 'rejected';
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


// GitHub API 相关类型
export interface GitHubFile {
	name: string;
	path: string;
	sha: string;
	size: number;
	url: string;
	html_url: string;
	git_url: string;
	download_url: string;
	type: string;
	content: string;
	encoding: string;
}

// GitHub API 响应类型
export interface GitHubFileResponse {
	// please 转换为类型
	"content": {
		"name": "hello.txt",
		"path": "notes/hello.txt",
		"sha": "95b966ae1c166bd92f8ae7d1c313e738c731dfc3",
		"size": 9,
		"url": "https://api.github.com/repos/octocat/Hello-World/contents/notes/hello.txt",
		"html_url": "https://github.com/octocat/Hello-World/blob/master/notes/hello.txt",
		"git_url": "https://api.github.com/repos/octocat/Hello-World/git/blobs/95b966ae1c166bd92f8ae7d1c313e738c731dfc3",
		"download_url": "https://raw.githubusercontent.com/octocat/HelloWorld/master/notes/hello.txt",
		"type": "file",
	},
}


// API 响应类型
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// 认证相关类型
export interface AdminCredentials {
	username: string;
	password: string;
}

export interface AdminSession {
	isAuthenticated: boolean;
	username?: string;
	expiresAt?: number;
}

export interface GithubCommit {
	path: string; content: string; message: string; sha?: string;
}