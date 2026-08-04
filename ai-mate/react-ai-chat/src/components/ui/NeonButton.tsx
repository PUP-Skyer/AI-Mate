import React from 'react';

type NeonButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type NeonButtonSize = 'sm' | 'md' | 'lg';

interface NeonButtonProps {
  children: React.ReactNode;
  variant?: NeonButtonVariant;
  size?: NeonButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}

const variantStyles: Record<NeonButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-purple-500/40',
  secondary: 'bg-glass border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/50',
  ghost: 'bg-transparent text-purple-300 hover:bg-white/5',
  danger: 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:shadow-lg hover:shadow-red-500/40',
};

const sizeStyles: Record<NeonButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-xl gap-2.5',
};

const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  onClick,
  className = '',
  type = 'button',
  style,
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      style={style}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default NeonButton;
