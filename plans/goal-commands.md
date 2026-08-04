# 大学生智能体 - /goal 目标指令集

> 基于乔木Skill（qiaomu-goal-meta-skill）框架编写
> 每条指令对应一个 Plan.md，按依赖顺序执行

---

## Plan-01：数据库层重构

```
/goal 重构 react-ai-chat 的数据库层，创建四张核心业务表并修改 db.js 初始化逻辑
- outcome: conversations、messages、ai_models、knowledge_base 四张表成功创建，db.js 启动时自动建表并插入默认模型配置
- verification: 启动后端服务后，MySQL 中可查到四张表结构完整，默认数据已插入
- constraints: 使用 MySQL 8.0 + InnoDB + utf8mb4，knowledge_base 表必须包含 FULLTEXT INDEX with ngram parser 支持中文检索，messages 表通过外键级联删除关联 conversations
- boundaries: 不修改现有 users 和 projects 表结构，不引入 ORM 框架，保持原始 mysql2 连接池方式
- iteration_policy: 每完成一张表的创建和验证即提交一次，遇到外键冲突立即汇报
- completion_evidence: 提供完整的 db.js 修改后代码和 MySQL SHOW TABLES + DESCRIBE 截图
```

---

## Plan-02：后端API真实化

```
/goal 将 server.js 中所有 mock 接口替换为真实数据库操作，实现对话、消息、模型配置、知识库四组 CRUD API
- outcome: 14+ 个 API 接口全部对接真实数据库，mock 数据完全清除，统一错误处理和响应格式
- verification: 使用 curl 对每个接口进行增删改查测试，返回数据与数据库实际数据一致
- constraints: 保持现有 Express 路由结构，API 响应统一使用 { success, data, error } 格式，所有数据库操作使用连接池
- boundaries: 不实现 JWT 认证（Plan-10 负责），不实现 AI 对话流式接口（Plan-03 负责），不重构前端代码
- iteration_policy: 每完成一组 API（对话/消息/模型/知识库）即提交一次，接口间无依赖的并行开发
- completion_evidence: 提供完整的 server.js 代码和 curl 测试脚本及输出结果
```

---

## Plan-03：AI模型集成层

```
/goal 实现智谱GLM-4和Coze的深度集成，包含模型路由器、Prompt管理器、流式SSE接口和上下文管理器
- outcome: 前端发送消息后，后端根据AI角色自动路由到对应模型，通过SSE流式返回生成内容，同时持久化到数据库
- verification: 在浏览器中发送对话消息，可看到流式打字机效果，刷新页面后对话历史仍在
- constraints: 智谱GLM-4使用官方流式API，Coze使用v3流式接口，SSE响应头正确设置 Content-Type: text/event-stream，四大角色的 system prompt 需与 PRD 定义一致
- boundaries: 不实现向量检索（使用MySQL全文索引替代），不实现前端UI优化（Plan-09负责），不实现认证鉴权
- iteration_policy: 先完成GLM-4集成并验证流式效果，再完成Coze集成，最后完成上下文管理器
- completion_evidence: 提供完整的 aiRouter.ts、promptManager.ts、contextManager.ts 代码和浏览器流式对话录屏
```

---

## Plan-04：探路者AI模块

```
/goal 实现探路者AI的四大子功能面板：市场分析、竞品调研、趋势洞察、机会评估
- outcome: 用户在探路者AI页面可使用四个功能面板，每个面板调用AI生成结构化分析结果
- verification: 在市场分析面板输入创业方向，AI返回包含市场规模、增长趋势、用户画像的结构化报告；竞品调研面板展示对比矩阵
- constraints: 使用 chatWithZhipuStream 流式接口，组件使用 Ant Design 6 + CSS 变量保持设计一致性，机会评估的雷达图使用纯SVG实现无额外依赖
- boundaries: 不修改 aiStore.ts 的核心状态结构，不实现知识库RAG（Plan-08负责），不实现导出功能
- iteration_policy: 每完成一个面板即提交一次，按市场分析→竞品调研→趋势洞察→机会评估顺序开发
- completion_evidence: 提供四个面板组件代码和 ScoutAI.tsx 整合后的完整页面截图
```

---

## Plan-05：军师AI模块

```
/goal 实现军师AI的四大子功能面板：商业策略对话、商业模式画布、风险评估矩阵、融资规划
- outcome: 用户可使用九宫格商业模式画布（可编辑+AI填充）、五维风险评估矩阵、融资路径规划工具
- verification: 在商业模式画布中点击"AI填充"，AI根据项目信息自动生成九个模块内容；风险矩阵展示风险等级和应对策略
- constraints: 商业模式画布使用CSS Grid实现九宫格布局，AI返回内容使用JSON解析填充，画布数据支持 localStorage 持久化
- boundaries: 不实现画布数据的后端持久化（仅前端存储），不实现融资对接的实际交易功能
- iteration_policy: 先完成商业模式画布（核心功能），再完成风险评估，最后完成策略对话和融资规划
- completion_evidence: 提供四个面板组件代码和 SageAI.tsx 整合后的完整页面截图
```

---

## Plan-06：工匠AI模块

```
/goal 实现工匠AI的四大子功能面板：BP生成器、路演PPT大纲、产品文档生成、原型描述生成
- outcome: 用户可选择BP模板生成完整商业计划书大纲，AI流式生成各章节内容，支持Markdown导出
- verification: 在BP生成器中选择"标准12章"模板并点击生成，AI流式输出BP大纲和各章节要点；路演PPT大纲展示10页结构
- constraints: BP生成支持引用探路者AI市场数据和军师AI商业模式，生成内容使用 chatWithZhipuStream 流式输出，导出功能使用 Blob + URL.createObjectURL
- boundaries: 不实现Word/PDF格式导出（仅Markdown），不实现PPT自动排版生成，不实现产品原型图绘制
- iteration_policy: 先完成BP生成器（核心功能），再完成PPT大纲，最后完成产品文档和原型描述
- completion_evidence: 提供四个面板组件代码和 MakerAI.tsx 整合后的完整页面截图
```

---

## Plan-07：管家AI模块

```
/goal 实现管家AI的四大子功能面板：项目任务看板、进度跟踪、资源对接推荐、团队协作
- outcome: 用户可使用四列看板（待办/进行中/已完成/阻塞）管理任务，支持HTML5拖拽移动任务卡片，AI可自动拆解项目为任务清单
- verification: 在看板中拖拽任务卡片从"待办"到"进行中"，刷新页面后状态保持；点击"AI拆解任务"生成任务列表
- constraints: 拖拽使用原生HTML5 Drag and Drop API（无额外依赖），任务数据存储在 localStorage，甘特图使用CSS百分比定位实现
- boundaries: 不实现后端任务持久化（仅前端localStorage），不实现实时多人协作，不实现日历集成
- iteration_policy: 先完成任务看板（核心功能），再完成进度跟踪，最后完成资源对接和团队协作
- completion_evidence: 提供四个面板组件代码和 ButlerAI.tsx 整合后的完整页面截图
```

---

## Plan-08：知识库与RAG

```
/goal 实现知识库管理和RAG检索增强生成，为AI对话提供创业案例、政策法规、行业报告等专业数据支撑
- outcome: 管理员可在后台管理知识库内容（CRUD+批量导入），AI对话时自动检索相关知识并注入到system prompt中
- verification: 在知识库中插入一条创业案例，然后在探路者AI中提问相关问题，AI回答中引用了该案例内容
- constraints: 检索使用 MySQL FULLTEXT INDEX + ngram parser（不引入向量数据库），RAG流程为：检索→拼接context→注入system prompt→调用AI，批量导入支持CSV和JSON格式
- boundaries: 不实现向量嵌入和语义检索，不实现知识库自动爬取，不实现知识库版本管理
- iteration_policy: 先完成后端知识库服务和检索函数，再完成前端管理界面，最后集成到AI对话流程
- completion_evidence: 提供完整的 knowledgeService.js、ragService.ts 代码和RAG效果对比截图
```

---

## Plan-09：前端体验优化

```
/goal 优化AI对话的前端交互体验，包括流式打字机效果、多会话管理、Markdown渲染、错误重试和Token消耗展示
- outcome: 对话界面支持流式打字机光标动画、Markdown/代码高亮渲染、多会话侧边栏切换搜索、请求取消和断线重连
- verification: 发送消息后看到逐字打字效果和闪烁光标；侧边栏可搜索历史会话；网络断开时显示重连提示并自动重试
- constraints: Markdown渲染使用 react-markdown + remark-gfm，代码高亮使用 SyntaxHighlighter，请求取消使用 AbortController，所有组件使用CSS变量保持设计一致性
- boundaries: 不修改后端接口，不引入新的状态管理库（继续使用Zustand），不实现消息编辑和删除功能
- iteration_policy: 先完成ChatMessage核心组件，再完成侧边栏和错误处理，最后完成Token展示和服务层增强
- completion_evidence: 提供所有新增组件代码和优化前后对比录屏
```

---

## Plan-10：安全与测试

```
/goal 实现JWT认证、RBAC权限控制、敏感词过滤和自动化测试，保障系统安全性和代码质量
- outcome: 所有API接口需要JWT认证，四级角色（student/investor/expert/admin）有不同权限，敏感词被自动过滤，核心接口和组件有自动化测试覆盖
- verification: 未携带Token访问API返回401；student角色无法访问admin接口；输入敏感词被过滤替换；运行 npm test 全部通过
- constraints: JWT使用 jsonwebtoken 库，密码哈希使用 bcrypt，敏感词过滤支持输入输出双向，测试使用 Jest + React Testing Library
- boundaries: 不实现OAuth第三方登录，不实现验证码，不实现IP黑名单，测试覆盖率不低于70%
- iteration_policy: 先完成认证和权限中间件，再完成敏感词过滤，最后编写测试用例和CI脚本
- completion_evidence: 提供所有中间件代码、测试文件和 npm test 全部通过的输出截图
```

---

## 执行顺序

```
Phase 1 (基础设施)：Plan-01 → Plan-02 → Plan-03
Phase 2 (业务模块)：Plan-04 + Plan-05 + Plan-06 + Plan-07 (可并行)
Phase 3 (支撑层)：Plan-08 + Plan-09 (可并行)
Phase 4 (质量保障)：Plan-10
```

## 使用方式

1. 按上述顺序逐条复制 `/goal` 指令到 Codex/OpenClaw 中执行
2. 每条指令完成后，检查 `completion_evidence` 中要求的交付物
3. 全部完成后，执行 Plan-05 的 consolidation.md 生成步骤汇总
