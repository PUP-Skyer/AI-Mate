/**
 * 行业报告页面容器
 * master-detail：list ⇄ detail 页内切换 + 收藏集合（localStorage）
 */
import React, { useMemo, useState } from 'react';
import { Button, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAIStore } from '../../store/aiStore';
import { ROLE_TO_PAGE } from '../../types';
import { REPORTS } from './data';
import type { IndustryReport } from './types';
import ReportListPanel from './components/ReportListPanel';
import ReportDetailPanel from './components/ReportDetailPanel';
import './IndustryReport.css';

const { Text } = Typography;

const FAV_KEY = 'ir-favorites';

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

const IndustryReportPage: React.FC = () => {
  const currentRole = useAIStore((s) => s.currentRole);
  const setCurrentPage = useAIStore((s) => s.setCurrentPage);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);

  // 报告索引（相关报告跳转用）
  const reportsMap = useMemo(() => {
    const map: Record<string, IndustryReport> = {};
    REPORTS.forEach((r) => {
      map[r.id] = r;
    });
    if (typeof window !== 'undefined') {
      window.__IR_REPORTS_MAP__ = map;
    }
    return map;
  }, []);

  const selected = selectedId ? reportsMap[selectedId] : null;

  const persistFavorites = (next: Set<string>) => {
    setFavorites(next);
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
    } catch {
      /* 忽略存储失败 */
    }
  };

  const toggleFavorite = (id: string) => {
    const next = new Set(favorites);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    persistFavorites(next);
  };

  const openDetail = (report: IndustryReport) => {
    setSelectedId(report.id);
    setView('detail');
  };

  const backToList = () => {
    setView('list');
    setSelectedId(null);
  };

  const backToDashboard = () => {
    setCurrentPage(ROLE_TO_PAGE[currentRole]);
  };

  return (
    <div className="industry-report-page">
      {/* 页头 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 4,
        }}
      >
        <div>
          <h2 className="ir-serif-title ir-main">行业报告</h2>
          <Text type="secondary" style={{ fontSize: 12, color: '#6b7280' }}>
            覆盖 {REPORTS.length}+ 家机构，{reportsMap ? Object.keys(reportsMap).length : 0} 篇精选报告 · 数据来自公开渠道聚合
          </Text>
        </div>
        <Button icon={<ArrowLeftOutlined />} size="small" onClick={backToDashboard}>
          返回看板
        </Button>
      </div>
      <div className="ir-rule" />

      {/* 主从视图 */}
      {view === 'list' ? (
        <ReportListPanel
          reports={REPORTS}
          favorites={favorites}
          onOpen={openDetail}
          onToggleFavorite={toggleFavorite}
        />
      ) : selected ? (
        <ReportDetailPanel
          report={selected}
          favorites={favorites}
          onBack={backToList}
          onOpenRelated={openDetail}
          onToggleFavorite={toggleFavorite}
        />
      ) : (
        <ReportListPanel
          reports={REPORTS}
          favorites={favorites}
          onOpen={openDetail}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
};

export default IndustryReportPage;
