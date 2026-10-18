import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { 
  ShoppingBag, Package, AlertCircle, CheckCircle2, DollarSign,
  ArrowLeft, Check, ArrowRight, Clock, AlertTriangle, Layers
} from 'lucide-react';
import { toast } from './Toast';
import { Pagination } from './Pagination';
import { InventoryItem } from '../types/erp';
import { calculatePurchaseNeed, roundCurrency, roundQty, safeNumber } from '../utils/finance';
import { PageHeader, FilterBar, EmptyState, StatCard, Button, Badge } from './ui';

export interface PurchaseNeed {
  item: InventoryItem;
  required: number;
  available: number;
  shortfall: number;
  totalCost: number;
}

export const PurchasesView: React.FC = () => {
  const { inventory, products, orders, productionTasks, adjustStock } = useDb();
  
  // Screen state: 'list' | 'register_purchase' (eliminates modals!)
  const [activeScreen, setActiveScreen] = useState<'list' | 'register_purchase'>('list');
  const [selectedNeed, setSelectedNeed] = useState<PurchaseNeed | null>(null);

  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [purchaseQty, setPurchaseQty] = useState<number>(0);
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // 1. Calculate required quantities of each material based on pending production tasks
  const pendingTasks = productionTasks.filter(task => task.status !== 'done');
  
  // Aggregate required product quantities
  const productQuantitiesToProduce: Record<string, number> = {};
  pendingTasks.forEach(task => {
    const order = orders.find(o => o.id === task.orderId);
    if (order) {
      const item = order.items.find(i => i.productId === task.productId);
      if (item) {
        if (!productQuantitiesToProduce[task.productId]) {
          productQuantitiesToProduce[task.productId] = 0;
        }
        productQuantitiesToProduce[task.productId] += item.quantity;
      }
    } else {
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
      const required = roundQty(materialRequired[item.id] || 0);
      const available = roundQty(item.available !== undefined ? item.available : (item.quantity - (item.reserved || 0)));
      
      const { shortfall, totalCost } = calculatePurchaseNeed(
        available,
        item.minQuantity,
        required,
        item.unitValue
      );
      
      return {
        item,
        required,
        available,
        shortfall,
        totalCost
      };
    })
    .filter(need => {
      const matchSearch = need.item.name.toLowerCase().includes(search.toLowerCase()) || 
                          need.item.code.toLowerCase().includes(search.toLowerCase());
      const matchSupplier = selectedSupplier === 'all' || need.item.supplier === selectedSupplier;
      return matchSearch && matchSupplier;
    });

  // Pagination state
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [purchasesPerPage, setPurchasesPerPage] = useState(10);

  const paginatedNeeds = purchaseNeeds.slice(
    (purchasesPage - 1) * purchasesPerPage,
    purchasesPage * purchasesPerPage
  );

  // Filter list to actually missing materials for metrics (shortfall > 0)
  const actualMissingNeeds = purchaseNeeds.filter(need => need.shortfall > 0);
  
  // Overall metrics
  const totalItemsToBuy = actualMissingNeeds.length;
  const totalEstimatedCost = roundCurrency(actualMissingNeeds.reduce((acc, curr) => acc + curr.totalCost, 0));
  
  // List of unique suppliers for filtering
  const suppliers = Array.from(new Set(inventory.filter(i => !i.isDeleted).map(i => i.supplier).filter(Boolean))) as string[];

  const handleOpenPurchase = (need: PurchaseNeed) => {
    setSelectedNeed(need);
    setPurchaseQty(need.shortfall > 0 ? need.shortfall : 1);
    setPurchaseNotes(`Compra de reabastecimento via painel de compras necessárias.`);
    setActiveScreen('register_purchase');
  };

  const handleConfirmPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const safeQty = roundQty(Math.max(0, safeNumber(purchaseQty, 0)));
    if (!selectedNeed || safeQty <= 0) {
      toast.error("Quantidade Inválida", "Informe uma quantidade válida maior que zero.");
      return;
    }
    
    // Add stock (triggers expense in adjustStock)
    adjustStock(
      selectedNeed.item.id, 
      safeQty, 
      purchaseNotes, 
      'Compra de Insumo', 
      selectedNeed.item.supplier || 'Fornecedor'
    );
    
    toast.success(
      "Compra Registrada!", 
      `Foram adicionadas ${safeQty} ${selectedNeed.item.unit} de ${selectedNeed.item.name}. Despesa lançada no financeiro.`
    );
    
    setSelectedNeed(null);
    setActiveScreen('list');
  };

  // -------------------------------------------------------------
  // DEDICATED SCREEN: REGISTRAR COMPRA (SEM MODAL)
  // -------------------------------------------------------------
  if (activeScreen === 'register_purchase' && selectedNeed) {
    const totalGasto = purchaseQty * selectedNeed.item.unitValue;

    return (
      <div className="space-y-6 pb-12 font-sans select-none animate-slide-in-up">
        {/* Header with Back button */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => { setSelectedNeed(null); setActiveScreen('list'); }}
                className="text-xs font-bold text-slate-500 hover:text-amber-800 transition-colors flex items-center gap-1.5 cursor-pointer mb-1"
              >
                <ArrowLeft size={14} />
                Voltar para Compras Necessárias
              </button>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ShoppingBag className="text-amber-600" size={24} />
                Registrar Compra de Insumo
              </h2>
              <p className="text-xs text-slate-500">
                Esta ação adicionará saldo físico ao estoque e lançará a despesa correspondente no Fluxo de Caixa.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSelectedNeed(null); setActiveScreen('list'); }}
              leftIcon={<ArrowLeft size={14} />}
            >
              Cancelar e Voltar
            </Button>
          </div>
        </div>

        {/* Purchase Registration Form */}
        <form onSubmit={handleConfirmPurchase} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Card */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-mono">
                  Material Selecionado
                </span>
                <h3 className="font-serif font-bold text-lg text-slate-900 mt-1">
                  {selectedNeed.item.name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>Código: <strong className="font-mono text-slate-700">{selectedNeed.item.code || 'S/N'}</strong></span>
                  <span>•</span>
                  <span>Fornecedor: <strong className="text-slate-700">{selectedNeed.item.supplier || 'Não cadastrado'}</strong></span>
                  <span>•</span>
                  <span>Unidade: <strong className="text-slate-700">{selectedNeed.item.unit}</strong></span>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-2xl text-center">
                  <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Falta Real</span>
                  <span className="text-xl font-serif font-bold text-amber-800 font-mono mt-1 block">
                    {selectedNeed.shortfall} {selectedNeed.item.unit}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Estoque Disponível</span>
                  <span className="text-xl font-serif font-bold text-slate-800 font-mono mt-1 block">
                    {selectedNeed.available} {selectedNeed.item.unit}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Custo Unitário</span>
                  <span className="text-xl font-serif font-bold text-slate-900 font-mono mt-1 block">
                    R$ {selectedNeed.item.unitValue.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Quantidade a Comprar ({selectedNeed.item.unit}) *
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Observações do Registro de Compra
                  </label>
                  <textarea 
                    rows={3}
                    value={purchaseNotes}
                    onChange={(e) => setPurchaseNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                    placeholder="Ex: Compra urgente para atender o lote de terços de noiva..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
              <h4 className="font-serif font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Resumo da Operação</span>
                <DollarSign size={18} className="text-amber-600" />
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Insumo:</span>
                  <span className="font-bold text-slate-800 text-right">{selectedNeed.item.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Qtd Comprada:</span>
                  <span className="font-mono font-bold text-slate-800">{purchaseQty} {selectedNeed.item.unit}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Valor Unitário:</span>
                  <span className="font-mono font-bold text-slate-800">R$ {selectedNeed.item.unitValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 text-sm font-black border-t-2 border-slate-900 text-slate-900">
                  <span>DESPESA TOTAL:</span>
                  <span className="font-mono text-rose-600">
                    R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-3 flex flex-col gap-2.5">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full justify-center"
                  leftIcon={<Check size={18} className="text-amber-400" />}
                >
                  Confirmar Compra
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setSelectedNeed(null); setActiveScreen('list'); }}
                  className="w-full justify-center"
                >
                  Cancelar e Voltar
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LIST SCREEN: TABELA E CARDS DE COMPRAS NECESSÁRIAS
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 pb-12 font-sans select-none animate-slide-in-up">
      {/* PageHeader */}
      <PageHeader
        title="Compras Necessárias & MRP"
        description="Planejamento inteligente de matérias-primas com base nas demandas reais e reservas do Chão de Fábrica."
      />

      {/* Overview Cards Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="Materiais Faltantes"
          value={`${totalItemsToBuy} ${totalItemsToBuy === 1 ? 'item' : 'itens'}`}
          description="Demandando reabastecimento imediato"
          variant={totalItemsToBuy > 0 ? "warning" : "default"}
          icon={<AlertCircle size={20} />}
        />

        <StatCard
          title="Custo Estimado de Aquisição"
          value={`R$ ${totalEstimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description="Para suprir 100% da produção ativa"
          variant="default"
          icon={<DollarSign size={20} />}
        />

        <StatCard
          title="Tarefas de Produção Ativas"
          value={`${pendingTasks.length} ${pendingTasks.length === 1 ? 'tarefa' : 'tarefas'}`}
          description="Consideradas no cálculo de necessidades"
          variant="default"
          icon={<Package size={20} />}
        />
      </div>

      {/* FilterBar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => { setSearch(val); setPurchasesPage(1); }}
        searchPlaceholder="Buscar por material ou código..."
        filterOptions={[
          { value: 'all', label: 'Todos os Fornecedores' },
          ...suppliers.map(s => ({ value: s, label: s }))
        ]}
        selectedFilter={selectedSupplier}
        onFilterChange={(val) => { setSelectedSupplier(val); setPurchasesPage(1); }}
      />

      {/* Requirements Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm text-slate-900">
              Planejamento de Matéria-Prima (MRP)
            </span>
            <Badge variant="neutral" size="sm">
              {purchaseNeeds.length} correspondentes
            </Badge>
          </div>
        </div>

        {/* Mobile Cards View (< sm) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {purchaseNeeds.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Package size={32} className="text-slate-400" />}
                title="Nenhum material pendente"
                description="Não há materiais pendentes de compra para os filtros selecionados."
              />
            </div>
          ) : (
            paginatedNeeds.map((need, idx) => {
              const hasShortfall = need.shortfall > 0;
              return (
                <div 
                  key={idx}
                  className={`p-4 space-y-3 ${hasShortfall ? 'bg-amber-50/20' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        hasShortfall ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                      }`} />
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 leading-snug">{need.item.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {need.item.code} • {need.item.supplier || 'Sem fornecedor'}
                        </p>
                      </div>
                    </div>

                    <div>
                      {hasShortfall ? (
                        <Badge variant="warning" size="sm">
                          Faltam {need.shortfall} {need.item.unit}
                        </Badge>
                      ) : (
                        <Badge variant="emerald" size="sm">
                          Suficiente
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50/70 p-2.5 rounded-xl text-center border border-slate-150">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">Necessário</span>
                      <span className="text-xs font-mono font-bold text-slate-700 mt-0.5 block">
                        {need.required} {need.item.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">Disponível</span>
                      <span className="text-xs font-mono font-bold text-slate-700 mt-0.5 block">
                        {need.available} {need.item.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">Custo Total</span>
                      <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                        R$ {need.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => handleOpenPurchase(need)}
                    leftIcon={<ShoppingBag size={14} className="text-amber-400" />}
                  >
                    Registrar Compra
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (>= sm) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Material / Insumo</th>
                <th className="py-3 px-4">Fornecedor</th>
                <th className="py-3 px-4 text-center">Necessário</th>
                <th className="py-3 px-4 text-center">Disponível</th>
                <th className="py-3 px-4 text-center">Status / Falta</th>
                <th className="py-3 px-4 text-right">Custo Est.</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseNeeds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      icon={<Package size={32} className="text-slate-400" />}
                      title="Nenhum material pendente"
                      description="Não há materiais com necessidade de compra para os filtros atuais."
                    />
                  </td>
                </tr>
              ) : (
                paginatedNeeds.map((need, idx) => {
                  const hasShortfall = need.shortfall > 0;
                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-50/70 transition-colors ${hasShortfall ? 'bg-amber-50/15' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            hasShortfall ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                          }`} />
                          <div>
                            <span className="font-bold text-slate-900 block">{need.item.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{need.item.code || 'S/N'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {need.item.supplier || <span className="text-slate-400 italic">Não informado</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700">
                        {need.required} {need.item.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700">
                        {need.available} {need.item.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {hasShortfall ? (
                          <Badge variant="warning" size="sm">
                            Faltam {need.shortfall} {need.item.unit}
                          </Badge>
                        ) : (
                          <Badge variant="emerald" size="sm">
                            Suficiente
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        R$ {need.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => handleOpenPurchase(need)}
                          leftIcon={<ShoppingBag size={13} className="text-amber-400" />}
                        >
                          Comprar
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={purchasesPage}
        totalPages={Math.ceil(purchaseNeeds.length / purchasesPerPage)}
        totalItems={purchaseNeeds.length}
        itemsPerPage={purchasesPerPage}
        onPageChange={setPurchasesPage}
        onItemsPerPageChange={(val) => { setPurchasesPerPage(val); setPurchasesPage(1); }}
        labelSingular="item de compra"
        labelPlural="itens de compra"
      />
    </div>
  );
};
