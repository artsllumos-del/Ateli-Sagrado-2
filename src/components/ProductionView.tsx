import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Order, OrderStatus } from '../types/erp';
import { 
  Play, Check, Calendar, Users, AlertTriangle, ArrowRight, Shield, Archive, 
  Layers, Search, Clock, FileText, CheckCircle2, RotateCcw
} from 'lucide-react';
import { toast } from './Toast';
import { motion, AnimatePresence } from 'motion/react';

export const ProductionView: React.FC = () => {
  const { orders, updateOrder, settings, products, inventory, cancelOrder } = useDb();
  const [activeTab, setActiveTab] = useState<'kanban' | 'archived'>('kanban');
  
  // Settings / Assigning Responsible
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [artisanName, setArtisanName] = useState('');
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  // Search & Filter state for Archived tab
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveFilter, setArchiveFilter] = useState<'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'custom' | 'year'>('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Active orders: Not deleted or cancelled (to show in archive)
  const activeOrders = orders.filter(o => !o.isDeleted || o.isCancelled);

  // Helper to calculate reserved materials for a specific order
  const getOrderMaterials = (order: Order) => {
    const requirements: Record<string, { name: string; quantity: number; unit: string }> = {};
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.composition) {
        prod.composition.forEach(comp => {
          const mat = inventory.find(m => m.id === comp.materialId);
          if (mat) {
            if (!requirements[comp.materialId]) {
              requirements[comp.materialId] = {
                name: mat.name,
                quantity: 0,
                unit: mat.unit
              };
            }
            requirements[comp.materialId].quantity += comp.quantity * item.quantity;
          }
        });
      }
    });
    return Object.values(requirements);
  };

  // Auto-archiving and manual archiving logic helper
  const isOrderArchived = (order: Order): boolean => {
    if (order.isArchived) return true;
    if (order.isCancelled) return true;
    if (order.status !== 'completed' || !order.archivedAt) return false;
    const archivedDate = new Date(order.archivedAt);
    const diffTime = new Date().getTime() - archivedDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays > 30;
  };

  // Main Kanban Lists (Only non-archived, non-deleted orders)
  const kanbanOrders = activeOrders.filter(o => !isOrderArchived(o));
  const archivedOrdersList = activeOrders.filter(o => isOrderArchived(o));

  // The 7 columns order status list
  const stages: { status: OrderStatus; label: string; color: string; bg: string; text: string }[] = [
    { status: 'received', label: 'Pedido Recebido', color: 'border-slate-200', bg: 'bg-slate-50', text: 'text-slate-700' },
    { status: 'approved', label: 'Separação de Materiais', color: 'border-blue-100', bg: 'bg-blue-50/40', text: 'text-blue-700' },
    { status: 'production', label: 'Produção', color: 'border-amber-100', bg: 'bg-amber-50/40', text: 'text-amber-850' },
    { status: 'finishing', label: 'Acabamento', color: 'border-purple-100', bg: 'bg-purple-50/30', text: 'text-purple-700' },
    { status: 'packing', label: 'Embalagem', color: 'border-pink-100', bg: 'bg-pink-50/30', text: 'text-pink-700' },
    { status: 'ready', label: 'Pronto para Entrega', color: 'border-emerald-100', bg: 'bg-emerald-50/30', text: 'text-emerald-700' },
    { status: 'completed', label: 'Concluído', color: 'border-slate-350', bg: 'bg-slate-100/50', text: 'text-slate-800' }
  ];

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

  const handleNextStage = (order: Order) => {
    const next = getNextStage(order.status);
    if (next) {
      updateOrder(order.id, { status: next });
      toast.success("Avanço de Etapa", `Pedido ${order.orderNumber} movido para "${stages.find(s => s.status === next)?.label}".`);
    }
  };

  const handleSetResponsible = (orderId: string) => {
    if (!artisanName.trim()) {
      toast.warning("Aviso", "Por favor, digite o nome do artesão.");
      return;
    }
    updateOrder(orderId, { responsible: artisanName });
    toast.success("Sucesso", "Artesão responsável vinculado com sucesso!");
    setEditingOrderId(null);
    setArtisanName('');
  };

  // Dev Tool: Simulation to instantly archive a completed order
  const handleSimulateArchive = (orderId: string) => {
    // Set archivedAt to 31 days ago
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 31);
    updateOrder(orderId, { archivedAt: pastDate.toISOString(), status: 'completed' });
    toast.success("Simulação de Arquivamento", "Pedido retroagido em 31 dias e arquivado automaticamente.");
  };

  // Restore order back to active Completed status
  const handleRestoreFromArchive = (orderId: string) => {
    updateOrder(orderId, { archivedAt: new Date().toISOString(), isArchived: false });
    toast.success("Pedido Restaurado", "O pedido retornou para o fluxo ativo.");
  };

  // Manual archive trigger
  const handleManualArchive = (orderId: string) => {
    updateOrder(orderId, { isArchived: true });
    toast.success("Pedido Arquivado", "Pedido movido para o histórico de arquivados.");
  };

  // Filter archived orders based on rules
  const getFilteredArchivedOrders = () => {
    return archivedOrdersList.filter(o => {
      // 1. Search Query
      const matchesSearch = 
        o.clientName.toLowerCase().includes(archiveSearch.toLowerCase()) ||
        o.orderNumber.includes(archiveSearch) ||
        o.items.some(item => item.productName.toLowerCase().includes(archiveSearch.toLowerCase()));
      
      if (!matchesSearch) return false;

      // 2. Date/Period Filtering
      if (!o.archivedAt) return true;
      const date = new Date(o.archivedAt);
      const now = new Date();

      switch (archiveFilter) {
        case 'monthly': {
          // Current month
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }
        case 'quarterly': {
          // Last 3 months
          const diffMs = now.getTime() - date.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          return diffDays <= 90;
        }
        case 'semiannual': {
          // Last 6 months
          const diffMs = now.getTime() - date.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          return diffDays <= 180;
        }
        case 'annual': {
          // Last 365 days
          const diffMs = now.getTime() - date.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          return diffDays <= 365;
        }
        case 'year': {
          // Specific Year
          return date.getFullYear().toString() === selectedYear;
        }
        case 'custom': {
          if (!customStart) return true;
          const start = new Date(customStart);
          const end = customEnd ? new Date(customEnd) : new Date();
          end.setHours(23, 59, 59, 999);
          return date >= start && date <= end;
        }
        default:
          return true;
      }
    });
  };

  const filteredArchived = getFilteredArchivedOrders();

  // Stats calculations for non-archived tasks on active floor
  const activeCount = kanbanOrders.length;
  const inProductionCount = kanbanOrders.filter(o => o.status === 'production').length;
  const waitingDelivery = kanbanOrders.filter(o => o.status === 'ready').length;
  const completedActive = kanbanOrders.filter(o => o.status === 'completed').length;

  return (
    <div className="space-y-6 select-none font-sans pb-10">
      
      {/* Header with Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {activeTab === 'kanban' ? 'Chão de Fábrica' : 'Histórico de Arquivados'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === 'kanban' 
              ? 'Acompanhamento em tempo real e evolução das etapas de produção e montagem.' 
              : 'Pedidos concluídos ou arquivados manualmente, preservando o histórico de auditoria.'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'kanban' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={14} />
            Quadro Kanban
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'archived' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Archive size={14} />
            Arquivados ({archivedOrdersList.length})
          </button>
        </div>
      </div>

      {/* KPI Cards Strip (Only for Kanban Tab) */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-650 shrink-0">
              <Layers size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Ativos no Fluxo</p>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">{activeCount}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Play size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Em Produção</p>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">{inProductionCount}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Prontos</p>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">{waitingDelivery}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-700 shrink-0">
              <Check size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Concluídos</p>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">{completedActive}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'kanban' ? (
          <motion.div
            key="kanban-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Vertical Kanban Board with 2 Columns per Row - No Horizontal Scroll */}
            <div className="pb-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {stages.map(stage => {
                  const stageOrders = kanbanOrders.filter(o => o.status === stage.status);

                  // Priority sorting weight: Urgente > Alta > Média > Baixa
                  const priorityWeight = {
                    'Urgente': 4,
                    'Alta': 3,
                    'Média': 2,
                    'Baixa': 1
                  };
                  const sortedStageOrders = [...stageOrders].sort((a, b) => {
                    const weightA = priorityWeight[a.priority || 'Média'] || 2;
                    const weightB = priorityWeight[b.priority || 'Média'] || 2;
                    return weightB - weightA;
                  });

                  return (
                    <div 
                      key={stage.status} 
                      className={`rounded-2xl border ${stage.color} ${stage.bg} p-5 flex flex-col min-h-[300px] shadow-xs`}
                    >
                      {/* Column Header */}
                      <div className="flex justify-between items-center pb-3.5 border-b border-slate-150">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            stage.status === 'received' ? 'bg-slate-400' :
                            stage.status === 'approved' ? 'bg-blue-500' :
                            stage.status === 'production' ? 'bg-amber-500' :
                            stage.status === 'finishing' ? 'bg-purple-500' :
                            stage.status === 'packing' ? 'bg-pink-500' :
                            stage.status === 'ready' ? 'bg-emerald-500' :
                            'bg-slate-700'
                          }`} />
                          <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">{stage.label}</h3>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white border border-slate-100 text-slate-600 shadow-2xs">
                          {stageOrders.length}
                        </span>
                      </div>

                      {/* Cards Container */}
                      <div className="flex-1 mt-4 space-y-4 pr-1">
                        {sortedStageOrders.map(order => {
                          return (
                            <div 
                              key={order.id}
                              className="bg-white border border-slate-150 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all space-y-3 relative group"
                            >
                              {/* Order metadata & Priority dropdown */}
                              <div className="flex justify-between items-center bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[11px] font-bold font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-150/60">
                                  #{order.orderNumber}
                                </span>
                                
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Prioridade:</span>
                                  <select
                                    value={order.priority || 'Média'}
                                    onChange={(e) => {
                                      const newPriority = e.target.value as 'Baixa' | 'Média' | 'Alta' | 'Urgente';
                                      updateOrder(order.id, { priority: newPriority });
                                      toast.success("Prioridade Atualizada", `O pedido ${order.orderNumber} agora é prioridade ${newPriority}.`);
                                    }}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase font-mono border ${
                                      order.priority === 'Urgente' ? 'bg-red-50 border-red-200 text-red-700 font-extrabold' :
                                      order.priority === 'Alta' ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold' :
                                      order.priority === 'Baixa' ? 'bg-slate-100 border-slate-200 text-slate-600' :
                                      'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
                                    } cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400`}
                                  >
                                    <option value="Baixa">Baixa</option>
                                    <option value="Média">Média</option>
                                    <option value="Alta">Alta</option>
                                    <option value="Urgente">Urgente</option>
                                  </select>
                                </div>
                              </div>

                              {/* Products List */}
                              <div className="space-y-1.5 bg-slate-50/35 p-2 rounded-lg border border-slate-100/50">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-xs font-semibold text-slate-800">
                                    <span className="truncate max-w-[220px]">{item.productName}</span>
                                    <span className="text-slate-500 shrink-0">x{item.quantity}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Reserved Materials */}
                              {getOrderMaterials(order).length > 0 && (
                                <div className="bg-amber-50/20 border border-amber-100/45 p-2.5 rounded-xl space-y-1">
                                  <span className="text-[9px] uppercase font-bold text-amber-700 block tracking-wide">
                                    Insumos Reservados:
                                  </span>
                                  <div className="grid grid-cols-1 gap-0.5 text-[10px]">
                                    {getOrderMaterials(order).map((mat, idx) => (
                                      <div key={idx} className="flex justify-between text-slate-600 font-medium">
                                        <span className="truncate max-w-[200px]">✓ {mat.name}</span>
                                        <span className="font-mono text-amber-700 shrink-0">
                                          {mat.quantity.toFixed(1)} {mat.unit}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Client and Metadata */}
                              <div className="text-[11px] space-y-2 text-slate-500 border-t border-slate-100/75 pt-2.5">
                                <p className="font-medium text-slate-700 truncate">
                                  <strong>Cliente:</strong> {order.clientName}
                                </p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                  <p className="flex items-center gap-1 font-mono text-[10px]">
                                    <Calendar size={11} className="text-slate-400 shrink-0" />
                                    <span className={new Date(order.dueDate) < new Date() && order.status !== 'completed' ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                                      Prazo: {order.dueDate ? new Date(order.dueDate).toLocaleDateString('pt-BR') : 'S/D'}
                                    </span>
                                  </p>
                                  <p className="flex items-center gap-1">
                                    <Users size={11} className="text-slate-400 shrink-0" />
                                    <span className="truncate">
                                      Artesão: <strong>{order.responsible || 'Não Atribuído'}</strong>
                                    </span>
                                  </p>
                                </div>
                              </div>

                              {/* Primary advancement or status actions */}
                              <div className="pt-2">
                                {order.status === 'production' && (
                                  <button
                                    onClick={() => {
                                      setEditingOrderId(order.id);
                                      setArtisanName(order.responsible || '');
                                    }}
                                    className="w-full text-center py-1.5 border border-amber-200 bg-amber-50/20 hover:bg-amber-50 text-amber-850 rounded-lg text-[10px] font-bold cursor-pointer transition-colors mb-2"
                                  >
                                    Definir Artesão Responsável
                                  </button>
                                )}

                                {getNextStage(order.status) ? (
                                  <button
                                    onClick={() => handleNextStage(order)}
                                    className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs"
                                  >
                                    <span>Avançar Etapa</span>
                                    <ArrowRight size={11} />
                                  </button>
                                ) : (
                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 justify-center py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                                      <CheckCircle2 size={12} /> Concluído
                                    </span>
                                    
                                    {/* Manual Archive Button for Completed Orders */}
                                    <button
                                      onClick={() => handleManualArchive(order.id)}
                                      className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                                      title="Arquivar pedido concluído manualmente"
                                    >
                                      <Archive size={11} />
                                      <span>Arquivar Pedido</span>
                                    </button>

                                    {/* Simulation shortcut to archive automatically */}
                                    <button
                                      onClick={() => handleSimulateArchive(order.id)}
                                      className="text-[9px] font-mono text-slate-400 hover:text-amber-600 underline cursor-pointer text-center mt-1"
                                      title="Simular passagem de 30 dias para forçar arquivamento automático"
                                    >
                                      Simular +30 dias (Arquivar)
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Actions Available in ALL stages: Arquivar & Cancelar */}
                              <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100/75">
                                <button
                                  onClick={() => handleManualArchive(order.id)}
                                  className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-650 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center justify-center gap-1 border border-slate-150"
                                  title="Arquivar pedido preservando histórico"
                                >
                                  <Archive size={11} />
                                  <span>Arquivar</span>
                                </button>

                                <button
                                  onClick={() => setCancelConfirmId(order.id)}
                                  className="py-1.5 px-2 bg-rose-550 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center justify-center gap-1 border border-rose-600/10 shadow-2xs"
                                  title="Cancelar pedido com estorno de estoque e financeiro"
                                >
                                  <AlertTriangle size={11} />
                                  <span>Cancelar</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {stageOrders.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-100/35">
                            <Clock size={20} className="text-slate-350" />
                            <p className="text-[10px] text-slate-400 italic mt-1.5">Sem pedidos nesta fase</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="archived-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Filter Hub */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row gap-3.5 items-center justify-between">
                
                {/* Search */}
                <div className="relative w-full md:w-80">
                  <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={archiveSearch}
                    onChange={(e) => setArchiveSearch(e.target.value)}
                    placeholder="Buscar por cliente, pedido ou item..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:bg-white text-slate-800"
                  />
                </div>

                {/* Period Select */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {(['monthly', 'quarterly', 'semiannual', 'annual', 'year', 'custom'] as const).map(f => {
                    const labels = {
                      monthly: 'Mensal',
                      quarterly: 'Trimestral',
                      semiannual: 'Semestral',
                      annual: 'Anual',
                      year: 'Ano Específico',
                      custom: 'Personalizado'
                    };
                    return (
                      <button
                        key={f}
                        onClick={() => setArchiveFilter(f)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          archiveFilter === f
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-250'
                        }`}
                      >
                        {labels[f]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Filter Option Controls */}
              {archiveFilter === 'year' && (
                <div className="pt-2 border-t border-slate-50 flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Selecione o Ano:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-bold"
                  >
                    {['2026', '2025', '2024'].map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              )}

              {archiveFilter === 'custom' && (
                <div className="pt-3 border-t border-slate-50 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                    <span>De:</span>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                    <span>Até:</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="px-2 py-1 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Archived Orders List */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-650 uppercase font-mono tracking-wider">
                  Pedidos Arquivados Encontrados ({filteredArchived.length})
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Apenas para consultas e relatórios gerenciais
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredArchived.map(order => (
                  <div 
                    key={order.id} 
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded font-mono border border-slate-200">
                          PEDIDO #{order.orderNumber}
                        </span>
                        <span className="text-xs text-slate-600 font-bold">
                          {order.clientName}
                        </span>
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-650 rounded text-[10px] font-bold border border-slate-200">
                          Total: R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {order.isCancelled && (
                          <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-750 rounded text-[9px] font-bold uppercase font-mono">
                            Cancelado
                          </span>
                        )}
                      </div>

                      {/* Items Row */}
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((it, i) => (
                          <span key={i} className="text-[11px] text-slate-500 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                            {it.productName} (x{it.quantity})
                          </span>
                        ))}
                      </div>

                      <div className="text-[10px] text-slate-450 space-x-4">
                        <span>Responsável: <strong>{order.responsible || 'Não atribuído'}</strong></span>
                        <span>•</span>
                        <span>Prazo original: <strong>{order.dueDate ? new Date(order.dueDate).toLocaleDateString('pt-BR') : 'Sem data'}</strong></span>
                        <span>•</span>
                        <span>Arquivado em: <strong>{order.archivedAt ? new Date(order.archivedAt).toLocaleDateString('pt-BR') : 'Sem data'}</strong></span>
                      </div>
                    </div>

                    {/* Restoration shortcut */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestoreFromArchive(order.id)}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw size={12} />
                        Restaurar Ativo
                      </button>
                    </div>
                  </div>
                ))}

                {filteredArchived.length === 0 && (
                  <div className="p-10 text-center flex flex-col items-center justify-center">
                    <Archive size={32} className="text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400 font-medium italic">Nenhum pedido arquivado encontrado para os filtros selecionados.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL RESPONSIBLE ARTISAN ASSIGNER (Kanban only) */}
      {editingOrderId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up flex flex-col">
            <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Users size={16} className="text-amber-500" />
                Vincular Artesão Responsável
              </h3>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Nome do Artesão / Ourives
                </label>
                <input
                  type="text"
                  required
                  value={artisanName}
                  onChange={(e) => setArtisanName(e.target.value)}
                  placeholder="Ex: Rosana Santos, Francisco Assis"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-150 flex justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setEditingOrderId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSetResponsible(editingOrderId)}
                className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Salvar Vinculação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CANCEL CONFIRMATION */}
      {cancelConfirmId && (() => {
        const orderToCancel = orders.find(o => o.id === cancelConfirmId);
        if (!orderToCancel) return null;
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up flex flex-col">
              <div className="px-5 py-4 border-b border-rose-150 flex items-center justify-between bg-rose-50/50">
                <h3 className="font-bold text-sm text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle size={16} className="text-rose-600 animate-pulse" />
                  Confirmar Cancelamento de Pedido
                </h3>
              </div>

              <div className="p-5 space-y-3.5 text-xs text-slate-650 leading-relaxed">
                <p>
                  Você tem certeza que deseja cancelar o pedido <strong className="text-slate-900 font-bold">#{orderToCancel.orderNumber}</strong> de <strong className="text-slate-900 font-bold">{orderToCancel.clientName}</strong>?
                </p>
                <div className="bg-amber-50 border border-amber-200/60 p-3.5 rounded-xl space-y-2 text-amber-905">
                  <p className="font-extrabold uppercase tracking-wider text-[9px] text-amber-800">Ações que serão executadas automaticamente:</p>
                  <ul className="list-disc list-inside space-y-1.5 text-[10px] font-semibold text-amber-850">
                    <li>Registro do cancelamento com histórico na linha do tempo;</li>
                    <li>Estorno e liberação imediata de todos os insumos e matérias-primas no estoque;</li>
                    <li>Remoção de todas as tarefas de fabricação ligadas ao pedido;</li>
                    <li>Reversão imediata de receitas previstas e custos de produção no Fluxo Financeiro;</li>
                    <li>Atualização em tempo real das métricas e KPIs de faturamento no Dashboard.</li>
                  </ul>
                </div>
                <p className="text-slate-450 italic text-[10.5px]">Essa operação de cancelamento é irreversível e atualizará todos os relatórios do ERP em tempo real.</p>
              </div>

              <div className="p-4 border-t border-slate-150 flex justify-end gap-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setCancelConfirmId(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    cancelOrder(orderToCancel.id);
                    setCancelConfirmId(null);
                    toast.success("Pedido Cancelado", `Pedido ${orderToCancel.orderNumber} cancelado com estorno completo.`);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-750 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                >
                  <Check size={14} />
                  Sim, Cancelar Pedido
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
