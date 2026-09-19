import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  success,
  leftIcon,
  rightIcon,
  onClear,
  fullWidth = true,
  className = '',
  id,
  value,
  disabled,
  ...props
}, ref) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const hasError = Boolean(error);
  const hasSuccess = Boolean(success);

  return (
    <div className={`${fullWidth ? 'w-full' : ''} text-left space-y-1`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-xs font-semibold text-slate-700 tracking-tight"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center shrink-0">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          value={value}
          disabled={disabled}
          className={`
            w-full bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm rounded-xl
            border transition-all duration-150 py-2.5
            ${leftIcon ? 'pl-9' : 'pl-3.5'}
            ${rightIcon || onClear || hasError || hasSuccess ? 'pr-9' : 'pr-3.5'}
            ${hasError 
              ? 'border-rose-400 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15' 
              : hasSuccess 
              ? 'border-emerald-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15'
              : 'border-slate-200/90 hover:border-slate-300 focus:border-amber-500 focus:ring-3 focus:ring-amber-500/15'}
            ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : ''}
            focus:outline-none shadow-2xs
            ${className}
          `}
          {...props}
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {onClear && value && !disabled && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Limpar campo"
            >
              <X size={14} />
            </button>
          )}

          {hasError && (
            <AlertCircle size={16} className="text-rose-500 shrink-0" />
          )}

          {hasSuccess && !hasError && (
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          )}

          {!hasError && !hasSuccess && rightIcon && (
            <div className="text-slate-400 flex items-center justify-center pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
      </div>

      {hasError && (
        <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium mt-0.5">
          {error}
        </p>
      )}

      {!hasError && hasSuccess && (
        <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium mt-0.5">
          {success}
        </p>
      )}

      {!hasError && !hasSuccess && helperText && (
        <p className="text-[11px] text-slate-500 mt-0.5">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
