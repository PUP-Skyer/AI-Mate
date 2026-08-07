/**
 * 管家AI面板主题系统
 * 镜像 scout-theme.ts 扁平结构 — 四面板各自独立配色
 * 管家AI用无衬线字体（Inter + PingFang SC），与探路者AI衬线字体（Lora）区分
 */

// ─── 配色方案 ───────────────────────────────────────────────

export const BUTLER_PALETTE = {
  /** 面板壹 · 用户内测看板 — 品红主调 + 青色反馈分析 */
  beta: {
    panelNo: '壹',
    title: '用户内测看板',
    accent: '#eb2f96',
    secondary: '#13c2c2',
    seal: '#c41d7f',
    gradient: 'linear-gradient(135deg, #eb2f96 0%, #ff85c0 100%)',
    glow: 'rgba(235,47,150,0.25)',
    chartColors: ['#eb2f96', '#13c2c2', '#52c41a', '#faad14', '#ff85c0', '#722ed1'],
  },

  /** 面板贰 · 进度跟踪 — 深品红 + 金色进度 */
  progress: {
    panelNo: '贰',
    title: '进度跟踪',
    accent: '#c41d7f',
    secondary: '#faad14',
    seal: '#9e1068',
    gradient: 'linear-gradient(135deg, #c41d7f 0%, #faad14 100%)',
    glow: 'rgba(196,29,127,0.22)',
    chartColors: ['#c41d7f', '#faad14', '#52c41a', '#ff4d4f', '#ff85c0', '#d48806'],
  },

  /** 面板叁 · 资源对接 — 玫瑰红 + 青绿商务 */
  resource: {
    panelNo: '叁',
    title: '资源对接',
    accent: '#f5222d',
    secondary: '#08979c',
    seal: '#cf1322',
    gradient: 'linear-gradient(135deg, #f5222d 0%, #08979c 100%)',
    glow: 'rgba(245,34,45,0.20)',
    chartColors: ['#f5222d', '#08979c', '#faad14', '#52c41a', '#ff85c0', '#722ed1'],
  },

  /** 面板肆 · 团队协作 — 浅粉 + 紫色协作 */
  team: {
    panelNo: '肆',
    title: '团队协作',
    accent: '#ff85c0',
    secondary: '#722ed1',
    seal: '#eb2f96',
    gradient: 'linear-gradient(135deg, #ff85c0 0%, #722ed1 100%)',
    glow: 'rgba(255,133,192,0.25)',
    chartColors: ['#ff85c0', '#722ed1', '#52c41a', '#faad14', '#13c2c2', '#eb2f96'],
  },
} as const;

// ─── 字体系统 ───────────────────────────────────────────────

export const BUTLER_FONTS = {
  heading: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  body: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  mono: "'JetBrains Mono', 'Consolas', monospace",
} as const;

// ─── 间距 ───────────────────────────────────────────────────

export const BUTLER_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// ─── 圆角 ───────────────────────────────────────────────────

export const BUTLER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

// ─── 渐变预设 ─────────────────────────────────────────────

export const BUTLER_GRADIENTS = {
  statCard: 'linear-gradient(135deg, rgba(235,47,150,0.03) 0%, transparent 100%)',
  scoreHigh: 'linear-gradient(135deg, #52c41a, #95de64)',
  scoreMid: 'linear-gradient(135deg, #faad14, #ffd666)',
  scoreLow: 'linear-gradient(135deg, #ff4d4f, #ff7875)',
} as const;

// ─── 阴影预设 ─────────────────────────────────────────────

export const BUTLER_SHADOWS = {
  card: '0 2px 8px rgba(235,47,150,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  cardHover: '0 8px 24px rgba(235,47,150,0.12), 0 2px 8px rgba(0,0,0,0.06)',
  drawerGlow: '0 0 24px rgba(235,47,150,0.15)',
} as const;

// ─── 背景纹理 ─────────────────────────────────────────────

export const BUTLER_TEXTURES = {
  /** 粉色点阵背景（SVG data URI） */
  dotGrid: `url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='12' cy='12' r='1' fill='%23eb2f96' fill-opacity='0.04'/%3E%3C/svg%3E")`,
} as const;

// ─── 通用底色（四面板共享，保证切换连贯） ───────────────

export const BUTLER_SURFACES = {
  light: {
    bg: '#fff5f9',
    surface: '#ffffff',
    border: '#ffd6e7',
    text: '#1a1a1a',
    textSecondary: '#8c8c8c',
  },
  dark: {
    bg: '#1a0f14',
    surface: '#241319',
    border: '#3d2430',
    text: '#f0e6ea',
    textSecondary: '#a89099',
  },
} as const;

// ─── 类型导出 ───────────────────────────────────────────────

export type ButlerPanelKey = keyof typeof BUTLER_PALETTE;
export type ButlerPanelTheme = typeof BUTLER_PALETTE[ButlerPanelKey];
