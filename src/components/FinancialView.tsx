import React, { useState, useRef } from 'react';
import { useDb } from '../context/DbContext';
import { FinancialTransaction, TransactionType } from '../types/erp';
import { 
 TrendingUp, TrendingDown, DollarSign, Plus, Search, Trash2, X, Filter,
 ArrowUpRight, ArrowDownRight, CreditCard, Calendar, BarChart3, Wallet, AlertTriangle,
 FileText, Scan, UploadCloud, Sparkles, RefreshCw, CheckCircle
} from 'lucide-react';
import { toast } from './Toast';
import { 
 ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'bank_slip';

export const FinancialView: React.FC = () => {
 const { transactions, addTransaction, deleteTransaction, scanReceipt, importFinancialFile } = useDb();

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

 // Form states
 const [type, setType] = useState<TransactionType>('income');
 const [category, setCategory] = useState('Venda de Terço');
 const [contactName, setContactName] = useState(''); // client or supplier
 const [value, setValue] = useState(0);
 const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
 const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
 const [notes, setNotes] = useState('');

 const fileInputRef = useRef<HTMLInputElement>(null);
 const ocrInputRef = useRef<HTMLInputElement>(null);

 const activeTransactions = transactions.filter(t => !t.isDeleted);

 // Filter Transactions list
 const filteredTransactions = activeTransactions.filter(t => {
  const matchesSearch = t.category.toLowerCase().includes(search.toLowerCase()) || 
  (t.contactName && t.contactName.toLowerCase().includes(search.toLowerCase())) ||
  (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));
  const matchesType = selectedType === 'all' || t.type === selectedType;
  return matchesSearch && matchesType;
 });

 // KPI Calculations
 const totalRevenues = activeTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.value, 0);
 const totalExpenses = activeTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.value, 0);
 const netProfit = totalRevenues - totalExpenses;

 // Chart data assembly (Revenues vs Expenses per Month)
 const chartData = [
  { name: 'Jan', Receitas: 12400, Despesas: 5200, Lucro: 7200 },
  { name: 'Fev', Receitas: 15100, Despesas: 6100, Lucro: 9000 },
  { name: 'Mar', Receitas: 18900, Despesas: 7300, Lucro: 11600 },
  { name: 'Abr', Receitas: 21500, Despesas: 8200, Lucro: 13300 },
  { name: 'Mai', Receitas: 24200, Despesas: 9500, Lucro: 14700 },
  { name: 'Jun', Receitas: totalRevenues || 28000, Despesas: totalExpenses || 11000, Lucro: netProfit || 17000 }
 ];

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

 // DRAG & DROP AND HANDLERS FOR EXTRACTS (CSV/OFX/XLSX)
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
     toast.success("Extrato Importado!", `${res.count} transações financeiras reconciliadas e salvas.`);
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

 // AI OCR RECEIPT SCANNER HANDLER (GEMINI INTEGRATION)
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
    // Call our server-side OCR via context
    const res = await scanReceipt(base64String);
    if (res.success && res.data) {
     toast.success("Análise de IA Concluída!", "Recibo escaneado com sucesso. Verifique os dados.");
     
     // Prefill Add Modal with AI results for validation
     setType('expense');
     setCategory(res.data.category || 'Compra de Matéria-Prima');
     setContactName(res.data.vendorName || 'Fornecedor Identificado');
     setValue(Number(res.data.totalAmount) || 0);
     setDate(res.data.date || new Date().toISOString().split('T')[0]);
     setPaymentMethod('pix');
     setNotes(`Importado por IA OCR. Itens: ${res.data.items?.map((it: any) => `${it.qty}x ${it.desc}`).join(', ') || 'Nenhum item discriminado'}`);
     
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

 return (
  <div className="space-y-6 animate-slide-in-up">
   
   {/* Financial KPIs row */}
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
    
    <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm">
     <div className="flex justify-between items-start text-slate-450 uppercase text-[9px] font-bold tracking-wider">
      <span>Faturamento Bruto</span>
      <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-600">
       <ArrowUpRight size={13} />
      </span>
     </div>
     <h2 className="text-xl sm:text-2xl font-black mt-2 font-mono text-emerald-600 ">
      R$ {totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
     </h2>
     <p className="text-[9.5px] text-slate-400 mt-1">Soma de receitas brutas</p>
    </div>

    <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm">
     <div className="flex justify-between items-start text-slate-450 uppercase text-[9px] font-bold tracking-wider">
      <span>Despesas Operacionais</span>
      <span className="p-1 rounded-md bg-rose-500/10 text-rose-600">
       <ArrowDownRight size={13} />
      </span>
     </div>
     <h2 className="text-xl sm:text-2xl font-black mt-2 font-mono text-rose-600 ">
      R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
     </h2>
     <p className="text-[9.5px] text-slate-400 mt-1">Soma de custos e insumos</p>
    </div>

    <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm">
     <div className="flex justify-between items-start text-slate-450 uppercase text-[9px] font-bold tracking-wider">
      <span>Lucro Líquido</span>
      <span className="p-1 rounded-md bg-blue-500/10 text-blue-600">
       <DollarSign size={13} />
      </span>
     </div>
     <h2 className="text-xl sm:text-2xl font-black mt-2 font-mono text-indigo-600 ">
      R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
     </h2>
     <p className="text-[9.5px] text-slate-400 mt-1">Resultado líquido real</p>
    </div>

    <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm">
     <div className="flex justify-between items-start text-slate-450 uppercase text-[9px] font-bold tracking-wider">
      <span>Fluxo de Caixa</span>
      <span className="p-1 rounded-md bg-amber-500/10 text-amber-600">
       <Wallet size={13} />
      </span>
     </div>
     <h2 className="text-xl sm:text-2xl font-black mt-2 font-mono text-slate-800 ">
      R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
     </h2>
     <p className="text-[9.5px] text-slate-400 mt-1">Saldo financeiro livre</p>
    </div>

   </div>

   {/* Action Panels: Scan & Import triggers */}
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Option 1: AI Scanner Box */}
    <div className="bg-gradient-to-br from-[#FFFDF9] via-white to-[#FFFDF9] border border-gold-500/20 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
     <div className="space-y-2">
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gold-500/10 border border-gold-500/25 text-gold-700 text-[9px] font-bold uppercase rounded-full">
       <Sparkles size={10} /> Inteligência Artificial
      </span>
      <h3 className="text-sm font-serif font-semibold text-ink-900">Leitura Inteligente de Recibos (OCR)</h3>
      <p className="text-xs text-ink-600 leading-relaxed">
       Tire uma foto ou faça o upload do cupom fiscal de compras. Nossa IA analisa o arquivo, identifica o fornecedor, valores e preenche o lançamento sozinho.
      </p>
     </div>
     <div className="mt-4">
      <button
       id="btn-trigger-ocr"
       onClick={() => { setShowScanZone(!showScanZone); setShowImportZone(false); }}
       className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-semibold text-xs rounded-xl hover:opacity-95 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
      >
       <Scan size={14} />
       {showScanZone ? "Ocultar Scanner" : "Escanear Cupom Fiscal (OCR)"}
      </button>
     </div>
    </div>

    {/* Option 2: Statement Importer Box */}
    <div className="bg-gradient-to-br from-[#FAF8F5] via-white to-[#FAF8F5] border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
     <div className="space-y-2">
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[9px] font-bold uppercase rounded-full">
       <FileText size={10} /> Conciliação Bancária
      </span>
      <h3 className="text-sm font-serif font-semibold text-ink-900">Importação de Extratos Bancários</h3>
      <p className="text-xs text-ink-600 leading-relaxed">
       Adicione arquivos gerados pelo seu banco (OFX, CSV ou tabelas XLSX) para carregar todas as movimentações de entradas e saídas de forma unificada.
      </p>
     </div>
     <div className="mt-4">
      <button
       id="btn-trigger-import"
       onClick={() => { setShowImportZone(!showImportZone); setShowScanZone(false); }}
       className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
      >
       <UploadCloud size={14} />
       {showImportZone ? "Ocultar Importador" : "Importar Extrato (.OFX / .CSV)"}
      </button>
     </div>
    </div>
   </div>

   {/* COLLAPSIBLE DROP ZONE FOR OCR RECEIPT */}
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
          {/* Animated Glowing Laser Scanner Line */}
          <motion.div 
           animate={{ y: [0, 180, 0] }}
           transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
           className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400 shadow-[0_0_12px_rgba(212,160,57,0.8)] z-10"
          />
         </div>
         <p className="text-xs font-semibold text-gold-700 animate-pulse flex items-center gap-1.5 justify-center">
          <RefreshCw size={14} className="animate-spin" />
          Analisando recibo com Inteligência Artificial Gemini...
         </p>
        </div>
       ) : (
        <div className="space-y-3">
         <div className="w-12 h-12 rounded-full bg-gold-500/10 text-gold-600 flex items-center justify-center mx-auto shadow-xs">
          <Scan size={20} />
         </div>
         <div>
          <p className="text-xs font-semibold text-ink-900">Arraste a foto ou cupom de compra aqui</p>
          <p className="text-[10px] text-ink-600 mt-1">Formatos suportados: PNG, JPG, JPEG, WEBP</p>
         </div>
         <div>
          <button
           id="btn-upload-ocr"
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
        dragActive ? 'border-slate-900 bg-slate-50' : 'border-slate-250 bg-white hover:border-slate-400'
       }`}
      >
       {isImporting ? (
        <div className="space-y-3 py-6 text-slate-600">
         <RefreshCw className="animate-spin mx-auto text-slate-800" size={24} />
         <p className="text-xs font-semibold">Processando arquivo e carregando lançamentos bancários...</p>
        </div>
       ) : (
        <div className="space-y-3">
         <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto shadow-xs">
          <UploadCloud size={20} />
         </div>
         <div>
          <p className="text-xs font-semibold text-ink-900">Arraste seu arquivo bancário (.OFX / .CSV / .XLSX) aqui</p>
          <p className="text-[10px] text-ink-600 mt-1">Você também pode enviar planilhas de transações</p>
         </div>
         <div>
          <button
           id="btn-upload-extract"
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

   {/* Visual Chart Panel */}
   <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm">
    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
     <BarChart3 size={14} className="text-amber-500" /> Curva de Evolução Financeira Semestral
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

   {/* Control Filters Bar */}
   <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
     
     <div className="relative flex-1 max-w-md">
      <input
       type="text"
       placeholder="Buscar por categoria ou fornecedor/cliente..."
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
      <option value="all">Receitas e Despesas</option>
      <option value="income">Apenas Receitas (Entradas)</option>
      <option value="expense">Apenas Despesas (Saídas)</option>
     </select>
    </div>

    <button
     id="btn-new-transaction"
     onClick={handleOpenAdd}
     className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
    >
     <Plus size={14} /> Lançar Movimentação
    </button>
   </div>

   {/* Ledger Table */}
   <div className="bg-white border border-slate-200/85 rounded-2xl shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
     <table className="w-full min-w-[800px] text-left text-xs">
      <thead>
       <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/40 ">
        <th className="p-4 font-bold text-[10px]">Data</th>
        <th className="p-4 font-bold text-[10px]">Tipo</th>
        <th className="p-4 font-bold text-[10px]">Categoria</th>
        <th className="p-4 font-bold text-[10px]">Origem / Destinatário</th>
        <th className="p-4 font-bold text-[10px]">Método</th>
        <th className="p-4 font-bold text-[10px]">Valor Lançado</th>
        <th className="p-4 font-bold text-[10px] text-right">Ação</th>
       </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 ">
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
         <td className="p-4 font-bold text-slate-800 ">{t.category}</td>
         <td className="p-4 font-medium text-slate-600 ">{t.contactName}</td>
         <td className="p-4 uppercase font-bold text-slate-500 flex items-center gap-1.5">
          <CreditCard size={11} className="text-slate-400" /> {t.paymentMethod}
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
         <td colSpan={7} className="p-8 text-center text-slate-400">
          Nenhuma movimentação financeira encontrada.
         </td>
        </tr>
       )}
      </tbody>
     </table>
    </div>
   </div>

   {/* MODAL TRANSACTION FORM */}
   {showAddModal && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
     <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up">
      <div className="h-14 border-b border-slate-150 px-6 flex items-center justify-between">
       <h3 className="font-bold text-sm text-slate-900 ">Lançar Movimentação Financeira</h3>
       <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
      </div>

      <form onSubmit={handleSaveAdd} className="p-6 space-y-4">
       
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

       <div className="pt-4 border-t border-slate-150 flex justify-end gap-3">
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
