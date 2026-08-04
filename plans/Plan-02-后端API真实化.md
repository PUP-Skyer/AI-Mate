# 后端API真实化 实施计划

> **目标：** 将 server.js 中的 mock 接口替换为基于 MySQL 数据库的真实 CRUD 操作，实现对话管理、消息管理、AI 模型配置管理和知识库管理的完整后端 API，并添加统一错误处理中间件和标准响应格式。
> **依赖：** Plan-01-数据库层重构.md（需先完成 conversations、messages、ai_models、knowledge_base 四张表的创建）
> **技术栈：** Node.js + Express 5、mysql2/promise 连接池、ESM 模块系统、RESTful API 设计

---

## 项目背景

当前 `server.js`（位于 `ai-mate/react-ai-chat/server.js`）存在以下问题：
1. 第 232-288 行的对话和消息相关接口全部返回 mock 数据，不持久化
2. 缺少 AI 模型配置管理接口
3. 缺少知识库管理接口
4. 没有统一的错误处理中间件
5. 缺少 DELETE 和 PUT 方法的对话操作接口

现有统一响应格式（第 12-13 行）：
```javascript
const success = (data) => ({ code: 200, data, message: 'success' });
const error = (msg, code = 500) => ({ code, data: null, message: msg });
```

本计划将保留此响应格式，并将所有 mock 接口替换为真实数据库操作。

---

### 任务1：实现对话CRUD API

**文件：** Modify `f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\server.js`

- [ ] 步骤1：替换原有的 mock 对话接口（第 232-288 行），实现真实数据库 CRUD

**完整 API 代码（替换原有 mock 对话接口）：**

```javascript
// ========== 对话 CRUD API ==========

// 获取对话列表（支持按角色筛选）
// GET /api/conversations          - 获取所有对话
// GET /api/conversations/:role    - 按角色获取对话（scout/sage/maker/butler）
app.get('/api/conversations/:role?', async (req, res) => {
  try {
    const pool = getPool();
    const { role } = req.params;

    // 验证角色参数（如果提供了的话）
    const validRoles = ['scout', 'sage', 'maker', 'butler'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json(error('无效的AI角色，可选值: scout, sage, maker, butler', 400));
    }

    let query, params;
    if (role) {
      query = `
        SELECT c.id, c.user_id, c.ai_role, c.title, c.model_id, c.status,
               c.is_pinned, c.created_at, c.updated_at,
               m.name AS model_name,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) AS message_count
        FROM conversations c
        LEFT JOIN ai_models m ON c.model_id = m.id
        WHERE c.user_id = 1 AND c.ai_role = ? AND c.status != 'deleted'
        ORDER BY c.is_pinned DESC, c.updated_at DESC
      `;
      params = [role];
    } else {
      query = `
        SELECT c.id, c.user_id, c.ai_role, c.title, c.model_id, c.status,
               c.is_pinned, c.created_at, c.updated_at,
               m.name AS model_name,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) AS message_count
        FROM conversations c
        LEFT JOIN ai_models m ON c.model_id = m.id
        WHERE c.user_id = 1 AND c.status != 'deleted'
        ORDER BY c.is_pinned DESC, c.updated_at DESC
      `;
      params = [];
    }

    const [rows] = await pool.execute(query, params);

    // 转换为前端期望的格式（兼容现有 ConversationDTO）
    const conversations = rows.map(row => ({
      id: row.id,
      title: row.title,
      type: row.ai_role,
      status: row.status,
      modelId: row.model_id,
      modelName: row.model_name,
      isPinned: row.is_pinned === 1,
      messageCount: row.message_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json(success(conversations));
  } catch (err) {
    console.error('获取对话列表失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 创建新对话
// POST /api/conversations
// Body: { title?: string, type: 'scout'|'sage'|'maker'|'butler', modelId?: number }
app.post('/api/conversations', async (req, res) => {
  try {
    const pool = getPool();
    const { title, type, modelId } = req.body;

    // 验证角色类型
    const validRoles = ['scout', 'sage', 'maker', 'butler'];
    if (!type || !validRoles.includes(type)) {
      return res.status(400).json(error('type 字段必填，可选值: scout, sage, maker, butler', 400));
    }

    // 如果指定了 modelId，验证模型是否存在
    if (modelId) {
      const [modelRows] = await pool.execute(
        'SELECT id FROM ai_models WHERE id = ? AND is_active = 1', [modelId]
      );
      if (modelRows.length === 0) {
        return res.status(400).json(error('指定的模型不存在或未启用', 400));
      }
    }

    const [result] = await pool.execute(
      'INSERT INTO conversations (user_id, ai_role, title, model_id) VALUES (1, ?, ?, ?)',
      [type, title || '新对话', modelId || null]
    );

    // 查询创建的对话详情
    const [rows] = await pool.execute(
      'SELECT * FROM conversations WHERE id = ?',
      [result.insertId]
    );

    const conv = rows[0];
    res.json(success({
      id: conv.id,
      title: conv.title,
      type: conv.ai_role,
      status: conv.status,
      modelId: conv.model_id,
      isPinned: conv.is_pinned === 1,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
    }));
  } catch (err) {
    console.error('创建对话失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 获取对话详情（含消息列表）
// GET /api/conversations/:id
app.get('/api/conversations/:id', async (req, res) => {
  try {
    const pool = getPool();
    const convId = parseInt(req.params.id, 10);

    if (isNaN(convId)) {
      return res.status(400).json(error('无效的对话ID', 400));
    }

    // 查询对话信息
    const [convRows] = await pool.execute(
      `SELECT c.*, m.name AS model_name FROM conversations c
       LEFT JOIN ai_models m ON c.model_id = m.id
       WHERE c.id = ? AND c.status != 'deleted'`,
      [convId]
    );

    if (convRows.length === 0) {
      return res.status(404).json(error('对话不存在', 404));
    }

    const conv = convRows[0];

    // 查询消息列表
    const [msgRows] = await pool.execute(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [convId]
    );

    res.json(success({
      id: conv.id,
      title: conv.title,
      type: conv.ai_role,
      status: conv.status,
      modelId: conv.model_id,
      modelName: conv.model_name,
      isPinned: conv.is_pinned === 1,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      messages: msgRows.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        tokenCount: msg.token_count,
        metadata: msg.metadata,
        isError: msg.is_error === 1,
        createdAt: msg.created_at,
      })),
    }));
  } catch (err) {
    console.error('获取对话详情失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 更新对话（标题、状态、置顶）
// PUT /api/conversations/:id
// Body: { title?: string, status?: 'active'|'archived', isPinned?: boolean }
app.put('/api/conversations/:id', async (req, res) => {
  try {
    const pool = getPool();
    const convId = parseInt(req.params.id, 10);
    const { title, status, isPinned } = req.body;

    if (isNaN(convId)) {
      return res.status(400).json(error('无效的对话ID', 400));
    }

    // 构建动态更新语句
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (status !== undefined) {
      const validStatus = ['active', 'archived', 'deleted'];
      if (!validStatus.includes(status)) {
        return res.status(400).json(error('无效的状态值', 400));
      }
      updates.push('status = ?');
      params.push(status);
    }
    if (isPinned !== undefined) {
      updates.push('is_pinned = ?');
      params.push(isPinned ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json(error('没有需要更新的字段', 400));
    }

    params.push(convId);
    await pool.execute(
      `UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json(success({ message: '更新成功' }));
  } catch (err) {
    console.error('更新对话失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 删除对话（软删除，设置 status = 'deleted'）
// DELETE /api/conversations/:id
app.delete('/api/conversations/:id', async (req, res) => {
  try {
    const pool = getPool();
    const convId = parseInt(req.params.id, 10);

    if (isNaN(convId)) {
      return res.status(400).json(error('无效的对话ID', 400));
    }

    // 检查对话是否存在
    const [rows] = await pool.execute(
      'SELECT id FROM conversations WHERE id = ?', [convId]
    );

    if (rows.length === 0) {
      return res.status(404).json(error('对话不存在', 404));
    }

    // 软删除：将状态设置为 deleted
    await pool.execute(
      'UPDATE conversations SET status = ? WHERE id = ?',
      ['deleted', convId]
    );

    res.json(success({ message: '删除成功' }));
  } catch (err) {
    console.error('删除对话失败:', err);
    res.status(500).json(error(err.message));
  }
});
```

- [ ] 步骤2：验证对话 CRUD API

**curl 测试命令：**

```bash
# 1. 创建新对话
curl -X POST http://localhost:8080/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title":"测试对话API","type":"sage","modelId":1}'
# 预期：返回 code=200，包含新创建的对话 id

# 2. 获取所有对话列表
curl http://localhost:8080/api/conversations
# 预期：返回包含刚创建的对话的数组

# 3. 按角色获取对话列表
curl http://localhost:8080/api/conversations/sage
# 预期：只返回 ai_role=sage 的对话

# 4. 验证无效角色参数
curl http://localhost:8080/api/conversations/invalid_role
# 预期：返回 code=400，提示无效的AI角色

# 5. 获取对话详情（含消息）
curl http://localhost:8080/api/conversations/1
# 预期：返回对话详情和消息数组

# 6. 更新对话标题
curl -X PUT http://localhost:8080/api/conversations/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"更新后的标题","isPinned":true}'
# 预期：返回 code=200，更新成功

# 7. 删除对话（软删除）
curl -X DELETE http://localhost:8080/api/conversations/1
# 预期：返回 code=200，删除成功

# 8. 验证删除后获取详情返回404
curl http://localhost:8080/api/conversations/1
# 预期：返回 code=404，对话不存在

# 9. 测试创建无效类型对话
curl -X POST http://localhost:8080/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title":"测试","type":"invalid"}'
# 预期：返回 code=400，提示 type 字段必填
```

- [ ] 步骤3：进入任务2，实现消息 CRUD API

---

### 任务2：实现消息CRUD API

**文件：** Modify `f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\server.js`

- [ ] 步骤1：替换原有的 mock 消息接口（原 `app.post('/api/conversations/:id/messages')` 和 `app.post('/api/chat/send')`），实现真实数据库消息操作

**完整 API 代码（在对话 CRUD 之后添加）：**

```javascript
// ========== 消息 CRUD API ==========

// 获取指定对话的消息列表
// GET /api/messages/:conversationId
app.get('/api/messages/:conversationId', async (req, res) => {
  try {
    const pool = getPool();
    const convId = parseInt(req.params.conversationId, 10);

    if (isNaN(convId)) {
      return res.status(400).json(error('无效的对话ID', 400));
    }

    // 检查对话是否存在
    const [convRows] = await pool.execute(
      "SELECT id FROM conversations WHERE id = ? AND status != 'deleted'", [convId]
    );
    if (convRows.length === 0) {
      return res.status(404).json(error('对话不存在', 404));
    }

    // 查询消息列表（按时间正序）
    const [rows] = await pool.execute(
      `SELECT id, conversation_id, role, content, token_count, metadata, is_error, created_at
       FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`,
      [convId]
    );

    res.json(success(rows.map(row => ({
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      tokenCount: row.token_count,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      isError: row.is_error === 1,
      createdAt: row.created_at,
    }))));
  } catch (err) {
    console.error('获取消息列表失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 添加消息到指定对话
// POST /api/messages
// Body: { conversationId: number, role: 'user'|'assistant'|'system', content: string, tokenCount?: number, metadata?: object }
app.post('/api/messages', async (req, res) => {
  try {
    const pool = getPool();
    const { conversationId, role, content, tokenCount, metadata } = req.body;

    // 参数验证
    if (!conversationId) {
      return res.status(400).json(error('conversationId 字段必填', 400));
    }
    const validRoles = ['user', 'assistant', 'system'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json(error('role 字段必填，可选值: user, assistant, system', 400));
    }
    if (!content) {
      return res.status(400).json(error('content 字段必填', 400));
    }

    const convId = parseInt(conversationId, 10);

    // 检查对话是否存在
    const [convRows] = await pool.execute(
      "SELECT id FROM conversations WHERE id = ? AND status != 'deleted'", [convId]
    );
    if (convRows.length === 0) {
      return res.status(404).json(error('对话不存在', 404));
    }

    // 插入消息
    const metadataStr = metadata ? JSON.stringify(metadata) : null;
    const [result] = await pool.execute(
      `INSERT INTO messages (conversation_id, role, content, token_count, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [convId, role, content, tokenCount || 0, metadataStr]
    );

    // 更新对话的 updated_at 时间戳
    await pool.execute(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [convId]
    );

    // 查询插入的消息
    const [msgRows] = await pool.execute(
      'SELECT * FROM messages WHERE id = ?',
      [result.insertId]
    );

    const msg = msgRows[0];
    res.json(success({
      id: msg.id,
      conversationId: msg.conversation_id,
      role: msg.role,
      content: msg.content,
      tokenCount: msg.token_count,
      metadata: typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata,
      isError: msg.is_error === 1,
      createdAt: msg.created_at,
    }));
  } catch (err) {
    console.error('添加消息失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 兼容旧路径：添加消息到指定对话（保持前端 conversationService.ts 兼容）
// POST /api/conversations/:id/messages
// Body: { role: string, content: string, tokenCount?: number }
app.post('/api/conversations/:id/messages', async (req, res) => {
  try {
    const pool = getPool();
    const convId = parseInt(req.params.id, 10);
    const { role, content, tokenCount } = req.body;

    if (isNaN(convId)) {
      return res.status(400).json(error('无效的对话ID', 400));
    }

    // 验证角色
    const validRoles = ['user', 'assistant', 'system'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json(error('role 字段必填，可选值: user, assistant, system', 400));
    }
    if (!content) {
      return res.status(400).json(error('content 字段必填', 400));
    }

    // 检查对话是否存在
    const [convRows] = await pool.execute(
      "SELECT id FROM conversations WHERE id = ? AND status != 'deleted'", [convId]
    );
    if (convRows.length === 0) {
      return res.status(404).json(error('对话不存在', 404));
    }

    // 插入消息
    const [result] = await pool.execute(
      `INSERT INTO messages (conversation_id, role, content, token_count)
       VALUES (?, ?, ?, ?)`,
      [convId, role, content, tokenCount || 0]
    );

    // 更新对话的 updated_at
    await pool.execute(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [convId]
    );

    res.json(success({
      id: result.insertId,
      role,
      content,
      tokenCount: tokenCount || 0,
      createdAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.error('添加消息失败(旧路径):', err);
    res.status(500).json(error(err.message));
  }
});
```

- [ ] 步骤2：验证消息 CRUD API

**curl 测试命令：**

```bash
# 1. 先创建一个测试对话
curl -X POST http://localhost:8080/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title":"消息测试对话","type":"scout"}'
# 记录返回的对话 id，假设为 10

# 2. 添加用户消息
curl -X POST http://localhost:8080/api/messages \
  -H "Content-Type: application/json" \
  -d '{"conversationId":10,"role":"user","content":"你好，帮我分析一下校园市场","tokenCount":15}'
# 预期：返回 code=200，包含新消息 id

# 3. 添加AI回复消息（带 metadata）
curl -X POST http://localhost:8080/api/messages \
  -H "Content-Type: application/json" \
  -d '{"conversationId":10,"role":"assistant","content":"好的，校园市场具有用户密度高、传播速度快等特点...","tokenCount":50,"metadata":{"model":"glm-4","response_time_ms":1200}}'
# 预期：返回 code=200，metadata 正确存储

# 4. 获取对话的消息列表
curl http://localhost:8080/api/messages/10
# 预期：返回 2 条消息（按时间正序），metadata 已解析为对象

# 5. 测试兼容旧路径添加消息
curl -X POST http://localhost:8080/api/conversations/10/messages \
  -H "Content-Type: application/json" \
  -d '{"role":"user","content":"旧路径兼容测试","tokenCount":8}'
# 预期：返回 code=200，消息添加成功

# 6. 验证不存在的对话添加消息返回404
curl -X POST http://localhost:8080/api/messages \
  -H "Content-Type: application/json" \
  -d '{"conversationId":99999,"role":"user","content":"测试"}'
# 预期：返回 code=404，对话不存在

# 7. 验证缺少必填字段
curl -X POST http://localhost:8080/api/messages \
  -H "Content-Type: application/json" \
  -d '{"role":"user","content":"缺少conversationId"}'
# 预期：返回 code=400，提示 conversationId 必填

# 8. 验证消息已持久化（通过对话详情接口）
curl http://localhost:8080/api/conversations/10
# 预期：返回对话详情，messages 数组包含 3 条消息
```

- [ ] 步骤3：进入任务3，实现 AI 模型配置 API

---

### 任务3：实现AI模型配置API

**文件：** Modify `f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\server.js`

- [ ] 步骤1：在消息 CRUD API 之后添加 AI 模型配置管理接口

**完整 API 代码：**

```javascript
// ========== AI模型配置 API ==========

// 简单的 API Key 加密/解密函数（使用 Base64 + 简单异或，生产环境应使用 AES-256）
const MODEL_API_KEY_SECRET = process.env.MODEL_API_KEY_SECRET || 'ai-mate-default-secret-key';

function encryptApiKey(plainKey) {
  // 简单加密：Base64 编码后反转（生产环境请替换为 AES-256）
  const combined = plainKey + ':' + MODEL_API_KEY_SECRET;
  return Buffer.from(combined).toString('base64').split('').reverse().join('');
}

function decryptApiKey(encKey) {
  try {
    const reversed = encKey.split('').reverse().join('');
    const decoded = Buffer.from(reversed, 'base64').toString('utf-8');
    const [apiKey] = decoded.split(':' + MODEL_API_KEY_SECRET);
    return apiKey;
  } catch {
    return null;
  }
}

// 获取所有AI模型配置列表
// GET /api/ai/models?activeOnly=true
app.get('/api/ai/models', async (req, res) => {
  try {
    const pool = getPool();
    const { activeOnly } = req.query;

    let query = 'SELECT * FROM ai_models';
    const params = [];
    if (activeOnly === 'true') {
      query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY sort_order ASC, id ASC';

    const [rows] = await pool.execute(query, params);

    const models = rows.map(row => ({
      id: row.id,
      name: row.name,
      provider: row.provider,
      apiEndpoint: row.api_endpoint,
      modelId: row.model_id,
      hasApiKey: !!row.api_key_enc, // 不返回密钥本身，只返回是否存在
      config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config,
      isActive: row.is_active === 1,
      isDefault: row.is_default === 1,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
    }));

    res.json(success(models));
  } catch (err) {
    console.error('获取AI模型列表失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 创建新的AI模型配置
// POST /api/ai/models
// Body: { name, provider, apiEndpoint, modelId, apiKey, config?, isActive?, isDefault?, sortOrder? }
app.post('/api/ai/models', async (req, res) => {
  try {
    const pool = getPool();
    const { name, provider, apiEndpoint, modelId, apiKey, config, isActive, isDefault, sortOrder } = req.body;

    // 参数验证
    if (!name || !provider || !apiEndpoint || !modelId || !apiKey) {
      return res.status(400).json(error('name, provider, apiEndpoint, modelId, apiKey 均为必填字段', 400));
    }

    const validProviders = ['zhipu', 'coze', 'openai'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json(error('provider 可选值: zhipu, coze, openai', 400));
    }

    // 检查是否已存在相同 provider + modelId 的配置
    const [existing] = await pool.execute(
      'SELECT id FROM ai_models WHERE provider = ? AND model_id = ?', [provider, modelId]
    );
    if (existing.length > 0) {
      return res.status(409).json(error('该提供商下已存在相同 modelId 的配置', 409));
    }

    // 加密 API Key
    const encryptedKey = encryptApiKey(apiKey);
    const configStr = config ? JSON.stringify(config) : null;

    const [result] = await pool.execute(
      `INSERT INTO ai_models (name, provider, api_endpoint, model_id, api_key_enc, config, is_active, is_default, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, provider, apiEndpoint, modelId, encryptedKey, configStr,
        isActive !== false ? 1 : 0,
        isDefault ? 1 : 0,
        sortOrder || 0
      ]
    );

    // 如果设为默认，取消其他默认设置
    if (isDefault) {
      await pool.execute(
        'UPDATE ai_models SET is_default = 0 WHERE id != ?', [result.insertId]
      );
    }

    res.json(success({
      id: result.insertId,
      name,
      provider,
      apiEndpoint,
      modelId,
      hasApiKey: true,
      config: config || null,
      isActive: isActive !== false,
      isDefault: !!isDefault,
      sortOrder: sortOrder || 0,
    }));
  } catch (err) {
    console.error('创建AI模型配置失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 更新AI模型配置
// PUT /api/ai/models/:id
// Body: { name?, apiEndpoint?, apiKey?, config?, isActive?, isDefault?, sortOrder? }
app.put('/api/ai/models/:id', async (req, res) => {
  try {
    const pool = getPool();
    const modelId = parseInt(req.params.id, 10);

    if (isNaN(modelId)) {
      return res.status(400).json(error('无效的模型ID', 400));
    }

    // 检查模型是否存在
    const [existing] = await pool.execute('SELECT * FROM ai_models WHERE id = ?', [modelId]);
    if (existing.length === 0) {
      return res.status(404).json(error('模型配置不存在', 404));
    }

    const { name, apiEndpoint, apiKey, config, isActive, isDefault, sortOrder } = req.body;

    // 构建动态更新
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (apiEndpoint !== undefined) { updates.push('api_endpoint = ?'); params.push(apiEndpoint); }
    if (apiKey !== undefined) {
      updates.push('api_key_enc = ?');
      params.push(encryptApiKey(apiKey));
    }
    if (config !== undefined) {
      updates.push('config = ?');
      params.push(config ? JSON.stringify(config) : null);
    }
    if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }
    if (isDefault !== undefined) { updates.push('is_default = ?'); params.push(isDefault ? 1 : 0); }
    if (sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(sortOrder); }

    if (updates.length === 0) {
      return res.status(400).json(error('没有需要更新的字段', 400));
    }

    params.push(modelId);
    await pool.execute(`UPDATE ai_models SET ${updates.join(', ')} WHERE id = ?`, params);

    // 如果设为默认，取消其他默认设置
    if (isDefault) {
      await pool.execute('UPDATE ai_models SET is_default = 0 WHERE id != ?', [modelId]);
    }

    res.json(success({ message: '更新成功' }));
  } catch (err) {
    console.error('更新AI模型配置失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 删除AI模型配置
// DELETE /api/ai/models/:id
app.delete('/api/ai/models/:id', async (req, res) => {
  try {
    const pool = getPool();
    const modelId = parseInt(req.params.id, 10);

    if (isNaN(modelId)) {
      return res.status(400).json(error('无效的模型ID', 400));
    }

    // 检查是否有关联的对话
    const [convCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM conversations WHERE model_id = ? AND status != "deleted"', [modelId]
    );
    if (convCount[0].count > 0) {
      return res.status(400).json(error(`有 ${convCount[0].count} 个对话正在使用该模型，无法删除`, 400));
    }

    await pool.execute('DELETE FROM ai_models WHERE id = ?', [modelId]);
    res.json(success({ message: '删除成功' }));
  } catch (err) {
    console.error('删除AI模型配置失败:', err);
    res.status(500).json(error(err.message));
  }
});
```

- [ ] 步骤2：验证 AI 模型配置 API

**curl 测试命令：**

```bash
# 1. 获取所有模型列表
curl http://localhost:8080/api/ai/models
# 预期：返回 4 个默认模型（智谱GLM-4系列 + Coze），hasApiKey 为 true 但不包含密钥

# 2. 只获取启用的模型
curl "http://localhost:8080/api/ai/models?activeOnly=true"
# 预期：返回 is_active=1 的模型

# 3. 创建新模型配置
curl -X POST http://localhost:8080/api/ai/models \
  -H "Content-Type: application/json" \
  -d '{"name":"测试模型","provider":"openai","apiEndpoint":"https://api.openai.com/v1/chat/completions","modelId":"gpt-4","apiKey":"sk-test-key-123","config":{"temperature":0.5,"max_tokens":2048},"isDefault":false}'
# 预期：返回 code=200，包含新模型 id，apiKey 已加密存储

# 4. 验证重复创建返回409
curl -X POST http://localhost:8080/api/ai/models \
  -H "Content-Type: application/json" \
  -d '{"name":"重复测试","provider":"openai","apiEndpoint":"https://api.openai.com","modelId":"gpt-4","apiKey":"sk-another"}'
# 预期：返回 code=409，已存在相同 modelId

# 5. 更新模型配置
curl -X PUT http://localhost:8080/api/ai/models/5 \
  -H "Content-Type: application/json" \
  -d '{"name":"更新后的模型名","isActive":false}'
# 预期：返回 code=200，更新成功

# 6. 设置为默认模型
curl -X PUT http://localhost:8080/api/ai/models/1 \
  -H "Content-Type: application/json" \
  -d '{"isDefault":true}'
# 预期：返回 code=200，其他模型的 is_default 被取消

# 7. 删除模型配置
curl -X DELETE http://localhost:8080/api/ai/models/5
# 预期：返回 code=200，删除成功

# 8. 验证删除关联模型被阻止
# 先创建一个关联模型的对话，再尝试删除模型
curl -X POST http://localhost:8080/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title":"关联模型测试","type":"sage","modelId":1}'
curl -X DELETE http://localhost:8080/api/ai/models/1
# 预期：返回 code=400，有对话正在使用该模型
```

- [ ] 步骤3：进入任务4，实现知识库管理 API

---

### 任务4：实现知识库管理API

**文件：** Modify `f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\server.js`

- [ ] 步骤1：在 AI 模型配置 API 之后添加知识库管理接口（含全文检索）

**完整 API 代码：**

```javascript
// ========== 知识库管理 API ==========

// 获取知识库列表（支持分类筛选和分页）
// GET /api/knowledge-base?category=&page=&pageSize=
app.get('/api/knowledge-base', async (req, res) => {
  try {
    const pool = getPool();
    const { category, page = '1', pageSize = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const size = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
    const offset = (pageNum - 1) * size;

    let query = 'SELECT * FROM knowledge_base WHERE is_published = 1';
    let countQuery = 'SELECT COUNT(*) as total FROM knowledge_base WHERE is_published = 1';
    const params = [];
    const countParams = [];

    if (category) {
      const validCategories = ['case', 'policy', 'report', 'tutorial'];
      if (!validCategories.includes(category)) {
        return res.status(400).json(error('无效的分类，可选值: case, policy, report, tutorial', 400));
      }
      query += ' AND category = ?';
      countQuery += ' AND category = ?';
      params.push(category);
      countParams.push(category);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(size, offset);

    const [rows] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);

    const items = rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      source: row.source,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
      viewCount: row.view_count,
      createdAt: row.created_at,
    }));

    res.json(success({
      items,
      total: countResult[0].total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(countResult[0].total / size),
    }));
  } catch (err) {
    console.error('获取知识库列表失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 获取知识库详情（同时增加浏览次数）
// GET /api/knowledge-base/:id
app.get('/api/knowledge-base/:id', async (req, res) => {
  try {
    const pool = getPool();
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json(error('无效的知识条目ID', 400));
    }

    const [rows] = await pool.execute(
      'SELECT * FROM knowledge_base WHERE id = ? AND is_published = 1', [id]
    );

    if (rows.length === 0) {
      return res.status(404).json(error('知识条目不存在', 404));
    }

    // 增加浏览次数
    await pool.execute('UPDATE knowledge_base SET view_count = view_count + 1 WHERE id = ?', [id]);

    const row = rows[0];
    res.json(success({
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      source: row.source,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
      viewCount: row.view_count + 1,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('获取知识库详情失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 创建知识库条目
// POST /api/knowledge-base
// Body: { title, content, category, source?, tags? }
app.post('/api/knowledge-base', async (req, res) => {
  try {
    const pool = getPool();
    const { title, content, category, source, tags } = req.body;

    // 参数验证
    if (!title || !content || !category) {
      return res.status(400).json(error('title, content, category 均为必填字段', 400));
    }

    const validCategories = ['case', 'policy', 'report', 'tutorial'];
    if (!validCategories.includes(category)) {
      return res.status(400).json(error('category 可选值: case, policy, report, tutorial', 400));
    }

    const tagsStr = tags ? JSON.stringify(tags) : null;
    const [result] = await pool.execute(
      'INSERT INTO knowledge_base (title, content, category, source, tags) VALUES (?, ?, ?, ?, ?)',
      [title, content, category, source || null, tagsStr]
    );

    res.json(success({
      id: result.insertId,
      title,
      content,
      category,
      source: source || null,
      tags: tags || [],
      viewCount: 0,
      createdAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.error('创建知识库条目失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 知识库全文检索（RAG 核心接口）
// GET /api/knowledge-base/search?query=关键词&category=&limit=
// 使用 MySQL FULLTEXT INDEX with ngram parser 进行中文全文检索
app.get('/api/knowledge-base/search', async (req, res) => {
  try {
    const pool = getPool();
    const { query: searchQuery, category, limit = '5' } = req.query;

    if (!searchQuery || searchQuery.trim().length === 0) {
      return res.status(400).json(error('query 搜索关键词不能为空', 400));
    }

    const resultLimit = Math.min(20, Math.max(1, parseInt(limit, 10) || 5));
    const params = [];

    // 使用 BOOLEAN MODE 进行全文检索，支持更灵活的查询
    // 同时用 NATURAL LANGUAGE MODE 计算相关性分数
    let sql = `
      SELECT
        id, title, content, category, source, tags, view_count, created_at,
        MATCH(title, content) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance
      FROM knowledge_base
      WHERE is_published = 1
        AND MATCH(title, content) AGAINST(? IN BOOLEAN MODE)
    `;
    params.push(searchQuery, searchQuery);

    if (category) {
      const validCategories = ['case', 'policy', 'report', 'tutorial'];
      if (!validCategories.includes(category)) {
        return res.status(400).json(error('无效的分类', 400));
      }
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY relevance DESC LIMIT ?';
    params.push(resultLimit);

    const [rows] = await pool.execute(sql, params);

    // 截取内容摘要（前200字符）用于预览
    const results = rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      excerpt: row.content.length > 200 ? row.content.substring(0, 200) + '...' : row.content,
      category: row.category,
      source: row.source,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
      relevance: Number(row.relevance),
      createdAt: row.created_at,
    }));

    res.json(success({
      query: searchQuery,
      total: results.length,
      results,
    }));
  } catch (err) {
    console.error('知识库检索失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 更新知识库条目
// PUT /api/knowledge-base/:id
// Body: { title?, content?, category?, source?, tags?, isPublished? }
app.put('/api/knowledge-base/:id', async (req, res) => {
  try {
    const pool = getPool();
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json(error('无效的知识条目ID', 400));
    }

    const { title, content, category, source, tags, isPublished } = req.body;

    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (content !== undefined) { updates.push('content = ?'); params.push(content); }
    if (category !== undefined) {
      const validCategories = ['case', 'policy', 'report', 'tutorial'];
      if (!validCategories.includes(category)) {
        return res.status(400).json(error('无效的分类', 400));
      }
      updates.push('category = ?'); params.push(category);
    }
    if (source !== undefined) { updates.push('source = ?'); params.push(source); }
    if (tags !== undefined) { updates.push('tags = ?'); params.push(tags ? JSON.stringify(tags) : null); }
    if (isPublished !== undefined) { updates.push('is_published = ?'); params.push(isPublished ? 1 : 0); }

    if (updates.length === 0) {
      return res.status(400).json(error('没有需要更新的字段', 400));
    }

    params.push(id);
    const [result] = await pool.execute(
      `UPDATE knowledge_base SET ${updates.join(', ')} WHERE id = ?`, params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(error('知识条目不存在', 404));
    }

    res.json(success({ message: '更新成功' }));
  } catch (err) {
    console.error('更新知识库条目失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 删除知识库条目
// DELETE /api/knowledge-base/:id
app.delete('/api/knowledge-base/:id', async (req, res) => {
  try {
    const pool = getPool();
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json(error('无效的知识条目ID', 400));
    }

    const [result] = await pool.execute('DELETE FROM knowledge_base WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json(error('知识条目不存在', 404));
    }

    res.json(success({ message: '删除成功' }));
  } catch (err) {
    console.error('删除知识库条目失败:', err);
    res.status(500).json(error(err.message));
  }
});
```

- [ ] 步骤2：验证知识库管理 API

**curl 测试命令：**

```bash
# 1. 获取知识库列表
curl http://localhost:8080/api/knowledge-base
# 预期：返回包含 5 条示例数据的分页列表

# 2. 按分类筛选
curl "http://localhost:8080/api/knowledge-base?category=policy"
# 预期：只返回 category=policy 的条目

# 3. 分页查询
curl "http://localhost:8080/api/knowledge-base?page=1&pageSize=2"
# 预期：返回 total=5, pageSize=2, totalPages=3

# 4. 全文检索（核心 RAG 接口）
curl "http://localhost:8080/api/knowledge-base/search?query=大学生创业税收"
# 预期：返回相关条目，按 relevance 排序，包含 excerpt 摘要

# 5. 带分类的全文检索
curl "http://localhost:8080/api/knowledge-base/search?query=创业补贴&category=policy"
# 预期：只返回 policy 分类中匹配"创业补贴"的条目

# 6. 创建知识库条目
curl -X POST http://localhost:8080/api/knowledge-base \
  -H "Content-Type: application/json" \
  -d '{"title":"大学生创业孵化基地申请指南","content":"各地大学生创业孵化基地为创业者提供免费办公场地、导师辅导、资源对接等服务。申请条件包括：在校大学生或毕业5年内毕业生、有完整创业项目计划书...","category":"tutorial","source":"地方人社局","tags":["孵化基地","创业场地","导师辅导"]}'
# 预期：返回 code=200，包含新条目 id

# 7. 验证新条目可被检索
curl "http://localhost:8080/api/knowledge-base/search?query=孵化基地"
# 预期：返回刚创建的条目

# 8. 获取详情（浏览次数自增）
curl http://localhost:8080/api/knowledge-base/1
# 预期：返回详情，viewCount 比之前 +1

# 9. 更新知识库条目
curl -X PUT http://localhost:8080/api/knowledge-base/6 \
  -H "Content-Type: application/json" \
  -d '{"title":"更新后的标题","tags":["新标签1","新标签2"]}'
# 预期：返回 code=200，更新成功

# 10. 验证空关键词检索返回400
curl "http://localhost:8080/api/knowledge-base/search?query="
# 预期：返回 code=400，提示搜索关键词不能为空

# 11. 删除知识库条目
curl -X DELETE http://localhost:8080/api/knowledge-base/6
# 预期：返回 code=200，删除成功
```

- [ ] 步骤3：进入任务5，添加错误处理中间件和统一响应格式

---

### 任务5：添加错误处理中间件和统一响应格式

**文件：** Modify `f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\server.js`

- [ ] 步骤1：在 server.js 顶部增强统一响应格式工具函数，并在所有路由之后添加全局错误处理中间件

**增强的统一响应格式工具函数（替换原有第 12-13 行）：**

```javascript
// ========== 统一响应格式 ==========

// 成功响应
const success = (data, message = 'success') => ({
  code: 200,
  data,
  message,
});

// 错误响应
const error = (msg, code = 500) => ({
  code,
  data: null,
  message: msg,
});

// 分页响应辅助函数
const paginated = (items, total, page, pageSize) => ({
  code: 200,
  data: {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  },
  message: 'success',
});

// 请求参数验证辅助函数
const validateRequired = (body, fields) => {
  const missing = fields.filter(f => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length > 0) {
    return `缺少必填字段: ${missing.join(', ')}`;
  }
  return null;
};

// 枚举值验证辅助函数
const validateEnum = (value, enumName, validValues) => {
  if (value !== undefined && !validValues.includes(value)) {
    return `${enumName} 可选值: ${validValues.join(', ')}`;
  }
  return null;
};
```

**全局错误处理中间件（在所有路由定义之后、`startServer()` 函数之前添加）：**

```javascript
// ========== 全局错误处理中间件 ==========

// 404 处理 - 未匹配到任何路由
app.use((req, res) => {
  res.status(404).json(error(`接口不存在: ${req.method} ${req.path}`, 404));
});

// 全局错误处理 - 捕获所有未处理的异常
app.use((err, req, res, next) => {
  console.error('全局错误捕获:', {
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });

  // 数据库错误处理
  if (err.code === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json(error('数据库表不存在，请检查数据库是否已正确初始化', 500));
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json(error('数据重复，违反唯一约束', 409));
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json(error('外键约束失败，关联数据不存在', 400));
  }
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json(error('数据库连接失败，服务暂不可用', 503));
  }

  // JSON 解析错误
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json(error('请求体 JSON 格式错误', 400));
  }

  // 请求体过大
  if (err.type === 'entity.too.large') {
    return res.status(413).json(error('请求体过大', 413));
  }

  // 默认错误
  res.status(err.status || 500).json(error(err.message || '服务器内部错误', err.status || 500));
});

// 请求日志中间件（放在所有路由之前，cors 之后）
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});
```

- [ ] 步骤2：验证错误处理中间件

**curl 测试命令：**

```bash
# 1. 测试 404 路由不存在
curl http://localhost:8080/api/nonexistent
# 预期：返回 code=404，message="接口不存在: GET /api/nonexistent"

# 2. 测试 JSON 解析错误
curl -X POST http://localhost:8080/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"invalid json'
# 预期：返回 code=400，message="请求体 JSON 格式错误"

# 3. 测试缺少必填字段（利用验证辅助函数）
# 需要在创建对话接口中使用 validateRequired:
# const validationError = validateRequired(req.body, ['type']);
# if (validationError) return res.status(400).json(error(validationError, 400));

curl -X POST http://localhost:8080/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title":"缺少type字段"}'
# 预期：返回 code=400，提示缺少必填字段

# 4. 查看请求日志（在服务器控制台输出中验证）
# 预期日志格式：[2026-01-01T00:00:00.000Z] GET /api/conversations 200 15ms

# 5. 综合端到端测试：完整的对话-消息-检索流程
echo "=== 端到端测试开始 ==="

# 5.1 创建对话
CONV_RESPONSE=$(curl -s -X POST http://localhost:8080/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title":"E2E测试对话","type":"sage","modelId":1}')
echo "创建对话: $CONV_RESPONSE"

# 5.2 提取对话ID
CONV_ID=$(echo $CONV_RESPONSE | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data.id))")
echo "对话ID: $CONV_ID"

# 5.3 添加用户消息
curl -s -X POST http://localhost:8080/api/messages \
  -H "Content-Type: application/json" \
  -d "{\"conversationId\":$CONV_ID,\"role\":\"user\",\"content\":\"什么是大学生创业税收优惠政策？\",\"tokenCount\":20}"

# 5.4 添加AI回复消息
curl -s -X POST http://localhost:8080/api/messages \
  -H "Content-Type: application/json" \
  -d "{\"conversationId\":$CONV_ID,\"role\":\"assistant\",\"content\":\"根据政策，大学生创业可享受每年14400元的税收减免限额...\",\"tokenCount\":45,\"metadata\":{\"model\":\"glm-4\",\"response_time_ms\":1500}}"

# 5.5 检索知识库获取相关参考
curl -s "http://localhost:8080/api/knowledge-base/search?query=大学生创业税收优惠&limit=3"

# 5.6 验证对话详情包含所有消息
curl -s "http://localhost:8080/api/conversations/$CONV_ID"

# 5.7 清理测试数据
curl -s -X DELETE "http://localhost:8080/api/conversations/$CONV_ID"

echo "=== 端到端测试完成 ==="
```

- [ ] 步骤3：Plan-02 完成，进入 Plan-03-AI模型集成层.md

---

## 总结

### 修改文件清单
| 文件 | 操作 | 修改内容 |
|------|------|----------|
| `ai-mate/react-ai-chat/server.js` | 修改 | 替换 mock 接口为真实数据库操作，新增模型配置和知识库 API，添加错误处理中间件 |

### API 接口清单
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | /api/conversations/:role? | 获取对话列表（可选角色筛选） |
| POST | /api/conversations | 创建新对话 |
| GET | /api/conversations/:id | 获取对话详情（含消息） |
| PUT | /api/conversations/:id | 更新对话（标题/状态/置顶） |
| DELETE | /api/conversations/:id | 删除对话（软删除） |
| GET | /api/messages/:conversationId | 获取对话消息列表 |
| POST | /api/messages | 添加消息（新路径） |
| POST | /api/conversations/:id/messages | 添加消息（兼容旧路径） |
| GET | /api/ai/models | 获取模型配置列表 |
| POST | /api/ai/models | 创建模型配置 |
| PUT | /api/ai/models/:id | 更新模型配置 |
| DELETE | /api/ai/models/:id | 删除模型配置 |
| GET | /api/knowledge-base | 获取知识库列表（分页+分类） |
| GET | /api/knowledge-base/:id | 获取知识库详情 |
| POST | /api/knowledge-base | 创建知识库条目 |
| PUT | /api/knowledge-base/:id | 更新知识库条目 |
| DELETE | /api/knowledge-base/:id | 删除知识库条目 |
| GET | /api/knowledge-base/search | 知识库全文检索（RAG核心） |

### 注意事项
1. **API Key 安全：** 模型配置接口不返回明文密钥，只返回 `hasApiKey` 布尔值。加密函数使用简单 Base64+异或，生产环境应替换为 AES-256。
2. **软删除策略：** 对话使用软删除（status='deleted'），保留数据可恢复。知识库条目使用硬删除。
3. **分页支持：** 知识库列表接口支持 `page` 和 `pageSize` 参数，默认每页 20 条，最大 100 条。
4. **全文检索：** 知识库搜索接口同时使用 BOOLEAN MODE（精确匹配）和 NATURAL LANGUAGE MODE（相关性排序），确保检索质量。
5. **向后兼容：** 保留了 `/api/conversations/:id/messages` 旧路径，确保前端 `conversationService.ts` 无需修改即可工作。
6. **请求日志：** 添加了请求日志中间件，记录每个请求的方法、路径、状态码和耗时，便于调试。
