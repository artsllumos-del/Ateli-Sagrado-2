import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  description,
  error,
  checked,
  disabled,
  className = '',
  id,
  onChange,
  ...props
}, ref) => {
  const checkboxId = id || (typeof label === 'string' ? `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`flex items-start gap-2.5 text-left select-none ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <div className="relative flex items-center justify-center shrink-0 mt-0.5">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="peer sr-only"
          {...props}
        />
        <div 
          onClick={(e) => {
            if (!disabled && onChange) {
              const syntheticEvent = {
                target: { checked: !checked },
                currentTarget: { checked: !checked },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              onChange(syntheticEvent);
            }
          }}
          className={`
            w-4.5 h-4.5 rounded-md border transition-all duration-150 flex items-center justify-center cursor-pointer
            ${checked 
              ? 'bg-amber-600 border-amber-600 text-white shadow-2xs' 
              : 'bg-white border-slate-300 hover:border-slate-400 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-500/30'}
            ${disabled ? 'cursor-not-allowed bg-slate-100 border-slate-200' : ''}
            ${error ? 'border-rose-400' : ''}
          `}
        >
          {checked && <Check size={12} strokeWidth={3} className="text-white" />}
        </div>
      </div>

      {(label || description) && (
        <label htmlFor={checkboxId} className={`flex-1 text-left ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          {label && (
            <span className="block text-xs font-semibold text-slate-800 leading-tight">
              {label}
            </span>
          )}
          {description && (
            <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
              {description}
            </span>
          )}
          {error && (
            <span className="block text-[11px] text-rose-600 font-medium mt-0.5">
              {error}
            </span>
          )}
        </label>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';
