/**
 * Hero 统计卡片 — 大数字 + 标签 + 趋势箭头
 */
import React from 'react';
import { SCOUT_FONTS } from '../scout-theme';

interface ScoutHeroStatProps {
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
  bgColor?: string;
}

const ScoutHeroStat: React.FC<ScoutHeroStatProps> = ({
  value, label, trend = 'neutral', color, bgColor = 'transparent',
}) => {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? '#788c5d' : trend === 'down' ? '#ff6b6b' : '#8b949e';

  return (
    <div className="scout-fade-in-up" style={{
      background: bgColor,
      borderRadius: 10,
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontSize: 28, fontWeight: 700, color,
          fontFamily: SCOUT_FONTS.heading,
          lineHeight: 1,
        }}>{value}</span>
        <span style={{ fontSize: 14, color: trendColor, fontWeight: 600 }}>
          {trendIcon}
        </span>
      </div>
      <span style={{
        fontSize: 11, color: '#8b949e',
        fontFamily: SCOUT_FONTS.body,
        letterSpacing: 0.5,
      }}>{label}</span>
    </div>
  );
};

export default ScoutHeroStat;
