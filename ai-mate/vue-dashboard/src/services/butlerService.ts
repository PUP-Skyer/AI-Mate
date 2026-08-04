/**
 * 管家 Butler - 服务层
 * 对接 /api/butler 和 /api/dashboard 接口
 */

const BUTLER_API = '/api/butler'
const DASHBOARD_API = '/api/dashboard'

function getToken() {
  return localStorage.getItem('ai-mate-token')
}

async function request(method: string, basePath: string, path: string, body?: any) {
  const token = getToken()
  const res = await fetch(`${basePath}${path}`, {
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

// ==================== 类型定义 ====================

export interface FAQ {
  id: number
  question: string
  answer: string
  category: string
  createdAt: string
  updatedAt: string
}

export interface Feedback {
  id: number
  userId: number
  type: 'bug' | 'feature' | 'complaint' | 'praise'
  content: string
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  createdAt: string
  updatedAt: string
}

export interface OnboardingStatus {
  completed: boolean
  step: number
  totalSteps: number
}

export interface OverviewStats {
  totalUsers: number
  todayConversations: number
  satisfaction: number
  pendingFeedback: number
}

export interface UsageTrend {
  date: string
  count: number
}

export interface UserGrowthData {
  date: string
  count: number
}

// ==================== Butler API ====================

/** 获取 FAQ 列表 */
export async function getFAQs(): Promise<FAQ[]> {
  return request('GET', BUTLER_API, '/faqs')
}

/** 提交反馈 */
export async function submitFeedback(data: {
  type: Feedback['type']
  content: string
}): Promise<Feedback> {
  return request('POST', BUTLER_API, '/feedback', data)
}

/** 获取反馈列表 */
export async function getFeedbacks(status?: string): Promise<Feedback[]> {
  const query = status ? `?status=${status}` : ''
  return request('GET', BUTLER_API, `/feedback${query}`)
}

/** 获取引导状态 */
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  return request('GET', BUTLER_API, '/onboarding')
}

// ==================== Dashboard API ====================

/** 获取总览数据 */
export async function getOverview(): Promise<OverviewStats> {
  return request('GET', DASHBOARD_API, '/overview')
}

/** 获取使用趋势 */
export async function getUsage(days = 30): Promise<UsageTrend[]> {
  return request('GET', `${DASHBOARD_API}/usage?days=${days}`, '')
}

/** 获取用户增长数据 */
export async function getUserGrowth(days = 30): Promise<UserGrowthData[]> {
  return request('GET', `${DASHBOARD_API}/user-growth?days=${days}`, '')
}
