/**
 * 军师AI - 融资阶段3D卡片堆持久化
 * 参照 doc-card-storage.ts 模式，适配融资阶段数据
 * localStorage 键值对存储
 */

import type { FinancingStage } from './finance-utils';

/** 融资阶段卡片数据 (FinancingStage 的展示包装) */
export interface FinancingCardData {
  /** 唯一标识 (复用 FinancingStage.id) */
  id: string;
  /** 关联项目名称 */
  projectName: string;
  // === 核心阶段数据 (镜像 FinancingStage) ===
  /** 第几年 (1, 2, 3...) */
  year: number;
  /** 轮次名称：种子轮、天使轮、Pre-A轮 */
  roundName: string;
  /** 目标融资金额（万元） */
  targetAmount: number;
  /** 出让股权比例 % */
  equityOffered: number;
  /** 预期估值（万元） */
  valuation: number;
  /** 时间段：如 "2026年Q1-Q2" */
  timeline: string;
  /** 里程碑列表 */
  milestones: string[];
  // === 卡片元数据 ===
  /** 保存时间戳 */
  savedAt: number;
}

/** 卡片集合 */
export interface FinancingCardCollection {
  cards: FinancingCardData[];
  updatedAt: number;
}

/** localStorage key */
export const SAGE_FINANCING_CARDS_KEY = 'ai-mate-sage-financing-cards';

/** 最大卡片数量（FIFO 淘汰） */
const MAX_CARDS = 10;

/** 读取融资阶段卡片；不存在或损坏返回空集合 */
export function loadFinancingCards(): FinancingCardCollection {
  try {
    const raw = localStorage.getItem(SAGE_FINANCING_CARDS_KEY);
    if (!raw) return { cards: [], updatedAt: 0 };
    const parsed = JSON.parse(raw) as FinancingCardCollection;
    if (!parsed || !Array.isArray(parsed.cards)) return { cards: [], updatedAt: 0 };
    return parsed;
  } catch {
    return { cards: [], updatedAt: 0 };
  }
}

/** 保存融资阶段卡片（静默失败） */
export function saveFinancingCards(data: FinancingCardCollection): void {
  try {
    localStorage.setItem(SAGE_FINANCING_CARDS_KEY, JSON.stringify(data));
  } catch {
    // localStorage 不可用或超限时静默失败
  }
}

/** 添加单张卡片；超过 MAX_CARDS 时 FIFO 淘汰最早卡片 */
export function addFinancingCard(card: FinancingCardData): void {
  const collection = loadFinancingCards();
  const newCards = [...collection.cards, card];
  while (newCards.length > MAX_CARDS) {
    newCards.shift();
  }
  saveFinancingCards({ cards: newCards, updatedAt: Date.now() });
}

/** 批量添加卡片（生成融资规划后一次性写入） */
export function addFinancingCards(cards: FinancingCardData[]): void {
  const collection = loadFinancingCards();
  const newCards = [...collection.cards, ...cards];
  while (newCards.length > MAX_CARDS) {
    newCards.shift();
  }
  saveFinancingCards({ cards: newCards, updatedAt: Date.now() });
}

/** 删除指定卡片 */
export function removeFinancingCard(id: string): void {
  const collection = loadFinancingCards();
  saveFinancingCards({
    cards: collection.cards.filter((c) => c.id !== id),
    updatedAt: Date.now(),
  });
}

/** 清空全部卡片 */
export function clearFinancingCards(): void {
  saveFinancingCards({ cards: [], updatedAt: Date.now() });
}

/** 将 FinancingStage 转换为 FinancingCardData */
export function stageToCard(
  stage: FinancingStage,
  projectName: string
): FinancingCardData {
  return {
    id: stage.id,
    projectName,
    year: stage.year,
    roundName: stage.roundName,
    targetAmount: stage.targetAmount,
    equityOffered: stage.equityOffered,
    valuation: stage.valuation,
    timeline: stage.timeline,
    milestones: stage.milestones,
    savedAt: Date.now(),
  };
}
