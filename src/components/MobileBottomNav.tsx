import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  TrendingUp,
  Grid,
  Sparkles,
  DollarSign,
  Users,
  FileText,
  Hammer,
  ShoppingBag,
  CreditCard,
  UserCheck,
  Settings,
  X,
  Plus,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onQuickAction: (actionType: 'order' | 'client' | 'product' | 'quote') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onViewChange,
  onQuickAction,
}) => {
  const [showModulesSheet, setShowModulesSheet] = useState(false);

  const primaryTabs = [
    {
      id: 'dashboard',
      label: 'Início',
      icon: LayoutDashboard,
      isActive: currentView === 'dashboard',
    },
    {
      id: 'orders',
      label: 'Pedidos',
      icon: ShoppingCart,
      isActive: currentView === 'orders' || currentView === 'quotes',
    },
    {
      id: 'inventory',
      label: 'Estoque',
      icon: Package,
      isActive: currentView === 'inventory' || currentView === 'purchases',
    },
    {
      id: 'financial',
      label: 'Financeiro',
      icon: TrendingUp,
      isActive: currentView === 'financial',
    },
  ];

  const allModules = [
    { id: 'dashboard', label: 'Painel Executivo', desc: 'KPIs e visão geral', icon: LayoutDashboard, color: 'bg-amber-50 text-amber-700 border-amber-200/70' },
    { id: 'orders', label: 'Pedidos de Venda', desc: 'Gestão de encomendas', icon: ShoppingCart, color: 'bg-emerald-50 text-emerald-700 border-emerald-200/70' },
    { id: 'quotes', label: 'Orçamentos', desc: 'Simulações e propostas', icon: FileText, color: 'bg-sky-50 text-sky-700 border-sky-200/70' },
    { id: 'production', label: 'Chão de Fábrica', desc: 'Fila e cronômetros', icon: Hammer, color: 'bg-indigo-50 text-indigo-700 border-indigo-200/70' },
    { id: 'products', label: 'Catálogo & Receitas', desc: 'Produtos e composição', icon: Sparkles, color: 'bg-purple-50 text-purple-700 border-purple-200/70' },
    { id: 'inventory', label: 'Estoque de Insumos', desc: 'Saldos e lotes', icon: Package, color: 'bg-amber-50 text-amber-800 border-amber-200/70' },
    { id: 'purchases', label: 'Compras', desc: 'Reposição de estoque', icon: ShoppingBag, color: 'bg-rose-50 text-rose-700 border-rose-200/70' },
    { id: 'pricing', label: 'Precificação', desc: 'Simulador de margens', icon: DollarSign, color: 'bg-teal-50 text-teal-700 border-teal-200/70' },
    { id: 'clients', label: 'Clientes CRM', desc: 'Histórico 360° e contatos', icon: Users, color: 'bg-blue-50 text-blue-700 border-blue-200/70' },
    { id: 'financial', label: 'Fluxo Financeiro', desc: 'Caixa, DRE e PIX', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-800 border-emerald-200/70' },
    { id: 'subscription', label: 'Assinatura', desc: 'Plano e faturamento', icon: CreditCard, color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { id: 'profile', label: 'Meu Perfil', desc: 'Conta e segurança', icon: UserCheck, color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { id: 'settings', label: 'Configurações', desc: 'Parâmetros do ateliê', icon: Settings, color: 'bg-slate-100 text-slate-700 border-slate-200' },
  ];

  const isSecondaryActive = !['dashboard', 'orders', 'inventory', 'financial'].includes(currentView);

  const handleSelectModule = (id: string) => {
    onViewChange(id);
    setShowModulesSheet(false);
  };

  return (
    <>
      {/* Bottom Sheet for All Modules & Quick Actions */}
      {showModulesSheet && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end print:hidden">
          <div
            className="fixed inset-0 bg-ink-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setShowModulesSheet(false)}
          />
          <div className="relative z-10 bg-[#FFFDF9] border-t border-slate-200 rounded-t-3xl shadow-2xl max-h-[86dvh] flex flex-col overflow-hidden animate-slide-in-up pb-safe">
            {/* Drag Handle */}
            <div className="pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-slate-300/80" />
            </div>

            {/* Sheet Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Módulos do Ateliê
                </h3>
                <p className="text-[11px] text-slate-500">
                  Acesso rápido a todas as áreas e ações do sistema
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModulesSheet(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
                aria-label="Fechar menu de módulos"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 overflow-y-auto space-y-5 flex-1">
              {/* Quick Actions Strip */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
                  Ações Rápidas
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onQuickAction('order');
                      setShowModulesSheet(false);
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs active:scale-98 cursor-pointer"
                  >
                    <Plus size={14} className="text-amber-400 shrink-0" />
                    <span className="truncate">Novo Pedido</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onQuickAction('quote');
                      setShowModulesSheet(false);
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs active:scale-98 cursor-pointer"
                  >
                    <Plus size={14} className="text-emerald-600 shrink-0" />
                    <span className="truncate">Novo Orçamento</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onQuickAction('product');
                      setShowModulesSheet(false);
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs active:scale-98 cursor-pointer"
                  >
                    <Plus size={14} className="text-amber-600 shrink-0" />
                    <span className="truncate">Novo Produto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onQuickAction('client');
                      setShowModulesSheet(false);
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs active:scale-98 cursor-pointer"
                  >
                    <Plus size={14} className="text-sky-600 shrink-0" />
                    <span className="truncate">Novo Cliente</span>
                  </button>
                </div>
              </div>

              {/* Modules Grid */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
                  Navegação Completa
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {allModules.map((mod) => {
                    const Icon = mod.icon;
                    const active = currentView === mod.id;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => handleSelectModule(mod.id)}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 cursor-pointer active:scale-98 ${
                          active
                            ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30 shadow-xs'
                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${mod.color}`}>
                          <Icon size={17} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${active ? 'text-amber-950' : 'text-slate-900'}`}>
                            {mod.label}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {mod.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar (Mobile & Tablet Portrait < lg) */}
      <nav
        aria-label="Navegação inferior mobile"
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-[#FFFDF9]/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(42,36,32,0.05)] pb-safe print:hidden"
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setShowModulesSheet(false);
                  onViewChange(tab.id);
                }}
                className={`flex flex-col items-center justify-center gap-1 relative transition-colors cursor-pointer select-none ${
                  tab.isActive
                    ? 'text-amber-700 font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                {tab.isActive && (
                  <span className="absolute top-0 inset-x-4 h-0.5 bg-amber-600 rounded-b-full" />
                )}
                <div
                  className={`p-1 rounded-xl transition-colors ${
                    tab.isActive ? 'bg-amber-500/15 text-amber-700' : ''
                  }`}
                >
                  <Icon size={19} strokeWidth={tab.isActive ? 2.4 : 2} />
                </div>
                <span className="text-[10px] leading-none tracking-tight">
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* 5th Tab: Modules / Mais */}
          <button
            type="button"
            onClick={() => setShowModulesSheet((prev) => !prev)}
            className={`flex flex-col items-center justify-center gap-1 relative transition-colors cursor-pointer select-none ${
              showModulesSheet || isSecondaryActive
                ? 'text-amber-700 font-bold'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            {(showModulesSheet || isSecondaryActive) && (
              <span className="absolute top-0 inset-x-4 h-0.5 bg-amber-600 rounded-b-full" />
            )}
            <div
              className={`p-1 rounded-xl transition-colors ${
                showModulesSheet || isSecondaryActive ? 'bg-amber-500/15 text-amber-700' : ''
              }`}
            >
              <Grid size={19} strokeWidth={showModulesSheet || isSecondaryActive ? 2.4 : 2} />
            </div>
            <span className="text-[10px] leading-none tracking-tight">
              Módulos
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
