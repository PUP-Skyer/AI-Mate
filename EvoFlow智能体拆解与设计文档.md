# EvoFlow 智能体拆解与设计规范文档

> 分析对象：`evoflow.exe`（EvoPanel 桌面客户端 v0.3.8，Windows x64，约 40.9 MB）
> 分析方法：二进制逆向（PE 结构、字符串、资源、命令面）+ 官方仓库（EvovexAI/EvoFlow，公开）与官方文档交叉验证
> 文档结构：产品定位 → 系统架构 → 技术栈 → 核心引擎 → 能力子系统 → 任务与协作层 → 网关与接口 → 桌面端内部结构 → 数据与配置 → 安全护栏 → 版本分发 → 功能清单

---

## 一、产品定位与核心理念

EvoFlow 是一个面向**长周期自主软件工作**的原生 Agent 运行时（Runtime）与控制平面（Control Plane）。官方定位为"harness 超级智能体编排框架"，核心差异在于它不止于单轮对话或单次代码生成，而是让 AI 智能体完成"规划、拆解、执行、恢复、交付"的完整闭环。

与同类产品的边界划分（官方口径）：

| 类别 | 代表产品 | EvoFlow 的差异 |
| --- | --- | --- |
| 单 Agent 编码工具 | Claude Code、Codex、Cline、Aider | 不替代单 Agent 执行器，而是围绕整个任务的运行时与控制平面 |
| Agent 编排框架 | LangGraph、CrewAI、AutoGen | 在 LangGraph 之上产品化：桌面控制平面、网关、沙箱、记忆、IM 渠道 |
| 工作流自动化 | n8n、Activepieces | 聚焦智能体软件工作（代码编排、长任务、记忆、恢复、可观测），而非确定性节点连线 |
| 云端 AI 工程师 | Devin 类产品 | 本地/桌面控制、可配置 Agent、自持运行的可扩展运行时，而非托管黑盒 |

核心能力总览：

| 能力 | 内涵 |
| --- | --- |
| 原生 Agent 运行时 | 基于 LangGraph 的主智能体（Lead Agent）+ 中间件链 + 工具系统 + 子代理委派 + 记忆 + 线程隔离 |
| Supervisor 规划 | 澄清意图 → 生成可审阅计划 → 拆解为带依赖顺序的子任务图 → 用户授权后执行 |
| Agent Teams | 内置子代理（general-purpose、bash）+ 自定义 Agent（自有 SOUL/模型/工具白名单），单轮最多 3 个子代理并发 |
| 工具执行 | 沙箱工具、内置工具（ask_clarification、view_image、task）、社区工具（web_search、web_fetch）、任意 MCP 服务器 |
| 沙箱 | 每线程隔离执行，虚拟路径映射；Local（本机）/ Docker / k3s Provisioner 三档 |
| 记忆与检查点 | LLM 提取事实、防抖原子写入、线程状态持久化、运行可恢复 |
| 恢复机制 | 暂停/恢复/取消、失败重试、部分重规划 |
| 可观测性 | 任务/子任务/工具调用/状态变更全可见，Agent Trace 含逐请求 Token 用量 |
| 技能/MCP | SKILL.md 技能包（50+ 公开技能）+ 任意 MCP 服务器扩展 |
| 桌面控制平面 | EvoPanel（Tauri v2 + React）：任务中心、Agent 管理、执行日志、子任务 DAG、模型配置、技能与 MCP 配置 |

---

## 二、系统总体架构

### 2.1 分层架构

EvoFlow 采用五层分层架构：用户层（Presentation）→ 接入层（Gateway）→ 编排层（Orchestration）→ 能力层（Capabilities）→ 执行层（Execution）。设计四原则：关注点分离、可扩展性（配置+插件）、安全性（工具隔离、敏感操作受控）、可观测性（全流程追踪）。

官方架构图（文字还原）：

```text
用户 / 桌面 / IM 渠道（飞书可用，Slack·Telegram 规划中）
        ↓
EvoPanel（Tauri v2 + React）          ← 桌面控制平面
        ↓ REST / SSE / WebSocket
Gateway（FastAPI）                    ← 模型、记忆、技能、MCP、文件、渠道
        ↓ HTTP
LangGraph Runtime                     ← Lead Agent + 中间件链
        ↓
Harness（evoflow.* 包）               ← 工具、技能、记忆、子代理、沙箱、Supervisor
        ↓
代码编排器 / 工具执行器 / 沙箱
        ↓
技能 / MCP / 终端 / 浏览器 / 文件系统 / API
        ↓
日志 / 产物 / 交付
```

### 2.2 服务拓扑与端口

| 服务 | 端口 | 技术 | 角色 |
| --- | --- | --- | --- |
| Nginx | 2026 | Nginx | 统一反向代理入口 |
| LangGraph Server | 2024 | LangGraph | Agent 运行时与工作流执行 |
| Gateway API | 8001 | FastAPI | REST 管理接口（模型/MCP/技能/记忆/文件/渠道） |
| EvoPanel | 1420 | Tauri v2 + React | 桌面 UI |
| Provisioner | 8002（可选） | k3s | Pod 沙箱模式 |

**桌面版进程模型**（二进制逆向确认）：桌面客户端内置网关 sidecar（`evoflow-gateway`，Python 后端，健康检查 `GET /health`，监听 `127.0.0.1:38012`），并随附 `guardian` / `guardian-backup` / `langgraphfrontend` 等组件；网关通过 `/runs/stream`（LangGraph 流式执行端点）、`/agents/list`、`../models/providers`、`models.json` 等端点与 LangGraph 运行时交互，前端经网关代理转发。

### 2.3 Harness / App 分层约束

后端代码分为两层，依赖方向严格单向（App → Harness），由 CI 测试 `tests/test_harness_boundary.py` 强制约束：

- **Harness 层**（`backend/packages/harness/evoflow/`，导入名 `evoflow.*`）：可独立发布的 Agent 框架包，含 `agents/`（lead_agent、middlewares、memory、thread_state）、`sandbox/`、`subagents/`、`tools/`、`mcp/`、`models/`、`skills/`、`config/`、`community/`、`client.py`（EvoFlowClient 嵌入式 Python 客户端）。
- **App 层**（`backend/app/`，导入名 `app.*`）：产品化代码，含 `gateway/`（FastAPI）与 `channels/`（飞书、钉钉、企业微信等 IM 集成）。

---

## 三、技术栈清单

| 层次 | 技术选型 |
| --- | --- |
| 桌面壳 | Tauri v2（Rust，`tauri-2.11.2`、`tauri-runtime-wry`、`tao-0.35.2`），插件：updater 2.10.1、shell、dialog、notification、global-shortcut、process、window、path、http |
| 前端 | React + TypeScript + Vite；Mermaid（20+ 图类型）、KaTeX、Cytoscape（知识图谱/画布）、D3-force（知识库图谱） |
| 网关 | FastAPI（Python），SSE 流式 |
| Agent 运行时 | LangGraph + LangChain |
| 数据存储 | SQLite（`evoflow.db`、模型表）、PostgreSQL（结构化，可选）、pgvector / Chroma（向量） |
| 沙箱 | Local（本机路径校验）/ Docker（AioSandbox）/ k3s Provisioner |
| 工具协议 | MCP（stdio / SSE / HTTP）、ACP（外部执行器适配，规划中） |
| 构建/分发 | GitHub Actions（Windows x64 安装包 + NSIS/MSI），Tauri Updater 自更新 |

---

## 四、核心引擎设计（Agent 运行时）

### 4.1 Lead Agent 主智能体

Lead Agent 是运行时入口，五大职责：请求处理、模型调用、工具协调、状态维护、中间件执行。核心工厂函数 `make_lead_agent(config)` 组装模型、工具、中间件链与系统提示词。

创建参数（`config.configurable`）：

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `thinking_enabled` | true | 扩展思考 |
| `reasoning_effort` | null | 推理强度 |
| `model_name` | null | 运行时切换模型 |
| `is_plan_mode` | false | 启用 TodoList 中间件（计划模式） |
| `subagent_enabled` | false | 启用 task 委派工具 |
| `max_concurrent_subagents` | 3 | 并发子代理上限 |
| `agent_name` | null | 自定义 Agent 路由 |
| `is_bootstrap` | false | 引导模式 |

模型名称解析优先级：请求指定 > Agent 配置 > 全局默认；模型不支持 thinking 时自动降级关闭。

### 4.2 中间件链

代码级实现为 12 个中间件（官方文档口径为 13 个，含概念层拆分），按固定顺序组装，依赖顺序即执行顺序：

| # | 中间件 | 阶段 | 职责 |
| --- | --- | --- | --- |
| 1 | DanglingToolCallMiddleware | 前置 | 修复缺失/悬挂的工具消息 |
| 2 | ToolErrorHandlingMiddleware | 前置 | 工具异常转错误消息 |
| 3 | SummarizationMiddleware | 前置 | 上下文压缩（接近 Token 上限时） |
| 4 | TodoMiddleware | 前置 | 计划模式的待办跟踪 |
| 5 | TokenUsageMiddleware | 后置 | Token 用量追踪 |
| 6 | TitleMiddleware | 后置 | 自动生成对话标题 |
| 7 | MemoryMiddleware | 后置 | 更新记忆 |
| 8 | ViewImageMiddleware | 前置 | 视觉模型注入图像详情 |
| 9 | DeferredToolFilterMiddleware | 前置 | 延迟工具过滤/工具搜索 |
| 10 | SubagentLimitMiddleware | 后置 | 限制并发子代理 |
| 11 | LoopDetectionMiddleware | 后置 | 循环调用检测 |
| 12 | ClarificationMiddleware | 后置（必须最后） | 拦截澄清请求并中断执行 |

另有文档级描述的前置中间件：ThreadDataMiddleware（线程隔离目录）、UploadsMiddleware（上传文件注入）、SandboxMiddleware（沙箱获取）、PlanGuardMiddleware（规划期过滤副作用工具）。

### 4.3 工具系统

工具加载顺序：内置工具（始终加载）→ 配置工具组（按 groups）→ MCP 工具（懒加载，mtime 缓存失效）→ ACP 工具（invoke_acp_agent）→ 子代理工具（task，subagent_enabled 时追加）。

工具来源与命名空间：

| 类别 | 示例 | 前缀 |
| --- | --- | --- |
| 内置工具 | `setup_agent`、`ask_clarification`、`view_image`、`task` | `builtin__` |
| 配置工具组 | `read_file`、`write_file`、`str_replace`、`bash`、`ls` | — |
| MCP 工具 | 任意已连接服务器工具 | `{server}__` |
| ACP 工具 | `invoke_acp_agent`（Claude Code/Codex/Trae/CodeBuddy，规划中） | — |

工具执行状态三态：`success`（正常 ToolMessage）、`error`（错误 ToolMessage，Agent 可继续）、`interrupted`（通过 GraphBubbleUp 传递中断/暂停/恢复信号，必须原样 re-raise）。

### 4.4 子代理系统

Lead Agent 通过 `task()` 工具把复杂任务拆成多路并行委派。双线程池架构：`_scheduler_pool`（3 worker，调度/分配/队列）+ `_execution_pool`（3 worker，实际运行 LangGraph 对话），调度与执行分离。

- 内置子代理：`general-purpose`（多步骤复杂任务，除 task 外全部工具，防递归委派）、`bash`（仅 bash 工具）。
- 并发控制：SubagentLimitMiddleware 在 after_model 阶段检查 task 调用数，最多放行 3 个，超出截断并注入错误 ToolMessage。
- 状态与事件：`SubagentStatus`（PENDING/RUNNING/COMPLETED/FAILED/TIMED_OUT）；SSE 事件 `task_started` / `task_running` / `task_completed` / `task_failed` / `task_timed_out`，中间态每 5 秒轮询推送。
- 超时配置：全局 `timeout_seconds: 900`（15 分钟），可按 agent 覆盖（general-purpose 1800、bash 300）。

### 4.5 Supervisor 规划与执行

Supervisor 是 Plan 模式的核心：澄清意图 → 调用 `plan()` 生成带 `boundTaskId` 的可审阅计划 → 按步骤创建/更新子任务（`depends_on` 上游完成后自动跟进下一波）→ 用户授权后按 `assigned_to` 路由到目标 Agent 执行。

外部执行器收敛为单一 **ACP 控制面**（ACP-Only）：`codebuddy` 直接经 ACP 接入，`claude`、`trae` 经 ACP 适配器接入，不再维护专线。统一实体：

- 会话标识：`supervisorSessionId`、`acpSessionId`、`provider`、`bindingKey = thread_id + task_id + subtask_id + provider`
- 统一流式事件（4 事件）：`acp_status_update`、`acp_stream_delta`、`acp_stream_done`、`acp_stream_error`
- 状态机：任务状态机 `pending → authorized → executing → completed/failed/cancelled`；ACP 会话状态机 `starting → running → streaming → waiting_input → completed/closed`

### 4.6 提示词工程

系统提示词按区块拼接（`apply_prompt_template`）：Role（角色）、Soul（人设）、Memory（记忆，最多 15 条事实，Token 上限默认 2000）、Skills（技能 SKILL.md 列表）、Tools（工具列表）、Subagent（子代理委派说明）、Clarification（澄清系统）、Working Directory（工作目录），末尾追加 `<current_date>`。

强制澄清场景五类：missing_info（信息缺失）、ambiguous_requirement（需求含糊）、approach_choice（方案选择）、risk_confirmation（风险确认）、suggestion（建议确认），走 CLARIFY→PLAN→ACT 工作流。子代理系统提示词硬限制每响应最多 3 个并行 `task` 调用。

---

## 五、能力支撑子系统

### 5.1 技能系统（Skills）

技能是"职业能力包"（领域指令），与工具（内置通用能力）、MCP（外部服务）互补。格式：目录内含 `SKILL.md`（YAML frontmatter：`name`、`description` 必填，`license`、`allowed-tools` 可选）。

- 发现与加载：扫描 `skills/public/` 与 `skills/custom/` → 读 `extensions_config.json` 启用状态 → 加载 SKILL.md → 注入系统提示"可用技能"区块。
- 缓存：mtime 检测，配置修改后自动失效，无需重启。
- 安装：`.skill` 压缩包经 `POST /api/skills/install` 安装到 `skills/custom/` 并自动注册；支持从 ClawHub 市场安装。
- 渐进式加载：提示词注入 `<available_skills>`（含 SKILL.md 路径）→ LLM 识别后按需 `read_file` 读取 → 沙箱执行，减少 Token 消耗。
- 内置 50+ 公开技能：数据与分析、文档处理、开发与编码、媒体生成等。

### 5.2 记忆系统（Memory）

让 AI 跨会话"记住用户"，与知识库（文档内容）、Vault（笔记）、思维导图（单会话可追溯）互补。三级记忆：短期（会话级 Session）、中期（线程级 Thread）、长期（用户级 User，向量语义检索）。

核心组件链：MemoryMiddleware（过滤用户输入+最终 AI 回复入队）→ UpdateQueue（按线程去重、防抖 30 秒、后台处理）→ MemoryUpdater（LLM 提取上下文+离散事实 → 去重 → 原子写入临时文件+rename → 缓存失效通知）。

`memory.json` 数据结构：`workContext`（工作上下文）、`personalContext`（个人上下文）、`topOfMind`（最近关注点 1-3 句）、`facts[]`（id、content、category、confidence、source、createdAt）、`history`（recentMonths、earlierContext、longTermBackground）。

事实分类：`preference` / `knowledge` / `context` / `behavior` / `goal`。注入策略：`<memory>` 标签，最多 15 条事实，总 Token 不超 `max_injection_tokens`（默认 2000）。

关键配置：`enabled`（true）、`injection_enabled`（true）、`debounce_seconds`（30）、`max_facts`（100）、`fact_confidence_threshold`（0.7）、`max_injection_tokens`（2000）；支持外部记忆插件（`external_sync_enabled` / `external_prefetch_enabled`）。

### 5.3 MCP 系统

基于 `langchain-mcp-adapters` 的 `MultiServerMCPClient`，三种传输：**stdio**（本地进程）、**SSE**（远程实时推送）、**HTTP**（REST，无推送）。

- 配置统一由 `ExtensionsConfig`（`extensions_config.json`，含 mcpServers + skills）管理，支持 `GET/PUT /api/mcp/config` 动态更新。
- 配置加载优先级：显式 `config_path` > 环境变量 `DEER_FLOW_EXTENSIONS_CONFIG_PATH` > 当前目录/父目录 `extensions_config.json` > 兼容旧名 `mcp_config.json`。
- 同步包装：全局 `ThreadPoolExecutor(max_workers=10)` 提交 `asyncio.run(coro)`，避免嵌套事件循环。
- OAuth：支持 `client_credentials` 与 `refresh_token`，token 到期前 `refresh_skew_seconds`（默认 60s）预刷新。
- 内置 MCP 市场预设（桌面端二进制确认）：filesystem、fetch、brave-search、github、puppeteer、memory、postgres、slack、sequential-thinking、docker、notion、aws-kb-retrieval、google-drive、stripe、everything（Windows 搜索）、obsidian、spotify、google-calendar、time，均通过 `npx -y` 启动。

### 5.4 沙箱与安全执行

Sandbox 是操作系统级文件系统隔离（非 venv/conda），两种实现：

| 实现 | 隔离度 | 适用 |
| --- | --- | --- |
| LocalSandbox | 主机直执行，靠路径验证保护 | 本地开发/可信环境；host bash 默认禁用，需显式 `sandbox.allow_host_bash: true` |
| AioSandbox | Docker 容器完全隔离，挂载卷持久化 | 生产/多租户 |
| Provisioner | k3s Pod 模式 | 更强隔离 |

虚拟路径体系（线程隔离）：

| 虚拟路径 | 实际路径 |
| --- | --- |
| `/mnt/user-data/workspace/` | `~/.evoflow/threads/{thread_id}/user-data/workspace/` |
| `/mnt/user-data/uploads/` | `.../uploads/` |
| `/mnt/user-data/outputs/` | `.../outputs/` |
| `/mnt/skills/` | `~/.evoflow/skills/` |
| `/mnt/acp-workspace/` | `~/.evoflow/acp-workspace/` |

安全机制：路径白名单（`/mnt/user-data/*` 读写；`/mnt/skills/*`、`/mnt/acp-workspace/*` 只读）、路径遍历拒绝（`..`）、bash 命令路径校验、输出脱敏（主机绝对路径反映射回虚拟路径）、SandboxMiddleware 懒初始化（首次工具调用时获取）+ 同线程复用 + 应用关闭统一清理。

### 5.5 思维导图系统（Mind Map）

会话中自动构建可追溯的知识/逻辑图谱，与记忆系统互补（记忆=跨会话连续性，思维导图=单会话可追溯性）。

- 节点类型：`goal:`（目标）/ `flow:`（调查分支）/ `file:`（路径+函数+行号）/ `fn:`（函数签名）/ `data:`（数据结构）/ `gap:`（待验证假设）/ `claim:`（结论）/ `diagram:`（Mermaid 图表）/ `note:`（笔记）。
- 边关系：contains / calls / imports / reads / writes / depends / defines / part_of。
- 节点状态：active / resolved / verified / refuted / blocked / parked / collapsed。
- 图表支持：flowchart、sequence、state、class、ER、architecture 等 Mermaid 类型。

### 5.6 知识库（Knowledge Vault）

连接本机 Obsidian Vault 或任意 Markdown 文件夹做全文/语义检索、预览与双链局部关系图。检索模式：全文/语义/混合/标题，Top K（5/10/15/20）。

- 内置库：只读"EvoFlow 用户指南"+ 可写"运营知识库"。
- v0.3.8+ 知识图谱探索（Knowledge Explorer）：将双链、标签、文件夹结构映射为 D3-force 力导向图谱，三栏布局（导航/图谱/详情）。
- 聊天中 Agent 通过单一工具 `knowledge`（action=search|read|graph 等）访问，需该 Agent 有 knowledge 工具权限。

---

## 六、任务与协作层

### 6.1 任务中心（Task Center）

所有多步骤任务的驾驶舱，跨来源（对话/智能体员工/工作流）看板。列表约每 15 秒静默刷新。

任务状态机：`待开始 → 规划中 → 已规划 → 执行中 → 待闭环/待确认 → 已完成`，另有已暂停/失败/已取消；无人值守流水线 `pending → planning → planned → 授权 → executing → completed`，失败自动重试默认最多 3 次。

操作：暂停/继续、验收（确认完成/打回）、另存为应用、再跑一次、批量操作、查看计划/工作流。

关键环境变量：`EVOFLOW_TASK_QUEUE_ENABLED`（1）、`EVOFLOW_TASK_QUEUE_INTERVAL_SECONDS`（15）、`EVOFLOW_TASK_QUEUE_MAX_CONCURRENT`（3）、`EVOFLOW_TASK_QUEUE_RETRY_MAX`（3）。

### 6.2 四类任务能力对比

| 维度 | 目标（Goal） | 自动化（Cron） | Plan 模式 | 任务中心 |
| --- | --- | --- | --- | --- |
| 触发 | 立即开始，连续多轮 | 到点触发，单次 | 用户确认后开始 | 创建后队列接手 |
| 持续时间 | 长（最长 7×24h） | 单次 | 单会话内 | 跨多个会话 |
| 目标特征 | 一个开放目标 | 一段确定脚本 | 多步骤工程 | 多角色协作工程 |
| 协作粒度 | 单 Agent 自驱 | 单 Agent 单次 | 单 Agent 多步 | 多 Agent DAG |

**Goal Agent（目标模式）**：长程自驱，状态机 5 态（idle/running/waiting/paused/error），双停止规则（`max_steps` 与 `auto_stop_minutes` 任一先到先停）。对话中经 `propose_goal` 工具返回确认条（用户授权机制，不绕过）。高级选项"持续进化"（`self-evolution` 自改提示词/技能，默认关）。关键参数：max_steps（8）、auto_stop_minutes（0-10080）、initiative（70）、feishu_push_on_complete（true）。

**自动化（Automation Scheduler）**：Gateway 内置 `AutomationScheduler` 跑在 asyncio 事件循环，按 tick（默认 30s）扫描 cron 任务。线程模式：`fresh`（每次新线程）/ `sticky`（复用 `langgraph_thread_id` 保持上下文）。一次性任务 `once_fired` 后自动转 paused。支持结果推送 IM 渠道。

**Plan 模式**：先定稿计划再授权执行；确认条（查看计划/开始执行/另存为应用）；规划阶段 PlanGuard 保护（未授权前限制高副作用工具）；步骤可指定 `project-*` 角色执行人。

### 6.3 智能体员工（Smart Employees）

把已有智能体编成"岗位合同"：职责、工作文件夹、上班频率、审批策略，到点主动干活、建项、写工作汇报（产出落 `docs/roles/<agent_code>/…`）。

- 协作通道：正式交工（结案指定下游 handlers → 可能交接审批 → 系统建子任务并唤醒）+ 叫醒/派发（任意在岗同事，不校验汇报线）。
- 硬规则：同组织、禁止派给自己、员工 handlers 仅直属下级。
- 任务状态机：`pending → executing → awaiting_close（交工且带下游）→ completed`。
- 交接审批策略：谨慎型（几乎所有带下游交工都要批）/ 平衡型（中风险及以上）/ 全自动（仅极高风险）。
- 两道人闸：交接审批（放行叫醒下一岗）vs 验收（认不认结果）。

### 6.4 应用中心（App Center）

把跑通的工作流固化为可复用应用（选应用→填参数→跑）。画布编排：节点/参数/历史/版本/API（Key 与 OpenAPI，须已发布）/调试。执行方式：按步骤自动跑完 / 先生成计划再确认（监督模式）。沉淀入口：Plan 确认条"另存为应用"或任务详情。

---

## 七、网关与接口设计

### 7.1 Gateway API（FastAPI）

按 openapi-gateway.json 归纳的主要端点：

| 域 | 端点（方法） | 用途 |
| --- | --- | --- |
| 模型 | `/api/models`（GET/POST）、`/api/models/{name}`（GET/PUT/DELETE）、`/api/models/primary`、`/api/models/invoke`、`/api/models/test` | 模型 CRUD、主模型、调用测试 |
| 对话线程 | `/api/threads`（POST）、`/api/threads/{id}`（GET/DELETE）、`/api/threads/{id}/messages`（POST/GET，POST 返回 SSE 流）、`/api/threads/{id}/uploads`、`/api/threads/{id}/artifacts/{path}`、`/api/threads/{id}/suggestions` | 会话生命周期、消息、文件、追问建议 |
| 记忆 | `/api/memory`（GET/DELETE）、`/api/memory/facts/{fact_id}`、`/api/memory/reload`、`/api/memory/config`、`/api/memory/status`、`/api/memory/agents` | 记忆读取、清理、重载、配置 |
| 技能 | `/api/skills`、`/api/skills/{name}`（GET/PUT/DELETE）、`/api/skills/install`、`/api/skills/install-from-market` | 技能管理、安装、市场安装 |
| MCP | `/api/mcp/config`（GET/PUT） | MCP 配置动态更新 |
| Agent/工作区 | `/api/agents`、`/api/agents/{name}`、`/api/workspaces`、`/api/workspaces/resolve`、`/api/tools/metadata`、`/api/user-profile` | Agent/工作区/工具元数据 |
| 渠道 | `/api/channels/`、`/api/channels/{name}/restart|enable|config`、`/api/channels/feishu/push`、`/api/channels/feishu|weixin/registration/*` | IM 渠道管理、推送、机器人绑定 |
| 自动化 | `/api/automation/scheduler/status|start|stop`、`/api/automation/tasks`、`/api/automation/{id}/run` 等 | 调度器与任务 |
| 任务 | `/api/tasks`（CRUD）、`/api/tasks/{id}/authorize-execution|start|stop|resume|restart|cancel|retry`、`/api/tasks/{id}/subtasks`、`/api/tasks/batch` | 任务与子任务全生命周期 |
| 流式事件 | `/api/events/tasks/{id}/stream`（SSE）、`/api/events/threads/{id}/stream-status`、`/api/chat/sessions/{key}/stream-resume` | 协作事件订阅、流恢复 |
| LangGraph | `/api/langgraph/runs/`、`/api/langgraph/threads/{id}/runs/{run_id}/stream`、`/api/langgraph/active-sessions`、`/api/langgraph/{path}`（五方法代理） | LangGraph 代理 |
| 运行时 | `/api/runtime/paths`（GET/PUT）、`/health` | 运行时路径、健康检查 |

### 7.2 SSE 流式协议

消息发送端点基于 LangGraph `astream()` 异步流式执行，返回 `text/event-stream`。事件类型：`message`（assistant 文本，含 isThinking）、`tool_call`（tool_name/tool_call_id/args）、`tool_result`（按 tool_call_id 关联，status success/error）、`error`、`done`（`data: [DONE]` 结束）。

前端 `StreamManager` 用 EventSource 连接，断线指数退避自动重连（`1s*2^attempt`，上限 30s，最多 5 次）；支持从 stream mirror 恢复 SSE（`stream-resume`）。

### 7.3 IM 渠道

支持渠道与连接方式：飞书（WebSocket 长连接）、钉钉（WebSocket/轮询）、Telegram（Bot API 轮询）、Slack（Socket Mode）、Discord（Gateway）。所有渠道出站连接，无需公网 IP。

- 线程映射：`channel:chat_id`（可加 topic）映射 LangGraph `thread_id`，映射存 JSON。
- 渠道命令：`/bootstrap`、`/claude`、`/lead`、`/new`、`/status`、`/models`、`/memory`、`/help`、`/agent`、`/goal`、`/task`、`/stop`、`/automation`。
- 飞书专属：卡片式交互（动态更新进度、代码块美化、错误红色卡片）；智能体员工/小V 可扫码绑定专属飞书机器人（岗位独立对话、审批与汇报推送）；`POST /api/channels/feishu/push`（Bearer `$EVOFLOW_FEISHU_PUSH_SECRET`）。

---

## 八、桌面端（EvoPanel）内部结构

本节为对 `evoflow.exe` 二进制逆向的直接结论（与官方文档互补，官方文档未覆盖的桌面端细节）。

### 8.1 二进制概况

| 项 | 值 |
| --- | --- |
| 文件 | evoflow.exe，40,899,072 字节（约 40.9 MB），x64，6 个 PE 节 |
| 产品 | EvoFlow / EvoPanel v0.3.8（FileVersion 0.3.8） |
| 标识 | `@com.evovex.evoflow`（Tauri bundle identifier） |
| 桌面框架 | Tauri v2（tauri 2.11.2、tauri-runtime-wry 2.11.2、tao 0.35.2、tauri-utils 2.9.2、tauri-plugin-updater 2.10.1） |
| Rust crate | `evopanel_lib`（`src/lib.rs`、`src/commands/*.rs`） |
| 构建环境 | GitHub Actions（`C:\Users\runneradmin\.cargo`），带完整调试符号路径 |
| 窗口 | 主窗口加载 `index.html`，自定义标题栏（data-tauri-drag-region 拖拽/双击最大化），系统托盘图标 |

### 8.2 Rust 命令模块（src/commands/）

| 模块 | 职责 |
| --- | --- |
| `assistant.rs` | 桌面辅助能力：进程列表、目录列表、文件读写、执行命令、URL 抓取、Web 搜索（DuckDuckGo HTML 端点）、端口检测、图片读写/删除、审计日志 |
| `gateway.rs` | 网关代理：`gateway_proxy_stream`（/runs/stream 流式代理，含零 body chunk 告警）、`gateway_proxy`、`gateway_base`、`reload_gateway` |
| `backend.rs` | 内置后端 sidecar 生命周期：`evoflow-gateway` 进程 spawn/健康检查（`GET /health`，端口 38012）、`config.yaml` 解析、`models/providers`、`agents/list`、后端日志（`evopanel-startup.log`、`backend-runtime.json`） |
| `browser_embed.rs` | 嵌入式浏览器（CDP/Chrome DevTools Protocol）：`browser_embed_upsert/close/set_bounds`，CDP endpoint 就绪检测，attach 嵌入式浏览器 |
| `voice_overlay.rs` | 语音悬浮窗（push-to-talk）：`voice_overlay_show/hide/processing/set_complete/update_text/update_levels/set_bounds`，`sync_voice_hotkey` |
| `extensions.rs` | UI 扩展与 MCP 市场：`ui_extension_install_suite/zip/folder/content_creator`、`uninstall/list/set_enabled/reveal`、`mcp_market_search`、`install_cftunnel`、`install_clawapp`、服务启停/日志 |
| `ui_extensions.rs` | 扩展注册表（`registry.json`）、`evoflow.extension.json` / `evoflow.suite.json` 清单、`kind=suite` 模式 |
| `config.rs` | `read/write_evoflow_config`、`read/write_panel_config`、`apply_workspace_settings` |
| `update.rs` | 前端更新：检查 `https://raw.githubusercontent.com/EvovexAI/EvoFlow/main/update/latest.json`、下载/回滚、SHA256 校验 |
| `log_files.rs` / `logs.rs` | 日志读取（`read_log_tail`、`append_stream_compare`） |
| `ws_client.rs` 等 | WebSocket 客户端、流恢复（`stream-resume`） |

### 8.3 桌面端特有功能（官方文档未覆盖，来自二进制证据）

| 功能 | 证据与说明 |
| --- | --- |
| 语音交互 | `voice-overlay` 窗口、wake-word 唤醒词（含 WebSpeech 实现）、push-to-talk（voice-push-down/up）、ASR 策略（voice-asr-policy）、语音跟随/回复（voice-follow-up、voice-reply-speech）、后台语音桥（background-voice-bridge）、语音可视化（voice-visualizer）、录音悬浮窗 |
| 远程隧道 | `install_cftunnel`：PowerShell 下载官方安装脚本安装 Cloudflare Tunnel（`cftunnel.exe`，AppData/Local/.cftunnel），支持 up/down/restart 操作与状态查询；另有 `install_clawapp`（同类安装脚本机制） |
| 嵌入式浏览器 | 通过 CDP 协议在应用内嵌浏览器自动化/接管网页（`browser-embed-client`） |
| OBS 集成 | OBS Dashboard（obs-dashboard，OBS 直播/录制看板） |
| 内容创作套件 | `EVOFLOW_CONTENT_CREATOR_SUITE` 环境变量、`ui_extension_install_content_creator`（短剧/内容创作扩展套件，配套 design 文档） |
| 飞书员工绑定 | `feishu-employee-bind`、feishu logo 资源（智能体员工绑定专属飞书机器人） |
| 许可证 | license、license-keys、premium-activate（商业授权/激活） |
| 键盘快捷键 | keyboard-shortcuts、sync_voice_hotkey、全局热键插件 |
| 剪贴板/系统集成 | copy_image_to_clipboard、reveal_path_in_file_manager、set_tray_tooltip、close-to-tray、set_as_app_menu/window_menu |

### 8.4 环境变量（桌面端）

`EVOFLOW_HOME`、`EVOFLOW_LOGS_DIR`、`EVOFLOW_CONFIG_PATH`、`EVOFLOW_GATEWAY_URL`、`EVOFLOW_GATEWAY_PORT`、`EVOPANEL_BACKEND_PORT`（默认 38012）、`EVOPANEL_BACKEND_PORT_MIN/MAX`、`EVOPANEL_BACKEND_EXE_PATH`、`INTERNAL_EVENTS_SECRET`、`EVOFLOW_CONTENT_CREATOR_SUITE`；后端环境：`PYTHONUTF8=1`、`PYTHONIOENCODING=utf-8`、`NO_COLOR`、`FORCE_COLOR=0`、`COLORAMA_DISABLE`（Python 网关），`networkProxy` 代理配置。

### 8.5 更新与分发

- 桌面端：Tauri Updater（`tauri-plugin-updater 2.10.1`）检查 GitHub 发布页，Windows 安装包 `EvoFlow_0.3.8_x64-setup.exe`（NSIS，约 574 MB），SHA256 校验（`34ecab48...`），`EVOFLOW_CONTENT_CREATOR_SUITE` 场景下 msiexec 路径亦存在。
- 前端面板：独立的前端更新通道（`download_frontend_update` + `expectedHash` + `rollback_frontend_update`），配合网关侧"reload_gateway"动态加载。

---

## 九、数据与配置体系

| 文件 | 用途 |
| --- | --- |
| `config.yaml` | 全局配置：模型、工具组、子代理、记忆、沙箱、渠道 |
| `extensions_config.json` | 技能与 MCP 服务器启用状态（mtime 缓存失效） |
| `evoflow.json` / `.bak` | 网关/运行时状态（配置损坏且无备份时报错） |
| `backend-runtime.json` | 后端 sidecar 运行状态 |
| `evopanel.json` | 桌面面板配置（userWorkspaceRoot、developer、enableDevtools、showSessionDebug） |
| `evoflow.suite.json` / `evoflow.extension.json` | 扩展套件/扩展清单（service start/stop、ports、cwdui-extensions registry.json） |
| `memory.json` | 长期记忆（workContext/personalContext/topOfMind/facts/history） |
| `~/.evoflow/threads/{thread_id}/user-data/` | 线程隔离目录（workspace/uploads/outputs） |
| `evoflow.db` | SQLite：模型表（`evoflow_models`）、任务/子任务、自动化任务与运行记录 |

环境变量（部分）：`EVOFLOW_LANGGRAPH_URL`、`EVOFLOW_TASK_QUEUE_*`、`EVOFLOW_AUTOMATION_*`、`EVOFLOW_FEISHU_PUSH_SECRET`、`DEER_FLOW_EXTENSIONS_CONFIG_PATH`、`EVOFLOW_ALLOW_LOCAL_HOST_READS`、`EVOFLOW_OPS_KNOWLEDGE_ROOT`、`EVOPANEL_*`。

---

## 十、安全与护栏

| 层 | 机制 |
| --- | --- |
| 边界防护 | API 认证、请求限流、飞书 Webhook 签名校验（无效 401） |
| 输入防护 | Prompt 注入检测、敏感信息过滤 |
| 工具调用防护 | 命令白名单、路径遍历拒绝（`..`）、`validate_local_tool_path` 白名单、bash 命令路径校验 |
| 执行防护 | 沙箱隔离（Local/Docker/k3s）、资源限制（bash 600s 超时）、最小权限 |
| 输出防护 | 内容安全、信息脱敏（主机路径反映射虚拟路径） |
| 规划防护 | PlanGuardMiddleware：授权前过滤高副作用工具，保留读文件/澄清/list_agents/plan/调度类 |
| 记忆防护 | 事实置信度阈值（0.7）、最多注入 15 条、Token 上限 2000 |

---

## 十一、功能清单

### A. 对话与 Agent 执行

| 功能 | 说明 | 出处 |
| --- | --- | --- |
| 四模式聊天 | Ask（问答少副作用）/ Agent（直接干活）/ Plan（先定稿再执行）/ Goal（长程自驱） | 官方文档 |
| 模型管理 | 多厂商模型 CRUD、主模型、测试连接、运行时切换（thinking/vision 自动适配） | API/文档 |
| 自定义 Agent | 自有 SOUL、模型、工具白名单、工作区，`assistant_id` 路由 | 文档 |
| 预设 Agent Teams | 项目团队（architect/plan/implement/review/QA 角色组） | 文档 |
| 子代理委派 | task 工具、双线程池、最多 3 并发、15 分钟超时 | 文档 |
| 上下文压缩 | SummarizationMiddleware 按 Token 上限自动压缩 | 文档 |
| 标题自动生成 | TitleMiddleware | 文档 |
| 澄清机制 | 五类强制澄清场景，CLARIFY→PLAN→ACT | 文档 |

### B. 任务与编排

| 功能 | 说明 | 出处 |
| --- | --- | --- |
| Plan 模式 | 计划定稿、授权执行、确认条、Supervisor DAG、另存为应用 | 文档 |
| Goal 目标 | 长程自驱、双停止规则、propose_goal 授权、持续进化（可选） | 文档 |
| 任务中心 | 跨来源看板、暂停/恢复/验收/重试/批量、状态机 | 文档 |
| 子任务 DAG | 依赖排序、上游完成自动跟进、全屏工作流视图 | 文档 |
| 队列调度 | 无人值守流水线（15s tick、最多 3 并发、重试 3 次） | 文档 |
| 恢复机制 | 断点续跑、失败重试、部分重规划 | 文档 |
| 流恢复 | SSE 断线自动重连 + stream-resume | 文档 |

### C. 智能体员工与协作

| 功能 | 说明 | 出处 |
| --- | --- | --- |
| 岗位合同 | 职责/工作区/频率/审批策略四要素 | 文档 |
| 自动上班 | 到点主动干活、建项、写工作汇报 | 文档 |
| 交接审批 | 谨慎/平衡/全自动三档策略 | 文档 |
| 交工/唤醒 | handlers 下游、软唤醒、同级叫醒 | 文档 |
| 飞书绑定 | 员工扫码绑定专属飞书机器人 | 文档/二进制 |
| 小V 全局助手 | 一员工一会话委派 | 文档 |

### D. 应用与自动化

| 功能 | 说明 | 出处 |
| --- | --- | --- |
| 应用中心 | 画布编排、填参运行、历史、版本、OpenAPI/API Key | 文档 |
| 应用沉淀 | Plan/任务详情另存为应用 | 文档 |
| 自动化调度 | cron 五字段、一次性任务、fresh/sticky 线程模式 | 文档 |
| 结果推送 | 完成后推送到 IM 渠道 | 文档 |

### E. 知识与记忆

| 功能 | 说明 | 出处 |
| --- | --- | --- |
| 技能系统 | SKILL.md 技能包、渐进式加载、.skill 安装、ClawHub 市场 | 文档 |
| 记忆系统 | 三级记忆、异步提取、防抖原子写、外部插件 | 文档 |
| 知识库 Vault | Obsidian/任意 Markdown 目录、全文/语义检索、双链图谱 | 文档 |
| 知识图谱探索 | D3-force 力导向图谱、BFS/DFS 路径（v0.3.8+） | 文档 |
| 思维导图 | 会话内自动构建、9 类节点、Mermaid 渲染 | 文档 |

### F. 工具与扩展

| 功能 | 说明 | 出处 |
| --- | --- | --- |
| MCP 接入 | stdio/SSE/HTTP 三传输、OAuth 刷新、配置热更新 | 文档 |
| MCP 市场 | 19 个内置预设（filesystem/fetch/github/puppeteer/postgres/slack/notion/stripe/obsidian 等） | 二进制 |
| 内置工具 | ask_clarification/view_image/task/setup_agent | 文档 |
| 配置工具组 | read_file/write_file/str_replace/bash/ls | 文档 |
| UI 扩展套件 | suite/zip/folder 安装、服务启停、内容创作套件 | 二进制 |

### G. 桌面端与系统集成

| 功能 | 说明 | 出处 |
| --- | --- | --- |
| 语音交互 | 唤醒词、push-to-talk 悬浮窗、ASR、语音回复、可视化 | 二进制 |
| 嵌入式浏览器 | CDP 协议浏览器接管 | 二进制 |
| 远程隧道 | Cloudflare Tunnel 安装/启停/状态（cftunnel） | 二进制 |
| OBS 看板 | OBS Dashboard 集成 | 二进制 |
| 系统托盘 | 托盘图标、close-to-tray、tooltip | 二进制 |
| 全局热键 | 快捷键注册/同步（含语音热键） | 二进制 |
| 许可证 | 商业授权、激活（premium） | 二进制 |
| 自更新 | Tauri Updater + 前端面板独立更新通道 | 二进制/仓库 |
| 日志体系 | 日志 tail/对比、审计日志（assistant-audit.log） | 二进制 |

### H. 渠道与集成

| 功能 | 说明 | 出处 |
| --- | --- | --- |
| 飞书 | WebSocket 长连接、卡片流式更新、群/单聊、指令系统、主动推送 | 文档 |
| 钉钉/Telegram/Slack/Discord | 轮询/Socket 接入 | 文档 |
| 渠道指令 | /agent、/goal、/task、/automation、/memory 等 | 文档 |
| 外部执行器（规划中） | ACP 协议适配 Claude Code/Codex/Trae/CodeBuddy | 文档 |

---

## 十二、版本与发布

| 项 | 值 |
| --- | --- |
| 当前版本 | v0.3.8（2026-08-01 发布） |
| 安装包 | `EvoFlow_0.3.8_x64-setup.exe`（约 574 MB，NSIS） |
| 更新源 | `https://raw.githubusercontent.com/EvovexAI/EvoFlow/main/update/latest.json` |
| 平台 | Windows x64（主推）、macOS（Apple Silicon/Intel）、Linux（AppImage/DEB） |
| 许可 | Evovex AI Non-Commercial License 1.0（源码可用但未开源，商用需书面授权） |

---

## 附录：逆向证据要点

- PE 头：MZ/PE x64，6 节，无 overlay，40.9 MB。
- 框架判定：字符串命中 `tauri`、`WebView2`、`rustc`、`tauri-plugin-updater/2.10.1`，排除 Electron/PyInstaller/.NET。
- 源码路径：`C:\Users\runneradmin\.cargo\registry\...\tauri-2.11.2\...`、`evopanel_lib::commands::*`、`src\commands\backend.rs` 等。
- 网关：`127.0.0.1:38012`、`GET /health`、`/runs/stream`、`/agents/list`、`../models/providers`、`config.yaml`、`backend-runtime.json`。
- 前端资源：约 250 个 Vite 产物（`/assets/*.js`），含 ChatApp、ObsDashboardApp、proactive-*、voice-*、knowledge-vaults、gateway-guardian-* 等，Mermaid/KaTeX/Cytoscape 组件齐全。
- 中文 UI：错误消息字符串（安装/路径/隧道/网关/扩展/日志等）为简体中文。
- 更新清单：`latest.json` 字段 minAppVersion/version/pub_date/size/hash/url/notes，SHA256 校验。
