/**
 * 区域标题 — 带装饰线和小图标
 */
import React from 'react';
import { SCOUT_FONTS } from '../scout-theme';

interface ScoutSectionHeaderProps {
  title: string;
  icon?: string;
  color: string;
  subtitle?: string;
}

const ScoutSectionHeader: React.FC<ScoutSectionHeaderProps> = ({
  title, icon, color, subtitle,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
    {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{
        fontSize: 13, fontWeight: 600, color,
        fontFamily: SCOUT_FONTS.heading,
        letterSpacing: 0.5,
      }}>{title}</span>
      {subtitle && (
        <span style={{
          fontSize: 10, color: '#8b949e',
          fontFamily: SCOUT_FONTS.body,
        }}>{subtitle}</span>
      )}
    </div>
    <div style={{
      flex: 1, height: 1,
      background: `linear-gradient(90deg, ${color}44, transparent)`,
      marginLeft: 8,
    }} />
  </div>
);

export default ScoutSectionHeader;
