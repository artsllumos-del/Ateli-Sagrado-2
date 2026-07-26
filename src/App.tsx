import React, { useState } from 'react';
import { DbProvider, useDb } from './context/DbContext';
import { AuthProvider } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ModernAuthView } from './components/auth/ModernAuthView';
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
import { UsersPermissionsView } from './components/UsersPermissionsView';
import { SubscriptionBillingView } from './components/subscription/SubscriptionBillingView';
import { AccountSecurityView } from './components/account/AccountSecurityView';
import { UserProfileView } from './components/account/UserProfileView';
import { motion, AnimatePresence } from 'motion/react';
import { ToastContainer, toast } from './components/Toast';

import { useAuth } from './hooks/useAuth';

const AppContent: React.FC = () => {
  const { user: dbUser, settings } = useDb();
  const { user: authUser, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = authUser || dbUser;

  const isFirstSetup = settings?.firstSetup;
  const activeView = isFirstSetup ? 'settings' : currentView;

  // Show loading indicator while verifying session
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 font-sans p-4">
        <div className="w-12 h-12 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-4 shadow-sm" />
        <h2 className="text-base font-bold text-stone-800">Ateliê Sagrado ERP</h2>
        <p className="text-xs text-stone-500 mt-1">Carregando permissões e dados da sessão...</p>
      </div>
    );
  }

  // If user is not authenticated, render the beautiful ModernAuthView
  if (!user) {
    return (
      <>
        <ModernAuthView onSuccess={() => setCurrentView('dashboard')} />
        <ToastContainer />
      </>
    );
  }

 // Handle Quick Action Trigger
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
 setCurrentView('products');
 toast.info("Ações Rápidas", "Redirecionado para Produtos. Adicione um novo produto com fórmula.");
 break;
 case 'quote':
 setCurrentView('quotes');
 toast.info("Ações Rápidas", "Redirecionado para Orçamentos. Clique em 'Novo Orçamento' para simular.");
 break;
 }
 };

 // Render correct view based on navigation menu item selection
 const renderMainContent = () => {
 switch (activeView) {
 case 'dashboard':
 return <DashboardView onViewChange={setCurrentView} onQuickAction={handleQuickAction} />;
 case 'inventory':
 return <InventoryView />;
 case 'purchases':
 return <PurchasesView />;
 case 'products':
 return <ProductsView />;
 case 'pricing':
 return <PricingView />;
 case 'clients':
 return <ClientsView />;
 case 'quotes':
 return <QuotesView />;
 case 'orders':
 return <OrdersView />;
 case 'production':
 return <ProductionView />;
 case 'financial':
 return <FinancialView />;
 case 'subscription':
 return <SubscriptionBillingView />;
 case 'users':
 return <UsersPermissionsView />;
 case 'profile':
 return <UserProfileView />;
 case 'account_security':
 return <AccountSecurityView />;
 case 'settings':
 return <SettingsView />;
 default:
 return <DashboardView onViewChange={setCurrentView} onQuickAction={handleQuickAction} />;
 }
 };

 return (
 <div className="min-h-screen bg-bg-app text-ink-900 flex">
 
 {/* Fixed Sidebar component */}
 <Sidebar 
 currentView={activeView} 
 onViewChange={setCurrentView} 
 isOpen={sidebarOpen} 
 onClose={() => setSidebarOpen(false)} 
 />

 {/* Main viewport area */}
 <div className="flex-1 flex flex-col lg:pl-20 min-h-screen print:pl-0">
 
 {/* Persistent top Header bar */}
 <Header 
 onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
 currentView={activeView} 
 onViewChange={setCurrentView}
 onQuickAction={handleQuickAction}
 />

 {/* Dynamic Inner views container */}
 <main className="p-6 max-w-[1600px] w-full mx-auto flex-1 pb-16 print:p-0 print:max-w-none">
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
 </main>
 </div>

 <ToastContainer />
 </div>
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
