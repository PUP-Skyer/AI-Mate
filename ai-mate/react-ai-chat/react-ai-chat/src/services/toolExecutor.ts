/**
 * 工具执行器（ToolExecutor）
 * 维护"工具名 → 处理函数"注册表，负责执行模型发起的 function calling。
 * 内置工具通过后端 /api/tools/* 代理端点执行（服务端代理避免 CORS）。
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ToolExecutionResult {
  toolCallId: string;
  toolName: string;
  content: string;
  error?: boolean;
}

type ToolHandler = (args: Record<string, unknown>) => Promise<string>;

// ========== 内置工具实现 ==========

async function handleWebSearch(args: Record<string, unknown>): Promise<string> {
  const query = String(args.query || '').trim();
  if (!query) {
    return '错误：缺少搜索关键词 query';
  }
  const max = Math.min(Math.max(Number(args.maxResults) || 5, 1), 10);

  const res = await fetch(`${API_BASE}/tools/web-search?q=${encodeURIComponent(query)}&max=${max}`);
  const json = await res.json().catch(() => null);
  const data = json?.data;

  if (!res.ok || !data || !Array.isArray(data.results)) {
    return `搜索失败：${json?.message || `HTTP ${res.status}`}`;
  }
  if (data.results.length === 0) {
    return `未找到「${query}」的相关结果。`;
  }

  const lines = data.results.map(
    (r: { title: string; url: string; snippet: string }, i: number) =>
      `${i + 1}. ${r.title}\n   链接: ${r.url}\n   摘要: ${r.snippet || '（无摘要）'}`
  );
  return `搜索「${query}」共 ${data.results.length} 条结果：\n\n${lines.join('\n\n')}`;
}

async function handleFetchUrl(args: Record<string, unknown>): Promise<string> {
  const url = String(args.url || '').trim();
  if (!url) {
    return '错误：缺少 URL';
  }
  const maxLength = Math.min(Math.max(Number(args.maxLength) || 2000, 200), 8000);

  const res = await fetch(`${API_BASE}/tools/fetch-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, maxLength }),
  });
  const json = await res.json().catch(() => null);
  const data = json?.data;

  if (!res.ok || !data) {
    return `抓取失败：${json?.message || `HTTP ${res.status}`}`;
  }
  const content = String(data.content || '');
  if (!content) {
    return `页面 ${url} 内容为空或无法提取正文。`;
  }
  return `页面内容（来源: ${url}${data.truncated ? '，已截断' : ''}）：\n\n${content}`;
}

async function handleCurrentTime(_args: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${API_BASE}/tools/now`);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.data) {
    return `当前时间获取失败：${json?.message || `HTTP ${res.status}`}`;
  }
  return `当前时间：${json.data.local}（UTC: ${json.data.now}）`;
}

// ========== 工具注册表 ==========

const registry: Record<string, ToolHandler> = {
  web_search: handleWebSearch,
  fetch_url: handleFetchUrl,
  current_time: handleCurrentTime,
};

export const TOOL_NAMES = Object.keys(registry);

/**
 * 注册自定义工具（供后续 MCP 等扩展使用）
 */
export function registerTool(name: string, handler: ToolHandler): void {
  registry[name] = handler;
}

/**
 * 获取工具显示名（中文）
 */
export function getToolLabel(name: string): string {
  const labels: Record<string, string> = {
    web_search: '联网搜索',
    fetch_url: '网页抓取',
    current_time: '获取时间',
  };
  return labels[name] || name;
}

/**
 * 执行单个工具调用
 */
export async function executeToolCall(
  toolCallId: string,
  toolName: string,
  argsJson: string
): Promise<ToolExecutionResult> {
  let args: Record<string, unknown> = {};
  try {
    args = argsJson ? JSON.parse(argsJson) : {};
  } catch {
    args = { raw: argsJson };
  }

  const handler = registry[toolName];
  if (!handler) {
    return {
      toolCallId,
      toolName,
      content: `错误：未知工具「${toolName}」，可用工具：${TOOL_NAMES.join(', ')}`,
      error: true,
    };
  }

  try {
    const content = await handler(args);
    return { toolCallId, toolName, content };
  } catch (err) {
    return {
      toolCallId,
      toolName,
      content: `工具「${toolName}」执行失败：${err instanceof Error ? err.message : String(err)}`,
      error: true,
    };
  }
}

/**
 * 并发执行多个工具调用，保持调用顺序返回结果
 */
export async function executeToolCalls(toolCalls: Array<{ id: string; function: { name: string; arguments: string } }>): Promise<ToolExecutionResult[]> {
  const results = await Promise.all(
    toolCalls.map((tc) => executeToolCall(tc.id, tc.function.name, tc.function.arguments))
  );
  // 按原始顺序返回
  const order = new Map(toolCalls.map((tc, i) => [tc.id, i]));
  return results.sort((a, b) => (order.get(a.toolCallId) ?? 0) - (order.get(b.toolCallId) ?? 0));
}
