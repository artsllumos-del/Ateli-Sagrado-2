import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { useSubscription } from '../hooks/useSubscription';
import { Product, ProductMaterialComposition, ProductStatus, ProductPaymentVariation } from '../types/erp';
import { calculateProductCostBreakdown } from '../utils/pricing';
import { 
  Search, Plus, Edit3, Trash2, X, Sparkles, AlertTriangle, HelpCircle, 
  Layers, Clock, DollarSign, Info, Eye, ArrowUpRight, CreditCard, ShieldCheck,
  Package, Zap, Wrench, Briefcase, Sliders, Calculator, ArrowLeft, Check, ChevronRight
} from 'lucide-react';
import { toast } from './Toast';
import { Pagination } from './Pagination';
import { ConfirmDialog, PageHeader, FilterBar, EmptyState, Button, Badge } from './ui';

export interface ProductsViewProps {
  initialScreen?: 'list' | 'create' | 'edit';
  onNavigate?: (view: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ initialScreen = 'list', onNavigate }) => {
  const { products, inventory, addProduct, updateProduct, deleteProduct, settings } = useDb();
  const { isExpired } = useSubscription();

  // Screen State: 'list' | 'create' | 'edit' | 'detail'
  const [activeScreen, setActiveScreen] = useState<'list' | 'create' | 'edit' | 'detail'>(initialScreen);

  // Sync initialScreen if changed externally (e.g. quick actions in header)
  useEffect(() => {
    if (initialScreen) {
      setActiveScreen(initialScreen);
    }
  }, [initialScreen]);

  // View States
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  // Pagination state
  const [productsPage, setProductsPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(6);

  // Filter products list
  const filteredProducts = activeProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const paginatedProducts = filteredProducts.slice(
    (productsPage - 1) * productsPerPage,
    productsPage * productsPerPage
  );

  const handleOpenAdd = () => {
    if (isExpired) {
      toast.error("Assinatura Expirada", "A criação de novos produtos requer regularização da assinatura. Seu catálogo de artigos religiosos e receitas continuam 100% preservados.");
      return;
    }

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

    setActiveScreen('create');
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

    setActiveScreen('edit');
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
    
    toast.success("Produto criado!", `O produto "${formData.name}" foi cadastrado com ficha técnica e custos.`);
    setActiveScreen('list');
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

    toast.success("Produto atualizado!", `Ficha técnica e custos de "${formData.name}" foram salvos.`);
    setActiveScreen('list');
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
    setActiveScreen('detail');
  };

  // Live real-time cost calculation for the dedicated Create / Edit page
  const liveDraft = {
    ...formData,
    composition: compositionItems
  };
  const liveCostBreakdown = calculateProductCostBreakdown(liveDraft, inventory, settings);
  const liveNetProfit = formData.sellingPrice - liveCostBreakdown.totalBaseCost;
  const liveMarginPercent = formData.sellingPrice > 0 ? (liveNetProfit / formData.sellingPrice) * 100 : 0;

  // -------------------------------------------------------------
  // DEDICATED SCREEN: CREATE OR EDIT PRODUCT (SEM MODAL)
  // -------------------------------------------------------------
  if (activeScreen === 'create' || activeScreen === 'edit') {
    const isEditMode = activeScreen === 'edit';

    return (
      <div className="space-y-6 pb-12 font-sans select-none animate-slide-in-up">
        {/* Navigation Breadcrumb & Page Header */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <button
                  type="button"
                  onClick={() => setActiveScreen('list')}
                  className="hover:text-amber-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  Produtos (Composição)
                </button>
                <ChevronRight size={13} className="text-slate-300" />
                <span className="text-amber-800 font-bold">
                  {isEditMode ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
                {isEditMode ? `Editar: ${formData.name || 'Produto'}` : 'Novo Produto com Ficha Técnica & Composição'}
              </h2>
              <p className="text-xs text-slate-500 max-w-2xl">
                Defina matérias-primas (BOM), tempos de mão de obra artesanal, custos indiretos de embalagem/energia e preços por canal de venda.
              </p>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveScreen('list')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={isEditMode ? handleSaveEdit : handleSaveAdd}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Check size={15} className="text-amber-400" />
                {isEditMode ? 'Salvar Alterações' : 'Salvar Produto'}
              </button>
            </div>
          </div>
        </div>

        {/* Form Body: 12-Column Responsive Layout */}
        <form onSubmit={isEditMode ? handleSaveEdit : handleSaveAdd}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT / MAIN COLUMN: Metadata, Insumos BOM, Custos Indiretos */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* CARD 1: Dados do Produto */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-slate-900">
                        1. Identificação do Artigo Religioso
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Informações cadastrais, código SKU e valor comercial base
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    Obrigatório
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Terço de Noiva Imperial - Pérola Absoluta"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Categoria *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 cursor-pointer font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      <option value="Terços de Noiva">Terços de Noiva</option>
                      <option value="Terços Tradicionais">Terços Tradicionais</option>
                      <option value="Pulseiras">Pulseiras</option>
                      <option value="Dezenas e Chaveiros">Dezenas e Chaveiros</option>
                      <option value="Artigos Religiosos">Artigos Religiosos</option>
                      <option value="Customizados">Customizados</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      SKU / Código do Produto *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="PROD-1001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Preço Base de Venda / Pix (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                      placeholder="120.00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tempo de Produção (minutos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.productionTimeMin}
                      onChange={(e) => setFormData({ ...formData, productionTimeMin: Number(e.target.value) })}
                      placeholder="45"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Peso Final da Peça (gramas)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.finalWeightG}
                      onChange={(e) => setFormData({ ...formData, finalWeightG: Number(e.target.value) })}
                      placeholder="80"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      URL da Foto do Produto
                    </label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-bold text-slate-700 mb-1">
                      Descrição & Detalhes Artesanais
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descreva matérias-primas, acabamentos sacros, ocasião recomendada e especificações artesanais..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 2: Composição de Insumos (BOM - Ficha Técnica) */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center font-bold">
                      <Layers size={16} />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-slate-900">
                        2. Composição de Insumos (BOM - Ficha Técnica)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Vincule as matérias-primas do estoque consumidas na fabricação desta peça
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {compositionItems.length} insumo(s) na receita
                  </span>
                </div>

                {/* Insumo Selector Bar */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-end gap-3 text-xs">
                  <div className="flex-1">
                    <label className="block font-bold text-slate-600 mb-1">
                      Selecionar Matéria-Prima do Estoque
                    </label>
                    <select
                      value={tempMaterialId}
                      onChange={(e) => setTempMaterialId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 cursor-pointer font-medium"
                    >
                      <option value="" disabled>Selecione um insumo cadastrado...</option>
                      {activeInsumos.map(i => (
                        <option key={i.id} value={i.id}>
                          {i.name} ({i.unit} • R$ {i.unitValue.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-32">
                    <label className="block font-bold text-slate-600 mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={tempQty}
                      onChange={(e) => setTempQty(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCompositionItem}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all cursor-pointer h-10 shrink-0 flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Plus size={15} className="text-amber-400" />
                    Vincular Insumo
                  </button>
                </div>

                {/* Table of Composition items: Mobile (< sm) and Desktop (>= sm) */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs bg-white">
                  {/* Mobile Item Cards (< sm) */}
                  <div className="block sm:hidden divide-y divide-slate-100">
                    {compositionItems.map((comp) => {
                      const mat = inventory.find(i => i.id === comp.materialId);
                      return (
                        <div key={comp.materialId} className="p-3.5 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{mat?.name || 'Insumo'}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                R$ {mat?.unitValue.toFixed(2)} por {mat?.unit}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveCompositionItem(comp.materialId)}
                              title="Remover insumo"
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg border border-slate-200 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Qtd:</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={comp.quantity}
                                onChange={(e) => handleUpdateCompQty(comp.materialId, Number(e.target.value))}
                                className="w-20 px-2 py-1 text-center border border-slate-200 rounded-lg text-slate-900 font-bold font-mono bg-slate-50"
                              />
                              <span className="text-[10px] text-slate-400">{mat?.unit}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-mono text-slate-400 block">Subtotal</span>
                              <span className="font-mono font-bold text-slate-900 text-sm">
                                R$ {comp.cost.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Grid Table Header (>= sm) */}
                  <div className="hidden sm:grid grid-cols-12 px-4 py-2.5 bg-slate-100/70 font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                    <span className="col-span-6">Matéria-Prima</span>
                    <span className="col-span-2 text-center">Qtd Utilizada</span>
                    <span className="col-span-3 text-right">Subtotal</span>
                    <span className="col-span-1 text-right">Ação</span>
                  </div>

                  {/* Desktop Grid Rows (>= sm) */}
                  <div className="hidden sm:block divide-y divide-slate-100">
                    {compositionItems.map((comp) => {
                      const mat = inventory.find(i => i.id === comp.materialId);
                      return (
                        <div key={comp.materialId} className="grid grid-cols-12 items-center px-4 py-3 font-medium hover:bg-slate-50/60 transition-colors">
                          <div className="col-span-6">
                            <p className="font-bold text-slate-900">{mat?.name || 'Insumo'}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              R$ {mat?.unitValue.toFixed(2)} por {mat?.unit}
                            </p>
                          </div>

                          <div className="col-span-2 flex justify-center">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={comp.quantity}
                              onChange={(e) => handleUpdateCompQty(comp.materialId, Number(e.target.value))}
                              className="w-20 px-2 py-1 text-center border border-slate-200 rounded-lg text-slate-900 font-bold font-mono bg-slate-50"
                            />
                          </div>

                          <div className="col-span-3 text-right font-mono font-bold text-slate-900">
                            R$ {comp.cost.toFixed(2)}
                          </div>

                          <div className="col-span-1 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveCompositionItem(comp.materialId)}
                              title="Remover insumo da composição"
                              className="text-slate-400 hover:text-rose-600 font-bold p-1 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {compositionItems.length === 0 && (
                    <div className="p-8 text-center text-slate-400 space-y-1">
                      <p className="text-xs font-medium">Nenhum insumo vinculado ainda.</p>
                      <p className="text-[11px] text-slate-400">
                        Adicione contas, pérolas, crucifixos ou entremeios acima para calcular o CMV real.
                      </p>
                    </div>
                  )}
                </div>

                {/* Subtotal BOM box */}
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-150 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Custo Total dos Insumos Diretos
                    </span>
                    <span className="font-mono text-base font-bold text-slate-900 mt-0.5 block">
                      R$ {liveCostBreakdown.materialsCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Perda Técnica Estimada ({formData.lossPercent}%)
                    </span>
                    <span className="font-mono text-base font-bold text-amber-700 mt-0.5 block">
                      + R$ {liveCostBreakdown.lossCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 3: Mão de Obra e Custos Indiretos */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center font-bold">
                      <Clock size={16} />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-slate-900">
                        3. Mão de Obra e Custos Indiretos
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Valor da hora artesanal e despesas operacionais aplicadas por unidade
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-800">
                    Total Indireto: R$ {(liveCostBreakdown.laborCost + liveCostBreakdown.indirectCostsTotal).toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">
                      Hora Artesã (R$)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.laborHourlyRate}
                      onChange={(e) => setFormData({ ...formData, laborHourlyRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono font-bold focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">
                      Embalagem (R$)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.costEmbalagem}
                      onChange={(e) => setFormData({ ...formData, costEmbalagem: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono font-bold focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">
                      Energia Elétrica (R$)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.costEnergia}
                      onChange={(e) => setFormData({ ...formData, costEnergia: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono font-bold focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">
                      Ferramentas (R$)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.costFerramentas}
                      onChange={(e) => setFormData({ ...formData, costFerramentas: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono font-bold focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">
                      Operacional (R$)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.costOperacional}
                      onChange={(e) => setFormData({ ...formData, costOperacional: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-mono font-bold focus:bg-white"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Resumo de Custos, DRE em Tempo Real e Imagem Preview */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Image Preview Box */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-slate-900">
                    Foto do Artigo
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {formData.sku || 'SKU'}
                  </span>
                </div>

                <div className="w-full h-48 rounded-2xl overflow-hidden bg-slate-100 border border-slate-150 relative">
                  <img
                    src={formData.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop'}
                    alt={formData.name || 'Preview'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop';
                    }}
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white rounded text-[10px] font-bold">
                    {formData.category}
                  </div>
                </div>
              </div>

              {/* Real-Time Cost Summary Box */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
                <h4 className="font-serif font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                  <span>DRE do Produto em Tempo Real</span>
                  <Calculator size={16} className="text-amber-600" />
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Insumos Diretos (BOM):</span>
                    <span className="font-mono font-bold text-slate-800">
                      R$ {liveCostBreakdown.materialsCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Perda Técnica ({formData.lossPercent}%):</span>
                    <span className="font-mono font-bold text-slate-800">
                      R$ {liveCostBreakdown.lossCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Mão de Obra ({formData.productionTimeMin} min):</span>
                    <span className="font-mono font-bold text-slate-800">
                      R$ {liveCostBreakdown.laborCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Custos Indiretos & Fixos:</span>
                    <span className="font-mono font-bold text-slate-800">
                      R$ {liveCostBreakdown.indirectCostsTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 text-sm font-black border-t-2 border-slate-900 text-slate-900">
                    <span>CUSTO TOTAL BASE:</span>
                    <span className="font-mono text-rose-600">
                      R$ {liveCostBreakdown.totalBaseCost.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-amber-950">Preço de Venda (Pix):</span>
                    <span className="text-lg font-black font-mono text-slate-900">
                      R$ {formData.sellingPrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-amber-500/20">
                    <span className="font-bold text-slate-700">Lucro Líquido Estimado:</span>
                    <span className={`font-mono font-bold ${liveNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      R$ {liveNetProfit.toFixed(2)} ({liveMarginPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Variations Overrides */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-3">
                <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span>Variações por Forma de Pagamento</span>
                  <CreditCard size={15} className="text-slate-400" />
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Cartão à Vista 1x (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={customFeeCard1x}
                      onChange={(e) => setCustomFeeCard1x(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Cartão Parcelado 12x (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={customFeeCard12x}
                      onChange={(e) => setCustomFeeCard12x(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Marketplace / Shopee (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={customFeeMarketplace}
                      onChange={(e) => setCustomFeeMarketplace(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Submit Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                >
                  <Check size={18} className="text-amber-400" />
                  {isEditMode ? 'Salvar Alterações do Produto' : 'Cadastrar Produto no Catálogo'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScreen('list')}
                  className="w-full py-2.5 border border-slate-200 hover:bg-slate-100 rounded-2xl text-xs font-bold text-slate-500 cursor-pointer transition-colors"
                >
                  Cancelar e Voltar à Lista
                </button>
              </div>

            </div>

          </div>
        </form>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DEDICATED SCREEN: FICHA TÉCNICA & COMPOSIÇÃO DETALHADA (SEM MODAL)
  // -------------------------------------------------------------
  if (activeScreen === 'detail' && selectedProduct) {
    const bd = calculateProductCostBreakdown(selectedProduct, inventory, settings);
    const netProfit = selectedProduct.sellingPrice - bd.totalBaseCost;
    const marginPercent = selectedProduct.sellingPrice > 0 ? (netProfit / selectedProduct.sellingPrice) * 100 : 0;

    return (
      <div className="space-y-6 pb-12 font-sans select-none animate-slide-in-up">
        {/* Navigation Breadcrumb & Header */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <button
                  type="button"
                  onClick={() => setActiveScreen('list')}
                  className="hover:text-amber-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  Produtos (Composição)
                </button>
                <ChevronRight size={13} className="text-slate-300" />
                <span className="text-amber-800 font-bold">Ficha Técnica & DRE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {selectedProduct.name}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Código SKU: <strong>{selectedProduct.sku}</strong> • Categoria: <strong>{selectedProduct.category}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 print:hidden">
              <button
                type="button"
                onClick={() => setActiveScreen('list')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer transition-colors"
              >
                Voltar ao Catálogo
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5"
              >
                Imprimir Ficha
              </button>
              <button
                type="button"
                onClick={() => handleOpenEdit(selectedProduct)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Edit3 size={14} className="text-amber-400" />
                Editar Produto
              </button>
            </div>
          </div>
        </div>

        {/* Top KPIs Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Preço de Venda (Pix)</span>
            <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
              R$ {selectedProduct.sellingPrice.toFixed(2)}
            </span>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Custo Total Base</span>
            <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
              R$ {bd.totalBaseCost.toFixed(2)}
            </span>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Lucro Líquido Real</span>
            <span className={`text-xl font-bold font-mono mt-1 block ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              R$ {netProfit.toFixed(2)}
            </span>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Margem de Lucro</span>
            <span className={`text-xl font-bold font-mono mt-1 block ${marginPercent >= 30 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {marginPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Dedicated Tabs Navigation */}
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
          <div className="flex border-b border-slate-150 bg-slate-50/50 px-6 gap-2 text-xs font-bold">
            <button
              onClick={() => setDetailTab('bom')}
              className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                detailTab === 'bom' 
                  ? 'border-amber-600 text-amber-900 font-extrabold bg-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers size={14} />
              1. Composição de Insumos (BOM)
            </button>
            <button
              onClick={() => setDetailTab('indirects')}
              className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                detailTab === 'indirects' 
                  ? 'border-amber-600 text-amber-900 font-extrabold bg-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock size={14} />
              2. Mão de Obra & Custos Indiretos
            </button>
            <button
              onClick={() => setDetailTab('payments')}
              className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                detailTab === 'payments' 
                  ? 'border-amber-600 text-amber-900 font-extrabold bg-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard size={14} />
              3. Tabela por Canal & Meio de Pagamento
            </button>
          </div>

          <div className="p-6">
            {/* TAB 1: BOM */}
            {detailTab === 'bom' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custo dos Insumos Diretos</p>
                    <h4 className="text-xl font-bold font-mono text-slate-900 mt-0.5">R$ {bd.materialsCost.toFixed(2)}</h4>
                  </div>
                  <div className="text-left sm:text-right">
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
                    <p className="p-8 text-center text-slate-400 italic">Nenhuma matéria-prima cadastrada na composição deste produto.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: INDIRECTS & LABOR */}
            {detailTab === 'indirects' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-3">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Clock size={15} className="text-amber-600" /> Mão de Obra Direta
                    </h5>
                    <div className="space-y-2 text-xs pt-1">
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

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-3">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Package size={15} className="text-amber-600" /> Custos Indiretos & Operacionais
                    </h5>
                    <div className="space-y-1.5 text-xs pt-1">
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
                        <span className="text-slate-500">Custos de Ateliê:</span>
                        <span className="font-mono">R$ {bd.costOperacional.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-amber-900">
                        <span>Total Custos Indiretos:</span>
                        <span className="font-mono">R$ {bd.indirectCostsTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PAYMENTS TABLE */}
            {detailTab === 'payments' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Tabela de variação de preços e margem de contribuição conforme o canal e meio de pagamento escolhido pelo cliente.
                </p>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-100/70 font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                    <span className="col-span-4">Meio de Pagamento</span>
                    <span className="col-span-2 text-center">Taxa (%)</span>
                    <span className="col-span-2 text-right">Preço Final</span>
                    <span className="col-span-2 text-right">Lucro Líq.</span>
                    <span className="col-span-2 text-right">Margem %</span>
                  </div>

                  {bd.paymentVariations.map((v) => (
                    <div key={v.methodId} className="grid grid-cols-12 items-center px-4 py-3 font-medium">
                      <span className="col-span-4 font-bold text-slate-900 flex items-center gap-1.5">
                        <CreditCard size={13} className="text-amber-600" />
                        {v.methodLabel}
                      </span>
                      <span className="col-span-2 text-center font-mono text-slate-500">
                        {v.feePercent}%
                      </span>
                      <span className="col-span-2 text-right font-mono font-bold text-slate-900">
                        R$ {v.appliedPrice.toFixed(2)}
                      </span>
                      <span className={`col-span-2 text-right font-mono font-bold ${v.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        R$ {v.netProfit.toFixed(2)}
                      </span>
                      <span className={`col-span-2 text-right font-mono font-bold ${v.marginPercent >= 30 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {v.marginPercent.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LIST SCREEN: CATÁLOGO DE PRODUTOS E CARDS
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 pb-12 font-sans select-none animate-slide-in-up">
      
      {/* PageHeader & FilterBar */}
      <PageHeader
        title="Produtos & Composição"
        description="Catálogo de terços, artigos sacros e composições de matérias-primas com cálculo automatizado de custos."
        actions={
          <Button
            onClick={handleOpenAdd}
            disabled={isExpired}
            leftIcon={<Plus size={15} className="text-amber-400" />}
            title={isExpired ? 'Assinatura expirada: regularize para criar produtos' : 'Cadastrar Novo Produto'}
          >
            Novo Produto
          </Button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={(val) => { setSearch(val); setProductsPage(1); }}
        searchPlaceholder="Buscar por nome, SKU..."
        filterOptions={[
          { value: 'all', label: 'Todas as Categorias' },
          ...categories.map(c => ({ value: c, label: c }))
        ]}
        selectedFilter={selectedCategory}
        onFilterChange={(val) => { setSelectedCategory(val); setProductsPage(1); }}
      />

      {/* Grid of Products Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProducts.map((prod) => {
          const breakdown = calculateProductCostBreakdown(prod, inventory, settings);
          const netProfit = prod.sellingPrice - breakdown.totalBaseCost;
          const marginPercent = prod.sellingPrice > 0 ? (netProfit / prod.sellingPrice) * 100 : 0;
          const card12xVar = breakdown.paymentVariations.find(v => v.methodId === 'card_12x');

          return (
            <div 
              key={prod.id} 
              className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header Image with SKU badge */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                  {prod.image ? (
                    <img 
                      src={prod.image} 
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.product-fallback');
                        if (fallback) (fallback as HTMLElement).style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`product-fallback w-full h-full flex flex-col items-center justify-center bg-slate-100 text-amber-700/60 p-4 ${prod.image ? 'hidden' : 'flex'}`}>
                    <Sparkles size={28} className="text-amber-600/70 mb-1" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{prod.category}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
                  
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
                      <Layers size={12} className="text-slate-400" /> {prod.composition?.length || 0} matérias-primas
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
                <button
                  onClick={() => handleViewDetail(prod)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-amber-500 text-slate-700 hover:text-amber-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye size={13} />
                  Ficha Técnica & DRE
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(prod)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 hover:text-blue-600 cursor-pointer transition-all active:scale-95"
                    title="Editar Produto em Página Própria"
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
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <EmptyState
              icon={<Package size={32} className="text-slate-400" />}
              title="Nenhum produto encontrado"
              description="Nenhum produto cadastrado corresponde aos critérios ou categoria selecionada."
              action={
                <Button
                  onClick={handleOpenAdd}
                  disabled={isExpired}
                  size="sm"
                  leftIcon={<Plus size={14} className="text-amber-400" />}
                >
                  Cadastrar Primeiro Produto
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* Standardized Pagination */}
      <Pagination
        currentPage={productsPage}
        totalPages={Math.ceil(filteredProducts.length / productsPerPage)}
        totalItems={filteredProducts.length}
        itemsPerPage={productsPerPage}
        onPageChange={setProductsPage}
        onItemsPerPageChange={(val) => { setProductsPerPage(val); setProductsPage(1); }}
        labelSingular="produto"
        labelPlural="produtos"
      />

      {/* Delete confirmation modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Arquivamento"
        description={
          <>
            Deseja realmente arquivar o produto <strong className="text-slate-800">"{deleteConfirm?.name}"</strong>? Ele não aparecerá no catálogo ativo.
          </>
        }
        confirmText="Arquivar Produto"
        variant="danger"
      />

    </div>
  );
};
