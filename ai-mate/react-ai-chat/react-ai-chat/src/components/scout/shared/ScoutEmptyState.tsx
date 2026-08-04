/**
 * 空状态组件 — 每个面板传入不同的 SVG 场景图
 */
import React from 'react';
import { Typography } from 'antd';
import { SCOUT_FONTS } from '../scout-theme';

const { Text } = Typography;

interface ScoutEmptyStateProps {
  scene: React.ReactNode;
  title: string;
  subtitle: string;
  hint: string;
  textColor?: string;
  subColor?: string;
}

const ScoutEmptyState: React.FC<ScoutEmptyStateProps> = ({
  scene, title, subtitle, hint,
  textColor = '#e6edf3',
  subColor = '#8b949e',
}) => (
  <div style={{
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 16, padding: 32,
  }}>
    <div className="scout-float" style={{ marginBottom: 8 }}>
      {scene}
    </div>
    <Text style={{
      color: textColor, fontSize: 18, fontWeight: 600,
      fontFamily: SCOUT_FONTS.heading,
    }}>{title}</Text>
    <Text style={{
      color: subColor, fontSize: 13,
      fontFamily: SCOUT_FONTS.body, textAlign: 'center',
      maxWidth: 320, lineHeight: 1.6,
    }}>{subtitle}</Text>
    <Text style={{
      color: subColor, fontSize: 11, opacity: 0.6,
      fontFamily: SCOUT_FONTS.mono,
    }}>{hint}</Text>
  </div>
);

export default ScoutEmptyState;
