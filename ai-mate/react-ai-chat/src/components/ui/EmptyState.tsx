import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <div className="mb-4" style={{ color: 'var(--text-muted)' }}>
        {icon || <PackageOpen size={48} />}
      </div>
      <h3
        className="text-base font-medium mb-1"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}
      >
        {title}
      </h3>
      {description && (
        <p className="text-sm mb-4 text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
