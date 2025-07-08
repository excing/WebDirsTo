import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { analyzeURL } from '$lib/server/analyze';
import { verifyAdminApiAccess } from '$lib/server/auth';
import { todo } from '$lib/server/todo';
import { createGitHubService } from '$lib/server/github';
import { serializeSites, serializeTodo } from '$lib/conv';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	try {
		const { url } = await request.json();

		// 验证输入
		if (!url || typeof url !== 'string') {
			return json(
				{
					success: false,
					error: '请提供有效的网址'
				},
				{ status: 400 }
			);
		}

		// 验证 URL 格式
		try {
			const urlObj = new URL(url);
			if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
				throw new Error('Invalid protocol');
			}
		} catch {
			return json(
				{
					success: false,
					error: '请提供有效的网址格式'
				},
				{ status: 400 }
			);
		}

		const auth = verifyAdminApiAccess(cookies);
		const github = createGitHubService();

		if (!auth.isAuthorized) {
			const todoItem = todo(url, getClientAddress(), request);
			// console.log('todoItem:', todoItem);
			const todoContents = await github.getFileContents('todo.csv');
			// console.log('todoContent:', todoContents.content);
			const todoContent = `${todoContents.content}\n${serializeTodo([todoItem])}`;
			await github.updateFile('todo.csv', todoContent, `Add todo: ${todoItem.url}`, todoContents.sha);
		} else {
			const analysisResult = await analyzeURL(url);
			// console.log('分析结果:', analysisResult);
			const sitesContents = await github.getFileContents('sites.txt');
			// console.log('sitesContents:', sitesContents.content);
			const sitesContent = `${sitesContents.content}\n\n${serializeSites([analysisResult])}`;
			await github.updateFile('sites.txt', sitesContent, `Add ${analysisResult.title} site`, sitesContents.sha);
		}

		// 返回成功响应
		return json({
			success: true,
			message: '网站提交成功，我们会尽快审核',
			data: {
				url,
				submittedAt: new Date().toISOString(),
				status: 'pending'
			}
		});

	} catch (error) {
		console.error('提交网站失败:', error);

		return json(
			{
				success: false,
				error: '服务器错误，请稍后重试'
			},
			{ status: 500 }
		);
	}
};
