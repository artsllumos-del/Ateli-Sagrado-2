export type UserRole = 'visitor' | 'authenticated' | 'client' | 'moderator' | 'admin';

export type ResourcePermission =
  | 'dashboard:read'
  | 'inventory:read'
  | 'inventory:write'
  | 'purchases:read'
  | 'purchases:write'
  | 'products:read'
  | 'products:write'
  | 'pricing:read'
  | 'pricing:write'
  | 'clients:read'
  | 'clients:write'
  | 'quotes:read'
  | 'quotes:write'
  | 'orders:read'
  | 'orders:write'
  | 'production:read'
  | 'production:write'
  | 'financial:read'
  | 'financial:write'
  | 'users:manage'
  | 'settings:manage'
  | 'subscription:manage'
  | 'audit:read';

export type PlanId = 'free_trial' | 'basic' | 'professional' | 'enterprise';

export type BillingCycle = 'monthly' | 'annual';

export interface PlanLimits {
  maxUsers: number; // e.g. 1, 3, 10, -1 (unlimited)
  maxProducts: number;
  maxOrdersPerMonth: number;
  maxQuotesPerMonth: number;
  maxStorageMb: number;
}

export interface Plan {
  id: PlanId;
  name: string;
  badge?: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number; // Price per month when billed annually
  trialDays: number;
  popular?: boolean;
  limits: PlanLimits;
  features: string[];
  permissions: ResourcePermission[];
  creditsMonthly: number;
}

export interface SubscriptionUsage {
  usersCount: number;
  productsCount: number;
  ordersThisMonth: number;
  quotesThisMonth: number;
  storageUsedMb: number;
  creditsUsed: number;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: PlanId;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
  billingCycle: BillingCycle;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: string;
  usage: SubscriptionUsage;
}

export interface AuthSession {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp in ms
  createdAt: string;
  updatedAt: string;
  ipAddress: string;
  userAgent: string;
  device: string;
  location?: string;
  isCurrent: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  roleLabel: string; // e.g. "Administrador Master", "Gerente Operacional", "Cliente VIP"
  photoUrl?: string;
  phone?: string;
  companyName?: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
  twoFactorEnabled: boolean;
  customPermissions?: Record<ResourcePermission, boolean>;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  allowedRoles: UserRole[];
  allowedPlans: PlanId[];
}

export interface BillingInvoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  pdfUrl?: string;
  planName: string;
  billingCycle: BillingCycle;
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'pix' | 'boleto';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  holderName?: string;
}

export interface AuthCredentials {
  emailOrUsername: string;
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
  companyName?: string;
  phone?: string;
  role?: UserRole;
  planId?: PlanId;
  acceptTerms: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: UserAccount;
  session?: AuthSession;
  subscription?: UserSubscription;
  error?: string;
  requiresEmailConfirmation?: boolean;
}
