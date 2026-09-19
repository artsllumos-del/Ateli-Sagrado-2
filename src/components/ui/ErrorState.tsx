import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Ocorreu um erro ao carregar os dados',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-6 sm:p-8 text-center rounded-2xl border border-rose-200 bg-rose-50/40 flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
        <AlertOctagon size={24} />
      </div>

      <h4 className="text-sm sm:text-base font-bold text-rose-950 mb-1">
        {title}
      </h4>

      <p className="text-xs sm:text-sm text-rose-800/90 max-w-sm mb-5 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RotateCcw size={14} />}
          className="border-rose-300 hover:bg-rose-100/50 text-rose-900"
        >
          Tentar Novamente
        </Button>
      )}
    </div>
  );
};
