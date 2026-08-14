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
  FileText,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  BarChart3,
  MessageCircle,
  Sliders,
  DollarSign,
  AlertCircle
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
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<PlanId | null>(null);
  const [showComparisonMatrix, setShowComparisonMatrix] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handleConfirmPlanChange = async () => {
    if (!selectedPlanForModal) return;
    const planId = selectedPlanForModal;
    setLoadingPlanId(planId);
    try {
      await upgradePlan(planId, billingCycle);
      const targetPlan = availablePlans.find(p => p.id === planId);
      toast.success(
        'Assinatura Atualizada!', 
        `Seu plano foi alterado com sucesso para o ${targetPlan?.name || 'novo plano'}. Acesso liberado instantaneamente.`
      );
      setSelectedPlanForModal(null);
    } catch (err) {
      toast.error('Erro de Atualização', 'Não foi possível alterar seu plano. Tente novamente.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  const featureComparisonRows = [
    {
      category: 'Limites de Gestão',
      features: [
        { name: 'Operadores & Artesãos', free: '1', basic: 'Até 3', pro: 'Até 10', ent: 'Ilimitados' },
        { name: 'Catálogo de Produtos', free: '15 itens', basic: '50 itens', pro: 'Ilimitado', ent: 'Ilimitado' },
        { name: 'Pedidos de Venda / Mês', free: '20 pedidos', basic: '100 pedidos', pro: '500 pedidos', ent: 'Ilimitados' },
        { name: 'Armazenamento de Fotos HD', free: '100 MB', basic: '500 MB', pro: '2 GB', ent: '10 GB' }
      ]
    },
    {
      category: 'Motor de Precificação & Finanças',
      features: [
        { name: 'Cálculo de Custos & Hora Trabalhada', free: true, basic: true, pro: true, ent: true },
        { name: 'Análise de Margem de Lucro & Markup', free: true, basic: true, pro: true, ent: true },
        { name: 'DRE & Conciliação de DAF', free: false, basic: false, pro: true, ent: true },
        { name: 'Exportação em PDF Customizado', free: false, basic: true, pro: true, ent: true }
      ]
    },
    {
      category: 'Chão de Fábrica & Clientes',
      features: [
        { name: 'Controle de Fases de Produção', free: true, basic: true, pro: true, ent: true },
        { name: 'Fichas Técnicas e Insumos (BOM)', free: true, basic: true, pro: true, ent: true },
        { name: 'Gestão de Clientes VIP e Histórico', free: true, basic: true, pro: true, ent: true },
        { name: 'Controle de Acesso por Perfil', free: false, basic: false, pro: true, ent: true }
      ]
    },
    {
      category: 'Segurança & Suporte',
      features: [
        { name: 'Backup Automático em Nuvem', free: 'Semanal', basic: 'Diário', pro: 'Tempo Real', ent: 'Tempo Real' },
        { name: 'Suporte Técnico', free: 'E-mail', basic: 'WhatsApp & E-mail', pro: 'WhatsApp Prioritário', ent: 'Gerente Dedicado 24/7' },
        { name: 'Logs de Auditoria de Operadores', free: false, basic: false, pro: true, ent: true }
      ]
    }
  ];

  const faqs = [
    {
      q: 'Como funciona a mudança de plano?',
      a: 'Você pode fazer o upgrade ou downgrade a qualquer momento. Ao alterar, seu acesso aos limites e funcionalidades do novo plano é liberado imediatamente.'
    },
    {
      q: 'Existe contrato de fidelidade ou multa por cancelamento?',
      a: 'Não! Nossos planos não possuem fidelidade. Você pode cancelar ou alterar a assinatura quando quiser diretamente pelo painel, sem taxas surpresa.'
    },
    {
      q: 'Como funciona o desconto da cobrança Anual?',
      a: 'Ao selecionar a cobrança Anual, você recebe 20% de desconto em relação ao valor mensal, cobrado uma vez ao ano no seu cartão de crédito ou Pix.'
    },
    {
      q: 'Minhas informações e dados do ateliê ficam salvos no downgrade?',
      a: 'Sim, todos os seus produtos, vendas, orçamentos e cadastros permanecem 100% preservados na nuvem.'
    },
    {
      q: 'Emitimos Nota Fiscal ou Recibo da assinatura?',
      a: 'Sim. Em todas as renovações ou upgrades, o sistema gera automaticamente a fatura/recibo com dados fiscais no seu histórico de cobranças.'
    }
  ];

  return (
    <div className="space-y-8 pb-10 font-sans">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold mb-4">
            <Sparkles size={14} /> Planos & Assinaturas Escalonáveis
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            A infraestrutura ideal para crescer o seu Ateliê
          </h2>
          <p className="mt-3 text-stone-300 text-xs sm:text-sm leading-relaxed">
            Evolua a gestão do seu negócio com limites flexíveis de catálogo, pedidos e operadores. Alterne de plano sem fidelidade quando a sua demanda aumentar.
          </p>

          {subscription?.status === 'trialing' && (
            <div className="mt-6 inline-flex items-center gap-3 bg-amber-950/80 border border-amber-500/40 rounded-2xl px-4 py-2.5 text-xs text-amber-200">
              <Clock size={16} className="text-amber-400 shrink-0" />
              <span>
                Você está no <strong className="text-white">Período Gratuito de Testes</strong>. Restam <strong className="text-amber-300 font-bold">{trialDaysRemaining} dias</strong> de acesso completo a todas as ferramentas!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Monthly / Annual Cycle Toggle Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Zap size={16} className="text-amber-600" />
            Ciclo de Faturamento
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">Economize até 20% ao optar pelo pagamento anual recorrente.</p>
        </div>

        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/60">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-white text-stone-900 shadow-xs'
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
                ? 'bg-stone-900 text-amber-300 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Anual</span>
            <span className="bg-amber-500 text-stone-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              -20% OFF
            </span>
          </button>
        </div>
      </div>

      {/* Plans Pricing Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {availablePlans.map((p) => {
          const isCurrent = currentPlan?.id === p.id;
          const price = billingCycle === 'annual' ? p.priceAnnual : p.priceMonthly;

          return (
            <div
              key={p.id}
              className={`rounded-3xl bg-white border transition-all flex flex-col justify-between relative overflow-hidden ${
                p.popular
                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xl scale-[1.02] z-10'
                  : 'border-stone-200 shadow-sm hover:shadow-md'
              }`}
            >
              {p.popular && (
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[10px] font-extrabold uppercase tracking-widest text-center py-1.5 shadow-xs">
                  ★ Mais Recomendado para Ateliês
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-lg font-bold text-stone-900">{p.name}</h3>
                  {p.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                      {p.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 min-h-[38px] line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                {/* Price Display */}
                <div className="my-6 p-4 rounded-2xl bg-stone-50/80 border border-stone-150">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-stone-900 font-mono">
                      R$ {price}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">/mês</span>
                  </div>
                  {billingCycle === 'annual' && price > 0 ? (
                    <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                      <Check size={12} /> Faturado R$ {price * 12}/ano (com 20% desconto)
                    </p>
                  ) : price > 0 ? (
                    <p className="text-[11px] text-stone-400 font-medium mt-1">
                      Faturamento mensal sem fidelidade
                    </p>
                  ) : (
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      100% Gratuito no período
                    </p>
                  )}
                </div>

                {/* Resource Limits Summary */}
                <div className="space-y-2 py-4 border-y border-stone-100 mb-6 text-xs text-stone-700 font-medium">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-amber-600 shrink-0" />
                    <span>
                      Até <strong className="text-stone-900">{p.limits.maxUsers === 999 ? 'Ilimitados' : p.limits.maxUsers}</strong> operadores
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
                      <strong className="text-stone-900">{p.limits.maxStorageMb >= 1024 ? `${p.limits.maxStorageMb / 1024} GB` : `${p.limits.maxStorageMb} MB`}</strong> em fotos
                    </span>
                  </div>
                </div>

                {/* Features Checklist */}
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
                  disabled={isCurrent}
                  onClick={() => setSelectedPlanForModal(p.id)}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isCurrent
                      ? 'bg-stone-100 text-stone-500 cursor-default border border-stone-200'
                      : p.popular
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md active:scale-98'
                      : 'bg-stone-900 hover:bg-stone-800 text-stone-100 active:scale-98'
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <Crown size={15} className="text-amber-500" />
                      <span>Plano Ativo no Momento</span>
                    </>
                  ) : (
                    <>
                      <span>{p.priceMonthly === 0 ? 'Experimentar Grátis' : 'Selecionar Plano'}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix Section (Expansivo) */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
          <div>
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-amber-600" />
              Matriz Comparativa de Recursos por Módulo
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Compare as capacidades detalhadas de cada plano do Ateliê Sagrado ERP lado a lado.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowComparisonMatrix(!showComparisonMatrix)}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <span>{showComparisonMatrix ? 'Ocultar Comparativo' : 'Ver Comparativo Completo'}</span>
            {showComparisonMatrix ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showComparisonMatrix && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold">
                  <th className="p-3.5 rounded-tl-xl">Recurso / Funcionalidade</th>
                  <th className="p-3.5 text-center">Gratuito / Trial</th>
                  <th className="p-3.5 text-center">Básico</th>
                  <th className="p-3.5 text-center text-amber-900 bg-amber-50/60 font-black">Profissional</th>
                  <th className="p-3.5 text-center rounded-tr-xl">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 text-stone-700">
                {featureComparisonRows.map((cat, cIdx) => (
                  <React.Fragment key={cIdx}>
                    <tr className="bg-stone-100/60 font-bold text-stone-900 text-[11px] uppercase tracking-wider">
                      <td colSpan={5} className="py-2.5 px-3.5 text-amber-800">
                        {cat.category}
                      </td>
                    </tr>
                    {cat.features.map((f, fIdx) => (
                      <tr key={fIdx} className="hover:bg-stone-50/80 transition-colors">
                        <td className="p-3.5 font-medium text-stone-900">{f.name}</td>
                        <td className="p-3.5 text-center">
                          {typeof f.free === 'boolean' ? (
                            f.free ? <Check size={16} className="text-emerald-600 mx-auto" /> : <span className="text-stone-300">—</span>
                          ) : (
                            <span className="font-semibold text-stone-700">{f.free}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {typeof f.basic === 'boolean' ? (
                            f.basic ? <Check size={16} className="text-emerald-600 mx-auto" /> : <span className="text-stone-300">—</span>
                          ) : (
                            <span className="font-semibold text-stone-700">{f.basic}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center bg-amber-50/30 font-bold text-amber-950">
                          {typeof f.pro === 'boolean' ? (
                            f.pro ? <Check size={16} className="text-emerald-600 mx-auto" /> : <span className="text-stone-300">—</span>
                          ) : (
                            <span>{f.pro}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {typeof f.ent === 'boolean' ? (
                            f.ent ? <Check size={16} className="text-emerald-600 mx-auto" /> : <span className="text-stone-300">—</span>
                          ) : (
                            <span className="font-semibold text-stone-700">{f.ent}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FAQ Accordion Section */}
      <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs">
        <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2 mb-6">
          <HelpCircle size={18} className="text-amber-600" />
          Perguntas Frequentes sobre Planos e Assinatura
        </h3>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={idx}
                className="border border-stone-200 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-bold text-xs text-stone-900 flex items-center justify-between gap-4 bg-stone-50/50 hover:bg-stone-100/60 transition-all cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={16} className="text-amber-600 shrink-0" /> : <ChevronDown size={16} className="text-stone-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="p-4 bg-white text-xs text-stone-600 leading-relaxed border-t border-stone-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan Selection Confirmation Modal */}
      {selectedPlanForModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-150 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <Crown size={18} />
                <span>Confirmar Alteração de Plano</span>
              </div>
              <button 
                onClick={() => setSelectedPlanForModal(null)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {(() => {
              const target = availablePlans.find(p => p.id === selectedPlanForModal);
              const targetPrice = billingCycle === 'annual' ? target?.priceAnnual : target?.priceMonthly;
              return (
                <div className="space-y-4 text-xs text-stone-700">
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                    <p className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">Novo Plano Selecionado:</p>
                    <h4 className="text-xl font-black text-stone-900 mt-0.5">{target?.name}</h4>
                    <p className="text-xs text-stone-600 mt-1 font-mono font-bold">
                      R$ {targetPrice}/mês ({billingCycle === 'annual' ? 'Faturamento Anual' : 'Faturamento Mensal'})
                    </p>
                  </div>

                  <p className="leading-relaxed">
                    Ao confirmar, seu ateliê terá os novos limites de operadores, produtos e recursos liberados imediatamente. Sem fidelidade ou taxas adicionais.
                  </p>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setSelectedPlanForModal(null)}
                      className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={loadingPlanId === selectedPlanForModal}
                      onClick={handleConfirmPlanChange}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-2"
                    >
                      {loadingPlanId === selectedPlanForModal ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check size={16} />
                          <span>Confirmar e Ativar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
};
