import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDB, getPool } from './db.js';
import { hashPassword, verifyPassword, signToken, optionalAuth, requiredAuth } from './auth.js';
import { loadIndustryData, refreshIndustryData, getIndustryState } from './industryData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 8080;

const success = (data) => ({ code: 200, data, message: 'success' });
const error = (msg, code = 500) => ({ code, data: null, message: msg });

// ========== 火山方舟 API 转发 ==========

/**
 * 转发请求到火山方舟 API
 * @param {object} modelConfig - 模型配置 { modelId, baseUrl, apiKey, multimodal }
 * @param {array} messages - 消息列表
 * @param {string} systemPrompt - 系统提示词
 * @param {boolean} stream - 是否流式
 * @param {array} tools - 工具定义列表（OpenAI function calling 格式）
 */
async function callArkAPI(modelConfig, messages, systemPrompt, stream, tools) {
  const { modelId, baseUrl, apiKey } = modelConfig;

  if (!apiKey) {
    throw new Error('未配置 API Key，请在设置中添加模型并填入火山方舟 API Key');
  }
  if (!modelId) {
    throw new Error('未配置模型 ID');
  }

  // 构建消息列表，注入 system prompt
  const arkMessages = [];
  if (systemPrompt) {
    arkMessages.push({ role: 'system', content: systemPrompt });
  }
  arkMessages.push(...messages);

  const url = `${baseUrl}/chat/completions`;
  const body = {
    model: modelId,
    messages: arkMessages,
    stream: !!stream,
  };

  // 透传工具定义（function calling）
  if (Array.isArray(tools) && tools.length > 0) {
    body.tools = tools;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `火山方舟 API 请求失败 (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.error?.message || errJson.message || errMsg;
    } catch {
      errMsg = errText || errMsg;
    }
    throw new Error(errMsg);
  }

  return response;
}

// ========== 用户相关 API ==========

// 获取用户信息
app.get('/api/user/profile', optionalAuth, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (rows.length === 0) {
      return res.status(404).json(error('用户不存在'));
    }
    const row = rows[0];
    res.json(success({
      id: row.id,
      username: row.username,
      nickname: row.username,
      avatar: row.avatar,
      email: row.email,
      level: row.level,
      exp: row.exp,
    }));
  } catch (err) {
    console.error('获取用户信息失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 更新用户信息
app.put('/api/user/profile', optionalAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { username, avatar } = req.body;
    await pool.execute(
      'UPDATE users SET username = ?, avatar = ? WHERE id = ?',
      [username || 'AI 创业者', avatar || null, req.userId]
    );
    res.json(success({ message: '更新成功' }));
  } catch (err) {
    console.error('更新用户信息失败:', err);
    res.status(500).json(error(err.message));
  }
});

// ========== 签到相关 API ==========

// 获取签到记录
app.get('/api/user/sign-in', optionalAuth, async (req, res) => {
  try {
    const pool = getPool();
    const uid = req.userId;
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;

    // 获取本周的签到记录
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const [rows] = await pool.execute(
      'SELECT sign_date, signed FROM sign_in_records WHERE user_id = ? AND sign_date BETWEEN ? AND ? ORDER BY sign_date',
      [uid, startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0]]
    );

    // 构建7天记录
    const records = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const record = rows.find(r => r.sign_date.toISOString().split('T')[0] === dateStr);
      records.push({
        date: dateStr,
        signed: record ? record.signed === 1 : false,
      });
    }

    // 计算连续签到天数
    let consecutiveDays = 0;
    for (let i = records.length - 1; i >= 0; i--) {
      if (records[i].signed) {
        consecutiveDays++;
      } else if (i < records.length - 1) {
        break;
      }
    }

    res.json(success({ records, consecutiveDays }));
  } catch (err) {
    console.error('获取签到记录失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 签到
app.post('/api/user/sign-in', optionalAuth, async (req, res) => {
  try {
    const pool = getPool();
    const uid = req.userId;
    const today = new Date().toISOString().split('T')[0];

    // 检查今天是否已签到
    const [existing] = await pool.execute(
      'SELECT signed FROM sign_in_records WHERE user_id = ? AND sign_date = ?',
      [uid, today]
    );

    if (existing.length > 0 && existing[0].signed === 1) {
      return res.status(400).json(error('今天已经签到过了', 400));
    }

    // 插入或更新签到记录
    await pool.execute(
      `INSERT INTO sign_in_records (user_id, sign_date, signed) VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE signed = 1`,
      [uid, today]
    );

    // 更新用户经验值
    await pool.execute(
      'UPDATE users SET exp = exp + 10 WHERE id = ?',
      [uid]
    );

    res.json(success({ message: '签到成功', signed: true }));
  } catch (err) {
    console.error('签到失败:', err);
    res.status(500).json(error(err.message));
  }
});

// ========== 桌宠相关 API ==========

// 获取桌宠列表
app.get('/api/user/desk-pets', optionalAuth, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM desk_pets WHERE user_id = ? ORDER BY obtained_at DESC',
      [req.userId]
    );
    res.json(success(rows));
  } catch (err) {
    console.error('获取桌宠失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 添加桌宠
app.post('/api/user/desk-pets', optionalAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { pet_id, name, rarity, image, description } = req.body;

    await pool.execute(
      'INSERT INTO desk_pets (user_id, pet_id, name, rarity, image, description) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, pet_id, name, rarity, image, description]
    );

    // 更新用户经验值
    await pool.execute(
      'UPDATE users SET exp = exp + 50 WHERE id = ?',
      [req.userId]
    );

    res.json(success({ message: '获得新桌宠', pet: { pet_id, name, rarity, image, description } }));
  } catch (err) {
    console.error('添加桌宠失败:', err);
    res.status(500).json(error(err.message));
  }
});

// ========== 设置相关 API ==========

// 获取用户设置
app.get('/api/user/settings', optionalAuth, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT dark_mode, notifications, auto_save, sound_effects FROM user_settings WHERE user_id = ?',
      [req.userId]
    );
    if (rows.length === 0) {
      return res.json(success({
        dark_mode: false,
        notifications: true,
        auto_save: true,
        sound_effects: true,
      }));
    }
    res.json(success({
      dark_mode: rows[0].dark_mode === 1,
      notifications: rows[0].notifications === 1,
      auto_save: rows[0].auto_save === 1,
      sound_effects: rows[0].sound_effects === 1,
    }));
  } catch (err) {
    console.error('获取设置失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 更新用户设置
app.put('/api/user/settings', optionalAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { dark_mode, notifications, auto_save, sound_effects } = req.body;

    await pool.execute(
      `INSERT INTO user_settings (user_id, dark_mode, notifications, auto_save, sound_effects)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       dark_mode = VALUES(dark_mode),
       notifications = VALUES(notifications),
       auto_save = VALUES(auto_save),
       sound_effects = VALUES(sound_effects)`,
      [
        req.userId,
        dark_mode ? 1 : 0,
        notifications ? 1 : 0,
        auto_save ? 1 : 0,
        sound_effects ? 1 : 0,
      ]
    );

    res.json(success({ message: '设置已保存' }));
  } catch (err) {
    console.error('保存设置失败:', err);
    res.status(500).json(error(err.message));
  }
});

// ========== 消息通知 API（requiredAuth） ==========

// 获取通知列表
app.get('/api/notifications', requiredAuth, async (req, res) => {
  try {
    const pool = getPool();
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    // 注意：mysql2 的 LIMIT 不支持 ? 参数绑定，limit 已通过 Math.min/Number 约束为安全整数
    const [rows] = await pool.execute(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ${Number(limit)}`,
      [req.userId]
    );
    const [[{ unread }]] = await pool.execute(
      'SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.userId]
    );
    const list = rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      type: r.type,
      isRead: r.is_read === 1,
      createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    }));
    res.json(success({ list, unreadCount: Number(unread || 0) }));
  } catch (err) {
    console.error('获取通知失败:', err.message);
    res.status(500).json(error(err.message));
  }
});

// 标记单条已读
app.post('/api/notifications/:id/read', requiredAuth, async (req, res) => {
  try {
    const pool = getPool();
    const id = Number(req.params.id);
    await pool.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    res.json(success({ message: '已标记已读' }));
  } catch (err) {
    console.error('标记已读失败:', err.message);
    res.status(500).json(error(err.message));
  }
});

// 全部已读
app.post('/api/notifications/read-all', requiredAuth, async (req, res) => {
  try {
    const pool = getPool();
    await pool.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.userId]);
    res.json(success({ message: '已全部标记已读' }));
  } catch (err) {
    console.error('全部已读失败:', err.message);
    res.status(500).json(error(err.message));
  }
});

// 清空通知
app.delete('/api/notifications', requiredAuth, async (req, res) => {
  try {
    const pool = getPool();
    await pool.execute('DELETE FROM notifications WHERE user_id = ?', [req.userId]);
    res.json(success({ message: '通知已清空' }));
  } catch (err) {
    console.error('清空通知失败:', err.message);
    res.status(500).json(error(err.message));
  }
});

// ========== 原有 API（保持兼容）==========

app.get('/api/conversations', (req, res) => {
  res.json(success([
    { id: 1, title: '创业项目咨询', type: 'sage', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 2, title: '供应商搜索', type: 'scout', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 3, title: '内容生成需求', type: 'maker', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 4, title: '售后服务问题', type: 'butler', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 5, title: '投资分析报告', type: 'sage', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]));
});

app.get('/api/faqs', (req, res) => {
  res.json(success([
    { id: 1, question: '如何开始创业？', answer: '建议从市场调研开始，明确目标用户群体和痛点需求。', category: 'startup' },
    { id: 2, question: '如何获取投资？', answer: '准备完善的商业计划书，参加路演活动，对接投资人。', category: 'funding' },
    { id: 3, question: '如何进行市场营销？', answer: '结合线上线下渠道，利用社交媒体和内容营销。', category: 'marketing' },
    { id: 4, question: '如何管理团队？', answer: '建立清晰的沟通机制，设定明确的目标和KPI。', category: 'team' },
    { id: 5, question: '如何保护知识产权？', answer: '及时申请专利、商标和版权登记。', category: 'legal' },
  ]));
});

app.post('/api/conversations', (req, res) => {
  const { title, type } = req.body;
  res.json(success({
    id: Date.now(),
    title: title || '新对话',
    type: type || 'scout',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
});

app.get('/api/conversations/:id', (req, res) => {
  res.json(success({
    id: Number(req.params.id),
    title: '示例对话',
    type: 'sage',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      { id: 1, role: 'user', content: '你好，我想咨询一些创业问题', tokenCount: 10, createdAt: new Date().toISOString() },
      { id: 2, role: 'assistant', content: '您好！我是AI创业助手，很高兴为您服务。请问您想了解哪方面的信息？', tokenCount: 25, createdAt: new Date().toISOString() },
    ],
  }));
});

app.post('/api/conversations/:id/messages', (req, res) => {
  const { role, content } = req.body;
  res.json(success({
    id: Date.now(),
    role,
    content,
    tokenCount: Math.ceil(content.length / 2),
    createdAt: new Date().toISOString(),
  }));
});

app.post('/api/chat/send', (req, res) => {
  const { message } = req.body;
  res.json(success({
    reply: `感谢您的提问！关于"${message}"，这是一个很好的问题。作为AI创业助手，我建议您从以下几个方面考虑...`,
    timestamp: new Date().toISOString()
  }));
});

// ========== 认证 API（真实 JWT + bcrypt） ==========

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 用户对象脱敏（不返回 password_hash）
function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    nickname: row.username,
    avatar: row.avatar,
    level: row.level,
    exp: row.exp,
    tier: 'free',
    tierLabel: '免费',
    quickPassCount: 5,
  };
}

// 注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body || {};
    if (!email || !EMAIL_RE.test(String(email).trim())) {
      return res.status(400).json(error('邮箱格式不正确'));
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json(error('密码长度至少 6 位'));
    }
    const pool = getPool();
    const [dup] = await pool.execute('SELECT id FROM users WHERE email = ?', [String(email).trim()]);
    if (dup.length > 0) {
      return res.status(409).json(error('该邮箱已注册'));
    }
    const [result] = await pool.execute(
      `INSERT INTO users (email, password_hash, username, password, role, status)
       VALUES (?, ?, ?, ?, 'USER', 'ACTIVE')`,
      [String(email).trim(), hashPassword(password), String(username || '').trim() || 'AI 创业者', '']
    );
    const userId = result.insertId;
    await pool.execute('INSERT IGNORE INTO user_settings (user_id) VALUES (?)', [userId]);
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
    const token = signToken(userId);
    res.json(success({ token, user: sanitizeUser(rows[0]) }));
  } catch (err) {
    console.error('注册失败:', err.message);
    res.status(500).json(error(err.message));
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json(error('请输入邮箱和密码'));
    }
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [String(email).trim()]);
    if (rows.length === 0 || !verifyPassword(password, rows[0].password_hash)) {
      return res.status(401).json(error('邮箱或密码错误'));
    }
    const token = signToken(rows[0].id);
    res.json(success({ token, user: sanitizeUser(rows[0]) }));
  } catch (err) {
    console.error('登录失败:', err.message);
    res.status(500).json(error(err.message));
  }
});

// 会话恢复：校验 token 并返回用户信息
app.get('/api/auth/me', requiredAuth, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (rows.length === 0) {
      return res.status(404).json(error('用户不存在'));
    }
    res.json(success(sanitizeUser(rows[0])));
  } catch (err) {
    console.error('获取会话用户失败:', err.message);
    res.status(500).json(error(err.message));
  }
});

// 修改密码
app.post('/api/auth/change-password', requiredAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return res.status(400).json(error('请填写旧密码和新密码'));
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json(error('新密码长度至少 6 位'));
    }
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (rows.length === 0) {
      return res.status(404).json(error('用户不存在'));
    }
    if (!verifyPassword(oldPassword, rows[0].password_hash)) {
      return res.status(400).json(error('旧密码不正确'));
    }
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(newPassword), req.userId]);
    res.json(success({ message: '密码修改成功' }));
  } catch (err) {
    console.error('修改密码失败:', err.message);
    res.status(500).json(error(err.message));
  }
});

// FAQ 接口（兼容旧路径）
app.get('/api/faqs', (req, res) => {
  res.json(success([
    { id: 1, question: '如何开始创业？', answer: '建议从市场调研开始，明确目标用户群体和痛点需求。', category: 'startup' },
    { id: 2, question: '如何获取投资？', answer: '准备完善的商业计划书，参加路演活动，对接投资人。', category: 'funding' },
    { id: 3, question: '如何进行市场营销？', answer: '结合线上线下渠道，利用社交媒体和内容营销。', category: 'marketing' },
    { id: 4, question: '如何管理团队？', answer: '建立清晰的沟通机制，设定明确的目标和KPI。', category: 'team' },
    { id: 5, question: '如何保护知识产权？', answer: '及时申请专利、商标和版权登记。', category: 'legal' },
  ]));
});

// 新手引导状态
app.get('/api/onboarding/status', (req, res) => {
  res.json(success({
    currentStep: 0,
    completedSteps: [],
    totalSteps: 5,
  }));
});

app.post('/api/onboarding/complete', (req, res) => {
  res.json(success({ success: true }));
});

// AI 聊天接口 - 转发到火山方舟 API（支持流式SSE和非流式JSON，支持 tools 函数调用）
app.post('/api/ai/chat', async (req, res) => {
  const { messages, system_prompt, stream, model_config, tools } = req.body;

  // 兼容旧接口 /api/ai/zhipu
  try {
    if (!model_config || !model_config.apiKey) {
      // 未配置模型时返回引导提示（而非 400），保证前端交互流畅
      const lastUserMsg = messages?.filter((m) => m.role === 'user').pop();
      const question = typeof lastUserMsg?.content === 'string'
        ? (lastUserMsg.content.length > 60 ? lastUserMsg.content.slice(0, 60) + '...' : lastUserMsg.content)
        : '你的问题';

      const reply = `好的，我已经收到你的需求："${question}"。

当前尚未配置 AI 模型，请按以下步骤启用真实对话：

**第一步**：点击左下角头像，打开「设置」
**第二步**：切换到「模型配置」标签页
**第三步**：点击「添加模型」，填入火山方舟 API Key（如 doubao / deepseek 等模型 ID）
**第四步**：保存并启用该模型后，即可获得真实 AI 回复

> 💡 提示：在配置完成前，你也可以点击空状态页面的「查看示例报告」按钮，预览完整的数据看板效果。`;

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const data = JSON.stringify({ choices: [{ delta: { content: reply }, index: 0 }] });
        res.write(`data: ${data}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        res.json(success({ choices: [{ message: { role: 'assistant', content: reply }, index: 0 }] }));
      }
      // 未配置模型时仍用本地规则提取记忆（不依赖 LLM）
      extractMemoryAsync(messages, null).catch(() => {});
      return;
    }

    const arkResponse = await callArkAPI(model_config, messages, system_prompt, stream, tools);

    if (stream) {
      // 流式 SSE：透传火山方舟的流式响应，同时解析 usage
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = arkResponse.body.getReader();
      const decoder = new TextDecoder();
      let usageChunk = null;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          // 从 SSE 数据块中提取 usage（火山方舟流式最后会返回 usage）
          for (const line of text.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') continue;
            try {
              const obj = JSON.parse(payload);
              if (obj.usage) usageChunk = obj.usage;
            } catch { /* 非 JSON 行忽略 */ }
          }
          res.write(text);
        }
      } catch (e) {
        console.error('流式转发异常:', e.message);
      }
      res.end();
      // 记录用量
      recordUsage(model_config?.modelId, usageChunk, { source: 'chat-stream' });
      // 流式结束后异步提取记忆
      extractMemoryAsync(messages, model_config).catch(() => {});
    } else {
      // 非流式 JSON
      const data = await arkResponse.json();
      res.json(success(data));
      // 记录用量
      recordUsage(model_config?.modelId, data.usage, { source: 'chat' });
      // 异步提取记忆（不阻塞响应）
      extractMemoryAsync(messages, model_config).catch(() => {});
    }
  } catch (err) {
    console.error('调用火山方舟 API 失败:', err.message);
    res.status(500).json(error(err.message));
  }
});

// 兼容旧路径
app.post('/api/ai/zhipu', async (req, res) => {
  const { messages, system_prompt, stream, model_config } = req.body;
  if (!model_config || !model_config.apiKey) {
    // 无模型配置时回退到 mock
    const lastUserMsg = messages?.filter((m) => m.role === 'user').pop();
    const question = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '你好';
    const reply = `感谢您的提问！关于"${question}"，请先在设置中配置火山方舟模型以启用真实对话。`;
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      const data = JSON.stringify({ choices: [{ delta: { content: reply }, index: 0 }] });
      res.write(`data: ${data}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.json(success({ content: reply }));
    }
    return;
  }
  // 有配置则走真实接口
  req.url = '/api/ai/chat';
  app.handle(req, res);
});

// ========== 工具代理 API（function calling 支持）==========

/**
 * HTML 文本净化：剥离 script/style/标签并压缩空白
 */
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * GET /api/tools/web-search?q=xxx&max=5
 * 搜索互联网（搜狗主引擎，Bing/百度回退），解析标题/链接/摘要（服务端代理避免 CORS）
 */
app.get('/api/tools/web-search', async (req, res) => {
  const query = String(req.query.q || '').trim();
  const max = Math.min(Math.max(Number(req.query.max) || 5, 1), 10);
  if (!query) {
    return res.status(400).json(error('缺少搜索关键词 q'));
  }

  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

  // --- 搜狗解析：vrwrap 容器内 vr-title（标题+链接）+ star-wiki/text-layout（摘要）---
  const parseSogou = (html) => {
    const results = [];
    const blocks = html.split(/<div class="vrwrap"/i).slice(1);
    for (const block of blocks) {
      if (results.length >= max) break;
      const h3 = /<h3 class="vr-title[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
      if (!h3) continue;
      let url = h3[1];
      // 解码搜狗跳转链接（base64url，需补 padding）
      const linkM = /\/link\?url=([A-Za-z0-9_\-]+)/.exec(url);
      if (linkM) {
        try {
          let b64 = linkM[1].replace(/-/g, '+').replace(/_/g, '/');
          while (b64.length % 4 !== 0) b64 += '=';
          const decoded = Buffer.from(b64, 'base64').toString('utf8');
          if (/^https?:\/\//i.test(decoded)) url = decoded;
        } catch { /* 保留原链接 */ }
      }
      const snipMatch = /<p class="star-wiki[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(block)
        || /<div class="text-layout[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(block);
      results.push({
        title: htmlToText(h3[2]),
        url,
        snippet: snipMatch ? htmlToText(snipMatch[1]) : '',
      });
    }
    return results;
  };

  // --- Bing 解析 ---
  const parseBing = (html) => {
    const results = [];
    const itemRe = /<li class="b_algo"[\s\S]*?<\/li>/gi;
    let m;
    while ((m = itemRe.exec(html)) !== null && results.length < max) {
      const item = m[0];
      const linkMatch = /<h2[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h2>/i.exec(item);
      if (!linkMatch) continue;
      const snippetMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(item);
      results.push({
        title: htmlToText(linkMatch[2]),
        url: linkMatch[1],
        snippet: snippetMatch ? htmlToText(snippetMatch[1]) : '',
      });
    }
    return results;
  };

  // --- 百度解析 ---
  const parseBaidu = (html) => {
    const results = [];
    const h3Re = /<h3[^>]*class="[^"]*c-title[^"]*"[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<\/div>/gi;
    let m;
    while ((m = h3Re.exec(html)) !== null && results.length < max) {
      const block = m[0];
      const aMatch = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
      if (!aMatch) continue;
      const mu = /mu="([^"]+)"/i.exec(block);
      const snippetMatch = /<span[^>]*class="[^"]*(?:content-right_8Zs40|c-abstract)[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(block)
        || /<div[^>]*class="[^"]*c-abstract[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(block);
      results.push({
        title: htmlToText(aMatch[2]),
        url: mu ? mu[1] : aMatch[1],
        snippet: snippetMatch ? htmlToText(snippetMatch[1]) : '',
      });
    }
    return results;
  };

  // 过滤明显无关结果：标题需与查询词有一定重叠（防搜索引擎降级页）
  const queryChars = [...query].filter((c) => /[\u4e00-\u9fa5A-Za-z0-9]/.test(c));
  const relevant = (r) => {
    if (queryChars.length < 3) return true;
    const hit = [...r.title].filter((c) => /[\u4e00-\u9fa5A-Za-z0-9]/.test(c) && queryChars.includes(c)).length;
    return hit >= 2;
  };

  try {
    let results = [];

    // 主引擎：搜狗
    try {
      const sgRes = await fetch(`https://www.sogou.com/web?query=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' },
      });
      if (sgRes.ok) {
        results = parseSogou(await sgRes.text()).filter(relevant);
      }
    } catch { /* 继续下一个引擎 */ }

    // 回退：Bing
    if (results.length === 0) {
      try {
        const bingRes = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=zh-hans`, {
          headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' },
        });
        if (bingRes.ok) {
          results = parseBing(await bingRes.text()).filter(relevant);
        }
      } catch { /* 继续 */ }
    }

    // 回退：百度
    if (results.length === 0) {
      try {
        const baiduRes = await fetch(`https://www.baidu.com/s?wd=${encodeURIComponent(query)}`, {
          headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' },
        });
        if (baiduRes.ok) {
          results = parseBaidu(await baiduRes.text()).filter(relevant);
        }
      } catch { /* 忽略 */ }
    }

    if (results.length === 0) {
      return res.json(success({ query, results: [], engine: 'none' }));
    }

    res.json(success({ query, results: results.slice(0, max), engine: 'search' }));
  } catch (err) {
    console.error('Web 搜索失败:', err.message);
    res.status(500).json(error('搜索失败：' + err.message));
  }
});

/**
 * POST /api/tools/fetch-url  body: { url, maxLength }
 * 抓取网页正文并提取纯文本摘要（服务端代理避免 CORS）
 */
app.post('/api/tools/fetch-url', async (req, res) => {
  const { url, maxLength } = req.body || {};
  const max = Math.min(Math.max(Number(maxLength) || 2000, 200), 8000);

  let targetUrl = String(url || '').trim();
  if (!targetUrl) {
    return res.status(400).json(error('缺少 URL'));
  }
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,text/plain,*/*',
      },
      redirect: 'follow',
    });
    if (!response.ok) {
      throw new Error(`抓取失败 (${response.status})`);
    }
    const contentType = response.headers.get('content-type') || '';
    let text = '';
    if (contentType.includes('application/json') || targetUrl.includes('r.jina.ai')) {
      text = await response.text();
    } else {
      text = await response.text();
      text = htmlToText(text);
    }

    // 截取中段较有信息量的部分：去掉首尾噪音，取中间片段
    if (text.length > max) {
      const start = Math.floor((text.length - max) / 2);
      text = text.slice(start, start + max);
    }

    res.json(success({ url: targetUrl, content: text, truncated: text.length >= max }));
  } catch (err) {
    console.error('URL 抓取失败:', err.message);
    res.status(500).json(error('抓取失败：' + err.message));
  }
});

/**
 * GET /api/tools/now
 * 返回当前时间（确定性工具，便于验证 function calling 链路）
 */
app.get('/api/tools/now', (req, res) => {
  res.json(success({ now: new Date().toISOString(), local: new Date().toString() }));
});

// ========== 自动化调度器（cron）==========
// 参考 EvoFlow AutomationScheduler：asyncio tick 扫描 + 5 字段 cron
// 规则持久化于 data/automations.json；tick 每 30s 扫描一次

const AUTOMATIONS_FILE = path.join(__dirname, 'data', 'automations.json');

/** 5 字段 cron 匹配：分 时 日 月 星期（0/7=周日） */
function parseCronField(field, min, max) {
  if (field === '*' || field === '') return { values: null };
  const values = new Set();
  for (const part of String(field).split(',')) {
    const stepMatch = /^(\d+)(?:-(\d+))?(?:\/(\d+))?$/.exec(part.trim());
    if (!stepMatch) return null;
    let start = Number(stepMatch[1]);
    const end = stepMatch[2] ? Number(stepMatch[2]) : start;
    const step = stepMatch[3] ? Number(stepMatch[3]) : 1;
    if (start < min || end > max || step < 1) return null;
    for (let v = start; v <= end; v += step) values.add(v);
  }
  return { values };
}

function cronMatches(cron, date) {
  try {
    const [minF, hourF, dayF, monthF, dowF] = String(cron).trim().split(/\s+/);
    if (!minF || !hourF || !dayF || !monthF || !dowF) return false;
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const dow = date.getDay(); // 0=周日
    const match = (field, val, min, max) => {
      const p = parseCronField(field, min, max);
      if (!p) return false;
      return p.values === null || p.values.has(val);
    };
    return (
      match(minF, minute, 0, 59) &&
      match(hourF, hour, 0, 23) &&
      match(dayF, day, 1, 31) &&
      match(monthF, month, 1, 12) &&
      match(dowF, dow === 0 ? 7 : dow, 0, 7)
    );
  } catch {
    return false;
  }
}

function loadAutomations() {
  try {
    if (fs.existsSync(AUTOMATIONS_FILE)) {
      return JSON.parse(fs.readFileSync(AUTOMATIONS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('加载自动化规则失败:', err.message);
  }
  return { rules: [], logs: [] };
}

function saveAutomations(state) {
  try {
    fs.mkdirSync(path.dirname(AUTOMATIONS_FILE), { recursive: true });
    fs.writeFileSync(AUTOMATIONS_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('保存自动化规则失败:', err.message);
  }
}

const automationState = loadAutomations();

/** 记录执行日志 */
function addAutomationLog(ruleId, ruleName, status, message) {
  const log = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ruleId, ruleName, status, message, executedAt: Date.now() };
  automationState.logs.unshift(log);
  if (automationState.logs.length > 100) automationState.logs = automationState.logs.slice(0, 100);
  saveAutomations(automationState);
  return log;
}

/** 执行规则的 send-message 动作：调用模型生成内容 */
async function executeAction(action, context, modelConfig) {
  const { type, config } = action;
  if (type === 'send-message') {
    const template = String(config?.content || '');
    // 变量替换
    const content = template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(context?.[key] ?? `{{${key}}}`));
    if (modelConfig?.apiKey) {
      try {
        const resp = await callArkAPI(modelConfig, [{ role: 'user', content: `请生成以下内容（保持自然语气）：\n${content}` }], '你是一个自动化助手。', false);
        const data = await resp.json();
        return data.choices?.[0]?.message?.content || content;
      } catch {
        return content;
      }
    }
    return content;
  }
  if (type === 'invoke-skill') {
    const prompt = String(config?.prompt || config?.content || '执行技能任务');
    if (modelConfig?.apiKey) {
      try {
        const resp = await callArkAPI(modelConfig, [{ role: 'user', content: prompt }], '你是一个技能执行器，请完成任务。', false);
        const data = await resp.json();
        return data.choices?.[0]?.message?.content || '';
      } catch {
        return '';
      }
    }
    return '';
  }
  if (type === 'set-variable') {
    return `已设置变量 ${String(config?.key || '')} = ${JSON.stringify(config?.value ?? '')}`;
  }
  return '';
}

/** 执行整条规则（所有动作，sequential/parallel） */
async function executeRuleActions(rule, modelConfig) {
  const context = {
    date: new Date().toLocaleDateString('zh-CN'),
    time: new Date().toLocaleTimeString('zh-CN'),
    now: new Date().toISOString(),
  };
  const results = [];
  const actions = rule.actions || [];
  if (rule.runMode === 'parallel' && actions.length > 1) {
    const parts = await Promise.all(actions.map((a) => executeAction(a, context, modelConfig)));
    results.push(...parts);
  } else {
    for (const a of actions) {
      results.push(await executeAction(a, context, modelConfig));
    }
  }
  return results.filter(Boolean).join('\n\n');
}

// ========== 自动化 API ==========

// 获取全部规则
app.get('/api/automation/rules', (req, res) => {
  res.json(success(automationState.rules));
});

// 新建规则
app.post('/api/automation/rules', (req, res) => {
  const rule = req.body || {};
  if (!rule.name) return res.status(400).json(error('规则名称不能为空'));
  const newRule = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: rule.name,
    description: rule.description || '',
    isEnabled: rule.isEnabled !== false,
    trigger: rule.trigger || { type: 'schedule', config: { cron: '0 9 * * *' } },
    actions: Array.isArray(rule.actions) ? rule.actions : [],
    maxIterations: rule.maxIterations || 1,
    runMode: rule.runMode || 'sequential',
    lastFiredAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  automationState.rules.unshift(newRule);
  saveAutomations(automationState);
  res.json(success(newRule));
});

// 更新规则
app.put('/api/automation/rules/:id', (req, res) => {
  const rule = automationState.rules.find((r) => r.id === req.params.id);
  if (!rule) return res.status(404).json(error('规则不存在'));
  Object.assign(rule, req.body, { id: rule.id, updatedAt: Date.now() });
  saveAutomations(automationState);
  res.json(success(rule));
});

// 删除规则
app.delete('/api/automation/rules/:id', (req, res) => {
  automationState.rules = automationState.rules.filter((r) => r.id !== req.params.id);
  saveAutomations(automationState);
  res.json(success({ message: '已删除' }));
});

// 手动执行规则
app.post('/api/automation/rules/:id/execute', async (req, res) => {
  const rule = automationState.rules.find((r) => r.id === req.params.id);
  if (!rule) return res.status(404).json(error('规则不存在'));
  const modelConfig = req.body?.model_config;

  addAutomationLog(rule.id, rule.name, 'running', `正在执行规则: ${rule.name}`);
  try {
    const output = await executeRuleActions(rule, modelConfig);
    const message = output ? `规则 "${rule.name}" 执行成功：\n${output.slice(0, 500)}` : `规则 "${rule.name}" 执行成功（无输出）`;
    const log = addAutomationLog(rule.id, rule.name, 'success', message);
    rule.lastFiredAt = Date.now();
    saveAutomations(automationState);
    res.json(success({ log, output }));
  } catch (err) {
    const log = addAutomationLog(rule.id, rule.name, 'failed', `执行失败：${err.message}`);
    res.json(success({ log, error: err.message }));
  }
});

// 获取执行日志
app.get('/api/automation/logs', (req, res) => {
  res.json(success(automationState.logs));
});

// 调度器：每 30s tick 检查 schedule 触发
setInterval(async () => {
  try {
    const now = new Date();
    const nowMinuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    for (const rule of automationState.rules) {
      if (!rule.isEnabled) continue;
      if (rule.trigger?.type !== 'schedule') continue;
      const cron = rule.trigger?.config?.cron;
      if (!cron || !cronMatches(cron, now)) continue;
      // 防重复触发：同一分钟内只触发一次
      if (rule._lastMinuteKey === nowMinuteKey) continue;
      rule._lastMinuteKey = nowMinuteKey;

      addAutomationLog(rule.id, rule.name, 'running', `定时触发: ${rule.name}`);
      try {
        const output = await executeRuleActions(rule, null);
        const message = output
          ? `定时任务 "${rule.name}" 执行成功：\n${output.slice(0, 500)}`
          : `定时任务 "${rule.name}" 执行成功`;
        addAutomationLog(rule.id, rule.name, 'success', message);
        rule.lastFiredAt = Date.now();
      } catch (err) {
        addAutomationLog(rule.id, rule.name, 'failed', `定时执行失败：${err.message}`);
      }
      saveAutomations(automationState);
    }
  } catch (err) {
    console.error('自动化调度 tick 异常:', err.message);
  }
}, 30000);

// ========== 行业数据聚合 API ==========
loadIndustryData(); // 启动加载（含首次生成 industry_data.json）

// 定时刷新：每 6 小时一次（先例：自动化调度 setInterval 1131 行）
setInterval(async () => {
  try {
    const s = await refreshIndustryData();
    console.log(`行业数据已刷新: source=${s.source}, industries=${s.industries.length}`);
  } catch (err) {
    console.error('行业数据定时刷新异常:', err.message);
  }
}, 6 * 60 * 60 * 1000);

// 获取 7 大行业汇总（含最后更新时间；行业数据无需强鉴权，optionalAuth 兜底 user_id=1）
app.get('/api/industry/data', optionalAuth, async (req, res) => {
  try {
    const s = getIndustryState();
    res.json(success({
      industries: s.industries,
      lastUpdated: s.lastUpdated,
      source: s.source,
      updatedBy: s.updatedBy,
    }));
  } catch (err) {
    console.error('获取行业数据失败:', err.message);
    res.status(500).json(error(err.message));
  }
});

// 单行业详情
app.get('/api/industry/data/:industry', optionalAuth, async (req, res) => {
  try {
    const s = getIndustryState();
    const ind = s.industries.find((i) => i.industry === decodeURIComponent(req.params.industry));
    if (!ind) return res.status(404).json(error('行业不存在'));
    res.json(success({ ...ind, lastUpdated: s.lastUpdated, source: s.source }));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});

// 手动触发刷新（运维/演示用）
app.post('/api/industry/refresh', async (req, res) => {
  try {
    const s = await refreshIndustryData();
    res.json(success({ lastUpdated: s.lastUpdated, source: s.source }));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
});

// ========== 记忆系统（Memory）==========
// 参考 EvoFlow MemoryMiddleware：对话后提取事实 → 防抖合并 → 原子写入
// 事实结构 { id, content, category, confidence, source }
// 注入策略：每次对话前返回最近 N 条高置信度事实

const MEMORY_FILE = path.join(__dirname, 'data', 'memory.json');

function loadMemory() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('加载记忆失败:', err.message);
  }
  return { workContext: '', personalContext: '', topOfMind: '', facts: [] };
}

function saveMemory(memory) {
  try {
    fs.mkdirSync(path.dirname(MEMORY_FILE), { recursive: true });
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf8');
  } catch (err) {
    console.error('保存记忆失败:', err.message);
  }
}

const memoryState = loadMemory();

// 获取记忆（按置信度与时间过滤，最多 maxFacts 条）
app.get('/api/memory', (req, res) => {
  const maxFacts = Math.min(Number(req.query.max) || 20, 50);
  const facts = [...memoryState.facts]
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    .slice(0, maxFacts);
  res.json(success({ ...memoryState, facts }));
});

// 更新工作/个人上下文与 topOfMind
app.put('/api/memory/context', (req, res) => {
  const { workContext, personalContext, topOfMind } = req.body || {};
  if (workContext !== undefined) memoryState.workContext = String(workContext);
  if (personalContext !== undefined) memoryState.personalContext = String(personalContext);
  if (topOfMind !== undefined) memoryState.topOfMind = String(topOfMind);
  saveMemory(memoryState);
  res.json(success({ message: '记忆上下文已更新' }));
});

// 添加记忆事实（去重：content 相同则更新置信度）
app.post('/api/memory/facts', (req, res) => {
  const { content, category = 'context', confidence = 0.8, source = 'manual' } = req.body || {};
  if (!content) return res.status(400).json(error('事实内容不能为空'));
  const trimmed = String(content).trim();
  const existing = memoryState.facts.find((f) => f.content === trimmed);
  if (existing) {
    existing.confidence = Math.max(existing.confidence, Number(confidence) || 0.8);
    existing.updatedAt = Date.now();
  } else {
    memoryState.facts.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      content: trimmed,
      category: ['preference', 'knowledge', 'context', 'behavior', 'goal'].includes(category)
        ? category
        : 'context',
      confidence: Math.max(0, Math.min(1, Number(confidence) || 0.8)),
      source: String(source),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  if (memoryState.facts.length > 200) {
    memoryState.facts = memoryState.facts.slice(-200);
  }
  saveMemory(memoryState);
  res.json(success({ message: '记忆已记录', factsCount: memoryState.facts.length }));
});

// 删除单条记忆事实
app.delete('/api/memory/facts/:id', (req, res) => {
  const before = memoryState.facts.length;
  memoryState.facts = memoryState.facts.filter((f) => f.id !== req.params.id);
  if (memoryState.facts.length === before) {
    return res.status(404).json(error('事实不存在'));
  }
  saveMemory(memoryState);
  res.json(success({ message: '已删除' }));
});

// 清空全部记忆
app.delete('/api/memory', (req, res) => {
  memoryState.facts = [];
  memoryState.workContext = '';
  memoryState.personalContext = '';
  memoryState.topOfMind = '';
  saveMemory(memoryState);
  res.json(success({ message: '记忆已清空' }));
});

/**
 * 对话完成后异步提取记忆（由 /api/ai/chat 调用）
 * 规则：取最近一轮 user+assistant 文本，抽取出含"我/我们/偏好/目标/项目"等的短句
 */
async function extractMemoryAsync(messages, modelConfig) {
  try {
    const userMsgs = (messages || []).filter((m) => m.role === 'user' && typeof m.content === 'string');
    const assistantMsgs = (messages || []).filter((m) => m.role === 'assistant' && typeof m.content === 'string');
    const lastUser = userMsgs[userMsgs.length - 1]?.content || '';
    const lastAssistant = assistantMsgs[assistantMsgs.length - 1]?.content || '';
    if (lastUser.length < 8) return;

    // 提取用户表达中的事实性短句（含自我描述/偏好/目标信号）
    const factPatterns = [
      /我(?:是|叫|来自|在|做|想|希望|要|计划|准备|正在|擅长|喜欢|讨厌|就读|工作于)[^，。！？\n]{2,30}/g,
      /我们(?:是|做|想|要|计划|正在|做|打算)[^，。！？\n]{2,30}/g,
      /(?:项目|公司|产品|品牌|团队|创业)[^，。！？\n]{0,20}(?:叫|是|做|专注|面向|定位)[^，。！？\n]{2,30}/g,
      /目标(?:是|为)[^，。！？\n]{2,30}/g,
      /(?:预算|成本|价格|资金)[^，。！？\n]{0,10}(?:约|大概|在|为|限制)[^，。！？\n]{2,20}/g,
    ];
    const facts = [];
    for (const pattern of factPatterns) {
      const matches = lastUser.match(pattern);
      if (matches) {
        for (const m of matches) {
          const clean = m.trim();
          if (clean.length >= 6 && clean.length <= 60) {
            facts.push(clean);
          }
        }
      }
    }

    // 无本地规则命中且配置了模型时，用 LLM 提取（一次性摘要，不阻塞）
    if (facts.length === 0 && modelConfig?.apiKey) {
      try {
        const resp = await callArkAPI(
          modelConfig,
          [{ role: 'user', content: `请从以下用户话语中提取 0-3 条可长期记忆的事实（如偏好、身份、目标、项目背景）。只输出 JSON 数组，每个元素是字符串，不要任何其他文字：\n\n${lastUser.slice(0, 800)}` }],
          '你是一个记忆提取器，只输出 JSON 数组。',
          false
        );
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content || '';
        const arrMatch = content.match(/\[[\s\S]*\]/);
        if (arrMatch) {
          const arr = JSON.parse(arrMatch[0]);
          if (Array.isArray(arr)) {
            arr.filter((f) => typeof f === 'string' && f.length >= 6).forEach((f) => facts.push(f));
          }
        }
      } catch { /* 忽略提取失败 */ }
    }

    // 写入记忆（带防抖：相同 content 只更新置信度）
    const uniqueFacts = [...new Set(facts.map((f) => f.trim()))];
    for (const f of uniqueFacts.slice(0, 5)) {
      const existing = memoryState.facts.find((x) => x.content === f);
      if (existing) {
        existing.confidence = Math.min(1, (existing.confidence || 0.7) + 0.05);
      } else {
        memoryState.facts.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          content: f,
          category: f.includes('我') || f.includes('我们') ? 'preference' : 'context',
          confidence: 0.7,
          source: 'conversation',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
    if (memoryState.facts.length > 200) {
      memoryState.facts = memoryState.facts.slice(-200);
    }
    saveMemory(memoryState);
  } catch (err) {
    // 记忆提取失败不影响主流程
  }
}

// ========== 知识库（RAG - 关键词检索版）==========
// 预置创业知识文档（可扩展为上传 Markdown）
const KNOWLEDGE_DOCS = [
  {
    id: 'doc-001',
    title: '大学生创业政策与扶持',
    category: '政策',
    tags: ['创业政策', '大学生', '扶持', '补贴'],
    content:
      '大学生创业主要扶持政策：\n1. 创业补贴：毕业两年内自主创业可申请一次性创业补贴（各地 3000-10000 元不等）\n2. 税收优惠：持《就业创业证》的高校毕业生创办个体工商户，三年内按每户每年 14400 元为限额依次扣减相关税费\n3. 担保贷款：个人创业担保贷款额度最高 30 万元，小微企业最高 300 万元，财政贴息 50%\n4. 场地支持：政府创业孵化基地/众创空间提供免费或低价办公场地\n5. 培训补贴：参加创业培训可申请培训补贴\n6. 免收费：毕业两年内免收管理类、登记类、证照类行政事业性收费',
  },
  {
    id: 'doc-002',
    title: '商业计划书（BP）撰写指南',
    category: '融资',
    tags: ['BP', '商业计划书', '融资', '路演'],
    content:
      '投资人视角的 BP 必备章节：\n1. 执行摘要（一页讲清：做什么、为什么现在、市场规模、盈利模式、融资金额）\n2. 痛点与解决方案（问题-方案对应，讲清用户为什么需要）\n3. 市场规模（TAM/SAM/SOM 三层测算，引用权威数据）\n4. 产品与技术（核心功能、技术壁垒、Roadmap）\n5. 商业模式（收入来源、定价、成本结构、单位经济模型）\n6. 竞争分析（竞品对比表，突出差异化壁垒）\n7. 团队（创始人背景、互补性、顾问资源）\n8. 财务预测（3 年收入/成本/利润，关键假设）\n9. 融资计划（金额、用途、估值依据、退出路径）\n10. 里程碑（12 个月关键节点与资金需求对应）',
  },
  {
    id: 'doc-003',
    title: '股权架构设计要点',
    category: '法务',
    tags: ['股权', '期权', '架构', '融资'],
    content:
      '创业公司股权架构关键要点：\n1. 创始人股权：建议按贡献分配而非平均分配，避免 50/50 僵局\n2. 期权池（ESOP）：建议预留 10%-20%，在融资前设立以稀释创始团队而非投资人\n3. 成熟机制（Vesting）：创始人股权建议 4 年成熟、1 年悬崖期，保护持续贡献\n4. 控制权：可通过 AB 股、一致行动人协议、董事会席位设计保持创始人控制\n5. 代持风险：尽量避免股权代持，若必须则签订规范代持协议\n6. 退出机制：明确回购、转让、优先购买权条款\n7. 常见比例陷阱：67%（绝对控制）、51%（相对控制）、34%（一票否决）',
  },
  {
    id: 'doc-004',
    title: 'MVP 设计与精益验证',
    category: '产品',
    tags: ['MVP', '精益创业', '验证', 'Pivot'],
    content:
      'MVP（最小可行产品）设计流程：\n1. 提炼核心假设：价值假设（用户真的需要吗）+ 增长假设（如何触达用户）\n2. 定义 MVP 范围：只做验证核心假设的最小功能集（Must/Should/Could 分级）\n3. 低成本验证方式：着陆页测试、访谈 20-30 个目标用户、假门测试、手动代劳（Concierge）\n4. 关键指标：北极星指标 + AARRR 漏斗，设定验证阈值\n5. 迭代节奏：2-4 周一个验证循环，快速试错\n6. Pivot 触发条件：数据未达阈值且用户反馈一致否定核心假设\n7. 常见误区：过度打磨、过早自动化、用满意度代替行为数据',
  },
  {
    id: 'doc-005',
    title: '融资流程与估值常识',
    category: '融资',
    tags: ['融资', '估值', '天使轮', 'VC'],
    content:
      '创业融资流程：\n1. 融资前准备：梳理数据、完善 BP、准备数据室（Data Room）\n2. 常见轮次：种子轮（0-500万，验证想法）、天使轮（500-2000万，产品雏形）、A轮（2000万-1亿，验证 PMF）、B轮+（规模化）\n3. 估值方法：可比公司法、DCF 估值、融资后估值 vs 融资前估值\n4. 投资人尽调重点：财务数据、法律合规、技术壁垒、团队稳定性\n5. 条款谈判要点：估值、稀释比例、优先清算权、反稀释条款、董事会席位\n6. 融资时间：通常提前 6-9 个月启动，市场冷淡期要留足 12 个月现金\n7. 常见错误：过早融资、只找财务投资人、忽视条款细节',
  },
  {
    id: 'doc-006',
    title: '公司注册与税务基础',
    category: '法务',
    tags: ['注册', '公司', '税务', '个体户'],
    content:
      '大学生创业主体选择与注册：\n1. 主体类型：个体户（简单、税负低但责任无限）、有限公司（责任有限、适合融资）\n2. 注册流程：核名 → 提交材料 → 领取执照 → 刻章 → 银行开户 → 税务登记（各地 1-5 个工作日）\n3. 注册地址：可用孵化器地址/集群注册，降低创业成本\n4. 税务基础：小规模纳税人（季度 30 万内免增值税）、一般纳税人（可抵扣进项）\n5. 大学生优惠：毕业年度内创业可申请一次性创业补贴与税收扣减\n6. 财务规范：建议早期就建立规范记账，避免后续融资/上市障碍\n7. 常见误区：注册资金越多越好（认缴≠实缴，量力而行）',
  },
  {
    id: 'doc-007',
    title: '市场调研方法指南',
    category: '分析',
    tags: ['市场调研', '竞品', '用户画像', 'TAM'],
    content:
      '创业市场调研框架：\n1. 桌面研究：行业报告（艾瑞/易观/头豹）、政府统计、上市公司年报\n2. 用户访谈：15-30 个目标用户，开放式问题挖掘痛点（5 个为什么）\n3. 竞品分析：直接竞品+间接竞品，对比产品/价格/渠道/营销四要素\n4. 市场规模测算：TAM（总市场）→ SAM（可服务市场）→ SOM（可获得市场）\n5. 用户画像：人口属性+行为特征+心理动机，至少 3 类典型画像\n6. 验证手段：问卷（100+ 样本）、可用性测试、A/B 实验\n7. 常见陷阱：幸存者偏差、访谈引导性提问、把意愿当行为',
  },
  {
    id: 'doc-008',
    title: '新媒体运营与获客',
    category: '营销',
    tags: ['新媒体', '获客', '小红书', '抖音', '私域'],
    content:
      '创业获客渠道组合：\n1. 内容平台：小红书（种草/女性向）、抖音（短视频/泛流量）、B站（深度内容/年轻用户）、微信公众号（私域沉淀）\n2. 冷启动策略：垂直细分切入 → 单平台打透 → 再复制多平台\n3. 内容规划：账号定位 → 内容矩阵（干货/人设/产品）→ 更新频率（日更 or 周更）\n4. 私域运营：企微/社群承载，私域转化率通常是公域的 3-5 倍\n5. 付费投放：信息流（抖音/腾讯广告）+ 搜索广告，ROI 跟踪到 LTV\n6. 关键指标：CAC（获客成本）、LTV（用户生命周期价值）、LTV/CAC>3 健康\n7. 常见误区：All-in 单一渠道、忽视内容留存、不建私域',
  },
];

function tokenizeChinese(text) {
  // 中文按 2-gram 分词 + 英文按空格词
  const tokens = new Set();
  const chinese = (text.match(/[\u4e00-\u9fa5]{2,}/g) || []).join('');
  for (let i = 0; i < chinese.length - 1; i++) {
    tokens.add(chinese.slice(i, i + 2));
  }
  (text.match(/[a-zA-Z][a-zA-Z0-9-]{1,}/g) || []).forEach((w) => tokens.add(w.toLowerCase()));
  return tokens;
}

// ========== Obsidian Vault 接入 ==========
// 用户配置本地 Obsidian 知识库路径，后端扫描 .md 笔记建立索引，
// 检索时合并「内置资料 + 用户 vault 笔记」，来源分别标注 builtin / vault。
// 安全约束：只读取 .md 文件；跳过 .obsidian / .trash 等系统目录；单次扫描最多 5000 篇。

const VAULT_CONFIG_FILE = path.join(__dirname, 'data', 'knowledge_vault.json');
const VAULT_SKIP_DIRS = new Set(['.obsidian', '.trash', '.git', 'node_modules', '.smart-env', '.DS_Store']);

let vaultState = {
  vaultPath: '',
  lastIndexedAt: 0,
  totalFiles: 0,
  indexedFiles: 0,
  indexErrors: 0,
  docs: [],
};

function loadVaultConfig() {
  try {
    if (fs.existsSync(VAULT_CONFIG_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(VAULT_CONFIG_FILE, 'utf8'));
      vaultState.vaultPath = parsed.vaultPath || '';
      vaultState.lastIndexedAt = parsed.lastIndexedAt || 0;
      vaultState.totalFiles = parsed.totalFiles || 0;
      vaultState.indexedFiles = parsed.indexedFiles || 0;
      vaultState.indexErrors = parsed.indexErrors || 0;
    }
  } catch (err) {
    console.error('加载 vault 配置失败:', err.message);
  }
}

function saveVaultConfig() {
  try {
    fs.mkdirSync(path.dirname(VAULT_CONFIG_FILE), { recursive: true });
    fs.writeFileSync(
      VAULT_CONFIG_FILE,
      JSON.stringify(
        {
          vaultPath: vaultState.vaultPath,
          lastIndexedAt: vaultState.lastIndexedAt,
          totalFiles: vaultState.totalFiles,
          indexedFiles: vaultState.indexedFiles,
          indexErrors: vaultState.indexErrors,
        },
        null,
        2
      ),
      'utf8'
    );
  } catch (err) {
    console.error('保存 vault 配置失败:', err.message);
  }
}

/**
 * 扫描 vault 目录，构建笔记索引
 * @returns {{vaultPath, lastIndexedAt, totalFiles, indexedFiles, indexErrors, docsCount}}
 */
function scanVault(vaultPath) {
  const stat = fs.statSync(vaultPath);
  if (!stat.isDirectory()) {
    throw new Error('路径不是文件夹，请选择 Obsidian vault 所在目录');
  }

  const docs = [];
  let totalFiles = 0;
  let indexedFiles = 0;
  let indexErrors = 0;

  const walk = (dir, depth) => {
    if (depth > 12) return; // 限制递归深度
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      indexErrors += 1;
      return;
    }
    for (const entry of entries) {
      if (VAULT_SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, depth + 1);
      } else if (entry.name.toLowerCase().endsWith('.md')) {
        totalFiles += 1;
        try {
          const content = fs.readFileSync(full, 'utf8');
          if (content.trim().length < 10) continue; // 跳过空笔记
          const rel = path.relative(vaultPath, full).replace(/\\/g, '/');
          const title = entry.name.replace(/\.md$/i, '');
          docs.push({
            id: `vault:${rel}`,
            title,
            category: 'Obsidian',
            tags: [],
            content: content.slice(0, 20000),
            source: 'vault',
            vaultPath: rel,
            updatedAt: fs.statSync(full).mtimeMs || Date.now(),
          });
          indexedFiles += 1;
        } catch {
          indexErrors += 1;
        }
      }
    }
  };

  walk(vaultPath, 0);
  const limited = docs.slice(0, 5000);

  vaultState.vaultPath = vaultPath;
  vaultState.lastIndexedAt = Date.now();
  vaultState.totalFiles = totalFiles;
  vaultState.indexedFiles = limited.length;
  vaultState.indexErrors = indexErrors;
  vaultState.docs = limited;
  saveVaultConfig();
  return {
    vaultPath,
    lastIndexedAt: vaultState.lastIndexedAt,
    totalFiles,
    indexedFiles: limited.length,
    indexErrors,
    docsCount: limited.length,
  };
}

loadVaultConfig();

// 启动时若有已配置的 vault，异步重建索引（不阻塞服务器启动）
if (vaultState.vaultPath) {
  try {
    scanVault(vaultState.vaultPath);
    console.log(`Obsidian vault 已索引: ${vaultState.vaultPath} (${vaultState.docs.length} 篇笔记)`);
  } catch (err) {
    console.error('启动时重建 vault 索引失败:', err.message);
  }
}

// 获取 vault 接入状态
app.get('/api/knowledge/vault', (req, res) => {
  res.json(
    success({
      vaultPath: vaultState.vaultPath,
      lastIndexedAt: vaultState.lastIndexedAt,
      totalFiles: vaultState.totalFiles,
      indexedFiles: vaultState.indexedFiles,
      indexErrors: vaultState.indexErrors,
      docsCount: vaultState.docs.length,
    })
  );
});

// 接入新的 vault（校验路径并扫描）
app.post('/api/knowledge/vault', (req, res) => {
  const { vaultPath } = req.body || {};
  if (!vaultPath || typeof vaultPath !== 'string') {
    return res.status(400).json(error('请提供 Obsidian vault 路径'));
  }
  const trimmed = vaultPath.trim();
  if (!fs.existsSync(trimmed)) {
    return res.status(400).json(error(`路径不存在: ${trimmed}`));
  }
  try {
    const result = scanVault(trimmed);
    res.json(success({ ...result, message: `已接入并扫描，索引 ${result.docsCount} 篇笔记` }));
  } catch (err) {
    res.status(400).json(error(err.message || '扫描失败'));
  }
});

// 重新扫描当前 vault（笔记新增/修改后刷新索引）
app.post('/api/knowledge/vault/scan', (req, res) => {
  if (!vaultState.vaultPath) {
    return res.status(400).json(error('尚未接入 Obsidian vault'));
  }
  if (!fs.existsSync(vaultState.vaultPath)) {
    return res.status(400).json(error(`vault 路径已失效: ${vaultState.vaultPath}`));
  }
  try {
    const result = scanVault(vaultState.vaultPath);
    res.json(success({ ...result, message: `重新扫描完成，索引 ${result.docsCount} 篇笔记` }));
  } catch (err) {
    res.status(400).json(error(err.message || '扫描失败'));
  }
});

// 解除接入
app.delete('/api/knowledge/vault', (req, res) => {
  vaultState.vaultPath = '';
  vaultState.lastIndexedAt = 0;
  vaultState.totalFiles = 0;
  vaultState.indexedFiles = 0;
  vaultState.indexErrors = 0;
  vaultState.docs = [];
  saveVaultConfig();
  res.json(success({ message: '已解除 Obsidian 知识库接入' }));
});

// 知识库检索（合并内置资料 + vault 笔记）
app.get('/api/knowledge/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  const topK = Math.min(Number(req.query.topK) || 3, 8);

  if (!q) {
    // 无关键词时返回全部文档目录（内置 + vault）
    const catalog = [
      ...KNOWLEDGE_DOCS.map((d) => ({ id: d.id, title: d.title, category: d.category, tags: d.tags, source: 'builtin' })),
      ...vaultState.docs.map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        tags: d.tags || [],
        source: 'vault',
        vaultPath: d.vaultPath,
      })),
    ];
    return res.json(success({ query: '', results: catalog }));
  }

  const allDocs = [
    ...KNOWLEDGE_DOCS.map((d) => ({ ...d, source: 'builtin' })),
    ...vaultState.docs,
  ];
  const queryTokens = tokenizeChinese(q);
  const scored = allDocs.map((doc) => {
    let score = 0;
    // 1. 标题/标签精确命中（权重最高）
    for (const t of doc.tags || []) {
      if (q.includes(t) || t.includes(q)) score += 5;
    }
    if (doc.title.includes(q)) score += 4;
    // 2. 正文 2-gram 重叠
    const docText = doc.title + (doc.content || '');
    const docTokens = tokenizeChinese(docText);
    let overlap = 0;
    for (const t of queryTokens) {
      if (docTokens.has(t)) overlap += 1;
    }
    score += overlap;
    // 3. 标题关键词直接命中
    for (const t of queryTokens) {
      if (doc.title.toLowerCase().includes(t)) score += 1;
    }
    // 4. vault 笔记相对路径命中（如按文件名/目录检索）
    if (doc.vaultPath && doc.vaultPath.toLowerCase().includes(q.toLowerCase())) score += 3;
    return { doc, score };
  });

  const results = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => ({
      id: s.doc.id,
      title: s.doc.title,
      category: s.doc.category,
      tags: s.doc.tags || [],
      score: s.score,
      source: s.doc.source,
      vaultPath: s.doc.vaultPath,
      snippet: (s.doc.content || '').slice(0, 200) + ((s.doc.content || '').length > 200 ? '…' : ''),
      content: s.doc.content,
    }));

  res.json(success({ query: q, results }));
});

// 获取单个知识文档（内置 + vault）
app.get('/api/knowledge/docs/:id', (req, res) => {
  const docId = req.params.id;
  let doc = KNOWLEDGE_DOCS.find((d) => d.id === docId);
  if (doc) return res.json(success({ ...doc, source: 'builtin' }));
  doc = vaultState.docs.find((d) => d.id === docId);
  if (doc) return res.json(success({ ...doc, source: 'vault' }));
  res.status(404).json(error('文档不存在'));
});

// ========== Token 用量统计 ==========
// 记录每次模型调用的 token 消耗（流式/非流式），提供汇总与明细查询

const USAGE_FILE = path.join(__dirname, 'data', 'usage.json');

function loadUsage() {
  try {
    if (fs.existsSync(USAGE_FILE)) {
      return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('加载用量数据失败:', err.message);
  }
  return { records: [] };
}

function saveUsage(usage) {
  try {
    fs.mkdirSync(path.dirname(USAGE_FILE), { recursive: true });
    fs.writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2), 'utf8');
  } catch (err) {
    console.error('保存用量数据失败:', err.message);
  }
}

const usageState = loadUsage();

/** 记录一次用量 */
function recordUsage(modelId, usage, meta = {}) {
  const { prompt_tokens = 0, completion_tokens = 0, total_tokens = 0 } = usage || {};
  if (!total_tokens && !prompt_tokens && !completion_tokens) return;
  usageState.records.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    modelId: String(modelId || 'unknown'),
    prompt_tokens: Number(prompt_tokens) || 0,
    completion_tokens: Number(completion_tokens) || 0,
    total_tokens: Number(total_tokens) || 0,
    source: meta.source || 'chat',
    createdAt: Date.now(),
  });
  // 仅保留最近 5000 条，防止文件无限增长
  if (usageState.records.length > 5000) {
    usageState.records = usageState.records.slice(-5000);
  }
  saveUsage(usageState);
}

// 用量汇总（按模型）
app.get('/api/usage/summary', (req, res) => {
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTs = todayStart.getTime();

  const byModel = {};
  let total = { calls: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  let today = { calls: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  for (const r of usageState.records) {
    const key = r.modelId;
    if (!byModel[key]) {
      byModel[key] = { modelId: key, calls: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, lastUsedAt: r.createdAt };
    }
    const m = byModel[key];
    m.calls += 1;
    m.prompt_tokens += r.prompt_tokens;
    m.completion_tokens += r.completion_tokens;
    m.total_tokens += r.total_tokens;
    m.lastUsedAt = Math.max(m.lastUsedAt, r.createdAt);

    total.calls += 1;
    total.prompt_tokens += r.prompt_tokens;
    total.completion_tokens += r.completion_tokens;
    total.total_tokens += r.total_tokens;

    if (r.createdAt >= todayTs) {
      today.calls += 1;
      today.prompt_tokens += r.prompt_tokens;
      today.completion_tokens += r.completion_tokens;
      today.total_tokens += r.total_tokens;
    }
  }

  const models = Object.values(byModel).sort((a, b) => b.total_tokens - a.total_tokens);
  res.json(success({ byModel: models, total, today }));
});

// 用量明细
app.get('/api/usage/records', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const records = [...usageState.records].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  res.json(success({ records }));
});

// 重置用量
app.delete('/api/usage/reset', (req, res) => {
  usageState.records = [];
  saveUsage(usageState);
  res.json(success({ message: '用量记录已清空' }));
});

// ========== Demo作品相关 API ==========

// 获取Demo列表（分页+筛选+搜索）
app.get('/api/demos', async (req, res) => {
  try {
    const pool = getPool();
    const { page = 1, pageSize = 12, type, stage, team_type, keyword, sort = 'created_at' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    let whereClause = 'WHERE status = "published"';
    const params = [];

    if (type) {
      whereClause += ' AND demo_type = ?';
      params.push(type);
    }
    if (stage) {
      whereClause += ' AND stage = ?';
      params.push(stage);
    }
    if (team_type) {
      whereClause += ' AND team_type = ?';
      params.push(team_type);
    }
    if (keyword) {
      whereClause += ' AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)';
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword);
    }

    const sortColumn = ['created_at', 'view_count', 'like_count'].includes(sort) ? sort : 'created_at';
    const sortOrder = sort === 'like_count' ? 'DESC' : 'DESC';

    // 获取总数
    const [countResult] = await pool.execute(`SELECT COUNT(*) as total FROM demo_projects ${whereClause}`, params);
    const total = countResult[0].total;

    // 获取列表 (LIMIT/OFFSET 直接拼接，不支持参数化)
    const [rows] = await pool.execute(
      `SELECT id, user_id, title, description, cover_image, demo_type, demo_url, stage, team_type, team_size, tech_stack, tags, view_count, like_count, created_at
       FROM demo_projects ${whereClause}
       ORDER BY ${sortColumn} ${sortOrder}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    // JSON字段已由mysql2自动解析
    const list = rows;

    res.json(success({
      list,
      pagination: { page: Number(page), pageSize: limit, total, totalPages: Math.ceil(total / limit) }
    }));
  } catch (err) {
    console.error('获取Demo列表失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 获取单个Demo详情
app.get('/api/demos/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM demo_projects WHERE id = ? AND status = "published"',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json(error('Demo作品不存在'));
    }

    const detail = rows[0];
    // JSON字段已由mysql2自动解析，确保为正确类型

    // 增加浏览次数
    await pool.execute('UPDATE demo_projects SET view_count = view_count + 1 WHERE id = ?', [id]);
    detail.view_count += 1;

    res.json(success(detail));
  } catch (err) {
    console.error('获取Demo详情失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 创建Demo
app.post('/api/demos', async (req, res) => {
  try {
    const pool = getPool();
    const { title, description, cover_image, demo_type, demo_url, demo_video_url, preview_urls, stage, team_type, team_size, team_members, tech_stack, tags, links } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO demo_projects
       (user_id, title, description, cover_image, demo_type, demo_url, demo_video_url, preview_urls, stage, team_type, team_size, team_members, tech_stack, tags, links, status)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
      [
        title, description, cover_image || null, demo_type || 'web', demo_url || null,
        demo_video_url || null, preview_urls ? JSON.stringify(preview_urls) : null,
        stage || 'seed', team_type || 'solo_opc', team_size || 1,
        team_members ? JSON.stringify(team_members) : null,
        tech_stack ? JSON.stringify(tech_stack) : null,
        tags ? JSON.stringify(tags) : null,
        links ? JSON.stringify(links) : null,
      ]
    );

    res.json(success({ id: result.insertId, message: '创建成功' }));
  } catch (err) {
    console.error('创建Demo失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 更新Demo
app.put('/api/demos/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { title, description, cover_image, demo_type, demo_url, demo_video_url, preview_urls, stage, team_type, team_size, team_members, tech_stack, tags, links } = req.body;

    await pool.execute(
      `UPDATE demo_projects SET
       title = ?, description = ?, cover_image = ?, demo_type = ?, demo_url = ?,
       demo_video_url = ?, preview_urls = ?, stage = ?, team_type = ?, team_size = ?,
       team_members = ?, tech_stack = ?, tags = ?, links = ?
       WHERE id = ?`,
      [
        title, description, cover_image || null, demo_type || 'web', demo_url || null,
        demo_video_url || null, preview_urls ? JSON.stringify(preview_urls) : null,
        stage || 'seed', team_type || 'solo_opc', team_size || 1,
        team_members ? JSON.stringify(team_members) : null,
        tech_stack ? JSON.stringify(tech_stack) : null,
        tags ? JSON.stringify(tags) : null,
        links ? JSON.stringify(links) : null,
        id,
      ]
    );

    res.json(success({ message: '更新成功' }));
  } catch (err) {
    console.error('更新Demo失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 删除Demo
app.delete('/api/demos/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    await pool.execute('DELETE FROM demo_projects WHERE id = ?', [id]);
    res.json(success({ message: '删除成功' }));
  } catch (err) {
    console.error('删除Demo失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 点赞/取消点赞
app.post('/api/demos/:id/like', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { action } = req.body; // 'like' or 'unlike'

    if (action === 'like') {
      await pool.execute('UPDATE demo_projects SET like_count = like_count + 1 WHERE id = ?', [id]);
    } else if (action === 'unlike') {
      await pool.execute('UPDATE demo_projects SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?', [id]);
    }

    const [rows] = await pool.execute('SELECT like_count FROM demo_projects WHERE id = ?', [id]);
    res.json(success({ like_count: rows[0]?.like_count || 0, action }));
  } catch (err) {
    console.error('点赞操作失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 获取Demo类型和筛选选项
app.get('/api/demos/filters', async (req, res) => {
  try {
    const types = [
      { value: 'web', label: '网页' },
      { value: 'desktop', label: '桌面端' },
      { value: 'app', label: 'APP' },
      { value: 'miniapp', label: '小程序' },
    ];
    const stages = [
      { value: 'seed', label: '种子轮', color: '#22c55e' },
      { value: 'angel', label: '天使轮', color: '#3b82f6' },
      { value: 'series_a', label: 'A轮', color: '#8b5cf6' },
      { value: 'series_b', label: 'B轮', color: '#f59e0b' },
      { value: 'series_c', label: 'C轮', color: '#ef4444' },
      { value: 'pre_ipo', label: 'Pre-IPO', color: '#ec4899' },
    ];
    const teamTypes = [
      { value: 'solo_opc', label: '个人OPC' },
      { value: 'team_otc', label: '团队OTC' },
    ];

    res.json(success({ types, stages, teamTypes }));
  } catch (err) {
    console.error('获取筛选选项失败:', err);
    res.status(500).json(error(err.message));
  }
});

// 初始化数据库并启动服务器
async function startServer() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`API Server running on http://localhost:${PORT}`);
      console.log('MySQL 数据库已连接');
    });
  } catch (error) {
    console.error('服务器启动失败:', error.message);
    console.log('继续使用内存模式运行...');
    app.listen(PORT, () => {
      console.log(`API Server (内存模式) running on http://localhost:${PORT}`);
    });
  }
}

startServer();
