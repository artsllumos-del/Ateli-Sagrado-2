import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  fullWidth?: boolean;
  showCharCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  helperText,
  error,
  success,
  fullWidth = true,
  showCharCount = false,
  className = '',
  id,
  value,
  maxLength,
  disabled,
  rows = 3,
  ...props
}, ref) => {
  const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const hasError = Boolean(error);
  const hasSuccess = Boolean(success);
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} text-left space-y-1`}>
      {label && (
        <label 
          htmlFor={textareaId} 
          className="block text-xs font-semibold text-slate-700 tracking-tight"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          rows={rows}
          className={`
            w-full bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm rounded-xl
            border transition-all duration-150 p-3
            ${hasError 
              ? 'border-rose-400 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15' 
              : hasSuccess 
              ? 'border-emerald-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15'
              : 'border-slate-200/90 hover:border-slate-300 focus:border-amber-500 focus:ring-3 focus:ring-amber-500/15'}
            ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : ''}
            focus:outline-none shadow-2xs resize-y min-h-[80px]
            ${className}
          `}
          {...props}
        />

        {hasError && (
          <div className="absolute top-3 right-3 pointer-events-none text-rose-500">
            <AlertCircle size={16} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] gap-2">
        <div>
          {hasError && (
            <p className="text-rose-600 font-medium">{error}</p>
          )}
          {!hasError && hasSuccess && (
            <p className="text-emerald-600 font-medium">{success}</p>
          )}
          {!hasError && !hasSuccess && helperText && (
            <p className="text-slate-500">{helperText}</p>
          )}
        </div>

        {showCharCount && maxLength && (
          <span className="text-slate-400 font-mono text-[10px] shrink-0">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';
