/**
 * 协作工具栏组件
 */

import React from 'react';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  LinkOutlined,
  PictureOutlined,
  UndoOutlined,
  RedoOutlined,
  SaveOutlined,
} from '@ant-design/icons';

const CollabToolbar: React.FC = () => {
  const toolItems = [
    { icon: <BoldOutlined />, label: '加粗', key: 'bold' },
    { icon: <ItalicOutlined />, label: '斜体', key: 'italic' },
    { icon: <UnderlineOutlined />, label: '下划线', key: 'underline' },
    { type: 'divider' as const, key: 'd1' },
    { icon: <OrderedListOutlined />, label: '有序列表', key: 'ol' },
    { icon: <UnorderedListOutlined />, label: '无序列表', key: 'ul' },
    { type: 'divider' as const, key: 'd2' },
    { icon: <AlignLeftOutlined />, label: '左对齐', key: 'left' },
    { icon: <AlignCenterOutlined />, label: '居中', key: 'center' },
    { icon: <AlignRightOutlined />, label: '右对齐', key: 'right' },
    { type: 'divider' as const, key: 'd3' },
    { icon: <LinkOutlined />, label: '插入链接', key: 'link' },
    { icon: <PictureOutlined />, label: '插入图片', key: 'image' },
    { type: 'divider' as const, key: 'd4' },
    { icon: <UndoOutlined />, label: '撤销', key: 'undo' },
    { icon: <RedoOutlined />, label: '重做', key: 'redo' },
    { type: 'divider' as const, key: 'd5' },
    { icon: <SaveOutlined />, label: '保存', key: 'save' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 24px',
        background: '#fafafa',
        borderBottom: '1px solid #f0f0f0',
        gap: 4,
        flexWrap: 'wrap',
      }}
    >
      {toolItems.map((item) => {
        if ('type' in item && item.type === 'divider') {
          return (
            <div
              key={item.key}
              style={{
                width: 1,
                height: 20,
                background: '#e8e8e8',
                margin: '0 4px',
              }}
            />
          );
        }
        return (
          <div
            key={item.key}
            style={{
              padding: '4px 8px',
              cursor: 'pointer',
              borderRadius: 4,
              fontSize: 14,
              color: '#595959',
              transition: 'all 0.2s',
            }}
            title={item.label}
          >
            {item.icon}
          </div>
        );
      })}
    </div>
  );
};

export default CollabToolbar;
