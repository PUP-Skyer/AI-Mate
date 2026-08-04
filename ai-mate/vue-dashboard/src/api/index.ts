const API_BASE = '/api'

function getToken() {
  return localStorage.getItem('ai-mate-token')
}

async function request(method: string, path: string, body?: any) {
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

export async function getOverview() {
  return request('GET', '/dashboard/overview')
}

export async function getAIUsage(days = 30) {
  return request('GET', `/dashboard/usage?days=${days}`)
}

export async function getUserGrowth(days = 30) {
  return request('GET', `/dashboard/user-growth?days=${days}`)
}
