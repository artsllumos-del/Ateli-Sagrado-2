import React, { useState, useMemo } from 'react';
import { CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, Legend } from 'recharts';
import { DollarSign, Clock, CheckCircle, TrendingUp, ShoppingCart, Percent, Calendar } from 'lucide-react';
import { FinancialTransaction, Order, Quote } from '../../types/erp';

interface DashboardFinanceSalesProps {
  transactions: FinancialTransaction[];
  activeOrders: Order[];
  quotes: Quote[];
}

export const DashboardFinanceSales: React.FC<DashboardFinanceSalesProps> = ({
  transactions,
  activeOrders,
  quotes,
}) => {
  const [financeFilter, setFinanceFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');

  // Filter transactions based on date
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    return transactions.filter(t => {
      if (t.isDeleted) return false;

      const txDate = new Date(t.date);
      if (financeFilter === 'today') {
        return t.date === todayStr;
      } else if (financeFilter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        return txDate >= oneWeekAgo && txDate <= today;
      } else if (financeFilter === 'month') {
        return t.date.substring(0, 7) === todayStr.substring(0, 7);
      } else if (financeFilter === 'year') {
        return t.date.substring(0, 4) === todayStr.substring(0, 4);
      }
      return true;
    });
  }, [transactions, financeFilter]);

  // Aggregate metrics based on filters
  const financeStats = useMemo(() => {
    let receita = 0;
    let despesa = 0;

    filteredTransactions.forEach(t => {
      if (t.type === 'income') receita += t.value;
      else despesa += t.value;
    });

    const saldo = receita - despesa;

    return { receita, despesa, saldo };
  }, [filteredTransactions]);

  // Chart data for Receipts × Expenses
  const chartData = useMemo(() => {
    if (financeFilter === 'today') {
      // Group today's transactions by category
      const categories: Record<string, { receitas: number; despesas: number }> = {};
      filteredTransactions.forEach(t => {
        const cat = t.category || 'Geral';
        if (!categories[cat]) {
          categories[cat] = { receitas: 0, despesas: 0 };
        }
        if (t.type === 'income') categories[cat].receitas += t.value;
        else categories[cat].despesas += t.value;
      });
      const data = Object.entries(categories).map(([cat, val]) => ({
        name: cat,
        receitas: Number(val.receitas.toFixed(2)),
        despesas: Number(val.despesas.toFixed(2))
      }));
      return data.length > 0 ? data : [{ name: 'Sem Movimento', receitas: 0, despesas: 0 }];
    }

    if (financeFilter === 'week') {
      // Group last 7 days dynamically
      const weekDaysData: Record<string, { receitas: number; despesas: number }> = {};
      const weekdaysName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = weekdaysName[d.getDay()];
        weekDaysData[dayLabel] = { receitas: 0, despesas: 0 };
      }

      filteredTransactions.forEach(t => {
        const d = new Date(t.date + 'T12:00:00');
        const dayLabel = weekdaysName[d.getDay()];
        if (weekDaysData[dayLabel]) {
          if (t.type === 'income') weekDaysData[dayLabel].receitas += t.value;
          else weekDaysData[dayLabel].despesas += t.value;
        }
      });

      return Object.entries(weekDaysData).map(([name, val]) => ({
        name,
        receitas: Number(val.receitas.toFixed(2)),
        despesas: Number(val.despesas.toFixed(2))
      }));
    }

    if (financeFilter === 'month') {
      // Group current month by weeks
      const weekly = [
        { name: 'S1 (Dias 1-7)', receitas: 0, despesas: 0 },
        { name: 'S2 (Dias 8-14)', receitas: 0, despesas: 0 },
        { name: 'S3 (Dias 15-21)', receitas: 0, despesas: 0 },
        { name: 'S4 (Dias 22-31)', receitas: 0, despesas: 0 },
      ];
      filteredTransactions.forEach(t => {
        const parts = t.date.split('-');
        if (parts.length < 3) return;
        const day = Number(parts[2]);
        const idx = day >= 1 && day <= 7 ? 0 : day >= 8 && day <= 14 ? 1 : day >= 15 && day <= 21 ? 2 : 3;
        if (t.type === 'income') weekly[idx].receitas += t.value;
        else weekly[idx].despesas += t.value;
      });
      return weekly;
    }

    // Year filter - group by Month
    const monthsPT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const yearData = monthsPT.map(name => ({ name, receitas: 0, despesas: 0 }));
    
    filteredTransactions.forEach(t => {
      const parts = t.date.split('-');
      if (parts.length < 2) return;
      const monthIdx = Number(parts[1]) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        if (t.type === 'income') yearData[monthIdx].receitas += t.value;
        else yearData[monthIdx].despesas += t.value;
      }
    });
    return yearData;
  }, [financeFilter, filteredTransactions]);

  // Quote conversion rate
  const quoteConversion = useMemo(() => {
    const totalQuotes = quotes.filter(q => !q.isDeleted).length;
    const convertedQuotes = quotes.filter(q => !q.isDeleted && q.status === 'converted').length;
    return totalQuotes > 0 ? Math.round((convertedQuotes / totalQuotes) * 100) : 0;
  }, [quotes]);

  // Latest receipts and payments
  const latestReceipts = useMemo(() => {
    return transactions
      .filter(t => !t.isDeleted && t.type === 'income')
      .slice(0, 3);
  }, [transactions]);

  const latestPayments = useMemo(() => {
    return transactions
      .filter(t => !t.isDeleted && t.type === 'expense')
      .slice(0, 3);
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 1. WIDGET: FINANCEIRO */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-serif font-semibold text-base text-slate-900">Movimentação Financeira</h3>
            <p className="text-[11px] text-slate-500">Fluxo real de receitas, despesas e saldo atual do ateliê</p>
          </div>

          {/* Time range filters */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/60 shrink-0">
            {(['today', 'week', 'month', 'year'] as const).map(filter => {
              const label = filter === 'today' ? 'Hoje' : filter === 'week' ? 'Semana' : filter === 'month' ? 'Mês' : 'Ano';
              return (
                <button
                  key={filter}
                  onClick={() => setFinanceFilter(filter)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    financeFilter === filter ? 'bg-white text-slate-900 shadow-3xs border border-slate-200/50' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Financial mini summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50/30 border border-emerald-100/60 p-3 rounded-xl">
            <span className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider">Receitas</span>
            <span className="text-sm font-bold text-emerald-800 font-mono">
              R$ {financeStats.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-rose-50/20 border border-rose-100/60 p-3 rounded-xl">
            <span className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider">Despesas</span>
            <span className="text-sm font-bold text-rose-800 font-mono">
              R$ {financeStats.despesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200/40 p-3 rounded-xl">
            <span className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider">Saldo Período</span>
            <span className={`text-sm font-bold font-mono ${financeStats.saldo >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
              R$ {financeStats.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Side-by-side Receipts vs Expenses Area/Bar Chart */}
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '10px' }} />
              <Legend verticalAlign="top" height={24} iconSize={8} fontSize={9} />
              <Bar name="Receitas" dataKey="receitas" fill="#D4A039" radius={[8, 8, 8, 8]} barSize={16} />
              <Bar name="Despesas" dataKey="despesas" fill="#B5563D" radius={[8, 8, 8, 8]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Latest entries list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
          <div>
            <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider mb-2.5 flex items-center gap-1">
              <CheckCircle size={12} className="text-emerald-600" /> Últimos Recebimentos
            </h4>
            <div className="space-y-2">
              {latestReceipts.map(r => (
                <div key={r.id} className="flex justify-between items-center py-0.5">
                  <span className="text-slate-650 truncate max-w-[130px] font-medium">{r.contactName}</span>
                  <span className="font-mono font-bold text-emerald-700 shrink-0">
                    +R$ {r.value.toFixed(0)}
                  </span>
                </div>
              ))}
              {latestReceipts.length === 0 && (
                <p className="text-[10px] text-slate-400 italic">Sem recebimentos recentes.</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider mb-2.5 flex items-center gap-1">
              <Clock size={12} className="text-rose-600" /> Últimos Pagamentos
            </h4>
            <div className="space-y-2">
              {latestPayments.map(p => (
                <div key={p.id} className="flex justify-between items-center py-0.5">
                  <span className="text-slate-650 truncate max-w-[130px] font-medium">{p.notes || p.contactName}</span>
                  <span className="font-mono font-bold text-rose-700 shrink-0">
                    -R$ {p.value.toFixed(0)}
                  </span>
                </div>
              ))}
              {latestPayments.length === 0 && (
                <p className="text-[10px] text-slate-400 italic">Sem pagamentos recentes.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. WIDGET: VENDAS */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="font-serif font-semibold text-base text-slate-900">Estatísticas de Vendas</h3>
          <p className="text-[11px] text-slate-500">Métricas comerciais, ticket médio e conversão de orçamentos</p>
        </div>

        <div className="grid grid-cols-3 gap-3.5">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">Pedidos Fechados</span>
            <h4 className="text-lg font-mono font-black text-slate-800 mt-1">{activeOrders.length}</h4>
            <span className="text-[9px] text-slate-400 font-semibold mt-1">Geral</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">Conversão</span>
            <h4 className="text-lg font-mono font-black text-slate-800 mt-1">{quoteConversion}%</h4>
            <span className="text-[9px] text-emerald-650 font-semibold mt-1">Orçamentos</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">Ticket Médio</span>
            <h4 className="text-lg font-mono font-black text-slate-800 mt-1">
              R$ {activeOrders.length > 0 ? Math.round(financeStats.receita / activeOrders.length) : 0}
            </h4>
            <span className="text-[9px] text-slate-400 font-semibold mt-1">Estimado</span>
          </div>
        </div>

        {/* Dynamic Area Chart showing revenue evolution */}
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
            <TrendingUp size={12} className="text-amber-500" /> Curva de Crescimento do Ateliê
          </h4>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A039" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#D4A039" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '10px' }} />
                <Area type="monotone" name="Evolução Faturamento" dataKey="receitas" stroke="#D4A039" fillOpacity={1} fill="url(#colorFaturamento)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
};
