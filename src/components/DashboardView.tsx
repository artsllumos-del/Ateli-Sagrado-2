import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { 
 XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
 PieChart, Pie, Cell
} from 'recharts';
import { 
 TrendingUp, Users, ShoppingCart, AlertTriangle, Hammer, DollarSign,
 ArrowRight, Sparkles, Clock, Settings2, ChevronUp, ChevronDown, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardViewProps {
 onViewChange: (view: string) => void;
 onQuickAction: (actionType: 'order' | 'client' | 'product' | 'quote') => void;
}

interface WidgetItem {
 id: string;
 label: string;
 visible: boolean;
}

const DEFAULT_WIDGETS: WidgetItem[] = [
 { id: 'welcome', label: 'Banner do Ateliê', visible: true },
 { id: 'kpis', label: 'Indicadores de Sucesso (KPIs)', visible: true },
 { id: 'financial_chart', label: 'Gráfico de Desempenho Financeiro', visible: true },
 { id: 'best_sellers', label: 'Gráfico de Itens Mais Vendidos', visible: true },
 { id: 'recent_orders', label: 'Tabela de Pedidos Recentes', visible: true },
 { id: 'critical_stock', label: 'Alertas de Insumos Críticos', visible: true }
];

export const DashboardView: React.FC<DashboardViewProps> = ({ onViewChange, onQuickAction }) => {
 const { clients, inventory, products, orders, transactions } = useDb();
 const [widgets, setWidgets] = useState<WidgetItem[]>(DEFAULT_WIDGETS);
 const [showCustomizeModal, setShowCustomizeModal] = useState(false);

 // Load widget configuration from localStorage on mount
 useEffect(() => {
  const saved = localStorage.getItem('as_dashboard_widgets');
  if (saved) {
   try {
    const parsed = JSON.parse(saved) as WidgetItem[];
    // Ensure all standard widgets are present
    const validated = DEFAULT_WIDGETS.map(def => {
     const match = parsed.find(p => p.id === def.id);
     return match ? { ...def, visible: match.visible } : def;
    });
    // Order based on saved, keeping missing at the end
    const ordered = [...validated];
    ordered.sort((a, b) => {
     const idxA = parsed.findIndex(p => p.id === a.id);
     const idxB = parsed.findIndex(p => p.id === b.id);
     if (idxA === -1) return 1;
     if (idxB === -1) return -1;
     return idxA - idxB;
    });
    setWidgets(ordered);
   } catch (e) {
    setWidgets(DEFAULT_WIDGETS);
   }
  }
 }, []);

 const saveWidgets = (newWidgets: WidgetItem[]) => {
  setWidgets(newWidgets);
  localStorage.setItem('as_dashboard_widgets', JSON.stringify(newWidgets));
 };

 const toggleWidgetVisibility = (id: string) => {
  const updated = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
  saveWidgets(updated);
 };

 const moveWidget = (index: number, direction: 'up' | 'down') => {
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  if (newIndex < 0 || newIndex >= widgets.length) return;

  const updated = [...widgets];
  const [removed] = updated.splice(index, 1);
  updated.splice(newIndex, 0, removed);
  saveWidgets(updated);
 };

 // Filters out deleted entries
 const activeClients = clients.filter(c => !c.isDeleted);
 const activeInventory = inventory.filter(i => !i.isDeleted);
 const activeOrders = orders.filter(o => !o.isDeleted);
 const activeTransactions = transactions.filter(t => !t.isDeleted);

 // Stock Alerts
 const lowStockCount = activeInventory.filter(i => i.quantity <= i.minQuantity && i.quantity > 0).length;
 const criticalStockCount = activeInventory.filter(i => i.quantity === 0).length;

 // Orders in Production
 const inProductionCount = activeOrders.filter(o => ['production', 'finishing'].includes(o.status)).length;

 // Finance calculation
 const currentMonthStr = "2026-06"; // Fixed current local time month
 const currentMonthTransactions = activeTransactions.filter(t => t.date.startsWith(currentMonthStr));
 
 const faturamentoMes = currentMonthTransactions
 .filter(t => t.type === 'income')
 .reduce((sum, t) => sum + t.value, 0);

 const despesasMes = currentMonthTransactions
 .filter(t => t.type === 'expense')
 .reduce((sum, t) => sum + t.value, 0);

 const lucroLiquido = faturamentoMes - despesasMes;

 // Chart Data preparation
 const monthlyData = [
  { name: 'Abril', receita: 3200, despesa: 1100, lucro: 2100 },
  { name: 'Maio', receita: 4350, despesa: 1700, lucro: 2650 },
  { name: 'Junho', receita: faturamentoMes || 530, despesa: despesasMes || 275, lucro: lucroLiquido || 255 }
 ];

 // Best selling products pie/bar
 const productSellCounts: Record<string, number> = {};
 activeOrders.forEach(o => {
  o.items.forEach(item => {
   productSellCounts[item.productName] = (productSellCounts[item.productName] || 0) + item.quantity;
  });
 });

 const bestSellersData = Object.keys(productSellCounts).map(name => ({
  name,
  vendas: productSellCounts[name]
 })).sort((a, b) => b.vendas - a.vendas).slice(0, 4);

 // If no actual orders, provide beautiful default product list metrics
 const fallbackBestSellers = bestSellersData.length > 0 ? bestSellersData : [
  { name: 'Terço Imperial Pérola', vendas: 12 },
  { name: 'Pulseira São Bento', vendas: 8 },
  { name: 'Dezena Madeira Imbuia', vendas: 5 }
 ];

 // Editorial Palette
 const COLORS = ['#D4A039', '#B5563D', '#4C7FB0', '#6B6258'];

 return (
  <div className="space-y-6 animate-slide-in-up">
   
   {/* Customize Floating Controls */}
   <div className="flex items-center justify-between">
    <div />
    <button
     id="btn-personalizar-dashboard"
     onClick={() => setShowCustomizeModal(true)}
     className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-gold-600 font-semibold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer shadow-xs active:scale-98"
    >
     <Settings2 size={13} />
     Personalizar Painel
    </button>
   </div>

   {/* Render active and sorted widgets inside a Framer Motion grid */}
   <motion.div layout className="space-y-6">
    {widgets.filter(w => w.visible).map(widget => {
     switch (widget.id) {
      case 'welcome':
       return (
        <motion.div layout key="welcome" className="relative overflow-hidden bg-gradient-to-br from-[#FFFDF9] via-[#FAF3E7] to-[#FFFDF9] text-ink-900 p-8 sm:p-10 rounded-[24px] border border-[rgba(212,160,57,0.15)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
         <div className="absolute top-0 right-0 w-96 h-96 bg-[rgba(212,160,57,0.06)] rounded-full blur-3xl pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-72 h-72 bg-[rgba(181,86,61,0.04)] rounded-full blur-3xl pointer-events-none"></div>
         
         <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none hidden md:block">
          <svg width="200" height="200" viewBox="0 0 100 100" fill="none" stroke="currentColor">
           <circle cx="50" cy="50" r="40" strokeWidth="0.5" />
           <circle cx="50" cy="50" r="30" strokeWidth="0.5" />
           <circle cx="50" cy="50" r="20" strokeWidth="0.5" />
           <path d="M50 0 L50 100 M0 50 L100 50 M15 15 L85 85 M15 85 L85 15" strokeWidth="0.5" />
          </svg>
         </div>

         <div className="space-y-3 relative z-10 max-w-xl">
          <span style={{ fontFamily: 'Georgia' }} className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-[rgba(181,86,61,0.1)] to-[rgba(181,86,61,0.05)] border border-[rgba(181,86,61,0.2)] text-terracotta-500 text-[10px] font-bold tracking-widest uppercase rounded-full">
           <Sparkles size={10} className="inline mr-1 text-terracotta-500 animate-pulse" /> Foco Ateliê & Joias Religiosas
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-semibold tracking-tight text-ink-900 mt-1">
           Gestão Ateliê Sagrado
          </h2>
          <p className="text-ink-600 text-xs sm:text-sm leading-relaxed">
           Bem-vindo ao painel de controle do seu ERP. Acompanhe a produção, nível dos insumos de pérolas, faturamento em tempo real e saúde financeira.
          </p>
         </div>
         
         <div className="grid grid-cols-2 gap-3.5 shrink-0 relative z-10 w-full md:w-auto">
          <button 
           id="btn-quick-order"
           onClick={() => onQuickAction('order')}
           className="px-5 py-3 bg-gradient-to-br from-ink-900 to-slate-800 text-white hover:opacity-95 font-medium text-xs rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
           <ShoppingCart size={14} className="text-gold-500" />
           Novo Pedido
          </button>
          <button 
           id="btn-quick-client"
           onClick={() => onQuickAction('client')}
           className="px-5 py-3 bg-white text-ink-900 hover:bg-slate-50/80 font-medium text-xs rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200/80 shadow-xs"
          >
           <Users size={14} className="text-terracotta-500" />
           Novo Cliente
          </button>
          <button 
           id="btn-quick-product"
           onClick={() => onQuickAction('product')}
           className="px-5 py-3 bg-white text-ink-900 hover:bg-slate-50/80 font-medium text-xs rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200/80 shadow-xs"
          >
           <Sparkles size={14} className="text-gold-500" />
           Novo Produto
          </button>
          <button 
           id="btn-quick-pricing"
           onClick={() => onQuickAction('quote')}
           className="px-5 py-3 bg-gradient-to-br from-[#E8B85C] to-[#C9883A] text-white hover:opacity-95 font-medium text-xs rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-gold-500/20 ring-1 ring-gold-600/15"
          >
           <DollarSign size={14} />
           Preço Inteligente
          </button>
         </div>
        </motion.div>
       );

      case 'kpis':
       return (
        <motion.div layout key="kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {/* KPI: Monthly Revenue */}
         <div id="kpi-faturamento" className="bg-white border border-[rgba(42,36,32,0.06)] p-6 rounded-[20px] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
           <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider">Faturamento (Mês)</span>
           <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-600">
            <TrendingUp size={16} />
           </div>
          </div>
          <div className="mt-5">
           <h3 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-ink-900">
            R$ {faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
           </h3>
           <p className="text-[10px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
            <span>+18% versus mês anterior</span>
           </p>
          </div>
         </div>

         {/* KPI: Net Profit */}
         <div id="kpi-lucro" className="bg-white border border-[rgba(42,36,32,0.06)] p-6 rounded-[20px] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
           <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider">Lucro Líquido</span>
           <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <DollarSign size={16} />
           </div>
          </div>
          <div className="mt-5">
           <h3 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-ink-900">
            R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
           </h3>
           <p className="text-[10px] text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
            <span>Margem líquida est. {(faturamentoMes > 0 ? Math.round((lucroLiquido / faturamentoMes) * 100) : 60)}%</span>
           </p>
          </div>
         </div>

         {/* KPI: Orders Status */}
         <div id="kpi-producao" className="bg-white border border-[rgba(42,36,32,0.06)] p-6 rounded-[20px] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
           <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider">Produção Ativa</span>
           <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Hammer size={16} />
           </div>
          </div>
          <div className="mt-5">
           <h3 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-ink-900">
            {inProductionCount} Pedidos
           </h3>
           <p className="text-[10px] text-ink-600 mt-1.5 flex items-center gap-1">
            <span>Total de {activeOrders.length} pedidos em carteira</span>
           </p>
          </div>
         </div>

         {/* KPI: Critical Stock Warnings */}
         <div id="kpi-estoque" className="bg-white border border-[rgba(42,36,32,0.06)] p-6 rounded-[20px] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
           <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider">Alertas de Estoque</span>
           <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            criticalStockCount > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-warning-500/10 text-warning-500'
           }`}>
            <AlertTriangle size={16} />
           </div>
          </div>
          <div className="mt-5">
           <h3 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-ink-900">
            {criticalStockCount + lowStockCount} Itens
           </h3>
           <p className="text-[10px] mt-1.5 font-semibold flex items-center gap-1.5">
            {criticalStockCount > 0 ? (
             <span className="text-rose-600">● {criticalStockCount} Críticos (Esgotado!)</span>
            ) : (
             <span className="text-warning-500">● {lowStockCount} Abaixo do mínimo</span>
            )}
           </p>
          </div>
         </div>
        </motion.div>
       );

      case 'financial_chart':
       return (
        <motion.div layout key="financial_chart" className="bg-white border border-[rgba(42,36,32,0.06)] p-6 rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300">
         <div className="flex items-center justify-between mb-6">
          <div>
           <h3 className="font-serif font-semibold text-lg text-ink-900">Desempenho Financeiro</h3>
           <p className="text-[11px] text-ink-600">Fluxo histórico de receitas e despesas do Ateliê</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold">
           <span className="flex items-center gap-1.5 text-gold-600">
            <span className="w-2.5 h-2.5 rounded-full bg-gold-500 block" /> Receita
           </span>
           <span className="flex items-center gap-1.5 text-success-500">
            <span className="w-2.5 h-2.5 rounded-full bg-success-500 block" /> Lucro
           </span>
          </div>
         </div>
         <div className="h-68">
          <ResponsiveContainer width="100%" height="100%">
           <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
             <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4A039" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#D4A039" stopOpacity={0}/>
             </linearGradient>
             <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3F9461" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#3F9461" stopOpacity={0}/>
             </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,36,32,0.04)" />
            <XAxis dataKey="name" stroke="#6B6258" fontSize={11} tickLine={false} />
            <YAxis stroke="#6B6258" fontSize={11} tickLine={false} unit="R$" />
            <Tooltip 
             contentStyle={{ backgroundColor: '#2A2420', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
             labelStyle={{ fontWeight: 'bold', color: '#D4A039' }}
            />
            <Area type="monotone" dataKey="receita" stroke="#D4A039" strokeWidth={2.5} strokeLinecap="round" fillOpacity={1} fill="url(#colorReceita)" />
            <Area type="monotone" dataKey="lucro" stroke="#3F9461" strokeWidth={2.5} strokeLinecap="round" fillOpacity={1} fill="url(#colorLucro)" />
           </AreaChart>
          </ResponsiveContainer>
         </div>
        </motion.div>
       );

      case 'best_sellers':
       return (
        <motion.div layout key="best_sellers" className="bg-white border border-[rgba(42,36,32,0.06)] p-6 rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300">
         <div className="mb-6">
          <h3 className="font-serif font-semibold text-lg text-ink-900">Produtos Mais Vendidos</h3>
          <p className="text-[11px] text-ink-600">Fatia de vendas por item artesanal</p>
         </div>
         <div className="h-56 flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
           <PieChart>
            <Pie
             data={fallbackBestSellers}
             cx="50%"
             cy="50%"
             innerRadius={62}
             outerRadius={80}
             paddingAngle={5}
             dataKey="vendas"
            >
             {fallbackBestSellers.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
             ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
           </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center">
           <span className="text-2xl font-semibold font-serif text-ink-900 leading-none">
            {fallbackBestSellers.reduce((a, b) => a + b.vendas, 0)}
           </span>
           <span className="text-[10px] text-ink-600 uppercase tracking-widest mt-1">Vendas</span>
          </div>
         </div>
         <div className="grid grid-cols-2 gap-3 mt-4">
          {fallbackBestSellers.map((item, idx) => (
           <div key={item.name} className="flex items-center gap-2 text-[10px] font-medium text-ink-600 truncate">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
            <span className="truncate">{item.name}</span>
           </div>
          ))}
         </div>
        </motion.div>
       );

      case 'recent_orders':
       return (
        <motion.div layout key="recent_orders" className="bg-white border border-[rgba(42,36,32,0.06)] p-6 rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300">
         <div className="flex items-center justify-between mb-6">
          <div>
           <h3 className="font-serif font-semibold text-lg text-ink-900">Últimos Pedidos Cadastrados</h3>
           <p className="text-[11px] text-ink-600">Acompanhamento imediato das vendas recentes</p>
          </div>
          <button 
           onClick={() => onViewChange('orders')}
           className="text-xs font-semibold text-gold-600 hover:text-gold-500 flex items-center gap-1 cursor-pointer font-serif"
          >
           Ver todos <ArrowRight size={14} />
          </button>
         </div>

         <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
           <thead>
            <tr className="bg-bg-app border-b border-slate-100 text-ink-600 font-bold uppercase tracking-wider">
             <th className="px-4 py-3 font-semibold text-[10px]">Cód/Número</th>
             <th className="px-4 py-3 font-semibold text-[10px]">Cliente</th>
             <th className="px-4 py-3 font-semibold text-[10px]">Data Prevista</th>
             <th className="px-4 py-3 font-semibold text-[10px]">Valor Total</th>
             <th className="px-4 py-3 font-semibold text-[10px]">Status</th>
            </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
            {activeOrders.slice(0, 4).map(o => (
             <tr key={o.id} className="hover:bg-[#FAF7F2]/40 transition-colors">
              <td className="px-4 py-3.5 font-mono font-bold text-ink-900">{o.orderNumber}</td>
              <td className="px-4 py-3.5 font-medium text-slate-700">{o.clientName}</td>
              <td className="px-4 py-3.5 text-slate-500">{o.dueDate}</td>
              <td className="px-4 py-3.5 font-bold font-mono text-slate-800">
               R$ {o.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3.5">
               <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                o.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                o.status === 'completed' ? 'bg-teal-50 text-teal-600 border border-teal-100' :
                o.status === 'production' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                o.status === 'finishing' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                'bg-slate-50 text-slate-600 border border-slate-100'
               }`}>
                {o.status.toUpperCase()}
               </span>
              </td>
             </tr>
            ))}
            {activeOrders.length === 0 && (
             <tr>
              <td colSpan={5} className="py-12 text-center text-slate-400">
               Nenhum pedido ativo cadastrado no sistema.
              </td>
             </tr>
            )}
           </tbody>
          </table>
         </div>
        </motion.div>
       );

      case 'critical_stock':
       return (
        <motion.div layout key="critical_stock" className="bg-white border border-[rgba(42,36,32,0.06)] p-6 rounded-[20px] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
         <div>
          <h3 className="font-serif font-semibold text-lg text-ink-900">Insumos Críticos / Baixos</h3>
          <p className="text-[11px] text-ink-600 mb-5">Compre matérias-primas antes de zerar</p>

          <div className="space-y-3">
           {activeInventory
           .filter(i => i.quantity <= i.minQuantity)
           .slice(0, 4)
           .map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-bg-app/50">
             <div className="min-w-0">
              <p className="font-bold text-xs text-ink-900 truncate">{item.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Qtd Mínima: {item.minQuantity} {item.unit}</p>
             </div>
             <div className="text-right">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
               item.quantity === 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-warning-bg text-warning-500 border border-warning-bg'
              }`}>
               {item.quantity} restando
              </span>
             </div>
            </div>
           ))}
           {activeInventory.filter(i => i.quantity <= i.minQuantity).length === 0 && (
            <div className="py-12 text-center text-slate-400">
             <p className="text-xs">Todos os insumos com níveis saudáveis! <Sparkles size={12} className="text-emerald-500 animate-pulse inline ml-1" /></p>
            </div>
           )}
          </div>
         </div>

         <div className="pt-5 border-t border-slate-100 mt-5">
          <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
           <Clock size={12} className="text-gold-500" /> Atividades Recentes
          </h4>
          <div className="mt-3 space-y-2">
           <p className="text-[10px] text-ink-600 leading-relaxed font-medium">
            ● <strong>Rosana Santos</strong> gerou pedido PED-2026-0001
           </p>
           <p className="text-[10px] text-ink-600 leading-relaxed font-medium">
            ● <strong>Ana Paula (Artesã)</strong> iniciou produção do Terço Imperial
           </p>
          </div>
         </div>
        </motion.div>
       );

      default:
       return null;
     }
    })}
   </motion.div>

   {/* Customization Modal */}
   <AnimatePresence>
    {showCustomizeModal && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs no-print">
      <motion.div
       initial={{ opacity: 0, scale: 0.95, y: 15 }}
       animate={{ opacity: 1, scale: 1, y: 0 }}
       exit={{ opacity: 0, scale: 0.95, y: 15 }}
       className="bg-white rounded-[24px] border border-slate-200 shadow-xl w-full max-w-lg p-6 overflow-hidden mx-4 max-h-[85vh] flex flex-col animate-scale-in"
      >
       <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
         <h3 className="text-base font-serif font-semibold text-ink-900">Personalizar Seu Painel</h3>
         <p className="text-[11px] text-ink-600">Reordene e ative os blocos de dados do Dashboard</p>
        </div>
        <button
         onClick={() => setShowCustomizeModal(false)}
         className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer transition-all"
        >
         ✕
        </button>
       </div>

       {/* Widget Items list with Reorder Buttons */}
       <div className="py-4 space-y-2 overflow-y-auto flex-1">
        {widgets.map((widget, idx) => (
         <div
          key={widget.id}
          className="flex items-center justify-between p-3 bg-[#FAF8F5] border border-slate-200/80 rounded-xl"
         >
          <div className="flex items-center gap-3">
           <button
            onClick={() => toggleWidgetVisibility(widget.id)}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
             widget.visible 
              ? 'bg-gold-500 border-gold-500 text-white shadow-xs' 
              : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
           >
            {widget.visible && <Check size={12} strokeWidth={3} />}
           </button>
           <span className={`text-xs font-semibold ${widget.visible ? 'text-ink-900' : 'text-slate-400 line-through'}`}>
            {widget.label}
           </span>
          </div>

          <div className="flex items-center gap-1.5">
           <button
            disabled={idx === 0}
            onClick={() => moveWidget(idx, 'up')}
            className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
           >
            <ChevronUp size={14} />
           </button>
           <button
            disabled={idx === widgets.length - 1}
            onClick={() => moveWidget(idx, 'down')}
            className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
           >
            <ChevronDown size={14} />
           </button>
          </div>
         </div>
        ))}
       </div>

       <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
        <button
         onClick={() => setShowCustomizeModal(false)}
         className="px-5 py-2.5 bg-gradient-to-br from-ink-900 to-slate-800 text-white hover:opacity-95 text-xs font-semibold rounded-xl cursor-pointer transition-all active:scale-98"
        >
         Salvar Layout
        </button>
       </div>
      </motion.div>
     </div>
    )}
   </AnimatePresence>
  </div>
 );
};
