# AI Mate 平台 × 外部 Skill 集成方案

> 目标：将 SkillHub、RedSkill、ClawHub 等平台的 Skill 接入 AI Mate，让用户可以在平台内直接调用。
>
> 核心前提：**Skill 的本质是 `SKILL.md` 文件 = YAML 元信息 + Markdown 指令内容**。它不是可执行代码，而是给 AI 的"使用说明书"。

---

## 一、Skill 的本质解析

### 1.1 Skill 的文件结构

所有主流平台的 Skill 都遵循统一的 `SKILL.md` 规范：

```
skill-name/
├── SKILL.md          # 核心文件：YAML 头 + Markdown 身
├── references/       # （可选）参考资料
├── scripts/          # （可选）辅助脚本
└── assets/           # （可选）静态资源
```

### 1.2 SKILL.md 内部结构

```markdown
---
name: skill-name                    # 技能标识（小写+中划线）
description: "做什么 + 何时触发"     # 触发关键词必须具体
version: 1.0.0
tags: ["办公", "文档"]
---

# Skill 标题

## Triggers / When to Use
- 用户说"xxx"时触发
- 检测到 yyy 场景时触发

## Instructions / Quick Reference
1. 第一步：...
2. 第二步：...

## Examples
输入：...
输出：...
```

### 1.3 各平台差异对照

| 平台 | Skill 格式 | 获取方式 | 说明 |
|------|-----------|---------|------|
| **SkillHub** | `SKILL.md` | API + 网页抓取 | 约 9.5 万个，有公开 API |
| **ClawHub** | `SKILL.md` | `openclaw skills list` + 下载 | OpenClaw 官方商店 |
| **RedSkill** | `SKILL.md` | 小红书笔记挂载 | 小红书生态，需解析笔记组件 |
| **洁癖 Skill** | `SKILL.md` | GitHub 直接下载 | 开源项目，手动导入 |

**结论**：所有平台的核心都是 `SKILL.md`，接入的关键是**批量获取 → 解析存储 → 触发注入**。

---

## 二、集成架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        AI Mate 平台                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   用户对话    │  │   Skill库    │  │   AI 引擎    │       │
│  │   界面       │  │   管理面板   │  │   (LLM)      │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                  │               │
│         ▼                 ▼                  ▼               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              Skill 调度与注入引擎                     │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │     │
│  │  │ 触发器匹配 │  │ 上下文注入 │  │ Skill 内容加载器  │   │     │
│  │  │ (Triggers)│  │ (Prompt) │  │ (Loader)         │   │     │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │     │
│  └─────────────────────────────────────────────────────┘     │
│         ▲                 ▲                  ▲               │
│         │                 │                  │               │
│  ┌──────┴─────────────────┴──────────────────┴──────┐        │
│  │              Skill 存储层 (DB/File)                │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │        │
│  │  │ SkillHub  │  │ ClawHub  │  │ RedSkill │  ...   │        │
│  │  │ 数据      │  │ 数据     │  │ 数据     │        │        │
│  │  └──────────┘  └──────────┘  └──────────┘        │        │
│  └──────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              外部 Skill 源（同步/抓取）                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ SkillHub API │  │ ClawHub 商店  │  │ RedSkill 笔记 │       │
│  │ (api.skillhub│  │ (clawhub.ai) │  │ (小红书)      │       │
│  │ .cn)         │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心流程

1. **同步层**：定期从 SkillHub API、ClawHub、RedSkill 抓取/同步 Skill 元数据和内容
2. **存储层**：解析 `SKILL.md`，提取 YAML 头部和 Markdown 正文，存入数据库
3. **调度层**：用户输入 → 匹配 triggers → 加载对应 Skill 内容 → 注入 AI 上下文
4. **执行层**：AI 在对话中按照 Skill 指令执行

---

## 三、具体接入方案

### 3.1 SkillHub 接入（优先级 P0）

**已有信息**：
- Skill 列表 API：`GET https://api.skillhub.cn/api/skills?page={page}&pageSize=24&sortBy=score&order=desc`
- Skill 详情页：`https://www.skillhub.cn/skill/{slug}`
- 安装入口：`https://skillhub.cn/install/skillhub.md`

**接入步骤**：

#### 步骤 1：批量获取 Skill 列表

```javascript
// Node.js 示例
async function fetchSkillList(page = 1) {
  const res = await fetch(
    `https://api.skillhub.cn/api/skills?page=${page}&pageSize=100&sortBy=score&order=desc`
  );
  const data = await res.json();
  return data.skills; // 假设返回结构
}

// 循环获取所有分页
async function fetchAllSkills() {
  const allSkills = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const skills = await fetchSkillList(page);
    allSkills.push(...skills);
    hasMore = skills.length === 100;
    page++;
  }
  return allSkills;
}
```

#### 步骤 2：获取单个 Skill 的 SKILL.md

```javascript
async function fetchSkillDetail(slug) {
  // 方法 A：通过详情页 HTML 解析 SKILL.md 链接
  const detailRes = await fetch(`https://www.skillhub.cn/skill/${slug}`);
  const html = await detailRes.text();
  // 解析 HTML 中的安装链接或 SKILL.md 内容

  // 方法 B：如果有直接下载链接
  const skillRes = await fetch(`https://skillhub.cn/skill/${slug}/raw`);
  return await skillRes.text();
}
```

#### 步骤 3：解析 SKILL.md

```javascript
const yaml = require('js-yaml');

function parseSkill(markdownContent) {
  // 提取 YAML 头部
  const match = markdownContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const frontmatter = yaml.load(match[1]);
  const body = match[2].trim();

  return {
    name: frontmatter.name,
    description: frontmatter.description,
    version: frontmatter.version,
    tags: frontmatter.tags || [],
    triggers: extractTriggers(body), // 从 Triggers/When to Use 部分提取
    instructions: body,
    source: 'skillhub',
    originalUrl: `https://www.skillhub.cn/skill/${frontmatter.name}`,
  };
}

function extractTriggers(body) {
  // 匹配 Triggers / When to Use 部分
  const triggerMatch = body.match(/(?:##\s*(?:Triggers|When to Use)[\s\S]*?)(?=##\s|$)/i);
  if (!triggerMatch) return [];

  // 提取列表项和关键词
  const lines = triggerMatch[0].split('\n');
  const triggers = [];
  for (const line of lines) {
    const match = line.match(/^[-*]\s*(.+)$/);
    if (match) triggers.push(match[1].trim());
  }
  return triggers;
}
```

#### 步骤 4：存储到数据库

```sql
-- Skill 表结构
CREATE TABLE skills (
  id VARCHAR(64) PRIMARY KEY,           -- name 作为 ID
  name VARCHAR(64) NOT NULL,
  description TEXT,
  version VARCHAR(20),
  tags JSON,                            -- ["办公", "文档"]
  triggers JSON,                        -- ["用户说xxx", "检测到yyy"]
  instructions TEXT,                    -- Markdown 正文
  source VARCHAR(32),                   -- skillhub / clawhub / redskill
  original_url VARCHAR(512),
  install_count INT DEFAULT 0,
  hot_score INT DEFAULT 0,              -- 热度/评分
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 触发词索引表（用于快速匹配）
CREATE TABLE skill_trigger_keywords (
  id INT AUTO_INCREMENT PRIMARY KEY,
  skill_id VARCHAR(64),
  keyword VARCHAR(128),
  weight FLOAT DEFAULT 1.0,             -- 匹配权重
  FOREIGN KEY (skill_id) REFERENCES skills(id)
);
```

#### 步骤 5：在对话中触发 Skill

```javascript
// 用户输入匹配 Skill
async function matchSkill(userInput) {
  // 方法 1：关键词匹配
  const keywords = extractKeywords(userInput);
  const matchedSkills = await db.query(
    `SELECT s.*, SUM(st.weight) as match_score
     FROM skills s
     JOIN skill_trigger_keywords st ON s.id = st.skill_id
     WHERE st.keyword IN (?) AND s.is_enabled = true
     GROUP BY s.id
     ORDER BY match_score DESC, s.hot_score DESC
     LIMIT 5`,
    [keywords]
  );

  // 方法 2：语义匹配（需要 Embedding）
  // const userEmbedding = await getEmbedding(userInput);
  // const semanticMatches = await vectorSearch(userEmbedding);

  return matchedSkills[0]; // 返回最佳匹配
}

// 注入 Skill 到 AI 上下文
async function injectSkillToContext(conversationId, skillId) {
  const skill = await db.query('SELECT * FROM skills WHERE id = ?', [skillId]);

  // 将 Skill 指令作为 system message 注入
  await addMessage(conversationId, {
    role: 'system',
    content: `【Skill 激活：${skill.name}】\n${skill.instructions}`,
    metadata: { type: 'skill_injection', skill_id: skillId }
  });
}
```

---

### 3.2 ClawHub 接入（优先级 P1）

**特点**：OpenClaw 官方 Skill 商店，Skill 格式标准统一。

**接入方式**：

#### 方案 A：OpenClaw CLI 导出（如果可用）

```bash
# 安装 OpenClaw CLI
npm install -g openclaw

# 列出所有 Skill
openclaw skills list

# 导出指定 Skill
openclaw skills export hello-world --output ./skills/
```

#### 方案 B：直接下载 Skill 仓库

```javascript
// ClawHub 的 Skill 可能托管在 GitHub 或 clawhub.ai
async function fetchClawHubSkills() {
  // 获取热门 Skill 列表
  const res = await fetch('https://clawhub.ai/api/skills?sort=downloads');
  const skills = await res.json();

  for (const skill of skills) {
    // 下载 SKILL.md
    const skillRes = await fetch(skill.download_url);
    const content = await skillRes.text();
    await saveSkill(parseSkill(content), 'clawhub');
  }
}
```

---

### 3.3 RedSkill 接入（优先级 P2）

**特点**：小红书生态，Skill 挂载在笔记中，解析难度较高。

**接入方式**：

#### 方案 A：小红书开放平台 API（如果有）

需要申请小红书开放平台开发者账号，获取笔记内容和挂载的 Skill 组件。

#### 方案 B：笔记解析（爬虫）

```javascript
// 解析小红书笔记中的 RedSkill 组件
async function parseRedSkillNote(noteUrl) {
  // 获取笔记 HTML
  const res = await fetch(noteUrl, {
    headers: { 'User-Agent': '...' }
  });
  const html = await res.text();

  // 提取 Skill 信息（需要根据实际页面结构调整选择器）
  const skillData = extractSkillFromNote(html);

  // 下载 SKILL.md
  const skillRes = await fetch(skillData.downloadUrl);
  const content = await skillRes.text();

  return parseSkill(content);
}
```

**建议**：RedSkill 接入复杂度较高，建议先完成 SkillHub 和 ClawHub，RedSkill 作为二期目标。

---

### 3.4 洁癖 Skill 等 GitHub 开源 Skill（优先级 P1）

**特点**：直接托管在 GitHub 上，格式标准，容易获取。

**接入方式**：

```javascript
// 直接下载 GitHub 仓库中的 SKILL.md
async function fetchGitHubSkill(owner, repo, path) {
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}/SKILL.md`;
  const res = await fetch(rawUrl);
  const content = await res.text();
  return parseSkill(content);
}

// 洁癖 Skill
const neatFreakSkill = await fetchGitHubSkill(
  'KKKKhazix', 'khazix-skills', 'neat-freak'
);
```

---

## 四、AI Mate 平台内的 Skill 调用流程

### 4.1 用户视角的调用方式

#### 方式 1：自动触发（推荐）

用户正常对话，系统自动匹配 Skill：

```
用户：帮我生成一个 PPT
AI Mate：检测到匹配 Skill "ppt-generator-skill"，是否使用？
用户：是
AI Mate：【注入 Skill 指令】→ 开始按 Skill 流程生成 PPT
```

#### 方式 2：手动选择

用户在 Skill 库面板中浏览、搜索、选择：

```
用户：打开 Skill 库 → 搜索 "PPT" → 点击 "ppt-generator-skill"
AI Mate：【注入 Skill 指令】→ 开始执行
```

#### 方式 3：命令触发

```
用户：/skill ppt-generator
AI Mate：【注入 Skill 指令】→ 开始执行
```

### 4.2 技术实现流程

```
用户输入
    │
    ▼
┌──────────────────┐
│ 1. 触发器匹配引擎 │ ← 查询 skill_trigger_keywords 表
│    - 关键词匹配   │
│    - 语义匹配     │ ← 可选：使用 Embedding
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
 匹配成功   匹配失败
    │         │
    ▼         ▼
┌─────────────┐  ┌─────────────┐
│ 2. 展示候选  │  │ 走普通对话   │
│   Skill 列表 │  │ 流程        │
└──────┬──────┘  └─────────────┘
       │
       ▼
┌─────────────┐
│ 3. 用户确认  │
│   使用 Skill │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ 4. 注入 Skill 上下文 │
│   system message:   │
│   【Skill 激活】     │
│   + instructions    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 5. AI 按 Skill 指令  │
│   执行并回复用户     │
└─────────────────────┘
```

---

## 五、前端界面设计建议

### 5.1 Skill 库面板（AI Mate 内）

```
┌─────────────────────────────────────────────────┐
│  🔍 搜索 Skill...              [分类] [排序]     │
├─────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ 📊 办公   │ │ 🎨 设计   │ │ 💻 开发   │ ...  │
│  └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────┤
│  热门 Skill                                      │
│  ┌──────────────────────────────────────────┐   │
│  │ 📝 文章去AI味工具    ★5.8万  📥353      │   │
│  │ 去除文本 AI 写作痕迹...                    │   │
│  │ [查看详情] [立即使用]                      │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ 📊 PPT生成器         ★4.7万  📥167      │   │
│  │ 智能 PPT 生成助手...                      │   │
│  │ [查看详情] [立即使用]                      │   │
│  └──────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  我的收藏 | 已启用 | SkillHub | ClawHub | RedSkill│
└─────────────────────────────────────────────────┘
```

### 5.2 Skill 详情页

```
┌─────────────────────────────────────────────────┐
│ ← 返回              文章去AI味工具        [⭐收藏]│
├─────────────────────────────────────────────────┤
│ 来源：SkillHub    安装量：353    热度：5.8万      │
│ 标签：内容创作、文案、去重                        │
├─────────────────────────────────────────────────┤
│ 描述                                            │
│ 去除文本 AI 写作痕迹，修复 AI 高频词与机械化表达   │
├─────────────────────────────────────────────────┤
│ 触发场景                                        │
│ • 用户说"去一下 AI 味"                           │
│ • 用户说"让这段文字更像人写的"                    │
│ • 检测到输入文本有明显的 AI 写作特征              │
├─────────────────────────────────────────────────┤
│ 使用示例                                        │
│ 输入："本文旨在探讨..."                          │
│ 输出："咱们聊聊..."                              │
├─────────────────────────────────────────────────┤
│ [立即使用]  [查看原始 SKILL.md]  [举报/反馈]      │
└─────────────────────────────────────────────────┘
```

---

## 六、同步与更新机制

### 6.1 定时同步任务

```javascript
// 每天凌晨同步一次
const cron = require('node-cron');

cron.schedule('0 2 * * *', async () => {
  console.log('开始同步 SkillHub 数据...');
  await syncSkillHub();
  console.log('SkillHub 同步完成');

  console.log('开始同步 ClawHub 数据...');
  await syncClawHub();
  console.log('ClawHub 同步完成');
});
```

### 6.2 增量更新策略

```javascript
async function syncSkillHubIncremental() {
  // 获取上次同步时间
  const lastSync = await db.query('SELECT MAX(updated_at) FROM skills WHERE source = ?', ['skillhub']);

  // 只获取更新的 Skill
  const newSkills = await fetchSkillHubUpdates(lastSync);

  for (const skill of newSkills) {
    await db.query(
      `INSERT INTO skills (id, name, description, version, tags, triggers, instructions, source, hot_score, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
       description = VALUES(description),
       version = VALUES(version),
       tags = VALUES(tags),
       triggers = VALUES(triggers),
       instructions = VALUES(instructions),
       hot_score = VALUES(hot_score),
       updated_at = NOW()`,
      [skill.id, skill.name, skill.description, skill.version,
       JSON.stringify(skill.tags), JSON.stringify(skill.triggers),
       skill.instructions, skill.source, skill.hot_score]
    );
  }
}
```

---

## 七、实施路线图

| 阶段 | 目标 | 预计时间 | 涉及平台 |
|------|------|---------|---------|
| **Phase 1** | 搭建 Skill 存储层 + 解析器 + 基础触发匹配 | 1 周 | 内部架构 |
| **Phase 2** | 接入 SkillHub（列表 + 详情 + 同步） | 1 周 | SkillHub |
| **Phase 3** | 前端 Skill 库面板 + 手动选择调用 | 1 周 | AI Mate UI |
| **Phase 4** | 自动触发引擎 + 语义匹配 | 1 周 | 内部架构 |
| **Phase 5** | 接入 ClawHub + GitHub 开源 Skill | 3-5 天 | ClawHub / GitHub |
| **Phase 6** | 接入 RedSkill（小红书生态） | 视复杂度 | RedSkill |
| **Phase 7** | Skill 评分/反馈系统 + 社区分享 | 持续迭代 | 全平台 |

---

## 八、关键技术选型

| 组件 | 推荐方案 | 说明 |
|------|---------|------|
| Skill 解析 | `js-yaml` + 正则 | 解析 YAML frontmatter 和 Markdown |
| 数据存储 | PostgreSQL + Redis | PG 存结构化数据，Redis 缓存热门 Skill |
| 触发匹配 | 关键词倒排索引 + 可选 Embedding | 先用关键词，后期加向量语义搜索 |
| 定时同步 | `node-cron` 或系统 cron | 每日凌晨同步 |
| 网页抓取 | `cheerio` / `puppeteer` | 解析 SkillHub 详情页 |
| Embedding | OpenAI / 国产模型 Embedding API | 用于语义匹配（Phase 4） |

---

## 九、风险与注意事项

| 风险 | 说明 | 应对 |
|------|------|------|
| **API 限制** | SkillHub 可能有请求频率限制 | 加延时、用缓存、申请正式 API Key |
| **内容合规** | 外部 Skill 内容可能违规 | 接入前审核、用户举报机制、敏感词过滤 |
| **格式差异** | 不同平台 SKILL.md 格式略有不同 | 写兼容解析器，记录差异 |
| **版权争议** | 抓取 Skill 可能涉及版权问题 | 与平台沟通合作、注明来源、遵守 robots.txt |
| **触发误报** | 自动匹配可能误触发 | 设置置信度阈值、用户确认机制 |

---

## 十、快速启动代码（MVP 版本）

以下是一个最小可运行的 SkillHub 接入示例：

```javascript
// skill-loader.js
const yaml = require('js-yaml');
const fetch = require('node-fetch');

class SkillLoader {
  constructor() {
    this.skills = new Map();
  }

  // 解析 SKILL.md
  parse(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return null;

    const meta = yaml.load(match[1]);
    const body = match[2].trim();

    return {
      id: meta.name,
      name: meta.name,
      description: meta.description,
      tags: meta.tags || [],
      instructions: body,
      triggers: this.extractTriggers(body),
    };
  }

  extractTriggers(body) {
    const triggers = [];
    const lines = body.split('\n');
    let inTriggerSection = false;

    for (const line of lines) {
      if (/##\s*(Triggers|When to Use)/i.test(line)) {
        inTriggerSection = true;
        continue;
      }
      if (inTriggerSection && line.startsWith('##')) break;
      if (inTriggerSection) {
        const match = line.match(/^[-*]\s*(.+)$/);
        if (match) triggers.push(match[1].trim());
      }
    }
    return triggers;
  }

  // 从 SkillHub 获取
  async fetchFromSkillHub() {
    const res = await fetch('https://api.skillhub.cn/api/skills?page=1&pageSize=24&sortBy=score');
    const data = await res.json();

    for (const item of data.skills || []) {
      try {
        const detailRes = await fetch(`https://www.skillhub.cn/skill/${item.slug}`);
        const html = await detailRes.text();
        // 从 HTML 中提取 SKILL.md 内容（需要根据实际页面结构解析）
        const skillContent = this.extractSkillFromHtml(html);
        const skill = this.parse(skillContent);
        if (skill) this.skills.set(skill.id, skill);
      } catch (e) {
        console.error(`Failed to load skill ${item.slug}:`, e);
      }
    }
  }

  // 匹配 Skill
  match(input) {
    const keywords = input.toLowerCase().split(/\s+/);
    const results = [];

    for (const skill of this.skills.values()) {
      let score = 0;
      for (const trigger of skill.triggers) {
        for (const keyword of keywords) {
          if (trigger.toLowerCase().includes(keyword)) score += 1;
        }
      }
      if (score > 0) results.push({ skill, score });
    }

    return results.sort((a, b) => b.score - a.score);
  }

  // 获取 Skill 指令用于注入
  getInstructions(skillId) {
    const skill = this.skills.get(skillId);
    return skill ? skill.instructions : null;
  }
}

module.exports = SkillLoader;
```

```javascript
// 使用示例
const SkillLoader = require('./skill-loader');
const loader = new SkillLoader();

async function main() {
  // 加载 Skill
  await loader.fetchFromSkillHub();
  console.log(`Loaded ${loader.skills.size} skills`);

  // 匹配用户输入
  const input = '帮我生成一个 PPT';
  const matches = loader.match(input);

  if (matches.length > 0) {
    const best = matches[0].skill;
    console.log(`Matched skill: ${best.name}`);
    console.log('Instructions:', best.instructions);
  }
}

main();
```

---

> **总结**：接入外部 Skill 的核心是**批量获取 SKILL.md → 解析存储 → 触发注入**。SkillHub 有公开 API，接入难度最低，建议作为 P0 优先接入。ClawHub 和 GitHub 开源 Skill 作为 P1，RedSkill 因需要解析小红书笔记，建议作为 P2。
