import React from 'react';
import { Package, AlertTriangle, ChevronUp, ChevronDown, Check, TrendingUp } from 'lucide-react';
import { InventoryItem, Order } from '../../types/erp';

interface DashboardStockGoalsProps {
  inventory: InventoryItem[];
  activeOrders: Order[];
  goals: {
    faturamento: number;
    lucro: number;
    vendas: number;
    producao: number;
  };
  currentMonthFaturamento: number;
  currentMonthLucro: number;
  currentMonthOrdersCount: number;
  currentMonthProducaoCount: number;
}

export const DashboardStockGoals: React.FC<DashboardStockGoalsProps> = ({
  inventory,
  activeOrders,
  goals,
  currentMonthFaturamento,
  currentMonthLucro,
  currentMonthOrdersCount,
  currentMonthProducaoCount,
}) => {
  // 1. Stock calculations
  const totalStockVal = inventory
    .filter(i => !i.isDeleted)
    .reduce((sum, i) => sum + (i.quantity * i.unitValue), 0);

  const criticalItems = inventory.filter(i => !i.isDeleted && i.quantity === 0);
  const lowStockItems = inventory.filter(i => !i.isDeleted && i.quantity > 0 && i.quantity <= i.minQuantity);

  // 2. Goal calculation utilities
  const getPct = (current: number, target: number) => {
    if (target <= 0) return 100;
    return Math.min(100, Math.round((current / target) * 100));
  };

  const getGoalColor = (pct: number) => {
    if (pct < 50) return 'bg-terracotta-500';
    if (pct < 80) return 'bg-warning-500';
    return 'bg-success-500';
  };

  const getGoalTextColor = (pct: number) => {
    if (pct < 50) return 'text-terracotta-500';
    if (pct < 80) return 'text-warning-500';
    return 'text-success-500';
  };

  const faturamentoPct = getPct(currentMonthFaturamento, goals.faturamento);
  const lucroPct = getPct(currentMonthLucro, goals.lucro);
  const vendasPct = getPct(currentMonthOrdersCount, goals.vendas);
  const producaoPct = getPct(currentMonthProducaoCount, goals.producao);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 1. WIDGET: ESTOQUE */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-serif font-semibold text-base text-slate-900">Saúde do Estoque</h3>
          <p className="text-[11px] text-slate-500">Acompanhamento de insumos críticos e valores imobilizados</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100/60">
            <span className="block text-[9px] uppercase font-bold text-slate-400">Total Imobilizado</span>
            <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">
              R$ {totalStockVal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="bg-rose-50/50 p-3 rounded-xl text-center border border-rose-100/60">
            <span className="block text-[9px] uppercase font-bold text-rose-500">Zerados / Críticos</span>
            <span className="text-sm font-bold text-rose-700 font-mono mt-0.5 block">
              {criticalItems.length}
            </span>
          </div>

          <div className="bg-amber-50/50 p-3 rounded-xl text-center border border-amber-100/60">
            <span className="block text-[9px] uppercase font-bold text-amber-600">Abaixo do Mínimo</span>
            <span className="text-sm font-bold text-amber-700 font-mono mt-0.5 block">
              {lowStockItems.length}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <h4 className="font-bold text-[10px] uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-500" /> Alerta de Reposição Urgente
          </h4>

          <div className="space-y-2 max-h-[140px] overflow-y-auto">
            {criticalItems.slice(0, 3).map(i => (
              <div key={i.id} className="flex justify-between items-center bg-rose-50/20 border border-rose-100/40 px-3 py-2 rounded-lg text-[11px]">
                <span className="text-slate-850 font-semibold">{i.name}</span>
                <span className="text-rose-600 font-mono font-black uppercase text-[9px] bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                  Sem Estoque (0 {i.unit})
                </span>
              </div>
            ))}

            {lowStockItems.slice(0, 3).map(i => (
              <div key={i.id} className="flex justify-between items-center bg-amber-50/10 border border-amber-100/40 px-3 py-2 rounded-lg text-[11px]">
                <span className="text-slate-850 font-semibold">{i.name}</span>
                <span className="text-amber-700 font-mono font-black text-[9px] bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                  {i.quantity} {i.unit} (Mín: {i.minQuantity})
                </span>
              </div>
            ))}

            {criticalItems.length === 0 && lowStockItems.length === 0 && (
              <p className="text-center text-[11px] text-slate-400 italic py-6">Insumos perfeitamente abastecidos.</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. WIDGET: METAS MENSAIS */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-serif font-semibold text-base text-slate-900">Metas e Desempenho Mensal</h3>
          <p className="text-[11px] text-slate-500">Porcentagem alcançada dos objetivos estipulados para o ateliê</p>
        </div>

        <div className="space-y-3.5">
          {/* Faturamento */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline text-xs">
              <span className="font-bold text-slate-800">Faturamento do Mês</span>
              <div className="font-semibold text-slate-500">
                <span className={`font-mono font-bold ${getGoalTextColor(faturamentoPct)}`}>{faturamentoPct}%</span> (R$ {currentMonthFaturamento.toFixed(0)} / R$ {goals.faturamento.toFixed(0)})
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${getGoalColor(faturamentoPct)}`} style={{ width: `${faturamentoPct}%` }} />
            </div>
          </div>

          {/* Lucro */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline text-xs">
              <span className="font-bold text-slate-800">Lucro Líquido do Mês</span>
              <div className="font-semibold text-slate-500">
                <span className={`font-mono font-bold ${getGoalTextColor(lucroPct)}`}>{lucroPct}%</span> (R$ {currentMonthLucro.toFixed(0)} / R$ {goals.lucro.toFixed(0)})
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${getGoalColor(lucroPct)}`} style={{ width: `${lucroPct}%` }} />
            </div>
          </div>

          {/* Vendas */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline text-xs">
              <span className="font-bold text-slate-800">Meta de Vendas</span>
              <div className="font-semibold text-slate-500">
                <span className={`font-mono font-bold ${getGoalTextColor(vendasPct)}`}>{vendasPct}%</span> ({currentMonthOrdersCount} / {goals.vendas} pedidos)
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${getGoalColor(vendasPct)}`} style={{ width: `${vendasPct}%` }} />
            </div>
          </div>

          {/* Produção */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline text-xs">
              <span className="font-bold text-slate-800">Peças Produzidas</span>
              <div className="font-semibold text-slate-500">
                <span className={`font-mono font-bold ${getGoalTextColor(producaoPct)}`}>{producaoPct}%</span> ({currentMonthProducaoCount} / {goals.producao} peças)
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${getGoalColor(producaoPct)}`} style={{ width: `${producaoPct}%` }} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
