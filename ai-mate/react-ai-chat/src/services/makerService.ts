/**
 * 工匠AI Maker 服务�? * 内容生成服务
 */

import axios from 'axios';

const API_BASE = '/api/maker';

function getAuthHeaders() {
  const token = localStorage.getItem('ai-mate-token') || localStorage.getItem('ai_mate_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ========== 类型定义 ==========

export interface ContentTemplate {
  value: string;
  label: string;
  desc: string;
}

export interface ContentGenerationRequest {
  type: string;
  template: string;
  prompt: string;
  style?: string;
  length?: string;
}

// ========== API 函数 ==========

/**
 * 生成内容
 */
export async function generateContent(params: ContentGenerationRequest): Promise<string> {
  const response = await axios.post(API_BASE + '/generate', params, {
    headers: getAuthHeaders(),
  });
  return response.data?.data || response.data || '';
}

/**
 * 保存内容模板
 */
export async function saveTemplate(template: ContentTemplate): Promise<void> {
  await axios.post(API_BASE + '/templates', template, {
    headers: getAuthHeaders(),
  });
}

/**
 * 获取内容历史
 */
export async function getContentHistory(type?: string): Promise<string[]> {
  const response = await axios.get(API_BASE + '/history', {
    headers: getAuthHeaders(),
    params: { type },
  });
  return response.data?.data || response.data || [];
}