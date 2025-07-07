import type { PageServerLoad } from './$types';
import { getCachedSites } from '$lib/server/data.js';
import type { Site } from '$lib/types.js';

export const load: PageServerLoad = async ({ setHeaders }) => {
	try {
		// 从缓存或GitHub API获取网站数据
		const sites = await getCachedSites();

		// 设置缓存头部，提高性能
		setHeaders({
			'cache-control': 'public, max-age=300' // 5分钟缓存
		});

		// 分组网站数据
		const starredSites = sites.filter(site => site.starred);
		const categorizedSites: Record<string, Site[]> = {};

		sites.filter(site => !site.starred).forEach(site => {
			if (!categorizedSites[site.category]) {
				categorizedSites[site.category] = [];
			}
			categorizedSites[site.category].push(site);
		});

		// 计算统计信息
		const totalSites = sites.length;
		const totalCategories = Object.keys(categorizedSites).length;

		// 返回服务端渲染所需的数据
		return {
			sites,
			starredSites,
			categorizedSites,
			stats: {
				totalSites,
				totalCategories,
				starredCount: starredSites.length
			},
			meta: {
				title: '探索导航 - 您的个性化上网主页',
				description: `一个简洁、高效、可定制的导航网站，汇集了全网最优质的资源。收录${totalSites}个优质网站，${totalCategories}个分类。支持深色模式，无广告，响应式设计。`,
				keywords: '导航, 网站导航, 主页, 搜索引擎, 高效工具, SEO, Web App'
			}
		};
	} catch (error) {
		console.error('Failed to load sites data:', error);

		// 错误处理：返回空数据
		return {
			sites: [],
			starredSites: [],
			categorizedSites: {},
			stats: {
				totalSites: 0,
				totalCategories: 0,
				starredCount: 0
			},
			meta: {
				title: '探索导航 - 加载中...',
				description: '正在加载网站数据，请稍候...',
				keywords: '导航, 网站导航, 主页'
			}
		};
	}
};
