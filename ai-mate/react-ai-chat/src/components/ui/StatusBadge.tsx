import React from 'react';

type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  className?: string;
}

const typeStyles: Record<StatusType, { bg: string; text: string; dot: string }> = {
  success: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', dot: '#10B981' },
  warning: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', dot: '#F59E0B' },
  danger: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', dot: '#EF4444' },
  info: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', dot: '#3B82F6' },
  default: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94A3B8', dot: '#94A3B8' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'default', className = '' }) => {
  const styles = typeStyles[type];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}
      style={{ background: styles.bg, color: styles.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: styles.dot }}
      />
      {status}
    </span>
  );
};

export default StatusBadge;
