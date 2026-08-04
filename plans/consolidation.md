# 大学生智能体开发汇总文档

> **项目名称：** AI Mate - react-ai-chat 大学生智能体
> **文档版本：** V1.0
> **生成日期：** 2026-07-26
> **关联PRD：** college-agent-prd/college-agent-prd.html
> **关联指令：** plans/goal-commands.md

---

## 一、项目概览

### 目标

将 react-ai-chat 子应用从"前端原型"升级为"可用的企业级 AI 创业助手"，打通 **前端交互 → 后端服务 → 数据库 → AI模型 → 知识库** 全链路，使四大 AI 角色（探路者、军师、工匠、管家）具备真实的业务能力。

### 技术栈

| 层级 | 技术选型 | 版本 |
|------|----------|------|
| 前端框架 | React + TypeScript | 19.2 / 5.x |
| 构建工具 | Vite | 6.x |
| UI组件库 | Ant Design | 6.3 |
| 状态管理 | Zustand + Immer | 5.0 / 11.1 |
| 微前端 | qiankun | 2.10 |
| 后端服务 | Node.js + Express | 20.x / 4.x |
| 数据库 | MySQL | 8.0 |
| AI模型 | 智谱 GLM-4 + Coze | - |

### 四大AI角色

| 角色 | 职责 | 核心功能 | AI模型 |
|------|------|----------|--------|
| 探路者AI | 市场洞察 | 市场分析、竞品调研、趋势洞察、机会评估 | GLM-4 + RAG |
| 军师AI | 策略规划 | 商业策略、模式画布、风险评估、融资规划 | GLM-4 + Coze |
| 工匠AI | 内容生成 | BP生成、PPT大纲、产品文档、原型描述 | GLM-4 + Coze |
| 管家AI | 项目管理 | 任务管理、进度跟踪、资源对接、团队协作 | GLM-4 |

---

## 二、Plan 实施总览

### 执行顺序与依赖关系

```
Phase 1 (基础设施)
  Plan-01 数据库层重构
    ↓
  Plan-02 后端API真实化
    ↓
  Plan-03 AI模型集成层

Phase 2 (业务模块 - 可并行)
  Plan-04 探路者AI模块  ┐
  Plan-05 军师AI模块     ├─ 四个模块无相互依赖，可同时开发
  Plan-06 工匠AI模块     │
  Plan-07 管家AI模块     ┘

Phase 3 (支撑层 - 可并行)
  Plan-08 知识库与RAG    ┐
  Plan-09 前端体验优化    ┘

Phase 4 (质量保障)
  Plan-10 安全与测试
```

### Plan 清单

| 编号 | Plan名称 | 任务数 | 核心交付物 | 优先级 |
|------|----------|--------|------------|--------|
| 01 | 数据库层重构 | 5 | 4张核心表 + db.js修改 | P0 |
| 02 | 后端API真实化 | 5 | 14+ API接口 + 错误处理 | P0 |
| 03 | AI模型集成层 | 5 | 路由器 + Prompt管理 + SSE流式 | P0 |
| 04 | 探路者AI模块 | 5 | 4个功能面板 + ScoutAI整合 | P0 |
| 05 | 军师AI模块 | 5 | 4个功能面板 + SageAI整合 | P0 |
| 06 | 工匠AI模块 | 5 | 4个功能面板 + MakerAI整合 | P0 |
| 07 | 管家AI模块 | 5 | 4个功能面板 + ButlerAI整合 | P1 |
| 08 | 知识库与RAG | 5 | 知识库CRUD + RAG检索 + 批量导入 | P1 |
| 09 | 前端体验优化 | 6 | 打字机效果 + 会话管理 + 错误重试 | P1 |
| 10 | 安全与测试 | 6 | JWT认证 + RBAC + 敏感词 + 测试 | P1 |
| **合计** | | **51** | | |

---

## 三、各 Plan 详细摘要

### Plan-01：数据库层重构

**目标：** 创建 conversations、messages、ai_models、knowledge_base 四张核心业务表

**核心任务：**
1. 创建 conversations 对话表（ai_role ENUM、project_id、model_id 外键关联）
2. 创建 messages 消息表（外键级联删除、JSON metadata 字段）
3. 创建 ai_models 模型配置表（provider ENUM、API Key 加密存储）
4. 创建 knowledge_base 知识库表（FULLTEXT INDEX with ngram parser 中文全文索引）
5. 修改 db.js 的 createTables 函数，整合新表创建逻辑

**关键文件：** `db.js`

**验证方式：** MySQL `SHOW TABLES` + `DESCRIBE` 验证表结构

---

### Plan-02：后端API真实化

**目标：** 将 server.js 中所有 mock 接口替换为真实数据库操作

**核心任务：**
1. 对话CRUD API（GET/POST/PUT/DELETE，支持按角色筛选）
2. 消息CRUD API（兼容新旧路径）
3. AI模型配置API（含API Key加密/解密函数）
4. 知识库管理API（分页列表、全文检索RAG接口）
5. 错误处理中间件（404处理、数据库错误处理、请求日志）

**关键文件：** `server.js`

**验证方式：** curl 测试每个接口的增删改查

---

### Plan-03：AI模型集成层

**目标：** 实现智谱GLM-4和Coze的深度集成

**核心任务：**
1. 创建 aiRouter.ts（角色+任务类型路由策略表、自动降级）
2. 创建 promptManager.ts（四大角色System Prompt、上下文注入）
3. 实现流式SSE接口 POST /api/ai/chat/stream（GLM-4 + Coze双模型流式）
4. 创建 contextManager.ts（对话摘要、跨角色上下文共享）
5. 创建 knowledgeService.ts（searchKnowledgeBase RAG检索函数）

**关键文件：** `src/services/aiRouter.ts`, `src/services/promptManager.ts`, `src/services/contextManager.ts`, `server.js`

**验证方式：** 浏览器发送消息，观察流式打字机效果，刷新后对话历史保留

---

### Plan-04：探路者AI模块

**目标：** 实现市场分析、竞品调研、趋势洞察、机会评估四大功能面板

**核心任务：**
1. MarketAnalysisPanel.tsx（AI深度分析、结构化市场报告）
2. CompetitorPanel.tsx（竞品对比矩阵 + AI差异化分析）
3. TrendInsightPanel.tsx（趋势卡片 + 时间线 + AI预测）
4. OpportunityScorePanel.tsx（纯SVG雷达图 + 维度评分 + AI建议）
5. ScoutAI.tsx 整合所有子面板

**关键文件：** `src/components/scout/*.tsx`, `src/pages/ScoutAI.tsx`

**验证方式：** 输入创业方向，AI返回包含市场规模、增长趋势、用户画像的结构化报告

---

### Plan-05：军师AI模块

**目标：** 实现商业策略、商业模式画布、风险评估、融资规划四大功能面板

**核心任务：**
1. StrategyPanel.tsx（策略对话 + 流式输出 + 报告保存）
2. BusinessCanvas.tsx（九宫格可编辑画布 + AI JSON填充 + localStorage持久化）
3. RiskMatrix.tsx（5x5 SVG风险矩阵 + 风险增删 + AI应对策略）
4. FinancingPanel.tsx（估值计算器 + 融资阶段路线图 + AI融资策略）
5. SageAI.tsx 整合所有子面板

**关键文件：** `src/components/sage/*.tsx`, `src/pages/SageAI.tsx`

**验证方式：** 商业模式画布点击"AI填充"自动生成九模块内容

---

### Plan-06：工匠AI模块

**目标：** 实现BP生成、路演PPT大纲、产品文档、原型描述四大功能面板

**核心任务：**
1. BPGenerator.tsx（4种BP模板 + 数据源勾选 + AI流式生成 + Markdown导出）
2. PPTOutline.tsx（配置表单 + AI生成 + 逐页预览 + 缩略图切换）
3. ProductDoc.tsx（PRD/手册/API文档/发布说明四种类型）
4. PrototypeDesc.tsx（平台选择 + 复杂度配置 + AI生成）
5. MakerAI.tsx 整合所有子面板

**关键文件：** `src/components/maker/*.tsx`, `src/pages/MakerAI.tsx`

**验证方式：** 选择BP模板并生成，AI流式输出12章大纲和章节内容

---

### Plan-07：管家AI模块

**目标：** 实现任务管理、进度跟踪、资源对接、团队协作四大功能面板

**核心任务：**
1. TaskBoard.tsx（四列看板 + HTML5拖拽 + AI任务拆解 + localStorage）
2. ProgressTracker.tsx（CSS甘特图 + 里程碑时间线 + AI进度报告）
3. ResourceMatcher.tsx（需求标签 + 资源匹配列表 + AI对接建议）
4. TeamCollab.tsx（成员管理 + 协作动态时间线 + AI管理建议）
5. ButlerAI.tsx 整合所有子面板

**关键文件：** `src/components/butler/*.tsx`, `src/pages/ButlerAI.tsx`

**验证方式：** 拖拽任务卡片切换状态，刷新后保持；AI拆解项目生成任务列表

---

### Plan-08：知识库与RAG

**目标：** 实现知识库管理和RAG检索增强生成

**核心任务：**
1. 后端 knowledgeService.js（MySQL FULLTEXT + ngram 全文检索 + BM25排序）
2. 前端 ragService.ts（检索→拼接prompt→调用AI完整流程）
3. 知识库管理后台 KnowledgeBaseManager.tsx（Ant Design表格+弹窗）
4. 批量导入功能（支持CSV和JSON双格式）
5. AI对话流程集成RAG（修改 /api/ai/chat/stream 接口）

**关键文件：** `src/services/knowledgeService.js`, `src/services/ragService.ts`, `src/components/admin/KnowledgeBaseManager.tsx`, `server.js`

**验证方式：** 插入知识库条目后，AI对话回答引用相关内容

---

### Plan-09：前端体验优化

**目标：** 优化对话交互体验

**核心任务：**
1. 优化 aiStore.ts（多会话管理、历史搜索、会话重命名、Token统计）
2. ChatMessage.tsx（react-markdown + 代码高亮 + 流式打字机光标）
3. ChatSidebar.tsx（会话切换、搜索过滤、右键菜单）
4. ErrorBoundary.tsx（自动重试3次 + 指数退避）
5. TokenUsage.tsx（Token消耗统计 + 成本估算）
6. aiService.ts增强（AbortController + 超时处理 + 断线重连）

**关键文件：** `src/store/aiStore.ts`, `src/components/chat/*.tsx`, `src/services/aiService.ts`

**验证方式：** 流式打字机效果、侧边栏搜索、网络断开重连

---

### Plan-10：安全与测试

**目标：** 实现安全防护和自动化测试

**核心任务：**
1. auth.js JWT认证中间件（Token签发2h/验证/刷新7d/登出 + bcrypt哈希）
2. rbac.js RBAC权限中间件（四级角色 student < investor < expert < admin）
3. contentFilter.js 敏感词过滤（输入输出双向 + StreamFilter流式过滤）
4. api.test.js API测试（19个用例覆盖认证/RBAC/CRUD/敏感词/流式）
5. components.test.tsx 组件测试（20个用例覆盖核心组件和Store）
6. CI检查脚本（ESLint + TypeScript + 测试 + 构建检查）

**关键文件：** `src/middleware/auth.js`, `src/middleware/rbac.js`, `src/middleware/contentFilter.js`, `tests/*.test.*`

**验证方式：** `npm test` 全部通过，未认证请求返回401

---

## 四、文件变更清单

### 新建文件（36个）

| 路径 | Plan | 说明 |
|------|------|------|
| `src/services/aiRouter.ts` | 03 | AI模型路由器 |
| `src/services/promptManager.ts` | 03 | System Prompt管理器 |
| `src/services/contextManager.ts` | 03 | 上下文管理器 |
| `src/services/knowledgeService.js` | 08 | 知识库后端服务 |
| `src/services/ragService.ts` | 08 | RAG检索增强服务 |
| `src/components/scout/MarketAnalysisPanel.tsx` | 04 | 市场分析面板 |
| `src/components/scout/CompetitorPanel.tsx` | 04 | 竞品调研面板 |
| `src/components/scout/TrendInsightPanel.tsx` | 04 | 趋势洞察面板 |
| `src/components/scout/OpportunityScorePanel.tsx` | 04 | 机会评估面板 |
| `src/components/sage/StrategyPanel.tsx` | 05 | 策略对话面板 |
| `src/components/sage/BusinessCanvas.tsx` | 05 | 商业模式画布 |
| `src/components/sage/RiskMatrix.tsx` | 05 | 风险评估矩阵 |
| `src/components/sage/FinancingPanel.tsx` | 05 | 融资规划面板 |
| `src/components/maker/BPGenerator.tsx` | 06 | BP生成器 |
| `src/components/maker/PPTOutline.tsx` | 06 | 路演PPT大纲 |
| `src/components/maker/ProductDoc.tsx` | 06 | 产品文档生成 |
| `src/components/maker/PrototypeDesc.tsx` | 06 | 原型描述生成 |
| `src/components/butler/TaskBoard.tsx` | 07 | 项目看板 |
| `src/components/butler/ProgressTracker.tsx` | 07 | 进度跟踪 |
| `src/components/butler/ResourceMatcher.tsx` | 07 | 资源对接 |
| `src/components/butler/TeamCollab.tsx` | 07 | 团队协作 |
| `src/components/admin/KnowledgeBaseManager.tsx` | 08 | 知识库管理 |
| `src/components/chat/ChatMessage.tsx` | 09 | 通用消息组件 |
| `src/components/chat/ChatSidebar.tsx` | 09 | 对话侧边栏 |
| `src/components/chat/ErrorBoundary.tsx` | 09 | 错误边界组件 |
| `src/components/chat/TokenUsage.tsx` | 09 | Token消耗展示 |
| `src/middleware/auth.js` | 10 | JWT认证中间件 |
| `src/middleware/rbac.js` | 10 | RBAC权限中间件 |
| `src/middleware/contentFilter.js` | 10 | 敏感词过滤中间件 |
| `tests/api.test.js` | 10 | API测试用例 |
| `tests/components.test.tsx` | 10 | 组件测试用例 |

### 修改文件（7个）

| 路径 | Plan | 修改内容 |
|------|------|----------|
| `db.js` | 01 | 新增4张表的创建逻辑 |
| `server.js` | 02,03,08,10 | API真实化 + SSE接口 + RAG集成 + 中间件挂载 |
| `src/services/aiService.ts` | 09 | 添加AbortController + 超时 + 重连 |
| `src/store/aiStore.ts` | 09 | 多会话管理 + 搜索 + 重命名 |
| `src/pages/ScoutAI.tsx` | 04 | 整合探路者子面板 |
| `src/pages/SageAI.tsx` | 05 | 整合军师子面板 |
| `src/pages/MakerAI.tsx` | 06 | 整合工匠子面板 |
| `src/pages/ButlerAI.tsx` | 07 | 整合管家子面板 |
| `src/App.tsx` | 04-07 | 路由整合（如需要） |

---

## 五、数据库表结构汇总

| 表名 | 用途 | 关键字段 | 索引 |
|------|------|----------|------|
| users | 用户信息 | id, username, email, role | 已有 |
| projects | 项目信息 | id, user_id, name, status, bp_data(JSON) | 已有 |
| conversations | AI对话 | id, user_id, project_id, ai_role(ENUM) | idx_user_role, idx_project |
| messages | 对话消息 | id, conversation_id, role(ENUM), content, token_count | idx_conv |
| ai_models | 模型配置 | id, provider(ENUM), api_endpoint, api_key_enc, is_active | - |
| knowledge_base | 知识库 | id, title, content, category(ENUM), source | FULLTEXT(ngram), idx_category |

---

## 六、API 接口汇总

| 方法 | 路径 | 功能 | Plan |
|------|------|------|------|
| GET | /api/conversations/:role | 获取角色对话列表 | 02 |
| POST | /api/conversations | 创建对话 | 02 |
| DELETE | /api/conversations/:id | 删除对话 | 02 |
| GET | /api/messages/:conversationId | 获取消息列表 | 02 |
| POST | /api/messages | 保存消息 | 02 |
| GET | /api/ai/models | 获取模型配置 | 02 |
| POST | /api/ai/models | 新增模型配置 | 02 |
| PUT | /api/ai/models/:id | 更新模型配置 | 02 |
| GET | /api/knowledge-base | 知识库列表 | 02 |
| POST | /api/knowledge-base | 新增知识条目 | 02 |
| GET | /api/knowledge-base/search | 知识库检索 | 02 |
| POST | /api/ai/chat/stream | AI流式对话 | 03 |
| POST | /api/knowledge-base/import | 批量导入 | 08 |
| POST | /api/auth/login | 用户登录 | 10 |
| POST | /api/auth/refresh | 刷新Token | 10 |

---

## 七、风险与注意事项

### 技术风险

1. **端口冲突**：前端默认3000端口，后端8080端口，需确认无占用
2. **MySQL连接**：db.js 中密码硬编码（PU159789682），生产环境需改为环境变量
3. **API Key安全**：智谱和Coze的API Key需加密存储，不能明文出现在代码中
4. **CORS问题**：qiankun微前端跨域需正确配置 CORS 中间件
5. **SSE连接管理**：流式接口需正确处理连接断开和超时

### 开发建议

1. **按Phase顺序执行**：Phase 1 必须按序完成，Phase 2 可并行但建议先完成一个模块验证模式
2. **每个Plan完成后验证**：不要跳过验证步骤，确保每个模块可独立运行
3. **统一代码风格**：所有新增组件遵循现有项目的 import 风格和命名规范
4. **提交粒度**：每完成一个任务（非Plan）提交一次，便于回滚
5. **测试先行**：Plan-10 的测试用例可在开发过程中逐步编写，不要等到最后

---

## 八、交付物清单

| 交付物 | 路径 | 状态 |
|--------|------|------|
| PRD文档 | `college-agent-prd/college-agent-prd.html` | ✅ 已完成 |
| Plan-01 ~ Plan-10 | `plans/Plan-*.md` | ✅ 已完成 |
| /goal 指令集 | `plans/goal-commands.md` | ✅ 已完成 |
| consolidation.md | `plans/consolidation.md` | ✅ 本文档 |
| 代码实现 | `ai-mate/react-ai-chat/` | ⏳ 待开发 |

---

## 九、后续行动

1. **立即执行**：按 `goal-commands.md` 中的顺序，将 `/goal` 指令逐条粘贴到 Codex/OpenClaw 目标模式中执行
2. **Phase 1 优先**：先完成 Plan-01→02→03 基础设施层，验证数据库和AI对话可用
3. **Phase 2 试点**：先完成 Plan-04（探路者AI）作为业务模块试点，验证开发模式后并行推进其他模块
4. **持续集成**：Plan-10 的 CI 脚本在 Phase 1 完成后即配置，确保后续代码质量
5. **文档更新**：开发过程中如遇设计变更，同步更新 PRD 和对应 Plan.md
