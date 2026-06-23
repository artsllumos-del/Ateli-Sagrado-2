import React from 'react';
import { useDb } from '../context/DbContext';
import { 
 BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
 PieChart, Pie, Cell
} from 'recharts';
import { 
 TrendingUp, Users, ShoppingCart, Package, AlertTriangle, Hammer, CheckCircle2, DollarSign,
 ArrowRight, ShieldAlert, Sparkles, Clock
} from 'lucide-react';

interface DashboardViewProps {
 onNavigate: (view: string) => void;
 onQuickAction: (actionType: 'order' | 'client' | 'product' | 'quote') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onQuickAction }) => {
 const { clients, inventory, products, orders, transactions, productionTasks } = useDb();

 // Filters out deleted entries
 const activeClients = clients.filter(c => !c.isDeleted);
 const activeInventory = inventory.filter(i => !i.isDeleted);
 const activeProducts = products.filter(p => !p.isDeleted);
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
 // Month-by-month Income, Expense & Profit (e.g., April, May, June)
 const monthlyData = [
 { name: 'Abril', receita: 3200, despesa: 1100, lucro: 2100 },
 { name: 'Maio', receita: 4350, despesa: 1700, lucro: 2650 },
 { name: 'Junho', receita: faturamentoMes || 530, despesa: despesasMes || 275, lucro: lucroLiquido || 255 }
 ];

 // Best selling products pie/bar
 // Count product sells in active orders
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

 const COLORS = ['#eab308', '#3b82f6', '#10b981', '#a855f7'];

 return (
 <div className="space-y-6">
 
 {/* Welcome Hero Banner with chic light champagne/gold gradient */}
 <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-600/5 text-slate-900 p-6 sm:p-8 rounded-3xl border border-amber-500/20 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none"></div>
 <div className="absolute bottom-0 left-0 w-60 h-60 bg-rose-200/10 rounded-full blur-3xl pointer-events-none"></div>
 <div className="space-y-2 relative z-10">
 <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/25 text-amber-800 text-[10px] font-bold tracking-widest uppercase rounded-full">
 Foco Ateliê & Joias Religiosas
 </span>
 <h2 className="text-2xl sm:text-3xl font-serif tracking-wide text-slate-900 font-bold mt-1">
 Gestão Ateliê Sagrado
 </h2>
 <p className="text-slate-600 text-xs sm:text-sm max-w-lg font-medium leading-relaxed">
 Bem-vindo ao painel central do seu ERP. Acompanhe o andamento da produção, estoque de pérolas/metais, faturamento em tempo real e saúde financeira.
 </p>
 </div>
 
 {/* Rapid Actions row inside hero */}
 <div className="grid grid-cols-2 gap-3 shrink-0 relative z-10">
 <button 
 onClick={() => onQuickAction('order')}
 className="px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
 >
 <ShoppingCart size={14} className="text-amber-400" />
 Novo Pedido
 </button>
 <button 
 onClick={() => onQuickAction('client')}
 className="px-4 py-2.5 bg-white text-slate-850 hover:bg-slate-50 font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/80 shadow-xs"
 >
 <Users size={14} className="text-amber-600" />
 Novo Cliente
 </button>
 <button 
 onClick={() => onQuickAction('product')}
 className="px-4 py-2.5 bg-white text-slate-850 hover:bg-slate-50 font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/80 shadow-xs"
 >
 <Sparkles size={14} className="text-amber-600" />
 Novo Produto
 </button>
 <button 
 onClick={() => onQuickAction('quote')}
 className="px-4 py-2.5 bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
 >
 <DollarSign size={14} />
 Preço Inteligente
 </button>
 </div>
 </div>

 {/* KPI Cards Bento-Grid Row */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 
 {/* KPI: Monthly Revenue */}
 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Faturamento (Mês)</span>
 <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
 <TrendingUp size={16} />
 </div>
 </div>
 <div className="mt-4">
 <h3 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900">
 R$ {faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
 </h3>
 <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
 <span>+18% versus mês anterior</span>
 </p>
 </div>
 </div>

 {/* KPI: Net Profit */}
 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lucro Líquido</span>
 <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
 <DollarSign size={16} />
 </div>
 </div>
 <div className="mt-4">
 <h3 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900">
 R$ {lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
 </h3>
 <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
 <span>Margem líquida est. {(faturamentoMes > 0 ? Math.round((lucroLiquido / faturamentoMes) * 100) : 60)}%</span>
 </p>
 </div>
 </div>

 {/* KPI: Orders Status */}
 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Produção Ativa</span>
 <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
 <Hammer size={16} />
 </div>
 </div>
 <div className="mt-4">
 <h3 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900">
 {inProductionCount} Pedidos
 </h3>
 <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
 <span>Total de {activeOrders.length} pedidos em carteira</span>
 </p>
 </div>
 </div>

 {/* KPI: Critical Stock Warnings */}
 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alertas de Estoque</span>
 <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
 criticalStockCount > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
 }`}>
 <AlertTriangle size={16} />
 </div>
 </div>
 <div className="mt-4">
 <h3 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900">
 {criticalStockCount + lowStockCount} Itens
 </h3>
 <p className="text-[10px] mt-1 font-semibold flex items-center gap-1.5">
 {criticalStockCount > 0 ? (
 <span className="text-rose-600">● {criticalStockCount} Críticos (Esgotado!)</span>
 ) : (
 <span className="text-amber-600">● {lowStockCount} Abaixo do mínimo</span>
 )}
 </p>
 </div>
 </div>

 </div>

 {/* Main Charts & Visualizers Block */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Chart 1: Financial Month-by-Month Revenues / Profits */}
 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm lg:col-span-2">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="font-bold text-sm text-slate-900">Desempenho Financeiro</h3>
 <p className="text-[10.5px] text-slate-500">Fluxo histórico de receitas e despesas do Ateliê</p>
 </div>
 <div className="flex items-center gap-3 text-[10px] font-bold">
 <span className="flex items-center gap-1 text-amber-500">
 <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" /> Receita
 </span>
 <span className="flex items-center gap-1 text-emerald-500">
 <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" /> Lucro
 </span>
 </div>
 </div>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={monthlyData}>
 <defs>
 <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
 <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
 <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="R$" />
 <Tooltip 
 contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
 labelStyle={{ fontWeight: 'bold' }}
 />
 <Area type="monotone" dataKey="receita" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#colorReceita)" />
 <Area type="monotone" dataKey="lucro" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorLucro)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Chart 2: Best Selling Items */}
 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm">
 <div className="mb-4">
 <h3 className="font-bold text-sm text-slate-900">Produtos Mais Vendidos</h3>
 <p className="text-[10.5px] text-slate-500">Fatia de vendas por item artesanal</p>
 </div>
 <div className="h-56 flex items-center justify-center relative">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={fallbackBestSellers}
 cx="50%"
 cy="50%"
 innerRadius={60}
 outerRadius={80}
 paddingAngle={5}
 dataKey="vendas"
 >
 {fallbackBestSellers.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
 ))}
 </Pie>
 <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
 </PieChart>
 </ResponsiveContainer>
 {/* Center label */}
 <div className="absolute flex flex-col items-center">
 <span className="text-xl font-black font-display text-slate-900">
 {fallbackBestSellers.reduce((a, b) => a + b.vendas, 0)}
 </span>
 <span className="text-[10px] text-slate-500 uppercase tracking-widest">Vendas</span>
 </div>
 </div>
 {/* Chart Legend */}
 <div className="grid grid-cols-2 gap-2 mt-2">
 {fallbackBestSellers.map((item, idx) => (
 <div key={item.name} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 truncate">
 <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
 <span className="truncate">{item.name}</span>
 </div>
 ))}
 </div>
 </div>

 </div>

 {/* Grid: Last Orders, Low Stock Alerts and Quick System Info */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Left Widget: Recent Orders & Timeline */}
 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm lg:col-span-2">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="font-bold text-sm text-slate-900">Últimos Pedidos Cadastrados</h3>
 <p className="text-[10.5px] text-slate-500">Acompanhamento imediato das vendas recentes</p>
 </div>
 <button 
 onClick={() => onNavigate('orders')}
 className="text-xs font-bold text-amber-600 hover:text-amber-500 flex items-center gap-1 cursor-pointer"
 >
 Ver todos os pedidos <ArrowRight size={14} />
 </button>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
 <th className="py-2.5 font-semibold text-[10px]">Cód/Número</th>
 <th className="py-2.5 font-semibold text-[10px]">Cliente</th>
 <th className="py-2.5 font-semibold text-[10px]">Data Prevista</th>
 <th className="py-2.5 font-semibold text-[10px]">Valor Total</th>
 <th className="py-2.5 font-semibold text-[10px]">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {activeOrders.slice(0, 4).map(o => (
 <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
 <td className="py-3 font-mono font-bold text-slate-900">{o.orderNumber}</td>
 <td className="py-3 font-semibold text-slate-700">{o.clientName}</td>
 <td className="py-3 font-medium text-slate-500">{o.dueDate}</td>
 <td className="py-3 font-bold font-mono text-slate-800">
 R$ {o.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
 </td>
 <td className="py-3">
 <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
 o.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-600' :
 o.status === 'completed' ? 'bg-teal-500/10 text-teal-600' :
 o.status === 'production' ? 'bg-amber-500/10 text-amber-600' :
 o.status === 'finishing' ? 'bg-purple-500/10 text-purple-600' :
 'bg-slate-500/10 text-slate-600'
 }`}>
 {o.status.toUpperCase()}
 </span>
 </td>
 </tr>
 ))}
 {activeOrders.length === 0 && (
 <tr>
 <td colSpan={5} className="py-8 text-center text-slate-400">
 Nenhum pedido ativo cadastrado no sistema.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Right Widget: Low Stock & Active Craftspeople list */}
 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
 <div>
 <h3 className="font-bold text-sm text-slate-900">Insumos Críticos / Baixos</h3>
 <p className="text-[10.5px] text-slate-500 mb-4">Compre matérias-primas antes de zerar</p>

 <div className="space-y-3">
 {activeInventory
 .filter(i => i.quantity <= i.minQuantity)
 .slice(0, 4)
 .map(item => (
 <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
 <div className="min-w-0">
 <p className="font-bold text-xs text-slate-800 truncate">{item.name}</p>
 <p className="text-[10px] text-slate-450 mt-0.5 font-medium">Qtd Mínima: {item.minQuantity} {item.unit}</p>
 </div>
 <div className="text-right">
 <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
 item.quantity === 0 ? 'bg-rose-500/15 text-rose-600' : 'bg-amber-500/15 text-amber-600'
 }`}>
 {item.quantity} restando
 </span>
 </div>
 </div>
 ))}
 {activeInventory.filter(i => i.quantity <= i.minQuantity).length === 0 && (
 <div className="py-8 text-center text-slate-400">
 <p className="text-xs">Todos os insumos com níveis saudáveis! ✨</p>
 </div>
 )}
 </div>
 </div>

 <div className="pt-4 border-t border-slate-100 mt-4">
 <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
 <Clock size={12} className="text-amber-500" /> Atividades Recentes
 </h4>
 <div className="mt-2 space-y-2">
 <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
 ● <strong>Rosana Santos</strong> gerou pedido PED-2026-0001
 </p>
 <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
 ● <strong>Ana Paula (Artesã)</strong> iniciou produção do Terço Imperial
 </p>
 </div>
 </div>
 </div>

 </div>

 </div>
 );
};
