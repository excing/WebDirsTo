import type { Site } from './types.js';

export const sampleSites: Site[] = [
	// 置顶推荐网站
	{
		title: 'GitHub',
		url: 'https://github.com',
		favicon: 'https://github.com/favicon.ico',
		description: '全球领先的软件开发平台',
		category: '开发工具',
		tags: ['code', 'developer', 'social', 'git'],
		ageRating: 'SFW',
		language: 'en-US',
		starred: true,
		supportsPWA: true,
		supportsHTTPS: true,
		recommendation: '开发者必备平台',
		createdAt: '2025-07-06T12:00:00Z'
	},
	{
		title: 'Stack Overflow',
		url: 'https://stackoverflow.com',
		favicon: 'https://stackoverflow.com/favicon.ico',
		description: '程序员问答社区',
		category: '开发工具',
		tags: ['programming', 'qa', 'community'],
		ageRating: 'SFW',
		language: 'en-US',
		starred: false,
		supportsPWA: false,
		supportsHTTPS: true,
		recommendation: '解决编程问题的好地方',
		createdAt: '2025-07-06T12:01:00Z'
	},
	// 搜索引擎
	{
		title: 'Google',
		url: 'https://google.com',
		favicon: 'https://www.google.com/favicon.ico',
		description: '全球最大的搜索引擎',
		category: '搜索引擎',
		tags: ['search', 'engine'],
		ageRating: 'SFW',
		language: 'zh-CN',
		starred: true,
		supportsPWA: true,
		supportsHTTPS: true,
		recommendation: '最受欢迎的搜索引擎',
		createdAt: '2025-07-06T12:02:00Z'
	},
	{
		title: 'Baidu 百度',
		url: 'https://baidu.com',
		favicon: 'https://www.baidu.com/favicon.ico',
		description: '全球最大的中文搜索引擎',
		category: '搜索引擎',
		tags: ['search', 'engine', 'china'],
		ageRating: 'SFW',
		language: 'zh-CN',
		starred: false,
		supportsPWA: false,
		supportsHTTPS: true,
		recommendation: '中文搜索首选',
		createdAt: '2025-07-06T12:03:00Z'
	},
	{
		title: 'DuckDuckGo',
		url: 'https://duckduckgo.com',
		favicon: 'https://duckduckgo.com/favicon.ico',
		description: '注重隐私的搜索引擎',
		category: '搜索引擎',
		tags: ['search', 'privacy', 'secure'],
		ageRating: 'SFW',
		language: 'en-US',
		starred: false,
		supportsPWA: false,
		supportsHTTPS: true,
		recommendation: '保护隐私的搜索选择',
		createdAt: '2025-07-06T12:04:00Z'
	},
	{
		title: 'PornHub',
		url: 'https://pornhub.com',
		favicon: 'https://pornhub.com/favicon.ico',
		description: '成人内容网站',
		category: '成人',
		tags: ['porn', 'adult', '18+'],
		ageRating: '18+',
		language: 'en-US',
		starred: false,
		supportsPWA: false,
		supportsHTTPS: true,
		recommendation: '成人内容网站',
		createdAt: '2025-07-06T12:05:00Z'
	}
];