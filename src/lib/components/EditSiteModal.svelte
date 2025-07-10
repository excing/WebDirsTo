<!-- 
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
	ogImage: string;

    请编写一个支持编辑 Site 信息的模态框组件, 包括所有 Site 的属性.
    支持分析网站, 调用 `/src/lib/client/api.ts` 中的 `analyzeSite` 方法.
    支持取消和保存操作
    保存时调用 `/src/lib/client/api.ts` 中的 `putCommits` 方法.
  -->
