import React, { useState, useMemo } from 'react';
import { InventoryItem, CalcMethod } from '../../types/erp';
import { 
  ArrowLeft, Package, Sparkles, Truck, Image as ImageIcon, 
  Check, X, DollarSign, Scale, Layers, ExternalLink, HelpCircle,
  Tag, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Button } from '../ui';
import { toast } from '../Toast';
import { PURCHASE_UNITS, STOCK_UNITS, CONSUMPTION_UNITS, calculateAcquisitionBreakdown, calculateComponentCostWithLoss } from '../../utils/units';

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
  // 1. Identificação
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Contas e Pérolas');
  const [code, setCode] = useState('INS-' + Math.floor(100 + Math.random() * 900));
  const [materialType, setMaterialType] = useState('ABS');
  const [dimensions, setDimensions] = useState('8 mm');
  const [supplier, setSupplier] = useState('');
  const [purchaseUrl, setPurchaseUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // 2. Três Unidades Independentes
  const [purchaseUnit, setPurchaseUnit] = useState('pacote');
  const [stockUnit, setStockUnit] = useState('unidade');
  const [consumptionUnit, setConsumptionUnit] = useState('unidade');

  // 3. Embalagem & Conversão
  const [packageQty, setPackageQty] = useState<number>(2000); // Exemplo prompt: 2.000 unidades
  const [packageWeightG, setPackageWeightG] = useState<number>(500); // Exemplo prompt: 500 g
  const [quantityOrigin, setQuantityOrigin] = useState<'estimado' | 'fornecedor' | 'conferido'>('estimado');
  const [conversionFactorOrigin, setConversionFactorOrigin] = useState<'estimado' | 'fornecedor' | 'conferido'>('fornecedor');

  // 4. Detalhamento Financeiro de Aquisição
  const [purchasePrice, setPurchasePrice] = useState<number>(50); // Exemplo prompt: R$ 50,00
  const [discountCost, setDiscountCost] = useState<number>(0);
  const [freightCost, setFreightCost] = useState<number>(0);
  const [taxCost, setTaxCost] = useState<number>(0);
  const [additionalExpenses, setAdditionalExpenses] = useState<number>(0);

  // 5. Gestão de Estoque
  const [initialQuantity, setInitialQuantity] = useState<number>(2000);
  const [minQuantity, setMinQuantity] = useState<number>(100);
  const [reorderPoint, setReorderPoint] = useState<number>(300);

  // Cálculo de Custeio Automático
  const breakdown = useMemo(() => {
    return calculateAcquisitionBreakdown({
      purchasePrice,
      freightCost,
      discountCost,
      taxCost,
      additionalExpenses,
      packageQty,
      packageWeightG,
      purchaseUnit,
      stockUnit,
      consumptionUnit
    });
  }, [
    purchasePrice,
    freightCost,
    discountCost,
    taxCost,
    additionalExpenses,
    packageQty,
    packageWeightG,
    purchaseUnit,
    stockUnit,
    consumptionUnit
  ]);

  // Simulação de Consumo: 30 unidades com 2% de perda
  const simulation = useMemo(() => {
    return calculateComponentCostWithLoss(30, breakdown.unitCost, 2);
  }, [breakdown.unitCost]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !code.trim()) {
      toast.error("Validação", "Informe o nome e o código do insumo.");
      return;
    }

    if (packageQty <= 0 && stockUnit === 'unidade') {
      toast.error("Validação", "A quantidade utilizável por embalagem deve ser superior a zero.");
      return;
    }

    const unitValue = breakdown.unitCost > 0 ? breakdown.unitCost : 0.01;
    const finalStockQty = Math.max(0, initialQuantity);

    const newItemPayload: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'> = {
      name: name.trim(),
      category,
      code: code.trim(),
      description: description.trim(),
      supplier: supplier.trim(),
      unit: stockUnit, // Unidade principal de saldo físico
      weightG: breakdown.weightPerUnitG,
      quantity: finalStockQty,
      minQuantity,
      reorderPoint,
      unitValue,
      averageCost: unitValue,
      calcMethod: (stockUnit === 'grama' || packageWeightG > 0) ? 'weight' : 'fixed',
      notes: notes.trim(),
      status,
      imageUrl: imageUrl.trim(),
      materialType: materialType.trim(),
      dimensions: dimensions.trim(),
      purchaseUrl: purchaseUrl.trim(),
      purchaseUnit,
      stockUnit,
      consumptionUnit,
      packageQty,
      packageWeightG,
      quantityOrigin,
      conversionFactor: packageQty > 0 ? packageQty : 1,
      conversionFactorOrigin,
      purchasePrice,
      freightCost,
      discountCost,
      taxCost,
      additionalExpenses,
      totalAcquisitionCost: breakdown.totalAcquisitionCost,
      reserved: 0,
      available: finalStockQty,
      movements: [
        {
          id: 'mov_init_' + Date.now(),
          date: new Date().toISOString(),
          type: 'entrada',
          amount: finalStockQty,
          balanceBefore: 0,
          balanceAfter: finalStockQty,
          unitValue,
          cost: Number((finalStockQty * unitValue).toFixed(2)),
          reason: `Cadastro inicial inteligente (${quantityOrigin}): Custo de aquisição R$ ${breakdown.totalAcquisitionCost.toFixed(2)}`,
          sourceType: 'compra',
          user: 'Almoxarife'
        }
      ]
    };

    onSave(newItemPayload);
  };

  return (
    <div className="space-y-6 pb-12 font-sans select-none animate-slide-in-up">
      {/* Header com Navegação */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-bold text-slate-500 hover:text-amber-800 transition-colors flex items-center gap-1.5 cursor-pointer mb-1"
            >
              <ArrowLeft size={14} />
              Voltar ao Almoxarifado
            </button>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="text-amber-600" size={24} />
              Novo Insumo Inteligente
            </h2>
            <p className="text-xs text-slate-500">
              Controle inteligente com 3 unidades independentes, custeio médio ponderado móvel e integração com composições.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            leftIcon={<ArrowLeft size={14} />}
          >
            Cancelar
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          
          {/* SEÇÃO 1: IDENTIFICAÇÃO DETALHADA */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <Tag size={18} className="text-amber-600" />
                1. Identificação do Insumo
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Etapa 1 de 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Matéria-Prima / Insumo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bola Lisa ABS 8 mm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-semibold focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Código SKU / Referência *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Metais e Entremeios">Metais e Entremeios</option>
                  <option value="Cruzes e Crucifixos">Cruzes e Crucifixos</option>
                  <option value="Cordões e Fios">Cordões e Fios</option>
                  <option value="Embalagens e Sacos">Embalagens e Sacos</option>
                  <option value="Cristais e Pedras">Cristais e Pedras</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Material
                </label>
                <input
                  type="text"
                  placeholder="Ex: ABS, Cristal, Metal Ouro Velho, Madeira"
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dimensões / Calibre
                </label>
                <input
                  type="text"
                  placeholder="Ex: 8 mm, 10 mm, 45x30 mm, 1.0 mm"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fornecedor
                </label>
                <input
                  type="text"
                  placeholder="Ex: Armarinho Santa Cecília, Shopee Oficial"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link de Compra (Shopee, Fornecedor ou Mercado Livre)
                </label>
                <input
                  type="url"
                  placeholder="https://shopee.com.br/produto/..."
                  value={purchaseUrl}
                  onChange={(e) => setPurchaseUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL da Fotografia do Insumo
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... ou URL da foto do produto"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição e Observações Técnicas
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhes sobre acabamento, durabilidade, banho ou cuidados na montagem"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: TRÊS UNIDADES INDEPENDENTES & CONVERSÕES */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <Layers size={18} className="text-amber-600" />
                2. Unidades de Medida e Conversões Inteligentes
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Etapa 2 de 4</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              O sistema adota 3 unidades independentes: como você <strong>compra</strong> no armarinho, como você <strong>controla o estoque</strong> físico e como você <strong>consome</strong> na ficha técnica do produto.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Unidade de Compra
                </label>
                <select
                  value={purchaseUnit}
                  onChange={(e) => setPurchaseUnit(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-amber-500 font-medium"
                >
                  {PURCHASE_UNITS.map((u) => (
                    <option key={u.id} value={u.id}>{u.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Unidade de Estoque
                </label>
                <select
                  value={stockUnit}
                  onChange={(e) => setStockUnit(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-amber-500 font-medium"
                >
                  {STOCK_UNITS.map((u) => (
                    <option key={u.id} value={u.id}>{u.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Unidade de Consumo (BOM)
                </label>
                <select
                  value={consumptionUnit}
                  onChange={(e) => setConsumptionUnit(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-amber-500 font-medium"
                >
                  {CONSUMPTION_UNITS.map((u) => (
                    <option key={u.id} value={u.id}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantidade p/ Embalagem ({stockUnit}) *
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  value={packageQty}
                  onChange={(e) => {
                    const q = parseFloat(e.target.value) || 0;
                    setPackageQty(q);
                    setInitialQuantity(q);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Peso da Embalagem (g)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Ex: 500"
                  value={packageWeightG}
                  onChange={(e) => setPackageWeightG(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Origem do Fator / Quantidade
                </label>
                <select
                  value={quantityOrigin}
                  onChange={(e) => setQuantityOrigin(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="estimado">Estimado pelo fornecedor</option>
                  <option value="fornecedor">Informação oficial da embalagem</option>
                  <option value="conferido">Conferido na bancada (pesagem/contagem)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: AQUISIÇÃO E FORMAÇÃO DE CUSTO */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <DollarSign size={18} className="text-amber-600" />
                3. Aquisição & Custeio (Fórmula Oficial)
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Etapa 3 de 4</span>
            </div>

            <p className="text-xs text-slate-500">
              Fórmula: <strong>Custo de Aquisição = Preço − Descontos + Frete + Tributos + Despesas</strong>. O custo unitário é dividido pela quantidade utilizável.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Preço do Lote *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Frete Rateado
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={freightCost}
                  onChange={(e) => setFreightCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Descontos (-)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountCost}
                  onChange={(e) => setDiscountCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tributos
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxCost}
                  onChange={(e) => setTaxCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Despesas Acessórias
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={additionalExpenses}
                  onChange={(e) => setAdditionalExpenses(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Resultado do Custeio em Tempo Real */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800 block">Custo Total de Aquisição Calculado</span>
                <span className="text-xl font-bold font-mono text-amber-950">
                  R$ {breakdown.totalAcquisitionCost.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-4 sm:border-l sm:border-amber-500/20 sm:pl-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Custo Unitário ({stockUnit})</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">
                    R$ {breakdown.unitCost.toFixed(4)}
                  </span>
                </div>
                {breakdown.costPerGram > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">Custo por Grama</span>
                    <span className="text-xl font-bold font-mono text-slate-800">
                      R$ {breakdown.costPerGram.toFixed(4)}/g
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: GESTÃO & NÍVEIS DE REPOSIÇÃO */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-600" />
                4. Gestão, Estoque Inicial e Reposição
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Etapa 4 de 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estoque Físico Inicial ({stockUnit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={initialQuantity}
                  onChange={(e) => setInitialQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estoque Mínimo de Segurança
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ponto de Reposição (Reorder Point)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA LATERAL: PREVIEW AO VIVO DA FICHA TÉCNICA */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5 sticky top-24">
            <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
              <span>Card de Ficha Técnica</span>
              <Sparkles size={16} className="text-amber-600" />
            </h4>

            {/* Preview da Fotografia */}
            <div className="w-full h-44 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name || 'Preview Insumo'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                  <ImageIcon size={28} />
                  <span className="text-[11px] font-medium">Insira uma URL de imagem para visualizar a peça</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                {category}
              </span>
              <h4 className="font-serif font-bold text-base text-slate-900 leading-snug">
                {name || 'Nome do Insumo'}
              </h4>
              <p className="text-[11px] text-slate-500 font-mono">
                SKU: {code} • {materialType} {dimensions ? `(${dimensions})` : ''}
              </p>
            </div>

            {/* Simulação em Destaque (Exemplo Prompt) */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Simulação de Consumo no Terço
              </span>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Consumo de 30 peças:</span>
                <strong className="font-mono text-slate-900">R$ {simulation.baseCost.toFixed(3)}</strong>
              </div>
              <div className="flex justify-between items-center text-amber-800">
                <span>Com perda técnica de 2%:</span>
                <strong className="font-mono">R$ {simulation.costWithLoss.toFixed(3)}</strong>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-emerald-800 font-bold">
                <span>Custo Unitário Calculado:</span>
                <span className="font-mono">R$ {breakdown.unitCost.toFixed(4)}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                className="w-full justify-center"
                leftIcon={<Check size={16} />}
              >
                Gravar Matéria-Prima no Estoque
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
