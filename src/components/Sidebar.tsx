import React from 'react';
import { useDb } from '../context/DbContext';
import { 
 LayoutDashboard, 
 Package, 
 Sparkles, 
 DollarSign, 
 Users, 
 FileText, 
 ShoppingCart, 
 Hammer, 
 TrendingUp, 
 Settings, 
 LogOut,
 X
} from 'lucide-react';

interface SidebarProps {
 currentView: string;
 onViewChange: (view: string) => void;
 isOpen: boolean;
 onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, onClose }) => {
 const { settings, logout, user } = useDb();

 const menuItems = [
 { id: 'dashboard', label: 'Painel Executivo', icon: LayoutDashboard },
 { id: 'inventory', label: 'Estoque de Insumos', icon: Package },
 { id: 'products', label: 'Produtos (Composição)', icon: Sparkles },
 { id: 'pricing', label: 'Motor de Precificação', icon: DollarSign },
 { id: 'clients', label: 'Clientes', icon: Users },
 { id: 'quotes', label: 'Orçamentos', icon: FileText },
 { id: 'orders', label: 'Pedidos de Venda', icon: ShoppingCart },
 { id: 'production', label: 'Chão de Fábrica', icon: Hammer },
 { id: 'financial', label: 'Fluxo Financeiro', icon: TrendingUp },
 { id: 'settings', label: 'Configurações', icon: Settings },
 ];

 const handleNav = (viewId: string) => {
 onViewChange(viewId);
 onClose(); // close responsive menu
 };

 return (
 <>
 {/* Mobile Backdrop */}
 {isOpen && (
 <div 
 onClick={onClose}
 className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
 />
 )}
 <aside className={`fixed top-0 bottom-0 left-0 w-68 bg-white border-r border-slate-200/80 z-45 lg:z-10 transition-transform duration-300 transform lg:translate-x-0 ${
 isOpen ? 'translate-x-0' : '-translate-x-full'
 } flex flex-col justify-between h-screen`}>
 
 {/* Header Block */}
 <div>
 <div className="h-16 flex items-center justify-between px-5 border-b border-slate-150">
 <div className="flex items-center gap-3">
 <span className="text-2xl" id="sidebar-logo">{settings.logo || '📿'}</span>
 <div>
 <h1 className="font-serif font-bold text-sm text-slate-900 tracking-wide">
 {settings.companyName || 'Ateliê Sagrado'}
 </h1>
 <span className="text-[10px] text-amber-600 font-medium tracking-wider uppercase font-mono">
 ERP Artesanal
 </span>
 </div>
 </div>
 <button 
 onClick={onClose}
 className="p-1.5 rounded-lg hover:bg-slate-100 lg:hidden text-slate-400 hover:text-slate-600"
 >
 <X size={18} />
 </button>
 </div>
 
 {/* Navigation Links */}
 <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
 {menuItems.map((item) => {
 const Icon = item.icon;
 const isActive = currentView === item.id;
 return (
 <button
 key={item.id}
 id={`nav-item-${item.id}`}
 onClick={() => handleNav(item.id)}
 className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
 isActive 
 ? 'bg-gradient-to-r from-amber-500/10 to-amber-500/5 text-amber-900 border border-amber-500/20 font-bold' 
 : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
 }`}
 >
 <Icon size={16} className={isActive ? 'text-amber-600' : 'text-slate-400'} />
 {item.label}
 </button>
 );
 })}
 </nav>
 
 <div className="px-5 py-2 text-center select-none border-t border-slate-100/50 pt-3">
 <span className="font-serif text-[23px] text-amber-600/90 block">
 Artesanato com Amor
 </span>
 </div>
 </div>
 
 {/* Footer Profile & Logout */}
 <div className="p-4 border-t border-slate-150 bg-slate-50/50">
 <div className="flex items-center gap-3 mb-3">
 <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
 {user?.name.substring(0, 2).toUpperCase() || "AT"}
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-xs font-bold text-slate-800 truncate leading-none">
 {user?.name || "Ateliê Sagrado"}
 </p>
 <p className="text-[10px] text-slate-450 truncate mt-0.5 leading-none">
 {user?.email || "artsllumos@gmail.com"}
 </p>
 </div>
 </div>
 <button
 onClick={logout}
 className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 rounded-xl text-xs font-medium text-slate-600 transition-colors cursor-pointer"
 >
 <LogOut size={14} />
 Sair do Sistema
 </button>
 </div>

 </aside>
 </>
 );
};
