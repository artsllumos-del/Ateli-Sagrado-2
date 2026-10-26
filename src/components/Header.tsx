import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { useSubscription } from '../hooks/useSubscription';
import { Menu, Search, Bell, Sparkles, UserPlus, ShoppingCart, FileText, ChevronRight, Trash2, Eye, EyeOff, CheckCircle2, AlertTriangle, AlertCircle, Info, Plus, Clock } from 'lucide-react';
import { toast } from './Toast';
import { CommandPalette } from './CommandPalette';

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
   currentTenant,
   tenants,
   switchTenant,
   user,
   inventory, 
   orders,
   notifications,
   toggleNotificationRead,
   markNotificationAsRead,
   markAllNotificationsAsRead,
   clearNotification,
   clearAllNotifications,
   settings
  } = useDb();
  const { isExpired, isUrgent, daysRemaining, formattedRemainingTime, daysUntilRenewal } = useSubscription();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Global keyboard shortcut: Ctrl+K / Cmd+K to open Command Palette
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const atelierBrandName = settings?.nomeFantasia || settings?.companyName || currentTenant?.nomeFantasia || currentTenant?.name || 'Ateliê';
  const atelierThemeColor = settings?.primaryColor || currentTenant?.primaryColor || '#D4AF37';

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
  subscription: 'Assinatura',
  landing: 'Apresentação (Landing Page)',
  profile: 'Meu Perfil',
  account_security: 'Segurança & Sessões',
  settings: 'Configurações',
 };

 return (
  <>
  <header className="h-16 border-b border-[rgba(42,36,32,0.06)] bg-[#FFFDF9] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 print:hidden">
  
   {/* Left Area: Hamburger and Ateliê Brand Badge */}
   <div className="flex items-center gap-2 sm:gap-3 min-w-0">
    <button 
     onClick={onMenuToggle}
     className="p-2 -ml-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 lg:hidden cursor-pointer shrink-0"
     aria-label="Abrir menu"
    >
     <Menu size={20} />
    </button>

    {/* Dedicated Ateliê Brand Badge */}
    <div className="relative">
     <button 
      onClick={() => setShowTenantDropdown(prev => !prev)}
      className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-xs font-bold text-amber-950 shadow-2xs shrink-0 cursor-pointer transition-all active:scale-[0.98]"
      title="Identidade do Ateliê (clique para detalhes)"
     >
      <div 
       className="w-2.5 h-2.5 rounded-full ring-2 ring-white shrink-0 shadow-2xs" 
       style={{ backgroundColor: atelierThemeColor }}
      />
      <span className="truncate max-w-[120px] sm:max-w-[200px]">
       {atelierBrandName}
      </span>
     </button>

     {showTenantDropdown && (
      <>
       <div className="fixed inset-0 z-40" onClick={() => setShowTenantDropdown(false)} />
       <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-3.5 z-50 animate-slide-in-up">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
         <div 
          className="w-9 h-9 rounded-xl flex items-center justify-center font-serif font-bold text-white shadow-xs shrink-0 text-sm"
          style={{ backgroundColor: atelierThemeColor }}
         >
          {settings?.logo && !settings.logo.startsWith('http') ? settings.logo : (atelierBrandName[0] || 'A')}
         </div>
         <div className="min-w-0 flex-1">
          <h4 className="font-bold text-xs text-slate-900 truncate">{atelierBrandName}</h4>
          <p className="text-[10px] text-slate-500 truncate">
           {settings?.razaoSocial || currentTenant?.razaoSocial || 'Arte Sacra & Produção'}
          </p>
          {(settings?.cnpj || currentTenant?.document) && (
           <p className="text-[9px] font-mono text-slate-400">CNPJ: {settings?.cnpj || currentTenant?.document}</p>
          )}
         </div>
        </div>

        <div className="py-2.5 space-y-1.5 text-[11px] border-b border-slate-100">
         <div className="flex justify-between items-center text-slate-600">
          <span className="text-slate-400">Assinante:</span>
          <span className="font-semibold text-slate-800 truncate max-w-[130px]">{user?.name || 'Administrador'}</span>
         </div>
         <div className="flex justify-between items-center text-slate-600">
          <span className="text-slate-400">Assinatura:</span>
          {isExpired ? (
            <span className="font-medium bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
             Vencida • 0 dias
            </span>
          ) : (
            <span className={`font-medium border px-1.5 py-0.5 rounded text-[10px] font-bold ${
              isUrgent
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
             Ativa ({formattedRemainingTime})
            </span>
          )}
         </div>
         {(settings?.phone || currentTenant?.phone) && (
          <div className="flex justify-between items-center text-slate-600">
           <span className="text-slate-400">Telefone:</span>
           <span className="font-mono text-[10px]">{settings?.phone || currentTenant?.phone}</span>
          </div>
         )}
        </div>

        <div className="pt-2">
         <button
          onClick={() => {
           setShowTenantDropdown(false);
           onViewChange('settings');
          }}
          className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold text-center block cursor-pointer transition-colors"
         >
          Configurar Identidade do Ateliê
         </button>
        </div>
       </div>
      </>
     )}
    </div>

    {currentView !== 'dashboard' ? (
      <>
        <button
          type="button"
          onClick={() => onViewChange('dashboard')}
          className="text-slate-500 hover:text-slate-900 text-xs font-semibold hover:underline hidden sm:inline cursor-pointer"
          title="Voltar ao Início"
        >
          Início
        </button>
        <ChevronRight size={14} className="hidden sm:inline text-slate-300 shrink-0" />
      </>
    ) : null}
    <span className="text-ink-900 font-semibold truncate hidden sm:inline text-xs">
     {viewLabels[currentView] || currentView}
    </span>
   </div>

   {/* Right Area: Search, Actions, Notifications */}
   {!settings?.firstSetup && (
    <div className="flex items-center gap-1.5 sm:gap-3">

      {/* Visual Subscription Remaining Time Indicator */}
      <button
       type="button"
       onClick={() => onViewChange('subscription')}
       title={isExpired ? 'Assinatura Vencida - Clique para ver opções de regularização e planos na aba de Assinatura' : `Tempo restante da assinatura: ${formattedRemainingTime}. Clique para gerenciar sua assinatura.`}
       className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs select-none shrink-0 ${
        isExpired || isUrgent
         ? 'bg-red-50 text-red-700 border border-red-300 ring-2 ring-red-400/20 hover:bg-red-100'
         : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100/70'
       }`}
      >
       <Clock size={13} className={isExpired || isUrgent ? 'text-red-600 shrink-0' : 'text-emerald-600 shrink-0'} />
       <span className="font-semibold whitespace-nowrap">
        {formattedRemainingTime}
       </span>
       {isUrgent && !isExpired && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
       )}
      </button>

      {/* Landing Page Showcase Trigger Button */}
      <button
        type="button"
        onClick={() => onViewChange('landing')}
        title="Ver Apresentação do Produto / Landing Page"
        className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-950 text-xs font-bold cursor-pointer shadow-2xs transition-all active:scale-95 select-none shrink-0"
      >
        <Sparkles size={13} className="text-gold-600" />
        <span>Ver Apresentação</span>
      </button>
   
    {/* Global Quick Search Button & Keyboard Trigger */}
    <button
      type="button"
      onClick={() => setShowCommandPalette(true)}
      className="hidden md:flex items-center justify-between w-64 px-3 py-1.5 rounded-full border border-slate-200/90 bg-slate-50/70 hover:bg-slate-100/80 text-xs text-slate-400 hover:text-slate-600 transition-all cursor-pointer shadow-2xs select-none"
    >
      <div className="flex items-center gap-2">
        <Search size={14} className="text-slate-400" />
        <span>Pesquisar no Ateliê...</span>
      </div>
      <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-bold shadow-2xs">
        Ctrl K
      </kbd>
    </button>

    {/* Mobile Quick Search Button */}
    <button
      type="button"
      onClick={() => setShowCommandPalette(true)}
      className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
      title="Busca Rápida (Ctrl+K)"
    >
      <Search size={16} />
    </button>

    {/* Quick Actions Button */}
    <div className="relative">
     <button
      onClick={() => setShowQuickMenu(!showQuickMenu)}
      className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-ink-900 text-white hover:bg-slate-800 active:bg-slate-950 text-xs font-semibold transition-all shadow-xs cursor-pointer select-none active:scale-[0.98]"
     >
      <span className="text-amber-400 font-bold text-sm leading-none">+</span>
      <span className="hidden sm:inline">Ações Rápidas</span>
      <span className="sm:hidden font-medium">Novo</span>
     </button>

     {showQuickMenu && (
      <>
       <div className="fixed inset-0 z-40" onClick={() => setShowQuickMenu(false)} />
       <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-1.5 z-50 animate-slide-in-up">
        <button
         onClick={() => { onQuickAction('order'); setShowQuickMenu(false); }}
         className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl text-left cursor-pointer transition-colors"
        >
         <ShoppingCart size={15} className="text-amber-600" />
         Novo Pedido
        </button>
        <button
         onClick={() => { onQuickAction('client'); setShowQuickMenu(false); }}
         className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl text-left cursor-pointer transition-colors"
        >
         <UserPlus size={15} className="text-sky-600" />
         Novo Cliente
        </button>
        <button
         onClick={() => { onQuickAction('product'); setShowQuickMenu(false); }}
         className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl text-left cursor-pointer transition-colors"
        >
         <Sparkles size={15} className="text-amber-600" />
         Novo Produto
        </button>
        <button
         onClick={() => { onQuickAction('quote'); setShowQuickMenu(false); }}
         className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl text-left cursor-pointer transition-colors"
        >
         <FileText size={15} className="text-emerald-600" />
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
      className="p-2 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer relative"
      aria-label="Ver notificações"
     >
      <Bell size={18} />
      {notifications.some(n => !n.read) && (
       <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
      )}
     </button>

     {showNotifications && (
      <>
       <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
       <div className="fixed sm:absolute top-16 sm:top-auto left-3 sm:left-auto right-3 sm:right-0 mt-2 sm:w-96 max-w-[calc(100vw-24px)] bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-4 z-50 animate-slide-in-up">
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

            {/* Hover/Touch Actions */}
            <div className="absolute bottom-2.5 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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

  {/* Global Command Palette Modal */}
  <CommandPalette
   isOpen={showCommandPalette}
   onClose={() => setShowCommandPalette(false)}
   onNavigate={(view) => onViewChange(view)}
  />

  {/* Limited Mode Notice Banner when expired */}
  {isExpired && (
   <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-600/30 sticky top-16 z-20 shadow-xs print:hidden animate-fade-in">
    <div className="flex items-center gap-2">
     <AlertTriangle size={16} className="text-amber-950 shrink-0" />
     <span>
      <strong>Assinatura Vencida • Modo Limitado:</strong> Sua assinatura de 30 dias expirou. Seus dados estão 100% seguros e preservados, mas novas inserções estão pausadas até a renovação.
     </span>
    </div>
    <button
     type="button"
     onClick={() => onViewChange('subscription')}
     className="px-3 py-1 bg-amber-950 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
    >
     Renovar Assinatura
    </button>
   </div>
  )}
 </>
 );
};
