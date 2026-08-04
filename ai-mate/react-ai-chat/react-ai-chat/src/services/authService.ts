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

/** 注册 */
export async function register(email: string, password: string, username?: string): Promise<AuthResponse> {
  const resp = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username }),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json?.message || '注册失败');
  return json.data;
}

/** 登录 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const resp = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json?.message || '登录失败');
  return json.data;
}

/** 会话恢复：校验 token 获取用户 */
export async function fetchMe(token: string): Promise<AuthUser> {
  const resp = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json?.message || '会话已过期');
  return json.data;
}

/** 修改密码 */
export async function changePassword(oldPassword: string, newPassword: string, token: string): Promise<void> {
  const resp = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json?.message || '修改密码失败');
}
