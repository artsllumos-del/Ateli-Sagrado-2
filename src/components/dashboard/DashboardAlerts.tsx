import React from 'react';
import { AlertTriangle, Hammer, Package, FileText, ArrowRight } from 'lucide-react';
import { Order, InventoryItem, Quote, ProductionTask } from '../../types/erp';

interface DashboardAlertsProps {
  onViewChange: (view: string) => void;
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

  // 3. Commercial Alerts
  const pendingQuotes = quotes.filter(q => q.status === 'pending');

  // Let's bundle alerts in an orderly array
  const alertsList = [];

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
      actionText: 'Resolver no Chão de Fábrica',
      targetView: 'production'
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
      actionText: 'Reabastecer Estoque',
      targetView: 'inventory'
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
      actionText: 'Visualizar Estoque',
      targetView: 'inventory'
    });
  }

  // Pending quotes
  if (pendingQuotes.length > 0) {
    alertsList.push({
      id: 'pending_quotes',
      type: 'commercial',
      title: 'Orçamentos Pendentes',
      message: `Há ${pendingQuotes.length} orçamento(s) aguardando aprovação comercial de clientes.`,
      priority: 'low',
      icon: <FileText className="text-blue-600" size={15} />,
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200/60',
      textColor: 'text-slate-900',
      actionText: 'Ver Orçamentos',
      targetView: 'quotes'
    });
  }

  return (
    <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4 no-print">
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="text-rose-500" />
        <div>
          <h3 className="font-serif font-semibold text-base text-slate-900">Alertas Inteligentes</h3>
          <p className="text-[11px] text-slate-500">Ações prioritárias e críticas identificadas no sistema</p>
        </div>
      </div>

      {alertsList.length === 0 ? (
        <div className="p-8 text-center bg-emerald-50/40 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-medium">
          🎉 Excelente! Nenhum alerta pendente ou inconformidade em estoque ou produção no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alertsList.map((alert) => (
            <div
              key={alert.id}
              className={`p-4.5 rounded-xl border ${alert.bgColor} ${alert.borderColor} flex flex-col justify-between gap-3 text-xs`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {alert.icon}
                  <span className={`font-bold ${alert.textColor}`}>{alert.title}</span>
                  <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    alert.priority === 'high' ? 'bg-rose-100 text-rose-800' :
                    alert.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-200 text-slate-800'
                  }`}>
                    {alert.priority === 'high' ? 'Alta' : alert.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {alert.message}
                </p>
              </div>

              <button
                onClick={() => onViewChange(alert.targetView)}
                className="mt-1 inline-flex items-center gap-1 text-[10.5px] font-bold text-slate-800 hover:text-amber-700 transition-colors cursor-pointer self-start group"
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
