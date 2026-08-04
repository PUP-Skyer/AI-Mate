export type SavedReport = {
  id: string;
  title: string;
  type: 'strategy' | 'analysis' | 'marketing' | 'growth' | 'benchmark';
  typeLabel: string;
  content: string;
  createdAt: string;
};

const STORAGE_KEY = 'sage_ai_reports';

export const saveReport = (report: Omit<SavedReport, 'id' | 'createdAt'>): SavedReport => {
  const reports = getReports();
  const newReport: SavedReport = {
    ...report,
    id: Date.now().toString(),
    createdAt: new Date().toLocaleString('zh-CN'),
  };
  reports.unshift(newReport);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  return newReport;
};

export const getReports = (): SavedReport[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const deleteReport = (id: string): void => {
  const reports = getReports().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
};

export const getReportTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    strategy: '运营策略',
    analysis: '数据分析',
    marketing: '营销方案',
    growth: '增长策略',
    benchmark: '行业对标',
  };
  return labels[type] || type;
};

export const getReportTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    strategy: '#a855f7',
    analysis: '#10b981',
    marketing: '#d946ef',
    growth: '#3b82f6',
    benchmark: '#f59e0b',
  };
  return colors[type] || '#a855f7';
};
