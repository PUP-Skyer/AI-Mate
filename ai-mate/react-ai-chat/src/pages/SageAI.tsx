/**
 * 军师AI (SageAI) - 超级个体创业规划
 */

import React, { useState } from 'react';
import { BulbOutlined, CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import ChatLayout from '../components/ChatLayout';
import EntrepreneurshipPlanning from '../components/sage/EntrepreneurshipPlanning';

interface SageAIProps {
  activeFeature?: string | null;
  onFeatureChange?: (feature: string | null) => void;
}

const SageAI: React.FC<SageAIProps> = ({ activeFeature: propFeature, onFeatureChange }) => {
  const [localFeature, setLocalFeature] = useState<string | null>(null);

  const activeFeature = propFeature !== undefined ? propFeature : localFeature;
  const setActiveFeature = onFeatureChange || setLocalFeature;

  const renderFeaturePanel = () => {
    if (!activeFeature) return undefined;

    const panelContent = (() => {
      switch (activeFeature) {
        case 'planning':
          return <EntrepreneurshipPlanning />;
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
      role="sage"
      title="军师AI"
      icon={<BulbOutlined />}
      description="超级个体创业规划 - 从0到1的完整方案"
      featurePanel={renderFeaturePanel()}
    />
  );
};

export default SageAI;
