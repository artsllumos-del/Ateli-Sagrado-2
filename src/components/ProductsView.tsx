import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Product, ProductMaterialComposition, ProductStatus, ProductPaymentVariation } from '../types/erp';
import { calculateProductCostBreakdown } from '../utils/pricing';
import { 
  Search, Plus, Edit3, Trash2, X, Sparkles, AlertTriangle, HelpCircle, 
  Layers, Clock, DollarSign, Info, Eye, ArrowUpRight, CreditCard, ShieldCheck,
  Package, Zap, Wrench, Briefcase, Sliders, Calculator
} from 'lucide-react';
import { toast } from './Toast';

export const ProductsView: React.FC = () => {
  const { products, inventory, addProduct, updateProduct, deleteProduct, settings } = useDb();

  // View States
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Detail Modal active tab
  const [detailTab, setDetailTab] = useState<'bom' | 'indirects' | 'payments'>('bom');

  // Form states for Create/Edit
  const [compositionItems, setCompositionItems] = useState<ProductMaterialComposition[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Terços de Noiva',
    sku: '',
    description: '',
    image: '',
    productionTimeMin: 45,
    finalWeightG: 80,
    sellingPrice: 150,
    status: 'active' as ProductStatus,
    lossPercent: 5,
    laborHourlyRate: 30,
    costEmbalagem: 2.5,
    costEnergia: 1.0,
    costFerramentas: 0.5,
    costOperacional: 2.0,
    targetMarginPercent: 50
  });

  // Payment variations form state for custom overrides
  const [customFeePix, setCustomFeePix] = useState(0);
  const [customFeeCard1x, setCustomFeeCard1x] = useState(3.5);
  const [customFeeCard12x, setCustomFeeCard12x] = useState(12.0);
  const [customFeeMarketplace, setCustomFeeMarketplace] = useState(16.0);

  const [customPricePix, setCustomPricePix] = useState('');
  const [customPriceCard1x, setCustomPriceCard1x] = useState('');
  const [customPriceCard12x, setCustomPriceCard12x] = useState('');
  const [customPriceMarketplace, setCustomPriceMarketplace] = useState('');

  // Material selector state
  const [tempMaterialId, setTempMaterialId] = useState('');
  const [tempQty, setTempQty] = useState(1);

  // Active items
  const activeProducts = products.filter(p => !p.isDeleted);
  const categories = Array.from(new Set(activeProducts.map(p => p.category)));
  const activeInsumos = inventory.filter(i => !i.isDeleted && i.status === 'active');

  // Filter products list
  const filteredProducts = activeProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category: 'Terços de Noiva',
      sku: 'PROD-' + Math.floor(1000 + Math.random() * 9000),
      description: '',
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop',
      productionTimeMin: 45,
      finalWeightG: 80,
      sellingPrice: 120,
      status: 'active',
      lossPercent: 5,
      laborHourlyRate: settings?.laborHourlyRate || 30,
      costEmbalagem: 2.5,
      costEnergia: 1.0,
      costFerramentas: 0.5,
      costOperacional: 2.0,
      targetMarginPercent: settings?.defaultMarginPercent || 50
    });
    setCompositionItems([]);
    setTempMaterialId(activeInsumos[0]?.id || '');
    setTempQty(1);

    setCustomFeePix(0);
    setCustomFeeCard1x(3.5);
    setCustomFeeCard12x(12.0);
    setCustomFeeMarketplace(16.0);

    setCustomPricePix('');
    setCustomPriceCard1x('');
    setCustomPriceCard12x('');
    setCustomPriceMarketplace('');

    setShowAddModal(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setSelectedProduct(prod);
    setFormData({
      name: prod.name,
      category: prod.category,
      sku: prod.sku,
      description: prod.description || '',
      image: prod.image || '',
      productionTimeMin: prod.productionTimeMin ?? 45,
      finalWeightG: prod.finalWeightG ?? 80,
      sellingPrice: prod.sellingPrice,
      status: prod.status,
      lossPercent: prod.lossPercent ?? 5,
      laborHourlyRate: prod.laborHourlyRate ?? (settings?.laborHourlyRate || 30),
      costEmbalagem: prod.costEmbalagem ?? 2.5,
      costEnergia: prod.costEnergia ?? 1.0,
      costFerramentas: prod.costFerramentas ?? 0.5,
      costOperacional: prod.costOperacional ?? 2.0,
      targetMarginPercent: prod.targetMarginPercent ?? (settings?.defaultMarginPercent || 50)
    });
    setCompositionItems(prod.composition || []);
    setTempMaterialId(activeInsumos[0]?.id || '');
    setTempQty(1);

    if (prod.paymentVariations && prod.paymentVariations.length > 0) {
      prod.paymentVariations.forEach(v => {
        if (v.methodId === 'pix') {
          setCustomFeePix(v.feePercent);
          setCustomPricePix(v.price.toString());
        } else if (v.methodId === 'card_1x') {
          setCustomFeeCard1x(v.feePercent);
          setCustomPriceCard1x(v.price.toString());
        } else if (v.methodId === 'card_12x') {
          setCustomFeeCard12x(v.feePercent);
          setCustomPriceCard12x(v.price.toString());
        } else if (v.methodId === 'marketplace') {
          setCustomFeeMarketplace(v.feePercent);
          setCustomPriceMarketplace(v.price.toString());
        }
      });
    }

    setShowEditModal(true);
  };

  const handleAddCompositionItem = () => {
    if (!tempMaterialId) return;
    const mat = inventory.find(i => i.id === tempMaterialId);
    if (!mat) return;

    const existing = compositionItems.find(item => item.materialId === tempMaterialId);
    if (existing) {
      toast.warning("Material duplicado", "Você já adicionou esta matéria-prima. Altere a quantidade na lista.");
      return;
    }

    const cost = Number((tempQty * mat.unitValue).toFixed(2));
    setCompositionItems([...compositionItems, { materialId: tempMaterialId, quantity: tempQty, cost }]);
    toast.success("Insumo vinculado", `${mat.name} x ${tempQty} ${mat.unit}`);
  };

  const handleRemoveCompositionItem = (materialId: string) => {
    setCompositionItems(compositionItems.filter(item => item.materialId !== materialId));
  };

  const handleUpdateCompQty = (materialId: string, newQty: number) => {
    const mat = inventory.find(i => i.id === materialId);
    if (!mat) return;
    
    setCompositionItems(compositionItems.map(item => {
      if (item.materialId === materialId) {
        return {
          ...item,
          quantity: newQty,
          cost: Number((newQty * mat.unitValue).toFixed(2))
        };
      }
      return item;
    }));
  };

  // Build payment variations payload from form inputs
  const buildPaymentVariationsFromForm = (totalBaseCost: number, baseSellingPrice: number): ProductPaymentVariation[] => {
    const methods = [
      { id: 'pix', label: 'Pix / Dinheiro (À Vista)', fee: customFeePix, priceStr: customPricePix },
      { id: 'card_1x', label: 'Cartão de Crédito (1x à Vista)', fee: customFeeCard1x, priceStr: customPriceCard1x },
      { id: 'card_12x', label: 'Cartão Crédito (12x Sem Juros)', fee: customFeeCard12x, priceStr: customPriceCard12x },
      { id: 'marketplace', label: 'Marketplace / Shopee / E-commerce', fee: customFeeMarketplace, priceStr: customPriceMarketplace }
    ];

    return methods.map(m => {
      const feeFrac = m.fee / 100;
      const taxCost = totalBaseCost * feeFrac;
      const totalCostWithTax = totalBaseCost + taxCost;

      let price = baseSellingPrice;
      const customVal = parseFloat(m.priceStr);
      if (!isNaN(customVal) && customVal > 0) {
        price = customVal;
      } else if (m.id !== 'pix' && baseSellingPrice > 0) {
        // Auto-adjust price according to fee
        price = baseSellingPrice / (1 - Math.min(0.8, feeFrac));
      }

      const profit = price - totalCostWithTax;
      const marginPercent = price > 0 ? (profit / price) * 100 : 0;

      return {
        methodId: m.id,
        methodLabel: m.label,
        feePercent: m.fee,
        price: Number(price.toFixed(2)),
        taxCost: Number(taxCost.toFixed(2)),
        totalCostWithTax: Number(totalCostWithTax.toFixed(2)),
        profit: Number(profit.toFixed(2)),
        marginPercent: Number(marginPercent.toFixed(1))
      };
    });
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) {
      toast.error("Validação", "Informe o nome e SKU do produto.");
      return;
    }

    // Compute base cost to build variations
    const draft = {
      ...formData,
      composition: compositionItems
    };
    const b = calculateProductCostBreakdown(draft, inventory, settings);
    const variations = buildPaymentVariationsFromForm(b.totalBaseCost, formData.sellingPrice);

    addProduct({
      ...formData,
      composition: compositionItems,
      paymentVariations: variations
    });
    
    toast.success("Produto criado!", `O produto ${formData.name} foi cadastrado com ficha técnica e custos.`);
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const draft = {
      ...formData,
      composition: compositionItems
    };
    const b = calculateProductCostBreakdown(draft, inventory, settings);
    const variations = buildPaymentVariationsFromForm(b.totalBaseCost, formData.sellingPrice);

    updateProduct(selectedProduct.id, {
      ...formData,
      composition: compositionItems,
      paymentVariations: variations
    });

    toast.success("Produto atualizado!", `Ficha técnica e custos de ${formData.name} foram salvos.`);
    setShowEditModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    deleteProduct(deleteConfirm.id);
    toast.warning("Produto arquivado", `Produto "${deleteConfirm.name}" foi removido do catálogo ativo.`);
    setDeleteConfirm(null);
  };

  const handleViewDetail = (prod: Product) => {
    setSelectedProduct(prod);
    setDetailTab('bom');
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6 animate-slide-in-up text-slate-800">
      
      {/* Control Bar */}
      <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar por nome ou SKU do produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus size={14} /> Novo Produto
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(prod => {
          // Calculate comprehensive cost breakdown
          const breakdown = calculateProductCostBreakdown(prod, inventory, settings);
          const pixVar = breakdown.paymentVariations.find(v => v.methodId === 'pix');
          const card12xVar = breakdown.paymentVariations.find(v => v.methodId === 'card_12x');

          const netProfit = pixVar ? pixVar.netProfit : (prod.sellingPrice - breakdown.totalBaseCost);
          const marginPercent = pixVar ? pixVar.marginPercent : (prod.sellingPrice > 0 ? (netProfit / prod.sellingPrice) * 100 : 0);

          return (
            <div key={prod.id} className="bg-white border border-slate-200/85 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                {/* Product Image Banner */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img 
                    src={prod.image || "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop"} 
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs text-[10px] font-extrabold text-slate-800 uppercase font-mono tracking-wider shadow-xs">
                      {prod.sku}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-bold text-amber-300 uppercase block tracking-wider">
                        Preço Base (Pix)
                      </span>
                      <span className="text-white text-lg font-black font-serif">
                        R$ {prod.sellingPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {card12xVar && (
                      <div className="text-right bg-slate-900/80 backdrop-blur-xs px-2 py-1 rounded-lg border border-white/10">
                        <span className="text-[9px] font-bold text-slate-300 block">12x Sem Juros</span>
                        <span className="text-amber-400 text-xs font-mono font-bold">
                          R$ {card12xVar.appliedPrice.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Content */}
                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{prod.category}</span>
                    <h3 className="font-bold text-base text-slate-900 mt-0.5 line-clamp-1">{prod.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 h-8 leading-normal font-medium">
                      {prod.description || 'Sem descrição informada.'}
                    </p>
                  </div>

                  {/* Indicators Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-150 text-center">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Custo Real</p>
                      <p className="text-xs font-bold font-mono text-slate-800 mt-0.5">
                        R$ {breakdown.totalBaseCost.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Lucro Líq.</p>
                      <p className={`text-xs font-bold font-mono mt-0.5 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        R$ {netProfit.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Margem</p>
                      <p className={`text-xs font-bold font-mono mt-0.5 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {marginPercent.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Production specs */}
                  <div className="flex justify-between text-[11px] font-medium text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" /> {prod.productionTimeMin} min produção
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers size={12} className="text-slate-400" /> {breakdown.materialsList.length} insumos
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
                <button
                  onClick={() => handleViewDetail(prod)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-white hover:border-amber-500 text-[11px] font-bold text-slate-700 hover:text-amber-700 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-3xs"
                >
                  <Eye size={13} /> Ficha Técnica & Custos
                </button>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(prod)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 hover:text-blue-600 cursor-pointer transition-all active:scale-95"
                    title="Editar Produto"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(prod.id, prod.name)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 cursor-pointer transition-all active:scale-95"
                    title="Arquivar Produto"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-3 py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            Nenhum produto cadastrado com esses critérios de busca.
          </div>
        )}
      </div>

      {/* DETAIL MODAL: FICHA TÉCNICA E DRE DO PRODUTO */}
      {showDetailModal && selectedProduct && (() => {
        const bd = calculateProductCostBreakdown(selectedProduct, inventory, settings);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 lg:p-6 overflow-hidden">
            <div className="bg-white border border-slate-200 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-up">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between shrink-0 bg-slate-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-slate-900">{selectedProduct.name}</h3>
                    <p className="text-[11px] text-slate-500 font-mono">SKU: {selectedProduct.sku} • Categoria: {selectedProduct.category}</p>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"><X size={20} /></button>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-slate-150 bg-slate-50/30 px-6 gap-2 shrink-0 text-xs font-bold">
                <button
                  onClick={() => setDetailTab('bom')}
                  className={`py-3 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    detailTab === 'bom' 
                      ? 'border-amber-600 text-amber-800 font-extrabold bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Layers size={14} />
                  1. Matérias-Primas (BOM)
                </button>
                <button
                  onClick={() => setDetailTab('indirects')}
                  className={`py-3 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    detailTab === 'indirects' 
                      ? 'border-amber-600 text-amber-800 font-extrabold bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock size={14} />
                  2. Mão de Obra & Indiretos
                </button>
                <button
                  onClick={() => setDetailTab('payments')}
                  className={`py-3 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    detailTab === 'payments' 
                      ? 'border-amber-600 text-amber-800 font-extrabold bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CreditCard size={14} />
                  3. Tabela por Forma de Pagamento
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* TAB 1: BOM */}
                {detailTab === 'bom' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-150">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custo dos Insumos Diretos</p>
                        <h4 className="text-xl font-bold font-mono text-slate-900 mt-0.5">R$ {bd.materialsCost.toFixed(2)}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">+ Margem de Perda ({bd.lossPercent}%)</p>
                        <h4 className="text-xl font-bold font-mono text-amber-700 mt-0.5">R$ {bd.lossCost.toFixed(2)}</h4>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                      <div className="flex justify-between items-center px-4 py-2.5 bg-slate-100/70 font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                        <span>Matéria-Prima</span>
                        <span>Custo Unit.</span>
                        <span>Qtd Usada</span>
                        <span className="text-right">Custo Total</span>
                      </div>

                      {bd.materialsList.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center px-4 py-3 text-slate-800 font-medium">
                          <span className="font-bold text-slate-900 w-1/3">{item.name}</span>
                          <span className="font-mono text-slate-500">R$ {item.unitValue.toFixed(2)} / {item.unit}</span>
                          <span className="font-mono">{item.quantity} {item.unit}</span>
                          <span className="font-mono font-bold text-slate-900 text-right">R$ {item.totalCost.toFixed(2)}</span>
                        </div>
                      ))}

                      {bd.materialsList.length === 0 && (
                        <p className="p-6 text-center text-slate-400 italic">Nenhuma matéria-prima cadastrada na composição deste produto.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: INDIRECTS & LABOR */}
                {detailTab === 'indirects' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Labor Box */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Clock size={14} className="text-amber-600" /> Mão de Obra Direta
                        </h5>
                        <div className="space-y-1 text-xs pt-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Tempo de Fabricação:</span>
                            <span className="font-bold text-slate-800 font-mono">{bd.laborTimeMin} minutos</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Valor da Hora:</span>
                            <span className="font-bold text-slate-800 font-mono">R$ {bd.laborHourlyRate.toFixed(2)}/h</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-amber-900">
                            <span>Custo da Mão de Obra:</span>
                            <span className="font-mono">R$ {bd.laborCost.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Indirect Overhead Box */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Package size={14} className="text-amber-600" /> Custos Indiretos & Operacionais
                        </h5>
                        <div className="space-y-1 text-xs pt-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Embalagem:</span>
                            <span className="font-mono">R$ {bd.costEmbalagem.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Energia Elétrica:</span>
                            <span className="font-mono">R$ {bd.costEnergia.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Ferramentas & Desgaste:</span>
                            <span className="font-mono">R$ {bd.costFerramentas.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Operacional Fixo:</span>
                            <span className="font-mono">R$ {bd.costOperacional.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-amber-900">
                            <span>Soma Indiretos:</span>
                            <span className="font-mono">R$ {bd.indirectCostsTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Base Production Cost Block */}
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-amber-200 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Custo Total Real de Fabricação (Base)</span>
                        <h3 className="text-2xl font-serif font-bold text-slate-900 mt-0.5">
                          R$ {bd.totalBaseCost.toFixed(2)}
                        </h3>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
                        BOM + Perda + Mão de Obra + Indiretos
                      </span>
                    </div>
                  </div>
                )}

                {/* TAB 3: PAYMENT METHOD VARIATION TABLE */}
                {detailTab === 'payments' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500">
                      Tabela demonstrativa dos valores e lucros em cada canal de cobrança e forma de pagamento praticada:
                    </p>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs bg-white">
                      <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-100/80 font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                        <span className="col-span-4">Forma de Pagamento</span>
                        <span className="col-span-2 text-center">Taxa (%)</span>
                        <span className="col-span-2 text-right">Preço de Venda</span>
                        <span className="col-span-2 text-right">Taxa (R$)</span>
                        <span className="col-span-2 text-right">Lucro Líquido</span>
                      </div>

                      {bd.paymentVariations.map((v) => (
                        <div key={v.methodId} className="grid grid-cols-12 gap-2 px-4 py-3 items-center font-medium text-slate-800">
                          <div className="col-span-4">
                            <p className="font-bold text-slate-900">{v.methodLabel}</p>
                          </div>
                          <div className="col-span-2 text-center font-mono text-slate-500">
                            {v.feePercent}%
                          </div>
                          <div className="col-span-2 text-right font-mono font-bold text-amber-700">
                            R$ {v.appliedPrice.toFixed(2)}
                          </div>
                          <div className="col-span-2 text-right font-mono text-slate-500">
                            R$ {v.taxCost.toFixed(2)}
                          </div>
                          <div className={`col-span-2 text-right font-mono font-bold ${v.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            R$ {v.netProfit.toFixed(2)} ({v.marginPercent.toFixed(1)}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-150 flex items-center justify-between bg-slate-50 shrink-0">
                <span className="text-xs text-slate-500 font-medium">Ateliê Sagrado ERP • Módulo de Custos</span>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800 transition-all"
                >
                  Fechar Ficha
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 lg:p-6 overflow-hidden">
          <div className="bg-white border border-slate-200 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-up">
            
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between shrink-0 bg-slate-50/50">
              <h3 className="font-serif font-bold text-base text-slate-900">
                {showAddModal ? 'Cadastrar Novo Produto com Custos Integrados' : 'Editar Produto e Especificações de Custo'}
              </h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={showAddModal ? handleSaveAdd : handleSaveEdit} className="flex-1 flex flex-col min-h-0">
              <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
                
                {/* 1. Basic Metadata */}
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">1. Dados do Produto</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-500 mb-1">Nome do Produto *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Terço de Noiva Imperial - Pérola Absoluta"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-850"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Categoria *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 cursor-pointer"
                      >
                        <option value="Terços de Noiva">Terços de Noiva</option>
                        <option value="Terços Comuns">Terços Comuns</option>
                        <option value="Pulseiras">Pulseiras</option>
                        <option value="Dezenas e Chaveiros">Dezenas e Chaveiros</option>
                        <option value="Joias Religiosas">Joias Religiosas</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">SKU / Código *</label>
                      <input
                        type="text"
                        required
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-850 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Preço Base de Venda / Pix (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-850 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Tempo de Produção (min)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.productionTimeMin}
                        onChange={(e) => setFormData({ ...formData, productionTimeMin: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-850"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block font-semibold text-slate-500 mb-1">URL da Imagem</label>
                      <input
                        type="text"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-850"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block font-semibold text-slate-500 mb-1">Descrição</label>
                      <textarea
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-850"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Composition (BOM) */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">2. Composição de Insumos (BOM)</h4>
                  
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-end gap-3 mb-3 text-xs">
                    <div className="flex-1">
                      <label className="block font-semibold text-slate-500 mb-1">Escolher Insumo</label>
                      <select
                        value={tempMaterialId}
                        onChange={(e) => setTempMaterialId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 cursor-pointer"
                      >
                        <option value="" disabled>Selecione um insumo do estoque...</option>
                        {activeInsumos.map(i => (
                          <option key={i.id} value={i.id}>
                            {i.name} ({i.unit} - R$ {i.unitValue.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <label className="block font-semibold text-slate-500 mb-1">Quantidade</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={tempQty}
                        onChange={(e) => setTempQty(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCompositionItem}
                      className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all cursor-pointer h-9 shrink-0"
                    >
                      + Vincular
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs bg-white">
                    {compositionItems.map((comp, idx) => {
                      const mat = inventory.find(i => i.id === comp.materialId);
                      return (
                        <div key={idx} className="flex justify-between items-center px-4 py-2.5 font-medium">
                          <div>
                            <p className="font-bold text-slate-900">{mat?.name || 'Insumo'}</p>
                            <p className="text-[10px] text-slate-400">R$ {mat?.unitValue.toFixed(2)} / {mat?.unit}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              step="0.01"
                              value={comp.quantity}
                              onChange={(e) => handleUpdateCompQty(comp.materialId, Number(e.target.value))}
                              className="w-16 px-2 py-1 text-center border border-slate-200 rounded-lg text-slate-900 font-bold"
                            />
                            <span className="font-mono font-bold text-slate-800 w-20 text-right">R$ {comp.cost.toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCompositionItem(comp.materialId)}
                              className="text-rose-500 hover:text-rose-700 font-bold px-2 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {compositionItems.length === 0 && (
                      <p className="p-4 text-center text-slate-400 italic">Nenhum insumo vinculado a este produto.</p>
                    )}
                  </div>
                </div>

                {/* 3. Labor & Indirect Costs */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">3. Mão de Obra e Custos Indiretos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Hora Mão Obra (R$)</label>
                      <input
                        type="number"
                        value={formData.laborHourlyRate}
                        onChange={(e) => setFormData({ ...formData, laborHourlyRate: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Embalagem (R$)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.costEmbalagem}
                        onChange={(e) => setFormData({ ...formData, costEmbalagem: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Energia (R$)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.costEnergia}
                        onChange={(e) => setFormData({ ...formData, costEnergia: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Ferramentas (R$)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.costFerramentas}
                        onChange={(e) => setFormData({ ...formData, costFerramentas: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Operacional (R$)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.costOperacional}
                        onChange={(e) => setFormData({ ...formData, costOperacional: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Submit Buttons */}
              <div className="p-4 border-t border-slate-150 flex justify-end gap-3 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md"
                >
                  {showAddModal ? 'Salvar Produto' : 'Salvar Alterações'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
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
              Deseja realmente arquivar o produto <strong className="text-slate-800">"{deleteConfirm.name}"</strong>? Ele não aparecerá no catálogo ativo.
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
