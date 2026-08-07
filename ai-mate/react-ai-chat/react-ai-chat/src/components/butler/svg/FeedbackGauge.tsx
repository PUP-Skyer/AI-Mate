/**
 * 反馈情感仪表盘 — 半圆仪表盘(135°→405°弧)
 * 颜色按值切换: <40红 / <70金 / ≥70绿
 * 参考 scout/svg/ProgressRing.tsx 的 requestAnimationFrame + stroke-dasharray/offset + drop-shadow 范式
 */
import React, { useState, useEffect } from 'react';
import { BUTLER_FONTS } from '../butler-theme';

interface FeedbackGaugeProps {
  /** 情感指数 0-100 */
  value: number;
  /** 仪表盘尺寸，默认 160 */
  size?: number;
  /** 可选主题辉光色，默认按值取色 */
  accent?: string;
}

const COLOR_RED = '#ff4d4f';
const COLOR_GOLD = '#faad14';
const COLOR_GREEN = '#52c41a';

/** 按值取色：<40 红 / <70 金 / ≥70 绿 */
const getValueColor = (v: number): string => {
  if (v < 40) return COLOR_RED;
  if (v < 70) return COLOR_GOLD;
  return COLOR_GREEN;
};

const FeedbackGauge: React.FC<FeedbackGaugeProps> = ({
  value,
  size = 160,
  accent,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  // requestAnimationFrame + smoothstep 缓动
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t * t * (3 - 2 * t);
      setDisplayValue(value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const strokeWidth = size * 0.08;

  // 135° → 405°（270° 弧）
  const startAngle = 135;
  const endAngle = 405;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const point = (angle: number) => ({
    x: cx + r * Math.cos(toRad(angle)),
    y: cy + r * Math.sin(toRad(angle)),
  });

  const p0 = point(startAngle);
  const p1 = point(endAngle);
  // large-arc=1（270°>180°）, sweep=1（顺时针，y 轴向下）
  const arcPath = `M${p0.x},${p0.y} A${r},${r} 0 1 1 ${p1.x},${p1.y}`;
  const arcLength = r * toRad(endAngle - startAngle); // r * 1.5π

  const color = getValueColor(value);
  const glowColor = accent ?? color;
  const offset = arcLength * (1 - displayValue / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 背景弧 */}
      <path
        d={arcPath}
        fill="none"
        stroke="rgba(235,47,150,0.08)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* 值弧：stroke-dasharray + stroke-dashoffset */}
      {displayValue > 0 && (
        <path
          d={arcPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 6px ${glowColor}66)`,
            transition: 'stroke 0.3s',
          }}
        />
      )}
      {/* 中心百分比数字 */}
      <text
        x={cx}
        y={cy + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={size * 0.26}
        fontWeight={700}
        fontFamily={BUTLER_FONTS.heading}
        style={{ transition: 'fill 0.3s' }}
      >
        {Math.round(displayValue)}%
      </text>
      {/* 副标签 */}
      <text
        x={cx}
        y={cy + size * 0.2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(0,0,0,0.45)"
        fontSize={size * 0.075}
        fontFamily={BUTLER_FONTS.body}
      >
        反馈情感指数
      </text>
    </svg>
  );
};

export default FeedbackGauge;
