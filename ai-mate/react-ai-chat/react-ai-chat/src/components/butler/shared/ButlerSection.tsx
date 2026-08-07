/**
 * 分区容器组件 — 左侧 3px seal 色渐变竖线 + 无衬线标题
 * 参考 scout/shared/ScoutSectionHeader.tsx 的模式，扩展为带 children 的容器
 */
import React from 'react';
import { BUTLER_FONTS, BUTLER_SPACING, BUTLER_RADIUS } from '../butler-theme';

interface ButlerSectionProps {
  /** 面板序号（壹/贰/叁/肆），可选展示 */
  no?: string;
  title: string;
  subtitle?: string;
  /** 主题色（accent）— 用于左侧竖线与序号 */
  accent: string;
  children?: React.ReactNode;
}

const ButlerSection: React.FC<ButlerSectionProps> = ({
  no,
  title,
  subtitle,
  accent,
  children,
}) => (
  <section
    className="butler-fade-in-up butler-stagger-1"
    style={{
      position: 'relative',
      paddingLeft: BUTLER_SPACING.lg,
      marginBottom: BUTLER_SPACING.xl,
    }}
  >
    {/* 左侧 3px seal 色到透明渐变竖线 */}
    <span
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        borderRadius: BUTLER_RADIUS.pill,
        background: `linear-gradient(to bottom, ${accent}, ${accent}00)`,
      }}
    />

    {/* 标题行 */}
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: BUTLER_SPACING.sm,
        marginBottom: BUTLER_SPACING.md,
      }}
    >
      {no && (
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: accent,
            fontFamily: BUTLER_FONTS.mono,
            opacity: 0.7,
            letterSpacing: 1,
          }}
        >
          {no}
        </span>
      )}
      <h3
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 700,
          color: '#1a1a1a',
          fontFamily: BUTLER_FONTS.heading,
          letterSpacing: 0.3,
        }}
      >
        {title}
      </h3>
      {subtitle && (
        <span
          style={{
            fontSize: 12,
            color: '#8c8c8c',
            fontFamily: BUTLER_FONTS.body,
          }}
        >
          {subtitle}
        </span>
      )}
    </div>

    {children}
  </section>
);

export default ButlerSection;
