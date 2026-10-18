import React, { useState } from 'react';
import { InventoryItem } from '../../types/erp';
import { 
  ArrowLeft, ArrowUpDown, Check, DollarSign, Package, AlertTriangle, Truck, Sparkles 
} from 'lucide-react';
import { Button } from '../ui';
import { toast } from '../Toast';

export interface InventoryAdjustScreenProps {
  item: InventoryItem;
  onBack: () => void;
  onSave: (
    id: string, 
    amount: number, 
    notes: string, 
    category: string, 
    supplier: string, 
    unitValue?: number, 
    expense?: number
  ) => void;
}

export const InventoryAdjustScreen: React.FC<InventoryAdjustScreenProps> = ({
  item,
  onBack,
  onSave,
}) => {
  const [adjustType, setAdjustType] = useState<"add" | "subtract">("add");
  const [amount, setAmount] = useState<number>(10);
  const [notes, setNotes] = useState<string>("Entrada de lote complementar");
  const [supplierName, setSupplierName] = useState<string>(item.supplier || "");

  // Price recalculation states
  const [adjustUpdatePrice, setAdjustUpdatePrice] = useState(false);
  const [adjustCalcType, setAdjustCalcType] = useState<"manual" | "calc">("manual");
  const [adjustManualUnitPrice, setAdjustManualUnitPrice] = useState<number>(item.unitValue);
  const [adjustPackagePrice, setAdjustPackagePrice] = useState<number>(0);
  const [adjustFreightValue, setAdjustFreightValue] = useState<number>(0);
  const [adjustMethod, setAdjustMethod] = useState<"weighted" | "replace">("weighted");

  // Calculated values
  const targetUnitPriceToApply =
    adjustCalcType === "manual"
      ? adjustManualUnitPrice
      : amount > 0
        ? (adjustPackagePrice + adjustFreightValue) / amount
        : item.unitValue;

  const currentTotalStock = item.quantity;
  const newTotalStock =
    adjustType === "add" ? currentTotalStock + amount : Math.max(0, currentTotalStock - amount);

  const weightedCalculatedUnitPrice =
    newTotalStock > 0
      ? (currentTotalStock * item.unitValue + amount * targetUnitPriceToApply) / newTotalStock
      : targetUnitPriceToApply;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("Quantidade Inválida", "Informe uma quantidade maior que zero.");
      return;
    }

    const finalAmount = adjustType === "add" ? amount : -amount;
    let finalUnitValue: number | undefined = undefined;
    let finalExpenseValue: number | undefined = undefined;

    if (adjustType === "add" && adjustUpdatePrice) {
      finalUnitValue =
        adjustMethod === "weighted"
          ? weightedCalculatedUnitPrice
          : targetUnitPriceToApply;

      if (adjustCalcType === "calc") {
        finalExpenseValue = adjustPackagePrice + adjustFreightValue;
      } else {
        finalExpenseValue = amount * adjustManualUnitPrice;
      }
    }

    onSave(
      item.id,
      finalAmount,
      notes,
      item.category,
      supplierName,
      finalUnitValue,
      finalExpenseValue
    );
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
              <ArrowUpDown className="text-amber-600" size={24} />
              Movimentar Saldo de Estoque: {item.name}
            </h2>
            <p className="text-xs text-slate-500">
              Registre entradas de fornecedores, saídas de fabricação ou perdas de bancada com atualização do custo médio.
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

      {/* Main Movement Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* Item Current Status Strip */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-mono">
                  Insumo Selecionado
                </span>
                <h4 className="font-serif font-bold text-base text-slate-900 mt-0.5">
                  {item.name}
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  Código: {item.code} • Categoria: {item.category}
                </span>
              </div>
              <div className="flex items-center gap-4 text-center">
                <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Saldo Atual</span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {item.quantity} {item.unit}
                  </span>
                </div>
                <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Custo Atual</span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    R$ {item.unitValue.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Movement Type Toggle */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Tipo de Operação *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustType("add")}
                  className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    adjustType === "add"
                      ? "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Entrada (+) de Insumos
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType("subtract")}
                  className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    adjustType === "subtract"
                      ? "bg-rose-50 border-rose-400 text-rose-800 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Saída / Perda (-)
                </button>
              </div>
            </div>

            {/* Quantity and Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantidade a Movimentar ({item.unit}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fornecedor / Contato da Operação
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Nome do fornecedor ou oficina"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo / Observações do Ajuste *
                </label>
                <input
                  type="text"
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Compra de lote novo com frete rateado..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Recalculate Unit Price (Only for Entries) */}
            {adjustType === "add" && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adjustUpdatePrice}
                    onChange={(e) => setAdjustUpdatePrice(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Recalcular / atualizar o custo unitário deste lote de compra?
                  </span>
                </label>

                {adjustUpdatePrice && (
                  <div className="p-5 bg-amber-50/20 border border-amber-200/60 rounded-2xl space-y-4 animate-slide-in-up">
                    <div className="flex gap-2 justify-end border-b border-amber-200/40 pb-2">
                      <button
                        type="button"
                        onClick={() => setAdjustCalcType("manual")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          adjustCalcType === "manual" ? "bg-amber-100 border-amber-400 text-amber-900" : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        Digitar Valor Manual
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustCalcType("calc")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          adjustCalcType === "calc" ? "bg-amber-100 border-amber-400 text-amber-900" : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        Assistente (Lote + Frete)
                      </button>
                    </div>

                    {adjustCalcType === "manual" ? (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Novo Valor Unitário de Compra (R$)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">R$</span>
                          <input
                            type="number"
                            step="0.0001"
                            min="0"
                            value={adjustManualUnitPrice || ""}
                            onChange={(e) => setAdjustManualUnitPrice(Number(e.target.value))}
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Preço do Lote (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={adjustPackagePrice || ""}
                            onChange={(e) => setAdjustPackagePrice(Number(e.target.value))}
                            placeholder="0.00"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Valor do Frete (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={adjustFreightValue || ""}
                            onChange={(e) => setAdjustFreightValue(Number(e.target.value))}
                            placeholder="0.00"
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    )}

                    {/* Cost Application Method: Weighted vs Replace */}
                    <div className="space-y-2 pt-2 border-t border-amber-200/40 text-xs">
                      <span className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        Método de Aplicação no Custo
                      </span>
                      <label className="flex items-start gap-2 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="adjustMethod"
                          checked={adjustMethod === "weighted"}
                          onChange={() => setAdjustMethod("weighted")}
                          className="mt-0.5 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <span className="font-bold text-slate-800">Custo Médio Ponderado (Recomendado)</span>
                          <p className="text-slate-500 text-[11px]">
                            Pondera o estoque atual ({item.quantity} {item.unit} a R$ {item.unitValue.toFixed(4)}) com a nova entrada. Custo final resultante: <strong className="text-emerald-700 font-mono">R$ {weightedCalculatedUnitPrice.toFixed(4)}</strong>
                          </p>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer select-none mt-2">
                        <input
                          type="radio"
                          name="adjustMethod"
                          checked={adjustMethod === "replace"}
                          onChange={() => setAdjustMethod("replace")}
                          className="mt-0.5 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <span className="font-bold text-slate-800">Substituir Custo Unitário Inteiro</span>
                          <p className="text-slate-500 text-[11px]">
                            Substitui o custo de todo o estoque pelo novo valor inserido: <strong className="text-slate-900 font-mono">R$ {targetUnitPriceToApply.toFixed(4)}</strong>
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
            <h4 className="font-serif font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Impacto no Saldo</span>
              <DollarSign size={18} className="text-amber-600" />
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Saldo Atual:</span>
                <span className="font-mono font-bold text-slate-700">
                  {currentTotalStock} {item.unit}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Operação:</span>
                <span className={`font-mono font-bold ${adjustType === 'add' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {adjustType === 'add' ? '+' : '-'}{amount} {item.unit}
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm font-black border-t-2 border-slate-900 text-slate-900">
                <span>NOVO SALDO ESTIMADO:</span>
                <span className="font-mono text-amber-700 text-base">
                  {newTotalStock} {item.unit}
                </span>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-2.5">
              <Button
                type="submit"
                size="lg"
                className="w-full justify-center"
                leftIcon={<Check size={18} className="text-amber-400" />}
              >
                Confirmar Movimentação
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
