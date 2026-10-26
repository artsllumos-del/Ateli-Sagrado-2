import React, { useEffect } from 'react';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';
import { MobileBottomNav } from '../MobileBottomNav';
import { ToastContainer } from '../Toast';
import { Home } from 'lucide-react';

export interface AppShellProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onQuickAction?: (actionType: 'order' | 'client' | 'product' | 'quote') => void;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  onSidebarClose: () => void;
  isFirstSetup?: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentView,
  onViewChange,
  onQuickAction,
  sidebarOpen,
  onSidebarToggle,
  onSidebarClose,
  isFirstSetup = false,
  children,
}) => {
  // Global spotlight mouse tracking for flashlight cards across the ERP
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll<HTMLElement>('.flashlight-card');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-bg-app text-ink-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onViewChange={onViewChange}
        isOpen={sidebarOpen}
        onClose={onSidebarClose}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col lg:pl-20 min-h-screen min-w-0 print:pl-0">
        {/* Topbar / Header */}
        <Header
          onMenuToggle={onSidebarToggle}
          currentView={currentView}
          onViewChange={onViewChange}
          onQuickAction={onQuickAction}
        />

        {/* Content Body */}
        <main className="p-3 sm:p-4 md:p-6 max-w-[1600px] w-full mx-auto flex-1 pb-24 lg:pb-12 print:p-0 print:max-w-none">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {!isFirstSetup && (
        <MobileBottomNav
          currentView={currentView}
          onViewChange={onViewChange}
          onQuickAction={onQuickAction}
        />
      )}

      {/* Universal Floating Home Button */}
      {currentView !== 'dashboard' && (
        <button
          type="button"
          onClick={() => onViewChange('dashboard')}
          title="Ir para o Início / Dashboard"
          aria-label="Ir para o Início"
          className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 px-3.5 py-2.5 bg-slate-900 text-white rounded-2xl shadow-xl border border-amber-500/40 hover:bg-slate-800 active:scale-95 transition-all duration-180 cursor-pointer flex items-center gap-2 group print:hidden hover:shadow-2xl"
        >
          <Home size={17} className="text-amber-400 group-hover:scale-110 transition-transform duration-180" />
          <span className="text-xs font-bold tracking-tight">Início</span>
        </button>
      )}

      {/* Unified Toasts */}
      <ToastContainer />
    </div>
  );
};
