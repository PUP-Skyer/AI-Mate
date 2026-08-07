/**
 * 垂直进度时间轴 — 里程碑节点 + 状态进度环
 * 竖线从上到下 stroke-dashoffset 绘制动画，节点依次 opacity/scale 淡入
 * 每节点为圆形进度环（内嵌百分比），颜色由 status 决定
 * 参考 scout/svg/TimelineChart.tsx + ProgressRing.tsx 范式
 */
import React, { useState, useEffect } from 'react';
import { BUTLER_FONTS } from '../butler-theme';

export interface TimelineMilestone {
  id: string | number;
  title: string;
  /** 完成进度 0-100 */
  progress: number;
  status: 'completed' | 'in_progress' | 'pending' | 'at_risk';
  targetDate?: string;
}

interface ProgressTimelineProps {
  milestones: TimelineMilestone[];
  /** 主题色（竖线 / 强调） */
  accent: string;
}

const STATUS_META: Record<
  TimelineMilestone['status'],
  { color: string; label: string }
> = {
  completed: { color: '#52c41a', label: '已完成' },
  in_progress: { color: '#faad14', label: '进行中' },
  pending: { color: '#bfbfbf', label: '待开始' },
  at_risk: { color: '#ff4d4f', label: '有风险' },
};

const NODE_SIZE = 48;
const RING_R = 17;
const RING_SW = 4;
const CIRC = 2 * Math.PI * RING_R;

const ProgressTimeline: React.FC<ProgressTimelineProps> = ({
  milestones,
  accent,
}) => {
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  // requestAnimationFrame + smoothstep 缓动（驱动竖线绘制与进度环填充）
  useEffect(() => {
    setMounted(true);
    let frame: number;
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setProgress(t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [milestones]);

  if (!milestones.length) return null;

  // viewBox 高度归一化为 100，竖线 stroke-dashoffset 从 100→0 绘制
  const lineOffset = 100 * (1 - progress);

  return (
    <div style={{ position: 'relative' }}>
      {/* 竖线连接：从上到下 stroke-dashoffset 绘制动画 */}
      <svg
        width="4"
        style={{
          position: 'absolute',
          left: NODE_SIZE / 2 - 2,
          top: NODE_SIZE / 2,
          height: `calc(100% - ${NODE_SIZE}px)`,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
        viewBox="0 0 4 100"
        preserveAspectRatio="none"
      >
        <line
          x1="2"
          y1="0"
          x2="2"
          y2="100"
          stroke={accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="100"
          strokeDashoffset={lineOffset}
          opacity={0.5}
        />
      </svg>

      {/* 里程碑节点 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {milestones.map((m, i) => {
          const meta = STATUS_META[m.status];
          const ringOffset = CIRC * (1 - (m.progress / 100) * progress);
          const center = NODE_SIZE / 2;

          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'scale(1)' : 'scale(0.6)',
                transformOrigin: `${center}px ${center}px`,
                transition: `opacity 0.45s ease ${i * 0.12}s, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s`,
              }}
            >
              {/* 节点进度环 */}
              <svg
                width={NODE_SIZE}
                height={NODE_SIZE}
                viewBox={`0 0 ${NODE_SIZE} ${NODE_SIZE}`}
                style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}
              >
                {/* 底盘 */}
                <circle
                  cx={center}
                  cy={center}
                  r={RING_R}
                  fill="#ffffff"
                  stroke="rgba(0,0,0,0.06)"
                  strokeWidth={RING_SW / 2}
                />
                {/* 轨道 */}
                <circle
                  cx={center}
                  cy={center}
                  r={RING_R}
                  fill="none"
                  stroke="rgba(0,0,0,0.06)"
                  strokeWidth={RING_SW}
                />
                {/* 进度环：stroke-dasharray + stroke-dashoffset */}
                <circle
                  cx={center}
                  cy={center}
                  r={RING_R}
                  fill="none"
                  stroke={meta.color}
                  strokeWidth={RING_SW}
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={ringOffset}
                  transform={`rotate(-90 ${center} ${center})`}
                  style={{ filter: `drop-shadow(0 0 4px ${meta.color}55)` }}
                />
                {/* 内嵌百分比 */}
                <text
                  x={center}
                  y={center + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={meta.color}
                  fontSize={11}
                  fontWeight={700}
                  fontFamily={BUTLER_FONTS.heading}
                >
                  {Math.round((m.progress / 100) * progress * 100)}
                </text>
              </svg>

              {/* 内容区 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#1a1a1a',
                      fontFamily: BUTLER_FONTS.heading,
                    }}
                  >
                    {m.title}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: meta.color,
                      background: `${meta.color}1a`,
                      padding: '1px 8px',
                      borderRadius: 999,
                      fontFamily: BUTLER_FONTS.body,
                    }}
                  >
                    {meta.label}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 11,
                    color: 'rgba(0,0,0,0.5)',
                    fontFamily: BUTLER_FONTS.body,
                  }}
                >
                  {m.targetDate && <span>目标 {m.targetDate}</span>}
                  <span>进度 {m.progress}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTimeline;
