import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

let toastListener: ((toast: ToastMessage) => void) | null = null;

export const toast = {
  success: (title: string, message: string = '') => {
    if (toastListener) toastListener({ id: String(Date.now() + Math.random()), type: 'success', title, message });
  },
  error: (title: string, message: string = '') => {
    if (toastListener) toastListener({ id: String(Date.now() + Math.random()), type: 'error', title, message });
  },
  info: (title: string, message: string = '') => {
    if (toastListener) toastListener({ id: String(Date.now() + Math.random()), type: 'info', title, message });
  },
  warning: (title: string, message: string = '') => {
    if (toastListener) toastListener({ id: String(Date.now() + Math.random()), type: 'warning', title, message });
  }
};

const toastConfig = {
  success: {
    bg: 'bg-white',
    border: 'border-emerald-200',
    icon: <CheckCircle2 size={18} className="text-emerald-600" />,
    badge: 'bg-emerald-50 text-emerald-800',
    bar: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-white',
    border: 'border-rose-200',
    icon: <AlertOctagon size={18} className="text-rose-600" />,
    badge: 'bg-rose-50 text-rose-800',
    bar: 'bg-rose-500',
  },
  warning: {
    bg: 'bg-white',
    border: 'border-amber-200',
    icon: <AlertTriangle size={18} className="text-amber-600" />,
    badge: 'bg-amber-50 text-amber-800',
    bar: 'bg-amber-500',
  },
  info: {
    bg: 'bg-white',
    border: 'border-sky-200',
    icon: <Info size={18} className="text-sky-600" />,
    badge: 'bg-sky-50 text-sky-800',
    bar: 'bg-sky-500',
  },
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    toastListener = (newToast: ToastMessage) => {
      setToasts(prev => [...prev, newToast]);
      const duration = newToast.duration || 4500;
      const timer = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
        timeoutsRef.current.delete(newToast.id);
      }, duration);
      timeoutsRef.current.set(newToast.id, timer);
    };
    return () => {
      toastListener = null;
      timeoutsRef.current.forEach(timer => clearTimeout(timer));
      timeoutsRef.current.clear();
    };
  }, []);

  const handleDismiss = (id: string) => {
    const timer = timeoutsRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timeoutsRef.current.delete(id);
    }
    setToasts(prev => prev.filter(x => x.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-32px)] sm:w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map(t => {
        const conf = toastConfig[t.type];
        return (
          <div
            key={t.id}
            className={`
              pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start gap-3 relative overflow-hidden
              transition-all duration-200 animate-slide-in-up bg-white ${conf.border}
            `}
          >
            <div className="shrink-0 mt-0.5">
              {conf.icon}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug tracking-tight">
                {t.title}
              </h4>
              {t.message && (
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {t.message}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleDismiss(t.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Fechar notificação"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
