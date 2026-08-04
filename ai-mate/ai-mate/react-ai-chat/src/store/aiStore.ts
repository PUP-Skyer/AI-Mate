/**
 * AI 对话状态管理 (Zustand)
 */

import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  loading?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type AIRole = 'scout' | 'sage' | 'maker' | 'butler';

interface AIStore {
  // 当前角色
  currentRole: AIRole;
  setCurrentRole: (role: AIRole) => void;

  // 对话列表
  conversations: Record<AIRole, Conversation[]>;
  activeConversationId: Record<AIRole, string | null>;

  // 消息操作
  addMessage: (role: AIRole, message: Message) => void;
  updateMessage: (role: AIRole, conversationId: string, messageId: string, content: string) => void;
  clearMessages: (role: AIRole) => void;

  // 对话操作
  createConversation: (role: AIRole) => string;
  deleteConversation: (role: AIRole, conversationId: string) => void;
  setActiveConversation: (role: AIRole, conversationId: string | null) => void;

  // UI状态
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const ROLE_NAMES: Record<AIRole, string> = {
  scout: '探路者AI',
  sage: '军师AI',
  maker: '工匠AI',
  butler: '管家AI',
};

export const useAIStore = create<AIStore>((set, get) => ({
  // 当前角色
  currentRole: 'scout',
  setCurrentRole: (role) => set({ currentRole: role }),

  // 对话列表
  conversations: {
    scout: [],
    sage: [],
    maker: [],
    butler: [],
  },
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

    set((draft) => {
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
    });
  },

  // 更新消息（用于流式输出）
  updateMessage: (role, conversationId, messageId, content) => {
    set((draft) => {
      const conv = draft.conversations[role].find((c) => c.id === conversationId);
      if (conv) {
        const msg = conv.messages.find((m) => m.id === messageId);
        if (msg) {
          msg.content = content;
          msg.loading = false;
        }
      }
    });
  },

  // 清空消息
  clearMessages: (role) => {
    const convId = get().activeConversationId[role];
    if (!convId) return;
    set((draft) => {
      const conv = draft.conversations[role].find((c) => c.id === convId);
      if (conv) {
        conv.messages = [];
        conv.updatedAt = Date.now();
      }
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
    set((draft) => {
      draft.conversations[role].unshift(newConv);
      draft.activeConversationId[role] = id;
    });
    return id;
  },

  // 删除对话
  deleteConversation: (role, conversationId) => {
    set((draft) => {
      draft.conversations[role] = draft.conversations[role].filter(
        (c) => c.id !== conversationId
      );
      if (draft.activeConversationId[role] === conversationId) {
        draft.activeConversationId[role] = draft.conversations[role][0]?.id || null;
      }
    });
  },

  // 设置活跃对话
  setActiveConversation: (role, conversationId) => {
    set((draft) => {
      draft.activeConversationId[role] = conversationId;
    });
  },

  // UI状态
  sidebarCollapsed: false,
  toggleSidebar: () => set((draft) => ({ sidebarCollapsed: !draft.sidebarCollapsed })),
  isGenerating: false,
  setIsGenerating: (val) => set({ isGenerating: val }),
}));

export { ROLE_NAMES };
