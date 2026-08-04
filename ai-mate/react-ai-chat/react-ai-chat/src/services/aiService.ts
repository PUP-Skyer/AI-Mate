/**
 * AI API 服务层
 * 调用 Serverless 代理层的 API
 */

import type { AIRole } from '../store/aiStore';
import { useAIStore } from '../store/aiStore';
import type { ModelConfig } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// ========== 通用请求封装 ==========

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  code?: string;
}

// ========== 模型配置 ==========

export interface ModelCallConfig {
  modelId: string;
  baseUrl: string;
  apiKey: string;
  multimodal: boolean;
}

/**
 * 获取当前可用的模型配置（优先使用显式传入的配置，否则取 store 中启用的模型）
 */
export function getActiveModelConfig(explicit?: ModelCallConfig): ModelCallConfig | undefined {
  if (explicit) return explicit;
  try {
    const configs = useAIStore.getState().modelConfigs;
    const enabled = configs.find((c: ModelConfig) => c.isEnabled);
    if (!enabled || !enabled.apiKey) return undefined;
    return {
      modelId: enabled.modelId || '',
      baseUrl: enabled.baseUrl || '',
      apiKey: enabled.apiKey,
      multimodal: enabled.multimodal,
    };
  } catch {
    return undefined;
  }
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

    // 统一解包后端包装层：后端返回 { code, data, message }，此处取出 data 供调用方直接使用
    return { data: (data?.data ?? data) as T };
  } catch (error) {
    console.error('[AI Service Error]', error);
    return {
      error: error instanceof Error ? error.message : '网络请求失败',
      code: 'NETWORK_ERROR',
    };
  }
}

// ========== 工具调用（function calling）类型 ==========

export interface ToolParameterProperty {
  type: string;
  description?: string;
  enum?: string[];
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ToolParameterProperty>;
      required?: string[];
    };
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolMessageContent {
  tool_call_id: string;
  role: 'tool';
  content: string;
}

// 内置工具定义（与后端 /api/tools/* 代理端点对应）
export const BUILTIN_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: '搜索互联网获取最新信息，返回搜索结果列表（标题、链接、摘要）。适合行业调研、竞品分析、新闻检索。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词，尽量具体' },
          maxResults: { type: 'number', description: '返回结果数量，默认 5，最大 10' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fetch_url',
      description: '抓取指定网页的正文内容并提取纯文本摘要。用于深入了解搜索结果中的具体页面。',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '网页完整 URL' },
          maxLength: { type: 'number', description: '提取最大字符数，默认 2000，最大 8000' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'current_time',
      description: '获取当前日期和时间，用于需要时间信息的场景',
      parameters: { type: 'object', properties: {} },
    },
  },
];

// ========== 智谱GLM API ==========

export interface ZhipuMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 多模态消息内容块
export interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

export interface MultimodalMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentPart[];
}

export interface ZhipuResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 调用大模型 API（支持多模态与工具调用）
 */
export async function chatWithZhipu(
  messages: MultimodalMessage[],
  options?: {
    system_prompt?: string;
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
    token?: string;
    modelConfig?: ModelCallConfig;
    tools?: ToolDefinition[];
  }
): Promise<ApiResponse<ZhipuResponse>> {
  return request<ZhipuResponse>('/ai/chat', {
    messages,
    system_prompt: options?.system_prompt,
    stream: options?.stream || false,
    temperature: options?.temperature,
    max_tokens: options?.max_tokens,
    model_config: getActiveModelConfig(options?.modelConfig),
    tools: options?.tools,
  }, options?.token);
}

/**
 * 大模型流式对话（支持多模态与工具调用）
 * - onChunk: 文本增量回调
 * - onToolCalls: 流结束时若模型要求调用工具，回调整理好的 tool_calls
 */
export async function chatWithZhipuStream(
  messages: MultimodalMessage[],
  onChunk: (content: string) => void,
  options?: {
    system_prompt?: string;
    temperature?: number;
    max_tokens?: number;
    token?: string;
    modelConfig?: ModelCallConfig;
    tools?: ToolDefinition[];
    onToolCalls?: (toolCalls: ToolCall[]) => void;
  }
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      system_prompt: options?.system_prompt,
      stream: true,
      temperature: options?.temperature,
      max_tokens: options?.max_tokens,
      model_config: getActiveModelConfig(options?.modelConfig),
      tools: options?.tools,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`流式请求失败: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // 流式 tool_calls 增量按 index 累积
  const toolCallsMap = new Map<number, { id: string; name: string; arguments: string }>();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') break;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;

        if (delta.content) {
          onChunk(delta.content);
        }
        if (Array.isArray(delta.tool_calls)) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            const entry = toolCallsMap.get(idx) || { id: '', name: '', arguments: '' };
            if (tc.id) entry.id = tc.id;
            if (tc.function?.name) entry.name += tc.function.name;
            if (tc.function?.arguments) entry.arguments += tc.function.arguments;
            toolCallsMap.set(idx, entry);
          }
        }
      } catch {
        // 忽略解析错误
      }
    }
  }

  // 流结束：若模型要求工具，回调整理后的 tool_calls
  if (toolCallsMap.size > 0 && options?.onToolCalls) {
    const toolCalls: ToolCall[] = Array.from(toolCallsMap.values()).map((e) => ({
      id: e.id || `call_${Math.random().toString(36).slice(2, 10)}`,
      type: 'function',
      function: { name: e.name, arguments: e.arguments },
    }));
    options.onToolCalls(toolCalls);
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
  [key: string]: unknown;
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
