import React, { useState } from 'react';

interface FunnelStage {
  label: string;
  value: number;
  color?: string;
  conversion?: number;
}

interface FunnelChartProps {
  data: FunnelStage[];
  width?: number;
  height?: number;
}

const FunnelChart: React.FC<FunnelChartProps> = ({ data, width = 600, height = 360 }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...data.map(d => d.value));
  const colors = ['#a855f7', '#d946ef', '#f472b6', '#c084fc', '#8b5cf6', '#10b981'];

  // 计算每个阶段的尺�?  const stageHeight = (height - 60) / data.length;
  const maxBarWidth = width * 0.85;
  const centerX = width / 2;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {data.map((stage, index) => {
        const isHovered = hoveredIndex === index;
        const color = stage.color || colors[index % colors.length];

        // 计算当前阶段的宽度（基于数值比例）
        const currentWidth = (stage.value / maxValue) * maxBarWidth;
        const currentX = centerX - currentWidth / 2;
        const y = 30 + index * stageHeight;

        // 计算下一阶段的宽度（用于创建梯形�?        const nextStage = data[index + 1];
        const nextWidth = nextStage
          ? (nextStage.value / maxValue) * maxBarWidth
          : currentWidth * 0.7;
        const nextX = centerX - nextWidth / 2;

        // 创建梯形路径
        const path = `
          M ${currentX} ${y}
          L ${currentX + currentWidth} ${y}
          L ${nextX + nextWidth} ${y + stageHeight - 4}
          L ${nextX} ${y + stageHeight - 4}
          Z
        `;

        return (
          <g
            key={index}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* 梯形主体 */}
            <path
              d={path}
              fill={isHovered ? color + '35' : color + '18'}
              stroke={color}
              strokeWidth={isHovered ? 2.5 : 1.5}
              style={{
                filter: isHovered ? `drop-shadow(0 0 12px ${color}50)` : 'none',
                transition: 'all 0.3s ease',
              }}
            />

            {/* 标签 */}
            <text
              x={centerX}
              y={y + stageHeight / 2 - 6}
              textAnchor="middle"
              fill={isHovered ? '#f8fafc' : '#e2e8f0'}
              fontSize={14}
              fontWeight={600}
              style={{ pointerEvents: 'none' }}
            >
              {stage.label}
            </text>

            {/* 数�?*/}
            <text
              x={centerX}
              y={y + stageHeight / 2 + 12}
              textAnchor="middle"
              fill={color}
              fontSize={12}
              fontWeight={500}
              style={{ pointerEvents: 'none' }}
            >
              {stage.value.toLocaleString()}
              {stage.conversion !== undefined && ` (${stage.conversion}%)`}
            </text>

            {/* 转化率箭头（在阶段之间） */}
            {index < data.length - 1 && stage.conversion !== undefined && (
              <g>
                <line
                  x1={width - 30}
                  y1={y + stageHeight - 2}
                  x2={width - 30}
                  y2={y + stageHeight + 6}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeDasharray="3,2"
                  opacity="0.6"
                />
                <polygon
                  points={`${width - 34},${y + stageHeight + 2} ${width - 26},${y + stageHeight + 2} ${width - 30},${y + stageHeight + 8}`}
                  fill={color}
                  opacity="0.6"
                />
                <text
                  x={width - 20}
                  y={y + stageHeight + 4}
                  fill={color}
                  fontSize={10}
                  fontWeight={500}
                >
                  {stage.conversion}%
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default FunnelChart;
