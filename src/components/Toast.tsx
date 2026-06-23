import React, { useState, useEffect } from 'react';

export interface ToastMessage {
 id: string;
 type: 'success' | 'error' | 'info' | 'warning';
 title: string;
 message: string;
}

let toastListener: ((toast: ToastMessage) => void) | null = null;

export const toast = {
 success: (title: string, message: string = '') => {
 if (toastListener) toastListener({ id: String(Date.now()), type: 'success', title, message });
 },
 error: (title: string, message: string = '') => {
 if (toastListener) toastListener({ id: String(Date.now()), type: 'error', title, message });
 },
 info: (title: string, message: string = '') => {
 if (toastListener) toastListener({ id: String(Date.now()), type: 'info', title, message });
 },
 warning: (title: string, message: string = '') => {
 if (toastListener) toastListener({ id: String(Date.now()), type: 'warning', title, message });
 }
};

export const ToastContainer: React.FC = () => {
 const [toasts, setToasts] = useState<ToastMessage[]>([]);

 useEffect(() => {
 toastListener = (newToast: ToastMessage) => {
 setToasts(prev => [...prev, newToast]);
 setTimeout(() => {
 setToasts(prev => prev.filter(t => t.id !== newToast.id));
 }, 4000);
 };
 return () => {
 toastListener = null;
 };
 }, []);

 return (
 <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
 {toasts.map(t => (
 <div
 key={t.id}
 className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 transition-all duration-300 transform translate-y-0 animate-slide-in-up ${
 t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
 t.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900' :
 t.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
 'bg-slate-50 border-slate-200 text-slate-900'
 }`}
 >
 <div className="mt-0.5 text-lg">
 {t.type === 'success' && '✨'}
 {t.type === 'error' && '🛑'}
 {t.type === 'warning' && '⚠️'}
 {t.type === 'info' && 'ℹ️'}
 </div>
 <div className="flex-1 min-w-0">
 <h4 className="font-semibold text-sm leading-tight">{t.title}</h4>
 {t.message && <p className="text-xs opacity-90 mt-1">{t.message}</p>}
 </div>
 <button
 onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
 className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
 >
 ×
 </button>
 </div>
 ))}
 </div>
 );
};
