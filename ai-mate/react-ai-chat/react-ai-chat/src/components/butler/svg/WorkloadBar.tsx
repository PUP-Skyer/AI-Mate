/**
 * 成员工作量条形图 — 水平渐变条 + 辉光 + 数字递增
 * 渐变填充 linear-gradient(90deg, accent, secondary)
 * 颜色按值切换: >80红(过载) / 50-80金(适中) / <50绿(充裕)
 * butlerBarGrow 动画 transform-origin:left + requestAnimationFrame 递增数字
 * 参考 scout/svg/BarChart.tsx + butler-animations.css 范式
 */
import React, { useState, useEffect } from 'react';
import { BUTLER_FONTS } from '../butler-theme';

interface WorkloadBarProps {
  /** 工作量 0-100 */
  value: number;
  /** 主题色（渐变起始） */
  accent: string;
  /** 渐变终止色，默认按值取状态色 */
  secondary?: string;
  /** 条形宽度，默认 200 */
  width?: number;
}

/** 按值取状态色：>80 红 / 50-80 金 / <50 绿 */
const getStatusColor = (v: number): string => {
  if (v > 80) return '#ff4d4f';
  if (v >= 50) return '#faad14';
  return '#52c41a';
};

const STATUS_LABEL: Record<string, string> = {
  '#ff4d4f': '过载',
  '#faad14': '适中',
  '#52c41a': '充裕',
};

const WorkloadBar: React.FC<WorkloadBarProps> = ({
  value,
  accent,
  secondary,
  width = 200,
}) => {
  const [display, setDisplay] = useState(0);

  // requestAnimationFrame + smoothstep 递增数字
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t * t * (3 - 2 * t);
      setDisplay(value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const statusColor = getStatusColor(value);
  const endColor = secondary ?? statusColor;
  const barHeight = 14;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width }}>
      {/* 标题行 + 数字 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 11,
            color: 'rgba(0,0,0,0.55)',
            fontFamily: BUTLER_FONTS.body,
          }}
        >
          工作量
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: statusColor,
              fontFamily: BUTLER_FONTS.heading,
              transition: 'color 0.3s',
            }}
          >
            {Math.round(display)}%
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: statusColor,
              opacity: 0.8,
              fontFamily: BUTLER_FONTS.body,
            }}
          >
            {STATUS_LABEL[statusColor]}
          </span>
        </div>
      </div>

      {/* 条形轨道 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: barHeight,
          borderRadius: barHeight / 2,
          background: 'rgba(235,47,150,0.08)',
        }}
      >
        {/* 渐变填充 + butlerBarGrow 动画（transform-origin:left） */}
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            borderRadius: barHeight / 2,
            background: `linear-gradient(90deg, ${accent}, ${endColor})`,
            transformOrigin: 'left',
            animation: 'butlerBarGrow 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
            boxShadow: `0 0 8px ${statusColor}66`,
            filter: `drop-shadow(0 0 4px ${statusColor}55)`,
          }}
        />
      </div>
    </div>
  );
};

export default WorkloadBar;
