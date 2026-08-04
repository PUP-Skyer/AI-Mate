/**
 * 记忆系统服务
 * 参考 EvoFlow MemoryMiddleware：
 *   - 对话前加载记忆事实注入 systemPrompt（<memory> 标签）
 *   - 对话后由后端异步提取（extractMemoryAsync）
 * 前端负责：读取记忆、管理事实（查看/删除/清空）、构造注入文本
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface MemoryFact {
  id: string;
  content: string;
  category: 'preference' | 'knowledge' | 'context' | 'behavior' | 'goal';
  confidence: number;
  source: string;
  createdAt: number;
  updatedAt: number;
}

export interface MemoryData {
  workContext: string;
  personalContext: string;
  topOfMind: string;
  facts: MemoryFact[];
}

/**
 * 获取记忆（按置信度排序）
 */
export async function fetchMemory(maxFacts = 20): Promise<MemoryData> {
  try {
    const resp = await fetch(`${API_BASE}/memory?max=${maxFacts}`);
    const json = await resp.json();
    return json?.data || { workContext: '', personalContext: '', topOfMind: '', facts: [] };
  } catch {
    return { workContext: '', personalContext: '', topOfMind: '', facts: [] };
  }
}

/**
 * 构造注入到 systemPrompt 的记忆文本
 * 规则：最多 15 条高置信度事实 + 工作/个人上下文 + topOfMind
 */
export function buildMemoryInjection(memory: MemoryData, maxFacts = 15): string {
  const parts: string[] = [];

  if (memory.workContext) {
    parts.push(`工作上下文：${memory.workContext}`);
  }
  if (memory.personalContext) {
    parts.push(`个人背景：${memory.personalContext}`);
  }
  if (memory.topOfMind) {
    parts.push(`用户最近关注：${memory.topOfMind}`);
  }

  const facts = [...(memory.facts || [])]
    .filter((f) => f && f.content)
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    .slice(0, maxFacts);

  if (facts.length > 0) {
    parts.push('关于用户的已知事实：');
    facts.forEach((f) => {
      parts.push(`- ${f.content}`);
    });
  }

  if (parts.length === 0) return '';
  return `【记忆】以下是你记忆中关于该用户的信息，请在回答时自然运用（若与本轮问题无关可忽略）：\n${parts.join('\n')}`;
}

/**
 * 添加记忆事实
 */
export async function addMemoryFact(content: string, category = 'context'): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE}/memory/facts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, category, source: 'manual' }),
    });
    const json = await resp.json();
    return !!json?.data;
  } catch {
    return false;
  }
}

/**
 * 删除记忆事实
 */
export async function deleteMemoryFact(factId: string): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE}/memory/facts/${factId}`, { method: 'DELETE' });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * 清空记忆
 */
export async function clearMemory(): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE}/memory`, { method: 'DELETE' });
    return resp.ok;
  } catch {
    return false;
  }
}
