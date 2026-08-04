/**
 * 章节导航组件 - 左侧章节列表
 */

import React from 'react';
import { Menu, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface ChapterNavProps {
  chapters: Chapter[];
  activeChapterId: string | null;
  onSelect: (id: string) => void;
}

const ChapterNav: React.FC<ChapterNavProps> = ({
  chapters,
  activeChapterId,
  onSelect,
}) => {
  return (
    <div
      style={{
        width: 240,
        borderRight: '1px solid #f0f0f0',
        padding: '16px 0',
        background: '#fafafa',
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text strong>章节目录</Text>
        <PlusOutlined style={{ cursor: 'pointer', color: '#1890ff' }} />
      </div>
      <Menu
        mode="inline"
        selectedKeys={activeChapterId ? [activeChapterId] : []}
        onClick={({ key }) => onSelect(key)}
        style={{ border: 'none', background: 'transparent' }}
        items={chapters.map((ch) => ({
          key: ch.id,
          label: (
            <span>
              {ch.order}. {ch.title}
              {ch.content && (
                <Text type="success" style={{ marginLeft: 8, fontSize: 12 }}>
                  ✓
                </Text>
              )}
            </span>
          ),
        }))}
      />
    </div>
  );
};

export default ChapterNav;
