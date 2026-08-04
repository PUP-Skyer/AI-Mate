/**
 * 进度环 — 用于可行性各维度展示
 */
import React, { useState, useEffect } from 'react';
import { SCOUT_FONTS } from '../scout-theme';

interface ProgressRingProps {
  value: number;
  label: string;
  size?: number;
  color: string;
  trackColor?: string;
  textColor?: string;
  animated?: boolean;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  value, label, size = 80, color,
  trackColor = 'rgba(255,255,255,0.06)',
  textColor = '#f0f0f0',
  animated = true,
}) => {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);

  useEffect(() => {
    if (!animated) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 800, 1);
      const eased = t * t * (3 - 2 * t);
      setDisplayValue(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, animated]);

  const r = size * 0.38;
  const sw = size * 0.06;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (displayValue / 10) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={trackColor} strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{
            transition: 'stroke-dashoffset 0.3s',
            filter: `drop-shadow(0 0 4px ${color}44)`,
          }}
        />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize={size * 0.22} fontWeight={700}
          fontFamily={SCOUT_FONTS.heading}>
          {displayValue}
        </text>
      </svg>
      <span style={{
        fontSize: 10, color: textColor, opacity: 0.6,
        fontFamily: SCOUT_FONTS.body, textAlign: 'center',
      }}>{label}</span>
    </div>
  );
};

export default ProgressRing;
