/**
 * Scout 内容区块容器组件
 * 统一卡片样式，支持暗色/亮色模式
 */
import React from 'react';
import { Card } from 'antd';
import { useTheme } from '../../../contexts/ThemeContext';

interface ScoutSectionCardProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
  extra?: React.ReactNode;
}

const ScoutSectionCard: React.FC<ScoutSectionCardProps> = ({
  title,
  children,
  accentColor,
  className = '',
  style,
  extra,
}) => {
  const { isDarkMode } = useTheme();

  const titleElement = title ? (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {accentColor && (
        <span style={{
          width: 4, height: 16, borderRadius: 2,
          background: accentColor, display: 'inline-block',
        }} />
      )}
      <span style={{ color: isDarkMode ? 'var(--text-primary)' : '#1E293B', fontWeight: 600, fontSize: 14 }}>
        {title}
      </span>
    </span>
  ) : undefined;

  return (
    <Card
      title={titleElement}
      extra={extra}
      className={className}
      style={{
        borderRadius: 12,
        border: isDarkMode ? '1px solid var(--border-light)' : '1px solid var(--border-light)',
        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.06)',
        background: isDarkMode ? 'var(--bg-card)' : '#fff',
        ...style,
      }}
      styles={{
        header: { borderBottom: `1px solid ${isDarkMode ? 'var(--border-light)' : '#f0f0f0'}`, padding: '12px 16px' },
        body: { padding: '16px' },
      }}
    >
      {children}
    </Card>
  );
};

export default ScoutSectionCard;
