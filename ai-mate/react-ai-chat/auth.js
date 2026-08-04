/**
 * 认证模块（JWT + bcrypt）
 * 提供密码哈希、JWT 签发/校验、可选/强制认证中间件
 * 现有接口在无 token 时回退 user_id=1（保持演示数据可读），认证接口强制登录
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-mate-dev-secret';
const TOKEN_EXPIRES = '7d';

/** 密码哈希 */
export function hashPassword(plain) {
  return bcrypt.hashSync(String(plain), 10);
}

/** 校验密码 */
export function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compareSync(String(plain), hash);
}

/** 签发 JWT */
export function signToken(userId) {
  return jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });
}

/** 从 Authorization 头解析 userId（失败返回 null） */
export function parseUserId(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload && typeof payload.uid === 'number' ? payload.uid : null;
  } catch {
    return null;
  }
}

/**
 * 可选认证中间件：有有效 token 时挂 req.userId，否则回退默认 userId（1）
 */
export function optionalAuth(req, res, next) {
  const uid = parseUserId(req.headers.authorization);
  req.userId = uid ?? 1;
  next();
}

/**
 * 强制认证中间件：无有效 token 返回 401
 */
export function requiredAuth(req, res, next) {
  const uid = parseUserId(req.headers.authorization);
  if (uid === null) {
    return res.status(401).json({ code: 401, message: '未登录或登录已过期', data: null });
  }
  req.userId = uid;
  next();
}

export { JWT_SECRET };
