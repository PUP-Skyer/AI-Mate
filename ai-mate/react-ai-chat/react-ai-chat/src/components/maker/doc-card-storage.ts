/**
 * 工匠AI - 3D文档卡片堆持久化
 * localStorage 键值对存储，遵循 proto-storage.ts / demo-storage.ts 模式
 */

/** 文档状态 */
export type DocStatus = 'draft' | 'review' | 'completed';

/** 单张文档卡片数据 */
export interface DocCardData {
  /** 唯一标识 */
  id: string;
  /** 文档标题 */
  title: string;
  /** 完成进度百分比 (0-100) */
  progress: number;
  /** 状态标签 */
  status: DocStatus;
  /** 文档 Markdown 内容（供详情面板展示） */
  content: string;
  /** 章节标题列表（供缩略纹理展示） */
  sections: string[];
  /** 创建时间戳 */
  createdAt: number;
  /** 更新时间戳 */
  updatedAt: number;
}

/** 文档卡片集合 */
export interface DocCardCollection {
  cards: DocCardData[];
  updatedAt: number;
}

/** localStorage key */
export const MAKER_DOC_CARDS_KEY = 'ai-mate-maker-doc-cards';

/** 最大卡片数量（FIFO 淘汰） */
const MAX_CARDS = 10;

/** 读取文档卡片；不存在或损坏返回空集合 */
export function loadDocCards(): DocCardCollection {
  try {
    const raw = localStorage.getItem(MAKER_DOC_CARDS_KEY);
    if (!raw) return { cards: [], updatedAt: 0 };
    const parsed = JSON.parse(raw) as DocCardCollection;
    if (!parsed || !Array.isArray(parsed.cards)) return { cards: [], updatedAt: 0 };
    return parsed;
  } catch {
    return { cards: [], updatedAt: 0 };
  }
}

/** 保存文档卡片（静默失败） */
export function saveDocCards(data: DocCardCollection): void {
  try {
    localStorage.setItem(MAKER_DOC_CARDS_KEY, JSON.stringify(data));
  } catch {
    // localStorage 不可用或超限时静默失败
  }
}

/** 添加单张卡片；超过 MAX_CARDS 时 FIFO 淘汰最早卡片 */
export function addDocCard(card: DocCardData): void {
  const collection = loadDocCards();
  const newCards = [...collection.cards, card];
  // FIFO 淘汰
  while (newCards.length > MAX_CARDS) {
    newCards.shift();
  }
  saveDocCards({ cards: newCards, updatedAt: Date.now() });
}

/** 删除指定卡片 */
export function removeDocCard(id: string): void {
  const collection = loadDocCards();
  saveDocCards({
    cards: collection.cards.filter((c) => c.id !== id),
    updatedAt: Date.now(),
  });
}

/** 更新指定卡片（部分更新） */
export function updateDocCard(id: string, partial: Partial<DocCardData>): void {
  const collection = loadDocCards();
  saveDocCards({
    cards: collection.cards.map((c) =>
      c.id === id ? { ...c, ...partial, updatedAt: Date.now() } : c
    ),
    updatedAt: Date.now(),
  });
}
