import React, { useState, useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  style?: React.CSSProperties;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1500,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  style,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Number((value * eased).toFixed(decimals)));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration, decimals]);

  const formatted = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span
      className={className}
      style={{ fontFamily: 'var(--font-heading)', ...style }}
      aria-label={`${prefix}${value}${suffix}`}
    >
      {prefix}{formatted}{suffix}
    </span>
  );
};

export default AnimatedCounter;
