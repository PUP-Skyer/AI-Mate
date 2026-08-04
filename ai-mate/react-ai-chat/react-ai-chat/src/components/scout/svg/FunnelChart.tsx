/**
 * SVG 漏斗图组件
 * TAM / SAM / SOM 三层递减梯形
 */

import React, { useState, useEffect } from 'react';

export interface FunnelLayer {
  label: string;
  value: number;        // 金额数值（用于计算宽度比例）
  displayValue: string; // 显示文字，如 "1000亿"
  color: string;
}

interface FunnelChartProps {
  layers: FunnelLayer[];   // 从上到下排列
  width?: number;
  height?: number;
  textColor?: string;
  animated?: boolean;
}

const FunnelChart: React.FC<FunnelChartProps> = ({
  layers,
  width = 320,
  height = 220,
  textColor = '#f0f0f0',
  animated = true,
}) => {
  const [animProgress, setAnimProgress] = useState(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) return;
    let frame: number;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setAnimProgress(t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animated, layers]);

  if (layers.length === 0) return null;

  const maxVal = Math.max(...layers.map((l) => l.value));
  const layerH = (height - 20) / layers.length;
  const gap = 4;
  const cx = width / 2;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {layers.map((layer, i) => {
        const topW = (layer.value / maxVal) * (width * 0.8) * animProgress;
        const nextVal = layers[i + 1]?.value ?? layer.value * 0.4;
        const botW = (nextVal / maxVal) * (width * 0.8) * animProgress;
        const y = 10 + i * layerH;
        const h = layerH - gap;

        const topLeft = cx - topW / 2;
        const topRight = cx + topW / 2;
        const botLeft = cx - botW / 2;
        const botRight = cx + botW / 2;

        const path = `M${topLeft},${y} L${topRight},${y} L${botRight},${y + h} L${botLeft},${y + h} Z`;

        return (
          <g
            key={i}
            style={{
              opacity: animProgress > i * 0.25 ? 1 : 0,
              transition: `opacity 0.4s ease ${i * 0.15}s`,
            }}
          >
            <path
              d={path}
              fill={layer.color}
              fillOpacity={0.25}
              stroke={layer.color}
              strokeWidth={1.5}
              style={{
                filter: `drop-shadow(0 2px 8px ${layer.color}33)`,
              }}
            />
            {/* 标签 */}
            <text
              x={cx}
              y={y + h / 2 - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={textColor}
              fontSize={13}
              fontWeight={600}
              fontFamily="'Poppins', Arial, sans-serif"
            >
              {layer.label}
            </text>
            <text
              x={cx}
              y={y + h / 2 + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={layer.color}
              fontSize={15}
              fontWeight={700}
              fontFamily="'Poppins', Arial, sans-serif"
            >
              {layer.displayValue}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default FunnelChart;
