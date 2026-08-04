/**
 * AI 对话状态管理 (Zustand)
 * 支持内存即时渲染 + 后端异步持久化
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  fetchConversations,
  fetchConversationDetail,
  createConversation as createConversationAPI,
  deleteConversation as deleteConversationAPI,
  addMessage as addMessageAPI,
  type ConversationDTO,
  type MessageDTO,
} from '../services/conversationService';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  loading?: boolean;
  backendId?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  backendId?: number;
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

  // 后端同步操作
  loadConversations: (role: AIRole) => Promise<void>;
  loadMessages: (role: AIRole, conversationId: string) => Promise<void>;
  createAndSync: (role: AIRole) => Promise<string>;
  deleteAndSync: (role: AIRole, conversationId: string) => Promise<void>;
  syncMessageToBackend: (conversationId: string, role: AIRole, content: string, tokenCount?: number) => Promise<void>;

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

/**
 * 将后端 ConversationDTO 转换为内部 Conversation 格式
 */
function dtoToConversation(dto: ConversationDTO): Conversation {
  return {
    id: `backend-${dto.id}`,
    title: dto.title,
    messages: [],
    createdAt: new Date(dto.createdAt).getTime(),
    updatedAt: new Date(dto.updatedAt).getTime(),
    backendId: dto.id,
  };
}

/**
 * 将后端 MessageDTO 转换为内部 Message 格式
 */
function dtoToMessage(dto: MessageDTO): Message {
  return {
    id: `backend-msg-${dto.id}`,
    role: dto.role as Message['role'],
    content: dto.content,
    timestamp: new Date(dto.createdAt).getTime(),
    backendId: dto.id,
  };
}

export const useAIStore = create<AIStore>()(immer((set, get) => ({
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

  // ========== 后端同步操作 ==========

  /**
   * 从后端加载对话列表，过滤匹配当前 role 的对话
   */
  loadConversations: async (role) => {
    try {
      const dtos = await fetchConversations();
      const filtered = dtos.filter((dto) => dto.type === role);
      const conversations = filtered.map(dtoToConversation);

      set((draft) => {
        // 保留已有内存对话（未同步到后端的），合并后端数据
        const existingIds = new Set(conversations.map((c) => c.id));
        const localOnly = draft.conversations[role].filter(
          (c) => !c.backendId && !existingIds.has(c.id)
        );
        draft.conversations[role] = [...conversations, ...localOnly];
        // 如果当前没有活跃对话，自动选中第一个
        if (!draft.activeConversationId[role] && conversations.length > 0) {
          draft.activeConversationId[role] = conversations[0].id;
        }
      });
    } catch (error) {
      console.error('加载对话列表失败:', error);
    }
  },

  /**
   * 从后端加载指定对话的消息
   */
  loadMessages: async (role, conversationId) => {
    try {
      const state = get();
      const conv = state.conversations[role].find((c) => c.id === conversationId);
      if (!conv?.backendId) return;

      const detail = await fetchConversationDetail(conv.backendId);
      const messages = detail.messages.map(dtoToMessage);

      set((draft) => {
        const targetConv = draft.conversations[role].find((c) => c.id === conversationId);
        if (targetConv) {
          targetConv.messages = messages;
        }
      });
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  },

  /**
   * 创建对话并同步到后端，返回内存对话 ID
   */
  createAndSync: async (role) => {
    // 先在内存中创建（乐观更新）
    const memoryId = get().createConversation(role);

    try {
      const dto = await createConversation('新对话', role);
      // 将后端 ID 关联到内存对话
      set((draft) => {
        const conv = draft.conversations[role].find((c) => c.id === memoryId);
        if (conv) {
          conv.backendId = dto.id;
        }
      });
    } catch (error) {
      console.error('创建对话同步失败:', error);
      // 内存对话仍然保留，用户可以继续使用
    }

    return memoryId;
  },

  /**
   * 删除对话并同步到后端
   */
  deleteAndSync: async (role, conversationId) => {
    const state = get();
    const conv = state.conversations[role].find((c) => c.id === conversationId);
    const backendId = conv?.backendId;

    // 先在内存中删除（乐观更新）
    get().deleteConversation(role, conversationId);

    // 异步同步到后端
    if (backendId) {
      try {
        await deleteConversationAPI(backendId);
      } catch (error) {
        console.error('删除对话同步失败:', error);
      }
    }
  },

  /**
   * 将消息同步到后端
   */
  syncMessageToBackend: async (conversationId, role, content, tokenCount) => {
    const state = get();
    const conv = state.conversations[role].find((c) => c.id === conversationId);
    if (!conv?.backendId) return;

    try {
      await addMessageAPI(conv.backendId, role, content, tokenCount);
    } catch (error) {
      console.error('同步消息到后端失败', error);
    }
  },

  // UI状态
  sidebarCollapsed: false,
  toggleSidebar: () => set((draft) => { draft.sidebarCollapsed = !draft.sidebarCollapsed; }),
  isGenerating: false,
  setIsGenerating: (val) => set({ isGenerating: val }),
})));

export { ROLE_NAMES };
