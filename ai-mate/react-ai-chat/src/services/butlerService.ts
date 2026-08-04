/**
 * 管家 Butler 服务�? * FAQ、反馈提交、新手引�? */

import axios from 'axios';

const API_BASE = '/api/butler';

function getAuthHeaders() {
  const token = localStorage.getItem('ai-mate-token') || localStorage.getItem('ai_mate_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ========== 类型定义 ==========

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface FeedbackPayload {
  type: 'bug' | 'suggestion' | 'complaint' | 'inquiry';
  description: string;
}

export interface OnboardingStatus {
  currentStep: number;
  completedSteps: number[];
  steps: {
    title: string;
    description: string;
  }[];
}

// ========== API 函数 ==========

/**
 * 获取常见问题列表
 */
export async function getFAQs(params?: {
  category?: string;
}): Promise<FAQItem[]> {
  const response = await axios.get(API_BASE + '/faqs', {
    headers: getAuthHeaders(),
    params,
  });
  return response.data?.data || response.data || [];
}

/**
 * 提交用户反馈
 */
export async function submitFeedback(payload: FeedbackPayload): Promise<{ success: boolean }> {
  const response = await axios.post(API_BASE + '/feedback', payload, {
    headers: getAuthHeaders(),
  });
  return response.data?.data || response.data || { success: true };
}

/**
 * 获取新手引导状�? */
export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const response = await axios.get(API_BASE + '/onboarding/status', {
    headers: getAuthHeaders(),
  });
  return response.data?.data || response.data;
}

/**
 * 完成新手引导步骤
 */
export async function completeOnboardingStep(step: number): Promise<{ success: boolean }> {
  const response = await axios.post(API_BASE + '/onboarding/complete', { step }, {
    headers: getAuthHeaders(),
  });
  return response.data?.data || response.data || { success: true };
}
