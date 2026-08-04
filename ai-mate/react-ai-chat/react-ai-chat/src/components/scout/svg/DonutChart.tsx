/**
 * 纯 SVG 环形饼图 - 带动画、中心文字、图例
 * 用于市场占比、类别分布等可视化
 */
import React, { useState, useEffect } from 'react';
import { SCOUT_FONTS } from '../scout-theme';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  textColor?: string;
  animated?: boolean;
  showLegend?: boolean;
}

const DonutChart: React.FC<DonutChartProps> = ({
  slices,
  size = 160,
  thickness = 18,
  centerLabel = '',
  centerValue = '',
  textColor = '#141413',
  animated = true,
  showLegend = true,
}) => {
  const [progress, setProgress] = useState(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 900, 1);
      setProgress(t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animated]);

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;

  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 背景圆环 */}
        <circle cx={cx} cy={cy} r={r}
          fill="none" stroke={textColor} strokeOpacity={0.06}
          strokeWidth={thickness} />

        {/* 各扇区 */}
        {slices.map((slice, i) => {
          const fraction = slice.value / total;
          const dashLength = fraction * circumference * progress;
          const gap = circumference - dashLength;
          const rotation = -90 + (offset / total) * 360;
          offset += slice.value;

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth={thickness}
              strokeDasharray={`${dashLength} ${gap}`}
              strokeLinecap="butt"
              transform={`rotate(${rotation} ${cx} ${cy})`}
              style={{ filter: `drop-shadow(0 0 4px ${slice.color}44)` }}
            />
          );
        })}

        {/* 中心文字 */}
        {centerValue && (
          <text x={cx} y={cy - 2} textAnchor="middle"
            fill={textColor} fontSize={20} fontWeight={700}
            fontFamily={SCOUT_FONTS.heading}>
            {centerValue}
          </text>
        )}
        {centerLabel && (
          <text x={cx} y={cy + 16} textAnchor="middle"
            fill={textColor} fontSize={10} opacity={0.5}
            fontFamily={SCOUT_FONTS.body}>
            {centerLabel}
          </text>
        )}
      </svg>

      {/* 图例 */}
      {showLegend && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {slices.map((s, i) => (
            <div key={i} className={`scout-fade-in-up scout-stagger-${Math.min(i + 1, 8)}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: 2,
                background: s.color,
                boxShadow: `0 0 4px ${s.color}44`,
              }} />
              <span style={{
                fontSize: 11, color: textColor, opacity: 0.7,
                fontFamily: SCOUT_FONTS.body,
              }}>
                {s.label}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600, color: s.color,
                fontFamily: SCOUT_FONTS.heading,
              }}>
                {Math.round((s.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonutChart;
