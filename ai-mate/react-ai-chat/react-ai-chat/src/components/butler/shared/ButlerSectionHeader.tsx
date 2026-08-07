/**
 * 区域标题 — 装饰线（accent 到透明渐变）+ 标题 + 可选图标
 * 参考 scout/shared/ScoutSectionHeader.tsx 的模式，适配管家无衬线字体体系
 */
import React from 'react';
import { BUTLER_FONTS, BUTLER_SPACING } from '../butler-theme';

interface ButlerSectionHeaderProps {
  title: string;
  subtitle?: string;
  /** 主题色（accent）— 装饰线与图标着色 */
  accent: string;
  /** 前缀图标（emoji 或文本） */
  icon?: string;
}

const ButlerSectionHeader: React.FC<ButlerSectionHeaderProps> = ({
  title,
  subtitle,
  accent,
  icon,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: BUTLER_SPACING.sm,
      marginBottom: BUTLER_SPACING.md,
    }}
  >
    {icon && (
      <span style={{ fontSize: 14, color: accent, lineHeight: 1 }}>{icon}</span>
    )}
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: accent,
          fontFamily: BUTLER_FONTS.heading,
          letterSpacing: 0.5,
        }}
      >
        {title}
      </span>
      {subtitle && (
        <span
          style={{
            fontSize: 10,
            color: '#8c8c8c',
            fontFamily: BUTLER_FONTS.body,
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
    {/* 装饰线：accent 到透明渐变 */}
    <div
      style={{
        flex: 1,
        height: 1,
        background: `linear-gradient(90deg, ${accent}44, transparent)`,
        marginLeft: BUTLER_SPACING.sm,
      }}
    />
  </div>
);

export default ButlerSectionHeader;
