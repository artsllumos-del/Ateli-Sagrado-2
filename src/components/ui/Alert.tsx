import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: AlertVariant;
  title?: React.ReactNode;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onDismiss?: () => void;
  compact?: boolean;
  className?: string;
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; text: string; defaultIcon: React.ReactNode }> = {
  info: {
    bg: 'bg-sky-50/80',
    border: 'border-sky-200',
    text: 'text-sky-900',
    defaultIcon: <Info size={18} className="text-sky-600" />,
  },
  success: {
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    defaultIcon: <CheckCircle2 size={18} className="text-emerald-600" />,
  },
  warning: {
    bg: 'bg-amber-50/80',
    border: 'border-amber-200',
    text: 'text-amber-950',
    defaultIcon: <AlertTriangle size={18} className="text-amber-600" />,
  },
  error: {
    bg: 'bg-rose-50/80',
    border: 'border-rose-200',
    text: 'text-rose-950',
    defaultIcon: <AlertCircle size={18} className="text-rose-600" />,
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  onDismiss,
  compact = false,
  className = '',
}) => {
  const styles = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`
        rounded-2xl border ${styles.bg} ${styles.border} ${styles.text}
        ${compact ? 'p-3 text-xs' : 'p-4 text-xs sm:text-sm'}
        flex items-start gap-3 relative shadow-2xs ${className}
      `}
    >
      <div className="shrink-0 mt-0.5">
        {icon || styles.defaultIcon}
      </div>

      <div className="flex-1 min-w-0 pr-2">
        {title && (
          <h4 className="font-bold tracking-tight mb-0.5 leading-snug">
            {title}
          </h4>
        )}
        <div className="opacity-90 leading-relaxed">
          {children}
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors cursor-pointer"
          aria-label="Dispensar aviso"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
