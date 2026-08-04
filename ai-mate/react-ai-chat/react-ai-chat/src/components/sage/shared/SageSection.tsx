/**
 * 军师AI 分区容器
 * 朱砂左竖线 + 衬线分区标题 + 交错入场动画
 */
import React from 'react';
import { SAGE_FONT_SERIF, type SageTheme } from '../sage-theme';

interface SageSectionProps {
  title: string;
  subtitle?: string;
  theme: SageTheme;
  isDark: boolean;
  stagger?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const SageSection: React.FC<SageSectionProps> = ({
  title,
  subtitle,
  theme,
  isDark,
  stagger = 1,
  children,
  style,
}) => {
  const textColor = isDark ? theme.textDark : theme.textLight;
  const borderColor = isDark ? theme.borderDark : theme.borderLight;

  return (
    <div
      className={`sage-fade-in-up sage-stagger-${Math.min(stagger, 9)}`}
      style={{
        background: isDark ? theme.surfaceDark : theme.surfaceLight,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: '18px 20px 16px',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* 朱砂左竖线 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 16,
          bottom: 16,
          width: 3,
          borderRadius: 2,
          background: `linear-gradient(180deg, ${theme.sealColor}, transparent)`,
          opacity: 0.85,
        }}
      />
      {/* 分区标题行 */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span
            style={{
              fontFamily: SAGE_FONT_SERIF,
              fontSize: 15,
              fontWeight: 700,
              color: textColor,
              letterSpacing: 1,
            }}
          >
            {title}
          </span>
          {subtitle && (
            <span
              style={{
                fontFamily: SAGE_FONT_SERIF,
                fontSize: 11,
                color: theme.accentColor,
                opacity: 0.8,
                letterSpacing: 2,
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: 8,
            height: 1,
            background: `linear-gradient(90deg, ${borderColor}, transparent)`,
          }}
        />
      </div>
      {children}
    </div>
  );
};

export default SageSection;
