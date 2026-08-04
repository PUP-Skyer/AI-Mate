/**
 * SVG 热度半圆弧仪表
 * 渐变弧 + 指针动画，0-100 热度评分
 */

import React, { useState, useEffect, useRef } from 'react';

interface HeatGaugeProps {
  score: number;          // 0-100
  label?: string;
  size?: number;
  textColor?: string;
  trackColor?: string;
  animated?: boolean;
}

const HeatGauge: React.FC<HeatGaugeProps> = ({
  score,
  label,
  size = 180,
  textColor = '#141413',
  trackColor = 'rgba(0,0,0,0.06)',
  animated = true,
}) => {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!animated) { setDisplayScore(score); return; }
    const start = performance.now();
    const duration = 1000;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t * t * (3 - 2 * t);
      setDisplayScore(Math.round(score * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score, animated]);

  const cx = size / 2;
  const cy = size * 0.55;
  const r = size * 0.38;
  const strokeWidth = size * 0.07;

  // 半圆弧：从 180° 到 360°（上半弧）
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcStart = { x: cx + r * Math.cos(Math.PI), y: cy + r * Math.sin(Math.PI) };
  const arcEnd = { x: cx + r * Math.cos(0), y: cy + r * Math.sin(0) };
  const bgPath = `M${arcStart.x},${arcStart.y} A${r},${r} 0 0,1 ${arcEnd.x},${arcEnd.y}`;

  // 值弧
  const valueAngle = Math.PI - (displayScore / 100) * Math.PI;
  const valEnd = { x: cx + r * Math.cos(valueAngle), y: cy + r * Math.sin(valueAngle) };
  const largeArc = displayScore > 50 ? 1 : 0;
  const valPath = `M${arcStart.x},${arcStart.y} A${r},${r} 0 ${largeArc},1 ${valEnd.x},${valEnd.y}`;

  // 根据分数获取颜色
  const getColor = (v: number) => {
    if (v < 30) return '#6a9bcc';
    if (v < 60) return '#d97757';
    return '#ff6b6b';
  };

  const color = getColor(displayScore);

  // 指针端点
  const pointerAngle = Math.PI - (displayScore / 100) * Math.PI;
  const pointerLen = r * 0.75;
  const pointerEnd = {
    x: cx + pointerLen * Math.cos(pointerAngle),
    y: cy + pointerLen * Math.sin(pointerAngle),
  };

  // 渐变 ID
  const gradId = `heat-grad-${Math.round(score)}`;

  return (
    <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6a9bcc" />
          <stop offset="50%" stopColor="#d97757" />
          <stop offset="100%" stopColor="#ff6b6b" />
        </linearGradient>
      </defs>

      {/* 背景弧 */}
      <path d={bgPath} fill="none" stroke={trackColor} strokeWidth={strokeWidth} strokeLinecap="round" />

      {/* 渐变弧（底层全弧） */}
      {displayScore > 0 && (
        <path
          d={valPath}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}44)` }}
        />
      )}

      {/* 指针 */}
      <line
        x1={cx}
        y1={cy}
        x2={pointerEnd.x}
        y2={pointerEnd.y}
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        style={{ transition: 'stroke 0.3s' }}
      />
      <circle cx={cx} cy={cy} r={4} fill={color} />

      {/* 分数 */}
      <text
        x={cx}
        y={cy + 22}
        textAnchor="middle"
        fill={color}
        fontSize={size * 0.15}
        fontWeight={700}
        fontFamily="'Poppins', Arial, sans-serif"
      >
        {displayScore}
      </text>

      {/* 标签 */}
      {label && (
        <text
          x={cx}
          y={cy + 38}
          textAnchor="middle"
          fill={textColor}
          fontSize={size * 0.065}
          fontFamily="'Lora', Georgia, serif"
          opacity={0.6}
        >
          {label}
        </text>
      )}
    </svg>
  );
};

export default HeatGauge;
