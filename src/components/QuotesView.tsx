import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { Quote, QuoteItem, QuoteStatus } from '../types/erp';
import { 
 Search, Plus, Edit3, Trash2, X, FileText, User, ShoppingBag, 
 Copy, CheckSquare, Printer, Send, Calendar, ArrowRight, MoreVertical, Sparkles, AlertTriangle,
 Maximize2, Minimize2, ArrowLeft
} from 'lucide-react';
import { toast } from './Toast';

export const QuotesView: React.FC = () => {
 const { quotes, clients, products, addQuote, updateQuote, deleteQuote, duplicateQuote, convertToOrder } = useDb();

 // Component States
 const [search, setSearch] = useState('');
 const [selectedStatus, setSelectedStatus] = useState<string>('all');
 const [showAddModal, setShowAddModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [showInvoiceModal, setShowInvoiceModal] = useState(false);
 const [isFullScreen, setIsFullScreen] = useState(false);
 const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
 const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; code: string } | null>(null);

 // Listen for keyboard shortcuts when previewing invoice
 useEffect(() => {
  if (!showInvoiceModal) return;

  const handleKeyDown = (e: KeyboardEvent) => {
   const isS = e.key.toLowerCase() === 's';
   const isP = e.key.toLowerCase() === 'p';
   const isMetaOrCtrl = e.ctrlKey || e.metaKey;

   if (isMetaOrCtrl && (isS || isP)) {
    e.preventDefault();
    toast.info("Atalho Ativado", "Gerando visualização de impressão / PDF...");
    setTimeout(() => {
     handlePrint();
    }, 150);
   }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => {
   window.removeEventListener('keydown', handleKeyDown);
  };
 }, [showInvoiceModal]);

 // Form states
 const [clientId, setClientId] = useState('');
 const [discount, setDiscount] = useState(0);
 const [shipping, setShipping] = useState(0);
 const [status, setStatus] = useState<QuoteStatus>('pending');
 const [items, setItems] = useState<QuoteItem[]>([]);

 // Item selector states
 const [selectedProdId, setSelectedProdId] = useState('');
 const [selectedQty, setSelectedQty] = useState(1);

 const activeQuotes = quotes.filter(q => !q.isDeleted);
 const activeClients = clients.filter(c => !c.isDeleted);
 const activeProducts = products.filter(p => !p.isDeleted);

 // Filter quotes
 const filteredQuotes = activeQuotes.filter(q => {
 const matchesSearch = q.clientName.toLowerCase().includes(search.toLowerCase()) || 
 q.id.toLowerCase().includes(search.toLowerCase());
 const matchesStatus = selectedStatus === 'all' || q.status === selectedStatus;
 return matchesSearch && matchesStatus;
 });

 // Calculate items sum
 const subtotal = items.reduce((sum, item) => sum + item.total, 0);
 const total = subtotal - discount + shipping;

 const handleOpenAdd = () => {
 setClientId(activeClients[0]?.id || '');
 setDiscount(0);
 setShipping(0);
 setStatus('pending');
 setItems([]);
 setSelectedProdId(activeProducts[0]?.id || '');
 setSelectedQty(1);
 setShowAddModal(true);
 };

 const handleOpenEdit = (q: Quote) => {
 setSelectedQuote(q);
 setClientId(q.clientId);
 setDiscount(q.discount);
 setShipping(q.shipping);
 setStatus(q.status);
 setItems(q.items || []);
 setSelectedProdId(activeProducts[0]?.id || '');
 setSelectedQty(1);
 setShowEditModal(true);
 };

 const handleAddItem = () => {
 if (!selectedProdId) return;
 const prod = products.find(p => p.id === selectedProdId);
 if (!prod) return;

 // Check if product already exists in item list
 const existing = items.find(item => item.productId === selectedProdId);
 if (existing) {
 toast.warning("Produto duplicado", "O produto já consta na lista de itens do orçamento.");
 return;
 }

 const newItem: QuoteItem = {
 productId: selectedProdId,
 productName: prod.name,
 quantity: selectedQty,
 unitPrice: prod.sellingPrice,
 total: selectedQty * prod.sellingPrice
 };

 setItems([...items, newItem]);
 toast.success("Item adicionado", `${prod.name} x ${selectedQty}`);
 };

 const handleRemoveItem = (prodId: string) => {
 setItems(items.filter(item => item.productId !== prodId));
 };

 const handleSaveAdd = (e: React.FormEvent) => {
 e.preventDefault();
 if (!clientId) {
 toast.error("Validação", "Selecione um cliente para vincular ao orçamento.");
 return;
 }
 if (items.length === 0) {
 toast.error("Validação", "O orçamento precisa de pelo menos 1 item.");
 return;
 }

 const client = clients.find(c => c.id === clientId);
 addQuote({
 clientId,
 clientName: client?.name || "Cliente Desconhecido",
 items,
 subtotal,
 discount,
 shipping,
 total,
 status,
 date: new Date().toISOString().split('T')[0]
 });

 toast.success("Orçamento gerado!", `Orçamento para ${client?.name} salvo com sucesso.`);
 setShowAddModal(false);
 };

 const handleSaveEdit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedQuote) return;

 const client = clients.find(c => c.id === clientId);
 updateQuote(selectedQuote.id, {
 clientId,
 clientName: client?.name || "Cliente Desconhecido",
 items,
 subtotal,
 discount,
 shipping,
 total,
 status
 });

 toast.success("Orçamento salvo!", `As modificações foram gravadas com sucesso.`);
 setShowEditModal(false);
 };

 const handleConvertToOrder = (q: Quote) => {
 if (q.status === 'converted') {
 toast.info("Aviso", "Este orçamento já foi convertido em pedido anteriormente.");
 return;
 }
 convertToOrder(q.id);
 toast.success("Sucesso!", `Orçamento convertido em Pedido! Produção iniciada.`);
 };

 const handleDuplicate = (id: string) => {
 duplicateQuote(id);
 toast.success("Duplicado!", "Orçamento duplicado com status 'Pendente'.");
 };

 const handleDelete = (id: string, code: string) => {
 setDeleteConfirm({ id, code });
 };

 const handleConfirmDelete = () => {
 if (!deleteConfirm) return;
 deleteQuote(deleteConfirm.id);
 toast.warning("Orçamento removido", `Orçamento ${deleteConfirm.code} foi deletado do sistema.`);
 setDeleteConfirm(null);
 };

 const handleShareWhatsApp = (q: Quote) => {
 const client = clients.find(c => c.id === q.clientId);
 const text = `Olá *${q.clientName}*, aqui é do *Ateliê Sagrado*! ✨\n\nSegue a proposta do seu orçamento:\n\n` +
 q.items.map(item => `📦 *${item.productName}*\nQtd: ${item.quantity} × R$ ${item.unitPrice.toFixed(2)}`).join('\n') +
 `\n\n*Subtotal:* R$ ${q.subtotal.toFixed(2)}` +
 (q.discount > 0 ? `\n*Desconto:* R$ ${q.discount.toFixed(2)}` : '') +
 (q.shipping > 0 ? `\n*Frete:* R$ ${q.shipping.toFixed(2)}` : '') +
 `\n*Total Geral:* R$ ${q.total.toFixed(2)}\n\nAguardamos seu retorno para iniciarmos a montagem! 🙌`;

 navigator.clipboard.writeText(text);
 toast.success("Mensagem Copiada!", "Texto de compartilhamento para WhatsApp copiado para a área de transferência.");
 
 const url = `https://api.whatsapp.com/send?phone=${client?.whatsapp || ''}&text=${encodeURIComponent(text)}`;
 window.open(url, '_blank');
 };

 const handlePrint = () => {
 window.print();
 };

 return (
 <div className="space-y-6 animate-slide-in-up">
 
 <div className="space-y-6 no-print">
 {/* Control Filters Bar */}
 <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
 
 <div className="relative flex-1 max-w-md">
 <input
 type="text"
 placeholder="Buscar por nome do cliente ou ID..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
 />
 <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
 </div>

 <select
 value={selectedStatus}
 onChange={(e) => setSelectedStatus(e.target.value)}
 className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
 >
 <option value="all">Todos os Status</option>
 <option value="pending">Aguardando Aprovação</option>
 <option value="analysis">Em Análise</option>
 <option value="approved">Aprovado</option>
 <option value="rejected">Rejeitado</option>
 <option value="converted">Convertido em Pedido</option>
 </select>
 </div>

 <button
 onClick={handleOpenAdd}
 className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
 >
 <Plus size={14} /> Novo Orçamento
 </button>
 </div>

 {/* Table grid of Quotes */}
 <div className="bg-white border border-slate-200/85 rounded-2xl shadow-sm overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full min-w-[800px] text-left text-xs">
 <thead>
 <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/40 ">
 <th className="p-4 font-bold text-[10px]">Cód Ref</th>
 <th className="p-4 font-bold text-[10px]">Cliente</th>
 <th className="p-4 font-bold text-[10px]">Data de Emissão</th>
 <th className="p-4 font-bold text-[10px]">Qtd Itens</th>
 <th className="p-4 font-bold text-[10px]">Total Geral</th>
 <th className="p-4 font-bold text-[10px]">Status</th>
 <th className="p-4 font-bold text-[10px] text-right">Ações</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {filteredQuotes.map(q => {
 const totalItemsQty = q.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

 return (
 <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
 <td className="p-4 font-mono font-bold text-slate-500">Q-{q.id.substring(6, 11).toUpperCase()}</td>
 <td className="p-4 font-bold text-slate-800 ">{q.clientName}</td>
 <td className="p-4 font-medium text-slate-500">{q.date}</td>
 <td className="p-4 font-medium text-slate-700 ">{totalItemsQty} itens</td>
 <td className="p-4 font-bold font-mono text-slate-900 ">
 R$ {q.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
 </td>
 <td className="p-4">
 <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
 q.status === 'converted' ? 'bg-emerald-500/10 text-emerald-600' :
 q.status === 'approved' ? 'bg-blue-500/10 text-blue-600' :
 q.status === 'rejected' ? 'bg-rose-500/10 text-rose-600' :
 q.status === 'analysis' ? 'bg-indigo-500/10 text-indigo-550' :
 'bg-amber-500/10 text-amber-600'
 }`}>
 {q.status === 'converted' ? 'CONVERTIDO' :
 q.status === 'approved' ? 'APROVADO' :
 q.status === 'rejected' ? 'REJEITADO' :
 q.status === 'analysis' ? 'ANÁLISE' : 'PENDENTE'}
 </span>
 </td>
 <td className="p-4 text-right">
 <div className="flex justify-end gap-2">
 {q.status !== 'converted' && (
 <button
 onClick={() => handleConvertToOrder(q)}
 title="Converter em Pedido"
 className="p-1.5 rounded-lg border border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-emerald-500 cursor-pointer transition-all duration-200 active:scale-95"
 >
 <ArrowRight size={12} />
 </button>
 )}
 <button
 onClick={() => { setSelectedQuote(q); setShowInvoiceModal(true); }}
 title="Gerar PDF / Imprimir"
 className="p-1.5 rounded-lg border border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-indigo-500 cursor-pointer transition-all duration-200 active:scale-95"
 >
 <Printer size={12} />
 </button>
 <button
 onClick={() => handleShareWhatsApp(q)}
 title="Enviar WhatsApp"
 className="p-1.5 rounded-lg border border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-emerald-500 cursor-pointer transition-all duration-200 active:scale-95"
 >
 <Send size={12} />
 </button>
 <button
 onClick={() => handleDuplicate(q.id)}
 title="Duplicar Orçamento"
 className="p-1.5 rounded-lg border border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-amber-500 cursor-pointer transition-all duration-200 active:scale-95"
 >
 <Copy size={12} />
 </button>
 <button
 onClick={() => handleOpenEdit(q)}
 title="Editar"
 className="p-1.5 rounded-lg border border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-blue-500 cursor-pointer transition-all duration-200 active:scale-95"
 >
 <Edit3 size={12} />
 </button>
 <button
 onClick={() => handleDelete(q.id, q.quoteNumber)}
 title="Excluir"
 className="p-1.5 rounded-lg border border-slate-200 text-slate-650 hover:bg-rose-50 hover:text-rose-600 cursor-pointer transition-all duration-200 active:scale-95"
 >
 <Trash2 size={12} />
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 {filteredQuotes.length === 0 && (
 <tr>
 <td colSpan={7} className="p-8 text-center text-slate-400">
 Nenhum orçamento pendente ou gerado no sistema.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 </div>

 {/* MODALS INVOICE & CREATE */}

 {/* 1. PDF Invoice Print Mockup Modal */}
 {showInvoiceModal && selectedQuote && (
 <div className={isFullScreen 
   ? "fixed inset-0 bg-slate-50 z-[100] overflow-y-auto flex flex-col"
   : "fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
 }>
   <div className={isFullScreen
     ? "bg-slate-50 text-slate-900 w-full flex-1 flex flex-col animate-slide-in-up"
     : "bg-white text-slate-900 border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up max-h-[90vh] flex flex-col"
   }>
 <div className={isFullScreen
   ? "h-16 bg-slate-900 text-white px-6 flex items-center justify-between no-print sticky top-0 z-50 shadow-md"
   : "h-14 border-b border-slate-150 px-6 flex items-center justify-between no-print bg-slate-50"
 }>
   {isFullScreen ? (
     <div className="flex items-center gap-3">
       <button 
         onClick={() => setIsFullScreen(false)} 
         className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
         title="Voltar ao Painel"
       >
         <ArrowLeft size={14} /> Voltar
       </button>
       <span className="text-xs font-bold text-slate-400 border-l border-slate-700 pl-3 uppercase tracking-wider hidden sm:inline">
         Modo Tela Cheia (Salvar PDF / Imprimir)
       </span>
     </div>
   ) : (
     <h3 className="font-bold text-sm text-slate-800">Visualizar Proposta / Recibo</h3>
   )}

   <div className="flex gap-2 items-center">
     {isFullScreen && (
       <span className="hidden lg:inline text-xs text-slate-400 mr-2 bg-slate-800 border border-slate-700 px-3 py-1 rounded-md">
         💡 Pressione <kbd className="font-mono bg-slate-700 px-1 rounded text-white text-[11px]">Ctrl + S</kbd> para Salvar ou <kbd className="font-mono bg-slate-700 px-1 rounded text-white text-[11px]">Ctrl + P</kbd> para Imprimir
       </span>
     )}

     {!isFullScreen && (
       <button 
         onClick={() => setIsFullScreen(true)} 
         className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
         title="Ver em Tela Cheia"
       >
         <Maximize2 size={12} /> Tela Cheia
       </button>
     )}

     <button 
       onClick={handlePrint} 
       className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-200 active:scale-95 shadow-xs"
     >
       <Printer size={12} /> Imprimir / PDF
     </button>

     {isFullScreen ? (
       <button 
         onClick={() => { setIsFullScreen(false); setShowInvoiceModal(false); }} 
         className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-200 active:scale-95"
         title="Fechar visualização"
       >
         <X size={12} /> Sair
       </button>
     ) : (
       <button 
         onClick={() => setShowInvoiceModal(false)} 
         className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
       >
         <X size={18} />
       </button>
     )}
   </div>
 </div>

 {/* Print area */}
 <div className={isFullScreen
   ? "flex-1 p-4 md:p-8 bg-slate-100 overflow-y-auto"
   : "p-8 space-y-6 overflow-y-auto flex-1 print-area"
 } id="invoice-sheet-container">
   
   <div 
     id="invoice-sheet" 
     className={isFullScreen
       ? "bg-white max-w-3xl mx-auto border border-slate-200 shadow-xl rounded-2xl p-8 md:p-12 space-y-6 print:border-none print:shadow-none print:p-0 print:my-0"
       : "space-y-6"
     }
   >
 
 {/* Header Invoice block */}
 <div className="flex justify-between items-start border-b border-slate-150 pb-5">
 <div>
 <h2 className="text-xl font-bold font-display tracking-tight">Ateliê Sagrado</h2>
 <p className="text-[10px] text-slate-500 font-medium mt-1">CNPJ: 12.345.678/0001-90 | (11) 98765-4321</p>
 <p className="text-[10px] text-slate-500 font-medium">Rua das Rosas, 108, São Paulo - SP</p>
 </div>
 <div className="text-right">
 <h3 className="text-sm font-bold uppercase text-amber-600">PROPOSTA DE ORÇAMENTO</h3>
 <p className="text-xs font-bold font-mono text-slate-500 mt-1">Cód: Q-{selectedQuote.id.substring(6, 11).toUpperCase()}</p>
 <p className="text-[10px] text-slate-500 font-medium">Data Emissão: {selectedQuote.date}</p>
 </div>
 </div>

 {/* Client block */}
 <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-1">
 <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Dados do Destinatário</p>
 <p className="font-bold text-sm text-slate-800 mt-1">{selectedQuote.clientName}</p>
 <p className="text-slate-600 font-medium">E-mail: {clients.find(c => c.id === selectedQuote.clientId)?.email || '-'}</p>
 <p className="text-slate-600 font-medium">Contato: {clients.find(c => c.id === selectedQuote.clientId)?.whatsapp || '-'}</p>
 </div>

 {/* Items Table */}
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="border-b border-slate-200 text-slate-450 font-bold uppercase tracking-wider text-[10px]">
 <th className="py-2">Item / Descrição</th>
 <th className="py-2 text-center">Qtd</th>
 <th className="py-2 text-right">Preço Unit.</th>
 <th className="py-2 text-right font-mono">Total Item</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {selectedQuote.items?.map((item, idx) => (
 <tr key={idx}>
 <td className="py-3">
 <p className="font-bold text-slate-800 ">{item.productName}</p>
 </td>
 <td className="py-3 text-center font-bold text-slate-700 ">{item.quantity}</td>
 <td className="py-3 text-right text-slate-600 ">R$ {item.unitPrice.toFixed(2)}</td>
 <td className="py-3 text-right font-bold font-mono text-slate-900 ">R$ {item.total.toFixed(2)}</td>
 </tr>
 ))}
 </tbody>
 </table>

 {/* Total calculations sheet */}
 <div className="flex justify-end pt-4 border-t border-slate-150 ">
 <div className="w-64 space-y-2 text-xs">
 <div className="flex justify-between text-slate-500">
 <span>Subtotal</span>
 <span>R$ {selectedQuote.subtotal.toFixed(2)}</span>
 </div>
 {selectedQuote.discount > 0 && (
 <div className="flex justify-between text-rose-500">
 <span>Desconto Especial</span>
 <span>- R$ {selectedQuote.discount.toFixed(2)}</span>
 </div>
 )}
 {selectedQuote.shipping > 0 && (
 <div className="flex justify-between text-slate-500">
 <span>Frete / Remessa</span>
 <span>+ R$ {selectedQuote.shipping.toFixed(2)}</span>
 </div>
 )}
 <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 text-slate-900 ">
 <span>TOTAL GERAL</span>
 <span className="font-mono text-amber-600 ">R$ {selectedQuote.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
 </div>
 </div>
 </div>

 {/* Sign Line for craftsperson */}
 <div className="pt-12 text-center text-[10px] text-slate-450 max-w-xs mx-auto space-y-1">
 <div className="border-t border-slate-300 pt-2" />
 <p className="font-bold">Ateliê Sagrado - Responsável Técnico</p>
 <p>Obrigado pela preferência e confiança!</p>
 </div>

 </div>
 </div>
 </div>
 </div>
 )}

 {/* 2. Create / Edit Quote Form Workspace */}
 {(showAddModal || showEditModal) && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
 <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up max-h-[92vh] flex flex-col">
 <div className="h-14 border-b border-slate-150 px-6 flex items-center justify-between">
 <h3 className="font-bold text-sm text-slate-900 ">
 {showAddModal ? 'Criar Proposta de Orçamento' : 'Editar Orçamento'}
 </h3>
 <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
 </div>

 <form onSubmit={showAddModal ? handleSaveAdd : handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
 
 <div className="grid grid-cols-2 gap-4">
 
 {/* Client selector */}
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Selecionar Cliente Destinatário *</label>
 <select
 value={clientId}
 onChange={(e) => setClientId(e.target.value)}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
 >
 <option value="" disabled>Selecione um cliente...</option>
 {activeClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
 </select>
 </div>

 {/* Status selector */}
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status Inicial</label>
 <select
 value={status}
 onChange={(e) => setStatus(e.target.value as QuoteStatus)}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 >
 <option value="pending">Aguardando Aprovação (Pendente)</option>
 <option value="analysis">Em Análise</option>
 <option value="approved">Aprovado pelo Cliente</option>
 <option value="rejected">Rejeitado</option>
 </select>
 </div>

 {/* Shipping & Discount */}
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Valor de Frete / Remessa (R$)</label>
 <input
 type="number"
 min="0"
 value={shipping}
 onChange={(e) => setShipping(Number(e.target.value))}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850 font-mono"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Desconto Concedido (R$)</label>
 <input
 type="number"
 min="0"
 value={discount}
 onChange={(e) => setDiscount(Number(e.target.value))}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850 font-mono"
 />
 </div>
 </div>

 {/* Add item rows workspace */}
 <div className="pt-4 border-t border-slate-100 ">
 <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
 <ShoppingBag size={14} className="text-amber-500" /> Itens inclusos na proposta
 </h4>

 <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-xl flex items-end gap-3 mb-4">
 <div className="flex-1">
 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Escolher Joia / Terço Artesanal</label>
 <select
 value={selectedProdId}
 onChange={(e) => setSelectedProdId(e.target.value)}
 className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
 >
 {activeProducts.map(p => (
 <option key={p.id} value={p.id}>{p.name} (R$ {p.sellingPrice.toFixed(2)})</option>
 ))}
 </select>
 </div>
 <div className="w-24">
 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quantidade</label>
 <input
 type="number"
 min="1"
 value={selectedQty}
 onChange={(e) => setSelectedQty(Number(e.target.value))}
 className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-850 text-center"
 />
 </div>
 <button
 type="button"
 onClick={handleAddItem}
 className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg h-9"
 >
 + Vincular
 </button>
 </div>

 {/* List of active items in proposal */}
 <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 ">
 {items.map((item, idx) => (
 <div key={idx} className="flex justify-between items-center px-4 py-2 bg-slate-50/20 text-xs font-semibold">
 <div>
 <p className="text-slate-850 ">{item.productName}</p>
 <p className="text-[10px] text-slate-450 mt-0.5">Valor Unit: R$ {item.unitPrice.toFixed(2)}</p>
 </div>
 <div className="flex items-center gap-6">
 <p className="text-slate-650 font-bold">{item.quantity} un</p>
 <span className="font-mono text-slate-800 w-20 text-right">R$ {item.total.toFixed(2)}</span>
 <button
 type="button"
 onClick={() => handleRemoveItem(item.productId)}
 className="text-rose-500 hover:text-rose-600 font-bold text-lg px-2 cursor-pointer"
 >
 ×
 </button>
 </div>
 </div>
 ))}
 {items.length === 0 && (
 <p className="p-4 text-center text-slate-400 text-xs italic">Nenhum item adicionado à proposta. Escolha acima.</p>
 )}
 </div>

 {/* Subtotal summary worksheet */}
 <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end font-bold text-xs space-y-1">
 <div className="w-56 space-y-1">
 <div className="flex justify-between text-slate-500">
 <span>Subtotal de Itens:</span>
 <span>R$ {subtotal.toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-slate-500">
 <span>Ajustes (Frete - Desc):</span>
 <span>R$ {(shipping - discount).toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-slate-900 text-sm border-t border-slate-200 pt-1">
 <span>TOTAL PROPOSTO:</span>
 <span>R$ {total.toFixed(2)}</span>
 </div>
 </div>
 </div>

 </div>

 <div className="pt-4 border-t border-slate-150 flex justify-end gap-3">
 <button
 type="button"
 onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
 className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
 >
 {showAddModal ? 'Adicionar Orçamento' : 'Salvar Alterações'}
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
 Deseja realmente excluir o orçamento <strong className="text-slate-800">"{deleteConfirm.code}"</strong>? Esta ação removerá o registro permanentemente.
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
 Confirmar
 </button>
 </div>
 </div>
 </div>
 )}

 </div>
 );
};
