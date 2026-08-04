import React from 'react';
import { X } from 'lucide-react';

interface FeaturePanelProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  color?: string;
  className?: string;
}

const FeaturePanel: React.FC<FeaturePanelProps> = ({
  title,
  children,
  onClose,
  color = '#a855f7',
  className = '',
}) => {
  return (
    <div className={`relative animate-fade-in ${className}`}>
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-6 rounded-full"
            style={{ background: `linear-gradient(180deg, ${color}, ${color}88)` }}
          />
          <h3
            className="text-lg font-semibold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
          >
            {title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 cursor-pointer hover:bg-white/10"
          aria-label="关闭面板"
        >
          <X size={16} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      <div className="glass-card rounded-2xl p-5">
        {children}
      </div>
    </div>
  );
};

export default FeaturePanel;
