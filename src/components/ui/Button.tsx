import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'ghost' 
  | 'danger' 
  | 'success' 
  | 'gold'
  | 'subtle';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-ink-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-xs border border-transparent focus-visible:ring-2 focus-visible:ring-ink-900/20',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/60 focus-visible:ring-2 focus-visible:ring-slate-400/20',
  outline: 'bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-200 shadow-2xs hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-300',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100/80 active:bg-slate-200 text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-300',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs border border-transparent focus-visible:ring-2 focus-visible:ring-rose-500/20',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-xs border border-transparent focus-visible:ring-2 focus-visible:ring-emerald-500/20',
  gold: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800 shadow-xs border border-amber-600/30 focus-visible:ring-2 focus-visible:ring-amber-500/30',
  subtle: 'bg-amber-50 text-amber-900 hover:bg-amber-100 active:bg-amber-200/80 border border-amber-200/60 focus-visible:ring-2 focus-visible:ring-amber-400/20',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'text-[11px] px-2.5 py-1 rounded-lg gap-1.5 min-h-[28px]',
  sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 min-h-[32px]',
  md: 'text-xs sm:text-sm px-4 py-2 rounded-xl gap-2 min-h-[40px]',
  lg: 'text-sm px-5 py-2.5 rounded-xl gap-2.5 min-h-[46px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer
        focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]
        ${fullWidth ? 'w-full' : ''}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={size === 'xs' || size === 'sm' ? 14 : 16} className="animate-spin shrink-0" />
      ) : leftIcon ? (
        <span className="shrink-0 inline-flex items-center">{leftIcon}</span>
      ) : null}
      
      <span className="truncate leading-none">{children}</span>
      
      {!isLoading && rightIcon ? (
        <span className="shrink-0 inline-flex items-center">{rightIcon}</span>
      ) : null}
    </button>
  );
});

Button.displayName = 'Button';
