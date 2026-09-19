import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  children,
  hoverable = false,
  padding = 'md',
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`
        bg-white rounded-2xl border border-[rgba(42,36,32,0.06)] shadow-xs
        ${hoverable ? 'transition-all duration-200 hover:shadow-md hover:border-[rgba(42,36,32,0.12)]' : ''}
        ${paddingStyles[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`flex items-center justify-between pb-3 border-b border-slate-100 mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-xs text-slate-500 mt-0.5 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`space-y-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`pt-3 border-t border-slate-100 mt-4 flex items-center justify-end gap-2.5 ${className}`} {...props}>
    {children}
  </div>
);

/* High-efficiency StatCard */
export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    positive?: boolean;
    label?: string;
  };
  variant?: 'default' | 'gold' | 'emerald' | 'rose' | 'sky';
  onClick?: () => void;
  className?: string;
}

const statVariantStyles = {
  default: 'border-slate-200/80 bg-white text-slate-900',
  gold: 'border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-white text-amber-950',
  emerald: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-white text-emerald-950',
  rose: 'border-rose-200/80 bg-gradient-to-br from-rose-50/70 to-white text-rose-950',
  sky: 'border-sky-200/80 bg-gradient-to-br from-sky-50/70 to-white text-sky-950',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all duration-150 relative overflow-hidden
        ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0' : ''}
        ${statVariantStyles[variant]}
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate mb-1">
            {title}
          </p>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {icon && (
          <div className="p-2.5 rounded-xl bg-slate-100/80 text-slate-700 shrink-0">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-xs">
          <span className={`font-semibold ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.value}
          </span>
          {trend.label && (
            <span className="text-slate-400 truncate">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
};
