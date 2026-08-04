/**
 * 行业数据查询领域类型
 */

export type IndustryName =
  | '人工智能'
  | '新能源'
  | '智慧餐饮'
  | '智能制造'
  | '生物医药'
  | '金融科技'
  | '跨境电商';

export interface IndustryReportItem {
  id: string;
  title: string;
  institution: string;
  publishedAt: string;
  url: string;
}

export interface IndustryChart {
  kind: 'trend';
  title: string;
  series: { name: string; values: number[] }[];
}

export interface IndustryDatum {
  industry: IndustryName;
  color: string;
  marketSize: string;
  growthRate: number;
  reportCount: number;
  hotIndex: number;
  dataPoints: Record<string, number>;
  charts: IndustryChart[];
  reports: IndustryReportItem[];
  sources: string[];
}

export interface IndustryDataResponse {
  industries: IndustryDatum[];
  lastUpdated: string;
  source: 'fetched' | 'mock';
  updatedBy: string;
}
