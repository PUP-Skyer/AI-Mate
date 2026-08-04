/**
 * 探路�?Scout 服务�? * 供应商搜索、资源对比、行业报�? */

import axios from 'axios';

const API_BASE = '/api/scout';

function getAuthHeaders() {
  const token = localStorage.getItem('ai-mate-token') || localStorage.getItem('ai_mate_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ========== 类型定义 ==========

export interface Supplier {
  id: string;
  name: string;
  category: string;
  region: string;
  rating: number;
  description?: string;
  contact?: string;
}

export interface Partner {
  id: string;
  name: string;
  region: string;
  industry: string;
  investmentRange: string;
  rating: number;
  description?: string;
  contact?: string;
  companyImage?: string;
}

export interface CompareResult {
  suppliers: Supplier[];
  dimensions: {
    name: string;
    values: Record<string, string | number>;
  }[];
}

export interface Report {
  id: string;
  title: string;
  category: string;
  date: string;
  summary: string;
  publisher?: string;
  pages?: string;
  region?: string;
}

export interface MarketData {
  industry: string;
  timeRange: string;
  marketSize: number;
  growthRate: number;
  growthTrend: 'up' | 'down' | 'stable';
  activeCompanies: number;
  hotAreas: string[];
  summary: string;
}

// ========== API 函数 ==========

/**
 * 获取供应商列�? */
export async function getSuppliers(params?: {
  category?: string;
  region?: string;
  page?: number;
  pageSize?: number;
}): Promise<Supplier[]> {
  const response = await axios.get(API_BASE + '/suppliers', {
    headers: getAuthHeaders(),
    params,
  });
  return response.data?.data || response.data || [];
}

/**
 * 搜索供应�? */
export async function searchSuppliers(params: {
  keyword?: string;
  category?: string;
  region?: string;
}): Promise<Supplier[]> {
  const response = await axios.post(API_BASE + '/suppliers/search', params, {
    headers: getAuthHeaders(),
  });
  return response.data?.data || response.data || [];
}

/**
 * 对比供应�? */
export async function compareSuppliers(supplierIds: string[]): Promise<CompareResult> {
  const response = await axios.post(API_BASE + '/suppliers/compare', { supplierIds }, {
    headers: getAuthHeaders(),
  });
  return response.data?.data || response.data;
}

/**
 * 获取合作伙伴推荐列表
 */
export async function getPartners(params?: {
  region?: string;
  investmentRange?: string;
  industry?: string;
}): Promise<Partner[]> {
  const response = await axios.get(API_BASE + '/partners', {
    headers: getAuthHeaders(),
    params,
  });
  return response.data?.data || response.data || [];
}

/**
 * 获取市场行情数据
 */
export async function getMarketData(params?: {
  industry?: string;
  timeRange?: string;
}): Promise<MarketData> {
  const response = await axios.get(API_BASE + '/market', {
    headers: getAuthHeaders(),
    params,
  });
  return response.data?.data || response.data;
}

/**
 * 获取行业报告列表
 */
export async function getReports(params?: {
  category?: string;
  page?: number;
  pageSize?: number;
}): Promise<Report[]> {
  const response = await axios.get(API_BASE + '/reports', {
    headers: getAuthHeaders(),
    params,
  });
  return response.data?.data || response.data || [];
}
