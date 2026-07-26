import React, { useState } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { PlansMatrixView } from './PlansMatrixView';
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
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export const SubscriptionBillingView: React.FC = () => {
  const { 
    subscription, 
    currentPlan, 
    invoices, 
    paymentMethods, 
    isTrial, 
    isExpired, 
    trialDaysRemaining 
  } = useSubscription();

  const [activeTab, setActiveTab] = useState<'overview' | 'plans'>('overview');

  if (activeTab === 'plans') {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-all"
          >
            ← Voltar para Minha Assinatura
          </button>
        </div>
        <PlansMatrixView />
      </div>
    );
  }

  const usage = subscription?.usage || {
    usersCount: 2,
    productsCount: 4,
    ordersThisMonth: 12,
    quotesThisMonth: 8,
    storageUsedMb: 45,
    creditsUsed: 150
  };

  const limits = currentPlan?.limits || {
    maxUsers: 3,
    maxProducts: 50,
    maxOrdersPerMonth: 100,
    maxQuotesPerMonth: 150,
    maxStorageMb: 500
  };

  const calcPercentage = (curr: number, max: number) => {
    if (max === -1 || max >= 9999) return 15; // visual standard for unlimited
    return Math.min(100, Math.round((curr / max) * 100));
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Expired or Trial Notice Banner */}
      {isExpired && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 flex items-start gap-4 text-rose-900 shadow-sm">
          <AlertTriangle size={24} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-sm">Seu Período de Teste de 10 dias Expirou</h3>
            <p className="text-xs text-rose-700 mt-1">
              Escolha um dos nossos planos para reativar todas as funcionalidades e continuar utilizando o Ateliê Sagrado ERP sem interrupções.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('plans')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer shrink-0 transition-all"
          >
            Escolher Plano Agora
          </button>
        </div>
      )}

      {isTrial && !isExpired && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4 text-amber-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-950">
                Você está no Período Gratuito de Teste (10 Dias)
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Restam <strong className="font-bold text-amber-900">{trialDaysRemaining} dias</strong> de acesso completo com suporte a todos os módulos.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('plans')}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs rounded-xl shadow-md cursor-pointer shrink-0 transition-all"
          >
            Mudar de Plano
          </button>
        </div>
      )}

      {/* Main Current Plan Card */}
      <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-amber-600">Plano Ativo</span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                ● Ativo
              </span>
            </div>
            <h2 className="text-2xl font-black text-stone-900 mt-1">
              {currentPlan?.name || 'Plano Gratuito / Trial'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Faturamento {subscription?.billingCycle === 'annual' ? 'Anual' : 'Mensal'} • Renovação em{' '}
              {subscription?.currentPeriodEnd 
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR') 
                : 'Em breve'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('plans')}
              className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>Gerenciar & Mudar Plano</span>
            </button>
          </div>
        </div>

        {/* Usage Metrics Section */}
        <div className="mt-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4">
            Consumo e Limites do Seu Plano
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Users Metric */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Users size={14} className="text-amber-600" /> Operadores / Usuários
                </span>
                <span className="text-xs font-mono font-bold text-stone-900">
                  {usage.usersCount} / {limits.maxUsers === 999 ? '∞' : limits.maxUsers}
                </span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${calcPercentage(usage.usersCount, limits.maxUsers)}%` }}
                />
              </div>
            </div>

            {/* Products Metric */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Package size={14} className="text-amber-600" /> Catálogo de Produtos
                </span>
                <span className="text-xs font-mono font-bold text-stone-900">
                  {usage.productsCount} / {limits.maxProducts === 9999 ? '∞' : limits.maxProducts}
                </span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${calcPercentage(usage.productsCount, limits.maxProducts)}%` }}
                />
              </div>
            </div>

            {/* Orders Metric */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <FileText size={14} className="text-amber-600" /> Pedidos no Mês
                </span>
                <span className="text-xs font-mono font-bold text-stone-900">
                  {usage.ordersThisMonth} / {limits.maxOrdersPerMonth === 9999 ? '∞' : limits.maxOrdersPerMonth}
                </span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${calcPercentage(usage.ordersThisMonth, limits.maxOrdersPerMonth)}%` }}
                />
              </div>
            </div>

            {/* Storage Metric */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <HardDrive size={14} className="text-amber-600" /> Armazenamento (MB)
                </span>
                <span className="text-xs font-mono font-bold text-stone-900">
                  {usage.storageUsedMb} MB / {limits.maxStorageMb} MB
                </span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${calcPercentage(usage.storageUsedMb, limits.maxStorageMb)}%` }}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Payment Methods & Invoice History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Methods */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <CreditCard size={16} className="text-amber-600" />
                Formas de Pagamento
              </h3>
              <button className="p-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 transition-all cursor-pointer">
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <div 
                  key={pm.id} 
                  className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center font-bold text-stone-700">
                      {pm.type === 'credit_card' ? '💳' : '⚡'}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">
                        {pm.type === 'credit_card' ? `${pm.brand} **** ${pm.last4}` : 'Pix Automático'}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        {pm.holderName || 'Pagamento Recorrente'}
                      </p>
                    </div>
                  </div>

                  {pm.isDefault && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                      Padrão
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-stone-400 mt-6 leading-relaxed">
            Seus dados financeiros são processados com criptografia de ponta a ponta e tokenização segura.
          </p>
        </div>

        {/* Invoice History Table */}
        <div className="lg:col-span-2 bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <FileText size={16} className="text-amber-600" />
              Histórico de Faturas & Pagamentos
            </h3>
            <button className="text-xs text-amber-700 hover:underline font-bold flex items-center gap-1 cursor-pointer">
              <RefreshCw size={12} /> Atualizar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 font-mono text-[10px] uppercase">
                  <th className="pb-3 font-bold">Número</th>
                  <th className="pb-3 font-bold">Data</th>
                  <th className="pb-3 font-bold">Plano</th>
                  <th className="pb-3 font-bold">Valor</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 font-mono font-bold text-stone-900">{inv.number}</td>
                    <td className="py-3">{inv.date}</td>
                    <td className="py-3 font-medium">{inv.planName}</td>
                    <td className="py-3 font-bold text-stone-900">R$ {inv.amount.toFixed(2)}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle size={10} /> Pago
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-600 transition-all cursor-pointer inline-flex items-center gap-1">
                        <Download size={14} />
                        <span className="text-[10px]">PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
