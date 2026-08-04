import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  shortcut?: string;
  className?: string;
  onClear?: () => void;
  autoFocus?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = '搜索...',
  shortcut,
  className = '',
  onClear,
  autoFocus = false,
}) => {
  const [focused, setFocused] = useState(false);

  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <div
      className={`
        relative flex items-center rounded-xl transition-all duration-200
        ${focused ? 'shadow-[0_0_12px_var(--border-glow)]' : ''}
        ${className}
      `}
      style={{
        background: 'var(--bg-input)',
        border: focused ? '1px solid var(--neon-primary)' : '1px solid var(--border-light)',
      }}
    >
      <Search size={18} className="ml-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent border-none outline-none px-3 py-2.5 text-sm"
        style={{ color: 'var(--text-primary)' }}
        aria-label={placeholder}
      />
      <div className="flex items-center gap-2 mr-3">
        {value && (
          <button
            onClick={handleClear}
            className="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
            aria-label="清除搜索"
          >
            <X size={12} style={{ color: 'var(--text-muted)' }} />
          </button>
        )}
        {shortcut && (
          <kbd
            className="text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'var(--bg-glass-hover)', color: 'var(--text-muted)' }}
          >
            {shortcut}
          </kbd>
        )}
      </div>
    </div>
  );
};

export default SearchInput;
