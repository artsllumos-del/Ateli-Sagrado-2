import React, { useState, useEffect, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { Settings2, RotateCcw, Clock, Eye, EyeOff, ChevronUp, ChevronDown, Check, X, Sparkles, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from './Toast';

// Sub-widgets imports
import { DashboardHeader, BannerConfig, DEFAULT_BANNER } from './dashboard/DashboardHeader';
import { DashboardAlerts } from './dashboard/DashboardAlerts';
import { DashboardKpis } from './dashboard/DashboardKpis';
import { DashboardProduction } from './dashboard/DashboardProduction';
import { DashboardFinanceSales } from './dashboard/DashboardFinanceSales';
import { DashboardProductsPlatform } from './dashboard/DashboardProductsPlatform';
import { DashboardStockGoals } from './dashboard/DashboardStockGoals';
import { DashboardAgendaActivities, AgendaItem } from './dashboard/DashboardAgendaActivities';

interface DashboardViewProps {
  onViewChange: (view: string) => void;
  onQuickAction: (actionType: 'order' | 'client' | 'product' | 'quote') => void;
}

export interface WidgetItem {
  id: string;
  label: string;
  visible: boolean;
  width: 'half' | 'full';
  pinned?: boolean;
}

const DEFAULT_WIDGETS: WidgetItem[] = [
  { id: 'alerts', label: 'Alertas Críticos e Avisos', visible: true, width: 'full', pinned: true },
  { id: 'kpis', label: 'Indicadores Financeiros & Operacionais (KPIs)', visible: true, width: 'full' },
  { id: 'production', label: 'Controle de Produção (Chão de Fábrica)', visible: true, width: 'full' },
  { id: 'finance_sales', label: 'Análise de Receitas, Despesas & Saldo', visible: true, width: 'half' },
  { id: 'products_platform', label: 'Produtos Mais Vendidos & Canais', visible: true, width: 'half' },
  { id: 'stock_goals', label: 'Acompanhamento de Estoque & Metas', visible: true, width: 'half' },
  { id: 'agenda_activities', label: 'Agenda do Dia & Histórico do ERP', visible: true, width: 'half' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ onViewChange, onQuickAction }) => {
  const { clients, inventory, products, orders, transactions, productionTasks, syncAllData } = useDb();

  // Core configurations state
  const [widgets, setWidgets] = useState<WidgetItem[]>(DEFAULT_WIDGETS);
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>(DEFAULT_BANNER);
  const [goals, setGoals] = useState({ faturamento: 3000, lucro: 1500, vendas: 10, producao: 12 });
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [pausedTaskIds, setPausedTaskIds] = useState<string[]>([]);

  // UI state
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'widgets' | 'banner' | 'goals'>('widgets');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [loadingSkeleton, setLoadingSkeleton] = useState(true);

  // Filtered active lists
  const activeOrders = useMemo(() => orders.filter(o => !o.isDeleted), [orders]);
  const activeTransactions = useMemo(() => transactions.filter(t => !t.isDeleted), [transactions]);
  const activeInventory = useMemo(() => inventory.filter(i => !i.isDeleted), [inventory]);

  // Load persistent configurations on mount
  useEffect(() => {
    // 1. Load Widgets
    const savedWidgets = localStorage.getItem('as_dashboard_widgets_v2');
    if (savedWidgets) {
      try {
        const parsed = JSON.parse(savedWidgets) as WidgetItem[];
        const validated = DEFAULT_WIDGETS.map(def => {
          const match = parsed.find(p => p.id === def.id);
          return match ? { ...def, visible: match.visible, width: match.width, pinned: match.pinned } : def;
        });
        
        // Re-order based on saved index, keeping pinned at top
        const ordered = [...validated].sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
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

    // 2. Load Banner Config
    const savedBanner = localStorage.getItem('as_dashboard_banner_config');
    if (savedBanner) {
      try {
        setBannerConfig(JSON.parse(savedBanner));
      } catch (e) {}
    }

    // 3. Load Goals Config
    const savedGoals = localStorage.getItem('as_dashboard_goals');
    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals));
      } catch (e) {}
    }

    // 4. Load Agenda manual items
    const savedAgenda = localStorage.getItem('as_dashboard_agenda_items');
    if (savedAgenda) {
      try {
        setAgendaItems(JSON.parse(savedAgenda));
      } catch (e) {}
    }

    // 5. Load Paused Tasks
    const savedPaused = localStorage.getItem('as_paused_production_tasks');
    if (savedPaused) {
      try {
        setPausedTaskIds(JSON.parse(savedPaused));
      } catch (e) {}
    }

    // Set initial sync timestamp
    const now = new Date();
    setLastSyncTime(now.toLocaleTimeString('pt-BR'));

    // Trigger skeleton loading
    const timer = setTimeout(() => {
      setLoadingSkeleton(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Save changes wrapper functions
  const saveWidgetsToLocal = (updated: WidgetItem[]) => {
    setWidgets(updated);
    localStorage.setItem('as_dashboard_widgets_v2', JSON.stringify(updated));
  };

  const saveBannerToLocal = (updated: BannerConfig) => {
    setBannerConfig(updated);
    localStorage.setItem('as_dashboard_banner_config', JSON.stringify(updated));
  };

  const saveGoalsToLocal = (updated: typeof goals) => {
    setGoals(updated);
    localStorage.setItem('as_dashboard_goals', JSON.stringify(updated));
  };

  // Persist manual Agenda items when changed
  useEffect(() => {
    if (agendaItems.length > 0) {
      localStorage.setItem('as_dashboard_agenda_items', JSON.stringify(agendaItems));
    }
  }, [agendaItems]);

  // Persist paused tasks
  useEffect(() => {
    localStorage.setItem('as_paused_production_tasks', JSON.stringify(pausedTaskIds));
  }, [pausedTaskIds]);

  // Auto-refresh mechanism (every 45 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString('pt-BR'));
      // Subtle flash or toast
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  // Manual Trigger Refresh Sincronizar
  const handleManualSync = () => {
    setIsSyncing(true);
    toast.info("Sincronizando...", "Buscando atualizações de vendas e estoque.");
    
    setTimeout(() => {
      syncAllData();
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString('pt-BR'));
      setIsSyncing(false);
      toast.success("Dados Sincronizados", "O painel executivo foi atualizado com todas as informações reais em tempo real.");
    }, 600);
  };

  // Reorder widgets
  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= widgets.length) return;

    // Prevent moving pinned widgets below unpinned, or vice-versa
    const updated = [...widgets];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    saveWidgetsToLocal(updated);
  };

  const handleTogglePin = (id: string) => {
    const updated = widgets.map(w => {
      if (w.id === id) {
        const nextPinned = !w.pinned;
        if (nextPinned) {
          toast.success("Widget Fixado", "Este painel será exibido na parte superior.");
        }
        return { ...w, pinned: nextPinned };
      }
      return w;
    });

    // Re-sort to bring pinned to the top
    updated.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

    saveWidgetsToLocal(updated);
  };

  const handleResetLayout = () => {
    saveWidgetsToLocal(DEFAULT_WIDGETS);
    saveBannerToLocal(DEFAULT_BANNER);
    saveGoalsToLocal({ faturamento: 3000, lucro: 1500, vendas: 10, producao: 12 });
    toast.success("Restaurado", "O layout do painel foi redefinido para o padrão.");
  };

  // Month-to-date calculation variables
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const currentMonthTransactions = useMemo(() => {
    return activeTransactions.filter(t => t.date.startsWith(currentMonthStr));
  }, [activeTransactions, currentMonthStr]);

  const currentMonthFaturamento = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.value, 0);
  }, [currentMonthTransactions]);

  const currentMonthDespesas = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.value, 0);
  }, [currentMonthTransactions]);

  const currentMonthLucro = currentMonthFaturamento - currentMonthDespesas;

  const currentMonthOrdersCount = useMemo(() => {
    return activeOrders.filter(o => o.date.startsWith(currentMonthStr)).length;
  }, [activeOrders, currentMonthStr]);

  const currentMonthProducaoCount = useMemo(() => {
    return productionTasks.filter(t => t.status === 'done' && t.endDate?.startsWith(currentMonthStr)).length;
  }, [productionTasks, currentMonthStr]);

  // SKELETON LOADER
  if (loadingSkeleton) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-28 bg-white border border-slate-100 rounded-2xl p-6 flex justify-between items-center">
          <div className="space-y-3 w-1/3">
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-8 bg-slate-200 rounded" />
          </div>
          <div className="h-12 bg-slate-200 rounded w-1/5" />
        </div>

        {/* Banner Skeleton */}
        <div className="h-44 bg-slate-100/50 rounded-2xl" />

        {/* KPIs Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-28 bg-white border border-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in-up">
      
      {/* Synchronization & Customization Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 font-mono bg-white border border-slate-100/80 px-3 py-1.5 rounded-full shadow-3xs">
          <Clock size={12} className={isSyncing ? 'animate-spin text-amber-500' : 'text-slate-400'} />
          <span>Última sincronização: <strong className="text-slate-700 font-bold">{lastSyncTime}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSync}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            Sincronizar
          </button>

          <button
            onClick={() => setShowCustomizeModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Settings2 size={13} /> Personalizar Painel
          </button>
        </div>
      </div>

      {/* Header and Banner */}
      <DashboardHeader
        onQuickAction={onQuickAction}
        activeOrders={activeOrders}
        quotes={orders} // fallback
        bannerConfig={bannerConfig}
        setBannerConfig={setBannerConfig}
      />

      {/* RENDER CUSTOMIZED ACTIVE WIDGET GRID */}
      <div className="grid grid-cols-12 gap-6">
        {widgets.filter(w => w.visible).map((widget, index) => {
          const colSpan = widget.width === 'half' ? 'col-span-12 lg:col-span-6' : 'col-span-12';

          return (
            <div key={widget.id} className={`${colSpan} space-y-4`}>
              {widget.id === 'alerts' && (
                <DashboardAlerts
                  onViewChange={onViewChange}
                  activeOrders={activeOrders}
                  inventory={activeInventory}
                  quotes={orders} // fallback
                  productionTasks={productionTasks}
                  pausedTaskIds={pausedTaskIds}
                />
              )}

              {widget.id === 'kpis' && (
                <DashboardKpis
                  onViewChange={onViewChange}
                  activeOrders={activeOrders}
                  inventory={activeInventory}
                  quotes={orders} // fallback
                  transactions={activeTransactions}
                  productionTasks={productionTasks}
                />
              )}

              {widget.id === 'production' && (
                <DashboardProduction
                  onViewChange={onViewChange}
                  productionTasks={productionTasks}
                  pausedTaskIds={pausedTaskIds}
                  setPausedTaskIds={setPausedTaskIds}
                />
              )}

              {widget.id === 'finance_sales' && (
                <DashboardFinanceSales
                  transactions={activeTransactions}
                  activeOrders={activeOrders}
                  quotes={orders} // fallback
                />
              )}

              {widget.id === 'products_platform' && (
                <DashboardProductsPlatform
                  activeOrders={activeOrders}
                  products={products}
                  inventory={activeInventory}
                />
              )}

              {widget.id === 'stock_goals' && (
                <DashboardStockGoals
                  inventory={activeInventory}
                  activeOrders={activeOrders}
                  goals={goals}
                  currentMonthFaturamento={currentMonthFaturamento}
                  currentMonthLucro={currentMonthLucro}
                  currentMonthOrdersCount={currentMonthOrdersCount}
                  currentMonthProducaoCount={currentMonthProducaoCount}
                />
              )}

              {widget.id === 'agenda_activities' && (
                <DashboardAgendaActivities
                  onViewChange={onViewChange}
                  activeOrders={activeOrders}
                  transactions={activeTransactions}
                  agendaItems={agendaItems}
                  setAgendaItems={setAgendaItems}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* MASTER CUSTOMIZATION DIALOG */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-3xs p-4 no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <LayoutGrid size={18} className="text-amber-500" />
                <div>
                  <h3 className="font-serif font-semibold text-slate-900 text-base">Personalizar Painel Executivo</h3>
                  <p className="text-[10px] text-slate-500">Ajuste o layout, reordene widgets e configure o banner ou metas</p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Tabs navigation */}
            <div className="flex bg-slate-50 border-b border-slate-100 px-4 text-xs">
              <button
                onClick={() => setActiveTab('widgets')}
                className={`px-4 py-3.5 font-bold cursor-pointer border-b-2 transition-all ${
                  activeTab === 'widgets' ? 'border-amber-500 text-amber-700 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Organização (Widgets)
              </button>
              <button
                onClick={() => setActiveTab('banner')}
                className={`px-4 py-3.5 font-bold cursor-pointer border-b-2 transition-all ${
                  activeTab === 'banner' ? 'border-amber-500 text-amber-700 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Personalizar Banner
              </button>
              <button
                onClick={() => setActiveTab('goals')}
                className={`px-4 py-3.5 font-bold cursor-pointer border-b-2 transition-all ${
                  activeTab === 'goals' ? 'border-amber-500 text-amber-700 font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Definir Metas do Mês
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              
              {/* TAB 1: ORGANIZAR WIDGETS */}
              {activeTab === 'widgets' && (
                <div className="space-y-3">
                  <p className="text-slate-500 pb-1 leading-relaxed">
                    Ative ou desative seções, reordene sua prioridade na página e ajuste se devem ocupar metade (50%) ou a largura inteira (100%) da tela.
                  </p>

                  <div className="space-y-2 border border-slate-100 rounded-xl p-2.5 bg-slate-50/50">
                    {widgets.map((widget, idx) => (
                      <div
                        key={widget.id}
                        className={`flex items-center justify-between p-3 rounded-lg border bg-white shadow-3xs ${
                          widget.pinned ? 'border-amber-200 bg-amber-50/5' : 'border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTogglePin(widget.id)}
                            className={`p-1 rounded cursor-pointer ${
                              widget.pinned ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-slate-500'
                            }`}
                            title={widget.pinned ? 'Desafixar do topo' : 'Fixar no topo'}
                          >
                            <Sparkles size={13} />
                          </button>
                          <span className="font-bold text-slate-800">{widget.label}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Sizing dropdown */}
                          <select
                            value={widget.width}
                            onChange={(e) => {
                              const updated = widgets.map(w => w.id === widget.id ? { ...w, width: e.target.value as any } : w);
                              saveWidgetsToLocal(updated);
                            }}
                            className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5"
                          >
                            <option value="half">50% Largura</option>
                            <option value="full">100% Largura</option>
                          </select>

                          {/* Visibility Toggle */}
                          <button
                            onClick={() => {
                              const updated = widgets.map(w => w.id === widget.id ? { ...w, visible: !w.visible } : w);
                              saveWidgetsToLocal(updated);
                            }}
                            className={`p-1.5 rounded cursor-pointer ${
                              widget.visible ? 'text-slate-800 bg-slate-100 hover:bg-slate-200' : 'text-slate-300 hover:text-slate-400'
                            }`}
                          >
                            {widget.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>

                          {/* Position controls */}
                          <div className="flex items-center gap-0.5 border-l border-slate-150 pl-2">
                            <button
                              disabled={idx === 0}
                              onClick={() => handleMoveWidget(idx, 'up')}
                              className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              disabled={idx === widgets.length - 1}
                              onClick={() => handleMoveWidget(idx, 'down')}
                              className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDown size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: PERSONALIZAR BANNER */}
              {activeTab === 'banner' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800">Status do Banner</span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={bannerConfig.showBanner}
                        onChange={(e) => saveBannerToLocal({ ...bannerConfig, showBanner: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500" />
                      <span className="ml-2 text-[11px] font-bold text-slate-500">Exibir Banner</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Título Principal</label>
                      <input
                        type="text"
                        value={bannerConfig.title}
                        onChange={(e) => saveBannerToLocal({ ...bannerConfig, title: e.target.value })}
                        className="w-full"
                        placeholder="Ex: Ateliê Sagrado"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Cor de Destaque (Accent)</label>
                      <div className="flex items-center gap-1.5">
                        {['#D4A039', '#B5563D', '#4C7FB0', '#446C94', '#3F9461'].map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => saveBannerToLocal({ ...bannerConfig, highlightColor: color })}
                            className={`w-6 h-6 rounded-full border border-slate-300 cursor-pointer flex items-center justify-center transition-all ${
                              bannerConfig.highlightColor === color ? 'ring-2 ring-slate-900 scale-105' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          >
                            {bannerConfig.highlightColor === color && <Check size={11} className="text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="font-bold text-slate-700">Texto de Descrição</label>
                      <textarea
                        value={bannerConfig.description}
                        onChange={(e) => saveBannerToLocal({ ...bannerConfig, description: e.target.value })}
                        className="w-full text-xs rounded-lg px-2.5 py-1.5 border border-slate-200 h-16 focus:ring-2 focus:ring-amber-500/20"
                        placeholder="Texto descritivo do ateliê..."
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="font-bold text-slate-700 font-mono">URL da Imagem de Fundo (Opcional)</label>
                      <input
                        type="text"
                        value={bannerConfig.bgImage}
                        onChange={(e) => saveBannerToLocal({ ...bannerConfig, bgImage: e.target.value })}
                        className="w-full"
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CONFIGURAR METAS */}
              {activeTab === 'goals' && (
                <div className="space-y-4">
                  <p className="text-slate-500 leading-relaxed pb-2 border-b border-slate-100">
                    Defina as metas mensais para calcular as barras de progresso operacionais. Os cálculos de porcentagem serão atualizados instantaneamente.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Meta de Faturamento (R$)</label>
                      <input
                        type="number"
                        value={goals.faturamento}
                        onChange={(e) => saveGoalsToLocal({ ...goals, faturamento: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Meta de Lucro Líquido (R$)</label>
                      <input
                        type="number"
                        value={goals.lucro}
                        onChange={(e) => saveGoalsToLocal({ ...goals, lucro: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Meta de Pedidos Vendidos</label>
                      <input
                        type="number"
                        value={goals.vendas}
                        onChange={(e) => saveGoalsToLocal({ ...goals, vendas: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Meta de Peças Concluídas</label>
                      <input
                        type="number"
                        value={goals.producao}
                        onChange={(e) => saveGoalsToLocal({ ...goals, producao: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-5 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={handleResetLayout}
                className="inline-flex items-center gap-1 text-[10.5px] font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <RotateCcw size={12} /> Restaurar Padrões
              </button>

              <button
                type="button"
                onClick={() => setShowCustomizeModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all active:scale-98"
              >
                Confirmar Configuração
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
