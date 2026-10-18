import React, { useState } from 'react';
import { InventoryItem, CalcMethod } from '../../types/erp';
import { 
  ArrowLeft, Edit3, Check, DollarSign, Package, AlertTriangle 
} from 'lucide-react';
import { Button } from '../ui';
import { toast } from '../Toast';

export interface InventoryEditScreenProps {
  item: InventoryItem;
  onBack: () => void;
  onSave: (id: string, updates: Partial<InventoryItem>) => void;
  categories: string[];
}

export const InventoryEditScreen: React.FC<InventoryEditScreenProps> = ({
  item,
  onBack,
  onSave,
  categories,
}) => {
  const [formData, setFormData] = useState({
    name: item.name,
    category: item.category,
    code: item.code,
    description: item.description || '',
    supplier: item.supplier || '',
    unit: item.unit,
    weightG: item.weightG || 0,
    quantity: item.quantity,
    minQuantity: item.minQuantity,
    unitValue: item.unitValue,
    calcMethod: item.calcMethod,
    notes: item.notes || '',
    status: item.status,
    imageUrl: item.imageUrl || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Validação", "Preencha o nome e o código do insumo.");
      return;
    }

    onSave(item.id, formData);
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
              <Edit3 className="text-amber-600" size={24} />
              Editar Insumo: {item.name}
            </h2>
            <p className="text-xs text-slate-500">
              Código SKU: <strong className="font-mono text-slate-700">{item.code}</strong> • Categoria: <strong className="text-slate-700">{item.category}</strong>
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
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <h3 className="font-serif font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              Dados Cadastrais do Insumo
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unidade de Medida
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:outline-none"
                >
                  <option value="unidade">Unidade (un)</option>
                  <option value="grama">Grama (g)</option>
                  <option value="metro">Metro (m)</option>
                  <option value="cm">Centímetro (cm)</option>
                  <option value="rolo">Rolo</option>
                  <option value="pacote">Pacote</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estoque Mínimo (Alerta Crítico)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status do Insumo
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:outline-none"
                >
                  <option value="active">Ativo no Catálogo</option>
                  <option value="inactive">Inativo / Pausado</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL da Foto do Insumo
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Histórico de Notas / Observações
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Values & Actions */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
            <h4 className="font-serif font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Custos & Saldo Físico</span>
              <DollarSign size={18} className="text-amber-600" />
            </h4>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custo Unitário de Compra (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    required
                    value={formData.unitValue}
                    onChange={(e) => setFormData({ ...formData, unitValue: Number(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Saldo Físico no Estoque ({formData.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Dica: Para entradas normais de fornecedores, use a página "Movimentar Saldo".
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Valor Patrimonial Total:</span>
                  <span className="font-mono font-bold text-slate-900">
                    R$ {(formData.quantity * formData.unitValue).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-2.5">
              <Button
                type="submit"
                size="lg"
                className="w-full justify-center"
                leftIcon={<Check size={18} className="text-amber-400" />}
              >
                Salvar Alterações
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
