/**
 * Token 用量统计服务
 * 后端记录每次模型调用 token（/api/usage/*），前端展示汇总与明细
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface UsageRecord {
  id: string;
  modelId: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  source: string;
  createdAt: number;
}

export interface ModelUsage {
  modelId: string;
  calls: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  lastUsedAt: number;
}

export interface UsageSummary {
  byModel: ModelUsage[];
  total: { calls: number; prompt_tokens: number; completion_tokens: number; total_tokens: number };
  today: { calls: number; prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

/** 获取用量汇总（按模型） */
export async function fetchUsageSummary(): Promise<UsageSummary> {
  try {
    const resp = await fetch(`${API_BASE}/usage/summary`);
    const json = await resp.json();
    return json?.data || { byModel: [], total: { calls: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, today: { calls: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } };
  } catch {
    return { byModel: [], total: { calls: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, today: { calls: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } };
  }
}

/** 获取用量明细 */
export async function fetchUsageRecords(limit = 50): Promise<UsageRecord[]> {
  try {
    const resp = await fetch(`${API_BASE}/usage/records?limit=${limit}`);
    const json = await resp.json();
    return json?.data?.records || [];
  } catch {
    return [];
  }
}

/** 重置用量 */
export async function resetUsage(): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE}/usage/reset`, { method: 'DELETE' });
    return resp.ok;
  } catch {
    return false;
  }
}

/** 格式化 token 数（千分位） */
export function formatTokens(n: number): string {
  return Number(n || 0).toLocaleString('zh-CN');
}

/** 估算费用（按 tokens 近似换算：输入 0.001 元/千 token，输出 0.003 元/千 token 的粗略模型） */
export function estimateCost(record: { prompt_tokens: number; completion_tokens: number }): number {
  return (record.prompt_tokens / 1000) * 0.001 + (record.completion_tokens / 1000) * 0.003;
}
