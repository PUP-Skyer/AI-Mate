/**
 * 通用 SVG 仪表盘组件
 * 圆弧 + 指针 + 数字动画，支持分数段着色
 */

import React, { useState, useEffect, useRef } from 'react';

interface GaugeChartProps {
  value: number;           // 0-100
  label?: string;          // 中心标签
  size?: number;
  trackColor?: string;
  /** 根据 value 自动选色，也可手动覆盖 */
  colorStops?: { threshold: number; color: string }[];
  textColor?: string;
  animated?: boolean;
}

const DEFAULT_STOPS = [
  { threshold: 40, color: '#ff6b6b' },
  { threshold: 60, color: '#faad14' },
  { threshold: 100, color: '#788c5d' },
];

const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  label,
  size = 200,
  trackColor = 'rgba(255,255,255,0.06)',
  colorStops = DEFAULT_STOPS,
  textColor = '#f0f0f0',
  animated = true,
}) => {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!animated) { setDisplayValue(value); return; }
    const start = performance.now();
    const duration = 1200;
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t * t * (3 - 2 * t);
      setDisplayValue(Math.round(from + (value - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, animated]);

  const getColor = (v: number) => {
    for (const stop of colorStops) {
      if (v <= stop.threshold) return stop.color;
    }
    return colorStops[colorStops.length - 1].color;
  };

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const strokeWidth = size * 0.06;
  const startAngle = 135;   // 左下角起始
  const endAngle = 405;     // 右下角结束（270° 弧）
  const totalAngle = endAngle - startAngle;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // 弧线终点
  const arcEnd = (angle: number) => ({
    x: cx + r * Math.cos(toRad(angle)),
    y: cy + r * Math.sin(toRad(angle)),
  });

  // 背景弧路径
  const bgStart = arcEnd(startAngle);
  const bgEnd = arcEnd(endAngle);
  const bgPath = `M${bgStart.x},${bgStart.y} A${r},${r} 0 1,1 ${bgEnd.x},${bgEnd.y}`;

  // 值弧路径
  const valueAngle = startAngle + (displayValue / 100) * totalAngle;
  const valEnd = arcEnd(valueAngle);
  const largeArc = valueAngle - startAngle > 180 ? 1 : 0;
  const valPath = `M${bgStart.x},${bgStart.y} A${r},${r} 0 ${largeArc},1 ${valEnd.x},${valEnd.y}`;

  const color = getColor(value);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 背景弧 */}
      <path
        d={bgPath}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* 值弧 */}
      {displayValue > 0 && (
        <path
          d={valPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${color}66)`,
            transition: 'stroke 0.3s',
          }}
        />
      )}
      {/* 中心数字 */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={size * 0.22}
        fontWeight={700}
        fontFamily="'Poppins', Arial, sans-serif"
        style={{ transition: 'fill 0.3s' }}
      >
        {displayValue}
      </text>
      {/* 标签 */}
      {label && (
        <text
          x={cx}
          y={cy + size * 0.14}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={size * 0.07}
          fontFamily="'Lora', Georgia, serif"
          opacity={0.7}
        >
          {label}
        </text>
      )}
    </svg>
  );
};

export default GaugeChart;
