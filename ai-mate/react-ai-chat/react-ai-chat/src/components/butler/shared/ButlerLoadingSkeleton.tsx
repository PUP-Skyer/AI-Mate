/**
 * 骨架屏加载 — butler-shimmer 闪烁动画，支持四种布局模式
 */
import React from 'react';
import { BUTLER_SPACING, BUTLER_RADIUS } from '../butler-theme';

interface ButlerLoadingSkeletonProps {
  /** 文本占位行数 */
  rows?: number;
  /** 布局模式 */
  mode?: 'grid' | 'timeline' | 'cards' | 'gauge';
  /** 主题色（accent）— 用于占位色调点缀 */
  accent?: string;
}

const ButlerLoadingSkeleton: React.FC<ButlerLoadingSkeletonProps> = ({
  rows = 3,
  mode = 'grid',
  accent = '#eb2f96',
}) => {
  const gap = BUTLER_SPACING.md;

  // ─── 图表网格占位 ───────────────────────────
  const renderGrid = () => (
    <>
      <div
        className="butler-shimmer"
        style={{ height: 200, borderRadius: BUTLER_RADIUS.md }}
      />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="butler-shimmer"
          style={{
            height: 14,
            width: `${60 + ((i * 13) % 30)}%`,
            borderRadius: BUTLER_RADIUS.sm,
          }}
        />
      ))}
    </>
  );

  // ─── 时间线占位 ───────────────────────────────
  const renderTimeline = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: rows + 1 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: BUTLER_SPACING.md }}>
          {/* 节点圆点 */}
          <div
            className="butler-shimmer"
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              flexShrink: 0,
              flex: '0 0 12px',
            }}
          />
          {/* 连接线 + 内容条 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: BUTLER_SPACING.xs, flex: 1 }}>
            <div
              className="butler-shimmer"
              style={{ height: 12, width: `${50 + ((i * 17) % 40)}%`, borderRadius: BUTLER_RADIUS.sm }}
            />
            <div
              className="butler-shimmer"
              style={{ height: 10, width: `${30 + ((i * 11) % 30)}%`, borderRadius: BUTLER_RADIUS.sm }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  // ─── 卡片网格占位 ─────────────────────────────
  const renderCards = () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap,
      }}
    >
      {Array.from({ length: rows + 1 }).map((_, i) => (
        <div
          key={i}
          className="butler-shimmer"
          style={{
            height: 96,
            borderRadius: BUTLER_RADIUS.md,
          }}
        />
      ))}
    </div>
  );

  // ─── 仪表盘环形占位 ───────────────────────────
  const renderGauge = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: BUTLER_SPACING.xl }}>
      {/* 环形占位 */}
      <div
        className="butler-shimmer"
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          flexShrink: 0,
        }}
      />
      {/* 右侧数值条 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap, flex: 1 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="butler-shimmer"
            style={{
              height: 14,
              width: `${50 + ((i * 19) % 40)}%`,
              borderRadius: BUTLER_RADIUS.sm,
            }}
          />
        ))}
      </div>
    </div>
  );

  const modeRenderer = {
    grid: renderGrid,
    timeline: renderTimeline,
    cards: renderCards,
    gauge: renderGauge,
  }[mode];

  return (
    <div
      style={{
        padding: BUTLER_SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap,
      }}
    >
      {modeRenderer()}
    </div>
  );
};

export default ButlerLoadingSkeleton;
