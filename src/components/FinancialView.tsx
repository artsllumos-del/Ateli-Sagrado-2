import React, { useState, useRef } from 'react';
import { useDb } from '../context/DbContext';
import { FinancialTransaction, TransactionType } from '../types/erp';
import { 
  TrendingUp, TrendingDown, DollarSign, Plus, Search, Trash2, X, Filter,
  ArrowUpRight, ArrowDownRight, CreditCard, Calendar, BarChart3, Wallet, AlertTriangle,
  FileText, Scan, UploadCloud, Sparkles, RefreshCw, CheckCircle, HelpCircle, Info,
  Layers, Hammer, Briefcase, ShoppingBag, Percent, Sliders, Play, Settings, RefreshCcw, Check, CheckCircle2, ChevronDown, ChevronUp, Link2
} from 'lucide-react';
import { toast } from './Toast';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'bank_slip';
type ActiveTab = 'dashboard' | 'simulator' | 'reconciliation';

export const FinancialView: React.FC = () => {
  const { 
    transactions, 
    addTransaction, 
    deleteTransaction, 
    updateTransaction,
    scanReceipt, 
    importFinancialFile,
    orders,
    quotes,
    inventory,
    products,
    productionTasks,
    settings,
    clients
  } = useDb();

  // Active view tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Component States
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; description: string; amount: number } | null>(null);

  // Advanced Panel Toggles
  const [showImportZone, setShowImportZone] = useState(false);
  const [showScanZone, setShowScanZone] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Expanded Traceability Panels
  const [expandedSection, setExpandedSection] = useState<'revenues' | 'materials' | 'labor' | 'purchases' | 'quotes' | null>(null);

  // Bank Reconciliation States
  const [linkingTransaction, setLinkingTransaction] = useState<FinancialTransaction | null>(null);
  const [reconcileFilter, setReconcileFilter] = useState<'all' | 'unreconciled' | 'reconciled'>('unreconciled');

  // Interactive Simulator parameters
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0); // -30% to +50%
  const [materialCostAdjustment, setMaterialCostAdjustment] = useState<number>(0); // -20% to +100%
  const [laborProductivity, setLaborProductivity] = useState<number>(0); // 0% to 50% (reduction in manufacturing time)
  const [quoteConversionRate, setQuoteConversionRate] = useState<number>(50); // 0% to 100%

  // Manual Form states
  const [type, setType] = useState<TransactionType>('income');
  const [category, setCategory] = useState('Venda de Terço');
  const [contactName, setContactName] = useState(''); // client or supplier
  const [value, setValue] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [notes, setNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------
  // REAL-TIME OPERATIONAL EVENT DATA DERIVATIONS
  // ----------------------------------------------------

  // 1. Revenues from Sales Orders (Pedidos de Venda)
  const activeOrders = orders.filter(o => !o.isDeleted && !o.isCancelled);
  const completedOrders = activeOrders.filter(o => o.status === 'completed');
  const pendingOrders = activeOrders.filter(o => o.status !== 'completed');

  const realizedRevenue = completedOrders.reduce((sum, o) => sum + o.totalValue, 0);
  const pendingRevenue = pendingOrders.reduce((sum, o) => sum + o.totalValue, 0);
  const totalOperationalRevenue = realizedRevenue + pendingRevenue;

  // Helper to calculate the raw material replacement cost of a product composition
  const getProductMaterialCost = (product: any) => {
    if (!product || !product.composition) return 0;
    return product.composition.reduce((acc: number, comp: any) => {
      const mat = inventory.find((m: any) => m.id === comp.materialId);
      const unitVal = mat ? mat.unitValue : (comp.cost / comp.quantity || 0);
      return acc + (comp.quantity * unitVal);
    }, 0);
  };

  // 2. Direct Materials Cost (Custo das Mercadorias Vendidas - Insumos)
  const completedDirectMaterialCost = completedOrders.reduce((sum, o) => {
    return sum + o.items.reduce((orderSum, item) => {
      const prod = products.find(p => p.id === item.productId);
      const matCost = getProductMaterialCost(prod);
      return orderSum + (matCost * item.quantity);
    }, 0);
  }, 0);

  const pendingDirectMaterialCost = pendingOrders.reduce((sum, o) => {
    return sum + o.items.reduce((orderSum, item) => {
      const prod = products.find(p => p.id === item.productId);
      const matCost = getProductMaterialCost(prod);
      return orderSum + (matCost * item.quantity);
    }, 0);
  }, 0);

  // 3. Direct Labor Cost (Horas com base no motor de precificação e vendas efetivamente feitas)
  // Sum of minutes spent based on product composition production times and active sales orders
  const totalMinutesSpent = activeOrders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => {
      const prod = products.find(p => p.id === item.productId || p.sku === item.productId);
      const prodTime = prod ? (prod.productionTimeMin || 0) : 0;
      return itemSum + (item.quantity * prodTime);
    }, 0);
  }, 0);
  const hourlyRate = settings?.laborHourlyRate || 25;
  const realLaborCost = totalMinutesSpent * (hourlyRate / 60);

  // 4. Indirect Costs applied to completed products
  const completedIndirectCost = completedOrders.reduce((sum, o) => {
    return sum + o.items.reduce((itemSum, item) => itemSum + ((settings?.indirectCosts || 10) * item.quantity), 0);
  }, 0);

  const pendingIndirectCost = pendingOrders.reduce((sum, o) => {
    return sum + o.items.reduce((itemSum, item) => itemSum + ((settings?.indirectCosts || 10) * item.quantity), 0);
  }, 0);

  // Consolidated operational expenses (CMV + Labor + Indirects)
  const totalRealizedOperationalCosts = completedDirectMaterialCost + realLaborCost + completedIndirectCost;
  const totalPendingOperationalCosts = pendingDirectMaterialCost + pendingIndirectCost;

  // 5. Total Stock asset valuation (Valor Patrimonial de Estoque)
  const totalStockAssetValuation = inventory
    .filter(item => !item.isDeleted && item.status === 'active')
    .reduce((sum, item) => sum + (item.quantity * item.unitValue), 0);

  // 6. Direct Stock Purchases and general administrative expenditures
  const activeTransactions = transactions.filter(t => !t.isDeleted);
  
  const totalRevenuesBookkeeping = activeTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.value, 0);
  const totalExpensesBookkeeping = activeTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.value, 0);

  const stockPurchaseExpenses = activeTransactions
    .filter(t => t.type === 'expense' && (t.category.toLowerCase().includes('compra') || t.category.toLowerCase().includes('insumo')))
    .reduce((sum, t) => sum + t.value, 0);

  const generalExpenses = activeTransactions
    .filter(t => t.type === 'expense' && !(t.category.toLowerCase().includes('compra') || t.category.toLowerCase().includes('insumo')))
    .reduce((sum, t) => sum + t.value, 0);

  // Net realized operating profit
  const realizedOperatingNetProfit = realizedRevenue - totalRealizedOperationalCosts;

  // 7. Quotes pipeline potential revenue
  const activeQuotes = quotes.filter(q => !q.isDeleted && q.status !== 'rejected' && q.status !== 'converted');
  const quotesPipelineValue = activeQuotes.reduce((sum, q) => sum + q.total, 0);

  // ----------------------------------------------------
  // INTERACTIVE WHAT-IF SIMULATIONS MATH
  // ----------------------------------------------------
  const simulatedRealizedRevenue = realizedRevenue * (1 + priceAdjustment / 100);
  const simulatedPendingRevenue = pendingRevenue * (1 + priceAdjustment / 100);
  const simulatedQuotesRevenue = quotesPipelineValue * (quoteConversionRate / 100) * (1 + priceAdjustment / 100);
  const simulatedTotalRevenue = simulatedRealizedRevenue + simulatedPendingRevenue + simulatedQuotesRevenue;

  const simulatedMaterialCost = (completedDirectMaterialCost + pendingDirectMaterialCost) * (1 + materialCostAdjustment / 100);
  const simulatedLaborCost = realLaborCost * (1 - laborProductivity / 100);
  const simulatedIndirectCost = completedIndirectCost + pendingIndirectCost;
  const simulatedTotalOperationalCosts = simulatedMaterialCost + simulatedLaborCost + simulatedIndirectCost;

  const simulatedNetProfit = simulatedTotalRevenue - simulatedTotalOperationalCosts;
  const currentTotalOperationalRevenue = totalOperationalRevenue + (quotesPipelineValue * 0.5); // Baseline has 50% quotes conversion
  const currentTotalCosts = totalRealizedOperationalCosts + totalPendingOperationalCosts;
  const currentNetProfit = currentTotalOperationalRevenue - currentTotalCosts;

  // Filter Bookkeeping Transactions list
  const filteredTransactions = activeTransactions.filter(t => {
    const matchesSearch = t.category.toLowerCase().includes(search.toLowerCase()) || 
    (t.contactName && t.contactName.toLowerCase().includes(search.toLowerCase())) ||
    (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesType = selectedType === 'all' || t.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Reconciled count
  const reconciledCount = activeTransactions.filter(t => t.reconciled).length;
  const unreconciledCount = activeTransactions.filter(t => !t.reconciled).length;

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------

  const handleOpenAdd = () => {
    setType('income');
    setCategory('Venda de Terço');
    setContactName('');
    setValue(0);
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('pix');
    setNotes('');
    setShowAddModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !contactName || value <= 0) {
      toast.error("Validação", "Preencha todos os dados obrigatórios.");
      return;
    }

    addTransaction({
      type,
      category,
      contactName,
      value,
      date,
      paymentMethod,
      notes
    });

    toast.success("Lançamento Registrado!", `Movimentação de R$ ${value.toFixed(2)} lançada com sucesso.`);
    setShowAddModal(false);
  };

  const handleDelete = (id: string, description: string, amount: number) => {
    setDeleteConfirm({ id, description, amount });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    deleteTransaction(deleteConfirm.id);
    toast.warning("Lançamento excluído", `O lançamento "${deleteConfirm.description}" foi arquivado.`);
    setDeleteConfirm(null);
  };

  // DRAG & DROP FOR EXTRACTS
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processExtractFile = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'ofx', 'xlsx'].includes(extension || '')) {
      toast.error("Formato Inválido", "Por favor envie arquivos .CSV, .OFX ou .XLSX");
      return;
    }

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const res = await importFinancialFile(extension as any, text);
        if (res.success) {
          toast.success("Extrato Importado!", `${res.count} lançamentos bancários carregados para conciliação.`);
          setShowImportZone(false);
        } else {
          toast.error("Erro na Importação", res.error || "Formato de extrato desconhecido.");
        }
        setIsImporting(false);
      };
      reader.readAsText(file);
    } catch (err: any) {
      toast.error("Falha", err.message);
      setIsImporting(false);
    }
  };

  const handleExtractDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processExtractFile(e.dataTransfer.files[0]);
    }
  };

  const handleExtractSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processExtractFile(e.target.files[0]);
    }
  };

  // AI OCR RECEIPT SCANNER HANDLER
  const processOcrFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Formato de Imagem Inválido", "Envie fotos de recibo em formato JPG, PNG ou WEBP.");
      return;
    }

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const res = await scanReceipt(base64String);
        if (res.success && res.data) {
          toast.success("Análise de IA Concluída!", "Recibo escaneado com sucesso. Verifique os dados.");
          
          setType('expense');
          setCategory(res.data.category || 'Compra de Insumos');
          setContactName(res.data.vendorName || 'Fornecedor Reconciliado');
          setValue(Number(res.data.totalAmount) || 0);
          setDate(res.data.date || new Date().toISOString().split('T')[0]);
          setPaymentMethod('pix');
          setNotes(`Importado por IA OCR. Itens: ${res.data.items?.map((it: any) => `${it.qty}x ${it.desc}`).join(', ') || 'Sem especificações'}`);
          
          setShowScanZone(false);
          setShowAddModal(true);
        } else {
          toast.error("Erro OCR", res.error || "Não foi possível extrair dados legíveis da imagem.");
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error("Falha na Leitura", err.message);
      setIsScanning(false);
    }
  };

  const handleOcrDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processOcrFile(e.dataTransfer.files[0]);
    }
  };

  const handleOcrSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processOcrFile(e.target.files[0]);
    }
  };

  // Reconcile automated engine
  const handleAutoReconcile = () => {
    let matchesCount = 0;
    
    // Loop through unreconciled transactions
    transactions.forEach(t => {
      if (t.isDeleted || t.reconciled) return;

      if (t.type === 'income') {
        // Try matching with an order of similar value (difference <= R$2) and date (within 10 days)
        const matchedOrder = orders.find(o => 
          !o.isDeleted && 
          Math.abs(o.totalValue - t.value) <= 2 &&
          Math.abs(new Date(o.date).getTime() - new Date(t.date).getTime()) <= 10 * 24 * 60 * 60 * 1000
        );

        if (matchedOrder) {
          updateTransaction(t.id, {
            reconciled: true,
            reconciledToId: matchedOrder.id,
            reconciledToType: 'order',
            reconciledToNumber: matchedOrder.orderNumber,
            notes: `${t.notes || ''} [Conciliado IA com ${matchedOrder.orderNumber}]`.trim()
          });
          matchesCount++;
        }
      } else {
        // Try matching with inventory stock expense
        // For example, finding inventory item with supplier matching transaction contactName or categories
        const matchedItem = inventory.find(i => 
          !i.isDeleted && 
          (i.supplier && t.contactName && i.supplier.toLowerCase().includes(t.contactName.toLowerCase()))
        );

        if (matchedItem) {
          updateTransaction(t.id, {
            reconciled: true,
            reconciledToId: matchedItem.id,
            reconciledToType: 'purchase',
            reconciledToNumber: matchedItem.code,
            notes: `${t.notes || ''} [Conciliado IA com insumo ${matchedItem.name}]`.trim()
          });
          matchesCount++;
        }
      }
    });

    if (matchesCount > 0) {
      toast.success("Conciliação IA Concluída!", `${matchesCount} transações bancárias conciliadas automaticamente por proximidade.`);
    } else {
      toast.info("Processamento Realizado", "Nenhuma correspondência óbvia encontrada para auto-conciliação neste momento.");
    }
  };

  // Reconcile manual match
  const handleManualMatch = (transaction: FinancialTransaction, targetType: 'order' | 'purchase', targetId: string, label: string) => {
    updateTransaction(transaction.id, {
      reconciled: true,
      reconciledToId: targetId,
      reconciledToType: targetType,
      reconciledToNumber: label,
      notes: `${transaction.notes || ''} [Conciliado com ${label}]`.trim()
    });
    setLinkingTransaction(null);
    toast.success("Operação Conciliada!", `Transação bancária vinculada com sucesso a ${label}.`);
  };

  const handleUnlink = (id: string, label?: string) => {
    updateTransaction(id, {
      reconciled: false,
      reconciledToId: undefined,
      reconciledToType: undefined,
      reconciledToNumber: undefined
    });
    toast.info("Vínculo Desfeito", `A transação ${label ? `de ${label}` : ''} foi desconectada.`);
  };

  // Assembly Chart Data
  const chartData = [
    { name: 'Jan', Receitas: 12400, Despesas: 5200, Lucro: 7200 },
    { name: 'Fev', Receitas: 15100, Despesas: 6100, Lucro: 9000 },
    { name: 'Mar', Receitas: 18900, Despesas: 7300, Lucro: 11600 },
    { name: 'Abr', Receitas: 21500, Despesas: 8200, Lucro: 13300 },
    { name: 'Mai', Receitas: 24200, Despesas: 9500, Lucro: 14700 },
    { name: 'Jun (Consol.)', Receitas: totalOperationalRevenue || 28000, Despesas: totalRealizedOperationalCosts || 11000, Lucro: realizedOperatingNetProfit || 17000 }
  ];

  // Projection Chart Data
  const projectionData = [
    { name: 'Mes Atual', Atual: currentNetProfit, Simulado: currentNetProfit },
    { name: '+1 Mes', Atual: currentNetProfit * 1.05, Simulado: simulatedNetProfit },
    { name: '+2 Meses', Atual: currentNetProfit * 1.10, Simulado: simulatedNetProfit * 1.05 },
    { name: '+3 Meses', Atual: currentNetProfit * 1.15, Simulado: simulatedNetProfit * 1.12 },
    { name: '+4 Meses', Atual: currentNetProfit * 1.20, Simulado: simulatedNetProfit * 1.20 },
    { name: '+5 Meses', Atual: currentNetProfit * 1.25, Simulado: simulatedNetProfit * 1.28 },
    { name: '+6 Meses', Atual: currentNetProfit * 1.30, Simulado: simulatedNetProfit * 1.35 }
  ];

  return (
    <div className="space-y-6 animate-slide-in-up">
      
      {/* Brand Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="font-serif font-bold text-2xl text-ink-900 tracking-tight flex items-center gap-2">
            <Wallet className="text-gold-600" size={24} />
            Núcleo Financeiro Central
          </h2>
          <p className="text-xs text-ink-600 mt-1">
            Controle integrado derivado em tempo real de vendas, orçamentos, estoque, compras e chão de fábrica.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dashboard' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 size={13} />
            <span>Painel Integrado</span>
          </button>
          <button 
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'simulator' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders size={13} />
            <span>Simulador & Projeções</span>
          </button>
          <button 
            onClick={() => setActiveTab('reconciliation')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reconciliation' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scan size={13} />
            <span>Conciliação & OCR</span>
            {unreconciledCount > 0 && (
              <span className="bg-amber-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full">
                {unreconciledCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------
          TAB 1: PAINEL INTEGRADO
          ---------------------------------------------------- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Dynamic Operational KPIs row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div 
              onClick={() => setExpandedSection(expandedSection === 'revenues' ? null : 'revenues')}
              className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-xs cursor-pointer hover:border-gold-500/50 hover:shadow-sm transition-all relative group"
            >
              <div className="flex justify-between items-start text-slate-400 uppercase text-[9px] font-bold tracking-wider">
                <span>Faturamento Real</span>
                <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-600">
                  <ArrowUpRight size={13} />
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-2 font-mono text-emerald-600">
                R$ {realizedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
              <div className="flex items-center justify-between text-[9.5px] mt-1 text-slate-500">
                <span>{completedOrders.length} pedidos finalizados</span>
                <span className="text-gold-600 font-bold group-hover:underline">Ver detalhado</span>
              </div>
            </div>

            <div 
              onClick={() => setExpandedSection(expandedSection === 'materials' ? null : 'materials')}
              className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-xs cursor-pointer hover:border-gold-500/50 hover:shadow-sm transition-all relative group"
            >
              <div className="flex justify-between items-start text-slate-400 uppercase text-[9px] font-bold tracking-wider">
                <span>Custo Material (CMV)</span>
                <span className="p-1 rounded-md bg-rose-500/10 text-rose-600">
                  <Layers size={13} />
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-2 font-mono text-rose-600">
                R$ {completedDirectMaterialCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
              <div className="flex items-center justify-between text-[9.5px] mt-1 text-slate-500">
                <span>Insumos reais consumidos</span>
                <span className="text-gold-600 font-bold group-hover:underline">Ver detalhado</span>
              </div>
            </div>

            <div 
              onClick={() => setExpandedSection(expandedSection === 'labor' ? null : 'labor')}
              className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-xs cursor-pointer hover:border-gold-500/50 hover:shadow-sm transition-all relative group"
            >
              <div className="flex justify-between items-start text-slate-400 uppercase text-[9px] font-bold tracking-wider">
                <span>Custo de Chão de Fábrica</span>
                <span className="p-1 rounded-md bg-blue-500/10 text-blue-600">
                  <Hammer size={13} />
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-2 font-mono text-indigo-600">
                R$ {realLaborCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
              <div className="flex items-center justify-between text-[9.5px] mt-1 text-slate-500">
                <span>{totalMinutesSpent} minutos registrados</span>
                <span className="text-gold-600 font-bold group-hover:underline">Ver detalhado</span>
              </div>
            </div>

            <div className="bg-white border border-gold-500/20 p-5 rounded-2xl shadow-xs relative overflow-hidden bg-gradient-to-br from-[#FFFDF9] to-[#FAF8F3]">
              <div className="flex justify-between items-start text-slate-400 uppercase text-[9px] font-bold tracking-wider">
                <span>Resultado Líquido Operacional</span>
                <span className="p-1 rounded-md bg-amber-500/10 text-gold-600">
                  <DollarSign size={13} />
                </span>
              </div>
              <h2 className={`text-xl sm:text-2xl font-black mt-2 font-mono ${realizedOperatingNetProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                R$ {realizedOperatingNetProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
              <div className="flex items-center justify-between text-[9.5px] mt-1">
                <span className="text-slate-500">Margem Real: </span>
                <span className="font-bold text-emerald-600">
                  {realizedRevenue > 0 ? ((realizedOperatingNetProfit / realizedRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

          </div>

          {/* Dynamic Operational Sub-metrics block (Secondary metrics) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div 
              onClick={() => setExpandedSection(expandedSection === 'purchases' ? null : 'purchases')}
              className="bg-slate-50 border border-slate-200/70 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/5 text-rose-500 rounded-lg">
                  <ShoppingBag size={15} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold font-mono">Compras Efetuadas</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">R$ {stockPurchaseExpenses.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <Info size={12} className="text-slate-400" />
            </div>

            <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/5 text-emerald-500 rounded-lg">
                  <Layers size={15} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold font-mono">Patrimônio em Insumos</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">R$ {totalStockAssetValuation.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <Info size={12} className="text-slate-400" title="Valor do estoque físico atual" />
            </div>

            <div 
              onClick={() => setExpandedSection(expandedSection === 'quotes' ? null : 'quotes')}
              className="bg-slate-50 border border-slate-200/70 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/5 text-indigo-500 rounded-lg">
                  <Briefcase size={15} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold font-mono">Pipeline de Orçamentos</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">R$ {quotesPipelineValue.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <Info size={12} className="text-slate-400" />
            </div>

            <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/5 text-amber-500 rounded-lg">
                  <Wallet size={15} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold font-mono">Faturamento Pendente</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">R$ {pendingRevenue.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <Info size={12} className="text-slate-400" title="Pedidos de venda aprovados em produção" />
            </div>

          </div>

          {/* EXPANDABLE TRACEABILITY AREA */}
          <AnimatePresence>
            {expandedSection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-[#FAF9F5] border border-gold-500/20 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gold-600 animate-pulse" />
                      <h4 className="text-xs uppercase font-bold font-mono text-slate-800">
                        {expandedSection === 'revenues' && "Rastreabilidade de Vendas & Faturamentos"}
                        {expandedSection === 'materials' && "Detalhamento de Consumo de Insumos (CMV)"}
                        {expandedSection === 'labor' && "Logs Operacionais do Chão de Fábrica (Mão de Obra)"}
                        {expandedSection === 'purchases' && "Registro Histórico de Compras de Insumo"}
                        {expandedSection === 'quotes' && "Funil e Prospecção de Orçamentos Ativos"}
                      </h4>
                    </div>
                    <button 
                      onClick={() => setExpandedSection(null)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      Fechar Detalhes
                    </button>
                  </div>

                  {/* 1. Revenues Detail */}
                  {expandedSection === 'revenues' && (
                    <div className="overflow-x-auto text-xs bg-white rounded-xl border border-slate-200">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase font-mono">
                            <th className="p-3">Código</th>
                            <th className="p-3">Cliente</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3">Data</th>
                            <th className="p-3 text-right">Valor do Pedido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeOrders.map((o) => (
                            <tr key={o.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-slate-800">{o.orderNumber}</td>
                              <td className="p-3 font-medium text-slate-600">{o.clientName}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 text-[8.5px] font-bold rounded-full ${
                                  o.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {o.status === 'completed' ? 'CONCLUÍDO' : 'EM PRODUÇÃO'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-500">{o.date}</td>
                              <td className="p-3 text-right font-bold font-mono">R$ {o.totalValue.toFixed(2)}</td>
                            </tr>
                          ))}
                          {activeOrders.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400 italic">Sem vendas ativas no sistema.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 2. Materials Detail */}
                  {expandedSection === 'materials' && (
                    <div className="overflow-x-auto text-xs bg-white rounded-xl border border-slate-200">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase font-mono">
                            <th className="p-3">Material de Composição</th>
                            <th className="p-3 text-center">Categoria</th>
                            <th className="p-3 text-center">Qtd Total Estimada</th>
                            <th className="p-3 text-right">Custo Unitário</th>
                            <th className="p-3 text-right">Custo Consolidado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inventory.filter(i => !i.isDeleted).map((item) => {
                            // Sum composition occurrences in completed orders
                            let totalQty = 0;
                            completedOrders.forEach(o => {
                              o.items.forEach(orderItem => {
                                const p = products.find(prod => prod.id === orderItem.productId);
                                if (p && p.composition) {
                                  const match = p.composition.find(c => c.materialId === item.id);
                                  if (match) {
                                    totalQty += match.quantity * orderItem.quantity;
                                  }
                                }
                              });
                            });

                            if (totalQty === 0) return null;
                            const totalCost = totalQty * item.unitValue;

                            return (
                              <tr key={item.id} className="hover:bg-slate-50/50">
                                <td className="p-3">
                                  <span className="font-semibold text-slate-900 block">{item.name}</span>
                                  <span className="text-[10px] text-slate-400 block font-mono">{item.code}</span>
                                </td>
                                <td className="p-3 text-center text-slate-500">{item.category}</td>
                                <td className="p-3 text-center font-bold font-mono">{totalQty.toFixed(1)} {item.unit}</td>
                                <td className="p-3 text-right text-slate-500 font-mono">R$ {item.unitValue.toFixed(2)}</td>
                                <td className="p-3 text-right font-black font-mono text-slate-800">R$ {totalCost.toFixed(2)}</td>
                              </tr>
                            );
                          }).filter(Boolean)}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 3. Labor Detail */}
                  {expandedSection === 'labor' && (
                    <div className="overflow-x-auto text-xs bg-white rounded-xl border border-slate-200">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase font-mono">
                            <th className="p-3">Operador Chão de Fábrica</th>
                            <th className="p-3">Peça Produzida</th>
                            <th className="p-3">Código Pedido</th>
                            <th className="p-3 text-center">Tempo Gasto</th>
                            <th className="p-3 text-right">Custo Mão de Obra</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {productionTasks.map((t) => {
                            const taskLabor = (t.timeSpentMinutes || 0) * (hourlyRate / 60);
                            return (
                              <tr key={t.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-800">{t.responsible}</td>
                                <td className="p-3 text-slate-600">{t.productName}</td>
                                <td className="p-3 font-bold font-mono">{t.orderNumber}</td>
                                <td className="p-3 text-center font-bold font-mono text-slate-500">{t.timeSpentMinutes || 0} min</td>
                                <td className="p-3 text-right font-bold text-indigo-600 font-mono">R$ {taskLabor.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                          {productionTasks.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400 italic">Nenhum log de produção no Chão de Fábrica disponível.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 4. Purchases Detail */}
                  {expandedSection === 'purchases' && (
                    <div className="overflow-x-auto text-xs bg-white rounded-xl border border-slate-200">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase font-mono">
                            <th className="p-3">Insumo Comprado</th>
                            <th className="p-3">Fornecedor</th>
                            <th className="p-3">Data da Lançamento</th>
                            <th className="p-3 text-center">Método</th>
                            <th className="p-3 text-right">Gasto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeTransactions
                            .filter(t => t.type === 'expense' && (t.category.toLowerCase().includes('compra') || t.category.toLowerCase().includes('insumo')))
                            .map((t) => (
                              <tr key={t.id} className="hover:bg-slate-50/50">
                                <td className="p-3">
                                  <span className="font-semibold text-slate-800 block">{t.category}</span>
                                  <span className="text-[10.5px] text-slate-400 block">{t.notes}</span>
                                </td>
                                <td className="p-3 text-slate-600">{t.contactName}</td>
                                <td className="p-3 text-slate-500">{t.date}</td>
                                <td className="p-3 text-center uppercase font-semibold text-slate-400">{t.paymentMethod}</td>
                                <td className="p-3 text-right font-bold text-rose-600 font-mono">R$ {t.value.toFixed(2)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 5. Quotes Detail */}
                  {expandedSection === 'quotes' && (
                    <div className="overflow-x-auto text-xs bg-white rounded-xl border border-slate-200">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase font-mono">
                            <th className="p-3">Cliente Orçado</th>
                            <th className="p-3">Data Prospecção</th>
                            <th className="p-3 text-center">Status Interno</th>
                            <th className="p-3 text-right">Descontos Aplicados</th>
                            <th className="p-3 text-right">Valor Estimado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeQuotes.map((q) => (
                            <tr key={q.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-semibold text-slate-800">{q.clientName}</td>
                              <td className="p-3 text-slate-500">{q.date}</td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-0.5 text-[8.5px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  {q.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-3 text-right font-mono text-rose-500">R$ {q.discount.toFixed(2)}</td>
                              <td className="p-3 text-right font-bold text-slate-900 font-mono">R$ {q.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Evolution Chart (operationalized) */}
          <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
              <BarChart3 size={14} className="text-amber-500" /> Curva Semestral de Desempenho Operacional (Event-Driven)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                  <Area type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Manual Ledger Log Search controls */}
          <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Buscar lançamentos bancários..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
              >
                <option value="all">Todas as Movimentações</option>
                <option value="income">Apenas Entradas (Receitas)</option>
                <option value="expense">Apenas Saídas (Despesas)</option>
              </select>
            </div>

            <button
              id="btn-new-transaction"
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus size={14} /> Registrar Transação Manual
            </button>
          </div>

          {/* Ledger Table */}
          <div className="bg-white border border-slate-200/85 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/40">
                    <th className="p-4 font-bold text-[10px]">Data</th>
                    <th className="p-4 font-bold text-[10px]">Tipo</th>
                    <th className="p-4 font-bold text-[10px]">Categoria</th>
                    <th className="p-4 font-bold text-[10px]">Origem / Destinatário</th>
                    <th className="p-4 font-bold text-[10px]">Método</th>
                    <th className="p-4 font-bold text-[10px]">Status Conciliação</th>
                    <th className="p-4 font-bold text-[10px]">Valor Lançado</th>
                    <th className="p-4 font-bold text-[10px] text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-medium text-slate-500">{t.date}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${
                          t.type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                        }`}>
                          {t.type === 'income' ? 'RECEITA' : 'DESPESA'}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{t.category}</td>
                      <td className="p-4 font-medium text-slate-600">{t.contactName}</td>
                      <td className="p-4 uppercase font-bold text-slate-500">{t.paymentMethod}</td>
                      <td className="p-4">
                        {t.reconciled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <CheckCircle2 size={11} /> Conciliado ({t.reconciledToNumber})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            <AlertTriangle size={11} /> Não Conciliado
                          </span>
                        )}
                      </td>
                      <td className={`p-4 font-bold font-mono text-sm ${
                        t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.value.toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(t.id, t.category, t.value)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-all duration-200 active:scale-95"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Nenhuma movimentação de caixa encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 2: SIMULADOR & PROJEÇÕES
          ---------------------------------------------------- */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFFDF9] border border-gold-500/20 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <Sliders className="text-gold-600" size={18} />
              <h3 className="font-serif font-bold text-sm text-slate-900">Configurador de Simulação (What-If Analysis)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ajuste as variáveis operacionais para testar cenários, simular flutuações e analisar o impacto direto sobre faturamento e lucratividade em tempo real.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6 border-t border-slate-100 pt-5">
              
              {/* Parameter 1 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Percent size={13} className="text-emerald-500" /> Preços de Venda
                  </span>
                  <span className={`font-mono font-black ${priceAdjustment >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {priceAdjustment > 0 ? '+' : ''}{priceAdjustment}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-30" 
                  max="50" 
                  value={priceAdjustment} 
                  onChange={(e) => setPriceAdjustment(Number(e.target.value))}
                  className="w-full accent-gold-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">Reajuste médio de preço dos produtos</p>
              </div>

              {/* Parameter 2 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Layers size={13} className="text-rose-500" /> Custo de Insumos
                  </span>
                  <span className={`font-mono font-black ${materialCostAdjustment <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {materialCostAdjustment > 0 ? '+' : ''}{materialCostAdjustment}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-20" 
                  max="100" 
                  value={materialCostAdjustment} 
                  onChange={(e) => setMaterialCostAdjustment(Number(e.target.value))}
                  className="w-full accent-gold-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">Inflação no custo de metais e miçangas</p>
              </div>

              {/* Parameter 3 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Hammer size={13} className="text-indigo-500" /> Produtividade Fábrica
                  </span>
                  <span className="font-mono font-black text-indigo-600">
                    -{laborProductivity}% tempo
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  value={laborProductivity} 
                  onChange={(e) => setLaborProductivity(Number(e.target.value))}
                  className="w-full accent-gold-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">Otimização de tempo no Chão de Fábrica</p>
              </div>

              {/* Parameter 4 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Briefcase size={13} className="text-amber-500" /> Conversão Orçamentos
                  </span>
                  <span className="font-mono font-black text-amber-600">
                    {quoteConversionRate}% aprovação
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={quoteConversionRate} 
                  onChange={(e) => setQuoteConversionRate(Number(e.target.value))}
                  className="w-full accent-gold-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">Percentual de aprovação de orçamentos</p>
              </div>

            </div>

            {/* Simulation reset button */}
            <div className="flex justify-end mt-4 pt-2 border-t border-slate-100">
              <button 
                onClick={() => {
                  setPriceAdjustment(0);
                  setMaterialCostAdjustment(0);
                  setLaborProductivity(0);
                  setQuoteConversionRate(50);
                  toast.info("Valores Resetados", "Parâmetros do simulador voltaram ao estado padrão.");
                }}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCcw size={12} />
                <span>Restaurar Padrões</span>
              </button>
            </div>
          </div>

          {/* Compare simulated vs current */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Standard baseline Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative">
              <span className="absolute top-4 right-4 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">Cenário Base (Atual)</span>
              <h4 className="font-serif font-bold text-sm text-slate-900">Consolidado Atual Projetado</h4>
              
              <div className="space-y-4 mt-6">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Faturamento Projetado Estimado</span>
                  <p className="text-xl font-black font-mono text-slate-800 mt-1">R$ {currentTotalOperationalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Total de Custos Estimados</span>
                  <p className="text-sm font-bold font-mono text-rose-500 mt-1">R$ {currentTotalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Lucratividade Projetada</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-lg font-black font-mono text-slate-900">R$ {currentNetProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-mono font-bold">
                      {currentTotalOperationalRevenue > 0 ? ((currentNetProfit / currentTotalOperationalRevenue) * 100).toFixed(1) : 0}% Margem
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <span className="absolute top-4 right-4 text-[10px] font-bold font-mono text-gold-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">Cenário Simulado</span>
              <h4 className="font-serif font-bold text-sm text-gold-400">Simulação em Tempo Real</h4>
              
              <div className="space-y-4 mt-6">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Faturamento Simulado</span>
                  <p className="text-xl font-black font-mono text-emerald-400 mt-1">R$ {simulatedTotalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Simulação Custos Totais</span>
                  <p className="text-sm font-bold font-mono text-rose-400 mt-1">R$ {simulatedTotalOperationalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Lucro Líquido Simulado</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-lg font-black font-mono text-gold-300">R$ {simulatedNetProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-xs bg-gold-500/10 text-gold-400 px-2 py-0.5 rounded font-mono font-bold">
                      {simulatedTotalRevenue > 0 ? ((simulatedNetProfit / simulatedTotalRevenue) * 100).toFixed(1) : 0}% Margem
                    </span>
                  </div>
                </div>
              </div>

              {/* Delta Box overlay */}
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Delta Faturamento:</span>
                <span className={simulatedTotalRevenue >= currentTotalOperationalRevenue ? 'text-emerald-400' : 'text-rose-400'}>
                  {simulatedTotalRevenue >= currentTotalOperationalRevenue ? '+' : ''}
                  {(((simulatedTotalRevenue - currentTotalOperationalRevenue) / (currentTotalOperationalRevenue || 1)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

          </div>

          {/* Projections chart comparison */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1">
              <Sliders size={14} className="text-gold-500" /> Projeção de Caixa a Médio Prazo (6 Meses): Base vs Simulado
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="projBase" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="projSim" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                  <Legend verticalAlign="top" height={36} />
                  <Area type="monotone" name="Fluxo Atual" dataKey="Atual" stroke="#64748b" strokeWidth={2} fillOpacity={1} fill="url(#projBase)" />
                  <Area type="monotone" name="Fluxo Simulado" dataKey="Simulado" stroke="#d4af37" strokeWidth={2.5} fillOpacity={1} fill="url(#projSim)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 3: CONCILIAÇÃO & OCR
          ---------------------------------------------------- */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          {/* Top Panel Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI OCR Box */}
            <div className="bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFFDF9] border border-gold-500/20 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gold-500/10 border border-gold-500/25 text-gold-700 text-[9px] font-bold uppercase rounded-full">
                  <Sparkles size={10} /> Inteligência Artificial
                </span>
                <h3 className="text-sm font-serif font-semibold text-ink-900">Leitor OCR de Cupons Fiscais</h3>
                <p className="text-xs text-ink-600 leading-relaxed">
                  Envie a foto de um recibo de compra. O Gemini OCR lê e extrai fornecedores, data e valores para auto-conciliar no financeiro.
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => { setShowScanZone(!showScanZone); setShowImportZone(false); }}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-semibold text-xs rounded-xl hover:opacity-95 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <Scan size={14} />
                  {showScanZone ? "Ocultar Scanner" : "Escanear Cupom Fiscal (OCR)"}
                </button>
              </div>
            </div>

            {/* Statement Importer Box */}
            <div className="bg-gradient-to-br from-[#FAF8F5] via-white to-[#FAF8F5] border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[9px] font-bold uppercase rounded-full">
                  <FileText size={10} /> Conciliação Bancária
                </span>
                <h3 className="text-sm font-serif font-semibold text-ink-900">Importação de Extratos Bancários</h3>
                <p className="text-xs text-ink-600 leading-relaxed">
                  Importe arquivos .OFX ou .CSV de faturamento de bancos para verificar pendências com orçamentos e pedidos.
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => { setShowImportZone(!showImportZone); setShowScanZone(false); }}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <UploadCloud size={14} />
                  {showImportZone ? "Ocultar Importador" : "Importar Extrato (.OFX / .CSV)"}
                </button>
              </div>
            </div>
          </div>

          {/* COLLAPSIBLE SCAN ZONE */}
          <AnimatePresence>
            {showScanZone && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleOcrDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                    dragActive ? 'border-gold-500 bg-gold-500/5' : 'border-slate-250 bg-white hover:border-gold-500/60'
                  }`}
                >
                  {isScanning ? (
                    <div className="space-y-4 py-6 flex flex-col items-center justify-center">
                      <div className="relative w-48 h-48 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-xs flex items-center justify-center">
                        <FileText size={48} className="text-slate-300" />
                        <motion.div 
                          animate={{ y: [0, 180, 0] }}
                          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400 shadow-[0_0_12px_rgba(212,160,57,0.8)] z-10"
                        />
                      </div>
                      <p className="text-xs font-semibold text-gold-700 animate-pulse flex items-center gap-1.5 justify-center">
                        <RefreshCw size={14} className="animate-spin" />
                        Lendo cupom fiscal via Gemini IA OCR...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gold-500/10 text-gold-600 flex items-center justify-center mx-auto shadow-xs">
                        <Scan size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-900">Solte a foto ou comprovante fiscal aqui</p>
                        <p className="text-[10px] text-ink-600 mt-1">Formatos suportados: PNG, JPG, WEBP</p>
                      </div>
                      <div>
                        <button
                          onClick={() => ocrInputRef.current?.click()}
                          className="px-4 py-2 bg-white border border-slate-250 hover:border-gold-500 hover:text-gold-600 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer shadow-xs active:scale-98 transition-all"
                        >
                          Selecionar Imagem
                        </button>
                        <input
                          ref={ocrInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleOcrSelect}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* COLLAPSIBLE DROP ZONE FOR BANK EXTRACT */}
          <AnimatePresence>
            {showImportZone && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleExtractDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                    dragActive ? 'border-amber-500 bg-amber-50/10' : 'border-slate-250 bg-white hover:border-slate-400'
                  }`}
                >
                  {isImporting ? (
                    <div className="space-y-3 py-6 text-slate-600">
                      <RefreshCw className="animate-spin mx-auto text-slate-800" size={24} />
                      <p className="text-xs font-semibold">Carregando dados financeiros e reconciliando registros...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto shadow-xs">
                        <UploadCloud size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-900">Envie o arquivo bancário (.OFX / .CSV / .XLSX) aqui</p>
                        <p className="text-[10px] text-ink-600 mt-1">Assegura que importações bancárias sirvam para conciliação</p>
                      </div>
                      <div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-white border border-slate-250 hover:border-slate-400 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer shadow-xs active:scale-98 transition-all"
                        >
                          Selecionar Arquivo
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.ofx,.xlsx"
                          onChange={handleExtractSelect}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Reconciliation Hub */}
          <div className="bg-white border border-slate-200/85 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="font-serif font-bold text-xs text-slate-900">Módulo de Conciliação de Transações</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Vincule os lançamentos bancários recebidos aos pedidos e compras operacionais.</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Auto Reconcile Button */}
                <button 
                  onClick={handleAutoReconcile}
                  className="px-3 py-1.5 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-bold text-[10px] rounded-lg flex items-center gap-1 cursor-pointer hover:opacity-95 shadow-xs transition-all active:scale-95"
                >
                  <Sparkles size={11} />
                  <span>Autoconciliar IA</span>
                </button>

                {/* Filter Selector */}
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                  <button 
                    onClick={() => setReconcileFilter('all')}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer ${
                      reconcileFilter === 'all' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setReconcileFilter('unreconciled')}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer ${
                      reconcileFilter === 'unreconciled' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Não Conciliados ({unreconciledCount})
                  </button>
                  <button 
                    onClick={() => setReconcileFilter('reconciled')}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer ${
                      reconcileFilter === 'reconciled' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Conciliados ({reconciledCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Reconciliation table list */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/20 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400 font-mono tracking-wider">
                    <th className="p-4">Dados Movimento Bancário</th>
                    <th className="p-4">Origem Declarada</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Valor</th>
                    <th className="p-4">Status / Vínculo Operacional</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions
                    .filter(t => !t.isDeleted)
                    .filter(t => {
                      if (reconcileFilter === 'unreconciled') return !t.reconciled;
                      if (reconcileFilter === 'reconciled') return t.reconciled;
                      return true;
                    })
                    .map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/40">
                        <td className="p-4">
                          <span className="font-semibold text-slate-900 block">{t.category}</span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-slate-400 font-mono">{t.date} •</span>
                            <select
                              value={t.paymentMethod?.toLowerCase() || 'pix'}
                              onChange={(e) => {
                                updateTransaction(t.id, { paymentMethod: e.target.value });
                                toast.success("Forma de Pagamento Salva", `Alterada para ${e.target.value.toUpperCase()}`);
                              }}
                              className="text-[9px] font-bold uppercase bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded px-1.5 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="pix">PIX</option>
                              <option value="credit_card">Cartão de Crédito</option>
                              <option value="debit_card">Cartão de Débito</option>
                              <option value="cash">Dinheiro</option>
                              <option value="bank_slip">Boleto</option>
                              <option value="transfer">Transferência</option>
                              <option value="other">Outros</option>
                            </select>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-slate-600">{t.contactName}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 text-[8px] font-bold rounded ${
                            t.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {t.type === 'income' ? 'ENTRADA' : 'SAÍDA'}
                          </span>
                        </td>
                        <td className={`p-4 font-bold font-mono ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'income' ? '+' : '-'} R$ {t.value.toFixed(2)}
                        </td>
                        <td className="p-4">
                          {t.reconciled ? (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md w-fit">
                                <CheckCircle2 size={11} /> Conciliado
                              </span>
                              <span className="text-[10px] text-slate-450 font-mono">
                                {t.reconciledToType === 'order' ? `Pedido: ${t.reconciledToNumber}` : `Insumo: ${t.reconciledToNumber}`}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md w-fit">
                              <AlertTriangle size={11} /> Pendente de Vínculo
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {t.reconciled ? (
                            <button
                              onClick={() => handleUnlink(t.id, t.reconciledToNumber)}
                              className="px-2 py-1 text-[9px] font-bold text-slate-400 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                            >
                              Desvincular
                            </button>
                          ) : (
                            <button
                              onClick={() => setLinkingTransaction(t)}
                              className="px-2.5 py-1 bg-slate-900 text-white font-bold text-[9.5px] rounded hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                            >
                              Vincular
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  {transactions.filter(t => !t.isDeleted).length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">Nenhum lançamento bancário disponível para conciliar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODALS & OVERLAYS
          ---------------------------------------------------- */}

      {/* RECONCILIATION MATCH DRAWER / POPUP */}
      {linkingTransaction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-up">
            <div className="bg-[#FAF8F5] border-b border-slate-150 px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-serif font-bold text-sm text-slate-900">Vincular Transação Operacional</h3>
                <p className="text-[10px] text-slate-500">Selecione o registro operacional correspondente ao valor de R$ {linkingTransaction.value.toFixed(2)}</p>
              </div>
              <button onClick={() => setLinkingTransaction(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {linkingTransaction.type === 'income' ? (
                <>
                  <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block font-mono">Pedidos de Venda Compatíveis</span>
                  <div className="space-y-2 mt-1">
                    {orders
                      .filter(o => !o.isDeleted && !o.isCancelled && o.status !== 'completed')
                      .map(o => (
                        <div 
                          key={o.id}
                          className="p-3 border border-slate-150 hover:border-gold-500 rounded-xl flex items-center justify-between hover:bg-slate-50/50 cursor-pointer transition-all"
                          onClick={() => handleManualMatch(linkingTransaction, 'order', o.id, o.orderNumber)}
                        >
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">{o.orderNumber}</span>
                            <span className="text-[10px] text-slate-500 block">Cliente: {o.clientName} • {o.date}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block font-mono text-xs">R$ {o.totalValue.toFixed(2)}</span>
                            <span className="text-[9px] text-gold-600 font-bold underline flex items-center gap-0.5 justify-end">Vincular <Link2 size={10} /></span>
                          </div>
                        </div>
                      ))}
                    {orders.filter(o => !o.isDeleted && !o.isCancelled && o.status !== 'completed').length === 0 && (
                      <p className="text-xs text-slate-400 italic py-4">Nenhum pedido de venda aberto compatível.</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block font-mono">Insumos de Estoque / Fornecedores</span>
                  <div className="space-y-2 mt-1">
                    {inventory
                      .filter(i => !i.isDeleted)
                      .map(item => (
                        <div 
                          key={item.id}
                          className="p-3 border border-slate-150 hover:border-gold-500 rounded-xl flex items-center justify-between hover:bg-slate-50/50 cursor-pointer transition-all"
                          onClick={() => handleManualMatch(linkingTransaction, 'purchase', item.id, item.code)}
                        >
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">{item.name}</span>
                            <span className="text-[10px] text-slate-500 block">Fornecedor: {item.supplier || 'Diverso'} • Código: {item.code}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9.5px] text-slate-500 block font-mono">Unidade: R$ {item.unitValue.toFixed(2)}</span>
                            <span className="text-[9px] text-gold-600 font-bold underline flex items-center gap-0.5 justify-end">Vincular <Link2 size={10} /></span>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="bg-slate-50 p-4 border-t border-slate-150 flex justify-end shrink-0">
              <button 
                onClick={() => setLinkingTransaction(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TRANSACTION MANUAL FORM */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-up">
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 className="font-serif font-bold text-base text-slate-900">Lançar Movimentação Financeira</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveAdd} className="flex-1 flex flex-col min-h-0">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              
              {/* Type Switcher */}
              <div className="flex gap-3 border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategory('Venda de Terço'); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    type === 'income' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' : 'bg-slate-100 text-slate-500 '
                  }`}
                >
                  Receita (Entrada)
                </button>
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategory('Compra de Pérolas/Insumos'); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    type === 'expense' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30' : 'bg-slate-100 text-slate-500 '
                  }`}
                >
                  Despesa (Saída)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Categoria *</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Venda de Terço, Compra de Entremeio, Luz"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {type === 'income' ? 'Cliente Comprador *' : 'Fornecedor / Credor *'}
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={type === 'income' ? 'Ex: Ana Maria' : 'Ex: Metais Distribuidora Ltda'}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Valor Lançado (R$) *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={value || ''}
                    onChange={(e) => setValue(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850 font-mono focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Data do Lançamento</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Método de Liquidação</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850 font-bold focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  <option value="pix">PIX Instantâneo</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="debit_card">Cartão de Débito</option>
                  <option value="cash">Dinheiro em Espécie</option>
                  <option value="bank_slip">Boleto Bancário</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Observações / Detalhes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anote detalhes adicionais, links de recibos, itens comprados..."
                  rows={2}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850 focus:outline-none focus:ring-1 focus:ring-gold-500 resize-none"
                />
              </div>

              </div>

              <div className="p-4 border-t border-slate-150 flex justify-end gap-3 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer transition-all active:scale-98"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-98"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-slide-in-up">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Confirmar Exclusão</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Deseja realmente excluir o lançamento financeiro <strong className="text-slate-800">"{deleteConfirm.description}"</strong> de valor <strong className="text-slate-850">R$ {deleteConfirm.amount.toFixed(2)}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer transition-all duration-200 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 active:scale-95"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
