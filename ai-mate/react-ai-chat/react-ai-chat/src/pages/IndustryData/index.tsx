/**
 * 行业数据查询页面容器
 * master-detail：7 大行业总览 ⇄ 行业详情；头部展示最后更新时间与数据源状态
 */
import React, { useEffect, useState } from 'react';
import { Button, Space, Tag, Typography } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAIStore } from '../../store/aiStore';
import { ROLE_TO_PAGE } from '../../types';
import { fetchIndustryData, triggerIndustryRefresh } from '../../services/industryDataService';
import { mockIndustryData } from './data';
import type { IndustryDataResponse, IndustryDatum } from './types';
import IndustryOverviewPanel from './components/IndustryOverviewPanel';
import IndustryDetailPanel from './components/IndustryDetailPanel';
import './IndustryData.css';

const { Text } = Typography;

const IndustryDataPage: React.FC = () => {
  const currentRole = useAIStore((s) => s.currentRole);
  const setCurrentPage = useAIStore((s) => s.setCurrentPage);
  const [data, setData] = useState<IndustryDataResponse>(mockIndustryData);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'overview' | 'detail'>('overview');
  const [selected, setSelected] = useState<IndustryDatum | null>(null);

  useEffect(() => {
    let alive = true;
    fetchIndustryData().then((d) => {
      if (!alive) return;
      setData(d);
    });
    return () => { alive = false; };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await triggerIndustryRefresh();
      const d = await fetchIndustryData();
      setData(d);
    } finally {
      setRefreshing(false);
    }
  };

  const openDetail = (ind: IndustryDatum) => { setSelected(ind); setView('detail'); };
  const backToOverview = () => { setView('overview'); setSelected(null); };
  const backToDashboard = () => setCurrentPage(ROLE_TO_PAGE[currentRole]);

  return (
    <div className="industry-data-page">
      {/* 页头：标题 + 最后更新时间 + 数据源状态 + 手动刷新 + 返回看板 */}
      <div className="id-head-row">
        <div>
          <h2 className="id-serif-title id-main">行业数据查询</h2>
          <Text type="secondary" style={{ fontSize: 12, color: '#6b7280' }}>
            覆盖 7 大行业 · 最后更新 {new Date(data.lastUpdated).toLocaleString('zh-CN')}
            {' '}<Tag color={data.source === 'fetched' ? 'green' : 'orange'} style={{ fontSize: 10 }}>
              {data.source === 'fetched' ? '实时抓取' : '基准数据（mock 兜底）'}
            </Tag>
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} size="small" onClick={handleRefresh} loading={refreshing}>刷新数据</Button>
          <Button icon={<ArrowLeftOutlined />} size="small" onClick={backToDashboard}>返回看板</Button>
        </Space>
      </div>
      <div className="id-rule" />

      {view === 'overview' ? (
        <IndustryOverviewPanel industries={data.industries} onOpen={openDetail} />
      ) : selected ? (
        <IndustryDetailPanel
          industry={selected}
          lastUpdated={data.lastUpdated}
          source={data.source}
          onBack={backToOverview}
        />
      ) : (
        <IndustryOverviewPanel industries={data.industries} onOpen={openDetail} />
      )}
    </div>
  );
};

export default IndustryDataPage;
