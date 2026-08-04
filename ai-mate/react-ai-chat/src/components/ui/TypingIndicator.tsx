import React from 'react';

interface TypingIndicatorProps {
  className?: string;
  color?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className = '', color = '#a855f7' }) => {
  return (
    <div className={`flex items-center gap-3 px-4 py-2 ${className}`}>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              background: color,
              animationDelay: `${i * 0.15}s`,
              animationDuration: '0.6s',
            }}
          />
        ))}
      </div>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        AI 正在思考中...
      </span>
    </div>
  );
};

export default TypingIndicator;
