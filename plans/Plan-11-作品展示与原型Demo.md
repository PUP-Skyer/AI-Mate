# 作品展示与原型Demo 实施计划

> **目标：** 工匠AI从4面板扩展至5面板（新增原型Demo展示），同时在左侧栏"项目管理"下新增"作品展示"独立页面，以卡片网格布局展示用户通过 Vibe Coding 创建的网页、桌面端、APP、小程序 Demo 作品，点击卡片查看项目详情（名称、简介、阶段、团队情况、外部链接）。
>
> **依赖：** Plan-01（数据库层）、Plan-02（后端API）、Plan-03（AI模型集成）、Plan-06（工匠AI模块）
>
> **技术栈：** React 19 + TypeScript + Ant Design 6 + CSS Grid + Zustand + MySQL 8.0

---

## 模块概述

本计划包含两个相互关联的功能：

1. **工匠AI第5面板 — 原型Demo展示**：在工匠AI页面新增"原型Demo"子菜单，用户可在此管理通过 Vibe Coding 生成的 Demo 作品（网页/桌面端/APP/小程序），支持新增、编辑、预览和发布到作品展示。

2. **作品展示独立页面**：在左侧栏"项目管理"菜单组下新增"作品展示"入口，以深色主题卡片网格布局展示所有已发布的 Demo 作品，点击卡片弹出详情面板，显示项目名称、简介、所处阶段、团队情况及 GitHub/Gitee/抖音/哔哩哔哩/X/小红书 等外部链接。

### 现有代码基础

| 文件路径 | 说明 |
|---------|------|
| `src/pages/MakerAI.tsx` | 工匠AI主页面，已有4个子面板 |
| `src/App.tsx` | 主应用，菜单定义 |
| `src/components/ChatLayout.tsx` | 通用对话布局 |
| `src/services/aiService.ts` | AI服务层 |
| `db.js` | 数据库初始化 |
| `server.js` | 后端服务 |

### 子菜单规划（需更新 App.tsx）

```typescript
// 工匠AI子菜单：4 → 5
const makerSubs: SubMenuItem[] = [
  { key: 'bp', label: 'BP生成' },
  { key: 'ppt', label: 'PPT大纲' },
  { key: 'product', label: '产品文档' },
  { key: 'prototype', label: '原型描述' },
  { key: 'demo', label: '原型Demo' },  // 新增第5面板
];

// 项目管理菜单组新增"作品展示"
const projectSubs: SubMenuItem[] = [
  { key: 'showcase', label: '作品展示' },  // 新增
  // ... 现有子菜单
];
```

---

## 任务1：数据库层 — 创建 demo_projects 表

**文件：** 修改 `db.js`，在 `createTables()` 函数中追加

**目标：** 创建 Demo 作品存储表，支持项目阶段（6级融资阶段）和团队类型（OPC/OTC）字段

### 表结构设计

```sql
CREATE TABLE IF NOT EXISTS demo_projects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '作品ID',
  user_id INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '用户ID',
  title VARCHAR(200) NOT NULL COMMENT '项目名称',
  description TEXT COMMENT '项目简介',
  cover_image VARCHAR(500) DEFAULT NULL COMMENT '封面图URL（截图或设计稿）',

  -- Demo类型与访问
  demo_type ENUM('web', 'desktop', 'app', 'miniapp') NOT NULL COMMENT 'Demo类型：网页/桌面端/APP/小程序',
  demo_url VARCHAR(500) DEFAULT NULL COMMENT 'Demo在线访问URL',
  preview_urls JSON DEFAULT NULL COMMENT '多张预览图URL数组',

  -- 项目阶段（参考融资阶段6级分类）
  stage ENUM('seed', 'angel', 'series_a', 'series_b', 'series_c', 'pre_ipo') NOT NULL DEFAULT 'seed' COMMENT '项目阶段',

  -- 团队情况
  team_type ENUM('solo_opc', 'team_otc') NOT NULL DEFAULT 'solo_opc' COMMENT '团队类型：个人OPC/多人OTC',
  team_members JSON DEFAULT NULL COMMENT '团队成员（OTC类型时填写）',
  team_size INT UNSIGNED DEFAULT 1 COMMENT '团队人数',

  -- 技术信息
  tech_stack JSON DEFAULT NULL COMMENT '技术栈数组',
  tags JSON DEFAULT NULL COMMENT '自定义标签数组',

  -- 外部链接（社交与代码托管）
  links JSON DEFAULT NULL COMMENT '外部链接对象',
  -- links 结构: { "github": "...", "gitee": "...", "douyin": "...", "bilibili": "...", "x": "...", "xiaohongshu": "..." }

  -- 互动数据
  view_count INT UNSIGNED DEFAULT 0 COMMENT '浏览次数',
  like_count INT UNSIGNED DEFAULT 0 COMMENT '点赞次数',
  is_liked TINYINT(1) DEFAULT 0 COMMENT '当前用户是否已点赞',

  -- 状态管理
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft' COMMENT '发布状态',
  sort_order INT DEFAULT 0 COMMENT '排序权重',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX idx_user (user_id),
  INDEX idx_type (demo_type),
  INDEX idx_stage (stage),
  INDEX idx_team_type (team_type),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Demo作品展示表';
```

### 项目阶段枚举值映射

```javascript
const STAGE_OPTIONS = [
  { value: 'seed',      label: '种子轮',     desc: '仅有创意团队与计划书，无成熟产品营收' },
  { value: 'angel',     label: '天使轮',     desc: '产品雏形落地、少量内测用户，无稳定收入' },
  { value: 'series_a',  label: 'A轮',        desc: '产品成熟有持续营收，商业模式初步跑通' },
  { value: 'series_b',  label: 'B轮',        desc: '营收高速增长，占有细分市场份额' },
  { value: 'series_c',  label: 'C轮',        desc: '行业头部、营收规模大且现金流稳定' },
  { value: 'pre_ipo',   label: 'Pre-IPO轮',  desc: '完成股改辅导，明确IPO时间表' },
];
```

### 团队类型映射

```javascript
const TEAM_TYPE_OPTIONS = [
  {
    value: 'solo_opc',
    label: '个人 OPC',
    desc: 'One Person Company — 独立开发者/创业者独自完成',
    icon: '👤',
  },
  {
    value: 'team_otc',
    label: '多人 OTC',
    desc: 'Online Team Collaboration — 线上团队协作完成',
    icon: '👥',
  },
];
```

### 外部链接平台配置

```javascript
const LINK_PLATFORMS = [
  { key: 'github',      label: 'GitHub',     icon: '🐙', color: '#181717', placeholder: 'https://github.com/username/repo' },
  { key: 'gitee',       label: 'Gitee',      icon: '🔴', color: '#C71D23', placeholder: 'https://gitee.com/username/repo' },
  { key: 'douyin',      label: '抖音',       icon: '🎵', color: '#000000', placeholder: 'https://www.douyin.com/user/...' },
  { key: 'bilibili',    label: '哔哩哔哩',    icon: '📺', color: '#FB7299', placeholder: 'https://space.bilibili.com/xxxxx' },
  { key: 'x',           label: 'X (Twitter)', icon: '✖️', color: '#000000', placeholder: 'https://x.com/username' },
  { key: 'xiaohongshu', label: '小红书',     icon: '📕', color: '#FF2442', placeholder: 'https://www.xiaohongshu.com/user/...' },
  { key: 'website',     label: '官网',       icon: '🌐', color: '#1890ff', placeholder: 'https://your-project.com' },
];
```

### 默认示例数据

```javascript
// 插入示例 Demo 作品
const [demoCount] = await pool.execute('SELECT COUNT(*) as count FROM demo_projects');
if (demoCount[0].count === 0) {
  await pool.execute(`
    INSERT INTO demo_projects (user_id, title, description, cover_image, demo_type, demo_url, stage, team_type, team_size, tech_stack, tags, links, status) VALUES
    (1, '校园外卖配送平台', '基于位置服务的校园外卖配送系统，整合校内餐厅资源，支持实时订单追踪和众包配送', 'https://via.placeholder.com/400x300/722ed1/ffffff?text=Campus+Food', 'web', 'https://demo.campusfood.com', 'angel', 'team_otc', 4, JSON_ARRAY('React', 'Node.js', 'MySQL', 'WebSocket'), JSON_ARRAY('校园创业', '外卖', '众包配送'), JSON_OBJECT('github', 'https://github.com/demo/campusfood', 'gitee', 'https://gitee.com/demo/campusfood', 'bilibili', 'https://space.bilibili.com/demo'), 'published'),
    (1, 'AI简历优化助手', '利用大模型帮助大学生优化简历的桌面端应用，支持简历分析和智能改写', 'https://via.placeholder.com/400x300/1890ff/ffffff?text=AI+Resume', 'desktop', NULL, 'seed', 'solo_opc', 1, JSON_ARRAY('Electron', 'React', 'GLM-4'), JSON_ARRAY('AI工具', '简历', '求职'), JSON_OBJECT('github', 'https://github.com/demo/ai-resume', 'xiaohongshu', 'https://www.xiaohongshu.com/user/ai-resume'), 'published'),
    (1, '社团活动管理小程序', '面向高校社团的活动发布、报名签到、成员管理一体化小程序', 'https://via.placeholder.com/400x300/52c41a/ffffff?text=Club+Mini', 'miniapp', NULL, 'seed', 'solo_opc', 1, JSON_ARRAY('微信小程序', '云开发'), JSON_ARRAY('校园', '社团', '小程序'), JSON_OBJECT('gitee', 'https://gitee.com/demo/club-mini', 'douyin', 'https://www.douyin.com/user/club'), 'published'),
    (1, '校园二手交易APP', '高校内部的二手物品交易平台，支持当面交易和邮寄两种模式', 'https://via.placeholder.com/400x300/faad14/ffffff?text=2nd+Hand', 'app', NULL, 'angel', 'team_otc', 3, JSON_ARRAY('React Native', 'Express', 'MongoDB'), JSON_ARRAY('校园', '二手交易', 'APP'), JSON_OBJECT('github', 'https://github.com/demo/campus-trade', 'x', 'https://x.com/campus_trade'), 'published')
  `);
}
```

### 端到端验证

```bash
# 重启服务器触发建表
node server.js

# 验证表结构
mysql -u root -pPU159789682 ai_mate -e "DESCRIBE demo_projects;"
# 预期：22 个字段

# 验证默认数据
mysql -u root -pPU159789682 ai_mate -e "SELECT id, title, demo_type, stage, team_type FROM demo_projects;"
# 预期：4 条记录

# 验证筛选查询
mysql -u root -pPU159789682 ai_mate -e "SELECT title FROM demo_projects WHERE demo_type = 'web' AND status = 'published';"
```

---

## 任务2：后端API — Demo 作品 CRUD + 检索 + 点赞

**文件：** 修改 `server.js`

**目标：** 实现 Demo 作品的完整 CRUD、分页筛选、全文检索和点赞功能

### API 接口清单

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/demo-projects` | 获取作品列表（分页+类型/阶段/团队筛选） |
| GET | `/api/demo-projects/:id` | 获取作品详情（浏览次数自增） |
| POST | `/api/demo-projects` | 创建新作品 |
| PUT | `/api/demo-projects/:id` | 更新作品 |
| DELETE | `/api/demo-projects/:id` | 删除作品 |
| POST | `/api/demo-projects/:id/like` | 点赞/取消点赞 |
| GET | `/api/demo-projects/search` | 搜索作品（标题+描述） |

### 核心实现

```javascript
// ========== Demo 作品 API ==========

// 获取作品列表（分页 + 多维筛选）
app.get('/api/demo-projects', async (req, res) => {
  try {
    const pool = getPool();
    const {
      page = '1',
      pageSize = '12',
      demo_type,
      stage,
      team_type,
      status = 'published',
      sort = 'latest',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSizeNum = Math.min(48, Math.max(1, parseInt(pageSize, 10) || 12));
    const offset = (pageNum - 1) * pageSizeNum;

    let where = ['1=1'];
    let params = [];

    if (status) { where.push('status = ?'); params.push(status); }
    if (demo_type) { where.push('demo_type = ?'); params.push(demo_type); }
    if (stage) { where.push('stage = ?'); params.push(stage); }
    if (team_type) { where.push('team_type = ?'); params.push(team_type); }

    const whereClause = where.join(' AND ');

    let orderBy = 'ORDER BY created_at DESC';
    if (sort === 'popular') orderBy = 'ORDER BY view_count DESC, like_count DESC';
    if (sort === 'likes') orderBy = 'ORDER BY like_count DESC';

    // 查询总数
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM demo_projects WHERE ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // 查询列表
    const [rows] = await pool.execute(
      `SELECT id, title, description, cover_image, demo_type, demo_url,
              stage, team_type, team_size, tech_stack, tags, links,
              view_count, like_count, status, created_at, updated_at
       FROM demo_projects
       WHERE ${whereClause}
       ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, pageSizeNum, offset]
    );

    const items = rows.map(row => ({
      ...row,
      tech_stack: typeof row.tech_stack === 'string' ? JSON.parse(row.tech_stack) : row.tech_stack,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
      links: typeof row.links === 'string' ? JSON.parse(row.links) : row.links,
    }));

    res.json(success({
      items,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    }));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});

// 获取作品详情（浏览次数 +1）
app.get('/api/demo-projects/:id', async (req, res) => {
  try {
    const pool = getPool();
    const id = parseInt(req.params.id, 10);

    // 浏览次数自增
    await pool.execute('UPDATE demo_projects SET view_count = view_count + 1 WHERE id = ?', [id]);

    const [rows] = await pool.execute(
      `SELECT * FROM demo_projects WHERE id = ? AND status != 'archived'`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json(error('作品不存在', 404));
    }

    const row = rows[0];
    const detail = {
      ...row,
      tech_stack: typeof row.tech_stack === 'string' ? JSON.parse(row.tech_stack) : row.tech_stack,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
      links: typeof row.links === 'string' ? JSON.parse(row.links) : row.links,
      team_members: typeof row.team_members === 'string' ? JSON.parse(row.team_members) : row.team_members,
      preview_urls: typeof row.preview_urls === 'string' ? JSON.parse(row.preview_urls) : row.preview_urls,
    };

    res.json(success(detail));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});

// 创建作品
app.post('/api/demo-projects', async (req, res) => {
  try {
    const pool = getPool();
    const {
      title, description, cover_image, demo_type, demo_url, preview_urls,
      stage, team_type, team_size, team_members, tech_stack, tags, links, status,
    } = req.body;

    if (!title || !demo_type) {
      return res.status(400).json(error('title 和 demo_type 为必填字段', 400));
    }

    const validTypes = ['web', 'desktop', 'app', 'miniapp'];
    if (!validTypes.includes(demo_type)) {
      return res.status(400).json(error('demo_type 必须为 web/desktop/app/miniapp', 400));
    }

    const [result] = await pool.execute(
      `INSERT INTO demo_projects
       (user_id, title, description, cover_image, demo_type, demo_url, preview_urls,
        stage, team_type, team_size, team_members, tech_stack, tags, links, status)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        cover_image || null,
        demo_type,
        demo_url || null,
        preview_urls ? JSON.stringify(preview_urls) : null,
        stage || 'seed',
        team_type || 'solo_opc',
        team_size || 1,
        team_members ? JSON.stringify(team_members) : null,
        tech_stack ? JSON.stringify(tech_stack) : null,
        tags ? JSON.stringify(tags) : null,
        links ? JSON.stringify(links) : null,
        status || 'draft',
      ]
    );

    res.json(success({ id: result.insertId, message: '创建成功' }));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});

// 更新作品
app.put('/api/demo-projects/:id', async (req, res) => {
  try {
    const pool = getPool();
    const id = parseInt(req.params.id, 10);
    const fields = [
      'title', 'description', 'cover_image', 'demo_type', 'demo_url', 'preview_urls',
      'stage', 'team_type', 'team_size', 'team_members', 'tech_stack', 'tags', 'links', 'status',
    ];

    const updates = [];
    const params = [];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        const value = ['tech_stack', 'tags', 'links', 'team_members', 'preview_urls'].includes(field)
          ? JSON.stringify(req.body[field])
          : req.body[field];
        updates.push(`${field} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json(error('没有需要更新的字段', 400));
    }

    params.push(id);
    await pool.execute(
      `UPDATE demo_projects SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json(success({ message: '更新成功' }));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});

// 删除作品
app.delete('/api/demo-projects/:id', async (req, res) => {
  try {
    const pool = getPool();
    const id = parseInt(req.params.id, 10);
    await pool.execute('DELETE FROM demo_projects WHERE id = ?', [id]);
    res.json(success({ message: '删除成功' }));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});

// 点赞 / 取消点赞
app.post('/api/demo-projects/:id/like', async (req, res) => {
  try {
    const pool = getPool();
    const id = parseInt(req.params.id, 10);
    const { action } = req.body; // 'like' or 'unlike'

    if (action === 'like') {
      await pool.execute(
        'UPDATE demo_projects SET like_count = like_count + 1, is_liked = 1 WHERE id = ?',
        [id]
      );
    } else {
      await pool.execute(
        'UPDATE demo_projects SET like_count = GREATEST(like_count - 1, 0), is_liked = 0 WHERE id = ?',
        [id]
      );
    }

    const [rows] = await pool.execute(
      'SELECT like_count, is_liked FROM demo_projects WHERE id = ?',
      [id]
    );
    res.json(success(rows[0]));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});

// 搜索作品
app.get('/api/demo-projects/search', async (req, res) => {
  try {
    const pool = getPool();
    const { q, limit = '10' } = req.query;

    if (!q?.trim()) {
      return res.status(400).json(error('搜索关键词不能为空', 400));
    }

    const resultLimit = Math.min(48, Math.max(1, parseInt(limit, 10) || 10));
    const searchPattern = `%${q}%`;

    const [rows] = await pool.execute(
      `SELECT id, title, description, cover_image, demo_type, stage, team_type,
              view_count, like_count, created_at
       FROM demo_projects
       WHERE status = 'published'
         AND (title LIKE ? OR description LIKE ?)
       ORDER BY like_count DESC, created_at DESC
       LIMIT ?`,
      [searchPattern, searchPattern, resultLimit]
    );

    res.json(success({ query: q, total: rows.length, results: rows }));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});
```

### 验证方法

```bash
# 获取作品列表
curl "http://localhost:8080/api/demo-projects?page=1&pageSize=12"
curl "http://localhost:8080/api/demo-projects?demo_type=web"
curl "http://localhost:8080/api/demo-projects?stage=angel&team_type=team_otc"

# 获取详情
curl http://localhost:8080/api/demo-projects/1

# 创建作品
curl -X POST http://localhost:8080/api/demo-projects \
  -H "Content-Type: application/json" \
  -d '{"title":"测试Demo","demo_type":"web","stage":"seed","team_type":"solo_opc","tech_stack":["React"],"links":{"github":"https://github.com/test"}}'

# 点赞
curl -X POST http://localhost:8080/api/demo-projects/1/like \
  -H "Content-Type: application/json" \
  -d '{"action":"like"}'

# 搜索
curl "http://localhost:8080/api/demo-projects/search?q=校园"
```

---

## 任务3：前端服务层 — demoService.ts

**文件：** 新建 `src/services/demoService.ts`

**目标：** 封装所有 Demo 作品相关的前端 API 调用

```typescript
// src/services/demoService.ts

const API_BASE = '/api/demo-projects';

// 类型定义
export type DemoType = 'web' | 'desktop' | 'app' | 'miniapp';
export type ProjectStage = 'seed' | 'angel' | 'series_a' | 'series_b' | 'series_c' | 'pre_ipo';
export type TeamType = 'solo_opc' | 'team_otc';
export type DemoStatus = 'draft' | 'published' | 'archived';

export interface DemoProject {
  id: number;
  title: string;
  description: string;
  cover_image: string | null;
  demo_type: DemoType;
  demo_url: string | null;
  preview_urls: string[] | null;
  stage: ProjectStage;
  team_type: TeamType;
  team_size: number;
  team_members: any[] | null;
  tech_stack: string[];
  tags: string[];
  links: Record<string, string>;
  view_count: number;
  like_count: number;
  is_liked: boolean;
  status: DemoStatus;
  created_at: string;
  updated_at: string;
}

export interface DemoListResponse {
  items: DemoProject[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 配置常量
export const STAGE_OPTIONS: { value: ProjectStage; label: string; desc: string; color: string }[] = [
  { value: 'seed',     label: '种子轮',    desc: '仅有创意团队与计划书，无成熟产品营收', color: '#8c8c8c' },
  { value: 'angel',    label: '天使轮',    desc: '产品雏形落地、少量内测用户，无稳定收入', color: '#1890ff' },
  { value: 'series_a', label: 'A轮',       desc: '产品成熟有持续营收，商业模式初步跑通', color: '#52c41a' },
  { value: 'series_b', label: 'B轮',       desc: '营收高速增长，占有细分市场份额', color: '#faad14' },
  { value: 'series_c', label: 'C轮',       desc: '行业头部、营收规模大且现金流稳定', color: '#fa541c' },
  { value: 'pre_ipo',  label: 'Pre-IPO轮', desc: '完成股改辅导，明确IPO时间表', color: '#722ed1' },
];

export const DEMO_TYPE_OPTIONS: { value: DemoType; label: string; icon: string; color: string }[] = [
  { value: 'web',      label: '网页',     icon: '🌐', color: '#1890ff' },
  { value: 'desktop',  label: '桌面端',   icon: '🖥️', color: '#52c41a' },
  { value: 'app',      label: 'APP',     icon: '📱', color: '#faad14' },
  { value: 'miniapp',  label: '小程序',   icon: '💬', color: '#722ed1' },
];

export const TEAM_TYPE_OPTIONS: { value: TeamType; label: string; desc: string; icon: string }[] = [
  { value: 'solo_opc', label: '个人 OPC', desc: 'One Person Company — 独立完成', icon: '👤' },
  { value: 'team_otc', label: '多人 OTC', desc: 'Online Team Collaboration — 团队协作', icon: '👥' },
];

export const LINK_PLATFORMS: { key: string; label: string; icon: string; color: string; placeholder: string }[] = [
  { key: 'github',      label: 'GitHub',      icon: '🐙', color: '#181717', placeholder: 'https://github.com/username/repo' },
  { key: 'gitee',       label: 'Gitee',       icon: '🔴', color: '#C71D23', placeholder: 'https://gitee.com/username/repo' },
  { key: 'douyin',      label: '抖音',        icon: '🎵', color: '#000000', placeholder: 'https://www.douyin.com/user/...' },
  { key: 'bilibili',    label: '哔哩哔哩',     icon: '📺', color: '#FB7299', placeholder: 'https://space.bilibili.com/xxxxx' },
  { key: 'x',           label: 'X (Twitter)',  icon: '✖️', color: '#000000', placeholder: 'https://x.com/username' },
  { key: 'xiaohongshu', label: '小红书',      icon: '📕', color: '#FF2442', placeholder: 'https://www.xiaohongshu.com/user/...' },
  { key: 'website',     label: '官网',        icon: '🌐', color: '#1890ff', placeholder: 'https://your-project.com' },
];

// API 函数
export async function fetchDemoProjects(params: {
  page?: number;
  pageSize?: number;
  demo_type?: DemoType;
  stage?: ProjectStage;
  team_type?: TeamType;
  sort?: 'latest' | 'popular' | 'likes';
}): Promise<DemoListResponse> {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  const res = await fetch(`${API_BASE}?${query}`);
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.message);
  return json.data;
}

export async function fetchDemoDetail(id: number): Promise<DemoProject> {
  const res = await fetch(`${API_BASE}/${id}`);
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.message);
  return json.data;
}

export async function createDemo(data: Partial<DemoProject>): Promise<{ id: number }> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.message);
  return json.data;
}

export async function updateDemo(id: number, data: Partial<DemoProject>): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.message);
}

export async function deleteDemo(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.message);
}

export async function toggleLike(id: number, action: 'like' | 'unlike'): Promise<{ like_count: number; is_liked: boolean }> {
  const res = await fetch(`${API_BASE}/${id}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.message);
  return json.data;
}

export async function searchDemos(q: string): Promise<{ results: DemoProject[] }> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.message);
  return json.data;
}

// 辅助函数
export function getStageLabel(stage: ProjectStage): string {
  return STAGE_OPTIONS.find(s => s.value === stage)?.label || stage;
}

export function getStageColor(stage: ProjectStage): string {
  return STAGE_OPTIONS.find(s => s.value === stage)?.color || '#8c8c8c';
}

export function getDemoTypeLabel(type: DemoType): string {
  return DEMO_TYPE_OPTIONS.find(t => t.value === type)?.label || type;
}

export function getDemoTypeIcon(type: DemoType): string {
  return DEMO_TYPE_OPTIONS.find(t => t.value === type)?.icon || '📦';
}

export function getTeamTypeLabel(type: TeamType): string {
  return TEAM_TYPE_OPTIONS.find(t => t.value === type)?.label || type;
}
```

---

## 任务4：作品展示页面 — Showcase.tsx

**文件：** 新建 `src/pages/Showcase.tsx`

**目标：** 深色主题卡片网格布局的作品展示页面，支持筛选、排序、搜索和卡片详情

### 页面结构

```
┌──────────────────────────────────────────────────────┐
│  作品展示                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │  搜索框       │ │ 类型筛选      │ │ 阶段筛选      │  │
│  └──────────────┘ └──────────────┘ └──────────────┘  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ 团队筛选      │ │ 排序方式      │ │ 共 N 个作品   │  │
│  └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                       │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐            │
│  │ 卡片1  │ │ 卡片2  │ │ 卡片3  │ │ 卡片4  │            │
│  │ 封面图  │ │ 封面图  │ │ 封面图  │ │ 封面图  │            │
│  │ 标题    │ │ 标题    │ │ 标题    │ │ 标题    │            │
│  │ 标签    │ │ 标签    │ │ 标签    │ │ 标签    │            │
│  └───────┘ └───────┘ └───────┘ └───────┘            │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐            │
│  │ 卡片5  │ │ 卡片6  │ │ 卡片7  │ │ 卡片8  │            │
│  └───────┘ └───────┘ └───────┘ └───────┘            │
│                                                       │
│              ◄ 1  2  3  4 ►                           │
└──────────────────────────────────────────────────────┘
```

### 核心实现

```typescript
// src/pages/Showcase.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Input, Select, Row, Col, Spin, Empty, Pagination, message } from 'antd';
import {
  fetchDemoProjects,
  DemoProject,
  DemoType,
  ProjectStage,
  TeamType,
  STAGE_OPTIONS,
  DEMO_TYPE_OPTIONS,
  TEAM_TYPE_OPTIONS,
  getStageLabel,
  getStageColor,
  getDemoTypeLabel,
  getDemoTypeIcon,
  getTeamTypeLabel,
} from '../services/demoService';
import { ProjectCard } from '../components/showcase/ProjectCard';
import { ProjectDetailModal } from '../components/showcase/ProjectDetailModal';

const { Search } = Input;

const Showcase: React.FC = () => {
  const [projects, setProjects] = useState<DemoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  // 筛选状态
  const [demoType, setDemoType] = useState<DemoType | undefined>();
  const [stage, setStage] = useState<ProjectStage | undefined>();
  const [teamType, setTeamType] = useState<TeamType | undefined>();
  const [sort, setSort] = useState<'latest' | 'popular' | 'likes'>('latest');
  const [searchQuery, setSearchQuery] = useState('');

  // 详情弹窗
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDemoProjects({
        page,
        pageSize,
        demo_type: demoType,
        stage,
        team_type: teamType,
        sort,
      });
      setProjects(data.items);
      setTotal(data.total);
    } catch (err) {
      message.error('加载作品失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, demoType, stage, teamType, sort]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCardClick = (id: number) => {
    setSelectedId(id);
    setDetailVisible(true);
  };

  return (
    <div style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>作品展示</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
          展示通过 Vibe Coding 创建的网页、桌面端、APP、小程序 Demo 作品
        </p>
      </div>

      {/* 筛选栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Search
          placeholder="搜索作品名称或描述..."
          allowClear
          style={{ width: 240 }}
          onSearch={setSearchQuery}
        />
        <Select
          placeholder="Demo类型"
          allowClear
          style={{ width: 140 }}
          value={demoType}
          onChange={(v) => { setDemoType(v); setPage(1); }}
          options={DEMO_TYPE_OPTIONS.map(t => ({ value: t.value, label: `${t.icon} ${t.label}` }))}
        />
        <Select
          placeholder="项目阶段"
          allowClear
          style={{ width: 140 }}
          value={stage}
          onChange={(v) => { setStage(v); setPage(1); }}
          options={STAGE_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
        />
        <Select
          placeholder="团队类型"
          allowClear
          style={{ width: 140 }}
          value={teamType}
          onChange={(v) => { setTeamType(v); setPage(1); }}
          options={TEAM_TYPE_OPTIONS.map(t => ({ value: t.value, label: `${t.icon} ${t.label}` }))}
        />
        <Select
          style={{ width: 120 }}
          value={sort}
          onChange={setSort}
          options={[
            { value: 'latest', label: '最新发布' },
            { value: 'popular', label: '最多浏览' },
            { value: 'likes', label: '最多点赞' },
          ]}
        />
        <span style={{ lineHeight: '32px', color: 'var(--text-muted)', fontSize: 13 }}>
          共 {total} 个作品
        </span>
      </div>

      {/* 卡片网格 */}
      <Spin spinning={loading}>
        {projects.length === 0 && !loading ? (
          <Empty description="暂无作品" />
        ) : (
          <Row gutter={[16, 16]}>
            {projects.map(project => (
              <Col key={project.id} xs={24} sm={12} md={8} lg={6}>
                <ProjectCard
                  project={project}
                  onClick={() => handleCardClick(project.id)}
                />
              </Col>
            ))}
          </Row>
        )}
      </Spin>

      {/* 分页 */}
      {total > pageSize && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={setPage}
            showSizeChanger={false}
          />
        </div>
      )}

      {/* 详情弹窗 */}
      <ProjectDetailModal
        id={selectedId}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
      />
    </div>
  );
};

export default Showcase;
```

---

## 任务5：作品卡片组件 — ProjectCard.tsx

**文件：** 新建 `src/components/showcase/ProjectCard.tsx`

**目标：** 实现参考图1的深色主题卡片设计，包含封面图、类型标签、阶段标签、标题、描述和点赞按钮

```typescript
// src/components/showcase/ProjectCard.tsx

import React, { useState } from 'react';
import { Heart, Eye } from '@ant-design/icons';
import { DemoProject, getStageLabel, getStageColor, getDemoTypeLabel, getDemoTypeIcon, toggleLike } from '../../services/demoService';

interface Props {
  project: DemoProject;
  onClick: () => void;
}

const ProjectCard: React.FC<Props> = ({ project, onClick }) => {
  const [liked, setLiked] = useState(project.is_liked);
  const [likeCount, setLikeCount] = useState(project.like_count);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const action = liked ? 'unlike' : 'like';
      const result = await toggleLike(project.id, action);
      setLiked(result.is_liked);
      setLikeCount(result.like_count);
    } catch {
      // 静默失败
    }
  };

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card, #1a1a1a)',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* 封面图区域 */}
      <div style={{ position: 'relative', paddingTop: '75%', overflow: 'hidden' }}>
        {project.cover_image ? (
          <img
            src={project.cover_image}
            alt={project.title}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: `linear-gradient(135deg, ${getStageColor(project.stage)}33, ${getStageColor(project.stage)}11)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 48,
          }}>
            {getDemoTypeIcon(project.demo_type)}
          </div>
        )}

        {/* 顶部类型标签 */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          color: '#fff', fontSize: 11, padding: '3px 10px',
          borderRadius: 12, fontWeight: 500,
        }}>
          {getDemoTypeIcon(project.demo_type)} {getDemoTypeLabel(project.demo_type)}
        </div>

        {/* 阶段标签 */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: getStageColor(project.stage),
          color: '#fff', fontSize: 11, padding: '3px 10px',
          borderRadius: 12, fontWeight: 600,
        }}>
          {getStageLabel(project.stage)}
        </div>

        {/* 点赞按钮 */}
        <div
          onClick={handleLike}
          style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Heart
            style={{
              fontSize: 16,
              color: liked ? '#ff4d4f' : '#fff',
              fill: liked ? '#ff4d4f' : 'transparent',
            }}
          />
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ padding: '12px 14px' }}>
        {/* 标题 */}
        <h3 style={{
          margin: '0 0 6px 0', fontSize: 15, fontWeight: 600,
          color: 'var(--text-primary, #fff)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {project.title}
        </h3>

        {/* 描述 */}
        <p style={{
          margin: '0 0 8px 0', fontSize: 12,
          color: 'var(--text-muted, #888)',
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {project.description || '暂无描述'}
        </p>

        {/* 底部信息 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 11, color: 'var(--text-muted, #666)',
        }}>
          <span style={{ display: 'flex', gap: 10 }}>
            <span><Eye style={{ marginRight: 3 }} />{project.view_count}</span>
            <span><Heart style={{ marginRight: 3 }} />{likeCount}</span>
          </span>
          <span>查看 →</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
```

---

## 任务6：作品详情弹窗 — ProjectDetailModal.tsx

**文件：** 新建 `src/components/showcase/ProjectDetailModal.tsx`

**目标：** 点击卡片后弹出详情面板，展示项目名称、简介、阶段、团队情况、技术栈、外部链接等完整信息

```typescript
// src/components/showcase/ProjectDetailModal.tsx

import React, { useState, useEffect } from 'react';
import { Modal, Spin, Tag, Avatar, Button, Divider, Descriptions, message } from 'antd';
import {
  Eye, Heart, GithubOutlined, LinkOutlined, UserOutlined, TeamOutlined,
  CalendarOutlined, CodeOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import {
  fetchDemoDetail, DemoProject, LINK_PLATFORMS,
  getStageLabel, getStageColor, getDemoTypeLabel, getDemoTypeIcon,
  getTeamTypeLabel, STAGE_OPTIONS,
} from '../../services/demoService';

interface Props {
  id: number | null;
  visible: boolean;
  onClose: () => void;
}

const ProjectDetailModal: React.FC<Props> = ({ id, visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<DemoProject | null>(null);

  useEffect(() => {
    if (visible && id) {
      loadDetail(id);
    }
  }, [visible, id]);

  const loadDetail = async (projectId: number) => {
    setLoading(true);
    try {
      const data = await fetchDemoDetail(projectId);
      setDetail(data);
    } catch {
      message.error('加载详情失败');
    } finally {
      setLoading(false);
    }
  };

  const stageInfo = STAGE_OPTIONS.find(s => s.value === detail?.stage);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={720}
      styles={{ body: { padding: 0 } }}
    >
      {loading || !detail ? (
        <div style={{ padding: 48, textAlign: 'center' }}><Spin /></div>
      ) : (
        <div>
          {/* 封面图 */}
          <div style={{
            width: '100%', height: 280, overflow: 'hidden',
            background: `linear-gradient(135deg, ${getStageColor(detail.stage)}33, ${getStageColor(detail.stage)}11)`,
            position: 'relative',
          }}>
            {detail.cover_image && (
              <img src={detail.cover_image} alt={detail.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            {/* 类型 + 阶段标签覆盖 */}
            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
              <Tag color="blue" style={{ borderRadius: 12 }}>
                {getDemoTypeIcon(detail.demo_type)} {getDemoTypeLabel(detail.demo_type)}
              </Tag>
              <Tag color={getStageColor(detail.stage)} style={{ borderRadius: 12 }}>
                {getStageLabel(detail.stage)}
              </Tag>
            </div>
          </div>

          <div style={{ padding: '24px 28px' }}>
            {/* 标题 + 统计 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{detail.title}</h2>
                <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 13, display: 'flex', gap: 16 }}>
                  <span><Eye /> {detail.view_count} 次浏览</span>
                  <span><Heart /> {detail.like_count} 次点赞</span>
                  <span><CalendarOutlined /> {new Date(detail.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </div>

            {/* 项目简介 */}
            <div style={{ marginTop: 20 }}>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>项目简介</h4>
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, fontSize: 14 }}>
                {detail.description || '暂无描述'}
              </p>
            </div>

            {/* 项目阶段 */}
            <div style={{ marginTop: 20 }}>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>项目阶段</h4>
              <div style={{
                padding: '12px 16px', borderRadius: 8,
                background: `${getStageColor(detail.stage)}15`,
                borderLeft: `3px solid ${getStageColor(detail.stage)}`,
              }}>
                <span style={{ fontWeight: 600, color: getStageColor(detail.stage) }}>
                  {getStageLabel(detail.stage)}
                </span>
                <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                  {stageInfo?.desc}
                </span>
              </div>
            </div>

            {/* 团队情况 */}
            <div style={{ marginTop: 20 }}>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>团队情况</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: detail.team_type === 'solo_opc' ? '#1890ff15' : '#52c41a15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24,
                }}>
                  {detail.team_type === 'solo_opc' ? '👤' : '👥'}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {getTeamTypeLabel(detail.team_type)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {detail.team_type === 'solo_opc'
                      ? '独立开发者独自完成'
                      : `${detail.team_size}人团队协作完成`}
                  </div>
                </div>
              </div>
              {/* 团队成员列表（OTC时展示） */}
              {detail.team_type === 'team_otc' && detail.team_members && detail.team_members.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {detail.team_members.map((member: any, i: number) => (
                    <Tag key={i} icon={<UserOutlined />}>
                      {member.name}{member.role ? ` · ${member.role}` : ''}
                    </Tag>
                  ))}
                </div>
              )}
            </div>

            {/* 技术栈 */}
            {detail.tech_stack && detail.tech_stack.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
                  <CodeOutlined /> 技术栈
                </h4>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {detail.tech_stack.map((tech, i) => (
                    <Tag key={i} color="geekblue">{tech}</Tag>
                  ))}
                </div>
              </div>
            )}

            {/* 标签 */}
            {detail.tags && detail.tags.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {detail.tags.map((tag, i) => (
                    <Tag key={i}>#{tag}</Tag>
                  ))}
                </div>
              </div>
            )}

            <Divider />

            {/* 外部链接 */}
            {detail.links && Object.keys(detail.links).length > 0 && (
              <div>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>外部链接</h4>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {LINK_PLATFORMS.map(platform => {
                    const url = detail.links[platform.key];
                    if (!url) return null;
                    return (
                      <a
                        key={platform.key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 14px', borderRadius: 8,
                          background: `${platform.color}15`,
                          border: `1px solid ${platform.color}30`,
                          color: platform.color, fontSize: 13,
                          textDecoration: 'none', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${platform.color}25`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `${platform.color}15`;
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{platform.icon}</span>
                        <span>{platform.label}</span>
                        <ArrowRightOutlined style={{ fontSize: 11 }} />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Demo 访问按钮 */}
            {detail.demo_url && (
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <Button
                  type="primary"
                  size="large"
                  href={detail.demo_url}
                  target="_blank"
                  icon={<LinkOutlined />}
                >
                  在线体验 Demo
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ProjectDetailModal;
```

---

## 任务7：工匠AI第5面板 — PrototypeDemoPanel.tsx

**文件：** 新建 `src/components/maker/PrototypeDemoPanel.tsx`

**目标：** 工匠AI的新增第5个面板，用于管理用户的 Demo 作品，支持新增/编辑/发布到作品展示

```typescript
// src/components/maker/PrototypeDemoPanel.tsx

import React, { useState, useEffect } from 'react';
import {
  Card, Button, List, Tag, Modal, Form, Input, Select, Space,
  message, Empty, Popconfirm, Switch, Row, Col, InputNumber,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  RocketOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import {
  fetchDemoProjects, createDemo, updateDemo, deleteDemo,
  DemoProject, DemoType, ProjectStage, TeamType,
  STAGE_OPTIONS, DEMO_TYPE_OPTIONS, TEAM_TYPE_OPTIONS, LINK_PLATFORMS,
  getStageLabel, getStageColor, getDemoTypeLabel, getDemoTypeIcon,
} from '../../services/demoService';

const { TextArea } = Input;

const PrototypeDemoPanel: React.FC = () => {
  const [projects, setProjects] = useState<DemoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const loadProjects = async () => {
    setLoading(true);
    try {
      // 获取当前用户的所有作品（包括草稿）
      const data = await fetchDemoProjects({ page: 1, pageSize: 48 });
      setProjects(data.items);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const handleCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      demo_type: 'web',
      stage: 'seed',
      team_type: 'solo_opc',
      team_size: 1,
      status: 'draft',
      tech_stack: [],
      tags: [],
      links: {},
    });
    setEditorVisible(true);
  };

  const handleEdit = (project: DemoProject) => {
    setEditingId(project.id);
    form.setFieldsValue(project);
    setEditorVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await updateDemo(editingId, values);
        message.success('更新成功');
      } else {
        await createDemo(values);
        message.success('创建成功');
      }
      setEditorVisible(false);
      loadProjects();
    } catch (err) {
      message.error('保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    await deleteDemo(id);
    message.success('删除成功');
    loadProjects();
  };

  const handlePublish = async (project: DemoProject) => {
    await updateDemo(project.id, { status: 'published' });
    message.success('已发布到作品展示');
    loadProjects();
  };

  return (
    <div style={{ padding: '16px 0' }}>
      {/* 头部操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0 }}>
            <AppstoreOutlined /> 原型Demo展示
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            管理通过 Vibe Coding 创建的网页、桌面端、APP、小程序 Demo 作品
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增Demo
        </Button>
      </div>

      {/* 作品列表 */}
      <List
        loading={loading}
        grid={{ gutter: 16, column: 3 }}
        dataSource={projects}
        locale={{ emptyText: <Empty description="暂无Demo作品，点击「新增Demo」创建" /> }}
        renderItem={(project) => (
          <List.Item>
            <Card
              hoverable
              size="small"
              actions={[
                <EyeOutlined key="view" onClick={() => window.open(`/showcase?id=${project.id}`)} />,
                <EditOutlined key="edit" onClick={() => handleEdit(project)} />,
                <Popconfirm
                  key="delete"
                  title="确认删除？"
                  onConfirm={() => handleDelete(project.id)}
                >
                  <DeleteOutlined />
                </Popconfirm>,
              ]}
            >
              <Card.Meta
                avatar={
                  <div style={{ fontSize: 28 }}>{getDemoTypeIcon(project.demo_type)}</div>
                }
                title={
                  <Space>
                    <span>{project.title}</span>
                    <Tag color={getStageColor(project.stage)} style={{ fontSize: 11 }}>
                      {getStageLabel(project.stage)}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                      {getDemoTypeLabel(project.demo_type)} · {project.team_type === 'solo_opc' ? '👤 OPC' : `👥 OTC(${project.team_size}人)`}
                    </div>
                    <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {project.description || '暂无描述'}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {project.status === 'published'
                        ? <Tag color="green">已发布</Tag>
                        : <Tag>草稿</Tag>
                      }
                    </div>
                  </div>
                }
              />
              {project.status === 'draft' && (
                <Button
                  size="small" type="dashed" block
                  icon={<RocketOutlined />}
                  style={{ marginTop: 8 }}
                  onClick={() => handlePublish(project)}
                >
                  发布到作品展示
                </Button>
              )}
            </Card>
          </List.Item>
        )}
      />

      {/* 编辑弹窗 */}
      <Modal
        title={editingId ? '编辑Demo' : '新增Demo'}
        open={editorVisible}
        onOk={handleSave}
        onCancel={() => setEditorVisible(false)}
        width={680}
        okText="保存"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="title" label="项目名称" rules={[{ required: true }]}>
                <Input placeholder="如：校园外卖配送平台" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="demo_type" label="Demo类型" rules={[{ required: true }]}>
                <Select options={DEMO_TYPE_OPTIONS.map(t => ({ value: t.value, label: `${t.icon} ${t.label}` }))} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="项目简介">
            <TextArea rows={3} placeholder="简要描述项目功能和亮点..." />
          </Form.Item>

          <Form.Item name="cover_image" label="封面图URL">
            <Input placeholder="https://..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="demo_url" label="Demo在线URL">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="stage" label="项目阶段">
                <Select options={STAGE_OPTIONS.map(s => ({ value: s.value, label: s.label }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="发布状态">
                <Select options={[
                  { value: 'draft', label: '草稿' },
                  { value: 'published', label: '已发布' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="team_type" label="团队类型">
                <Select options={TEAM_TYPE_OPTIONS.map(t => ({ value: t.value, label: `${t.icon} ${t.label}` }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="team_size" label="团队人数">
                <InputNumber min={1} max={50} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="tech_stack" label="技术栈（逗号分隔）">
            <Select mode="tags" placeholder="React, Node.js, MySQL..." />
          </Form.Item>

          <Form.Item name="tags" label="标签（逗号分隔）">
            <Select mode="tags" placeholder="校园创业, AI工具..." />
          </Form.Item>

          {/* 外部链接 */}
          <div style={{ marginBottom: 8, fontWeight: 500 }}>外部链接</div>
          <Row gutter={16}>
            {LINK_PLATFORMS.map(platform => (
              <Col key={platform.key} span={12}>
                <Form.Item
                  name={['links', platform.key]}
                  label={`${platform.icon} ${platform.label}`}
                >
                  <Input placeholder={platform.placeholder} />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default PrototypeDemoPanel;
```

---

## 任务8：整合到页面和菜单

### 8.1 更新 App.tsx — 菜单配置

```typescript
// src/App.tsx 中更新菜单

// 工匠AI子菜单：4 → 5
const makerSubs: SubMenuItem[] = [
  { key: 'bp', label: 'BP生成' },
  { key: 'ppt', label: 'PPT大纲' },
  { key: 'product', label: '产品文档' },
  { key: 'prototype', label: '原型描述' },
  { key: 'demo', label: '原型Demo' },  // 新增
];

// 项目管理菜单组新增"作品展示"
const menuItems = [
  // ... 现有菜单
  {
    key: 'project-mgmt',
    label: '项目管理',
    children: [
      { key: 'showcase', label: '作品展示' },  // 新增
      // ... 现有子项
    ],
  },
];
```

### 8.2 更新 MakerAI.tsx — 新增第5面板

```typescript
// src/pages/MakerAI.tsx 中新增 demo 分支

import PrototypeDemoPanel from '../components/maker/PrototypeDemoPanel';

// 在 switch(activeSub) 中新增:
case 'demo':
  return <PrototypeDemoPanel />;
```

### 8.3 新增 Showcase 路由

```typescript
// src/App.tsx 中新增路由
import Showcase from './pages/Showcase';

// 在路由配置中:
{key === 'showcase' && <Showcase />}
```

---

## 任务9：端到端验证

### 验证清单

| 验证项 | 操作 | 预期结果 |
|--------|------|----------|
| 数据库建表 | 重启后端 | `demo_projects` 表存在，22个字段，4条示例数据 |
| 列表API | `curl /api/demo-projects` | 返回分页数据，包含 items/total/page |
| 筛选API | `curl /api/demo-projects?demo_type=web&stage=angel` | 仅返回符合条件的作品 |
| 详情API | `curl /api/demo-projects/1` | 返回完整详情，view_count +1 |
| 创建API | POST 创建新作品 | 返回新ID |
| 点赞API | POST like | like_count +1 |
| 搜索API | `curl /api/demo-projects/search?q=校园` | 返回匹配结果 |
| 工匠AI第5面板 | 进入工匠AI → 原型Demo | 显示Demo列表，可新增/编辑/删除/发布 |
| 作品展示页面 | 左侧栏 → 项目管理 → 作品展示 | 卡片网格布局，筛选/排序/搜索可用 |
| 卡片点击 | 点击任意卡片 | 弹出详情弹窗，显示项目名称/简介/阶段/团队/链接 |
| 外部链接 | 点击详情中的GitHub/抖音等链接 | 新窗口打开对应URL |
| 点赞交互 | 点击卡片心形按钮 | 点赞数实时变化 |
| 响应式 | 缩小窗口 | 卡片从4列→3列→2列→1列 |
| 菜单入口 | 左侧栏查看 | 工匠AI有5个子菜单，项目管理下有"作品展示" |

### 端到端测试命令

```bash
# 1. 数据库验证
mysql -u root -pPU159789682 ai_mate -e "DESCRIBE demo_projects;"
mysql -u root -pPU159789682 ai_mate -e "SELECT COUNT(*) FROM demo_projects;"

# 2. API 全流程测试
# 创建
curl -X POST http://localhost:8080/api/demo-projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试Demo",
    "description": "这是一个测试项目",
    "demo_type": "web",
    "stage": "seed",
    "team_type": "solo_opc",
    "team_size": 1,
    "tech_stack": ["React", "Vite"],
    "tags": ["测试"],
    "links": {"github": "https://github.com/test", "bilibili": "https://space.bilibili.com/test"},
    "status": "published"
  }'

# 列表
curl "http://localhost:8080/api/demo-projects?demo_type=web&stage=seed"

# 详情
curl http://localhost:8080/api/demo-projects/1

# 点赞
curl -X POST http://localhost:8080/api/demo-projects/1/like \
  -H "Content-Type: application/json" -d '{"action":"like"}'

# 搜索
curl "http://localhost:8080/api/demo-projects/search?q=测试"

# 3. 前端验证
# 启动前端 → 进入工匠AI → 验证5个子菜单
# 进入项目管理 → 作品展示 → 验证卡片网格和详情弹窗
```

---

## 文件清单

### 新建文件

| 文件路径 | 说明 |
|---------|------|
| `src/services/demoService.ts` | Demo作品前端服务层（API封装 + 类型定义 + 配置常量） |
| `src/pages/Showcase.tsx` | 作品展示独立页面（卡片网格 + 筛选 + 分页） |
| `src/components/showcase/ProjectCard.tsx` | 作品卡片组件（深色主题 + 封面图 + 标签 + 点赞） |
| `src/components/showcase/ProjectDetailModal.tsx` | 作品详情弹窗（项目信息 + 阶段 + 团队 + 外部链接） |
| `src/components/maker/PrototypeDemoPanel.tsx` | 工匠AI第5面板（Demo管理 + 新增/编辑/发布） |

### 修改文件

| 文件路径 | 修改内容 |
|---------|----------|
| `db.js` | 新增 `demo_projects` 表创建 + 示例数据 |
| `server.js` | 新增 7 个 Demo 作品 API 接口 |
| `src/App.tsx` | 工匠AI子菜单 4→5，项目管理新增"作品展示"入口 |
| `src/pages/MakerAI.tsx` | switch 新增 `demo` 分支 |
