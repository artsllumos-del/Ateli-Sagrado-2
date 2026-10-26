import React, { useState } from 'react';
import { DbProvider, useDb } from './context/DbContext';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { ModernAuthView } from './components/auth/ModernAuthView';
import { LandingPageView } from './components/landing/LandingPageView';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { ProductsView } from './components/ProductsView';
import { PricingView } from './components/PricingView';
import { ClientsView } from './components/ClientsView';
import { QuotesView } from './components/QuotesView';
import { OrdersView } from './components/OrdersView';
import { ProductionView } from './components/ProductionView';
import { FinancialView } from './components/FinancialView';
import { SettingsView } from './components/SettingsView';
import { PurchasesView } from './components/PurchasesView';
import { SubscriptionBillingView } from './components/subscription/SubscriptionBillingView';
import { AccountSecurityView } from './components/account/AccountSecurityView';
import { UserProfileView } from './components/account/UserProfileView';
import { motion, AnimatePresence } from 'motion/react';
import { ToastContainer, toast } from './components/Toast';

import { useAuth } from './hooks/useAuth';
import { useSubscription } from './hooks/useSubscription';

const AppContent: React.FC = () => {
  const { user: dbUser, settings } = useDb();
  const { user: authUser, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewParams, setViewParams] = useState<Record<string, any>>({});

  // Unauthenticated screen routing: 'landing' (presentation) or 'auth' (login / register)
  const isDirectLogin = typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/register');
  const [unauthScreen, setUnauthScreen] = useState<'landing' | 'auth'>(isDirectLogin ? 'auth' : 'landing');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  const user = authUser || dbUser;

  const isFirstSetup = settings?.firstSetup;
  const activeView = isFirstSetup ? 'settings' : currentView;

  // Enforce subscription tracking and automatic redirection to 'pricing' when expired
  useSubscription(setCurrentView, activeView);

  // Show loading indicator during initial authentication check
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-app">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
          <p className="text-sm font-medium text-stone-600">Carregando Ateliê Sagrado ERP...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated: show Landing Page as the presentation & lead acquisition front door,
  // or ModernAuthView if they chose to log in or register.
  if (!user) {
    if (unauthScreen === 'landing') {
      return (
        <>
          <LandingPageView
            onLogin={() => {
              setAuthInitialMode('login');
              setUnauthScreen('auth');
            }}
            onRegister={(planId) => {
              setAuthInitialMode('register');
              setUnauthScreen('auth');
            }}
            onOpenApp={() => {
              setAuthInitialMode('login');
              setUnauthScreen('auth');
            }}
            isAuthenticated={false}
          />
          <ToastContainer />
        </>
      );
    }

    return (
      <>
        <ModernAuthView
          initialMode={authInitialMode}
          onBackToLanding={() => setUnauthScreen('landing')}
        />
        <ToastContainer />
      </>
    );
  }

  // Handle Navigation with optional filter parameters (Drill-down support)
  const handleNavigate = (view: string, params?: Record<string, any>) => {
    if (params) {
      setViewParams(prev => ({ ...prev, [view]: params }));
    }
    setCurrentView(view);
  };

  // Handle Quick Action Trigger with direct navigation
  const handleQuickAction = (actionType: 'order' | 'client' | 'product' | 'quote') => {
    switch (actionType) {
      case 'order':
        setCurrentView('orders');
        toast.info("Ações Rápidas", "Redirecionado para Pedidos. Clique em 'Novo Pedido' para iniciar.");
        break;
      case 'client':
        setCurrentView('clients');
        toast.info("Ações Rápidas", "Redirecionado para Clientes. Clique em 'Novo Cliente' para registrar.");
        break;
      case 'product':
        handleNavigate('products', { screen: 'create' });
        toast.info("Ações Rápidas", "Redirecionado para Cadastro de Novo Produto.");
        break;
      case 'quote':
        setCurrentView('quotes');
        toast.info("Ações Rápidas", "Redirecionado para Orçamentos. Clique em 'Novo Orçamento' para simular.");
        break;
    }
  };

  // Render correct view based on navigation menu item selection (Acesso Integral e Ilimitado)
  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onViewChange={handleNavigate} onQuickAction={handleQuickAction} />;
      case 'inventory':
        return <InventoryView initialFilter={viewParams.inventory} />;
      case 'purchases':
        return <PurchasesView initialFilter={viewParams.purchases} />;
      case 'products':
        return <ProductsView initialScreen={viewParams.products?.screen} onNavigate={handleNavigate} />;
      case 'pricing':
        return <PricingView onNavigate={handleNavigate} />;
      case 'clients':
        return <ClientsView />;
      case 'quotes':
        return <QuotesView />;
      case 'orders':
        return <OrdersView initialFilter={viewParams.orders} />;
      case 'production':
        return <ProductionView />;
      case 'financial':
        return <FinancialView initialFilter={viewParams.financial} />;
      case 'subscription':
        return <SubscriptionBillingView onNavigate={handleNavigate} />;
      case 'profile':
      case 'account_security':
        return <UserProfileView />;
      case 'settings':
        return <SettingsView onViewChange={handleNavigate} />;
      case 'landing':
        return (
          <LandingPageView
            onLogin={() => {}}
            onRegister={() => {}}
            onOpenApp={() => setCurrentView('dashboard')}
            isAuthenticated={true}
            userName={user?.name}
          />
        );
      default:
        return <DashboardView onViewChange={handleNavigate} onQuickAction={handleQuickAction} />;
    }
  };

  return (
    <AppShell
      currentView={activeView}
      onViewChange={setCurrentView}
      onQuickAction={handleQuickAction}
      sidebarOpen={sidebarOpen}
      onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
      onSidebarClose={() => setSidebarOpen(false)}
      isFirstSetup={Boolean(isFirstSetup)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
        >
          {renderMainContent()}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
};

export default function App() {
 return (
 <AuthProvider>
  <DbProvider>
   <AppContent />
  </DbProvider>
 </AuthProvider>
 );
}
