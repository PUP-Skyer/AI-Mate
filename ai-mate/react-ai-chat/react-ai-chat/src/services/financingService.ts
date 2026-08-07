/**
 * 融资方接口层
 * 参照 knowledgeService.ts / authService.ts 模式
 * 提供融资方 API 接口，方便后续连接融资端后端
 *
 * 当后端不可用时，所有接口返回空数据/失败状态，前端使用 AI 生成的数据兜底
 */

import type {
  FinancingProvider,
  FinancingStage,
  ProviderType,
  ProviderDetail,
} from '../components/sage/finance-utils';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/** 融资方查询参数 */
export interface ProviderQueryParams {
  type?: ProviderType;       // 机构/个人筛选
  category?: string;         // VC / 产业资本 / 天使投资人
  focusArea?: string;        // 关注领域关键词
  page?: number;             // 页码（默认1）
  pageSize?: number;         // 每页数量（默认20）
}

/** 融资方列表响应 */
export interface ProviderListResponse {
  providers: FinancingProvider[];
  total: number;
  page: number;
  pageSize: number;
}

/** 融资方匹配参数 */
export interface ProviderMatchParams {
  projectName: string;
  industry: string;
  stage: string;
  fundingAmount?: number;      // 目标融资金额（万元）
  description?: string;        // 项目简介
}

/** 融资规划提交参数 */
export interface FinancingPlanSubmitParams {
  projectName: string;
  stages: FinancingStage[];
  providerIds?: string[];      // 意向融资方ID列表
  contactInfo?: string;        // 创业者联系方式
}

/** 融资规划提交响应 */
export interface FinancingPlanSubmitResponse {
  success: boolean;
  message: string;
  planId?: string;             // 融资计划ID（后端生成）
  matchedProviderIds?: string[]; // 匹配的融资方ID列表
}

/**
 * 获取融资方列表
 * GET /api/financing/providers?type=institution&category=VC&page=1&pageSize=20
 */
export async function fetchProviders(
  params: ProviderQueryParams = {}
): Promise<ProviderListResponse> {
  try {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.category) query.set('category', params.category);
    if (params.focusArea) query.set('focusArea', params.focusArea);
    query.set('page', String(params.page ?? 1));
    query.set('pageSize', String(params.pageSize ?? 20));

    const resp = await fetch(`${API_BASE}/financing/providers?${query}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    if (!text) return { providers: [], total: 0, page: 1, pageSize: 20 };
    const json = JSON.parse(text);
    return {
      providers: json?.data?.providers ?? [],
      total: json?.data?.total ?? 0,
      page: json?.data?.page ?? 1,
      pageSize: json?.data?.pageSize ?? 20,
    };
  } catch {
    // 后端不可用时返回空列表，前端使用 AI 生成的数据兜底
    return { providers: [], total: 0, page: 1, pageSize: 20 };
  }
}

/**
 * 获取融资方详情（扩展字段）
 * GET /api/financing/providers/:id
 */
export async function fetchProviderDetail(
  id: string
): Promise<ProviderDetail | null> {
  try {
    const resp = await fetch(`${API_BASE}/financing/providers/${id}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    if (!text) return null;
    const json = JSON.parse(text);
    return json?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * 智能匹配融资方
 * POST /api/financing/providers/match
 * Body: ProviderMatchParams
 */
export async function matchProviders(
  params: ProviderMatchParams
): Promise<FinancingProvider[]> {
  try {
    const resp = await fetch(`${API_BASE}/financing/providers/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    if (!text) return [];
    const json = JSON.parse(text);
    return json?.data?.providers ?? [];
  } catch {
    // 后端不可用时返回空列表
    return [];
  }
}

/**
 * 提交融资规划（对接融资端）
 * POST /api/financing/plans
 * Body: FinancingPlanSubmitParams
 */
export async function submitFinancingPlan(
  params: FinancingPlanSubmitParams
): Promise<FinancingPlanSubmitResponse> {
  try {
    const resp = await fetch(`${API_BASE}/financing/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    if (!text) {
      return {
        success: false,
        message: '融资端返回空响应，请稍后重试',
      };
    }
    const json = JSON.parse(text);
    return {
      success: json?.success ?? false,
      message: json?.message ?? '提交完成',
      planId: json?.data?.planId,
      matchedProviderIds: json?.data?.matchedProviderIds,
    };
  } catch {
    return {
      success: false,
      message: '融资端服务暂不可用，请稍后重试或联系客服',
    };
  }
}

/**
 * 收藏/取消收藏融资方
 * POST /api/financing/providers/:id/favorite
 * Body: { favorite: boolean }
 */
export async function toggleProviderFavorite(
  providerId: string,
  favorite: boolean
): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE}/financing/providers/${providerId}/favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorite }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}
