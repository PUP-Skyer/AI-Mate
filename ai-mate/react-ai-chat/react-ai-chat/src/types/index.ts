/**
 * 全局类型定义
 */

export type AIRole = 'scout' | 'sage' | 'maker' | 'butler';

export type AppPage =
  | 'ai-scout'
  | 'ai-sage'
  | 'ai-maker'
  | 'ai-butler'
  | 'new-conversation'
  | 'skill-library'
  | 'mcp-config'
  | 'automation'
  | 'knowledge-vault'
  | 'app-center'
  | 'usage-stats'
  | 'industry-report'
  | 'ai-policy'
  | 'industry-data';

export const AI_ROLE_PAGES: AppPage[] = ['ai-scout', 'ai-sage', 'ai-maker', 'ai-butler'];

export const ROLE_NAMES: Record<AIRole, string> = {
  scout: '探路者AI',
  sage: '军师AI',
  maker: '工匠AI',
  butler: '管家AI',
};

export const ROLE_ICONS: Record<AIRole, string> = {
  scout: 'SearchOutlined',
  sage: 'BulbOutlined',
  maker: 'ToolOutlined',
  butler: 'CustomerServiceOutlined',
};

export const PAGE_TO_ROLE: Record<string, AIRole> = {
  'ai-scout': 'scout',
  'ai-sage': 'sage',
  'ai-maker': 'maker',
  'ai-butler': 'butler',
};

export const ROLE_TO_PAGE: Record<AIRole, AppPage> = {
  scout: 'ai-scout',
  sage: 'ai-sage',
  maker: 'ai-maker',
  butler: 'ai-butler',
};

// ============ Skill 类型 ============

export type SkillCategory =
  | 'marketing'
  | 'analysis'
  | 'writing'
  | 'coding'
  | 'knowledge'
  | 'office'
  | 'design'
  | 'finance'
  | 'product'
  | 'automation'
  | 'custom';

export interface AutoTrigger {
  id: string;
  type: 'keyword' | 'intent' | 'regex';
  condition: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  tags: string[];
  promptTemplate: string;
  triggerCommand: string;
  autoTriggers: AutoTrigger[];
  isEnabled: boolean;
  usageCount: number;
  createdAt: number;
  updatedAt: number;
}

// ============ MCP 类型 ============

export type MCPTransport = 'stdio' | 'sse';
export type MCPStatus = 'connected' | 'disconnected' | 'error' | 'connecting';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: unknown;
}

export interface MCPServer {
  id: string;
  name: string;
  transport: MCPTransport;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  status: MCPStatus;
  tools: MCPTool[];
  configJson: string;
  createdAt: number;
  updatedAt: number;
}

// ============ 自动化类型 ============

export type TriggerType =
  | 'message-keyword'
  | 'conversation-start'
  | 'mcp-result'
  | 'schedule'
  | 'hook';

export type ActionType =
  | 'send-message'
  | 'invoke-skill'
  | 'invoke-mcp'
  | 'switch-role'
  | 'set-variable';

export interface AutomationAction {
  id: string;
  type: ActionType;
  config: Record<string, unknown>;
}

export interface TriggerConfig {
  type: TriggerType;
  config: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  trigger: TriggerConfig;
  actions: AutomationAction[];
  maxIterations: number;
  runMode: 'sequential' | 'parallel';
  createdAt: number;
  updatedAt: number;
}

export interface ExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  status: 'success' | 'failed' | 'running';
  message: string;
  executedAt: number;
}

// ============ 用户与设置类型 ============

export type UserTier = 'free' | 'pro';

export interface UserInfo {
  id: string;
  nickname: string;
  avatar?: string;
  phone: string;
  tier: UserTier;
  tierLabel: string;
  quickPassCount: number;
}

export type ThemeType = 'light' | 'dark';
export type LanguageType = 'zh-CN' | 'en';

export interface AppSettings {
  theme: ThemeType;
  language: LanguageType;
  privacyMode: boolean;
  notificationsEnabled: boolean;
}

// ============ 模型配置类型 ============

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  modelId?: string;
  baseUrl?: string;
  contextWindowInput?: number;
  contextWindowOutput?: number;
  toolCallRounds?: number;
  multimodal: boolean;
  isCustom: boolean;
  isEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export type SettingsTab = 'account' | 'general' | 'model';

// 预设模型列表（火山方舟 Agent Plan 套餐内模型）

export const PRESET_MODELS = [
  { name: 'doubao-seed-2.0-lite', provider: '火山方舟', modelId: 'doubao-seed-2.0-lite', baseUrl: 'https://ark.cn-beijing.volces.com/api/plan/v3', multimodal: true },
  { name: 'doubao-seed-2.0-mini', provider: '火山方舟', modelId: 'doubao-seed-2.0-mini', baseUrl: 'https://ark.cn-beijing.volces.com/api/plan/v3', multimodal: false },
  { name: 'doubao-seed-2.0-pro', provider: '火山方舟', modelId: 'doubao-seed-2.0-pro', baseUrl: 'https://ark.cn-beijing.volces.com/api/plan/v3', multimodal: false },
  { name: 'doubao-seed-2.0-code', provider: '火山方舟', modelId: 'doubao-seed-2.0-code', baseUrl: 'https://ark.cn-beijing.volces.com/api/plan/v3', multimodal: false },
  { name: 'deepseek-v4-pro', provider: '火山方舟', modelId: 'deepseek-v4-pro', baseUrl: 'https://ark.cn-beijing.volces.com/api/plan/v3', multimodal: false },
  { name: 'deepseek-v4-flash', provider: '火山方舟', modelId: 'deepseek-v4-flash', baseUrl: 'https://ark.cn-beijing.volces.com/api/plan/v3', multimodal: false },
  { name: 'kimi-k2.6', provider: '火山方舟', modelId: 'kimi-k2.6', baseUrl: 'https://ark.cn-beijing.volces.com/api/plan/v3', multimodal: false },
  { name: 'kimi-k2.7-code', provider: '火山方舟', modelId: 'kimi-k2.7-code', baseUrl: 'https://ark.cn-beijing.volces.com/api/plan/v3', multimodal: false },
  { name: 'glm-5.2', provider: '火山方舟', modelId: 'glm-5.2', baseUrl: 'https://ark.cn-beijing.volces.com/api/plan/v3', multimodal: false },
  { name: 'minimax-m2.7', provider: '火山方舟', modelId: 'minimax-m2.7', baseUrl: 'https://ark.cn-beijing.volces.com/api/plan/v3', multimodal: false },
  { name: 'minimax-m3', provider: '火山方舟', modelId: 'minimax-m3', baseUrl: 'https://ark.cn-beijing.volces.com/api/plan/v3', multimodal: false },
];
