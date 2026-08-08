/**
 * 工具箱页面共享主题系统
 * 与 AI 角色主题系统（scout/butler/sage/maker）平行
 * 设计语言：科技蓝主调 + 玻璃拟态 + 胶囊圆角
 */

// ─── 配色方案 ───────────────────────────────────────────────

export const TOOL_PALETTE = {
  /** 新对话页面 — 科技蓝（延续侧边栏 #0c1e3e 主调） */
  conversation: {
    accent: '#1677ff',
    secondary: '#36cfc9',
    glow: 'rgba(22, 119, 255, 0.15)',
    gradient: 'linear-gradient(135deg, #1677ff 0%, #36cfc9 100%)',
    surface: '#ffffff',
    surfaceAlt: '#f0f5ff',
    border: '#d6e4ff',
    chartColors: ['#1677ff', '#36cfc9', '#52c41a', '#faad14', '#ff4d4f', '#722ed1'],
  },
  /** Skill 库页面 — 翡翠绿（技能 = 能力增长） */
  skill: {
    accent: '#00b96b',
    secondary: '#95de64',
    glow: 'rgba(0, 185, 107, 0.12)',
    gradient: 'linear-gradient(135deg, #00b96b 0%, #95de64 100%)',
    surface: '#ffffff',
    surfaceAlt: '#f6ffed',
    border: '#d9f7be',
    chartColors: ['#00b96b', '#95de64', '#1677ff', '#faad14', '#722ed1', '#eb2f96'],
  },
  /** MCP 配置页面 — 青色（连接 = 管道通信） */
  mcp: {
    accent: '#08979c',
    secondary: '#5cdbd3',
    glow: 'rgba(8, 151, 156, 0.12)',
    gradient: 'linear-gradient(135deg, #08979c 0%, #5cdbd3 100%)',
    surface: '#ffffff',
    surfaceAlt: '#e6fffb',
    border: '#b5f5ec',
    chartColors: ['#08979c', '#5cdbd3', '#1677ff', '#52c41a', '#faad14', '#722ed1'],
  },
  /** 自动化页面 — 琥珀橙（自动化 = 齿轮运转） */
  automation: {
    accent: '#fa8c16',
    secondary: '#ffc069',
    glow: 'rgba(250, 140, 22, 0.12)',
    gradient: 'linear-gradient(135deg, #fa8c16 0%, #ffc069 100%)',
    surface: '#ffffff',
    surfaceAlt: '#fff7e6',
    border: '#ffe7ba',
    chartColors: ['#fa8c16', '#ffc069', '#1677ff', '#52c41a', '#722ed1', '#eb2f96'],
  },
  /** 知识库页面 — 紫色（知识 = 深度智慧） */
  knowledge: {
    accent: '#722ed1',
    secondary: '#b37feb',
    glow: 'rgba(114, 46, 209, 0.12)',
    gradient: 'linear-gradient(135deg, #722ed1 0%, #b37feb 100%)',
    surface: '#ffffff',
    surfaceAlt: '#f9f0ff',
    border: '#d3adf7',
    chartColors: ['#722ed1', '#b37feb', '#1677ff', '#52c41a', '#faad14', '#08979c'],
  },
} as const;

// ─── 字体系统 ───────────────────────────────────────────────

export const TOOL_FONTS = {
  heading: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  body: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  mono: "'JetBrains Mono', 'Consolas', 'Fira Code', monospace",
} as const;

// ─── 间距（与全局设计令牌一致） ────────────────────────────

export const TOOL_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// ─── 圆角（与全局设计令牌一致） ────────────────────────────

export const TOOL_RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 9999,
} as const;

// ─── 渐变预设 ─────────────────────────────────────────────

export const TOOL_GRADIENTS = {
  glassHighlight: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
  headerBlue: 'linear-gradient(135deg, #0c1e3e 0%, #1a3a5c 100%)',
  statusConnected: 'linear-gradient(135deg, #52c41a, #95de64)',
  statusError: 'linear-gradient(135deg, #ff4d4f, #ff7875)',
  statusIdle: 'linear-gradient(135deg, #d9d9d9, #bfbfbf)',
  shimmerLight: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
} as const;

// ─── 阴影预设 ─────────────────────────────────────────────

export const TOOL_SHADOWS = {
  card: '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  cardHover: '0 8px 24px rgba(22,119,255,0.12), 0 2px 8px rgba(0,0,0,0.06)',
  glass: '0 4px 16px rgba(31, 110, 185, 0.06)',
  glassHover: '0 8px 32px rgba(31, 110, 185, 0.10)',
  drawerGlow: '0 0 24px rgba(22,119,255,0.10)',
} as const;

// ─── 背景纹理 ─────────────────────────────────────────────

export const TOOL_TEXTURES = {
  dotGrid: `url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='12' cy='12' r='1' fill='%231677ff' fill-opacity='0.03'/%3E%3C/svg%3E")`,
  gridLines: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%231677ff' stroke-width='0.5' opacity='0.04'/%3E%3C/svg%3E")`,
} as const;

// ─── 通用底色 ───────────────────────────────────────────────

export const TOOL_SURFACES = {
  light: {
    bg: '#f5f7fa',
    surface: '#ffffff',
    border: '#f0f0f0',
    text: '#1a1a1a',
    textSecondary: '#8c8c8c',
  },
} as const;

// ─── 类型导出 ───────────────────────────────────────────────

export type ToolPageKey = keyof typeof TOOL_PALETTE;
export type ToolPageTheme = (typeof TOOL_PALETTE)[ToolPageKey];
