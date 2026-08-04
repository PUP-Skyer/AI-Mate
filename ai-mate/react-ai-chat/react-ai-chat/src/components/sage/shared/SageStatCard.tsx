/**
 * 军师AI 大数字指标卡（数字递增入场动画）
 */
import React, { useEffect, useRef, useState } from 'react';
import { SAGE_FONT_SERIF, type SageTheme } from '../sage-theme';

interface SageStatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  theme: SageTheme;
  isDark: boolean;
  stagger?: number;
}

const SageStatCard: React.FC<SageStatCardProps> = ({
  label,
  value,
  suffix = '',
  theme,
  isDark,
  stagger = 1,
}) => {
  const [display, setDisplay] = useState(0);
  const animated = useRef(false);

  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  const isNumeric = !Number.isNaN(numericValue);

  useEffect(() => {
    if (!isNumeric || animated.current) return;
    animated.current = true;
    const duration = 700;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(numericValue * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [numericValue, isNumeric]);

  const textColor = isDark ? theme.textDark : theme.textLight;
  const borderColor = isDark ? theme.borderDark : theme.borderLight;

  return (
    <div
      className={`sage-fade-in-up sage-stagger-${Math.min(stagger, 9)}`}
      style={{
        flex: 1,
        minWidth: 110,
        background: isDark ? theme.surfaceDark : theme.surfaceLight,
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: '12px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 顶部主色细线 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${theme.accentColor}, transparent)`,
        }}
      />
      <div
        style={{
          fontSize: 11,
          color: isDark ? theme.textDark : theme.textLight,
          opacity: 0.55,
          fontFamily: SAGE_FONT_SERIF,
          marginBottom: 4,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </div>
      <div
        className="sage-number-count"
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: theme.accentColor,
          fontFamily: SAGE_FONT_SERIF,
          lineHeight: 1.2,
        }}
      >
        {isNumeric ? `${Math.round(display)}${suffix}` : value}
      </div>
    </div>
  );
};

export default SageStatCard;
