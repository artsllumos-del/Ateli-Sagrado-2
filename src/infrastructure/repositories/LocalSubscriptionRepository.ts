import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { 
  Plan, 
  PlanId, 
  UserSubscription, 
  BillingCycle, 
  SubscriptionUsage 
} from '../../domain/types/auth';
import { PLANS_SEED } from './MockPlans';

const SUBS_KEY = 'as_user_subscriptions';

export class LocalSubscriptionRepository implements ISubscriptionRepository {
  private getSubscriptions(): Record<string, UserSubscription> {
    const raw = localStorage.getItem(SUBS_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  private saveSubscriptions(subs: Record<string, UserSubscription>): void {
    localStorage.setItem(SUBS_KEY, JSON.stringify(subs));
  }

  async getAvailablePlans(): Promise<Plan[]> {
    return PLANS_SEED;
  }

  async getPlanById(planId: PlanId): Promise<Plan | null> {
    return PLANS_SEED.find(p => p.id === planId) || null;
  }

  async getUserSubscription(userId: string): Promise<UserSubscription> {
    const subs = this.getSubscriptions();
    if (subs[userId]) {
      // Refresh trial expiry check
      const sub = subs[userId];
      if (sub.status === 'trialing' && sub.trialEndsAt) {
        if (new Date(sub.trialEndsAt).getTime() < Date.now()) {
          sub.status = 'expired';
          this.saveSubscriptions(subs);
        }
      }
      return sub;
    }

    // Default to Plano Completo R$ 49,90/mês for user
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days period

    const newSub: UserSubscription = {
      id: 'sub_' + Date.now(),
      userId,
      planId: 'basic',
      status: 'active',
      billingCycle: 'monthly',
      startDate: now.toISOString(),
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      usage: {
        usersCount: 1,
        productsCount: 0,
        ordersThisMonth: 0,
        quotesThisMonth: 0,
        storageUsedMb: 10,
        creditsUsed: 0
      }
    };

    subs[userId] = newSub;
    this.saveSubscriptions(subs);
    return newSub;
  }

  async upgradePlan(userId: string, newPlanId: PlanId, cycle: BillingCycle): Promise<UserSubscription> {
    const sub = await this.getUserSubscription(userId);
    const now = new Date();
    const periodEnd = cycle === 'annual'
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const updated: UserSubscription = {
      ...sub,
      planId: newPlanId,
      status: 'active',
      billingCycle: cycle,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      trialEndsAt: undefined
    };

    const subs = this.getSubscriptions();
    subs[userId] = updated;
    this.saveSubscriptions(subs);
    return updated;
  }

  async downgradePlan(userId: string, newPlanId: PlanId, cycle: BillingCycle): Promise<UserSubscription> {
    return this.upgradePlan(userId, newPlanId, cycle);
  }

  async cancelSubscription(userId: string): Promise<UserSubscription> {
    const sub = await this.getUserSubscription(userId);
    const updated: UserSubscription = {
      ...sub,
      cancelAtPeriodEnd: true
    };
    const subs = this.getSubscriptions();
    subs[userId] = updated;
    this.saveSubscriptions(subs);
    return updated;
  }

  async reactivateSubscription(userId: string): Promise<UserSubscription> {
    const sub = await this.getUserSubscription(userId);
    const updated: UserSubscription = {
      ...sub,
      cancelAtPeriodEnd: false,
      status: 'active'
    };
    const subs = this.getSubscriptions();
    subs[userId] = updated;
    this.saveSubscriptions(subs);
    return updated;
  }

  private getCycleDurationMs(cycle: BillingCycle): number {
    switch (cycle) {
      case 'annual':
        return 365 * 24 * 60 * 60 * 1000;
      case 'semiannual':
        return 180 * 24 * 60 * 60 * 1000;
      case 'quarterly':
        return 90 * 24 * 60 * 60 * 1000;
      case 'monthly':
      default:
        return 30 * 24 * 60 * 60 * 1000;
    }
  }

  private getCyclePrice(cycle: BillingCycle): number {
    switch (cycle) {
      case 'annual':
        return 419.00; // 30% desconto (equiv R$ 34,90/mês)
      case 'semiannual':
        return 239.50; // 20% desconto (equiv R$ 39,90/mês)
      case 'quarterly':
        return 134.70; // 10% desconto (equiv R$ 44,90/mês)
      case 'monthly':
      default:
        return 49.90; // R$ 49,90/mês
    }
  }

  async renewSubscription(userId: string, cycle?: BillingCycle): Promise<UserSubscription> {
    const sub = await this.getUserSubscription(userId);
    const activeCycle = cycle || sub.billingCycle || 'monthly';
    const now = new Date();
    
    // Se ainda estiver ativa e não expirada, estende a partir da data de término atual
    const baseTime = (sub.status === 'active' && sub.currentPeriodEnd && new Date(sub.currentPeriodEnd).getTime() > now.getTime())
      ? new Date(sub.currentPeriodEnd).getTime()
      : now.getTime();

    const periodEnd = new Date(baseTime + this.getCycleDurationMs(activeCycle));

    const updated: UserSubscription = {
      ...sub,
      status: 'active',
      billingCycle: activeCycle,
      price: this.getCyclePrice(activeCycle),
      currency: 'BRL',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      trialEndsAt: undefined,
      usage: {
        ...sub.usage,
        ordersThisMonth: 0,
        quotesThisMonth: 0
      }
    };

    // Record the authentic invoice for this renewal
    try {
      const invoicesKey = 'as_billing_invoices_' + userId;
      const rawInvs = localStorage.getItem(invoicesKey);
      const invs = rawInvs ? JSON.parse(rawInvs) : [];
      const cycleNameMap: Record<BillingCycle, string> = {
        monthly: 'Mensal',
        quarterly: 'Trimestral',
        semiannual: 'Semestral',
        annual: 'Anual'
      };
      const newInvoice = {
        id: 'inv_' + Date.now(),
        number: `FAT-${now.getFullYear()}-${String(invs.length + 1).padStart(3, '0')}`,
        date: now.toISOString().split('T')[0],
        amount: this.getCyclePrice(activeCycle),
        status: 'paid' as const,
        planName: `Plano Ateliê Sagrado (${cycleNameMap[activeCycle]})`,
        billingCycle: activeCycle
      };
      localStorage.setItem(invoicesKey, JSON.stringify([newInvoice, ...invs]));
    } catch { /* ignore */ }

    const subs = this.getSubscriptions();
    subs[userId] = updated;
    this.saveSubscriptions(subs);
    return updated;
  }

  async simulateStatus(userId: string, status: 'active' | 'expired'): Promise<UserSubscription> {
    const sub = await this.getUserSubscription(userId);
    const now = new Date();
    const updated: UserSubscription = {
      ...sub,
      status,
      currentPeriodEnd: status === 'expired' 
        ? new Date(now.getTime() - 1000 * 60 * 60).toISOString()
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    const subs = this.getSubscriptions();
    subs[userId] = updated;
    this.saveSubscriptions(subs);
    return updated;
  }

  async checkResourceLimit(userId: string, resourceKey: keyof SubscriptionUsage, amountToAdd = 1): Promise<{
    allowed: boolean;
    current: number;
    max: number;
    message?: string;
  }> {
    const sub = await this.getUserSubscription(userId);
    const plan = await this.getPlanById(sub.planId);
    if (!plan) return { allowed: true, current: 0, max: 9999 };

    if (sub.status === 'expired') {
      return {
        allowed: false,
        current: sub.usage[resourceKey] || 0,
        max: 0,
        message: 'Assinatura expirada. Seus dados continuam preservados. Algumas operações estão temporariamente limitadas. Renove sua assinatura para continuar operando.'
      };
    }

    let maxLimit = 9999;
    let label = 'operações';
    switch (resourceKey) {
      case 'usersCount':
        maxLimit = plan.limits.maxUsers;
        label = 'operadores';
        break;
      case 'productsCount':
        maxLimit = plan.limits.maxProducts;
        label = 'produtos';
        break;
      case 'ordersThisMonth':
        maxLimit = plan.limits.maxOrdersPerMonth;
        label = 'pedidos de venda';
        break;
      case 'quotesThisMonth':
        maxLimit = plan.limits.maxQuotesPerMonth;
        label = 'orçamentos';
        break;
      case 'storageUsedMb':
        maxLimit = plan.limits.maxStorageMb;
        label = 'MB de armazenamento';
        break;
    }

    if (maxLimit === -1 || maxLimit >= 9999) {
      return { allowed: true, current: sub.usage[resourceKey] || 0, max: 9999 };
    }

    const currentVal = sub.usage[resourceKey] || 0;
    const allowed = (currentVal + amountToAdd) <= maxLimit;

    return {
      allowed,
      current: currentVal,
      max: maxLimit,
      message: allowed ? undefined : `Limite mensal atingido. Você utilizou ${currentVal} de ${maxLimit} ${label} disponíveis neste período. Para continuar operando agora, consulte as opções de upgrade/renovação.`
    };
  }

  async recordUsage(userId: string, usageDelta: Partial<SubscriptionUsage>): Promise<SubscriptionUsage> {
    const sub = await this.getUserSubscription(userId);
    const newUsage = { ...sub.usage };

    if (usageDelta.usersCount !== undefined) newUsage.usersCount = Math.max(0, newUsage.usersCount + usageDelta.usersCount);
    if (usageDelta.productsCount !== undefined) newUsage.productsCount = Math.max(0, newUsage.productsCount + usageDelta.productsCount);
    if (usageDelta.ordersThisMonth !== undefined) newUsage.ordersThisMonth = Math.max(0, newUsage.ordersThisMonth + usageDelta.ordersThisMonth);
    if (usageDelta.quotesThisMonth !== undefined) newUsage.quotesThisMonth = Math.max(0, newUsage.quotesThisMonth + usageDelta.quotesThisMonth);
    if (usageDelta.storageUsedMb !== undefined) newUsage.storageUsedMb = Math.max(0, newUsage.storageUsedMb + usageDelta.storageUsedMb);
    if (usageDelta.creditsUsed !== undefined) newUsage.creditsUsed = Math.max(0, newUsage.creditsUsed + usageDelta.creditsUsed);

    sub.usage = newUsage;
    const subs = this.getSubscriptions();
    subs[userId] = sub;
    this.saveSubscriptions(subs);

    return newUsage;
  }
}
