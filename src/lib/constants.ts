
// 错误代码
export const ERROR_CODES = {
    INVALID_URL: 'INVALID_URL',
    SITE_EXISTS: 'SITE_EXISTS',
    FETCH_FAILED: 'FETCH_FAILED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    GITHUB_API_ERROR: 'GITHUB_API_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

// 错误消息
export const ERROR_MESSAGES = {
    [ERROR_CODES.INVALID_URL]: '无效的网站URL',
    [ERROR_CODES.SITE_EXISTS]: '网站已存在',
    [ERROR_CODES.FETCH_FAILED]: '获取网站信息失败',
    [ERROR_CODES.UNAUTHORIZED]: '未授权访问',
    [ERROR_CODES.FORBIDDEN]: '权限不足',
    [ERROR_CODES.NOT_FOUND]: '资源不存在',
    [ERROR_CODES.VALIDATION_ERROR]: '数据验证失败',
    [ERROR_CODES.GITHUB_API_ERROR]: 'GitHub API 错误',
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: '请求频率过高，请稍后再试'
} as const;

// 文件名常量
export const DATA_FILES = {
    SITES: 'sites.txt',
    ARCHIVED: '404.txt',
    PENDING: 'todo.csv'
} as const;

export const APP_NAME = '探索导航';

// 默认分类选项
export const DEFAULT_CATEGORIES = [
    "搜索引擎",
    "社交媒体",
    "新闻资讯",
    "在线工具",
    "开发工具",
    "设计资源",
    "学习教育",
    "娱乐休闲",
    "购物商城",
    "金融理财",
    "生活服务",
    "科技数码",
    "游戏娱乐",
    "音乐视频",
    "图片素材",
    "云存储",
    "办公软件",
    "其他",
] as const;