/**
 * 探路者AI (ScoutAI) - 资源对接
 */

import React from 'react';
import { SearchOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import ChatLayout from '../components/ChatLayout';

const ScoutAI: React.FC = () => {
  const menuItems: MenuProps['items'] = [
    { key: 'supplier', label: '供应商搜索' },
    { key: 'partner', label: '合作伙伴推荐' },
    { key: 'market', label: '市场行情分析' },
    { key: 'industry', label: '行业报告查询' },
    { key: 'compare', label: '资源对比分析' },
  ];

  return (
    <ChatLayout
      role="scout"
      title="探路者AI"
      icon={<SearchOutlined />}
      description="资源对接专家 - 帮助发现和对接优质资源"
      menuItems={menuItems}
    />
  );
};

export default ScoutAI;
