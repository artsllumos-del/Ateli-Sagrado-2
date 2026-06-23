import React, { useState } from 'react';
import { DbProvider, useDb } from './context/DbContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AuthView } from './components/AuthView';
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
import { ToastContainer, toast } from './components/Toast';

const AppContent: React.FC = () => {
 const { user } = useDb();
 const [currentView, setCurrentView] = useState('dashboard');
 const [sidebarOpen, setSidebarOpen] = useState(false);

 // If user is not authenticated, render the beautiful AuthView login gate
 if (!user) {
 return (
 <>
 <AuthView />
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
 switch (currentView) {
 case 'dashboard':
 return <DashboardView onViewChange={setCurrentView} onQuickAction={handleQuickAction} />;
 case 'inventory':
 return <InventoryView />;
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
 case 'settings':
 return <SettingsView />;
 default:
 return <DashboardView onViewChange={setCurrentView} onQuickAction={handleQuickAction} />;
 }
 };

 return (
 <div className="min-h-screen bg-slate-50 text-slate-800 flex">
 
 {/* Fixed Sidebar component */}
 <Sidebar 
 currentView={currentView} 
 onViewChange={setCurrentView} 
 isOpen={sidebarOpen} 
 onClose={() => setSidebarOpen(false)} 
 />

 {/* Main viewport area */}
 <div className="flex-1 flex flex-col lg:pl-68 min-h-screen">
 
 {/* Persistent top Header bar */}
 <Header 
 onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
 currentView={currentView} 
 onViewChange={setCurrentView}
 onQuickAction={handleQuickAction}
 />

 {/* Dynamic Inner views container */}
 <main className="p-6 max-w-[1600px] w-full mx-auto flex-1 pb-16">
 {renderMainContent()}
 </main>
 </div>

 <ToastContainer />
 </div>
 );
};

export default function App() {
 return (
 <DbProvider>
 <AppContent />
 </DbProvider>
 );
}
