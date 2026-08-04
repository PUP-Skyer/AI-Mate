# AI Mate（AI智创·创业赋能平台）系统架构文档

> 版本：v1.0 | 更新日期：2026-04-23 | 文档状态：初稿

---

## 目录

1. [架构概述](#1-架构概述)
2. [技术选型](#2-技术选型)
3. [前端架构](#3-前端架构)
4. [后端架构](#4-后端架构)
5. [AI集成架构](#5-ai集成架构)
6. [安全架构](#6-安全架构)
7. [数据架构](#7-数据架构)
8. [部署架构](#8-部署架构)
9. [API接口文档](#9-api接口文档)
10. [附录](#10-附录)

---

## 1. 架构概述

### 1.1 设计目标

AI Mate 是面向创业者的一站式 AI 赋能平台，核心目标包括：

- **智能化**：深度集成大语言模型（GLM-5.1）与多 Agent 协作，提供商业计划生成、市场分析、竞品调研等 AI 能力
- **模块化**：采用微前端架构，7 个子应用独立开发、独立部署，支持按需加载
- **安全性**：API Key 服务端隔离、多层 Prompt 注入防护、内容安全审核
- **可扩展**：Serverless 代理层解耦 AI 服务，便于接入新模型和 Agent

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| 关注点分离 | 前端展示、后端业务、AI 服务三层解耦 |
| 单一职责 | 每个子应用/微服务只负责一个业务域 |
| 防御式编程 | 输入校验、输出过滤、异常兜底贯穿全链路 |
| 渐进增强 | 核心功能不依赖 AI，AI 能力作为增强层 |
| 零信任 | 所有跨服务调用均需认证，不信任任何外部输入 |

### 1.3 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户浏览器                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Nginx 反向代理 (443)                         │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐  │
│  │  静态资源 (Vue/React) │  │  /api/*  →  SpringBoot :8080   │  │
│  │  子应用入口 HTML      │  │  /ai/*   →  Node.js  :9000     │  │
│  └─────────────────────┘  └──────────────────────────────────┘  │
└──────────┬───────────────────────┬───────────────────────────────┘
           │                       │
           ▼                       ▼
┌─────────────────────┐  ┌────────────────────────────────────────┐
│  Vue 3 主应用壳      │  │        Serverless AI 代理层 (:9000)     │
│  (qiankun 宿主)      │  │  ┌──────────┐  ┌─────────────────┐   │
│                     │  │  │智谱GLM-5.1│  │  Coze API v3    │   │
│  ┌───────────────┐  │  │  └──────────┘  └─────────────────┘   │
│  │ Vue 子应用 x4  │  │  │  ┌──────────┐  ┌─────────────────┐   │
│  │ 3001~3004     │  │  │  │WorkBuddy │  │  Trae MCP       │   │
│  ├───────────────┤  │  │  │  MCP     │  │                 │   │
│  │ React 子应用x3 │  │  │  └──────────┘  └─────────────────┘   │
│  │ 4001~4003     │  │  │  ┌──────────────────────────────┐   │
│  └───────────────┘  │  │  │ 安全中间件栈                   │   │
└─────────────────────┘  │  │ · Prompt注入检测               │   │
                         │  │ · 内容安全审核                  │   │
                         │  │ · 速率限制/配额管理             │   │
                         │  └──────────────────────────────┘   │
                         └────────────────────────────────────────┘
                                          │
┌─────────────────────┐                   │
│  SpringBoot (:8080)  │◄─────────────────┘ (用户身份校验)
│                     │
│  ┌───────────────┐  │
│  │ Auth / User   │  │
│  │ Conversation  │  │
│  │ Project       │  │
│  │ Community     │  │
│  │ Dashboard     │  │
│  └───────┬───────┘  │
│          │ JPA      │
│  ┌───────▼───────┐  │
│  │  MySQL 8.0    │  │
│  │  (17张表)     │  │
│  └───────────────┘  │
└─────────────────────┘
```

---

## 2. 技术选型

### 2.1 前端技术栈

| 技术 | 选型 | 理由 | 对比分析 |
|------|------|------|----------|
| 主框架 | **Vue 3** | Composition API 灵活、生态成熟、团队熟悉度高 | 相比 Angular 更轻量，相比 Svelte 生态更完善 |
| 构建工具 | **Vite** | HMR 极快、原生 ESM 支持、插件丰富 | 相比 Webpack 构建速度提升 10x+ |
| UI 组件库 | **Naive UI** | TypeScript 原生支持、主题定制能力强、Tree-shaking 友好 | 相比 Element Plus 更现代，相比 Ant Design Vue 体积更小 |
| 状态管理 | **Pinia** | Vue 3 官方推荐、TypeScript 友好、支持 DevTools | 取代 Vuex，API 更简洁，无 mutations |
| 微前端 | **qiankun** | 成熟稳定、沙箱隔离、支持 Vue/React 混合 | 相比 Module Federation 接入成本更低，沙箱更完善 |

### 2.2 后端技术栈

| 技术 | 选型 | 理由 |
|------|------|------|
| 框架 | **SpringBoot 3.2.5** | 企业级生态、安全框架成熟、JPA 简化数据层 |
| 语言 | **Java 17** | LTS 版本、Records/Sealed Classes 提升表达力、性能优化 |
| 安全 | **Spring Security + JWT** | 成熟的认证授权框架，无状态 JWT 适配微前端场景 |
| ORM | **Spring Data JPA** | 减少样板代码、分页/排序内置支持、审计字段自动填充 |

### 2.3 AI 技术栈

| 技术 | 选型 | 理由 |
|------|------|------|
| 主力模型 | **智谱 GLM-5.1** | 200K 超长上下文、Function Call 能力、中文理解优秀 |
| Agent 平台 | **扣子 Coze API v3** | 多 Agent 编排、工作流引擎、插件生态丰富 |
| 开发助手 | **WorkBuddy MCP / Trae MCP** | MCP 协议标准化、IDE 集成、代码生成能力 |
| 代理层 | **Node.js/Express** | SSE 流式输出原生支持、JSON 处理高效、Serverless 友好 |

---

## 3. 前端架构

### 3.1 qiankun 微前端设计

主应用作为 qiankun 宿主，负责子应用注册、路由分发和公共依赖管理。

```typescript
// main-app/src/micro/apps.ts
import { registerMicroApps, start, initGlobalState } from 'qiankun';

const apps = [
  // Vue 子应用
  { name: 'vue-user',      entry: '//localhost:3004', container: '#subapp', activeRule: '/user' },
  { name: 'vue-community', entry: '//localhost:3001', container: '#subapp', activeRule: '/community' },
  { name: 'vue-resource',  entry: '//localhost:3002', container: '#subapp', activeRule: '/resource' },
  { name: 'vue-dashboard', entry: '//localhost:3003', container: '#subapp', activeRule: '/dashboard' },
  // React 子应用
  { name: 'react-ai-chat', entry: '//localhost:4001', container: '#subapp', activeRule: '/ai-chat' },
  { name: 'react-bp-gen',  entry: '//localhost:4002', container: '#subapp', activeRule: '/bp-gen' },
  { name: 'react-collab',  entry: '//localhost:4003', container: '#subapp', activeRule: '/collab' },
];

registerMicroApps(apps, {
  beforeLoad: [(app) => console.log(`[qiankun] ${app.name} loading...`)],
  afterMount: [(app) => console.log(`[qiankun] ${app.name} mounted`)],
});

// 全局状态初始化
const { onGlobalStateChange, setGlobalState } = initGlobalState({
  user: null,
  theme: 'light',
  locale: 'zh-CN',
});

start({ prefetch: 'all', sandbox: { strictStyleIsolation: true } });
```

### 3.2 子应用架构划分

```
┌─────────────────────────────────────────────────────┐
│                    主应用壳 (Vue 3)                   │
│  · 全局布局（Header / Sidebar / Footer）              │
│  · 路由调度 / 认证守卫 / 全局状态                     │
│  · 公共组件库 / 工具函数 / Axios 实例                 │
├──────────┬──────────┬──────────┬──────────┬──────────┤
│vue-user  │vue-comm  │vue-resrc │vue-dash  │react-*   │
│:3004     │:3001     │:3002     │:3003     │:4001~3   │
│用户中心   │社区交流   │资源中心   │数据看板   │AI能力    │
│注册/登录  │帖子/评论  │模板/收藏  │统计分析   │聊天/生成  │
│会员/设置  │标签/搜索  │知识库    │使用报告   │协作/评审  │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

**Vue 子应用**负责用户体系、社区、资源管理、数据看板等传统 CRUD 业务；**React 子应用**负责 AI 对话、商业计划生成、协作评审等交互密集型场景，利用 React 丰富的状态管理和动画生态。

### 3.3 子应用通信机制

采用 **qiankun 全局状态 + CustomEvent** 双通道：

```typescript
// 子应用挂载时监听全局状态
export async function mount(props) {
  props.onGlobalStateChange((state, prev) => {
    if (state.user !== prev.user) {
      store.commit('SET_USER', state.user);
    }
  });
}

// 跨子应用事件总线（补充全局状态的局限）
// 主应用提供 EventBus，子应用通过 props 获取
window.dispatchEvent(new CustomEvent('subapp:message', {
  detail: { from: 'react-ai-chat', type: 'CONVERSATION_CREATED', payload: { id: 123 } }
}));
```

### 3.4 状态管理策略

```
┌──────────────────────────────────────────┐
│  全局状态 (qiankun GlobalState)          │
│  · user (用户信息/Token)                 │
│  · theme / locale                       │
├──────────────────────────────────────────┤
│  主应用 Pinia Store                      │
│  · authStore  (认证状态)                  │
│  · appStore  (应用配置)                   │
├──────────────────────────────────────────┤
│  子应用本地 Store                         │
│  · Vue 子应用 → Pinia                    │
│  · React 子应用 → Zustand                │
│  · 各自管理业务状态，互不干扰              │
└──────────────────────────────────────────┘
```

---

## 4. 后端架构

### 4.1 分层设计

```
┌─────────────────────────────────────────┐
│  Controller 层                          │
│  · RESTful API 端点定义                  │
│  · 请求参数校验 (@Valid)                 │
│  · 统一响应封装 (Result<T>)              │
├─────────────────────────────────────────┤
│  Service 层                             │
│  · 业务逻辑编排                          │
│  · 事务管理 (@Transactional)             │
│  · 缓存策略 / 异步任务                   │
├─────────────────────────────────────────┤
│  Repository 层 (Spring Data JPA)        │
│  · 接口定义 + 方法名查询衍生              │
│  · @Query 自定义查询                     │
│  · 分页/排序规格                         │
├─────────────────────────────────────────┤
│  Entity 层                              │
│  · JPA 实体映射                          │
│  · 审计字段 (@CreatedDate, @LastModifiedDate) │
│  · 逻辑删除 (@SQLRestriction)            │
└─────────────────────────────────────────┘
```

**统一响应封装示例：**

```java
@Data
@Builder
public class Result<T> {
    private int code;
    private String message;
    private T data;

    public static <T> Result<T> success(T data) {
        return Result.<T>builder().code(200).message("success").data(data).build();
    }

    public static Result<Void> error(int code, String message) {
        return Result.<Void>builder().code(code).message(message).build();
    }
}
```

### 4.2 认证授权（Spring Security + JWT）

采用双 Token 机制：Access Token（24h）用于日常请求，Refresh Token（7d）用于无感续签。

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String token = resolveToken(request);
        if (token != null && jwtTokenProvider.validateToken(token)) {
            Authentication auth = jwtTokenProvider.getAuthentication(token);
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        chain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
```

**Token 续签流程：**

```
客户端请求 → Access Token 过期(401) → 客户端携带 Refresh Token
    → POST /api/auth/refresh → 验证 Refresh Token
    → 签发新 Access Token → 客户端重试原请求
```

### 4.3 API 设计规范

- **RESTful 风格**：资源名用复数名词，HTTP 方法表达操作语义
- **版本控制**：URL 前缀 `/api/v1/`
- **分页**：统一使用 `page`（从 1 开始）和 `size` 参数，返回 `PageResult<T>`
- **错误码**：业务错误码 5 位数字，格式 `模块(2位) + 操作(2位) + 序号(1位)`

---

## 5. AI 集成架构

### 5.1 Serverless 代理层设计

代理层是 AI 能力的统一入口，核心职责：API Key 隔离、请求路由、安全过滤、流式转发。

```
┌──────────────────────────────────────────────────────┐
│              AI 代理层 (Express :9000)                 │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │              中间件栈 (Middleware Pipeline)       │  │
│  │  1. CORS                                        │  │
│  │  2. 身份校验 (转发至 SpringBoot 验证 JWT)        │  │
│  │  3. 速率限制 (sliding-window)                    │  │
│  │  4. Prompt 注入检测 (三层防护)                    │  │
│  │  5. 内容安全审核 (敏感词 + PII 脱敏)             │  │
│  │  6. 请求路由 (Router)                            │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ /ai/     │ │ /ai/     │ │ /ai/     │ │ /ai/   │ │
│  │ zhipu    │ │ coze     │ │workbuddy │ │ trae   │ │
│  │          │ │          │ │          │ │        │ │
│  │ GLM-5.1  │ │ Coze v3  │ │ MCP      │ │ MCP    │ │
│  │ Chat     │ │ Workflow │ │ CodeGen  │ │ Code   │ │
│  │ FC       │ │ Agent    │ │          │ │        │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
└──────────────────────────────────────────────────────┘
```

**代理层核心路由：**

```javascript
// ai-proxy/src/routes/zhipu.js
router.post('/zhipu', rateLimiter, promptGuard, async (req, res) => {
  const { messages, model = 'glm-5.1', stream = true, functions } = req.body;

  // 构建上游请求
  const upstream = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, stream, functions }),
  });

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    upstream.body.pipeTo(new WritableStream({
      write(chunk) { res.write(chunk); },
      close() { res.end(); },
    }));
  } else {
    const data = await upstream.json();
    res.json(data);
  }
});
```

### 5.2 四大 AI 服务接入方案

| 服务 | 端点 | 核心能力 | 调用方式 |
|------|------|----------|----------|
| 智谱 GLM-5.1 | `/ai/zhipu` | 长文本对话、Function Call、JSON Mode | SSE 流式 |
| 扣子 Coze v3 | `/ai/coze` | 多 Agent 编排、工作流执行 | 异步轮询 |
| WorkBuddy MCP | `/ai/workbuddy` | 代码生成、项目脚手架 | 同步请求 |
| Trae MCP | `/ai/trae` | 代码补全、代码审查 | SSE 流式 |

### 5.3 SSE 流式输出

前端通过 `EventSource` 或 `fetch + ReadableStream` 消费 SSE 流：

```typescript
// react-ai-chat/src/hooks/useStreamChat.ts
export function useStreamChat() {
  const chat = async (messages: Message[]) => {
    const response = await fetch('/ai/zhipu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({ messages, stream: true }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      // 解析 SSE: "data: {...}\n\n"
      const lines = chunk.split('\n').filter(l => l.startsWith('data:'));
      for (const line of lines) {
        const json = JSON.parse(line.slice(5));
        yield json.choices[0].delta.content;
      }
    }
  };
  return { chat };
}
```

### 5.4 Prompt 模板管理

Prompt 模板存储在 `ai_templates` 表中，支持变量插值和版本管理：

```java
@Service
public class PromptTemplateService {

    public String render(Long templateId, Map<String, String> variables) {
        AiTemplate template = templateRepository.findById(templateId)
            .orElseThrow(() -> new BusinessException("模板不存在"));
        String content = template.getContent();
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            content = content.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return content;
    }
}
```

---

## 6. 安全架构

### 6.1 安全威胁模型

| 威胁 | 风险等级 | 攻击面 | 防护措施 |
|------|----------|--------|----------|
| Prompt 注入 | 高 | AI 对话接口 | 三层防护（见 6.2） |
| API Key 泄露 | 高 | 前端代码/网络抓包 | 服务端代理隔离 |
| XSS 攻击 | 中 | 社区帖子/评论 | 输入过滤 + CSP + HttpOnly Cookie |
| SQL 注入 | 中 | 数据库查询 | JPA 参数化查询 |
| 越权访问 | 中 | API 端点 | RBAC + 资源级鉴权 |
| 暴力破解 | 低 | 登录接口 | 速率限制 + 验证码 |
| PII 泄露 | 中 | AI 对话/日志 | 脱敏处理 + 访问控制 |

### 6.2 Prompt 注入防护（三层）

```
用户输入
    │
    ▼
[第一层] 正则检测 — 匹配已知注入模式
    │  · "忽略以上指令" / "你现在是..." / "system:" 等模式
    │  · 特殊字符转义
    │
    ▼
[第二层] XML 标签隔离 — 将用户输入包裹在隔离标签中
    │  <user_input>{{用户内容}}</user_input>
    │  系统提示中明确：user_input 标签内为不可信内容
    │
    ▼
[第三层] 输出过滤 — 检查模型输出是否包含敏感操作指令
       · 过滤系统级指令响应
       · 拒绝包含代码执行/文件操作的输出
```

```javascript
// ai-proxy/src/middleware/promptGuard.js
const INJECTION_PATTERNS = [
  /忽略.*指令/g, /ignore.*instruction/gi,
  /你现在是/g, /you are now/gi,
  /system\s*:/gi, /<\|im_start\|>/g,
];

function detectInjection(text) {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return false;
}

function isolateInput(text) {
  return `<user_input>\n${escapeHtml(text)}\n</user_input>`;
}

function filterOutput(text) {
  // 移除模型可能输出的系统指令
  return text.replace(/<\|im_start\|>system[\s\S]*?<\|im_end\|>/g, '[已过滤]');
}
```

### 6.3 速率限制

采用滑动窗口算法，按用户等级区分配额：

```javascript
// ai-proxy/src/middleware/rateLimiter.js
const RATE_LIMITS = {
  free:       { window: '1m', max: 10 },
  basic:      { window: '1m', max: 30 },
  pro:        { window: '1m', max: 100 },
  enterprise: { window: '1m', max: 500 },
};

function rateLimiter(req, res, next) {
  const userTier = req.user?.membership || 'free';
  const limit = RATE_LIMITS[userTier];
  // 滑动窗口实现（基于 Redis Sorted Set）
  slidingWindowCheck(req.user.id, limit.window, limit.max)
    .then(allowed => allowed ? next() : res.status(429).json({
      code: 429, message: '请求过于频繁，请稍后再试'
    }));
}
```

### 6.4 数据加密与合规

- **传输层**：全站 HTTPS (TLS 1.3)
- **存储层**：用户密码 BCrypt 加密、敏感字段 AES-256 加密
- **PII 脱敏**：手机号/身份证/邮箱在 AI 请求前自动脱敏
- **审计日志**：所有 AI 调用记录至 `usage_logs` 表，保留 90 天

---

## 7. 数据架构

### 7.1 ER 关系描述

```
users (1) ──< (1) user_profiles          用户基本信息 + 详细资料
users (1) ──< (1) memberships            用户 + 会员等级
users (1) ──< (n) conversations          用户 + 会话
conversations (1) ──< (n) messages       会话 + 消息
users (1) ──< (n) knowledge_bases        用户 + 知识库
knowledge_bases (1) ──< (n) knowledge_documents  知识库 + 文档
users (1) ──< (n) projects               用户 + 项目
projects (1) ──< (n) project_tasks       项目 + 任务
users (1) ──< (n) user_favorites         用户 + 收藏
users (1) ──< (n) usage_logs             用户 + 使用日志
users (1) ──< (n) feedback               用户 + 反馈
users (1) ──< (n) notifications          用户 + 通知
users (1) ──< (n) community_posts        用户 + 社区帖子
community_posts (1) ──< (n) community_comments  帖子 + 评论
ai_templates (独立)                       AI 模板（系统预置 + 用户自定义）
system_configs (独立)                     系统配置（键值对）
```

### 7.2 核心表设计

**users 表（用户主表）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 用户 ID |
| username | VARCHAR(50) UNIQUE | 用户名 |
| email | VARCHAR(100) UNIQUE | 邮箱 |
| password_hash | VARCHAR(255) | BCrypt 密码哈希 |
| role | ENUM(user,admin) | 角色 |
| status | ENUM(active,disabled) | 状态 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

**conversations 表（AI 会话）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 会话 ID |
| user_id | BIGINT FK | 用户 ID |
| title | VARCHAR(200) | 会话标题 |
| model | VARCHAR(50) | 使用的模型 |
| type | ENUM(chat,bp-gen,collab) | 会话类型 |
| created_at | DATETIME | 创建时间 |

**messages 表（消息记录）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 消息 ID |
| conversation_id | BIGINT FK | 会话 ID |
| role | ENUM(user,assistant,system) | 角色 |
| content | TEXT | 消息内容 |
| token_count | INT | Token 消耗数 |
| created_at | DATETIME | 创建时间 |

### 7.3 索引策略

```sql
-- 高频查询索引
CREATE INDEX idx_conversations_user_id ON conversations(user_id, created_at DESC);
CREATE INDEX idx_messages_conv_id ON messages(conversation_id, created_at);
CREATE INDEX idx_community_posts_author ON community_posts(user_id, created_at DESC);
CREATE INDEX idx_usage_logs_user_date ON usage_logs(user_id, created_at);

-- 唯一约束索引
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- 全文索引（社区搜索）
CREATE FULLTEXT INDEX idx_posts_fulltext ON community_posts(title, content);
```

---

## 8. 部署架构

### 8.1 Nginx 反向代理配置

```nginx
upstream springboot {
    server 127.0.0.1:8080;
}

upstream ai_proxy {
    server 127.0.0.1:9000;
}

server {
    listen 443 ssl http2;
    server_name ai-mate.example.com;

    ssl_certificate     /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    # 主应用静态资源
    location / {
        root /var/www/ai-mate/main;
        try_files $uri $uri/ /index.html;
    }

    # Vue 子应用静态资源
    location /vue-user/      { proxy_pass http://127.0.0.1:3004/; }
    location /vue-community/ { proxy_pass http://127.0.0.1:3001/; }
    location /vue-resource/  { proxy_pass http://127.0.0.1:3002/; }
    location /vue-dashboard/ { proxy_pass http://127.0.0.1:3003/; }

    # React 子应用静态资源
    location /react-ai-chat/ { proxy_pass http://127.0.0.1:4001/; }
    location /react-bp-gen/  { proxy_pass http://127.0.0.1:4002/; }
    location /react-collab/  { proxy_pass http://127.0.0.1:4003/; }

    # 后端 API
    location /api/ {
        proxy_pass http://springboot;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # AI 代理层
    location /ai/ {
        proxy_pass http://ai_proxy;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;           # 关键：SSE 流式输出必须关闭缓冲
        proxy_cache off;
        proxy_read_timeout 300s;       # AI 请求超时设长
    }

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
}
```

### 8.2 服务部署方案

```
┌──────────────────────────────────────────────────┐
│                  生产服务器                        │
│                                                  │
│  Nginx (:443)                                    │
│  ├── 主应用 (静态文件)                             │
│  ├── SpringBoot (:8080)  ← systemd 管理           │
│  ├── AI 代理层 (:9000)   ← PM2 管理               │
│  ├── Vue 子应用 (:3001~3004) ← PM2 管理           │
│  ├── React 子应用 (:4001~4003) ← PM2 管理         │
│  └── MySQL (:3306)       ← systemd 管理           │
└──────────────────────────────────────────────────┘
```

### 8.3 扩展性设计

- **水平扩展**：SpringBoot 和 AI 代理层均为无状态服务，可通过 Nginx upstream 配置多实例负载均衡
- **AI 代理层**：设计为 Serverless 友好，可迁移至云函数（AWS Lambda / 阿里云 FC）按需扩缩
- **数据库**：读写分离 + 分库分表预留接口，初期单实例 MySQL 足够
- **静态资源**：子应用构建产物可上传 CDN，Nginx 回源或直接走 CDN

---

## 9. API 接口文档

### 9.1 认证模块 (Auth) — 3 个端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 | 无 |
| POST | `/api/v1/auth/login` | 用户登录，返回双 Token | 无 |
| POST | `/api/v1/auth/refresh` | 刷新 Access Token | Refresh Token |

### 9.2 用户模块 (User) — 4 个端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/users/me` | 获取当前用户信息 | Bearer Token |
| PUT | `/api/v1/users/me` | 更新用户信息 | Bearer Token |
| GET | `/api/v1/users/me/profile` | 获取用户详细资料 | Bearer Token |
| PUT | `/api/v1/users/me/profile` | 更新用户详细资料 | Bearer Token |

### 9.3 会话模块 (Conversation) — 5 个端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/conversations` | 获取会话列表（分页） | Bearer Token |
| POST | `/api/v1/conversations` | 创建新会话 | Bearer Token |
| GET | `/api/v1/conversations/{id}` | 获取会话详情 | Bearer Token |
| DELETE | `/api/v1/conversations/{id}` | 删除会话 | Bearer Token |
| GET | `/api/v1/conversations/{id}/messages` | 获取会话消息（分页） | Bearer Token |

### 9.4 AI 模板模块 (AiTemplate) — 4 个端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/ai-templates` | 获取模板列表（分页、分类筛选） | Bearer Token |
| GET | `/api/v1/ai-templates/{id}` | 获取模板详情 | Bearer Token |
| POST | `/api/v1/ai-templates` | 创建自定义模板 | Bearer Token |
| PUT | `/api/v1/ai-templates/{id}` | 更新模板 | Bearer Token |

### 9.5 社区模块 (Community) — 5 个端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/community/posts` | 获取帖子列表（分页、搜索） | Bearer Token |
| POST | `/api/v1/community/posts` | 发布帖子 | Bearer Token |
| GET | `/api/v1/community/posts/{id}` | 获取帖子详情 | Bearer Token |
| POST | `/api/v1/community/posts/{id}/comments` | 发表评论 | Bearer Token |
| POST | `/api/v1/community/posts/{id}/like` | 点赞/取消点赞 | Bearer Token |

### 9.6 通知模块 (Notification) — 3 个端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/notifications` | 获取通知列表（分页） | Bearer Token |
| PUT | `/api/v1/notifications/{id}/read` | 标记通知已读 | Bearer Token |
| PUT | `/api/v1/notifications/read-all` | 全部标记已读 | Bearer Token |

### 9.7 项目模块 (Project) — 8 个端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/projects` | 获取项目列表 | Bearer Token |
| POST | `/api/v1/projects` | 创建项目 | Bearer Token |
| GET | `/api/v1/projects/{id}` | 获取项目详情 | Bearer Token |
| PUT | `/api/v1/projects/{id}` | 更新项目 | Bearer Token |
| DELETE | `/api/v1/projects/{id}` | 删除项目 | Bearer Token |
| GET | `/api/v1/projects/{id}/tasks` | 获取项目任务列表 | Bearer Token |
| POST | `/api/v1/projects/{id}/tasks` | 创建任务 | Bearer Token |
| PUT | `/api/v1/projects/{id}/tasks/{taskId}` | 更新任务状态 | Bearer Token |

### 9.8 数据看板模块 (Dashboard) — 3 个端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/dashboard/overview` | 获取使用概览统计 | Bearer Token |
| GET | `/api/v1/dashboard/usage-trend` | 获取使用趋势（日/周/月） | Bearer Token |
| GET | `/api/v1/dashboard/ai-stats` | 获取 AI 调用统计 | Bearer Token |

### 9.9 健康检查 (Health) — 1 个端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/v1/health` | 服务健康检查 | 无 |

### 9.10 AI 代理端点 — 4 个端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/ai/zhipu` | 智谱 GLM-5.1 对话（支持 SSE） | Bearer Token |
| POST | `/ai/coze` | 扣子 Coze 工作流执行 | Bearer Token |
| POST | `/ai/workbuddy` | WorkBuddy MCP 代码生成 | Bearer Token |
| POST | `/ai/trae` | Trae MCP 代码补全/审查 | Bearer Token |

---

## 10. 附录

### 10.1 项目目录结构

```
ai-mate/
├── main-app/                    # Vue 3 主应用壳 (qiankun 宿主)
│   ├── src/
│   │   ├── micro/               # 微前端注册与通信
│   │   ├── router/              # 主路由
│   │   ├── stores/              # Pinia 全局 Store
│   │   ├── components/          # 公共组件
│   │   ├── utils/               # 工具函数 (axios 封装等)
│   │   └── App.vue
│   ├── vite.config.ts
│   └── package.json
│
├── sub-apps/
│   ├── vue-user/                # 用户中心 (:3004)
│   ├── vue-community/           # 社区交流 (:3001)
│   ├── vue-resource/            # 资源中心 (:3002)
│   ├── vue-dashboard/           # 数据看板 (:3003)
│   ├── react-ai-chat/           # AI 对话 (:4001)
│   ├── react-bp-gen/            # 商业计划生成 (:4002)
│   └── react-collab/            # 协作评审 (:4003)
│
├── server/                      # SpringBoot 后端
│   ├── src/main/java/com/aimate/
│   │   ├── config/              # 配置类 (Security, JPA, CORS)
│   │   ├── controller/          # 控制器层
│   │   ├── service/             # 服务层
│   │   ├── repository/          # 数据访问层
│   │   ├── entity/              # JPA 实体
│   │   ├── dto/                 # 数据传输对象
│   │   ├── security/            # JWT 工具类 + 过滤器
│   │   └── exception/           # 全局异常处理
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/        # Flyway 数据库迁移脚本
│   └── pom.xml
│
├── ai-proxy/                    # Node.js AI 代理层 (:9000)
│   ├── src/
│   │   ├── routes/              # 路由 (zhipu, coze, workbuddy, trae)
│   │   ├── middleware/           # 中间件 (auth, rateLimit, promptGuard, contentFilter)
│   │   ├── services/            # 上游 API 封装
│   │   └── utils/               # 工具函数
│   ├── ecosystem.config.js      # PM2 配置
│   └── package.json
│
├── nginx/                       # Nginx 配置文件
│   └── ai-mate.conf
│
├── docker-compose.yml           # 本地开发环境编排
└── README.md
```

### 10.2 环境变量说明

**SpringBoot 后端 (application.yml)：**

| 变量 | 说明 | 示例 |
|------|------|------|
| `SERVER_PORT` | 服务端口 | `8080` |
| `MYSQL_HOST` | MySQL 地址 | `localhost:3306` |
| `MYSQL_DB` | 数据库名 | `ai_mate` |
| `MYSQL_USER` | 数据库用户 | `root` |
| `MYSQL_PASSWORD` | 数据库密码 | `******` |
| `JWT_SECRET` | JWT 签名密钥 | `base64-encoded-string` |
| `JWT_ACCESS_EXPIRATION` | Access Token 有效期 | `86400000` (24h) |
| `JWT_REFRESH_EXPIRATION` | Refresh Token 有效期 | `604800000` (7d) |

**AI 代理层 (.env)：**

| 变量 | 说明 | 示例 |
|------|------|------|
| `PORT` | 代理层端口 | `9000` |
| `ZHIPU_API_KEY` | 智谱 API Key | `******` |
| `COZE_API_KEY` | 扣子 API Key | `******` |
| `COZE_API_URL` | 扣子 API 地址 | `https://api.coze.cn/v3` |
| `WORKBUDDY_MCP_URL` | WorkBuddy MCP 地址 | `http://localhost:9100` |
| `TRAE_MCP_URL` | Trae MCP 地址 | `http://localhost:9101` |
| `BACKEND_AUTH_URL` | 后端认证校验地址 | `http://localhost:8080/api/v1/auth/verify` |
| `REDIS_URL` | Redis 地址（速率限制用） | `redis://localhost:6379` |

### 10.3 启动指南

**1. 环境准备**

```bash
# 必需工具
node >= 18.x    # 前端 + AI 代理层
java >= 17       # 后端
mysql >= 8.0     # 数据库
redis >= 7.0     # 速率限制（可选，开发环境可用内存模式）
nginx            # 反向代理
pm2              # 进程管理
```

**2. 数据库初始化**

```bash
# 创建数据库并执行迁移脚本
mysql -u root -p < server/src/main/resources/db/migration/V1__init.sql
```

**3. 启动后端服务**

```bash
cd server
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**4. 启动 AI 代理层**

```bash
cd ai-proxy
npm install
cp .env.example .env   # 编辑 .env 填入 API Key
pm2 start ecosystem.config.js
```

**5. 启动主应用和子应用**

```bash
# 主应用
cd main-app && npm install && npm run dev

# Vue 子应用（各终端）
cd sub-apps/vue-user && npm run dev      # :3004
cd sub-apps/vue-community && npm run dev # :3001
cd sub-apps/vue-resource && npm run dev  # :3002
cd sub-apps/vue-dashboard && npm run dev # :3003

# React 子应用
cd sub-apps/react-ai-chat && npm run dev   # :4001
cd sub-apps/react-bp-gen && npm run dev    # :4002
cd sub-apps/react-collab && npm run dev    # :4003
```

**6. 配置 Nginx 并启动**

```bash
sudo cp nginx/ai-mate.conf /etc/nginx/conf.d/
sudo nginx -t && sudo nginx -s reload
```

**7. 验证服务**

```bash
# 健康检查
curl https://ai-mate.example.com/api/v1/health
# 预期响应: {"code":200,"message":"success","data":"OK"}
```

---

> 本文档由郑州轻工业大学 AI Mate 技术团队维护，如有架构变更请及时更新。

### 10.4 团队介绍

依托郑州轻工业大学软件工程学院，软件工程为首批国家级一流本科专业建设点、河南省重点学科，拥有4个省级科研平台。

### 10.5 技术优势

学院在大数据智能理解、图像处理与智能应用等方面有深厚科研积累，计算机科学和工程学进入ESI全球排名前1%。
