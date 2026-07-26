import React from 'react';
import { useSubscription } from '../hooks/useSubscription';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  allowExpiredTrial?: boolean;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ 
  children, 
  fallback,
  allowExpiredTrial = false 
}) => {
  const { isExpired } = useSubscription();

  if (isExpired && !allowExpiredTrial) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
        <h3 className="text-lg font-bold text-amber-900">Período de Teste Expirado</h3>
        <p className="mt-2 text-sm text-amber-700">
          Seu período de teste gratuito de 10 dias terminou. Escolha um plano para desbloquear este recurso.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
