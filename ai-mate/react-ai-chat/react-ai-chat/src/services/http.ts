/**
 * HTTP 请求小助手
 * 统一注入 Authorization token、处理 401 跳登录
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/** 获取当前 token（供各 service 复用） */
export function getToken(): string | null {
  return localStorage.getItem('ai_mate_token');
}

/** 清除登录态（token + user） */
export function clearAuthStorage() {
  localStorage.removeItem('ai_mate_token');
  localStorage.removeItem('ai_mate_user');
}

/**
 * 带认证的 fetch：自动注入 Bearer token；401 时清除登录态并触发全局回调
 */
export async function authFetch(url: string, options: RequestInit = {}, required = true): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const resp = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (required && resp.status === 401) {
    clearAuthStorage();
    // 通知全局（如 authStore）登录态失效
    window.dispatchEvent(new CustomEvent('ai-mate:unauthorized'));
  }
  return resp;
}
