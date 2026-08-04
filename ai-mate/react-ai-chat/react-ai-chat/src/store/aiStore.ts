/**
 * AI 对话状态管理 (Zustand)
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { WritableDraft } from 'immer';
import type { AppPage, AIRole, UserInfo, AppSettings, ModelConfig, SettingsTab } from '../types';
import { PAGE_TO_ROLE, ROLE_TO_PAGE, ROLE_NAMES } from '../types';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  images?: string[];
  timestamp: number;
  loading?: boolean;
  /** 工具调用元数据（role=assistant 且触发工具时） */
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: string;
    status?: 'pending' | 'running' | 'success' | 'error';
    result?: string;
  }>;
  /** 工具结果消息（role=tool 时，关联的 tool_call_id） */
  toolCallId?: string;
  toolName?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type { AIRole, AppPage };
export { ROLE_NAMES };

interface AIStore {
  // 当前页面（导航状态）
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;

  // 当前角色（始终记录活跃 AI 角色，即使当前在功能页）
  currentRole: AIRole;
  setCurrentRole: (role: AIRole) => void;

  // 对话列表
  conversations: Record<AIRole, Conversation[]>;
  activeConversationId: Record<AIRole, string | null>;

  // 消息操作
  addMessage: (role: AIRole, message: Message) => void;
  updateMessage: (role: AIRole, conversationId: string, messageId: string, content: string) => void;
  /** 更新消息内容与元数据（含工具调用状态），不强制关闭 loading */
  updateMessageMeta: (role: AIRole, conversationId: string, messageId: string, patch: Partial<Message>) => void;
  /** 更新消息内单个工具调用的状态与结果 */
  updateToolCall: (role: AIRole, conversationId: string, messageId: string, toolCallId: string, patch: { status?: 'pending' | 'running' | 'success' | 'error'; result?: string }) => void;
  clearMessages: (role: AIRole) => void;

  // 对话操作
  createConversation: (role: AIRole) => string;
  deleteConversation: (role: AIRole, conversationId: string) => void;
  setActiveConversation: (role: AIRole, conversationId: string | null) => void;

  // 快捷操作
  newConversationShortcut: () => void;

  // UI状态
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;

  activeModelId: string | null;
  setActiveModelId: (id: string | null) => void;

  // 用户与设置
  userInfo: UserInfo;
  setUserInfo: (patch: Partial<UserInfo>) => void;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  settingsDrawerOpen: boolean;
  toggleSettingsDrawer: (val?: boolean) => void;
  settingsTab: SettingsTab;
  setSettingsTab: (tab: SettingsTab) => void;
  logout: () => void;

  // 模型配置
  modelConfigs: ModelConfig[];
  addModelConfig: (config: Omit<ModelConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateModelConfig: (id: string, patch: Partial<ModelConfig>) => void;
  deleteModelConfig: (id: string) => void;
  toggleModelConfig: (id: string) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const SETTINGS_KEY = 'ai-mate-settings';
const MODEL_CONFIGS_KEY = 'ai-mate-model-configs';
const CONVERSATIONS_KEY = 'ai-mate-conversations-v1';

const defaultSettings: AppSettings = {
  theme: 'light',
  language: 'zh-CN',
  privacyMode: false,
  notificationsEnabled: true,
};

// ========== 对话持久化 ==========

const EMPTY_CONVERSATIONS: Record<AIRole, Conversation[]> = {
  scout: [],
  sage: [],
  maker: [],
  butler: [],
};

const loadConversations = (): Record<AIRole, Conversation[]> => {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return EMPTY_CONVERSATIONS;
    const parsed = JSON.parse(raw);
    // 兼容性校验：仅保留合法的四个角色键
    const result = { ...EMPTY_CONVERSATIONS };
    for (const role of Object.keys(result) as AIRole[]) {
      if (Array.isArray(parsed?.[role])) {
        result[role] = parsed[role];
      }
    }
    return result;
  } catch {
    return EMPTY_CONVERSATIONS;
  }
};

const persistConversations = (conversations: Record<AIRole, Conversation[]>) => {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch {
    // localStorage 容量超限或不可用时静默失败
  }
};

// 清理历史加载的对话（去掉过期/损坏条目）
const sanitizeConversations = (conversations: Record<AIRole, Conversation[]>): Record<AIRole, Conversation[]> => {
  const result = { ...EMPTY_CONVERSATIONS };
  for (const role of Object.keys(result) as AIRole[]) {
    result[role] = (conversations[role] || [])
      .filter((c) => c && typeof c.id === 'string' && Array.isArray(c.messages))
      .map((c) => ({
        ...c,
        messages: c.messages.filter((m) => m && typeof m.id === 'string'),
      }));
  }
  return result;
};

const loadModelConfigs = (): ModelConfig[] => {
  try {
    const raw = localStorage.getItem(MODEL_CONFIGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const loadSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

export const useAIStore = create<AIStore>()(
  immer<AIStore>((set, get) => ({
  // 当前页面
  currentPage: 'ai-scout',
  setCurrentPage: (page) => {
    const role = PAGE_TO_ROLE[page];
    if (role) {
      set({ currentPage: page, currentRole: role });
    } else {
      set({ currentPage: page });
    }
  },

  // 当前角色
  currentRole: 'scout',
  setCurrentRole: (role) => set({ currentRole: role }),

  // 对话列表（从 localStorage 恢复，刷新不丢失）
  conversations: loadConversations(),
  activeConversationId: {
    scout: null,
    sage: null,
    maker: null,
    butler: null,
  },

  // 添加消息
  addMessage: (role, message) => {
    const state = get();
    let convId = state.activeConversationId[role];

    // 如果没有活跃对话，自动创建一个
    if (!convId) {
      convId = get().createConversation(role);
    }

    set((draft: WritableDraft<AIStore>) => {
      const convs = draft.conversations[role];
      const conv = convs.find((c) => c.id === convId);
      if (conv) {
        conv.messages.push(message);
        conv.updatedAt = Date.now();
        // 自动更新标题（取第一条用户消息）
        if (conv.title === '新对话' && message.role === 'user') {
          conv.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
        }
      }
      persistConversations(sanitizeConversations(draft.conversations));
    });
  },

  // 更新消息（用于流式输出）
  updateMessage: (role, conversationId, messageId, content) => {
    set((draft: WritableDraft<AIStore>) => {
      const conv = draft.conversations[role].find((c) => c.id === conversationId);
      if (conv) {
        const msg = conv.messages.find((m) => m.id === messageId);
        if (msg) {
          msg.content = content;
          msg.loading = false;
        }
      }
      persistConversations(sanitizeConversations(draft.conversations));
    });
  },

  // 更新消息内容与元数据（流式 / 工具状态），不强制关闭 loading
  updateMessageMeta: (role, conversationId, messageId, patch) => {
    set((draft: WritableDraft<AIStore>) => {
      const conv = draft.conversations[role].find((c) => c.id === conversationId);
      if (conv) {
        const msg = conv.messages.find((m) => m.id === messageId);
        if (msg) {
          Object.assign(msg, patch);
        }
      }
      persistConversations(sanitizeConversations(draft.conversations));
    });
  },

  // 更新消息内单个工具调用的状态与结果
  updateToolCall: (role, conversationId, messageId, toolCallId, patch) => {
    set((draft: WritableDraft<AIStore>) => {
      const conv = draft.conversations[role].find((c) => c.id === conversationId);
      const msg = conv?.messages.find((m) => m.id === messageId);
      const tc = msg?.toolCalls?.find((t) => t.id === toolCallId);
      if (tc) {
        Object.assign(tc, patch);
      }
      persistConversations(sanitizeConversations(draft.conversations));
    });
  },

  // 清空消息
  clearMessages: (role) => {
    const convId = get().activeConversationId[role];
    if (!convId) return;
    set((draft: WritableDraft<AIStore>) => {
      const conv = draft.conversations[role].find((c) => c.id === convId);
      if (conv) {
        conv.messages = [];
        conv.updatedAt = Date.now();
      }
      persistConversations(sanitizeConversations(draft.conversations));
    });
  },

  // 创建新对话
  createConversation: (role) => {
    const id = generateId();
    const newConv: Conversation = {
      id,
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((draft: WritableDraft<AIStore>) => {
      draft.conversations[role].unshift(newConv);
      draft.activeConversationId[role] = id;
      persistConversations(sanitizeConversations(draft.conversations));
    });
    return id;
  },

  // 删除对话
  deleteConversation: (role, conversationId) => {
    set((draft: WritableDraft<AIStore>) => {
      draft.conversations[role] = draft.conversations[role].filter(
        (c) => c.id !== conversationId
      );
      if (draft.activeConversationId[role] === conversationId) {
        draft.activeConversationId[role] = draft.conversations[role][0]?.id || null;
      }
      persistConversations(sanitizeConversations(draft.conversations));
    });
  },

  // 设置活跃对话
  setActiveConversation: (role, conversationId) => {
    set((draft: WritableDraft<AIStore>) => {
      draft.activeConversationId[role] = conversationId;
    });
  },

  // 快捷操作：新对话
  newConversationShortcut: () => {
    const state = get();
    const role = state.currentRole;
    const page = ROLE_TO_PAGE[role];
    const id = generateId();
    const newConv: Conversation = {
      id,
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set({
      currentPage: page,
      currentRole: role,
      conversations: {
        ...state.conversations,
        [role]: [newConv, ...state.conversations[role]],
      },
      activeConversationId: {
        ...state.activeConversationId,
        [role]: id,
      },
    });
    persistConversations(sanitizeConversations(get().conversations));
  },

  // UI状态
  sidebarCollapsed: false,
  toggleSidebar: () => set((draft: WritableDraft<AIStore>) => { draft.sidebarCollapsed = !draft.sidebarCollapsed; }),
  isGenerating: false,
  setIsGenerating: (val) => set({ isGenerating: val }),

  activeModelId: null,
  setActiveModelId: (id) => set({ activeModelId: id }),

  // 用户与设置
  userInfo: {
    id: 'user-88062778542',
    nickname: '用户88062778542',
    phone: '13800138000',
    tier: 'free',
    tierLabel: '免费',
    quickPassCount: 0,
  },
  setUserInfo: (patch) => {
    set((draft: WritableDraft<AIStore>) => {
      Object.assign(draft.userInfo, patch);
    });
  },
  settings: loadSettings(),
  updateSettings: (patch) => {
    set((draft: WritableDraft<AIStore>) => {
      Object.assign(draft.settings, patch);
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(draft.settings));
      } catch {}
    });
  },
  settingsDrawerOpen: false,
  toggleSettingsDrawer: (val) => {
    const next = val !== undefined ? val : !get().settingsDrawerOpen;
    set({ settingsDrawerOpen: next });
  },
  logout: () => {
    localStorage.removeItem('ai_mate_token');
    localStorage.removeItem(SETTINGS_KEY);
    window.location.reload();
  },

  // 设置标签页
  settingsTab: 'account',
  setSettingsTab: (tab) => set({ settingsTab: tab }),

  // 模型配置
  modelConfigs: loadModelConfigs(),
  addModelConfig: (config) => {
    set((draft: WritableDraft<AIStore>) => {
      const newConfig: ModelConfig = {
        ...config,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      draft.modelConfigs.push(newConfig);
      try {
        localStorage.setItem(MODEL_CONFIGS_KEY, JSON.stringify(draft.modelConfigs));
      } catch {}
    });
  },
  updateModelConfig: (id, patch) => {
    set((draft: WritableDraft<AIStore>) => {
      const config = draft.modelConfigs.find((c) => c.id === id);
      if (config) {
        Object.assign(config, patch, { updatedAt: Date.now() });
        try {
          localStorage.setItem(MODEL_CONFIGS_KEY, JSON.stringify(draft.modelConfigs));
        } catch {}
      }
    });
  },
  deleteModelConfig: (id) => {
    set((draft: WritableDraft<AIStore>) => {
      draft.modelConfigs = draft.modelConfigs.filter((c) => c.id !== id);
      try {
        localStorage.setItem(MODEL_CONFIGS_KEY, JSON.stringify(draft.modelConfigs));
      } catch {}
    });
  },
  toggleModelConfig: (id) => {
    set((draft: WritableDraft<AIStore>) => {
      const config = draft.modelConfigs.find((c) => c.id === id);
      if (config) {
        config.isEnabled = !config.isEnabled;
        config.updatedAt = Date.now();
        try {
          localStorage.setItem(MODEL_CONFIGS_KEY, JSON.stringify(draft.modelConfigs));
        } catch {}
      }
    });
  },
})));
