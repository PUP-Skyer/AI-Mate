# 青宸智汇 Serverless Proxy

AI API 统一代理层，负责转发前端请求至各AI服务，并提供安全防护能力。

## 架构概览

```
React前端 --> Serverless Proxy --> 智谱GLM-5.1
                          --> Coze API
                          --> WorkBuddy MCP
                          --> Trae MCP
```

## 功能特性

- **API代理转发**：统一转发请求至智谱、Coze、WorkBuddy、Trae等AI服务
- **JWT认证**：Token验证中间件，保障API安全
- **Prompt注入防护**：输入净化 + 系统提示隔离 + 输出过滤
- **内容安全审核**：敏感词过滤 + 个人信息脱敏
- **速率限制**：基于滑动窗口的请求频率控制

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入实际的API Key
```

### 3. 启动服务

```bash
# 开发模式（文件变更自动重启）
npm run dev

# 生产模式
npm start
```

服务启动后访问 `http://localhost:3000/health` 验证。

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /health | 健康检查 |
| POST | /ai/zhipu | 转发至智谱GLM API |
| POST | /ai/coze | 转发至Coze API |
| POST | /ai/workbuddy | 转发至WorkBuddy MCP |
| POST | /ai/trae | 转发至Trae MCP |

### 请求示例

```bash
# 智谱GLM对话
curl -X POST http://localhost:3000/ai/zhipu \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "你好"}],
    "system_prompt": "你是探路者AI",
    "stream": false
  }'

# Coze对话
curl -X POST http://localhost:3000/ai/coze \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "你好"}],
    "user_id": "user-001",
    "stream": false
  }'
```

## 中间件说明

| 中间件 | 文件 | 功能 |
|--------|------|------|
| JWT认证 | middleware/auth.js | 验证请求中的JWT Token |
| Prompt防护 | middleware/promptGuard.js | 检测并防御Prompt注入攻击 |
| 内容过滤 | middleware/contentFilter.js | 敏感词过滤与个人信息脱敏 |
| 速率限制 | middleware/rateLimiter.js | 滑动窗口请求频率控制 |

## 安全配置

通过环境变量控制安全策略的严格程度：

- `PROMPT_GUARD_MODE`：`reject`（拒绝请求）/ `sanitize`（净化内容）/ `log`（仅记录）
- `CONTENT_FILTER_MODE`：同上
- `JWT_SECRET`：JWT签名密钥，生产环境务必修改

## 部署

### 本地部署

```bash
npm install
cp .env.example .env
npm start
```

### Serverless部署（以阿里云函数计算为例）

1. 安装 Serverless Devs 工具
2. 配置 s.yaml 文件
3. 执行 `s deploy` 部署

### Docker部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

## 项目结构

```
serverless-proxy/
├── index.js                 # 入口文件，Express服务
├── package.json             # 项目依赖
├── .env.example             # 环境变量模板
├── README.md                # 说明文档
├── config/
│   └── aiConfig.js          # AI API配置
├── middleware/
│   ├── auth.js              # JWT认证中间件
│   ├── promptGuard.js       # Prompt注入防护
│   ├── contentFilter.js     # 内容安全审核
│   └── rateLimiter.js       # 速率限制
└── utils/
    └── promptTemplate.js    # 系统提示模板
```
