import { useAuthContext } from '../context/AuthContext';

export const useSubscription = () => {
  const {
    subscription,
    currentPlan,
    availablePlans,
    invoices,
    paymentMethods,
    upgradePlan,
    downgradePlan,
    cancelSubscription,
    reactivateSubscription,
    checkLimit,
    recordUsageDelta,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod
  } = useAuthContext();

  const isTrial = subscription?.status === 'trialing';
  const isExpired = subscription?.status === 'expired';
  const trialDaysRemaining = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const daysUntilRenewal = subscription?.currentPeriodEnd
    ? Math.max(0, Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const hasDefaultPaymentMethod = paymentMethods.some(pm => pm.isDefault);
  const isAutoRenewActive = Boolean(subscription && !subscription.cancelAtPeriodEnd && subscription.status === 'active' && hasDefaultPaymentMethod);

  return {
    subscription,
    currentPlan,
    availablePlans,
    invoices,
    paymentMethods,
    isTrial,
    isExpired,
    trialDaysRemaining,
    daysUntilRenewal,
    isAutoRenewActive,
    hasDefaultPaymentMethod,
    upgradePlan,
    downgradePlan,
    cancelSubscription,
    reactivateSubscription,
    checkLimit,
    recordUsageDelta,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod
  };
};
