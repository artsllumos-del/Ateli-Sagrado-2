import { 
  Plan, 
  PlanId, 
  UserSubscription, 
  BillingCycle, 
  SubscriptionUsage 
} from '../types/auth';

export interface ISubscriptionRepository {
  getAvailablePlans(): Promise<Plan[]>;
  getPlanById(planId: PlanId): Promise<Plan | null>;
  getUserSubscription(userId: string): Promise<UserSubscription>;
  upgradePlan(userId: string, newPlanId: PlanId, cycle: BillingCycle): Promise<UserSubscription>;
  downgradePlan(userId: string, newPlanId: PlanId, cycle: BillingCycle): Promise<UserSubscription>;
  cancelSubscription(userId: string): Promise<UserSubscription>;
  reactivateSubscription(userId: string): Promise<UserSubscription>;
  checkResourceLimit(userId: string, resourceKey: keyof SubscriptionUsage, amountToAdd?: number): Promise<{
    allowed: boolean;
    current: number;
    max: number;
    message?: string;
  }>;
  recordUsage(userId: string, usageDelta: Partial<SubscriptionUsage>): Promise<SubscriptionUsage>;
}
