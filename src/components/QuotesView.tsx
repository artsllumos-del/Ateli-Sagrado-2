import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Quote, QuoteItem, QuoteStatus } from '../types/erp';
import { 
  Search, Plus, Edit3, Trash2, X, FileText, User, ShoppingBag, 
  Copy, CheckSquare, Printer, Send, Calendar, ArrowRight, MoreVertical, Sparkles, AlertTriangle,
  ArrowLeft, Check, Loader2
} from 'lucide-react';
import { toast } from './Toast';
import { jsPDF } from 'jspdf';
import { getPdfThemeColors } from '../utils/theme';

const loadLogoBase64 = (logoUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!logoUrl || logoUrl.trim() === '' || logoUrl === '📿') {
      resolve('data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR42mP8DwABAQEAWk1vMwAAAABJRU5ErkJggg==');
      return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
          return;
        }
      } catch (e) {
        console.warn("Canvas conversion failed", e);
      }
      resolve(logoUrl);
    };
    img.onerror = function() {
      resolve('data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR42mP8DwABAQEAWk1vMwAAAABJRU5ErkJggg==');
    };
    img.src = logoUrl;
  });
};

export const QuotesView: React.FC = () => {
  const { 
    quotes, 
    clients, 
    products, 
    inventory,
    addQuote, 
    updateQuote, 
    deleteQuote, 
    duplicateQuote, 
    convertToOrder,
    settings
  } = useDb();

  // Component Screens: 'list' | 'add' | 'edit' | 'delete' | 'conversion-error'
  const [activeScreen, setActiveScreen] = useState<'list' | 'add' | 'edit' | 'delete' | 'conversion-error'>('list');

  // Preserve filters in parent state
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Selected Quote for editing, deleting, etc.
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; code: string } | null>(null);
  const [conversionError, setConversionError] = useState<{ 
    quoteCode: string; 
    error: string; 
    missingMaterials: { name: string; required: number; available: number; unit: string }[] 
  } | null>(null);

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

  const checkQuoteStock = (
    quoteItems: QuoteItem[],
    quoteId: string | null,
    targetStatus?: QuoteStatus
  ): {
    isValid: boolean;
    missingMaterials: { name: string; required: number; available: number; unit: string }[];
  } => {
    if (targetStatus && !(targetStatus === 'pending' || targetStatus === 'analysis' || targetStatus === 'approved')) {
      return { isValid: true, missingMaterials: [] };
    }

    const requiredMaterials: Record<string, number> = {};
    for (const item of quoteItems) {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.composition) {
        for (const comp of prod.composition) {
          if (!requiredMaterials[comp.materialId]) {
            requiredMaterials[comp.materialId] = 0;
          }
          requiredMaterials[comp.materialId] += comp.quantity * item.quantity;
        }
      }
    }

    const missing: { name: string; required: number; available: number; unit: string }[] = [];

    for (const matId of Object.keys(requiredMaterials)) {
      const requiredQty = requiredMaterials[matId];
      const mat = inventory.find(m => m.id === matId);
      if (!mat) continue;

      let currentlyReservedByThisQuote = 0;
      if (quoteId) {
        const existingQuote = quotes.find(q => q.id === quoteId);
        if (existingQuote && !existingQuote.isDeleted && 
            (existingQuote.status === 'pending' || existingQuote.status === 'analysis' || existingQuote.status === 'approved')) {
          existingQuote.items.forEach(qi => {
            const prod = products.find(p => p.id === qi.productId);
            if (prod && prod.composition) {
              prod.composition.forEach(comp => {
                if (comp.materialId === matId) {
                  currentlyReservedByThisQuote += comp.quantity * qi.quantity;
                }
              });
            }
          });
        }
      }

      const availableForValidation = (mat.available ?? mat.quantity) + currentlyReservedByThisQuote;

      if (requiredQty > availableForValidation) {
        missing.push({
          name: mat.name,
          required: Number(requiredQty.toFixed(2)),
          available: Number(availableForValidation.toFixed(2)),
          unit: mat.unit
        });
      }
    }

    return {
      isValid: missing.length === 0,
      missingMaterials: missing
    };
  };

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
    setActiveScreen('add');
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
    setActiveScreen('edit');
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

    const validation = checkQuoteStock(items, null, status);
    if (!validation.isValid) {
      toast.error(
        "Insumos Insuficientes",
        `Insumos insuficientes em estoque para os itens selecionados: ${validation.missingMaterials.map(m => m.name).join(', ')}`
      );
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
    setActiveScreen('list');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote) return;

    if (items.length === 0) {
      toast.error("Validação", "O orçamento precisa de pelo menos 1 item.");
      return;
    }

    const validation = checkQuoteStock(items, selectedQuote.id, status);
    if (!validation.isValid) {
      toast.error(
        "Insumos Insuficientes",
        `Insumos insuficientes em estoque para as alterações: ${validation.missingMaterials.map(m => m.name).join(', ')}`
      );
      return;
    }

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
    setActiveScreen('list');
  };

  const handleConvertToOrder = (q: Quote) => {
    if (q.status === 'converted') {
      toast.info("Aviso", "Este orçamento já foi convertido em pedido anteriormente.");
      return;
    }
    const result = convertToOrder(q.id);
    if (!result.success) {
      setConversionError({
        quoteCode: q.id.substring(6, 11).toUpperCase(),
        error: result.error || 'Erro na conversão',
        missingMaterials: result.missingMaterials || []
      });
      setActiveScreen('conversion-error');
      return;
    }
    toast.success("Sucesso!", `Orçamento convertido em Pedido! Produção iniciada.`);
  };

  const handleDuplicate = (id: string) => {
    duplicateQuote(id);
    toast.success("Duplicado!", "Orçamento duplicado com status 'Pendente'.");
  };

  const handleDelete = (id: string, code: string) => {
    setDeleteConfirm({ id, code });
    setActiveScreen('delete');
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    deleteQuote(deleteConfirm.id);
    toast.warning("Orçamento removido", `Orçamento ${deleteConfirm.code} foi deletado do sistema.`);
    setDeleteConfirm(null);
    setActiveScreen('list');
  };

  // Automated PDF generation and instant download in A4 format
  const handleDownloadPdf = async (q: Quote) => {
    toast.info("Processando", "Gerando arquivo PDF da proposta de orçamento...");
    try {
      const pdfTheme = getPdfThemeColors(settings.primaryColor);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const client = clients.find(c => c.id === q.clientId);
      const compName = q.snapshot?.companyName || settings.companyName || "Ateliê Sagrado";
      const compAddress = q.snapshot?.address || settings.address || "Rua das Rosas, 108, São Paulo - SP";
      const compPhone = q.snapshot?.phone || settings.phone || "(11) 98765-4321";
      const compEmail = q.snapshot?.email || settings.email || "artsllumos@gmail.com";

      const marginX = 15;
      let currentY = 15;

      // 1. Inserir Logotipo personalizado se disponível
      if (settings.docLogo && settings.docLogo !== '📿') {
        try {
          const logoBase64 = await loadLogoBase64(settings.docLogo);
          if (logoBase64 && logoBase64.startsWith('data:image')) {
            doc.addImage(logoBase64, 'PNG', marginX, currentY, 20, 20);
            currentY += 24;
          }
        } catch (e) {
          console.warn("Logo draw failed", e);
          currentY += 5;
        }
      } else {
        // Fine brand top bar
        doc.setFillColor(pdfTheme.primaryRgb[0], pdfTheme.primaryRgb[1], pdfTheme.primaryRgb[2]);
        doc.rect(marginX, currentY, 180, 2, 'F');
        currentY += 8;
      }

      // Brand Typography
      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text(compName, marginX, currentY);

      // Label on the right
      doc.setTextColor(pdfTheme.titleRgb[0], pdfTheme.titleRgb[1], pdfTheme.titleRgb[2]);
      doc.setFontSize(11);
      doc.text("PROPOSTA DE ORÇAMENTO", 195, currentY, { align: 'right' });

      currentY += 5;

      // Header Adicional das Configurações
      if (settings.docHeader) {
        doc.setTextColor(100, 116, 139);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(settings.docHeader, marginX, currentY);
        currentY += 4;
      }

      // Contact & CNPJ details
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Tel: ${compPhone} | Email: ${compEmail}`, marginX, currentY);

      // Quote details on the right
      const refCode = `Q-${q.id.substring(6, 11).toUpperCase()}`;
      doc.setTextColor(51, 65, 85);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Orçamento: ${refCode}`, 195, currentY, { align: 'right' });

      currentY += 4;
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(compAddress, marginX, currentY);
      doc.text(`Emissão: ${q.date}`, 195, currentY, { align: 'right' });

      currentY += 10;

      // Simple elegant divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, currentY, 195, currentY);
      
      currentY += 8;

      // Recipient details box
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, currentY, 180, 24, 'F');
      
      doc.setTextColor(100, 116, 139);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text("DADOS DO DESTINATÁRIO", marginX + 4, currentY + 5);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(q.clientName, marginX + 4, currentY + 11);

      doc.setTextColor(71, 85, 105);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`E-mail: ${client?.email || '-'}`, marginX + 4, currentY + 16);
      doc.text(`WhatsApp: ${client?.whatsapp || client?.phone || '-'}`, marginX + 4, currentY + 21);

      currentY += 32;

      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, currentY, 180, 7, 'F');

      doc.setTextColor(71, 85, 105);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text("Item / Descrição do Produto", marginX + 3, currentY + 5);
      doc.text("Qtd", marginX + 110, currentY + 5, { align: 'center' });
      doc.text("Preço Unit.", marginX + 140, currentY + 5, { align: 'right' });
      doc.text("Total Item", marginX + 177, currentY + 5, { align: 'right' });

      currentY += 7;

      // Table Row Items
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      (q.items || []).forEach((item) => {
        doc.setDrawColor(241, 245, 249);
        doc.line(marginX, currentY, 195, currentY);
        
        doc.text(item.productName, marginX + 3, currentY + 6);
        doc.text(item.quantity.toString(), marginX + 110, currentY + 6, { align: 'center' });
        doc.text(`R$ ${item.unitPrice.toFixed(2)}`, marginX + 140, currentY + 6, { align: 'right' });
        
        doc.setFont('Helvetica', 'bold');
        doc.text(`R$ ${item.total.toFixed(2)}`, marginX + 177, currentY + 6, { align: 'right' });
        doc.setFont('Helvetica', 'normal');

        currentY += 9;
      });

      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, currentY, 195, currentY);

      currentY += 8;

      // Financial details summary
      const calcX = 135;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);

      doc.text("Subtotal", calcX, currentY);
      doc.text(`R$ ${q.subtotal.toFixed(2)}`, 195, currentY, { align: 'right' });
      currentY += 5;

      if (q.discount > 0) {
        doc.setTextColor(225, 29, 72);
        doc.text("Desconto Especial", calcX, currentY);
        doc.text(`- R$ ${q.discount.toFixed(2)}`, 195, currentY, { align: 'right' });
        currentY += 5;
        doc.setTextColor(100, 116, 139);
      }

      if (q.shipping > 0) {
        doc.text("Frete / Entrega", calcX, currentY);
        doc.text(`+ R$ ${q.shipping.toFixed(2)}`, 195, currentY, { align: 'right' });
        currentY += 5;
      }

      currentY += 2;
      doc.setFillColor(pdfTheme.lightRgb[0], pdfTheme.lightRgb[1], pdfTheme.lightRgb[2]);
      doc.rect(calcX - 5, currentY - 4, 65, 9, 'F');

      doc.setTextColor(pdfTheme.titleRgb[0], pdfTheme.titleRgb[1], pdfTheme.titleRgb[2]);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("TOTAL GERAL", calcX, currentY + 2);
      doc.text(`R$ ${q.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 195, currentY + 2, { align: 'right' });

      currentY += 20;

      // Observações do Documento (Configurações)
      if (settings.docNotes) {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("Observações:", marginX, currentY);
        currentY += 4;
        const splitNotes = doc.splitTextToSize(settings.docNotes, 180);
        doc.text(splitNotes, marginX, currentY);
        currentY += splitNotes.length * 4;
      }

      // Mensagem Final do Documento (Configurações)
      if (settings.docFinalMessage) {
        currentY += 5;
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`"${settings.docFinalMessage}"`, 105, currentY, { align: 'center' });
        currentY += 8;
      } else {
        currentY += 5;
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text("Proposta de orçamento válida por 10 dias úteis", 105, currentY, { align: 'center' });
        currentY += 8;
      }

      // Elegant technical sign area
      currentY += 10;
      doc.setDrawColor(203, 213, 225);
      doc.line(70, currentY, 140, currentY);
      currentY += 4;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(settings.docSignature || "Ateliê Sagrado - Responsável Técnico", 105, currentY, { align: 'center' });

      // Rodapé das Configurações
      if (settings.docFooter) {
        currentY += 8;
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(settings.docFooter, 105, currentY, { align: 'center' });
      }

      doc.save(`Orcamento_${refCode}.pdf`);
      toast.success("PDF Baixado!", `Arquivo Orcamento_${refCode}.pdf salvo com sucesso!`);
    } catch (err) {
      console.error(err);
      toast.error("Erro", "Ocorreu um problema ao gerar o PDF.");
    }
  };

  const handleShareWhatsApp = (q: Quote) => {
    // 1. Generate and download PDF instantly for easy manual attachment
    handleDownloadPdf(q);

    // 2. Format a professional notification text message
    const client = clients.find(c => c.id === q.clientId);
    const refCode = `Q-${q.id.substring(6, 11).toUpperCase()}`;
    const text = `Olá *${q.clientName}*, aqui é do *Ateliê Sagrado*! ✨\n\nGeramos a proposta oficial do seu orçamento *${refCode}* em arquivo PDF de alta definição, que foi baixado automaticamente para o seu dispositivo agora mesmo!\n\n*Resumo da Proposta:*\n` +
      `• *Total Geral:* R$ ${q.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
      `Estou lhe enviando esta notificação para que você possa anexar e me retornar o arquivo PDF para aprovação ou tirar suas dúvidas! 🙌`;

    navigator.clipboard.writeText(text);
    toast.success("Mensagem Copiada!", "Texto para o WhatsApp copiado. Anexe o PDF que foi baixado.");
    
    const url = `https://api.whatsapp.com/send?phone=${client?.whatsapp || ''}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">

      {/* 1. LIST SCREEN */}
      {activeScreen === 'list' && (
        <div className="space-y-6 animate-slide-in-up">
          {/* Filters Bar */}
          <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none cursor-pointer"
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

          {/* Table container */}
          <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/40">
                    <th className="p-4 font-bold text-[10px]">Cód Ref</th>
                    <th className="p-4 font-bold text-[10px]">Cliente</th>
                    <th className="p-4 font-bold text-[10px]">Data de Emissão</th>
                    <th className="p-4 font-bold text-[10px]">Qtd Itens</th>
                    <th className="p-4 font-bold text-[10px]">Total Geral</th>
                    <th className="p-4 font-bold text-[10px]">Status</th>
                    <th className="p-4 font-bold text-[10px] text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuotes.map(q => {
                    const totalItemsQty = q.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-500">Q-{q.id.substring(6, 11).toUpperCase()}</td>
                        <td className="p-4 font-bold text-slate-800">{q.clientName}</td>
                        <td className="p-4 font-medium text-slate-500">{q.date}</td>
                        <td className="p-4 font-medium text-slate-700">{totalItemsQty} itens</td>
                        <td className="p-4 font-bold font-mono text-slate-900">
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
                              onClick={() => handleDownloadPdf(q)}
                              title="Baixar Orçamento em PDF"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-indigo-500 cursor-pointer transition-all duration-200 active:scale-95"
                            >
                              <Printer size={12} />
                            </button>
                            <button
                              onClick={() => handleShareWhatsApp(q)}
                              title="Enviar por WhatsApp"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-emerald-500 cursor-pointer transition-all duration-200 active:scale-95"
                            >
                              <Send size={12} />
                            </button>
                            <button
                              onClick={() => {
                                duplicateQuote(q.id);
                                toast.success("Duplicado!", "Orçamento duplicado com status 'Pendente'.");
                              }}
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
                              onClick={() => handleDelete(q.id, q.id.substring(6, 11).toUpperCase())}
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
      )}

      {/* 2. ADD & EDIT SCREENS */}
      {(activeScreen === 'add' || activeScreen === 'edit') && (
        <div className="max-w-4xl mx-auto space-y-6 animate-slide-in-up">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
            <div>
              <button
                type="button"
                onClick={() => setActiveScreen('list')}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors cursor-pointer mb-1.5"
              >
                <ArrowLeft size={14} /> Voltar para Orçamentos
              </button>
              <h2 className="font-serif font-bold text-lg text-slate-900 tracking-tight">
                {activeScreen === 'add' ? 'Criar Proposta de Orçamento' : 'Editar Proposta de Orçamento'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-1">
                Simule preços de venda com base nos custos de insumos e margens do seu ateliê.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveScreen('list')}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const form = document.getElementById('quote-form') as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-all hover:bg-slate-800 shadow-md active:scale-95"
              >
                {activeScreen === 'add' ? 'Salvar Orçamento' : 'Salvar Alterações'}
              </button>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-150 rounded-2xl shadow-xs p-6 sm:p-8">
            <form id="quote-form" onSubmit={activeScreen === 'add' ? handleSaveAdd : handleSaveEdit} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Client selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Cliente Destinatário *</label>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-850 font-medium focus:ring-2 focus:ring-amber-500/10 focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>Selecione o Cliente</option>
                    {activeClients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Status selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Status Proposta *</label>
                  <select
                    required
                    value={status}
                    onChange={(e) => setStatus(e.target.value as QuoteStatus)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-850 font-medium focus:ring-2 focus:ring-amber-500/10 focus:outline-none cursor-pointer"
                  >
                    <option value="pending">Aguardando Aprovação (Pendente)</option>
                    <option value="analysis">Em Análise Técnica</option>
                    <option value="approved">Aprovado pelo Cliente</option>
                    <option value="rejected">Rejeitado</option>
                    <option value="converted">Convertido em Pedido (Produção)</option>
                  </select>
                </div>
              </div>

              {/* Items Addition Box */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 space-y-4">
                <h3 className="font-serif font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <ShoppingBag size={14} className="text-amber-600" /> Adicionar Peças ao Orçamento
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Produto Artesanal</label>
                    <select
                      value={selectedProdId}
                      onChange={(e) => setSelectedProdId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none cursor-pointer font-medium"
                    >
                      <option value="" disabled>Escolha um produto cadastrado</option>
                      {activeProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — R$ {p.sellingPrice.toFixed(2)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <div className="w-20">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Qtd</label>
                      <input
                        type="number"
                        min="1"
                        value={selectedQty}
                        onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-850 font-bold text-center focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-3xs cursor-pointer text-[10px] flex items-center justify-center gap-1.5"
                    >
                      <Plus size={12} /> Adicionar
                    </button>
                  </div>
                </div>

                {/* Items List inside Form */}
                <div className="bg-white border border-slate-150 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/40 transition-colors">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-800 block truncate">{item.productName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          R$ {item.unitPrice.toFixed(2)} unit • {item.quantity} unidade(s)
                        </span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-bold font-mono text-slate-900 text-right min-w-20">
                          R$ {item.total.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          className="p-1 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {items.length === 0 && (
                    <p className="text-[10.5px] text-slate-400 italic py-4 text-center">
                      Nenhum item adicionado a esta proposta de orçamento ainda.
                    </p>
                  )}
                </div>
              </div>

              {/* Adjustments: Discount & Shipping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Desconto Especial (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0,00"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-850 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Frete / Custo Logístico (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shipping || ''}
                    onChange={(e) => setShipping(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0,00"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-850 font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Stock Validation Panel */}
              {items.length > 0 && (() => {
                const validation = checkQuoteStock(items, activeScreen === 'edit' ? selectedQuote?.id || null : null, status);
                if (!validation.isValid) {
                  return (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3 animate-fade-in">
                      <div className="flex items-center gap-2 text-rose-700 font-bold">
                        <AlertTriangle size={16} />
                        <span>Insumos Insuficientes para Produção</span>
                      </div>
                      <p className="text-[11px] text-rose-650 leading-relaxed">
                        Esta proposta de orçamento demanda mais matérias-primas do que o saldo disponível em estoque (considerando as reservas de outros orçamentos ativos). Ajuste as quantidades ou providencie a compra dos insumos abaixo antes de prosseguir.
                      </p>
                      <div className="divide-y divide-rose-100 bg-white rounded-xl border border-rose-100 p-3 max-h-48 overflow-y-auto">
                        {validation.missingMaterials.map((mat, i) => {
                          const missingQty = Number((mat.required - mat.available).toFixed(2));
                          return (
                            <div key={i} className="py-2.5 flex items-center justify-between gap-4 text-xs first:pt-0 last:pb-0">
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-slate-800 block truncate">{mat.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">Unidade: {mat.unit}</span>
                              </div>
                              <div className="text-right flex items-center gap-4">
                                <div className="text-[11px]">
                                  <span className="text-slate-400 block font-medium">Necessário</span>
                                  <span className="font-semibold text-slate-700">{mat.required}</span>
                                </div>
                                <div className="text-[11px]">
                                  <span className="text-slate-400 block font-medium">Disponível</span>
                                  <span className="font-semibold text-slate-700">{mat.available}</span>
                                </div>
                                <div className="text-[11px] bg-rose-50 px-2 py-1 rounded-md text-rose-700 font-bold border border-rose-100">
                                  <span className="text-[9px] text-rose-600 block leading-none font-medium font-sans">Falta</span>
                                  <span className="leading-normal font-mono">{missingQty}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-3 flex items-center gap-2 text-emerald-700 font-semibold text-[11px] animate-fade-in">
                      <Check size={14} className="text-emerald-600 shrink-0" />
                      <span>Todos os insumos estão disponíveis em estoque para esta proposta de orçamento (considerando as reservas).</span>
                    </div>
                  );
                }
              })()}

              {/* Totals Summary */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Calculado</span>
                  <p className="text-[11px] text-slate-550 font-medium">
                    Subtotal: R$ {subtotal.toFixed(2)} | Desconto: - R$ {discount.toFixed(2)} | Frete: + R$ {shipping.toFixed(2)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <strong className="text-lg font-serif font-black text-amber-600 font-mono">
                    R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveScreen('list')}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-500 cursor-pointer transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-md flex items-center gap-1.5"
                >
                  <Check size={14} />
                  {activeScreen === 'add' ? 'Adicionar Proposta' : 'Gravar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. DEDICATED DELETE CONFIRMATION SCREEN */}
      {activeScreen === 'delete' && deleteConfirm && (
        <div className="max-w-md mx-auto bg-white border border-slate-150 rounded-2xl shadow-xs p-6 space-y-4 animate-slide-in-up">
          <div className="flex items-center gap-3 text-amber-600">
            <div className="p-2 bg-amber-50 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <h3 className="font-serif font-bold text-base text-slate-900">Confirmar Exclusão</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Deseja realmente excluir o orçamento <strong className="text-slate-800">"{deleteConfirm.code}"</strong>? Esta ação removerá o registro permanentemente do sistema de controle.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setDeleteConfirm(null);
                setActiveScreen('list');
              }}
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
      )}

      {/* 4. DEDICATED CONVERSION ERROR SCREEN */}
      {activeScreen === 'conversion-error' && conversionError && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden animate-slide-in-up flex flex-col text-xs">
          <div className="bg-amber-50/50 border-b border-slate-100 p-5 flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-slate-900 leading-tight">Insumos Insuficientes</h3>
              <span className="text-[10px] text-amber-600 font-semibold tracking-wider uppercase font-mono">
                Bloqueio de Segurança — Estoque Inteligente
              </span>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              O orçamento <strong className="text-slate-900">#{conversionError.quoteCode}</strong> não pôde ser convertido em pedido porque a composição de seus produtos demanda mais matérias-primas do que o saldo atual disponível em estoque.
            </p>

            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3">
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block font-mono">
                Materiais Faltantes Calculados:
              </span>
              
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                {conversionError.missingMaterials.map((mat, i) => {
                  const missingQty = Number((mat.required - mat.available).toFixed(2));
                  return (
                    <div key={i} className="py-2.5 flex items-center justify-between gap-4 text-xs first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-800 block truncate">{mat.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Unidade: {mat.unit}</span>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div className="text-[11px]">
                          <span className="text-slate-400 block">Necessário</span>
                          <span className="font-semibold text-slate-700">{mat.required}</span>
                        </div>
                        <div className="text-[11px]">
                          <span className="text-slate-400 block">Disponível</span>
                          <span className="font-semibold text-slate-700">{mat.available}</span>
                        </div>
                        <div className="text-[11px] bg-amber-50 px-2 py-1 rounded-md text-amber-700 font-bold border border-amber-100/60">
                          <span className="text-[9px] text-amber-600 block leading-none font-medium">Faltam</span>
                          <span className="leading-normal">{missingQty}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-[#446C94] bg-[#EDF3F9] px-3 py-2.5 rounded-lg border border-[#446C94]/15 leading-relaxed flex items-start gap-2">
              <span className="font-bold text-sm leading-none mt-0.5">ℹ</span>
              <span>
                <strong>Dica do Sistema:</strong> Registre uma compra no painel de Estoque ou confira as necessidades totais no dashboard de <strong>"Compras Necessárias"</strong> para restabelecer os saldos antes de prosseguir com a produção.
              </span>
            </p>
          </div>

          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={() => {
                setConversionError(null);
                setActiveScreen('list');
              }}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition-all duration-150 active:scale-95"
            >
              Compreendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
