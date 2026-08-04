/**
 * 工匠AI (MakerAI) - 内容生成
 */

import React from 'react';
import { ToolOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import ChatLayout from '../components/ChatLayout';

const MakerAI: React.FC = () => {
  const menuItems: MenuProps['items'] = [
    { key: 'copywriting', label: '营销文案创作' },
    { key: 'social', label: '社交媒体内容' },
    { key: 'video', label: '短视频脚本' },
    { key: 'product', label: '产品描述撰写' },
    { key: 'brand', label: '品牌故事策划' },
  ];

  return (
    <ChatLayout
      role="maker"
      title="工匠AI"
      icon={<ToolOutlined />}
      description="内容创作专家 - 创意无限的文案生成"
      menuItems={menuItems}
    />
  );
};

export default MakerAI;
