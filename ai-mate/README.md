# 青宸智汇 v1.0.0 — AI智创·创业赋能平台

> OPC创业者的智能创业伙伴——基于大模型与Agent技术的一人公司资源对接与运营赋能平台

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](./CHANGELOG.md)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-green)](https://spring.io/projects/spring-boot)
[![Vue](https://img.shields.io/badge/Vue-3.4-green)](https://vuejs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![License](https://img.shields.io/badge/license-MIT-yellow)](./LICENSE)

## 项目简介

青宸智汇 是面向一人公司（OPC）创业者的智能化创业赋能平台。平台整合四大AI数字员工（探路者、军师、工匠、管家），提供从资源对接、策略规划、内容生产到客户运营的全链路创业支持。采用微前端架构，支持模块化独立开发与部署。

### 核心能力

| AI数字员工 | 定位 | 核心能力 |
|-----------|------|---------|
| 探路者 (Scout) | 智能资源对接 | 市场行情分析、行业报告查询、供应商搜索、合作伙伴推荐 |
| 军师 (Sage) | 智能运营策略 | 竞品分析、阶段规划、项目建议、工具栈推荐 |
| 工匠 (Maker) | 内容生产自动化 | 商业计划书生成、代码开发辅助、内容创作 |
| 管家 (Butler) | 客户服务自动化 | 项目管理、FAQ管理、问题反馈、售后咨询 |

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Web端   │ │ 移动端   │ │ 小程序   │ │ H5页面   │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
└───────┼────────────┼────────────┼────────────┼──────────────┘
        │            │            │            │
        └────────────┴──────┬─────┴────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      接入层 (Nginx)                          │
│         反向代理 · 负载均衡 · 静态资源 · SSL终结              │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    前端主应用壳                                │
│              Vue 3 + Vite + TypeScript + qiankun             │
│                   端口: 3000                                  │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    微前端子应用                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ vue-     │ │ vue-     │ │ vue-     │ │ vue-     │       │
│  │ community│ │ resource │ │dashboard │ │  user    │       │
│  │  :3001   │ │  :3002   │ │  :3003   │ │  :3004   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ react-   │ │ react-   │ │ react-   │                    │
│  │ ai-chat  │ │ bp-gen   │ │ collab   │                    │
│  │  :4001   │ │  :4002   │ │  :4003   │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    后端服务层 (Spring Boot)                   │
│         RESTful API · JWT认证 · 业务逻辑 · 数据访问           │
│                    端口: 8080                                 │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI代理层 (Node.js)                         │
│    智谱GLM · 扣子Coze · WorkBuddy MCP · Trae MCP            │
│         端口: 9000 · SSE流式输出 · Prompt防护                │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据层                                  │
│                   MySQL 8.0 · Redis(可选)                    │
└─────────────────────────────────────────────────────────────┘
```

## 技术栈

| 层级 | 技术选型 | 版本 |
|------|---------|------|
| **前端主应用** | Vue 3 + Vite + TypeScript + Naive UI + Pinia | Vue 3.4+ |
| **Vue子应用** | vue-community / vue-resource / vue-dashboard / vue-user | Vue 3.4+ |
| **React子应用** | react-ai-chat / react-bp-gen / react-collab | React 19+ |
| **微前端框架** | qiankun | 2.10+ |
| **后端服务** | Spring Boot | 3.2.5 |
| **数据库** | MySQL | 8.0+ |
| **AI代理层** | Node.js + Express | 18+ |
| **大模型** | 智谱 GLM-5.1 / 扣子 Coze | - |
| **反向代理** | Nginx | - |

## 项目目录结构

```
ai-mate/
├── main-app/                 # Vue 3 主应用壳 (端口 3000)
│   ├── src/
│   │   ├── layouts/          # 布局组件
│   │   ├── views/            # 页面视图
│   │   ├── router/           # 路由配置
│   │   ├── stores/           # Pinia状态管理
│   │   ├── micro/            # qiankun微前端配置
│   │   └── api/              # API接口封装
│   ├── vite.config.ts
│   └── package.json
│
├── vue-community/            # 创业社区 (端口 3001)
│   ├── src/views/            # 帖子列表、帖子详情、创建帖子
│   └── vite.config.ts
│
├── vue-resource/             # 创业资源中心 (端口 3002)
│   ├── src/views/            # 资源列表、资源详情、搜索
│   └── vite.config.ts
│
├── vue-dashboard/            # 数据看板 (端口 3003)
│   ├── src/views/            # 总览、反馈管理、FAQ管理、用户增长、AI使用
│   └── vite.config.ts
│
├── vue-user/                 # 用户中心 (端口 3004)
│   ├── src/views/            # 个人资料、创业档案、会员、安全、订单
│   └── vite.config.ts
│
├── react-ai-chat/            # 四大AI数字员工对话 (端口 4001)
│   ├── src/pages/            # AI对话页面、管家AI面板
│   ├── src/components/       # 聊天组件、功能面板
│   └── vite.config.ts
│
├── react-bp-gen/             # 商业计划书生成器 (端口 4002)
├── react-collab/             # 实时协作编辑器 (端口 4003)
│
├── backend/                  # Spring Boot 后端 (端口 8080)
│   ├── src/main/java/com/aimate/
│   │   ├── controller/       # API控制器 (9个)
│   │   ├── service/          # 业务逻辑层
│   │   ├── entity/           # 数据实体 (17个)
│   │   ├── repository/       # 数据访问层
│   │   ├── security/         # JWT安全认证
│   │   └── config/           # 配置类
│   └── src/main/resources/
│       ├── schema.sql        # 数据库建表脚本
│       ├── data.sql          # 种子数据
│       └── application.yml   # 应用配置
│
├── serverless-proxy/         # AI代理层 (端口 9000)
│   ├── middleware/           # 安全中间件
│   ├── config/               # AI服务配置
│   └── utils/                # Prompt模板工具
│
├── nginx/                    # Nginx 反向代理配置
│   └── default.conf
│
├── docs/                     # 项目文档
│   ├── api/                  # API接口文档
│   ├── requirements/         # 需求文档
│   └── specs/                # 技术规格文档
│
├── start-all.ps1             # 一键启动脚本 (PowerShell)
├── stop-all.ps1              # 一键停止脚本
└── README.md                 # 项目说明文档
```

## 环境要求

| 依赖 | 最低版本 | 说明 |
|------|---------|------|
| Node.js | >= 18 | 前端运行环境 |
| Java | >= 17 | 后端运行环境 |
| Maven | >= 3.8 | Java构建工具 |
| MySQL | >= 8.0 | 关系型数据库 |
| Nginx | - | 生产环境反向代理 |

## 快速开始

### 方式一：一键启动（推荐开发环境）

```powershell
# 使用 PowerShell 执行一键启动脚本
cd ai-mate
powershell -ExecutionPolicy Bypass -File ".\start-all.ps1"
```

启动完成后访问：http://localhost:3000

测试账号：`test@aimate.com` / `Test1234`

### 方式二：手动分步启动

#### 1. 初始化数据库

```bash
# 登录MySQL，创建数据库并执行建表脚本
mysql -u root -p

# 在MySQL中执行
CREATE DATABASE IF NOT EXISTS ai_mate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 导入建表脚本和种子数据
mysql -u root -p ai_mate < backend/src/main/resources/schema.sql
mysql -u root -p ai_mate < backend/src/main/resources/data.sql
```

> **注意**：`data.sql` 包含社区帖子种子数据，依赖用户ID=1。请先注册一个用户，或修改帖子中的 `user_id` 为实际用户ID。

#### 2. 配置后端数据库连接

编辑 `backend/src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/ai_mate?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: root          # 修改为你的MySQL用户名
    password: your_password # 修改为你的MySQL密码
```

#### 3. 启动后端服务

```bash
cd backend
mvn spring-boot:run
```

后端默认监听 `http://localhost:8080`
API文档：`http://localhost:8080/swagger-ui.html`

#### 4. 启动AI代理层（可选，如需AI对话功能）

```bash
cd serverless-proxy
cp .env.example .env
# 编辑 .env 文件，填入你的 AI API Key
npm install
npm start
```

代理层默认监听 `http://localhost:9000`

#### 5. 启动前端服务

```bash
# 启动主应用
cd main-app
npm install
npm run dev

# 在独立终端中启动Vue子应用
cd vue-community && npm install && npm run dev
cd vue-resource && npm install && npm run dev
cd vue-dashboard && npm install && npm run dev
cd vue-user && npm install && npm run dev

# 在独立终端中启动React子应用
cd react-ai-chat && npm install && npm run dev
cd react-bp-gen && npm install && npm run dev
cd react-collab && npm install && npm run dev
```

#### 6. 访问平台

| 服务 | 开发环境地址 | 说明 |
|------|-------------|------|
| 主应用 | http://localhost:3000 | 统一入口 |
| 社区 | http://localhost:3001 | 可独立运行 |
| 资源中心 | http://localhost:3002 | 可独立运行 |
| 数据看板 | http://localhost:3003 | 可独立运行 |
| 用户中心 | http://localhost:3004 | 可独立运行 |
| AI智聊 | http://localhost:4001 | 可独立运行 |
| 后端API | http://localhost:8080 | RESTful API |
| AI代理层 | http://localhost:9000 | AI服务代理 |

## 生产部署

### Nginx 配置

```bash
# 复制Nginx配置文件
sudo cp nginx/default.conf /etc/nginx/conf.d/ai-mate.conf

# 测试配置并重新加载
sudo nginx -t && sudo nginx -s reload
```

生产环境统一访问入口：`http://localhost`

### 构建生产包

```bash
# 构建主应用
cd main-app && npm run build

# 构建Vue子应用
cd vue-community && npm run build
cd vue-resource && npm run build
cd vue-dashboard && npm run build
cd vue-user && npm run build

# 构建React子应用
cd react-ai-chat && npm run build
cd react-bp-gen && npm run build
cd react-collab && npm run build

# 构建后端
cd backend && mvn clean package
```

## API 接口文档

### 认证模块 `/api/auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/refresh` | 刷新Token |

### 用户模块 `/api/user`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/user/info` | 获取用户信息 |
| GET | `/api/user/profile` | 获取用户画像 |
| PUT | `/api/user/profile` | 更新用户画像 |
| PUT | `/api/user/startup-profile` | 更新创业档案 |

### 对话模块 `/api/conversations`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/conversations` | 获取对话列表 |
| POST | `/api/conversations` | 创建对话 |
| GET | `/api/conversations/{id}` | 获取对话详情 |
| DELETE | `/api/conversations/{id}` | 删除对话 |
| PUT | `/api/conversations/{id}/title` | 修改对话标题 |

### 社区模块 `/api/community`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/community/posts` | 获取帖子列表 |
| GET | `/api/community/posts/{id}` | 获取帖子详情 |
| POST | `/api/community/posts` | 发布帖子 |
| POST | `/api/community/posts/{id}/comments` | 发表评论 |
| POST | `/api/community/posts/{id}/like` | 点赞/取消点赞 |
| GET | `/api/community/posts/search` | 搜索帖子 |

### 项目管理 `/api/projects`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects` | 获取项目列表 |
| POST | `/api/projects` | 创建项目 |
| GET | `/api/projects/{id}` | 获取项目详情 |
| PUT | `/api/projects/{id}` | 更新项目 |
| DELETE | `/api/projects/{id}` | 删除项目 |
| POST | `/api/projects/{id}/tasks` | 添加任务 |

### AI代理层 `/ai/`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/ai/zhipu` | 智谱GLM对话（支持SSE流式） |
| POST | `/ai/coze` | 扣子Coze Agent对话 |
| POST | `/ai/workbuddy` | WorkBuddy MCP调用 |
| POST | `/ai/trae` | Trae MCP调用 |

## 数据库表结构

| 表名 | 说明 | 关联 |
|------|------|------|
| users | 用户表 | - |
| user_profiles | 用户画像表 | users |
| memberships | 会员表 | users |
| conversations | 对话表 | users |
| messages | 消息表 | conversations |
| knowledge_bases | 知识库表 | users |
| knowledge_documents | 知识库文档表 | knowledge_bases |
| projects | 项目表 | users |
| project_tasks | 项目任务表 | projects |
| ai_templates | AI模板表 | - |
| user_favorites | 用户收藏表 | users |
| usage_logs | 使用记录表 | users |
| feedback | 用户反馈表 | users |
| notifications | 通知表 | users |
| system_configs | 系统配置表 | - |
| community_posts | 社区帖子表 | users |
| community_comments | 社区评论表 | users, community_posts |

## 安全架构

```
客户端 → Nginx → SpringBoot后端 → AI代理层 → 外部AI服务
         │            │               │
         │        JWT双Token       API Key隔离
         │        BCrypt密码        Prompt防护
         │        数据加密存储       内容过滤
      反向代理      限流控制          速率限制
```

### 安全措施

| 层级 | 措施 | 说明 |
|------|------|------|
| API Key隔离 | 环境变量存储 | AI服务密钥仅存储在serverless-proxy中 |
| 认证机制 | JWT双Token | Access Token(2h) + Refresh Token(7d) |
| 密码安全 | BCrypt加密 | 单向哈希存储 |
| Prompt防护 | 三层过滤 | 输入净化 + 系统提示隔离 + 输出过滤 |
| 速率限制 | 滑动窗口 | 智谱/Coze: 30req/min, MCP: 20req/min |
| 数据安全 | AES-256加密 | 敏感用户数据加密存储 |

## 功能模块清单

| 模块 | 说明 | 技术框架 | 状态 |
|------|------|---------|------|
| 探路者AI (Scout) | 智能资源对接：市场行情、行业报告、供应商搜索、合作伙伴推荐 | React | v1.0 |
| 军师AI (Sage) | 智能运营策略：竞品分析、阶段规划、项目建议、工具栈推荐 | React | v1.0 |
| 工匠AI (Maker) | 内容生产自动化：BP生成、代码开发、内容创作 | React | v1.0 |
| 管家AI (Butler) | 客户服务自动化：项目管理、FAQ管理、问题反馈、售后咨询 | React | v1.0 |
| 创业社区 | 交流分享互助：帖子发布、评论互动、点赞收藏 | Vue | v1.0 |
| 资源中心 | 政策/资金/工具/人脉资源浏览与搜索 | Vue | v1.0 |
| 数据看板 | 运营数据可视化：总览、用户增长、AI使用统计 | Vue | v1.0 |
| 用户中心 | 个人信息管理、创业档案、会员服务、安全设置 | Vue | v1.0 |

## 开发指南

### 子应用独立开发

每个子应用都可以独立开发和运行，不依赖主应用：

```bash
# 以react-ai-chat为例
cd react-ai-chat
npm install
npm run dev      # 独立运行在 http://localhost:4001
```

### qiankun 微前端接入

子应用通过 `vite-plugin-qiankun` 接入微前端：

```typescript
// vite.config.ts
import qiankun from 'vite-plugin-qiankun'

export default {
  plugins: [
    qiankun('app-name', { useDevMode: true })
  ],
  server: {
    port: 3001,
    cors: true
  }
}
```

### 添加新API接口

1. 在 `backend/src/main/java/com/aimate/controller/` 添加Controller
2. 在 `backend/src/main/java/com/aimate/service/` 添加Service
3. 在 `backend/src/main/java/com/aimate/entity/` 添加Entity（如需新表）
4. 在 `backend/src/main/java/com/aimate/repository/` 添加Repository

## 常见问题排查

### Q1: 前端启动报端口被占用

```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# 或使用一键停止脚本
powershell -ExecutionPolicy Bypass -File ".\stop-all.ps1"
```

### Q2: 后端启动报8080端口被占用

```bash
# 查找占用进程
netstat -ano | findstr :8080

# 终止进程
taskkill /F /PID <PID>
```

### Q3: 数据库连接失败

- 检查MySQL服务是否启动：`Get-Service MySQL80`
- 检查 `application.yml` 中的数据库配置
- 确认数据库 `ai_mate` 已创建
- 检查MySQL用户权限

### Q4: 子应用加载白屏

- 检查子应用是否正常启动（端口监听）
- 检查浏览器控制台是否有跨域错误
- 确认 `vite.config.ts` 中已配置 `cors: true`

### Q5: AI对话无响应

- 检查 `serverless-proxy` 是否已启动
- 检查 `.env` 文件中的API Key是否配置正确
- 查看代理层日志确认请求是否到达

## 更新日志

### v1.0.0 (2026-07-30)

- 完成四大AI数字员工模块（探路者、军师、工匠、管家）
- 完成Vue子应用（社区、资源、看板、用户中心）
- 完成React子应用（AI对话、BP生成、协作编辑）
- 完成Spring Boot后端（9个Controller，46个API端点）
- 完成AI代理层（智谱/Coze/WorkBuddy/Trae四通道）
- 完成数据库设计（17张表，含种子数据）
- 完成安全架构（JWT认证、Prompt防护、速率限制）
- 完成Nginx反向代理配置

## 文档索引

| 文档 | 路径 | 说明 |
|------|------|------|
| API文档 | `docs/api/` | 各模块API接口详细说明 |
| 需求文档 | `docs/requirements/` | 功能需求规格说明 |
| 技术规格 | `docs/specs/` | 技术实现方案 |
| 部署指南 | `AI_Mate_本地部署指南.md` | 详细的本地部署步骤 |
| 系统架构 | `AI_Mate_系统架构文档.md` | 整体架构设计说明 |
| 可行性分析 | `AI_Mate_可行性分析报告.md` | 项目可行性研究报告 |

## 贡献指南

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -am 'Add some feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证，详见 [LICENSE](./LICENSE) 文件。

## 联系方式

- 项目文档：`docs/` 目录
- 问题反馈：通过平台内"问题反馈"功能提交
- 技术支持：青宸智汇 管家AI模块

---

> **青宸智汇 v1.0.0** — 让创业更简单，让AI更懂你。
