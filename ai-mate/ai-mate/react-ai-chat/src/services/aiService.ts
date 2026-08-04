/**
 * AI API 服务层
 * 调用 Serverless 代理层的 API
 */

import type { AIRole } from '../store/aiStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// ========== 通用请求封装 ==========

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  code?: string;
}

async function request<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>,
  token?: string
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || `请求失败 (${response.status})`,
        code: data.code,
      };
    }

    return { data: data as T };
  } catch (error) {
    console.error('[AI Service Error]', error);
    return {
      error: error instanceof Error ? error.message : '网络请求失败',
      code: 'NETWORK_ERROR',
    };
  }
}

// ========== 智谱GLM API ==========

export interface ZhipuMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ZhipuResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 调用智谱GLM API
 */
export async function chatWithZhipu(
  messages: ZhipuMessage[],
  options?: {
    system_prompt?: string;
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
    token?: string;
  }
): Promise<ApiResponse<ZhipuResponse>> {
  return request<ZhipuResponse>('/ai/zhipu', {
    messages,
    system_prompt: options?.system_prompt,
    stream: options?.stream || false,
    temperature: options?.temperature,
    max_tokens: options?.max_tokens,
  }, options?.token);
}

/**
 * 智谱GLM流式对话
 */
export async function chatWithZhipuStream(
  messages: ZhipuMessage[],
  onChunk: (content: string) => void,
  options?: {
    system_prompt?: string;
    temperature?: number;
    max_tokens?: number;
    token?: string;
  }
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE}/ai/zhipu`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      system_prompt: options?.system_prompt,
      stream: true,
      temperature: options?.temperature,
      max_tokens: options?.max_tokens,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`流式请求失败: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const data = line.slice(5).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onChunk(content);
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }
}

// ========== Coze API ==========

export interface CozeMessage {
  role: 'user' | 'assistant';
  content: string;
  content_type?: 'text';
}

export interface CozeResponse {
  id: string;
  conversation_id: string;
  messages: Array<{
    role: string;
    content: string;
    content_type: string;
  }>;
}

/**
 * 调用Coze API
 */
export async function chatWithCoze(
  messages: CozeMessage[],
  options?: {
    user_id?: string;
    bot_id?: string;
    conversation_id?: string;
    stream?: boolean;
    token?: string;
  }
): Promise<ApiResponse<CozeResponse>> {
  return request<CozeResponse>('/ai/coze', {
    messages,
    user_id: options?.user_id,
    bot_id: options?.bot_id,
    conversation_id: options?.conversation_id,
    stream: options?.stream || false,
  }, options?.token);
}

// ========== WorkBuddy MCP API ==========

export interface MCPRequest {
  method: string;
  params: Record<string, unknown>;
  session_id?: string;
}

export interface MCPResponse {
  jsonrpc: string;
  id: string;
  result?: unknown;
  error?: { code: number; message: string };
}

/**
 * 调用WorkBuddy MCP
 */
export async function callWorkBuddy(
  mcpRequest: MCPRequest,
  token?: string
): Promise<ApiResponse<MCPResponse>> {
  return request<MCPResponse>('/ai/workbuddy', mcpRequest, token);
}

// ========== Trae MCP API ==========

/**
 * 调用Trae MCP
 */
export async function callTrae(
  mcpRequest: MCPRequest,
  token?: string
): Promise<ApiResponse<MCPResponse>> {
  return request<MCPResponse>('/ai/trae', mcpRequest, token);
}

// ========== 角色对应的系统提示词 ==========

const SYSTEM_PROMPTS: Record<AIRole, string> = {
  scout: '你是"探路者AI"，一位专业的资源对接专家。帮助用户发现和对接外部资源，提供行业趋势分析和市场情报。',
  sage: '你是"军师AI"，一位资深的运营策略顾问。为用户提供运营策略规划、数据分析和决策支持。',
  maker: '你是"工匠AI"，一位创意无限的内容创作专家。创作高质量的营销文案、社交媒体内容和品牌故事。',
  butler: '你是"管家AI"，一位贴心专业的客户服务管家。解答用户问题、处理售后反馈、引导用户使用。',
};

/**
 * 根据角色获取系统提示词
 */
export function getSystemPrompt(role: AIRole): string {
  return SYSTEM_PROMPTS[role];
}
