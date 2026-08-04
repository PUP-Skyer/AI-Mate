/**
 * 工匠AI 主题系统 - "工坊图纸 × 精密制造"
 * 五案（脚手架/PPT/文档/原型/演示）各自独立配色
 */

export interface MakerTheme {
  /** 案号徽章文字：'案一' 等 */
  caseNo: string;
  /** 面板标题 */
  title: string;
  /** 各案主色 */
  accentColor: string;
  /** 钢印色 */
  sealColor: string;
  /** 暗色头部渐变 */
  gradient: string;
  /** 亮色头部渐变 */
  gradientLight: string;
  /** 图表配色 */
  chartColors: string[];
  /** 辉光色（rgba） */
  glowColor: string;
  bgLight: string;
  bgDark: string;
  surfaceLight: string;
  surfaceDark: string;
  borderLight: string;
  borderDark: string;
  textLight: string;
  textDark: string;
}

export const MAKER_THEMES: Record<'scaffold' | 'ppt' | 'doc' | 'proto' | 'demo', MakerTheme> = {
  /** 案一 · 项目脚手架 — 钢蓝 */
  scaffold: {
    caseNo: '案一',
    title: '项目脚手架',
    accentColor: '#2563EB',
    sealColor: '#1E40AF',
    gradient: 'linear-gradient(135deg, #111827 0%, #172554 55%, #1F2937 100%)',
    gradientLight: 'linear-gradient(135deg, #F7F7F5 0%, #DBEAFE 60%, #F5F5F0 100%)',
    chartColors: ['#2563EB', '#1E40AF', '#F59E0B', '#10B981', '#7C3AED', '#0891B2'],
    glowColor: 'rgba(37, 99, 235, 0.25)',
    bgLight: '#F7F7F5',
    bgDark: '#111827',
    surfaceLight: '#FFFFFF',
    surfaceDark: '#1F2937',
    borderLight: '#D6DEE9',
    borderDark: '#374151',
    textLight: '#1F2937',
    textDark: '#F3F4F6',
  },

  /** 案二 · PPT大纲 — 琥珀金 */
  ppt: {
    caseNo: '案二',
    title: 'PPT大纲',
    accentColor: '#F59E0B',
    sealColor: '#B45309',
    gradient: 'linear-gradient(135deg, #111827 0%, #3B2A10 55%, #1F2937 100%)',
    gradientLight: 'linear-gradient(135deg, #F7F7F5 0%, #FDEBD0 60%, #F5F5F0 100%)',
    chartColors: ['#F59E0B', '#B45309', '#2563EB', '#10B981', '#7C3AED', '#0891B2'],
    glowColor: 'rgba(245, 158, 11, 0.25)',
    bgLight: '#F7F7F5',
    bgDark: '#111827',
    surfaceLight: '#FFFFFF',
    surfaceDark: '#1F2937',
    borderLight: '#E8DCC3',
    borderDark: '#423A2A',
    textLight: '#1F2937',
    textDark: '#F3F4F6',
  },

  /** 案三 · 产品文档 — 靛青 */
  doc: {
    caseNo: '案三',
    title: '产品文档',
    accentColor: '#0891B2',
    sealColor: '#155E75',
    gradient: 'linear-gradient(135deg, #111827 0%, #10313A 55%, #1F2937 100%)',
    gradientLight: 'linear-gradient(135deg, #F7F7F5 0%, #D9F1F5 60%, #F5F5F0 100%)',
    chartColors: ['#0891B2', '#155E75', '#F59E0B', '#10B981', '#2563EB', '#7C3AED'],
    glowColor: 'rgba(8, 145, 178, 0.25)',
    bgLight: '#F7F7F5',
    bgDark: '#111827',
    surfaceLight: '#FFFFFF',
    surfaceDark: '#1F2937',
    borderLight: '#C9E6E8',
    borderDark: '#2C3E44',
    textLight: '#1F2937',
    textDark: '#F3F4F6',
  },

  /** 案四 · 原型描述 — 紫罗兰 */
  proto: {
    caseNo: '案四',
    title: '原型描述',
    accentColor: '#7C3AED',
    sealColor: '#5B21B6',
    gradient: 'linear-gradient(135deg, #111827 0%, #241A3D 55%, #1F2937 100%)',
    gradientLight: 'linear-gradient(135deg, #F7F7F5 0%, #E9DEF8 60%, #F5F5F0 100%)',
    chartColors: ['#7C3AED', '#5B21B6', '#F59E0B', '#10B981', '#2563EB', '#0891B2'],
    glowColor: 'rgba(124, 58, 237, 0.25)',
    bgLight: '#F7F7F5',
    bgDark: '#111827',
    surfaceLight: '#FFFFFF',
    surfaceDark: '#1F2937',
    borderLight: '#DCD0EF',
    borderDark: '#3B3150',
    textLight: '#1F2937',
    textDark: '#F3F4F6',
  },

  /** 案五 · 原型Demo — 翡翠绿 */
  demo: {
    caseNo: '案五',
    title: '原型Demo',
    accentColor: '#10B981',
    sealColor: '#047857',
    gradient: 'linear-gradient(135deg, #111827 0%, #0F2E24 55%, #1F2937 100%)',
    gradientLight: 'linear-gradient(135deg, #F7F7F5 0%, #D1FAE5 60%, #F5F5F0 100%)',
    chartColors: ['#10B981', '#047857', '#F59E0B', '#2563EB', '#7C3AED', '#0891B2'],
    glowColor: 'rgba(16, 185, 129, 0.25)',
    bgLight: '#F7F7F5',
    bgDark: '#111827',
    surfaceLight: '#FFFFFF',
    surfaceDark: '#1F2937',
    borderLight: '#C7E8D9',
    borderDark: '#23403A',
    textLight: '#1F2937',
    textDark: '#F3F4F6',
  },
};

/** 工匠衬线标题字体 */
export const MAKER_FONT_SERIF = "'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'SimSun', serif";

export type MakerThemeKey = keyof typeof MAKER_THEMES;
