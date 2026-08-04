/**
 * Agent 对话循环服务
 * 封装"流式模型调用 → 工具执行 → 结果回填 → 再次调用"的多轮循环。
 * 参考 EvoFlow 的 Lead Agent 工具执行生命周期：
 *   1. 模型返回含 tool_calls 的流
 *   2. 执行工具（可多个并行）
 *   3. 把工具结果作为 role=tool 消息回填
 *   4. 再次请求模型，直至模型输出纯文本
 * 全程使用 SSE 流式，文本边生成边回调渲染。
 */

import { chatWithZhipuStream, BUILTIN_TOOLS, type MultimodalMessage, type ToolDefinition, type ToolCall, type ModelCallConfig } from './aiService';
import { executeToolCalls, getToolLabel } from './toolExecutor';
import { CLARIFY_SYSTEM_PROMPT, parseClarifyRequest } from './clarificationService';
import type { ClarifyRequest } from './clarificationService';

export interface ToolCallEvent {
  toolCallId: string;
  toolName: string;
  args: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: string;
}

export interface AgentChatOptions {
  systemPrompt?: string;
  modelConfig?: ModelCallConfig;
  token?: string;
  tools?: ToolDefinition[];
  /** 最大工具调用轮数（不含最终文本轮），默认 4 */
  maxRounds?: number;
  /** 文本增量回调（流式渲染） */
  onChunk?: (content: string) => void;
  /** 工具调用事件回调（用于 UI 展示工具执行过程） */
  onToolCall?: (event: ToolCallEvent) => void;
  /** 记忆注入文本（来自 memoryService.buildMemoryInjection） */
  memoryInjection?: string;
  /** 知识库注入文本（来自 knowledgeService.buildKnowledgeContext） */
  knowledgeInjection?: string;
  /** 自动触发技能注入文本（来自 autoTriggerService.buildAutoTriggerPrompt） */
  skillInjection?: string;
  /** 启用澄清机制（默认 false） */
  enableClarify?: boolean;
  /** 澄清请求回调（命中澄清时触发，可中断后续流程） */
  onClarify?: (request: ClarifyRequest, rawContent: string) => void;
  signal?: AbortSignal;
}

/**
 * 上下文裁剪：参考 EvoFlow SummarizationMiddleware
 * - 保留最近 K 轮完整消息（含用户与助手）
 * - 更早的消息提取用户提问要点，压缩为摘要前缀注入 systemPrompt
 * - 避免长对话超过模型上下文窗口
 */
export function trimContext(
  messages: MultimodalMessage[],
  options?: { keepRounds?: number; maxUserTokens?: number }
): { messages: MultimodalMessage[]; summary?: string } {
  const keepRounds = Math.max(3, options?.keepRounds || 6);
  const maxUserTokens = Math.max(100, options?.maxUserTokens || 800);

  if (messages.length <= keepRounds * 2) {
    return { messages };
  }

  // 按轮分组：user 开头、assistant 收尾的对话对
  const rounds: MultimodalMessage[][] = [];
  let current: MultimodalMessage[] = [];
  for (const m of messages) {
    if (m.role === 'user' && current.length > 0) {
      rounds.push(current);
      current = [];
    }
    current.push(m);
  }
  if (current.length > 0) rounds.push(current);

  const keepCount = Math.min(keepRounds, rounds.length);
  const recentRounds = rounds.slice(-keepCount);
  const olderRounds = rounds.slice(0, rounds.length - keepCount);

  // 抽取较早轮次的用户消息做摘要（截断防超长）
  const userPoints: string[] = [];
  let budget = maxUserTokens;
  for (const r of olderRounds) {
    for (const m of r) {
      if (m.role === 'user' && typeof m.content === 'string' && m.content.trim()) {
        const text = m.content.trim();
        const chunk = text.length > 120 ? text.slice(0, 120) + '…' : text;
        if (budget <= 0) break;
        budget -= chunk.length;
        userPoints.push(`- ${chunk}`);
        break; // 每轮只取第一条用户消息
      }
    }
    if (budget <= 0) break;
  }

  const recentMessages = recentRounds.flat();
  if (userPoints.length === 0) {
    return { messages: recentMessages };
  }

  const summary = `以下是本次对话较早轮次的用户问题摘要（已压缩，供上下文参考）：\n${userPoints.join('\n')}\n请基于这些背景继续当前对话。`;
  return { messages: recentMessages, summary };
}

export interface AgentChatResult {
  content: string;
  toolCalls: ToolCallEvent[];
  rounds: number;
}

/**
 * 执行带工具支持的流式多轮 Agent 对话。
 * 返回最终文本（与 onChunk 累计一致）；失败时抛出 Error。
 */
export async function chatWithTools(
  messages: MultimodalMessage[],
  options: AgentChatOptions = {}
): Promise<AgentChatResult> {
  const tools = options.tools && options.tools.length > 0 ? options.tools : BUILTIN_TOOLS;
  const maxRounds = Math.max(2, options.maxRounds || 4);
  const toolCallEvents: ToolCallEvent[] = [];

  // 上下文裁剪：长对话时压缩早期轮次
  const { messages: trimmed, summary: contextSummary } = trimContext(messages);
  const workingMessages: MultimodalMessage[] = [...trimmed];

  // 组装增强系统提示：基础提示 + 上下文摘要 + 记忆 + 知识库 + 自动触发技能 + 澄清规则
  const injectionParts: string[] = [];
  if (contextSummary) injectionParts.push(contextSummary);
  if (options.memoryInjection) injectionParts.push(options.memoryInjection);
  if (options.knowledgeInjection) injectionParts.push(options.knowledgeInjection);
  if (options.skillInjection) injectionParts.push(options.skillInjection);
  if (options.enableClarify) injectionParts.push(CLARIFY_SYSTEM_PROMPT);
  const effectiveSystemPrompt = injectionParts.length > 0
    ? `${options.systemPrompt || ''}\n\n${injectionParts.join('\n\n')}`
    : options.systemPrompt;

  // 当前轮累计的文本（用于返回）
  let finalContent = '';
  let round = 0;

  const runOneRound = (withTools: boolean): Promise<{ content: string; toolCalls: ToolCall[] | null }> =>
    new Promise((resolve, reject) => {
      let content = '';
      let finished = false;

      chatWithZhipuStream(
        workingMessages,
        (chunk) => {
          content += chunk;
          options.onChunk?.(chunk);
        },
        {
          system_prompt: effectiveSystemPrompt,
          modelConfig: options.modelConfig,
          token: options.token,
          tools: withTools ? tools : undefined,
          onToolCalls: (calls) => {
            finished = true;
            resolve({ content, toolCalls: calls });
          },
        }
      )
        .then(() => {
          // 流正常结束且未在 onToolCalls 中 resolve
          if (!finished) {
            resolve({ content, toolCalls: null });
          }
        })
        .catch(reject);
    });

  // 工具调用失败时降级为普通对话（模型可能不支持 tools）
  const runFallback = async (): Promise<AgentChatResult> => {
    try {
      const { content } = await runOneRound(false);
      finalContent = content;
      return { content: finalContent, toolCalls: toolCallEvents, rounds: 1 };
    } catch (fallbackErr) {
      throw fallbackErr instanceof Error ? fallbackErr : new Error(String(fallbackErr));
    }
  };

  try {
    while (round < maxRounds) {
      const { content, toolCalls } = await runOneRound(true);
      finalContent = content;
      round += 1;

      // 无工具调用：最终文本
      if (!toolCalls || toolCalls.length === 0) {
        // 澄清机制：命中 <clarify> 标记时回调（由调用方决定是否中断）
        if (options.enableClarify && options.onClarify) {
          const clarify = parseClarifyRequest(content);
          if (clarify) {
            options.onClarify(clarify, content);
          }
        }
        return { content: finalContent, toolCalls: toolCallEvents, rounds: round };
      }

      // 有工具调用：把助手消息（含 tool_calls）加入上下文
      workingMessages.push({
        role: 'assistant',
        content: content || '',
        // OpenAI 扩展字段，后端透传
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.function.name, arguments: tc.function.arguments },
        })),
      } as unknown as MultimodalMessage);

      // 预置事件状态
      const pendingEvents: ToolCallEvent[] = toolCalls.map((tc) => ({
        toolCallId: tc.id,
        toolName: tc.function.name,
        args: tc.function.arguments,
        status: 'pending',
      }));
      pendingEvents.forEach((e) => {
        toolCallEvents.push(e);
        options.onToolCall?.({ ...e });
      });

      // 并行执行工具
      const results = await executeToolCalls(
        toolCalls.map((tc) => ({ id: tc.id, function: tc.function }))
      );

      // 回填工具结果消息
      const toolMessages: Array<{ tool_call_id: string; role: 'tool'; content: string }> = [];
      for (const r of results) {
        const event = toolCallEvents.find((e) => e.toolCallId === r.toolCallId);
        if (event) {
          event.status = r.error ? 'error' : 'success';
          event.result = r.content;
          options.onToolCall?.({ ...event });
        }
        toolMessages.push({ tool_call_id: r.toolCallId, role: 'tool', content: r.content });
      }
      workingMessages.push(...(toolMessages as unknown as MultimodalMessage[]));
    }
  } catch (err) {
    // 工具链路失败（如模型不支持 tools）：降级为普通单轮对话
    return runFallback();
  }

  // 达到最大轮数：提示并返回已生成文本
  return {
    content: finalContent
      ? finalContent
      : '已达到最大工具调用轮数，未能完成回答，请尝试简化问题或拆分提问。',
    toolCalls: toolCallEvents,
    rounds: round,
  };
}

export { getToolLabel };
