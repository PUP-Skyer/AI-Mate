/**
 * 风险卡片清单组件
 * 按等级分组的可展开/折叠列表，与象限网格联动
 */
import React from 'react';
import { Collapse, Tag } from 'antd';
import type { RiskItem, RiskLevel } from './risk-utils';
import { RISK_LEVEL_STYLES, RISK_QUADRANTS } from './risk-utils';
import { SAGE_FONT_SERIF, type SageTheme } from './sage-theme';
import { SageSection } from './shared';

interface RiskCardListProps {
  risks: RiskItem[];
  theme: SageTheme;
  isDark: boolean;
  activeLevel: RiskLevel | null;
  onSelectLevel: (level: RiskLevel | null) => void;
}

const RiskCardList: React.FC<RiskCardListProps> = ({
  risks, theme, isDark, activeLevel, onSelectLevel,
}) => {
  const textColor = isDark ? theme.textDark : theme.textLight;
  const borderColor = isDark ? theme.borderDark : theme.borderLight;

  const items = RISK_QUADRANTS.flatMap(q => {
    const levelRisks = risks.filter(r => r.level === q.key);
    if (levelRisks.length === 0) return [];
    const meta = RISK_LEVEL_STYLES[q.key];
    return [{
      key: q.key,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: meta.color, borderRadius: 4, padding: '2px 8px', fontFamily: SAGE_FONT_SERIF }}>
            {meta.label}
          </span>
          <span style={{ fontSize: 12, color: textColor, fontFamily: SAGE_FONT_SERIF }}>
            {levelRisks.length} 项风险
          </span>
        </div>
      ),
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {levelRisks.map((risk, i) => (
            <div
              key={risk.id}
              className={`sage-fade-in-up sage-stagger-${i + 2}`}
              style={{
                borderRadius: 8,
                border: `1px solid ${borderColor}`,
                borderLeft: `3px solid ${meta.color}`,
                background: isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                padding: '10px 12px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: textColor, fontFamily: SAGE_FONT_SERIF, marginBottom: 4 }}>
                {risk.name}
              </div>
              <div style={{ fontSize: 12, color: textColor, opacity: 0.75, fontFamily: SAGE_FONT_SERIF, lineHeight: 1.6, marginBottom: 6 }}>
                {risk.description}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <Tag color={meta.color} style={{ margin: 0, fontSize: 10, fontFamily: SAGE_FONT_SERIF }}>
                  应对策略
                </Tag>
                <span style={{ fontSize: 12, color: textColor, fontFamily: SAGE_FONT_SERIF, lineHeight: 1.6, flex: 1 }}>
                  {risk.strategy}
                </span>
              </div>
            </div>
          ))}
        </div>
      ),
    }];
  });

  const activeKeys = activeLevel ? [activeLevel] : undefined;

  return (
    <SageSection title="风险清单" subtitle="RISK REGISTER" theme={theme} isDark={isDark} stagger={3}>
      <Collapse
        items={items}
        activeKey={activeKeys}
        onChange={(keys) => onSelectLevel((keys.length > 0 ? keys[keys.length - 1] as RiskLevel : null))}
        style={{ background: 'transparent', border: 'none' }}
      />
    </SageSection>
  );
};

export default RiskCardList;
