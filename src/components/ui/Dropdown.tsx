import React, { useState, useRef, useEffect } from 'react';

export interface DropdownItemProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  onClick,
  icon,
  children,
  danger = false,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        w-full text-left px-3 py-2 text-xs font-medium rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${danger 
          ? 'text-rose-600 hover:bg-rose-50' 
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate flex-1">{children}</span>
    </button>
  );
};

export const DropdownDivider: React.FC = () => (
  <div className="h-px bg-slate-100 my-1 -mx-1" />
);

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  width?: string;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  align = 'right',
  width = 'w-52',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer inline-flex items-center">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`
            absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 ${width}
            bg-white border border-slate-200/90 rounded-2xl shadow-xl p-1.5 z-50
            animate-slide-in-up
          `}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};
