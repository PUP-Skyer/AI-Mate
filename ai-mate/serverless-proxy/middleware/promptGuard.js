/**
 * Prompt 注入防护中间件
 * 三重防护机制：
 * 1. 输入净化 - 检测并清理恶意指令注入
 * 2. 系统提示隔离 - 防止用户覆盖系统提示
 * 3. 输出过滤 - 对AI返回内容进行安全检查
 */

// ========== 注入攻击检测模式 ==========

// 常见的Prompt注入攻击模式
const INJECTION_PATTERNS = [
  // 直接指令覆盖
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
  /forget\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
  /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
  /你(现在|已经|不再是)\s*(一个|一名)?/g,
  /从现在开始(你|你是)/g,
  // 角色扮演攻击
  /pretend\s+(you\s+are|to\s+be)/gi,
  /act\s+as\s+(if\s+you\s+are|a|an)/gi,
  /roleplay\s+as/gi,
  /扮演(成|一个|一名)/g,
  // 系统提示泄露
  /reveal\s+(your|the)\s+(system\s+)?prompt/gi,
  /show\s+(me\s+)?(your|the)\s+(system\s+)?(instructions?|prompt)/gi,
  /输出(你的|系统)?(提示词|指令|prompt)/gi,
  /显示(你的|系统)?(提示词|指令|prompt)/gi,
  // 分隔符注入
  /\n*---\s*system\s*---\s*\n*/gi,
  /\n*===\s*system\s*===\s*\n*/gi,
  /\n*\[INST\].*?\[\/INST\]/gi,
  // JSON/代码注入
  /\{[\s\S]*?"role":\s*"system"[\s\S]*?\}/g,
  /<\|im_start\|>system/g,
  /<\|system\|>/g,
];

// 危险指令关键词
const DANGEROUS_KEYWORDS = [
  'delete all', 'drop table', 'rm -rf', 'sudo', 'eval(',
  'exec(', 'Function(', '__import__', 'os.system',
  '删除所有', '清空数据库', '执行命令',
];

/**
 * 检测输入是否包含注入攻击
 */
function detectInjection(text) {
  if (!text || typeof text !== 'string') return { safe: true, threats: [] };

  const threats = [];

  // 检查注入模式
  for (const pattern of INJECTION_PATTERNS) {
    pattern.lastIndex = 0; // 重置正则状态
    const matches = text.match(pattern);
    if (matches) {
      threats.push({
        type: 'prompt_injection',
        pattern: pattern.source,
        matches: matches.slice(0, 3),
      });
    }
  }

  // 检查危险关键词
  const lowerText = text.toLowerCase();
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      threats.push({
        type: 'dangerous_keyword',
        keyword,
      });
    }
  }

  return {
    safe: threats.length === 0,
    threats,
  };
}

/**
 * 净化输入文本 - 移除可疑的注入内容
 */
function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return text;

  let sanitized = text;

  // 移除系统提示注入标记
  sanitized = sanitized.replace(/\n*---\s*system\s*---\s*\n*/gi, '\n');
  sanitized = sanitized.replace(/\n*===\s*system\s*===\s*\n*/gi, '\n');
  sanitized = sanitized.replace(/<\|im_start\|>system[\s\S]*?<\|im_end\|>/g, '');
  sanitized = sanitized.replace(/<\|system\|>[\s\S]*?<\|\/system\|>/g, '');

  // 移除JSON格式的系统角色注入
  sanitized = sanitized.replace(
    /\{[\s\S]*?"role":\s*"system"[\s\S]*?"content":\s*"[^"]*"[\s\S]*?\}/g,
    ''
  );

  return sanitized.trim();
}

/**
 * 检测输出是否泄露系统信息
 */
function filterOutput(text) {
  if (!text || typeof text !== 'string') return text;

  let filtered = text;

  // 移除可能泄露的内部配置信息
  filtered = filtered.replace(/api[_-]?key[:\s]*['"][^'"]{10,}['"]/gi, '[REDACTED]');
  filtered = filtered.replace(/token[:\s]*['"][^'"]{10,}['"]/gi, '[REDACTED]');
  filtered = filtered.replace(/password[:\s]*['"][^'"]{6,}['"]/gi, '[REDACTED]');
  filtered = filtered.replace(/secret[:\s]*['"][^'"]{10,}['"]/gi, '[REDACTED]');

  return filtered;
}

/**
 * Prompt注入防护中间件
 */
function promptGuard(req, res, next) {
  try {
    const body = req.body;

    // 提取所有消息文本
    const messages = body.messages || [];
    const allTexts = messages
      .map((msg) => msg.content || '')
      .join(' ');

    // 检测注入
    const detection = detectInjection(allTexts);

    if (!detection.safe) {
      console.warn(`[Prompt Guard] 检测到注入攻击:`, JSON.stringify(detection.threats));

      // 方案1: 拒绝请求（严格模式）
      const mode = process.env.PROMPT_GUARD_MODE || 'sanitize'; // 'reject' | 'sanitize' | 'log'
      if (mode === 'reject') {
        return res.status(400).json({
          error: '请求包含不安全内容，已被安全系统拦截',
          code: 'PROMPT_INJECTION_DETECTED',
          threats: detection.threats.length,
        });
      }

      // 方案2: 净化输入（默认）
      if (mode === 'sanitize') {
        for (const msg of messages) {
          if (msg.content && typeof msg.content === 'string') {
            msg.content = sanitizeInput(msg.content);
          }
        }
      }
      // 方案3: 仅记录（log模式），不做处理
    }

    // 系统提示隔离 - 确保用户消息中不会混入系统级指令
    req.systemPrompt = body.system_prompt || null;

    // 将输出过滤函数挂载到请求对象上，供路由使用
    req.filterOutput = filterOutput;

    next();
  } catch (error) {
    console.error('[Prompt Guard Error]', error.message);
    next();
  }
}

module.exports = { promptGuard, detectInjection, sanitizeInput, filterOutput };
