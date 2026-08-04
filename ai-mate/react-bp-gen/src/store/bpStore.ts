import { create } from 'zustand';
import { getTemplates, ApiTemplate } from '../services/api';

interface BPTemplate {
  id: string;
  title: string;
  industry: string;
  cover: string;
  description: string;
}

interface BPChapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface BPStore {
  // 模板相关
  templates: BPTemplate[];
  selectedTemplate: BPTemplate | null;
  setSelectedTemplate: (template: BPTemplate | null) => void;
  fetchTemplates: () => Promise<void>;
  loading: boolean;

  // 编辑相关
  chapters: BPChapter[];
  activeChapterId: string | null;
  setActiveChapterId: (id: string | null) => void;
  updateChapterContent: (id: string, content: string) => void;

  // BP 信息
  bpTitle: string;
  setBpTitle: (title: string) => void;

  // AI 生成状态
  generatingChapterId: string | null;
  setGeneratingChapterId: (id: string | null) => void;
}

export const useBPStore = create<BPStore>((set, get) => ({
  templates: [],
  selectedTemplate: null,
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  loading: false,

  fetchTemplates: async () => {
    set({ loading: true });
    try {
      const apiTemplates = await getTemplates('business_plan');
      const templates: BPTemplate[] = apiTemplates.map((t: ApiTemplate) => ({
        id: String(t.id),
        title: t.name,
        industry: t.category || '通用',
        cover: t.icon || '',
        description: t.description || '',
      }));
      set({ templates });
    } catch (err) {
      console.error('获取模板失败:', err);
      // 回退到默认模板
      set({
        templates: [
          { id: '1', title: '互联网科技BP模板', industry: '互联网', cover: '', description: '适用于互联网创业项目的商业计划书模板' },
          { id: '2', title: '餐饮连锁BP模板', industry: '餐饮', cover: '', description: '适用于餐饮连锁品牌的商业计划书模板' },
          { id: '3', title: '教育培训BP模板', industry: '教育', cover: '', description: '适用于教育培训机构的商业计划书模板' },
          { id: '4', title: '医疗健康BP模板', industry: '医疗', cover: '', description: '适用于医疗健康领域的商业计划书模板' },
          { id: '5', title: '新能源BP模板', industry: '新能源', cover: '', description: '适用于新能源行业的商业计划书模板' },
          { id: '6', title: '电商零售BP模板', industry: '电商', cover: '', description: '适用于电商零售领域的商业计划书模板' },
        ],
      });
    } finally {
      set({ loading: false });
    }
  },

  chapters: [
    { id: 'ch1', title: '执行摘要', content: '', order: 1 },
    { id: 'ch2', title: '市场分析', content: '', order: 2 },
    { id: 'ch3', title: '产品与服务', content: '', order: 3 },
    { id: 'ch4', title: '商业模式', content: '', order: 4 },
    { id: 'ch5', title: '团队介绍', content: '', order: 5 },
    { id: 'ch6', title: '财务预测', content: '', order: 6 },
    { id: 'ch7', title: '融资计划', content: '', order: 7 },
  ],
  activeChapterId: null,
  setActiveChapterId: (id) => set({ activeChapterId: id }),
  updateChapterContent: (id, content) =>
    set((state) => ({
      chapters: state.chapters.map((ch) => (ch.id === id ? { ...ch, content } : ch)),
    })),

  bpTitle: '未命名商业计划书',
  setBpTitle: (title) => set({ bpTitle: title }),

  generatingChapterId: null,
  setGeneratingChapterId: (id) => set({ generatingChapterId: id }),
}));
