import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'md' }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const iconSize = size === 'sm' ? 16 : 20;
  const buttonSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${buttonSize} rounded-xl flex items-center justify-center
        transition-all duration-300 cursor-pointer
        hover:bg-white/10
        ${className}
      `}
      aria-label={isDarkMode ? '切换到亮色模式' : '切换到暗色模式'}
      title={isDarkMode ? '切换到亮色模式' : '切换到暗色模式'}
    >
      <span className="transition-transform duration-500 ease-out">
        {isDarkMode ? (
          <Sun size={iconSize} className="text-amber-400" />
        ) : (
          <Moon size={iconSize} className="text-indigo-400" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
