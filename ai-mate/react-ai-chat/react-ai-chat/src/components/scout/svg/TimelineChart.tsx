/**
 * 水平时间轴组件
 * SVG + CSS 动画，节点 hover 展开详情
 */

import React, { useState, useEffect } from 'react';

export interface TimelineEvent {
  date: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
}

interface TimelineChartProps {
  events: TimelineEvent[];
  lineColor?: string;
  nodeColors?: { high: string; medium: string; low: string };
  textColor?: string;
  bgColor?: string;
  height?: number;
}

const IMPACT_RADIUS: Record<string, number> = { high: 10, medium: 7, low: 5 };

const TimelineChart: React.FC<TimelineChartProps> = ({
  events,
  lineColor = '#30363d',
  nodeColors = { high: '#ff6b6b', medium: '#faad14', low: '#788c5d' },
  textColor = '#e6edf3',
  bgColor = 'transparent',
  height = 160,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1000;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setAnimProgress(t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [events]);

  if (events.length === 0) return null;

  const padding = 60;
  const nodeGap = 140;
  const svgWidth = Math.max(padding * 2 + (events.length - 1) * nodeGap, 400);
  const cy = height / 2;

  return (
    <div style={{ overflowX: 'auto', overflowY: 'visible', width: '100%' }}>
      <svg
        width={svgWidth}
        height={height + 60}
        viewBox={`0 0 ${svgWidth} ${height + 60}`}
        style={{ display: 'block', background: bgColor }}
      >
        {/* 主时间线 */}
        <line
          x1={padding}
          y1={cy}
          x2={padding + (svgWidth - padding * 2) * animProgress}
          y2={cy}
          stroke={lineColor}
          strokeWidth={2}
          strokeDasharray="6 3"
        />

        {/* 节点 */}
        {events.map((evt, i) => {
          const x = padding + i * nodeGap;
          const nodeR = IMPACT_RADIUS[evt.impact] || 6;
          const color = nodeColors[evt.impact] || nodeColors.medium;
          const isHovered = hoveredIdx === i;
          const nodeVisible = animProgress > i / events.length;

          return (
            <g
              key={i}
              style={{
                opacity: nodeVisible ? 1 : 0,
                transform: nodeVisible ? 'scale(1)' : 'scale(0)',
                transformOrigin: `${x}px ${cy}px`,
                transition: `opacity 0.3s ease ${i * 0.1}s, transform 0.3s ease ${i * 0.1}s`,
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* 竖线 */}
              <line x1={x} y1={cy - 20} x2={x} y2={cy + 20} stroke={color} strokeWidth={1.5} opacity={0.4} />

              {/* 节点圆 */}
              <circle
                cx={x}
                cy={cy}
                r={isHovered ? nodeR + 3 : nodeR}
                fill={color}
                stroke={isHovered ? '#fff' : 'none'}
                strokeWidth={2}
                style={{
                  transition: 'r 0.2s, stroke 0.2s',
                  filter: isHovered ? `drop-shadow(0 0 8px ${color})` : 'none',
                }}
              />

              {/* 日期标签 */}
              <text
                x={x}
                y={cy + 36}
                textAnchor="middle"
                fill={textColor}
                fontSize={10}
                fontFamily="'Poppins', Arial, sans-serif"
                opacity={0.6}
              >
                {evt.date}
              </text>

              {/* 事件描述（hover 展开） */}
              {isHovered && (
                <g>
                  <rect
                    x={x - 80}
                    y={cy - 60}
                    width={160}
                    height={36}
                    rx={6}
                    fill="#161b22"
                    stroke={color}
                    strokeWidth={1}
                    opacity={0.95}
                  />
                  <text
                    x={x}
                    y={cy - 38}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={11}
                    fontFamily="'Lora', Georgia, serif"
                  >
                    {evt.event.length > 20 ? evt.event.slice(0, 20) + '...' : evt.event}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default TimelineChart;
