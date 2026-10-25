import React, { useState, useEffect, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { Settings2, RotateCcw, Clock, Eye, EyeOff, ChevronUp, ChevronDown, Check, X, Sparkles, LayoutGrid, Package, ShoppingBag, Users, FileText, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from './Toast';
import { Tabs, Button, Skeleton } from './ui';

// Sub-widgets imports
import { DashboardHeader, BannerConfig, DEFAULT_BANNER } from './dashboard/DashboardHeader';
import { DashboardAlerts } from './dashboard/DashboardAlerts';
import { DashboardKpis, DashboardPeriod } from './dashboard/DashboardKpis';
import { DashboardProduction } from './dashboard/DashboardProduction';
import { DashboardFinanceSales } from './dashboard/DashboardFinanceSales';
import { DashboardProductsPlatform } from './dashboard/DashboardProductsPlatform';
import { DashboardStockGoals } from './dashboard/DashboardStockGoals';
import { DashboardAgendaActivities, AgendaItem } from './dashboard/DashboardAgendaActivities';

interface DashboardViewProps {
  onViewChange: (view: string, params?: Record<string, any>) => void;
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
  const { clients, inventory, products, orders, quotes, transactions, productionTasks, syncAllData } = useDb();

  // Core configurations state
  const [widgets, setWidgets] = useState<WidgetItem[]>(DEFAULT_WIDGETS);
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>(DEFAULT_BANNER);
  const [goals, setGoals] = useState({ faturamento: 3000, lucro: 1500, vendas: 10, producao: 12 });
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [pausedTaskIds, setPausedTaskIds] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('mes');

  // UI state
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
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
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2.5 w-full sm:w-1/3">
            <Skeleton width="40%" height={16} />
            <Skeleton width="75%" height={28} />
          </div>
          <div className="w-full sm:w-1/4">
            <Skeleton width="100%" height={40} variant="rectangular" />
          </div>
        </div>

        {/* Banner Skeleton */}
        <Skeleton height={140} variant="card" />

        {/* KPIs Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-3">
              <Skeleton width="50%" height={14} />
              <Skeleton width="80%" height={24} />
              <Skeleton width="35%" height={12} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in-up">
      
      {/* Synchronization & Customization Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print bg-slate-50/60 p-2 rounded-2xl border border-slate-100">
        {/* Global Period Selector */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/70 shadow-3xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Período:</span>
          {(['hoje', '7d', 'mes', 'ano', 'todos'] as DashboardPeriod[]).map((p) => {
            const labels: Record<DashboardPeriod, string> = {
              hoje: 'Hoje',
              '7d': '7 Dias',
              mes: 'Este Mês',
              ano: 'Ano Atual',
              todos: 'Histórico Completo'
            };
            const isSelected = selectedPeriod === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPeriod(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 font-mono bg-white border border-slate-200/70 px-3 py-1.5 rounded-xl shadow-3xs">
            <Clock size={12} className={isSyncing ? 'animate-spin text-amber-500' : 'text-slate-400'} />
            <span>Sincronizado: <strong className="text-slate-700 font-bold">{lastSyncTime}</strong></span>
          </div>

          <button
            onClick={handleManualSync}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-3xs"
          >
            Sincronizar
          </button>

          <button
            onClick={() => setShowCustomizePanel(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all ${
              showCustomizePanel 
                ? 'bg-amber-600 text-white ring-2 ring-amber-400' 
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
            title="Ajustar layout e configurações na página sem pop-up"
          >
            <Settings2 size={13} /> {showCustomizePanel ? 'Fechar Ajustes' : 'Personalizar'}
          </button>
        </div>
      </div>

      {/* INLINE CUSTOMIZATION PANEL (No intrusive pop-up to preserve page scroll & user workflow) */}
      <AnimatePresence>
        {showCustomizePanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
            id="painel-personalizacao-inline"
          >
            <div className="bg-white border-2 border-amber-400/70 rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                    <LayoutGrid size={16} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                      Personalizar Painel Executivo
                      <span className="text-[10px] font-sans font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        Edição em Tempo Real
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Reorganize widgets, ajuste larguras e configure banners e metas diretamente na página (sem pop-up).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<RotateCcw size={13} />}
                    onClick={handleResetLayout}
                  >
                    Restaurar Padrões
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowCustomizePanel(false)}
                  >
                    Concluir Ajustes
                  </Button>
                </div>
              </div>

              {/* Tabs navigation */}
              <div className="pt-1">
                <Tabs
                  variant="pills"
                  size="sm"
                  tabs={[
                    { id: 'widgets', label: 'Organização (Widgets)' },
                    { id: 'banner', label: 'Personalizar Banner' },
                    { id: 'goals', label: 'Definir Metas do Mês' },
                  ]}
                  activeTab={activeTab}
                  onChange={(id) => setActiveTab(id as any)}
                />
              </div>

              {/* Tab Content */}
              <div className="space-y-4 text-xs pt-1">
                {/* TAB 1: ORGANIZAR WIDGETS */}
                {activeTab === 'widgets' && (
                  <div className="space-y-3">
                    <p className="text-slate-500 leading-relaxed">
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
                              title={widget.visible ? 'Ocultar widget' : 'Exibir widget'}
                            >
                              {widget.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                            </button>

                            {/* Position controls */}
                            <div className="flex items-center gap-0.5 border-l border-slate-150 pl-2">
                              <button
                                disabled={idx === 0}
                                onClick={() => handleMoveWidget(idx, 'up')}
                                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                                title="Mover para cima"
                              >
                                <ChevronUp size={13} />
                              </button>
                              <button
                                disabled={idx === widgets.length - 1}
                                onClick={() => handleMoveWidget(idx, 'down')}
                                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                                title="Mover para baixo"
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
                          className="w-full text-xs rounded-lg px-2.5 py-1.5 border border-slate-200 focus:ring-1 focus:ring-amber-500"
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
                          className="w-full text-xs rounded-lg px-2.5 py-1.5 border border-slate-200 h-16 focus:ring-1 focus:ring-amber-500"
                          placeholder="Texto descritivo do ateliê..."
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="font-bold text-slate-700 font-mono">URL da Imagem de Fundo (Opcional)</label>
                        <input
                          type="text"
                          value={bannerConfig.bgImage}
                          onChange={(e) => saveBannerToLocal({ ...bannerConfig, bgImage: e.target.value })}
                          className="w-full text-xs rounded-lg px-2.5 py-1.5 border border-slate-200 focus:ring-1 focus:ring-amber-500"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Meta de Faturamento (R$)</label>
                        <input
                          type="number"
                          value={goals.faturamento}
                          onChange={(e) => saveGoalsToLocal({ ...goals, faturamento: Number(e.target.value) })}
                          className="w-full text-xs rounded-lg px-2.5 py-1.5 border border-slate-200 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Meta de Lucro Líquido (R$)</label>
                        <input
                          type="number"
                          value={goals.lucro}
                          onChange={(e) => saveGoalsToLocal({ ...goals, lucro: Number(e.target.value) })}
                          className="w-full text-xs rounded-lg px-2.5 py-1.5 border border-slate-200 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Meta de Pedidos Vendidos</label>
                        <input
                          type="number"
                          value={goals.vendas}
                          onChange={(e) => saveGoalsToLocal({ ...goals, vendas: Number(e.target.value) })}
                          className="w-full text-xs rounded-lg px-2.5 py-1.5 border border-slate-200 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700">Meta de Peças Concluídas</label>
                        <input
                          type="number"
                          value={goals.producao}
                          onChange={(e) => saveGoalsToLocal({ ...goals, producao: Number(e.target.value) })}
                          className="w-full text-xs rounded-lg px-2.5 py-1.5 border border-slate-200 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Banner */}
      <DashboardHeader
        onQuickAction={onQuickAction}
        activeOrders={activeOrders}
        quotes={quotes}
        bannerConfig={bannerConfig}
        setBannerConfig={setBannerConfig}
      />

      {/* ONBOARDING GUIDANCE CARD FOR CLEAN PRODUCTION ACCOUNTS */}
      {clients.length === 0 && activeInventory.length === 0 && products.length === 0 && activeOrders.length === 0 && (
        <div className="mb-6 bg-gradient-to-br from-amber-50/90 via-white to-stone-50 border-2 border-amber-300/80 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-amber-200/60 pb-4 mb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-2">
                <Sparkles size={13} /> Ambiente Limpo Pronto para Produção
              </div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Boas-vindas ao Ateliê Sagrado ERP
              </h2>
              <p className="text-xs text-stone-600 mt-1">
                Sua conta foi inicializada sem registros operacionais de demonstração. Siga o fluxo passo a passo para começar a operar:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => onViewChange('inventory')}
              className="p-4 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-105 transition-transform">
                  <Package size={18} />
                </div>
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Passo 1</div>
                <h3 className="font-bold text-sm text-stone-900">Cadastrar Insumos</h3>
                <p className="text-[11px] text-stone-500 mt-1">Pérolas, fios, metais, cruzes e materiais base para estoque.</p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:text-amber-800">
                <span>Ir para Estoque</span> <ArrowRight size={13} />
              </div>
            </button>

            <button
              onClick={() => onViewChange('products')}
              className="p-4 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-105 transition-transform">
                  <ShoppingBag size={18} />
                </div>
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Passo 2</div>
                <h3 className="font-bold text-sm text-stone-900">Cadastrar Produtos</h3>
                <p className="text-[11px] text-stone-500 mt-1">Defina composição de matérias-primas, mão de obra e preço de venda.</p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:text-amber-800">
                <span>Ir para Produtos</span> <ArrowRight size={13} />
              </div>
            </button>

            <button
              onClick={() => onViewChange('clients')}
              className="p-4 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-105 transition-transform">
                  <Users size={18} />
                </div>
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Passo 3</div>
                <h3 className="font-bold text-sm text-stone-900">Cadastrar Clientes</h3>
                <p className="text-[11px] text-stone-500 mt-1">Pessoas Físicas, noivas, paróquias ou lojistas parceiros.</p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:text-amber-800">
                <span>Ir para Clientes</span> <ArrowRight size={13} />
              </div>
            </button>

            <button
              onClick={() => onViewChange('quotes')}
              className="p-4 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm mb-3 group-hover:scale-105 transition-transform">
                  <FileText size={18} />
                </div>
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Passo 4</div>
                <h3 className="font-bold text-sm text-stone-900">Emitir Orçamento</h3>
                <p className="text-[11px] text-stone-500 mt-1">Crie propostas comerciais e converta em ordens de produção.</p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:text-amber-800">
                <span>Ir para Orçamentos</span> <ArrowRight size={13} />
              </div>
            </button>
          </div>
        </div>
      )}

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
                  quotes={quotes}
                  productionTasks={productionTasks}
                  pausedTaskIds={pausedTaskIds}
                />
              )}

              {widget.id === 'kpis' && (
                <DashboardKpis
                  onViewChange={onViewChange}
                  activeOrders={activeOrders}
                  inventory={activeInventory}
                  quotes={quotes}
                  transactions={activeTransactions}
                  productionTasks={productionTasks}
                  period={selectedPeriod}
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
                  quotes={quotes}
                />
              )}

              {widget.id === 'products_platform' && (
                <DashboardProductsPlatform
                  activeOrders={activeOrders}
                  products={products}
                  inventory={activeInventory}
                  transactions={activeTransactions}
                  onViewChange={onViewChange}
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
                  onViewChange={onViewChange}
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

    </div>
  );
};
