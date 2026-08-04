/**
 * 水平条形图 — 用于竞品能力对比
 */
import React, { useState, useEffect } from 'react';
import { SCOUT_FONTS } from '../scout-theme';

export interface BarItem {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  items: BarItem[];
  maxValue?: number;
  textColor?: string;
  trackColor?: string;
  animated?: boolean;
  height?: number;
}

const BarChart: React.FC<BarChartProps> = ({
  items, maxValue = 10, textColor = '#e6edf3',
  trackColor = 'rgba(255,255,255,0.06)',
  animated = true,
}) => {
  const [progress, setProgress] = useState(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) return;
    let frame: number;
    const start = performance.now();
    const duration = 800;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setProgress(t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animated, items]);

  const barHeight = Math.min(24, Math.max(16, 200 / items.length - 8));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} className={`scout-fade-in-up scout-stagger-${Math.min(i + 1, 8)}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 60, fontSize: 11, color: textColor, opacity: 0.7,
            fontFamily: SCOUT_FONTS.body, textAlign: 'right', flexShrink: 0,
          }}>{item.label}</span>
          <div style={{
            flex: 1, height: barHeight, borderRadius: barHeight / 2,
            background: trackColor, overflow: 'hidden',
          }}>
            <div style={{
              width: `${(item.value / maxValue) * 100 * progress}%`,
              height: '100%',
              borderRadius: barHeight / 2,
              background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)`,
              boxShadow: `0 0 8px ${item.color}33`,
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{
            width: 28, fontSize: 12, fontWeight: 600, color: item.color,
            fontFamily: SCOUT_FONTS.heading,
          }}>{Math.round(item.value * progress)}</span>
        </div>
      ))}
    </div>
  );
};

export default BarChart;
