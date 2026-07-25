import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Order, OrderStatus, OrderItem } from '../types/erp';
import { 
  Search, Plus, Edit3, Trash2, ShoppingBag, Eye, Calendar, Clock, 
  ArrowLeft, Printer, Share2, Check, Copy, MessageSquare, AlertTriangle, Shield, X, Ban
} from 'lucide-react';
import { toast } from './Toast';
import { Pagination } from './Pagination';
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
        console.warn("Canvas conversion failed, using direct source", e);
      }
      resolve(logoUrl);
    };
    img.onerror = function() {
      resolve('data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR42mP8DwABAQEAWk1vMwAAAABJRU5ErkJggg==');
    };
    img.src = logoUrl;
  });
};

export const OrdersView: React.FC = () => {
  const { orders, clients, products, addOrder, updateOrder, deleteOrder, cancelOrder, settings } = useDb();

  // Screen State: 'list' | 'add' | 'edit' | 'detail' | 'print' | 'share'
  const [activeScreen, setActiveScreen] = useState<'list' | 'add' | 'edit' | 'detail' | 'print' | 'share'>('list');

  // Filters state (Preserved automatically during screen navigation because component doesn't unmount)
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Selected Order context
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  // Form Fields
  const [clientId, setClientId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<OrderStatus>('received');
  const [items, setItems] = useState<OrderItem[]>([]);

  // Items search workspace
  const [selectedProdId, setSelectedProdId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  const activeOrders = orders.filter(o => !o.isDeleted);
  const activeClients = clients.filter(c => !c.isDeleted);
  const activeProducts = products.filter(p => !p.isDeleted);

  // Automated PDF generation and instant download for Orders
  const handleDownloadPdf = async (o: Order) => {
    toast.info("Processando", "Gerando arquivo PDF do recibo do pedido...");
    try {
      const pdfTheme = getPdfThemeColors(settings.primaryColor);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const compName = o.snapshot?.companyName || settings.companyName || "Ateliê Sagrado";
      const compAddress = o.snapshot?.address || settings.address || "Rua das Rosas, 108, São Paulo - SP";
      const compPhone = o.snapshot?.phone || settings.phone || "(11) 98765-4321";
      const compEmail = o.snapshot?.email || settings.email || "artsllumos@gmail.com";

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
      doc.setFontSize(20);
      doc.text(compName, marginX, currentY);

      // Label on the right
      doc.setTextColor(pdfTheme.titleRgb[0], pdfTheme.titleRgb[1], pdfTheme.titleRgb[2]);
      doc.setFontSize(11);
      doc.text("RECIBO DE PEDIDO DE VENDA", 195, currentY, { align: 'right' });

      currentY += 5;

      // Header Adicional das Configurações
      if (settings.docHeader) {
        doc.setTextColor(100, 116, 139);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(settings.docHeader, marginX, currentY);
        currentY += 4;
      }

      // Contact details
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Tel: ${compPhone} | Email: ${compEmail}`, marginX, currentY);

      // Order details on the right
      doc.setTextColor(51, 65, 85);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Pedido: ${o.orderNumber}`, 195, currentY, { align: 'right' });

      currentY += 4;
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(compAddress, marginX, currentY);
      doc.text(`Emissão: ${new Date(o.date).toLocaleDateString('pt-BR')}`, 195, currentY, { align: 'right' });

      currentY += 10;

      // Divider line
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
      doc.text("DADOS DO CLIENTE", marginX + 4, currentY + 5);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(o.clientName, marginX + 4, currentY + 11);

      doc.setTextColor(71, 85, 105);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Prazo de Entrega Previsto: ${new Date(o.dueDate).toLocaleDateString('pt-BR')}`, marginX + 4, currentY + 16);
      doc.text(`Status do Pedido: ${getStatusLabel(o.status).toUpperCase()}`, marginX + 4, currentY + 21);

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

      (o.items || []).forEach((item) => {
        doc.setDrawColor(241, 245, 249);
        doc.line(marginX, currentY, 195, currentY);
        
        doc.text(item.productName, marginX + 3, currentY + 6);
        doc.text(item.quantity.toString(), marginX + 110, currentY + 6, { align: 'center' });
        doc.text(`R$ ${item.price.toFixed(2)}`, marginX + 140, currentY + 6, { align: 'right' });
        
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
      doc.text(`R$ ${o.totalValue.toFixed(2)}`, 195, currentY, { align: 'right' });
      currentY += 5;

      currentY += 2;
      doc.setFillColor(pdfTheme.lightRgb[0], pdfTheme.lightRgb[1], pdfTheme.lightRgb[2]);
      doc.rect(calcX - 5, currentY - 4, 65, 9, 'F');

      doc.setTextColor(pdfTheme.titleRgb[0], pdfTheme.titleRgb[1], pdfTheme.titleRgb[2]);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("TOTAL RECEBIDO", calcX, currentY + 2);
      doc.text(`R$ ${o.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 195, currentY + 2, { align: 'right' });

      currentY += 15;

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
      } else if (settings.phrases) {
        currentY += 5;
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`"${settings.phrases}"`, 105, currentY, { align: 'center' });
        currentY += 8;
      }

      // Elegant sign area (Configurações)
      currentY += 10;
      doc.setDrawColor(203, 213, 225);
      doc.line(70, currentY, 140, currentY);
      currentY += 4;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(settings.docSignature || "Assinatura de Recebimento", 105, currentY, { align: 'center' });

      // Rodapé das Configurações
      if (settings.docFooter) {
        currentY += 8;
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(settings.docFooter, 105, currentY, { align: 'center' });
      }

      doc.save(`Recibo_Pedido_${o.orderNumber}.pdf`);
      toast.success("PDF Baixado!", `Arquivo Recibo_Pedido_${o.orderNumber}.pdf salvo com sucesso!`);
    } catch (err) {
      console.error(err);
      toast.error("Erro", "Ocorreu um problema ao gerar o PDF do recibo.");
    }
  };

  // Pagination State
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(6);

  // Filter orders
  const filteredOrders = activeOrders.filter(o => {
    const matchesSearch = 
      o.clientName.toLowerCase().includes(search.toLowerCase()) || 
      o.orderNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || o.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const paginatedOrders = filteredOrders.slice(
    (ordersPage - 1) * ordersPerPage,
    ordersPage * ordersPerPage
  );

  const subtotalValue = items.reduce((sum, item) => sum + item.total, 0);

  // Navigations & Page transitions
  const handleOpenAdd = () => {
    setClientId(activeClients[0]?.id || '');
    setDueDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 10 days out
    setStatus('received');
    setItems([]);
    setSelectedProdId(activeProducts[0]?.id || '');
    setSelectedQty(1);
    setActiveScreen('add');
  };

  const handleOpenEdit = (o: Order) => {
    setSelectedOrder(o);
    setClientId(o.clientId);
    setDueDate(o.dueDate);
    setStatus(o.status);
    setItems(o.items || []);
    setSelectedProdId(activeProducts[0]?.id || '');
    setSelectedQty(1);
    setActiveScreen('edit');
  };

  const handleAddItem = () => {
    if (!selectedProdId) return;
    const prod = products.find(p => p.id === selectedProdId);
    if (!prod) return;

    const existing = items.find(item => item.productId === selectedProdId);
    if (existing) {
      toast.warning("Item Duplicado", "O produto já consta listado no pedido.");
      return;
    }

    const newItem: OrderItem = {
      productId: selectedProdId,
      productName: prod.name,
      quantity: selectedQty,
      price: prod.sellingPrice,
      total: selectedQty * prod.sellingPrice
    };

    setItems([...items, newItem]);
    toast.success("Item Vinculado", `${prod.name} x ${selectedQty}`);
  };

  const handleRemoveItem = (prodId: string) => {
    setItems(items.filter(item => item.productId !== prodId));
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Validação", "Selecione um cliente.");
      return;
    }
    if (items.length === 0) {
      toast.error("Validação", "O pedido precisa de pelo menos 1 item.");
      return;
    }

    const client = clients.find(c => c.id === clientId);
    const result = addOrder({
      clientId,
      clientName: client?.name || "Cliente",
      items,
      totalValue: subtotalValue,
      date: new Date().toISOString().split('T')[0],
      dueDate,
      status,
      productionProgress: 0
    });

    if (!result.success) {
      if (result.missingMaterials && result.missingMaterials.length > 0) {
        const missingDetails = result.missingMaterials.map(m => `• ${m.name} (Necessário: ${m.required} ${m.unit} | Disponível: ${m.available} ${m.unit})`).join('\n');
        toast.error(
          "Estoque Insuficiente",
          `Não foi possível concluir o pedido. Materiais insuficientes:\n${missingDetails}`
        );
      } else {
        toast.error("Erro ao registrar", result.error || "Erro desconhecido.");
      }
      return;
    }

    toast.success("Pedido Registrado!", "Venda confirmada e matérias-primas baixadas automaticamente.");
    setActiveScreen('list');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const client = clients.find(c => c.id === clientId);
    updateOrder(selectedOrder.id, {
      clientId,
      clientName: client?.name || "Cliente",
      items,
      totalValue: subtotalValue,
      dueDate,
      status
    });

    toast.success("Pedido Atualizado!", "Modificações salvas com absoluto sucesso.");
    setActiveScreen('list');
  };

  const handleStatusChange = (id: string, newStatus: OrderStatus) => {
    updateOrder(id, { status: newStatus });
    toast.success("Status Atualizado", `Pedido movido para "${getStatusLabel(newStatus)}".`);
  };

  const handleConfirmDelete = (id: string) => {
    deleteOrder(id);
    toast.warning("Pedido Arquivado", "O pedido de venda foi movido para os arquivos inativos.");
    setDeleteConfirmId(null);
  };

  const getStatusLabel = (s: OrderStatus): string => {
    const labels: Record<OrderStatus, string> = {
      received: 'Recebido',
      approved: 'Aprovado / Separação',
      production: 'Em Produção',
      finishing: 'Em Acabamento',
      packing: 'Embalagem',
      ready: 'Pronto p/ Entrega',
      completed: 'Concluído'
    };
    return labels[s] || s;
  };

  // Share Content Formatting
  const getShareText = (order: Order) => {
    const lines = [
      `*${order.snapshot?.companyName || settings.companyName || "Ateliê Sagrado"}*`,
      `*DETALHES DO SEU PEDIDO: ${order.orderNumber}*`,
      `-----------------------------------------`,
      `Cliente: ${order.clientName}`,
      `Data de Emissão: ${new Date(order.date).toLocaleDateString('pt-BR')}`,
      `Prazo Previsto: ${new Date(order.dueDate).toLocaleDateString('pt-BR')}`,
      `Status Operacional: ${getStatusLabel(order.status)}`,
      `-----------------------------------------`,
      `*ITENS:*`
    ];

    order.items.forEach(it => {
      lines.push(`• ${it.productName} (x${it.quantity}) — R$ ${it.price.toFixed(2)}`);
    });

    lines.push(`-----------------------------------------`);
    lines.push(`*VALOR TOTAL: R$ ${order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`);
    if (settings.slogan) {
      lines.push(`\n_${settings.slogan}_`);
    }

    return lines.join('\n');
  };

  const handleCopyShare = (order: Order) => {
    navigator.clipboard.writeText(getShareText(order));
    toast.success("Copiado!", "Detalhamento formatado copiado para a área de transferência.");
  };

  const handleWhatsAppShare = (order: Order) => {
    const text = encodeURIComponent(getShareText(order));
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 select-none font-sans">

      {/* 1. LIST SCREEN */}
      {activeScreen === 'list' && (
        <div className="space-y-6">
          {/* Header & Filter Controls Bar */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Buscar por cliente ou código PED-..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setOrdersPage(1); }}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white"
                />
                <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => { setSelectedStatus(e.target.value); setOrdersPage(1); }}
                className="px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                <option value="received">Recebido</option>
                <option value="approved">Aprovado / Separação</option>
                <option value="production">Em Produção</option>
                <option value="finishing">Em Acabamento</option>
                <option value="packing">Embalagem</option>
                <option value="ready">Pronto para Entrega</option>
                <option value="completed">Concluído</option>
              </select>
            </div>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer self-start md:self-auto active:scale-95"
            >
              <Plus size={14} /> Novo Pedido
            </button>
          </div>

          {/* Grid list of Orders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedOrders.map(order => {
              const isDelayed = order.status !== 'completed' && new Date(order.dueDate) < new Date();

              return (
                <div 
                  key={order.id} 
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 font-mono flex items-center gap-2">
                          {order.orderNumber}
                          {isDelayed && (
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 rounded-md text-[9px] font-bold tracking-wider animate-pulse">
                              ATRASADO
                            </span>
                          )}
                        </h3>
                        <p className="text-[10px] text-slate-450 mt-1">
                          Emissão: {new Date(order.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      {/* inline Status controller */}
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer focus:outline-none"
                      >
                        <option value="received">Recebido</option>
                        <option value="approved">Aprovado</option>
                        <option value="production">Em Produção</option>
                        <option value="finishing">Em Acabamento</option>
                        <option value="packing">Embalagem</option>
                        <option value="ready">Pronto para Entrega</option>
                        <option value="completed">Concluído</option>
                      </select>
                    </div>

                    {/* Client info */}
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Cliente</p>
                      <p className="font-bold text-xs text-slate-800 mt-1">{order.clientName}</p>
                      
                      <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-2 font-medium">
                        <Calendar size={12} className="text-slate-400" />
                        <span>Prazo: </span>
                        <span className={isDelayed ? 'text-rose-500 font-bold' : 'text-slate-700'}>
                          {new Date(order.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {/* Progress slider bar */}
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                        <span>Estágio de Produção</span>
                        <span className="text-slate-700 font-mono">{order.productionProgress}% Concluído</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            order.productionProgress === 100 ? 'bg-emerald-500' :
                            order.productionProgress > 50 ? 'bg-purple-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${order.productionProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Items List snippet */}
                    <div className="pt-3 border-t border-slate-100/70">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1.5">Produtos</p>
                      <div className="space-y-1">
                        {order.items?.map((item, idx) => (
                          <p key={idx} className="text-xs text-slate-650 font-medium truncate">
                            • {item.productName} <span className="text-slate-400 text-[10px] font-bold">(x{item.quantity})</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Bottom Action Drawer */}
                  <div className="pt-4.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900 font-mono">
                      R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Timeline Detail Screen */}
                      <button
                        onClick={() => { setSelectedOrder(order); setActiveScreen('detail'); }}
                        className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-[10.5px] font-bold text-slate-650 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        title="Timeline & Detalhes"
                      >
                        <Eye size={12} /> Timeline
                      </button>

                      {/* Print Screen */}
                      <button
                        onClick={() => { setSelectedOrder(order); setActiveScreen('print'); handleDownloadPdf(order); }}
                        className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer transition-colors"
                        title="Imprimir Recibo"
                      >
                        <Printer size={12} />
                      </button>

                      {/* Share Screen */}
                      <button
                        onClick={() => { setSelectedOrder(order); setActiveScreen('share'); }}
                        className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer transition-colors"
                        title="Compartilhar Pedido"
                      >
                        <Share2 size={12} />
                      </button>

                      {/* Edit Screen */}
                      <button
                        onClick={() => handleOpenEdit(order)}
                        className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-650 hover:text-amber-600 rounded-lg cursor-pointer transition-all duration-200 active:scale-95"
                        title="Editar Pedido"
                      >
                        <Edit3 size={12} />
                      </button>

                      {/* Cancel controller */}
                      {cancelConfirmId === order.id ? (
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg p-0.5 animate-fade-in" title="Confirmar Cancelamento (Estorno completo)">
                          <button
                            onClick={() => {
                              cancelOrder(order.id);
                              setCancelConfirmId(null);
                              toast.success("Pedido Cancelado", `Pedido ${order.orderNumber} cancelado com estorno completo.`);
                            }}
                            className="px-2 py-0.5 bg-amber-600 text-white rounded text-[9px] font-bold cursor-pointer"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setCancelConfirmId(null)}
                            className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-bold cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCancelConfirmId(order.id)}
                          className="p-1.5 border border-slate-200 hover:bg-amber-50 text-slate-650 hover:text-amber-600 rounded-lg cursor-pointer transition-all duration-200 active:scale-95"
                          title="Cancelar Pedido (Estornar Insumos e Financeiro)"
                        >
                          <Ban size={12} />
                        </button>
                      )}

                      {/* Delete controller */}
                      {deleteConfirmId === order.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-0.5">
                          <button
                            onClick={() => handleConfirmDelete(order.id)}
                            className="px-2 py-0.5 bg-rose-600 text-white rounded text-[9px] font-bold cursor-pointer"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-bold cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(order.id)}
                          className="p-1.5 border border-slate-200 hover:bg-rose-50 text-slate-650 hover:text-rose-600 rounded-lg cursor-pointer transition-all duration-200 active:scale-95"
                          title="Excluir Pedido"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredOrders.length === 0 && (
              <div className="col-span-2 py-20 text-center text-slate-450 italic border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                Nenhum pedido de venda registrado para os filtros especificados.
              </div>
            )}
          </div>

          {/* Standardized Pagination */}
          <Pagination
            currentPage={ordersPage}
            totalPages={Math.ceil(filteredOrders.length / ordersPerPage)}
            totalItems={filteredOrders.length}
            itemsPerPage={ordersPerPage}
            onPageChange={setOrdersPage}
            onItemsPerPageChange={(val) => { setOrdersPerPage(val); setOrdersPage(1); }}
            labelSingular="pedido"
            labelPlural="pedidos"
          />
        </div>
      )}

      {/* 2. ADD SCREEN */}
      {activeScreen === 'add' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 shadow-sm max-w-3xl mx-auto">
          {/* Header fixo */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveScreen('list')}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl cursor-pointer transition-all active:scale-95"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Registrar Novo Pedido de Venda</h3>
                <p className="text-[11px] text-slate-500">Mapeamento de insumos, faturamento e logística</p>
              </div>
            </div>
            <button
              onClick={() => setActiveScreen('list')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Voltar para a Lista
            </button>
          </div>

          <form onSubmit={handleSaveAdd} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Cliente Comprador *</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="" disabled>Selecione o cliente...</option>
                  {activeClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Data Prevista de Entrega *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-850 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Status Inicial</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none"
                >
                  <option value="received">Recebido</option>
                  <option value="approved">Aprovado</option>
                  <option value="production">Em Produção</option>
                </select>
              </div>
            </div>

            {/* Item selector sandbox */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-xs text-slate-850 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-amber-500" /> Joias e Terços do Pedido
              </h4>

              <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-end gap-3 mb-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Selecionar Produto</label>
                  <select
                    value={selectedProdId}
                    onChange={(e) => setSelectedProdId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
                  >
                    <option value="" disabled>Escolha um produto...</option>
                    {activeProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (R$ {p.sellingPrice.toFixed(2)})</option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-24">
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
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg h-9 cursor-pointer transition-colors"
                >
                  Vincular Item
                </button>
              </div>

              {/* Items List layout */}
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center px-4 py-2.5 bg-slate-50/20 text-xs font-semibold">
                    <div>
                      <p className="text-slate-850">{item.productName}</p>
                      <p className="text-[10px] text-slate-450 mt-0.5">Preço Unitário: R$ {item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="text-slate-600 font-bold">{item.quantity} un</p>
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
                  <p className="p-5 text-center text-slate-400 text-xs italic">Nenhum item adicionado ao pedido ainda.</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between font-bold text-xs">
                <span className="text-slate-500 uppercase">Faturamento do Pedido</span>
                <span className="font-mono text-slate-950 text-sm">
                  R$ {subtotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveScreen('list')}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md active:scale-95"
              >
                Adicionar Pedido
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. EDIT SCREEN */}
      {activeScreen === 'edit' && selectedOrder && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 shadow-sm max-w-3xl mx-auto">
          {/* Header fixo */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveScreen('list')}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl cursor-pointer transition-all active:scale-95"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Editar Pedido {selectedOrder.orderNumber}</h3>
                <p className="text-[11px] text-slate-500 font-mono">ID: {selectedOrder.id}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveScreen('list')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Voltar para a Lista
            </button>
          </div>

          <form onSubmit={handleSaveEdit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Cliente Comprador *</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none"
                >
                  {activeClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Prazo de Entrega *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-850 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Status do Pedido</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none"
                >
                  <option value="received">Recebido</option>
                  <option value="approved">Aprovado</option>
                  <option value="production">Em Produção</option>
                  <option value="finishing">Em Acabamento</option>
                  <option value="packing">Embalagem</option>
                  <option value="ready">Pronto para Entrega</option>
                  <option value="completed">Concluído</option>
                </select>
              </div>
            </div>

            {/* Workspace section */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-xs text-slate-850 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-amber-500" /> Joias e Terços do Pedido
              </h4>

              <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-end gap-3 mb-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Adicionar Novo Produto</label>
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
                <div className="w-full sm:w-24">
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
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg h-9 cursor-pointer transition-colors"
                >
                  Adicionar
                </button>
              </div>

              {/* Items Summary Table */}
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center px-4 py-2.5 bg-slate-50/20 text-xs font-semibold">
                    <div>
                      <p className="text-slate-850">{item.productName}</p>
                      <p className="text-[10px] text-slate-450 mt-0.5">Preço Unitário: R$ {item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="text-slate-600 font-bold">{item.quantity} un</p>
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
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between font-bold text-xs">
                <span className="text-slate-500 uppercase">Faturamento do Pedido</span>
                <span className="font-mono text-slate-950 text-sm">
                  R$ {subtotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveScreen('list')}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md active:scale-95"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. DETAIL/TIMELINE SCREEN */}
      {activeScreen === 'detail' && selectedOrder && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 shadow-sm max-w-3xl mx-auto">
          {/* Header fixo */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveScreen('list')}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl cursor-pointer transition-all active:scale-95"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Histórico & Rastreabilidade de Pedido</h3>
                <p className="text-[11px] text-slate-500">Fluxo cronológico operacional detalhado</p>
              </div>
            </div>
            <button
              onClick={() => setActiveScreen('list')}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-600 text-xs flex items-center gap-1.5"
            >
              Voltar ao Fluxo
            </button>
          </div>

          {/* Quick Stats overview panel */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400">Código</p>
              <p className="font-extrabold text-slate-900 mt-1 font-mono">{selectedOrder.orderNumber}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400">Faturamento Total</p>
              <p className="font-extrabold text-slate-950 mt-1 font-mono">R$ {selectedOrder.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400">Cliente</p>
              <p className="font-bold text-slate-800 mt-1 truncate">{selectedOrder.clientName}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400">Entrega Prevista</p>
              <p className="font-bold text-slate-850 mt-1">{new Date(selectedOrder.dueDate).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          {/* Detailed Items list */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Artigos Adquiridos</h4>
            <div className="bg-slate-50/50 rounded-xl border border-slate-150 divide-y divide-slate-100 p-1">
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 text-xs font-semibold">
                  <div>
                    <p className="text-slate-850">{item.productName}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Preço Unitário: R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-700 font-bold">{item.quantity} un</p>
                    <p className="text-[11px] font-bold font-mono text-slate-950">R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flow of events (Timeline) */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Clock size={14} className="text-amber-500" /> Histórico de Movimentações
            </h4>

            <div className="relative pl-6 border-l-2 border-slate-150 space-y-6 ml-3">
              {selectedOrder.timeline?.map((evt, idx) => (
                <div key={evt.id || idx} className="relative">
                  <span className="absolute -left-8.5 top-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-sm flex items-center justify-center text-[8px] text-white font-bold" />
                  
                  <div className="text-xs">
                    <span className="font-bold font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                      {new Date(evt.date).toLocaleString('pt-BR')}
                    </span>
                    <p className="text-slate-800 mt-2 font-bold">{evt.description}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Operador / Responsável: {evt.user || 'Administrador ERP'}</p>
                  </div>
                </div>
              ))}
              {(!selectedOrder.timeline || selectedOrder.timeline.length === 0) && (
                <p className="text-xs text-slate-400 italic py-4 text-center">Nenhum log operacional registrado nesta timeline.</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setActiveScreen('list')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Concluir Consulta
            </button>
          </div>
        </div>
      )}

      {/* 5. PRINT RECEIPT SCREEN */}
      {activeScreen === 'print' && selectedOrder && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 shadow-sm max-w-3xl mx-auto print:border-0 print:shadow-none print:p-0 print:max-w-none">
          {/* Header fixo de visualização */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveScreen('list')}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Visualização de Recibo do Pedido</h3>
                <p className="text-[11px] text-slate-500">Layout preparado e otimizado para impressão</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadPdf(selectedOrder)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={13} /> Gerar PDF / Baixar
              </button>
              <button
                onClick={() => setActiveScreen('list')}
                className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-600 text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>

          {/* Real Invoice Layout Container (Stylized for pristine company aesthetics) */}
          <div className="p-8 border border-slate-200 rounded-2xl bg-white space-y-6 max-w-2xl mx-auto print:border-0 print:p-0 font-sans">
            {/* Custom Logo Integration */}
            {settings.docLogo && settings.docLogo !== '📿' ? (
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <img 
                  src={settings.docLogo} 
                  alt="Logo Ateliê" 
                  className="max-h-16 object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to beautiful text logo if error loading image
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-xs font-mono text-slate-400">Documento Personalizado</span>
              </div>
            ) : (
              <div className="flex justify-between items-center pb-2 border-b border-slate-150 print:hidden">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-lg text-slate-400 font-bold">📿</div>
                <span className="text-xs font-mono text-slate-300">Logo Padrão</span>
              </div>
            )}

            {/* Invoice Top header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
              <div className="space-y-1.5">
                <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">{selectedOrder.snapshot?.companyName || settings.companyName || "Ateliê Sagrado"}</h4>
                {settings.slogan && <p className="text-xs text-amber-600 font-medium italic">{settings.slogan}</p>}
                {settings.docHeader && <p className="text-[11px] text-slate-500 font-medium">{settings.docHeader}</p>}
                <p className="text-[10px] text-slate-400 font-mono">EMISSÃO DO RECIBO: {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="text-right">
                <span className="px-3.5 py-1 bg-slate-900 text-white rounded text-xs font-mono font-bold">
                  {selectedOrder.orderNumber}
                </span>
                <p className="text-[10px] text-slate-400 mt-2">Data do Pedido: {new Date(selectedOrder.date).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            {/* Client & Shipping Address info */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wide">Sacado / Cliente</p>
                <p className="font-extrabold text-slate-800 mt-1">{selectedOrder.clientName}</p>
                <p className="text-slate-500 mt-0.5">Prazo Previsto: {new Date(selectedOrder.dueDate).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wide">Estágio Atual</p>
                <span className="inline-block mt-1 text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                  {getStatusLabel(selectedOrder.status).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Tabular Items list */}
            <div className="space-y-2">
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wide">Itens Faturados</p>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                    <th className="py-2.5 px-3">Joia / Produto</th>
                    <th className="py-2.5 px-3 text-center">Quantidade</th>
                    <th className="py-2.5 px-3 text-right">Valor Unitário</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-850">
                  {selectedOrder.items?.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3 px-3">{item.productName}</td>
                      <td className="py-3 px-3 text-center">{item.quantity}</td>
                      <td className="py-3 px-3 text-right">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-right font-mono">R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total recap subtotal */}
            <div className="border-t border-slate-200 pt-5 flex justify-between items-center">
              <span className="text-xs uppercase font-extrabold text-slate-450 tracking-wider">Valor Líquido do Pedido</span>
              <span className="text-xl font-black text-slate-950 font-mono">
                R$ {selectedOrder.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Custom Notes & Remarks in printed output */}
            {settings.docNotes && (
              <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-1">
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wide">Observações do Documento</p>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{settings.docNotes}</p>
              </div>
            )}

            {/* Signature disclaimer lines / footer phrases */}
            <div className="pt-8 border-t border-slate-100 text-center space-y-4">
              {settings.docFinalMessage ? (
                <p className="text-[11px] text-slate-500 font-medium italic">"{settings.docFinalMessage}"</p>
              ) : settings.phrases ? (
                <p className="text-[11px] text-slate-500 font-medium italic">"{settings.phrases}"</p>
              ) : null}
              
              <div className="w-48 h-[1px] bg-slate-200 mx-auto mt-6"></div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold">{settings.docSignature || "Assinatura de Recebimento"}</p>
              
              {settings.docFooter && (
                <p className="text-[10px] text-slate-400 italic pt-2 border-t border-slate-50 font-mono">{settings.docFooter}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. SHARE HUB SCREEN */}
      {activeScreen === 'share' && selectedOrder && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6 shadow-sm max-w-xl mx-auto">
          {/* Header fixo */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveScreen('list')}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Compartilhar Pedido</h3>
                <p className="text-[11px] text-slate-500">Enviar detalhamento rápido para o cliente</p>
              </div>
            </div>
            <button
              onClick={() => setActiveScreen('list')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Voltar
            </button>
          </div>

          <div className="space-y-5">
            {/* Preview Box */}
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-3">Pré-visualização da mensagem</span>
              <pre className="text-xs text-slate-700 font-sans whitespace-pre-wrap leading-relaxed bg-white p-4 border border-slate-100 rounded-xl max-h-[40vh] overflow-y-auto">
                {getShareText(selectedOrder)}
              </pre>
            </div>

            {/* Action buttons list */}
            <div className="grid grid-cols-2 gap-3.5">
              <button
                onClick={() => handleCopyShare(selectedOrder)}
                className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Copy size={15} /> Copiar Mensagem
              </button>

              <button
                onClick={() => handleWhatsAppShare(selectedOrder)}
                className="py-3 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <MessageSquare size={15} /> WhatsApp Cliente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
