import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { 
  LayoutDashboard, 
  Package, 
  Sparkles, 
  DollarSign, 
  Users, 
  Shield,
  FileText, 
  ShoppingCart, 
  Hammer, 
  TrendingUp, 
  Settings, 
  LogOut,
  X,
  ShoppingBag
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, onClose }) => {
  const { settings, logout, user } = useDb();
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = settings?.firstSetup ? [
    { id: 'settings', label: 'Configuração Inicial', icon: Settings },
  ] : [
    { id: 'dashboard', label: 'Painel Executivo', icon: LayoutDashboard },
    { id: 'inventory', label: 'Estoque de Insumos', icon: Package },
    { id: 'purchases', label: 'Compras Necessárias', icon: ShoppingBag },
    { id: 'products', label: 'Produtos (Composição)', icon: Sparkles },
    { id: 'pricing', label: 'Motor de Precificação', icon: DollarSign },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'quotes', label: 'Orçamentos', icon: FileText },
    { id: 'orders', label: 'Pedidos de Venda', icon: ShoppingCart },
    { id: 'production', label: 'Chão de Fábrica', icon: Hammer },
    { id: 'financial', label: 'Fluxo Financeiro', icon: TrendingUp },
    { id: 'users', label: 'Operadores & Permissões', icon: Shield },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!user || !user.permissions) return true;
    const permKey = item.id as keyof typeof user.permissions;
    if (user.permissions[permKey] === false) return false;
    return true;
  });

  const handleNav = (viewId: string) => {
    onViewChange(viewId);
    onClose(); // close responsive menu
  };

  // Determine if the sidebar is expanded (always on mobile, depends on hover on desktop)
  const isExpanded = isHovered || isOpen;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-ink-900/50 backdrop-blur-xs z-40 lg:hidden transition-all duration-300"
        />
      )}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed inset-y-0 left-0 bg-white border-r border-[rgba(42,36,32,0.08)] z-40 transition-all duration-300 ease-in-out transform print:hidden ${
          isOpen ? 'translate-x-0 w-68 z-50' : '-translate-x-full lg:translate-x-0'
        } ${isHovered ? 'w-68 shadow-xl z-50' : 'lg:w-20 w-68'} flex flex-col h-full max-h-full overflow-hidden`}
      >
        
        {/* Header Block */}
        <div className="shrink-0 h-16 flex items-center justify-between px-4 border-b border-[rgba(42,36,32,0.06)] overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center">
              {settings.logo ? (
                settings.logo.startsWith('http') || settings.logo.startsWith('data:image') ? (
                  <img 
                    src={settings.logo} 
                    alt="Logo" 
                    className="w-8 h-8 object-contain rounded-lg shadow-sm" 
                    id="sidebar-logo"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-2xl" id="sidebar-logo">{settings.logo}</span>
                )
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-50 to-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-xs relative overflow-hidden" id="sidebar-logo">
                  <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 4v16M8 9h8" />
                    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.5" />
                  </svg>
                </div>
              )}
            </div>
            <div className={`transition-all duration-300 flex-1 min-w-0 ${isExpanded ? 'opacity-100' : 'lg:opacity-0 lg:w-0 lg:pointer-events-none'}`}>
              <h1 className="font-serif font-bold text-sm text-slate-900 tracking-wide truncate">
                {settings.companyName || 'Ateliê Sagrado'}
              </h1>
              <span className="text-[10px] text-amber-600 font-medium tracking-wider uppercase font-mono block">
                ERP Artesanal
              </span>
            </div>
          </div>
          {isOpen && (
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#FAF7F2] lg:hidden text-ink-300 hover:text-ink-600 shrink-0"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center rounded-[10px] text-xs transition-all duration-150 cursor-pointer overflow-hidden ${
                  isActive 
                    ? 'bg-[#FAF3E7] text-ink-900 font-semibold border-l-4 border-gold-500 ring-1 ring-gold-500/10 shadow-xs' 
                    : 'text-ink-600 hover:text-ink-900 hover:bg-[#FAF7F2]'
                } ${isExpanded ? 'px-3 py-2.5 gap-3 justify-start' : 'lg:p-2.5 lg:justify-center'}`}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon size={16} className={`shrink-0 ${isActive ? 'text-gold-600' : 'text-ink-300'}`} />
                <span className={`font-sans transition-all duration-300 truncate ${isExpanded ? 'opacity-100 block' : 'lg:opacity-0 lg:hidden lg:w-0'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
        
        {/* Footer Area */}
        <div className="shrink-0 border-t border-[rgba(42,36,32,0.06)] bg-[#FFFDF9]">
          <div className={`px-4 py-2 text-center select-none pt-2.5 transition-all duration-300 ${isExpanded ? 'opacity-100 block' : 'lg:opacity-0 lg:hidden'}`}>
            <span className="font-serif italic text-xs text-terracotta-500 block truncate" title={settings.slogan || "Artesanato com Amor"}>
              {settings.slogan || "Artesanato com Amor"}
            </span>
          </div>
          
          {/* Footer Profile & Logout */}
          <div className="p-3 overflow-hidden">
            <button
              onClick={() => handleNav('settings')}
              className={`w-full flex items-center gap-2.5 mb-2.5 p-1.5 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer text-left ${isExpanded ? 'justify-start' : 'lg:justify-center'}`}
              title="Acessar Meu Perfil"
            >
              {user?.photoUrl ? (
                <img 
                  src={user.photoUrl} 
                  alt={user.name || "Foto de perfil"} 
                  className="w-9 h-9 rounded-full object-cover border border-amber-300/80 shrink-0 shadow-xs"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.photo-fallback') as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div 
                className={`photo-fallback w-9 h-9 rounded-full bg-[#FAF3E7] items-center justify-center font-bold text-gold-700 text-xs shrink-0 border border-amber-200/60 ${user?.photoUrl ? 'hidden' : 'flex'}`}
              >
                {(user?.name || "Administrador").substring(0, 2).toUpperCase()}
              </div>
              <div className={`min-w-0 flex-1 transition-all duration-300 ${isExpanded ? 'opacity-100 block' : 'lg:opacity-0 lg:hidden lg:w-0'}`}>
                <p className="text-xs font-bold text-slate-800 truncate leading-none">
                  {user?.name || "Administrador"}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-1 leading-none font-mono">
                  {user?.email || "admin@atelie.com"}
                </p>
              </div>
            </button>

            <button
              onClick={logout}
              className={`w-full flex items-center justify-center border border-[rgba(42,36,32,0.1)] hover:bg-rose-50/50 hover:border-rose-200 hover:text-rose-600 rounded-xl text-xs font-medium text-ink-600 transition-colors cursor-pointer ${isExpanded ? 'px-3 py-2 gap-2' : 'lg:p-2'}`}
              title="Sair do Sistema"
            >
              <LogOut size={14} className="shrink-0" />
              <span className={`transition-all duration-300 truncate ${isExpanded ? 'opacity-100 inline' : 'lg:opacity-0 lg:hidden lg:w-0'}`}>Sair do Sistema</span>
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};
