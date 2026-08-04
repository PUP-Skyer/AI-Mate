/**
 * 认证服务
 * 对接后端 /api/auth/*（JWT + bcrypt）
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface AuthUser {
  id: number;
  email?: string;
  username: string;
  nickname: string;
  avatar?: string | null;
  level?: number;
  exp?: number;
  tier: string;
  tierLabel: string;
  quickPassCount: number;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

/**
 * 安全解析响应体：先读 text 再 JSON.parse，避免空响应体崩溃
 * 返回 { ok, json, text, status }
 */
async function safeParse(resp: Response): Promise<{
  ok: boolean;
  json: Record<string, unknown> | null;
  text: string;
  status: number;
}> {
  const text = await resp.text();
  let json: Record<string, unknown> | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      // 非 JSON 响应（如 HTML 错误页、纯文本），保持 json = null
    }
  }
  return { ok: resp.ok, json, text, status: resp.status };
}

/** 提取错误消息 */
function extractError(result: { json: Record<string, unknown> | null; text: string; status: number }, fallback: string): string {
  if (result.json?.message) return result.json.message as string;
  if (result.json?.error) return result.json.error as string;
  if (result.text) return result.text.slice(0, 300);
  return `${fallback} (${result.status})`;
}

/** 注册 */
export async function register(email: string, password: string, username?: string): Promise<AuthResponse> {
  const resp = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username }),
  });
  const result = await safeParse(resp);
  if (!result.ok) throw new Error(extractError(result, '注册失败'));
  if (!result.json?.data) throw new Error('注册返回数据异常');
  return result.json.data as AuthResponse;
}

/** 登录 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const resp = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const result = await safeParse(resp);
  if (!result.ok) throw new Error(extractError(result, '登录失败'));
  if (!result.json?.data) throw new Error('登录返回数据异常');
  return result.json.data as AuthResponse;
}

/** 会话恢复：校验 token 获取用户 */
export async function fetchMe(token: string): Promise<AuthUser> {
  const resp = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await safeParse(resp);
  if (!result.ok) throw new Error(extractError(result, '会话已过期'));
  if (!result.json?.data) throw new Error('用户信息获取异常');
  return result.json.data as AuthUser;
}

/** 修改密码 */
export async function changePassword(oldPassword: string, newPassword: string, token: string): Promise<void> {
  const resp = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  const result = await safeParse(resp);
  if (!result.ok) throw new Error(extractError(result, '修改密码失败'));
}
