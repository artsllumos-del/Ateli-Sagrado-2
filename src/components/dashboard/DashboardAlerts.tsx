import React from 'react';
import { AlertTriangle, Hammer, Package, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Order, InventoryItem, Quote, ProductionTask } from '../../types/erp';
import { Badge, EmptyState } from '../ui';

interface DashboardAlertsProps {
  onViewChange: (view: string, params?: Record<string, any>) => void;
  activeOrders: Order[];
  inventory: InventoryItem[];
  quotes: Quote[];
  productionTasks: ProductionTask[];
  pausedTaskIds: string[];
}

export const DashboardAlerts: React.FC<DashboardAlertsProps> = ({
  onViewChange,
  activeOrders,
  inventory,
  quotes,
  productionTasks,
  pausedTaskIds,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Production Alerts
  const delayedOrders = activeOrders.filter(o => 
    !['completed', 'shipped', 'delivered'].includes(o.status) && 
    new Date(o.dueDate) < new Date(todayStr)
  );

  const pausedTasks = productionTasks.filter(t => pausedTaskIds.includes(t.id));

  // Find materials needed but out of stock
  const outOfStockMaterials = inventory.filter(i => !i.isDeleted && i.quantity === 0);

  // 2. Stock Alerts
  const criticalStockItems = inventory.filter(i => !i.isDeleted && i.quantity === 0);
  const lowStockItems = inventory.filter(i => !i.isDeleted && i.quantity > 0 && i.quantity <= i.minQuantity);
  const reorderPointItems = inventory.filter(i => {
    if (i.isDeleted) return false;
    const avail = i.available ?? i.quantity;
    const point = i.reorderPoint || i.minQuantity;
    return avail > 0 && avail <= point && i.quantity > i.minQuantity;
  });
  const reservedExhaustedItems = inventory.filter(i => {
    if (i.isDeleted) return false;
    const avail = i.available ?? i.quantity;
    return i.quantity > 0 && avail === 0 && (i.reserved || 0) > 0;
  });

  // 3. Commercial Alerts & Reservations
  const pendingQuotes = quotes.filter(q => !q.isDeleted && q.status === 'pending');
  const quotesWithReservations = quotes.filter(q => !q.isDeleted && (q.status === 'pending' || q.status === 'analysis'));

  // Let's bundle alerts in an orderly array
  interface AlertItem {
    id: string;
    type: string;
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    icon: React.ReactNode;
    bgColor: string;
    borderColor: string;
    textColor: string;
    actionText: string;
    targetView: string;
    targetParams?: Record<string, any>;
  }

  const alertsList: AlertItem[] = [];

  // Delayed orders
  if (delayedOrders.length > 0) {
    alertsList.push({
      id: 'delayed_orders',
      type: 'production',
      title: 'Pedidos de Venda Atrasados',
      message: `${delayedOrders.length} pedido(s) estão com entrega atrasada! (${delayedOrders.map(o => o.orderNumber).slice(0, 3).join(', ')}).`,
      priority: 'high',
      icon: <Hammer className="text-rose-600" size={15} />,
      bgColor: 'bg-rose-50/80',
      borderColor: 'border-rose-150',
      textColor: 'text-rose-900',
      actionText: 'Ver Pedidos Atrasados',
      targetView: 'orders',
      targetParams: { status: 'delayed' }
    });
  }

  // Paused productions
  if (pausedTasks.length > 0) {
    alertsList.push({
      id: 'paused_productions',
      type: 'production',
      title: 'Produções Paradas / Pausadas',
      message: `${pausedTasks.length} peça(s) foram pausadas no chão de fábrica (${pausedTasks.map(t => t.productName).slice(0, 2).join(', ')}).`,
      priority: 'high',
      icon: <AlertTriangle className="text-rose-600" size={15} />,
      bgColor: 'bg-rose-50/80',
      borderColor: 'border-rose-150',
      textColor: 'text-rose-900',
      actionText: 'Retomar Produção',
      targetView: 'production'
    });
  }

  // Critical out of stock
  if (outOfStockMaterials.length > 0) {
    alertsList.push({
      id: 'out_of_stock_mats',
      type: 'production',
      title: 'Falta de Matéria-Prima',
      message: `Há ${outOfStockMaterials.length} insumo(s) zerado(s) em estoque: ${outOfStockMaterials.map(m => m.name).slice(0, 3).join(', ')}.`,
      priority: 'high',
      icon: <Package className="text-rose-600" size={15} />,
      bgColor: 'bg-rose-50/80',
      borderColor: 'border-rose-150',
      textColor: 'text-rose-900',
      actionText: 'Comprar Insumos',
      targetView: 'purchases'
    });
  }

  // Critical stock general
  if (criticalStockItems.length > 0) {
    alertsList.push({
      id: 'critical_stock',
      type: 'stock',
      title: 'Insumos com Estoque Crítico',
      message: `Estoque esgotado para os itens: ${criticalStockItems.map(m => m.name).slice(0, 2).join(', ')}.`,
      priority: 'high',
      icon: <Package className="text-rose-600" size={15} />,
      bgColor: 'bg-rose-50/80',
      borderColor: 'border-rose-150',
      textColor: 'text-rose-900',
      actionText: 'Ver Insumos Zerados',
      targetView: 'inventory',
      targetParams: { status: 'out_of_stock' }
    });
  }

  // Low stock
  if (lowStockItems.length > 0) {
    alertsList.push({
      id: 'low_stock',
      type: 'stock',
      title: 'Insumos Abaixo do Mínimo',
      message: `${lowStockItems.length} insumo(s) abaixo da quantidade mínima de segurança: ${lowStockItems.map(m => m.name).slice(0, 3).join(', ')}.`,
      priority: 'medium',
      icon: <Package className="text-amber-600" size={15} />,
      bgColor: 'bg-amber-50/50',
      borderColor: 'border-amber-150',
      textColor: 'text-amber-900',
      actionText: 'Ver Insumos Abaixo do Mínimo',
      targetView: 'inventory',
      targetParams: { status: 'low_stock' }
    });
  }

  // Reserved stock exhausted (Physical stock exists, but 100% committed to quotes/orders)
  if (reservedExhaustedItems.length > 0) {
    alertsList.push({
      id: 'reserved_exhausted',
      type: 'stock',
      title: 'Saldo Livre Comprometido por Reservas',
      message: `${reservedExhaustedItems.length} insumo(s) possuem estoque físico, mas saldo disponível está zerado devido a reservas (${reservedExhaustedItems.map(m => m.name).slice(0, 2).join(', ')}).`,
      priority: 'high',
      icon: <Package className="text-amber-600" size={15} />,
      bgColor: 'bg-amber-50/60',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-950',
      actionText: 'Ver Reservas no Estoque',
      targetView: 'inventory'
    });
  }

  // Reorder point reached
  if (reorderPointItems.length > 0) {
    alertsList.push({
      id: 'reorder_point',
      type: 'stock',
      title: 'Ponto de Reposição Atingido',
      message: `${reorderPointItems.length} insumo(s) atingiram o ponto de reposição planejado: ${reorderPointItems.map(m => m.name).slice(0, 2).join(', ')}.`,
      priority: 'medium',
      icon: <Package className="text-blue-600" size={15} />,
      bgColor: 'bg-blue-50/50',
      borderColor: 'border-blue-150',
      textColor: 'text-blue-900',
      actionText: 'Comprar Reposição',
      targetView: 'purchases'
    });
  }

  // Pending quotes holding reservations
  if (quotesWithReservations.length > 0) {
    alertsList.push({
      id: 'pending_quotes_res',
      type: 'commercial',
      title: 'Orçamentos Retendo Reservas',
      message: `Há ${quotesWithReservations.length} orçamento(s) em aberto retendo materiais no estoque. Acompanhe a decisão do cliente ou libere as reservas.`,
      priority: 'low',
      icon: <FileText className="text-purple-600" size={15} />,
      bgColor: 'bg-purple-50/40',
      borderColor: 'border-purple-150',
      textColor: 'text-purple-950',
      actionText: 'Gerenciar Orçamentos',
      targetView: 'quotes'
    });
  }

  return (
    <div className="bg-white border border-slate-200/80 p-5 sm:p-6 rounded-2xl shadow-xs space-y-4 no-print">
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="text-amber-600" />
        <div>
          <h3 className="font-serif font-semibold text-base text-slate-900">Alertas Inteligentes</h3>
          <p className="text-[11px] text-slate-500">Ações prioritárias e críticas identificadas no sistema</p>
        </div>
      </div>

      {alertsList.length === 0 ? (
        <EmptyState
          title="Tudo em conformidade"
          description="Nenhum alerta pendente ou inconformidade em estoque ou produção no momento."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {alertsList.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border ${alert.bgColor} ${alert.borderColor} flex flex-col justify-between gap-3 text-xs`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {alert.icon}
                  <span className={`font-bold ${alert.textColor}`}>{alert.title}</span>
                  <div className="ml-auto">
                    <Badge
                      variant={alert.priority === 'high' ? 'danger' : alert.priority === 'medium' ? 'warning' : 'neutral'}
                      size="sm"
                    >
                      {alert.priority === 'high' ? 'Alta' : alert.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                </div>
                <p className="text-slate-600 text-[11.5px] leading-relaxed">
                  {alert.message}
                </p>
              </div>

              <button
                onClick={() => onViewChange(alert.targetView, alert.targetParams)}
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 hover:text-amber-800 transition-colors cursor-pointer self-start group"
              >
                {alert.actionText}
                <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
