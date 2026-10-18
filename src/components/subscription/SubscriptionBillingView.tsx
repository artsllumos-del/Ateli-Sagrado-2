import React, { useState, useMemo } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { useDb } from '../../context/DbContext';
import { toast } from '../Toast';
import { Pagination } from '../Pagination';
import { 
  Sparkles, 
  CheckCircle, 
  ShieldCheck, 
  Check, 
  Printer,
  Infinity as InfinityIcon,
  Package,
  ShoppingCart,
  FileText,
  Users,
  Hammer,
  TrendingUp,
  RotateCw,
  AlertTriangle,
  Clock,
  Calendar,
  Zap,
  Info,
  BadgePercent,
  ArrowUpRight
} from 'lucide-react';
import { BillingInvoice, BillingCycle } from '../../domain/types/auth';

interface CycleOption {
  cycle: BillingCycle;
  name: string;
  durationLabel: string;
  durationDays: number;
  totalPrice: number;
  monthlyEquivalent: number;
  discountPercent: number;
  discountSavings: number;
  badge?: string;
  popular?: boolean;
}

const CYCLE_OPTIONS: CycleOption[] = [
  {
    cycle: 'monthly',
    name: 'Mensal',
    durationLabel: '30 dias de acesso',
    durationDays: 30,
    totalPrice: 49.90,
    monthlyEquivalent: 49.90,
    discountPercent: 0,
    discountSavings: 0,
    badge: 'Ciclo Padrão'
  },
  {
    cycle: 'quarterly',
    name: 'Trimestral',
    durationLabel: '90 dias (3 meses)',
    durationDays: 90,
    totalPrice: 134.70,
    monthlyEquivalent: 44.90,
    discountPercent: 10,
    discountSavings: 15.00,
    badge: '10% de Desconto'
  },
  {
    cycle: 'semiannual',
    name: 'Semestral',
    durationLabel: '180 dias (6 meses)',
    durationDays: 180,
    totalPrice: 239.50,
    monthlyEquivalent: 39.90,
    discountPercent: 20,
    discountSavings: 59.90,
    badge: '20% OFF • Mais Popular',
    popular: true
  },
  {
    cycle: 'annual',
    name: 'Anual',
    durationLabel: '365 dias (12 meses)',
    durationDays: 365,
    totalPrice: 419.00,
    monthlyEquivalent: 34.90,
    discountPercent: 30,
    discountSavings: 179.80,
    badge: '30% OFF • Maior Economia'
  }
];

interface SubscriptionBillingViewProps {
  onNavigate?: (view: string) => void;
}

export const SubscriptionBillingView: React.FC<SubscriptionBillingViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices'>('overview');
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly');
  const [isRenewing, setIsRenewing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { 
    subscription, 
    invoices, 
    daysUntilRenewal,
    isExpired,
    renewSubscription,
    simulateStatus
  } = useSubscription();

  const { products, orders, quotes, inventory, clients } = useDb();

  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(null);
  const [invoiceFilterYear, setInvoiceFilterYear] = useState<string>('all');

  // Real assertive counts of registered non-deleted items in the studio
  const activeProducts = useMemo(() => (products || []).filter(p => !p.isDeleted), [products]);
  const activeOrders = useMemo(() => (orders || []).filter(o => !o.isDeleted), [orders]);
  const activeQuotes = useMemo(() => (quotes || []).filter(q => !q.isDeleted), [quotes]);
  const activeClients = useMemo(() => (clients || []).filter(c => !c.isDeleted), [clients]);
  const activeInventory = useMemo(() => (inventory || []).filter(i => !i.isDeleted), [inventory]);

  // Find currently chosen cycle option
  const activeCycleOption = CYCLE_OPTIONS.find(c => c.cycle === selectedCycle) || CYCLE_OPTIONS[0];

  // Calculate percentage of 30-day period remaining
  const currentDaysLeft = isExpired ? 0 : Math.max(0, daysUntilRenewal);
  const totalDaysInCurrentCycle = subscription?.billingCycle === 'annual' 
    ? 365 
    : subscription?.billingCycle === 'semiannual' 
      ? 180 
      : subscription?.billingCycle === 'quarterly' 
        ? 90 
        : 30;

  const progressPercent = Math.min(100, Math.max(5, Math.round((currentDaysLeft / totalDaysInCurrentCycle) * 100)));

  // Format dates
  const formatDateBR = (iso?: string) => {
    if (!iso) return '--/--/----';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return iso;
    }
  };

  const handleExecuteRenewal = async () => {
    setIsRenewing(true);
    try {
      await renewSubscription(selectedCycle);
      toast.success(
        'Assinatura Renovada com Sucesso!',
        `Seu plano foi renovado no ciclo ${activeCycleOption.name} (+${activeCycleOption.durationDays} dias). Acesso integral garantido!`
      );
      setShowConfirmModal(false);
    } catch {
      toast.error('Erro ao Renovar', 'Não foi possível renovar a assinatura no momento.');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleSimulateExpired = async () => {
    try {
      await simulateStatus('expired');
      toast.warning(
        'Modo Limitado Ativado (Simulação)',
        'A assinatura foi marcada como expirada para testar o comportamento do Modo Limitado.'
      );
    } catch {
      toast.error('Erro', 'Não foi possível alterar o status.');
    }
  };

  const handleRestoreActive = async () => {
    try {
      await simulateStatus('active');
      toast.success(
        'Assinatura Reativada!',
        'Sua assinatura de 30 dias está ativa novamente com acesso completo a todos os recursos.'
      );
    } catch {
      toast.error('Erro', 'Não foi possível reativar.');
    }
  };

  // Invoice filtering
  const filteredInvoices = (invoices || []).filter(inv => {
    if (invoiceFilterYear === 'all') return true;
    return (inv.date || '').startsWith(invoiceFilterYear);
  });

  const [invoicesPage, setInvoicesPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(5);
  const paginatedInvoices = filteredInvoices.slice(
    (invoicesPage - 1) * invoicesPerPage,
    invoicesPage * invoicesPerPage
  );

  return (
    <div className="space-y-6 pb-12 font-sans select-none">
      
      {/* Top Header & Tab Navigation Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
              Assinatura
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão de validade da assinatura de 30 dias, ciclos de renovação com desconto e controle de acesso integral.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold animate-pulse">
                <AlertTriangle size={15} className="text-amber-600" />
                Vencida • Modo Limitado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <ShieldCheck size={15} className="text-emerald-600" />
                Assinatura Válida • Acesso Integral
              </span>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <Sparkles size={15} />
            Visão Geral & Renovação
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <FileText size={15} />
            Faturas & Recibos
          </button>
        </div>
      </div>

      {/* EXPIRED BANNER (If in limited mode) */}
      {isExpired && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} className="text-amber-700" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-amber-950 text-base">
                Sua Assinatura Expirou — Conta Operando no Modo Limitado
              </h3>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                Todos os seus dados históricos (produtos, insumos, clientes, pedidos e finanças) continuam <strong>100% seguros e preservados</strong>. No Modo Limitado, novas inserções de produtos, orçamentos e pedidos de venda estão temporariamente pausadas até a renovação.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/80">
            <button
              onClick={() => {
                const el = document.getElementById('renewal-plans-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Zap size={14} />
              Escolher Período e Renovar Agora
            </button>
            <button
              onClick={handleRestoreActive}
              className="px-3 py-2 bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Restaurar Validade de 30 Dias
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: VISÃO GERAL & RENOVAÇÃO */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Main Status & Validity Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                  <Clock size={12} className="text-slate-500" />
                  Status da Validade
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900">
                  {isExpired ? 'Assinatura Vencida (0 dias restantes)' : `Assinatura Válida • ${currentDaysLeft} dias restantes`}
                </h3>
                <p className="text-xs text-slate-500">
                  Período atual: <strong>{formatDateBR(subscription?.currentPeriodStart)}</strong> até <strong>{formatDateBR(subscription?.currentPeriodEnd)}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isExpired ? (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-2"
                  >
                    <RotateCw size={15} />
                    Renovar Assinatura Agora
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Zap size={15} className="text-amber-400" />
                    Estender / Renovar Assinatura
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-600">Tempo restante no ciclo</span>
                <span className={isExpired ? 'text-amber-600 font-bold' : 'text-slate-900 font-bold'}>
                  {isExpired ? 'Expirado' : `${currentDaysLeft} de ${totalDaysInCurrentCycle} dias`}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isExpired 
                      ? 'bg-amber-500 w-full' 
                      : currentDaysLeft <= 5 
                        ? 'bg-amber-500' 
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: isExpired ? '100%' : `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Info notice about 30 days validation */}
            <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs text-slate-600">
              <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
              <p>
                A assinatura padrão é válida por <strong>30 dias</strong>. Você pode renovar a qualquer momento para estender o acesso integral. Abaixo, escolha o ciclo desejado — planos mais longos contam com descontos especiais de até <strong>30%</strong>.
              </p>
            </div>
          </div>

          {/* RENEWAL PLANS & DISCOUNT SELECTOR */}
          <div id="renewal-plans-section" className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 text-[11px] font-bold">
                <BadgePercent size={13} className="text-amber-600" />
                Opções de Renovação com Desconto
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-900">
                Selecione o Ciclo para Renovação
              </h3>
              <p className="text-xs text-slate-500">
                Garanta acesso ininterrupto para o seu ateliê. Escolha o período que melhor atende à sua produção.
              </p>
            </div>

            {/* 4 Cards Grid: Monthly, Quarterly, Semiannual, Annual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CYCLE_OPTIONS.map(opt => {
                const isSelected = selectedCycle === opt.cycle;
                return (
                  <div
                    key={opt.cycle}
                    onClick={() => setSelectedCycle(opt.cycle)}
                    className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/30 shadow-md ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Badge */}
                    {opt.badge && (
                      <div className="absolute -top-3 left-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-2xs ${
                          opt.popular
                            ? 'bg-amber-600 text-white'
                            : opt.discountPercent > 0
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-white'
                        }`}>
                          {opt.badge}
                        </span>
                      </div>
                    )}

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-base text-slate-900">
                          {opt.name}
                        </h4>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500">
                        {opt.durationLabel}
                      </p>

                      <div className="pt-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs text-slate-400 font-medium">R$</span>
                          <span className="text-2xl font-bold font-mono text-slate-900">
                            {opt.monthlyEquivalent.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">/mês</span>
                        </div>
                        {opt.discountPercent > 0 ? (
                          <p className="text-[11px] text-emerald-700 font-medium mt-1">
                            Total: R$ {opt.totalPrice.toFixed(2).replace('.', ',')} (economize R$ {opt.discountSavings.toFixed(2).replace('.', ',')})
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500 font-medium mt-1">
                            Total: R$ {opt.totalPrice.toFixed(2).replace('.', ',')} por ciclo
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <CheckCircle size={13} className="shrink-0" />
                        <span>Acesso 100% irrestrito</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar size={13} className="shrink-0" />
                        <span>+{opt.durationDays} dias no vencimento</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Bar for selected cycle */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <p className="text-xs text-amber-300 font-semibold">
                  Plano Selecionado: <strong>{activeCycleOption.name} ({activeCycleOption.durationLabel})</strong>
                </p>
                <p className="text-sm font-medium text-slate-200">
                  Total da renovação: <span className="text-white font-bold font-mono text-base">R$ {activeCycleOption.totalPrice.toFixed(2).replace('.', ',')}</span>
                  {activeCycleOption.discountPercent > 0 && (
                    <span className="ml-2 text-xs text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                      Economia de R$ {activeCycleOption.discountSavings.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <Zap size={16} />
                Confirmar Renovação ({activeCycleOption.name})
              </button>
            </div>

            {/* Payment Method Notice */}
            <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-3">
              <Info size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Forma de Pagamento em Fase de Implementação</p>
                <p className="text-amber-900/90 leading-relaxed">
                  As formas de pagamento automáticas (como débito recorrente, Pix automático e boleto bancário) estão sendo implementadas. No momento, a renovação é confirmada e registrada diretamente no sistema, garantindo que o seu ateliê continue operando sem pausas e com total tranquilidade.
                </p>
              </div>
            </div>
          </div>

          {/* Assertive Studio Resources & Registrations Grid */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  Recursos & Cadastros Sincronizados
                </h3>
                <p className="text-xs text-slate-500">
                  Valores assertivos e consolidados em tempo real com cada módulo do sistema.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl shrink-0 self-start sm:self-auto flex items-center gap-1.5">
                <Check size={12} /> Acesso Ilimitado Garantido
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              {/* 1. Produtos */}
              <div 
                onClick={() => onNavigate?.('products')}
                className={`p-4 rounded-2xl border transition-all text-center flex flex-col justify-between space-y-2 ${
                  onNavigate ? 'cursor-pointer hover:border-amber-400 hover:shadow-xs bg-slate-50/70 hover:bg-white' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto">
                    <Package size={17} />
                  </div>
                  <span className="text-2xl font-bold font-mono text-slate-900 block">{activeProducts.length}</span>
                  <span className="text-xs font-bold text-slate-800 block">Produtos (Composição)</span>
                  <span className="text-[11px] text-slate-500 block">Itens ativos no catálogo</span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-center gap-1 text-[11px] font-semibold text-amber-800">
                  <span>Ver Catálogo</span>
                  <ArrowUpRight size={12} />
                </div>
              </div>

              {/* 2. Pedidos de Venda */}
              <div 
                onClick={() => onNavigate?.('orders')}
                className={`p-4 rounded-2xl border transition-all text-center flex flex-col justify-between space-y-2 ${
                  onNavigate ? 'cursor-pointer hover:border-amber-400 hover:shadow-xs bg-slate-50/70 hover:bg-white' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center mx-auto">
                    <ShoppingCart size={17} />
                  </div>
                  <span className="text-2xl font-bold font-mono text-slate-900 block">{activeOrders.length}</span>
                  <span className="text-xs font-bold text-slate-800 block">Pedidos de Venda</span>
                  <span className="text-[11px] text-slate-500 block">Pedidos registrados</span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-center gap-1 text-[11px] font-semibold text-blue-800">
                  <span>Ver Pedidos</span>
                  <ArrowUpRight size={12} />
                </div>
              </div>

              {/* 3. Orçamentos */}
              <div 
                onClick={() => onNavigate?.('quotes')}
                className={`p-4 rounded-2xl border transition-all text-center flex flex-col justify-between space-y-2 ${
                  onNavigate ? 'cursor-pointer hover:border-amber-400 hover:shadow-xs bg-slate-50/70 hover:bg-white' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center mx-auto">
                    <FileText size={17} />
                  </div>
                  <span className="text-2xl font-bold font-mono text-slate-900 block">{activeQuotes.length}</span>
                  <span className="text-xs font-bold text-slate-800 block">Orçamentos</span>
                  <span className="text-[11px] text-slate-500 block">Orçamentos gerados</span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-center gap-1 text-[11px] font-semibold text-purple-800">
                  <span>Ver Orçamentos</span>
                  <ArrowUpRight size={12} />
                </div>
              </div>

              {/* 4. Clientes */}
              <div 
                onClick={() => onNavigate?.('clients')}
                className={`p-4 rounded-2xl border transition-all text-center flex flex-col justify-between space-y-2 ${
                  onNavigate ? 'cursor-pointer hover:border-amber-400 hover:shadow-xs bg-slate-50/70 hover:bg-white' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center mx-auto">
                    <Users size={17} />
                  </div>
                  <span className="text-2xl font-bold font-mono text-slate-900 block">{activeClients.length}</span>
                  <span className="text-xs font-bold text-slate-800 block">Clientes</span>
                  <span className="text-[11px] text-slate-500 block">Clientes cadastrados</span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-800">
                  <span>Ver Clientes</span>
                  <ArrowUpRight size={12} />
                </div>
              </div>

              {/* 5. Insumos */}
              <div 
                onClick={() => onNavigate?.('inventory')}
                className={`p-4 rounded-2xl border transition-all text-center flex flex-col justify-between space-y-2 ${
                  onNavigate ? 'cursor-pointer hover:border-amber-400 hover:shadow-xs bg-slate-50/70 hover:bg-white' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-amber-600/10 text-amber-800 flex items-center justify-center mx-auto">
                    <Hammer size={17} />
                  </div>
                  <span className="text-2xl font-bold font-mono text-slate-900 block">{activeInventory.length}</span>
                  <span className="text-xs font-bold text-slate-800 block">Estoque de Insumos</span>
                  <span className="text-[11px] text-slate-500 block">Matérias cadastradas</span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-center gap-1 text-[11px] font-semibold text-amber-900">
                  <span>Ver Estoque</span>
                  <ArrowUpRight size={12} />
                </div>
              </div>
            </div>
          </div>

          {/* Test & Simulation Tools for User */}
          <div className="bg-slate-50 rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Ferramentas de Simulação (Para Testes do Ateliê)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Teste na prática a transição entre o status de Assinatura Válida e o Modo Limitado.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSimulateExpired}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Simular Vencimento (Testar Modo Limitado)
              </button>
              <button
                type="button"
                onClick={handleRestoreActive}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Restaurar Assinatura Válida (30 dias)
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: FATURAS & RECIBOS */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-900">
                  Histórico de Faturas & Recibos
                </h3>
                <p className="text-xs text-slate-500">
                  Comprovantes e registros de renovação da assinatura do Ateliê Sagrado ERP.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600">Ano:</label>
                <select
                  value={invoiceFilterYear}
                  onChange={e => {
                    setInvoiceFilterYear(e.target.value);
                    setInvoicesPage(1);
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="all">Todos os anos</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Fatura / Recibo</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Plano & Ciclo</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Comprovante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Nenhuma fatura encontrada para este período.
                      </td>
                    </tr>
                  ) : (
                    paginatedInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {inv.number}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {formatDateBR(inv.date)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {inv.planName} • {inv.billingCycle === 'annual' ? 'Anual' : inv.billingCycle === 'semiannual' ? 'Semestral' : inv.billingCycle === 'quarterly' ? 'Trimestral' : 'Mensal'}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          R$ {inv.amount.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle size={11} /> Pago
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Visualizar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              totalItems={filteredInvoices.length}
              totalPages={Math.ceil(filteredInvoices.length / invoicesPerPage)}
              itemsPerPage={invoicesPerPage}
              currentPage={invoicesPage}
              onPageChange={setInvoicesPage}
              onItemsPerPageChange={(val) => { setInvoicesPerPage(val); setInvoicesPage(1); }}
              labelSingular="fatura"
              labelPlural="faturas"
            />
          </div>
        </div>
      )}

      {/* RENEWAL CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    Confirmar Renovação
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ciclo {activeCycleOption.name} (+{activeCycleOption.durationDays} dias de acesso)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Plan Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-200/80 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Plano:</span>
                <span className="font-bold text-slate-900">Ateliê Sagrado Completo</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Ciclo Escolhido:</span>
                <span className="font-bold text-slate-900">{activeCycleOption.name} ({activeCycleOption.durationLabel})</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Equivalência Mensal:</span>
                <span className="font-mono text-slate-900">R$ {activeCycleOption.monthlyEquivalent.toFixed(2).replace('.', ',')}/mês</span>
              </div>
              {activeCycleOption.discountPercent > 0 && (
                <div className="flex justify-between items-center text-emerald-700 font-medium">
                  <span>Desconto Aplicado:</span>
                  <span className="font-bold">{activeCycleOption.discountPercent}% OFF (-R$ {activeCycleOption.discountSavings.toFixed(2).replace('.', ',')})</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Valor Total:</span>
                <span className="text-base text-amber-900 font-mono">R$ {activeCycleOption.totalPrice.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Ao confirmar, a validade da sua assinatura será imediatamente estendida por <strong>{activeCycleOption.durationDays} dias</strong>, assegurando que todas as operações e acessos permaneçam desbloqueados e ativos.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isRenewing}
                onClick={handleExecuteRenewal}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
              >
                {isRenewing ? (
                  <>
                    <RotateCw size={14} className="animate-spin" />
                    Renovando...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Confirmar e Ativar Acesso
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-serif font-bold text-lg">
                  AS
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    Recibo Oficial de Assinatura
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Comprovante de pagamento e renovação
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Número da Fatura:</span>
                  <p className="font-mono font-bold text-slate-900">{selectedInvoice.number}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Data de Emissão:</span>
                  <p className="font-medium text-slate-800">{formatDateBR(selectedInvoice.date)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Status do Pagamento:</span>
                  <p className="text-emerald-700 font-bold">Confirmado / Pago</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Valor Total:</span>
                  <p className="font-mono font-bold text-slate-900 text-sm">
                    R$ {selectedInvoice.amount.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Discriminação do Serviço:</span>
                <p className="text-slate-800 font-medium">
                  {selectedInvoice.planName} — Assinatura de Sistema de Gestão para Ateliê Artesanal
                </p>
                <p className="text-slate-500 text-[11px]">
                  Acesso integral e ilimitado aos módulos de estoque, compras, catálogo, orçamentos, pedidos, chão de fábrica e fluxo financeiro.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Printer size={14} /> Imprimir Recibo
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
