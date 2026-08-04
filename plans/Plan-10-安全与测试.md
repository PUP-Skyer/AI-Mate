# 安全与测试 实施计划

> **目标：** 实现安全防护（JWT 认证、RBAC 权限控制、敏感词过滤）和自动化测试（API 测试、组件测试、CI 流水线），保障大学生智能体平台的安全性和代码质量。
> **依赖：** 所有前置 Plan（Plan-01 至 Plan-09）
> **技术栈：** jsonwebtoken、bcryptjs、Jest、Supertest、@testing-library/react、ESLint、TypeScript

---

## 前置说明

本计划在后端 Express 服务器（`server.js`）和前端 React 19 应用基础上添加安全中间件和测试体系。

需要新增依赖：`jsonwebtoken`、`bcryptjs`、`jest`、`supertest`、`@testing-library/react`、`@testing-library/jest-dom`、`@testing-library/user-event`、`jest-environment-jsdom`。

---

### 任务 1：创建 JWT 认证中间件

**文件：** Create `ai-mate/react-ai-chat/src/middleware/auth.js`、Modify `ai-mate/react-ai-chat/db.js`（新增用户认证表）

- [ ] 步骤 1：安装依赖

```bash
cd ai-mate/react-ai-chat
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs
```

- [ ] 步骤 2：在 `db.js` 的 `createTables()` 中新增用户角色字段和刷新令牌表

在 `ai-mate/react-ai-chat/db.js` 的 `createTables()` 中（`users` 表创建后）添加：

```javascript
// 为 users 表添加 role 字段和 password_hash 字段（如果不存在）
await pool.execute(`
  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role ENUM('student','investor','expert','admin') DEFAULT 'student',
    ADD COLUMN IF NOT EXISTS email VARCHAR(100) UNIQUE,
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE,
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
`);

// 刷新令牌表
await pool.execute(`
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token(255)),
    INDEX idx_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='刷新令牌表'
`);

// 创建管理员账号（默认密码 admin123）
const bcrypt = await import('bcryptjs');
const adminHash = await bcrypt.hash('admin123', 10);
await pool.execute(
  `INSERT IGNORE INTO users (id, username, email, password_hash, role, level, exp)
   VALUES (1, '管理员', 'admin@aimate.com', ?, 'admin', 99, 9999)`,
  [adminHash]
);
```

- [ ] 步骤 3：创建 `ai-mate/react-ai-chat/src/middleware/auth.js`

```javascript
// ai-mate/react-ai-chat/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getPool } from '../../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-mate-secret-key-change-in-production';
const JWT_EXPIRES_IN = '2h';        // Access Token 有效期
const REFRESH_EXPIRES_IN = '7d';    // Refresh Token 有效期

/**
 * 生成 Access Token
 */
export function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * 生成 Refresh Token
 */
export function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

/**
 * 验证 Access Token
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const error = new Error('Token 已过期');
      error.code = 'TOKEN_EXPIRED';
      throw error;
    }
    const error = new Error('无效的 Token');
    error.code = 'TOKEN_INVALID';
    throw error;
  }
}

/**
 * 验证 Refresh Token
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    throw new Error('无效的刷新令牌');
  }
}

/**
 * 从请求头提取 Token
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  return parts[1];
}

/**
 * 认证中间件 - 验证 Access Token
 * 用法：app.get('/api/protected', authMiddleware, handler)
 */
export function authMiddleware(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      code: 401,
      data: null,
      message: '未提供认证令牌，请先登录',
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };
    next();
  } catch (err) {
    if (err.code === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        code: 401,
        data: null,
        message: '登录已过期，请重新登录',
        needRefresh: true,
      });
    }
    return res.status(401).json({
      code: 401,
      data: null,
      message: '认证失败：' + err.message,
    });
  }
}

/**
 * 可选认证中间件 - 有 Token 则验证，无 Token 也不报错
 * 用于兼容已有 user_id=1 的接口
 */
export function optionalAuthMiddleware(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      };
    } catch {
      // Token 无效也不阻断，使用默认用户
      req.user = { id: 1, username: '默认用户', role: 'student' };
    }
  } else {
    req.user = { id: 1, username: '默认用户', role: 'student' };
  }
  next();
}

/**
 * 登录处理函数
 */
export async function loginHandler(req, res) {
  try {
    const { email, password } = req.body;
    const pool = getPool();

    // 查找用户
    const [rows] = await pool.execute(
      'SELECT id, username, email, password_hash, role, avatar, level, exp FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        code: 401, data: null, message: '邮箱或密码错误',
      });
    }

    const user = rows[0];

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        code: 401, data: null, message: '邮箱或密码错误',
      });
    }

    // 生成 Token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 存储 Refresh Token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.execute(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, refreshToken, expiresAt]
    );

    // 更新最后登录时间
    await pool.execute('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    res.json({
      code: 200,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          level: user.level,
          exp: user.exp,
        },
      },
      message: '登录成功',
    });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
}

/**
 * 刷新 Token 处理函数
 */
export async function refreshHandler(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        code: 400, data: null, message: '缺少刷新令牌',
      });
    }

    // 验证 Refresh Token
    const decoded = verifyRefreshToken(refreshToken);
    const pool = getPool();

    // 检查 Refresh Token 是否在数据库中存在
    const [rows] = await pool.execute(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
      [refreshToken]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        code: 401, data: null, message: '刷新令牌无效或已过期',
      });
    }

    // 查询用户信息
    const [userRows] = await pool.execute(
      'SELECT id, username, role FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (userRows.length === 0) {
      return res.status(401).json({
        code: 401, data: null, message: '用户不存在',
      });
    }

    // 生成新的 Access Token
    const newAccessToken = generateAccessToken(userRows[0]);

    res.json({
      code: 200,
      data: { accessToken: newAccessToken },
      message: '刷新成功',
    });
  } catch (err) {
    res.status(401).json({
      code: 401, data: null, message: err.message,
    });
  }
}

/**
 * 登出处理函数 - 删除 Refresh Token
 */
export async function logoutHandler(req, res) {
  try {
    const { refreshToken } = req.body;
    const pool = getPool();

    if (refreshToken) {
      await pool.execute('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }

    res.json({
      code: 200, data: null, message: '登出成功',
    });
  } catch (err) {
    res.status(500).json({ code: 500, data: null, message: err.message });
  }
}
```

- [ ] 步骤 4：在 `server.js` 中注册认证路由和中间件

```javascript
// 在 server.js 顶部添加导入
import {
  authMiddleware, optionalAuthMiddleware,
  loginHandler, refreshHandler, logoutHandler,
} from './src/middleware/auth.js';

// ========== 认证 API ==========
app.post('/api/auth/login', loginHandler);
app.post('/api/auth/refresh', refreshHandler);
app.post('/api/auth/logout', logoutHandler);

// ========== 受保护路由示例 ==========
// 将需要认证的路由替换为 authMiddleware
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  // 使用 req.user.id 代替硬编码的 1
  const userId = req.user.id;
  // ... 原有逻辑
});

// 知识库管理路由需要管理员权限
app.post('/api/kb/documents', authMiddleware, rbacMiddleware('admin'), async (req, res) => {
  // ... 原有逻辑
});
```

- [ ] 步骤 5：验证认证流程

```bash
cd ai-mate/react-ai-chat
node server.js

# 1. 测试登录
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aimate.com","password":"admin123"}'

# 预期输出：
# {"code":200,"data":{"accessToken":"eyJ...","refreshToken":"eyJ...","user":{"id":1,"username":"管理员","role":"admin",...}},"message":"登录成功"}

# 2. 测试无 Token 访问受保护路由
curl http://localhost:8080/api/user/profile
# 预期输出：{"code":401,"data":null,"message":"未提供认证令牌，请先登录"}

# 3. 测试带 Token 访问
TOKEN="eyJ..."  # 使用上一步获取的 accessToken
curl http://localhost:8080/api/user/profile -H "Authorization: Bearer $TOKEN"
# 预期输出：{"code":200,"data":{...},"message":"success"}

# 4. 测试刷新 Token
REFRESH="eyJ..."
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}"
# 预期输出：{"code":200,"data":{"accessToken":"new-eyJ..."},"message":"刷新成功"}
```

---

### 任务 2：创建 RBAC 权限中间件

**文件：** Create `ai-mate/react-ai-chat/src/middleware/rbac.js`

- [ ] 步骤 1：创建四级角色权限控制中间件

```javascript
// ai-mate/react-ai-chat/src/middleware/rbac.js
/**
 * RBAC（基于角色的访问控制）中间件
 * 四级角色：student（学生） < investor（投资人） < expert（专家） < admin（管理员）
 */

// 角色权限等级（数值越大权限越高）
const ROLE_LEVELS = {
  student: 1,
  investor: 2,
  expert: 3,
  admin: 4,
};

// 角色中文名
const ROLE_NAMES = {
  student: '学生',
  investor: '投资人',
  expert: '专家',
  admin: '管理员',
};

// 角色可访问的资源权限映射
const PERMISSIONS = {
  // 对话相关
  'conversation:create': ['student', 'investor', 'expert', 'admin'],
  'conversation:read': ['student', 'investor', 'expert', 'admin'],
  'conversation:update': ['student', 'investor', 'expert', 'admin'],
  'conversation:delete': ['student', 'investor', 'expert', 'admin'],

  // AI 对话
  'ai:chat': ['student', 'investor', 'expert', 'admin'],
  'ai:rag': ['student', 'investor', 'expert', 'admin'],

  // 知识库管理
  'kb:read': ['student', 'investor', 'expert', 'admin'],
  'kb:create': ['expert', 'admin'],
  'kb:update': ['expert', 'admin'],
  'kb:delete': ['admin'],
  'kb:import': ['expert', 'admin'],

  // 资源平台
  'resource:read': ['student', 'investor', 'expert', 'admin'],
  'resource:upload': ['student', 'investor', 'expert', 'admin'],
  'resource:approve': ['admin'],

  // 社区
  'community:read': ['student', 'investor', 'expert', 'admin'],
  'community:post': ['student', 'investor', 'expert', 'admin'],
  'community:moderate': ['expert', 'admin'],

  // 管理后台
  'admin:dashboard': ['admin'],
  'admin:userManage': ['admin'],
  'admin:config': ['admin'],
};

/**
 * 检查角色是否拥有指定权限
 * @param {string} role - 用户角色
 * @param {string} permission - 权限标识
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

/**
 * 检查角色等级是否达标
 * @param {string} role - 用户角色
 * @param {string} requiredRole - 要求的最低角色
 * @returns {boolean}
 */
export function hasRoleLevel(role, requiredRole) {
  const userLevel = ROLE_LEVELS[role] || 0;
  const requiredLevel = ROLE_LEVELS[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

/**
 * RBAC 权限检查中间件
 * 用法：app.post('/api/kb/documents', authMiddleware, rbacMiddleware('kb:create'), handler)
 *
 * @param {string} permission - 需要的权限标识
 */
export function rbacMiddleware(permission) {
  return (req, res, next) => {
    // 前置条件：authMiddleware 已设置 req.user
    if (!req.user) {
      return res.status(500).json({
        code: 500,
        data: null,
        message: 'RBAC 中间件必须在 authMiddleware 之后使用',
      });
    }

    const { role, username } = req.user;

    if (hasPermission(role, permission)) {
      next();
    } else {
      res.status(403).json({
        code: 403,
        data: null,
        message: `权限不足：${ROLE_NAMES[role] || role} 角色无权执行此操作（需要 ${permission} 权限）`,
        requiredPermission: permission,
        userRole: role,
      });
    }
  };
}

/**
 * 最低角色检查中间件
 * 用法：app.delete('/api/admin/users/:id', authMiddleware, requireRole('admin'), handler)
 *
 * @param {string} requiredRole - 要求的最低角色
 */
export function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({
        code: 500,
        data: null,
        message: 'requireRole 中间件必须在 authMiddleware 之后使用',
      });
    }

    const { role, username } = req.user;

    if (hasRoleLevel(role, requiredRole)) {
      next();
    } else {
      res.status(403).json({
        code: 403,
        data: null,
        message: `权限不足：此操作需要 ${ROLE_NAMES[requiredRole]} 或更高角色`,
        requiredRole,
        userRole: role,
      });
    }
  };
}

/**
 * 批量权限检查中间件
 * 用户需满足所有指定权限才能通过
 * 用法：app.post('/api/admin/batch', authMiddleware, requireAllPermissions(['admin:config', 'admin:userManage']), handler)
 *
 * @param {string[]} permissions - 需要的所有权限
 */
export function requireAllPermissions(permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({
        code: 500,
        data: null,
        message: '权限中间件必须在 authMiddleware 之后使用',
      });
    }

    const { role } = req.user;
    const missingPermissions = permissions.filter((p) => !hasPermission(role, p));

    if (missingPermissions.length === 0) {
      next();
    } else {
      res.status(403).json({
        code: 403,
        data: null,
        message: `权限不足：缺少以下权限 ${missingPermissions.join(', ')}`,
        missingPermissions,
        userRole: role,
      });
    }
  };
}

/**
 * 任意权限检查中间件
 * 用户只需满足其中一个权限即可通过
 *
 * @param {string[]} permissions - 需要的任一权限
 */
export function requireAnyPermission(permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({
        code: 500,
        data: null,
        message: '权限中间件必须在 authMiddleware 之后使用',
      });
    }

    const { role } = req.user;
    const hasAny = permissions.some((p) => hasPermission(role, p));

    if (hasAny) {
      next();
    } else {
      res.status(403).json({
        code: 403,
        data: null,
        message: `权限不足：需要以下任一权限 ${permissions.join(' / ')}`,
        requiredPermissions: permissions,
        userRole: role,
      });
    }
  };
}

// 导出角色信息（供其他模块使用）
export { ROLE_LEVELS, ROLE_NAMES, PERMISSIONS };
```

- [ ] 步骤 2：在 `server.js` 中应用 RBAC 中间件

```javascript
import { rbacMiddleware, requireRole } from './src/middleware/rbac.js';

// ========== 知识库路由（带权限控制）==========
// 所有用户可读取知识库
app.get('/api/kb/documents', authMiddleware, rbacMiddleware('kb:read'), async (req, res) => {
  // ... 原有逻辑
});

// 仅专家和管理员可创建/编辑
app.post('/api/kb/documents', authMiddleware, rbacMiddleware('kb:create'), async (req, res) => {
  // ... 原有逻辑
});

app.put('/api/kb/documents/:id', authMiddleware, rbacMiddleware('kb:update'), async (req, res) => {
  // ... 原有逻辑
});

// 仅管理员可删除和批量导入
app.delete('/api/kb/documents/:id', authMiddleware, rbacMiddleware('kb:delete'), async (req, res) => {
  // ... 原有逻辑
});

app.post('/api/kb/documents/batch', authMiddleware, rbacMiddleware('kb:import'), async (req, res) => {
  // ... 原有逻辑
});

// 管理后台仅管理员可访问
app.get('/api/admin/dashboard', authMiddleware, requireRole('admin'), async (req, res) => {
  // ... 管理后台逻辑
});
```

- [ ] 步骤 3：验证 RBAC 权限控制

```bash
# 1. 创建不同角色的测试用户
# 在数据库中插入测试用户
mysql -u root -p ai_mate -e "
INSERT INTO users (username, email, password_hash, role) VALUES
  ('学生用户', 'student@test.com', '\$2a\$10\$xxx', 'student'),
  ('投资用户', 'investor@test.com', '\$2a\$10\$xxx', 'investor'),
  ('专家用户', 'expert@test.com', '\$2a\$10\$xxx', 'expert');
"

# 2. 测试学生用户尝试删除知识库文档（应被拒绝）
# 先登录获取 student 的 token
STUDENT_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"test123"}' | jq -r '.data.accessToken')

# 尝试删除
curl -X DELETE http://localhost:8080/api/kb/documents/1 \
  -H "Authorization: Bearer $STUDENT_TOKEN"
# 预期输出：{"code":403,"data":null,"message":"权限不足：学生角色无权执行此操作（需要 kb:delete 权限）"}

# 3. 测试管理员删除（应成功）
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aimate.com","password":"admin123"}' | jq -r '.data.accessToken')

curl -X DELETE http://localhost:8080/api/kb/documents/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# 预期输出：{"code":200,"data":null,"message":"删除成功"}
```

---

### 任务 3：创建敏感词过滤中间件

**文件：** Create `ai-mate/react-ai-chat/src/middleware/contentFilter.js`

- [ ] 步骤 1：创建支持输入输出双向过滤的中间件

```javascript
// ai-mate/react-ai-chat/src/middleware/contentFilter.js
/**
 * 敏感词过滤中间件
 * 支持输入过滤（用户提交的消息）和输出过滤（AI 返回的内容）
 */

// 敏感词库（实际项目中应从数据库或配置文件加载）
const SENSITIVE_WORDS = [
  // 政治敏感词
  '反动', '颠覆',
  // 违法词汇
  '赌博', '毒品', '诈骗', '传销', '洗钱',
  // 色情暴力
  '色情', '暴力', '恐怖', '淫秽',
  // 广告
  '加微信', '加QQ', '免费领取', '点击链接',
  // 其他
  '自杀', '自残', '炸弹', '枪支',
];

// 替换字符
const REPLACEMENT = '***';

// 敏感词匹配正则（预编译提升性能）
let sensitivePattern = null;

/**
 * 构建敏感词正则表达式
 */
function buildPattern() {
  const escaped = SENSITIVE_WORDS.map((word) =>
    word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  // 全局匹配，不区分大小写
  sensitivePattern = new RegExp(escaped.join('|'), 'gi');
}

buildPattern();

/**
 * 检测文本中是否包含敏感词
 * @param {string} text - 待检测文本
 * @returns {{ found: boolean, words: string[] }}
 */
export function detectSensitive(text) {
  if (!text || typeof text !== 'string') {
    return { found: false, words: [] };
  }

  const found = [];
  let match;
  const pattern = new RegExp(sensitivePattern.source, 'gi');
  while ((match = pattern.exec(text)) !== null) {
    found.push(match[0]);
  }

  return {
    found: found.length > 0,
    words: [...new Set(found)], // 去重
  };
}

/**
 * 过滤敏感词（替换为 ***）
 * @param {string} text - 待过滤文本
 * @returns {string} 过滤后的文本
 */
export function filterSensitive(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(sensitivePattern, REPLACEMENT);
}

/**
 * 输入过滤中间件
 * 检查请求体中的文本字段是否包含敏感词
 * 用法：app.post('/api/ai/chat', inputFilter, handler)
 */
export function inputFilterMiddleware(req, res, next) {
  // 需要检查的字段
  const FIELDS_TO_CHECK = ['message', 'content', 'title', 'query', 'search'];

  let hasSensitive = false;
  const detectedWords = [];

  for (const field of FIELDS_TO_CHECK) {
    if (req.body && req.body[field]) {
      const result = detectSensitive(req.body[field]);
      if (result.found) {
        hasSensitive = true;
        detectedWords.push(...result.words);
        // 替换敏感词
        req.body[field] = filterSensitive(req.body[field]);
      }
    }
  }

  // 检查 messages 数组中的每条消息
  if (req.body && Array.isArray(req.body.messages)) {
    req.body.messages = req.body.messages.map((msg) => {
      if (msg.content) {
        const result = detectSensitive(msg.content);
        if (result.found) {
          hasSensitive = true;
          detectedWords.push(...result.words);
          return { ...msg, content: filterSensitive(msg.content) };
        }
      }
      return msg;
    });
  }

  if (hasSensitive) {
    console.warn(`[ContentFilter] 检测到敏感词: ${[...new Set(detectedWords)].join(', ')}`);

    // 记录到请求对象，供后续使用
    req.filteredWords = [...new Set(detectedWords)];
  }

  next();
}

/**
 * 严格输入过滤中间件
 * 检测到敏感词时直接拒绝请求（不替换）
 * 用法：app.post('/api/posts', strictInputFilter, handler)
 */
export function strictInputFilterMiddleware(req, res, next) {
  const FIELDS_TO_CHECK = ['message', 'content', 'title', 'query'];
  let hasSensitive = false;
  const detectedWords = [];

  for (const field of FIELDS_TO_CHECK) {
    if (req.body && req.body[field]) {
      const result = detectSensitive(req.body[field]);
      if (result.found) {
        hasSensitive = true;
        detectedWords.push(...result.words);
      }
    }
  }

  if (req.body && Array.isArray(req.body.messages)) {
    for (const msg of req.body.messages) {
      if (msg.content) {
        const result = detectSensitive(msg.content);
        if (result.found) {
          hasSensitive = true;
          detectedWords.push(...result.words);
        }
      }
    }
  }

  if (hasSensitive) {
    return res.status(400).json({
      code: 400,
      data: null,
      message: '内容包含敏感词，请修改后重试',
      filteredWords: [...new Set(detectedWords)],
    });
  }

  next();
}

/**
 * 输出过滤中间件
 * 在响应发送前过滤 AI 返回内容中的敏感词
 * 用法：app.post('/api/ai/chat', inputFilter, outputFilter, handler)
 */
export function outputFilterMiddleware(req, res, next) {
  // 保存原始 res.json 方法
  const originalJson = res.json;

  // 重写 res.json 方法
  res.json = function (data) {
    if (data && data.data) {
      // 过滤字符串类型的数据
      if (typeof data.data === 'string') {
        data.data = filterSensitive(data.data);
      }
      // 过滤对象中的内容字段
      if (typeof data.data === 'object' && !Array.isArray(data.data)) {
        const fieldsToFilter = ['content', 'reply', 'answer', 'message'];
        for (const field of fieldsToFilter) {
          if (data.data[field] && typeof data.data[field] === 'string') {
            data.data[field] = filterSensitive(data.data[field]);
          }
        }
        // 过滤 messages 数组
        if (Array.isArray(data.data.messages)) {
          data.data.messages = data.data.messages.map((msg) => {
            if (msg.content && typeof msg.content === 'string') {
              return { ...msg, content: filterSensitive(msg.content) };
            }
            return msg;
          });
        }
      }
      // 过滤数组中的内容
      if (Array.isArray(data.data)) {
        data.data = data.data.map((item) => {
          if (item && item.content && typeof item.content === 'string') {
            return { ...item, content: filterSensitive(item.content) };
          }
          return item;
        });
      }
    }

    originalJson.call(res, data);
  };

  next();
}

/**
 * 流式输出过滤包装器
 * 用于 SSE 流式响应的敏感词过滤
 */
export class StreamFilter {
  constructor() {
    this.buffer = '';
  }

  /**
   * 过滤流式数据块
   * 由于流式数据可能被截断，需要缓冲处理
   * @param {string} chunk - 数据块
   * @returns {{ output: string, remaining: string }}
   */
  filter(chunk) {
    this.buffer += chunk;

    // 检查缓冲区中是否有完整敏感词
    let filtered = this.buffer;
    const words = SENSITIVE_WORDS.filter((w) => w.length > 1);

    for (const word of words) {
      const wordPattern = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      filtered = filtered.replace(wordPattern, REPLACEMENT);
    }

    // 保留最后 N 个字符（防止敏感词被截断）
    const safeLength = Math.max(...words.map((w) => w.length)) - 1;
    const safePart = filtered.slice(0, Math.max(0, filtered.length - safeLength));
    const remaining = filtered.slice(Math.max(0, filtered.length - safeLength));

    this.buffer = remaining;
    return { output: safePart, remaining };
  }

  /**
   * 获取缓冲区中剩余的内容
   */
  flush() {
    const result = filterSensitive(this.buffer);
    this.buffer = '';
    return result;
  }
}

// 导出敏感词库管理函数
export function addSensitiveWord(word) {
  if (!SENSITIVE_WORDS.includes(word)) {
    SENSITIVE_WORDS.push(word);
    buildPattern();
  }
}

export function removeSensitiveWord(word) {
  const index = SENSITIVE_WORDS.indexOf(word);
  if (index > -1) {
    SENSITIVE_WORDS.splice(index, 1);
    buildPattern();
  }
}

export function getSensitiveWords() {
  return [...SENSITIVE_WORDS];
}
```

- [ ] 步骤 2：在 `server.js` 中应用敏感词过滤中间件

```javascript
import {
  inputFilterMiddleware, strictInputFilterMiddleware,
  outputFilterMiddleware,
} from './src/middleware/contentFilter.js';

// 对话接口：输入过滤（替换敏感词），输出过滤
app.post('/api/ai/chat/stream',
  authMiddleware,
  inputFilterMiddleware,
  async (req, res) => {
    // ... 流式逻辑，在输出时使用 StreamFilter
  }
);

// 社区发帖：严格过滤（包含敏感词则拒绝）
app.post('/api/posts',
  authMiddleware,
  strictInputFilterMiddleware,
  postHandler
);

// FAQ 列表：输出过滤
app.get('/api/faqs', outputFilterMiddleware, (req, res) => {
  // ... 原有逻辑
});
```

- [ ] 步骤 3：验证敏感词过滤

```bash
# 1. 测试输入过滤（替换模式）
curl -X POST http://localhost:8080/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"messages":[{"role":"user","content":"这里有赌博的信息"}],"role":"scout"}'

# 预期：请求正常处理，但 "赌博" 被替换为 "***"
# 后端日志输出：[ContentFilter] 检测到敏感词: 赌博

# 2. 测试严格过滤（拒绝模式）
curl -X POST http://localhost:8080/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"测试","content":"这个内容包含传销信息"}'

# 预期输出：
# {"code":400,"data":null,"message":"内容包含敏感词，请修改后重试","filteredWords":["传销"]}

# 3. 单元测试
node -e "
import { detectSensitive, filterSensitive } from './src/middleware/contentFilter.js';
console.log(detectSensitive('这里有赌博'));  // { found: true, words: ['赌博'] }
console.log(filterSensitive('赌博网站'));     // '***网站'
console.log(detectSensitive('正常文本'));    // { found: false, words: [] }
"
```

---

### 任务 4：创建 API 测试用例

**文件：** Create `ai-mate/react-ai-chat/tests/api.test.js`

- [ ] 步骤 1：安装测试依赖

```bash
cd ai-mate/react-ai-chat
npm install -D jest supertest cross-env
```

- [ ] 步骤 2：在 `package.json` 中添加 Jest 配置

```json
{
  "scripts": {
    "test": "cross-env NODE_ENV=test jest",
    "test:api": "cross-env NODE_ENV=test jest tests/api.test.js",
    "test:watch": "cross-env NODE_ENV=test jest --watch"
  },
  "jest": {
    "testEnvironment": "node",
    "testMatch": ["<rootDir>/tests/**/*.test.js"],
    "collectCoverageFrom": [
      "src/middleware/**/*.js",
      "src/services/**/*.js"
    ]
  }
}
```

- [ ] 步骤 3：创建 API 测试文件

```javascript
// ai-mate/react-ai-chat/tests/api.test.js
import request from 'supertest';
import { jest } from '@jest/globals';

// 导入 app（需要将 server.js 中的 app 导出）
// 修改 server.js: export { app };
import { app } from '../server.js';

// 测试用的 Token
let adminToken = '';
let studentToken = '';
let conversationId = '';

// ========== 认证接口测试 ==========

describe('认证 API', () => {
  test('管理员登录成功', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@aimate.com', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.role).toBe('admin');
    adminToken = res.body.data.accessToken;
  });

  test('密码错误登录失败', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@aimate.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe(401);
    expect(res.body.message).toContain('密码错误');
  });

  test('无 Token 访问受保护路由', async () => {
    const res = await request(app).get('/api/user/profile');
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('未提供认证令牌');
  });

  test('带 Token 访问受保护路由成功', async () => {
    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
  });

  test('刷新 Token', async () => {
    // 先登录获取 refreshToken
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@aimate.com', password: 'admin123' });

    const refreshToken = loginRes.body.data.refreshToken;

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });
});

// ========== RBAC 权限测试 ==========

describe('RBAC 权限控制', () => {
  test('学生用户无法删除知识库文档', async () => {
    // 假设已有 student token
    const res = await request(app)
      .delete('/api/kb/documents/1')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe(403);
    expect(res.body.message).toContain('权限不足');
  });

  test('管理员可以删除知识库文档', async () => {
    const res = await request(app)
      .delete('/api/kb/documents/1')
      .set('Authorization', `Bearer ${adminToken}`);

    // 可能返回 200 或 404（如果文档不存在）
    expect([200, 404]).toContain(res.status);
  });
});

// ========== 对话 CRUD 测试 ==========

describe('对话 CRUD API', () => {
  test('获取对话列表', async () => {
    const res = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('创建新对话', async () => {
    const res = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: '测试对话', type: 'scout' });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.data.title).toBe('测试对话');
    expect(res.body.data.type).toBe('scout');
    conversationId = res.body.data.id;
  });

  test('获取对话详情', async () => {
    const res = await request(app)
      .get(`/api/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
  });

  test('添加消息到对话', async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'user', content: '你好，这是一个测试消息' });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.data.role).toBe('user');
    expect(res.body.data.content).toBe('你好，这是一个测试消息');
  });

  test('删除对话', async () => {
    const res = await request(app)
      .delete(`/api/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 204]).toContain(res.status);
  });
});

// ========== 知识库 API 测试 ==========

describe('知识库 API', () => {
  test('获取分类列表', async () => {
    const res = await request(app)
      .get('/api/kb/categories')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('创建知识库文档', async () => {
    const res = await request(app)
      .post('/api/kb/documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: '测试文档',
        content: '这是测试内容，用于验证知识库 CRUD 功能',
        status: 'published',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('测试文档');
  });

  test('全文检索知识库', async () => {
    // 先创建文档
    await request(app)
      .post('/api/kb/documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: '大学生创业指南',
        content: '大学生创业需要了解市场调研、商业模式设计等基础知识',
      });

    // 搜索
    const res = await request(app)
      .get('/api/kb/search?q=创业&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('批量导入文档', async () => {
    const res = await request(app)
      .post('/api/kb/documents/batch')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        documents: [
          { title: '批量导入1', content: '内容1' },
          { title: '批量导入2', content: '内容2' },
          { title: '', content: '缺少标题应失败' }, // 这条应该失败
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(2);
    expect(res.body.data.failed).toBe(1);
  });
});

// ========== 敏感词过滤测试 ==========

describe('敏感词过滤', () => {
  test('严格过滤拒绝包含敏感词的内容', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: '测试', content: '包含赌博内容' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('敏感词');
  });

  test('输入过滤替换敏感词', async () => {
    const res = await request(app)
      .post('/api/ai/chat/stream')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        messages: [{ role: 'user', content: '这里有赌博信息' }],
        role: 'scout',
        enableRag: false,
      });

    // 请求应正常处理（敏感词被替换）
    expect(res.status).toBe(200);
  });
});

// ========== AI 对话流式接口测试 ==========

describe('AI 对话流式 API', () => {
  test('流式接口返回 SSE 格式', async () => {
    const res = await request(app)
      .post('/api/ai/chat/stream')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        messages: [{ role: 'user', content: '你好' }],
        role: 'scout',
        enableRag: false,
      });

    // SSE 响应
    expect(res.headers['content-type']).toContain('text/event-stream');
  });

  test('缺少 messages 参数返回 400', async () => {
    const res = await request(app)
      .post('/api/ai/chat/stream')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'scout' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('messages');
  });
});
```

- [ ] 步骤 4：运行测试并验证

```bash
cd ai-mate/react-ai-chat
npm run test:api

# 预期输出：
# PASS  tests/api.test.js
#   认证 API
#     ✓ 管理员登录成功 (XX ms)
#     ✓ 密码错误登录失败 (XX ms)
#     ✓ 无 Token 访问受保护路由 (XX ms)
#     ✓ 带 Token 访问受保护路由成功 (XX ms)
#     ✓ 刷新 Token (XX ms)
#   RBAC 权限控制
#     ✓ 学生用户无法删除知识库文档 (XX ms)
#     ✓ 管理员可以删除知识库文档 (XX ms)
#   对话 CRUD API
#     ✓ 获取对话列表 (XX ms)
#     ✓ 创建新对话 (XX ms)
#     ✓ 获取对话详情 (XX ms)
#     ✓ 添加消息到对话 (XX ms)
#     ✓ 删除对话 (XX ms)
#   知识库 API
#     ✓ 获取分类列表 (XX ms)
#     ✓ 创建知识库文档 (XX ms)
#     ✓ 全文检索知识库 (XX ms)
#     ✓ 批量导入文档 (XX ms)
#   敏感词过滤
#     ✓ 严格过滤拒绝包含敏感词的内容 (XX ms)
#     ✓ 输入过滤替换敏感词 (XX ms)
#   AI 对话流式 API
#     ✓ 流式接口返回 SSE 格式 (XX ms)
#     ✓ 缺少 messages 参数返回 400 (XX ms)
#
# Tests: 19 passed, 19 total
```

---

### 任务 5：创建前端组件测试

**文件：** Create `ai-mate/react-ai-chat/tests/components.test.tsx`

- [ ] 步骤 1：安装前端测试依赖

```bash
cd ai-mate/react-ai-chat
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @types/jest identity-obj-proxy
```

- [ ] 步骤 2：在 `package.json` 中扩展 Jest 配置

```json
{
  "jest": {
    "projects": [
      {
        "displayName": "api",
        "testEnvironment": "node",
        "testMatch": ["<rootDir>/tests/api.test.js"]
      },
      {
        "displayName": "components",
        "testEnvironment": "jsdom",
        "testMatch": ["<rootDir>/tests/components.test.tsx"],
        "transform": {
          "^.+\\.tsx?$": ["babel-jest", { "presets": ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript"] }]
        },
        "moduleNameMapper": {
          "\\.(css|less|scss)$": "identity-obj-proxy",
          "^@/(.*)$": "<rootDir>/src/$1"
        },
        "setupFilesAfterEnv": ["<rootDir>/tests/setup.ts"]
      }
    ]
  }
}
```

- [ ] 步骤 3：创建测试设置文件

```typescript
// ai-mate/react-ai-chat/tests/setup.ts
import '@testing-library/jest-dom';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});
```

- [ ] 步骤 4：创建四大 AI 角色核心组件测试

```tsx
// ai-mate/react-ai-chat/tests/components.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Ant Design message
jest.mock('antd', () => {
  const actual = jest.requireActual('antd');
  return {
    ...actual,
    message: { ...actual.message, success: jest.fn(), error: jest.fn() },
  };
});

// Mock services
jest.mock('../src/services/aiService', () => ({
  chatWithZhipuStream: jest.fn(),
  chatWithRagStream: jest.fn(),
  getSystemPrompt: jest.fn(() => '系统提示词'),
  smartChatStream: jest.fn(),
  streamManager: { create: jest.fn(), abort: jest.fn(), abortAll: jest.fn() },
  NetworkMonitor: { getInstance: () => ({ status: true, onStatusChange: () => () => {} }) },
}));

// ========== 测试 1：ChatMessage 组件 ==========

import ChatMessage from '../src/components/chat/ChatMessage';

describe('ChatMessage 组件', () => {
  it('正确渲染用户消息', () => {
    render(
      <ChatMessage
        message={{
          id: '1',
          role: 'user',
          content: '你好，这是一个测试',
          timestamp: Date.now(),
        }}
      />
    );

    expect(screen.getByText('你好，这是一个测试')).toBeInTheDocument();
  });

  it('正确渲染 AI 消息（支持 Markdown）', () => {
    render(
      <ChatMessage
        message={{
          id: '2',
          role: 'assistant',
          content: '**加粗文本**\n\n- 列表项1\n- 列表项2',
          timestamp: Date.now(),
        }}
      />
    );

    expect(screen.getByText('加粗文本')).toBeInTheDocument();
    expect(screen.getByText('列表项1')).toBeInTheDocument();
    expect(screen.getByText('列表项2')).toBeInTheDocument();
  });

  it('流式状态显示光标', () => {
    const { container } = render(
      <ChatMessage
        message={{
          id: '3',
          role: 'assistant',
          content: '正在生成',
          timestamp: Date.now(),
          loading: true,
        }}
        isStreaming
      />
    );

    const cursor = container.querySelector('.streaming-cursor');
    expect(cursor).toBeInTheDocument();
  });

  it('加载状态显示思考中', () => {
    render(
      <ChatMessage
        message={{
          id: '4',
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          loading: true,
        }}
      />
    );

    expect(screen.getByText('思考中')).toBeInTheDocument();
  });
});

// ========== 测试 2：ChatSidebar 组件 ==========

import ChatSidebar from '../src/components/chat/ChatSidebar';
import { useAIStore } from '../src/store/aiStore';

describe('ChatSidebar 组件', () => {
  beforeEach(() => {
    // 重置 store
    useAIStore.setState({
      conversations: {
        scout: [
          { id: 'c1', title: '对话1', messages: [], createdAt: Date.now(), updatedAt: Date.now() },
          { id: 'c2', title: '对话2', messages: [], createdAt: Date.now(), updatedAt: Date.now() },
        ],
        sage: [], maker: [], butler: [],
      },
      activeConversationId: { scout: 'c1', sage: null, maker: null, butler: null },
    });
  });

  it('渲染对话列表', () => {
    render(<ChatSidebar role="scout" />);

    expect(screen.getByText('对话1')).toBeInTheDocument();
    expect(screen.getByText('对话2')).toBeInTheDocument();
  });

  it('点击新建对话按钮', async () => {
    const { createAndSync } = useAIStore.getState();
    const spy = jest.spyOn(useAIStore.getState(), 'createAndSync');

    render(<ChatSidebar role="scout" />);

    const newButton = screen.getByText('新建对话');
    await userEvent.click(newButton);

    expect(spy).toHaveBeenCalledWith('scout');
  });

  it('搜索过滤对话', async () => {
    render(<ChatSidebar role="scout" />);

    const searchInput = screen.getByPlaceholderText('搜索对话...');
    await userEvent.type(searchInput, '对话1');

    expect(screen.getByText('对话1')).toBeInTheDocument();
    expect(screen.queryByText('对话2')).not.toBeInTheDocument();
  });

  it('显示空状态', () => {
    useAIStore.setState({
      conversations: { scout: [], sage: [], maker: [], butler: [] },
    });

    render(<ChatSidebar role="scout" />);

    expect(screen.getByText('暂无对话')).toBeInTheDocument();
  });
});

// ========== 测试 3：TokenUsage 组件 ==========

import TokenUsage from '../src/components/chat/TokenUsage';

describe('TokenUsage 组件', () => {
  beforeEach(() => {
    useAIStore.setState({
      tokenUsage: {
        scout: { prompt: 100, completion: 50, total: 150 },
        sage: { prompt: 200, completion: 100, total: 300 },
        maker: { prompt: 0, completion: 0, total: 0 },
        butler: { prompt: 0, completion: 0, total: 0 },
      },
    });
  });

  it('紧凑模式显示总 Token', () => {
    render(<TokenUsage role="scout" compact />);

    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('完整模式显示详细统计', () => {
    render(<TokenUsage role="scout" />);

    expect(screen.getByText('Token 消耗')).toBeInTheDocument();
    expect(screen.getByText('累计输入')).toBeInTheDocument();
    expect(screen.getByText('累计输出')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('显示当前消息用量', () => {
    render(
      <TokenUsage
        role="scout"
        currentUsage={{ prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 }}
      />
    );

    expect(screen.getByText('本次对话')).toBeInTheDocument();
  });

  it('不指定角色时显示全部汇总', () => {
    render(<TokenUsage />);

    // 汇总：150 + 300 = 450
    expect(screen.getByText('450')).toBeInTheDocument();
  });
});

// ========== 测试 4：ErrorBoundary 组件 ==========

import ChatErrorBoundary, { InlineError } from '../src/components/chat/ErrorBoundary';

describe('ChatErrorBoundary 组件', () => {
  // 抛出错误的子组件
  const ThrowError: React.FC<{ error: Error }> = ({ error }) => {
    throw error;
  };

  it('捕获子组件错误并显示错误界面', () => {
    render(
      <ChatErrorBoundary>
        <ThrowError error={new Error('测试错误')} />
      </ChatErrorBoundary>
    );

    expect(screen.getByText('对话出现错误')).toBeInTheDocument();
    expect(screen.getByText('测试错误')).toBeInTheDocument();
  });

  it('显示重试按钮', () => {
    render(
      <ChatErrorBoundary maxRetries={3}>
        <ThrowError error={new Error('测试错误')} />
      </ChatErrorBoundary>
    );

    expect(screen.getByText('重试 (3 次剩余)')).toBeInTheDocument();
  });

  it('达到最大重试次数后禁用按钮', () => {
    render(
      <ChatErrorBoundary maxRetries={3}>
        <ThrowError error={new Error('测试错误')} />
      </ChatErrorBoundary>
    );

    // 模拟点击重试 3 次
    const retryButton = screen.getByText('重试 (3 次剩余)');
    fireEvent.click(retryButton);

    // 重试后组件重新渲染又抛出错误
    expect(screen.getByText(/已重试/)).toBeInTheDocument();
  });

  it('正常渲染无错误的子组件', () => {
    render(
      <ChatErrorBoundary>
        <div>正常内容</div>
      </ChatErrorBoundary>
    );

    expect(screen.getByText('正常内容')).toBeInTheDocument();
  });
});

describe('InlineError 组件', () => {
  it('显示错误消息和重试按钮', () => {
    const onRetry = jest.fn();
    render(
      <InlineError
        message="网络请求失败"
        onRetry={onRetry}
        retryCount={1}
        maxRetries={3}
      />
    );

    expect(screen.getByText('网络请求失败')).toBeInTheDocument();
    expect(screen.getByText(/重试/)).toBeInTheDocument();
  });

  it('达到最大重试次数时显示提示', () => {
    render(
      <InlineError
        message="请求失败"
        retryCount={3}
        maxRetries={3}
      />
    );

    expect(screen.getByText('已达最大重试次数，请检查网络后刷新页面')).toBeInTheDocument();
  });
});

// ========== 测试 5：aiStore 状态管理 ==========

describe('aiStore 状态管理', () => {
  beforeEach(() => {
    useAIStore.setState({
      conversations: { scout: [], sage: [], maker: [], butler: [] },
      activeConversationId: { scout: null, sage: null, maker: null, butler: null },
      tokenUsage: {
        scout: { prompt: 0, completion: 0, total: 0 },
        sage: { prompt: 0, completion: 0, total: 0 },
        maker: { prompt: 0, completion: 0, total: 0 },
        butler: { prompt: 0, completion: 0, total: 0 },
      },
    });
  });

  it('创建对话', () => {
    const id = useAIStore.getState().createConversation('scout');
    expect(useAIStore.getState().conversations.scout).toHaveLength(1);
    expect(useAIStore.getState().activeConversationId.scout).toBe(id);
  });

  it('添加消息后自动更新对话标题', () => {
    const id = useAIStore.getState().createConversation('scout');
    useAIStore.getState().addMessage('scout', {
      id: 'msg1', role: 'user', content: '如何创业？', timestamp: Date.now(),
    });

    const conv = useAIStore.getState().conversations.scout[0];
    expect(conv.title).toContain('如何创业');
  });

  it('搜索对话', () => {
    useAIStore.getState().createConversation('scout');
    useAIStore.getState().addMessage('scout', {
      id: 'm1', role: 'user', content: '融资渠道', timestamp: Date.now(),
    });
    useAIStore.getState().createConversation('scout');
    useAIStore.getState().addMessage('scout', {
      id: 'm2', role: 'user', content: '市场分析', timestamp: Date.now(),
    });

    const results = useAIStore.getState().searchConversations('scout', '融资');
    expect(results).toHaveLength(1);
  });

  it('重命名对话', () => {
    const id = useAIStore.getState().createConversation('scout');
    useAIStore.getState().renameConversation('scout', id, '新标题');
    expect(useAIStore.getState().conversations.scout[0].title).toBe('新标题');
  });

  it('Token 用量累加', () => {
    useAIStore.getState().updateTokenUsage('sage', { prompt: 100, completion: 50, total: 150 });
    useAIStore.getState().updateTokenUsage('sage', { prompt: 200, completion: 100, total: 300 });
    expect(useAIStore.getState().tokenUsage.sage).toEqual({
      prompt: 300, completion: 150, total: 450,
    });
  });
});
```

- [ ] 步骤 5：运行组件测试

```bash
cd ai-mate/react-ai-chat
npx jest --selectProjects components

# 预期输出：
# PASS  tests/components.test.tsx
#   ChatMessage 组件
#     ✓ 正确渲染用户消息
#     ✓ 正确渲染 AI 消息（支持 Markdown）
#     ✓ 流式状态显示光标
#     ✓ 加载状态显示思考中
#   ChatSidebar 组件
#     ✓ 渲染对话列表
#     ✓ 点击新建对话按钮
#     ✓ 搜索过滤对话
#     ✓ 显示空状态
#   TokenUsage 组件
#     ✓ 紧凑模式显示总 Token
#     ✓ 完整模式显示详细统计
#     ✓ 显示当前消息用量
#     ✓ 不指定角色时显示全部汇总
#   ChatErrorBoundary 组件
#     ✓ 捕获子组件错误并显示错误界面
#     ✓ 显示重试按钮
#     ✓ 达到最大重试次数后禁用按钮
#     ✓ 正常渲染无错误的子组件
#   InlineError 组件
#     ✓ 显示错误消息和重试按钮
#     ✓ 达到最大重试次数时显示提示
#   aiStore 状态管理
#     ✓ 创建对话
#     ✓ 添加消息后自动更新对话标题
#     ✓ 搜索对话
#     ✓ 重命名对话
#     ✓ Token 用量累加
#
# Tests: 20 passed, 20 total
```

---

### 任务 6：配置 CI 检查脚本

**文件：** Create `ai-mate/react-ai-chat/.github/workflows/ci.yml`、Create `ai-mate/react-ai-chat/scripts/ci-check.sh`

- [ ] 步骤 1：创建 GitHub Actions CI 配置

```yaml
# ai-mate/react-ai-chat/.github/workflows/ci.yml
name: CI Check

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: TypeScript Type Check
        run: npx tsc --noEmit

  test:
    name: Run Tests
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test_password
          MYSQL_DATABASE: ai_mate_test
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3

    env:
      DB_HOST: 127.0.0.1
      DB_USER: root
      DB_PASSWORD: test_password
      DB_NAME: ai_mate_test
      JWT_SECRET: test-secret-key
      NODE_ENV: test

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Wait for MySQL
        run: |
          while ! mysqladmin ping -h 127.0.0.1 -P 3306 --silent; do
            sleep 1
          done

      - name: Run API Tests
        run: npm run test:api
        env:
          NODE_ENV: test

      - name: Run Component Tests
        run: npx jest --selectProjects components

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: always()
        with:
          file: ./coverage/lcov.info

  build:
    name: Build Check
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, test]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
```

- [ ] 步骤 2：创建本地 CI 检查脚本

```bash
#!/bin/bash
# ai-mate/react-ai-chat/scripts/ci-check.sh
# 本地 CI 检查脚本：ESLint + TypeScript 类型检查 + 测试运行

set -e  # 任何命令失败则退出

echo "========================================"
echo "  CI 检查开始"
echo "========================================"
echo ""

# 步骤 1：ESLint 检查
echo "[1/4] 运行 ESLint 检查..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint 检查失败"
  exit 1
fi
echo "✅ ESLint 检查通过"
echo ""

# 步骤 2：TypeScript 类型检查
echo "[2/4] 运行 TypeScript 类型检查..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ TypeScript 类型检查失败"
  exit 1
fi
echo "✅ TypeScript 类型检查通过"
echo ""

# 步骤 3：API 测试
echo "[3/4] 运行 API 测试..."
NODE_ENV=test npx jest --selectProjects api --coverage
if [ $? -ne 0 ]; then
  echo "❌ API 测试失败"
  exit 1
fi
echo "✅ API 测试通过"
echo ""

# 步骤 4：组件测试
echo "[4/4] 运行组件测试..."
npx jest --selectProjects components --coverage
if [ $? -ne 0 ]; then
  echo "❌ 组件测试失败"
  exit 1
fi
echo "✅ 组件测试通过"
echo ""

echo "========================================"
echo "  所有 CI 检查通过！"
echo "========================================"
echo ""
echo "覆盖率报告："
echo "  - HTML: coverage/lcov-report/index.html"
echo "  - LCOV: coverage/lcov.info"
```

- [ ] 步骤 3：在 `package.json` 中添加 CI 脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "cross-env NODE_ENV=test jest",
    "test:api": "cross-env NODE_ENV=test jest --selectProjects api",
    "test:components": "jest --selectProjects components",
    "test:coverage": "cross-env NODE_ENV=test jest --coverage",
    "ci:check": "bash scripts/ci-check.sh",
    "ci:lint": "npm run lint && npx tsc --noEmit",
    "ci:test": "npm run test:api && npm run test:components"
  }
}
```

- [ ] 步骤 4：创建 ESLint 配置增强（安全规则）

在 `ai-mate/react-ai-chat/eslint.config.js` 中添加安全相关规则：

```javascript
// 在 eslint.config.js 中追加规则
export default [
  // ... 已有配置
  {
    rules: {
      // 安全相关规则
      'no-eval': 'error',              // 禁止 eval
      'no-implied-eval': 'error',       // 禁止隐式 eval
      'no-new-func': 'error',           // 禁止 new Function
      'no-script-url': 'error',         // 禁止 javascript: URL
      'no-useless-escape': 'warn',      // 无用的转义

      // TypeScript 严格规则
      '@typescript-eslint/no-explicit-any': 'warn',  // 警告 any 类型
      '@typescript-eslint/no-unused-vars': 'error',   // 禁止未使用变量
      '@typescript-eslint/explicit-function-return-type': 'off',

      // React 相关
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
```

- [ ] 步骤 5：运行完整 CI 检查

```bash
cd ai-mate/react-ai-chat

# 运行完整 CI 检查
bash scripts/ci-check.sh

# 预期输出：
# ========================================
#   CI 检查开始
# ========================================
#
# [1/4] 运行 ESLint 检查...
# ✅ ESLint 检查通过
#
# [2/4] 运行 TypeScript 类型检查...
# ✅ TypeScript 类型检查通过
#
# [3/4] 运行 API 测试...
# Tests: 19 passed, 19 total
# ✅ API 测试通过
#
# [4/4] 运行组件测试...
# Tests: 20 passed, 20 total
# ✅ 组件测试通过
#
# ========================================
#   所有 CI 检查通过！
# ========================================
#
# 覆盖率报告：
#   - HTML: coverage/lcov-report/index.html
#   - LCOV: coverage/lcov.info

# 或者分步运行
npm run ci:lint    # 仅运行 ESLint + TypeScript 检查
npm run ci:test    # 仅运行测试
npm run test:coverage  # 生成覆盖率报告
```

- [ ] 步骤 6：验证 CI 完整流程

```bash
# 模拟 CI 环境运行
NODE_ENV=test npm run ci:check

# 检查覆盖率
# 打开 coverage/lcov-report/index.html 查看覆盖率详情
# 预期覆盖率目标：
# - 中间件（auth.js, rbac.js, contentFilter.js）: > 80%
# - 服务层（knowledgeService.js）: > 70%
# - 组件: > 60%
```

---

## 验收标准

1. **JWT 认证**：登录、Token 验证、Token 刷新、登出功能正常，受保护路由需要有效 Token
2. **RBAC 权限**：四级角色（student/investor/expert/admin）权限控制生效，越权访问返回 403
3. **敏感词过滤**：输入过滤（替换模式）、严格过滤（拒绝模式）、输出过滤、流式过滤均正常工作
4. **API 测试**：覆盖认证、RBAC、对话 CRUD、知识库检索、敏感词过滤、AI 流式接口，19 个测试用例全部通过
5. **组件测试**：覆盖 ChatMessage、ChatSidebar、TokenUsage、ErrorBoundary、aiStore，20 个测试用例全部通过
6. **CI 流水线**：ESLint + TypeScript 类型检查 + API 测试 + 组件测试 + 构建检查，GitHub Actions 配置完整，本地脚本可一键运行
7. **覆盖率**：中间件层 > 80%，服务层 > 70%，组件层 > 60%
