import React from 'react';

export type BadgeVariant = 
  | 'neutral' 
  | 'success' 
  | 'emerald'
  | 'warning' 
  | 'danger' 
  | 'destructive'
  | 'info' 
  | 'gold' 
  | 'purple'
  | 'primary'
  | 'secondary';

export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant | string;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
  pill?: boolean;
}

const variantStyles: Record<string, { container: string; dot: string }> = {
  neutral: {
    container: 'bg-slate-100 text-slate-700 border-slate-200/80',
    dot: 'bg-slate-500',
  },
  secondary: {
    container: 'bg-slate-100 text-slate-700 border-slate-200/80',
    dot: 'bg-slate-500',
  },
  success: {
    container: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
    dot: 'bg-emerald-500',
  },
  emerald: {
    container: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
    dot: 'bg-emerald-500',
  },
  warning: {
    container: 'bg-amber-50 text-amber-800 border-amber-200/80',
    dot: 'bg-amber-500',
  },
  danger: {
    container: 'bg-rose-50 text-rose-800 border-rose-200/80',
    dot: 'bg-rose-500',
  },
  destructive: {
    container: 'bg-rose-50 text-rose-800 border-rose-200/80',
    dot: 'bg-rose-500',
  },
  info: {
    container: 'bg-sky-50 text-sky-800 border-sky-200/80',
    dot: 'bg-sky-500',
  },
  gold: {
    container: 'bg-amber-500/10 text-amber-900 border-amber-400/40',
    dot: 'bg-amber-500',
  },
  primary: {
    container: 'bg-amber-500/10 text-amber-900 border-amber-400/40',
    dot: 'bg-amber-500',
  },
  purple: {
    container: 'bg-purple-50 text-purple-800 border-purple-200/80',
    dot: 'bg-purple-500',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-1 leading-tight font-medium',
  sm: 'text-[11px] px-2 py-0.5 gap-1.5 leading-tight font-medium',
  md: 'text-xs px-2.5 py-1 gap-1.5 leading-tight font-semibold',
};

const defaultStyle = {
  container: 'bg-slate-100 text-slate-700 border-slate-200/80',
  dot: 'bg-slate-500',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  icon,
  pill = false,
  className = '',
  ...props
}) => {
  const styles = (variant && variantStyles[variant]) || defaultStyle;
  const sizeClass = (size && sizeStyles[size]) || sizeStyles.sm;

  return (
    <span
      className={`
        inline-flex items-center border select-none whitespace-nowrap
        ${pill ? 'rounded-full' : 'rounded-md'}
        ${styles.container}
        ${sizeClass}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />
      )}
      {icon && (
        <span className="shrink-0 inline-flex items-center text-current">{icon}</span>
      )}
      <span className="truncate">{children}</span>
    </span>
  );
};
