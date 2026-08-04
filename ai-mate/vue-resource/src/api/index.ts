const API_BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('ai-mate-token')
}

async function request<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (data.code !== 200) throw new Error(data.message || '请求失败')
  return data.data
}

// ==================== 资源模板相关 ====================

export interface TemplateItem {
  id: number
  name: string
  description: string
  category: string
  createdAt: string
  updatedAt: string
}

export interface TemplateDetail extends TemplateItem {
  systemPrompt: string
  usageCount: number
}

/** 获取模板列表 */
export async function getTemplates(
  params?: { category?: string }
): Promise<TemplateItem[]> {
  const query = params?.category ? `?category=${params.category}` : ''
  return request<TemplateItem[]>('GET', `/templates${query}`)
}

/** 获取模板详情 */
export async function getTemplateDetail(id: number): Promise<TemplateDetail> {
  return request<TemplateDetail>('GET', `/templates/${id}`)
}
