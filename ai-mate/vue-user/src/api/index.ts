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

// ==================== 用户相关 ====================

export interface UserProfile {
  id: number
  nickname: string
  avatar: string
  email: string
  bio: string
  createdAt: string
}

export interface UpdateProfileParams {
  nickname?: string
  avatar?: string
}

export interface StartupProfileData {
  stage: string
  industry: string
  productType: string
  teamSize: string
  preferences: string
}

export interface UpdateStartupProfileParams {
  stage?: string
  industry?: string
  productType?: string
  teamSize?: string
  preferences?: string
}

/** 获取用户资料 */
export async function getUserProfile(): Promise<UserProfile> {
  return request<UserProfile>('GET', '/user/profile')
}

/** 更新用户资料 */
export async function updateProfile(data: UpdateProfileParams): Promise<UserProfile> {
  return request<UserProfile>('PUT', '/user/profile', data)
}

/** 获取创业档案 */
export async function getStartupProfile(): Promise<StartupProfileData> {
  return request<StartupProfileData>('GET', '/user/startup-profile')
}

/** 更新创业档案 */
export async function updateStartupProfile(data: UpdateStartupProfileParams): Promise<StartupProfileData> {
  return request<StartupProfileData>('PUT', '/user/startup-profile', data)
}
