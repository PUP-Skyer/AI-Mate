/**
 * Sage（军师）AI 员工 - Zustand 状态管理
 */

import { create } from 'zustand';
import {
  SageDocument,
  SageSection,
  SageTemplate,
  ReviewResult,
  ReviewSuggestion,
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  generateSectionStream,
  submitReview,
  getReviewResult,
  acceptSuggestion,
  ignoreSuggestion,
  getPresetTemplates,
} from '../services/sageService';

interface SageStore {
  // ==================== 文档列表 ====================
  documents: SageDocument[];
  documentsLoading: boolean;
  fetchDocuments: () => Promise<void>;

  // ==================== 当前文档 ====================
  currentDocument: SageDocument | null;
  currentDocumentLoading: boolean;
  fetchDocument: (id: string) => Promise<void>;
  createNewDocument: (params: {
    title: string;
    type: string;
    templateId?: string;
  }) => Promise<SageDocument>;
  saveCurrentDocument: () => Promise<void>;
  removeDocument: (id: string) => Promise<void>;

  // ==================== 章节操作 ====================
  activeSectionId: string | null;
  setActiveSectionId: (id: string | null) => void;
  updateSectionContent: (sectionId: string, content: string) => void;

  // ==================== AI 生成 ====================
  generatingSectionId: string | null;
  generateSectionAI: (
    documentId: string,
    sectionId: string,
    context?: string
  ) => Promise<void>;

  // ==================== 模板 ====================
  templates: SageTemplate[];
  fetchTemplates: () => void;

  // ==================== AI 评审 ====================
  reviewResult: ReviewResult | null;
  reviewLoading: boolean;
  submitDocumentReview: (documentId: string) => Promise<void>;
  fetchReviewResult: (documentId: string) => Promise<void>;
  acceptReviewSuggestion: (
    documentId: string,
    suggestionId: string
  ) => Promise<void>;
  ignoreReviewSuggestion: (
    documentId: string,
    suggestionId: string
  ) => Promise<void>;

  // ==================== 文档标题 ====================
  updateDocumentTitle: (title: string) => void;
}

export const useSageStore = create<SageStore>((set, get) => ({
  // ==================== 文档列表 ====================
  documents: [],
  documentsLoading: false,

  fetchDocuments: async () => {
    set({ documentsLoading: true });
    try {
      const docs = await getDocuments();
      set({ documents: docs });
    } catch (err) {
      console.error('获取文档列表失败:', err);
    } finally {
      set({ documentsLoading: false });
    }
  },

  // ==================== 当前文档 ====================
  currentDocument: null,
  currentDocumentLoading: false,

  fetchDocument: async (id: string) => {
    set({ currentDocumentLoading: true });
    try {
      const doc = await getDocument(id);
      set({ currentDocument: doc });
      // 默认选中第一个章节
      if (doc.sections.length > 0 && !get().activeSectionId) {
        set({ activeSectionId: doc.sections[0].id });
      }
    } catch (err) {
      console.error('获取文档失败:', err);
    } finally {
      set({ currentDocumentLoading: false });
    }
  },

  createNewDocument: async (params) => {
    const doc = await createDocument(params);
    set((state) => ({
      documents: [doc, ...state.documents],
      currentDocument: doc,
      activeSectionId: doc.sections.length > 0 ? doc.sections[0].id : null,
    }));
    return doc;
  },

  saveCurrentDocument: async () => {
    const { currentDocument } = get();
    if (!currentDocument) return;

    const updated = await updateDocument(currentDocument.id, {
      title: currentDocument.title,
      sections: currentDocument.sections,
    });
    set({ currentDocument: updated });
  },

  removeDocument: async (id: string) => {
    await deleteDocument(id);
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      currentDocument:
        state.currentDocument?.id === id ? null : state.currentDocument,
    }));
  },

  // ==================== 章节操作 ====================
  activeSectionId: null,
  setActiveSectionId: (id) => set({ activeSectionId: id }),

  updateSectionContent: (sectionId, content) =>
    set((state) => {
      if (!state.currentDocument) return state;
      return {
        currentDocument: {
          ...state.currentDocument,
          sections: state.currentDocument.sections.map((s) =>
            s.id === sectionId ? { ...s, content, status: 'draft' as const } : s
          ),
        },
      };
    }),

  // ==================== AI 生成 ====================
  generatingSectionId: null,

  generateSectionAI: async (documentId, sectionId, context) => {
    set({ generatingSectionId: sectionId });
    try {
      const ctx = context || '请根据文档类型和章节标题生成专业内容。';
      await generateSectionStream(
        documentId,
        sectionId,
        ctx,
        (text) => {
          set((state) => {
            if (!state.currentDocument) return state;
            return {
              currentDocument: {
                ...state.currentDocument,
                sections: state.currentDocument.sections.map((s) =>
                  s.id === sectionId
                    ? { ...s, content: text, status: 'ai_generated' as const }
                    : s
                ),
              },
            };
          });
        }
      );
    } catch (err) {
      console.error('AI 生成失败:', err);
      throw err;
    } finally {
      set({ generatingSectionId: null });
    }
  },

  // ==================== 模板 ====================
  templates: [],

  fetchTemplates: () => {
    set({ templates: getPresetTemplates() });
  },

  // ==================== AI 评审 ====================
  reviewResult: null,
  reviewLoading: false,

  submitDocumentReview: async (documentId: string) => {
    set({ reviewLoading: true, reviewResult: null });
    try {
      await submitReview(documentId);
      // 提交后轮询获取结果
      let attempts = 0;
      const maxAttempts = 30;
      const poll = async () => {
        attempts++;
        try {
          const result = await getReviewResult(documentId);
          set({ reviewResult: result, reviewLoading: false });
          return;
        } catch {
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000);
          } else {
            set({ reviewLoading: false });
            throw new Error('评审超时，请稍后重试');
          }
        }
      };
      setTimeout(poll, 2000);
    } catch (err) {
      set({ reviewLoading: false });
      throw err;
    }
  },

  fetchReviewResult: async (documentId: string) => {
    set({ reviewLoading: true });
    try {
      const result = await getReviewResult(documentId);
      set({ reviewResult: result });
    } catch (err) {
      console.error('获取评审结果失败:', err);
    } finally {
      set({ reviewLoading: false });
    }
  },

  acceptReviewSuggestion: async (documentId, suggestionId) => {
    await acceptSuggestion(documentId, suggestionId);
    set((state) => {
      if (!state.reviewResult) return state;
      return {
        reviewResult: {
          ...state.reviewResult,
          suggestions: state.reviewResult.suggestions.map((s) =>
            s.id === suggestionId ? { ...s, accepted: true } : s
          ),
        },
      };
    });
  },

  ignoreReviewSuggestion: async (documentId, suggestionId) => {
    await ignoreSuggestion(documentId, suggestionId);
    set((state) => {
      if (!state.reviewResult) return state;
      return {
        reviewResult: {
          ...state.reviewResult,
          suggestions: state.reviewResult.suggestions.filter(
            (s) => s.id !== suggestionId
          ),
        },
      };
    });
  },

  // ==================== 文档标题 ====================
  updateDocumentTitle: (title) =>
    set((state) => {
      if (!state.currentDocument) return state;
      return {
        currentDocument: { ...state.currentDocument, title },
      };
    }),
}));
