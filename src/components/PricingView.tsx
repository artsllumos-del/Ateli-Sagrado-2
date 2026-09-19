import React, { useState, useEffect, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { InventoryItem, Product, ProductPaymentVariation } from '../types/erp';
import { calculateProductCostBreakdown } from '../utils/pricing';
import { 
  DollarSign, RefreshCw, Calculator, HelpCircle, ArrowUpRight, 
  Settings, CheckCircle2, Sliders, Layers, Sparkles, AlertTriangle, Info,
  CreditCard, ShieldCheck, Clock, Package, Zap, Wrench, Briefcase, ChevronRight
} from 'lucide-react';
import { toast } from './Toast';

export const PricingView: React.FC = () => {
  const { products, inventory, settings, updateProduct, addProduct } = useDb();

  // Selected existing product to clone or edit
  const [selectedProductId, setSelectedProductId] = useState('');
  
  // Basic Product Details
  const [prodName, setProdName] = useState('Novo Terço Customizado');
  const [prodCategory, setProdCategory] = useState('Terços de Noiva');
  const [prodSku, setProdSku] = useState('SKU-' + Math.floor(100000 + Math.random() * 900000));
  const [prodDescription, setProdDescription] = useState('Produto precificado pelo Motor de Precificação');

  // Materials Composition
  const [selectedInsumos, setSelectedInsumos] = useState<Array<{ materialId: string; quantity: number }>>([]);

  // Production Time & Labor Rate
  const [laborTimeInput, setLaborTimeInput] = useState<string>('45');
  const [laborTimeUnit, setLaborTimeUnit] = useState<'min' | 'h'>('min');
  const [laborHourlyRate, setLaborHourlyRate] = useState<number>(30); // R$ 30/h

  // Loss % and Indirect Costs
  const [lossPercent, setLossPercent] = useState<number>(5); // 5%
  const [costEmbalagem, setCostEmbalagem] = useState<number>(2.5); // R$ 2,50
  const [costEnergia, setCostEnergia] = useState<number>(1.0); // R$ 1,00
  const [costFerramentas, setCostFerramentas] = useState<number>(0.5); // R$ 0,50
  const [costOperacional, setCostOperacional] = useState<number>(2.0); // R$ 2,00

  // Margins
  const [minMargin, setMinMargin] = useState<number>(30); // 30%
  const [idealMargin, setIdealMargin] = useState<number>(50); // 50%
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(50); // 50%

  // Manual Base Price Override
  const [overridePriceStr, setOverridePriceStr] = useState<string>('');

  // Payment Method Fees & Custom Price Adjustments
  const [customFeePix, setCustomFeePix] = useState<number>(0);
  const [customFeeCard1x, setCustomFeeCard1x] = useState<number>(3.5);
  const [customFeeCard12x, setCustomFeeCard12x] = useState<number>(12.0);
  const [customFeeMarketplace, setCustomFeeMarketplace] = useState<number>(16.0);

  // Custom price overrides per payment method (if user manually overrides a method price)
  const [customPricePix, setCustomPricePix] = useState<string>('');
  const [customPriceCard1x, setCustomPriceCard1x] = useState<string>('');
  const [customPriceCard12x, setCustomPriceCard12x] = useState<string>('');
  const [customPriceMarketplace, setCustomPriceMarketplace] = useState<string>('');

  // Auto-adjust prices per payment method to protect margin
  const [autoPassOnFees, setAutoPassOnFees] = useState<boolean>(true);

  // Insumo selector temporary state
  const [tempMatId, setTempMatId] = useState('');
  const [tempQty, setTempQty] = useState(1);

  const activeInsumos = useMemo(() => inventory.filter(i => !i.isDeleted && i.status === 'active'), [inventory]);
  const activeProducts = useMemo(() => products.filter(p => !p.isDeleted), [products]);

  // Initialize defaults from system settings
  useEffect(() => {
    if (settings) {
      if (settings.laborHourlyRate) setLaborHourlyRate(settings.laborHourlyRate);
      if (settings.defaultMarginPercent) setTargetMarginPercent(settings.defaultMarginPercent);
      if (settings.taxPercent !== undefined) setCustomFeePix(settings.taxPercent);
    }
  }, [settings]);

  // Derived production time in minutes
  const productionTimeMin = useMemo(() => {
    const val = parseFloat(laborTimeInput);
    if (isNaN(val) || val <= 0) return 45;
    return laborTimeUnit === 'h' ? val * 60 : val;
  }, [laborTimeInput, laborTimeUnit]);

  // Construct draft product object for calculation engine
  const draftProduct: Partial<Product> = useMemo(() => {
    const overrideVal = parseFloat(overridePriceStr);
    const sellingPrice = (!isNaN(overrideVal) && overrideVal > 0) ? overrideVal : 0;

    return {
      name: prodName,
      productionTimeMin,
      sellingPrice,
      composition: selectedInsumos.map(i => {
        const mat = inventory.find(m => m.id === i.materialId);
        return {
          materialId: i.materialId,
          quantity: i.quantity,
          cost: Number((i.quantity * (mat?.unitValue || 0)).toFixed(2))
        };
      }),
      lossPercent,
      laborHourlyRate,
      costEmbalagem,
      costEnergia,
      costFerramentas,
      costOperacional,
      targetMarginPercent
    };
  }, [
    prodName, productionTimeMin, overridePriceStr, selectedInsumos, inventory,
    lossPercent, laborHourlyRate, costEmbalagem, costEnergia, costFerramentas,
    costOperacional, targetMarginPercent
  ]);

  // Compute rich cost breakdown using central pricing utility
  const breakdown = useMemo(() => {
    return calculateProductCostBreakdown(draftProduct, inventory, settings);
  }, [draftProduct, inventory, settings]);

  // Calculate Pix / Base Price
  const suggestedBasePrice = useMemo(() => {
    const marginFrac = targetMarginPercent / 100;
    if (marginFrac >= 0.99) return breakdown.totalBaseCost * 10;
    return breakdown.totalBaseCost / (1 - marginFrac);
  }, [breakdown.totalBaseCost, targetMarginPercent]);

  const basePriceFinal = useMemo(() => {
    const overrideVal = parseFloat(overridePriceStr);
    return (!isNaN(overrideVal) && overrideVal > 0) ? overrideVal : suggestedBasePrice;
  }, [overridePriceStr, suggestedBasePrice]);

  // Dynamic Payment Method Variations Table Calculation
  const paymentMethodDetails = useMemo(() => {
    const methods = [
      { id: 'pix', label: 'Pix / Dinheiro (À Vista)', fee: customFeePix, customPriceStr: customPricePix },
      { id: 'card_1x', label: 'Cartão de Crédito (1x à Vista)', fee: customFeeCard1x, customPriceStr: customPriceCard1x },
      { id: 'card_12x', label: 'Cartão Crédito (12x Sem Juros)', fee: customFeeCard12x, customPriceStr: customPriceCard12x },
      { id: 'marketplace', label: 'Marketplace / Shopee / E-commerce', fee: customFeeMarketplace, customPriceStr: customPriceMarketplace },
    ];

    return methods.map(m => {
      const feeFrac = m.fee / 100;
      
      // Calculate tax amount on base cost
      const taxCost = breakdown.totalBaseCost * feeFrac;
      const totalCostWithTax = breakdown.totalBaseCost + taxCost;

      let methodPrice = basePriceFinal;
      const customVal = parseFloat(m.customPriceStr);

      if (!isNaN(customVal) && customVal > 0) {
        methodPrice = customVal;
      } else if (autoPassOnFees && m.id !== 'pix') {
        // Pass on payment fee so net profit margin is preserved
        methodPrice = basePriceFinal / (1 - Math.min(0.8, feeFrac));
      }

      const netProfit = methodPrice - totalCostWithTax;
      const marginPercent = methodPrice > 0 ? (netProfit / methodPrice) * 100 : 0;

      return {
        methodId: m.id,
        methodLabel: m.label,
        feePercent: m.fee,
        taxCost,
        totalCostWithTax,
        suggestedPrice: autoPassOnFees ? (basePriceFinal / (1 - Math.min(0.8, feeFrac))) : basePriceFinal,
        methodPrice,
        netProfit,
        marginPercent
      };
    });
  }, [
    customFeePix, customFeeCard1x, customFeeCard12x, customFeeMarketplace,
    customPricePix, customPriceCard1x, customPriceCard12x, customPriceMarketplace,
    breakdown.totalBaseCost, basePriceFinal, autoPassOnFees
  ]);

  // Load existing product parameters for editing or cloning
  const handleProductLoad = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    setProdName(prod.name);
    setProdCategory(prod.category || 'Terços de Noiva');
    setProdSku(prod.sku || ('SKU-' + Math.floor(100000 + Math.random() * 900000)));
    setProdDescription(prod.description || '');

    const timeMin = prod.productionTimeMin ?? 45;
    if (timeMin >= 60 && timeMin % 60 === 0) {
      setLaborTimeInput((timeMin / 60).toString());
      setLaborTimeUnit('h');
    } else {
      setLaborTimeInput(timeMin.toString());
      setLaborTimeUnit('min');
    }

    if (prod.lossPercent !== undefined) setLossPercent(prod.lossPercent);
    if (prod.laborHourlyRate !== undefined) setLaborHourlyRate(prod.laborHourlyRate);
    if (prod.costEmbalagem !== undefined) setCostEmbalagem(prod.costEmbalagem);
    if (prod.costEnergia !== undefined) setCostEnergia(prod.costEnergia);
    if (prod.costFerramentas !== undefined) setCostFerramentas(prod.costFerramentas);
    if (prod.costOperacional !== undefined) setCostOperacional(prod.costOperacional);
    if (prod.targetMarginPercent !== undefined) setTargetMarginPercent(prod.targetMarginPercent);

    if (prod.sellingPrice > 0) {
      setOverridePriceStr(prod.sellingPrice.toString());
    } else {
      setOverridePriceStr('');
    }

    const sims = (prod.composition || []).map(c => ({
      materialId: c.materialId,
      quantity: c.quantity
    }));
    setSelectedInsumos(sims);

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

    toast.success("Produto Carregado", `Parâmetros e custos de "${prod.name}" foram importados.`);
  };

  // Add material to composition
  const handleAddMaterialSim = () => {
    if (!tempMatId) return;
    const existing = selectedInsumos.find(i => i.materialId === tempMatId);
    if (existing) {
      toast.warning("Insumo já adicionado", "Este insumo já está na composição. Altere a quantidade na lista.");
      return;
    }
    setSelectedInsumos([...selectedInsumos, { materialId: tempMatId, quantity: tempQty }]);
    setTempQty(1);
    setTempMatId('');
  };

  const handleRemoveMaterialSim = (matId: string) => {
    setSelectedInsumos(selectedInsumos.filter(i => i.materialId !== matId));
  };

  const handleUpdateQtySim = (matId: string, newQty: number) => {
    setSelectedInsumos(selectedInsumos.map(i => i.materialId === matId ? { ...i, quantity: newQty } : i));
  };

  // Save or Apply Product Pricing
  const handleApplyToProduct = () => {
    const roundedBasePrice = Math.round(basePriceFinal * 100) / 100;

    const formattedPaymentVariations: ProductPaymentVariation[] = paymentMethodDetails.map(m => ({
      methodId: m.methodId,
      methodLabel: m.methodLabel,
      feePercent: m.feePercent,
      price: Math.round(m.methodPrice * 100) / 100,
      taxCost: Number(m.taxCost.toFixed(2)),
      totalCostWithTax: Number(m.totalCostWithTax.toFixed(2)),
      profit: Number(m.netProfit.toFixed(2)),
      marginPercent: Number(m.marginPercent.toFixed(1))
    }));

    const compositionPayload = selectedInsumos.map(item => {
      const mat = inventory.find(i => i.id === item.materialId);
      return {
        materialId: item.materialId,
        quantity: item.quantity,
        cost: Number((item.quantity * (mat?.unitValue || 0)).toFixed(2))
      };
    });

    const productPayload = {
      name: prodName,
      category: prodCategory,
      sku: prodSku,
      description: prodDescription,
      productionTimeMin,
      sellingPrice: roundedBasePrice,
      composition: compositionPayload,
      lossPercent,
      laborHourlyRate,
      costEmbalagem,
      costEnergia,
      costFerramentas,
      costOperacional,
      targetMarginPercent,
      paymentVariations: formattedPaymentVariations,
      status: 'active' as const
    };

    if (selectedProductId) {
      updateProduct(selectedProductId, productPayload);
      toast.success("Produto Atualizado!", `Custo e precificação salvos com sucesso em "${prodName}".`);
    } else {
      addProduct({
        ...productPayload,
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop',
        finalWeightG: 80
      });
      toast.success("Produto Cadastrado!", `Novo produto "${prodName}" salvo com precificação completa.`);
    }
  };

  return (
    <div className="space-y-6 animate-slide-in-up text-slate-800">
      
      {/* Top Header Card & Product Switcher */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
              <Calculator size={20} className="text-amber-500" />
              Motor de Precificação Inteligente
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
              Custo Total & DRE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simule e estruture todos os custos (Insumos, Perda, Mão de Obra e Custos Indiretos) e defina variações de preço por meio de pagamento.
          </p>
        </div>

        {/* Clone or Select Existing Product */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center shrink-0">
          <select
            value={selectedProductId}
            onChange={(e) => handleProductLoad(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/10 cursor-pointer font-medium max-w-xs"
          >
            <option value="">-- Criar Novo Produto / Simulação --</option>
            {activeProducts.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (Base: R$ {p.sellingPrice.toFixed(2)})
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSelectedProductId('');
              setProdName('Novo Terço Customizado');
              setProdCategory('Terços de Noiva');
              setProdSku('SKU-' + Math.floor(100000 + Math.random() * 900000));
              setProdDescription('Produto precificado pelo Motor de Precificação');
              setSelectedInsumos([]);
              setLaborTimeInput('45');
              setLaborTimeUnit('min');
              setOverridePriceStr('');
              setCustomPricePix('');
              setCustomPriceCard1x('');
              setCustomPriceCard12x('');
              setCustomPriceMarketplace('');
              toast.info("Simulação Limpa", "Pronto para criar uma nova precificação do zero.");
            }}
            className="px-4 py-2 text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
          >
            <RefreshCw size={13} />
            Limpar
          </button>
        </div>
      </div>

      {/* Main Grid: Left Composition & Costs | Right Pricing & Payment Method Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Cost Breakdown Structure (BOM + Labor + Overhead) */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs lg:col-span-7 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-base text-slate-900">1. Identificação e Tempo de Produção</h4>
                <p className="text-[11px] text-slate-500">Dados do registro do produto e estimativa de mão de obra</p>
              </div>
              <Layers size={18} className="text-amber-500" />
            </div>

            {/* Basic Metadata inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-amber-500/10 focus:outline-none"
                  placeholder="Ex: Terço de Noiva Banhado a Ouro"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Categoria</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:ring-2 focus:ring-amber-500/10 focus:outline-none cursor-pointer"
                >
                  <option value="Terços de Noiva">Terços de Noiva</option>
                  <option value="Terços Comuns">Terços Comuns</option>
                  <option value="Pulseiras">Pulseiras</option>
                  <option value="Dezenas e Chaveiros">Dezenas e Chaveiros</option>
                  <option value="Joias Religiosas">Joias Religiosas</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            {/* Production Time & Labor Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-150">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock size={12} className="text-amber-600" /> Tempo de Produção
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={laborTimeInput}
                  onChange={(e) => setLaborTimeInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Unidade de Tempo</label>
                <select
                  value={laborTimeUnit}
                  onChange={(e) => setLaborTimeUnit(e.target.value as 'min' | 'h')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="min">Minutos (min)</option>
                  <option value="h">Horas (h)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hora de Trabalho (R$/h)</label>
                <input
                  type="number"
                  step="0.5"
                  value={laborHourlyRate}
                  onChange={(e) => setLaborHourlyRate(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Insumos Addition Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-base text-slate-900">2. Matérias-Primas do Estoque (BOM)</h4>
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                  {selectedInsumos.length} Insumos Adicionados
                </span>
              </div>

              <div className="flex items-end gap-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-200">
                <div className="flex-1">
                  <select
                    value={tempMatId}
                    onChange={(e) => setTempMatId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="">Selecione um insumo do estoque...</option>
                    {activeInsumos.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.name} (Saldo: {i.quantity} {i.unit} • Custo Unit: R$ {i.unitValue.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-24">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={tempQty}
                    onChange={(e) => setTempQty(Number(e.target.value))}
                    placeholder="Qtd"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-850 text-center font-bold focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddMaterialSim}
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors h-9 cursor-pointer active:scale-95 shrink-0"
                >
                  + Incluir
                </button>
              </div>

              {/* Composition Itemized Table */}
              <div className="border border-slate-200/90 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white shadow-3xs">
                <div className="flex justify-between items-center px-4 py-2 bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Insumo / Especificação</span>
                  <span>Custo Calculado</span>
                </div>

                {/* Items */}
                {breakdown.materialsList.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center px-4 py-2.5 text-xs">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <button 
                        type="button"
                        onClick={() => handleRemoveMaterialSim(item.materialId)}
                        className="text-rose-500 hover:text-rose-700 font-bold hover:bg-rose-50 w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-all active:scale-90 shrink-0"
                        title="Remover insumo"
                      >
                        ✕
                      </button>
                      <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        (R$ {item.unitValue.toFixed(2)} / {item.unit})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0.01"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQtySim(item.materialId, Number(e.target.value))}
                          className="w-14 px-1.5 py-0.5 border border-slate-200 rounded text-center font-bold text-slate-900 focus:ring-1 focus:ring-amber-500/20 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500 font-medium">{item.unit}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 w-20 text-right">
                        R$ {item.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}

                {breakdown.materialsList.length === 0 && (
                  <div className="p-4 text-center text-slate-400 text-xs italic">
                    Nenhum insumo vinculado a esta simulação. Selecione acima para adicionar.
                  </div>
                )}

                {/* Summary Rows of Costs */}
                <div className="flex justify-between items-center px-4 py-2 bg-slate-50/50 text-xs border-t border-slate-100">
                  <span className="text-slate-600 font-medium">Soma de Materiais</span>
                  <span className="font-mono font-bold text-slate-900">R$ {breakdown.materialsCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center px-4 py-2 bg-amber-50/20 text-xs text-amber-900">
                  <span className="font-medium flex items-center gap-1">
                    + Margem de Perda / Desperdício ({breakdown.lossPercent}%)
                  </span>
                  <span className="font-mono font-bold">R$ {breakdown.lossCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center px-4 py-2 bg-slate-50/50 text-xs">
                  <span className="text-slate-600 font-medium">
                    Mão de Obra Direta ({laborTimeInput}{laborTimeUnit} x R$ {breakdown.laborHourlyRate.toFixed(2)}/h)
                  </span>
                  <span className="font-mono font-bold text-slate-900">R$ {breakdown.laborCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center px-4 py-2 text-xs bg-slate-50/20">
                  <span className="text-slate-500 font-medium">Custos Indiretos (Embalagem, Energia, Ferramentas, Op.)</span>
                  <span className="font-mono font-bold text-slate-800">R$ {breakdown.indirectCostsTotal.toFixed(2)}</span>
                </div>

                {/* GRAND TOTAL BASE COST */}
                <div className="flex justify-between items-center px-4 py-3 bg-[#FAF8F5] text-sm text-slate-900 font-serif font-bold rounded-b-2xl border-t border-slate-200/80">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-amber-600" />
                    Custo Total Real de Fabricação (Base)
                  </span>
                  <span className="font-mono text-amber-800 text-base">
                    R$ {breakdown.totalBaseCost.toFixed(2)}
                  </span>
                </div>

              </div>
            </div>

          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 bg-amber-50/20 p-3 rounded-xl border border-amber-200/30">
            <Info size={15} className="text-amber-600 shrink-0" />
            <span>
              <strong>Transparência Total:</strong> O Custo Total Real (R$ {breakdown.totalBaseCost.toFixed(2)}) é a soma exata de Insumos + Perda + Mão de Obra + Custos Indiretos da sua operação.
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Pricing Calculator & Payment Method Variations Table */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-6 h-full flex flex-col justify-between">
            <div className="space-y-5">
              
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-bold text-base text-slate-900">Calculadora & Variação de Preço</h4>
                  <p className="text-[11px] text-slate-500">Ajuste margens e veja o valor por forma de pagamento</p>
                </div>
                <Calculator size={18} className="text-amber-500" />
              </div>

              {/* Target Margin Slider */}
              <div className="space-y-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-150">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Margem de Lucro Desejada</span>
                  <span className="text-2xl font-bold text-amber-600 font-serif">{targetMarginPercent}%</span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={targetMarginPercent}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTargetMarginPercent(val);
                    setOverridePriceStr('');
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600 focus:outline-none"
                  style={{
                    background: `linear-gradient(to right, #D4A039 0%, #D4A039 ${targetMarginPercent}%, #CBD5E1 ${targetMarginPercent}%, #CBD5E1 100%)`
                  }}
                />
                
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>0%</span>
                  <span className="text-rose-500">Mínimo: {minMargin}%</span>
                  <span className="text-emerald-600">Ideal: {idealMargin}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Base Suggested Price & Base Override */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-amber-200/60 text-center shadow-3xs space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Preço Base Sugerido (À Vista / Pix)
                </span>
                <h2 className="text-3xl font-bold font-serif text-amber-700">
                  R$ {suggestedBasePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <div className="pt-2 border-t border-amber-200/40 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Preço Praticado no Pix:</span>
                  <div className="relative w-36">
                    <span className="absolute left-2.5 top-1.5 text-[11px] font-bold text-slate-400 font-mono">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={suggestedBasePrice.toFixed(2)}
                      value={overridePriceStr}
                      onChange={(e) => setOverridePriceStr(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 text-xs rounded-lg border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Auto-Repasse toggle */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-150 text-xs">
                <div>
                  <p className="font-bold text-slate-800">Repasse Automático de Taxas</p>
                  <p className="text-[10px] text-slate-500">Ajusta o valor de cada meio de pagamento para proteger o lucro líquido</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoPassOnFees(!autoPassOnFees)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    autoPassOnFees ? 'bg-amber-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 ${
                    autoPassOnFees ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Payment Methods Breakdown Table (REQ: Variação por meio de pagamento) */}
              <div className="space-y-2">
                <h5 className="text-xs font-serif font-bold text-slate-900 flex items-center justify-between">
                  <span>Tabela de Variação por Forma de Pagamento</span>
                  <CreditCard size={14} className="text-amber-600" />
                </h5>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs bg-white">
                  {paymentMethodDetails.map((m) => (
                    <div key={m.methodId} className="p-3 hover:bg-slate-50/50 transition-colors space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900">{m.methodLabel}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Taxa: {m.feePercent}%</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-black text-amber-700 text-sm">
                            R$ {m.methodPrice.toFixed(2)}
                          </p>
                          <p className={`text-[10px] font-bold font-mono ${m.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            Lucro: R$ {m.netProfit.toFixed(2)} ({m.marginPercent.toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Save Price Button */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleApplyToProduct}
                disabled={selectedInsumos.length === 0}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Calculator size={15} />
                {selectedProductId ? 'Salvar Precificação no Produto' : 'Cadastrar Produto com esta Precificação'}
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Global Atelier Configuration Accordion / Panel */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs space-y-6">
        <h4 className="font-serif font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Settings size={18} className="text-slate-400" />
          Parâmetros Globais do Ateliê e Taxas de Venda
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          
          {/* Mão de Obra Box */}
          <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-2xl space-y-3">
            <h5 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
              <Clock size={13} className="text-amber-500" /> Mão de Obra Padrão
            </h5>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Hora de Trabalho (R$/h)</label>
              <input
                type="number"
                value={laborHourlyRate}
                onChange={(e) => setLaborHourlyRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Custos Indiretos Box */}
          <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-2xl space-y-3">
            <h5 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
              <Package size={13} className="text-amber-500" /> Custos Indiretos (R$)
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-semibold text-slate-500 mb-1">Embalagem</label>
                <input
                  type="number"
                  step="0.1"
                  value={costEmbalagem}
                  onChange={(e) => setCostEmbalagem(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-slate-500 mb-1">Energia</label>
                <input
                  type="number"
                  step="0.1"
                  value={costEnergia}
                  onChange={(e) => setCostEnergia(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-slate-500 mb-1">Ferramentas</label>
                <input
                  type="number"
                  step="0.1"
                  value={costFerramentas}
                  onChange={(e) => setCostFerramentas(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-slate-500 mb-1">Operacional</label>
                <input
                  type="number"
                  step="0.1"
                  value={costOperacional}
                  onChange={(e) => setCostOperacional(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Margens e Perdas Box */}
          <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-2xl space-y-3">
            <h5 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
              <Sliders size={13} className="text-amber-500" /> Margens & Perdas (%)
            </h5>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-semibold text-slate-500 mb-1">Margem Mínima</label>
                  <input
                    type="number"
                    value={minMargin}
                    onChange={(e) => setMinMargin(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 bg-white font-bold focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-slate-500 mb-1">Margem Ideal</label>
                  <input
                    type="number"
                    value={idealMargin}
                    onChange={(e) => setIdealMargin(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 bg-white font-bold focus:outline-none text-center"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-slate-500 mb-1">% de Perda de Insumos</label>
                <input
                  type="number"
                  value={lossPercent}
                  onChange={(e) => setLossPercent(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none text-center font-bold text-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Taxas de Pagamento Box */}
          <div className="bg-slate-50/50 p-4 border border-slate-150 rounded-2xl space-y-3">
            <h5 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
              <DollarSign size={13} className="text-amber-500" /> Taxas de Venda
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-semibold text-slate-500 mb-1">Pix / Dinheiro (%)</label>
                <input
                  type="number"
                  value={customFeePix}
                  onChange={(e) => setCustomFeePix(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-slate-500 mb-1">Cartão 1x (%)</label>
                <input
                  type="number"
                  value={customFeeCard1x}
                  onChange={(e) => setCustomFeeCard1x(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-slate-500 mb-1">Cartão 12x (%)</label>
                <input
                  type="number"
                  value={customFeeCard12x}
                  onChange={(e) => setCustomFeeCard12x(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-slate-500 mb-1">Marketplace (%)</label>
                <input
                  type="number"
                  value={customFeeMarketplace}
                  onChange={(e) => setCustomFeeMarketplace(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none text-center"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
