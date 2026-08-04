/**
 * 2x2 矩阵图组件
 * 通用 SWOT / 风险矩阵，CSS Grid 布局
 */

import React, { useState } from 'react';

export interface MatrixQuadrant {
  title: string;
  items: string[];
  color: string;
  icon: string;
}

interface MatrixChartProps {
  quadrants: MatrixQuadrant[];   // 固定 4 个：[左上, 右上, 左下, 右下]
  textColor?: string;
  surfaceColor?: string;
  borderColor?: string;
  animated?: boolean;
}

const MatrixChart: React.FC<MatrixChartProps> = ({
  quadrants,
  textColor = '#e6edf3',
  surfaceColor = '#161b22',
  borderColor = '#30363d',
  animated = true,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (quadrants.length < 4) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 8,
        width: '100%',
        height: '100%',
        minHeight: 240,
      }}
    >
      {quadrants.slice(0, 4).map((q, i) => {
        const isHovered = hoveredIdx === i;
        return (
          <div
            key={i}
            className={animated ? `scout-fade-in-scale scout-stagger-${i + 1}` : ''}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              background: surfaceColor,
              border: `1px solid ${isHovered ? q.color : borderColor}`,
              borderRadius: 10,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              transition: 'border-color 0.25s, transform 0.2s, box-shadow 0.25s',
              transform: isHovered ? 'scale(1.02)' : 'scale(1)',
              boxShadow: isHovered ? `0 0 16px ${q.color}22` : 'none',
              cursor: 'default',
              overflow: 'hidden',
            }}
          >
            {/* 标题行 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{q.icon}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: q.color,
                  fontFamily: "'Poppins', Arial, sans-serif",
                  letterSpacing: 0.5,
                }}
              >
                {q.title}
              </span>
            </div>

            {/* 条目列表 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflow: 'auto' }}>
              {q.items.map((item, j) => (
                <div
                  key={j}
                  style={{
                    fontSize: 12,
                    color: textColor,
                    opacity: 0.8,
                    fontFamily: "'Lora', Georgia, serif",
                    lineHeight: 1.5,
                    paddingLeft: 10,
                    borderLeft: `2px solid ${q.color}44`,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MatrixChart;
