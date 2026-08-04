import React from 'react';

interface SectionTitleProps {
  title: string;
  description?: string;
  color?: string;
  className?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  description,
  color = '#a855f7',
  className = '',
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center gap-3 mb-1">
        <div
          className="w-1 h-6 rounded-full"
          style={{ background: `linear-gradient(180deg, ${color}, ${color}88)` }}
        />
        <h2
          className="text-xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
        >
          {title}
        </h2>
      </div>
      {description && (
        <p className="text-sm ml-4" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;
