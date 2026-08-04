/**
 * Demo作品服务层
 * API封装 + 类型定义
 */

const API_BASE = 'http://localhost:8080/api';

/** 项目阶段 */
export type ProjectStage = 'seed' | 'angel' | 'series_a' | 'series_b' | 'series_c' | 'pre_ipo';

/** 团队类型 */
export type TeamType = 'solo_opc' | 'team_otc';

/** Demo类型 */
export type DemoType = 'web' | 'desktop' | 'app' | 'miniapp';

/** 团队成员 */
export interface TeamMember {
  name: string;
  role?: string;
  avatar?: string;
}

/** Demo项目 */
export interface DemoProject {
  id: number;
  user_id: number;
  title: string;
  description: string;
  cover_image?: string;
  demo_type: DemoType;
  demo_url?: string;
  demo_video_url?: string;
  preview_urls?: string[];
  stage: ProjectStage;
  team_type: TeamType;
  team_size: number;
  team_members?: TeamMember[];
  tech_stack?: string[];
  tags?: string[];
  links?: Record<string, string>;
  view_count: number;
  like_count: number;
  status: string;
  created_at: string;
  updated_at?: string;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  list: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** 筛选选项 */
export interface FilterOptions {
  types: { value: DemoType; label: string }[];
  stages: { value: ProjectStage; label: string; color: string }[];
  teamTypes: { value: TeamType; label: string }[];
}

/** 通用请求封装 */
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (data.code !== 200) {
    throw new Error(data.message || '请求失败');
  }
  return data.data;
}

/** 获取Demo列表 */
export async function fetchDemoList(params: {
  page?: number;
  pageSize?: number;
  type?: DemoType;
  stage?: ProjectStage;
  team_type?: TeamType;
  keyword?: string;
  sort?: 'created_at' | 'view_count' | 'like_count';
}): Promise<PaginatedResponse<DemoProject>> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) searchParams.append(key, String(value));
  });
  return request(`${API_BASE}/demos?${searchParams.toString()}`);
}

/** 获取Demo详情 */
export async function fetchDemoDetail(id: number): Promise<DemoProject> {
  return request(`${API_BASE}/demos/${id}`);
}

/** 创建Demo */
export async function createDemo(data: Partial<DemoProject>): Promise<{ id: number; message: string }> {
  return request(`${API_BASE}/demos`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 更新Demo */
export async function updateDemo(id: number, data: Partial<DemoProject>): Promise<{ message: string }> {
  return request(`${API_BASE}/demos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** 删除Demo */
export async function deleteDemo(id: number): Promise<{ message: string }> {
  return request(`${API_BASE}/demos/${id}`, { method: 'DELETE' });
}

/** 点赞/取消点赞 */
export async function likeDemo(id: number, action: 'like' | 'unlike'): Promise<{ like_count: number; action: string }> {
  return request(`${API_BASE}/demos/${id}/like`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

/** 获取筛选选项 */
export async function fetchDemoFilters(): Promise<FilterOptions> {
  return request(`${API_BASE}/demos/filters`);
}
