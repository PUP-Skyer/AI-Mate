/**
 * 资源匹配度环形图 — 小尺寸环形
 * 颜色: >80绿 / 60-80金 / <60红
 * stroke-dasharray + stroke-dashoffset + requestAnimationFrame 缓动
 * 参考 scout/svg/ProgressRing.tsx 范式
 */
import React, { useState, useEffect } from 'react';
import { BUTLER_FONTS } from '../butler-theme';

interface MatchScoreRingProps {
  /** 匹配分 0-100 */
  score: number;
  /** 环形尺寸，默认 64 */
  size?: number;
}

/** 按分取色：>80 绿 / 60-80 金 / <60 红 */
const getScoreColor = (s: number): string => {
  if (s > 80) return '#52c41a';
  if (s >= 60) return '#faad14';
  return '#ff4d4f';
};

const MatchScoreRing: React.FC<MatchScoreRingProps> = ({ score, size = 64 }) => {
  const [display, setDisplay] = useState(0);

  // requestAnimationFrame + smoothstep 缓动
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 800;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t * t * (3 - 2 * t);
      setDisplay(score * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const sw = Math.max(3, size * 0.1);
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (display / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 背景环 */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(235,47,150,0.08)"
        strokeWidth={sw}
      />
      {/* 值环：stroke-dasharray + stroke-dashoffset */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{
          filter: `drop-shadow(0 0 4px ${color}55)`,
          transition: 'stroke 0.3s',
        }}
      />
      {/* 中心分数 */}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={size * 0.3}
        fontWeight={700}
        fontFamily={BUTLER_FONTS.heading}
        style={{ transition: 'fill 0.3s' }}
      >
        {Math.round(display)}
      </text>
    </svg>
  );
};

export default MatchScoreRing;
