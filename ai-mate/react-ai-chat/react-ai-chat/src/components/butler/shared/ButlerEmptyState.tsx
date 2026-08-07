/**
 * 空状态组件 — butler-float 浮动动画 + 粉色系空状态场景图
 * 各面板传入自定义 scene（ReactNode）以区分场景
 */
import React from 'react';
import { BUTLER_FONTS, BUTLER_SPACING } from '../butler-theme';

interface ButlerEmptyStateProps {
  /** 空状态场景图（SVG / emoji / 自定义节点） */
  scene?: React.ReactNode;
  title: string;
  subtitle?: string;
  hint?: string;
  /** 主题色（accent）— 用于标题高亮 */
  accent: string;
}

/** 默认粉色系空状态图（当未传入 scene 时使用） */
const DefaultScene: React.FC<{ accent: string }> = ({ accent }) => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
    {/* 外圈光晕 */}
    <circle cx="60" cy="60" r="50" fill={accent} opacity="0.06" />
    <circle cx="60" cy="60" r="36" fill={accent} opacity="0.08" />
    {/* 粉色空盒 */}
    <rect x="40" y="48" width="40" height="32" rx="6" fill={accent} opacity="0.18" />
    <rect x="44" y="44" width="32" height="8" rx="3" fill={accent} opacity="0.28" />
    {/* 问号 */}
    <text
      x="60"
      y="72"
      textAnchor="middle"
      fontSize="22"
      fontWeight={700}
      fill={accent}
      opacity="0.55"
      fontFamily="'Inter', 'PingFang SC', sans-serif"
    >
      ?
    </text>
  </svg>
);

const ButlerEmptyState: React.FC<ButlerEmptyStateProps> = ({
  scene,
  title,
  subtitle,
  hint,
  accent,
}) => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: BUTLER_SPACING.lg,
      padding: BUTLER_SPACING.xxl,
    }}
  >
    {/* 浮动场景图 */}
    <div className="butler-float" style={{ marginBottom: BUTLER_SPACING.sm }}>
      {scene ?? <DefaultScene accent={accent} />}
    </div>

    <span
      style={{
        color: '#1a1a1a',
        fontSize: 18,
        fontWeight: 600,
        fontFamily: BUTLER_FONTS.heading,
      }}
    >
      {title}
    </span>

    {subtitle && (
      <span
        style={{
          color: '#8c8c8c',
          fontSize: 13,
          fontFamily: BUTLER_FONTS.body,
          textAlign: 'center',
          maxWidth: 320,
          lineHeight: 1.6,
        }}
      >
        {subtitle}
      </span>
    )}

    {hint && (
      <span
        style={{
          color: '#8c8c8c',
          fontSize: 11,
          opacity: 0.6,
          fontFamily: BUTLER_FONTS.mono,
        }}
      >
        {hint}
      </span>
    )}
  </div>
);

export default ButlerEmptyState;
