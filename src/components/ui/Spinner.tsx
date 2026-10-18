import React from 'react';
import { Loader2 } from 'lucide-react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'primary' | 'current' | 'white' | 'slate' | 'gold';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  color?: SpinnerColor;
  label?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 28,
  xl: 36,
};

const colorClasses: Record<SpinnerColor, string> = {
  primary: 'text-amber-600',
  current: 'text-current',
  white: 'text-white',
  slate: 'text-slate-400',
  gold: 'text-amber-500',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  label,
  className = '',
  ...props
}) => {
  const pixelSize = sizeMap[size];

  return (
    <div 
      role="status"
      aria-label={label || 'Carregando...'}
      className={`inline-flex items-center gap-2 ${colorClasses[color]} ${className}`}
      {...props}
    >
      <Loader2 size={pixelSize} className="animate-spin shrink-0" />
      {label && (
        <span className="text-xs font-medium text-slate-600 select-none">
          {label}
        </span>
      )}
    </div>
  );
};
