/**
 * AI 创业政策领域类型
 * 级别四类与 3D 看板 PolicyCountCard 的 Tag（国家级/省部级/地市级/行业规范）保持一致
 */

export type PolicyLevel = '国家级' | '省部级' | '地市级' | '行业规范';

export type PolicyStatus = '进行中' | '即将截止' | '已结束';

/** 链接（扶持政策链接 / 单位官网 共用结构） */
export interface PolicyLink {
  id: string;
  label: string;          // 链接展示名
  url: string;            // 外链地址
  category: 'support' | 'official';
  source: string;         // 来源单位名
}

export interface PolicySection {
  id: string;
  heading: string;
  type: 'text' | 'points';
  content?: string;
  points?: string[];
}

export interface AIPolicy {
  id: string;             // PL-2026-0001
  title: string;
  level: PolicyLevel;
  department: string;     // 发布单位
  publishedAt: string;    // 2026-07-28（完整时间戳）
  deadline?: string;      // 申报截止
  supportType: string;    // 补贴类型：算力券 / 税收优惠 / 贴息贷款 …
  amount?: string;        // 支持力度
  status: PolicyStatus;
  summary: string;
  keywords: string[];
  sections: PolicySection[];
  supportLinks: PolicyLink[];   // 该政策关联的扶持政策链接
  officialLinks: PolicyLink[];  // 该政策关联的单位官网
  relatedIds: string[];
}

export interface PolicyStats {
  total: number;          // 386（与 3D 卡片一致）
  weeklyNew: number;
  activeCount: number;    // 申报中
  orgCount: number;       // 覆盖单位
}

export const POLICY_LEVEL_COLORS: Record<PolicyLevel, string> = {
  国家级: '#6b4c9a',
  省部级: '#1677ff',
  地市级: '#13c2c2',
  行业规范: '#fa8c16',
};

/** 列表页滚动锚点 + 详情页相关跳转索引（由页面容器注入） */
declare global {
  interface Window {
    __AI_POLICY_SCROLL_TO__?: 'support' | 'official';
    __AP_POLICIES__?: Record<string, AIPolicy>;
  }
}
