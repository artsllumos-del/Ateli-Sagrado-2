export type PlanId = 'free_trial' | 'basic' | 'professional' | 'enterprise';

export type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export type SubscriptionStatus = 
  | 'trialing' 
  | 'active' 
  | 'past_due' 
  | 'canceled' 
  | 'expired' 
  | 'incomplete';

export interface PlanFeatures {
  customers: boolean;
  products: boolean;
  inventory: boolean;
  purchases: boolean;
  sales: boolean;
  quotes: boolean;
  production: boolean;
  financial: boolean;
  advancedPricing: boolean;
  multiAtelier: boolean;
  auditLogs: boolean;
  exportReports: boolean;
  apiAccess: boolean;
}

export interface PlanLimits {
  maxUsers: number; // -1 for unlimited
  maxAteliers: number; // -1 for unlimited
  maxProducts: number; // -1 for unlimited
  maxOrdersPerMonth: number; // -1 for unlimited
  maxQuotesPerMonth: number; // -1 for unlimited
  maxStorageMb: number;
}

export interface BillingPlan {
  id: PlanId;
  name: string;
  badge?: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number; // Equivalent monthly or total for annual
  currency: string; // e.g. 'BRL'
  trialDays: number;
  popular?: boolean;
  active: boolean;
  features: PlanFeatures;
  limits: PlanLimits;
  featureBulletPoints: string[];
}

export interface Subscription {
  id: string;
  organizationId: string; // Absolute link to Organization (Tenant)
  planId: PlanId;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  price: number;
  currency: string;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  trialEndsAt?: string;
  provider?: 'internal' | 'stripe' | 'asaas' | 'mercadopago';
  providerSubscriptionId?: string;
  metadata?: Record<string, any>;
}

export interface OrganizationUsage {
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  ordersThisMonth: number;
  quotesThisMonth: number;
  productionThisMonth: number;
  usersCount: number;
  ateliersCount: number;
  productsCount: number;
  storageUsedMb: number;
}

export interface LimitCheckResult {
  allowed: boolean;
  reason: 'ok' | 'subscription_expired' | 'limit_reached' | 'feature_disabled';
  resourceKey: keyof OrganizationUsage | keyof PlanFeatures;
  current: number;
  max: number;
  message?: string;
  nextPeriodDate?: string;
}

export interface Atelier {
  id: string;
  organizationId: string; // Bound to Organization
  name: string; // e.g. "Bancada Matriz - Sé"
  code: string; // e.g. "ATL-01"
  slug?: string;
  address?: string;
  phone?: string;
  managerId?: string;
  operatorIds: string[]; // Associated operators
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BillingAuditEvent {
  id: string;
  organizationId: string;
  userId: string;
  action: 
    | 'subscription_created' 
    | 'subscription_renewed' 
    | 'subscription_canceled' 
    | 'subscription_expired' 
    | 'plan_changed' 
    | 'operator_created' 
    | 'operator_disabled' 
    | 'permission_changed' 
    | 'atelier_created' 
    | 'atelier_updated'
    | 'usage_limit_reached';
  timestamp: string;
  metadata?: Record<string, any>;
}
