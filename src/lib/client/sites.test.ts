// 简单的功能测试示例
// 注意: 这不是完整的单元测试，仅用于验证基本功能

import { sitesManager } from './sites';
import type { Site, Todo } from '$lib/types';

/**
 * 测试网站管理器的基本功能
 */
export async function testSitesManager() {
    console.log('🧪 开始测试 Sites Manager...');
    
    try {
        // 1. 测试状态订阅
        console.log('📡 测试状态订阅...');
        let stateUpdates = 0;
        const unsubscribe = sitesManager.subscribe((state) => {
            stateUpdates++;
            console.log(`状态更新 #${stateUpdates}:`, {
                sites: state.sites.length,
                todos: state.todos.length,
                loading: state.loading,
                error: state.error
            });
        });
        
        // 2. 测试数据加载
        console.log('📥 测试数据加载...');
        await sitesManager.loadData();
        
        const initialState = sitesManager.getState();
        console.log('初始状态:', {
            sites: initialState.sites.length,
            todos: initialState.todos.length,
            archived: initialState.archived.length
        });
        
        // 3. 测试统计信息
        console.log('📊 测试统计信息...');
        const stats = sitesManager.getStats();
        console.log('统计信息:', stats);
        
        // 4. 测试搜索功能
        console.log('🔍 测试搜索功能...');
        const searchResults = sitesManager.searchSites('google');
        console.log('搜索 "google" 结果:', searchResults.length);
        
        // 5. 测试分类功能
        console.log('📂 测试分类功能...');
        const categories = sitesManager.getCategories();
        console.log('所有分类:', categories);
        
        if (categories.length > 0) {
            const categoryResults = sitesManager.filterSitesByCategory(categories[0]);
            console.log(`分类 "${categories[0]}" 的网站数量:`, categoryResults.length);
        }
        
        // 6. 测试网站提交 (仅模拟，不实际提交)
        console.log('📝 测试网站提交 (模拟)...');
        console.log('提交功能可用，但需要有效的 URL 和认证');
        
        // 清理
        unsubscribe();
        console.log('✅ 所有测试完成！');
        
        return {
            success: true,
            message: '测试通过',
            stats,
            stateUpdates
        };
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : '未知错误'
        };
    }
}

/**
 * 创建测试用的网站数据
 */
export function createTestSite(overrides: Partial<Site> = {}): Site {
    return {
        title: 'Test Site',
        url: 'https://test.example.com',
        favicon: 'https://test.example.com/favicon.ico',
        description: 'A test website for demonstration',
        category: 'Test',
        tags: ['test', 'demo'],
        ageRating: 'SFW',
        language: 'zh-CN',
        starred: false,
        supportsPWA: false,
        supportsHTTPS: true,
        recommendation: 'Great for testing',
        createdAt: new Date().toISOString(),
        ogImage: 'https://test.example.com/og.jpg',
        ...overrides
    };
}

/**
 * 创建测试用的 Todo 数据
 */
export function createTestTodo(overrides: Partial<Todo> = {}): Todo {
    return {
        url: 'https://test.example.com',
        ip: '127.0.0.1',
        language: 'zh-CN',
        os: 'Windows',
        browser: 'Chrome',
        submittedAt: new Date().toISOString(),
        status: 'pending',
        ...overrides
    };
}

/**
 * 模拟网站操作测试 (不实际执行)
 */
export function simulateOperations() {
    console.log('🎭 模拟网站操作...');
    
    const testSite = createTestSite();
    const testTodo = createTestTodo();
    
    console.log('测试网站数据:', testSite);
    console.log('测试 Todo 数据:', testTodo);
    
    // 模拟操作流程
    console.log('模拟操作流程:');
    console.log('1. 用户提交网站 URL');
    console.log('2. 系统创建 Todo 记录');
    console.log('3. 管理员审核');
    console.log('4. 批准: Todo -> Site, 拒绝: 更新 Todo 状态');
    console.log('5. 编辑/删除已有网站');
    
    return {
        testSite,
        testTodo,
        operations: [
            'submitSite',
            'approveSite', 
            'rejectSite',
            'editSite',
            'deleteSite'
        ]
    };
}

/**
 * 验证数据完整性
 */
export function validateDataIntegrity() {
    console.log('🔍 验证数据完整性...');
    
    const state = sitesManager.getState();
    const issues: string[] = [];
    
    // 检查网站数据
    state.sites.forEach((site, index) => {
        if (!site.url || !site.title) {
            issues.push(`Site ${index}: 缺少必需字段`);
        }
        
        if (!site.url.startsWith('http')) {
            issues.push(`Site ${index}: URL 格式无效`);
        }
    });
    
    // 检查 Todo 数据
    state.todos.forEach((todo, index) => {
        if (!todo.url || !todo.status) {
            issues.push(`Todo ${index}: 缺少必需字段`);
        }
        
        if (!['pending', 'approved', 'rejected'].includes(todo.status)) {
            issues.push(`Todo ${index}: 状态值无效`);
        }
    });
    
    console.log(issues.length === 0 ? '✅ 数据完整性检查通过' : '⚠️ 发现数据问题:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    
    return {
        valid: issues.length === 0,
        issues
    };
}

// 导出测试套件
export const testSuite = {
    testSitesManager,
    createTestSite,
    createTestTodo,
    simulateOperations,
    validateDataIntegrity
};

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined' && window.location?.search?.includes('test=sites')) {
    testSitesManager().then(result => {
        console.log('测试结果:', result);
    });
}
