/**
 * Scout 面板主题配置
 * 每个面板拥有独立的色彩体系、渐变和图表色板
 */

export interface PanelTheme {
  accentColor: string;
  accentLight: string;
  accentDark: string;
  gradient: string;
  gradientLight: string;
  chartColors: string[];
  glowColor: string;
}

export const panelThemes: Record<string, PanelTheme> = {
  market: {
    accentColor: '#3B82F6',
    accentLight: '#60A5FA',
    accentDark: '#1D4ED8',
    gradient: 'linear-gradient(135deg, #1E3A5F 0%, #0F0F23 60%, #1a1a3e 100%)',
    gradientLight: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 60%, #EEF2FF 100%)',
    chartColors: ['#3B82F6', '#60A5FA', '#93C5FD', '#2563EB', '#1D4ED8', '#3B82F6', '#60A5FA'],
    glowColor: 'rgba(59, 130, 246, 0.5)',
  },
  report: {
    accentColor: '#d97757',
    accentLight: '#f0a080',
    accentDark: '#b45309',
    gradient: 'linear-gradient(135deg, #3D2914 0%, #0F0F23 60%, #1a1a2e 100%)',
    gradientLight: 'linear-gradient(135deg, #FFF7ED 0%, #F8FAFC 60%, #FEF3C7 100%)',
    chartColors: ['#d97757', '#6a9bcc', '#788c5d', '#a855f7', '#f59e0b'],
    glowColor: 'rgba(217, 119, 87, 0.5)',
  },
  compare: {
    accentColor: '#10B981',
    accentLight: '#34D399',
    accentDark: '#047857',
    gradient: 'linear-gradient(135deg, #064E3B 0%, #0F0F23 60%, #1a1a3e 100%)',
    gradientLight: 'linear-gradient(135deg, #ECFDF5 0%, #F8FAFC 60%, #D1FAE5 100%)',
    chartColors: ['#10B981', '#34D399', '#6EE7B7', '#047857', '#065F46'],
    glowColor: 'rgba(16, 185, 129, 0.5)',
  },
};

/** 行业名称到 key 的映射 */
export const industryKeyMap: Record<string, string> = {
  '科技': 'tech',
  '金融': 'finance',
  '医疗': 'healthcare',
  '教育': 'education',
  '零售': 'retail',
  '制造': 'manufacturing',
  '能源': 'energy',
};

/** 分类颜色映射 */
export const categoryColorMap: Record<string, string> = {
  market: '#3B82F6',
  industry: '#10B981',
  investment: '#F59E0B',
  technology: '#8B5CF6',
  policy: '#EF4444',
};

/** 分类标签映射 */
export const categoryLabelMap: Record<string, string> = {
  market: '市场分析',
  industry: '行业研究',
  investment: '投资报告',
  technology: '技术趋势',
  policy: '政策解读',
};
