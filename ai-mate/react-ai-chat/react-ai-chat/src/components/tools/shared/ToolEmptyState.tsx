/**
 * 工具箱空状态
 * 镜像 ScoutEmptyState.tsx 的浮动场景图设计
 */
import React from 'react';
import { Typography } from 'antd';
import { TOOL_FONTS } from '../tool-theme';

const { Text } = Typography;

interface ToolEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent?: string;
}

const ToolEmptyState: React.FC<ToolEmptyStateProps> = ({
  icon,
  title,
  subtitle,
  accent = '#1677ff',
}) => (
  <div
    className="tool-fade-in-up"
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 32,
    }}
  >
    <div
      className="tool-float"
      style={{
        marginBottom: 8,
        color: accent,
        fontSize: 48,
        opacity: 0.6,
      }}
    >
      {icon}
    </div>
    <Text
      style={{
        color: '#1a1a1a',
        fontSize: 16,
        fontWeight: 600,
        fontFamily: TOOL_FONTS.heading,
      }}
    >
      {title}
    </Text>
    <Text
      style={{
        color: '#8c8c8c',
        fontSize: 13,
        fontFamily: TOOL_FONTS.body,
        textAlign: 'center',
        maxWidth: 320,
        lineHeight: 1.6,
      }}
    >
      {subtitle}
    </Text>
  </div>
);

export default ToolEmptyState;
