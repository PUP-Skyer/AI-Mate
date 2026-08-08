/**
 * 探路者AI (ScoutAI) - 资源对接
 * 4面板：市场分析 / 竞品调研 / 趋势洞察 / 机会评估
 */

import React from 'react';
import { SearchOutlined } from '@ant-design/icons';
import AIRoleLayout from '../components/AIRoleLayout';
import MarketAnalysis from '../components/scout/MarketAnalysis';
import CompetitorResearch from '../components/scout/CompetitorResearch';
import TrendInsight from '../components/scout/TrendInsight';
import OpportunityEval from '../components/scout/OpportunityEval';

const ScoutAI: React.FC = () => {
  return (
    <AIRoleLayout
      role="scout"
      title="探路者AI"
      icon={<SearchOutlined />}
      description="资源对接专家 - 帮助发现和对接优质资源"
      hideHeader
      panels={[
        { key: 'market', label: '市场分析', children: <MarketAnalysis />, fullHeight: true },
        { key: 'competitor', label: '竞品调研', children: <CompetitorResearch />, fullHeight: true },
        { key: 'trend', label: '趋势洞察', children: <TrendInsight />, fullHeight: true },
        { key: 'opportunity', label: '机会评估', children: <OpportunityEval />, fullHeight: true },
      ]}
    />
  );
};

export default ScoutAI;
