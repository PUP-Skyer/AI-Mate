/**
 * 骨架屏加载 — 模拟数据区域的占位动画
 */
import React from 'react';

interface ScoutLoadingSkeletonProps {
  rows?: number;
  chartType?: 'radar' | 'bar' | 'gauge' | 'grid';
  surfaceColor?: string;
  shimmerColor?: string;
}

const ScoutLoadingSkeleton: React.FC<ScoutLoadingSkeletonProps> = ({
  rows = 3,
  chartType = 'grid',
  surfaceColor = '#161b22',
  shimmerColor = '#1c2128',
}) => {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 图表占位 */}
      <div style={{
        height: chartType === 'grid' ? 200 : 160,
        background: `linear-gradient(90deg, ${surfaceColor} 25%, ${shimmerColor} 50%, ${surfaceColor} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'scoutShimmer 1.5s ease-in-out infinite',
        borderRadius: 10,
      }} />
      {/* 文本行占位 */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height: 14,
          width: `${60 + Math.random() * 30}%`,
          background: `linear-gradient(90deg, ${surfaceColor} 25%, ${shimmerColor} 50%, ${surfaceColor} 75%)`,
          backgroundSize: '200% 100%',
          animation: `scoutShimmer 1.5s ease-in-out infinite ${i * 0.1}s`,
          borderRadius: 4,
        }} />
      ))}
    </div>
  );
};

export default ScoutLoadingSkeleton;
