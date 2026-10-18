import React, { useState, useMemo } from 'react';
import { InventoryItem, CalcMethod } from '../../types/erp';
import { 
  ArrowLeft, Package, Sparkles, Truck, Image as ImageIcon, 
  Check, X, DollarSign, Scale, Layers
} from 'lucide-react';
import { Button } from '../ui';
import { toast } from '../Toast';

export interface InventoryAddScreenProps {
  onBack: () => void;
  onSave: (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => void;
  categories: string[];
}

export const InventoryAddScreen: React.FC<InventoryAddScreenProps> = ({
  onBack,
  onSave,
  categories,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "Contas e Pérolas",
    code: "INS-" + Math.floor(100 + Math.random() * 900),
    description: "",
    supplier: "",
    unit: "unidade",
    weightG: 0,
    quantity: 0,
    minQuantity: 5,
    unitValue: 0,
    calcMethod: "fixed" as CalcMethod,
    notes: "",
    status: "active" as const,
    imageUrl: "",
  });

  // Smart Calculator States
  const [isSmartCalcActive, setIsSmartCalcActive] = useState(true);
  const [calcType, setCalcType] = useState<"unit" | "weight">("unit");
  const [calcPackagePrice, setCalcPackagePrice] = useState<number>(0);
  const [hasFreight, setHasFreight] = useState(false);
  const [freightValue, setFreightValue] = useState<number>(0);
  const [calcPackageUnits, setCalcPackageUnits] = useState<number>(0);
  const [calcPackageWeight, setCalcPackageWeight] = useState<number>(0);
  const [calcUnitWeightMethod, setCalcUnitWeightMethod] = useState<"none" | "fixed" | "sample">("none");
  const [calcUnitWeightKnown, setCalcUnitWeightKnown] = useState<number>(0);
  const [calcSampleSize, setCalcSampleSize] = useState<number>(10);
  const [calcSampleWeight, setCalcSampleWeight] = useState<number>(0);
  const [selectedMeasureUnit, setSelectedMeasureUnit] = useState<string>("unidade");

  // Dynamic real-time calculation in the form
  const smartCalculatedResults = useMemo(() => {
    const price = calcPackagePrice || 0;
    const freight = hasFreight ? freightValue || 0 : 0;
    const totalCost = price + freight;

    let computedUnitCost = 0;
    let computedUnitWeight = 0;
    let computedInventoryQty = 0;
    let computedCostPerGram = 0;

    if (calcType === "unit") {
      const units = calcPackageUnits || 0;
      const totalWeight = calcPackageWeight || 0;

      if (units > 0) {
        computedUnitCost = totalCost / units;
        if (totalWeight > 0) {
          computedUnitWeight = totalWeight / units;
          computedCostPerGram = totalCost / totalWeight;
        }
      }

      if (selectedMeasureUnit === "grama" && totalWeight > 0) {
        computedInventoryQty = totalWeight;
        computedUnitCost = computedCostPerGram;
      } else {
        computedInventoryQty = units;
      }
    } else {
      const totalWeight = calcPackageWeight || 0;
      if (totalWeight > 0) {
        computedCostPerGram = totalCost / totalWeight;
      }

      let estimatedUnitWeight = 0;
      if (calcUnitWeightMethod === "fixed") {
        estimatedUnitWeight = calcUnitWeightKnown || 0;
      } else if (calcUnitWeightMethod === "sample") {
        const sampleSize = calcSampleSize || 1;
        const sampleW = calcSampleWeight || 0;
        estimatedUnitWeight = sampleW / sampleSize;
      }

      if (estimatedUnitWeight > 0) {
        const estimatedUnits = totalWeight / estimatedUnitWeight;
        computedUnitCost = totalCost / estimatedUnits;
        computedUnitWeight = estimatedUnitWeight;
      } else {
        computedUnitCost = computedCostPerGram;
        computedUnitWeight = 0;
      }

      if (selectedMeasureUnit === "unidade" && estimatedUnitWeight > 0) {
        computedInventoryQty = Math.round(totalWeight / estimatedUnitWeight);
      } else {
        computedInventoryQty = totalWeight;
      }
    }

    return {
      totalCost,
      unitValue: computedUnitCost,
      weightG: computedUnitWeight,
      quantity: computedInventoryQty,
      unit: selectedMeasureUnit,
      costPerGram: computedCostPerGram,
    };
  }, [
    calcType,
    calcPackagePrice,
    hasFreight,
    freightValue,
    calcPackageUnits,
    calcPackageWeight,
    calcUnitWeightMethod,
    calcUnitWeightKnown,
    calcSampleSize,
    calcSampleWeight,
    selectedMeasureUnit,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalUnitValue = formData.unitValue;
    let finalQty = formData.quantity;
    let finalWeight = formData.weightG;
    let finalUnit = formData.unit;

    if (isSmartCalcActive) {
      finalUnitValue = smartCalculatedResults.unitValue;
      finalQty = smartCalculatedResults.quantity;
      finalWeight = smartCalculatedResults.weightG;
      finalUnit = smartCalculatedResults.unit;
    }

    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Validação", "Preencha o nome e o código do insumo.");
      return;
    }

    let finalNotes = formData.notes;
    if (isSmartCalcActive) {
      const calcDetail = `[Smart Converter: Lote R$ ${calcPackagePrice} | Frete R$ ${freightValue} | Entrada: ${calcType === "unit" ? `${calcPackageUnits} un` : `${calcPackageWeight}g`}]`;
      finalNotes = finalNotes ? `${finalNotes}\n${calcDetail}` : calcDetail;
    }

    onSave({
      ...formData,
      unitValue: finalUnitValue,
      quantity: finalQty,
      weightG: finalWeight,
      unit: finalUnit,
      notes: finalNotes,
    });
  };

  return (
    <div className="space-y-6 pb-12 font-sans select-none animate-slide-in-up">
      {/* Header with Back button */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-bold text-slate-500 hover:text-amber-800 transition-colors flex items-center gap-1.5 cursor-pointer mb-1"
            >
              <ArrowLeft size={14} />
              Voltar ao Estoque
            </button>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="text-amber-600" size={24} />
              Novo Insumo Artesanal
            </h2>
            <p className="text-xs text-slate-500">
              Cadastre miçangas, pérolas, metais, crucifixos ou cordões com cálculo inteligente de custos e rateio de frete.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            leftIcon={<ArrowLeft size={14} />}
          >
            Cancelar e Voltar
          </Button>
        </div>
      </div>

      {/* Main Card with Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Assistente Inteligente de Compra */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100/40 border border-amber-200/60 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Sparkles size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-950 block">
                    Assistente Inteligente de Compra
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Calcula custos unitários reais dividindo o valor total do pacote e frete pela quantidade ou peso.
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSmartCalcActive}
                  onChange={(e) => setIsSmartCalcActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {isSmartCalcActive && (
              <div className="border border-amber-200/50 bg-amber-50/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/40 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={14} className="text-amber-600" />
                    Dados do Pacote Comprado
                  </h4>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCalcType("unit");
                        setSelectedMeasureUnit("unidade");
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${calcType === "unit" ? "bg-amber-100 border-amber-400 text-amber-900" : "bg-white border-slate-200 text-slate-600"}`}
                    >
                      Por Quantidade (un)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCalcType("weight");
                        setSelectedMeasureUnit("grama");
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${calcType === "weight" ? "bg-amber-100 border-amber-400 text-amber-900" : "bg-white border-slate-200 text-slate-600"}`}
                    >
                      Por Peso (g)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                      Preço Pago no Pacote (R$) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={calcPackagePrice || ""}
                        onChange={(e) => setCalcPackagePrice(Number(e.target.value))}
                        placeholder="50.00"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  {calcType === "unit" ? (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                          Qtd de Contas no Pacote *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={calcPackageUnits || ""}
                          onChange={(e) => setCalcPackageUnits(Number(e.target.value))}
                          placeholder="Ex: 250"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                          Peso do Pacote (g)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={calcPackageWeight || ""}
                          onChange={(e) => setCalcPackageWeight(Number(e.target.value))}
                          placeholder="Ex: 180"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                          Peso do Pacote (g) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={calcPackageWeight || ""}
                          onChange={(e) => setCalcPackageWeight(Number(e.target.value))}
                          placeholder="Ex: 500"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                          Como Medir no Estoque?
                        </label>
                        <select
                          value={selectedMeasureUnit}
                          onChange={(e) => setSelectedMeasureUnit(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:outline-none"
                        >
                          <option value="grama">Por Gramas (g)</option>
                          <option value="unidade">Por Unidade (un)</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {/* Freight Row */}
                <div className="border-t border-amber-200/40 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-amber-700" />
                    <span className="font-bold text-slate-700">Houve custo de frete na compra?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setHasFreight(false); setFreightValue(0); }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${!hasFreight ? 'bg-white text-slate-800 shadow-xs border border-slate-200' : 'text-slate-400'}`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasFreight(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${hasFreight ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400'}`}
                    >
                      Sim
                    </button>
                    {hasFreight && (
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold text-[10px]">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={freightValue || ""}
                          onChange={(e) => setFreightValue(Number(e.target.value))}
                          placeholder="Frete"
                          className="w-full pl-7 pr-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 font-mono font-bold"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dados Gerais do Insumo */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              Identificação & Especificações
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Matéria-Prima / Insumo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Pérola Branca ABS 8mm com Furo Passante"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:bg-white focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Crucifixos">Crucifixos</option>
                  <option value="Metais & Entremeios">Metais & Entremeios</option>
                  <option value="Contas e Pérolas">Contas e Pérolas</option>
                  <option value="Embalagens & Veludo">Embalagens & Veludo</option>
                  <option value="Fios e Cordões">Fios e Cordões</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Código Interno / SKU *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="INS-101"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fornecedor
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Ex: Importadora de Metais Sacros"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estoque Mínimo (Alerta)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL da Foto do Insumo
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição & Instruções de Armazenamento
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Armazenar longe da umidade para preservar o banho dourado..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cost Card & Submission */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
            <h4 className="font-serif font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Resultado da Precificação</span>
              <DollarSign size={18} className="text-amber-600" />
            </h4>

            {isSmartCalcActive ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Custo Total Compra:</span>
                  <span className="font-mono font-bold text-slate-900">
                    R$ {smartCalculatedResults.totalCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Saldo Adicionado:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {smartCalculatedResults.quantity} {smartCalculatedResults.unit}
                  </span>
                </div>
                {smartCalculatedResults.weightG > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Peso Unitário:</span>
                    <span className="font-mono text-slate-700">
                      {smartCalculatedResults.weightG.toFixed(3)}g
                    </span>
                  </div>
                )}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/60 mt-3 text-center">
                  <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block">
                    Custo Unitário Final Calculado
                  </span>
                  <span className="text-2xl font-black font-mono text-amber-950 mt-1 block">
                    R$ {smartCalculatedResults.unitValue.toFixed(4)}
                  </span>
                  <span className="text-[10px] text-amber-700 mt-1 block">
                    por {smartCalculatedResults.unit} cadastrada
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Custo Unitário Manual (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.unitValue}
                    onChange={(e) => setFormData({ ...formData, unitValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Saldo Inicial no Estoque
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
            )}

            <div className="pt-4 flex flex-col gap-2.5">
              <Button
                type="submit"
                size="lg"
                className="w-full justify-center"
                leftIcon={<Check size={18} className="text-amber-400" />}
              >
                Cadastrar Insumo no Estoque
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
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
};
