<div align="center">

# AI Mate — AI 创业赋能平台

**面向大学生创业者与早期初创团队的全栈微前端智能体平台**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6.svg)](https://www.typescriptlang.org/)
[![Ant Design](https://img.shields.io/badge/Ant_Design-6-1677ff.svg)](https://ant.design/)
[![qiankun](https://img.shields.io/badge/qiankun-2.10-46c018.svg)](https://qiankun.umijs.org/)

</div>

---

## 项目简介

AI Mate 是一个为大学生创业者与早期初创团队打造的全栈智能体平台。采用 **qiankun 微前端架构**，聚合四大 AI 角色面板，为用户提供从想法验证到项目落地的全链路 AI 辅助。

平台核心理念：**让每一位创业者都拥有一支专属的 AI 团队**。

---

## 四大 AI 角色

| 角色 | 代号 | 职责 | 面板数 | 主题色 |
|:---:|:---:|------|:---:|:---:|
| 探路者AI | Scout | 资源对接专家 — 行业趋势、市场情报、竞品调研 | 4 | `#1677ff` |
| 军师AI | Sage | 运营策略顾问 — 需求分析、商业模式画布、风险矩阵、融资规划 | 4 | `#faad14` |
| 工匠AI | Maker | 内容创作专家 — BP生成、PPT大纲、原型Demo、项目脚手架 | 5 | `#52c41a` |
| 管家AI | Butler | 项目管家 — 任务看板、进度跟踪、资源对接、团队协作 | 4 | `#eb2f96` |

### 探路者AI — 洞察市场，发现机会

- **趋势洞察** — 行业趋势可视化分析，含 SVG 原生图表（雷达图、趋势曲线、热力仪表盘等）
- **市场分析** — 市场规模估算与增长预测，漏斗图 + 矩阵图多维展示
- **竞品调研** — 竞品对比矩阵，支持多维度评分
- **机会评估** — 创业机会量化评估，仪表盘可视化

### 军师AI — 运筹帷幄，辅助决策

- **需求分析** — AI 驱动的需求分析报告生成，自动提取项目信息
- **商业模式画布** — 9宫格可视化画布 + 幕布式思维导图双视图联动
  - 客户细分 / 价值主张 / 渠道通路 / 客户关系 / 收入来源 / 核心资源 / 关键业务 / 重要合作 / 成本结构
  - 支持无限层级树形结构、Tab/Shift+Tab 调整层级、拖拽排序、剪切/复制/粘贴
  - 三种布局切换（仅大纲 / 仅思维导图 / 左右分栏）
  - 多格式导出（文本 / 图片 / Markdown / 思维导图文件）
- **风险矩阵** — 2×2 象限可视化风险评估（概率×影响）
  - 自动读取需求分析报告 + 商业模式画布数据进行前瞻性风险识别
  - 四级风险分类（高风险 / 中高风险 / 中风险 / 低风险）
  - 象限网格与卡片清单联动，高风险脉动动画
  - 支持 PDF / Word / Markdown 三种格式导出
- **融资规划** — 融资阶段规划与预算分配

### 工匠AI — 创意落地，内容产出

- **BP 生成器** — 商业计划书智能生成，章节检查清单 + 实时预览卡片
- **PPT 大纲** — 演示文稿大纲生成，页数滑块 + 演讲计时器
- **原型 Demo** — 多平台原型预览展示
  - Web 网站：iframe 嵌入预览
  - 移动 APP / 小程序：二维码扫码
  - 桌面端：下载按钮
  - 其他平台：占位提示
- **项目脚手架** — 项目结构生成与代码模板
- **产品文档** — 产品说明文档自动生成

### 管家AI — 统筹管理，协作推进

- **任务看板** — 看板式任务管理，支持拖拽排序
- **进度跟踪** — 项目里程碑与进度可视化
- **资源对接** — 外部资源链接管理（GitHub / Gitee / 抖音 / 哔哩哔哩 / X / 小红书）
- **团队协作** — 协作空间与成员管理

---

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    主应用 (main-app)                      │
│            Vue 3 + qiankun 微前端容器                     │
│         路由分发 / 用户认证 / 子应用注册                    │
├─────────────┬───────────────────┬───────────────────────┤
│             │                   │                       │
│  ┌──────────▼──────────┐  ┌────▼─────┐  ┌──────────────▼──────────┐
│  │  react-ai-chat      │  │ react-bp │  │   react-collab           │
│  │  (核心 AI 对话应用)  │  │  -gen    │  │   (协作中心)              │
│  │                     │  │ (BP生成) │  │                          │
│  │  React 19 + Antd 6  │  └──────────┘  └─────────────────────────┘
│  │  Zustand + Immer    │
│  │  4 AI Roles × 17 面板│
│  └──────────┬──────────┘
│             │
│  ┌──────────▼──────────────────────────┐
│  │     serverless-proxy (API 代理层)    │
│  │   Express.js + JWT 鉴权             │
│  │   内容过滤 / 频率限制 / 提示词护栏    │
│  └──────────┬──────────────────────────┘
│             │
│  ┌──────────▼──────────────────────────┐
│  │     backend (后端服务)               │
│  │   Spring Boot 3.2.5 + Java 17       │
│  │   JPA + Security + JWT              │
│  │   MySQL / H2 数据库                  │
│  └─────────────────────────────────────┘
└─────────────────────────────────────────────────────────┘
```

---

## 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2 | UI 框架（核心 AI 应用） |
| Vue 3 | 3.4 | 主应用容器 |
| TypeScript | 6.0 | 类型安全 |
| Ant Design | 6.3 | UI 组件库 |
| Naive UI | 2.38 | Vue 主应用 UI |
| Zustand | 5.0 | 状态管理（+ Immer 中间件） |
| Pinia | 2.1 | Vue 主应用状态管理 |
| qiankun | 2.10 | 微前端框架 |
| Vite | 8.0 | 构建工具 |
| ECharts | 6.1 | 数据可视化 |
| Three.js | 0.185 | 3D 仪表盘 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Spring Boot | 3.2.5 | 后端框架 |
| Java | 17 | 运行时 |
| Spring Security | — | 认证鉴权 |
| Spring Data JPA | — | ORM |
| JWT (jjwt) | 0.12.5 | Token 认证 |
| MySQL / H2 | — | 数据库 |
| Springdoc OpenAPI | 2.5.0 | API 文档 |

### AI 服务

| 服务 | 用途 |
|------|------|
| 智谱 GLM | 主力大模型（支持流式输出 + 工具调用） |
| Coze | 对话编排 |
| 自定义模型 | 支持任意 OpenAI 兼容 API |

---

## 项目结构

```
program1/
├── ai-mate/
│   ├── ai-mate/                    # 微前端架构原始版本
│   │   ├── main-app/               # Vue 3 主应用（qiankun 容器）
│   │   ├── react-ai-chat/          # React AI 对话子应用
│   │   └── serverless-proxy/       # Express API 代理层
│   │
│   ├── react-ai-chat/              # 核心开发版本（主要迭代）
│   │   └── react-ai-chat/
│   │       ├── src/
│   │       │   ├── components/
│   │       │   │   ├── scout/      # 探路者AI（4面板）
│   │       │   │   ├── sage/       # 军师AI（4面板）
│   │       │   │   ├── maker/      # 工匠AI（5面板）
│   │       │   │   ├── butler/     # 管家AI（4面板）
│   │       │   │   ├── mindmap/    # 幕布式思维导图引擎
│   │       │   │   └── ...         # 通用组件
│   │       │   ├── pages/          # 页面路由
│   │       │   ├── services/       # API 服务层
│   │       │   ├── store/          # Zustand 状态管理
│   │       │   ├── i18n/           # 国际化（中/英）
│   │       │   └── types/          # TypeScript 类型定义
│   │       └── package.json
│   │
│   ├── backend/                    # Spring Boot 后端
│   │   ├── src/main/java/com/aimate/
│   │   │   ├── controller/         # REST 控制器
│   │   │   ├── entity/             # JPA 实体
│   │   │   ├── repository/         # 数据仓库
│   │   │   ├── dto/                # 数据传输对象
│   │   │   ├── config/             # 安全与跨域配置
│   │   │   └── exception/          # 全局异常处理
│   │   └── pom.xml
│   │
│   └── docs/                       # 项目文档
│       ├── api/                    # API 文档
│       ├── requirements/           # 需求文档
│       └── specs/                  # 技术规格
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## 核心特性

### AI 对话系统

- **多模型支持** — 智谱 GLM / Coze / 任意 OpenAI 兼容模型，支持运行时切换
- **流式输出** — Server-Sent Events 实时流式响应
- **工具调用** — 内置 web_search / fetch_url / current_time 工具，支持 function calling
- **多模态** — 支持图文混合输入

### Skill 库系统

- 内置丰富技能（分析 / 写作 / 编码 / 营销 / 知识 / 办公 / 设计 / 金融 / 产品 / 自动化）
- 支持动态添加自定义 Skill
- `/` 命令触发 + 显式 Skill 按钮双入口
- localStorage 持久化（`ai_mate_skills_v1`）

### 数据链路联动

```
需求分析报告 ──→ 商业模式画布 ──→ 风险矩阵
     ↓                ↓               ↓
  localStorage    localStorage    localStorage
 (自动读取)      (自动读取)      (自动读取)
```

三大面板间数据自动流转，上游数据自动作为下游输入，无需手动复制。

### 幕布式思维导图

- 无限层级树形结构
- 双视图联动（大纲文本 ↔ 思维导图）
- 键盘快捷键（Tab/Shift+Tab 调层级，上下方向键导航）
- 拖拽排序与层级调整
- 剪切 / 复制 / 粘贴
- 富文本编辑（备注 / 标签 / 颜色标记 / 勾选状态）
- 三种布局模式（仅大纲 / 仅思维导图 / 左右分栏）
- 多格式导出（文本 / 图片 / Markdown / 思维导图文件）

### 暗色 / 亮色双主题

每个 AI 角色拥有独立的主题色系与动画风格：
- 探路者AI：科技蓝，卡片流式入场
- 军师AI：案牍书院风，衬线字体 + 印章动效 + 宣纸纹理
- 工匠AI：自然绿，渐变进度条
- 管家AI：玫瑰粉，柔和过渡

---

## 快速开始

### 环境要求

- Node.js >= 18
- Java 17
- Maven 3.8+
- MySQL 8.0+（或使用 H2 内存数据库）

### 1. 启动核心 AI 应用

```bash
cd ai-mate/react-ai-chat/react-ai-chat
npm install
npm run dev
# → http://localhost:5174/
```

### 2. 启动 API 代理层（可选）

```bash
cd ai-mate/ai-mate/serverless-proxy
npm install
cp .env.example .env  # 配置 API Key
npm run dev
# → http://localhost:3000/api
```

### 3. 启动后端服务（可选）

```bash
cd ai-mate/backend
mvn spring-boot:run
# → http://localhost:8080
```

### 4. 启动微前端主应用（可选）

```bash
cd ai-mate/ai-mate/main-app
npm install
npm run dev
# → http://localhost:5173/
```

> 核心AI应用可独立运行，无需后端。数据通过 localStorage 持久化。

---

## 模型配置

在应用内打开 **设置 → 模型** 面板进行配置：

1. 选择预设模型（智谱 GLM / Coze）或自定义模型
2. 填入 API Key 和 Base URL
3. 配置上下文窗口大小（输入/输出 token 限制）
4. 设置工具调用轮次
5. 启用/禁用多模态支持

模型配置持久化到 localStorage，支持多模型管理与一键切换。

---

## 国际化

支持中文（zh-CN）和英文（en）双语界面，通过 `src/i18n/` 目录管理。

---

## 测试

```bash
cd ai-mate/react-ai-chat/react-ai-chat
npm run test:run    # 单次运行
npm run test        # watch 模式
```

测试覆盖：
- 思维导图树操作（tree-ops）
- 思维导图布局算法（layout）
- 序列化/反序列化（serialization）
- 剪贴板操作（clipboard）
- Zustand Store（useMindMapStore）

---

## 项目文档

| 文档 | 说明 |
|------|------|
| [AI_Mate_系统架构文档.md](AI_Mate_系统架构文档.md) | 系统架构设计 |
| [AI_Mate_可行性分析报告.md](AI_Mate_可行性分析报告.md) | 项目可行性分析 |
| [AI_Mate_本地部署指南.md](AI_Mate_本地部署指南.md) | 详细部署指南 |
| [AI Mate Skill 集成方案.md](AI%20Mate%20Skill%20集成方案.md) | Skill 库集成方案 |

---

## 开发规范

- **状态管理**：使用 Zustand + Immer，选择器提取稳定引用避免无限循环
- **UI 组件**：Ant Design v6 + 原生 SVG/CSS，不引入额外图表库
- **图标**：遵循 `@ant-design/icons` v6 规范
- **类型安全**：TypeScript `verbatimModuleSyntax` + `erasableSyntaxOnly`
- **数据持久化**：统一使用 localStorage，Key 前缀 `ai-mate-`
- **测试驱动**：核心逻辑先行 TDD，Vitest + React Testing Library

---

## License

[MIT License](LICENSE) © 2026 PUP-Skyer

---

<div align="center">

**如果这个项目对你有帮助，欢迎 Star 支持！**

</div>
