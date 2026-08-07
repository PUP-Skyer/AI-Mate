/**
 * 统计卡片 — 顶部 2px 主色细线 + rAF 缓动递增数字
 * 参考 scout/svg/ProgressRing.tsx 的 requestAnimationFrame 范式
 */
import React, { useState, useEffect, useRef } from 'react';
import { BUTLER_FONTS, BUTLER_SPACING, BUTLER_RADIUS, BUTLER_GRADIENTS, BUTLER_SHADOWS } from '../butler-theme';

interface ButlerStatCardProps {
  /** 数值（number 触发 rAF 递增动画，string 直接展示） */
  value: number | string;
  label: string;
  /** 数值后缀（如 %、人、个） */
  suffix?: string;
  /** 前缀图标（emoji 或文本） */
  icon?: string;
  /** 主题色（accent）— 顶部细线 + 数值高亮 */
  accent: string;
  /** 趋势方向 */
  trend?: 'up' | 'down' | 'neutral';
}

const TREND_MAP = {
  up: { icon: '↑', color: '#52c41a' },
  down: { icon: '↓', color: '#ff4d4f' },
  neutral: { icon: '→', color: '#8c8c8c' },
} as const;

/** rAF 缓动递增数字（smoothstep 缓动函数） */
const useCountUp = (target: number, duration = 800): number => {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return;

    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // smoothstep 缓动：t * t * (3 - 2t)
      const eased = t * t * (3 - 2 * t);
      setDisplay(Math.round(from + delta * eased));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return display;
};

const ButlerStatCard: React.FC<ButlerStatCardProps> = ({
  value,
  label,
  suffix,
  icon,
  accent,
  trend,
}) => {
  const isNumeric = typeof value === 'number';
  const animatedValue = useCountUp(isNumeric ? (value as number) : 0);
  const displayValue = isNumeric ? animatedValue : value;
  const trendInfo = trend ? TREND_MAP[trend] : null;

  return (
    <div
      className="butler-number-count"
      style={{
        position: 'relative',
        background: BUTLER_GRADIENTS.statCard,
        borderRadius: BUTLER_RADIUS.md,
        padding: `${BUTLER_SPACING.lg}px ${BUTLER_SPACING.xl}px`,
        boxShadow: BUTLER_SHADOWS.card,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: BUTLER_SPACING.xs,
      }}
    >
      {/* 顶部 2px 主色细线 */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          height: 2,
          background: accent,
        }}
      />

      {/* 数值行 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: BUTLER_SPACING.xs }}>
        {icon && (
          <span style={{ fontSize: 14, opacity: 0.8 }}>{icon}</span>
        )}
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: accent,
            fontFamily: BUTLER_FONTS.heading,
            lineHeight: 1,
          }}
        >
          {displayValue}
        </span>
        {suffix && (
          <span
            style={{
              fontSize: 13,
              color: accent,
              fontFamily: BUTLER_FONTS.body,
              opacity: 0.8,
            }}
          >
            {suffix}
          </span>
        )}
        {trendInfo && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: trendInfo.color,
              marginLeft: BUTLER_SPACING.xs,
            }}
          >
            {trendInfo.icon}
          </span>
        )}
      </div>

      {/* 标签 */}
      <span
        style={{
          fontSize: 11,
          color: '#8c8c8c',
          fontFamily: BUTLER_FONTS.body,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </span>
    </div>
  );
};

export default ButlerStatCard;
