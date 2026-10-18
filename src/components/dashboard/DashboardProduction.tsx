import React, { useState } from 'react';
import { 
  Hammer, 
  Clock, 
  Users, 
  Play, 
  Pause, 
  Check, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';
import { Order, OrderStatus, ProductionTask } from '../../types/erp';
import { useDb } from '../../context/DbContext';
import { toast } from '../Toast';

interface DashboardProductionProps {
  onViewChange: (view: string) => void;
  productionTasks?: ProductionTask[];
  pausedTaskIds: string[];
  setPausedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
}

// 7 Etapas Oficiais do Chão de Fábrica (100% compatíveis com a página ProductionView)
export const PRODUCTION_STAGES: { 
  status: OrderStatus; 
  label: string; 
  shortLabel: string;
  color: string; 
  bg: string; 
  text: string;
  badgeBg: string;
  stepNumber: number;
}[] = [
  { status: 'received', label: 'Pedido Recebido', shortLabel: 'Recebido', color: 'border-slate-200', bg: 'bg-slate-50', text: 'text-slate-700', badgeBg: 'bg-slate-100', stepNumber: 1 },
  { status: 'approved', label: 'Separação de Materiais', shortLabel: 'Separação', color: 'border-blue-200', bg: 'bg-blue-50/40', text: 'text-blue-800', badgeBg: 'bg-blue-100', stepNumber: 2 },
  { status: 'production', label: 'Produção & Montagem', shortLabel: 'Montagem', color: 'border-amber-200', bg: 'bg-amber-50/40', text: 'text-amber-850', badgeBg: 'bg-amber-100', stepNumber: 3 },
  { status: 'finishing', label: 'Acabamento & Polimento', shortLabel: 'Acabamento', color: 'border-purple-200', bg: 'bg-purple-50/30', text: 'text-purple-800', badgeBg: 'bg-purple-100', stepNumber: 4 },
  { status: 'packing', label: 'Embalagem Especial', shortLabel: 'Embalagem', color: 'border-pink-200', bg: 'bg-pink-50/30', text: 'text-pink-800', badgeBg: 'bg-pink-100', stepNumber: 5 },
  { status: 'ready', label: 'Pronto para Entrega', shortLabel: 'Pronto', color: 'border-emerald-200', bg: 'bg-emerald-50/30', text: 'text-emerald-800', badgeBg: 'bg-emerald-100', stepNumber: 6 },
  { status: 'completed', label: 'Concluído', shortLabel: 'Concluído', color: 'border-slate-350', bg: 'bg-slate-100/50', text: 'text-slate-800', badgeBg: 'bg-slate-200', stepNumber: 7 }
];

export const DashboardProduction: React.FC<DashboardProductionProps> = ({
  onViewChange,
  pausedTaskIds,
  setPausedTaskIds,
}) => {
  const { orders, updateOrder } = useDb();

  // Active production floor orders (non-deleted, non-cancelled, non-archived)
  const activeOrders = (orders || []).filter(o => !o.isDeleted && !o.isCancelled && !o.isArchived);

  // Selected stage filter tab in dashboard panel: 'all_active' | OrderStatus
  const [selectedFilter, setSelectedFilter] = useState<'all_active' | OrderStatus>('all_active');
  
  // Column pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 4;

  const getNextStage = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'received': return 'approved';
      case 'approved': return 'production';
      case 'production': return 'finishing';
      case 'finishing': return 'packing';
      case 'packing': return 'ready';
      case 'ready': return 'completed';
      default: return null;
    }
  };

  const getPrevStage = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'completed': return 'ready';
      case 'ready': return 'packing';
      case 'packing': return 'finishing';
      case 'finishing': return 'production';
      case 'production': return 'approved';
      case 'approved': return 'received';
      default: return null;
    }
  };

  const handleNextStage = (order: Order) => {
    const next = getNextStage(order.status);
    if (!next) return;

    // Calculate progression percentage
    const stageIndex = PRODUCTION_STAGES.findIndex(s => s.status === next);
    const progress = Math.min(100, Math.round(((stageIndex + 1) / PRODUCTION_STAGES.length) * 100));

    updateOrder(order.id, { 
      status: next,
      productionProgress: progress
    });

    const nextLabel = PRODUCTION_STAGES.find(s => s.status === next)?.label || next;
    toast.success("Avanço de Etapa", `Pedido ${order.orderNumber} movido para "${nextLabel}".`);
  };

  const handlePrevStage = (order: Order) => {
    const prev = getPrevStage(order.status);
    if (!prev) return;

    const stageIndex = PRODUCTION_STAGES.findIndex(s => s.status === prev);
    const progress = Math.max(0, Math.round(((stageIndex + 1) / PRODUCTION_STAGES.length) * 100));

    updateOrder(order.id, { 
      status: prev,
      productionProgress: progress
    });

    const prevLabel = PRODUCTION_STAGES.find(s => s.status === prev)?.label || prev;
    toast.info("Retorno de Etapa", `Pedido ${order.orderNumber} retornou para "${prevLabel}".`);
  };

  const handleTogglePause = (orderId: string, orderNumber: string) => {
    const isPaused = pausedTaskIds.includes(orderId);
    if (isPaused) {
      setPausedTaskIds(prev => prev.filter(pId => pId !== orderId));
      toast.info("Produção Retomada", `O pedido ${orderNumber} foi retomado na bancada de trabalho.`);
    } else {
      setPausedTaskIds(prev => [...prev, orderId]);
      toast.warning("Produção Pausada", `O pedido ${orderNumber} foi temporariamente pausado.`);
    }
  };

  // Filter orders according to selected tab
  const filteredOrders = activeOrders.filter(o => {
    if (selectedFilter === 'all_active') {
      return o.status !== 'completed';
    }
    return o.status === selectedFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Status counts for badge indicators
  const countByStatus: Record<string, number> = {};
  PRODUCTION_STAGES.forEach(s => {
    countByStatus[s.status] = activeOrders.filter(o => o.status === s.status).length;
  });
  const inProgressTotal = activeOrders.filter(o => o.status !== 'completed').length;

  return (
    <div className="bg-white border border-slate-200/80 p-5 sm:p-6 rounded-2xl shadow-xs space-y-5 font-sans select-none">
      
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
            <Hammer size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-slate-900">
                Chão de Fábrica Operacional
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                {inProgressTotal} em andamento
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Controle em tempo real sincronizado com as 7 etapas oficiais da página Chão de Fábrica
            </p>
          </div>
        </div>

        <button
          onClick={() => onViewChange('production')}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <Layers size={13} />
          Ver Chão Completo
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Stage Selector Ribbon (100% compatible with ProductionView.tsx) */}
      <div className="overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 min-w-[620px]">
          <button
            type="button"
            onClick={() => {
              setSelectedFilter('all_active');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
              selectedFilter === 'all_active'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <span>Todos Ativos</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedFilter === 'all_active' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {inProgressTotal}
            </span>
          </button>

          {PRODUCTION_STAGES.map(stage => {
            const count = countByStatus[stage.status] || 0;
            const isSelected = selectedFilter === stage.status;
            return (
              <button
                key={stage.status}
                type="button"
                onClick={() => {
                  setSelectedFilter(stage.status);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                  isSelected
                    ? `${stage.bg} ${stage.text} ${stage.color} ring-1 ring-current shadow-xs`
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <span>{stage.stepNumber}. {stage.shortLabel}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${stage.badgeBg} ${stage.text}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Grid */}
      {paginatedOrders.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
          <Sparkles size={24} className="mx-auto text-amber-500/70" />
          <p className="text-xs font-semibold text-slate-700">
            Nenhum artigo religioso nesta etapa do chão de fábrica.
          </p>
          <p className="text-[11px] text-slate-400">
            Avance pedidos das etapas anteriores ou cadastre novos pedidos de venda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {paginatedOrders.map(order => {
            const isPaused = pausedTaskIds.includes(order.id);
            const currentStageObj = PRODUCTION_STAGES.find(s => s.status === order.status) || PRODUCTION_STAGES[0];
            const nextStage = getNextStage(order.status);
            const nextStageObj = nextStage ? PRODUCTION_STAGES.find(s => s.status === nextStage) : null;
            const prevStage = getPrevStage(order.status);

            const itemsCount = (order.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);
            const firstItemName = order.items?.[0]?.productName || 'Artigo Religioso';

            return (
              <div
                key={order.id}
                className={`p-4 rounded-2xl border bg-white shadow-xs flex flex-col justify-between gap-3 transition-all ${
                  isPaused ? 'border-rose-300 bg-rose-50/15' : 'border-slate-200/90 hover:border-amber-300'
                }`}
              >
                <div className="space-y-2">
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                      {order.orderNumber}
                    </span>
                    
                    {isPaused ? (
                      <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-bold rounded-md uppercase tracking-wider flex items-center gap-1 animate-pulse">
                        <AlertTriangle size={10} /> Pausado
                      </span>
                    ) : (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${currentStageObj.bg} ${currentStageObj.text} ${currentStageObj.color}`}>
                        {currentStageObj.shortLabel}
                      </span>
                    )}
                  </div>

                  {/* Client & Product Info */}
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1" title={firstItemName}>
                      {firstItemName}
                      {order.items && order.items.length > 1 && (
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          (+{order.items.length - 1})
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Cliente: <strong className="text-slate-700 font-semibold">{order.clientName}</strong>
                    </p>
                  </div>

                  {/* Artisan & Delivery details */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 space-y-1.5 text-[10px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1">
                        <Users size={11} className="text-slate-400" />
                        Resp:
                      </span>
                      <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                        {order.responsible || 'Bancada do Ateliê'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock size={11} className="text-slate-400" />
                        Entrega:
                      </span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {order.dueDate ? new Date(order.dueDate).toLocaleDateString('pt-BR') : 'A definir'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-1">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 mb-1">
                        <span>Etapa {currentStageObj.stepNumber} de 7</span>
                        <span className="text-amber-700">{order.productionProgress || (currentStageObj.stepNumber * 14)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-linear-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300"
                          style={{ width: `${order.productionProgress || (currentStageObj.stepNumber * 14)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions: Advance, Revert & Pause */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    {/* Pause / Resume Button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePause(order.id, order.orderNumber)}
                      className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-all active:scale-95 shrink-0 ${
                        isPaused 
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                      title={isPaused ? "Retomar Produção" : "Pausar Produção"}
                    >
                      {isPaused ? <Play size={12} /> : <Pause size={12} />}
                    </button>

                    {/* Revert Button if not first stage */}
                    {prevStage && (
                      <button
                        type="button"
                        onClick={() => handlePrevStage(order)}
                        className="p-1.5 rounded-lg border bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 text-xs cursor-pointer transition-all active:scale-95 shrink-0"
                        title="Retornar para a etapa anterior"
                      >
                        <RotateCcw size={12} />
                      </button>
                    )}

                    {/* Advance Button */}
                    {nextStageObj ? (
                      <button
                        type="button"
                        disabled={isPaused}
                        onClick={() => handleNextStage(order)}
                        className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[10px] rounded-lg shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 truncate"
                        title={`Mover para ${nextStageObj.label}`}
                      >
                        <span className="truncate">Avançar: {nextStageObj.shortLabel}</span>
                        <ArrowRight size={11} className="shrink-0" />
                      </button>
                    ) : (
                      <div className="flex-1 py-1.5 px-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px] rounded-lg text-center flex items-center justify-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        Concluído
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <span className="text-[11px] text-slate-500 font-medium">
            Exibindo {paginatedOrders.length} de {filteredOrders.length} pedidos no chão
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-xs flex items-center gap-1"
            >
              <ChevronLeft size={13} />
              Anterior
            </button>
            <span className="text-xs font-bold text-slate-800 px-2 font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-xs flex items-center gap-1"
            >
              Próximo
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
