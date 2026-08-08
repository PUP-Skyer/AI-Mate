/**
 * 工具箱骨架屏
 * 镜像 ScoutLoadingSkeleton.tsx 的 shimmer 设计
 * 支持 grid / list / card / stat 四种布局
 */
import React from 'react';
import { TOOL_RADIUS } from '../tool-theme';

interface ToolSkeletonProps {
  type?: 'grid' | 'list' | 'card' | 'stat';
  rows?: number;
  columns?: number;
}

const ToolSkeleton: React.FC<ToolSkeletonProps> = ({
  type = 'grid',
  rows = 3,
  columns = 3,
}) => {
  if (type === 'stat') {
    return (
      <div style={{ display: 'flex', gap: 16 }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="tool-skeleton"
            style={{
              height: 80,
              flex: 1,
              borderRadius: TOOL_RADIUS.lg,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="tool-skeleton"
            style={{
              height: 60,
              width: '100%',
              borderRadius: TOOL_RADIUS.md,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
        <div
          className="tool-skeleton"
          style={{ height: 140, borderRadius: TOOL_RADIUS.lg }}
        />
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="tool-skeleton"
            style={{
              height: 14,
              width: `${60 + Math.random() * 30}%`,
              borderRadius: TOOL_RADIUS.sm,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // grid (default)
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 16,
        padding: 16,
      }}
    >
      {Array.from({ length: rows * columns }).map((_, i) => (
        <div
          key={i}
          className="tool-skeleton"
          style={{
            height: 160,
            borderRadius: TOOL_RADIUS.lg,
            animationDelay: `${i * 0.06}s`,
          }}
        />
      ))}
    </div>
  );
};

export default ToolSkeleton;
