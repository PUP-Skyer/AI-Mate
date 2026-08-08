/**
 * Dashboard3D 主题配置 — 深色暖城 + 浅色米色优雅
 * 建筑群采用米色/暖棕色系，街道为深色沥青
 */

export const DASHBOARD_DARK = {
  bgGradient: ['#1a1510', '#15120e', '#0f0a06'],
  fogColor: 0x15120e,
  fogNear: 35,
  fogFar: 120,

  // 街道 / 地面
  streetColor: 0x1a1612,
  groundColor: 0x1a1612,
  gridColor: 0x3a3530,
  gridColorAccent: 0x5a4f42,

  // 建筑平台（街区底座）
  blockPlatformColor: 0x3a332a,

  // 水域 — 西湖 / 钱塘江
  lakeColor: 0x1a3a5a,
  lakeEmissive: 0x0a2a4a,
  riverColor: 0x2a4a6a,

  // 建筑 — 暖米色/棕色调
  buildingColors: [0x6b5d4f, 0x7a6b5a, 0x5c4f42, 0x8a7a68],
  buildingEmissive: 0x4a3f35,
  buildingEmissiveIntensity: 0.04,
  buildingWindowColor: 0xffb84d,

  // 保留兼容属性（不再使用但维持类型完整）
  towerColor: 0x3a3a4e,
  towerEmissive: 0x4a3f35,
  ringColor: 0x5a4f42,
  ringOpacity: 0.3,
  beamColor: 0xff6b6b,
  beamOpacity: 0.1,

  // 光照 — 暖色调
  ambientColor: 0x4a4035,
  ambientIntensity: 0.5,
  mainLightColor: 0xffeedd,
  mainLightIntensity: 0.7,
  fillLightColor: 0x4a3f35,
  fillLightIntensity: 0.25,
  hemiSkyColor: 0x3a3530,
  hemiGroundColor: 0x1a1612,
  hemiIntensity: 0.4,
  neonPointLight1: 0xffb84d,
  neonPointLight2: 0xff8c42,
  neonPointLight3: 0xffd700,

  // UI 玻璃效果
  glassBg: 'rgba(20, 16, 12, 0.78)',
  glassBorder: 'rgba(255, 184, 77, 0.15)',
  glassShadow: '0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 184, 77, 0.05)',
  glassHoverShadow: '0 8px 32px rgba(255, 184, 77, 0.12), 0 0 0 1px rgba(255, 184, 77, 0.2)',

  // 文字
  textPrimary: '#e8e0d4',
  textSecondary: '#9a8a7a',
  textAccent: '#ffb84d',
  textWarning: '#ffa502',
  textDanger: '#ff6b6b',

  // 图表
  chartColors: ['#ffb84d', '#ff8c42', '#36cfc9', '#4a9eff', '#a855f7', '#52c41a'],
  chartTextColor: '#9a8a7a',
  chartAxisLineColor: 'rgba(255, 184, 77, 0.12)',
  chartSplitLineColor: 'rgba(154, 138, 122, 0.08)',

  // KPI 条带
  kpiBarBg: 'rgba(20, 16, 12, 0.88)',
  kpiBarBorder: 'rgba(255, 184, 77, 0.15)',
} as const;

export const DASHBOARD_LIGHT = {
  bgGradient: ['#e8e2d8', '#e0d8cc', '#e8e2d8'],
  fogColor: 0xe0d8cc,
  fogNear: 45,
  fogFar: 130,

  // 街道 / 地面
  streetColor: 0xc0beb6,
  groundColor: 0xc0beb6,
  gridColor: 0xb0a8a0,
  gridColorAccent: 0x999990,

  // 建筑平台
  blockPlatformColor: 0xd4c8b0,

  // 水域 — 西湖 / 钱塘江
  lakeColor: 0x7ab8d8,
  lakeEmissive: 0x5a98c8,
  riverColor: 0x9ac8e8,

  // 建筑 — 浅米色
  buildingColors: [0xc4b5a0, 0xb8a88e, 0xd0c4ac, 0xa89878],
  buildingEmissive: 0xc4b5a0,
  buildingEmissiveIntensity: 0.02,
  buildingWindowColor: 0x8a7a68,

  // 保留兼容属性
  towerColor: 0xe0e3e8,
  towerEmissive: 0x8a7a68,
  ringColor: 0x999990,
  ringOpacity: 0.2,
  beamColor: 0xff6b6b,
  beamOpacity: 0.06,

  // 光照 — 暖白
  ambientColor: 0xffffff,
  ambientIntensity: 0.7,
  mainLightColor: 0xfff5e6,
  mainLightIntensity: 1.0,
  fillLightColor: 0xe8dcc8,
  fillLightIntensity: 0.2,
  hemiSkyColor: 0xb0c4de,
  hemiGroundColor: 0xc0beb6,
  hemiIntensity: 0.5,
  neonPointLight1: 0xffb84d,
  neonPointLight2: 0xff8c42,
  neonPointLight3: 0xffd700,

  // UI 玻璃效果
  glassBg: 'rgba(255, 252, 248, 0.78)',
  glassBorder: 'rgba(180, 160, 130, 0.3)',
  glassShadow: '0 4px 16px rgba(120, 100, 80, 0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
  glassHoverShadow: '0 8px 24px rgba(120, 100, 80, 0.16), 0 0 0 1px rgba(180,160,130,0.2)',

  // 文字
  textPrimary: '#2a2218',
  textSecondary: '#6a5d4f',
  textAccent: '#a86a2a',
  textWarning: '#fa8c16',
  textDanger: '#ff4d4f',

  // 图表
  chartColors: ['#a86a2a', '#36cfc9', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1'],
  chartTextColor: '#6a5d4f',
  chartAxisLineColor: 'rgba(168, 106, 42, 0.12)',
  chartSplitLineColor: 'rgba(106, 93, 79, 0.08)',

  // KPI 条带
  kpiBarBg: 'rgba(255, 252, 248, 0.88)',
  kpiBarBorder: 'rgba(168, 106, 42, 0.12)',
} as const;

export type DashboardTheme = typeof DASHBOARD_DARK;

export function getDashboardTheme(isDark: boolean): DashboardTheme {
  return isDark ? DASHBOARD_DARK : DASHBOARD_LIGHT;
}

export function createChartTheme(t: DashboardTheme) {
  return {
    textColor: t.chartTextColor,
    axisLine: { lineStyle: { color: t.chartAxisLineColor } },
    splitLine: { lineStyle: { color: t.chartSplitLineColor } },
    colors: t.chartColors,
    tooltip: {
      backgroundColor: t.glassBg,
      borderColor: t.glassBorder,
      textStyle: { color: t.textPrimary, fontSize: 10 },
    },
  };
}
