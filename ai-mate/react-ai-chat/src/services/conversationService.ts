/**
 * 对话 CRUD API 服务�? * 与后端同步对话和消息数据
 */

const API_BASE = '/api';

// ========== 类型定义 ==========

export interface ConversationDTO {
  id: number;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDTO {
  id: number;
  role: string;
  content: string;
  tokenCount: number;
  createdAt: string;
}

export interface ConversationDetailDTO extends ConversationDTO {
  messages: MessageDTO[];
}

// ========== 通用请求封装 ==========

function getToken(): string | null {
  return localStorage.getItem('ai-mate-token') || localStorage.getItem('ai_mate_token');
}

async function request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`请求失败: ${res.status}`);
  }

  const data = await res.json();
  if (data.code !== 200) {
    throw new Error(data.message || '请求失败');
  }
  return data.data;
}

// ========== 对话 API ==========

/**
 * 获取对话列表
 */
export async function fetchConversations(): Promise<ConversationDTO[]> {
  return request<ConversationDTO[]>('GET', '/conversations');
}

/**
 * 创建对话
 */
export async function createConversation(title?: string, type?: string): Promise<ConversationDTO> {
  return request<ConversationDTO>('POST', '/conversations', {
    title: title || '新对话',
    type: type || 'scout',
  });
}

/**
 * 获取对话详情（含消息�? */
export async function fetchConversationDetail(id: number): Promise<ConversationDetailDTO> {
  return request<ConversationDetailDTO>('GET', `/conversations/${id}`);
}

/**
 * 删除对话
 */
export async function deleteConversation(id: number): Promise<void> {
  return request<void>('DELETE', `/conversations/${id}`);
}

/**
 * 更新对话标题
 */
export async function updateConversationTitle(id: number, title: string): Promise<void> {
  return request<void>('PUT', `/conversations/${id}`, { title });
}

/**
 * 添加消息
 */
export async function addMessage(
  conversationId: number,
  role: string,
  content: string,
  tokenCount?: number
): Promise<MessageDTO> {
  return request<MessageDTO>('POST', `/conversations/${conversationId}/messages`, {
    role,
    content,
    tokenCount: tokenCount || 0,
  });
}
