/**
 * 探路者AI (ScoutAI) - 资源对接
 */

import React, { useState } from 'react';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import ChatLayout from '../components/ChatLayout';
import SupplierSearchPanel from '../components/scout/SupplierSearchPanel';
import PartnerRecommendationPanel from '../components/scout/PartnerRecommendationPanel';
import MarketAnalysisPanel from '../components/scout/MarketAnalysisPanel';
import IndustryReportPanel from '../components/scout/IndustryReportPanel';
import ResourceComparePanel from '../components/scout/ResourceComparePanel';
import type { Supplier } from '../services/scoutService';

interface ScoutAIProps {
  activeFeature?: string | null;
  onFeatureChange?: (feature: string | null) => void;
}

const ScoutAI: React.FC<ScoutAIProps> = ({ activeFeature: propFeature, onFeatureChange }) => {
  const [localFeature, setLocalFeature] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Supplier[]>([]);

  const activeFeature = propFeature !== undefined ? propFeature : localFeature;
  const setActiveFeature = onFeatureChange || setLocalFeature;

  const renderFeaturePanel = () => {
    if (!activeFeature) return undefined;

    const panelContent = (() => {
      switch (activeFeature) {
        case 'supplier':
          return <SupplierSearchPanel onSelectSuppliers={(suppliers) => setSearchResults(suppliers)} />;
        case 'partner':
          return <PartnerRecommendationPanel />;
        case 'market':
          return <MarketAnalysisPanel />;
        case 'industry':
          return <IndustryReportPanel />;
        case 'compare':
          return <ResourceComparePanel suppliers={searchResults} />;
        default:
          return (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              该功能正在开发中，敬请期待...
            </div>
          );
      }
    })();

    return (
      <div style={{ position: 'relative' }}>
        <Button type="text" icon={<CloseOutlined />} size="small"
          onClick={() => setActiveFeature(null)}
          style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        {panelContent}
      </div>
    );
  };

  return (
    <ChatLayout
      role="scout"
      title="探路者AI"
      icon={<SearchOutlined />}
      description="资源对接专家 - 帮助发现和对接优质资源"
      featurePanel={renderFeaturePanel()}
    />
  );
};

export default ScoutAI;
