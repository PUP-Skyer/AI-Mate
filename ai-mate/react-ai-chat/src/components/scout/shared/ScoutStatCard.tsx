/**
 * Scout 统计指标卡片组件
 * 支持趋势、脉冲发光、自定义强调色
 */
import React from 'react';
import { Avatar, Statistic } from 'antd';
import { RiseOutlined, FallOutlined, MinusOutlined } from '@ant-design/icons';
import { useTheme } from '../../../contexts/ThemeContext';
import './scout-animations.css';

interface ScoutStatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  pulseGlow?: boolean;
  glowColor?: string;
  className?: string;
}

const ScoutStatCard: React.FC<ScoutStatCardProps> = ({
  label,
  value,
  suffix,
  icon,
  accentColor = '#3B82F6',
  trend,
  trendValue,
  pulseGlow = false,
  glowColor,
  className = '',
}) => {
  const { isDarkMode } = useTheme();

  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#F59E0B';
  const trendIcon = trend === 'up' ? <RiseOutlined /> : trend === 'down' ? <FallOutlined /> : <MinusOutlined />;

  return (
    <div
      className={`scout-stat-card ${pulseGlow ? 'scout-pulse-glow' : ''} ${className}`}
      style={{
        background: isDarkMode ? 'var(--bg-card)' : '#fff',
        borderRadius: 12,
        padding: '16px 12px',
        textAlign: 'center',
        border: `1px solid ${isDarkMode ? 'var(--border-light)' : 'var(--border-light)'}`,
        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.06)',
        ['--panel-glow' as string]: glowColor || accentColor,
      }}
    >
      {icon && (
        <Avatar
          size={32}
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
            marginBottom: 8,
            color: '#fff',
          }}
          icon={icon}
        >
          {icon}
        </Avatar>
      )}
      <Statistic
        title={<span style={{ color: isDarkMode ? 'var(--text-muted)' : '#64748B', fontSize: 12 }}>{label}</span>}
        value={value}
        suffix={
          <span style={{ fontSize: 13, color: isDarkMode ? 'var(--text-secondary)' : '#475569' }}>
            {suffix}
            {trend && (
              <span style={{ marginLeft: 6, color: trendColor, fontSize: 12 }}>
                {trendIcon}
                {trendValue && <span style={{ marginLeft: 2 }}>{trendValue}</span>}
              </span>
            )}
          </span>
        }
        styles={{
          content: { fontSize: 22, fontWeight: 700, color: accentColor },
        }}
      />
    </div>
  );
};

export default ScoutStatCard;
