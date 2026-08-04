/**
 * 行业报告页面领域类型
 */

export type ReportCategory =
  | '人工智能'
  | '新能源'
  | '智慧餐饮'
  | '智能制造'
  | '生物医药'
  | '金融科技'
  | '跨境电商';

export interface ReportStats {
  total: number; // 12,847（与 3D 卡片一致）
  weeklyNew: number; // 342
  dailyAvg: number; // 48
  institutionCount: number; // 1,204
}

export type ReportChartKind = 'trend' | 'donut';

export interface ReportChartSeries {
  name: string;
  value: number;
  color?: string;
}

export interface ReportChart {
  kind: ReportChartKind;
  title: string;
  series: ReportChartSeries[];
}

export interface ReportSection {
  id: string;
  heading: string;
  type: string; // 'text' | 'points'
  content?: string;
  points?: string[];
}

export interface IndustryReport {
  id: string; // RP-2026-0001
  title: string;
  category: ReportCategory;
  institution: string;
  author?: string;
  publishedAt: string;
  pageCount: number;
  readCount: number;
  heatIndex: number; // 0-100
  favoriteCount: number;
  summary: string;
  keywords: string[];
  sections: ReportSection[];
  chart?: ReportChart;
  relatedIds: string[];
}
