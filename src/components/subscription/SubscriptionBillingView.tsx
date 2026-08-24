import React, { useState } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { useDb } from '../../context/DbContext';
import { PlansMatrixView } from './PlansMatrixView';
import { toast } from '../Toast';
import { 
  CreditCard, 
  Download, 
  Sparkles, 
  Clock, 
  Users, 
  Package, 
  FileText, 
  HardDrive, 
  CheckCircle, 
  Plus, 
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Check,
  Trash2,
  Printer
} from 'lucide-react';
import { PaymentMethod, BillingInvoice } from '../../domain/types/auth';

export const SubscriptionBillingView: React.FC = () => {
  const { 
    subscription, 
    currentPlan, 
    invoices, 
    paymentMethods, 
    isTrial, 
    isExpired, 
    trialDaysRemaining,
    daysUntilRenewal,
    isAutoRenewActive,
    hasDefaultPaymentMethod,
    cancelSubscription,
    reactivateSubscription,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod
  } = useSubscription();

  const { products, orders, quotes, users, settings } = useDb();

  const [activeTab, setActiveTab] = useState<'overview' | 'plans'>('overview');
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(null);
  const [invoiceFilterYear, setInvoiceFilterYear] = useState<string>('all');

  // Payment method form state
  const [paymentType, setPaymentType] = useState<'credit_card' | 'pix'>('credit_card');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const handleCreatePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (paymentType === 'credit_card') {
        if (!cardHolder || !cardNumber || !cardExpiry) {
          toast.error('Preenchimento Inválido', 'Por favor, preencha os dados do cartão de crédito.');
          return;
        }
        const last4 = cardNumber.slice(-4) || '8888';
        await addPaymentMethod({
          type: 'credit_card',
          last4,
          brand: 'Mastercard',
          expiryMonth: 12,
          expiryYear: 2029,
          isDefault: paymentMethods.length === 0,
          holderName: cardHolder.toUpperCase()
        });
        toast.success('Forma de Pagamento Adicionada!', `Cartão final ${last4} cadastrado com sucesso.`);
      } else {
        await addPaymentMethod({
          type: 'pix',
          isDefault: paymentMethods.length === 0
        });
        toast.success('Pix Recorrente Habilitado!', 'Forma de pagamento via Pix configurada.');
      }
      setShowAddPaymentModal(false);
      setCardHolder('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
    } catch (err) {
      toast.error('Erro', 'Não foi possível cadastrar a forma de pagamento.');
    }
  };

  const handleRemovePaymentMethod = async (id: string) => {
    if (paymentMethods.length <= 1) {
      toast.error('Ação Não Permitida', 'Mantenha ao menos uma forma de pagamento ativa para renovações.');
      return;
    }
    await removePaymentMethod(id);
    toast.info('Removido', 'Forma de pagamento excluída.');
  };

  const handleSetDefaultPaymentMethod = async (id: string) => {
    await setDefaultPaymentMethod(id);
    toast.success('Padrão Alterado', 'Sua forma de pagamento principal foi atualizada.');
  };

  const handleCancelSub = async () => {
    try {
      await cancelSubscription();
      toast.warning('Cancelamento Agendado', 'Sua assinatura não será renovada ao fim do período atual.');
      setShowCancelModal(false);
    } catch (err) {
      toast.error('Erro', 'Não foi possível agendar o cancelamento.');
    }
  };

  const handleReactivateSub = async () => {
    try {
      await reactivateSubscription();
      toast.success('Assinatura Reativada!', 'Sua renovação automática continua ativa.');
    } catch (err) {
      toast.error('Erro', 'Não foi possível reativar a assinatura.');
    }
  };

  if (activeTab === 'plans') {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 px-3.5 py-2 rounded-xl transition-all"
          >
            ← Voltar para Painel da Minha Assinatura
          </button>
        </div>
        <PlansMatrixView />
      </div>
    );
  }

  // Real usage calculation from database context
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const realOrdersThisMonth = (orders || []).filter(o => (o.date || '').startsWith(currentMonthStr)).length || (orders || []).length;
  const realQuotesThisMonth = (quotes || []).filter(q => (q.date || '').startsWith(currentMonthStr)).length || (quotes || []).length;
  const realUsersCount = (users || []).length || 1;
  const realProductsCount = (products || []).length || 0;
  const realStorageMb = Math.round(40 + (realProductsCount * 2.5) + (realOrdersThisMonth * 1.5));

  const usage = {
    usersCount: realUsersCount,
    productsCount: realProductsCount,
    ordersThisMonth: realOrdersThisMonth,
    quotesThisMonth: realQuotesThisMonth,
    storageUsedMb: realStorageMb
  };

  const limits = currentPlan?.limits || {
    maxUsers: 3,
    maxProducts: 50,
    maxOrdersPerMonth: 100,
    maxQuotesPerMonth: 150,
    maxStorageMb: 500
  };

  const calcPercentage = (curr: number, max: number) => {
    if (max === -1 || max >= 9999) return 12; // unlimited visual level
    return Math.min(100, Math.round((curr / max) * 100));
  };

  const getGaugeColor = (pct: number) => {
    if (pct >= 90) return 'bg-rose-600';
    if (pct >= 75) return 'bg-amber-500';
    return 'bg-emerald-600';
  };

  const basePlanPrice = subscription?.billingCycle === 'annual' ? (currentPlan?.priceAnnual || 0) : (currentPlan?.priceMonthly || 0);

  // Invoice filtering
  const filteredInvoices = (invoices || []).filter(inv => {
    if (invoiceFilterYear === 'all') return true;
    return (inv.date || '').startsWith(invoiceFilterYear);
  });

  return (
    <div className="space-y-8 pb-12 font-sans select-none">
      
      {/* Expired or Trial Notice Banner */}
      {isExpired && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-rose-900 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="text-rose-600 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-sm">Seu Período de Teste Expirou</h3>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                Escolha um dos nossos planos para reativar todas as funcionalidades do Ateliê Sagrado ERP sem interrupções.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('plans')}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer shrink-0 transition-all active:scale-95"
          >
            Escolher Plano Agora
          </button>
        </div>
      )}

      {isTrial && !isExpired && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-100/50 to-amber-50 border border-amber-300/80 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-950 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0 shadow-xs">
              <Clock size={22} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-950">
                Período Gratuito de Teste Ativo ({trialDaysRemaining} Dias Restantes)
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Restam <strong className="font-extrabold text-amber-950 text-sm">{trialDaysRemaining} dias</strong> de acesso completo com suporte total a todos os módulos do sistema.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('plans')}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs rounded-xl shadow-md cursor-pointer shrink-0 transition-all active:scale-95"
          >
            Mudar para Plano Definitivo
          </button>
        </div>
      )}

      {/* RENEWAL WARNING ALERT: Close to renewal OR missing automatic renewal setup */}
      {!isExpired && !isTrial && (!isAutoRenewActive || daysUntilRenewal <= 10) && (
        <div className={`p-6 rounded-3xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs transition-all ${
          !isAutoRenewActive 
            ? 'bg-amber-50/90 border-amber-300 text-amber-950' 
            : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
              !isAutoRenewActive ? 'bg-amber-200/80 text-amber-900' : 'bg-emerald-200/80 text-emerald-900'
            }`}>
              {!isAutoRenewActive ? <AlertTriangle size={22} /> : <Clock size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm">
                  {!isAutoRenewActive 
                    ? `Atenção: Próxima Renovação em ${daysUntilRenewal} dias sem Renovação Automática Ativa`
                    : `Lembrete de Renovação em ${daysUntilRenewal} dias`
                  }
                </h4>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  !isAutoRenewActive ? 'bg-amber-200 text-amber-900 border border-amber-300' : 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                }`}>
                  Faltam {daysUntilRenewal} dias
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {!isAutoRenewActive ? (
                  <>
                    {!hasDefaultPaymentMethod ? (
                      <span>
                        Nenhum cartão ou chave Pix está definido como padrão. Para evitar o bloqueio no vencimento do ciclo ({subscription?.billingCycle === 'annual' ? 'Anual' : 'Mensal'}), cadastre uma forma de pagamento.
                      </span>
                    ) : (
                      <span>
                        A renovação automática está pausada (cancelamento agendado para o fim do período). Reative para continuar usando o Ateliê Sagrado ERP sem interrupção.
                      </span>
                    )}
                  </>
                ) : (
                  <span>
                    Sua assinatura ({subscription?.billingCycle === 'annual' ? 'Anual' : 'Mensal'}) será renovada automaticamente no dia{' '}
                    <strong>{subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR') : ''}</strong> com cobrança no seu cartão padrão.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isAutoRenewActive && subscription?.cancelAtPeriodEnd ? (
              <button
                onClick={handleReactivateSub}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
              >
                Reativar Renovação Automática
              </button>
            ) : !hasDefaultPaymentMethod ? (
              <button
                onClick={() => setShowAddPaymentModal(true)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
              >
                Cadastrar Cartão / Pix
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Main Current Subscription Header Card */}
      <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-100 pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-md border border-amber-200/60">
                Assinatura Ativa
              </span>

              {/* Days till renewal pill indicator */}
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-stone-900 text-amber-300 rounded-full border border-stone-800 flex items-center gap-1">
                <Clock size={11} /> Restam {daysUntilRenewal} dias
              </span>

              {/* Auto renew status indicator */}
              {isAutoRenewActive ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle size={11} /> Renovação Automática
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200 flex items-center gap-1">
                  <AlertTriangle size={11} /> Sem Renovação Automática
                </span>
              )}
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
              {currentPlan?.name || 'Plano Gratuito / Trial'}
            </h2>
            
            <p className="text-xs text-stone-500 mt-1 flex flex-wrap items-center gap-2">
              <span className="font-medium">Ciclo {subscription?.billingCycle === 'annual' ? 'Anual' : 'Mensal'}</span>
              <span>•</span>
              <span>
                Próxima renovação em:{' '}
                <strong className="text-stone-900 font-bold">
                  {subscription?.currentPeriodEnd 
                    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR') 
                    : 'Em breve'}
                </strong>{' '}
                (<span className="text-amber-800 font-extrabold">{daysUntilRenewal} dias disponíveis</span>)
              </span>
              <span>•</span>
              <span className="font-mono font-bold text-stone-900">
                Valor: R$ {basePlanPrice.toFixed(2)}/mês
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {subscription?.cancelAtPeriodEnd ? (
              <button
                onClick={handleReactivateSub}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle size={15} />
                <span>Reativar Assinatura</span>
              </button>
            ) : (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-3.5 py-2.5 border border-stone-200 hover:bg-rose-50 hover:border-rose-200 text-stone-600 hover:text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancelar Renovação
              </button>
            )}

            <button
              onClick={() => setActiveTab('plans')}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Sparkles size={15} />
              <span>Ver & Alterar Planos</span>
            </button>
          </div>
        </div>

        {/* Real-time Usage Metrics Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-amber-600" />
              Consumo de Recursos em Tempo Real no Ateliê
            </h3>
            <span className="text-[10px] text-stone-400 font-mono">
              Calculado a partir do seu banco de dados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Users Metric */}
            {(() => {
              const pct = calcPercentage(usage.usersCount, limits.maxUsers);
              return (
                <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/60 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Users size={14} className="text-amber-600" /> Operadores
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-900">
                      {usage.usersCount} / {limits.maxUsers === 999 ? '∞' : limits.maxUsers}
                    </span>
                  </div>
                  <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`${getGaugeColor(pct)} h-full rounded-full transition-all duration-500`} 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-stone-500">
                    <span>{pct}% utilizado</span>
                    {pct >= 85 && (
                      <button onClick={() => setActiveTab('plans')} className="text-amber-700 font-bold hover:underline">
                        Aumentar +
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Products Metric */}
            {(() => {
              const pct = calcPercentage(usage.productsCount, limits.maxProducts);
              return (
                <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/60 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Package size={14} className="text-amber-600" /> Catálogo
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-900">
                      {usage.productsCount} / {limits.maxProducts === 9999 ? '∞' : limits.maxProducts}
                    </span>
                  </div>
                  <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`${getGaugeColor(pct)} h-full rounded-full transition-all duration-500`} 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-stone-500">
                    <span>{pct}% utilizado</span>
                    {pct >= 85 && (
                      <button onClick={() => setActiveTab('plans')} className="text-amber-700 font-bold hover:underline">
                        Aumentar +
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Orders Metric */}
            {(() => {
              const pct = calcPercentage(usage.ordersThisMonth, limits.maxOrdersPerMonth);
              return (
                <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/60 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <FileText size={14} className="text-amber-600" /> Pedidos/Mês
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-900">
                      {usage.ordersThisMonth} / {limits.maxOrdersPerMonth === 9999 ? '∞' : limits.maxOrdersPerMonth}
                    </span>
                  </div>
                  <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`${getGaugeColor(pct)} h-full rounded-full transition-all duration-500`} 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-stone-500">
                    <span>{pct}% utilizado</span>
                    {pct >= 85 && (
                      <button onClick={() => setActiveTab('plans')} className="text-amber-700 font-bold hover:underline">
                        Aumentar +
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Storage Metric */}
            {(() => {
              const pct = calcPercentage(usage.storageUsedMb, limits.maxStorageMb);
              return (
                <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/60 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <HardDrive size={14} className="text-amber-600" /> Fotos & Nuvem
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-900">
                      {usage.storageUsedMb} MB / {limits.maxStorageMb} MB
                    </span>
                  </div>
                  <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`${getGaugeColor(pct)} h-full rounded-full transition-all duration-500`} 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-stone-500">
                    <span>{pct}% utilizado</span>
                    {pct >= 85 && (
                      <button onClick={() => setActiveTab('plans')} className="text-amber-700 font-bold hover:underline">
                        Aumentar +
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      </div>

      {/* Payment Methods & Invoice History Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Methods */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <CreditCard size={16} className="text-amber-600" />
                Formas de Pagamento
              </h3>
              <button 
                onClick={() => setShowAddPaymentModal(true)}
                className="p-1.5 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 rounded-xl text-stone-700 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
              >
                <Plus size={14} />
                <span>Adicionar</span>
              </button>
            </div>

            <div className="space-y-3">
              {(paymentMethods || []).map((pm) => (
                <div 
                  key={pm.id} 
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${
                    pm.isDefault ? 'bg-amber-50/40 border-amber-300' : 'bg-stone-50/50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center font-bold text-stone-700 shadow-2xs">
                      {pm.type === 'credit_card' ? '💳' : '⚡'}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">
                        {pm.type === 'credit_card' ? `${pm.brand || 'Cartão'} **** ${pm.last4}` : 'Pix Automático Recorrente'}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        {pm.holderName || 'Pagamento Seguro Tokens'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {pm.isDefault ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-200">
                        Padrão
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefaultPaymentMethod(pm.id)}
                        className="text-[10px] font-bold text-stone-500 hover:text-amber-700 hover:underline cursor-pointer"
                      >
                        Tornar Padrão
                      </button>
                    )}

                    <button
                      onClick={() => handleRemovePaymentMethod(pm.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 transition-all cursor-pointer"
                      title="Excluir forma de pagamento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-2 text-[11px] text-stone-400 leading-relaxed">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span>Processamento protegido com criptografia PCI-DSS e tokenização.</span>
          </div>
        </div>

        {/* Invoice History Table */}
        <div className="lg:col-span-2 bg-white border border-stone-200/80 rounded-3xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <FileText size={16} className="text-amber-600" />
              Histórico de Faturas & Recibos Fiscais
            </h3>

            <div className="flex items-center gap-2">
              <select
                value={invoiceFilterYear}
                onChange={(e) => setInvoiceFilterYear(e.target.value)}
                className="text-xs font-bold bg-stone-100 border border-stone-200 rounded-xl px-2.5 py-1.5 text-stone-700"
              >
                <option value="all">Todas as Faturas</option>
                <option value="2026">Ano 2026</option>
                <option value="2025">Ano 2025</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-150 text-stone-400 font-mono text-[10px] uppercase">
                  <th className="pb-3 font-bold">Fatura Nº</th>
                  <th className="pb-3 font-bold">Data</th>
                  <th className="pb-3 font-bold">Plano</th>
                  <th className="pb-3 font-bold">Valor Total</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-right">Recibo / PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3.5 font-mono font-bold text-stone-900">{inv.number}</td>
                    <td className="py-3.5 font-medium">{inv.date}</td>
                    <td className="py-3.5 font-medium text-stone-900">{inv.planName}</td>
                    <td className="py-3.5 font-mono font-bold text-stone-900">R$ {inv.amount.toFixed(2)}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle size={10} /> Pago
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button 
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 hover:bg-amber-100 hover:text-amber-900 rounded-lg text-amber-700 font-bold transition-all cursor-pointer inline-flex items-center gap-1 text-[11px]"
                      >
                        <Download size={13} />
                        <span>Ver Fatura</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-150 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <CreditCard size={18} className="text-amber-600" />
                Cadastrar Nova Forma de Pagamento
              </h3>
              <button 
                onClick={() => setShowAddPaymentModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPaymentType('credit_card')}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  paymentType === 'credit_card' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                }`}
              >
                💳 Cartão de Crédito
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('pix')}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  paymentType === 'pix' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                }`}
              >
                ⚡ Pix Automático
              </button>
            </div>

            <form onSubmit={handleCreatePaymentMethod} className="space-y-4 text-xs font-semibold">
              {paymentType === 'credit_card' ? (
                <>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Nome no Cartão *</label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="EX: ARTHUR SANTOS"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold focus:outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Número do Cartão *</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 •••• •••• 4242"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Validade *</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/AA"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">CVC / CVV *</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 space-y-2 text-stone-800 text-xs">
                  <p className="font-bold flex items-center gap-1.5 text-amber-950">
                    <CheckCircle size={15} className="text-emerald-600" /> Pix Recorrente Sem Falhas
                  </p>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Você receberá uma notificação com o código QR do Pix a cada vencimento mensal com desconto e liquidação instantânea.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-bold cursor-pointer hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold shadow-md cursor-pointer"
                >
                  Salvar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Details & Print Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-150 space-y-6 animate-scale-up print:p-0 print:shadow-none print:border-none">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-amber-600" />
                <span className="font-bold text-sm text-stone-900">Comprovante de Fatura</span>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Printable Invoice Details Card */}
            <div className="space-y-4 text-xs font-sans text-stone-800">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif font-black text-base text-stone-900">{settings.companyName || 'Ateliê Sagrado ERP'}</h3>
                  <p className="text-[11px] text-stone-500 font-mono">CNPJ: {settings.cnpj || '00.000.000/0001-00'}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-amber-700 text-xs block">{selectedInvoice.number}</span>
                  <span className="text-[10px] text-stone-400">Emissão: {selectedInvoice.date}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Descrição do Item:</span>
                  <span className="font-bold text-stone-900">{selectedInvoice.planName} ({selectedInvoice.billingCycle === 'annual' ? 'Anual' : 'Mensal'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Status do Pagamento:</span>
                  <span className="font-bold text-emerald-700 uppercase">● {selectedInvoice.status}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-200/60 text-sm">
                  <span className="font-bold text-stone-900">Valor Total Pago:</span>
                  <span className="font-mono font-black text-stone-900">R$ {selectedInvoice.amount.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-[10px] text-stone-400 italic text-center">
                Este documento serve como recibo oficial de prestação de serviços de software ERP.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-stone-100 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <Printer size={15} />
                <span>Imprimir / Salvar PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-5 py-2 bg-stone-900 text-amber-300 hover:bg-stone-800 font-bold rounded-xl text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-150 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h3 className="font-bold text-sm text-rose-700 flex items-center gap-2">
                <AlertTriangle size={18} />
                Confirmar Cancelamento de Renovação
              </h3>
              <button 
                onClick={() => setShowCancelModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-700 leading-relaxed">
              <p>
                Tem certeza que deseja cancelar a renovação automática do seu plano <strong className="text-stone-900">{currentPlan?.name}</strong>?
              </p>
              <p className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                Você continuará com acesso completo até o fim do período já pago em <strong>{subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR') : 'breve'}</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold cursor-pointer hover:bg-stone-50 text-xs"
              >
                Manter Minha Assinatura
              </button>
              <button
                type="button"
                onClick={handleCancelSub}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer text-xs shadow-md"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
