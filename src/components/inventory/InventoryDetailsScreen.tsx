import React, { useState } from 'react';
import { InventoryItem, InventoryMovement } from '../../types/erp';
import { 
  ArrowLeft, BarChart2, Package, ArrowUpDown, Edit3, DollarSign, 
  Activity, Clock, User, Calendar, TrendingUp, TrendingDown, Layers, FileText,
  ExternalLink, CheckCircle2, AlertTriangle, ShieldCheck, ShoppingBag, Scale,
  Sparkles, Check, RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Button, Badge } from '../ui';
import { toast } from '../Toast';
import { calculateComponentCostWithLoss } from '../../utils/units';

export interface InventoryDetailsScreenProps {
  item: InventoryItem;
  itemDetailsData: {
    movements: InventoryMovement[];
    relatedProducts: any[];
    ordersConsuming: any[];
    quotesReserving: any[];
    stats: {
      totalPurchased: number;
      totalConsumed: number;
      totalReserved: number;
      totalSpent: number;
      averageCost: number;
      turnoverRatio: number;
      daysRemaining: number;
    };
  };
  onBack: () => void;
  onOpenAdjust: (item: InventoryItem) => void;
  onOpenEdit: (item: InventoryItem) => void;
  onSaveConference?: (itemId: string, countedQty: number, notes: string) => void;
}

export const InventoryDetailsScreen: React.FC<InventoryDetailsScreenProps> = ({
  item,
  itemDetailsData,
  onBack,
  onOpenAdjust,
  onOpenEdit,
  onSaveConference,
}) => {
  const [detailsTab, setDetailsTab] = useState<'summary' | 'reservations' | 'history' | 'charts'>('summary');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');
  
  // Conferência Física de Lote
  const [showConferenceModal, setShowConferenceModal] = useState(false);
  const [conferenceCountedQty, setConferenceCountedQty] = useState<number>(item.packageQty || item.quantity || 100);
  const [conferenceNotes, setConferenceNotes] = useState('');

  const { movements = [], relatedProducts = [], ordersConsuming = [], quotesReserving = [], stats } = itemDetailsData || {};

  // Filter movements by period
  const safeMovements = Array.isArray(movements) ? movements : [];
  const filteredMovements = safeMovements.filter((m) => {
    if (periodFilter === 'all') return true;
    const moveDate = new Date(m.date);
    const now = new Date();
    if (periodFilter === 'week') {
      const diff = (now.getTime() - moveDate.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }
    if (periodFilter === 'month') {
      const diff = (now.getTime() - moveDate.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    }
    if (periodFilter === 'year') {
      const diff = (now.getTime() - moveDate.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 365;
    }
    return true;
  });

  const physicalStock = item.quantity || 0;
  const reservedStock = item.reserved || 0;
  const availableStock = Math.max(0, physicalStock - reservedStock);
  const averageCost = item.averageCost || item.unitValue || 0;

  // Simulação de Consumo de Exemplo (Bola Lisa ABS 8mm do prompt)
  const simulationLoss = calculateComponentCostWithLoss(30, averageCost, 2);

  const handleExecuteConference = () => {
    if (conferenceCountedQty <= 0) {
      toast.error("Validação", "A quantidade conferida deve ser maior que zero.");
      return;
    }

    if (onSaveConference) {
      onSaveConference(item.id, conferenceCountedQty, conferenceNotes || 'Conferência física de insumo');
    } else {
      toast.success("Conferência Registrada", `Quantidade de ${conferenceCountedQty} ${item.unit} registrada com sucesso.`);
    }

    setShowConferenceModal(false);
  };

  return (
    <div className="space-y-6 pb-12 font-sans select-none animate-slide-in-up">
      {/* Header com Navegação e Ações Rápidas */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package size={28} className="text-slate-300" />
              )}
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={onBack}
                className="text-xs font-bold text-slate-500 hover:text-amber-800 transition-colors flex items-center gap-1.5 cursor-pointer mb-1"
              >
                <ArrowLeft size={14} />
                Voltar ao Almoxarifado
              </button>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
                  {item.name}
                </h2>
                <Badge variant="neutral" size="sm">
                  CÓD: {item.code}
                </Badge>
                <Badge variant="warning" size="sm">
                  {item.category}
                </Badge>
                {item.materialType && (
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    Material: {item.materialType}
                  </span>
                )}
                {item.dimensions && (
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    Dimensões: {item.dimensions}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Fornecedor: <strong className="text-slate-700">{item.supplier || 'Não informado'}</strong> • Unidade de Estoque: <strong className="text-slate-700">{item.stockUnit || item.unit}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConferenceModal(true)}
              leftIcon={<Scale size={14} className="text-indigo-600" />}
            >
              Conferência Física
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenAdjust(item)}
              leftIcon={<ArrowUpDown size={14} className="text-amber-600" />}
            >
              Movimentar Saldo
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenEdit(item)}
              leftIcon={<Edit3 size={14} className="text-amber-400" />}
            >
              Editar Ficha
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip: Estoque Físico, Reservado e Saldo Disponível */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estoque Físico */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Estoque Físico Real</span>
            <Package size={14} className="text-slate-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
            {physicalStock} <span className="text-sm font-sans font-normal text-slate-500">{item.unit}</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Contado fisicamente na bancada
          </span>
        </div>

        {/* Quantidade Reservada */}
        <div className="bg-white border border-amber-200/80 bg-amber-50/20 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Quantidade Reservada</span>
            <Clock size={14} className="text-amber-600" />
          </div>
          <span className="text-2xl font-bold font-mono text-amber-900 mt-1 block">
            {reservedStock} <span className="text-sm font-sans font-normal text-amber-700">{item.unit}</span>
          </span>
          <span className="text-[10px] text-amber-700 mt-0.5 block font-medium">
            {quotesReserving.length} orçamentos ativos vinculados
          </span>
        </div>

        {/* Saldo Disponível */}
        <div className="bg-white border border-emerald-200/80 bg-emerald-50/20 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Saldo Disponível</span>
            <CheckCircle2 size={14} className="text-emerald-600" />
          </div>
          <span className="text-2xl font-bold font-mono text-emerald-900 mt-1 block">
            {availableStock} <span className="text-sm font-sans font-normal text-emerald-700">{item.unit}</span>
          </span>
          <span className="text-[10px] text-emerald-700 mt-0.5 block font-medium">
            Livre para novas vendas e propostas
          </span>
        </div>

        {/* Custo Médio & Patrimônio */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Custo Médio Ponderado</span>
            <DollarSign size={14} className="text-slate-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
            R$ {averageCost.toFixed(4)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
            Patrimônio: R$ {(physicalStock * averageCost).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Navegação por Abas com Estilo Sem Pílulas */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-150 bg-slate-50/50 px-6 gap-2 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setDetailsTab('summary')}
            className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              detailsTab === 'summary'
                ? 'border-amber-600 text-amber-900 font-extrabold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity size={14} />
            1. Ficha Técnica & Unidades
          </button>
          <button
            onClick={() => setDetailsTab('reservations')}
            className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              detailsTab === 'reservations'
                ? 'border-amber-600 text-amber-900 font-extrabold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock size={14} />
            2. Vínculos & Reservas ({quotesReserving.length + ordersConsuming.length})
          </button>
          <button
            onClick={() => setDetailsTab('history')}
            className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              detailsTab === 'history'
                ? 'border-amber-600 text-amber-900 font-extrabold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={14} />
            3. Histórico de Movimentações ({safeMovements.length})
          </button>
          <button
            onClick={() => setDetailsTab('charts')}
            className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              detailsTab === 'charts'
                ? 'border-amber-600 text-amber-900 font-extrabold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart2 size={14} />
            4. Curva de Estoque
          </button>
        </div>

        <div className="p-6">
          {/* ABA 1: FICHA TÉCNICA, UNIDADES E CUSTEIO */}
          {detailsTab === 'summary' && (
            <div className="space-y-6">
              {/* Grid 3 Unidades Independentes */}
              <div className="bg-slate-50 border border-slate-200/70 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Layers size={16} className="text-amber-600" />
                    Três Unidades de Medida Independentes & Fator de Conversão
                  </h4>
                  <span className="text-[11px] text-slate-500">Origem: <strong className="text-slate-700">{item.conversionFactorOrigin || item.quantityOrigin || 'conferido'}</strong></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">1. Unidade de Compra</span>
                    <span className="text-base font-bold text-slate-900 font-mono block">
                      {item.purchaseUnit || 'Pacote (pct)'}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {item.packageQty ? `${item.packageQty} peças por embalagem` : 'Embalagem de aquisição'}
                    </span>
                    {item.packageWeightG ? (
                      <span className="text-[11px] text-slate-400 block font-mono">
                        Peso bruto: {item.packageWeightG} g
                      </span>
                    ) : null}
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">2. Unidade de Estoque</span>
                    <span className="text-base font-bold text-slate-900 font-mono block">
                      {item.stockUnit || item.unit || 'Unidade (unid)'}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Saldo físico: {physicalStock} {item.unit}
                    </span>
                    <span className="text-[11px] text-emerald-700 block font-medium">
                      Saldo disponível: {availableStock} {item.unit}
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">3. Unidade de Consumo</span>
                    <span className="text-base font-bold text-slate-900 font-mono block">
                      {item.consumptionUnit || item.unit || 'Unidade (unid)'}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Utilizada na composição do produto (BOM)
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      Custo unitário: R$ {averageCost.toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Exemplo de Cálculo com Perdas */}
                <div className="bg-white p-4 rounded-xl border border-amber-200/70 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-600" />
                      Simulação Prática de Consumo (Fórmulas do ERP)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Exemplo com perda de 2%</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Consumo Base (30 unid)</span>
                      <strong className="text-slate-800 font-mono">R$ {simulationLoss.baseCost.toFixed(3)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Perda Prevista (2%)</span>
                      <strong className="text-amber-700 font-mono">+R$ {(simulationLoss.costWithLoss - simulationLoss.baseCost).toFixed(3)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Custo c/ Perda</span>
                      <strong className="text-emerald-700 font-mono">R$ {simulationLoss.costWithLoss.toFixed(3)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Custo p/ Peça Estimada</span>
                      <strong className="text-slate-900 font-mono">R$ {averageCost.toFixed(4)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações de Aquisição & Fornecedor */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50 border border-slate-200/70 p-5 rounded-2xl space-y-3 text-xs">
                  <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center justify-between">
                    <span>Parâmetros de Compra & Fornecedor</span>
                    <ShoppingBag size={16} className="text-amber-600" />
                  </h4>

                  <div className="space-y-2 pt-1 divide-y divide-slate-200/50">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Fornecedor Principal:</span>
                      <strong className="text-slate-800">{item.supplier || 'Não informado'}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Link de Compra / Fornecedor:</span>
                      {item.purchaseUrl ? (
                        <a
                          href={item.purchaseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 underline"
                        >
                          <span>Abrir Loja / Shopee</span>
                          <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Não vinculado</span>
                      )}
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Preço de Aquisição Informado:</span>
                      <strong className="text-slate-800 font-mono">R$ {(item.purchasePrice || 0).toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Frete / Tributos Rateados:</span>
                      <strong className="text-slate-800 font-mono">R$ {((item.freightCost || 0) + (item.taxCost || 0)).toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Estoque Mínimo de Segurança:</span>
                      <strong className="text-amber-700 font-mono">{item.minQuantity} {item.unit}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Ponto de Reposição Sugerido:</span>
                      <strong className="text-indigo-700 font-mono">{item.reorderPoint || item.minQuantity * 1.5} {item.unit}</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/70 p-5 rounded-2xl space-y-3 text-xs">
                  <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center justify-between">
                    <span>Identificação e Observações</span>
                    <ShieldCheck size={16} className="text-amber-600" />
                  </h4>

                  <div className="space-y-2 pt-1 divide-y divide-slate-200/50">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Código SKU:</span>
                      <strong className="text-slate-800 font-mono">{item.code}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Categoria:</span>
                      <strong className="text-slate-800">{item.category}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Material / Acabamento:</span>
                      <strong className="text-slate-800">{item.materialType || 'Padrão'}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Dimensões / Calibre:</span>
                      <strong className="text-slate-800">{item.dimensions || 'N/A'}</strong>
                    </div>
                    <div className="py-1">
                      <span className="text-slate-500 block mb-0.5">Descrição / Observações Técnicas:</span>
                      <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/70 text-[11px] leading-relaxed">
                        {item.description || item.notes || 'Nenhuma observação técnica adicional cadastrada para este insumo.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: VÍNCULOS & RESERVAS (ORÇAMENTOS E PEDIDOS) */}
          {detailsTab === 'reservations' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orçamentos que estão Reservando */}
                <div className="bg-slate-50 border border-slate-200/70 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Clock size={16} className="text-amber-600" />
                      Orçamentos em Aberto (Reservas Ativas)
                    </h4>
                    <span className="text-xs font-mono font-bold text-amber-800">
                      Total: {reservedStock} {item.unit}
                    </span>
                  </div>

                  {quotesReserving.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs italic">
                      Não há reservas pendentes vinculadas a orçamentos abertos no momento.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {quotesReserving.map((q) => (
                        <div key={q.id} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900 font-mono">{q.quoteNumber}</span>
                            <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              {q.reservedQty} {item.unit}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">Cliente: <strong>{q.clientName}</strong></p>
                          <p className="text-[10px] text-slate-400 italic">{q.productsLabel}</p>
                          <div className="text-[9.5px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                            <span>Status: Em Proposta Comercial</span>
                            <span className="text-amber-700 font-medium">Libera se cancelado/rejeitado</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pedidos de Venda que Consumiram */}
                <div className="bg-slate-50 border border-slate-200/70 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Activity size={16} className="text-emerald-600" />
                      Pedidos de Venda (Consumo Efetivo)
                    </h4>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {ordersConsuming.length} pedidos
                    </span>
                  </div>

                  {ordersConsuming.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs italic">
                      Nenhum pedido de venda consumiu este insumo até o momento.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {ordersConsuming.map((o) => (
                        <div key={o.id} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900 font-mono">Pedido #{o.orderNumber}</span>
                            <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              -{o.consumedQty} {item.unit}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">Cliente: <strong>{o.clientName}</strong></p>
                          <p className="text-[10px] text-slate-400 italic">{o.productsLabel}</p>
                          <div className="text-[9.5px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                            <span>Data: {o.date}</span>
                            <span className="text-slate-600 font-mono">Status: {o.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Produtos do Catálogo que Usam na Ficha Técnica (BOM) */}
              <div className="bg-slate-50 border border-slate-200/70 p-5 rounded-2xl space-y-3">
                <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Layers size={16} className="text-amber-600" />
                  Receitas de Produtos (BOM) que Consomem este Insumo
                </h4>

                {relatedProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    Este insumo ainda não faz parte de nenhuma receita cadastrada em "Produtos & Composição".
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    {relatedProducts.map((p) => {
                      const comp = p.composition?.find((c: any) => c.materialId === item.id);
                      const unitQty = comp ? comp.quantity : 1;
                      const maxUnitsCanMake = Math.floor(availableStock / Math.max(0.001, unitQty));

                      return (
                        <div key={p.id} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1.5 text-xs">
                          <span className="font-bold text-slate-900 block truncate">{p.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono block">SKU: {p.sku}</span>
                          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">Consumo por Peça:</span>
                            <span className="font-mono font-bold text-amber-800">
                              {unitQty} {item.unit}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-emerald-700 font-medium">
                            <span>Capacidade com saldo disponível:</span>
                            <strong className="font-mono">{maxUnitsCanMake} peças</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 3: HISTÓRICO DE MOVIMENTAÇÕES & AUDITORIA */}
          {detailsTab === 'history' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Filtrar Histórico de Movimentações</h4>
                  <p className="text-[11px] text-slate-500">Entradas, saídas, baixas de pedidos, reservas e conferências físicas</p>
                </div>
                <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                  {(['all', 'week', 'month', 'year'] as const).map((filterId) => (
                    <button
                      key={filterId}
                      onClick={() => setPeriodFilter(filterId)}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        periodFilter === filterId
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {filterId === 'all' ? 'Tudo' : filterId === 'week' ? 'Semana' : filterId === 'month' ? 'Mês' : 'Ano'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                <div className="flex justify-between items-center px-4 py-2.5 bg-slate-100/70 font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                  <span className="w-1/4">Data & Operação</span>
                  <span className="w-1/3">Motivo / Origem</span>
                  <span className="w-1/6 text-right">Quantidade</span>
                  <span className="w-1/4 text-right">Saldo Resultante</span>
                </div>

                {filteredMovements.map((m, idx) => (
                  <div key={m.id || idx} className="flex justify-between items-center px-4 py-3 text-slate-800 font-medium hover:bg-slate-50 transition-colors">
                    <div className="w-1/4">
                      <span className="font-bold text-slate-900 block capitalize">{m.type}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(m.date).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="w-1/3 pr-2">
                      <span className="text-slate-700 block truncate">{m.reason || 'Movimentação operacional'}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Por: {m.user || 'Sistema'}
                      </span>
                    </div>
                    <div className="w-1/6 text-right">
                      <span className={`font-mono font-bold ${m.type === 'saida' || m.type === 'perda' ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {m.type === 'saida' || m.type === 'perda' ? '-' : '+'}{m.amount} {item.unit}
                      </span>
                      {m.unitValue ? (
                        <span className="text-[10px] text-slate-400 font-mono block">
                          R$ {m.unitValue.toFixed(4)}
                        </span>
                      ) : null}
                    </div>
                    <div className="w-1/4 text-right">
                      <span className="font-mono font-bold text-slate-900 block">
                        {m.balanceAfter ?? physicalStock} {item.unit}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Antes: {m.balanceBefore ?? physicalStock} {item.unit}
                      </span>
                    </div>
                  </div>
                ))}

                {filteredMovements.length === 0 && (
                  <div className="py-8 text-center text-slate-400">
                    Nenhuma movimentação registrada no período selecionado.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 4: CURVA DE ESTOQUE */}
          {detailsTab === 'charts' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/70">
                <h4 className="font-serif font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                  <BarChart2 size={16} className="text-amber-600" />
                  Evolução do Saldo Físico em Estoque
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={safeMovements.map((m) => ({
                        date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                        saldo: m.balanceAfter ?? physicalStock,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip />
                      <Area type="monotone" dataKey="saldo" stroke="#d97706" fill="#fef3c7" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CONFERÊNCIA FÍSICA DE LOTE */}
      {showConferenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="text-indigo-600" size={20} />
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  Conferência Física de Insumo
                </h3>
              </div>
              <button
                onClick={() => setShowConferenceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Permite corrigir o saldo ou o número real de peças da embalagem após contagem/pesagem na bancada.
              O custo médio unitário é recalculado automaticamente preservando todo o histórico de auditoria.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Quantidade Contada / Conferida ({item.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={conferenceCountedQty}
                  onChange={(e) => setConferenceCountedQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Saldo físico registrado atualmente: <strong>{physicalStock} {item.unit}</strong>
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observações da Conferência
                </label>
                <input
                  type="text"
                  placeholder="Ex: Contagem física por pesagem de amostragem de 10 peças"
                  value={conferenceNotes}
                  onChange={(e) => setConferenceNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="bg-indigo-50/60 border border-indigo-200/70 p-3.5 rounded-xl text-[11px] text-indigo-900 space-y-1">
                <span className="font-bold block">Impacto da Conferência:</span>
                <p>
                  Diferença apurada: <strong>{Number((conferenceCountedQty - physicalStock).toFixed(2))} {item.unit}</strong>.
                  O saldo físico será atualizado e um lançamento de tipo <em>'conferencia'</em> será gravado.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConferenceModal(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteConference}
                leftIcon={<Check size={14} />}
              >
                Confirmar Conferência
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
