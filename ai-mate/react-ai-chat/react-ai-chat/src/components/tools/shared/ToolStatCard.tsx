/**
 * 工具箱统计卡片
 * 镜像 ButlerStatCard.tsx 的 rAF 缓动递增数字
 * 顶部 2px 主色细线 + 玻璃拟态背景
 */
import React, { useState, useEffect, useRef } from 'react';
import { TOOL_FONTS, TOOL_SPACING } from '../tool-theme';

interface ToolStatCardProps {
  value: number | string;
  label: string;
  suffix?: string;
  icon?: React.ReactNode;
  accent: string;
  trend?: 'up' | 'down' | 'neutral';
}

/** rAF 缓动递增（smoothstep） */
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
      const eased = t * t * (3 - 2 * t);
      setDisplay(Math.round(from + delta * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return display;
};

const ToolStatCard: React.FC<ToolStatCardProps> = ({
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
  const trendMap = {
    up: { icon: '\u2191', color: '#52c41a' },
    down: { icon: '\u2193', color: '#ff4d4f' },
    neutral: { icon: '\u2192', color: '#8c8c8c' },
  };
  const trendInfo = trend ? trendMap[trend] : null;

  return (
    <div
      className="tool-glass-card tool-number-count"
      style={{
        position: 'relative',
        padding: `${TOOL_SPACING.lg}px ${TOOL_SPACING.xl}px`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: TOOL_SPACING.xs,
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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: TOOL_SPACING.xs }}>
        {icon && (
          <span style={{ fontSize: 14, opacity: 0.8, color: accent }}>{icon}</span>
        )}
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: accent,
            fontFamily: TOOL_FONTS.heading,
            lineHeight: 1,
          }}
        >
          {displayValue}
        </span>
        {suffix && (
          <span style={{ fontSize: 13, color: accent, opacity: 0.8 }}>{suffix}</span>
        )}
        {trendInfo && (
          <span
            style={{ fontSize: 13, fontWeight: 600, color: trendInfo.color, marginLeft: 4 }}
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
          fontFamily: TOOL_FONTS.body,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </span>
    </div>
  );
};

export default ToolStatCard;
