import React, { useState, useMemo, useEffect } from "react";
import { useDb } from "../context/DbContext";
import { InventoryItem, CalcMethod } from "../types/erp";
import { jsPDF } from "jspdf";
import { getPdfThemeColors } from "../utils/theme";
import { loadLogoBase64, loadItemImageBase64 } from "../utils/pdf";
import {
  Search,
  Grid,
  List,
  Filter,
  Plus,
  ArrowUpDown,
  Edit3,
  Trash2,
  CheckSquare,
  Check,
  AlertTriangle,
  Package,
  DollarSign,
  BarChart2,
  Eye,
  EyeOff,
  BookOpen,
  Download,
  FileDown,
  Layers,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Maximize2
} from "lucide-react";
import { toast } from "./Toast";
import { Pagination } from "./Pagination";
import { Badge, EmptyState, Button, PageHeader, FilterBar, ConfirmDialog } from "./ui";
import {
  InventoryAddScreen,
  InventoryEditScreen,
  InventoryAdjustScreen,
  InventoryBatchAdjustScreen,
  InventoryDetailsScreen,
  InventoryExportPdfScreen,
} from "./inventory";
import { ExportPdfOptions } from "./inventory/InventoryExportPdfScreen";

export interface InventoryViewProps {
  initialFilter?: {
    status?: string;
    category?: string;
    search?: string;
  };
}

export const InventoryView: React.FC<InventoryViewProps> = ({ initialFilter }) => {
  const {
    inventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    adjustStock,
    products,
    orders,
    quotes,
    productionTasks,
    settings,
  } = useDb();

  // Screen state: 'list' | 'add' | 'edit' | 'adjust' | 'batch_adjust' | 'details' | 'export_pdf'
  const [activeScreen, setActiveScreen] = useState<
    'list' | 'add' | 'edit' | 'adjust' | 'batch_adjust' | 'details' | 'export_pdf'
  >('list');

  // Search and Filter States
  const [search, setSearch] = useState(initialFilter?.search || "");
  const [selectedCategory, setSelectedCategory] = useState(initialFilter?.category || "all");
  const [selectedStatus, setSelectedStatus] = useState(initialFilter?.status || "all");
  const [onlyWithPhotosFilter, setOnlyWithPhotosFilter] = useState(false);

  useEffect(() => {
    if (initialFilter?.status) setSelectedStatus(initialFilter.status);
    if (initialFilter?.category) setSelectedCategory(initialFilter.category);
    if (initialFilter?.search !== undefined) setSearch(initialFilter.search);
  }, [initialFilter]);

  // View modes: table, cards, catalog
  const [viewMode, setViewMode] = useState<"table" | "cards" | "catalog">("catalog");
  const [commercialMode, setCommercialMode] = useState(false);
  const [showStockInCatalog, setShowStockInCatalog] = useState(false);

  // Selected item contexts
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<InventoryItem | null>(null);

  // Batch actions
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  // Single delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // PDF Export loading state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Image zoom modal
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);

  // Active items
  const activeItems = useMemo(() => inventory.filter((i) => !i.isDeleted), [inventory]);
  const categories = useMemo(() => Array.from(new Set(activeItems.map((i) => i.category))), [activeItems]);

  // Indicators
  const totalItems = activeItems.length;
  const itemsWithPhotos = activeItems.filter(i => i.imageUrl && i.imageUrl.trim() !== "").length;
  const normalStock = activeItems.filter((i) => i.quantity > i.minQuantity).length;
  const lowStock = activeItems.filter((i) => i.quantity <= i.minQuantity && i.quantity > 0).length;
  const outOfStock = activeItems.filter((i) => i.quantity === 0).length;

  const valorTotalGeralEstoque = useMemo(() => {
    return activeItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitValue || 0), 0);
  }, [activeItems]);

  // Filter & Search Logic
  const filteredItems = useMemo(() => {
    return activeItems.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        (item.name || "").toLowerCase().includes(q) ||
        (item.code || "").toLowerCase().includes(q) ||
        (item.supplier || "").toLowerCase().includes(q);
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesStatus =
        selectedStatus === "all"
          ? true
          : selectedStatus === "available"
          ? item.quantity > 0
          : selectedStatus === "low_stock"
          ? item.quantity > 0 && item.quantity <= item.minQuantity
          : selectedStatus === "out_of_stock"
          ? item.quantity === 0
          : selectedStatus === "critical"
          ? item.quantity <= item.minQuantity
          : item.status === selectedStatus;
      
      const matchesPhoto = onlyWithPhotosFilter ? Boolean(item.imageUrl && item.imageUrl.trim() !== "") : true;

      return matchesSearch && matchesCategory && matchesStatus && matchesPhoto;
    });
  }, [activeItems, search, selectedCategory, selectedStatus, onlyWithPhotosFilter]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Memoized lineage trace for detailed view
  const itemDetailsData = useMemo(() => {
    if (!detailsItem) return null;

    const relatedProds = (products || []).filter(
      (p) => !p.isDeleted && p.composition?.some((c) => c.materialId === detailsItem.id)
    );

    const quotesReserving: any[] = [];
    (quotes || [])
      .filter((q) => !q.isDeleted && q.status === "pending")
      .forEach((q) => {
        let totalRes = 0;
        const prodsList: string[] = [];
        q.items.forEach((qi) => {
          const prod = products.find((p) => p.id === qi.productId);
          if (prod) {
            const comp = prod.composition?.find((c) => c.materialId === detailsItem.id);
            if (comp) {
              totalRes += comp.quantity * qi.quantity;
              prodsList.push(`${qi.quantity}x ${prod.name}`);
            }
          }
        });
        if (totalRes > 0) {
          quotesReserving.push({
            id: q.id,
            quoteNumber: q.quoteNumber || "ORC-000",
            clientName: q.clientName,
            reservedQty: totalRes,
            productsLabel: prodsList.join(", "),
          });
        }
      });

    const ordersConsuming: any[] = [];
    (orders || [])
      .filter((o) => !o.isDeleted)
      .forEach((o) => {
        let totalCons = 0;
        const prodsList: string[] = [];
        o.items.forEach((oi) => {
          const prod = products.find((p) => p.id === oi.productId);
          if (prod) {
            const comp = prod.composition?.find((c) => c.materialId === detailsItem.id);
            if (comp) {
              totalCons += comp.quantity * oi.quantity;
              prodsList.push(`${oi.quantity}x ${prod.name}`);
            }
          }
        });
        if (totalCons > 0) {
          ordersConsuming.push({
            id: o.id,
            orderNumber: o.orderNumber || "PED-000",
            clientName: o.clientName,
            consumedQty: totalCons,
            status: o.status,
            date: o.date,
            productsLabel: prodsList.join(", "),
          });
        }
      });

    return {
      relatedProducts: relatedProds,
      quotesReserving,
      ordersConsuming,
    };
  }, [detailsItem, products, quotes, orders]);

  // Handlers
  const handleOpenAdd = () => {
    setActiveScreen('add');
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setActiveScreen('edit');
  };

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setActiveScreen('adjust');
  };

  const handleOpenDetails = (item: InventoryItem) => {
    setDetailsItem(item);
    setActiveScreen('details');
  };

  const handleOpenBatchAdjust = () => {
    if (selectedItemIds.length === 0) {
      toast.warning("Nenhum item selecionado", "Selecione ao menos um insumo para movimentação em lote.");
      return;
    }
    setActiveScreen('batch_adjust');
  };

  const handleOpenExportPdf = () => {
    setActiveScreen('export_pdf');
  };

  const handleToggleCommercialMode = () => {
    const nextMode = !commercialMode;
    setCommercialMode(nextMode);
    if (nextMode) {
      setViewMode("catalog");
      toast.info("Modo Comercial Ativo", "Custos internos ocultados. Visualização formatada para apresentação ao cliente.");
    } else {
      toast.info("Modo Operacional Ativo", "Exibindo custos, fornecedores e métricas de compras.");
    }
  };

  const handleSaveAdd = (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => {
    addInventoryItem(itemData);
    toast.success("Insumo Cadastrado!", `"${itemData.name}" foi adicionado com sucesso ao estoque.`);
    setActiveScreen('list');
  };

  const handleSaveEdit = (id: string, updates: Partial<InventoryItem>) => {
    updateInventoryItem(id, updates);
    toast.success("Insumo Atualizado!", "As alterações foram gravadas com sucesso.");
    setActiveScreen('list');
  };

  const handleSaveAdjust = (id: string, amount: number, notes: string, category: string, supplier: string, appliedUnitValue?: number, expenseAmount?: number) => {
    adjustStock(id, amount, notes, category, supplier, appliedUnitValue, expenseAmount);
    toast.success("Saldo Movimentado!", `Estoque atualizado em ${amount >= 0 ? '+' : ''}${amount}.`);
    setActiveScreen('list');
  };

  const handleSaveBatchAdjust = (
    data: {
      type: "manual" | "smart";
      unitValue?: number;
      qtyPerItem?: number;
      packagePrice?: number;
      hasFreight?: boolean;
      freightValue?: number;
      notes?: string;
      supplier?: string;
    }
  ) => {
    const { type, unitValue, qtyPerItem, packagePrice, hasFreight, freightValue, notes, supplier } = data;
    let countSuccess = 0;

    selectedItemIds.forEach((id) => {
      const target = inventory.find((i) => i.id === id);
      if (!target) return;

      let finalAmt = qtyPerItem || 0;
      let appliedUnitValue = unitValue;
      let finalExpense = undefined;

      if (type === "smart") {
        if (unitValue && unitValue > 0) {
          appliedUnitValue = unitValue;
        }

        finalExpense = (packagePrice || 0) + (freightValue || 0);
      }

      adjustStock(
        id,
        finalAmt,
        notes || "Ajuste em lote",
        target.category,
        supplier || target.supplier || "Fornecedor Diverso",
        appliedUnitValue,
        finalExpense
      );
      countSuccess++;
    });

    toast.success("Movimentação em Lote Concluída!", `${countSuccess} insumos foram atualizados com sucesso.`);
    setSelectedItemIds([]);
    setIsSelectionMode(false);
    setActiveScreen('list');
  };

  // PDF Export Engine with Photos Support
  const handleExportPdf = async (options: ExportPdfOptions) => {
    setIsGeneratingPdf(true);
    toast.info("Processando Catálogo", "Carregando fotos e formatando arquivo PDF...");

    try {
      const pdfTheme = getPdfThemeColors(settings.primaryColor);
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const compName = settings.companyName || "Ateliê Sagrado";
      const compPhone = settings.phone || "(11) 98765-4321";
      const compEmail = settings.email || "contato@ateliesagrado.com.br";

      let itemsToExport = activeItems.filter((item) => {
        if (options.category !== "all" && item.category !== options.category) return false;
        if (options.onlyAvailable && item.quantity <= 0) return false;
        if (options.onlyWithPhotos && (!item.imageUrl || item.imageUrl.trim() === '')) return false;
        if (options.subcategory.trim()) {
          const q = options.subcategory.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchDesc = (item.description || "").toLowerCase().includes(q);
          const matchCode = (item.code || "").toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCode) return false;
        }
        return true;
      });

      const marginX = 14;
      let currentY = 14;
      let pageNum = 1;

      // -------------------------------------------------------------
      // HEADER HELPER FUNCTION
      // -------------------------------------------------------------
      const drawHeader = async () => {
        // Top color bar
        doc.setFillColor(pdfTheme.primaryRgb[0], pdfTheme.primaryRgb[1], pdfTheme.primaryRgb[2]);
        doc.rect(marginX, currentY, 182, 2.5, "F");
        currentY += 6;

        // Try load logo
        let logoOffset = 0;
        if (settings.docLogo && settings.docLogo !== '📿') {
          try {
            const logoBase64 = await loadLogoBase64(settings.docLogo);
            if (logoBase64 && logoBase64.startsWith('data:image')) {
              doc.addImage(logoBase64, 'PNG', marginX, currentY, 16, 16);
              logoOffset = 20;
            }
          } catch (e) {
            console.warn("Logo draw failed", e);
          }
        }

        // Title and Subtitle
        doc.setTextColor(15, 23, 42);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(16);
        doc.text(compName, marginX + logoOffset, currentY + 5);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Tel: ${compPhone} • Email: ${compEmail}`, marginX + logoOffset, currentY + 10);

        // Header Title on Right
        doc.setTextColor(pdfTheme.titleRgb[0], pdfTheme.titleRgb[1], pdfTheme.titleRgb[2]);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10.5);
        doc.text(
          options.format === 'catalog_visual'
            ? "CATÁLOGO DE MATÉRIAS-PRIMAS & PEÇAS SACRAS"
            : "RELATÓRIO CONSOLIDADO DE ESTOQUE",
          196,
          currentY + 5,
          { align: "right" }
        );

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          options.format === 'catalog_visual'
            ? "Opções disponíveis para montagem e personalização de terços sob encomenda"
            : `Posição de estoque emitida em ${new Date().toLocaleDateString('pt-BR')}`,
          196,
          currentY + 10,
          { align: "right" }
        );

        currentY += 16;

        // Subtitle divider strip
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, currentY, 182, 5.5, "F");
        doc.setFontSize(7.5);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text(`Total de Opções Listadas: ${itemsToExport.length} itens`, marginX + 3, currentY + 3.8);
        if (options.category !== 'all') {
          doc.text(`Categoria: ${options.category}`, 193, currentY + 3.8, { align: "right" });
        } else {
          doc.text(`Todas as Categorias do Ateliê`, 193, currentY + 3.8, { align: "right" });
        }

        currentY += 8;
      };

      // -------------------------------------------------------------
      // FOOTER HELPER FUNCTION
      // -------------------------------------------------------------
      const drawFooter = (currentP: number) => {
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(marginX, 287, 196, 287);

        doc.setFontSize(7);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text(
          `${compName} • Catálogo de Peças Sacras para Confecção Personalizada`,
          marginX,
          291
        );
        doc.text(`Página ${currentP}`, 196, 291, { align: "right" });
      };

      // Initial header
      await drawHeader();

      // -------------------------------------------------------------
      // 1. VISUAL CATALOG WITH PHOTOS (2 CARDS PER ROW)
      // -------------------------------------------------------------
      if (options.format === 'catalog_visual') {
        const cardWidth = 88;
        const cardHeight = 44;
        const colGap = 6;
        const rowGap = 5;

        let col = 0; // 0 = Left, 1 = Right

        for (let idx = 0; idx < itemsToExport.length; idx++) {
          const item = itemsToExport[idx];

          // Check if row exceeds page height (A4 is 297mm; max row bottom around 282mm)
          if (col === 0 && currentY + cardHeight > 282) {
            drawFooter(pageNum);
            doc.addPage();
            pageNum++;
            currentY = 14;
            await drawHeader();
            col = 0;
          }

          const cardX = marginX + col * (cardWidth + colGap);
          const cardY = currentY;

          // Card Background & Border
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 2.5, 2.5, "FD");

          // Photo Frame
          const photoW = 32;
          const photoH = 38;
          const photoX = cardX + 3;
          const photoY = cardY + 3;

          doc.setFillColor(248, 250, 252);
          doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2, "F");

          // Load & Draw Item Photo
          try {
            const photoBase64 = await loadItemImageBase64(item.imageUrl, item.name);
            doc.addImage(photoBase64, 'JPEG', photoX + 1, photoY + 1, photoW - 2, photoH - 2);
          } catch (e) {
            console.warn("Failed drawing item photo", item.name, e);
          }

          // Text Column on Right
          const textX = cardX + 38;
          const textMaxW = cardWidth - 41; // ~47mm

          // 1. SKU & Category
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(6.5);
          doc.setTextColor(148, 163, 184);
          doc.text(`${item.code || 'INS'} • ${doc.splitTextToSize(item.category, textMaxW)[0]}`, textX, cardY + 6.5);

          // 2. Item Name
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          const nameLines = doc.splitTextToSize(item.name, textMaxW);
          doc.text(nameLines.slice(0, 2), textX, cardY + 11.5);

          // 3. Description
          let descY = cardY + (nameLines.length > 1 ? 19 : 16);
          if (item.description && item.description.trim()) {
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(6.8);
            doc.setTextColor(100, 116, 139);
            const descLines = doc.splitTextToSize(item.description, textMaxW);
            doc.text(descLines.slice(0, 2), textX, descY);
          }

          // 4. Status / Availability Pill
          const statusY = cardY + 36;
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(7.2);
          if (item.quantity > 0) {
            doc.setTextColor(16, 149, 93); // Emerald
            if (options.showStockQuantity) {
              doc.text(`Disponível: ${item.quantity} ${item.unit}`, textX, statusY);
            } else {
              doc.text(`✓ Disponível para Montagem`, textX, statusY);
            }
          } else {
            doc.setTextColor(217, 119, 6); // Amber
            doc.text(`Sob Encomenda`, textX, statusY);
          }

          // 5. Price (if enabled)
          if (options.includePrice) {
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(pdfTheme.primaryRgb[0], pdfTheme.primaryRgb[1], pdfTheme.primaryRgb[2]);
            doc.text(`R$ ${item.unitValue.toFixed(2)}`, textX, cardY + 41);
          }

          // Advance column / row
          if (col === 0) {
            col = 1;
          } else {
            col = 0;
            currentY += cardHeight + rowGap;
          }
        }

        drawFooter(pageNum);
      } 
      // -------------------------------------------------------------
      // 2. ANALYTICAL TABLE REPORT
      // -------------------------------------------------------------
      else {
        // Table header
        doc.setFillColor(241, 245, 249);
        doc.rect(marginX, currentY, 182, 6.5, "F");
        doc.setTextColor(51, 65, 85);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.text("CÓDIGO", marginX + 2, currentY + 4.5);
        doc.text("NOME DO INSUMO", marginX + 26, currentY + 4.5);
        doc.text("CATEGORIA", marginX + 88, currentY + 4.5);
        doc.text("SALDO", marginX + 132, currentY + 4.5);
        if (options.includePrice) {
          doc.text("VALOR UNIT.", 194, currentY + 4.5, { align: "right" });
        }
        currentY += 8.5;

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.8);

        for (const item of itemsToExport) {
          if (currentY > 278) {
            drawFooter(pageNum);
            doc.addPage();
            pageNum++;
            currentY = 14;
            await drawHeader();

            doc.setFillColor(241, 245, 249);
            doc.rect(marginX, currentY, 182, 6.5, "F");
            doc.setTextColor(51, 65, 85);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(8);
            doc.text("CÓDIGO", marginX + 2, currentY + 4.5);
            doc.text("NOME DO INSUMO", marginX + 26, currentY + 4.5);
            doc.text("CATEGORIA", marginX + 88, currentY + 4.5);
            doc.text("SALDO", marginX + 132, currentY + 4.5);
            if (options.includePrice) {
              doc.text("VALOR UNIT.", 194, currentY + 4.5, { align: "right" });
            }
            currentY += 8.5;
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(7.8);
          }

          doc.setTextColor(100, 116, 139);
          doc.text(item.code || "S/N", marginX + 2, currentY);
          doc.setTextColor(15, 23, 42);
          doc.text(doc.splitTextToSize(item.name, 58)[0] || "", marginX + 26, currentY);
          doc.setTextColor(100, 116, 139);
          doc.text(doc.splitTextToSize(item.category, 40)[0] || "", marginX + 88, currentY);
          doc.setTextColor(15, 23, 42);
          doc.text(`${item.quantity} ${item.unit}`, marginX + 132, currentY);
          if (options.includePrice) {
            doc.setTextColor(16, 185, 129);
            doc.text(`R$ ${item.unitValue.toFixed(2)}`, 194, currentY, { align: "right" });
          }
          currentY += 6;
        }

        drawFooter(pageNum);
      }

      const dateStr = new Date().toISOString().split("T")[0];
      const fileName = options.format === 'catalog_visual'
        ? `Catalogo_Pecas_Sacras_${compName.replace(/\s+/g, "_")}_${dateStr}.pdf`
        : `Estoque_${compName.replace(/\s+/g, "_")}_${dateStr}.pdf`;

      doc.save(fileName);
      toast.success(
        options.format === 'catalog_visual' ? "Catálogo com Fotos Exportado!" : "Relatório Exportado!",
        `Arquivo PDF baixado com sucesso contendo ${itemsToExport.length} itens.`
      );
      setActiveScreen('list');
    } catch (err) {
      console.error("PDF export error", err);
      toast.error("Erro no PDF", "Não foi possível gerar o arquivo PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // -------------------------------------------------------------
  // DEDICATED SCREENS: ZERO MODAIS!
  // -------------------------------------------------------------
  if (activeScreen === 'add') {
    return (
      <InventoryAddScreen
        onBack={() => setActiveScreen('list')}
        onSave={handleSaveAdd}
        categories={categories}
      />
    );
  }

  if (activeScreen === 'edit' && selectedItem) {
    return (
      <InventoryEditScreen
        item={selectedItem}
        onBack={() => setActiveScreen('list')}
        onSave={handleSaveEdit}
        categories={categories}
      />
    );
  }

  if (activeScreen === 'adjust' && selectedItem) {
    return (
      <InventoryAdjustScreen
        item={selectedItem}
        onBack={() => setActiveScreen('list')}
        onSave={handleSaveAdjust}
      />
    );
  }

  if (activeScreen === 'batch_adjust') {
    const selectedItemsList = inventory.filter((i) => selectedItemIds.includes(i.id));
    return (
      <InventoryBatchAdjustScreen
        selectedItems={selectedItemsList}
        onBack={() => setActiveScreen('list')}
        onSave={handleSaveBatchAdjust}
      />
    );
  }

  if (activeScreen === 'details' && detailsItem && itemDetailsData) {
    return (
      <InventoryDetailsScreen
        item={detailsItem}
        itemDetailsData={itemDetailsData}
        onBack={() => setActiveScreen('list')}
        onOpenAdjust={handleOpenAdjust}
        onOpenEdit={handleOpenEdit}
      />
    );
  }

  if (activeScreen === 'export_pdf') {
    return (
      <InventoryExportPdfScreen
        onBack={() => setActiveScreen('list')}
        categories={categories}
        activeItems={activeItems}
        commercialMode={commercialMode}
        onExport={handleExportPdf}
        isGeneratingPdf={isGeneratingPdf}
      />
    );
  }

  // -------------------------------------------------------------
  // MAIN LIST SCREEN
  // -------------------------------------------------------------
  const selectedItemsCount = selectedItemIds.length;

  return (
    <div className="space-y-6 pb-16 font-sans select-none animate-slide-in-up">
      {/* Top Header */}
      <PageHeader
        title={commercialMode ? "Catálogo Comercial de Matérias-Primas" : "Controle de Estoque & Matérias-Primas"}
        description={
          commercialMode
            ? "Apresentação visual para clientes: escolha cruzes, medalhas, contas e acabamentos para montagem de terços personalizados com custos protegidos."
            : "Gestão de saldos, ficha técnica de insumos, histórico de movimentações e cálculo automatizado de custo médio ponderado."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleCommercialMode}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                commercialMode
                  ? "bg-emerald-600 text-white shadow-emerald-600/20 ring-2 ring-emerald-500/30"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
              title="Alternar entre modo interno e apresentação para clientes"
            >
              {commercialMode ? <EyeOff size={15} /> : <Eye size={15} />}
              <span>{commercialMode ? "Modo Comercial Ativo" : "Ativar Modo Comercial"}</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExportPdf}
              leftIcon={<Download size={14} className="text-amber-600" />}
            >
              Exportar Catálogo PDF
            </Button>
            
            <Button
              size="sm"
              onClick={handleOpenAdd}
              leftIcon={<Plus size={15} className="text-amber-400" />}
            >
              Novo Insumo
            </Button>
          </div>
        }
      />

      {/* Commercial Mode Notice Banner */}
      {commercialMode && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200/80 p-4 sm:p-5 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-emerald-950 flex items-center gap-2">
                Modo Comercial Ativo — Vitrine para Clientes
                <span className="text-[10px] font-sans font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Custos Ocultos
                </span>
              </h4>
              <p className="text-xs text-emerald-800/90 mt-0.5 leading-relaxed">
                Mostre as fotos das peças, crucifixos e contas disponíveis para que seu cliente monte o terço personalizado. Ao exportar o PDF, as fotos serão geradas no catálogo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
            <label className="flex items-center gap-2 text-xs font-bold text-emerald-900 cursor-pointer select-none bg-white px-3 py-1.5 rounded-xl border border-emerald-200/70 shadow-2xs">
              <input
                type="checkbox"
                checked={showStockInCatalog}
                onChange={(e) => setShowStockInCatalog(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Mostrar Saldo Numérico</span>
            </label>

            <Button
              size="sm"
              variant="success"
              onClick={handleOpenExportPdf}
              leftIcon={<FileDown size={14} />}
            >
              Gerar PDF com Fotos
            </Button>
          </div>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total de Matérias-Primas
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 mt-1 block">
              {totalItems}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {itemsWithPhotos} com fotos ({Math.round((itemsWithPhotos / (totalItems || 1)) * 100)}%)
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Package size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {commercialMode ? "Peças Disponíveis" : "Patrimônio em Estoque"}
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 mt-1 block">
              {commercialMode
                ? `${normalStock + lowStock} itens`
                : `R$ ${valorTotalGeralEstoque.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {commercialMode ? "Prontas para confecção" : "Custo Médio Ponderado"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200/60">
            {commercialMode ? <Sparkles size={20} /> : <DollarSign size={20} />}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pronta Entrega / Alto Saldo
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-serif text-emerald-700 mt-1 block">
              {normalStock}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">
              Saldo acima do mínimo
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <Check size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Sob Encomenda / Baixo
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-serif text-amber-700 mt-1 block">
              {lowStock + outOfStock}
            </span>
            <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">
              {outOfStock} esgotados no ateliê
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* FilterBar & Controls */}
      <div className="space-y-4">
        <FilterBar
          search={search}
          onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
          searchPlaceholder="Buscar por nome da peça, código ou fornecedor..."
          filterOptions={[
            { value: "all", label: "Todas as Categorias" },
            ...categories.map((c) => ({ value: c, label: c })),
          ]}
          selectedFilter={selectedCategory}
          onFilterChange={(val) => { setSelectedCategory(val); setCurrentPage(1); }}
        />

        {/* View Mode & Filter Quick Toggles */}
        <div className="bg-white border border-slate-200/80 p-3 sm:p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Left: View Mode Switches & Photo Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-100">
              <button
                type="button"
                onClick={() => setViewMode("catalog")}
                className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === "catalog" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"
                }`}
                title="Catálogo Visual com Fotos Grandes"
              >
                <BookOpen size={14} className="text-amber-600" />
                <span>Catálogo Visual</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === "cards" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"
                }`}
                title="Cards Administrativos"
              >
                <Grid size={14} />
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"
                }`}
                title="Tabela de Dados com Miniaturas"
              >
                <List size={14} />
                <span>Tabela</span>
              </button>
            </div>

            {/* Quick Filter: Somente com Foto */}
            <button
              type="button"
              onClick={() => { setOnlyWithPhotosFilter(!onlyWithPhotosFilter); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                onlyWithPhotosFilter
                  ? "bg-amber-100/70 border-amber-300 text-amber-900 font-bold"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
              title="Filtrar matérias-primas que já possuem foto cadastrada"
            >
              <ImageIcon size={13} className={onlyWithPhotosFilter ? "text-amber-600" : "text-slate-400"} />
              <span>Apenas com Foto ({itemsWithPhotos})</span>
            </button>

            {/* Quick Filter: Apenas Disponíveis */}
            <button
              type="button"
              onClick={() => {
                setSelectedStatus(selectedStatus === "available" ? "all" : "available");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                selectedStatus === "available"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              <Check size={13} className={selectedStatus === "available" ? "text-emerald-600" : "text-slate-400"} />
              <span>Apenas Disponíveis</span>
            </button>
          </div>

          {/* Right: Batch Selection */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedItemIds([]);
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isSelectionMode
                  ? "bg-amber-50 border-amber-300 text-amber-800 font-bold"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckSquare size={13} />
              <span>{isSelectionMode ? "Cancelar Seleção" : "Ações em Lote"}</span>
            </button>

            {isSelectionMode && selectedItemsCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 font-mono">
                  {selectedItemsCount} {selectedItemsCount === 1 ? 'item' : 'itens'}
                </span>
                <Button
                  size="sm"
                  onClick={handleOpenBatchAdjust}
                  leftIcon={<Package size={13} />}
                >
                  Movimentar em Lote
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowBatchDeleteModal(true)}
                  leftIcon={<Trash2 size={13} />}
                >
                  Excluir Selecionados
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          VIEW MODE 1: SHOWROOM CATALOG WITH LARGE PHOTOS
         ------------------------------------------------------------- */}
      {viewMode === "catalog" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedItems.map((item) => {
            const hasImage = Boolean(item.imageUrl && item.imageUrl.trim() !== "");
            const isAvailable = item.quantity > 0;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Frame Container */}
                  <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/70 mb-3.5 flex items-center justify-center">
                    {hasImage ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-50 to-amber-50/40 flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-white/90 border border-slate-200 flex items-center justify-center text-amber-600 mb-2 shadow-2xs">
                          <Sparkles size={22} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">Sem Foto Cadastrada</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 font-medium">{item.category}</span>
                      </div>
                    )}

                    {/* Zoom button */}
                    {hasImage && (
                      <button
                        type="button"
                        onClick={() => setZoomedImage({ url: item.imageUrl!, title: item.name })}
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer shadow-xs"
                        title="Ampliar Foto"
                      >
                        <Maximize2 size={13} />
                      </button>
                    )}

                    {/* Availability Tag on Top Right */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shadow-xs backdrop-blur-md ${
                        isAvailable
                          ? "bg-emerald-600/90 text-white"
                          : "bg-amber-600/90 text-white"
                      }`}>
                        {isAvailable ? "✓ Disponível" : "Sob Encomenda"}
                      </span>
                    </div>

                    {/* SKU on Top Left */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-white/90 text-slate-700 shadow-3xs">
                        {item.code || "INS-000"}
                      </span>
                    </div>
                  </div>

                  {/* Item Data */}
                  <div className="space-y-1.5 px-1">
                    <span className="text-[10.5px] font-bold text-amber-700 uppercase tracking-wider block">
                      {item.category}
                    </span>
                    <h3 className="font-serif font-bold text-sm text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-2">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Card Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 px-1">
                  <div>
                    {commercialMode ? (
                      <div>
                        {showStockInCatalog ? (
                          <span className="text-xs font-mono font-bold text-slate-800 block">
                            {item.quantity} {item.unit}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 block">
                            Pronta Entrega
                          </span>
                        )}
                        <span className="text-[9.5px] text-slate-400 block">Opção para Personalização</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-900 block">
                          R$ {item.unitValue.toFixed(4)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Saldo: {item.quantity} {item.unit}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(item)}
                      title="Ver Ficha Técnica"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-amber-700 transition-colors cursor-pointer"
                    >
                      <BarChart2 size={13} />
                    </button>
                    {!commercialMode && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenAdjust(item)}
                          title="Movimentar Saldo"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-amber-700 transition-colors cursor-pointer"
                        >
                          <ArrowUpDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          title="Editar Foto e Insumo"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ id: item.id, name: item.name })}
                          title="Excluir"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={<Package size={32} className="text-slate-400" />}
                title="Nenhum insumo encontrado"
                description="Não há insumos cadastrados para os critérios ou filtros selecionados."
                action={
                  <Button size="sm" onClick={handleOpenAdd} leftIcon={<Plus size={14} className="text-amber-400" />}>
                    Cadastrar Primeiro Insumo
                  </Button>
                }
              />
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          VIEW MODE 2: COMPACT ADMINISTRATIVE CARDS
         ------------------------------------------------------------- */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedItems.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-4">
                {/* Miniature Photo */}
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={20} className="text-slate-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <Badge variant="neutral" size="sm">
                      {item.code}
                    </Badge>
                    <Badge variant={item.quantity === 0 ? "danger" : item.quantity <= item.minQuantity ? "warning" : "emerald"} size="sm">
                      {item.quantity} {item.unit}
                    </Badge>
                  </div>
                  <h3 className="font-serif font-bold text-sm text-slate-900 mt-1.5 truncate">{item.name}</h3>
                  <p className="text-[11px] text-slate-500">{item.category}</p>
                  {!commercialMode && (
                    <p className="text-xs font-mono font-bold text-slate-900 mt-1">
                      R$ {item.unitValue.toFixed(4)} / {item.unit}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button size="sm" variant="outline" onClick={() => handleOpenDetails(item)}>
                  Ficha Técnica
                </Button>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleOpenAdjust(item)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                    title="Ajustar Saldo"
                  >
                    <ArrowUpDown size={13} />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                    title="Editar"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ id: item.id, name: item.name })}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={<Package size={32} className="text-slate-400" />}
                title="Nenhum insumo encontrado"
                description="Não há insumos cadastrados para os critérios ou filtros selecionados."
                action={
                  <Button size="sm" onClick={handleOpenAdd} leftIcon={<Plus size={14} className="text-amber-400" />}>
                    Cadastrar Primeiro Insumo
                  </Button>
                }
              />
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          VIEW MODE 3: HIGH-DENSITY TABLE WITH PHOTO THUMBNAIL
         ------------------------------------------------------------- */}
      {viewMode === "table" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {isSelectionMode && <th className="py-3 px-3 w-10 text-center">Sel</th>}
                  <th className="py-3 px-3 w-14 text-center">Foto</th>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Nome do Insumo</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Fornecedor</th>
                  {!commercialMode && <th className="py-3 px-4 text-right">Valor Unit.</th>}
                  <th className="py-3 px-4 text-center">Saldo</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((item) => {
                  const isLow = item.quantity <= item.minQuantity && item.quantity > 0;
                  const isCritical = item.quantity === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {isSelectionMode && (
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedItemIds.includes(item.id)}
                            onChange={() => {
                              if (selectedItemIds.includes(item.id)) {
                                setSelectedItemIds(selectedItemIds.filter((id) => id !== item.id));
                              } else {
                                setSelectedItemIds([...selectedItemIds, item.id]);
                              }
                            }}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                        </td>
                      )}

                      {/* Photo Thumbnail */}
                      <td className="py-2.5 px-3 text-center">
                        <div
                          onClick={() => item.imageUrl && setZoomedImage({ url: item.imageUrl, title: item.name })}
                          className={`w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden mx-auto flex items-center justify-center ${
                            item.imageUrl ? "cursor-pointer hover:ring-2 hover:ring-amber-500/40" : ""
                          }`}
                          title={item.imageUrl ? "Clique para ampliar foto" : "Sem foto cadastrada"}
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={14} className="text-slate-300" />
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{item.code || "INS-000"}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-4 text-slate-600">{item.category}</td>
                      <td className="py-3 px-4 text-slate-500">{item.supplier || "—"}</td>
                      {!commercialMode && (
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          R$ {item.unitValue.toFixed(4)}
                        </td>
                      )}
                      <td className="py-3 px-4 text-center font-mono">
                        <Badge variant={isCritical ? "danger" : isLow ? "warning" : "emerald"} size="sm">
                          {item.quantity} {item.unit}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={item.status === "active" ? "emerald" : "neutral"} size="sm">
                          {item.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetails(item)}
                            title="Ficha Técnica & Rastreabilidade"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-amber-700 cursor-pointer transition-colors"
                          >
                            <BarChart2 size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenAdjust(item)}
                            title="Movimentar Saldo"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-amber-700 cursor-pointer transition-colors"
                          >
                            <ArrowUpDown size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Editar Insumo e Foto"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: item.id, name: item.name })}
                            title="Excluir"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 cursor-pointer transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8">
                      <EmptyState
                        icon={<Package size={32} className="text-slate-400" />}
                        title="Nenhum insumo encontrado"
                        description="Não há insumos cadastrados para os critérios ou filtros selecionados."
                        action={
                          <Button size="sm" onClick={handleOpenAdd} leftIcon={<Plus size={14} className="text-amber-400" />}>
                            Cadastrar Primeiro Insumo
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredItems.length / itemsPerPage)}
        totalItems={filteredItems.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
        labelSingular="matéria-prima"
        labelPlural="matérias-primas"
      />

      {/* PHOTO ZOOM MODAL */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="bg-white rounded-3xl p-4 max-w-lg w-full space-y-3 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-serif font-bold text-sm text-slate-900 truncate">
                {zoomedImage.title}
              </h4>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="w-full h-80 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (!deleteConfirm) return;
          deleteInventoryItem(deleteConfirm.id);
          toast.success("Insumo Excluído", `"${deleteConfirm.name}" foi removido do estoque.`);
          setDeleteConfirm(null);
        }}
        title="Confirmar Exclusão de Matéria-Prima"
        description={`Deseja realmente excluir "${deleteConfirm?.name}"? Esta operação é irreversível.`}
        confirmText="Sim, Excluir"
        variant="danger"
      />

      {/* BATCH DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={showBatchDeleteModal}
        onClose={() => setShowBatchDeleteModal(false)}
        onConfirm={() => {
          selectedItemIds.forEach((id) => deleteInventoryItem(id));
          toast.success("Exclusão em Lote", `${selectedItemIds.length} insumos foram excluídos.`);
          setSelectedItemIds([]);
          setIsSelectionMode(false);
          setShowBatchDeleteModal(false);
        }}
        title="Excluir Múltiplos Insumos"
        description={`Deseja excluir permanentemente os ${selectedItemsCount} insumos selecionados?`}
        confirmText="Sim, Excluir Selecionados"
        variant="danger"
      />
    </div>
  );
};
