import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  trend?: number;
  description?: string;
  color?: string;
  className?: string;
  animate?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  prefix = '',
  suffix = '',
  trend,
  description,
  color = '#a855f7',
  className = '',
  animate = true,
}) => {
  const trendUp = trend !== undefined && trend >= 0;

  return (
    <div
      className={`stat-card-purple rounded-2xl p-5 cursor-pointer ${animate ? 'card-enter' : ''} ${className}`}
      style={color ? {
        background: `linear-gradient(135deg, ${color}26 0%, ${color}14 100%)`,
        borderColor: `${color}40`,
      } : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {title}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-1">
        {prefix && <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{prefix}</span>}
        <span
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {suffix && <span className="text-sm ml-0.5" style={{ color: 'var(--text-secondary)' }}>{suffix}</span>}
      </div>

      {(trend !== undefined || description) && (
        <div className="flex items-center gap-2 text-xs">
          {trend !== undefined && (
            <span
              className={`flex items-center gap-0.5 font-medium ${
                trendUp ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(trend)}%
            </span>
          )}
          {description && (
            <span style={{ color: 'var(--text-muted)' }}>{description}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
