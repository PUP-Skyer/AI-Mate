# 大学生智能体重构计划 - 跨工具执行指南

> 本文档将 10 个 Plan.md 实施计划与四款 AI 编程工具（Work Buddy、Trae Work、Codex 桌面端、Claude Code 桌面端）逐一对齐，给出每个工具的加载方式、执行策略、特色能力和示例指令。

---

## 一、Plan 拆分总览

重构计划已拆分为 10 个独立的 Plan.md 文件，按依赖关系分为四个阶段：

### Phase 1 - 基础设施层（必须按序执行）

| Plan | 文件名 | 核心交付 | 任务数 |
|------|--------|----------|--------|
| 01 | `Plan-01-数据库层重构.md` | conversations / messages / ai_models / knowledge_base 四张表 + db.js 改造 | 5 |
| 02 | `Plan-02-后端API真实化.md` | 14+ API 接口真实化 + 统一错误处理 | 5 |
| 03 | `Plan-03-AI模型集成层.md` | 模型路由器 + Prompt 管理器 + SSE 流式接口 + 上下文管理器 | 5 |

### Phase 2 - 业务模块层（可并行执行）

| Plan | 文件名 | 核心交付 | 任务数 |
|------|--------|----------|--------|
| 04 | `Plan-04-探路者AI模块.md` | 市场分析 / 竞品调研 / 趋势洞察 / 机会评估 四面板 | 5 |
| 05 | `Plan-05-军师AI模块.md` | 策略对话 / 商业模式画布 / 风险矩阵 / 融资规划 四面板 | 5 |
| 06 | `Plan-06-工匠AI模块.md` | BP 生成 / PPT 大纲 / 产品文档 / 原型描述 四面板 | 5 |
| 07 | `Plan-07-管家AI模块.md` | 任务看板 / 进度跟踪 / 资源对接 / 团队协作 四面板 | 5 |

### Phase 3 - 支撑层（可并行执行）

| Plan | 文件名 | 核心交付 | 任务数 |
|------|--------|----------|--------|
| 08 | `Plan-08-知识库与RAG.md` | 知识库 CRUD + RAG 检索 + 批量导入 | 5 |
| 09 | `Plan-09-前端体验优化.md` | 打字机效果 / 多会话管理 / 错误重试 / Token 展示 | 6 |

### Phase 4 - 质量保障

| Plan | 文件名 | 核心交付 | 任务数 |
|------|--------|----------|--------|
| 10 | `Plan-10-安全与测试.md` | JWT 认证 / RBAC 权限 / 敏感词过滤 / 自动化测试 | 6 |

---

## 二、四款工具能力对照

| 能力维度 | Work Buddy | Trae Work | Codex 桌面端 | Claude Code 桌面端 |
|----------|-----------|-----------|-------------|-------------------|
| 定位 | 知识库 + 对话助手 | AI IDE（全栈开发环境） | 自主编程智能体 | 终端级自主编程智能体 |
| 底层模型 | 智谱 GLM-4 + Coze | 专属模型 | GPT-5.3-Codex | Claude Opus 4.6 |
| 文件读写 | 通过对话指令间接操作 | 原生支持（Read/Write/Edit） | 原生支持（全代码库遍历） | 原生支持（全代码库遍历） |
| 终端执行 | 不支持 | 原生支持（RunCommand） | 原生支持（沙箱终端） | 原生支持（Computer Use） |
| 自主模式 | 不支持 | Task 子代理（并行） | Goal 模式（长时间自主） | /auto 模式 + Subagents |
| 流式输出 | 支持（SSE） | 支持（对话流式） | 支持（CLI 流式） | 支持（CLI 流式） |
| 计划文件加载 | 粘贴到对话框 | Read 工具读取 + 对话引用 | 粘贴 /goal 指令 | 粘贴或 CLAUDE.md 引用 |
| 多任务并行 | 不支持 | Task 工具（最多 3 个子代理） | 多 Goal 会话 | Subagents（多分身） |
| 定时任务 | 不支持 | Schedule 工具（cron） | 不支持 | /schedule（云端定时） |
| 长期记忆 | 对话历史持久化 | Memory 文件夹（项目级） | 会话内记忆 | Kairos（跨会话永久记忆） |
| 测试运行 | 不支持 | RunCommand 执行 npm test | 自主运行测试 + 自动修复 | 自主运行测试 + 自动修复 |
| 适合场景 | 需求梳理 / 知识检索 / 文档生成 | 全流程开发 / 实时调试 / 文件操作 | 长时间自主开发 / Goal 驱动 | 大型重构 / 跨文件修改 / 自主测试 |

---

## 三、各工具执行指南

### 1. Work Buddy（管家AI界面）

Work Buddy 是本项目自身的前端界面（react-ai-chat），定位为知识库和对话助手，不具备直接的文件操作和终端执行能力。它在重构计划中的角色是**需求梳理和知识沉淀**，而非直接编码。

#### 适合参与环节

- Plan 执行前的需求确认和方案讨论
- 知识库内容整理（Plan-08 的数据准备）
- PRD 文档审阅和迭代
- 开发过程中的问题咨询（通过 AI 对话获取建议）

#### 操作方式

在管家AI界面的对话框中，直接粘贴 Plan.md 的内容或摘要，让 AI 帮助分析：

```
请分析 Plan-01 数据库层重构的以下建表语句，检查字段类型、索引设计和外键约束是否合理：

[粘贴 SQL 语句]

特别关注 knowledge_base 表的 FULLTEXT INDEX with ngram parser 是否能正确支持中文全文检索。
```

#### 知识库数据准备

Plan-08 需要向知识库导入创业案例、政策法规等内容。可以提前在管家AI中整理这些数据：

```
请帮我整理 10 条大学生创业案例，每条包含以下字段：
- title: 案例标题
- content: 案例内容（500字左右，包含项目背景、执行过程、经验教训）
- category: case
- source: 数据来源

输出为 JSON 数组格式，后续导入 knowledge_base 表。
```

#### 局限性

Work Buddy 无法直接修改项目文件或运行命令。所有编码工作需要切换到 Trae Work、Codex 或 Claude Code 中完成。它更适合作为开发过程中的"咨询顾问"和"知识库管理员"。

---

### 2. Trae Work（当前开发环境）

Trae Work 是当前正在使用的 AI IDE，具备完整的文件读写、终端执行、子代理调度和定时任务能力。它在本项目中承担**主开发环境**的角色。

#### 核心能力

- **文件操作**：Read / Write / SearchReplace / Grep / Glob，直接读写项目文件
- **终端执行**：RunCommand 执行 npm、mysql、curl 等命令
- **子代理并行**：Task 工具可同时启动最多 3 个子代理处理独立任务
- **定时任务**：Schedule 工具支持 cron 表达式，可设定定期检查、自动测试等
- **Skill 系统**：内置 html-report、doc-writing-guide 等技能，可生成文档和报告
- **MCP 工具**：通过 integrated_code_mode 在隔离运行时中编排工具调用
- **项目记忆**：Memory 文件夹自动保存项目规范和历史决策

#### 执行 Plan-01（数据库层重构）示例

在 Trae Work 对话中输入：

```
请读取 plans/Plan-01-数据库层重构.md，按照其中的任务步骤执行：

1. 修改 ai-mate/react-ai-chat/db.js，在 createTables 函数中添加四张新表的建表逻辑
2. 执行建表后，通过 mysql 命令验证表结构

项目路径：f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat
数据库配置：host=localhost, user=root, password=PU159789682, database=ai_mate
```

Trae Work 会自动读取 Plan 文件、修改 db.js、运行验证命令，全程在当前 IDE 中完成。

#### 并行执行 Phase 2 四个模块

Phase 2 的 Plan-04 到 Plan-07 无相互依赖，可启动子代理并行开发：

```
请同时启动 3 个子代理，分别执行以下任务：

子代理1：读取 plans/Plan-04-探路者AI模块.md，创建 src/components/scout/ 下的四个面板组件
子代理2：读取 plans/Plan-05-军师AI模块.md，创建 src/components/sage/ 下的四个面板组件
子代理3：读取 plans/Plan-06-工匠AI模块.md，创建 src/components/maker/ 下的四个面板组件

Plan-07 管家AI模块等前面三个完成后，我再单独执行。
```

#### 设定定时测试

利用 Schedule 工具设定每日自动运行测试：

```
请创建一个定时任务，每天晚上 22:00（北京时间）自动运行项目的测试套件：
- 工作目录：f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat
- 命令：npm test
- 如果测试失败，将失败原因保存到 plans/test-report-YYYYMMDD.md
```

#### 调试与验证

Trae Work 的终端能力特别适合调试阶段。修改代码后可直接启动开发服务器验证：

```
请启动 react-ai-chat 的开发服务器（npm run dev），然后在浏览器中打开 http://localhost:3000，
截图查看探路者AI页面是否正确加载了新的市场分析面板组件。
```

#### Trae Work 独有优势

- **零切换成本**：编码、调试、测试、预览全部在同一个 IDE 中完成
- **实时文件操作**：修改代码后即时生效，无需手动同步
- **Skill 生态**：可直接调用 html-report 生成开发报告，调用 doc-writing-guide 生成文档
- **Memory 持久化**：自动记住项目规范和历史决策，跨会话保持一致

---

### 3. Codex 桌面端（OpenAI）

Codex 桌面端是 OpenAI 的自主编程智能体，2026 年正式 GA 后其 Goal 模式从实验功能转为正式功能。它在本项目中适合**长时间自主开发任务**，特别是 Phase 1 基础设施层的连续执行。

#### 核心能力

- **Goal 模式**：设定一个完成条件，AI 自主工作数小时直到达成 [$TRAE_REF](http://m.toutiao.com/group/7650457168927326756/)
- **全代码库理解**：遍历整个项目结构，理解依赖关系和编码约定
- **跨文件修改**：自主修改多个文件，处理文件间依赖
- **自动测试运行**：修改后自动运行测试，根据报错自动修复
- **PR 生成**：完成后直接生成 Pull Request
- **Appshots**：macOS 下双击 Command 键截图发送给 Codex [$TRAE_REF](http://m.toutiao.com/group/7655168213419950630/)
- **乔木 Skill 兼容**：支持 qiaomu-goal-meta-skill 的 /goal 指令格式

#### 加载 Plan 文件

将 `goal-commands.md` 中的 /goal 指令直接粘贴到 Codex 的 Goal 输入框中。每条指令包含六要素：outcome（成果）、verification（验证）、constraints（约束）、boundaries（边界）、iteration_policy（迭代策略）、completion_evidence（完成证据）。

#### 执行 Phase 1（三个 Plan 连续执行）

Codex 的 Goal 模式最适合 Phase 1 的链式执行，因为三个 Plan 有严格的依赖关系：

```
/goal 重构 react-ai-chat 的数据库层，创建四张核心业务表并修改 db.js 初始化逻辑
- outcome: conversations、messages、ai_models、knowledge_base 四张表成功创建
- verification: 启动后端服务后，MySQL 中可查到四张表结构完整
- constraints: 使用 MySQL 8.0 + InnoDB + utf8mb4，knowledge_base 表包含 FULLTEXT INDEX with ngram parser
- boundaries: 不修改现有 users 和 projects 表结构，不引入 ORM 框架
- iteration_policy: 每完成一张表的创建和验证即提交一次
- completion_evidence: 提供完整的 db.js 代码和 MySQL SHOW TABLES 截图
```

Codex 会自主完成建表、修改 db.js、运行验证，全程无需人工干预。Plan-01 完成后，继续粘贴 Plan-02 和 Plan-03 的 /goal 指令。

#### 执行 Phase 2（并行开发）

Codex 支持多 Goal 会话，可以同时开多个终端窗口并行执行：

- 窗口 1：粘贴 Plan-04 的 /goal 指令（探路者AI）
- 窗口 2：粘贴 Plan-05 的 /goal 指令（军师AI）
- 窗口 3：粘贴 Plan-06 的 /goal 指令（工匠AI）

每个窗口独立工作，完成后分别生成 PR。

#### "睡前下达，次日收菜"工作流

这是 Codex Goal 模式的典型用法 [$TRAE_REF](http://m.toutiao.com/group/7650457168927326756/)：

1. 睡前将 Plan-01 的 /goal 指令粘贴到 Codex
2. Codex 自主执行建表、修改代码、运行验证
3. 遇到问题自主尝试解决，无法解决时记录并跳过
4. 次日早上查看完成结果和 PR

#### Codex 独有优势

- **最长自主时间**：Goal 模式可连续工作数小时，适合大型任务
- **PR 工作流**：原生支持 Git PR 生成，方便代码审查
- **乔木 Skill 生态**：/goal 指令格式与 qiaomu-goal-meta-skill 完全兼容
- **跨模型兼容**：2026 年开放了跨模型能力，不局限于 OpenAI 模型

#### 注意事项

- Codex 在沙箱中执行命令，数据库连接需确保网络可达
- API Key 等敏感信息通过环境变量传入，不要写入 Goal 指令
- Goal 指令中的 constraints 和 boundaries 必须明确，否则 AI 可能过度发挥

---

### 4. Claude Code 桌面端（Anthropic）

Claude Code 是 Anthropic 的终端级自主编程智能体，底层使用 Claude Opus 4.6 模型。它在本项目中适合**复杂跨文件重构和自动化测试**，特别是 Phase 4 的安全与测试模块。

#### 核心能力

- **Computer Use**：直接操控终端、执行命令、截图读界面 [$TRAE_REF](http://m.toutiao.com/group/7664425084153315874/)
- **Subagents**：单会话内创建多个独立 AI 分身，并行处理不同任务
- **/schedule 云端定时**：关机后 Claude 在云端继续执行任务
- **Kairos 长期记忆**：跨会话永久记住项目规范和架构（通过 CLAUDE.md）
- **Skills 2.0**：保存常用工作流为 Skill，热重载即时生效
- **SWE-bench 第一**：复杂任务通过率 80.8%，行业最高
- **Token 效率高**：同样任务消耗仅为竞品的 1/5 [$TRAE_REF](http://m.toutiao.com/group/7664425084153315874/)

#### 项目配置

在项目根目录创建 `CLAUDE.md`，让 Claude Code 永久记住项目规范：

```markdown
# 项目规范 - 大学生智能体（react-ai-chat）

## 技术栈
- 前端：React 19 + TypeScript + Vite + Ant Design 6 + Zustand + qiankun
- 后端：Node.js + Express + MySQL 8.0
- AI模型：智谱 GLM-4 + Coze

## 代码规范
- 命名：组件名大驼峰，变量小驼峰
- 样式：使用 CSS 变量（var(--accent) 等），不硬编码颜色
- 状态管理：统一使用 Zustand + Immer
- API 响应格式：{ success: boolean, data: any, error: string | null }

## 禁止事项
- 不修改 src/legacy 目录
- 不引入新的 UI 组件库（仅用 Ant Design 6）
- 不使用 class 组件（全部函数组件 + Hooks）
- API Key 不硬编码在代码中

## 构建命令
- 开发：npm run dev
- 构建：npm run build
- 测试：npm test
```

#### 加载 Plan 文件

Claude Code 可以直接读取项目中的 Plan.md 文件。在终端中启动 Claude Code 后输入：

```
请读取 plans/Plan-03-AI模型集成层.md，按照其中的任务步骤执行。

关键约束：
1. 先创建 src/services/aiRouter.ts（模型路由器），再创建 promptManager.ts
2. 流式 SSE 接口需同时支持智谱 GLM-4 和 Coze 两种模型
3. 四大角色的 system prompt 必须与 PRD 文档中的定义一致
4. 每完成一个文件，运行 tsc --noEmit 检查类型

执行完成后，用 /auto 模式自主验证流式对话是否正常工作。
```

#### 使用 Subagents 并行执行 Phase 2

Claude Code 的 Subagents 可以在单个会话内创建多个分身 [$TRAE_REF](http://m.toutiao.com/group/7602295596275302948/)：

```
请使用 Subagents 并行开发以下四个模块，每个模块对应一个 Plan.md：

Subagent 1（前端开发）：读取 plans/Plan-04-探路者AI模块.md，创建 src/components/scout/ 下的四个面板
Subagent 2（前端开发）：读取 plans/Plan-05-军师AI模块.md，创建 src/components/sage/ 下的四个面板
Subagent 3（前端开发）：读取 plans/Plan-06-工匠AI模块.md，创建 src/components/maker/ 下的四个面板
Subagent 4（前端开发）：读取 plans/Plan-07-管家AI模块.md，创建 src/components/butler/ 下的四个面板

每个 Subagent 完成后，运行 TypeScript 类型检查，确保无编译错误。
```

#### 使用 /schedule 执行长时间重构

Plan-10 的测试编写和 CI 配置适合用 /schedule 在云端执行：

```
/schedule --name "安全与测试套件" --repo ./ai-mate/react-ai-chat "
读取 plans/Plan-10-安全与测试.md，完成以下工作：
1. 创建 src/middleware/auth.js（JWT 认证中间件）
2. 创建 src/middleware/rbac.js（RBAC 权限中间件）
3. 创建 src/middleware/contentFilter.js（敏感词过滤）
4. 编写 tests/api.test.js（19 个 API 测试用例）
5. 编写 tests/components.test.tsx（20 个组件测试用例）
6. 配置 CI 检查脚本
完成后运行 npm test 确保全部通过。
"
```

#### 使用 Computer Use 调试

Claude Code 的 Computer Use 能力可以直接操作浏览器验证 UI [$TRAE_REF](http://m.toutiao.com/group/7664425084153315874/)：

```
请使用 Computer Use 完成以下调试流程：
1. 打开终端，执行 npm run dev 启动开发服务器
2. 打开浏览器，访问 http://localhost:3000
3. 点击左侧菜单的"探路者AI"
4. 在市场分析面板中输入"校园二手交易平台"
5. 截图查看 AI 返回的分析结果是否正常
6. 如果有报错，读取控制台日志并自动修复
```

#### Claude Code 独有优势

- **代码理解最深**：直接读取整个代码库，无需手动索引，SWE-bench 通过率行业第一
- **Subagents 真并行**：单个会话内多个 AI 分身同时工作，效率提升 3-10 倍
- **Kairos 永久记忆**：跨会话记住项目规范，不重复解释
- **Computer Use 全自动**：从启动服务器到浏览器验证，全程无需人工
- **Token 效率最高**：同样任务消耗仅为其他工具的 1/5

#### 注意事项

- Computer Use 首次操作需授权，建议开启 Safe Mode
- 使用 `/allow dir ./ai-mate/react-ai-chat` 限定工作目录，禁止访问系统关键目录
- 简单任务用 Sonnet 模型（$3/M tokens），复杂任务用 Opus（$15/M tokens）
- 定期用 `/context clear` 清理上下文，避免窗口溢出导致质量下降

---

## 四、分阶段执行建议

### Phase 1 - 基础设施层（Plan-01 → 02 → 03）

| 推荐工具 | 原因 |
|----------|------|
| Codex 桌面端（首选） | Goal 模式适合链式执行，三个 Plan 有严格依赖关系，"睡前下达次日收菜" |
| Trae Work（备选） | 实时调试需求高时使用，修改 db.js 后可立即验证 MySQL 连接 |
| Claude Code（备选） | 需要跨文件重构时使用，代码理解能力最强 |

Codex 执行 Plan-01~03 的 /goal 指令后，用 Trae Work 或 Claude Code 验证结果，在浏览器中测试流式对话是否正常。

### Phase 2 - 业务模块层（Plan-04 ~ 07 并行）

| 推荐工具 | 原因 |
|----------|------|
| Claude Code（首选） | Subagents 真并行，一个会话内四个分身同时开发四个模块 |
| Trae Work（备选） | Task 工具最多 3 个子代理并行，Plan-07 可稍后单独执行 |
| Codex 桌面端（备选） | 多窗口多 Goal 会话，但需手动管理四个窗口 |

四个模块都是纯前端 React 组件开发，组件间无依赖。Claude Code 的 Subagents 在此场景效率最高。

### Phase 3 - 支撑层（Plan-08 + 09 并行）

| 推荐工具 | 原因 |
|----------|------|
| Trae Work（首选） | Plan-08 涉及后端数据库操作，Plan-09 涉及前端组件，Trae Work 全栈能力最匹配 |
| Claude Code（备选） | /schedule 云端执行，关机后继续跑 |
| Work Buddy（辅助） | 提前整理知识库数据，为 Plan-08 的批量导入做准备 |

Plan-08 的知识库数据可以提前在 Work Buddy 中整理成 JSON 格式，开发时直接导入。

### Phase 4 - 质量保障（Plan-10）

| 推荐工具 | 原因 |
|----------|------|
| Claude Code（首选） | 测试编写 + 自动运行 + 自动修复，Computer Use 全流程闭环 |
| Codex 桌面端（备选） | Goal 模式 + 自动测试运行 |
| Trae Work（验证） | 最终用 Trae Work 运行 `npm test` 和 `npm run build` 做整体验证 |

Plan-10 的 25 个测试用例（19 个 API + 20 个组件）编写工作量大，Claude Code 的 Kairos 记忆能保持测试风格一致。

---

## 五、工具组合工作流

### 推荐组合 A：Codex 主力 + Trae Work 验证

```
Day 1 晚上：
  Codex 桌面端 → 粘贴 Plan-01 /goal 指令 → 自主建表 + 修改 db.js

Day 2 早上：
  Trae Work → 验证数据库表结构 → 启动后端服务测试 API

Day 2 晚上：
  Codex 桌面端 → 粘贴 Plan-02 /goal 指令 → 自主实现 API

Day 3 早上：
  Trae Work → curl 测试每个接口 → 修复发现的问题

Day 3 晚上：
  Codex 桌面端 → 粘贴 Plan-03 /goal 指令 → 自主实现 AI 集成

Day 4 早上：
  Trae Work → 浏览器测试流式对话 → 调试 SSE 连接
```

### 推荐组合 B：Claude Code 主力 + Work Buddy 辅助

```
Phase 1：
  Claude Code → 读取 Plan-01~03 → Subagents 串行执行 → Computer Use 验证

Phase 2：
  Work Buddy → 整理知识库数据（JSON 格式）
  Claude Code → Subagents 四路并行开发 Plan-04~07

Phase 3：
  Claude Code → /schedule 云端执行 Plan-08 + 09

Phase 4：
  Claude Code → 编写测试 + 自动运行 → 全部通过后交付
  Trae Work → 最终构建验证 npm run build
```

### 推荐组合 C：Trae Work 全流程（零切换）

```
全程在 Trae Work 中完成：

Phase 1：
  直接对话 → 读取 Plan 文件 → 修改代码 → RunCommand 验证

Phase 2：
  Task 工具 → 3 个子代理并行 → 完成后手动执行 Plan-07

Phase 3：
  直接对话 → 读取 Plan 文件 → 修改代码 → RunCommand 验证

Phase 4：
  直接对话 → 编写测试 → RunCommand 执行 npm test
  Schedule 工具 → 设定每日自动测试
```

这个组合无需切换工具，但自主性最低，需要人工监督每一步。

---

## 六、各 Plan 的工具匹配推荐

| Plan | 首选工具 | 原因 | 预计耗时 |
|------|----------|------|----------|
| 01 数据库层 | Codex Goal | 建表逻辑明确，适合自主执行 | 1-2h |
| 02 后端API | Codex Goal / Trae Work | 14+ 接口需逐个实现和测试 | 3-4h |
| 03 AI集成 | Trae Work / Claude Code | 流式 SSE 调试需要实时反馈 | 4-5h |
| 04 探路者AI | Claude Code Subagent | 纯前端组件，并行开发效率高 | 2-3h |
| 05 军师AI | Claude Code Subagent | 九宫格画布交互复杂，代码理解要求高 | 3-4h |
| 06 工匠AI | Claude Code Subagent | BP 生成器涉及流式输出和导出 | 2-3h |
| 07 管家AI | Trae Work / Claude Code | 拖拽看板需要实时调试 | 2-3h |
| 08 知识库 | Trae Work | 前后端全栈，Trae Work 全能 | 3-4h |
| 09 前端优化 | Trae Work | 交互细节多，需要实时预览 | 3-4h |
| 10 安全测试 | Claude Code /schedule | 测试编写量大，适合云端长时间执行 | 4-6h |

---

## 七、关键注意事项

### 通用注意事项

1. **API Key 管理**：智谱和 Coze 的 API Key 必须通过环境变量传入，不要写入任何 Plan.md 或 /goal 指令中
2. **数据库密码**：当前 db.js 中硬编码了密码 `PU159789682`，Plan-10 会改为环境变量，在此之前注意不要泄露
3. **端口冲突**：前端 3000、后端 8080，启动前确认端口未被占用
4. **Git 提交粒度**：每完成一个任务（非 Plan）提交一次，提交信息遵循 conventional commits 格式
5. **类型检查**：每修改 TypeScript 文件后运行 `tsc --noEmit`，避免类型错误累积

### Codex 专属注意

- Goal 指令中的 `boundaries` 必须明确写出"不做什么"，否则 AI 可能过度发挥
- 沙箱环境中数据库连接可能不通，需提前确认网络配置
- 完成后的 PR 需要人工 review，不能直接 merge

### Claude Code 专属注意

- Computer Use 操作前必须授权工作目录，禁止访问系统关键目录
- Subagents 并行时注意文件冲突，四个模块的组件路径不重叠才能安全并行
- `/context clear` 定期执行，避免上下文窗口溢出

### Trae Work 专属注意

- Task 子代理最多 3 个并行，Plan-07 需要等前面三个完成后单独执行
- RunCommand 执行长时间命令（如 npm run dev）时设置 `blocking: false`
- 修改文件前必须先用 Read 工具读取最新内容，避免覆盖冲突
