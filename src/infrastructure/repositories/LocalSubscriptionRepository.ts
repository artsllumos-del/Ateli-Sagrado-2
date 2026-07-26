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

    // Default to Free Trial 10 days for new user
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days trial

    const newSub: UserSubscription = {
      id: 'sub_' + Date.now(),
      userId,
      planId: 'free_trial',
      status: 'trialing',
      billingCycle: 'monthly',
      startDate: now.toISOString(),
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: trialEnd.toISOString(),
      cancelAtPeriodEnd: false,
      trialEndsAt: trialEnd.toISOString(),
      usage: {
        usersCount: 2,
        productsCount: 2,
        ordersThisMonth: 2,
        quotesThisMonth: 2,
        storageUsedMb: 42,
        creditsUsed: 10
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
        message: 'Seu período de teste de 10 dias expirou. Faça o upgrade de plano para continuar criando registros.'
      };
    }

    let maxLimit = 9999;
    switch (resourceKey) {
      case 'usersCount':
        maxLimit = plan.limits.maxUsers;
        break;
      case 'productsCount':
        maxLimit = plan.limits.maxProducts;
        break;
      case 'ordersThisMonth':
        maxLimit = plan.limits.maxOrdersPerMonth;
        break;
      case 'quotesThisMonth':
        maxLimit = plan.limits.maxQuotesPerMonth;
        break;
      case 'storageUsedMb':
        maxLimit = plan.limits.maxStorageMb;
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
      message: allowed ? undefined : `Você atingiu o limite de ${maxLimit} para este recurso no seu plano atual (${plan.name}). Faça upgrade para aumentar.`
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
