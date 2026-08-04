/**
 * 通用 SVG 雷达图组件
 * 支持 N 维度 + 多系列叠加，纯 SVG 实现
 */

import React, { useMemo, useState, useEffect } from 'react';

export interface RadarSeries {
  name: string;
  values: number[];       // 每个维度的值 0-10
  color: string;
}

interface RadarChartProps {
  dimensions: string[];     // 维度名称
  series: RadarSeries[];
  size?: number;            // SVG 尺寸（px）
  maxValue?: number;        // 最大值，默认 10
  labelColor?: string;
  gridColor?: string;
  animated?: boolean;
}

const RadarChart: React.FC<RadarChartProps> = ({
  dimensions,
  series,
  size = 280,
  maxValue = 10,
  labelColor = '#8b949e',
  gridColor = 'rgba(255,255,255,0.08)',
  animated = true,
}) => {
  const [animProgress, setAnimProgress] = useState(animated ? 0 : 1);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!animated) return;
    let frame: number;
    const start = performance.now();
    const duration = 800;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setAnimProgress(t * t * (3 - 2 * t)); // smoothstep
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animated, series]);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;
  const levels = 5;
  const angleStep = (2 * Math.PI) / dimensions.length;

  // 计算某维度某值的坐标
  const getPoint = (dimIdx: number, value: number): [number, number] => {
    const angle = angleStep * dimIdx - Math.PI / 2;
    const r = (value / maxValue) * radius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  // 网格多边形路径
  const gridPaths = useMemo(() => {
    return Array.from({ length: levels }, (_, level) => {
      const r = ((level + 1) / levels) * radius;
      const points = dimensions.map((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      });
      return `M${points.join('L')}Z`;
    });
  }, [dimensions, radius, cx, cy, angleStep, levels]);

  // 系列多边形路径
  const seriesPaths = useMemo(() => {
    return series.map((s) => {
      const points = s.values.map((v, i) => getPoint(i, v * animProgress));
      return `M${points.map((p) => `${p[0]},${p[1]}`).join('L')}Z`;
    });
  }, [series, animProgress, dimensions.length, radius, maxValue, cx, cy, angleStep]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {/* 网格 */}
      {gridPaths.map((d, i) => (
        <path key={`grid-${i}`} d={d} fill="none" stroke={gridColor} strokeWidth={1} />
      ))}

      {/* 轴线 */}
      {dimensions.map((_, i) => {
        const [ex, ey] = getPoint(i, maxValue);
        return (
          <line key={`axis-${i}`} x1={cx} y1={cy} x2={ex} y2={ey} stroke={gridColor} strokeWidth={1} />
        );
      })}

      {/* 数据区域 */}
      {series.map((s, si) => (
        <g key={`series-${si}`}>
          <path
            d={seriesPaths[si]}
            fill={s.color}
            fillOpacity={hoveredIdx === si ? 0.35 : 0.15}
            stroke={s.color}
            strokeWidth={2}
            style={{ transition: 'fill-opacity 0.2s' }}
          />
          {/* 数据点 */}
          {s.values.map((v, di) => {
            const [px, py] = getPoint(di, v * animProgress);
            return (
              <circle
                key={`dot-${si}-${di}`}
                cx={px}
                cy={py}
                r={hoveredIdx === si ? 5 : 3}
                fill={s.color}
                stroke="#fff"
                strokeWidth={1.5}
                style={{ transition: 'r 0.2s' }}
              />
            );
          })}
        </g>
      ))}

      {/* 维度标签 */}
      {dimensions.map((label, i) => {
        const [lx, ly] = getPoint(i, maxValue + 1.5);
        return (
          <text
            key={`label-${i}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={labelColor}
            fontSize={11}
            fontFamily="'Poppins', Arial, sans-serif"
          >
            {label}
          </text>
        );
      })}

      {/* 交互热区 */}
      {series.map((_, si) => (
        <rect
          key={`hover-${si}`}
          x={0}
          y={0}
          width={size}
          height={size}
          fill="transparent"
          style={{ pointerEvents: 'all' }}
          onMouseEnter={() => setHoveredIdx(si)}
          onMouseLeave={() => setHoveredIdx(null)}
        />
      ))}
    </svg>
  );
};

export default RadarChart;
