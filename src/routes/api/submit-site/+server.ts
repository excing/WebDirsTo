import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
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

		// 这里可以添加更多的验证逻辑，比如：
		// - 检查 URL 是否可访问
		// - 检查是否已经存在
		// - 获取网站基本信息（标题、描述等）
		// - 保存到数据库或文件

		// 模拟处理时间
		await new Promise(resolve => setTimeout(resolve, 500));

		// 记录提交信息（在实际应用中，这里应该保存到数据库）
		console.log(`网站提交请求: ${url} at ${new Date().toISOString()}`);

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
