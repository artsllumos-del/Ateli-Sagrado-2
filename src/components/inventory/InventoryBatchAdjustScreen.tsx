import React, { useState } from 'react';
import { InventoryItem } from '../../types/erp';
import { 
  ArrowLeft, Package, Check, DollarSign, Layers, AlertCircle 
} from 'lucide-react';
import { Button } from '../ui';
import { toast } from '../Toast';

export interface InventoryBatchAdjustScreenProps {
  selectedItems: InventoryItem[];
  onBack: () => void;
  onSave: (
    type: 'add' | 'subtract',
    amount: number,
    notes: string,
    supplier: string,
    updatePrice: boolean,
    priceMethod: 'weighted' | 'replace',
    manualUnitPrice?: number,
    packagePrice?: number,
    freightValue?: number
  ) => void;
}

export const InventoryBatchAdjustScreen: React.FC<InventoryBatchAdjustScreenProps> = ({
  selectedItems,
  onBack,
  onSave,
}) => {
  const [type, setType] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState<number>(10);
  const [notes, setNotes] = useState<string>('Ajuste de estoque em lote');
  const [supplierName, setSupplierName] = useState<string>('');
  const [updatePrice, setUpdatePrice] = useState(false);
  const [priceCalcType, setPriceCalcType] = useState<'manual' | 'calc'>('manual');
  const [manualUnitPrice, setManualUnitPrice] = useState<number>(0);
  const [packagePrice, setPackagePrice] = useState<number>(0);
  const [freightValue, setFreightValue] = useState<number>(0);
  const [priceMethod, setPriceMethod] = useState<'weighted' | 'replace'>('weighted');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error('Quantidade Inválida', 'Informe uma quantidade por item maior que zero.');
      return;
    }

    onSave(
      type,
      amount,
      notes,
      supplierName,
      updatePrice,
      priceMethod,
      manualUnitPrice,
      packagePrice,
      freightValue
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
              <Package className="text-amber-600" size={24} />
              Movimentação de Estoque em Lote ({selectedItems.length} insumos selecionados)
            </h2>
            <p className="text-xs text-slate-500">
              Aplique a mesma entrada ou saída para todos os insumos selecionados de uma só vez.
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

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* List of Affected Items */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Insumos Selecionados ({selectedItems.length})
              </label>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-3 bg-slate-50 text-xs space-y-1.5 divide-y divide-slate-200/60 font-mono">
                {selectedItems.map((item) => (
                  <div key={item.id} className="pt-1.5 first:pt-0 flex justify-between items-center text-slate-700">
                    <span className="font-sans font-bold text-slate-900">{item.name}</span>
                    <span className="text-slate-500 text-[11px]">
                      Saldo: <strong>{item.quantity} {item.unit}</strong> • R$ {item.unitValue.toFixed(2)}/un
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operation Type */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Tipo de Movimentação *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('add')}
                  className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    type === 'add'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Entrada (+) para Todos
                </button>
                <button
                  type="button"
                  onClick={() => setType('subtract')}
                  className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    type === 'subtract'
                      ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Saída / Perda (-) para Todos
                </button>
              </div>
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantidade por Insumo *
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
                  Fornecedor / Oficina
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Nome do fornecedor"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Justificativa / Observações da Movimentação *
                </label>
                <input
                  type="text"
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
            <h4 className="font-serif font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Resumo da Operação em Lote</span>
              <Layers size={18} className="text-amber-600" />
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Insumos Afetados:</span>
                <span className="font-bold text-slate-900">{selectedItems.length} itens</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Operação por Item:</span>
                <span className={`font-mono font-bold ${type === 'add' ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {type === 'add' ? '+' : '-'}{amount} un/g
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
                Salvar Movimentação em Lote
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
