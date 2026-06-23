import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Menu, Search, Bell, Sparkles, UserPlus, ShoppingCart, FileText, ChevronRight } from 'lucide-react';
import { toast } from './Toast';

interface HeaderProps {
 onMenuToggle: () => void;
 currentView: string;
 onViewChange: (view: string) => void;
 onQuickAction: (actionType: 'order' | 'client' | 'product' | 'quote') => void;
}

export const Header: React.FC<HeaderProps> = ({ 
 onMenuToggle, 
 currentView, 
 onViewChange,
 onQuickAction
}) => {
 const { inventory, orders } = useDb();
 const [searchQuery, setSearchQuery] = useState('');
 const [showQuickMenu, setShowQuickMenu] = useState(false);
 const [showNotifications, setShowNotifications] = useState(false);

 // Determine low/critical stock warnings
 const lowStockItems = inventory.filter(i => !i.isDeleted && i.quantity <= i.minQuantity && i.quantity > 0);
 const criticalStockItems = inventory.filter(i => !i.isDeleted && i.quantity === 0);
 const delayedOrders = orders.filter(o => !o.isDeleted && o.status !== 'delivered' && o.status !== 'completed' && new Date(o.dueDate) < new Date());

 const viewLabels: Record<string, string> = {
 dashboard: 'Painel Executivo',
 inventory: 'Estoque de Insumos',
 products: 'Produtos (Composição)',
 pricing: 'Motor de Precificação',
 clients: 'Clientes',
 quotes: 'Orçamentos',
 orders: 'Pedidos de Venda',
 production: 'Chão de Fábrica (Produção)',
 financial: 'Fluxo Financeiro',
 settings: 'Configurações',
 };

 const handleGlobalSearch = (e: React.FormEvent) => {
 e.preventDefault();
 if (!searchQuery) return;
 
 // Quick search logic: route user and send a toast
 const searchLower = searchQuery.toLowerCase();
 toast.info("Busca Global", `Buscando por "${searchQuery}"...`);

 if (searchLower.includes('insumo') || searchLower.includes('pérola') || searchLower.includes('crucifixo') || searchLower.includes('material')) {
 onViewChange('inventory');
 } else if (searchLower.includes('terço') || searchLower.includes('pulseira') || searchLower.includes('produto')) {
 onViewChange('products');
 } else if (searchLower.includes('pedido') || searchLower.includes('ped')) {
 onViewChange('orders');
 } else if (searchLower.includes('orçamento')) {
 onViewChange('quotes');
 } else if (searchLower.includes('cliente') || searchLower.includes('ana') || searchLower.includes('paróquia')) {
 onViewChange('clients');
 } else {
 toast.info("Nenhum atalho encontrado", "Exibindo resultados comuns...");
 }
 setSearchQuery('');
 };

 return (
 <header className="h-16 border-b border-slate-200/80 bg-white px-6 flex items-center justify-between sticky top-0 z-30">
 
 {/* Left Area: Hamburger and Breadcrumb */}
 <div className="flex items-center gap-4">
 <button 
 onClick={onMenuToggle}
 className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 lg:hidden cursor-pointer"
 >
 <Menu size={20} />
 </button>

 <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500">
 <span className="hover:text-slate-800 cursor-pointer" onClick={() => onViewChange('dashboard')}>
 Ateliê Sagrado
 </span>
 <ChevronRight size={14} className="text-slate-350" />
 <span className="text-slate-800">
 {viewLabels[currentView] || currentView}
 </span>
 </div>
 </div>

 {/* Right Area: Search, Actions, Notifications */}
 <div className="flex items-center gap-4">
 
 {/* Global Search Bar */}
 <form onSubmit={handleGlobalSearch} className="relative hidden md:block w-64">
 <input
 type="text"
 placeholder="Pesquisar no Ateliê..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder-slate-400"
 />
 <Search size={14} className="absolute left-3.5 top-2.5 text-slate-400" />
 </form>

 {/* Quick Actions Button */}
 <div className="relative">
 <button
 onClick={() => setShowQuickMenu(!showQuickMenu)}
 className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-md shadow-amber-500/5 cursor-pointer"
 >
 <span>+ Ações Rápidas</span>
 </button>

 {showQuickMenu && (
 <>
 <div className="fixed inset-0 z-40" onClick={() => setShowQuickMenu(false)} />
 <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-50 animate-slide-in-up">
 <button
 onClick={() => { onQuickAction('order'); setShowQuickMenu(false); }}
 className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg text-left cursor-pointer"
 >
 <ShoppingCart size={14} className="text-slate-400" />
 Novo Pedido
 </button>
 <button
 onClick={() => { onQuickAction('client'); setShowQuickMenu(false); }}
 className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg text-left cursor-pointer"
 >
 <UserPlus size={14} className="text-slate-400" />
 Novo Cliente
 </button>
 <button
 onClick={() => { onQuickAction('product'); setShowQuickMenu(false); }}
 className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg text-left cursor-pointer"
 >
 <Sparkles size={14} className="text-slate-400" />
 Novo Produto
 </button>
 <button
 onClick={() => { onQuickAction('quote'); setShowQuickMenu(false); }}
 className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg text-left cursor-pointer"
 >
 <FileText size={14} className="text-slate-400" />
 Novo Orçamento
 </button>
 </div>
 </>
 )}
 </div>

 {/* Notifications Button */}
 <div className="relative">
 <button
 onClick={() => setShowNotifications(!showNotifications)}
 className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer relative"
 >
 <Bell size={18} />
 {(lowStockItems.length > 0 || criticalStockItems.length > 0 || delayedOrders.length > 0) && (
 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
 )}
 </button>

 {showNotifications && (
 <>
 <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
 <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-slide-in-up">
 <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-3">
 Notificações do Sistema
 </h3>
 
 <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
 {criticalStockItems.map(item => (
 <div key={item.id} className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 text-xs">
 <p className="font-bold text-rose-800">🚨 Estoque Crítico!</p>
 <p className="text-slate-600 mt-0.5 font-medium">Insumo <strong>{item.name}</strong> está esgotado (0g/un).</p>
 </div>
 ))}
 {lowStockItems.map(item => (
 <div key={item.id} className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-xs">
 <p className="font-bold text-amber-850">⚠️ Estoque Baixo</p>
 <p className="text-slate-600 mt-0.5 font-medium">Insumo <strong>{item.name}</strong> possui apenas {item.quantity} restando.</p>
 </div>
 ))}
 {delayedOrders.map(order => (
 <div key={order.id} className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 text-xs">
 <p className="font-bold text-rose-850">📅 Pedido Atrasado</p>
 <p className="text-slate-600 mt-0.5 font-medium">O prazo do pedido <strong>{order.orderNumber}</strong> expirou em {order.dueDate}.</p>
 </div>
 ))}

 {criticalStockItems.length === 0 && lowStockItems.length === 0 && delayedOrders.length === 0 && (
 <div className="py-6 text-center text-slate-400">
 <p className="text-xs">Tudo limpo por aqui! ✨</p>
 <p className="text-[10px] mt-1">Nenhum alerta de estoque ou atraso pendente.</p>
 </div>
 )}
 </div>
 </div>
 </>
 )}
 </div>

 </div>
 </header>
 );
};
