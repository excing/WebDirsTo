# EditSiteModal 组件

一个功能完整的网站信息编辑模态框组件，支持编辑 Site 的所有属性，包括网站分析和保存功能。

## 功能特性

- ✅ 支持编辑 Site 的所有属性
- ✅ 网站自动分析功能（调用 `analyzeSite` API）
- ✅ 表单验证和错误处理
- ✅ 响应式设计，支持桌面和移动端
- ✅ 深色模式支持
- ✅ 无障碍访问支持
- ✅ 保存功能（调用 `putCommits` API）
- ✅ 键盘快捷键支持（ESC 关闭，Ctrl+Enter 保存）

## 属性 (Props)

```typescript
interface Props {
  isOpen: boolean;           // 是否显示模态框
  site: Site | null;         // 要编辑的网站信息，null 表示添加新网站
  categories?: string[];     // 分类选项列表，可选，默认为空数组
  onclose?: () => void;      // 关闭回调
  onsave?: (site: Site) => Promise<boolean>; // 保存回调，返回 Promise<boolean>
}
```

## 使用示例

### 基本使用

```svelte
<script lang="ts">
  import EditSiteModal from '$lib/components/EditSiteModal.svelte';
  import { DEFAULT_CATEGORIES } from '$lib/constants';
  import type { Site } from '$lib/types';

  let showModal = $state(false);
  let editingSite = $state<Site | null>(null);

  function openEditModal(site: Site | null = null) {
    editingSite = site;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingSite = null;
  }

  async function handleSave(site: Site): Promise<boolean> {
    console.log('保存的网站信息:', site);
    // 处理保存逻辑
    return true; // 返回 true 表示保存成功
  }
</script>

<!-- 触发按钮 -->
<button onclick={() => openEditModal(null)}>
  添加新网站
</button>

<button onclick={() => openEditModal(existingSite)}>
  编辑网站
</button>

<!-- 模态框 -->
<EditSiteModal
  isOpen={showModal}
  site={editingSite}
  categories={[...DEFAULT_CATEGORIES]}
  onclose={closeModal}
  onsave={handleSave}
/>
```

### 在管理页面中使用

```svelte
<script lang="ts">
  import EditSiteModal from '$lib/components/EditSiteModal.svelte';
  import { DEFAULT_CATEGORIES } from '$lib/constants';

  let sites = $state<Site[]>([]);
  let showEditModal = $state(false);
  let editingSite = $state<Site | null>(null);

  function editSite(site: Site) {
    editingSite = site;
    showEditModal = true;
  }

  async function handleSiteUpdate(updatedSite: Site): Promise<boolean> {
    try {
      // 更新本地数据
      const index = sites.findIndex(s => s.url === updatedSite.url);
      if (index !== -1) {
        sites[index] = updatedSite;
      }

      // 刷新数据或其他处理
      await refreshData();
      return true;
    } catch (error) {
      console.error('更新失败:', error);
      return false;
    }
  }
</script>

<!-- 网站列表 -->
{#each sites as site}
  <div class="site-item">
    <h3>{site.title}</h3>
    <button onclick={() => editSite(site)}>编辑</button>
  </div>
{/each}

<!-- 编辑模态框 -->
<EditSiteModal
  isOpen={showEditModal}
  site={editingSite}
  categories={[...DEFAULT_CATEGORIES]}
  onclose={() => showEditModal = false}
  onsave={handleSiteUpdate}
/>
```

## 表单字段

### 基本信息
- **网址** (必填): 网站的 URL，支持自动添加协议
- **标题** (必填): 网站标题
- **描述**: 网站描述
- **分类**: 支持手动输入或从下拉列表选择，分类选项由调用者通过 `categories` 参数提供
- **标签**: 用逗号分隔的标签列表

### 高级设置
- **年龄分级**: SFW (全年龄) 或 18+ (成人内容)
- **语言**: 网站主要语言
- **推荐级别**: 无推荐、低推荐、中推荐、高推荐、精选推荐
- **网站图标**: Favicon URL
- **预览图片**: OG Image URL

### 功能支持
- **支持 HTTPS**: 网站是否支持 HTTPS
- **支持 PWA**: 是否为渐进式网页应用
- **标记为收藏**: 是否收藏该网站

## API 集成

### 网站分析
点击"分析"按钮会调用 `/api/analyze-site` 接口，自动填充网站信息：
- 自动获取网站标题、描述、图标
- 检测 HTTPS 和 PWA 支持
- AI 自动分类和标签生成

### 保存数据
保存时会调用 `/api/admin/sites` 接口的 PUT 方法，通过 GitHub API 更新数据文件。

## 键盘快捷键

- `ESC`: 关闭模态框
- `Ctrl+Enter` / `Cmd+Enter`: 保存表单

## 样式定制

组件使用 Tailwind CSS 构建，支持深色模式。可以通过修改 CSS 类来定制样式。

## 注意事项

1. 需要管理员权限才能使用网站分析和保存功能
2. 网址字段会自动验证 URL 格式
3. 标签输入支持逗号分隔，会自动去除空白字符
4. 模态框支持点击背景关闭
5. 表单提交时会显示加载状态，防止重复提交

## 测试

可以访问 `/test-edit-modal` 页面查看组件的完整演示。
