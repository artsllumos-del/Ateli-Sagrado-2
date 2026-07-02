import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Menu, Search, Bell, Sparkles, UserPlus, ShoppingCart, FileText, ChevronRight, Trash2, Eye, EyeOff, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
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
  const { 
   inventory, 
   orders,
   notifications,
   toggleNotificationRead,
   markNotificationAsRead,
   markAllNotificationsAsRead,
   clearNotification,
   clearAllNotifications
  } = useDb();
  const { settings } = useDb();
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'read'>('all');

 // Determine low/critical stock warnings
 const lowStockItems = inventory.filter(i => !i.isDeleted && i.quantity <= i.minQuantity && i.quantity > 0);
 const criticalStockItems = inventory.filter(i => !i.isDeleted && i.quantity === 0);
 const delayedOrders = orders.filter(o => !o.isDeleted && o.status !== 'delivered' && o.status !== 'completed' && new Date(o.dueDate) < new Date());

 const viewLabels: Record<string, string> = {
  dashboard: 'Painel Executivo',
  inventory: 'Estoque de Insumos',
  purchases: 'Compras Necessárias',
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
  <header className="h-16 border-b border-[rgba(42,36,32,0.06)] bg-[#FFFDF9] px-6 flex items-center justify-between sticky top-0 z-30 print:hidden">
  
   {/* Left Area: Hamburger and Breadcrumb */}
   <div className="flex items-center gap-4">
    <button 
     onClick={onMenuToggle}
     className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 lg:hidden cursor-pointer"
    >
     <Menu size={20} />
    </button>

    <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-ink-500">
     <span className="hidden sm:inline hover:text-gold-600 transition-colors cursor-pointer font-sans" onClick={() => onViewChange('dashboard')}>
      {settings.companyName || 'Ateliê Sagrado'}
     </span>
     <ChevronRight size={14} className="hidden sm:inline text-slate-300" />
     <span className="text-ink-900 font-serif italic font-semibold truncate max-w-[130px] sm:max-w-none">
      {viewLabels[currentView] || currentView}
     </span>
    </div>
   </div>

   {/* Right Area: Search, Actions, Notifications */}
   {!settings?.firstSetup && (
    <div className="flex items-center gap-2 sm:gap-4">
   
    {/* Global Search Bar */}
    <form onSubmit={handleGlobalSearch} className="relative hidden md:block w-64">
     <input
      type="text"
      placeholder="Pesquisar no Ateliê..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-slate-200/80 bg-slate-50/50 text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all placeholder-slate-400"
     />
     <Search size={14} className="absolute left-3.5 top-2.5 text-slate-400" />
    </form>

    {/* Quick Actions Button */}
    <div className="relative">
     <button
      onClick={() => setShowQuickMenu(!showQuickMenu)}
      className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-ink-900 text-white hover:bg-slate-800 text-xs font-medium transition-all shadow-sm cursor-pointer"
     >
      <span className="sm:hidden font-bold text-[13px]">+ Novo</span>
      <span className="hidden sm:inline">+ Ações Rápidas</span>
     </button>

     {showQuickMenu && (
      <>
       <div className="fixed inset-0 z-40" onClick={() => setShowQuickMenu(false)} />
       <div className="absolute right-0 mt-2 w-52 bg-white border border-[rgba(42,36,32,0.06)] rounded-xl shadow-lg p-2 z-50 animate-slide-in-up">
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
      className="p-2 rounded-xl border border-slate-200/80 hover:bg-slate-50/50 text-slate-600 transition-colors cursor-pointer relative"
     >
      <Bell size={18} />
      {notifications.some(n => !n.read) && (
       <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
      )}
     </button>

     {showNotifications && (
      <>
       <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
       <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[rgba(42,36,32,0.06)] rounded-2xl shadow-xl p-4 z-50 animate-slide-in-up">
        <div className="flex items-center justify-between mb-3">
         <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
          Notificações do Ateliê
         </h3>
         <span className="bg-gold-50 text-gold-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
          {notifications.filter(n => !n.read).length} não lidas
         </span>
        </div>

        {/* Filters & Actions bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3 text-xs">
         <div className="flex gap-1.5">
          <button 
           onClick={() => setNotifFilter('all')} 
           className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-all cursor-pointer ${notifFilter === 'all' ? 'bg-gold-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/50'}`}
          >
           Todas
          </button>
          <button 
           onClick={() => setNotifFilter('unread')} 
           className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-all cursor-pointer ${notifFilter === 'unread' ? 'bg-gold-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/50'}`}
          >
           Não Lidas
          </button>
         </div>
         <div className="flex gap-1.5 text-[10px] text-slate-400 font-bold">
          <button onClick={() => markAllNotificationsAsRead()} className="hover:text-gold-600 transition-colors cursor-pointer">Marcar lidas</button>
          <span>•</span>
          <button onClick={() => clearAllNotifications()} className="hover:text-rose-600 transition-colors cursor-pointer">Limpar tudo</button>
         </div>
        </div>
        
        <div className="space-y-2.5 max-h-85 overflow-y-auto pr-1">
         {notifications
          .filter(n => {
           if (notifFilter === 'unread') return !n.read;
           if (notifFilter === 'read') return n.read;
           return true;
          })
          .map(n => (
           <div 
            key={n.id} 
            onClick={() => !n.read && markNotificationAsRead(n.id)}
            className={`p-2.5 rounded-xl border text-xs transition-all relative cursor-pointer group ${
             n.read 
              ? 'bg-slate-50/50 border-slate-100 text-slate-500' 
              : 'bg-[#FFFDF5] border-gold-100/50 text-slate-800 font-medium hover:bg-slate-50/20 shadow-sm'
            }`}
           >
            {/* Read/Unread Indicator dot */}
            {!n.read && (
             <span className="absolute top-3.5 right-3 w-1.5 h-1.5 bg-gold-500 rounded-full" />
            )}

            <div className="flex items-start gap-2.5 pr-8">
             <span className="text-base mt-0.5 leading-none shrink-0 select-none">
              {n.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600 inline" /> : n.type === 'low_stock' ? <AlertTriangle size={16} className="text-amber-500 inline" /> : n.type === 'critical_stock' ? <AlertCircle size={16} className="text-rose-500 inline" /> : <Info size={16} className="text-blue-500 inline" />}
             </span>
             <div className="flex-1 min-w-0">
              <p className={`text-xs ${n.read ? 'text-slate-700' : 'text-slate-900 font-bold'}`}>{n.title}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed break-words">{n.message}</p>
              <span className="text-[9px] text-slate-400 font-mono mt-1 block">
               {new Date(n.date).toLocaleDateString('pt-BR')} {new Date(n.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
             </div>
            </div>

            {/* Hover Actions */}
            <div className="absolute bottom-2.5 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <button
              onClick={(e) => {
               e.stopPropagation();
               toggleNotificationRead(n.id);
              }}
              title={n.read ? "Marcar como não lida" : "Marcar como lida"}
              className="p-1 rounded bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200/50 transition-colors cursor-pointer"
             >
              {n.read ? <EyeOff size={10} /> : <Eye size={10} />}
             </button>
             <button
              onClick={(e) => {
               e.stopPropagation();
               clearNotification(n.id);
              }}
              title="Excluir"
              className="p-1 rounded bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/50 transition-colors cursor-pointer"
             >
              <Trash2 size={10} />
             </button>
            </div>
           </div>
         ))}

         {notifications.filter(n => {
          if (notifFilter === 'unread') return !n.read;
          if (notifFilter === 'read') return n.read;
          return true;
         }).length === 0 && (
          <div className="py-8 text-center text-slate-400">
           <p className="text-xs">Nenhuma notificação por aqui! <Sparkles size={12} className="text-amber-500 inline ml-1 animate-pulse" /></p>
           <p className="text-[10px] mt-1">Sua caixa de mensagens está limpa.</p>
          </div>
         )}
        </div>
       </div>
      </>
     )}
    </div>

    </div>
   )}
  </header>
 );
};
