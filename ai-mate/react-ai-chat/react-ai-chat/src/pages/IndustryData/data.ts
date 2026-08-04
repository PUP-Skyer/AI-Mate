/**
 * 行业数据 mock 兜底（source: 'mock'）
 * 与后端 industryData.js 的 mock 基准同构，避免"先 mock 后真实"切换时 UI 跳动
 */
import type { IndustryDataResponse, IndustryDatum } from './types';

export const INDUSTRY_COLORS: Record<string, string> = {
  人工智能: '#1677ff',
  新能源: '#52c41a',
  智慧餐饮: '#fa8c16',
  智能制造: '#722ed1',
  生物医药: '#eb2f96',
  金融科技: '#13c2c2',
  跨境电商: '#faad14',
};

const MOCK_BASE: Omit<IndustryDatum, 'industry' | 'color'>[] = [
  { marketSize: '1.2万亿', growthRate: 28.5, reportCount: 4523, hotIndex: 92, dataPoints: { 前年: 8600, 去年: 10400, 今年: 12800 }, charts: [{ kind: 'trend', title: '近三年市场规模（亿元）', series: [{ name: '市场规模', values: [8600, 10400, 12800] }] }], reports: [], sources: ['mock 基准数据'] },
  { marketSize: '8600亿', growthRate: 24.2, reportCount: 2891, hotIndex: 86, dataPoints: { 前年: 6100, 去年: 7400, 今年: 8600 }, charts: [{ kind: 'trend', title: '近三年市场规模（亿元）', series: [{ name: '市场规模', values: [6100, 7400, 8600] }] }], reports: [], sources: ['mock 基准数据'] },
  { marketSize: '4200亿', growthRate: 19.6, reportCount: 1547, hotIndex: 71, dataPoints: { 前年: 2900, 去年: 3600, 今年: 4200 }, charts: [{ kind: 'trend', title: '近三年市场规模（亿元）', series: [{ name: '市场规模', values: [2900, 3600, 4200] }] }], reports: [], sources: ['mock 基准数据'] },
  { marketSize: '3.4万亿', growthRate: 12.8, reportCount: 1328, hotIndex: 78, dataPoints: { 前年: 27000, 去年: 30500, 今年: 34000 }, charts: [{ kind: 'trend', title: '近三年市场规模（亿元）', series: [{ name: '市场规模', values: [27000, 30500, 34000] }] }], reports: [], sources: ['mock 基准数据'] },
  { marketSize: '9800亿', growthRate: 9.4, reportCount: 1184, hotIndex: 64, dataPoints: { 前年: 8200, 去年: 8900, 今年: 9800 }, charts: [{ kind: 'trend', title: '近三年市场规模（亿元）', series: [{ name: '市场规模', values: [8200, 8900, 9800] }] }], reports: [], sources: ['mock 基准数据'] },
  { marketSize: '5600亿', growthRate: 15.7, reportCount: 1026, hotIndex: 81, dataPoints: { 前年: 4000, 去年: 4800, 今年: 5600 }, charts: [{ kind: 'trend', title: '近三年市场规模（亿元）', series: [{ name: '市场规模', values: [4000, 4800, 5600] }] }], reports: [], sources: ['mock 基准数据'] },
  { marketSize: '3.1万亿', growthRate: 18.9, reportCount: 348, hotIndex: 69, dataPoints: { 前年: 23000, 去年: 27000, 今年: 31000 }, charts: [{ kind: 'trend', title: '近三年市场规模（亿元）', series: [{ name: '市场规模', values: [23000, 27000, 31000] }] }], reports: [], sources: ['mock 基准数据'] },
];

const INDUSTRY_NAMES: string[] = ['人工智能', '新能源', '智慧餐饮', '智能制造', '生物医药', '金融科技', '跨境电商'];

export const MOCK_INDUSTRIES: IndustryDatum[] = INDUSTRY_NAMES.map((name, i) => ({
  industry: name as IndustryDatum['industry'],
  color: INDUSTRY_COLORS[name],
  ...MOCK_BASE[i],
}));

export function mockIndustryData(): IndustryDataResponse {
  return {
    industries: MOCK_INDUSTRIES,
    lastUpdated: new Date().toISOString(),
    source: 'mock',
    updatedBy: 'mock-fallback',
  };
}
