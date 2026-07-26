import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  UserAccount, 
  AuthSession, 
  UserSubscription, 
  Plan, 
  ResourcePermission, 
  UserRole, 
  PlanId, 
  BillingCycle, 
  AuthCredentials, 
  RegisterData, 
  SubscriptionUsage,
  BillingInvoice,
  PaymentMethod
} from '../domain/types/auth';
import { LocalAuthRepository } from '../infrastructure/repositories/LocalAuthRepository';
import { LocalUserRepository } from '../infrastructure/repositories/LocalUserRepository';
import { LocalSessionRepository } from '../infrastructure/repositories/LocalSessionRepository';
import { LocalSubscriptionRepository } from '../infrastructure/repositories/LocalSubscriptionRepository';
import { LocalPermissionRepository } from '../infrastructure/repositories/LocalPermissionRepository';
import { LocalBillingRepository } from '../infrastructure/repositories/LocalBillingRepository';
import { LocalNotificationRepository } from '../infrastructure/repositories/LocalNotificationRepository';
import { LocalFeatureFlagRepository } from '../infrastructure/repositories/LocalFeatureFlagRepository';
import { AppNotificationItem } from '../domain/repositories/INotificationRepository';

interface AuthContextType {
  user: UserAccount | null;
  session: AuthSession | null;
  subscription: UserSubscription | null;
  currentPlan: Plan | null;
  availablePlans: Plan[];
  permissions: Record<ResourcePermission, boolean>;
  notifications: AppNotificationItem[];
  activeSessions: AuthSession[];
  invoices: BillingInvoice[];
  paymentMethods: PaymentMethod[];
  loading: boolean;
  
  // Auth Operations
  login: (credentials: AuthCredentials) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  recoverPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  confirmEmail: (code: string) => Promise<{ success: boolean; message: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  
  // User Management
  updateProfile: (data: Partial<UserAccount>) => Promise<UserAccount>;
  
  // Subscription Operations
  upgradePlan: (planId: PlanId, cycle: BillingCycle) => Promise<UserSubscription>;
  downgradePlan: (planId: PlanId, cycle: BillingCycle) => Promise<UserSubscription>;
  cancelSubscription: () => Promise<UserSubscription>;
  reactivateSubscription: () => Promise<UserSubscription>;
  checkLimit: (resourceKey: keyof SubscriptionUsage, amountToAdd?: number) => Promise<{ allowed: boolean; current: number; max: number; message?: string }>;
  recordUsageDelta: (delta: Partial<SubscriptionUsage>) => Promise<void>;

  // Session Management
  revokeSession: (sessionId: string) => Promise<void>;
  revokeAllOtherSessions: () => Promise<void>;

  // Permissions & Features
  hasPermission: (permission: ResourcePermission) => boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccessModule: (moduleId: string) => boolean;
  isFeatureEnabled: (key: string) => Promise<boolean>;

  // Notifications
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // Refresh
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Instantiate Repositories (Swappable for Supabase in Infrastructure layer)
const authRepo = new LocalAuthRepository();
const userRepo = new LocalUserRepository();
const sessionRepo = new LocalSessionRepository();
const subRepo = new LocalSubscriptionRepository();
const permRepo = new LocalPermissionRepository();
const billingRepo = new LocalBillingRepository();
const notifRepo = new LocalNotificationRepository();
const featureRepo = new LocalFeatureFlagRepository();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [permissions, setPermissions] = useState<Record<ResourcePermission, boolean>>({} as Record<ResourcePermission, boolean>);
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [activeSessions, setActiveSessions] = useState<AuthSession[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadUserData = useCallback(async (currUser: UserAccount) => {
    try {
      const [sub, perms, plans, notifs, sessList, invs, pms] = await Promise.all([
        subRepo.getUserSubscription(currUser.id),
        permRepo.getUserPermissions(currUser),
        subRepo.getAvailablePlans(),
        notifRepo.getNotifications(currUser.id),
        sessionRepo.getActiveSessions(currUser.id),
        billingRepo.getInvoices(currUser.id),
        billingRepo.getPaymentMethods(currUser.id)
      ]);

      const plan = plans.find(p => p.id === sub.planId) || plans[0];

      setSubscription(sub);
      setPermissions(perms);
      setAvailablePlans(plans);
      setCurrentPlan(plan);
      setNotifications(notifs);
      setActiveSessions(sessList);
      setInvoices(invs);
      setPaymentMethods(pms);
    } catch (err) {
      console.error('Erro ao carregar dados do usuário:', err);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const currSession = await authRepo.getCurrentSession();
      if (currSession) {
        const currUser = await authRepo.getCurrentUser();
        if (currUser) {
          setUser(currUser);
          setSession(currSession);
          await loadUserData(currUser);
        } else {
          setUser(null);
          setSession(null);
        }
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (err) {
      console.error('Erro ao inicializar sessão:', err);
    } finally {
      setLoading(false);
    }
  }, [loadUserData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const login = async (credentials: AuthCredentials) => {
    setLoading(true);
    try {
      const res = await authRepo.login(credentials);
      if (res.success && res.user && res.session) {
        setUser(res.user);
        setSession(res.session);
        await loadUserData(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Erro ao realizar login' };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const res = await authRepo.loginWithGoogle();
      if (res.success && res.user && res.session) {
        setUser(res.user);
        setSession(res.session);
        await loadUserData(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Erro no login com Google' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    try {
      const res = await authRepo.register(data);
      if (res.success && res.user && res.session) {
        setUser(res.user);
        setSession(res.session);
        await loadUserData(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Erro ao criar conta' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authRepo.logout(session?.id);
      setUser(null);
      setSession(null);
      setSubscription(null);
      setCurrentPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const recoverPassword = async (email: string) => {
    return authRepo.recoverPassword(email);
  };

  const resetPassword = async (token: string, newPass: string) => {
    return authRepo.resetPassword(token, newPass);
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!user) return { success: false, message: 'Usuário não autenticado' };
    return authRepo.changePassword(user.id, currentPass, newPass);
  };

  const confirmEmail = async (code: string) => {
    return authRepo.confirmEmail(code);
  };

  const resendVerificationEmail = async (email: string) => {
    return authRepo.resendVerificationEmail(email);
  };

  const updateProfile = async (data: Partial<UserAccount>) => {
    if (!user) throw new Error('Usuário não autenticado');
    const updated = await userRepo.updateProfile(user.id, data);
    setUser(updated);
    return updated;
  };

  const upgradePlan = async (planId: PlanId, cycle: BillingCycle) => {
    if (!user) throw new Error('Usuário não autenticado');
    const updatedSub = await subRepo.upgradePlan(user.id, planId, cycle);
    const plans = await subRepo.getAvailablePlans();
    const plan = plans.find(p => p.id === planId) || null;
    setSubscription(updatedSub);
    setCurrentPlan(plan);
    return updatedSub;
  };

  const downgradePlan = async (planId: PlanId, cycle: BillingCycle) => {
    return upgradePlan(planId, cycle);
  };

  const cancelSubscription = async () => {
    if (!user) throw new Error('Usuário não autenticado');
    const updated = await subRepo.cancelSubscription(user.id);
    setSubscription(updated);
    return updated;
  };

  const reactivateSubscription = async () => {
    if (!user) throw new Error('Usuário não autenticado');
    const updated = await subRepo.reactivateSubscription(user.id);
    setSubscription(updated);
    return updated;
  };

  const checkLimit = async (resourceKey: keyof SubscriptionUsage, amountToAdd = 1) => {
    if (!user) return { allowed: false, current: 0, max: 0, message: 'Usuário não autenticado' };
    return subRepo.checkResourceLimit(user.id, resourceKey, amountToAdd);
  };

  const recordUsageDelta = async (delta: Partial<SubscriptionUsage>) => {
    if (!user) return;
    const newUsage = await subRepo.recordUsage(user.id, delta);
    setSubscription(prev => prev ? { ...prev, usage: newUsage } : null);
  };

  const revokeSession = async (sessionId: string) => {
    await sessionRepo.revokeSession(sessionId);
    if (user) {
      const sessList = await sessionRepo.getActiveSessions(user.id);
      setActiveSessions(sessList);
    }
  };

  const revokeAllOtherSessions = async () => {
    if (user && session) {
      await sessionRepo.revokeAllOtherSessions(user.id, session.id);
      const sessList = await sessionRepo.getActiveSessions(user.id);
      setActiveSessions(sessList);
    }
  };

  const hasPermission = (permission: ResourcePermission): boolean => {
    if (!user) return permission === 'products:read';
    if (user.role === 'admin') return true;
    return Boolean(permissions[permission]);
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const list = Array.isArray(roles) ? roles : [roles];
    return list.includes(user.role);
  };

  const canAccessModule = (moduleId: string): boolean => {
    if (!user) return moduleId === 'products';
    if (user.role === 'admin') return true;

    const moduleToPermMap: Record<string, ResourcePermission> = {
      dashboard: 'dashboard:read',
      inventory: 'inventory:read',
      purchases: 'purchases:read',
      products: 'products:read',
      pricing: 'pricing:read',
      clients: 'clients:read',
      quotes: 'quotes:read',
      orders: 'orders:read',
      production: 'production:read',
      financial: 'financial:read',
      users: 'users:manage',
      settings: 'settings:manage',
      subscription: 'subscription:manage',
    };

    const perm = moduleToPermMap[moduleId];
    if (!perm) return true;
    return hasPermission(perm);
  };

  const isFeatureEnabled = async (key: string): Promise<boolean> => {
    return featureRepo.isFeatureEnabled(key, user?.role, subscription?.planId);
  };

  const markNotificationAsRead = async (id: string) => {
    if (!user) return;
    await notifRepo.markAsRead(user.id, id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    await notifRepo.markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      subscription,
      currentPlan,
      availablePlans,
      permissions,
      notifications,
      activeSessions,
      invoices,
      paymentMethods,
      loading,
      login,
      loginWithGoogle,
      register,
      logout,
      recoverPassword,
      resetPassword,
      changePassword,
      confirmEmail,
      resendVerificationEmail,
      updateProfile,
      upgradePlan,
      downgradePlan,
      cancelSubscription,
      reactivateSubscription,
      checkLimit,
      recordUsageDelta,
      revokeSession,
      revokeAllOtherSessions,
      hasPermission,
      hasRole,
      canAccessModule,
      isFeatureEnabled,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      refreshData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de um AuthProvider');
  }
  return context;
};
