/**
 * 管家AI (ButlerAI) - 超级个体创业护航系统
 * 功能：常见问题解答、问题反馈、售后咨询、成果展示、数据面板
 */

import React, { useState } from 'react';
import { CustomerServiceOutlined, CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import ChatLayout from '../components/ChatLayout';
import FAQPanel from '../components/butler/FAQPanel';
import FeedbackPanel from '../components/butler/FeedbackPanel';
import AfterSalesPanel from '../components/butler/AfterSalesPanel';
import ResultsPanel from '../components/butler/ResultsPanel';
import DataDashboard from '../components/butler/DataDashboard';
import ProjectManagementPanel from '../components/butler/ProjectManagementPanel';

interface ButlerAIProps {
  activeFeature?: string | null;
  onFeatureChange?: (feature: string | null) => void;
}

const ButlerAI: React.FC<ButlerAIProps> = ({ activeFeature: propFeature, onFeatureChange }) => {
  const [localFeature, setLocalFeature] = useState<string | null>(null);

  const activeFeature = propFeature !== undefined ? propFeature : localFeature;
  const setActiveFeature = onFeatureChange || setLocalFeature;

  const renderFeaturePanel = () => {
    if (!activeFeature) return undefined;

    const panelContent = (() => {
      switch (activeFeature) {
        case 'dashboard':
          return <DataDashboard />;
        case 'results':
          return <ResultsPanel />;
        case 'project-management':
          return <ProjectManagementPanel />;
        case 'faq':
          return <FAQPanel />;
        case 'feedback':
          return <FeedbackPanel />;
        case 'aftercare':
          return <AfterSalesPanel />;
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
      role="butler"
      title="管家AI"
      icon={<CustomerServiceOutlined />}
      description="超级个体创业护航 - 为你的创业之路保驾护航"
      featurePanel={renderFeaturePanel()}
    />
  );
};

export default ButlerAI;
