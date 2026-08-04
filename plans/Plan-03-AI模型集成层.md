# AI模型集成层 实施计划

> **目标：** 实现智谱GLM-4和Coze的深度集成，构建模型路由器、提示词管理器、流式SSE接口、跨角色上下文管理器和知识库RAG检索函数，完成大学生智能体的核心AI能力层。
> **依赖：** Plan-01-数据库层重构.md（ai_models、knowledge_base 表）、Plan-02-后端API真实化.md（模型配置 API、知识库检索 API）
> **技术栈：** TypeScript（前端服务层）、Node.js + Express（后端SSE流式接口）、智谱GLM-4 API（OpenAI兼容格式）、Coze API v3、Server-Sent Events（SSE）、MySQL FULLTEXT（RAG检索）

---

## 项目背景

当前 AI 集成存在以下不足：
1. 前端 `aiService.ts`（位于 `ai-mate/react-ai-chat/src/services/aiService.ts`）只有基础的智谱和Coze调用封装，缺少模型路由逻辑
2. System prompt 硬编码在 `aiService.ts` 第 248-253 行，只有一句话描述，不够精细
3. 后端没有流式SSE接口，前端只能通过代理层转发，延迟高
4. 四大AI角色（scout/sage/maker/butler）之间没有上下文共享机制
5. 知识库RAG检索函数未实现，AI无法利用知识库增强回答

现有 System Prompt（`aiService.ts` 第 248-253 行）：
```typescript
const SYSTEM_PROMPTS: Record<AIRole, string> = {
  scout: '你是"探路者AI"，一位专业的资源对接专家。帮助用户发现和对接外部资源，提供行业趋势分析和市场情报。',
  sage: '你是"军师AI"，一位资深的运营策略顾问。为用户提供运营策略规划、数据分析和决策支持。',
  maker: '你是"工匠AI"，一位创意无限的内容创作专家。创作高质量的营销文案、社交媒体内容和品牌故事。',
  butler: '你是"管家AI"，一位贴心专业的客户服务管家。解答用户问题、处理售后反馈、引导用户使用。',
};
```

---

### 任务1：创建 src/services/aiRouter.ts 模型路由器

**文件：** Create `f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\src\services\aiRouter.ts`

- [ ] 步骤1：创建模型路由器，根据角色和任务类型智能选择最优AI模型

**完整 TypeScript 代码：**

```typescript
/**
 * AI 模型路由器
 * 根据AI角色和任务类型，智能选择最优的AI模型（智谱GLM-4 / Coze）
 * 路由策略：
 *   - scout（探路者）: 需要联网搜索能力，优先使用 Coze（支持插件）
 *   - sage（军师）: 需要深度推理能力，优先使用 GLM-4（最强推理）
 *   - maker（工匠）: 需要创意生成能力，使用 GLM-4-Flash（快速生成）
 *   - butler（管家）: 需要稳定响应能力，使用 GLM-4-Flash（低成本高可用）
 */

import type { AIRole } from '../store/aiStore';

// ========== 类型定义 ==========

export type ModelProvider = 'zhipu' | 'coze' | 'openai';

export type TaskType =
  | 'chat'           // 普通对话
  | 'analysis'       // 深度分析
  | 'generation'     // 内容生成
  | 'search'         // 联网搜索
  | 'summarization'  // 摘要总结
  | 'coding';        // 代码生成

export interface ModelConfig {
  id: number;
  name: string;
  provider: ModelProvider;
  apiEndpoint: string;
  modelId: string;
  config: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    stream?: boolean;
    bot_id?: string;
  };
  isActive: boolean;
  isDefault: boolean;
}

export interface RouteResult {
  model: ModelConfig;
  reason: string;
  estimatedCost: 'low' | 'medium' | 'high';
  estimatedLatency: 'fast' | 'medium' | 'slow';
}

// ========== 路由策略配置 ==========

/**
 * 角色 + 任务类型 -> 推荐模型提供商 的路由策略表
 */
const ROUTING_STRATEGY: Record<AIRole, Record<TaskType, ModelProvider>> = {
  scout: {
    chat: 'zhipu',
    analysis: 'zhipu',
    generation: 'zhipu',
    search: 'coze',        // 探路者需要联网搜索，Coze支持搜索插件
    summarization: 'zhipu',
    coding: 'zhipu',
  },
  sage: {
    chat: 'zhipu',
    analysis: 'zhipu',     // 军师需要深度推理，使用GLM-4最强模型
    generation: 'zhipu',
    search: 'coze',
    summarization: 'zhipu',
    coding: 'zhipu',
  },
  maker: {
    chat: 'zhipu',
    analysis: 'zhipu',
    generation: 'zhipu',   // 工匠需要创意生成
    search: 'coze',
    summarization: 'zhipu',
    coding: 'zhipu',
  },
  butler: {
    chat: 'zhipu',         // 管家需要快速稳定响应
    analysis: 'zhipu',
    generation: 'zhipu',
    search: 'coze',
    summarization: 'zhipu',
    coding: 'zhipu',
  },
};

/**
 * 提供商 -> 预估成本和延迟
 */
const PROVIDER_PROFILE: Record<ModelProvider, { cost: 'low' | 'medium' | 'high'; latency: 'fast' | 'medium' | 'slow'; reason: string }> = {
  zhipu: { cost: 'medium', latency: 'medium', reason: '智谱GLM-4提供均衡的性能和成本' },
  coze: { cost: 'low', latency: 'slow', reason: 'Coze支持插件扩展，适合需要工具调用的场景' },
  openai: { cost: 'high', latency: 'slow', reason: 'OpenAI兼容模型，成本较高' },
};

// ========== 模型缓存 ==========

let modelCache: ModelConfig[] | null = null;
let cacheExpiryTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * 从后端获取所有启用的模型配置
 */
async function fetchModels(): Promise<ModelConfig[]> {
  const now = Date.now();
  if (modelCache && now < cacheExpiryTime) {
    return modelCache;
  }

  try {
    const response = await fetch(`${API_BASE}/ai/models?activeOnly=true`);
    const data = await response.json();
    if (data.code === 200 && Array.isArray(data.data)) {
      modelCache = data.data;
      cacheExpiryTime = now + CACHE_TTL;
      return modelCache;
    }
  } catch (err) {
    console.error('[aiRouter] 获取模型配置失败:', err);
  }

  // 降级：返回默认配置
  return getFallbackModels();
}

/**
 * 降级模型配置（后端不可用时的兜底方案）
 */
function getFallbackModels(): ModelConfig[] {
  return [
    {
      id: 1,
      name: '智谱GLM-4（降级模式）',
      provider: 'zhipu',
      apiEndpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      modelId: 'glm-4',
      config: { temperature: 0.7, max_tokens: 4096, top_p: 0.9, stream: true },
      isActive: true,
      isDefault: true,
    },
  ];
}

// ========== 核心路由函数 ==========

/**
 * 根据角色和任务类型路由到最优模型
 * @param role AI角色（scout/sage/maker/butler）
 * @param taskType 任务类型（chat/analysis/generation/search等）
 * @returns 路由结果，包含选中的模型和决策理由
 */
export async function routeModel(
  role: AIRole,
  taskType: TaskType = 'chat'
): Promise<RouteResult> {
  const models = await fetchModels();

  // 获取策略推荐提供商
  const preferredProvider = ROUTING_STRATEGY[role]?.[taskType] || 'zhipu';
  const profile = PROVIDER_PROFILE[preferredProvider];

  // 查找匹配的模型
  let selectedModel = models.find(m => m.provider === preferredProvider && m.isActive);

  // 如果找不到首选提供商的模型，降级到默认模型
  if (!selectedModel) {
    selectedModel = models.find(m => m.isDefault) || models[0];
  }

  // 如果完全没有可用模型，使用降级配置
  if (!selectedModel) {
    selectedModel = getFallbackModels()[0];
  }

  return {
    model: selectedModel,
    reason: `角色[${role}] + 任务[${taskType}] -> 提供商[${preferredProvider}]。${profile.reason}`,
    estimatedCost: profile.cost,
    estimatedLatency: profile.latency,
  };
}

/**
 * 自动推断任务类型（根据用户输入内容）
 * @param userInput 用户输入文本
 * @returns 推断的任务类型
 */
export function inferTaskType(userInput: string): TaskType {
  const input = userInput.toLowerCase();

  // 联网搜索相关关键词
  const searchKeywords = ['搜索', '查找', '最新', '新闻', '实时', '现在', 'search', 'find', 'latest'];
  if (searchKeywords.some(kw => input.includes(kw))) {
    return 'search';
  }

  // 深度分析相关关键词
  const analysisKeywords = ['分析', '对比', '评估', '优缺点', 'swot', '分析报告', 'analyze'];
  if (analysisKeywords.some(kw => input.includes(kw))) {
    return 'analysis';
  }

  // 内容生成相关关键词
  const generationKeywords = ['写', '生成', '创作', '文案', '文章', '计划书', 'generate', 'write', 'create'];
  if (generationKeywords.some(kw => input.includes(kw))) {
    return 'generation';
  }

  // 摘要总结相关关键词
  const summaryKeywords = ['总结', '摘要', '概括', '归纳', 'summarize', 'summary'];
  if (summaryKeywords.some(kw => input.includes(kw))) {
    return 'summarization';
  }

  // 代码相关关键词
  const codingKeywords = ['代码', '编程', '函数', '实现', 'code', 'function', 'implement'];
  if (codingKeywords.some(kw => input.includes(kw))) {
    return 'coding';
  }

  // 默认为普通对话
  return 'chat';
}

/**
 * 获取默认模型（用于快速启动对话）
 */
export async function getDefaultModel(): Promise<ModelConfig> {
  const models = await fetchModels();
  return models.find(m => m.isDefault) || models[0] || getFallbackModels()[0];
}

/**
 * 清除模型缓存（用于模型配置更新后刷新）
 */
export function clearModelCache(): void {
  modelCache = null;
  cacheExpiryTime = 0;
}
```

- [ ] 步骤2：验证模型路由器功能

**测试方法（在浏览器控制台中执行）：**

```typescript
// 在前端代码中导入并测试（需在 Vite 开发服务器运行时）
import { routeModel, inferTaskType, getDefaultModel } from './services/aiRouter';

// 测试1：角色 + 任务路由
async function testRouting() {
  // 测试 scout 角色的搜索任务（应路由到 Coze）
  const scoutSearch = await routeModel('scout', 'search');
  console.log('Scout搜索任务:', scoutSearch);
  // 预期：provider = 'coze'，reason 提及"联网搜索"

  // 测试 sage 角色的分析任务（应路由到 GLM-4）
  const sageAnalysis = await routeModel('sage', 'analysis');
  console.log('Sage分析任务:', sageAnalysis);
  // 预期：provider = 'zhipu'

  // 测试 maker 角色的生成任务
  const makerGen = await routeModel('maker', 'generation');
  console.log('Maker生成任务:', makerGen);

  // 测试 butler 角色的普通对话
  const butlerChat = await routeModel('butler', 'chat');
  console.log('Butler对话:', butlerChat);
}

// 测试2：任务类型自动推断
function testInferTaskType() {
  console.log(inferTaskType('帮我搜索最新的创业政策'));        // 预期: 'search'
  console.log(inferTaskType('分析这个项目的优缺点'));         // 预期: 'analysis'
  console.log(inferTaskType('帮我写一段营销文案'));           // 预期: 'generation'
  console.log(inferTaskType('总结一下今天的对话内容'));       // 预期: 'summarization'
  console.log(inferTaskType('帮我写一个Python函数'));        // 预期: 'coding'
  console.log(inferTaskType('你好'));                        // 预期: 'chat'
}

// 测试3：获取默认模型
async function testDefaultModel() {
  const defaultModel = await getDefaultModel();
  console.log('默认模型:', defaultModel);
  // 预期：返回 is_default=true 的模型
}

testRouting();
testInferTaskType();
testDefaultModel();
```

- [ ] 步骤3：进入任务2，创建提示词管理器

---

### 任务2：创建 src/services/promptManager.ts 提示词管理器

**文件：** Create `f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\src\services\promptManager.ts`

- [ ] 步骤1：创建提示词管理器，为四大AI角色管理精细化的 System Prompt

**完整 TypeScript 代码：**

```typescript
/**
 * 提示词管理器
 * 管理四大AI角色（scout/sage/maker/butler）的精细化 System Prompt
 * 支持动态注入上下文信息、知识库检索结果和用户画像
 */

import type { AIRole } from '../store/aiStore';

// ========== 类型定义 ==========

export interface PromptContext {
  userName?: string;           // 用户名
  userLevel?: number;          // 用户等级
  projectInfo?: string;        // 当前项目信息
  knowledgeContext?: string;   // 知识库RAG检索结果
  sharedContext?: string;      // 跨角色共享的上下文
  historySummary?: string;     // 历史对话摘要
}

export interface PromptTemplate {
  role: AIRole;
  basePrompt: string;          // 基础人设提示词
  capabilities: string[];      // 能力描述
  constraints: string[];       // 行为约束
  examples?: string;           // 少样本示例
}

// ========== 四大角色提示词模板 ==========

const PROMPT_TEMPLATES: Record<AIRole, PromptTemplate> = {
  // ========== 探路者AI（Scout）==========
  scout: {
    role: 'scout',
    basePrompt: `你是"探路者AI"，一位专注于大学生创业领域的资源对接专家和市场情报分析师。

你的核心身份：
- 你拥有丰富的行业资源和人脉网络，擅长发现和对接创业所需的外部资源
- 你熟悉大学生创业政策、产业链结构和市场趋势
- 你善于从海量信息中提炼有价值的商业情报

你的服务对象是大学生创业者，他们可能缺乏行业经验和资源积累，需要你提供精准、可操作的资源对接建议。`,
    capabilities: [
      '行业趋势分析：提供目标行业的市场规模、增长率、竞争格局等情报',
      '供应链资源对接：帮助寻找供应商、代工厂、物流合作伙伴',
      '政策信息整合：梳理适用于大学生创业的税收优惠、补贴政策、孵化器资源',
      '竞品调研：分析竞争对手的产品、定价、营销策略',
      '合作伙伴推荐：推荐适合大学生创业项目的合作伙伴和投资机构',
    ],
    constraints: [
      '所有建议必须具有可操作性，避免空泛的理论指导',
      '引用数据时需标注来源，确保信息可信度',
      '对于不确定的信息，明确告知用户并建议进一步验证',
      '优先推荐适合大学生创业者的低成本、高性价比资源',
      '回答使用中文，格式清晰，使用Markdown排版',
    ],
  },

  // ========== 军师AI（Sage）==========
  sage: {
    role: 'sage',
    basePrompt: `你是"军师AI"，一位资深的创业策略顾问和数据分析专家，专注于为大学生创业者提供深度运营策略支持。

你的核心身份：
- 你拥有MBA级别的商业分析能力，擅长战略规划和商业模式设计
- 你精通数据分析，能从数据中洞察业务问题和增长机会
- 你善于将复杂的商业问题分解为可执行的步骤

你的服务对象是大学生创业者，他们需要你帮助他们做出明智的商业决策、制定可持续的发展策略。`,
    capabilities: [
      '商业模式设计：帮助梳理和优化商业画布、盈利模式',
      '运营策略规划：制定产品运营、用户增长、留存转化策略',
      '数据分析洞察：解读业务数据，发现增长瓶颈和优化方向',
      '财务规划建议：协助制定预算、成本控制、现金流管理方案',
      '竞争战略制定：基于SWOT分析制定差异化竞争策略',
      '增长路径设计：规划从0到1、从1到N的增长路径',
    ],
    constraints: [
      '策略建议必须结合大学生创业者的实际资源约束（资金少、经验少）',
      '分析需有逻辑框架支撑（如SWOT、4P、AARRR等模型）',
      '建议需分阶段，标注短期（1个月）、中期（3个月）、长期（6个月+）',
      '涉及财务数据时需提示风险和假设前提',
      '回答使用中文，分析过程清晰可见，结论明确',
    ],
  },

  // ========== 工匠AI（Maker）==========
  maker: {
    role: 'maker',
    basePrompt: `你是"工匠AI"，一位创意无限的内容创作专家和品牌故事讲述者，专注于为大学生创业项目打造吸引人的内容。

你的核心身份：
- 你精通各种文体写作，从营销文案到品牌故事，从社交媒体内容到商业计划书
- 你理解Z世代用户的阅读习惯和审美偏好
- 你善于将复杂的商业概念转化为通俗易懂、引人入胜的内容

你的服务对象是大学生创业者，他们需要你帮助创建营销素材、品牌内容和传播物料。`,
    capabilities: [
      '营销文案创作：撰写广告语、产品介绍、着陆页文案',
      '社交媒体内容：创作小红书、抖音、微信公众号等平台的内容',
      '品牌故事塑造：提炼品牌价值主张，构建品牌叙事',
      '商业计划书撰写：协助撰写BP、路演PPT、融资材料',
      '内容策略制定：规划内容矩阵、发布节奏、话题策略',
      'SEO优化内容：创作符合搜索引擎优化原则的内容',
    ],
    constraints: [
      '内容必须原创，避免抄袭和模板化表达',
      '语气和风格需适配目标平台（如小红书偏口语化、BP偏专业）',
      '文案需有明确的行动号召（CTA）',
      '品牌内容需保持调性一致',
      '回答使用中文，内容可直接使用，标注适用场景',
    ],
  },

  // ========== 管家AI（Butler）==========
  butler: {
    role: 'butler',
    basePrompt: `你是"管家AI"，一位贴心、专业的客户服务管家和平台使用向导，专注于为大学生创业者提供全方位的服务支持。

你的核心身份：
- 你熟悉AI Mate平台的各项功能，能引导用户高效使用
- 你具备优秀的客户服务意识，善于解答疑问、处理问题
-你了解大学生创业常见问题和痛点，能提供针对性指导

你的服务对象是大学生创业者，他们可能在平台使用、项目管理、售后服务等方面需要帮助。`,
    capabilities: [
      '平台使用引导：指导用户使用AI Mate的四大AI角色和其他功能',
      '常见问题解答：解答创业过程中的常见疑问',
      '售后反馈处理：收集用户反馈，协调问题解决',
      '项目管理辅助：帮助用户管理创业项目进度和任务',
      '新手引导：为初次使用的用户提供步骤化引导',
      '资源推荐：根据用户需求推荐平台内合适的工具和资源',
    ],
    constraints: [
      '回答需简洁明了，避免冗长解释',
      '对于无法解决的问题，明确告知并引导联系人工客服',
      '保持友好、耐心的服务态度',
      '引导用户充分利用平台其他AI角色的能力',
      '回答使用中文，提供操作步骤时使用编号列表',
    ],
  },
};

// ========== 核心函数 ==========

/**
 * 获取指定角色的完整 System Prompt
 * @param role AI角色
 * @param context 上下文信息（可选）
 * @returns 拼接后的完整 system prompt
 */
export function getSystemPrompt(role: AIRole, context?: PromptContext): string {
  const template = PROMPT_TEMPLATES[role];

  let prompt = template.basePrompt;

  // 添加能力描述
  prompt += '\n\n## 你的核心能力\n';
  prompt += template.capabilities.map(cap => `- ${cap}`).join('\n');

  // 添加行为约束
  prompt += '\n\n## 行为准则\n';
  prompt += template.constraints.map(c => `- ${c}`).join('\n');

  // 注入上下文信息
  if (context) {
    prompt += '\n\n## 当前对话上下文\n';

    if (context.userName) {
      prompt += `- 用户名：${context.userName}\n`;
    }
    if (context.userLevel) {
      prompt += `- 用户等级：Lv.${context.userLevel}\n`;
    }
    if (context.projectInfo) {
      prompt += `- 当前项目：${context.projectInfo}\n`;
    }
    if (context.historySummary) {
      prompt += `- 历史对话摘要：${context.historySummary}\n`;
    }
    if (context.sharedContext) {
      prompt += `- 跨角色共享信息：${context.sharedContext}\n`;
    }
    if (context.knowledgeContext) {
      prompt += `\n## 知识库参考信息\n以下是相关知识库检索结果，请在回答中参考这些信息：\n${context.knowledgeContext}\n`;
    }
  }

  // 添加输出格式要求
  prompt += '\n\n## 输出要求\n';
  prompt += '请使用中文回答，内容使用Markdown格式排版，确保结构清晰、重点突出。';

  return prompt;
}

/**
 * 获取角色的基础提示词（不含上下文注入）
 */
export function getBasePrompt(role: AIRole): string {
  return PROMPT_TEMPLATES[role].basePrompt;
}

/**
 * 获取角色的能力列表
 */
export function getCapabilities(role: AIRole): string[] {
  return PROMPT_TEMPLATES[role].capabilities;
}

/**
 * 构建知识库RAG上下文
 * @param searchResults 知识库检索结果数组
 * @returns 格式化后的知识库上下文字符串
 */
export function buildKnowledgeContext(searchResults: Array<{
  title: string;
  content: string;
  source?: string;
  category?: string;
  relevance?: number;
}>): string {
  if (!searchResults || searchResults.length === 0) {
    return '';
  }

  return searchResults
    .map((result, index) => {
      let entry = `### 参考资料${index + 1}: ${result.title}\n`;
      entry += `**来源**: ${result.source || '未知'}\n`;
      entry += `**分类**: ${result.category || '未分类'}\n`;
      if (result.relevance !== undefined) {
        entry += `**相关度**: ${(result.relevance * 100).toFixed(1)}%\n`;
      }
      entry += `**内容**: ${result.content}\n`;
      return entry;
    })
    .join('\n---\n\n');
}

/**
 * 构建角色切换提示词（当用户从一个AI角色切换到另一个时）
 * @param fromRole 原角色
 * @param toRole 目标角色
 * @param summary 前一角色的对话摘要
 */
export function buildRoleTransitionPrompt(
  fromRole: AIRole,
  toRole: AIRole,
  summary?: string
): string {
  const roleNames: Record<AIRole, string> = {
    scout: '探路者AI',
    sage: '军师AI',
    maker: '工匠AI',
    butler: '管家AI',
  };

  let prompt = `用户刚从「${roleNames[fromRole]}」切换到「${roleNames[toRole]}」。\n`;

  if (summary) {
    prompt += `之前与${roleNames[fromRole]}的对话摘要如下，请基于此上下文继续为用户提供服务：\n${summary}\n`;
  } else {
    prompt += `之前没有对话历史，请主动询问用户需要什么帮助。\n`;
  }

  return prompt;
}

/**
 * 获取所有角色的提示词模板
 */
export function getAllPromptTemplates(): Record<AIRole, PromptTemplate> {
  return PROMPT_TEMPLATES;
}
```

- [ ] 步骤2：验证提示词管理器功能

**测试方法（在浏览器控制台中执行）：**

```typescript
import { getSystemPrompt, getBasePrompt, buildKnowledgeContext, buildRoleTransitionPrompt } from './services/promptManager';

// 测试1：获取完整的 System Prompt（含上下文）
const sagePrompt = getSystemPrompt('sage', {
  userName: '张三',
  userLevel: 3,
  projectInfo: '校园二手书交易平台',
  knowledgeContext: '大学生创业可享受每年14400元的税收减免限额。',
});
console.log('Sage完整提示词:', sagePrompt);
// 预期：包含基础人设、能力、约束、上下文信息、输出要求

// 测试2：获取基础提示词
const scoutBase = getBasePrompt('scout');
console.log('Scout基础提示词:', scoutBase);

// 测试3：构建知识库上下文
const kbContext = buildKnowledgeContext([
  {
    title: '大学生创业税收优惠政策指南',
    content: '毕业年度内高校毕业生从事个体经营的，3年内按每户每年14400元为限额扣减税费。',
    source: '国家税务总局',
    category: 'policy',
    relevance: 0.85,
  },
]);
console.log('知识库上下文:', kbContext);
// 预期：包含"参考资料1"标题、来源、分类、相关度、内容

// 测试4：构建角色切换提示词
const transitionPrompt = buildRoleTransitionPrompt('scout', 'sage', '用户询问了校园外卖市场分析');
console.log('角色切换提示词:', transitionPrompt);
// 预期：提示从探路者切换到军师，包含对话摘要

// 测试5：验证各角色提示词长度和结构
Object.entries(getAllPromptTemplates()).forEach(([role, template]) => {
  const fullPrompt = getSystemPrompt(role as AIRole);
  console.log(`${role} 提示词长度: ${fullPrompt.length} 字符`);
  // 预期：每个角色提示词在 1000-3000 字符之间
});
```

- [ ] 步骤3：进入任务3，实现后端流式SSE接口

---

### 任务3：实现后端流式SSE接口 POST /api/ai/chat/stream

**文件：** Modify `f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\server.js`

- [ ] 步骤1：在 server.js 中添加流式 SSE 接口，支持智谱GLM-4和Coze的流式推送

**完整 JavaScript 代码（在知识库 API 之后、错误处理中间件之前添加）：**

```javascript
// ========== AI 流式对话 SSE 接口 ==========

// 从环境变量获取 API Key（生产环境推荐方式）
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || '';
const COZE_API_KEY = process.env.COZE_API_KEY || '';
const COZE_BOT_ID = process.env.COZE_BOT_ID || '';

/**
 * 从数据库获取模型配置和 API Key
 */
async function getModelConfig(modelId) {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM ai_models WHERE id = ? AND is_active = 1',
    [modelId]
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  // 解密 API Key
  let apiKey = '';
  try {
    const reversed = row.api_key_enc.split('').reverse().join('');
    const decoded = Buffer.from(reversed, 'base64').toString('utf-8');
    apiKey = decoded.split(':' + MODEL_API_KEY_SECRET)[0];
  } catch {
    apiKey = '';
  }

  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    apiEndpoint: row.api_endpoint,
    modelId: row.model_id,
    apiKey: apiKey || (row.provider === 'zhipu' ? ZHIPU_API_KEY : COZE_API_KEY),
    config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config,
  };
}

/**
 * 调用智谱GLM-4流式接口
 */
async function streamZhipu(modelConfig, messages, res) {
  const config = modelConfig.config || {};
  const requestBody = {
    model: modelConfig.modelId,
    messages: messages,
    stream: true,
    temperature: config.temperature ?? 0.7,
    max_tokens: config.max_tokens ?? 4096,
    top_p: config.top_p ?? 0.9,
  };

  const response = await fetch(modelConfig.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${modelConfig.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`智谱API错误(${response.status}): ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let totalContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const data = line.slice(5).trim();
        if (data === '[DONE]') {
          res.write(`data: [DONE]\n\n`);
          return totalContent;
        }
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.content) {
            totalContent += delta.content;
            // SSE 推送到客户端
            res.write(`data: ${JSON.stringify({
              content: delta.content,
              role: 'assistant',
              finish_reason: parsed.choices?.[0]?.finish_reason || null,
              usage: parsed.usage || null,
            })}\n\n`);
          }
        } catch {
          // 忽略解析错误的行
        }
      }
    }
  }

  return totalContent;
}

/**
 * 调用Coze流式接口
 */
async function streamCoze(modelConfig, messages, res) {
  const config = modelConfig.config || {};
  const botId = config.bot_id || COZE_BOT_ID;

  if (!botId) {
    throw new Error('Coze bot_id 未配置');
  }

  // 提取最后一条用户消息
  const lastUserMsg = messages.filter(m => m.role === 'user').pop();
  const userInput = lastUserMsg?.content || '';

  // 构建Coze请求
  const requestBody = {
    bot_id: botId,
    user_id: 'ai-mate-user-1',
    stream: true,
    auto_save_history: true,
    additional_messages: [{
      role: 'user',
      content: userInput,
      content_type: 'text',
    }],
  };

  const response = await fetch(modelConfig.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${modelConfig.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Coze API错误(${response.status}): ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let totalContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const data = line.slice(5).trim();
        if (data === '[DONE]') {
          res.write(`data: [DONE]\n\n`);
          return totalContent;
        }
        try {
          const parsed = JSON.parse(data);
          // Coze v3 流式响应格式
          if (parsed.event === 'conversation.message.delta' && parsed.message) {
            const content = parsed.message.content;
            if (content) {
              totalContent += content;
              res.write(`data: ${JSON.stringify({
                content: content,
                role: 'assistant',
                finish_reason: null,
              })}\n\n`);
            }
          }
          if (parsed.event === 'conversation.message.completed') {
            res.write(`data: ${JSON.stringify({
              content: '',
              role: 'assistant',
              finish_reason: 'stop',
            })}\n\n`);
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }

  return totalContent;
}

/**
 * 流式对话 SSE 接口
 * POST /api/ai/chat/stream
 * Body: {
 *   conversationId: number,      // 对话ID
 *   messages: Array,             // 消息历史（含system prompt）
 *   modelId?: number,            // 指定模型ID（不指定则用对话关联的模型）
 *   role: string,                // AI角色（用于日志和降级）
 *   knowledgeQuery?: string,     // 知识库检索关键词（可选，启用RAG）
 * }
 *
 * 响应格式：SSE (text/event-stream)
 * data: {"content":"回复片段","role":"assistant","finish_reason":null}
 * data: [DONE]
 */
app.post('/api/ai/chat/stream', async (req, res) => {
  try {
    const { conversationId, messages, modelId, role, knowledgeQuery } = req.body;

    // 参数验证
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json(error('messages 字段必填且为数组', 400));
    }
    if (!conversationId) {
      return res.status(400).json(error('conversationId 字段必填', 400));
    }

    // 验证对话是否存在
    const pool = getPool();
    const [convRows] = await pool.execute(
      "SELECT id, model_id, ai_role FROM conversations WHERE id = ? AND status != 'deleted'",
      [conversationId]
    );
    if (convRows.length === 0) {
      return res.status(404).json(error('对话不存在', 404));
    }

    const conv = convRows[0];

    // 确定使用的模型ID
    const useModelId = modelId || conv.model_id;
    if (!useModelId) {
      return res.status(400).json(error('未指定AI模型，请先为对话配置模型', 400));
    }

    // 获取模型配置
    const modelConfig = await getModelConfig(useModelId);
    if (!modelConfig) {
      return res.status(404).json(error('模型配置不存在或未启用', 404));
    }

    // 如果提供了知识库检索关键词，执行RAG检索并注入到system prompt
    if (knowledgeQuery) {
      try {
        const [kbResults] = await pool.execute(
          `SELECT title, content, source, category,
                  MATCH(title, content) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevance
           FROM knowledge_base
           WHERE is_published = 1
             AND MATCH(title, content) AGAINST(? IN BOOLEAN MODE)
           ORDER BY relevance DESC LIMIT 3`,
          [knowledgeQuery, knowledgeQuery]
        );

        if (kbResults.length > 0) {
          // 构建知识库上下文并注入到system消息
          const kbContext = kbResults.map((r, i) =>
            `[参考资料${i + 1}] ${r.title}\n来源: ${r.source}\n内容: ${r.content}`
          ).join('\n\n');

          // 找到system消息并追加知识库上下文
          const systemMsgIndex = messages.findIndex(m => m.role === 'system');
          if (systemMsgIndex >= 0) {
            messages[systemMsgIndex].content += `\n\n## 知识库参考信息\n${kbContext}`;
          } else {
            // 如果没有system消息，创建一条
            messages.unshift({
              role: 'system',
              content: `## 知识库参考信息\n${kbContext}`,
            });
          }
        }
      } catch (kbErr) {
        console.error('知识库RAG检索失败（不影响主流程）:', kbErr.message);
      }
    }

    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // 禁用 Nginx 缓冲
    });

    // 发送开始事件
    res.write(`data: ${JSON.stringify({
      type: 'start',
      model: modelConfig.name,
      provider: modelConfig.provider,
      timestamp: new Date().toISOString(),
    })}\n\n`);

    // 根据提供商调用对应的流式接口
    let fullContent = '';
    let responseTimeMs = 0;
    const startTime = Date.now();

    try {
      if (modelConfig.provider === 'zhipu') {
        fullContent = await streamZhipu(modelConfig, messages, res);
      } else if (modelConfig.provider === 'coze') {
        fullContent = await streamCoze(modelConfig, messages, res);
      } else if (modelConfig.provider === 'openai') {
        // OpenAI 兼容接口（与智谱格式相同）
        fullContent = await streamZhipu(modelConfig, messages, res);
      } else {
        throw new Error(`不支持的模型提供商: ${modelConfig.provider}`);
      }

      responseTimeMs = Date.now() - startTime;

      // 保存AI回复到数据库
      const tokenCount = Math.ceil(fullContent.length / 2); // 粗略估算
      const metadata = JSON.stringify({
        model: modelConfig.modelId,
        provider: modelConfig.provider,
        response_time_ms: responseTimeMs,
        finish_reason: 'stop',
      });

      await pool.execute(
        `INSERT INTO messages (conversation_id, role, content, token_count, metadata)
         VALUES (?, 'assistant', ?, ?, ?)`,
        [conversationId, fullContent, tokenCount, metadata]
      );

      // 更新对话时间戳
      await pool.execute(
        'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [conversationId]
      );

    } catch (streamErr) {
      console.error('流式生成失败:', streamErr);
      // 发送错误事件
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: streamErr.message,
      })}\n\n`);

      // 保存错误消息到数据库
      await pool.execute(
        `INSERT INTO messages (conversation_id, role, content, token_count, is_error, metadata)
         VALUES (?, 'assistant', ?, ?, 1, ?)`,
        [conversationId, `生成失败: ${streamErr.message}`, 0,
         JSON.stringify({ error: streamErr.message })]
      );
    }

    // 发送结束事件
    res.write(`data: ${JSON.stringify({
      type: 'end',
      totalContent: fullContent,
      responseTimeMs: responseTimeMs,
      tokenCount: Math.ceil(fullContent.length / 2),
    })}\n\n`);

    res.write(`data: [DONE]\n\n`);
    res.end();

  } catch (err) {
    console.error('流式对话接口错误:', err);
    // 如果响应头尚未发送，返回JSON错误
    if (!res.headersSent) {
      res.status(500).json(error(err.message));
    } else {
      // 如果已经开始流式传输，通过SSE发送错误
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: err.message,
      })}\n\n`);
      res.end();
    }
  }
});
```

- [ ] 步骤2：验证流式 SSE 接口

**curl 测试命令：**

```bash
# 1. 基础流式对话测试（需要先创建对话并配置模型）
# 先创建对话
curl -X POST http://localhost:8080/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title":"流式测试","type":"sage","modelId":1}'
# 假设返回对话ID为 10

# 2. 发送流式对话请求（使用 curl 的 -N 参数禁用缓冲以查看实时流）
curl -N -X POST http://localhost:8080/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": 10,
    "role": "sage",
    "messages": [
      {"role": "system", "content": "你是军师AI，一位资深的创业策略顾问。"},
      {"role": "user", "content": "大学生创业应该注意什么？"}
    ]
  }'
# 预期：逐块返回 data: {"content":"..."} 格式的SSE数据流，最后 data: [DONE]

# 3. 带知识库RAG检索的流式对话
curl -N -X POST http://localhost:8080/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": 10,
    "role": "sage",
    "knowledgeQuery": "大学生创业税收优惠",
    "messages": [
      {"role": "system", "content": "你是军师AI，一位资深的创业策略顾问。"},
      {"role": "user", "content": "大学生创业有什么税收优惠政策？"}
    ]
  }'
# 预期：AI回答中包含知识库检索到的税收优惠信息

# 4. 验证消息已持久化（流式结束后检查数据库）
curl http://localhost:8080/api/messages/10
# 预期：包含用户消息和AI回复消息

# 5. 测试错误处理（不存在的对话ID）
curl -X POST http://localhost:8080/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": 99999,
    "messages": [{"role": "user", "content": "测试"}]
  }'
# 预期：返回 code=404，对话不存在

# 6. 使用 Node.js 脚本测试 SSE（更完整的前端模拟测试）
# 创建测试脚本 test-sse.js：
node -e "
const http = require('http');
const data = JSON.stringify({
  conversationId: 10,
  role: 'sage',
  messages: [
    {role: 'system', content: '你是军师AI。'},
    {role: 'user', content: '用一句话介绍大学生创业'}
  ]
});
const req = http.request({
  hostname: 'localhost',
  port: 8080,
  path: '/api/ai/chat/stream',
  method: 'POST',
  headers: {'Content-Type': 'application/json', 'Content-Length': data.length}
}, (res) => {
  console.log('状态码:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  let fullContent = '';
  res.on('data', (chunk) => {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') { console.log('\n=== 流式传输完成 ==='); return; }
        try {
          const parsed = JSON.parse(payload);
          if (parsed.type === 'start') console.log('开始:', parsed.model);
          else if (parsed.type === 'end') console.log('\n结束: 耗时' + parsed.responseTimeMs + 'ms');
          else if (parsed.type === 'error') console.log('错误:', parsed.message);
          else if (parsed.content) { process.stdout.write(parsed.content); fullContent += parsed.content; }
        } catch {}
      }
    }
  });
});
req.write(data);
req.end();
"
```

- [ ] 步骤3：进入任务4，创建跨角色上下文管理器

---

### 任务4：创建 src/services/contextManager.ts 跨角色上下文管理器

**文件：** Create `f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\src\services\contextManager.ts`

- [ ] 步骤1：创建上下文管理器，管理四大AI角色之间的上下文共享

**完整 TypeScript 代码：**

```typescript
/**
 * 跨角色上下文管理器
 * 管理四大AI角色（scout/sage/maker/butler）之间的上下文共享
 * 实现角色切换时的对话摘要传递和关键信息保留
 */

import type { AIRole } from '../store/aiStore';
import { buildRoleTransitionPrompt } from './promptManager';

// ========== 类型定义 ==========

export interface ConversationSummary {
  role: AIRole;
  conversationId: string;
  title: string;
  summary: string;            // 对话摘要
  keyPoints: string[];        // 关键信息点
  entities: ExtractedEntity[]; // 提取的实体信息
  createdAt: number;
}

export interface ExtractedEntity {
  type: 'project' | 'person' | 'resource' | 'policy' | 'market' | 'other';
  name: string;
  value?: string;
}

export interface SharedContext {
  projectName?: string;         // 当前讨论的项目名称
  projectDescription?: string;  // 项目描述
  targetMarket?: string;        // 目标市场
  budget?: string;              // 预算范围
  timeline?: string;            // 时间线
  keyResources?: string[];      // 关键资源
  painPoints?: string[];        // 痛点
  decisions?: string[];         // 已做决策
  lastUpdatedBy?: AIRole;       // 最后更新的角色
  lastUpdatedAt?: number;       // 最后更新时间
}

// ========== 上下文存储 ==========

// 角色对话摘要缓存（内存存储，生命周期与页面一致）
const summaryCache: Map<AIRole, ConversationSummary> = new Map();

// 共享上下文（所有角色共享的项目信息）
let sharedContext: SharedContext = {};

// 角色切换历史
const roleTransitionHistory: Array<{
  from: AIRole;
  to: AIRole;
  timestamp: number;
}> = [];

// ========== 核心函数 ==========

/**
 * 生成对话摘要
 * 当用户离开某个角色的对话时，自动生成摘要保存
 * @param role AI角色
 * @param messages 消息列表
 * @param conversationId 对话ID
 * @param title 对话标题
 */
export function generateSummary(
  role: AIRole,
  messages: Array<{ role: string; content: string }>,
  conversationId: string,
  title: string
): ConversationSummary {
  // 提取关键信息（简单实现：取前几条消息的核心内容）
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');

  // 生成摘要：取前3条用户消息和前2条AI回复的核心内容
  const summaryParts: string[] = [];
  userMessages.slice(0, 3).forEach(msg => {
    // 截取前100字符作为摘要
    summaryParts.push(msg.content.substring(0, 100));
  });
  if (assistantMessages.length > 0) {
    summaryParts.push(assistantMessages[0].content.substring(0, 150));
  }

  const summary = summaryParts.join('；');

  // 提取关键信息点
  const keyPoints = extractKeyPoints(messages);

  // 提取实体信息
  const entities = extractEntities(messages);

  const conversationSummary: ConversationSummary = {
    role,
    conversationId,
    title,
    summary,
    keyPoints,
    entities,
    createdAt: Date.now(),
  };

  // 缓存摘要
  summaryCache.set(role, conversationSummary);

  // 更新共享上下文
  updateSharedContext(role, conversationSummary);

  return conversationSummary;
}

/**
 * 从消息中提取关键信息点
 */
function extractKeyPoints(messages: Array<{ role: string; content: string }>): string[] {
  const keyPoints: string[] = [];
  const allContent = messages.map(m => m.content).join(' ');

  // 关键词模式匹配
  const patterns = [
    { regex: /项目[名称|名叫]是?(.+?)(?:[，。,.]|$)/g, label: '项目' },
    { regex: /预算[是为有]?(.+?)(?:[，。,.]|$)/g, label: '预算' },
    { regex: /目标[用户|客户|市场][是为]?(.+?)(?:[，。,.]|$)/g, label: '目标' },
    { regex: /需要(.+?)(?:[，。,.]|$)/g, label: '需求' },
  ];

  patterns.forEach(({ regex, label }) => {
    let match;
    while ((match = regex.exec(allContent)) !== null) {
      keyPoints.push(`[${label}] ${match[1].trim()}`);
    }
  });

  return keyPoints.slice(0, 5); // 最多保留5个关键点
}

/**
 * 从消息中提取实体信息
 */
function extractEntities(messages: Array<{ role: string; content: string }>): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const allContent = messages.map(m => m.content).join(' ');

  // 项目名称提取
  const projectMatch = allContent.match(/项目[名称|名叫]是?["""']?(.+?)["""']?(?:[，。,.]|$)/);
  if (projectMatch) {
    entities.push({ type: 'project', name: projectMatch[1].trim() });
  }

  // 政策关键词提取
  const policyKeywords = ['税收优惠', '创业补贴', '担保贷款', '孵化器', '社保补贴'];
  policyKeywords.forEach(kw => {
    if (allContent.includes(kw)) {
      entities.push({ type: 'policy', name: kw });
    }
  });

  // 市场关键词提取
  const marketMatch = allContent.match(/(?:校园|大学生|年轻人|线上|线下)(?:市场|用户|群体)/);
  if (marketMatch) {
    entities.push({ type: 'market', name: marketMatch[0] });
  }

  return entities;
}

/**
 * 更新共享上下文
 */
function updateSharedContext(role: AIRole, summary: ConversationSummary): void {
  // 根据摘要中的实体信息更新共享上下文
  summary.entities.forEach(entity => {
    switch (entity.type) {
      case 'project':
        if (!sharedContext.projectName) {
          sharedContext.projectName = entity.name;
        }
        break;
      case 'market':
        if (!sharedContext.targetMarket) {
          sharedContext.targetMarket = entity.name;
        }
        break;
      case 'policy':
        if (!sharedContext.keyResources) {
          sharedContext.keyResources = [];
        }
        if (!sharedContext.keyResources.includes(entity.name)) {
          sharedContext.keyResources.push(entity.name);
        }
        break;
    }
  });

  // 更新关键点到痛点列表
  if (summary.keyPoints.length > 0 && !sharedContext.painPoints) {
    sharedContext.painPoints = summary.keyPoints.slice(0, 3);
  }

  sharedContext.lastUpdatedBy = role;
  sharedContext.lastUpdatedAt = Date.now();
}

/**
 * 获取角色的对话摘要
 */
export function getSummary(role: AIRole): ConversationSummary | undefined {
  return summaryCache.get(role);
}

/**
 * 获取共享上下文
 */
export function getSharedContext(): SharedContext {
  return { ...sharedContext };
}

/**
 * 手动更新共享上下文
 */
export function updateSharedContextManual(updates: Partial<SharedContext>, updatedBy: AIRole): void {
  sharedContext = {
    ...sharedContext,
    ...updates,
    lastUpdatedBy: updatedBy,
    lastUpdatedAt: Date.now(),
  };
}

/**
 * 构建角色切换时的上下文传递
 * 当用户从角色A切换到角色B时，将角色A的摘要和共享上下文传递给角色B
 * @param fromRole 原角色
 * @param toRole 目标角色
 * @returns 角色切换提示词和共享上下文信息
 */
export function buildTransitionContext(
  fromRole: AIRole,
  toRole: AIRole
): {
  transitionPrompt: string;
  sharedContextString: string;
  previousSummary?: ConversationSummary;
} {
  // 记录角色切换历史
  roleTransitionHistory.push({
    from: fromRole,
    to: toRole,
    timestamp: Date.now(),
  });

  // 获取原角色的对话摘要
  const previousSummary = summaryCache.get(fromRole);

  // 构建角色切换提示词
  const transitionPrompt = buildRoleTransitionPrompt(
    fromRole,
    toRole,
    previousSummary?.summary
  );

  // 构建共享上下文字符串
  const sharedContextString = buildSharedContextString();

  return {
    transitionPrompt,
    sharedContextString,
    previousSummary,
  };
}

/**
 * 将共享上下文转换为字符串描述
 */
function buildSharedContextString(): string {
  const parts: string[] = [];

  if (sharedContext.projectName) {
    parts.push(`当前项目: ${sharedContext.projectName}`);
  }
  if (sharedContext.projectDescription) {
    parts.push(`项目描述: ${sharedContext.projectDescription}`);
  }
  if (sharedContext.targetMarket) {
    parts.push(`目标市场: ${sharedContext.targetMarket}`);
  }
  if (sharedContext.budget) {
    parts.push(`预算: ${sharedContext.budget}`);
  }
  if (sharedContext.timeline) {
    parts.push(`时间线: ${sharedContext.timeline}`);
  }
  if (sharedContext.keyResources && sharedContext.keyResources.length > 0) {
    parts.push(`关键资源: ${sharedContext.keyResources.join(', ')}`);
  }
  if (sharedContext.painPoints && sharedContext.painPoints.length > 0) {
    parts.push(`关注点: ${sharedContext.painPoints.join(', ')}`);
  }
  if (sharedContext.decisions && sharedContext.decisions.length > 0) {
    parts.push(`已做决策: ${sharedContext.decisions.join(', ')}`);
  }

  return parts.length > 0 ? parts.join('\n') : '';
}

/**
 * 获取所有角色的摘要
 */
export function getAllSummaries(): Record<AIRole, ConversationSummary | undefined> {
  return {
    scout: summaryCache.get('scout'),
    sage: summaryCache.get('sage'),
    maker: summaryCache.get('maker'),
    butler: summaryCache.get('butler'),
  };
}

/**
 * 获取角色切换历史
 */
export function getRoleTransitionHistory(): Array<{ from: AIRole; to: AIRole; timestamp: number }> {
  return [...roleTransitionHistory];
}

/**
 * 清除指定角色的摘要
 */
export function clearSummary(role: AIRole): void {
  summaryCache.delete(role);
}

/**
 * 清除所有缓存（用户退出登录时调用）
 */
export function clearAllContext(): void {
  summaryCache.clear();
  sharedContext = {};
  roleTransitionHistory.length = 0;
}

/**
 * 将共享上下文同步到后端持久化（预留接口）
 * @param conversationId 当前对话ID
 * @param role 当前角色
 */
export async function syncContextToBackend(
  conversationId: string,
  role: AIRole
): Promise<void> {
  try {
    const summary = summaryCache.get(role);
    if (!summary) return;

    // 将摘要更新到对话记录中
    const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
    const convIdNum = parseInt(conversationId.replace('backend-', ''), 10);

    if (isNaN(convIdNum)) return;

    await fetch(`${API_BASE}/conversations/${convIdNum}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // 复用 summary 字段存储对话摘要
        // 注意：需要在后端 conversations 表中支持 summary 字段更新
        // 当前通过对话标题间接保存关键信息
      }),
    });
  } catch (err) {
    console.error('[contextManager] 同步上下文到后端失败:', err);
  }
}
```

- [ ] 步骤2：验证上下文管理器功能

**测试方法（在浏览器控制台中执行）：**

```typescript
import {
  generateSummary,
  getSummary,
  getSharedContext,
  buildTransitionContext,
  getAllSummaries,
  clearAllContext,
} from './services/contextManager';

// 测试1：生成对话摘要
const scoutSummary = generateSummary('scout', [
  { role: 'user', content: '我正在做一个校园外卖平台项目，预算5万元' },
  { role: 'assistant', content: '校园外卖平台是个不错的选择，5万元预算需要合理分配...' },
  { role: 'user', content: '帮我找一下校园外卖的供应商' },
], 'backend-10', '校园外卖平台咨询');
console.log('Scout摘要:', scoutSummary);
// 预期：summary 包含消息摘要，keyPoints 包含项目和预算信息

// 测试2：获取共享上下文
console.log('共享上下文:', getSharedContext());
// 预期：projectName 和 targetMarket 已自动提取

// 测试3：角色切换上下文传递
const transition = buildTransitionContext('scout', 'sage');
console.log('切换提示词:', transition.transitionPrompt);
console.log('共享上下文:', transition.sharedContextString);
console.log('前角色摘要:', transition.previousSummary?.summary);
// 预期：transitionPrompt 包含 scout 的摘要，sharedContextString 包含项目信息

// 测试4：获取所有角色摘要
console.log('所有摘要:', getAllSummaries());
// 预期：scout 有摘要，其他角色为 undefined

// 测试5：清理上下文
clearAllContext();
console.log('清理后共享上下文:', getSharedContext());
// 预期：空对象
```

- [ ] 步骤3：进入任务5，实现知识库RAG检索函数

---

### 任务5：实现知识库RAG检索函数 searchKnowledgeBase

**文件：** Create `f:\program open\AI Entrepreneurship Empowerment Platform\program1\ai-mate\react-ai-chat\src\services\knowledgeService.ts`

- [ ] 步骤1：创建知识库服务，封装RAG检索函数，供前端各AI角色调用

**完整 TypeScript 代码：**

```typescript
/**
 * 知识库 RAG 检索服务
 * 封装知识库全文检索功能，为AI对话提供知识增强
 * 使用 MySQL FULLTEXT INDEX with ngram parser 进行中文全文检索
 */

// ========== 类型定义 ==========

export type KnowledgeCategory = 'case' | 'policy' | 'report' | 'tutorial';

export interface KnowledgeItem {
  id: number;
  title: string;
  content: string;
  category: KnowledgeCategory;
  source: string | null;
  tags: string[] | null;
  viewCount: number;
  createdAt: string;
}

export interface SearchResult {
  id: number;
  title: string;
  content: string;
  excerpt: string;          // 内容摘要（前200字符）
  category: KnowledgeCategory;
  source: string | null;
  tags: string[] | null;
  relevance: number;        // 相关性分数（0-1）
  createdAt: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
}

export interface PaginatedResponse {
  items: KnowledgeItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ========== 配置 ==========

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// ========== 核心RAG检索函数 ==========

/**
 * 知识库 RAG 检索函数
 * 使用 MySQL FULLTEXT 索引进行中文全文检索
 * 检索结果将作为上下文注入到 AI 的 System Prompt 中
 *
 * @param query 搜索关键词
 * @param options 检索选项
 * @returns 检索结果数组（按相关性排序）
 */
export async function searchKnowledgeBase(
  query: string,
  options?: {
    category?: KnowledgeCategory;  // 分类筛选
    limit?: number;                // 返回条数（默认5，最大20）
    minRelevance?: number;         // 最低相关性阈值（默认0）
  }
): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const { category, limit = 5, minRelevance = 0 } = options || {};

  try {
    const params = new URLSearchParams({
      query: query.trim(),
      limit: String(Math.min(20, Math.max(1, limit))),
    });

    if (category) {
      params.append('category', category);
    }

    const response = await fetch(`${API_BASE}/knowledge-base/search?${params}`);
    const data = await response.json();

    if (data.code !== 200) {
      console.error('[knowledgeService] 检索失败:', data.message);
      return [];
    }

    const searchResponse: SearchResponse = data.data;

    // 过滤低于最低相关性阈值的结果
    const filtered = searchResponse.results.filter(r => r.relevance >= minRelevance);

    return filtered;
  } catch (err) {
    console.error('[knowledgeService] 检索异常:', err);
    return [];
  }
}

/**
 * 获取知识库列表（分页）
 */
export async function fetchKnowledgeBase(
  options?: {
    category?: KnowledgeCategory;
    page?: number;
    pageSize?: number;
  }
): Promise<PaginatedResponse> {
  const { category, page = 1, pageSize = 20 } = options || {};

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (category) {
    params.append('category', category);
  }

  const response = await fetch(`${API_BASE}/knowledge-base?${params}`);
  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '获取知识库列表失败');
  }

  return data.data;
}

/**
 * 获取知识库详情
 */
export async function fetchKnowledgeDetail(id: number): Promise<KnowledgeItem> {
  const response = await fetch(`${API_BASE}/knowledge-base/${id}`);
  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '获取知识库详情失败');
  }

  return data.data;
}

/**
 * 创建知识库条目
 */
export async function createKnowledge(
  item: Omit<KnowledgeItem, 'id' | 'viewCount' | 'createdAt'>
): Promise<KnowledgeItem> {
  const response = await fetch(`${API_BASE}/knowledge-base`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '创建知识库条目失败');
  }

  return data.data;
}

/**
 * 更新知识库条目
 */
export async function updateKnowledge(
  id: number,
  updates: Partial<Omit<KnowledgeItem, 'id' | 'createdAt'>>
): Promise<void> {
  const response = await fetch(`${API_BASE}/knowledge-base/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '更新知识库条目失败');
  }
}

/**
 * 删除知识库条目
 */
export async function deleteKnowledge(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/knowledge-base/${id}`, {
    method: 'DELETE',
  });
  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.message || '删除知识库条目失败');
  }
}

// ========== RAG 增强对话辅助函数 ==========

/**
 * RAG 增强检索：根据用户输入自动检索知识库并构建上下文
 * 将检索结果格式化为可直接注入 System Prompt 的文本
 *
 * @param userInput 用户输入
 * @param role 当前AI角色
 * @returns 格式化的知识库上下文字符串（可直接注入到System Prompt）
 */
export async function ragSearch(
  userInput: string,
  role?: 'scout' | 'sage' | 'maker' | 'butler'
): Promise<string> {
  // 根据角色确定检索分类偏好
  let category: KnowledgeCategory | undefined;
  if (role === 'sage') {
    // 军师优先检索报告和案例
    // 不限定分类，让全文检索决定
  } else if (role === 'scout') {
    // 探路者优先检索政策和案例
  } else if (role === 'butler') {
    // 管家优先检索教程
    category = 'tutorial';
  }

  const results = await searchKnowledgeBase(userInput, {
    category,
    limit: 3,
    minRelevance: 0.1,
  });

  if (results.length === 0) {
    return '';
  }

  // 格式化检索结果
  const contextParts = results.map((result, index) => {
    let part = `### 参考资料${index + 1}: ${result.title}\n`;
    part += `**来源**: ${result.source || '未知'}\n`;
    part += `**分类**: ${result.category}\n`;
    part += `**相关度**: ${(result.relevance * 100).toFixed(1)}%\n`;
    part += `**内容**: ${result.content}\n`;
    return part;
  });

  return `以下是从知识库中检索到的相关参考资料，请在回答中参考这些信息，并在适用时引用来源：\n\n${contextParts.join('\n---\n\n')}`;
}

/**
 * 批量检索多个关键词
 * 适用于需要从多个角度检索知识库的场景
 *
 * @param queries 关键词数组
 * @param limitEach 每个关键词返回的条数
 * @returns 去重后的检索结果
 */
export async function batchSearch(
  queries: string[],
  limitEach: number = 2
): Promise<SearchResult[]> {
  const allResults: SearchResult[] = [];
  const seenIds = new Set<number>();

  for (const query of queries) {
    const results = await searchKnowledgeBase(query, { limit: limitEach });
    for (const result of results) {
      if (!seenIds.has(result.id)) {
        seenIds.add(result.id);
        allResults.push(result);
      }
    }
  }

  // 按相关性重新排序
  return allResults.sort((a, b) => b.relevance - a.relevance);
}

/**
 * 智能提取用户输入中的检索关键词
 * 用于在调用 AI 之前自动触发 RAG 检索
 *
 * @param userInput 用户输入
 * @returns 提取的关键词数组
 */
export function extractSearchKeywords(userInput: string): string[] {
  const keywords: string[] = [];

  // 直接使用完整输入作为第一个检索词
  keywords.push(userInput);

  // 提取引号内的关键词
  const quotedMatches = userInput.match(/["""'](.+?)["""']/g);
  if (quotedMatches) {
    quotedMatches.forEach(m => {
      const cleaned = m.replace(/["""']/g, '');
      if (cleaned.length >= 2) keywords.push(cleaned);
    });
  }

  // 提取特定领域关键词
  const domainKeywords = [
    '大学生创业', '税收优惠', '创业补贴', '担保贷款', '孵化器',
    '商业计划书', 'BP', '融资', '天使投资', '风险投资',
    '市场分析', '竞品分析', '用户画像', '营销策略',
    '社交媒体', '内容营销', '品牌建设',
  ];

  domainKeywords.forEach(kw => {
    if (userInput.includes(kw)) {
      keywords.push(kw);
    }
  });

  // 去重，最多保留5个关键词
  return [...new Set(keywords)].slice(0, 5);
}
```

- [ ] 步骤2：验证知识库 RAG 检索函数

**测试方法（在浏览器控制台中执行）：**

```typescript
import {
  searchKnowledgeBase,
  ragSearch,
  batchSearch,
  extractSearchKeywords,
  fetchKnowledgeBase,
} from './services/knowledgeService';

// 测试1：基础全文检索
async function testBasicSearch() {
  const results = await searchKnowledgeBase('大学生创业税收优惠');
  console.log('检索结果:', results);
  // 预期：返回与"大学生创业税收优惠"相关的知识条目，按 relevance 排序
  // 每条结果包含 title, content, excerpt, relevance 等字段
}
testBasicSearch();

// 测试2：分类筛选检索
async function testCategorySearch() {
  const policyResults = await searchKnowledgeBase('创业补贴', { category: 'policy' });
  console.log('政策类检索:', policyResults);
  // 预期：只返回 category=policy 的结果
}
testCategorySearch();

// 测试3：RAG增强检索（直接生成可注入的上下文文本）
async function testRagSearch() {
  const context = await ragSearch('大学生创业有什么税收优惠政策？', 'sage');
  console.log('RAG上下文:', context);
  // 预期：返回格式化的参考资料文本，可直接注入到 System Prompt
  // 格式包含"参考资料N"、来源、分类、相关度、内容
}
testRagSearch();

// 测试4：批量检索
async function testBatchSearch() {
  const results = await batchSearch(['大学生创业', '税收优惠', '创业补贴'], 2);
  console.log('批量检索结果:', results);
  // 预期：3个关键词的检索结果去重后合并，按相关性排序
}
testBatchSearch();

// 测试5：关键词提取
function testExtractKeywords() {
  const keywords = extractSearchKeywords('我想了解"大学生创业"的税收优惠和创业补贴政策');
  console.log('提取的关键词:', keywords);
  // 预期：包含完整输入 + "大学生创业" + 引号内容 + 领域关键词
}
testExtractKeywords();

// 测试6：获取知识库列表
async function testFetchList() {
  const list = await fetchKnowledgeBase({ page: 1, pageSize: 5 });
  console.log('知识库列表:', list);
  // 预期：返回 { items, total, page, pageSize, totalPages }
}
testFetchList();

// 测试7：端到端 RAG 流程（模拟 AI 对话中的知识库增强）
async function testEndToEndRAG() {
  const userInput = '大学生创业可以享受哪些税收优惠政策？';

  // 步骤1：提取关键词
  const keywords = extractSearchKeywords(userInput);
  console.log('1. 提取关键词:', keywords);

  // 步骤2：RAG检索
  const context = await ragSearch(userInput, 'sage');
  console.log('2. RAG上下文:', context);

  // 步骤3：构建完整的 System Prompt（配合 promptManager）
  // const systemPrompt = getSystemPrompt('sage', { knowledgeContext: context });
  // console.log('3. 完整System Prompt:', systemPrompt);

  // 步骤4：调用流式对话接口（配合后端 /api/ai/chat/stream）
  // fetch('/api/ai/chat/stream', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     conversationId: 10,
  //     role: 'sage',
  //     knowledgeQuery: userInput,  // 后端会自动检索知识库
  //     messages: [
  //       { role: 'system', content: systemPrompt },
  //       { role: 'user', content: userInput },
  //     ],
  //   }),
  // });
}
testEndToEndRAG();
```

- [ ] 步骤3：Plan-03 全部完成，三个计划形成完整的实施链路

---

## 总结

### 新增/修改文件清单
| 文件 | 操作 | 说明 |
|------|------|------|
| `ai-mate/react-ai-chat/src/services/aiRouter.ts` | 新建 | 模型路由器，根据角色+任务选择最优模型 |
| `ai-mate/react-ai-chat/src/services/promptManager.ts` | 新建 | 提示词管理器，管理四大角色精细化System Prompt |
| `ai-mate/react-ai-chat/server.js` | 修改 | 新增 POST /api/ai/chat/stream 流式SSE接口 |
| `ai-mate/react-ai-chat/src/services/contextManager.ts` | 新建 | 跨角色上下文管理器，实现对话摘要和共享上下文 |
| `ai-mate/react-ai-chat/src/services/knowledgeService.ts` | 新建 | 知识库RAG检索服务，封装全文检索和上下文构建 |

### 服务依赖关系
```
用户输入
  │
  ├─> aiRouter.ts (模型路由) ──> 选择 GLM-4 / Coze
  │
  ├─> knowledgeService.ts (RAG检索) ──> 知识库全文检索 ──> 构建知识上下文
  │         │
  │         └─> promptManager.ts (提示词管理) ──> 注入知识上下文到System Prompt
  │
  ├─> contextManager.ts (上下文管理) ──> 跨角色摘要传递 + 共享上下文
  │
  └─> POST /api/ai/chat/stream (后端SSE) ──> 流式调用智谱/Coze API ──> SSE推送
```

### 注意事项
1. **API Key 管理：** 后端 SSE 接口从数据库 `ai_models` 表读取加密的 API Key，解密后调用智谱/Coze API。生产环境应使用环境变量 `ZHIPU_API_KEY` 和 `COZE_API_KEY` 作为降级方案，并替换简单加密为 AES-256。
2. **SSE 连接管理：** 流式接口设置了 `X-Accel-Buffering: no` 头，确保 Nginx 不缓冲 SSE 数据流。如果使用其他反向代理，需同样配置。
3. **知识库 RAG 集成：** RAG 检索支持两种模式：（1）前端通过 `knowledgeService.ts` 预检索并注入到 System Prompt；（2）后端 SSE 接口通过 `knowledgeQuery` 参数自动检索。两种方式可组合使用。
4. **上下文管理生命周期：** `contextManager.ts` 的摘要缓存存储在内存中，页面刷新后丢失。`syncContextToBackend` 函数预留了后端持久化接口，后续可扩展。
5. **模型路由降级：** `aiRouter.ts` 在后端不可用时自动降级到默认 GLM-4 配置，确保前端功能不受影响。
6. **Coze 集成注意：** Coze API 的 bot_id 需要通过环境变量 `COZE_BOT_ID` 或模型配置的 `config.bot_id` 提供，否则 Coze 调用会失败。
7. **Node.js fetch：** 后端 SSE 接口使用 Node.js 内置的 `fetch` API（Node 18+）。如果 Node.js 版本低于 18，需要安装 `node-fetch` 并修改 import。
