import React, { useState } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { toast } from '../Toast';
import { 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Crown, 
  ArrowRight,
  HardDrive,
  Users,
  Package,
  FileText
} from 'lucide-react';
import { PlanId, BillingCycle } from '../../domain/types/auth';

export const PlansMatrixView: React.FC = () => {
  const { 
    availablePlans, 
    currentPlan, 
    subscription, 
    upgradePlan, 
    trialDaysRemaining 
  } = useSubscription();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const handleSelectPlan = async (planId: PlanId) => {
    if (planId === currentPlan?.id) return;
    setLoadingPlanId(planId);
    try {
      await upgradePlan(planId, billingCycle);
      toast.success('Plano Atualizado!', `Seu plano foi alterado para o ${availablePlans.find(p => p.id === planId)?.name}.`);
    } catch (err) {
      toast.error('Erro', 'Não foi possível alterar o plano.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold mb-4">
            <Sparkles size={14} /> Planos & Assinaturas
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Escolha o plano ideal para a escala do seu Ateliê
          </h2>
          <p className="mt-2 text-stone-300 text-sm leading-relaxed">
            Evolua a gestão do seu negócio com limites flexíveis de produtos, pedidos e usuários. Mude de plano a qualquer momento sem fidelidade.
          </p>

          {subscription?.status === 'trialing' && (
            <div className="mt-6 inline-flex items-center gap-3 bg-amber-950/80 border border-amber-500/40 rounded-2xl px-4 py-2.5 text-xs text-amber-200">
              <Clock size={16} className="text-amber-400 shrink-0" />
              <span>
                Você está no <strong className="text-white">Período Gratuito de Testes</strong>. Restam <strong className="text-amber-300 font-bold">{trialDaysRemaining} dias</strong> de acesso completo!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Monthly / Annual Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-stone-900">Faturamento da Assinatura</h3>
          <p className="text-xs text-stone-500">Alterne para a cobrança anual e economize até 20% ao mês.</p>
        </div>

        <div className="flex items-center gap-3 bg-stone-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-stone-900 text-amber-300 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Anual</span>
            <span className="bg-amber-500 text-stone-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {availablePlans.map((p) => {
          const isCurrent = currentPlan?.id === p.id;
          const price = billingCycle === 'annual' ? p.priceAnnual : p.priceMonthly;

          return (
            <div
              key={p.id}
              className={`rounded-3xl bg-white border transition-all flex flex-col justify-between relative overflow-hidden ${
                p.popular
                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xl scale-[1.02]'
                  : 'border-stone-200 shadow-sm hover:shadow-md'
              }`}
            >
              {p.popular && (
                <div className="bg-amber-600 text-white text-[10px] font-extrabold uppercase tracking-widest text-center py-1.5">
                  Mais Recomendado
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-lg font-bold text-stone-900">{p.name}</h3>
                  {p.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                      {p.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 min-h-[36px] line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                {/* Price Display */}
                <div className="my-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-stone-900">
                      R$ {price}
                    </span>
                    <span className="text-xs text-stone-400 font-medium">/mês</span>
                  </div>
                  {billingCycle === 'annual' && price > 0 && (
                    <p className="text-[11px] text-amber-700 font-medium mt-1">
                      Cobrado R$ {price * 12}/ano
                    </p>
                  )}
                </div>

                {/* Resource Limits List */}
                <div className="space-y-2 py-4 border-y border-stone-100 mb-6 text-xs text-stone-700">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-amber-600 shrink-0" />
                    <span>
                      Até <strong className="text-stone-900">{p.limits.maxUsers === 999 ? 'Ilimitados' : p.limits.maxUsers}</strong> usuários
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-amber-600 shrink-0" />
                    <span>
                      Até <strong className="text-stone-900">{p.limits.maxProducts === 9999 ? 'Ilimitados' : p.limits.maxProducts}</strong> produtos
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-amber-600 shrink-0" />
                    <span>
                      Até <strong className="text-stone-900">{p.limits.maxOrdersPerMonth === 9999 ? 'Ilimitados' : p.limits.maxOrdersPerMonth}</strong> pedidos/mês
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive size={14} className="text-amber-600 shrink-0" />
                    <span>
                      <strong className="text-stone-900">{p.limits.maxStorageMb >= 1024 ? `${p.limits.maxStorageMb / 1024} GB` : `${p.limits.maxStorageMb} MB`}</strong> armazenamento
                    </span>
                  </div>
                </div>

                {/* Feature Checkmarks */}
                <ul className="space-y-2 text-xs text-stone-600 mb-6">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0">
                <button
                  type="button"
                  disabled={isCurrent || loadingPlanId === p.id}
                  onClick={() => handleSelectPlan(p.id)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isCurrent
                      ? 'bg-stone-100 text-stone-500 cursor-default border border-stone-200'
                      : p.popular
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md'
                      : 'bg-stone-900 hover:bg-stone-800 text-stone-100'
                  }`}
                >
                  {loadingPlanId === p.id ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isCurrent ? (
                    <>
                      <Crown size={14} className="text-amber-500" />
                      <span>Seu Plano Atual</span>
                    </>
                  ) : (
                    <>
                      <span>{p.priceMonthly === 0 ? 'Começar Grátis' : 'Selecionar Plano'}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
