import React from 'react';

type SkeletonVariant = 'card' | 'text' | 'table';

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  count?: number;
  className?: string;
}

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse rounded-lg ${className}`}
    style={{ background: 'var(--bg-glass-hover)' }}
  />
);

const CardSkeleton: React.FC = () => (
  <div className="glass-card rounded-2xl p-5 space-y-3">
    <div className="flex items-center justify-between">
      <SkeletonBlock className="h-4 w-24" />
      <SkeletonBlock className="h-8 w-8 rounded-xl" />
    </div>
    <SkeletonBlock className="h-8 w-32" />
    <SkeletonBlock className="h-3 w-20" />
  </div>
);

const TextSkeleton: React.FC = () => (
  <div className="space-y-2 p-4">
    <SkeletonBlock className="h-4 w-3/4" />
    <SkeletonBlock className="h-4 w-full" />
    <SkeletonBlock className="h-4 w-1/2" />
  </div>
);

const TableSkeleton: React.FC = () => (
  <div className="space-y-3 p-4">
    <div className="flex gap-4">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonBlock key={i} className="h-4 flex-1" />
      ))}
    </div>
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex gap-4">
        {[1, 2, 3, 4].map((j) => (
          <SkeletonBlock key={j} className="h-3 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

const skeletonMap: Record<SkeletonVariant, React.FC> = {
  card: CardSkeleton,
  text: TextSkeleton,
  table: TableSkeleton,
};

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ variant = 'card', count = 1, className = '' }) => {
  const Component = skeletonMap[variant];
  return (
    <div className={`grid gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
