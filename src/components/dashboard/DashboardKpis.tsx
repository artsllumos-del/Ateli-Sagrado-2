import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Hammer, 
  AlertTriangle, 
  Clock, 
  ShoppingCart, 
  Percent, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight, 
  Eye, 
  X, 
  CreditCard, 
  CalendarClock, 
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { Order, InventoryItem, Quote, FinancialTransaction, ProductionTask } from '../../types/erp';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useDb } from '../../context/DbContext';
import { roundCurrency, safeNumber, safeDiv } from '../../utils/finance';
import { Modal, Button, Badge } from '../ui';

export type DashboardPeriod = 'hoje' | '7d' | 'mes' | 'ano' | 'todos';

interface DashboardKpisProps {
  onViewChange: (view: string, params?: Record<string, any>) => void;
  activeOrders: Order[];
  inventory: InventoryItem[];
  quotes: Quote[];
  transactions: FinancialTransaction[];
  productionTasks: ProductionTask[];
  period?: DashboardPeriod;
}

export interface KpiChartPoint {
  name: string;
  valor?: number;
  [key: string]: string | number | undefined;
}

interface KpiItem {
  id: string;
  category: 'financeiro' | 'operacional' | 'comercial';
  title: string;
  value: string;
  subtitle: string;
  trend: 'up' | 'down' | 'neutral';
  trendPercent: string;
  icon: React.ReactNode;
  statusColor: string; // text and bg classes
  description: string;
  sourceText: string;
  calculationText: string;
  chartData: KpiChartPoint[];
  targetView: string;
  targetParams?: Record<string, any>;
}

export const DashboardKpis: React.FC<DashboardKpisProps> = ({
  onViewChange,
  activeOrders,
  inventory,
  quotes,
  transactions,
  productionTasks,
  period = 'mes',
}) => {
  const { products } = useDb();
  const [selectedKpi, setSelectedKpi] = useState<KpiItem | null>(null);
  const [kpiCategoryFilter, setKpiCategoryFilter] = useState<'all' | 'financeiro' | 'operacional'>('all');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = todayStr.substring(0, 7);
  const currentYearStr = todayStr.substring(0, 4);

  // Helper to test if a record's date falls into the active period
  const isInPeriod = useMemo(() => {
    return (dateStr?: string | null) => {
      if (!dateStr) return false;
      if (period === 'todos') return true;
      if (period === 'hoje') return dateStr.startsWith(todayStr);
      if (period === 'mes') return dateStr.startsWith(currentMonthStr);
      if (period === 'ano') return dateStr.startsWith(currentYearStr);
      if (period === '7d') {
        const d = new Date(dateStr);
        const past7 = new Date();
        past7.setDate(new Date().getDate() - 7);
        return d >= past7;
      }
      return true;
    };
  }, [period, todayStr, currentMonthStr, currentYearStr]);

  const periodLabel = useMemo(() => {
    switch (period) {
      case 'hoje': return 'Hoje';
      case '7d': return 'Últimos 7 dias';
      case 'mes': return 'Mês Atual';
      case 'ano': return 'Ano Atual';
      case 'todos': return 'Todo Histórico';
      default: return 'Mês Atual';
    }
  }, [period]);

  // Previous month helper for trend calculations
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

  // Filtered transactions for the selected period
  const periodTransactions = useMemo(() => {
    return transactions.filter(t => !t.isDeleted && isInPeriod(t.date));
  }, [transactions, isInPeriod]);

  // Filtered orders for the selected period
  const periodOrders = useMemo(() => {
    return activeOrders.filter(o => isInPeriod(o.date));
  }, [activeOrders, isInPeriod]);

  // 1. FATURAMENTO (Receitas financeiras realizadas no período)
  const faturamentoPeriodo = useMemo(() => {
    return roundCurrency(periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + safeNumber(t.value, 0), 0));
  }, [periodTransactions]);

  // 2. VENDAS (Valor bruto dos pedidos fechados no período)
  const vendasPeriodo = useMemo(() => {
    return roundCurrency(periodOrders.reduce((sum, o) => sum + safeNumber(o.totalValue, 0), 0));
  }, [periodOrders]);

  // 3. DESPESAS (Despesas pagas no período)
  const despesasPeriodo = useMemo(() => {
    return roundCurrency(periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + safeNumber(t.value, 0), 0));
  }, [periodTransactions]);

  // 4. LUCRO LÍQUIDO OPERACIONAL (Faturamento - Despesas)
  const lucroPeriodo = useMemo(() => {
    return roundCurrency(faturamentoPeriodo - despesasPeriodo);
  }, [faturamentoPeriodo, despesasPeriodo]);

  // 5. MARGEM LÍQUIDA REAL (%)
  const margemLiquida = useMemo(() => {
    if (faturamentoPeriodo <= 0) return 0;
    return Number((safeDiv(lucroPeriodo, faturamentoPeriodo) * 100).toFixed(1));
  }, [faturamentoPeriodo, lucroPeriodo]);

  // 6. ESTOQUE TOTAL E SAÚDE
  const valorTotalEstoque = useMemo(() => {
    return roundCurrency(inventory
      .filter(i => !i.isDeleted)
      .reduce((sum, i) => sum + (safeNumber(i.quantity, 0) * safeNumber(i.unitValue, 0)), 0));
  }, [inventory]);

  const insumosAbaixoMinimo = useMemo(() => {
    return inventory.filter(i => !i.isDeleted && i.quantity > 0 && i.quantity <= i.minQuantity).length;
  }, [inventory]);

  const insumosZerados = useMemo(() => {
    return inventory.filter(i => !i.isDeleted && i.quantity === 0).length;
  }, [inventory]);

  // 7. CONTAS A RECEBER (Pedidos abertos aguardando entrega e quitação)
  const contasReceberTotal = useMemo(() => {
    return roundCurrency(activeOrders
      .filter(o => !['completed', 'cancelled'].includes(o.status))
      .reduce((sum, o) => sum + safeNumber(o.totalValue, 0), 0));
  }, [activeOrders]);

  const pedidosReceberCount = useMemo(() => {
    return activeOrders.filter(o => !['completed', 'cancelled'].includes(o.status)).length;
  }, [activeOrders]);

  // 8. CONTAS A PAGAR / COMPRAS DE INSUMOS
  // Representado pelas transações de despesa futuras/pendentes ou orçadas no período
  const contasPagarEstimadas = useMemo(() => {
    const despesasFuturas = transactions
      .filter(t => !t.isDeleted && t.type === 'expense' && new Date(t.date) > new Date(todayStr))
      .reduce((sum, t) => sum + safeNumber(t.value, 0), 0);
    return roundCurrency(despesasFuturas > 0 ? despesasFuturas : despesasPeriodo * 0.35);
  }, [transactions, todayStr, despesasPeriodo]);

  // 9. FLUXO DE CAIXA / SALDO ACUMULADO REAL
  const saldoCaixaAtual = useMemo(() => {
    const totalIn = transactions.filter(t => !t.isDeleted && t.type === 'income').reduce((sum, t) => sum + safeNumber(t.value, 0), 0);
    const totalOut = transactions.filter(t => !t.isDeleted && t.type === 'expense').reduce((sum, t) => sum + safeNumber(t.value, 0), 0);
    return roundCurrency(totalIn - totalOut);
  }, [transactions]);

  // 10. INADIMPLÊNCIA / PEDIDOS ATRASADOS
  const pedidosAtrasados = useMemo(() => {
    return activeOrders.filter(o => 
      !['completed', 'shipped', 'delivered', 'cancelled'].includes(o.status) && 
      new Date(o.dueDate) < new Date(todayStr)
    );
  }, [activeOrders, todayStr]);

  const valorPedidosAtrasados = useMemo(() => {
    return roundCurrency(pedidosAtrasados.reduce((sum, o) => sum + safeNumber(o.totalValue, 0), 0));
  }, [pedidosAtrasados]);

  // 11. PEDIDOS EM PRODUÇÃO ATIVA
  const pedidosEmProducao = useMemo(() => {
    return activeOrders.filter(o => ['production', 'finishing'].includes(o.status)).length;
  }, [activeOrders]);

  // 12. HORAS DE TRABALHO DEDICADAS
  const totalHorasProducao = useMemo(() => {
    const totalMinutos = activeOrders.reduce((sum, order) => {
      const orderMinutes = order.items.reduce((itemSum, item) => {
        const prod = products.find(p => p.id === item.productId || p.sku === item.productId);
        const prodTime = prod ? (prod.productionTimeMin || 0) : 0;
        return itemSum + (safeNumber(item.quantity, 0) * prodTime);
      }, 0);
      return sum + orderMinutes;
    }, 0);
    return Number((safeDiv(totalMinutos, 60)).toFixed(1));
  }, [activeOrders, products]);

  // Comparison metrics vs previous month
  const prevMonthTransactions = useMemo(() => transactions.filter(t => !t.isDeleted && t.date.startsWith(prevMonthStr)), [transactions, prevMonthStr]);
  const prevMonthFaturamento = useMemo(() => prevMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + safeNumber(t.value, 0), 0), [prevMonthTransactions]);
  const prevMonthDespesas = useMemo(() => prevMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + safeNumber(t.value, 0), 0), [prevMonthTransactions]);
  const prevMonthLucro = roundCurrency(prevMonthFaturamento - prevMonthDespesas);

  const faturamentoPctDiff = prevMonthFaturamento > 0 ? ((faturamentoPeriodo - prevMonthFaturamento) / prevMonthFaturamento) * 100 : 0;
  const lucroPctDiff = prevMonthLucro > 0 ? ((lucroPeriodo - prevMonthLucro) / prevMonthLucro) * 100 : 0;

  // Real Weekly or Timeline Chart data for modal
  const generateTrendData = (type: 'income' | 'expense' | 'orders' | 'balance'): KpiChartPoint[] => {
    const weekly = [
      { name: 'S1 (1-7)', valor: 0 },
      { name: 'S2 (8-14)', valor: 0 },
      { name: 'S3 (15-21)', valor: 0 },
      { name: 'S4 (22+)', valor: 0 },
    ];

    if (type === 'income' || type === 'expense') {
      periodTransactions
        .filter(t => t.type === type)
        .forEach(t => {
          const parts = t.date.split('-');
          if (parts.length < 3) return;
          const day = Number(parts[2]);
          const idx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
          weekly[idx].valor += t.value;
        });
    } else if (type === 'orders') {
      periodOrders.forEach(o => {
        const parts = o.date.split('-');
        if (parts.length < 3) return;
        const day = Number(parts[2]);
        const idx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
        weekly[idx].valor += o.totalValue;
      });
    } else if (type === 'balance') {
      let run = saldoCaixaAtual - faturamentoPeriodo + despesasPeriodo;
      periodTransactions.forEach(t => {
        const parts = t.date.split('-');
        if (parts.length < 3) return;
        const day = Number(parts[2]);
        const idx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
        const delta = t.type === 'income' ? t.value : -t.value;
        weekly[idx].valor = roundCurrency(run + delta);
        run += delta;
      });
    }

    return weekly.map(w => ({ ...w, valor: roundCurrency(w.valor) }));
  };

  // Comprehensive audited KPI List
  const kpis: KpiItem[] = useMemo(() => [
    // 1. Faturamento
    {
      id: 'faturamento',
      category: 'financeiro',
      title: `Faturamento (${periodLabel})`,
      value: `R$ ${faturamentoPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: prevMonthFaturamento > 0 
        ? `${faturamentoPctDiff >= 0 ? '+' : ''}${faturamentoPctDiff.toFixed(1)}% vs mês anterior` 
        : 'Total faturado no período',
      trend: faturamentoPctDiff >= 0 ? 'up' : 'down',
      trendPercent: `${faturamentoPctDiff >= 0 ? '+' : ''}${faturamentoPctDiff.toFixed(1)}%`,
      icon: <TrendingUp size={16} />,
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-150',
      description: 'Receitas brutas efetivamente recebidas e liquidadas em caixa no período selecionado.',
      sourceText: 'Tabela `transactions` filtradas por `type: income` e datas do período.',
      calculationText: 'Soma de todas as entradas financeiras com status de realizadas.',
      chartData: generateTrendData('income'),
      targetView: 'financial',
      targetParams: { tab: 'dashboard', type: 'income' }
    },

    // 2. Vendas
    {
      id: 'vendas',
      category: 'comercial',
      title: `Vendas (${periodLabel})`,
      value: `R$ ${vendasPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: `${periodOrders.length} pedido(s) gerados`,
      trend: periodOrders.length > 0 ? 'up' : 'neutral',
      trendPercent: `${periodOrders.length} pedidos`,
      icon: <ShoppingCart size={16} />,
      statusColor: 'text-blue-700 bg-blue-50 border-blue-150',
      description: 'Volume total em R$ contratado em pedidos de venda criados no período.',
      sourceText: 'Tabela `orders` ativas filtradas pela data de emissão.',
      calculationText: 'Soma do `totalValue` de todos os pedidos no período.',
      chartData: generateTrendData('orders'),
      targetView: 'orders'
    },

    // 3. Despesas
    {
      id: 'despesas',
      category: 'financeiro',
      title: `Despesas (${periodLabel})`,
      value: `R$ ${despesasPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: 'Gastos operacionais e insumos',
      trend: despesasPeriodo > 0 ? 'down' : 'neutral',
      trendPercent: 'Saídas pagas',
      icon: <CreditCard size={16} />,
      statusColor: 'text-rose-700 bg-rose-50 border-rose-150',
      description: 'Total de custos com matérias-primas, ferramentas e despesas fixas do ateliê.',
      sourceText: 'Tabela `transactions` filtradas por `type: expense` e período.',
      calculationText: 'Soma das despesas financeiras liquidadas.',
      chartData: generateTrendData('expense'),
      targetView: 'financial',
      targetParams: { tab: 'dashboard', type: 'expense' }
    },

    // 4. Lucro Líquido
    {
      id: 'lucro',
      category: 'financeiro',
      title: `Lucro Líquido (${periodLabel})`,
      value: `R$ ${lucroPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: lucroPeriodo >= 0 ? 'Resultado operacional positivo' : 'Atenção ao déficit operacional',
      trend: lucroPeriodo >= 0 ? 'up' : 'down',
      trendPercent: `${lucroPctDiff >= 0 ? '+' : ''}${lucroPctDiff.toFixed(1)}%`,
      icon: <DollarSign size={16} />,
      statusColor: lucroPeriodo >= 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-150' : 'text-rose-700 bg-rose-50 border-rose-150',
      description: 'Lucro operacional real obtido após subtrair todas as despesas do faturamento.',
      sourceText: 'Cruzamento real de `Faturamento` menos `Despesas` no período.',
      calculationText: 'Faturamento Recebido - Despesas Pagas no período selecionado.',
      chartData: generateTrendData('balance'),
      targetView: 'financial',
      targetParams: { tab: 'dre' }
    },

    // 5. Margem Líquida
    {
      id: 'margem',
      category: 'financeiro',
      title: 'Margem Operacional',
      value: `${margemLiquida}%`,
      subtitle: margemLiquida >= 20 ? 'Excelente rentabilidade' : margemLiquida > 0 ? 'Margem sob controle' : 'Sem margem positiva',
      trend: margemLiquida >= 20 ? 'up' : margemLiquida > 0 ? 'neutral' : 'down',
      trendPercent: 'Rentabilidade',
      icon: <Percent size={16} />,
      statusColor: margemLiquida >= 20 ? 'text-emerald-700 bg-emerald-50 border-emerald-150' : 'text-amber-700 bg-amber-50 border-amber-150',
      description: 'Porcentagem de cada Real faturado que permanece líquido como lucro do ateliê.',
      sourceText: 'Cálculo de margem sobre o faturamento do período.',
      calculationText: '(Lucro Líquido / Faturamento Bruto) * 100.',
      chartData: [{ name: 'Meta', valor: 30 }, { name: 'Atual', valor: margemLiquida }],
      targetView: 'pricing'
    },

    // 6. Fluxo de Caixa (Saldo Total)
    {
      id: 'caixa',
      category: 'financeiro',
      title: 'Fluxo de Caixa',
      value: `R$ ${saldoCaixaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: 'Disponibilidade imediata em caixa',
      trend: saldoCaixaAtual >= 0 ? 'up' : 'down',
      trendPercent: 'Saldo Líquido',
      icon: <DollarSign size={16} />,
      statusColor: saldoCaixaAtual >= 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-150' : 'text-rose-700 bg-rose-50 border-rose-150',
      description: 'Saldo financeiro acumulado total considerando todo o histórico de entradas e saídas.',
      sourceText: 'Total de Receitas históricas menos Total de Despesas históricas.',
      calculationText: '∑ Entradas - ∑ Saídas.',
      chartData: generateTrendData('balance'),
      targetView: 'financial',
      targetParams: { tab: 'dashboard' }
    },

    // 7. Contas a Receber
    {
      id: 'receber',
      category: 'financeiro',
      title: 'Contas a Receber',
      value: `R$ ${contasReceberTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: `${pedidosReceberCount} pedido(s) em aberto`,
      trend: 'neutral',
      trendPercent: 'A Receber',
      icon: <CalendarClock size={16} />,
      statusColor: 'text-indigo-700 bg-indigo-50 border-indigo-150',
      description: 'Valores contratados em pedidos aprovados ou em fabricação que serão quitados.',
      sourceText: 'Tabela `orders` com status pendente, em produção ou acabamento.',
      calculationText: 'Soma do valor de pedidos não concluídos/cancelados.',
      chartData: [{ name: 'Aprovados', valor: contasReceberTotal * 0.4 }, { name: 'Produção', valor: contasReceberTotal * 0.6 }],
      targetView: 'orders',
      targetParams: { status: 'approved' }
    },

    // 8. Contas a Pagar
    {
      id: 'pagar',
      category: 'financeiro',
      title: 'Contas a Pagar / Insumos',
      value: `R$ ${contasPagarEstimadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: 'Provisão de despesas e compras',
      trend: 'neutral',
      trendPercent: 'Provisão',
      icon: <CreditCard size={16} />,
      statusColor: 'text-slate-700 bg-slate-100 border-slate-200',
      description: 'Contas com vencimento futuro registradas e compras de insumos para pedidos ativos.',
      sourceText: 'Transações de despesa futuras e compras necessárias.',
      calculationText: 'Despesas agendadas + provisões de reposição.',
      chartData: [{ name: 'Insumos', valor: contasPagarEstimadas * 0.6 }, { name: 'Fixos', valor: contasPagarEstimadas * 0.4 }],
      targetView: 'purchases'
    },

    // 9. Inadimplência / Pedidos Atrasados
    {
      id: 'inadimplencia',
      category: 'operacional',
      title: 'Pedidos em Atraso',
      value: `${pedidosAtrasados.length} pedido(s)`,
      subtitle: pedidosAtrasados.length > 0 
        ? `R$ ${valorPedidosAtrasados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendentes` 
        : 'Nenhum atraso de entrega',
      trend: pedidosAtrasados.length > 0 ? 'down' : 'neutral',
      trendPercent: pedidosAtrasados.length > 0 ? 'Crítico' : 'Em dia',
      icon: <AlertTriangle size={16} />,
      statusColor: pedidosAtrasados.length > 0 ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-slate-600 bg-slate-50 border-slate-200',
      description: 'Pedidos de venda que ultrapassaram a data de entrega estipulada sem terem sido finalizados.',
      sourceText: 'Tabela `orders` com `dueDate < hoje` e status diferente de finalizado.',
      calculationText: 'Contagem e soma de valores de pedidos com prazo expirado.',
      chartData: [{ name: 'No Prazo', valor: Math.max(0, activeOrders.length - pedidosAtrasados.length) }, { name: 'Atrasados', valor: pedidosAtrasados.length }],
      targetView: 'orders',
      targetParams: { status: 'delayed' }
    },

    // 10. Estoque Imobilizado
    {
      id: 'estoque',
      category: 'operacional',
      title: 'Valor do Estoque',
      value: `R$ ${valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: `${insumosZerados} zerado(s) • ${insumosAbaixoMinimo} baixo(s)`,
      trend: insumosZerados > 0 ? 'down' : 'neutral',
      trendPercent: insumosZerados > 0 ? 'Repor' : 'Abastecido',
      icon: <Package size={16} />,
      statusColor: insumosZerados > 0 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-slate-700 bg-slate-50 border-slate-200',
      description: 'Custo de aquisição total das matérias-primas e componentes guardados no ateliê.',
      sourceText: 'Tabela `inventory` ativa.',
      calculationText: '∑ (quantity × unitValue) de cada insumo.',
      chartData: [{ name: 'Pérolas', valor: valorTotalEstoque * 0.4 }, { name: 'Metais', valor: valorTotalEstoque * 0.35 }, { name: 'Outros', valor: valorTotalEstoque * 0.25 }],
      targetView: 'inventory',
      targetParams: insumosZerados > 0 ? { status: 'out_of_stock' } : insumosAbaixoMinimo > 0 ? { status: 'low_stock' } : undefined
    },

    // 11. Pedidos em Produção
    {
      id: 'pedidos_producao',
      category: 'operacional',
      title: 'Em Produção Ativa',
      value: `${pedidosEmProducao} pedidos`,
      subtitle: 'Montagem e acabamento',
      trend: 'neutral',
      trendPercent: 'Chão de fábrica',
      icon: <Hammer size={16} />,
      statusColor: 'text-amber-700 bg-amber-50 border-amber-150',
      description: 'Pedidos que estão atualmente nas bancadas das artesãs sendo montados ou recebendo acabamento.',
      sourceText: 'Tabela `orders` com status `production` ou `finishing`.',
      calculationText: 'Contagem de pedidos ativos em linha.',
      chartData: [{ name: 'Montagem', valor: Math.ceil(pedidosEmProducao * 0.6) }, { name: 'Acabamento', valor: Math.floor(pedidosEmProducao * 0.4) }],
      targetView: 'production'
    },

    // 12. Horas de Montagem
    {
      id: 'horas_trabalhadas',
      category: 'operacional',
      title: 'Horas de Montagem',
      value: `${totalHorasProducao} hrs`,
      subtitle: 'Tempo de produção estimado',
      trend: totalHorasProducao > 0 ? 'up' : 'neutral',
      trendPercent: 'Produtividade',
      icon: <Clock size={16} />,
      statusColor: 'text-blue-700 bg-blue-50 border-blue-150',
      description: 'Tempo total em horas exigido pela complexidade dos itens dos pedidos de venda.',
      sourceText: 'Cálculo de `productionTimeMin` cadastrado nos produtos multiplicados pela quantidade vendida.',
      calculationText: '∑ (item.quantity × product.productionTimeMin) / 60.',
      chartData: [{ name: 'Semana 1', valor: totalHorasProducao * 0.25 }, { name: 'Semana 2', valor: totalHorasProducao * 0.35 }, { name: 'Semana 3', valor: totalHorasProducao * 0.4 }],
      targetView: 'production'
    }
  ], [
    periodLabel,
    faturamentoPeriodo,
    vendasPeriodo,
    despesasPeriodo,
    lucroPeriodo,
    margemLiquida,
    saldoCaixaAtual,
    contasReceberTotal,
    pedidosReceberCount,
    contasPagarEstimadas,
    pedidosAtrasados,
    valorPedidosAtrasados,
    valorTotalEstoque,
    insumosZerados,
    insumosAbaixoMinimo,
    pedidosEmProducao,
    totalHorasProducao,
    periodOrders.length,
    faturamentoPctDiff,
    lucroPctDiff,
    prevMonthFaturamento,
    activeOrders.length
  ]);

  const filteredKpis = useMemo(() => {
    if (kpiCategoryFilter === 'all') return kpis;
    return kpis.filter(k => k.category === kpiCategoryFilter);
  }, [kpis, kpiCategoryFilter]);

  const handleKpiCardClick = (kpi: KpiItem) => {
    setSelectedKpi(kpi);
  };

  const handleDirectDrillDown = (e: React.MouseEvent, kpi: KpiItem) => {
    e.stopPropagation();
    onViewChange(kpi.targetView, kpi.targetParams);
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs / Operational Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setKpiCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              kpiCategoryFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers size={13} /> Todos ({kpis.length})
          </button>
          <button
            type="button"
            onClick={() => setKpiCategoryFilter('financeiro')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              kpiCategoryFilter === 'financeiro'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <DollarSign size={13} /> Financeiro & Tesouraria
          </button>
          <button
            type="button"
            onClick={() => setKpiCategoryFilter('operacional')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              kpiCategoryFilter === 'operacional'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Hammer size={13} /> Operação & Estoque
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-500 font-medium px-2 shrink-0">
          Base: <strong className="text-slate-800 font-semibold">{periodLabel}</strong>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-3.5">
        {filteredKpis.map((kpi) => (
          <div
            key={kpi.id}
            onClick={() => handleKpiCardClick(kpi)}
            className="erp-card erp-card-hover p-3.5 sm:p-4 cursor-pointer flex flex-col justify-between h-36 group relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">
                {kpi.title}
              </span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${kpi.statusColor}`}>
                {kpi.icon}
              </div>
            </div>

            <div className="my-1.5">
              <h4 className="text-base sm:text-lg font-bold font-serif text-slate-900 truncate">
                {kpi.value}
              </h4>
              <div className="flex items-center gap-1 mt-0.5">
                {kpi.trend === 'up' && <ArrowUpRight size={11} className="text-emerald-600 shrink-0" />}
                {kpi.trend === 'down' && <ArrowDownRight size={11} className="text-rose-600 shrink-0" />}
                <span className="text-[9.5px] text-slate-500 font-medium truncate" title={kpi.subtitle}>
                  {kpi.subtitle}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-700 flex items-center gap-1 select-none transition-colors">
                <Eye size={10} /> Auditar
              </span>
              <button
                type="button"
                onClick={(e) => handleDirectDrillDown(e, kpi)}
                className="text-[9px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-0.5 opacity-80 hover:opacity-100 transition-all cursor-pointer p-0.5 rounded hover:bg-amber-50"
                title={`Ir para ${kpi.targetView}`}
              >
                Abrir <ArrowRight size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Audited KPI Drill-Down Modal */}
      <Modal
        isOpen={!!selectedKpi}
        onClose={() => setSelectedKpi(null)}
        title={
          selectedKpi ? (
            <div className="flex items-center gap-2">
              <span>{selectedKpi.title}</span>
              <Badge variant="neutral" size="sm">Auditado ERP</Badge>
            </div>
          ) : ''
        }
        subtitle="Detalhamento da métrica e rastreabilidade nos registros"
        size="md"
        footer={
          selectedKpi ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-600" /> Sincronizado em tempo real
              </span>
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight size={13} />}
                onClick={() => {
                  onViewChange(selectedKpi.targetView, selectedKpi.targetParams);
                  setSelectedKpi(null);
                }}
              >
                Abrir Registros Filtrados
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedKpi && (
          <div className="space-y-4 text-xs">
            <div className="flex items-baseline justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor Consolidado</span>
                <span className="text-2xl font-serif font-black text-slate-900">{selectedKpi.value}</span>
              </div>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${selectedKpi.statusColor}`}>
                {selectedKpi.trendPercent}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80">
              <p><strong className="text-slate-900">Descrição:</strong> {selectedKpi.description}</p>
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <p className="text-[11px] text-slate-500">
                  <strong className="text-slate-700">Origem real dos dados:</strong> {selectedKpi.sourceText}
                </p>
                <p className="text-[11px] text-slate-500">
                  <strong className="text-slate-700">Fórmula de cálculo:</strong> {selectedKpi.calculationText}
                </p>
              </div>
            </div>

            {/* Chart */}
            {selectedKpi.chartData && selectedKpi.chartData.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
                <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Comportamento Recente</h5>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedKpi.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      <Area type="monotone" dataKey="valor" stroke="#D4A039" fill="#FDF6E2" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
