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
    recordUsageDelta
  } = useAuthContext();

  const isTrial = subscription?.status === 'trialing';
  const isExpired = subscription?.status === 'expired';
  const trialDaysRemaining = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    subscription,
    currentPlan,
    availablePlans,
    invoices,
    paymentMethods,
    isTrial,
    isExpired,
    trialDaysRemaining,
    upgradePlan,
    downgradePlan,
    cancelSubscription,
    reactivateSubscription,
    checkLimit,
    recordUsageDelta
  };
};
