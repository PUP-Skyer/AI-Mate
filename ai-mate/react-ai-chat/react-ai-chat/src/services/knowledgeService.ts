/**
 * 知识库服务（RAG）
 * 参考 EvoFlow Knowledge Vault：
 *   后端做关键词/2-gram 检索（/api/knowledge/search），返回匹配文档
 *   支持接入本地 Obsidian vault（/api/knowledge/vault），检索合并内置资料 + 个人笔记
 *   前端可把检索结果作为上下文注入对话
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  tags: string[];
  score?: number;
  snippet?: string;
  content?: string;
  /** 来源：builtin（内置）| vault（Obsidian） */
  source?: 'builtin' | 'vault';
  /** vault 笔记相对路径（source=vault 时存在） */
  vaultPath?: string;
}

export interface VaultStatus {
  vaultPath: string;
  lastIndexedAt: number;
  totalFiles: number;
  indexedFiles: number;
  indexErrors: number;
  docsCount: number;
}

/**
 * 检索知识库（内置 + 已接入的 Obsidian vault）
 */
export async function searchKnowledge(query: string, topK = 3): Promise<KnowledgeDoc[]> {
  try {
    if (!query.trim()) {
      const resp = await fetch(`${API_BASE}/knowledge/search`);
      const json = await resp.json();
      return json?.data?.results || [];
    }
    const resp = await fetch(`${API_BASE}/knowledge/search?q=${encodeURIComponent(query)}&topK=${topK}`);
    const json = await resp.json();
    return json?.data?.results || [];
  } catch {
    return [];
  }
}

/**
 * 获取单个知识文档全文
 */
export async function fetchKnowledgeDoc(docId: string): Promise<KnowledgeDoc | null> {
  try {
    const resp = await fetch(`${API_BASE}/knowledge/docs/${docId}`);
    const json = await resp.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

/**
 * 获取 Obsidian vault 接入状态
 */
export async function fetchVaultStatus(): Promise<VaultStatus> {
  try {
    const resp = await fetch(`${API_BASE}/knowledge/vault`);
    const json = await resp.json();
    return (
      json?.data || {
        vaultPath: '',
        lastIndexedAt: 0,
        totalFiles: 0,
        indexedFiles: 0,
        indexErrors: 0,
        docsCount: 0,
      }
    );
  } catch {
    return { vaultPath: '', lastIndexedAt: 0, totalFiles: 0, indexedFiles: 0, indexErrors: 0, docsCount: 0 };
  }
}

/**
 * 接入新的 Obsidian vault（后端校验路径并扫描）
 */
export async function connectVault(vaultPath: string): Promise<{ ok: boolean; message: string; data?: VaultStatus }> {
  try {
    const resp = await fetch(`${API_BASE}/knowledge/vault`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vaultPath }),
    });
    const json = await resp.json();
    if (!resp.ok) {
      return { ok: false, message: json?.message || json?.error || '接入失败' };
    }
    return { ok: true, message: json?.data?.message || '接入成功', data: json?.data };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : '网络错误，请检查后端服务' };
  }
}

/**
 * 重新扫描当前 vault
 */
export async function rescanVault(): Promise<{ ok: boolean; message: string; data?: VaultStatus }> {
  try {
    const resp = await fetch(`${API_BASE}/knowledge/vault/scan`, { method: 'POST' });
    const json = await resp.json();
    if (!resp.ok) {
      return { ok: false, message: json?.message || json?.error || '重新扫描失败' };
    }
    return { ok: true, message: json?.data?.message || '重新扫描完成', data: json?.data };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : '网络错误，请检查后端服务' };
  }
}

/**
 * 解除 Obsidian vault 接入
 */
export async function disconnectVault(): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE}/knowledge/vault`, { method: 'DELETE' });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * 把检索结果构造为注入对话的上下文文本
 */
export function buildKnowledgeContext(docs: KnowledgeDoc[], query: string): string {
  if (!docs || docs.length === 0) return '';
  const lines = docs.map((d, i) => {
    const body = d.content || d.snippet || '';
    const tag = d.source === 'vault' ? `个人笔记：${d.vaultPath || d.title}` : `${d.title}（${d.category}）`;
    return `【资料${i + 1}】${tag}\n${body}`;
  });
  return `【知识库参考】用户提问「${query}」，以下是从知识库检索到的相关资料，请基于这些资料回答（资料可能不完全匹配，需结合你的判断）：\n\n${lines.join('\n\n')}`;
}
