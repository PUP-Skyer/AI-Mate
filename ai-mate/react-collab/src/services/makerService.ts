/**
 * 工匠 Maker - 内容创作服务
 * 对接 /api/maker 接口
 */

const API_BASE = '/api/maker';

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

// ==================== 类型定义 ====================

export interface ContentPiece {
  id: number;
  spaceId: number;
  type: 'marketing' | 'social_media' | 'video_script' | 'product_desc' | 'brand_story';
  title: string;
  content: string;
  productName: string;
  features: string;
  targetAudience: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface ContentVersion {
  id: number;
  contentPieceId: number;
  version: number;
  content: string;
  createdAt: string;
}

export interface Space {
  id: number;
  name: string;
  description: string;
  contentCount: number;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== 内容相关接口 ====================

/** 获取内容列表 */
export async function getContentPieces(spaceId?: number): Promise<ContentPiece[]> {
  const query = spaceId ? `?spaceId=${spaceId}` : '';
  return request<ContentPiece[]>('GET', `/content${query}`);
}

/** 获取单个内容详情 */
export async function getContentPiece(id: number): Promise<ContentPiece> {
  return request<ContentPiece>('GET', `/content/${id}`);
}

/** 创建内容 */
export async function createContentPiece(data: {
  spaceId?: number;
  type: ContentPiece['type'];
  title?: string;
  productName: string;
  features: string;
  targetAudience: string;
}): Promise<ContentPiece> {
  return request<ContentPiece>('POST', '/content', data);
}

/** 更新内容 */
export async function updateContentPiece(
  id: number,
  data: Partial<Pick<ContentPiece, 'title' | 'content' | 'status'>>
): Promise<ContentPiece> {
  return request<ContentPiece>('PUT', `/content/${id}`, data);
}

// ==================== 版本相关接口 ====================

/** 获取内容版本列表 */
export async function getContentVersions(contentPieceId: number): Promise<ContentVersion[]> {
  return request<ContentVersion[]>('GET', `/content/${contentPieceId}/versions`);
}

/** 创建新版本 */
export async function createContentVersion(
  contentPieceId: number,
  content: string
): Promise<ContentVersion> {
  return request<ContentVersion>('POST', `/content/${contentPieceId}/versions`, { content });
}

// ==================== 空间相关接口 ====================

/** 获取空间列表 */
export async function getSpaces(): Promise<Space[]> {
  return request<Space[]>('GET', '/spaces');
}

/** 创建空间 */
export async function createSpace(data: {
  name: string;
  description?: string;
}): Promise<Space> {
  return request<Space>('POST', '/spaces', data);
}

/** 获取空间详情 */
export async function getSpace(id: number): Promise<Space> {
  return request<Space>('GET', `/spaces/${id}`);
}
