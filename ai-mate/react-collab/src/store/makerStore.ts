/**
 * 工匠 Maker - Zustand 状态管理
 */

import { create } from 'zustand';
import {
  getContentPieces,
  getContentPiece,
  createContentPiece,
  updateContentPiece,
  getContentVersions,
  createContentVersion,
  getSpaces,
  createSpace,
  getSpace,
  ContentPiece,
  ContentVersion,
  Space,
} from '../services/makerService';

interface MakerStore {
  // 空间
  spaces: Space[];
  spacesLoading: boolean;
  fetchSpaces: () => Promise<void>;
  addSpace: (name: string, description?: string) => Promise<Space>;

  // 内容列表
  contentPieces: ContentPiece[];
  contentLoading: boolean;
  fetchContentPieces: (spaceId?: number) => Promise<void>;

  // 当前内容
  currentContent: ContentPiece | null;
  currentContentLoading: boolean;
  fetchContentPiece: (id: number) => Promise<void>;
  generateContent: (data: {
    spaceId?: number;
    type: ContentPiece['type'];
    productName: string;
    features: string;
    targetAudience: string;
  }) => Promise<ContentPiece>;
  saveContent: (id: number, data: Partial<Pick<ContentPiece, 'title' | 'content' | 'status'>>) => Promise<void>;

  // 版本
  versions: ContentVersion[];
  versionsLoading: boolean;
  fetchVersions: (contentPieceId: number) => Promise<void>;
  addVersion: (contentPieceId: number, content: string) => Promise<ContentVersion>;
}

export const useMakerStore = create<MakerStore>((set, get) => ({
  // ===== 空间 =====
  spaces: [],
  spacesLoading: false,

  fetchSpaces: async () => {
    set({ spacesLoading: true });
    try {
      const spaces = await getSpaces();
      set({ spaces });
    } catch (err) {
      console.error('获取空间列表失败:', err);
    } finally {
      set({ spacesLoading: false });
    }
  },

  addSpace: async (name, description) => {
    const space = await createSpace({ name, description });
    set((state) => ({ spaces: [space, ...state.spaces] }));
    return space;
  },

  // ===== 内容列表 =====
  contentPieces: [],
  contentLoading: false,

  fetchContentPieces: async (spaceId) => {
    set({ contentLoading: true });
    try {
      const pieces = await getContentPieces(spaceId);
      set({ contentPieces: pieces });
    } catch (err) {
      console.error('获取内容列表失败:', err);
    } finally {
      set({ contentLoading: false });
    }
  },

  // ===== 当前内容 =====
  currentContent: null,
  currentContentLoading: false,

  fetchContentPiece: async (id) => {
    set({ currentContentLoading: true });
    try {
      const content = await getContentPiece(id);
      set({ currentContent: content });
    } catch (err) {
      console.error('获取内容详情失败:', err);
    } finally {
      set({ currentContentLoading: false });
    }
  },

  generateContent: async (data) => {
    set({ currentContentLoading: true });
    try {
      const content = await createContentPiece(data);
      set((state) => ({
        currentContent: content,
        contentPieces: [content, ...state.contentPieces],
      }));
      return content;
    } finally {
      set({ currentContentLoading: false });
    }
  },

  saveContent: async (id, data) => {
    const updated = await updateContentPiece(id, data);
    set((state) => ({
      currentContent: updated,
      contentPieces: state.contentPieces.map((p) =>
        p.id === id ? updated : p
      ),
    }));
  },

  // ===== 版本 =====
  versions: [],
  versionsLoading: false,

  fetchVersions: async (contentPieceId) => {
    set({ versionsLoading: true });
    try {
      const versions = await getContentVersions(contentPieceId);
      set({ versions });
    } catch (err) {
      console.error('获取版本列表失败:', err);
    } finally {
      set({ versionsLoading: false });
    }
  },

  addVersion: async (contentPieceId, content) => {
    const version = await createContentVersion(contentPieceId, content);
    set((state) => ({
      versions: [version, ...state.versions],
    }));
    return version;
  },
}));
