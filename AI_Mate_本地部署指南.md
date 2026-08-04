# AI Mate 智创平台 - 本地部署指南

> 郑州轻工业大学 · 软件工程专业 · 中国国际大学生创新大赛参赛作品

---

## 一、项目概述

AI Mate（AI智创·创业赋能平台）是一个基于微前端架构（qiankun）的 AI 智能协作平台，专为"AI赋能一人公司"场景设计。平台包含 1 个主应用 + 7 个子应用 + 1 个后端服务。

### 技术栈

| 层级 | 技术 |
|------|------|
| 主应用 | Vue 3 + TypeScript + Naive UI + Pinia + qiankun |
| Vue 子应用 | Vue 3 + TypeScript + Vite + vite-plugin-qiankun |
| React 子应用 | React 18 + TypeScript + Vite + Ant Design + vite-plugin-qiankun |
| 后端 | Spring Boot 3 + Java 17 + MySQL 8 + JWT |
| 微前端 | qiankun 2.x + serverless-proxy |

### 服务架构

| 服务 | 端口 | 说明 |
|------|------|------|
| main-app | 3000 | 主应用（qiankun 基座） |
| vue-community | 3001 | 社区子应用 |
| vue-resource | 3002 | 资源中心子应用 |
| vue-dashboard | 3003 | 管理看板子应用 |
| vue-user | 3004 | 用户中心子应用 |
| react-ai-chat | 4001 | AI 智聊子应用（探路者/军师/工匠/管家） |
| react-bp-gen | 4002 | 方案生成子应用 |
| react-collab | 4003 | 协作空间子应用 |
| backend | 8080 | Spring Boot 后端 API |
| serverless-proxy | 9000 | AI 接口代理 |

---

## 二、环境要求

| 软件 | 版本要求 | 检查命令 |
|------|----------|----------|
| Node.js | >= 18.x | `node -v` |
| npm | >= 9.x | `npm -v` |
| Java JDK | 17 | `java -version` |
| Maven | >= 3.6 | `mvn -version` |
| MySQL | 8.0 | `mysql --version` |
| Git | 任意版本 | `git --version` |

**系统要求：**
- 操作系统：Windows 10/11、macOS 12+、Ubuntu 20.04+
- 内存：至少 8GB RAM（推荐 16GB）
- 磁盘：至少 5GB 可用空间

---

## 三、快速启动（一键脚本）

如果你已经安装好上述环境，可以直接使用一键启动脚本。在项目根目录下创建 `start.sh` 文件：

```bash
#!/bin/bash
# AI Mate 一键启动脚本

set -e
echo "🚀 正在启动 AI Mate 平台..."

# 1. 启动 MySQL
echo "📊 检查 MySQL..."
mysqladmin ping -h localhost -u root --silent 2>/dev/null || {
  echo "❌ MySQL 未运行，请先启动 MySQL 服务"
  exit 1
}

# 2. 初始化数据库
echo "💾 初始化数据库..."
mysql -u root -p"$MYSQL_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS ai_mate DEFAULT CHARACTER SET utf8mb4;" 2>/dev/null
mysql -u root -p"$MYSQL_PASSWORD" ai_mate < backend/src/main/resources/schema.sql 2>/dev/null
mysql -u root -p"$MYSQL_PASSWORD" ai_mate < backend/src/main/resources/data.sql 2>/dev/null

# 3. 启动后端
echo "⚙️  启动后端服务..."
cd backend && mvn spring-boot:run -q > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

# 4. 等待后端就绪
echo "⏳  等待后端启动..."
for i in $(seq 1 30); do
  curl -s http://localhost:8080/api/auth/login > /dev/null 2>&1 && break
  sleep 2
done

# 5. 启动前端服务
echo "🌐  启动前端服务..."

# serverless-proxy
cd serverless-proxy && PORT=9000 npm start > ../logs/proxy.log 2>&1 &

# Vue 子应用
cd ../vue-community && npm run dev > ../logs/vue-community.log 2>&1 &
cd ../vue-resource && npm run dev > ../logs/vue-resource.log 2>&1 &
cd ../vue-dashboard && npm run dev > ../logs/vue-dashboard.log 2>&1 &
cd ../vue-user && npm run dev > ../logs/vue-user.log 2>&1 &

# React 子应用
cd ../react-ai-chat && npm run dev > ../logs/react-ai-chat.log 2>&1 &
cd ../react-bp-gen && npm run dev > ../logs/react-bp-gen.log 2>&1 &
cd ../react-collab && npm run dev > ../logs/react-collab.log 2>&1 &

# 主应用（最后启动）
cd ../main-app && npm run dev > ../logs/main-app.log 2>&1 &

echo ""
echo "✅ AI Mate 平台启动完成！"
echo "🔗 访问地址: http://localhost:3000"
echo "🔑 测试账号: test@aimate.com / Test1234"
```

运行方式：

```bash
chmod +x start.sh
./start.sh
```

---

## 四、详细部署步骤

### 4.1 获取项目代码

```bash
git clone <项目仓库地址>
cd ai-mate
```

### 4.2 安装前端依赖

在项目根目录执行：

```bash
# 安装主应用依赖
cd main-app && npm install

# 安装 Vue 子应用依赖
cd ../vue-community && npm install
cd ../vue-resource && npm install
cd ../vue-dashboard && npm install
cd ../vue-user && npm install

# 安装 React 子应用依赖
cd ../react-ai-chat && npm install
cd ../react-bp-gen && npm install
cd ../react-collab && npm install

# 安装代理服务依赖
cd ../serverless-proxy && npm install
```

### 4.3 配置 MySQL 数据库

```sql
-- 登录 MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE IF NOT EXISTS ai_mate
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

EXIT;
```

```bash
# 导入表结构
mysql -u root -p ai_mate < backend/src/main/resources/schema.sql

# 导入初始数据
mysql -u root -p ai_mate < backend/src/main/resources/data.sql
```

### 4.4 配置后端数据库连接

编辑 `backend/src/main/resources/application.yml`，修改数据库连接信息：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/ai_mate?useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: 你的MySQL密码
```

### 4.5 启动后端服务

```bash
cd backend
mvn spring-boot:run
```

等待看到 `Started Application` 后，后端运行在 http://localhost:8080

### 4.6 启动前端服务

分别在**不同终端窗口**启动以下服务：

```bash
# 终端 1: serverless-proxy
cd serverless-proxy
PORT=9000 npm start

# 终端 2-5: Vue 子应用
cd vue-community && npm run dev    # 端口 3001
cd vue-resource && npm run dev     # 端口 3002
cd vue-dashboard && npm run dev    # 端口 3003
cd vue-user && npm run dev         # 端口 3004

# 终端 6-8: React 子应用
cd react-ai-chat && npm run dev    # 端口 4001
cd react-bp-gen && npm run dev     # 端口 4002
cd react-collab && npm run dev     # 端口 4003

# 终端 9: 主应用（最后启动）
cd main-app && npm run dev         # 端口 3000
```

---

## 五、访问验证

### 5.1 登录系统

| 项目 | 值 |
|------|-----|
| 访问地址 | http://localhost:3000 |
| 测试邮箱 | test@aimate.com |
| 测试密码 | Test1234 |
| 用户角色 | USER |

### 5.2 功能验证清单

| 模块 | 路由 | 验证内容 |
|------|------|----------|
| 登录 | `/login` | 邮箱+密码登录，跳转到主页 |
| 主页 | `/dashboard` | 显示欢迎页 + 4个AI数字员工卡片 |
| 探路者 | `/ai-chat?role=scout` | AI智聊界面，包含功能面板 |
| 军师AI对话 | `/ai-chat?role=sage` | AI智聊界面 |
| 军师策略台 | `/bp-gen` | 方案生成工作台 |
| 工匠AI对话 | `/ai-chat?role=maker` | AI智聊界面 |
| 工匠创作台 | `/collab` | 协作编辑工作台 |
| 管家AI对话 | `/ai-chat?role=butler` | AI智聊界面 |
| 管家看板 | `/dashboard` | 数据看板 |
| 资源中心 | `/resource` | 资源列表页 |
| 社区 | `/community` | 社区页面 |

---

## 六、常见问题

### Q1: 子应用加载空白

**原因**：qiankun 需要子应用以 UMD 格式导出生命周期函数，但 Vite 开发模式默认使用 ESM。

**解决**：确保所有子应用已安装 `vite-plugin-qiankun` 并在 `vite.config.ts` 中配置 `useDevMode: true`。

```bash
npm install vite-plugin-qiankun
```

```typescript
// vite.config.ts
import qiankun from "vite-plugin-qiankun"

plugins: [
  vue(), // 或 react()
  qiankun("app-name", { useDevMode: true })
],
```

### Q2: 端口被占用

```bash
# 查找占用端口的进程
lsof -i :3000        # macOS/Linux
netstat -ano | findstr :3000   # Windows

# 终止进程
kill -9 <PID>        # macOS/Linux
taskkill /PID <PID> /F   # Windows
```

### Q3: MySQL 连接失败

确保 MySQL 服务已启动，并检查 `application.yml` 中的用户名和密码是否正确。如果使用 MySQL 8.0，确保认证插件为 `mysql_native_password`：

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '你的密码';
FLUSH PRIVILEGES;
```

### Q4: 子应用资源加载失败 (CORS)

确保子应用的 `vite.config.ts` 中已配置 CORS headers：

```typescript
server: {
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
}
```

### Q5: npm install 缓慢或失败

建议使用淘宝镜像源：

```bash
npm config set registry https://registry.npmmirror.com
```

Maven 同理，配置阿里云镜像：

```xml
<!-- ~/.m2/settings.xml -->
<mirrors>
  <mirror>
    <id>aliyun</id>
    <mirrorOf>central</mirrorOf>
    <url>https://maven.aliyun.com/repository/central</url>
  </mirror>
</mirrors>
```

### Q6: Windows 用户注意事项

- 不能直接运行 `.sh` 脚本，请手动按步骤启动或使用 `start.bat`
- 需要在多个 CMD/PowerShell 窗口中分别启动各服务
- 建议使用 Windows Terminal 多标签功能方便管理
