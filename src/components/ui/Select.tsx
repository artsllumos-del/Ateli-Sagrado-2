import React, { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  helperText,
  error,
  options,
  children,
  fullWidth = true,
  className = '',
  id,
  disabled,
  ...props
}, ref) => {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const hasError = Boolean(error);

  return (
    <div className={`${fullWidth ? 'w-full' : ''} text-left space-y-1`}>
      {label && (
        <label 
          htmlFor={selectId} 
          className="block text-xs font-semibold text-slate-700 tracking-tight"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`
            w-full appearance-none bg-white text-slate-900 text-xs sm:text-sm rounded-xl
            border transition-all duration-150 py-2.5 pl-3.5 pr-9
            ${hasError 
              ? 'border-rose-400 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15' 
              : 'border-slate-200/90 hover:border-slate-300 focus:border-amber-500 focus:ring-3 focus:ring-amber-500/15'}
            ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : ''}
            focus:outline-none shadow-2xs cursor-pointer
            ${className}
          `}
          {...props}
        >
          {options
            ? options.map(opt => (
                <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        <div className="absolute right-3 pointer-events-none text-slate-400 flex items-center">
          {hasError ? (
            <AlertCircle size={16} className="text-rose-500" />
          ) : (
            <ChevronDown size={16} />
          )}
        </div>
      </div>

      {hasError && (
        <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium mt-0.5">
          {error}
        </p>
      )}

      {!hasError && helperText && (
        <p className="text-[11px] text-slate-500 mt-0.5">
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
