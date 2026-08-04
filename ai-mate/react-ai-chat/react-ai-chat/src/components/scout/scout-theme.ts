/**
 * 探路者AI面板主题系统
 * 基于 Anthropic 品牌色 — 三个面板各自独立配色
 */

// ─── 配色方案 ───────────────────────────────────────────────

export const SCOUT_PALETTE = {
  /** 竞品调研 - 亮色分析面板 */
  competitor: {
    bg: '#ffffff',
    surface: '#f8f9fa',
    border: '#e8e8e8',
    primary: '#d97757',
    secondary: '#6a9bcc',
    accent: '#58a6ff',
    text: '#1a1a1a',
    textSecondary: '#8c8c8c',
    success: '#52c41a',
    warning: '#faad14',
    danger: '#ff4d4f',
    chartColors: ['#d97757', '#6a9bcc', '#52c41a', '#faad14', '#ff4d4f', '#58a6ff'],
  },

  /** 趋势洞察 — 温暖杂志风 */
  trend: {
    bg: '#faf9f5',
    surface: '#ffffff',
    border: '#e8e6dc',
    primary: '#d97757',
    secondary: '#6a9bcc',
    accent: '#788c5d',
    text: '#141413',
    textSecondary: '#b0aea5',
    gradient: 'linear-gradient(135deg, #d97757 0%, #e8a87c 100%)',
    chartColors: ['#d97757', '#6a9bcc', '#788c5d', '#e8a87c', '#a3bffa', '#c4a882'],
  },

  /** 机会评估 — 极简评估终端（白底版本） */
  opportunity: {
    bg: '#f7f7f4',
    surface: '#ffffff',
    border: '#e8e6dc',
    primary: '#788c5d',
    secondary: '#d97757',
    accent: '#6a9bcc',
    text: '#1a1a1a',
    textSecondary: '#9a9a92',
    glow: 'rgba(120, 140, 93, 0.10)',
    chartColors: ['#788c5d', '#d97757', '#6a9bcc', '#a3b88c', '#e8a87c', '#8bb8d4'],
  },
} as const;

// ─── 字体系统 ───────────────────────────────────────────────

export const SCOUT_FONTS = {
  heading: "'Poppins', 'Arial', sans-serif",
  body: "'Lora', 'Georgia', serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
} as const;

// ─── 间距 ───────────────────────────────────────────────────

export const SCOUT_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// ─── 圆角 ───────────────────────────────────────────────────

export const SCOUT_RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

// ─── 背景纹理 ─────────────────────────────────────────────

export const SCOUT_TEXTURES = {
  /** 指挥中心网格线 SVG data URI */
  commandGrid: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%2330363d' stroke-width='0.5'/%3E%3C/svg%3E")`,

  /** 杂志纸纹 SVG data URI */
  paperGrain: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,

  /** 终端扫描线 CSS */
  scanlines: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(120,140,93,0.03) 2px, rgba(120,140,93,0.03) 4px)',
} as const;

// ─── 渐变预设 ─────────────────────────────────────────────

export const SCOUT_GRADIENTS = {
  competitorHeader: 'linear-gradient(135deg, #d97757 0%, #6a9bcc 100%)',
  trendHeader: 'linear-gradient(135deg, #d97757 0%, #e8a87c 50%, #c4a882 100%)',
  opportunityGlow: 'radial-gradient(ellipse at center, rgba(120,140,93,0.07) 0%, transparent 70%)',
  scoreHigh: 'linear-gradient(135deg, #788c5d, #a3b88c)',
  scoreMid: 'linear-gradient(135deg, #faad14, #e8c547)',
  scoreLow: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
} as const;

// ─── 阴影预设 ─────────────────────────────────────────────

export const SCOUT_SHADOWS = {
  competitorCard: '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  trendCard: '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
  opportunityGlow: '0 2px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04)',
  hover: '0 8px 32px rgba(0,0,0,0.3)',
} as const;

// ─── 通用类型 ───────────────────────────────────────────────

export type ScoutThemeColor = typeof SCOUT_PALETTE.competitor;
