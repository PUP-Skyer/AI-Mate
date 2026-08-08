/**
 * 底部 KPI 数据条带 — 4 模块横向排列
 * 深色模式霓虹辉光 + 交错延迟入场动画
 */
import React from 'react';
import { useAIStore } from '../../store/aiStore';
import { getDashboardTheme } from './dashboard-theme';
import { useCountUp, formatNumber } from './hooks/useCountUp';
import { useSimulatedNumber } from './hooks/useSimulatedData';
import './dashboard-animations.css';

interface KpiItem {
  label: string;
  initial: number;
  unit: string;
  trend: string;
  trendUp: boolean;
  color: string;
  interval: number;
  variance: number;
}

const KPI_ITEMS: KpiItem[] = [
  { label: '行业报告总量', initial: 12847, unit: '篇', trend: '23.5%', trendUp: true, color: '#00d4aa', interval: 5000, variance: 30 },
  { label: 'AI 渗透行业数', initial: 7, unit: '个', trend: '16.7%', trendUp: true, color: '#4a9eff', interval: 8000, variance: 1 },
  { label: '活跃创业者', initial: 38592, unit: '人', trend: '8.3%', trendUp: true, color: '#ffa502', interval: 6000, variance: 50 },
  { label: '政策扶持项目', initial: 124, unit: '项', trend: '5.2%', trendUp: true, color: '#ff6b6b', interval: 7000, variance: 2 },
];

const KpiCell: React.FC<{ item: KpiItem; index: number }> = ({ item, index }) => {
  const theme = useAIStore((s) => s.settings.theme);
  const isDark = theme === 'dark';
  const t = getDashboardTheme(isDark);

  const { value, refreshKey } = useSimulatedNumber({
    interval: item.interval,
    variance: item.variance,
    initial: item.initial,
  });
  const displayValue = useCountUp(value, 1200, [refreshKey]);

  return (
    <div
      className="dash-kpi-enter"
      style={{
        flex: 1,
        background: t.glassBg,
        borderRadius: 10,
        padding: '10px 14px',
        border: `1px solid ${t.glassBorder}`,
        boxShadow: t.glassShadow,
        position: 'relative',
        overflow: 'hidden',
        animationDelay: `${index * 0.12}s`,
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
      }}
    >
      {/* 顶部色条 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: item.color,
          boxShadow: isDark ? `0 0 8px ${item.color}` : 'none',
        }}
      />

      {/* 标签 */}
      <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 4 }}>
        {item.label}
      </div>

      {/* 数值 + 单位 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span
          className={isDark ? 'dash-neon-text' : ''}
          style={
            {
              fontSize: 26,
              fontWeight: 800,
              color: item.color,
              fontVariantNumeric: 'tabular-nums',
              '--neon-color': item.color,
            } as React.CSSProperties
          }
        >
          {formatNumber(displayValue)}
        </span>
        <span style={{ fontSize: 11, color: t.textSecondary }}>{item.unit}</span>
      </div>

      {/* 趋势 */}
      <div style={{ fontSize: 10, color: item.trendUp ? '#28a745' : '#ff6b6b', marginTop: 2 }}>
        {item.trendUp ? '↑' : '↓'} {item.trend} 较上月
      </div>
    </div>
  );
};

const KpiBar: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 8,
        left: 12,
        right: 12,
        display: 'flex',
        gap: 10,
        zIndex: 10,
        pointerEvents: 'auto',
      }}
    >
      {KPI_ITEMS.map((item, idx) => (
        <KpiCell key={item.label} item={item} index={idx} />
      ))}
    </div>
  );
};

export default KpiBar;
