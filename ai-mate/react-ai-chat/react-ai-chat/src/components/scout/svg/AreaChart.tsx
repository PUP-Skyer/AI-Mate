/**
 * 纯 SVG 区域面积图 - 带渐变填充、网格和动画
 * 用于趋势增长可视化，支持多组数据系列
 */
import React, { useState, useEffect } from 'react';
import { SCOUT_FONTS } from '../scout-theme';

interface AreaSeries {
  name: string;
  data: number[];
  color: string;
}

interface AreaChartProps {
  labels: string[];
  series: AreaSeries[];
  width?: number;
  height?: number;
  textColor?: string;
  gridColor?: string;
  animated?: boolean;
  showDots?: boolean;
}

const AreaChart: React.FC<AreaChartProps> = ({
  labels,
  series,
  width = 400,
  height = 180,
  textColor = '#141413',
  gridColor = '#e8e6dc',
  animated = true,
  showDots = true,
}) => {
  const [progress, setProgress] = useState(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 1100, 1);
      setProgress(t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animated]);

  const pad = { top: 12, right: 16, bottom: 28, left: 36 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const allValues = series.flatMap(s => s.data);
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;

  const toX = (i: number) => pad.left + (labels.length > 1 ? (i / (labels.length - 1)) * chartW : chartW / 2);
  const toY = (v: number) => pad.top + chartH - ((v - minVal) / range) * chartH;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      {/* 网格 */}
      {[0, 0.25, 0.5, 0.75, 1].map((v, i) => {
        const y = pad.top + chartH * (1 - v);
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={width - pad.right} y2={y}
              stroke={gridColor} strokeWidth={0.5} strokeDasharray="4 4" />
            <text x={pad.left - 6} y={y + 3} textAnchor="end"
              fill={textColor} fontSize={9} opacity={0.4}>
              {Math.round(minVal + range * v)}
            </text>
          </g>
        );
      })}

      {/* X 轴标签 */}
      {labels.map((label, i) => (
        <text key={i} x={toX(i)} y={height - 6} textAnchor="middle"
          fill={textColor} fontSize={10} opacity={0.5}
          fontFamily={SCOUT_FONTS.body}>
          {label}
        </text>
      ))}

      {/* 面积曲线 */}
      {series.map((s, si) => {
        const points = s.data.map((v, i) => `${toX(i)},${toY(v * progress)}`);
        const linePath = `M${points.join('L')}`;
        const areaPath = `${linePath}L${toX(s.data.length - 1)},${pad.top + chartH}L${toX(0)},${pad.top + chartH}Z`;
        const gradId = `area-grad-${si}`;

        return (
          <g key={si}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradId})`} />
            <path d={linePath} fill="none" stroke={s.color}
              strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 1px 3px ${s.color}33)` }} />
            {showDots && s.data.map((v, i) => (
              <circle key={i} cx={toX(i)} cy={toY(v * progress)}
                r={3.5} fill={s.color} stroke="#fff" strokeWidth={1.5} />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

export default AreaChart;
