/**
 * 计划模式服务
 * 参考 EvoFlow Supervisor：
 *   - generatePlan: 让模型把复杂任务拆解为结构化 JSON 计划
 *   - executeStep: 按 assignedRole 委派给对应角色执行单个子任务
 * 角色职责：scout=调研、sage=策略、maker=制作、butler=管理
 */

import { chatWithTools, trimContext } from './agentChat';
import type { MultimodalMessage, ModelCallConfig } from './aiService';
import type { AIRole } from '../store/aiStore';
import type { PlanStep } from '../store/planStore';

export const ROLE_NAMES: Record<AIRole, string> = {
  scout: '探路者AI',
  sage: '军师AI',
  maker: '工匠AI',
  butler: '管家AI',
};

export const ROLE_PROMPTS: Record<AIRole, string> = {
  scout:
    '你是"探路者AI"，资源对接与调研专家。擅长行业分析、竞品调研、市场情报搜集，注重数据与事实来源。',
  sage:
    '你是"军师AI"，运营策略顾问。擅长商业模式设计、风险分析、融资规划、项目计划制定，注重逻辑与全局。',
  maker:
    '你是"工匠AI"，内容创作专家。擅长营销文案、BP撰写、产品文档、原型描述，注重输出质量与格式。',
  butler:
    '你是"管家AI"，项目管理与执行管家。擅长任务拆解、进度跟踪、资源协调、验收把关，注重落地与交付。',
};

/** 计划生成提示词：要求模型输出严格 JSON */
export const PLAN_GENERATION_PROMPT = `你是任务规划专家。请把用户的复杂任务拆解为可执行的多步骤计划，每个步骤指定执行角色。

角色说明：
- scout（探路者AI）：市场调研、竞品分析、数据搜集
- sage（军师AI）：策略规划、商业模式、风险分析、项目计划
- maker（工匠AI）：内容创作、BP撰写、文档产出
- butler（管家AI）：任务管理、执行推进、交付验收

要求：
1. 任务拆解为 3-8 个步骤，步骤之间用 dependsOn 表达依赖关系（并行步骤的 dependsOn 为空或相同）
2. 每个步骤只能指定一个执行角色，选择最合适的角色
3. 严格只输出以下 JSON，不要输出任何其他文字、代码块标记或解释：

{"goal":"任务目标概述","steps":[{"id":"1","title":"步骤标题","description":"步骤详细说明，含具体执行要求","assignedRole":"scout","dependsOn":[],"acceptance":"验收标准"},{"id":"2","title":"步骤标题","description":"步骤详细说明","assignedRole":"sage","dependsOn":["1"],"acceptance":"验收标准"}]}

注意：
- assignedRole 只能是 scout、sage、maker、butler 之一
- dependsOn 引用其他步骤的 id，无依赖则填 []
- 所有字段都必须存在且非空`;

/**
 * 生成计划：调用模型，解析 JSON 输出
 */
export async function generatePlan(
  userRequest: string,
  options: { modelConfig?: ModelCallConfig; token?: string; onChunk?: (c: string) => void }
): Promise<{ goal: string; steps: Array<Omit<PlanStep, 'status'>> }> {
  const messages: MultimodalMessage[] = [{ role: 'user', content: userRequest }];

  let raw = '';
  try {
    const result = await chatWithTools(messages, {
      systemPrompt: PLAN_GENERATION_PROMPT,
      modelConfig: options.modelConfig,
      token: options.token,
      tools: [], // 计划生成阶段不启用工具
      maxRounds: 2,
      onChunk: (c) => {
        raw += c;
        options.onChunk?.(c);
      },
    });
    raw = result.content;
  } catch (err) {
    throw new Error(`计划生成失败：${err instanceof Error ? err.message : String(err)}`);
  }

  // 提取 JSON（容忍代码块包裹或前后杂讯）
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('模型未返回有效计划 JSON，请重试或补充任务信息。');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    // 尝试修复：去除首尾不完整 JSON 片段后重试
    const trimmed = jsonMatch[0].replace(/,\s*[}\]]\s*$/g, (m) => m.slice(1));
    parsed = JSON.parse(trimmed);
  }

  const obj = parsed as { goal?: string; steps?: unknown[] };
  if (!obj.goal || !Array.isArray(obj.steps) || obj.steps.length === 0) {
    throw new Error('计划 JSON 结构不完整（缺少 goal 或 steps）。');
  }

  const steps = obj.steps
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
    .map((s) => {
      const role = String(s.assignedRole || 'sage');
      const validRole: AIRole = ['scout', 'sage', 'maker', 'butler'].includes(role)
        ? (role as AIRole)
        : 'sage';
      const deps = Array.isArray(s.dependsOn)
        ? s.dependsOn.map((d) => String(d)).filter(Boolean)
        : [];
      return {
        id: String(s.id || Math.random().toString(36).slice(2, 6)),
        title: String(s.title || '未命名步骤'),
        description: String(s.description || ''),
        assignedRole: validRole,
        dependsOn: deps,
        acceptance: s.acceptance ? String(s.acceptance) : undefined,
      };
    });

  return { goal: String(obj.goal), steps };
}

/**
 * 执行单个计划步骤：委派给对应角色
 */
export async function executePlanStep(
  step: PlanStep,
  goal: string,
  options: { modelConfig?: ModelCallConfig; token?: string; onChunk?: (c: string) => void }
): Promise<string> {
  const rolePrompt = ROLE_PROMPTS[step.assignedRole];
  const systemPrompt = `${rolePrompt}

你正在参与一个多角色协作任务，负责执行其中一步。

【整体目标】
${goal}

【你的子任务】
标题：${step.title}
说明：${step.description}
${step.acceptance ? `验收标准：${step.acceptance}` : ''}

请独立完成该步骤，输出完整结果。若需要联网调研可使用搜索工具。`;

  const messages: MultimodalMessage[] = [{ role: 'user', content: `请执行子任务：${step.title}` }];

  let result = '';
  const trimmed = trimContext(messages);
  const resp = await chatWithTools(trimmed.messages, {
    systemPrompt: trimmed.summary ? `${systemPrompt}\n\n${trimmed.summary}` : systemPrompt,
    modelConfig: options.modelConfig,
    token: options.token,
    onChunk: (c) => {
      result += c;
      options.onChunk?.(c);
    },
  });
  result = resp.content || '（该步骤未产出内容）';
  return result;
}
