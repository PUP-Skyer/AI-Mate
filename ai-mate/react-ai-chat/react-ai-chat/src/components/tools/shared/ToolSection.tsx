/**
 * 工具箱页面分区容器
 * 镜像 ButlerSection.tsx 设计模式
 * 左侧 3px 渐变竖线 + 无衬线标题
 */
import React from 'react';
import { TOOL_FONTS, TOOL_SPACING, TOOL_RADIUS } from '../tool-theme';

interface ToolSectionProps {
  title: string;
  subtitle?: string;
  accent: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const ToolSection: React.FC<ToolSectionProps> = ({
  title,
  subtitle,
  accent,
  icon,
  children,
  className = 'tool-fade-in-up tool-stagger-1',
}) => (
  <section
    className={className}
    style={{
      position: 'relative',
      paddingLeft: TOOL_SPACING.lg,
      marginBottom: TOOL_SPACING.xl,
    }}
  >
    {/* 左侧 3px 渐变竖线 */}
    <span
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        borderRadius: TOOL_RADIUS.pill,
        background: `linear-gradient(to bottom, ${accent}, ${accent}00)`,
      }}
    />
    {/* 标题行 */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: TOOL_SPACING.sm,
        marginBottom: TOOL_SPACING.md,
      }}
    >
      {icon && <span style={{ color: accent, fontSize: 16 }}>{icon}</span>}
      <h3
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 700,
          color: '#1a1a1a',
          fontFamily: TOOL_FONTS.heading,
          letterSpacing: 0.3,
        }}
      >
        {title}
      </h3>
      {subtitle && (
        <span
          style={{
            fontSize: 12,
            color: '#8c8c8c',
            fontFamily: TOOL_FONTS.body,
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
    {children}
  </section>
);

export default ToolSection;
