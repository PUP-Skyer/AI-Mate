const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('ai-mate-token');
}

async function request<T = any>(
  method: string,
  path: string,
  body?: any
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: '请求失败' }));
    throw new Error(errorData.message || `请求失败: ${res.status}`);
  }

  const data = await res.json();
  return data.data ?? data;
}

export interface ApiTemplate {
  id: number;
  name: string;
  category: string;
  description: string;
  systemPrompt: string;
  userPrompt: string;
  icon: string;
  sortOrder: number;
  isPublic: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 获取模板列表（支持按分类筛选）
 */
export async function getTemplates(category?: string): Promise<ApiTemplate[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  return request<ApiTemplate[]>('GET', `/templates${query}`);
}

/**
 * 获取模板详情
 */
export async function getTemplateDetail(id: number): Promise<ApiTemplate> {
  return request<ApiTemplate>('GET', `/templates/${id}`);
}
