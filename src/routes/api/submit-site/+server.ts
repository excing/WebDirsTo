import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { analyzeURL } from '$lib/server/analyze';
import { verifyAdminApiAccess } from '$lib/server/auth';
import { todo } from '$lib/server/todo';
import { createGitHubService } from '$lib/server/github';
import { parseSites, parseTodo, serializeSites, serializeTodo } from '$lib/conv';
import { isSameUrl, isValidUrl } from '$lib/url';
import { DATA_FILES } from '$lib/constants';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	try {
		const { url } = await request.json();

		// 验证输入
		if (!isValidUrl(url)) {
			return json(
				{
					success: false,
					error: '请提供有效的网址'
				},
				{ status: 400 }
			);
		}

		const auth = verifyAdminApiAccess(cookies);
		const github = createGitHubService();

		if (!auth.isAuthorized) {
			const todoContents = await github.getFileContents(DATA_FILES.PENDING);
			// console.log('todoContent:', todoContents.content);
			// 验证 todoItem 是否已经存在 todo.csv 中
			const todos = parseTodo(todoContents.content);
			if (todos.some(todo => isSameUrl(todo.url, url))) {
				return json(
					{
						success: false,
						error: '该网站已提交，请勿重复提交'
					},
					{ status: 400 }
				);
			}
			const todoItem = todo(url, getClientAddress(), request);
			// console.log('todoItem:', todoItem);
			const updatedTodos = [todoItem, ...todos];
			const todoContent = serializeTodo(updatedTodos);
			await github.updateFile(DATA_FILES.PENDING, todoContent, `Add todo: ${todoItem.url}`, todoContents.sha);
		} else {
			const sitesContents = await github.getFileContents(DATA_FILES.SITES);
			// console.log('sitesContents:', sitesContents.content);
			// 验证 analysisResult 是否已经存在 sites.txt 中
			const sites = parseSites(sitesContents.content);
			if (sites.some(site => isSameUrl(site.url, url))) {
				return json(
					{
						success: false,
						error: '该网站已存在，无需重复提交'
					},
					{ status: 400 }
				);
			}
			const analysisResult = await analyzeURL(url);
			// console.log('分析结果:', analysisResult);
			const sitesContent = `${sitesContents.content}\n\n${serializeSites([analysisResult])}`;
			await github.updateFile(DATA_FILES.SITES, sitesContent, `Add ${analysisResult.title} site`, sitesContents.sha);
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
