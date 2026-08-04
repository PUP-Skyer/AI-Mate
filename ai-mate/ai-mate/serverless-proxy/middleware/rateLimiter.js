/**
 * 速率限制中间件
 * 基于内存的滑动窗口速率限制器
 * 生产环境建议使用 Redis 实现分布式速率限制
 */

// ========== 内存存储 ==========
const requestStore = new Map();

/**
 * 清理过期记录（定时任务）
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestStore.entries()) {
    if (now - record.lastReset > record.windowMs * 2) {
      requestStore.delete(key);
    }
  }
}, 60 * 1000).unref(); // 每60秒清理一次

/**
 * 速率限制中间件工厂函数
 * @param {Object} options - 配置选项
 * @param {number} options.windowMs - 时间窗口（毫秒）
 * @param {number} options.maxRequests - 窗口内最大请求数
 * @param {string} options.keyGenerator - 自定义键生成器
 */
function rateLimiter(options = {}) {
  const {
    windowMs = 60 * 1000, // 默认1分钟
    maxRequests = 60, // 默认每分钟60次
    keyGenerator = (req) => {
      // 优先使用用户ID，其次使用IP
      const userId = req.user?.id;
      if (userId) return `user:${userId}`;
      const ip =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.socket?.remoteAddress ||
        'unknown';
      return `ip:${ip}`;
    },
  } = options;

  return function rateLimitMiddleware(req, res, next) {
    const key = keyGenerator(req);

    // 获取或创建记录
    let record = requestStore.get(key);

    if (!record || Date.now() - record.lastReset > windowMs) {
      // 新窗口
      record = {
        count: 0,
        lastReset: Date.now(),
        windowMs,
        maxRequests,
      };
      requestStore.set(key, record);
    }

    record.count++;

    // 设置速率限制响应头
    const remaining = Math.max(0, maxRequests - record.count);
    const resetTime = Math.ceil((record.lastReset + windowMs) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);

    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.lastReset + windowMs - Date.now()) / 1000);
      res.setHeader('Retry-After', Math.max(1, retryAfter));

      return res.status(429).json({
        error: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.max(1, retryAfter),
      });
    }

    next();
  };
}

/**
 * 预设速率限制器
 */
const presets = {
  // 通用API限制：每分钟60次
  standard: rateLimiter({ windowMs: 60 * 1000, maxRequests: 60 }),

  // AI对话限制：每分钟30次
  chat: rateLimiter({ windowMs: 60 * 1000, maxRequests: 30 }),

  // 严格限制：每分钟10次
  strict: rateLimiter({ windowMs: 60 * 1000, maxRequests: 10 }),

  // 每小时限制：每小时200次
  hourly: rateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 200 }),
};

module.exports = { rateLimiter, presets };
