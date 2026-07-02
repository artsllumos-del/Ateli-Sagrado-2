import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { motion } from 'motion/react';
import { 
  ShoppingBag, Package, AlertCircle, CheckCircle2, TrendingUp, 
  ArrowRight, DollarSign, Calendar, Search, Filter, Plus, FileText, AlertTriangle, X 
} from 'lucide-react';
import { toast } from './Toast';

export const PurchasesView: React.FC = () => {
  const { inventory, products, orders, productionTasks, adjustStock } = useDb();
  
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [showPurchaseModal, setShowPurchaseModal] = useState<any | null>(null);
  const [purchaseQty, setPurchaseQty] = useState<number>(0);
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // 1. Calculate required quantities of each material based on pending production tasks
  // Pending tasks are tasks that are not done yet
  const pendingTasks = productionTasks.filter(task => task.status !== 'done');
  
  // Aggregate required product quantities
  const productQuantitiesToProduce: Record<string, number> = {};
  pendingTasks.forEach(task => {
    // Find the corresponding order
    const order = orders.find(o => o.id === task.orderId);
    if (order) {
      // Find the specific item in the order
      const item = order.items.find(i => i.productId === task.productId);
      if (item) {
        if (!productQuantitiesToProduce[task.productId]) {
          productQuantitiesToProduce[task.productId] = 0;
        }
        productQuantitiesToProduce[task.productId] += item.quantity;
      }
    } else {
      // Fallback: assume quantity = 1 if order is missing
      if (!productQuantitiesToProduce[task.productId]) {
        productQuantitiesToProduce[task.productId] = 0;
      }
      productQuantitiesToProduce[task.productId] += 1;
    }
  });

  // Calculate material requirements based on the product quantities to produce
  const materialRequired: Record<string, number> = {};
  Object.keys(productQuantitiesToProduce).forEach(prodId => {
    const prodQty = productQuantitiesToProduce[prodId];
    const prod = products.find(p => p.id === prodId);
    if (prod && prod.composition) {
      prod.composition.forEach(comp => {
        if (!materialRequired[comp.materialId]) {
          materialRequired[comp.materialId] = 0;
        }
        materialRequired[comp.materialId] += comp.quantity * prodQty;
      });
    }
  });

  // Build list of materials showing shortfall
  const purchaseNeeds = inventory
    .filter(item => !item.isDeleted)
    .map(item => {
      const required = Number((materialRequired[item.id] || 0).toFixed(2));
      const available = item.quantity;
      const shortfall = Number(Math.max(0, required - available).toFixed(2));
      const totalCost = Number((shortfall * item.unitValue).toFixed(2));
      
      return {
        item,
        required,
        available,
        shortfall,
        totalCost
      };
    })
    // Filter to those with search criteria
    .filter(need => {
      const matchSearch = need.item.name.toLowerCase().includes(search.toLowerCase()) || 
                          need.item.code.toLowerCase().includes(search.toLowerCase());
      const matchSupplier = selectedSupplier === 'all' || need.item.supplier === selectedSupplier;
      return matchSearch && matchSupplier;
    });

  // Filter list to actually missing materials for metrics (shortfall > 0)
  const actualMissingNeeds = purchaseNeeds.filter(need => need.shortfall > 0);
  
  // Overall metrics
  const totalItemsToBuy = actualMissingNeeds.length;
  const totalEstimatedCost = Number(actualMissingNeeds.reduce((acc, curr) => acc + curr.totalCost, 0).toFixed(2));
  
  // List of unique suppliers for filtering
  const suppliers = Array.from(new Set(inventory.filter(i => !i.isDeleted).map(i => i.supplier).filter(Boolean)));

  const handleOpenPurchase = (need: any) => {
    setShowPurchaseModal(need);
    setPurchaseQty(need.shortfall > 0 ? need.shortfall : 1);
    setPurchaseNotes(`Compra de reabastecimento via painel de compras necessárias.`);
  };

  const handleConfirmPurchase = () => {
    if (!showPurchaseModal || purchaseQty <= 0) return;
    
    // Add stock (triggers expense in adjustStock)
    adjustStock(
      showPurchaseModal.item.id, 
      purchaseQty, 
      purchaseNotes, 
      'Compra de Insumo', 
      showPurchaseModal.item.supplier || 'Fornecedor'
    );
    
    toast.success(
      "Compra Registrada!", 
      `Foram adicionadas ${purchaseQty} ${showPurchaseModal.item.unit} de ${showPurchaseModal.item.name}. Despesa lançada no financeiro.`
    );
    
    setShowPurchaseModal(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header and Brand */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-ink-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="text-gold-600" size={24} />
            Dashboard de Compras Necessárias
          </h2>
          <p className="text-xs text-ink-600 mt-1">
            Planejamento inteligente de matérias-primas com base nas demandas reais do Chão de Fábrica.
          </p>
        </div>
      </div>

      {/* Overview Cards Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/50">
            <AlertCircle size={22} />
          </div>
          <div>
            <span className="text-[10px] text-ink-600 font-bold uppercase tracking-wider font-mono">
              Materiais Faltantes
            </span>
            <p className="text-xl font-serif font-bold text-slate-900 mt-0.5">
              {totalItemsToBuy} {totalItemsToBuy === 1 ? 'item' : 'itens'}
            </p>
            <span className="text-[10px] text-amber-600 font-medium">Demandando reabastecimento</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-[#FAF3E7] text-gold-600 rounded-xl border border-gold-500/10">
            <DollarSign size={22} />
          </div>
          <div>
            <span className="text-[10px] text-ink-600 font-bold uppercase tracking-wider font-mono">
              Custo de Aquisição Est.
            </span>
            <p className="text-xl font-serif font-bold text-slate-900 mt-0.5">
              R$ {totalEstimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-ink-600 font-medium">Para suprir 100% da produção</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-[#EDF3F9] text-liturgical-500 rounded-xl border border-[#446C94]/10">
            <Package size={22} />
          </div>
          <div>
            <span className="text-[10px] text-ink-600 font-bold uppercase tracking-wider font-mono">
              Ordens de Produção Ativas
            </span>
            <p className="text-xl font-serif font-bold text-slate-900 mt-0.5">
              {pendingTasks.length} {pendingTasks.length === 1 ? 'tarefa' : 'tarefas'}
            </p>
            <span className="text-[10px] text-ink-600 font-medium">Analisadas no cálculo de necessidades</span>
          </div>
        </div>
      </div>

      {/* Filters & Actions bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por material ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full bg-slate-50 border-slate-200 focus:bg-white text-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs text-ink-600">
            <Filter size={14} className="text-slate-400" />
            <span>Fornecedor:</span>
          </div>
          <select 
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="bg-slate-50 border-slate-200 text-xs w-full sm:w-48"
          >
            <option value="all">Todos os Fornecedores</option>
            {suppliers.map((sup, idx) => (
              <option key={idx} value={sup}>{sup}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Requirements Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <span className="font-serif font-bold text-xs text-slate-900">
            Planejamento de Matéria-Prima (MRP)
          </span>
          <span className="text-[10px] font-medium text-slate-500 bg-slate-200/50 px-2.5 py-1 rounded-full font-mono">
            {purchaseNeeds.length} materiais correspondentes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/20 text-slate-450 text-[10px] font-bold uppercase tracking-wider font-mono">
                <th className="py-3.5 px-5">Material / Código</th>
                <th className="py-3.5 px-4 text-center">Necessário Fábrica</th>
                <th className="py-3.5 px-4 text-center">Disponível Estoque</th>
                <th className="py-3.5 px-4 text-center">Falta Real</th>
                <th className="py-3.5 px-4 text-right">Custo Unit.</th>
                <th className="py-3.5 px-4 text-right">Custo Total</th>
                <th className="py-3.5 px-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {purchaseNeeds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-5 text-center text-slate-400 font-serif italic">
                    Nenhum material pendente encontrado para os filtros atuais.
                  </td>
                </tr>
              ) : (
                purchaseNeeds.map((need, idx) => {
                  const hasShortfall = need.shortfall > 0;
                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        hasShortfall ? 'bg-amber-50/10' : ''
                      }`}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            hasShortfall ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                          }`} />
                          <div>
                            <span className="font-medium text-slate-900 block leading-tight">{need.item.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                              {need.item.code} • {need.item.supplier || 'Sem fornecedor'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-semibold font-mono">
                        {need.required} <span className="text-[10px] font-normal text-slate-400">{need.item.unit}</span>
                      </td>
                      <td className="py-4 px-4 text-center font-medium text-slate-500 font-mono">
                        {need.available} <span className="text-[10px] font-normal text-slate-400">{need.item.unit}</span>
                      </td>
                      <td className="py-4 px-4 text-center font-mono">
                        {hasShortfall ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-100/60">
                            {need.shortfall}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded-lg border border-emerald-100/60">
                            <CheckCircle2 size={12} />
                            Suficiente
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-slate-500">
                        R$ {need.item.unitValue.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-right font-semibold font-mono text-slate-900">
                        R$ {need.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleOpenPurchase(need)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 cursor-pointer ${
                            hasShortfall 
                              ? 'bg-[#B5563D] hover:bg-[#9C4530] text-white shadow-xs' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {hasShortfall ? 'Comprar Insumo' : 'Comprar Mais'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Buy Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 lg:p-6 overflow-hidden">
          <div className="bg-white border border-slate-200 w-full max-w-lg max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-up">
            <div className="bg-[#FAF7F2] border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gold-500/10 rounded-xl text-gold-600">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    Registrar Compra de Insumo
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Esta ação adicionará saldo físico ao estoque e lançará uma despesa financeira.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPurchaseModal(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-ink-900 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-mono">
                  Material Selecionado
                </span>
                <p className="font-medium text-slate-800 text-xs mt-1">
                  {showPurchaseModal.item.name}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  Fornecedor: {showPurchaseModal.item.supplier || 'Não cadastrado'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50/40 border border-amber-100 p-3 rounded-xl text-center">
                  <span className="text-[9px] text-amber-600 font-semibold block uppercase">Falta Real</span>
                  <span className="text-sm font-serif font-bold text-amber-700 font-mono mt-0.5 block">
                    {showPurchaseModal.shortfall} {showPurchaseModal.item.unit}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                  <span className="text-[9px] text-slate-400 font-semibold block">Custo Unitário</span>
                  <span className="text-sm font-serif font-bold text-slate-700 font-mono mt-0.5 block">
                    R$ {showPurchaseModal.item.unitValue.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">Quantidade a Comprar ({showPurchaseModal.item.unit})</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={purchaseQty}
                  onChange={(e) => setPurchaseQty(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-50 focus:bg-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">Observações do Registro</label>
                <textarea 
                  rows={2}
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white text-xs border border-slate-200 rounded-lg p-2 resize-none"
                  placeholder="Ex: Compra urgente para atender o pedido..."
                />
              </div>

              <div className="bg-[#EDF3F9] text-[#446C94] border border-[#446C94]/10 p-3.5 rounded-xl text-xs flex justify-between items-center font-mono">
                <span className="font-sans font-medium text-[11px]">Gasto Financeiro Total:</span>
                <span className="font-bold">
                  R$ {(purchaseQty * showPurchaseModal.item.unitValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-150 px-5 py-3.5 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowPurchaseModal(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-500 cursor-pointer transition-all duration-200 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPurchase}
                className="px-4 py-2 bg-[#B5563D] hover:bg-[#9C4530] text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition-all duration-200 active:scale-95"
              >
                Confirmar Compra
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
