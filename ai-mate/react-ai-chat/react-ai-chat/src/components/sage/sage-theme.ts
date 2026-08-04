/**
 * 军师AI 主题系统 - "案牍书院 × 战术沙盘"
 * 四案（策略/画布/风险/融资）各自独立配色
 */

export interface SageTheme {
  /** 案号徽章文字：'案一' 等 */
  caseNo: string;
  /** 面板标题 */
  title: string;
  /** 各案主色 */
  accentColor: string;
  /** 朱砂印章色 */
  sealColor: string;
  /** 暗色头部渐变（墨底） */
  gradient: string;
  /** 亮色头部渐变（宣纸底） */
  gradientLight: string;
  /** 图表配色 */
  chartColors: string[];
  /** 辉光色（rgba） */
  glowColor: string;
  /** 亮色背景（宣纸） */
  bgLight: string;
  /** 暗色背景（墨黑） */
  bgDark: string;
  /** 亮色卡片 */
  surfaceLight: string;
  /** 暗色卡片 */
  surfaceDark: string;
  /** 亮色边框 */
  borderLight: string;
  /** 暗色边框 */
  borderDark: string;
  /** 正文亮色 */
  textLight: string;
  /** 正文暗色 */
  textDark: string;
}

export const SAGE_THEMES: Record<'requirements' | 'canvas' | 'risk' | 'finance' | 'plan', SageTheme> = {
  /** 案一 · 需求分析 — 金 */
  requirements: {
    caseNo: '案一',
    title: '需求分析',
    accentColor: '#F59E0B',
    sealColor: '#B45309',
    gradient: 'linear-gradient(135deg, #1C1917 0%, #3B2A10 55%, #292524 100%)',
    gradientLight: 'linear-gradient(135deg, #FAF6EF 0%, #FDEBD0 60%, #F5EFE3 100%)',
    chartColors: ['#F59E0B', '#B45309', '#0E7490', '#3F6212', '#6D28D9', '#BE185D'],
    glowColor: 'rgba(245, 158, 11, 0.25)',
    bgLight: '#FAF6EF',
    bgDark: '#1C1917',
    surfaceLight: '#FFFFFF',
    surfaceDark: '#26211C',
    borderLight: '#E7DEC9',
    borderDark: '#3A332A',
    textLight: '#292524',
    textDark: '#F5EFE3',
  },

  /** 案二 · 商业模式画布 — 靛青 */
  canvas: {
    caseNo: '案二',
    title: '商业模式画布',
    accentColor: '#0891B2',
    sealColor: '#155E75',
    gradient: 'linear-gradient(135deg, #1C1917 0%, #10313A 55%, #292524 100%)',
    gradientLight: 'linear-gradient(135deg, #FAF6EF 0%, #D9F1F5 60%, #F5EFE3 100%)',
    chartColors: ['#0891B2', '#155E75', '#F59E0B', '#7C3AED', '#059669', '#E11D48'],
    glowColor: 'rgba(8, 145, 178, 0.25)',
    bgLight: '#FAF6EF',
    bgDark: '#1C1917',
    surfaceLight: '#FFFFFF',
    surfaceDark: '#26211C',
    borderLight: '#CFE5E8',
    borderDark: '#2C3E44',
    textLight: '#292524',
    textDark: '#F5EFE3',
  },

  /** 案三 · 风险矩阵 — 朱红 */
  risk: {
    caseNo: '案三',
    title: '风险矩阵',
    accentColor: '#E11D48',
    sealColor: '#9F1239',
    gradient: 'linear-gradient(135deg, #1C1917 0%, #3A1220 55%, #292524 100%)',
    gradientLight: 'linear-gradient(135deg, #FAF6EF 0%, #FBDDE3 60%, #F5EFE3 100%)',
    chartColors: ['#E11D48', '#9F1239', '#F59E0B', '#0E7490', '#059669', '#6D28D9'],
    glowColor: 'rgba(225, 29, 72, 0.22)',
    bgLight: '#FAF6EF',
    bgDark: '#1C1917',
    surfaceLight: '#FFFFFF',
    surfaceDark: '#26211C',
    borderLight: '#F0CBD4',
    borderDark: '#46242E',
    textLight: '#292524',
    textDark: '#F5EFE3',
  },

  /** 案四 · 融资规划 — 财青 */
  finance: {
    caseNo: '案四',
    title: '融资规划',
    accentColor: '#0D9488',
    sealColor: '#115E59',
    gradient: 'linear-gradient(135deg, #1C1917 0%, #0F2E2B 55%, #292524 100%)',
    gradientLight: 'linear-gradient(135deg, #FAF6EF 0%, #D2F2EE 60%, #F5EFE3 100%)',
    chartColors: ['#0D9488', '#115E59', '#F59E0B', '#0891B2', '#E11D48', '#7C3AED'],
    glowColor: 'rgba(13, 148, 136, 0.25)',
    bgLight: '#FAF6EF',
    bgDark: '#1C1917',
    surfaceLight: '#FFFFFF',
    surfaceDark: '#26211C',
    borderLight: '#C9E6E2',
    borderDark: '#23403C',
    textLight: '#292524',
    textDark: '#F5EFE3',
  },

  /** 案五 · 项目计划 — 紫兰 */
  plan: {
    caseNo: '案五',
    title: '项目计划',
    accentColor: '#7C3AED',
    sealColor: '#5B21B6',
    gradient: 'linear-gradient(135deg, #1C1917 0%, #241A3D 55%, #292524 100%)',
    gradientLight: 'linear-gradient(135deg, #FAF6EF 0%, #E9DEF8 60%, #F5EFE3 100%)',
    chartColors: ['#7C3AED', '#5B21B6', '#F59E0B', '#0D9488', '#E11D48', '#0891B2'],
    glowColor: 'rgba(124, 58, 237, 0.25)',
    bgLight: '#FAF6EF',
    bgDark: '#1C1917',
    surfaceLight: '#FFFFFF',
    surfaceDark: '#26211C',
    borderLight: '#DCD0EF',
    borderDark: '#3B3150',
    textLight: '#292524',
    textDark: '#F5EFE3',
  },
};

/** 军师衬线标题字体 */
export const SAGE_FONT_SERIF = "'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'SimSun', serif";

export type SageThemeKey = keyof typeof SAGE_THEMES;
