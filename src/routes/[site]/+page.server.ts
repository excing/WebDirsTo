import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getSites } from '$lib/server/data.js';
import type { Site } from '$lib/types.js';

/**
 * 根据参数查找网站
 * 支持以下查找方式：
 * 1. 完整URL匹配
 * 2. URL编码后的匹配
 * 3. 网站标题的slug匹配
 */
function findSiteByParam(sites: Site[], param: string): Site | null {
	// 解码参数
	console.log(param);
	
	const decodedParam = decodeURIComponent(param);
	
	// 1. 尝试完整URL匹配
	let site = sites.find(s => s.url === decodedParam);
	if (site) return site;
	
	// 2. 尝试URL匹配（去掉协议）
	const normalizedParam = decodedParam.replace(/^https?:\/\//, '');
	site = sites.find(s => s.url.replace(/^https?:\/\//, '') === normalizedParam);
	if (site) return site;
	
	// 3. 尝试标题slug匹配（转换为URL友好格式）
	const titleSlug = decodedParam.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '-');
	site = sites.find(s => {
		const siteSlug = s.title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '-');
		return siteSlug === titleSlug;
	});
	
	return site;
}

/**
 * 获取相关网站推荐
 * 基于分类、标签相似度推荐
 */
function getRelatedSites(currentSite: Site, allSites: Site[], limit: number = 6): Site[] {
	const related = allSites
		.filter(site => site.url !== currentSite.url) // 排除当前网站
		.map(site => {
			let score = 0;
			
			// 相同分类加分
			if (site.category === currentSite.category) {
				score += 10;
			}
			
			// 相同标签加分
			const commonTags = site.tags.filter(tag => currentSite.tags.includes(tag));
			score += commonTags.length * 3;
			
			// 相同语言加分
			if (site.language === currentSite.language) {
				score += 2;
			}
			
			// 置顶网站加分
			if (site.starred) {
				score += 1;
			}
			
			return { site, score };
		})
		.filter(item => item.score > 0) // 只保留有相关性的
		.sort((a, b) => b.score - a.score) // 按相关性排序
		.slice(0, limit)
		.map(item => item.site);
	
	return related;
}

/**
 * 生成SEO友好的meta数据
 */
function generateSeoMeta(site: Site) {
	const title = `${site.title} - 探索导航`;
	const description = site.description || `访问 ${site.title}，${site.category}类优质网站。${site.recommendation || ''}`.slice(0, 160);
	const keywords = [
		site.title,
		site.category,
		...site.tags,
		'导航',
		'网站导航',
		'在线工具'
	].join(', ');
	
	return {
		title,
		description,
		keywords,
		ogTitle: title,
		ogDescription: description,
		ogImage: site.ogImage || `https://api.microlink.io/?url=${encodeURIComponent(site.url)}&screenshot=true&embed=screenshot.url`,
		ogUrl: site.url,
		canonicalUrl: site.url
	};
}

export const load: PageServerLoad = async ({ params }) => {
	try {
		// 获取所有网站数据
		const sites = await getSites();
		console.log(sites);
		
		
		// 查找目标网站
		const site = findSiteByParam(sites, params.site);
		
		if (!site) {
			throw error(404, {
				message: '网站未找到',
				details: `无法找到参数为 "${params.site}" 的网站`
			});
		}
		
		// 获取相关网站推荐
		const relatedSites = getRelatedSites(site, sites, 8);
		
		// 获取同分类网站
		const categorySites = sites
			.filter(s => s.category === site.category && s.url !== site.url)
			.slice(0, 6);
		
		// 生成SEO元数据
		const seoMeta = generateSeoMeta(site);
		
		// 计算统计信息
		const stats = {
			totalSites: sites.length,
			categoryCount: sites.filter(s => s.category === site.category).length,
			relatedCount: relatedSites.length
		};
		
		return {
			site,
			relatedSites,
			categorySites,
			seoMeta,
			stats,
			// 面包屑导航数据
			breadcrumb: {
				home: { name: '首页', url: '/' },
				category: { name: site.category, url: `/?category=${encodeURIComponent(site.category)}` },
				current: { name: site.title, url: site.url }
			}
		};
		
	} catch (err) {
		console.error('Failed to load site data:', err);
		
		// 如果是我们抛出的404错误，直接重新抛出
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		
		// 其他错误转换为500错误
		throw error(500, {
			message: '服务器错误',
			details: '加载网站数据时发生错误，请稍后重试'
		});
	}
};
