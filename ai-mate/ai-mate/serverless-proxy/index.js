/**
 * 青宸智汇 Serverless Proxy
 * 统一AI API代理层 - 转发请求至各AI服务并添加安全中间件
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { verifyToken } = require('./middleware/auth');
const { promptGuard } = require('./middleware/promptGuard');
const { contentFilter } = require('./middleware/contentFilter');
const { rateLimiter } = require('./middleware/rateLimiter');
const aiConfig = require('./config/aiConfig');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== 全局中间件 ==========
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ========== 健康检查 ==========
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ========== AI API 端点 ==========

/**
 * POST /ai/zhipu - 转发至智谱GLM-5.1 API
 * Body: { messages: [{ role, content }], stream?: boolean }
 */
app.post(
  '/ai/zhipu',
  verifyToken,
  rateLimiter({ windowMs: 60 * 1000, maxRequests: 30 }),
  promptGuard,
  contentFilter,
  async (req, res) => {
    try {
      const { messages, stream = false, temperature, max_tokens } = req.body;

      const systemPrompt = req.systemPrompt || null;
      const finalMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;

      const requestBody = {
        model: aiConfig.zhipu.model,
        messages: finalMessages,
        stream,
        ...(temperature !== undefined && { temperature }),
        ...(max_tokens !== undefined && { max_tokens }),
      };

      const response = await fetch(aiConfig.zhipu.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aiConfig.zhipu.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Zhipu API Error] ${response.status}: ${errorText}`);
        return res.status(response.status).json({
          error: 'AI服务请求失败',
          detail: errorText,
        });
      }

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        response.body.pipe(res);
      } else {
        const data = await response.json();
        // 输出过滤
        if (data.choices && data.choices[0]?.message?.content) {
          data.choices[0].message.content = req.filterOutput
            ? req.filterOutput(data.choices[0].message.content)
            : data.choices[0].message.content;
        }
        res.json(data);
      }
    } catch (error) {
      console.error('[Zhipu Proxy Error]', error.message);
      res.status(500).json({ error: '代理服务内部错误', detail: error.message });
    }
  }
);

/**
 * POST /ai/coze - 转发至Coze API
 * Body: { messages: [{ role, content, content_type }], user_id, bot_id?, stream? }
 */
app.post(
  '/ai/coze',
  verifyToken,
  rateLimiter({ windowMs: 60 * 1000, maxRequests: 30 }),
  promptGuard,
  contentFilter,
  async (req, res) => {
    try {
      const { messages, user_id, bot_id, stream = false, conversation_id } = req.body;

      const systemPrompt = req.systemPrompt || null;
      const finalMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt, content_type: 'text' }, ...messages]
        : messages;

      const requestBody = {
        bot_id: bot_id || aiConfig.coze.botId,
        user_id: user_id || 'anonymous',
        stream,
        auto_save_history: true,
        additional_messages: finalMessages,
        ...(conversation_id && { conversation_id }),
      };

      const response = await fetch(aiConfig.coze.baseUrl + '/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aiConfig.coze.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Coze API Error] ${response.status}: ${errorText}`);
        return res.status(response.status).json({
          error: 'AI服务请求失败',
          detail: errorText,
        });
      }

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        response.body.pipe(res);
      } else {
        const data = await response.json();
        res.json(data);
      }
    } catch (error) {
      console.error('[Coze Proxy Error]', error.message);
      res.status(500).json({ error: '代理服务内部错误', detail: error.message });
    }
  }
);

/**
 * POST /ai/workbuddy - 转发至WorkBuddy MCP
 * Body: { method, params, session_id }
 */
app.post(
  '/ai/workbuddy',
  verifyToken,
  rateLimiter({ windowMs: 60 * 1000, maxRequests: 20 }),
  promptGuard,
  contentFilter,
  async (req, res) => {
    try {
      const { method, params, session_id } = req.body;

      const requestBody = {
        jsonrpc: '2.0',
        id: Date.now().toString(),
        method: method || 'tools/call',
        params: {
          ...params,
          ...(session_id && { session_id }),
        },
      };

      const response = await fetch(aiConfig.workbuddy.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(aiConfig.workbuddy.apiKey && {
            Authorization: `Bearer ${aiConfig.workbuddy.apiKey}`,
          }),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[WorkBuddy MCP Error] ${response.status}: ${errorText}`);
        return res.status(response.status).json({
          error: 'WorkBuddy MCP请求失败',
          detail: errorText,
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('[WorkBuddy Proxy Error]', error.message);
      res.status(500).json({ error: '代理服务内部错误', detail: error.message });
    }
  }
);

/**
 * POST /ai/trae - 转发至Trae MCP
 * Body: { method, params, session_id }
 */
app.post(
  '/ai/trae',
  verifyToken,
  rateLimiter({ windowMs: 60 * 1000, maxRequests: 20 }),
  promptGuard,
  contentFilter,
  async (req, res) => {
    try {
      const { method, params, session_id } = req.body;

      const requestBody = {
        jsonrpc: '2.0',
        id: Date.now().toString(),
        method: method || 'tools/call',
        params: {
          ...params,
          ...(session_id && { session_id }),
        },
      };

      const response = await fetch(aiConfig.trae.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(aiConfig.trae.apiKey && {
            Authorization: `Bearer ${aiConfig.trae.apiKey}`,
          }),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Trae MCP Error] ${response.status}: ${errorText}`);
        return res.status(response.status).json({
          error: 'Trae MCP请求失败',
          detail: errorText,
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('[Trae Proxy Error]', error.message);
      res.status(500).json({ error: '代理服务内部错误', detail: error.message });
    }
  }
);

// ========== 全局错误处理 ==========
app.use((err, req, res, _next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// ========== 启动服务 ==========
app.listen(PORT, () => {
  console.log(`[青宸智汇 Proxy] 服务已启动，端口: ${PORT}`);
  console.log(`[青宸智汇 Proxy] 健康检查: http://localhost:${PORT}/health`);
});
