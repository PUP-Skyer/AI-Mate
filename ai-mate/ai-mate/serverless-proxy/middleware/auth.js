/**
 * JWT Token 验证中间件
 * 从 Authorization Header 中提取并验证 JWT Token
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ai-mate-default-secret-change-in-production';

/**
 * 验证JWT Token中间件
 * 支持两种模式：
 * 1. 严格模式（默认）：Token无效时返回401
 * 2. 宽松模式：Token无效时继续请求但标记为未认证
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: '未提供认证令牌',
      code: 'AUTH_MISSING',
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: '认证令牌格式无效',
      code: 'AUTH_INVALID_FORMAT',
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.sub || decoded.userId || decoded.id,
      role: decoded.role || 'user',
      exp: decoded.exp,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: '认证令牌已过期',
        code: 'AUTH_EXPIRED',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: '认证令牌无效',
        code: 'AUTH_INVALID',
      });
    }
    return res.status(500).json({
      error: '认证服务异常',
      code: 'AUTH_ERROR',
    });
  }
}

/**
 * 可选认证中间件 - Token有效时解析用户信息，无效时不拦截
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = null;
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    try {
      const decoded = jwt.verify(parts[1], JWT_SECRET);
      req.user = {
        id: decoded.sub || decoded.userId || decoded.id,
        role: decoded.role || 'user',
      };
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

/**
 * 生成JWT Token（工具函数）
 */
function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

module.exports = { verifyToken, optionalAuth, generateToken };
