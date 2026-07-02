import React, { useState } from 'react';
import { TrendingUp, DollarSign, Hammer, AlertTriangle, Clock, ShoppingCart, Percent, Package, ArrowUpRight, ArrowDownRight, Eye, X } from 'lucide-react';
import { Order, InventoryItem, Quote, FinancialTransaction, ProductionTask } from '../../types/erp';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useDb } from '../../context/DbContext';

interface DashboardKpisProps {
  onViewChange: (view: string) => void;
  activeOrders: Order[];
  inventory: InventoryItem[];
  quotes: Quote[];
  transactions: FinancialTransaction[];
  productionTasks: ProductionTask[];
}

interface KpiDetail {
  title: string;
  value: string;
  subtitle: string;
  description: string;
  trend: 'up' | 'down' | 'neutral';
  trendPercent?: string;
  chartData: any[];
  bgColor: string;
  textColor: string;
}

export const DashboardKpis: React.FC<DashboardKpisProps> = ({
  onViewChange,
  activeOrders,
  inventory,
  quotes,
  transactions,
  productionTasks,
}) => {
  const { products } = useDb();
  const [selectedKpi, setSelectedKpi] = useState<KpiDetail | null>(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // "2026-06"

  // 1. Faturamento do mês
  const currentMonthTransactions = transactions.filter(t => !t.isDeleted && t.date.startsWith(currentMonthStr));
  const faturamentoMes = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.value, 0);

  // 2. Lucro do mês
  const despesasMes = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.value, 0);
  const lucroLiquido = faturamentoMes - despesasMes;

  // 3. Fluxo de caixa / Saldo total (all time)
  const totalIncomes = transactions.filter(t => !t.isDeleted && t.type === 'income').reduce((sum, t) => sum + t.value, 0);
  const totalExpenses = transactions.filter(t => !t.isDeleted && t.type === 'expense').reduce((sum, t) => sum + t.value, 0);
  const saldoAtual = totalIncomes - totalExpenses;

  // 4. Pedidos em produção
  const emProducaoCount = activeOrders.filter(o => ['production', 'finishing'].includes(o.status)).length;

  // 5. Pedidos concluídos no mês
  const concluidoMesCount = activeOrders.filter(o => 
    ['completed', 'shipped', 'delivered'].includes(o.status) && 
    o.date.startsWith(currentMonthStr)
  ).length;

  // 6. Pedidos atrasados
  const atrasadosCount = activeOrders.filter(o => 
    !['completed', 'shipped', 'delivered'].includes(o.status) && 
    new Date(o.dueDate) < new Date(todayStr)
  ).length;

  // 7. Soma de Horas trabalhadas (Calculado pelo motor de precificação registrado/produtos e venda efetivamente feita)
  const totalSalesProductionMinutes = activeOrders.reduce((sum, order) => {
    const orderMinutes = order.items.reduce((itemSum, item) => {
      const prod = products.find(p => p.id === item.productId || p.sku === item.productId);
      const prodTime = prod ? (prod.productionTimeMin || 0) : 0;
      return itemSum + (item.quantity * prodTime);
    }, 0);
    return sum + orderMinutes;
  }, 0);
  const totalHoursWorked = Number((totalSalesProductionMinutes / 60).toFixed(1));

  // 8. Vendas do dia
  const vendasDia = activeOrders
    .filter(o => o.date === todayStr)
    .reduce((sum, o) => sum + o.totalValue, 0);

  // 9. Ticket médio
  const currentMonthOrders = activeOrders.filter(o => o.date.startsWith(currentMonthStr));
  const ticketMedio = currentMonthOrders.length > 0 
    ? faturamentoMes / currentMonthOrders.length 
    : 0;

  // 10. Valor total do estoque
  const valorTotalEstoque = inventory
    .filter(i => !i.isDeleted)
    .reduce((sum, i) => sum + (i.quantity * i.unitValue), 0);

  // Previous Month metrics for real comparisons
  const getPrevMonthStr = (monthStr: string) => {
    const parts = monthStr.split('-');
    if (parts.length < 2) return '';
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const prevDate = new Date(year, month - 2, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
    return `${prevYear}-${prevMonth}`;
  };
  const prevMonthStr = getPrevMonthStr(currentMonthStr);

  const prevMonthTransactions = transactions.filter(t => !t.isDeleted && t.date.startsWith(prevMonthStr));
  const prevMonthFaturamento = prevMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.value, 0);
  const prevMonthDespesas = prevMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.value, 0);
  const prevMonthLucro = prevMonthFaturamento - prevMonthDespesas;

  const prevMonthOrdersCount = activeOrders.filter(o => o.date.startsWith(prevMonthStr)).length;

  const handleKpiClick = (title: string, value: string, subtitle: string, description: string, trend: 'up' | 'down' | 'neutral', trendPercent: string, chartData: any[], bgColor: string, textColor: string) => {
    setSelectedKpi({ title, value, subtitle, description, trend, trendPercent, chartData, bgColor, textColor });
  };

  // Dynamic Chart aggregators
  const getWeeklyFaturamento = () => {
    const weekly = [
      { name: 'S1 (Dias 1-7)', valor: 0 },
      { name: 'S2 (Dias 8-14)', valor: 0 },
      { name: 'S3 (Dias 15-21)', valor: 0 },
      { name: 'S4 (Dias 22-31)', valor: 0 },
    ];
    currentMonthTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const parts = t.date.split('-');
        if (parts.length < 3) return;
        const day = Number(parts[2]);
        const idx = day >= 1 && day <= 7 ? 0 : day >= 8 && day <= 14 ? 1 : day >= 15 && day <= 21 ? 2 : 3;
        weekly[idx].valor += t.value;
      });
    return weekly;
  };

  const getWeeklyLucro = () => {
    const weekly = [
      { name: 'S1 (Dias 1-7)', valor: 0 },
      { name: 'S2 (Dias 8-14)', valor: 0 },
      { name: 'S3 (Dias 15-21)', valor: 0 },
      { name: 'S4 (Dias 22-31)', valor: 0 },
    ];
    currentMonthTransactions.forEach(t => {
      const parts = t.date.split('-');
      if (parts.length < 3) return;
      const day = Number(parts[2]);
      const idx = day >= 1 && day <= 7 ? 0 : day >= 8 && day <= 14 ? 1 : day >= 15 && day <= 21 ? 2 : 3;
      const val = t.type === 'income' ? t.value : -t.value;
      weekly[idx].valor += val;
    });
    return weekly;
  };

  const getWeeklyCumulativeBalance = () => {
    const prevBalance = transactions
      .filter(t => !t.isDeleted && !t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + (t.type === 'income' ? t.value : -t.value), 0);

    const weekly = [
      { name: 'S1 (Dias 1-7)', valor: prevBalance },
      { name: 'S2 (Dias 8-14)', valor: prevBalance },
      { name: 'S3 (Dias 15-21)', valor: prevBalance },
      { name: 'S4 (Dias 22-31)', valor: prevBalance },
    ];

    currentMonthTransactions.forEach(t => {
      const parts = t.date.split('-');
      if (parts.length < 3) return;
      const day = Number(parts[2]);
      const val = t.type === 'income' ? t.value : -t.value;
      if (day >= 1) weekly[0].valor += val;
      if (day >= 8) weekly[1].valor += val;
      if (day >= 15) weekly[2].valor += val;
      if (day >= 22) weekly[3].valor += val;
    });
    return weekly.map(w => ({ ...w, valor: Number(w.valor.toFixed(2)) }));
  };

  const getWeeklyOrdersInProduction = () => {
    const weekly = [
      { name: 'S1 (Dias 1-7)', valor: 0 },
      { name: 'S2 (Dias 8-14)', valor: 0 },
      { name: 'S3 (Dias 15-21)', valor: 0 },
      { name: 'S4 (Dias 22-31)', valor: 0 },
    ];
    activeOrders
      .filter(o => ['production', 'finishing'].includes(o.status) && o.date.startsWith(currentMonthStr))
      .forEach(o => {
        const parts = o.date.split('-');
        if (parts.length < 3) return;
        const day = Number(parts[2]);
        const idx = day >= 1 && day <= 7 ? 0 : day >= 8 && day <= 14 ? 1 : day >= 15 && day <= 21 ? 2 : 3;
        weekly[idx].valor += 1;
      });
    return weekly;
  };

  const getWeeklyCompletedOrders = () => {
    const weekly = [
      { name: 'S1 (Dias 1-7)', valor: 0 },
      { name: 'S2 (Dias 8-14)', valor: 0 },
      { name: 'S3 (Dias 15-21)', valor: 0 },
      { name: 'S4 (Dias 22-31)', valor: 0 },
    ];
    activeOrders
      .filter(o => ['completed', 'shipped', 'delivered'].includes(o.status) && o.date.startsWith(currentMonthStr))
      .forEach(o => {
        const parts = o.date.split('-');
        if (parts.length < 3) return;
        const day = Number(parts[2]);
        const idx = day >= 1 && day <= 7 ? 0 : day >= 8 && day <= 14 ? 1 : day >= 15 && day <= 21 ? 2 : 3;
        weekly[idx].valor += 1;
      });
    return weekly;
  };

  const getWeeklyDelayedOrders = () => {
    const weekly = [
      { name: 'S1 (Dias 1-7)', valor: 0 },
      { name: 'S2 (Dias 8-14)', valor: 0 },
      { name: 'S3 (Dias 15-21)', valor: 0 },
      { name: 'S4 (Dias 22-31)', valor: 0 },
    ];
    activeOrders
      .filter(o => !['completed', 'shipped', 'delivered'].includes(o.status) && new Date(o.dueDate) < new Date(todayStr) && o.date.startsWith(currentMonthStr))
      .forEach(o => {
        const parts = o.date.split('-');
        if (parts.length < 3) return;
        const day = Number(parts[2]);
        const idx = day >= 1 && day <= 7 ? 0 : day >= 8 && day <= 14 ? 1 : day >= 15 && day <= 21 ? 2 : 3;
        weekly[idx].valor += 1;
      });
    return weekly;
  };

  const getWeeklyHoursWorked = () => {
    const weekly = [
      { name: 'S1 (Dias 1-7)', valor: 0 },
      { name: 'S2 (Dias 8-14)', valor: 0 },
      { name: 'S3 (Dias 15-21)', valor: 0 },
      { name: 'S4 (Dias 22-31)', valor: 0 },
    ];
    productionTasks
      .filter(t => (t.endDate || t.createdAt).startsWith(currentMonthStr))
      .forEach(t => {
        const dateStr = t.endDate || t.createdAt;
        const parts = dateStr.split('-');
        if (parts.length < 3) return;
        const day = Number(parts[2]);
        const idx = day >= 1 && day <= 7 ? 0 : day >= 8 && day <= 14 ? 1 : day >= 15 && day <= 21 ? 2 : 3;
        weekly[idx].valor += (t.timeSpentMinutes || 0) / 60;
      });
    return weekly.map(w => ({ ...w, valor: Number(w.valor.toFixed(1)) }));
  };

  const getDailyVendasDia = () => {
    const days = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const val = activeOrders.filter(o => o.date === dStr).reduce((sum, o) => sum + o.totalValue, 0);
      days.push({ name: dStr.substring(8, 10) + '/' + dStr.substring(5, 7), valor: val });
    }
    return days;
  };

  const getWeeklyTicketMedio = () => {
    const weekly = [
      { name: 'S1 (Dias 1-7)', valor: 0 },
      { name: 'S2 (Dias 8-14)', valor: 0 },
      { name: 'S3 (Dias 15-21)', valor: 0 },
      { name: 'S4 (Dias 22-31)', valor: 0 },
    ];
    const weeklyCounts = [0, 0, 0, 0];
    activeOrders
      .filter(o => o.date.startsWith(currentMonthStr))
      .forEach(o => {
        const parts = o.date.split('-');
        if (parts.length < 3) return;
        const day = Number(parts[2]);
        const idx = day >= 1 && day <= 7 ? 0 : day >= 8 && day <= 14 ? 1 : day >= 15 && day <= 21 ? 2 : 3;
        weekly[idx].valor += o.totalValue;
        weeklyCounts[idx] += 1;
      });
    return weekly.map((w, idx) => ({
      ...w,
      valor: weeklyCounts[idx] > 0 ? Number((w.valor / weeklyCounts[idx]).toFixed(2)) : 0
    }));
  };

  const getInventoryCategoryValues = () => {
    const categories: Record<string, number> = {};
    inventory
      .filter(i => !i.isDeleted)
      .forEach(i => {
        const cat = i.category || 'Geral';
        if (!categories[cat]) categories[cat] = 0;
        categories[cat] += i.quantity * i.unitValue;
      });
    const data = Object.entries(categories).map(([name, valor]) => ({
      name,
      valor: Number(valor.toFixed(2))
    }));
    return data.length > 0 ? data : [{ name: 'Sem Insumos', valor: 0 }];
  };

  const faturamentoPctDiff = prevMonthFaturamento > 0 ? ((faturamentoMes - prevMonthFaturamento) / prevMonthFaturamento) * 100 : 0;
  const faturamentoTrendStr = prevMonthFaturamento > 0 ? `${faturamentoPctDiff >= 0 ? '+' : ''}${faturamentoPctDiff.toFixed(1)}% vs mês anterior` : 'R$ 0,00 no mês anterior';

  const lucroPctDiff = prevMonthLucro > 0 ? ((lucroLiquido - prevMonthLucro) / prevMonthLucro) * 100 : 0;
  const lucroTrendStr = prevMonthLucro > 0 ? `${lucroPctDiff >= 0 ? '+' : ''}${lucroPctDiff.toFixed(1)}% vs mês anterior` : 'R$ 0,00 no mês anterior';

  const pedidosConcluidosPctDiff = prevMonthOrdersCount > 0 ? ((concluidoMesCount - prevMonthOrdersCount) / prevMonthOrdersCount) * 100 : 0;
  const pedidosConcluidosTrendStr = prevMonthOrdersCount > 0 ? `${pedidosConcluidosPctDiff >= 0 ? '+' : ''}${pedidosConcluidosPctDiff.toFixed(1)}% vs mês anterior` : '0 pedidos no mês anterior';

  const kpis = [
    {
      title: 'Faturamento do Mês',
      value: `R$ ${faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: faturamentoTrendStr,
      trend: faturamentoPctDiff >= 0 ? ('up' as const) : ('down' as const),
      trendPercent: `${faturamentoPctDiff >= 0 ? '+' : ''}${faturamentoPctDiff.toFixed(1)}%`,
      icon: <TrendingUp size={16} />,
      statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      description: 'Total acumulado de faturamento bruto gerado no mês corrente através de vendas diretas e conversão de orçamentos.',
      chartData: getWeeklyFaturamento(),
      viewLink: 'financial'
    },
    {
      title: 'Lucro do Mês',
      value: `R$ ${lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: lucroTrendStr,
      trend: lucroPctDiff >= 0 ? ('up' as const) : ('down' as const),
      trendPercent: `${lucroPctDiff >= 0 ? '+' : ''}${lucroPctDiff.toFixed(1)}%`,
      icon: <DollarSign size={16} />,
      statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      description: 'Margem líquida estimada deduzindo os custos operacionais de insumo e compras do faturamento total do ateliê.',
      chartData: getWeeklyLucro(),
      viewLink: 'financial'
    },
    {
      title: 'Fluxo de Caixa',
      value: `R$ ${saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: 'Saldo real acumulado em caixa',
      trend: saldoAtual >= 0 ? ('up' as const) : ('down' as const),
      trendPercent: 'Saldo Real',
      icon: <Percent size={16} />,
      statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      description: 'Saldo financeiro atual composto por todas as receitas históricas registradas menos as despesas operacionais realizadas.',
      chartData: getWeeklyCumulativeBalance(),
      viewLink: 'financial'
    },
    {
      title: 'Pedidos em Produção',
      value: `${emProducaoCount} pedidos`,
      subtitle: 'Ativos em andamento',
      trend: 'neutral' as const,
      trendPercent: 'Estável',
      icon: <Hammer size={16} />,
      statusColor: 'text-amber-600 bg-amber-50 border-amber-100',
      description: 'Quantidade total de pedidos atualmente sendo montados ou na fase de acabamento/polimento pelas artesãs.',
      chartData: getWeeklyOrdersInProduction(),
      viewLink: 'production'
    },
    {
      title: 'Pedidos Concluídos',
      value: `${concluidoMesCount} pedidos`,
      subtitle: pedidosConcluidosTrendStr,
      trend: pedidosConcluidosPctDiff >= 0 ? ('up' as const) : ('down' as const),
      trendPercent: `${pedidosConcluidosPctDiff >= 0 ? '+' : ''}${pedidosConcluidosPctDiff.toFixed(1)}%`,
      icon: <Package size={16} />,
      statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      description: 'Pedidos que foram com sucesso finalizados, montados, embalados e entregues ao cliente no mês corrente.',
      chartData: getWeeklyCompletedOrders(),
      viewLink: 'orders'
    },
    {
      title: 'Pedidos Atrasados',
      value: `${atrasadosCount} pedidos`,
      subtitle: atrasadosCount > 0 ? 'Atenção necessária' : 'Nenhum pedido em atraso',
      trend: atrasadosCount > 0 ? ('down' as const) : ('neutral' as const),
      trendPercent: atrasadosCount > 0 ? 'Crítico' : 'Sob controle',
      icon: <AlertTriangle size={16} />,
      statusColor: atrasadosCount > 0 ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-slate-600 bg-slate-50 border-slate-150',
      description: 'Pedidos de venda aprovados que ultrapassaram o prazo de entrega estipulado e ainda não foram finalizados.',
      chartData: getWeeklyDelayedOrders(),
      viewLink: 'orders'
    },
    {
      title: 'Horas Trabalhadas',
      value: `${totalHoursWorked} hrs`,
      subtitle: 'Tempo real registrado',
      trend: totalHoursWorked > 0 ? ('up' as const) : ('neutral' as const),
      trendPercent: 'Produtividade',
      icon: <Clock size={16} />,
      statusColor: 'text-blue-600 bg-blue-50 border-blue-100',
      description: 'Tempo total em horas investido pelas artesãs e equipe de montagem física nos terços e joias religiosas finalizados.',
      chartData: getWeeklyHoursWorked(),
      viewLink: 'production'
    },
    {
      title: 'Vendas do Dia',
      value: `R$ ${vendasDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: 'Total faturado hoje',
      trend: vendasDia > 0 ? ('up' as const) : ('neutral' as const),
      trendPercent: 'Hoje',
      icon: <ShoppingCart size={16} />,
      statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      description: 'Soma do valor bruto de pedidos criados e faturados especificamente na data de hoje.',
      chartData: getDailyVendasDia(),
      viewLink: 'orders'
    },
    {
      title: 'Ticket Médio',
      value: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: 'Média por pedido',
      trend: ticketMedio > 0 ? ('up' as const) : ('neutral' as const),
      trendPercent: 'Comercial',
      icon: <TrendingUp size={16} />,
      statusColor: 'text-blue-600 bg-blue-50 border-blue-100',
      description: 'Valor médio gasto pelos clientes do ateliê por pedido de venda fechado no sistema durante este mês.',
      chartData: getWeeklyTicketMedio(),
      viewLink: 'quotes'
    },
    {
      title: 'Valor do Estoque',
      value: `R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: 'Insumos imobilizados',
      trend: 'neutral' as const,
      trendPercent: 'Patrimônio',
      icon: <Package size={16} />,
      statusColor: 'text-amber-600 bg-amber-50 border-amber-100',
      description: 'Custo de aquisição total de todas as contas, metais, embalagens e fios guardados fisicamente em estoque.',
      chartData: getInventoryCategoryValues(),
      viewLink: 'inventory'
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            onClick={() => handleKpiClick(kpi.title, kpi.value, kpi.subtitle, kpi.description, kpi.trend, kpi.trendPercent, kpi.chartData, kpi.statusColor.split(' ')[1], kpi.statusColor.split(' ')[0])}
            className={`p-4.5 rounded-xl border bg-white shadow-3xs hover:shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between h-34 group border-slate-100`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mr-1">
                {kpi.title}
              </span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${kpi.statusColor.split(' ')[0]} ${kpi.statusColor.split(' ')[1]}`}>
                {kpi.icon}
              </div>
            </div>

            <div className="mt-2 space-y-1">
              <h4 className="text-base sm:text-lg font-bold font-serif text-slate-900 truncate">
                {kpi.value}
              </h4>
              <div className="flex items-center gap-1">
                {kpi.trend === 'up' && <ArrowUpRight size={10} className="text-emerald-600 shrink-0" />}
                {kpi.trend === 'down' && <ArrowDownRight size={10} className="text-rose-600 shrink-0" />}
                <span className="text-[9.5px] text-slate-500 font-semibold truncate">
                  {kpi.subtitle}
                </span>
              </div>
            </div>

            <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex items-center gap-1 select-none">
              <Eye size={10} /> Detalhes
            </span>
          </div>
        ))}
      </div>

      {/* KPI Details Modal */}
      {selectedKpi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-3xs no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 overflow-hidden mx-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-serif font-semibold text-slate-900 text-base">{selectedKpi.title}</h3>
                <p className="text-[10px] text-slate-500 font-mono">Indicador Gerencial ERP</p>
              </div>
              <button
                onClick={() => setSelectedKpi(null)}
                className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer transition-all"
              >
                <X size={14} />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-serif font-black text-slate-900">{selectedKpi.value}</span>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${selectedKpi.bgColor} ${selectedKpi.textColor}`}>
                  {selectedKpi.trendPercent}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedKpi.description}
              </p>

              {/* Mini history chart */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Evolução Recente</h5>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedKpi.chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="valor" stroke="#D4A039" fill="#FDF6E2" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => {
                  const viewMap: Record<string, string> = {
                    'Faturamento do Mês': 'financial',
                    'Lucro do Mês': 'financial',
                    'Fluxo de Caixa': 'financial',
                    'Pedidos em Produção': 'production',
                    'Pedidos Concluídos': 'orders',
                    'Pedidos Atrasados': 'orders',
                    'Horas Trabalhadas': 'production',
                    'Vendas do Dia': 'orders',
                    'Ticket Médio': 'quotes',
                    'Valor do Estoque': 'inventory',
                  };
                  onViewChange(viewMap[selectedKpi.title] || 'dashboard');
                  setSelectedKpi(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
              >
                Acessar Módulo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
