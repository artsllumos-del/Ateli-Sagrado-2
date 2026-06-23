import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Order, OrderStatus, OrderItem } from '../types/erp';
import { 
 Search, Plus, Edit3, Trash2, X, ShoppingBag, Eye, Calendar, Clock, 
 MapPin, CheckCircle2, RefreshCw, FileText, ArrowUpRight, HelpCircle, AlertCircle, AlertTriangle
} from 'lucide-react';
import { toast } from './Toast';

export const OrdersView: React.FC = () => {
 const { orders, clients, products, addOrder, updateOrder, deleteOrder, addOrderTimeline } = useDb();

 // Component States
 const [search, setSearch] = useState('');
 const [selectedStatus, setSelectedStatus] = useState<string>('all');
 const [showAddModal, setShowAddModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [showDetailModal, setShowDetailModal] = useState(false);
 const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
 const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; code: string } | null>(null);

 // Form states
 const [clientId, setClientId] = useState('');
 const [dueDate, setDueDate] = useState('');
 const [status, setStatus] = useState<OrderStatus>('received');
 const [items, setItems] = useState<OrderItem[]>([]);

 // Items workspace fields
 const [selectedProdId, setSelectedProdId] = useState('');
 const [selectedQty, setSelectedQty] = useState(1);

 const activeOrders = orders.filter(o => !o.isDeleted);
 const activeClients = clients.filter(c => !c.isDeleted);
 const activeProducts = products.filter(p => !p.isDeleted);

 // Filter orders
 const filteredOrders = activeOrders.filter(o => {
 const matchesSearch = o.clientName.toLowerCase().includes(search.toLowerCase()) || 
 o.orderNumber.toLowerCase().includes(search.toLowerCase());
 const matchesStatus = selectedStatus === 'all' || o.status === selectedStatus;
 return matchesSearch && matchesStatus;
 });

 const subtotalValue = items.reduce((sum, item) => sum + item.total, 0);

 const handleOpenAdd = () => {
 setClientId(activeClients[0]?.id || '');
 setDueDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 10 days
 setStatus('received');
 setItems([]);
 setSelectedProdId(activeProducts[0]?.id || '');
 setSelectedQty(1);
 setShowAddModal(true);
 };

 const handleOpenEdit = (o: Order) => {
 setSelectedOrder(o);
 setClientId(o.clientId);
 setDueDate(o.dueDate);
 setStatus(o.status);
 setItems(o.items || []);
 setSelectedProdId(activeProducts[0]?.id || '');
 setSelectedQty(1);
 setShowEditModal(true);
 };

 const handleAddItem = () => {
 if (!selectedProdId) return;
 const prod = products.find(p => p.id === selectedProdId);
 if (!prod) return;

 const existing = items.find(item => item.productId === selectedProdId);
 if (existing) {
 toast.warning("Item duplicado", "O produto já consta nos itens.");
 return;
 }

 const newItem: OrderItem = {
 productId: selectedProdId,
 productName: prod.name,
 quantity: selectedQty,
 price: prod.sellingPrice,
 total: selectedQty * prod.sellingPrice
 };

 setItems([...items, newItem]);
 toast.success("Item vinculado", `${prod.name} x ${selectedQty}`);
 };

 const handleRemoveItem = (prodId: string) => {
 setItems(items.filter(item => item.productId !== prodId));
 };

 const handleSaveAdd = (e: React.FormEvent) => {
 e.preventDefault();
 if (!clientId) {
 toast.error("Validação", "Selecione um cliente para vincular.");
 return;
 }
 if (items.length === 0) {
 toast.error("Validação", "O pedido precisa de pelo menos 1 item.");
 return;
 }

 const client = clients.find(c => c.id === clientId);
 addOrder({
 clientId,
 clientName: client?.name || "Cliente",
 items,
 totalValue: subtotalValue,
 date: new Date().toISOString().split('T')[0],
 dueDate,
 status,
 productionProgress: 0
 });

 toast.success("Pedido registrado!", "Pedido gerado e matérias-primas baixadas do estoque.");
 setShowAddModal(false);
 };

 const handleSaveEdit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedOrder) return;

 const client = clients.find(c => c.id === clientId);
 updateOrder(selectedOrder.id, {
 clientId,
 clientName: client?.name || "Cliente",
 items,
 totalValue: subtotalValue,
 dueDate,
 status
 });

 toast.success("Pedido atualizado!", "As modificações foram salvas com sucesso.");
 setShowEditModal(false);
 };

 const handleStatusChange = (id: string, newStatus: OrderStatus) => {
 updateOrder(id, { status: newStatus });
 toast.success("Status Atualizado", `Pedido movido para o estágio "${getStatusLabel(newStatus)}".`);
 };

 const handleDelete = (id: string, code: string) => {
 setDeleteConfirm({ id, code });
 };

 const handleConfirmDelete = () => {
 if (!deleteConfirm) return;
 deleteOrder(deleteConfirm.id);
 toast.warning("Pedido removido", `Pedido de venda ${deleteConfirm.code} foi arquivado.`);
 setDeleteConfirm(null);
 };

 const getStatusLabel = (s: OrderStatus): string => {
 const labels: Record<OrderStatus, string> = {
 received: 'Recebido',
 approved: 'Aprovado',
 production: 'Em Produção',
 finishing: 'Em Acabamento',
 completed: 'Finalizado',
 shipped: 'Enviado',
 delivered: 'Entregue'
 };
 return labels[s] || s;
 };

 return (
 <div className="space-y-6 animate-slide-in-up">
 
 {/* Control Filters Bar */}
 <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
 
 <div className="relative flex-1 max-w-md">
 <input
 type="text"
 placeholder="Buscar por cliente ou código PED-..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
 />
 <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
 </div>

 <select
 value={selectedStatus}
 onChange={(e) => setSelectedStatus(e.target.value)}
 className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
 >
 <option value="all">Todos os Status</option>
 <option value="received">Recebido</option>
 <option value="approved">Aprovado / Programado</option>
 <option value="production">Em Produção</option>
 <option value="finishing">Em Acabamento</option>
 <option value="completed">Finalizado</option>
 <option value="shipped">Enviado</option>
 <option value="delivered">Entregue</option>
 </select>
 </div>

 <button
 onClick={handleOpenAdd}
 className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
 >
 <Plus size={14} /> Novo Pedido
 </button>
 </div>

 {/* Grid of Orders */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {filteredOrders.map(order => {
 const isDelayed = order.status !== 'delivered' && order.status !== 'completed' && new Date(order.dueDate) < new Date();

 return (
 <div key={order.id} className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
 <div>
 {/* Header card with order code, date and flags */}
 <div className="flex justify-between items-start">
 <div>
 <h3 className="font-bold text-sm text-slate-900 font-mono flex items-center gap-2">
 {order.orderNumber}
 {isDelayed && (
 <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 rounded-md text-[9px] font-bold tracking-wider animate-pulse">
 ATRASADO
 </span>
 )}
 </h3>
 <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Emissão: {order.date}</p>
 </div>

 {/* Dropdown fast status change */}
 <select
 value={order.status}
 onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
 className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 "
 >
 <option value="received">Recebido</option>
 <option value="approved">Aprovado</option>
 <option value="production">Em Produção</option>
 <option value="finishing">Em Acabamento</option>
 <option value="completed">Finalizado</option>
 <option value="shipped">Enviado</option>
 <option value="delivered">Entregue</option>
 </select>
 </div>

 {/* Client Profile and items list */}
 <div className="mt-4 pt-3 border-t border-slate-100 ">
 <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Cliente</p>
 <p className="font-bold text-xs text-slate-800 mt-1">{order.clientName}</p>
 
 {/* Delivery date block */}
 <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1.5 font-semibold">
 <Calendar size={12} className="text-slate-450" /> Prazo Previsto: <span className={isDelayed ? 'text-rose-500' : 'text-slate-700 '}>{order.dueDate}</span>
 </div>
 </div>

 {/* Production bar visual progress */}
 <div className="mt-4">
 <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase mb-1.5">
 <span>Estágio de Produção</span>
 <span className="text-slate-700 font-mono">{order.productionProgress}% Concluído</span>
 </div>
 <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
 <div 
 className={`h-full transition-all duration-300 ${
 order.productionProgress === 100 ? 'bg-emerald-500' :
 order.productionProgress > 50 ? 'bg-purple-500' : 'bg-amber-500'
 }`}
 style={{ width: `${order.productionProgress}%` }}
 />
 </div>
 </div>

 {/* Summary Items listed inside card */}
 <div className="mt-4 pt-3 border-t border-slate-100 ">
 <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Itens do Pedido</p>
 <div className="space-y-1">
 {order.items?.map((item, idx) => (
 <p key={idx} className="text-xs text-slate-600 font-medium">
 • {item.productName} (x{item.quantity})
 </p>
 ))}
 </div>
 </div>

 </div>

 {/* CRM Card Actions */}
 <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
 <span className="text-sm font-bold font-mono text-slate-900 ">
 R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
 </span>

 <div className="flex gap-2">
 <button
 onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}
 className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-650 rounded-lg flex items-center gap-1 cursor-pointer"
 >
 <Eye size={12} /> Timeline & Detalhes
 </button>
 <button
 onClick={() => handleOpenEdit(order)}
 className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-500 cursor-pointer transition-all duration-200 active:scale-95"
 >
 <Edit3 size={12} />
 </button>
 <button
 onClick={() => handleDelete(order.id, order.orderNumber)}
 className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer transition-all duration-200 active:scale-95"
 >
 <Trash2 size={12} />
 </button>
 </div>
 </div>

 </div>
 );
 })}
 {filteredOrders.length === 0 && (
 <div className="col-span-2 py-16 text-center text-slate-450">
 Nenhum pedido de venda registrado.
 </div>
 )}
 </div>

 {/* MODALS SECTION */}

 {/* 1. Detail and timeline workflow viewer */}
 {showDetailModal && selectedOrder && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
 <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up max-h-[85vh] flex flex-col">
 <div className="h-14 border-b border-slate-150 px-6 flex items-center justify-between">
 <h3 className="font-bold text-sm text-slate-900 ">Fluxo e Rastreamento de Pedido</h3>
 <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
 </div>

 <div className="p-6 space-y-5 overflow-y-auto flex-1">
 {/* Top Summary Block */}
 <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 text-xs grid grid-cols-2 gap-4">
 <div>
 <p className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Número do Pedido</p>
 <p className="font-bold text-slate-800 mt-1">{selectedOrder.orderNumber}</p>
 <p className="text-slate-500 mt-1 font-medium">Cliente: {selectedOrder.clientName}</p>
 </div>
 <div>
 <p className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Prazo Previsto de Remessa</p>
 <p className="font-bold text-slate-800 mt-1">{selectedOrder.dueDate}</p>
 <p className="text-slate-500 mt-1 font-semibold">Faturamento: R$ {selectedOrder.totalValue.toFixed(2)}</p>
 </div>
 </div>

 {/* Dynamic timeline flow */}
 <div>
 <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
 <Clock size={13} className="text-amber-500 animate-spin-slow" /> Linha do Tempo e Alterações (Timeline)
 </h4>

 <div className="relative pl-5 border-l-2 border-slate-100 space-y-5 ml-2.5">
 {selectedOrder.timeline?.map((evt, idx) => (
 <div key={evt.id || idx} className="relative">
 {/* Circle dot marker */}
 <span className="absolute -left-7 top-1 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white " />
 
 <div className="text-xs">
 <span className="font-bold font-mono text-[10px] text-slate-400">{evt.date}</span>
 <p className="text-slate-850 mt-1 font-medium">{evt.description}</p>
 <p className="text-[10px] text-slate-400 mt-0.5">Operador: {evt.user || 'Ateliê Sagrado'}</p>
 </div>
 </div>
 ))}
 {(!selectedOrder.timeline || selectedOrder.timeline.length === 0) && (
 <p className="text-xs text-slate-450 italic py-4 text-center">Nenhum evento registrado nesta timeline.</p>
 )}
 </div>
 </div>

 </div>

 <div className="h-14 border-t border-slate-150 px-6 flex items-center justify-end bg-slate-50 ">
 <button
 onClick={() => setShowDetailModal(false)}
 className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
 >
 Fechar Painel
 </button>
 </div>
 </div>
 </div>
 )}

 {/* 2. Create / Edit Order Modal Form */}
 {(showAddModal || showEditModal) && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
 <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up max-h-[92vh] flex flex-col">
 <div className="h-14 border-b border-slate-150 px-6 flex items-center justify-between">
 <h3 className="font-bold text-sm text-slate-900 ">
 {showAddModal ? 'Registrar Novo Pedido de Venda' : 'Editar Dados do Pedido'}
 </h3>
 <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
 </div>

 <form onSubmit={showAddModal ? handleSaveAdd : handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
 
 <div className="grid grid-cols-2 gap-4">
 
 {/* Client selector */}
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cliente Comprador *</label>
 <select
 value={clientId}
 onChange={(e) => setClientId(e.target.value)}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
 >
 <option value="" disabled>Selecione um cliente...</option>
 {activeClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
 </select>
 </div>

 {/* Due Date picker */}
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Data Prevista de Entrega *</label>
 <input
 type="date"
 required
 value={dueDate}
 onChange={(e) => setDueDate(e.target.value)}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 {/* Status selector */}
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status do Pedido</label>
 <select
 value={status}
 onChange={(e) => setStatus(e.target.value as OrderStatus)}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
 >
 <option value="received">Recebido</option>
 <option value="approved">Aprovado</option>
 <option value="production">Em Produção</option>
 <option value="finishing">Em Acabamento</option>
 </select>
 </div>
 </div>

 {/* Items workspace section */}
 <div className="pt-4 border-t border-slate-100 ">
 <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
 <ShoppingBag size={14} className="text-amber-500" /> Joias e Terços do Pedido
 </h4>

 <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-xl flex items-end gap-3 mb-4">
 <div className="flex-1">
 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Escolher Produto</label>
 <select
 value={selectedProdId}
 onChange={(e) => setSelectedProdId(e.target.value)}
 className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
 >
 {activeProducts.map(p => (
 <option key={p.id} value={p.id}>{p.name} (R$ {p.sellingPrice.toFixed(2)})</option>
 ))}
 </select>
 </div>
 <div className="w-24">
 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quantidade</label>
 <input
 type="number"
 min="1"
 value={selectedQty}
 onChange={(e) => setSelectedQty(Number(e.target.value))}
 className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-850 text-center"
 />
 </div>
 <button
 type="button"
 onClick={handleAddItem}
 className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg h-9"
 >
 + Vincular
 </button>
 </div>

 {/* Item summary listed */}
 <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 ">
 {items.map((item, idx) => (
 <div key={idx} className="flex justify-between items-center px-4 py-2 bg-slate-50/20 text-xs font-semibold">
 <div>
 <p className="text-slate-850 ">{item.productName}</p>
 <p className="text-[10px] text-slate-450 mt-0.5">Preço: R$ {item.price.toFixed(2)}</p>
 </div>
 <div className="flex items-center gap-6">
 <p className="text-slate-650 font-bold">{item.quantity} un</p>
 <span className="font-mono text-slate-800 w-20 text-right">R$ {item.total.toFixed(2)}</span>
 <button
 type="button"
 onClick={() => handleRemoveItem(item.productId)}
 className="text-rose-500 hover:text-rose-600 font-bold text-lg px-2 cursor-pointer"
 >
 ×
 </button>
 </div>
 </div>
 ))}
 {items.length === 0 && (
 <p className="p-4 text-center text-slate-400 text-xs italic">Nenhum item adicionado ao pedido de venda.</p>
 )}
 </div>

 <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between font-bold text-xs">
 <span className="text-slate-500 uppercase">Faturamento do Pedido</span>
 <span className="font-mono text-slate-900 text-sm">
 R$ {subtotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
 </span>
 </div>

 </div>

 <div className="pt-4 border-t border-slate-150 flex justify-end gap-3">
 <button
 type="button"
 onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
 className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
 >
 {showAddModal ? 'Adicionar Pedido' : 'Salvar Alterações'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {deleteConfirm && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
 <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-slide-in-up">
 <div className="flex items-center gap-3 text-amber-600">
 <div className="p-2 bg-amber-50 rounded-lg">
 <AlertTriangle size={20} />
 </div>
 <h3 className="font-bold text-sm text-slate-900">Confirmar Arquivamento</h3>
 </div>
 <p className="text-xs text-slate-500 leading-relaxed">
 Deseja realmente arquivar o pedido de venda <strong className="text-slate-800">"{deleteConfirm.code}"</strong>? O registro não será mais exibido na lista ativa.
 </p>
 <div className="flex justify-end gap-3 pt-2">
 <button
 onClick={() => setDeleteConfirm(null)}
 className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer transition-all duration-200 active:scale-95"
 >
 Cancelar
 </button>
 <button
 onClick={handleConfirmDelete}
 className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 active:scale-95"
 >
 Confirmar
 </button>
 </div>
 </div>
 </div>
 )}

 </div>
 );
};
