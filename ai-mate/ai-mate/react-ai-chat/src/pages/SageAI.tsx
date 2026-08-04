/**
 * 军师AI (SageAI) - 运营策略
 */

import React from 'react';
import { BulbOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import ChatLayout from '../components/ChatLayout';

const SageAI: React.FC = () => {
  const menuItems: MenuProps['items'] = [
    { key: 'strategy', label: '运营策略规划' },
    { key: 'analysis', label: '数据分析诊断' },
    { key: 'marketing', label: '营销方案制定' },
    { key: 'growth', label: '增长策略建议' },
    { key: 'benchmark', label: '行业对标分析' },
  ];

  return (
    <ChatLayout
      role="sage"
      title="军师AI"
      icon={<BulbOutlined />}
      description="运营策略顾问 - 数据驱动的决策支持"
      menuItems={menuItems}
    />
  );
};

export default SageAI;
