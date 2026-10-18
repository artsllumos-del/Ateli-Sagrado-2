import { useEffect, useMemo } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { BillingCycle } from '../domain/types/auth';

export interface UseSubscriptionOptions {
  onNavigate?: (view: string) => void;
  currentView?: string;
  redirectTo?: string;
}

export const useSubscription = (
  onNavigateOrOptions?: ((view: string) => void) | UseSubscriptionOptions,
  currentViewProp?: string
) => {
  const {
    user,
    subscription,
    currentPlan,
    availablePlans,
    invoices,
    paymentMethods,
    upgradePlan,
    downgradePlan,
    cancelSubscription,
    reactivateSubscription,
    renewSubscription,
    simulateStatus,
    checkLimit,
    recordUsageDelta,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod
  } = useAuthContext();

  const options: UseSubscriptionOptions = useMemo(() => {
    if (typeof onNavigateOrOptions === 'function') {
      return { onNavigate: onNavigateOrOptions, currentView: currentViewProp, redirectTo: 'subscription' };
    } else if (onNavigateOrOptions && typeof onNavigateOrOptions === 'object') {
      return { redirectTo: 'subscription', ...onNavigateOrOptions };
    }
    return { redirectTo: 'subscription' };
  }, [onNavigateOrOptions, currentViewProp]);

  // Account creation date resolution (from authenticated user, subscription, or stored session)
  const accountCreatedAt = useMemo(() => {
    if (user?.createdAt) return new Date(user.createdAt);
    if (subscription?.startDate) return new Date(subscription.startDate);
    try {
      const rawUser = localStorage.getItem('as_user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed.createdAt) return new Date(parsed.createdAt);
      }
    } catch {
      // fallback below
    }
    // Default fallback to 15 days ago so new accounts have 15 days remaining in their 30-day trial
    return new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  }, [user?.createdAt, subscription?.startDate]);

  // Calculation of expiry date (30 days validity from account creation or specific subscription period end)
  const expiryDate = useMemo(() => {
    if (subscription?.currentPeriodEnd) {
      return new Date(subscription.currentPeriodEnd);
    }
    // Standard 30 days validity from account creation date
    return new Date(accountCreatedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  }, [subscription?.currentPeriodEnd, accountCreatedAt]);

  // Remaining time in days calculated from account creation / validity period
  const now = Date.now();
  const diffMs = expiryDate.getTime() - now;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  // Status: 'active' | 'expired'
  const isExpired = subscription?.status === 'expired' || daysRemaining <= 0;
  const status: 'active' | 'expired' = isExpired ? 'expired' : 'active';

  // Changes to red when less than 5 days remain
  const isUrgent = daysRemaining < 5;

  const formattedRemainingTime = isExpired
    ? '0 dias restantes'
    : daysRemaining === 1
      ? '1 dia restante'
      : `${daysRemaining} dias restantes`;

  // Force redirection to 'pricing' if subscription validity has expired
  useEffect(() => {
    if (isExpired && options.onNavigate) {
      const target = options.redirectTo || 'pricing';
      if (options.currentView) {
        if (options.currentView !== target && options.currentView !== 'subscription') {
          options.onNavigate(target);
        }
      } else {
        options.onNavigate(target);
      }
    }
  }, [isExpired, options.onNavigate, options.currentView, options.redirectTo]);

  const isTrial = subscription?.status === 'trialing';
  const trialDaysRemaining = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - now) / (1000 * 60 * 60 * 24)))
    : 0;

  const daysUntilRenewal = daysRemaining;

  const hasDefaultPaymentMethod = paymentMethods.some(pm => pm.isDefault);
  const isAutoRenewActive = Boolean(
    subscription && !subscription.cancelAtPeriodEnd && status === 'active' && hasDefaultPaymentMethod
  );

  return {
    subscription,
    status,
    isExpired,
    daysRemaining,
    daysUntilRenewal,
    isUrgent,
    formattedRemainingTime,
    accountCreatedAt,
    expiryDate,
    currentPlan,
    availablePlans,
    invoices,
    paymentMethods,
    isTrial,
    trialDaysRemaining,
    isAutoRenewActive,
    hasDefaultPaymentMethod,
    upgradePlan,
    downgradePlan,
    cancelSubscription,
    reactivateSubscription,
    renewSubscription,
    simulateStatus,
    checkLimit,
    recordUsageDelta,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod
  };
};
