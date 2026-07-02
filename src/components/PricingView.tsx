import React, { useState, useEffect, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { InventoryItem, Product } from '../types/erp';
import { 
  DollarSign, RefreshCw, Calculator, HelpCircle, ArrowUpRight, 
  Settings, CheckCircle2, Sliders, Layers, Sparkles, AlertTriangle, Info
} from 'lucide-react';
import { toast } from './Toast';

export const PricingView: React.FC = () => {
  const { products, inventory, settings, updateProduct, addProduct } = useDb();

  // Selected existing product to clone from (optional)
  const [selectedProductId, setSelectedProductId] = useState('');
  
  // Interactive simulator variables
  const [prodName, setProdName] = useState('Novo Terço Customizado');
  const [selectedInsumos, setSelectedInsumos] = useState<Array<{ materialId: string; quantity: number }>>([]);
  const [laborTimeInput, setLaborTimeInput] = useState<string>('20');
  const [laborTimeUnit, setLaborTimeUnit] = useState<'min' | 'h'>('min');

  // Configuration panel overrides (matching Image 4 layout and values)
  const [laborHourlyRate, setLaborHourlyRate] = useState(30); // R$ 30/h
  const [costEmbalagem, setCostEmbalagem] = useState(2.5); // R$ 2,50
  const [costEnergia, setCostEnergia] = useState(1.0); // R$ 1,00
  const [costFerramentas, setCostFerramentas] = useState(0.5); // R$ 0,50
  const [costOperacional, setCostOperacional] = useState(2.0); // R$ 2,00

  // Margins and Losses
  const [minMargin, setMinMargin] = useState(30); // 30%
  const [idealMargin, setIdealMargin] = useState(50); // 50%
  const [lossPercent, setLossPercent] = useState(5); // 5%

  // Sales taxes
  const [taxPix, setTaxPix] = useState(0); // 0%
  const [taxCard, setTaxCard] = useState(4.5); // 4.5%
  const [taxMarketplace, setTaxMarketplace] = useState(12); // 12%

  // Selected channel
  const [salesChannel, setSalesChannel] = useState<'pix' | 'card' | 'marketplace'>('pix');

  // Interactive margin slider
  const [targetMarginPercent, setTargetMarginPercent] = useState(31); // Matching Image 3 31%

  // Manual price override (Preço Manual Override)
  const [overridePriceStr, setOverridePriceStr] = useState('');

  // Selector state for materials
  const [tempMatId, setTempMatId] = useState('');
  const [tempQty, setTempQty] = useState(1);

  const activeInsumos = inventory.filter(i => !i.isDeleted && i.status === 'active');
  const activeProducts = products.filter(p => !p.isDeleted);

  // Initialize overrides from context settings if available
  useEffect(() => {
    if (settings) {
      if (settings.laborHourlyRate) setLaborHourlyRate(settings.laborHourlyRate);
      if (settings.defaultMarginPercent) setTargetMarginPercent(settings.defaultMarginPercent);
    }
  }, [settings]);

  // Derived productionTime in minutes for database storage compatibility
  const productionTime = useMemo(() => {
    const val = parseFloat(laborTimeInput);
    if (isNaN(val) || val <= 0) return 20; // fallback default of 20 mins when not specified
    return laborTimeUnit === 'h' ? val * 60 : val;
  }, [laborTimeInput, laborTimeUnit]);

  // Load existing product parameters if chosen
  const handleProductLoad = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    setProdName(prod.name);
    
    // Backwards compatibility fallback if not informed
    const timeMin = prod.productionTimeMin !== undefined && prod.productionTimeMin !== null ? prod.productionTimeMin : 20;
    if (timeMin >= 60 && timeMin % 60 === 0) {
      setLaborTimeInput((timeMin / 60).toString());
      setLaborTimeUnit('h');
    } else {
      setLaborTimeInput(timeMin.toString());
      setLaborTimeUnit('min');
    }
    
    // Convert composition to simulator format
    const sims = prod.composition.map(c => ({
      materialId: c.materialId,
      quantity: c.quantity
    }));
    setSelectedInsumos(sims);
    setOverridePriceStr(prod.sellingPrice.toString());
    toast.success("Produto Carregado", `Parâmetros de "${prod.name}" importados com sucesso.`);
  };

  // Add material to simulator list
  const handleAddMaterialSim = () => {
    if (!tempMatId) return;
    const existing = selectedInsumos.find(i => i.materialId === tempMatId);
    if (existing) {
      toast.warning("Insumo já adicionado", "Este insumo já está na simulação. Altere o valor na listagem.");
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

  // FINANCIAL ENGINE CALCULATIONS (Matching image 3 and 4 mathematically)
  
  // 1. Materials cost sum
  const materialsCostSum = selectedInsumos.reduce((total, sim) => {
    const mat = inventory.find(i => i.id === sim.materialId);
    if (!mat) return total;
    return total + (sim.quantity * mat.unitValue);
  }, 0);

  // 2. Loss cost (+ Perda 5%)
  const lossCost = materialsCostSum * (lossPercent / 100);

  // 3. Labor cost (hours * hourly rate) with dynamic calculation according to the unit selected
  const laborCost = useMemo(() => {
    const timeVal = parseFloat(laborTimeInput);
    if (isNaN(timeVal) || timeVal <= 0) {
      // Fallback: 20 mins default
      return (20 / 60) * laborHourlyRate;
    }
    if (laborTimeUnit === 'h') {
      return timeVal * laborHourlyRate;
    } else {
      return (timeVal / 60) * laborHourlyRate;
    }
  }, [laborTimeInput, laborTimeUnit, laborHourlyRate]);

  // 4. Indirect overhead costs sum
  const indirectCostsSum = costEmbalagem + costEnergia + costFerramentas + costOperacional;

  // 5. Total Base Cost (Custo Total Real de Produção)
  const baseCostTotal = materialsCostSum + lossCost + laborCost + indirectCostsSum;

  // 6. Current Tax Percent based on channel
  const currentTaxPercent = useMemo(() => {
    if (salesChannel === 'pix') return taxPix;
    if (salesChannel === 'card') return taxCard;
    if (salesChannel === 'marketplace') return taxMarketplace;
    return 0;
  }, [salesChannel, taxPix, taxCard, taxMarketplace]);

  // 7. Tarifa de Venda = Custo Total Real (Produção) * % da tarifa escolhida
  const estimatedTaxCost = useMemo(() => {
    return baseCostTotal * (currentTaxPercent / 100);
  }, [baseCostTotal, currentTaxPercent]);

  // 8. Custo Total com Tarifa
  const totalCostWithTax = useMemo(() => {
    return baseCostTotal + estimatedTaxCost;
  }, [baseCostTotal, estimatedTaxCost]);

  // 9. Suggested Selling Price based on slider margin and totalCostWithTax
  // Formula: suggestedSellingPrice = totalCostWithTax / (1 - Margin/100)
  const suggestedSellingPrice = useMemo(() => {
    const marginFrac = targetMarginPercent / 100;
    if (marginFrac >= 0.99) {
      return totalCostWithTax * 100; // prevent division by zero or negative price
    }
    return totalCostWithTax / (1 - marginFrac);
  }, [totalCostWithTax, targetMarginPercent]);

  // 10. Active price (Either override if set, otherwise suggested price)
  const precoFinal = useMemo(() => {
    const val = parseFloat(overridePriceStr);
    return (!isNaN(val) && val > 0) ? val : suggestedSellingPrice;
  }, [overridePriceStr, suggestedSellingPrice]);

  // 11. Net Profit Estimated = Preço Final - Custo Total com Tarifa
  const netProfitEstimated = useMemo(() => {
    return precoFinal - totalCostWithTax;
  }, [precoFinal, totalCostWithTax]);

  // 12. Real Margin Percent = (Net Profit Estimated / Preço Final) * 100
  const realMarginPercent = useMemo(() => {
    if (precoFinal <= 0) return 0;
    return (netProfitEstimated / precoFinal) * 100;
  }, [netProfitEstimated, precoFinal]);

  // Save/Apply pricing
  const handleApplyToProduct = () => {
    const roundedPrice = Math.round(precoFinal);
    
    if (selectedProductId) {
      // Update existing product selling price
      updateProduct(selectedProductId, {
        sellingPrice: roundedPrice,
        productionTimeMin: productionTime,
        composition: selectedInsumos.map(item => {
          const mat = inventory.find(i => i.id === item.materialId);
          return {
            materialId: item.materialId,
            quantity: item.quantity,
            cost: Number((item.quantity * (mat?.unitValue || 0)).toFixed(2))
          };
        })
      });
      toast.success("Preço Aplicado!", `Novo preço de R$ ${roundedPrice.toFixed(2)} salvo no produto "${prodName}".`);
    } else {
      // Create new product on the fly
      addProduct({
        name: prodName,
        sku: 'SKU-' + Math.floor(100000 + Math.random() * 900000),
        category: 'Simulado',
        description: 'Gerado automaticamente pelo Motor de Precificação',
        image: 'https://images.unsplash.com/photo-1590076211186-638a447bee3f?w=150',
        productionTimeMin: productionTime,
        finalWeightG: 0,
        sellingPrice: roundedPrice,
        composition: selectedInsumos.map(item => {
          const mat = inventory.find(i => i.id === item.materialId);
          return {
            materialId: item.materialId,
            quantity: item.quantity,
            cost: Number((item.quantity * (mat?.unitValue || 0)).toFixed(2))
          };
        }),
        status: 'active'
      });
      toast.success("Produto Criado!", `Novo produto "${prodName}" registrado com preço de R$ ${roundedPrice.toFixed(2)}.`);
    }
  };

  return (
    <div className="space-y-6 animate-slide-in-up text-slate-800">
      
      {/* Product Importer Section */}
      <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-xs">
        <h3 className="font-serif font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <RefreshCw size={16} className="text-amber-500 animate-spin-slow" /> 
          Clonar de um Produto Existente para Ajuste
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Selecionar Produto Cadastrado</label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductLoad(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/10 cursor-pointer font-medium"
            >
              <option value="">-- Criar nova simulação do zero --</option>
              {activeProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Preço Atual: R$ {p.sellingPrice.toFixed(2)})</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setSelectedProductId('');
              setProdName('Novo Terço Customizado');
              setSelectedInsumos([]);
              setLaborTimeInput('20');
              setLaborTimeUnit('min');
              setOverridePriceStr('');
              toast.info("Resetado", "Iniciada simulação limpa.");
            }}
            className="px-4 py-2.5 text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl cursor-pointer transition-all active:scale-95 shrink-0"
          >
            Limpar Simulação
          </button>
        </div>
      </div>

      {/* Simulator Workspace Grid (Matching Image 3 Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Materials composition & parameters */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-xs lg:col-span-7 space-y-6 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-base text-slate-900">Composição de Custos</h4>
                <p className="text-[10.5px] text-slate-500">Detalhamento completo do custo do produto artesanal</p>
              </div>
              <Layers size={18} className="text-amber-500" />
            </div>

            {/* Product simulation Name & Tempo de Mão de Obra Inputs */}
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome do Item / Simulação</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-850 focus:outline-none focus:ring-2 focus:ring-amber-500/10 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tempo de Mão de Obra *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={laborTimeInput}
                    onChange={(e) => setLaborTimeInput(e.target.value)}
                    placeholder="Ex: 45 ou 1.5"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-850 focus:outline-none focus:ring-2 focus:ring-amber-500/10 font-medium font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Unidade de Tempo *</label>
                  <select
                    value={laborTimeUnit}
                    onChange={(e) => setLaborTimeUnit(e.target.value as 'min' | 'h')}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-850 focus:outline-none focus:ring-2 focus:ring-amber-500/10 font-medium cursor-pointer"
                  >
                    <option value="min">Minutos (min)</option>
                    <option value="h">Horas (h)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Insumo Add form */}
            <div className="space-y-3 mt-4">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Adicionar Matérias-Primas do Estoque
              </h5>

              <div className="flex items-end gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-150">
                <div className="flex-1">
                  <select
                    value={tempMatId}
                    onChange={(e) => setTempMatId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500/10 cursor-pointer"
                  >
                    <option value="">Escolha um insumo...</option>
                    {activeInsumos.map(i => (
                      <option key={i.id} value={i.id}>{i.name} (Saldo: {i.quantity} {i.unit}, Custo: R$ {i.unitValue.toFixed(2)})</option>
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-850 text-center focus:outline-none focus:ring-1 focus:ring-amber-500/10"
                  />
                </div>
                <button
                  onClick={handleAddMaterialSim}
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors h-9 cursor-pointer active:scale-95"
                >
                  Incluir
                </button>
              </div>

              {/* Composition Breakdown (Matching left table in image 3) */}
              <div className="border border-slate-150 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white mt-4 shadow-3xs">
                <div className="flex justify-between items-center px-4 py-2 bg-slate-50/50 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  <span>Descrição / Item</span>
                  <span>Valor Calculado</span>
                </div>
                
                {/* Dynamically inserted materials list */}
                {selectedInsumos.map((sim, idx) => {
                  const mat = inventory.find(i => i.id === sim.materialId);
                  const itemCost = sim.quantity * (mat?.unitValue || 0);
                  return (
                    <div key={idx} className="flex justify-between items-center px-4 py-2.5 text-xs">
                      <div className="flex items-center gap-2 min-w-0 pr-4">
                        <button 
                          onClick={() => handleRemoveMaterialSim(sim.materialId)}
                          className="text-rose-500 hover:text-rose-700 font-bold hover:bg-rose-50 w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-all active:scale-90"
                          title="Remover"
                        >
                          ✕
                        </button>
                        <span className="font-semibold text-slate-800 truncate">{mat?.name || 'Insumo'}</span>
                        <span className="text-[10px] text-slate-400">({sim.quantity} {mat?.unit})</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          step="0.1"
                          value={sim.quantity}
                          onChange={(e) => handleUpdateQtySim(sim.materialId, Number(e.target.value))}
                          className="w-12 px-1 py-0.5 border border-slate-200 rounded text-center text-slate-900 font-medium focus:ring-1 focus:ring-amber-500/10 focus:outline-none"
                        />
                        <span className="font-mono font-bold text-slate-700 w-20 text-right">
                          R$ {itemCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Fixed structure rows (Image 3 exact matching) */}
                <div className="flex justify-between items-center px-4 py-2.5 text-xs bg-slate-50/20">
                  <span className="text-slate-500 font-medium">Custo de Materiais</span>
                  <span className="font-mono font-bold text-slate-700">R$ {materialsCostSum.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center px-4 py-2.5 text-xs text-amber-600 bg-amber-50/5">
                  <span className="font-medium">+ Perda ({lossPercent}%)</span>
                  <span className="font-mono font-bold">R$ {lossCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center px-4 py-2.5 text-xs">
                  <span className="text-slate-500 font-medium">Mão de Obra ({laborTimeInput}{laborTimeUnit} x R${laborHourlyRate}/h)</span>
                  <span className="font-mono font-bold text-slate-700">R$ {laborCost.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center px-4 py-2.5 text-xs bg-slate-50/20">
                  <span className="text-slate-500 font-medium">Embalagem</span>
                  <span className="font-mono font-bold text-slate-700">R$ {costEmbalagem.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center px-4 py-2.5 text-xs">
                  <span className="text-slate-500 font-medium">Energia</span>
                  <span className="font-mono font-bold text-slate-700">R$ {costEnergia.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center px-4 py-2.5 text-xs bg-slate-50/20">
                  <span className="text-slate-500 font-medium">Ferramentas</span>
                  <span className="font-mono font-bold text-slate-700">R$ {costFerramentas.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center px-4 py-2.5 text-xs">
                  <span className="text-slate-500 font-medium">Operacional</span>
                  <span className="font-mono font-bold text-slate-700">R$ {costOperacional.toFixed(2)}</span>
                </div>

                {/* Total cost row */}
                <div className="flex justify-between items-center px-4 py-2.5 bg-slate-50/40 text-xs">
                  <span className="text-slate-500 font-semibold">Custo Total Real (Produção)</span>
                  <span className="font-mono font-bold text-slate-700">R$ {baseCostTotal.toFixed(2)}</span>
                </div>

                {/* Tarifa de Venda */}
                <div className="flex justify-between items-center px-4 py-2.5 text-xs text-amber-700 bg-amber-50/10">
                  <span className="font-medium">Tarifa de Venda ({salesChannel === 'pix' ? 'Pix / Dinheiro' : salesChannel === 'card' ? 'Cartão' : 'Marketplace'} - {currentTaxPercent}%)</span>
                  <span className="font-mono font-bold">R$ {estimatedTaxCost.toFixed(2)}</span>
                </div>

                {/* Total cost com Tarifa row */}
                <div className="flex justify-between items-center px-4 py-3 bg-[#FAF8F5] font-serif font-bold text-sm text-slate-900 rounded-b-2xl">
                  <span>Custo Total com Tarifa</span>
                  <span className="font-mono text-amber-700">R$ {(baseCostTotal + estimatedTaxCost).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500 leading-normal bg-amber-50/15 p-3.5 rounded-2xl border border-amber-200/20 mt-4">
            <Info size={14} className="text-amber-500 shrink-0" />
            <span>
              <strong>Fórmula de Margem:</strong> O preço sugerido é baseado no mark-up simples de lucro desejado aplicado sobre o custo total real (Materiais + Mão de Obra + Indiretos).
            </span>
          </div>
        </div>

        {/* Right Side: Calculadora de Preço (Image 3 Right Column matching) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-xs space-y-6 h-full flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-bold text-base text-slate-900">Calculadora de Preço</h4>
                  <p className="text-[10.5px] text-slate-500">Defina a margem e calcule o preço de venda</p>
                </div>
                <Calculator size={18} className="text-amber-500 animate-pulse" />
              </div>

              {/* Margin Slider */}
              <div className="space-y-3.5 mt-5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Margem de Lucro Desejada</span>
                  <span className="text-xl font-bold text-amber-600 font-serif">{targetMarginPercent}%</span>
                </div>
                
                {/* Standard Range slider with styling */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={targetMarginPercent}
                  onChange={(e) => {
                    const newMargin = Number(e.target.value);
                    setTargetMarginPercent(newMargin);
                    
                    // Calculate and update manual override price to match the new suggested selling price
                    const marginFrac = newMargin / 100;
                    const taxFrac = currentTaxPercent / 100;
                    const taxCost = baseCostTotal * taxFrac;
                    const totalCostWithTax = baseCostTotal + taxCost;
                    let newSuggested = 0;
                    if (marginFrac >= 0.99) {
                      newSuggested = totalCostWithTax * 100;
                    } else {
                      newSuggested = totalCostWithTax / (1 - marginFrac);
                    }
                    setOverridePriceStr(newSuggested.toFixed(2));
                  }}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600 focus:outline-none"
                  style={{
                    background: `linear-gradient(to right, #D4A039 0%, #D4A039 ${targetMarginPercent}%, #E2E8F0 ${targetMarginPercent}%, #E2E8F0 100%)`
                  }}
                />
                
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>0%</span>
                  <span className="text-rose-500">Mínimo: {minMargin}%</span>
                  <span className="text-emerald-600">Ideal: {idealMargin}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Channel Selector widget */}
              <div className="space-y-2 mt-5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Meio de Venda / Tarifa</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pix', label: 'Pix / Dinheiro', fee: taxPix },
                    { id: 'card', label: 'Cartão', fee: taxCard },
                    { id: 'marketplace', label: 'Marketplace', fee: taxMarketplace },
                  ].map((chan) => (
                    <button
                      key={chan.id}
                      type="button"
                      onClick={() => {
                        setSalesChannel(chan.id as any);
                        
                        // Calculate and update manual override price to match the new suggested selling price with the new channel tax
                        const marginFrac = targetMarginPercent / 100;
                        const taxFrac = chan.fee / 100;
                        const taxCost = baseCostTotal * taxFrac;
                        const totalCostWithTax = baseCostTotal + taxCost;
                        let newSuggested = 0;
                        if (marginFrac >= 0.99) {
                          newSuggested = totalCostWithTax * 100;
                        } else {
                          newSuggested = totalCostWithTax / (1 - marginFrac);
                        }
                        setOverridePriceStr(newSuggested.toFixed(2));
                      }}
                      className={`py-2 px-1 text-center rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                        salesChannel === chan.id 
                          ? 'bg-amber-500/10 border-amber-500 text-amber-700' 
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <p className="truncate">{chan.label}</p>
                      <p className="font-mono text-[9px] text-amber-600 mt-0.5">({chan.fee}%)</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Big Suggested Selling Price Card block */}
              <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-slate-150 text-center mt-5 shadow-3xs">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Preço Sugerido</span>
                <h2 className="text-3xl font-bold font-serif text-amber-600 mt-1">
                  R$ {suggestedSellingPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <p className="text-[10px] text-slate-400 mt-1">Sugerido arredondar para: <strong>R$ {Math.round(suggestedSellingPrice).toFixed(2)}</strong></p>
              </div>

              {/* Preço Manual (Override) Input */}
              <div className="space-y-2 mt-5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preço Manual (Override)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-450 font-mono">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={suggestedSellingPrice.toFixed(2)}
                    value={overridePriceStr}
                    onChange={(e) => setOverridePriceStr(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Price Display and calculations */}
              <div className="mt-5 border-t border-slate-100 pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Preço Final Cadastrado</span>
                  <span className="text-lg font-serif font-black text-slate-900">R$ {precoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-3xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Margem Real</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-mono font-bold text-sm text-slate-800">{realMarginPercent.toFixed(1)}%</span>
                      {realMarginPercent < minMargin && (
                        <span className="text-rose-500" title="Abaixo do mínimo recomendado">
                          <AlertTriangle size={13} />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-3xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Lucro Líquido</span>
                    <span className="font-mono font-bold text-sm text-emerald-600 block mt-1">R$ {netProfitEstimated.toFixed(2)}</span>
                  </div>
                </div>

                {/* Low margin Alert */}
                {realMarginPercent < minMargin && (
                  <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl flex items-start gap-2 text-rose-700 text-xs leading-normal font-medium animate-pulse">
                    <AlertTriangle size={15} className="shrink-0 text-rose-500 mt-0.5" />
                    <div>
                      <p className="font-bold">Margem Baixa</p>
                      <p className="text-[10.5px] text-rose-600 mt-0.5">A margem real ({realMarginPercent.toFixed(1)}%) está abaixo do mínimo recomendado de {minMargin}%.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save price button */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleApplyToProduct}
                disabled={selectedInsumos.length === 0}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Calculator size={14} />
                Salvar Precificação
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Accordion parameters (Image 4 Panels exact representation) */}
      <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-xs space-y-6">
        <h4 className="font-serif font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Settings size={18} className="text-slate-400" />
          Configurações do Ateliê e Taxas de Operação
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          
          {/* Mão de Obra Box */}
          <div className="bg-slate-50/40 p-4 border border-slate-150 rounded-2xl space-y-3">
            <h5 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
              <RefreshCw size={12} className="text-amber-500" /> Mão de Obra
            </h5>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Valor da Hora de Trabalho (R$)</label>
              <input
                type="number"
                value={laborHourlyRate}
                onChange={(e) => setLaborHourlyRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Custos Indiretos Box */}
          <div className="bg-slate-50/40 p-4 border border-slate-150 rounded-2xl space-y-3">
            <h5 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
              <Layers size={12} className="text-amber-500" /> Custos Indiretos
            </h5>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-semibold text-slate-500 mb-1">Embalagem (R$)</label>
                <input
                  type="number"
                  step="0.1"
                  value={costEmbalagem}
                  onChange={(e) => setCostEmbalagem(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-slate-500 mb-1">Energia (R$)</label>
                <input
                  type="number"
                  step="0.1"
                  value={costEnergia}
                  onChange={(e) => setCostEnergia(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-slate-500 mb-1">Ferramentas (R$)</label>
                <input
                  type="number"
                  step="0.1"
                  value={costFerramentas}
                  onChange={(e) => setCostFerramentas(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-slate-500 mb-1">Operacional (R$)</label>
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
          <div className="bg-slate-50/40 p-4 border border-slate-150 rounded-2xl space-y-3">
            <h5 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
              <Sliders size={12} className="text-amber-500" /> Margens e Perdas
            </h5>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-semibold text-slate-500 mb-1">Mínima (%)</label>
                  <input
                    type="number"
                    value={minMargin}
                    onChange={(e) => setMinMargin(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-slate-500 mb-1">Ideal (%)</label>
                  <input
                    type="number"
                    value={idealMargin}
                    onChange={(e) => setIdealMargin(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold focus:outline-none text-center"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-slate-500 mb-1">Percentual de Perda (%)</label>
                <input
                  type="number"
                  value={lossPercent}
                  onChange={(e) => setLossPercent(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none text-center font-bold text-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Taxas de Venda Box */}
          <div className="bg-slate-50/40 p-4 border border-slate-150 rounded-2xl space-y-3">
            <h5 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
              <DollarSign size={12} className="text-amber-500" /> Taxas de Venda
            </h5>
            <div className="grid grid-cols-3 gap-1">
              <div>
                <label className="block text-[8px] font-bold text-slate-450 uppercase text-center mb-1">Taxa Pix</label>
                <input
                  type="number"
                  value={taxPix}
                  onChange={(e) => setTaxPix(Number(e.target.value))}
                  className="w-full px-1.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none text-center font-semibold font-mono"
                />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-450 uppercase text-center mb-1">Taxa Cartão</label>
                <input
                  type="number"
                  value={taxCard}
                  onChange={(e) => setTaxCard(Number(e.target.value))}
                  className="w-full px-1.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none text-center font-semibold font-mono"
                />
              </div>
              <div>
                <label className="block text-[8px] font-bold text-slate-450 uppercase text-center mb-1">Marketplace</label>
                <input
                  type="number"
                  value={taxMarketplace}
                  onChange={(e) => setTaxMarketplace(Number(e.target.value))}
                  className="w-full px-1.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none text-center font-semibold font-mono"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
