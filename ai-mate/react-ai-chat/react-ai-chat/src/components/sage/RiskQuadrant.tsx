/**
 * 2×2 风险象限网格可视化组件
 * 概率(X轴) × 影响(Y轴) 四象限布局，点击联动卡片清单
 */
import React from 'react';
import type { RiskItem, RiskLevel } from './risk-utils';
import { RISK_LEVEL_STYLES, RISK_QUADRANTS } from './risk-utils';
import { SAGE_FONT_SERIF, type SageTheme } from './sage-theme';
import { SageSection } from './shared';

interface RiskQuadrantProps {
  risks: RiskItem[];
  theme: SageTheme;
  isDark: boolean;
  activeLevel: RiskLevel | null;
  onSelectLevel: (level: RiskLevel) => void;
}

const RiskQuadrant: React.FC<RiskQuadrantProps> = ({
  risks, theme, isDark, activeLevel, onSelectLevel,
}) => {
  const textColor = isDark ? theme.textDark : theme.textLight;

  const renderQuadrant = (q: typeof RISK_QUADRANTS[0], stagger: number) => {
    const meta = RISK_LEVEL_STYLES[q.key];
    const items = risks.filter(r => r.level === q.key);
    const isActive = activeLevel === q.key;
    const pulse = q.key === 'high';
    return (
      <div
        key={q.key}
        className={`sage-fade-in-up sage-stagger-${stagger}${pulse ? ' sage-pulse-dot' : ''}`}
        onClick={() => onSelectLevel(q.key)}
        style={{
          cursor: 'pointer',
          borderRadius: 10,
          border: `1.5px solid ${meta.color}${isActive ? '' : '55'}`,
          background: meta.bg,
          padding: '12px 14px',
          minHeight: 120,
          '--sage-glow': `${meta.color}44`,
          boxShadow: isActive ? `0 0 0 2px ${meta.color}` : 'none',
          transition: 'box-shadow 0.2s ease',
        } as React.CSSProperties}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: meta.color, borderRadius: 4, padding: '2px 8px', fontFamily: SAGE_FONT_SERIF, letterSpacing: 1 }}>
            {meta.label}
          </span>
          <span style={{ fontSize: 11, color: textColor, opacity: 0.5, fontFamily: SAGE_FONT_SERIF }}>
            {q.subtitle}
          </span>
        </div>
        <div style={{ fontSize: 11, color: textColor, opacity: 0.6, marginBottom: 4, fontFamily: SAGE_FONT_SERIF }}>
          共 {items.length} 项
        </div>
        {items.slice(0, 3).map((item, i) => (
          <div key={i} style={{ fontSize: 11.5, color: textColor, fontFamily: SAGE_FONT_SERIF, lineHeight: 1.6, padding: '2px 0' }}>
            · {item.name}
          </div>
        ))}
        {items.length > 3 && (
          <div style={{ fontSize: 10, color: meta.color, fontFamily: SAGE_FONT_SERIF, marginTop: 2 }}>
            +{items.length - 3} 更多
          </div>
        )}
      </div>
    );
  };

  return (
    <SageSection title="风险矩阵" subtitle="RISK QUADRANT" theme={theme} isDark={isDark} stagger={2}>
      {/* Y轴标签 + 上半行 */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr', gap: 8, marginBottom: 4 }}>
        <div style={{ writingMode: 'vertical-rl', textAlign: 'center', fontSize: 10, color: textColor, opacity: 0.5, fontFamily: SAGE_FONT_SERIF, letterSpacing: 2 }}>
          影响程度 ↑
        </div>
        {RISK_QUADRANTS.slice(0, 2).map(q => renderQuadrant(q, 2))}
      </div>
      {/* 下半行 */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr', gap: 8 }}>
        <div />
        {RISK_QUADRANTS.slice(2).map(q => renderQuadrant(q, 3))}
      </div>
      {/* X轴标签 */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr', gap: 8, marginTop: 4 }}>
        <div />
        <div style={{ textAlign: 'center', fontSize: 10, color: textColor, opacity: 0.5, fontFamily: SAGE_FONT_SERIF, letterSpacing: 2 }}>
          ← 发生概率（低）
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: textColor, opacity: 0.5, fontFamily: SAGE_FONT_SERIF, letterSpacing: 2 }}>
          发生概率（高）→
        </div>
      </div>
    </SageSection>
  );
};

export default RiskQuadrant;
