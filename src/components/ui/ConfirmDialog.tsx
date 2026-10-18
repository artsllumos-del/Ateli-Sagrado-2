import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}) => {
  const iconConfig = {
    danger: {
      icon: <Trash2 size={20} className="text-rose-600" />,
      bg: 'bg-rose-50 border-rose-100',
      btnVariant: 'danger' as const,
    },
    warning: {
      icon: <AlertTriangle size={20} className="text-amber-600" />,
      bg: 'bg-amber-50 border-amber-100',
      btnVariant: 'gold' as const,
    },
    info: {
      icon: <Info size={20} className="text-sky-600" />,
      bg: 'bg-sky-50 border-sky-100',
      btnVariant: 'primary' as const,
    },
  }[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={!isLoading}
    >
      <div className="flex items-start gap-3.5">
        <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${iconConfig.bg}`}>
          {iconConfig.icon}
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {description}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={onClose}
        >
          {cancelText}
        </Button>
        <Button
          variant={iconConfig.btnVariant}
          size="sm"
          isLoading={isLoading}
          onClick={() => {
            onConfirm();
          }}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};
