/**
 * 反馈情感环形图 — 正面/中性/负面三色环形
 * 使用 stroke-dasharray + stroke-dashoffset 画弧，requestAnimationFrame 缓动
 * 参考 scout/svg/DonutChart.tsx + ProgressRing.tsx 范式
 */
import React, { useState, useEffect } from 'react';
import { BUTLER_FONTS } from '../butler-theme';

interface SentimentDonutProps {
  /** 正面反馈数 */
  positive: number;
  /** 中性反馈数 */
  neutral: number;
  /** 负面反馈数 */
  negative: number;
  /** 环形尺寸，默认 160 */
  size?: number;
}

const SentimentDonut: React.FC<SentimentDonutProps> = ({
  positive,
  neutral,
  negative,
  size = 160,
}) => {
  const [progress, setProgress] = useState(0);

  // requestAnimationFrame + smoothstep 缓动
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setProgress(t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const slices = [
    { label: '正面', value: positive, color: '#52c41a' },
    { label: '中性', value: neutral, color: '#faad14' },
    { label: '负面', value: negative, color: '#ff4d4f' },
  ];

  const thickness = size * 0.12;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const total = positive + neutral + negative || 1;

  let startFraction = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 背景环 */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(235,47,150,0.08)"
          strokeWidth={thickness}
        />

        {/* 三色扇区：stroke-dasharray + stroke-dashoffset */}
        {slices.map((s, i) => {
          const fraction = s.value / total;
          const sliceLength = fraction * circumference * progress;
          const sf = startFraction; // 当前扇区起点占比（满值，保证位置稳定）
          startFraction += fraction;

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeLinecap="butt"
              strokeDasharray={`${sliceLength} ${circumference}`}
              strokeDashoffset={sf * circumference}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ filter: `drop-shadow(0 0 4px ${s.color}44)` }}
            />
          );
        })}

        {/* 中心总反馈数 */}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#1a1a1a"
          fontSize={size * 0.2}
          fontWeight={700}
          fontFamily={BUTLER_FONTS.heading}
        >
          {Math.round(total * progress)}
        </text>
        <text
          x={cx}
          y={cy + size * 0.13}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(0,0,0,0.45)"
          fontSize={size * 0.075}
          fontFamily={BUTLER_FONTS.body}
        >
          总反馈
        </text>
      </svg>

      {/* 图例：各情感占比 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: s.color,
                boxShadow: `0 0 4px ${s.color}66`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: 'rgba(0,0,0,0.65)',
                fontFamily: BUTLER_FONTS.body,
              }}
            >
              {s.label}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: s.color,
                fontFamily: BUTLER_FONTS.heading,
                minWidth: 40,
                textAlign: 'right',
              }}
            >
              {total > 0 ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SentimentDonut;
