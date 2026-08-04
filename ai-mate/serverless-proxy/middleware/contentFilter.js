/**
 * 内容安全审核中间件
 * 敏感词过滤 + 内容分类审核
 */

// ========== 敏感词库 ==========
// 生产环境建议使用外部词库文件或专业内容审核API

// 政治敏感词（示例，实际应使用专业词库）
const POLITICAL_KEYWORDS = [
  // 此处应接入专业敏感词库
  // 示例保留结构，实际部署时替换为完整词库
];

// 违法违规关键词
const ILLEGAL_KEYWORDS = [
  '洗钱', '赌博', '毒品', '枪支', '弹药', '爆炸物',
  '传销', '诈骗', '黑客攻击', '网络攻击',
  '制毒', '贩毒', '走私',
];

// 色情低俗关键词
const ADULT_KEYWORDS = [
  // 此处应接入专业词库
];

// 仇恨言论关键词
const HATE_KEYWORDS = [
  // 此处应接入专业词库
];

// 个人信息泄露检测模式
const PII_PATTERNS = [
  // 手机号
  /1[3-9]\d{9}/g,
  // 身份证号
  /[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]/g,
  // 银行卡号（简化匹配）
  /\b\d{16,19}\b/g,
  // 邮箱
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
];

// 所有敏感词集合
const ALL_SENSITIVE_WORDS = [
  ...POLITICAL_KEYWORDS,
  ...ILLEGAL_KEYWORDS,
  ...ADULT_KEYWORDS,
  ...HATE_KEYWORDS,
];

/**
 * 检测文本中的敏感词
 */
function detectSensitiveWords(text) {
  if (!text || typeof text !== 'string') return { safe: true, matches: [] };

  const matches = [];
  const lowerText = text.toLowerCase();

  for (const word of ALL_SENSITIVE_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      matches.push({
        word,
        type: classifyWord(word),
      });
    }
  }

  return {
    safe: matches.length === 0,
    matches,
  };
}

/**
 * 对敏感词进行分类
 */
function classifyWord(word) {
  if (POLITICAL_KEYWORDS.includes(word)) return 'political';
  if (ILLEGAL_KEYWORDS.includes(word)) return 'illegal';
  if (ADULT_KEYWORDS.includes(word)) return 'adult';
  if (HATE_KEYWORDS.includes(word)) return 'hate';
  return 'other';
}

/**
 * 检测个人信息泄露
 */
function detectPII(text) {
  if (!text || typeof text !== 'string') return { found: false, items: [] };

  const items = [];

  for (const pattern of PII_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        items.push({
          type: identifyPIIType(match),
          value: maskPII(match),
        });
      }
    }
  }

  return { found: items.length > 0, items };
}

/**
 * 识别PII类型
 */
function identifyPIIType(value) {
  if (/^1[3-9]\d{9}$/.test(value)) return 'phone';
  if (/^\d{17}[\dXx]$/.test(value)) return 'id_card';
  if (/^\d{16,19}$/.test(value)) return 'bank_card';
  if (/\S+@\S+\.\S+/.test(value)) return 'email';
  return 'unknown';
}

/**
 * 脱敏处理
 */
function maskPII(value) {
  if (value.length <= 4) return '****';
  const start = value.slice(0, 3);
  const end = value.slice(-2);
  return `${start}${'*'.repeat(Math.min(value.length - 5, 8))}${end}`;
}

/**
 * 内容安全审核中间件
 */
function contentFilter(req, res, next) {
  try {
    const body = req.body;
    const messages = body.messages || [];
    const allTexts = messages.map((msg) => msg.content || '').join(' ');

    // 1. 敏感词检测
    const sensitiveResult = detectSensitiveWords(allTexts);
    if (!sensitiveResult.safe) {
      const mode = process.env.CONTENT_FILTER_MODE || 'sanitize';

      if (mode === 'reject') {
        return res.status(400).json({
          error: '内容包含敏感信息，请修改后重试',
          code: 'CONTENT_FILTERED',
          details: {
            category: sensitiveResult.matches[0]?.type,
          },
        });
      }

      if (mode === 'sanitize') {
        // 对敏感词进行替换
        for (const msg of messages) {
          if (msg.content && typeof msg.content === 'string') {
            for (const match of sensitiveResult.matches) {
              const regex = new RegExp(match.word, 'gi');
              msg.content = msg.content.replace(regex, '**');
            }
          }
        }
      }
    }

    // 2. 个人信息泄露检测
    const piiResult = detectPII(allTexts);
    if (piiResult.found) {
      console.warn(
        `[Content Filter] 检测到可能的个人信息泄露:`,
        JSON.stringify(piiResult.items)
      );

      // 自动脱敏
      for (const msg of messages) {
        if (msg.content && typeof msg.content === 'string') {
          for (const pattern of PII_PATTERNS) {
            pattern.lastIndex = 0;
            msg.content = msg.content.replace(pattern, (match) => maskPII(match));
          }
        }
      }
    }

    // 3. 内容长度限制
    const MAX_CONTENT_LENGTH = parseInt(process.env.MAX_CONTENT_LENGTH || '8000', 10);
    for (const msg of messages) {
      if (msg.content && typeof msg.content === 'string') {
        if (msg.content.length > MAX_CONTENT_LENGTH) {
          msg.content = msg.content.slice(0, MAX_CONTENT_LENGTH) + '\n\n[内容过长，已截断]';
        }
      }
    }

    next();
  } catch (error) {
    console.error('[Content Filter Error]', error.message);
    next();
  }
}

module.exports = { contentFilter, detectSensitiveWords, detectPII, maskPII };
