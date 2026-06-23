import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { InventoryItem, Product } from '../types/erp';
import { 
 DollarSign, RefreshCw, Calculator, HelpCircle, ArrowUpRight, 
 Settings, CheckCircle2, Sliders, Layers, Sparkles
} from 'lucide-react';
import { toast } from './Toast';

export const PricingView: React.FC = () => {
 const { products, inventory, settings, updateProduct } = useDb();

 // Selected existing product to clone from (optional)
 const [selectedProductId, setSelectedProductId] = useState('');
 
 // Interactive simulator variables
 const [prodName, setProdName] = useState('Novo Terço Customizado');
 const [selectedInsumos, setSelectedInsumos] = useState<Array<{ materialId: string; quantity: number }>>([]);
 const [productionTime, setProductionTime] = useState(60); // mins
 const [hourlyRate, setHourlyRate] = useState(settings.laborHourlyRate);
 const [indirectCosts, setIndirectCosts] = useState(settings.indirectCosts);
 const [taxesPercent, setTaxesPercent] = useState(10); // e.g. MEI taxes or payment fees
 const [targetMarginPercent, setTargetMarginPercent] = useState(settings.defaultMarginPercent);

 // Selector state for materials
 const [tempMatId, setTempMatId] = useState('');
 const [tempQty, setTempQty] = useState(1);

 const activeInsumos = inventory.filter(i => !i.isDeleted && i.status === 'active');
 const activeProducts = products.filter(p => !p.isDeleted);

 // Load existing product parameters if chosen
 const handleProductLoad = (prodId: string) => {
 setSelectedProductId(prodId);
 const prod = products.find(p => p.id === prodId);
 if (!prod) return;

 setProdName(prod.name);
 setProductionTime(prod.productionTimeMin);
 
 // Convert composition to simulator format
 const sims = prod.composition.map(c => ({
 materialId: c.materialId,
 quantity: c.quantity
 }));
 setSelectedInsumos(sims);
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
 };

 const handleRemoveMaterialSim = (matId: string) => {
 setSelectedInsumos(selectedInsumos.filter(i => i.materialId !== matId));
 };

 const handleUpdateQtySim = (matId: string, newQty: number) => {
 setSelectedInsumos(selectedInsumos.map(i => i.materialId === matId ? { ...i, quantity: newQty } : i));
 };

 // FINANCIAL ENGINE CALCULATIONS
 // 1. Materials cost sum
 const materialsCostSum = selectedInsumos.reduce((total, sim) => {
 const mat = inventory.find(i => i.id === sim.materialId);
 if (!mat) return total;
 return total + (sim.quantity * mat.unitValue);
 }, 0);

 // 2. Labor cost (hours * hourly rate)
 const laborCost = (productionTime / 60) * hourlyRate;

 // 3. Operational subtotal
 const operationalSubtotal = laborCost + indirectCosts;

 // 4. Base Cost (Materials + Operational)
 const baseCostTotal = materialsCostSum + operationalSubtotal;

 // 5. Taxes amount based on price (Taxes apply as percentage of selling price)
 // Let: Price = (BaseCost * (1 + Margin/100)) / (1 - Tax/100)
 const simulatedProfitMultiplier = (1 + targetMarginPercent / 100);
 const taxDivisor = (1 - taxesPercent / 100);
 
 const suggestedSellingPrice = taxDivisor > 0 
 ? (baseCostTotal * simulatedProfitMultiplier) / taxDivisor
 : baseCostTotal * simulatedProfitMultiplier;

 const estimatedTaxCost = suggestedSellingPrice * (taxesPercent / 100);
 const netProfitEstimated = suggestedSellingPrice - baseCostTotal - estimatedTaxCost;

 // Save recommended simulated price to existing product
 const handleApplyToProduct = () => {
 if (!selectedProductId) {
 toast.warning("Aviso", "Selecione um produto existente da lista superior para salvar o novo preço de venda.");
 return;
 }
 
 // Update product selling price
 const finalPrice = Math.round(suggestedSellingPrice);
 updateProduct(selectedProductId, {
 sellingPrice: finalPrice,
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

 toast.success("Preço Aplicado!", `Novo preço de R$ ${finalPrice.toFixed(2)} salvo no produto "${prodName}".`);
 };

 return (
 <div className="space-y-6 animate-slide-in-up">
 
 {/* Product Importer Section */}
 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm">
 <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
 <RefreshCw size={16} className="text-amber-500 animate-spin-slow" /> Clonar de um Produto Existente
 </h3>
 <div className="flex flex-col sm:flex-row gap-4 items-end">
 <div className="flex-1">
 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Selecionar Produto Cadastrado</label>
 <select
 value={selectedProductId}
 onChange={(e) => handleProductLoad(e.target.value)}
 className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none"
 >
 <option value="">-- Criar simulação do zero --</option>
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
 setProductionTime(60);
 toast.info("Resetado", "Iniciada simulação limpa.");
 }}
 className="px-4 py-2 text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl cursor-pointer"
 >
 Limpar Simulação
 </button>
 </div>
 </div>

 {/* Simulator Workspace Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 
 {/* Left Side: Parameters Customizer */}
 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm lg:col-span-7 space-y-6">
 <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
 <div>
 <h4 className="font-bold text-sm text-slate-900 ">Parâmetros do Motor Inteligente</h4>
 <p className="text-[10.5px] text-slate-500">Ajuste os valores de insumos e taxas em tempo real</p>
 </div>
 <Sliders size={16} className="text-slate-400" />
 </div>

 {/* Product simulation Name */}
 <div>
 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nome da Simulação</label>
 <input
 type="text"
 value={prodName}
 onChange={(e) => setProdName(e.target.value)}
 className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 {/* Materials Section */}
 <div className="space-y-3">
 <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
 <Layers size={13} className="text-amber-500" /> 1. Matérias-Primas da Composição
 </h5>

 {/* Quick material selector */}
 <div className="flex items-end gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-150 ">
 <div className="flex-1">
 <select
 value={tempMatId}
 onChange={(e) => setTempMatId(e.target.value)}
 className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
 >
 <option value="">Selecione insumo do estoque...</option>
 {activeInsumos.map(i => (
 <option key={i.id} value={i.id}>{i.name} (Custo: R$ {i.unitValue.toFixed(2)})</option>
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
 className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-850 text-center"
 />
 </div>
 <button
 onClick={handleAddMaterialSim}
 className="px-3.5 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:opacity-90 transition-colors h-9"
 >
 Incluir
 </button>
 </div>

 {/* Simulated list */}
 <div className="border border-slate-100 rounded-xl divide-y divide-slate-150 overflow-hidden max-h-48 overflow-y-auto">
 {selectedInsumos.map((sim, idx) => {
 const mat = inventory.find(i => i.id === sim.materialId);
 return (
 <div key={idx} className="flex justify-between items-center px-4 py-2 bg-slate-50/15 text-xs">
 <span className="font-bold text-slate-800 truncate pr-4">{mat?.name || 'Insumo'}</span>
 <div className="flex items-center gap-3 shrink-0">
 <div className="flex items-center gap-1">
 <input
 type="number"
 step="0.01"
 value={sim.quantity}
 onChange={(e) => handleUpdateQtySim(sim.materialId, Number(e.target.value))}
 className="w-14 px-1.5 py-0.5 border border-slate-200 rounded bg-white text-slate-900 text-center"
 />
 <span className="text-[10px] text-slate-450">{mat?.unit}</span>
 </div>
 <span className="font-mono font-bold text-slate-800 w-16 text-right">
 R$ {(sim.quantity * (mat?.unitValue || 0)).toFixed(2)}
 </span>
 <button 
 onClick={() => handleRemoveMaterialSim(sim.materialId)}
 className="text-rose-500 hover:text-rose-600 font-bold text-base px-1.5 cursor-pointer"
 >
 ×
 </button>
 </div>
 </div>
 );
 })}
 {selectedInsumos.length === 0 && (
 <p className="p-4 text-center text-slate-400 text-xs italic">Nenhum insumo incluído na simulação. Adicione acima.</p>
 )}
 </div>
 </div>

 {/* Operational Hours and Rates */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 ">
 
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">2. Tempo de Produção (min)</label>
 <input
 type="number"
 min="1"
 value={productionTime}
 onChange={(e) => setProductionTime(Number(e.target.value))}
 className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Valor da Hora do Artesão (R$)</label>
 <input
 type="number"
 min="0"
 value={hourlyRate}
 onChange={(e) => setHourlyRate(Number(e.target.value))}
 className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-850 font-mono"
 />
 </div>
 </div>

 {/* Overheads and margins */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 ">
 
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">3. Custos Indiretos (R$)</label>
 <input
 type="number"
 min="0"
 value={indirectCosts}
 onChange={(e) => setIndirectCosts(Number(e.target.value))}
 className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-850 font-mono"
 />
 <span className="text-[9px] text-slate-450 mt-1 block">Energia, embalagem fixa, etc</span>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">4. Taxas e Tarifas (%)</label>
 <input
 type="number"
 min="0"
 max="90"
 value={taxesPercent}
 onChange={(e) => setTaxesPercent(Number(e.target.value))}
 className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-850"
 />
 <span className="text-[9px] text-slate-450 mt-1 block">Comissão, impostos, Pix</span>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">5. Margem de Lucro (%)</label>
 <input
 type="number"
 min="10"
 value={targetMarginPercent}
 onChange={(e) => setTargetMarginPercent(Number(e.target.value))}
 className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-850"
 />
 <span className="text-[9px] text-slate-450 mt-1 block">Retorno do Ateliê</span>
 </div>
 </div>

 </div>

 {/* Right Side: Financial Analysis Dashboard & Suggested Pricing card */}
 <div className="lg:col-span-5 space-y-6">
 
 {/* Target Price Card (The big recommendation visualizer styled in rich light luxury champagne/gold) */}
 <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-rose-500/5 text-slate-900 rounded-3xl p-6 border border-amber-500/20 shadow-md">
 <div className="absolute top-0 right-0 w-44 h-44 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>
 <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-200/10 rounded-full blur-2xl pointer-events-none"></div>
 
 <div className="flex justify-between items-start">
 <div>
 <span className="px-3 py-1 bg-amber-500/15 text-amber-800 border border-amber-500/25 rounded-full text-[9px] uppercase tracking-wider font-bold">
 Preço Sugerido Final
 </span>
 <p className="text-[11.5px] text-slate-600 font-medium mt-1.5">Cálculo Preciso de Valor de Venda</p>
 </div>
 <Calculator size={20} className="text-amber-600" />
 </div>

 <div className="my-6">
 <span className="font-script text-3xl text-amber-600 block -mb-1 select-none">Valor Nobre Recomendado</span>
 <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900">
 R$ {suggestedSellingPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </h1>
 <p className="text-xs text-slate-500 mt-1">Sugerido arredondar para: <strong className="text-slate-800">R$ {Math.round(suggestedSellingPrice).toFixed(2)}</strong></p>
 </div>

 {/* Profitability metrics inside recommendation card */}
 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-amber-500/15 text-xs">
 <div>
 <p className="text-slate-500 font-medium">Lucro Líquido Real</p>
 <p className="text-emerald-600 font-bold font-mono mt-0.5">R$ {netProfitEstimated.toFixed(2)}</p>
 </div>
 <div>
 <p className="text-slate-500 font-medium">Margem Operacional</p>
 <p className="text-emerald-600 font-bold font-mono mt-0.5">{Math.round((netProfitEstimated / suggestedSellingPrice) * 100)}%</p>
 </div>
 </div>

 {selectedProductId && (
 <button
 onClick={handleApplyToProduct}
 className="w-full py-2.5 mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 cursor-pointer text-center block"
 >
 Salvar Preço no Produto
 </button>
 )}
 </div>

 {/* Breakdown Sheets Card */}
 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm space-y-4">
 <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Detalhamento dos Custos</h4>
 
 <div className="space-y-2 text-xs">
 
 <div className="flex justify-between items-center py-2 border-b border-slate-50 ">
 <span className="text-slate-500 font-medium">Soma dos Materiais (1)</span>
 <span className="font-bold font-mono text-slate-800 ">R$ {materialsCostSum.toFixed(2)}</span>
 </div>

 <div className="flex justify-between items-center py-2 border-b border-slate-50 ">
 <span className="text-slate-500 font-medium">Mão de Obra do Artesão (2)</span>
 <span className="font-bold font-mono text-slate-800 ">R$ {laborCost.toFixed(2)}</span>
 </div>

 <div className="flex justify-between items-center py-2 border-b border-slate-50 ">
 <span className="text-slate-500 font-medium">Custos Fixos Indiretos (3)</span>
 <span className="font-bold font-mono text-slate-800 ">R$ {indirectCosts.toFixed(2)}</span>
 </div>

 <div className="flex justify-between items-center py-2 border-b border-slate-50 bg-slate-50/50 px-2 rounded-lg font-bold">
 <span className="text-slate-700 ">CUSTO TOTAL BASE (1+2+3)</span>
 <span className="font-mono text-slate-900 ">R$ {baseCostTotal.toFixed(2)}</span>
 </div>

 <div className="flex justify-between items-center py-2 border-b border-slate-50 text-slate-450">
 <span className="font-medium">Taxas Praticadas ({taxesPercent}%)</span>
 <span className="font-mono">R$ {estimatedTaxCost.toFixed(2)}</span>
 </div>

 <div className="flex justify-between items-center py-2 text-slate-450">
 <span className="font-medium">Margem de Lucro Almejada ({targetMarginPercent}%)</span>
 <span className="font-mono text-emerald-600 font-bold">+ R$ {(baseCostTotal * targetMarginPercent / 100).toFixed(2)}</span>
 </div>
 </div>

 <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/15 text-[11px] font-medium text-slate-700 leading-normal">
 💡 <strong>Dica do Ateliê:</strong> O valor sugerido utiliza a fórmula oficial de Mark-up Econômico de Venda, garantindo que você recupere o valor da sua hora trabalhada, cubra os insumos e as tarifas de cartão, e ainda gere lucro livre para reinversão!
 </div>
 </div>

 </div>

 </div>

 </div>
 );
};
