import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hover = true, onClick, style }) => {
  return (
    <div
      className={`glass-card rounded-2xl p-6 ${hover ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={style}
    >
      {children}
    </div>
  );
};

export default GlassCard;
