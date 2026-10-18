import React, { useState } from 'react';
import { InventoryItem } from '../../types/erp';
import { 
  ArrowLeft, BarChart2, Package, ArrowUpDown, Edit3, DollarSign, 
  Activity, Clock, User, Calendar, TrendingUp, TrendingDown, Layers, FileText
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { Button, Badge } from '../ui';

export interface InventoryDetailsScreenProps {
  item: InventoryItem;
  itemDetailsData: {
    movements: any[];
    relatedProducts: any[];
    ordersConsuming: any[];
    quotesReserving: any[];
    stats: {
      totalPurchased: number;
      totalConsumed: number;
      totalReserved: number;
      totalSpent: number;
      averageCost: number;
      turnoverRatio: number;
      daysRemaining: number;
    };
  };
  onBack: () => void;
  onOpenAdjust: (item: InventoryItem) => void;
  onOpenEdit: (item: InventoryItem) => void;
}

export const InventoryDetailsScreen: React.FC<InventoryDetailsScreenProps> = ({
  item,
  itemDetailsData,
  onBack,
  onOpenAdjust,
  onOpenEdit,
}) => {
  const [detailsTab, setDetailsTab] = useState<'summary' | 'history' | 'stats' | 'charts' | 'timeline'>('summary');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  const { movements, relatedProducts, ordersConsuming, quotesReserving, stats } = itemDetailsData;

  // Filter movements by period
  const filteredMovements = movements.filter((m) => {
    if (periodFilter === 'all') return true;
    const moveDate = new Date(m.date);
    const now = new Date();
    if (periodFilter === 'week') {
      const diff = (now.getTime() - moveDate.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }
    if (periodFilter === 'month') {
      const diff = (now.getTime() - moveDate.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    }
    if (periodFilter === 'year') {
      const diff = (now.getTime() - moveDate.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 365;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12 font-sans select-none animate-slide-in-up">
      {/* Header with Back button */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package size={28} className="text-slate-300" />
              )}
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={onBack}
                className="text-xs font-bold text-slate-500 hover:text-amber-800 transition-colors flex items-center gap-1.5 cursor-pointer mb-1"
              >
                <ArrowLeft size={14} />
                Voltar ao Estoque
              </button>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
                  {item.name}
                </h2>
                <Badge variant="neutral" size="sm">
                  CÓD: {item.code}
                </Badge>
                <Badge variant="warning" size="sm">
                  {item.category}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Fornecedor: <strong className="text-slate-700">{item.supplier || 'Não informado'}</strong> • Unidade: <strong className="text-slate-700">{item.unit}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenAdjust(item)}
              leftIcon={<ArrowUpDown size={14} className="text-amber-600" />}
            >
              Movimentar Saldo
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenEdit(item)}
              leftIcon={<Edit3 size={14} className="text-amber-400" />}
            >
              Editar Insumo
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Saldo Físico Atual</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            {item.quantity} {item.unit}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Disponível: {item.available ?? item.quantity} {item.unit}
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Custo Unitário Médio</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
            R$ {item.unitValue.toFixed(4)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">por {item.unit}</span>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Patrimônio em Estoque</span>
          <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">
            R$ {(item.quantity * item.unitValue).toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Valoração do saldo</span>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Reservas / Orçamentos</span>
          <span className="text-xl font-bold font-mono text-amber-700 mt-1 block">
            {item.reserved || 0} {item.unit}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">{quotesReserving.length} cotações ativas</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-150 bg-slate-50/50 px-6 gap-2 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setDetailsTab('summary')}
            className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              detailsTab === 'summary'
                ? 'border-amber-600 text-amber-900 font-extrabold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity size={14} />
            1. Resumo & Rastreabilidade
          </button>
          <button
            onClick={() => setDetailsTab('history')}
            className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              detailsTab === 'history'
                ? 'border-amber-600 text-amber-900 font-extrabold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock size={14} />
            2. Histórico de Movimentações ({movements.length})
          </button>
          <button
            onClick={() => setDetailsTab('charts')}
            className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              detailsTab === 'charts'
                ? 'border-amber-600 text-amber-900 font-extrabold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart2 size={14} />
            3. Curva de Consumo & Preço
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: SUMMARY & LINEAGE TRACE */}
          {detailsTab === 'summary' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders Consuming */}
                <div className="bg-slate-50 border border-slate-200/70 p-5 rounded-2xl space-y-4">
                  <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center justify-between">
                    <span>Consumido em Pedidos de Venda</span>
                    <Activity size={16} className="text-amber-600" />
                  </h4>

                  {ordersConsuming.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      Nenhum pedido de venda consumiu este insumo até o momento.
                    </p>
                  ) : (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {ordersConsuming.map((o) => (
                        <div key={o.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900 font-mono">Pedido #{o.orderNumber}</span>
                            <span className="font-mono font-bold text-rose-600">-{o.consumedQty} {item.unit}</span>
                          </div>
                          <p className="text-[11px] text-slate-500">Cliente: <strong>{o.clientName}</strong></p>
                          <p className="text-[10px] text-slate-400 italic">{o.productsLabel}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quotes Reserving */}
                <div className="bg-slate-50 border border-slate-200/70 p-5 rounded-2xl space-y-4">
                  <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center justify-between">
                    <span>Reservas em Orçamentos Abertos</span>
                    <Clock size={16} className="text-amber-600" />
                  </h4>

                  {quotesReserving.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">
                      Nenhuma reserva pendente vinculada a orçamentos.
                    </p>
                  ) : (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {quotesReserving.map((q) => (
                        <div key={q.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900 font-mono">{q.quoteNumber}</span>
                            <span className="font-mono font-bold text-amber-700">{q.reservedQty} {item.unit}</span>
                          </div>
                          <p className="text-[11px] text-slate-500">Cliente: <strong>{q.clientName}</strong></p>
                          <p className="text-[10px] text-slate-400 italic">{q.productsLabel}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Related Products BOM */}
              <div className="bg-slate-50 border border-slate-200/70 p-5 rounded-2xl space-y-3">
                <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Layers size={16} className="text-amber-600" />
                  Produtos do Catálogo que Usam este Insumo na Ficha Técnica (BOM)
                </h4>

                {relatedProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    Este insumo ainda não foi vinculado a nenhum produto na aba "Produtos & Composição".
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    {relatedProducts.map((p) => {
                      const comp = p.composition?.find((c: any) => c.materialId === item.id);
                      return (
                        <div key={p.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1 text-xs">
                          <span className="font-bold text-slate-900 block truncate">{p.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono block">SKU: {p.sku}</span>
                          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">Consumo por Peça:</span>
                            <span className="font-mono font-bold text-amber-800">
                              {comp ? comp.quantity : 1} {item.unit}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: HISTORY */}
          {detailsTab === 'history' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Filtrar Histórico de Movimentações</h4>
                  <p className="text-[11px] text-slate-500">Selecione uma janela de tempo para auditoria</p>
                </div>
                <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                  {(['all', 'week', 'month', 'year'] as const).map((filterId) => (
                    <button
                      key={filterId}
                      onClick={() => setPeriodFilter(filterId)}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        periodFilter === filterId
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {filterId === 'all' ? 'Tudo' : filterId === 'week' ? 'Semana' : filterId === 'month' ? 'Mês' : 'Ano'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                <div className="flex justify-between items-center px-4 py-2.5 bg-slate-100/70 font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                  <span>Data & Operação</span>
                  <span>Responsável / Contato</span>
                  <span className="text-right">Quantidade</span>
                  <span className="text-right">Custo Unitário</span>
                </div>

                {filteredMovements.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center px-4 py-3 text-slate-800 font-medium hover:bg-slate-50 transition-colors">
                    <div>
                      <span className="font-bold text-slate-900 block">{m.type}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(m.date).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <span className="text-slate-600">{m.responsible || 'Sistema'}</span>
                    <span className={`font-mono font-bold text-right ${m.amount >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {m.amount >= 0 ? '+' : ''}{m.amount} {item.unit}
                    </span>
                    <span className="font-mono text-slate-700 text-right">
                      R$ {m.unitValue.toFixed(4)}
                    </span>
                  </div>
                ))}

                {filteredMovements.length === 0 && (
                  <div className="py-8 text-center text-slate-400">
                    Nenhuma movimentação registrada no período selecionado.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CHARTS */}
          {detailsTab === 'charts' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70">
                <h4 className="font-serif font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                  <BarChart2 size={16} className="text-amber-600" />
                  Evolução do Saldo Físico em Estoque
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={movements.map((m) => ({
                        date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                        saldo: m.balanceAfter ?? item.quantity,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip />
                      <Area type="monotone" dataKey="saldo" stroke="#d97706" fill="#fef3c7" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
