import { 
  BillingPlan, 
  Subscription, 
  OrganizationUsage, 
  LimitCheckResult, 
  PlanFeatures, 
  BillingCycle,
  PlanId
} from './types';
import { getPlanById, BILLING_PLANS } from './plans';

export class BillingService {
  /**
   * Verifica se a assinatura está expirada.
   * Não apaga dados sob hipótese alguma.
   */
  static isSubscriptionExpired(subscription?: Subscription | null): boolean {
    if (!subscription) return true;
    if (subscription.status === 'expired') return true;

    // Se estiver em trial, verifica se o prazo de teste acabou
    if (subscription.status === 'trialing' && subscription.trialEndsAt) {
      const trialEndTime = new Date(subscription.trialEndsAt).getTime();
      if (Date.now() > trialEndTime) {
        return true;
      }
    }

    // Se estiver cancelada ou com período vencido sem renovação
    if (subscription.currentPeriodEnd) {
      const periodEndTime = new Date(subscription.currentPeriodEnd).getTime();
      // Concede carência de 3 dias de cortesia antes de travar operações de escrita
      const gracePeriodMs = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() > periodEndTime + gracePeriodMs && subscription.status !== 'active') {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica se o plano contempla a feature solicitada.
   */
  static hasFeature(plan: BillingPlan, featureKey: keyof PlanFeatures): boolean {
    return Boolean(plan.features[featureKey]);
  }

  /**
   * Formata data para o padrão visual DD/MM/AAAA
   */
  private static formatDateBR(isoDateString?: string): string {
    if (!isoDateString) return 'próximo ciclo';
    try {
      const d = new Date(isoDateString);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return isoDateString;
    }
  }

  /**
   * Validação centralizada de limites operacionais da organização.
   * Diferencia:
   * 1. Assinatura Expirada (entra em modo somente leitura para novos registros, mas NUNCA apaga dados).
   * 2. Recurso não contratado no plano.
   * 3. Limite do período atingido (bloqueia apenas a criação excedente, mantendo acesso a tudo).
   */
  static checkOperationalLimit(
    subscription: Subscription | null,
    plan: BillingPlan,
    usage: OrganizationUsage,
    resourceKey: 'ordersThisMonth' | 'quotesThisMonth' | 'productionThisMonth' | 'usersCount' | 'ateliersCount' | 'productsCount' | 'storageUsedMb',
    amountToAdd: number = 1
  ): LimitCheckResult {
    // 1. Checagem de expiração da assinatura
    if (this.isSubscriptionExpired(subscription)) {
      return {
        allowed: false,
        reason: 'subscription_expired',
        resourceKey,
        current: usage[resourceKey] || 0,
        max: 0,
        message: 'Assinatura expirada. Seus dados continuam preservados. Algumas operações estão temporariamente limitadas. Renove sua assinatura para continuar operando.',
        nextPeriodDate: this.formatDateBR(subscription?.currentPeriodEnd)
      };
    }

    // 2. Mapeamento de limite máximo conforme plano
    let max = -1;
    let resourceLabel = 'operações';

    switch (resourceKey) {
      case 'ordersThisMonth':
        max = plan.limits.maxOrdersPerMonth;
        resourceLabel = 'pedidos de venda';
        break;
      case 'quotesThisMonth':
        max = plan.limits.maxQuotesPerMonth;
        resourceLabel = 'orçamentos';
        break;
      case 'productionThisMonth':
        max = plan.limits.maxOrdersPerMonth; // Chão de fábrica acompanha volume de pedidos
        resourceLabel = 'ordens de produção';
        break;
      case 'usersCount':
        max = plan.limits.maxUsers;
        resourceLabel = 'operadores';
        break;
      case 'ateliersCount':
        max = plan.limits.maxAteliers;
        resourceLabel = 'ateliês operacionais';
        break;
      case 'productsCount':
        max = plan.limits.maxProducts;
        resourceLabel = 'produtos no catálogo';
        break;
      case 'storageUsedMb':
        max = plan.limits.maxStorageMb;
        resourceLabel = 'MB de armazenamento';
        break;
    }

    // -1 significa ilimitado
    if (max === -1 || max >= 9999) {
      return {
        allowed: true,
        reason: 'ok',
        resourceKey,
        current: usage[resourceKey] || 0,
        max: 9999
      };
    }

    const current = usage[resourceKey] || 0;
    const projected = current + amountToAdd;

    if (projected > max) {
      const nextDate = this.formatDateBR(subscription?.currentPeriodEnd);
      return {
        allowed: false,
        reason: 'limit_reached',
        resourceKey,
        current,
        max,
        nextPeriodDate: nextDate,
        message: `Limite mensal atingido. Você utilizou ${current} de ${max} ${resourceLabel} disponíveis neste período. Próximo período: ${nextDate}. Para continuar operando agora, consulte as opções de upgrade/renovação.`
      };
    }

    return {
      allowed: true,
      reason: 'ok',
      resourceKey,
      current,
      max
    };
  }

  /**
   * Gera períodos contratuais precisos com suporte a ciclos Mensal (30 dias), Trimestral (90 dias), Semestral (180 dias) e Anual (365 dias)
   */
  static calculatePeriod(cycle: BillingCycle, fromDate: Date = new Date()): { start: string; end: string } {
    const start = fromDate.toISOString();
    const end = new Date(fromDate);
    if (cycle === 'annual') {
      end.setDate(end.getDate() + 365);
    } else if (cycle === 'semiannual') {
      end.setDate(end.getDate() + 180);
    } else if (cycle === 'quarterly') {
      end.setDate(end.getDate() + 90);
    } else {
      // Mensal = 30 dias de validade
      end.setDate(end.getDate() + 30);
    }
    return { start, end: end.toISOString() };
  }

  static getCyclePrice(cycle: BillingCycle): { total: number; monthlyEquivalent: number; discountPercent: number; label: string } {
    switch (cycle) {
      case 'quarterly':
        return { total: 134.70, monthlyEquivalent: 44.90, discountPercent: 10, label: 'Trimestral (3 meses)' };
      case 'semiannual':
        return { total: 239.50, monthlyEquivalent: 39.90, discountPercent: 20, label: 'Semestral (6 meses)' };
      case 'annual':
        return { total: 419.00, monthlyEquivalent: 34.90, discountPercent: 30, label: 'Anual (12 meses)' };
      case 'monthly':
      default:
        return { total: 49.90, monthlyEquivalent: 49.90, discountPercent: 0, label: 'Mensal (30 dias)' };
    }
  }

  /**
   * Cria nova assinatura inicial com validade de 30 dias
   */
  static createInitialSubscription(organizationId: string, initialPlanId: PlanId = 'basic'): Subscription {
    const now = new Date();
    const { start, end } = this.calculatePeriod('monthly', now);

    return {
      id: `sub_${organizationId}_${Date.now()}`,
      organizationId,
      planId: 'basic',
      status: 'active',
      billingCycle: 'monthly',
      price: 49.90,
      currency: 'BRL',
      startedAt: now.toISOString(),
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: false,
      trialEndsAt: undefined,
      provider: 'internal'
    };
  }

  /**
   * Realiza Upgrade de Plano: aplica imediatamente sem perda de dados
   */
  static upgradeSubscription(
    currentSub: Subscription, 
    newPlanId: PlanId, 
    cycle: BillingCycle = currentSub.billingCycle
  ): Subscription {
    const plan = getPlanById(newPlanId);
    const { start, end } = this.calculatePeriod(cycle);
    const pricing = this.getCyclePrice(cycle);

    return {
      ...currentSub,
      planId: newPlanId,
      status: 'active',
      billingCycle: cycle,
      price: pricing.total,
      currency: plan.currency,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: false,
      trialEndsAt: undefined,
      canceledAt: undefined
    };
  }

  /**
   * Realiza Downgrade de Plano: atualiza limites para o próximo ciclo sem apagar dados históricos
   */
  static downgradeSubscription(
    currentSub: Subscription, 
    newPlanId: PlanId, 
    cycle: BillingCycle = currentSub.billingCycle
  ): Subscription {
    return this.upgradeSubscription(currentSub, newPlanId, cycle);
  }

  /**
   * Agendamento de Cancelamento no fim do período contratado.
   * Não apaga dados! Apenas agenda o fim da renovação automática.
   */
  static scheduleCancel(currentSub: Subscription): Subscription {
    return {
      ...currentSub,
      cancelAtPeriodEnd: true,
      canceledAt: new Date().toISOString()
    };
  }

  /**
   * Reativação de assinatura que estava com cancelamento agendado.
   */
  static reactivate(currentSub: Subscription): Subscription {
    return {
      ...currentSub,
      cancelAtPeriodEnd: false,
      canceledAt: undefined,
      status: 'active'
    };
  }

  /**
   * Renovação de assinatura: inicia novo período contratual (30, 90, 180 ou 365 dias)
   */
  static renew(currentSub: Subscription, newCycle?: BillingCycle): Subscription {
    const cycle = newCycle || currentSub.billingCycle || 'monthly';
    // Se a assinatura ainda estiver válida, adiciona o tempo a partir da data de vencimento atual
    const baseDate = currentSub.status === 'active' && currentSub.currentPeriodEnd && new Date(currentSub.currentPeriodEnd).getTime() > Date.now()
      ? new Date(currentSub.currentPeriodEnd)
      : new Date();

    const { start, end } = this.calculatePeriod(cycle, baseDate);
    const pricing = this.getCyclePrice(cycle);

    return {
      ...currentSub,
      status: 'active',
      billingCycle: cycle,
      price: pricing.total,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: end,
      cancelAtPeriodEnd: false,
      canceledAt: undefined
    };
  }

  /**
   * Calcula dias restantes do período de teste gratuito
   */
  static getTrialDaysRemaining(subscription?: Subscription | null): number {
    if (!subscription || subscription.status !== 'trialing' || !subscription.trialEndsAt) {
      return 0;
    }
    const diff = new Date(subscription.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Calcula dias até a próxima renovação de ciclo
   */
  static getDaysUntilRenewal(subscription?: Subscription | null): number {
    if (!subscription || !subscription.currentPeriodEnd) {
      return 0;
    }
    const diff = new Date(subscription.currentPeriodEnd).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
