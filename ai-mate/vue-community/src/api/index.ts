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

// ==================== 帖子相关 ====================

export interface PageResult<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface PostItem {
  id: number
  title: string
  content: string
  category: string
  authorName: string
  authorAvatar: string
  likeCount: number
  commentCount: number
  createdAt: string
  updatedAt: string
}

export interface CommentItem {
  id: number
  postId: number
  content: string
  authorName: string
  authorAvatar: string
  createdAt: string
}

export interface PostDetail extends PostItem {
  comments: CommentItem[]
  liked: boolean
}

export interface CreatePostParams {
  title: string
  content: string
  category?: string
}

/** 获取帖子列表（分页） */
export async function getPosts(
  params?: { page?: number; size?: number; category?: string }
): Promise<PageResult<PostItem>> {
  const query = new URLSearchParams()
  if (params?.page !== undefined) query.set('page', String(params.page))
  if (params?.size !== undefined) query.set('size', String(params.size))
  if (params?.category) query.set('category', params.category)
  const qs = query.toString()
  return request<PageResult<PostItem>>('GET', `/community/posts${qs ? `?${qs}` : ''}`)
}

/** 获取帖子详情（含评论） */
export async function getPostDetail(id: number): Promise<PostDetail> {
  return request<PostDetail>('GET', `/community/posts/${id}`)
}

/** 发布帖子 */
export async function createPost(data: CreatePostParams): Promise<PostItem> {
  return request<PostItem>('POST', '/community/posts', data)
}

/** 发表评论 */
export async function addComment(postId: number, content: string): Promise<CommentItem> {
  return request<CommentItem>('POST', `/community/posts/${postId}/comments`, { content })
}

/** 点赞帖子 */
export async function likePost(postId: number): Promise<void> {
  return request<void>('POST', `/community/posts/${postId}/like`)
}
