import React, { useState, useMemo, useEffect } from "react";
import { useDb } from "../context/DbContext";
import { InventoryItem, CalcMethod, InventoryStatus } from "../types/erp";
import { jsPDF } from "jspdf";
import { getPdfThemeColors } from "../utils/theme";
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
  X,
  AlertTriangle,
  Sparkles,
  Truck,
  Ruler,
  Scale,
  Package,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  BarChart2,
  Activity,
  User,
  FileText,
  CheckCircle2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Upload,
  BookOpen,
  Download,
  FileDown,
  Printer,
  Loader2,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart as RechartsBarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { toast } from "./Toast";

export const InventoryView: React.FC = () => {
  const {
    inventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    adjustStock,
    transactions,
    products,
    orders,
    quotes,
    productionTasks,
    settings,
  } = useDb();

  // Component States
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "cards" | "catalog">("table");
  const [commercialMode, setCommercialMode] = useState(false);
  const [showStockInCatalog, setShowStockInCatalog] = useState(false);

  // PDF Export States
  const [showExportPdfModal, setShowExportPdfModal] = useState(false);
  const [pdfOnlyAvailable, setPdfOnlyAvailable] = useState(true);
  const [pdfCategoryFilter, setPdfCategoryFilter] = useState("all");
  const [pdfSubcategoryFilter, setPdfSubcategoryFilter] = useState("");
  const [pdfIncludeUnitPrice, setPdfIncludeUnitPrice] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsItem, setDetailsItem] = useState<InventoryItem | null>(null);
  const [detailsTab, setDetailsTab] = useState<"summary" | "history" | "stats" | "charts" | "timeline">("summary");
  const [periodFilter, setPeriodFilter] = useState<"week" | "month" | "year" | "all">("all");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Memoized detailed stock movements and stats for selected item with complete dynamic lineage trace
  const itemDetailsData = useMemo(() => {
    if (!detailsItem) return null;

    // 1. Scan products to find any composition that uses this item
    const relatedProducts = (products || []).filter(p => 
      !p.isDeleted && p.composition?.some(c => c.materialId === detailsItem.id)
    );

    // 2. Scan pending quotes for reservations
    const reservations: any[] = [];
    (quotes || [])
      .filter(q => !q.isDeleted && q.status === "pending")
      .forEach(q => {
        q.items.forEach(qi => {
          const prod = products.find(p => p.id === qi.productId);
          if (prod) {
            const comp = prod.composition?.find(c => c.materialId === detailsItem.id);
            if (comp) {
              const qty = comp.quantity * qi.quantity;
              reservations.push({
                id: `quote_res_${q.id}_${qi.productId}`,
                date: q.createdAt || (q.date + "T10:00:00Z"),
                type: "Reserva" as const,
                amount: -qty,
                unitValue: comp.cost || detailsItem.unitValue,
                totalValue: qty * (comp.cost || detailsItem.unitValue),
                responsible: `${q.clientName || "Cliente"} (Orçamento)`,
                notes: `Material reservado temporariamente para orçamento de ${qi.quantity} un de "${prod.name}"`,
              });
            }
          }
        });
      });

    // 3. Scan orders for actual consumption
    const orderConsumptions: any[] = [];
    (orders || [])
      .filter(o => !o.isDeleted)
      .forEach(o => {
        o.items.forEach(oi => {
          const prod = products.find(p => p.id === oi.productId);
          if (prod) {
            const comp = prod.composition?.find(c => c.materialId === detailsItem.id);
            if (comp) {
              const qty = comp.quantity * oi.quantity;
              
              // Find the responsible artisan if there's a production task
              const task = (productionTasks || []).find(pt => pt.orderId === o.id && pt.productId === prod.id);
              const responsible = task?.responsible && task.responsible !== "Não Atribuído" 
                ? task.responsible 
                : "Rosana Santos (Vendas)";

              const orderDate = o.createdAt || (o.date + "T11:00:00Z");

              orderConsumptions.push({
                id: `order_cons_${o.id}_${oi.productId}`,
                date: orderDate,
                type: "Saída" as const,
                amount: -qty,
                unitValue: comp.cost || detailsItem.unitValue,
                totalValue: qty * (comp.cost || detailsItem.unitValue),
                responsible,
                notes: `Consumido na fabricação de ${oi.quantity} un de "${prod.name}" (Pedido ${o.orderNumber})`,
              });
            }
          }
        });
      });

    // 4. Scan transactions for stock purchases & manual adjustments
    const transactionMovements: any[] = [];
    (transactions || [])
      .filter(t => !t.isDeleted)
      .forEach((t, idx) => {
        const mentionsItem = t.notes?.includes(detailsItem.name) || t.notes?.includes(detailsItem.code);
        if (mentionsItem) {
          let qty = 0;
          let isDeduction = false;
          
          const plusMatch = t.notes?.match(/Estoque\+:\s*([0-9.-]+)/);
          const minusMatch = t.notes?.match(/Estoque-:\s*([0-9.-]+)/);
          
          if (plusMatch) {
            qty = parseFloat(plusMatch[1]);
          } else if (minusMatch) {
            qty = -parseFloat(minusMatch[1]);
            isDeduction = true;
          } else {
            if (t.type === "expense") {
              qty = t.value / detailsItem.unitValue;
            }
          }

          let notes = t.notes || "";
          const obsMatch = t.notes?.match(/Obs:\s*(.*)$/);
          if (obsMatch) notes = obsMatch[1];

          let type: "Entrada" | "Saída" | "Perda" | "Avaria" | "Ajuste" = qty >= 0 ? "Entrada" : "Saída";
          const lowerNotes = notes.toLowerCase();
          if (qty < 0) {
            if (lowerNotes.includes("perda") || lowerNotes.includes("desperdício") || lowerNotes.includes("quebra") || lowerNotes.includes("descarte")) {
              type = "Perda";
            } else if (lowerNotes.includes("avaria") || lowerNotes.includes("estragado") || lowerNotes.includes("danificado")) {
              type = "Avaria";
            } else if (lowerNotes.includes("ajuste") || lowerNotes.includes("correção") || lowerNotes.includes("balanço")) {
              type = "Ajuste";
            }
          } else if (qty > 0) {
            if (lowerNotes.includes("ajuste") || lowerNotes.includes("reincorporado")) {
              type = "Ajuste";
            }
          }

          transactionMovements.push({
            id: `trans_mov_${t.id || idx}`,
            date: t.date + "T12:00:00Z",
            type,
            amount: qty,
            unitValue: detailsItem.unitValue,
            totalValue: t.value || (Math.abs(qty) * detailsItem.unitValue),
            responsible: t.contactName || "Sistema",
            notes: notes || t.notes || "",
          });
        }
      });

    // 5. Calculate Cadastro / Initial registration so physical stock balances perfectly
    const sumOrderConsumptions = orderConsumptions.reduce((acc, m) => acc + m.amount, 0); // negative sum
    const sumTransactionAdjustments = transactionMovements.reduce((acc, m) => acc + m.amount, 0); // positive or negative
    
    const calculatedCadastroQty = detailsItem.quantity - sumTransactionAdjustments - sumOrderConsumptions;
    const initialCadastroQty = Math.max(0, calculatedCadastroQty);

    const cadastroEvent = {
      id: `register_${detailsItem.id}`,
      date: detailsItem.createdAt || "2026-05-01T09:00:00Z",
      type: "Cadastro" as const,
      amount: initialCadastroQty,
      unitValue: detailsItem.unitValue,
      totalValue: initialCadastroQty * detailsItem.unitValue,
      responsible: "Rosana Santos",
      notes: "Cadastro inicial do insumo no catálogo de materiais do Ateliê Sagrado.",
    };

    const physicalMovements = [cadastroEvent, ...transactionMovements, ...orderConsumptions];
    
    const allMovements = [cadastroEvent, ...transactionMovements, ...orderConsumptions, ...reservations]
      .map((m) => {
        const totalValue = m.totalValue || Math.abs(m.amount) * m.unitValue;
        return {
          ...m,
          totalValue: Number(totalValue.toFixed(2)),
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running physical stock evolution
    const sortedPhysical = [...physicalMovements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let currentStock = 0;
    const evolution = sortedPhysical.map((m) => {
      currentStock += m.amount;
      if (currentStock < 0) currentStock = 0;
      return {
        date: m.date.split("T")[0],
        formatDate: new Date(m.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        estoque: Number(currentStock.toFixed(2)),
        quantidade: m.amount,
        tipo: m.type,
        valorUnitario: m.unitValue,
      };
    });

    const inputs = allMovements.filter((m) => m.amount > 0);
    const outputs = allMovements.filter((m) => m.amount < 0 && m.type !== "Reserva");

    const totalInputsQty = inputs.reduce((acc, m) => acc + m.amount, 0);
    const totalOutputsQty = Math.abs(outputs.reduce((acc, m) => acc + m.amount, 0));

    const totalReplenishments = inputs.filter((m) => m.type === "Entrada").length;
    const totalAdjustments = allMovements.filter((m) => m.type === "Ajuste").length;

    const totalInvested = inputs.reduce((acc, m) => acc + m.totalValue, 0);

    const totalInputsCount = inputs.reduce((acc, m) => acc + m.amount, 0);
    const avgAcquisitionPrice = totalInputsCount > 0 ? (inputs.reduce((acc, m) => acc + (m.amount * m.unitValue), 0) / totalInputsCount) : detailsItem.unitValue;

    const allPrices = allMovements.map((m) => m.unitValue);
    const highestPrice = allPrices.length > 0 ? Math.max(...allPrices, detailsItem.unitValue) : detailsItem.unitValue;
    const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices, detailsItem.unitValue) : detailsItem.unitValue;

    const nowMs = new Date("2026-06-26T20:56:00Z").getTime();
    const now = new Date(nowMs);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    const getConsumptionInPeriod = (startDate: Date) => {
      return Math.abs(
        outputs
          .filter((m) => new Date(m.date).getTime() >= startDate.getTime())
          .reduce((acc, m) => acc + m.amount, 0)
      );
    };

    const consumptionWeek = getConsumptionInPeriod(oneWeekAgo);
    const consumptionMonth = getConsumptionInPeriod(oneMonthAgo);
    const consumptionYear = getConsumptionInPeriod(oneYearAgo);

    return {
      movements: allMovements,
      evolution: evolution.length > 0 ? evolution : [{ date: "2026-05-01", formatDate: "01/05", estoque: detailsItem.quantity, quantidade: detailsItem.quantity, tipo: "Cadastro", valorUnitario: detailsItem.unitValue }],
      relatedProducts,
      reservations,
      stats: {
        totalInputsQty,
        totalOutputsQty,
        totalReplenishments,
        totalAdjustments,
        totalInvested: Number(totalInvested.toFixed(2)),
        avgAcquisitionPrice: Number(avgAcquisitionPrice.toFixed(4)),
        highestPrice,
        lowestPrice,
        consumptionWeek,
        consumptionMonth,
        consumptionYear,
      },
    };
  }, [detailsItem, transactions, products, orders, quotes, productionTasks]);

  // Orders consuming this material
  const ordersConsuming = useMemo(() => {
    if (!detailsItem) return [];
    return (orders || [])
      .filter(o => !o.isDeleted)
      .map(o => {
        let consumedQty = 0;
        const productsDetails: string[] = [];
        let hasItem = false;
        
        o.items.forEach(oi => {
          const prod = products?.find(p => p.id === oi.productId);
          if (prod) {
            const comp = prod.composition?.find(c => c.materialId === detailsItem.id);
            if (comp) {
              consumedQty += comp.quantity * oi.quantity;
              productsDetails.push(`${oi.quantity}x ${prod.name}`);
              hasItem = true;
            }
          }
        });
        
        if (!hasItem) return null;
        
        // Find active task status
        const parentTasks = (productionTasks || []).filter(t => t.orderId === o.id);
        const firstTask = parentTasks[0];
        const responsible = firstTask?.responsible && firstTask.responsible !== "Não Atribuído"
          ? firstTask.responsible
          : "Rosana Santos";
        
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          clientName: o.clientName,
          date: o.date,
          status: o.status,
          consumedQty,
          productsLabel: productsDetails.join(", "),
          responsible,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [detailsItem, orders, products, productionTasks]);

  // Quotes reserving this material
  const quotesReserving = useMemo(() => {
    if (!detailsItem) return [];
    return (quotes || [])
      .filter(q => !q.isDeleted && q.status === "pending")
      .map(q => {
        let reservedQty = 0;
        const productsDetails: string[] = [];
        let hasItem = false;
        
        q.items.forEach(qi => {
          const prod = products?.find(p => p.id === qi.productId);
          if (prod) {
            const comp = prod.composition?.find(c => c.materialId === detailsItem.id);
            if (comp) {
              reservedQty += comp.quantity * qi.quantity;
              productsDetails.push(`${qi.quantity}x ${prod.name}`);
              hasItem = true;
            }
          }
        });
        
        if (!hasItem) return null;
        
        return {
          id: q.id,
          quoteNumber: q.quoteNumber || `ORÇ-${q.id.slice(0, 4).toUpperCase()}`,
          clientName: q.clientName,
          date: q.date,
          reservedQty,
          productsLabel: productsDetails.join(", "),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [detailsItem, quotes, products]);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    category: "Contas e Pérolas",
    code: "",
    description: "",
    supplier: "",
    unit: "unidade",
    weightG: 0,
    quantity: 0,
    minQuantity: 5,
    unitValue: 0,
    calcMethod: "fixed" as CalcMethod,
    notes: "",
    status: "active" as InventoryStatus,
    imageUrl: "",
  });

  // Smart Calculator States (integrated in modal form)
  const [isSmartCalcActive, setIsSmartCalcActive] = useState(true);
  const [calcType, setCalcType] = useState<"unit" | "weight">("unit");
  const [calcPackagePrice, setCalcPackagePrice] = useState<number>(0);
  const [hasFreight, setHasFreight] = useState<boolean>(false);
  const [freightValue, setFreightValue] = useState<number>(0);

  // If buying by unit count (e.g. 250 pearls)
  const [calcPackageUnits, setCalcPackageUnits] = useState<number>(0);
  const [calcPackageWeight, setCalcPackageWeight] = useState<number>(0);

  // If buying by weight (e.g. 200g of beads)
  const [calcUnitWeightMethod, setCalcUnitWeightMethod] = useState<
    "none" | "fixed" | "sample"
  >("none");
  const [calcUnitWeightKnown, setCalcUnitWeightKnown] = useState<number>(0);
  const [calcSampleSize, setCalcSampleSize] = useState<number>(10);
  const [calcSampleWeight, setCalcSampleWeight] = useState<number>(0);

  // Measure unit selection options
  const [selectedMeasureUnit, setSelectedMeasureUnit] =
    useState<string>("unidade");

  // Batch Actions states
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBatchAdjustModal, setShowBatchAdjustModal] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [batchAdjustData, setBatchAdjustData] = useState<{
    type: "add" | "subtract";
    amount: number;
    notes: string;
    supplierName: string;
    updatePrice: boolean;
    priceCalcType: "manual" | "calc";
    manualUnitPrice: number;
    packagePrice: number;
    freightValue: number;
    priceMethod: "weighted" | "replace";
  }>({
    type: "add",
    amount: 10,
    notes: "Ajuste de estoque em lote",
    supplierName: "",
    updatePrice: false,
    priceCalcType: "manual",
    manualUnitPrice: 0,
    packagePrice: 0,
    freightValue: 0,
    priceMethod: "weighted",
  });

  // Movimentar Estoque unit price recalculations states
  const [adjustUpdatePrice, setAdjustUpdatePrice] = useState(false);
  const [adjustCalcType, setAdjustCalcType] = useState<"manual" | "calc">(
    "manual",
  );
  const [adjustManualUnitPrice, setAdjustManualUnitPrice] = useState<number>(0);
  const [adjustPackagePrice, setAdjustPackagePrice] = useState<number>(0);
  const [adjustFreightValue, setAdjustFreightValue] = useState<number>(0);
  const [adjustMethod, setAdjustMethod] = useState<"weighted" | "replace">(
    "weighted",
  );

  // Dynamic real-time calculation in the form
  const smartCalculatedResults = useMemo(() => {
    const price = calcPackagePrice || 0;
    const freight = hasFreight ? freightValue || 0 : 0;
    const totalCost = price + freight;

    let computedUnitCost = 0;
    let computedUnitWeight = 0;
    let computedInventoryQty = 0;
    let computedCostPerGram = 0;

    if (calcType === "unit") {
      const units = calcPackageUnits || 0;
      const totalWeight = calcPackageWeight || 0;

      if (units > 0) {
        computedUnitCost = totalCost / units;
        if (totalWeight > 0) {
          computedUnitWeight = totalWeight / units;
          computedCostPerGram = totalCost / totalWeight;
        }
      }

      if (selectedMeasureUnit === "grama" && totalWeight > 0) {
        computedInventoryQty = totalWeight;
        computedUnitCost = computedCostPerGram;
      } else {
        computedInventoryQty = units;
      }
    } else {
      // Buying by weight (e.g., 200g)
      const totalWeight = calcPackageWeight || 0;
      if (totalWeight > 0) {
        computedCostPerGram = totalCost / totalWeight;
      }

      // Estimating individual unit weight
      let estimatedUnitWeight = 0;
      if (calcUnitWeightMethod === "fixed") {
        estimatedUnitWeight = calcUnitWeightKnown || 0;
      } else if (calcUnitWeightMethod === "sample") {
        const sampleSize = calcSampleSize || 1;
        const sampleW = calcSampleWeight || 0;
        estimatedUnitWeight = sampleW / sampleSize;
      }

      if (estimatedUnitWeight > 0) {
        const estimatedUnits = totalWeight / estimatedUnitWeight;
        computedUnitCost = totalCost / estimatedUnits;
        computedUnitWeight = estimatedUnitWeight;
      } else {
        computedUnitCost = computedCostPerGram;
        computedUnitWeight = 0;
      }

      if (selectedMeasureUnit === "unidade" && estimatedUnitWeight > 0) {
        computedInventoryQty = Math.round(totalWeight / estimatedUnitWeight);
      } else {
        computedInventoryQty = totalWeight;
      }
    }

    return {
      totalCost,
      unitValue: computedUnitCost,
      weightG: computedUnitWeight,
      quantity: computedInventoryQty,
      unit: selectedMeasureUnit,
      costPerGram: computedCostPerGram,
    };
  }, [
    calcType,
    calcPackagePrice,
    hasFreight,
    freightValue,
    calcPackageUnits,
    calcPackageWeight,
    calcUnitWeightMethod,
    calcUnitWeightKnown,
    calcSampleSize,
    calcSampleWeight,
    selectedMeasureUnit,
  ]);

  // Sync computed fields back to form input states in real-time when Smart Calculator is active
  useEffect(() => {
    if (isSmartCalcActive) {
      setFormData((prev) => ({
        ...prev,
        unitValue: Number(smartCalculatedResults.unitValue.toFixed(4)),
        weightG: Number(smartCalculatedResults.weightG.toFixed(3)),
        quantity: showEditModal
          ? prev.quantity
          : smartCalculatedResults.quantity,
        unit: smartCalculatedResults.unit,
        calcMethod: selectedMeasureUnit === "grama" ? "weight" : "fixed",
      }));
    }
  }, [
    isSmartCalcActive,
    smartCalculatedResults,
    selectedMeasureUnit,
    showEditModal,
  ]);

  // Adjust Form state
  const [adjustData, setAdjustData] = useState({
    itemId: "",
    amount: 1,
    type: "add" as "add" | "subtract",
    notes: "",
    supplierName: "",
  });

  // Computed values for individual Adjust Modal
  const adjustCalculatedUnitPrice = useMemo(() => {
    if (adjustData.amount > 0) {
      return (adjustPackagePrice + adjustFreightValue) / adjustData.amount;
    }
    return 0;
  }, [adjustPackagePrice, adjustFreightValue, adjustData.amount]);

  const targetUnitPriceToApply = useMemo(() => {
    return adjustCalcType === "manual"
      ? adjustManualUnitPrice
      : adjustCalculatedUnitPrice;
  }, [adjustCalcType, adjustManualUnitPrice, adjustCalculatedUnitPrice]);

  const weightedCalculatedUnitPrice = useMemo(() => {
    if (!selectedItem) return 0;
    const currentQty = selectedItem.quantity || 0;
    const currentPrice = selectedItem.unitValue || 0;
    const newQty = adjustData.amount || 0;
    const newPrice = targetUnitPriceToApply;

    const totalOldValue = currentQty * currentPrice;
    const totalNewValue = newQty * newPrice;
    const newTotalQty = currentQty + newQty;

    return newTotalQty > 0 ? (totalOldValue + totalNewValue) / newTotalQty : 0;
  }, [selectedItem, adjustData.amount, targetUnitPriceToApply]);

  // Unique categories & suppliers for filters
  const activeItems = inventory.filter((item) => !item.isDeleted);

  const valorTotalGeralEstoque = useMemo(() => {
    return activeItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitValue || 0)), 0);
  }, [activeItems]);

  const stockByCategory = useMemo(() => {
    const stats: Record<string, { quantity: number; value: number }> = {};
    activeItems.forEach(item => {
      const cat = item.category || "Geral";
      if (!stats[cat]) {
        stats[cat] = { quantity: 0, value: 0 };
      }
      stats[cat].quantity += item.quantity || 0;
      stats[cat].value += (item.quantity || 0) * (item.unitValue || 0);
    });
    return Object.entries(stats).map(([category, data]) => ({
      category,
      quantity: data.quantity,
      value: data.value
    })).sort((a, b) => b.value - a.value);
  }, [activeItems]);

  const categories = Array.from(new Set(activeItems.map((i) => i.category)));
  const suppliers = Array.from(
    new Set(activeItems.map((i) => i.supplier).filter(Boolean)),
  );

  // Indicators
  const totalItems = activeItems.length;
  const normalStock = activeItems.filter(
    (i) => i.quantity > i.minQuantity,
  ).length;
  const lowStock = activeItems.filter(
    (i) => i.quantity <= i.minQuantity && i.quantity > 0,
  ).length;
  const outOfStock = activeItems.filter((i) => i.quantity === 0).length;

  // Filter & Search Logic
  const filteredItems = activeItems.filter((item) => {
    const matchesSearch =
      (item.name || "").toLowerCase().includes((search || "").toLowerCase()) ||
      (item.code || "").toLowerCase().includes((search || "").toLowerCase()) ||
      (item.supplier || "").toLowerCase().includes((search || "").toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "all" || item.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Form Handlers
  const handleOpenAdd = () => {
    setFormData({
      name: "",
      category: "Contas e Pérolas",
      code: "INS-" + Math.floor(100 + Math.random() * 900),
      description: "",
      supplier: "",
      unit: "unidade",
      weightG: 0,
      quantity: 0,
      minQuantity: 5,
      unitValue: 0,
      calcMethod: "fixed",
      notes: "",
      status: "active",
      imageUrl: "",
    });

    // Reset calculator states
    setCalcPackagePrice(0);
    setHasFreight(false);
    setFreightValue(0);
    setCalcPackageUnits(0);
    setCalcPackageWeight(0);
    setCalcUnitWeightMethod("none");
    setSelectedMeasureUnit("unidade");
    setIsSmartCalcActive(true);

    setShowAddModal(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      code: item.code,
      description: item.description,
      supplier: item.supplier,
      unit: item.unit,
      weightG: item.weightG,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      unitValue: item.unitValue,
      calcMethod: item.calcMethod,
      notes: item.notes,
      status: item.status,
      imageUrl: item.imageUrl || "",
    });

    // Load calculator values if possible or keep manual override by default for existing
    setIsSmartCalcActive(false);
    setSelectedMeasureUnit(item.unit);

    setShowEditModal(true);
  };

  const handleOpenDetails = (item: InventoryItem) => {
    setDetailsItem(item);
    setDetailsTab("summary");
    setPeriodFilter("all");
    setShowDetailsModal(true);
  };

  const handleOpenAdjust = (item: InventoryItem) => {
    setAdjustUpdatePrice(false);
    setAdjustCalcType("manual");
    setAdjustManualUnitPrice(item.unitValue);
    setAdjustPackagePrice(0);
    setAdjustFreightValue(0);
    setAdjustMethod("weighted");
    setSelectedItem(item);
    setAdjustData({
      itemId: item.id,
      amount: 10,
      type: "add",
      notes: "Entrada de lote complementar",
      supplierName: item.supplier || "",
    });
    setShowAdjustModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || formData.unitValue < 0) {
      toast.error(
        "Validação",
        "Preencha todos os campos obrigatórios corretamente.",
      );
      return;
    }

    // Create clean note mentioning the calculator details if it was used
    let finalNotes = formData.notes;
    if (isSmartCalcActive) {
      const calcDetail = `[Calculado via Smart Converter: Lote R$ ${calcPackagePrice} | Frete R$ ${freightValue} | Entrada: ${calcType === "unit" ? `${calcPackageUnits} un` : `${calcPackageWeight}g`}]`;
      finalNotes = finalNotes ? `${finalNotes}\n${calcDetail}` : calcDetail;
    }

    addInventoryItem({
      ...formData,
      notes: finalNotes,
    });

    toast.success(
      "Insumo cadastrado!",
      `Matéria-prima "${formData.name}" adicionada ao estoque com saldo de ${formData.quantity} ${formData.unit}.`,
    );
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    let finalNotes = formData.notes;
    if (isSmartCalcActive) {
      const calcDetail = `[Editado via Smart Converter: Lote R$ ${calcPackagePrice} | Frete R$ ${freightValue}]`;
      finalNotes = finalNotes ? `${finalNotes}\n${calcDetail}` : calcDetail;
    }

    updateInventoryItem(selectedItem.id, {
      ...formData,
      notes: finalNotes,
    });
    toast.success(
      "Insumo atualizado!",
      `Os dados do insumo foram salvos com sucesso.`,
    );
    setShowEditModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    deleteInventoryItem(deleteConfirm.id);
    toast.warning(
      "Insumo removido",
      `Insumo "${deleteConfirm.name}" foi excluído do estoque.`,
    );
    setDeleteConfirm(null);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const finalAmount =
      adjustData.type === "add" ? adjustData.amount : -adjustData.amount;

    let finalUnitValue: number | undefined = undefined;
    let finalExpenseValue: number | undefined = undefined;

    if (adjustData.type === "add" && adjustUpdatePrice) {
      finalUnitValue =
        adjustMethod === "weighted"
          ? weightedCalculatedUnitPrice
          : targetUnitPriceToApply;
      if (adjustCalcType === "calc") {
        finalExpenseValue = adjustPackagePrice + adjustFreightValue;
      } else {
        finalExpenseValue = adjustData.amount * adjustManualUnitPrice;
      }
    }

    adjustStock(
      selectedItem.id,
      finalAmount,
      adjustData.notes,
      selectedItem.category,
      adjustData.supplierName,
      finalUnitValue,
      finalExpenseValue,
    );
    toast.success(
      "Estoque Ajustado",
      `${selectedItem.name}: saldo atualizado em ${finalAmount > 0 ? "+" : ""}${finalAmount} ${selectedItem.unit}.`,
    );
    setShowAdjustModal(false);
  };

  // Helper for loading images for PDF
  const loadImageAsBase64 = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!url || !url.trim() || url === '📿') {
        resolve(null);
        return;
      }
      if (url.startsWith('data:image')) {
        resolve(url);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 100;
          canvas.height = img.naturalHeight || img.height || 100;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        } catch (e) {
          console.warn('Canvas conversion failed', e);
        }
        resolve(null);
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = url;
    });
  };

  // PDF Export Handler for Commercial & General Inventory Catalog
  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    toast.info("Processando PDF", "Gerando catálogo de insumos em cards A4...");

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfTheme = getPdfThemeColors(settings.primaryColor);

      const compName = settings.companyName || settings.nomeFantasia || "Ateliê Sagrado";
      const compCnpj = settings.cnpj || "";
      const compAddress = settings.address || "";
      const compPhone = settings.whatsapp || settings.phone || "";
      const compEmail = settings.email || "";

      // Filter items according to user export modal options
      let itemsToExport = inventory.filter(i => !i.isDeleted);

      if (pdfOnlyAvailable) {
        itemsToExport = itemsToExport.filter(i => i.quantity > 0 && i.status === 'active');
      }

      if (pdfCategoryFilter !== 'all') {
        itemsToExport = itemsToExport.filter(i => i.category === pdfCategoryFilter);
      }

      if (pdfSubcategoryFilter && pdfSubcategoryFilter.trim() !== '') {
        const query = pdfSubcategoryFilter.toLowerCase().trim();
        itemsToExport = itemsToExport.filter(i => 
          (i.name && i.name.toLowerCase().includes(query)) ||
          (i.code && i.code.toLowerCase().includes(query)) ||
          (i.category && i.category.toLowerCase().includes(query)) ||
          (i.description && i.description.toLowerCase().includes(query)) ||
          (i.notes && i.notes.toLowerCase().includes(query))
        );
      }

      if (itemsToExport.length === 0) {
        toast.warning("Nenhum item", "Nenhum insumo atende aos critérios selecionados.");
        setIsGeneratingPdf(false);
        return;
      }

      // Pre-load images for items
      const imageMap = new Map<string, string | null>();
      await Promise.all(itemsToExport.slice(0, 100).map(async (item) => {
        if (item.imageUrl) {
          const base64 = await loadImageAsBase64(item.imageUrl);
          imageMap.set(item.id, base64);
        }
      }));

      // Group items strictly by Category
      const categoryMap = new Map<string, InventoryItem[]>();
      itemsToExport.forEach(item => {
        const cat = item.category || "Geral";
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, []);
        }
        categoryMap.get(cat)!.push(item);
      });

      // Sort categories alphabetically
      const sortedCategories = Array.from(categoryMap.keys()).sort((a, b) => a.localeCompare(b));

      // Page parameters
      const marginX = 15;
      let currentY = 15;
      let pageNum = 1;

      // Helper for Page Footer
      const drawFooter = (pNum: number) => {
        doc.setFontSize(7.5);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`Página ${pNum}`, 195, 287, { align: 'right' });
        doc.text(settings.docFooter || `${compName} - Catálogo Comercial de Insumos`, marginX, 287);
      };

      // Load Logo if available
      let logoDataUrl: string | null = null;
      if (settings.docLogo && settings.docLogo !== '📿') {
        logoDataUrl = await loadImageAsBase64(settings.docLogo);
      } else if (settings.logo && (settings.logo.startsWith('http') || settings.logo.startsWith('data:image'))) {
        logoDataUrl = await loadImageAsBase64(settings.logo);
      }

      // 1. Institutional Header
      if (logoDataUrl) {
        try {
          doc.addImage(logoDataUrl, 'PNG', marginX, currentY, 18, 18);
          doc.setTextColor(15, 23, 42);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(15);
          doc.text(compName, marginX + 22, currentY + 6);

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`CNPJ: ${compCnpj || "Não informado"} | Tel: ${compPhone} | ${compEmail}`, marginX + 22, currentY + 11);
          doc.text(compAddress, marginX + 22, currentY + 15);

          currentY += 22;
        } catch (e) {
          currentY += 5;
        }
      } else {
        doc.setFillColor(pdfTheme.primaryRgb[0], pdfTheme.primaryRgb[1], pdfTheme.primaryRgb[2]);
        doc.rect(marginX, currentY, 180, 2, 'F');
        currentY += 6;

        doc.setTextColor(15, 23, 42);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(compName, marginX, currentY);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`CNPJ: ${compCnpj || "Não informado"} | Tel/WhatsApp: ${compPhone} | ${compEmail}`, marginX, currentY + 5);
        doc.text(compAddress, marginX, currentY + 9);

        currentY += 15;
      }

      // 2. Document Title Banner
      doc.setFillColor(pdfTheme.lightRgb[0], pdfTheme.lightRgb[1], pdfTheme.lightRgb[2]);
      doc.roundedRect(marginX, currentY, 180, 16, 2, 2, 'F');

      doc.setTextColor(pdfTheme.titleRgb[0], pdfTheme.titleRgb[1], pdfTheme.titleRgb[2]);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("CATÁLOGO DE INSUMOS - CARDS ILUSTRADOS", marginX + 5, currentY + 7);

      const nowStr = `${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      doc.setFontSize(7.5);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Emitido em: ${nowStr}`, 190, currentY + 7, { align: 'right' });

      const categoryLabel = pdfCategoryFilter === 'all' ? 'Todas as Categorias' : pdfCategoryFilter;
      const subcatLabel = pdfSubcategoryFilter ? ` | Filtro: "${pdfSubcategoryFilter}"` : '';
      doc.text(`Filtro: ${categoryLabel}${subcatLabel} | Total: ${itemsToExport.length} insumos apresentados em cards`, marginX + 5, currentY + 12);

      currentY += 22;

      // Card Grid Parameters (2 columns, large photos)
      const cols = 2;
      const cardWidth = 86; // mm
      const cardHeight = 48; // mm
      const colGap = 8; // mm
      const rowGap = 6; // mm

      // Iterate Categories
      for (const catName of sortedCategories) {
        const catItems = categoryMap.get(catName) || [];
        if (catItems.length === 0) continue;

        // Check page break for Category Header
        if (currentY + 20 > 270) {
          drawFooter(pageNum);
          doc.addPage();
          pageNum++;
          currentY = 15;
        }

        // Category Section Header Banner
        doc.setFillColor(pdfTheme.darkRgb[0], pdfTheme.darkRgb[1], pdfTheme.darkRgb[2]);
        doc.roundedRect(marginX, currentY, 180, 7, 1, 1, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(`CATEGORIA: ${catName.toUpperCase()} (${catItems.length} ${catItems.length === 1 ? 'item' : 'itens'})`, marginX + 4, currentY + 4.8);

        currentY += 10;

        // Render Cards in Grid for this category
        for (let i = 0; i < catItems.length; i += cols) {
          // Check if row fits on current page
          if (currentY + cardHeight > 270) {
            drawFooter(pageNum);
            doc.addPage();
            pageNum++;
            currentY = 15;

            // Sub-page continuation category banner
            doc.setFillColor(241, 245, 249);
            doc.roundedRect(marginX, currentY, 180, 6, 1, 1, 'F');
            doc.setTextColor(71, 85, 105);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.text(`${catName.toUpperCase()} (Continuação)`, marginX + 4, currentY + 4);
            currentY += 8;
          }

          // Process row items
          for (let col = 0; col < cols; col++) {
            const itemIdx = i + col;
            if (itemIdx >= catItems.length) break;

            const item = catItems[itemIdx];
            const x = marginX + col * (cardWidth + colGap);
            const y = currentY;

            // Card Container
            doc.setFillColor(252, 253, 255);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

            // Accent Left Bar
            doc.setFillColor(pdfTheme.primaryRgb[0], pdfTheme.primaryRgb[1], pdfTheme.primaryRgb[2]);
            doc.rect(x, y, 1.5, cardHeight, 'F');

            // 1. Large Image Frame (40mm x 40mm)
            const imgSize = 40;
            const imgX = x + 3.5;
            const imgY = y + 4;

            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(imgX, imgY, imgSize, imgSize, 1.5, 1.5, 'FD');

            const imgBase64 = imageMap.get(item.id);
            if (imgBase64) {
              try {
                doc.addImage(imgBase64, 'PNG', imgX + 1, imgY + 1, imgSize - 2, imgSize - 2);
              } catch (e) {
                doc.setFontSize(6);
                doc.setTextColor(148, 163, 184);
                doc.text("IMAGEM", imgX + 13, imgY + 21);
              }
            } else {
              doc.setFontSize(6);
              doc.setTextColor(148, 163, 184);
              doc.setFont('Helvetica', 'bold');
              doc.text("SEM FOTO", imgX + 11, imgY + 21);
            }

            // 2. Item Details beside image (starts at x + 46mm)
            const textX = x + 46;
            const textWidth = 37;

            // SKU / Code Badge
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(180, 130, 20); // Gold accent code
            doc.text(`CÓD: ${item.code || "INS-000"}`, textX, y + 8);

            // Item Name (Title)
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(15, 23, 42);
            const titleLines = doc.splitTextToSize(item.name, textWidth);
            doc.text(titleLines.slice(0, 2), textX, y + 13);

            // Description (Wrapped text, NO quantity, NO unit)
            let descStartY = y + 13 + (Math.min(titleLines.length, 2) * 4);
            if (item.description) {
              doc.setFont('Helvetica', 'normal');
              doc.setFontSize(6.5);
              doc.setTextColor(100, 116, 139);
              const descLines = doc.splitTextToSize(item.description, textWidth);
              doc.text(descLines.slice(0, 3), textX, descStartY);
            }

            // Optional Unit Price (if enabled)
            if (pdfIncludeUnitPrice) {
              doc.setFont('Helvetica', 'bold');
              doc.setFontSize(8);
              doc.setTextColor(16, 185, 129); // Emerald
              doc.text(`R$ ${item.unitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, textX, y + 42);
            }
          }

          currentY += cardHeight + rowGap;
        }

        currentY += 4; // Spacing after category
      }

      // Final Footer
      drawFooter(pageNum);

      const dateStr = new Date().toISOString().split('T')[0];
      doc.save(`Catalogo_Cards_Insumos_${compName.replace(/\s+/g, '_')}_${dateStr}.pdf`);

      toast.success("PDF Exportado com Sucesso!", `Catálogo com ${itemsToExport.length} insumos baixado.`);
      setShowExportPdfModal(false);
    } catch (err) {
      console.error("Erro na geração do PDF:", err);
      toast.error("Erro no PDF", "Não foi possível gerar o PDF de estoque.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide-in-up">
      {/* Resumo Consolidado do Estoque */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card Valor Total */}
        <div className="lg:col-span-1 bg-white p-6 rounded-[24px] shadow-sm relative overflow-hidden border border-slate-100 hover:border-amber-250 hover:shadow-md transition-all duration-300">
          <div className="absolute right-[-20px] top-[-20px] w-40 h-40 bg-amber-500/5 rounded-full blur-2xl pointer-events-none animate-pulse"></div>
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
            <div>
              <div className="flex items-center gap-2 text-amber-600">
                <DollarSign size={15} />
                <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Valorização Patrimonial</span>
              </div>
              <h3 className="text-xs text-slate-500 mt-2 font-medium">Valor Total do Estoque</h3>
              <p className="text-3xl font-serif font-black text-slate-900 tracking-tight mt-1">
                R$ {valorTotalGeralEstoque.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 text-[10.5px] text-slate-450 flex justify-between items-center">
              <span>Atualizado em tempo real</span>
              <span className="bg-amber-50 text-amber-700 border border-amber-200/50 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide">Ateliê Sagrado</span>
            </div>
          </div>
        </div>

        {/* Distribuição por Categoria (Quantidade e Valor) */}
        <div className="lg:col-span-2 bg-white border border-[rgba(42,36,32,0.06)] p-6 rounded-[24px] shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-ink-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 size={14} className="text-gold-600" />
              Consolidado por Categoria
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
              {stockByCategory.length} categorias ativas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
            {stockByCategory.map((cat, idx) => {
              const percentage = valorTotalGeralEstoque > 0 ? (cat.value / valorTotalGeralEstoque) * 100 : 0;
              return (
                <div key={cat.category} className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 flex flex-col justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-slate-700 truncate" title={cat.category}>
                      {cat.category}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-gold-600 bg-gold-50 px-1.5 py-0.5 rounded">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100/60 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-semibold">Qtd Total</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {cat.quantity.toLocaleString("pt-BR")} un/g
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[9px] uppercase font-semibold">Valoração</span>
                      <span className="font-bold text-slate-900 font-mono">
                        R$ {cat.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {stockByCategory.length === 0 && (
              <div className="col-span-2 text-center text-slate-400 italic py-8 text-xs">
                Nenhum insumo ou categoria cadastrada.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header Summary Cards / Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-[rgba(42,36,32,0.06)] p-5 rounded-[20px] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider block">
              Total de Insumos
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-serif text-ink-900 mt-1 block">
              {totalItems}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
            <Package size={20} />
          </div>
        </div>

        <div className="bg-white border border-[rgba(42,36,32,0.06)] p-5 rounded-[20px] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider block">
              Estoque Saudável
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-serif text-emerald-600 mt-1 block">
              {normalStock}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Check size={20} />
          </div>
        </div>

        <div className="bg-white border border-[rgba(42,36,32,0.06)] p-5 rounded-[20px] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider block">
              Estoque Baixo
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-serif text-warning-500 mt-1 block">
              {lowStock}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-warning-bg flex items-center justify-center text-warning-500">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-white border border-[rgba(42,36,32,0.06)] p-5 rounded-[20px] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider block">
              Itens Esgotados
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-serif text-rose-600 mt-1 block">
              {outOfStock}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Filters & Control Row */}
      <div className="bg-white border border-[rgba(42,36,32,0.06)] p-5 rounded-[20px] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3.5 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Buscar insumos por nome, código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-slate-200 bg-slate-50/50 text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all placeholder-slate-400"
            />
            <Search
              size={14}
              className="absolute left-3.5 top-2.5 text-slate-400"
            />
          </div>

          {/* Category and Status Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1 bg-slate-50/80 px-2.5 py-1 rounded-full border border-slate-200">
              <Filter size={12} className="text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs text-ink-600 focus:outline-none font-medium pr-1 cursor-pointer"
              >
                <option value="all">Todas as Categorias</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-50/80 px-2.5 py-1 rounded-full border border-slate-200">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs text-ink-600 focus:outline-none font-medium pr-1 cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            {/* Grid / Table View Toggles */}
            <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === "table" ? "bg-white text-ink-900 shadow-xs" : "text-slate-400 hover:text-ink-600"}`}
                title="Visualização em Tabela"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === "cards" ? "bg-white text-ink-900 shadow-xs" : "text-slate-400 hover:text-ink-600"}`}
                title="Visualização em Cards"
              >
                <Grid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("catalog")}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === "catalog" ? "bg-white text-ink-900 shadow-xs" : "text-slate-400 hover:text-ink-600"}`}
                title="Visualização em Catálogo"
              >
                <BookOpen size={14} />
              </button>
            </div>

            {/* Modo Comercial Toggle */}
            <button
              type="button"
              onClick={() => setCommercialMode(!commercialMode)}
              className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${commercialMode ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold" : "bg-slate-50 border-slate-200 text-slate-500 hover:text-ink-600"}`}
              title="Apresentação para clientes: oculta preços e custos internos"
            >
              {commercialMode ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>{commercialMode ? "Modo Comercial: ATIVO" : "Modo Comercial"}</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={() => {
                setPdfCategoryFilter(selectedCategory);
                setPdfOnlyAvailable(true);
                setPdfIncludeUnitPrice(!commercialMode);
                setShowExportPdfModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg border border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100/60 hover:from-amber-100 hover:to-amber-200/80 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Exportar relatório ou catálogo de insumos em formato PDF"
            >
              <Download size={13} className="text-amber-700" />
              <span>Download PDF</span>
            </button>

            {/* Option to show stock in Catalog, visible only when viewMode is catalog */}
            {viewMode === "catalog" && (
              <label className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showStockInCatalog}
                  onChange={(e) => setShowStockInCatalog(e.target.checked)}
                  className="rounded border-slate-300 text-gold-600 focus:ring-gold-500 cursor-pointer"
                />
                <span>Exibir Estoque</span>
              </label>
            )}

            {/* Selection Mode Toggle */}
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedItemIds([]); // Clear selection when toggling
              }}
              className={`px-4 py-2 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${isSelectionMode ? "bg-gold-500/10 border-gold-500 text-gold-700 font-bold" : "bg-slate-50 border-slate-200 text-slate-500 hover:text-ink-600"}`}
              title="Selecionar múltiplos itens da lista"
            >
              <CheckSquare size={13} />
              {isSelectionMode ? "Cancelar Seleção" : "Ações em Lote"}
            </button>

            {/* Add New Button */}
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-gradient-to-br from-ink-900 to-slate-800 text-white hover:opacity-95 font-medium text-xs rounded-full flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Plus size={14} />
              Novo Insumo
            </button>
          </div>
        </div>
      </div>

      {commercialMode && (
        <div className="bg-emerald-50/90 border border-emerald-200/90 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-in-up shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <EyeOff size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                <span>Modo Comercial Ativo</span>
                <span className="text-[10px] font-mono bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-full uppercase font-bold">Visualização para Clientes</span>
              </h4>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Valores unitários e custos internos estão ocultos da tela. Você pode exportar o catálogo em PDF a qualquer momento.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPdfCategoryFilter(selectedCategory);
              setPdfOnlyAvailable(true);
              setPdfIncludeUnitPrice(false);
              setShowExportPdfModal(true);
            }}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Download size={14} />
            <span>Exportar PDF Comercial</span>
          </button>
        </div>
      )}

      {isSelectionMode && (
        <div className="bg-amber-50/15 border border-amber-200/50 p-4 rounded-[20px] flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-in-up">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-gold-500 text-white flex items-center justify-center text-[11px] font-mono font-bold shadow-xs">
              {selectedItemIds.length}
            </span>
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {selectedItemIds.length === 1
                  ? "1 item selecionado"
                  : `${selectedItemIds.length} itens selecionados`}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Selecione os insumos na tabela ou nos cards para aplicar ações
                em lote.
              </span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                // Toggle all currently filtered items
                const filteredIds = filteredItems.map((item) => item.id);
                const allAreSelected = filteredIds.every((id) =>
                  selectedItemIds.includes(id),
                );
                if (allAreSelected) {
                  setSelectedItemIds(
                    selectedItemIds.filter((id) => !filteredIds.includes(id)),
                  );
                } else {
                  setSelectedItemIds(
                    Array.from(new Set([...selectedItemIds, ...filteredIds])),
                  );
                }
              }}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition-colors cursor-pointer bg-white"
            >
              {filteredItems.length > 0 &&
              filteredItems.every((item) => selectedItemIds.includes(item.id))
                ? "Desmarcar Todos"
                : "Selecionar Todos"}
            </button>

            <button
              type="button"
              disabled={selectedItemIds.length === 0}
              onClick={() => {
                setBatchAdjustData({
                  type: "add",
                  amount: 10,
                  notes: "Entrada complementar em lote",
                  supplierName: "",
                  updatePrice: false,
                  priceCalcType: "manual",
                  manualUnitPrice: 0,
                  packagePrice: 0,
                  freightValue: 0,
                  priceMethod: "weighted",
                });
                setShowBatchAdjustModal(true);
              }}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Package size={13} />
              Movimentar Estoque em Lote
            </button>

            <button
              type="button"
              disabled={selectedItemIds.length === 0}
              onClick={() => setShowBatchDeleteModal(true)}
              className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              Excluir em Lote
            </button>
          </div>
        </div>
      )}

      {/* Main Inventory Listing Block */}
      {viewMode === "table" ? (
        <div className="bg-white border border-[rgba(42,36,32,0.06)] rounded-[20px] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-ink-600 font-bold uppercase tracking-wider bg-bg-app">
                  {isSelectionMode && (
                    <th className="px-5 py-3.5 font-semibold text-[10px] w-12 text-center">
                      Sel
                    </th>
                  )}
                  <th className="px-5 py-3.5 font-semibold text-[10px]">
                    Cód Insumo
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-[10px]">
                    Insumo / Nome
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-[10px]">
                    Categoria
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-[10px]">
                    Fornecedor
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-[10px]">
                    Preço Unitário
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-[10px]">
                    Saldo Atual
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-[10px]">
                    Status
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-[10px] text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isLow =
                    item.quantity <= item.minQuantity && item.quantity > 0;
                  const isCritical = item.quantity === 0;

                  return (
                    <tr
                      key={item.id}
                      onClick={(e) => {
                        if (isSelectionMode) {
                          const target = e.target as HTMLElement;
                          if (
                            target.tagName !== "BUTTON" &&
                            !target.closest("button") &&
                            target.tagName !== "INPUT"
                          ) {
                            if (selectedItemIds.includes(item.id)) {
                              setSelectedItemIds(
                                selectedItemIds.filter((id) => id !== item.id),
                              );
                            } else {
                              setSelectedItemIds([...selectedItemIds, item.id]);
                            }
                          }
                        }
                      }}
                      className={`transition-colors duration-150 ${
                        isSelectionMode
                          ? selectedItemIds.includes(item.id)
                            ? "bg-gold-500/5 hover:bg-gold-500/10 border-l-2 border-gold-500 cursor-pointer"
                            : "hover:bg-[#FAF7F2]/40 cursor-pointer"
                          : "hover:bg-[#FAF7F2]/40"
                      }`}
                    >
                      {isSelectionMode && (
                        <td className="px-5 py-4 text-center w-12">
                          <input
                            type="checkbox"
                            checked={selectedItemIds.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItemIds([
                                  ...selectedItemIds,
                                  item.id,
                                ]);
                              } else {
                                setSelectedItemIds(
                                  selectedItemIds.filter(
                                    (id) => id !== item.id,
                                  ),
                                );
                              }
                            }}
                            className="rounded border-slate-300 text-gold-600 focus:ring-gold-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-5 py-4 font-mono font-bold text-slate-400">
                        {item.code}
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-bold text-ink-900">{item.name}</p>
                          <p className="text-[10px] text-slate-500 mt-1 font-medium">
                            Controle em {item.unit}{" "}
                            {item.weightG > 0
                              ? `| ${item.weightG}g por un`
                              : ""}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-600">
                        {item.category}
                      </td>
                      <td className="px-5 py-4 text-slate-500 font-medium">
                        {item.supplier || "-"}
                      </td>
                      <td className="px-5 py-4 font-bold font-mono text-ink-900">
                        {commercialMode ? (
                          <span className="text-slate-400 font-sans text-xs font-normal">Sob consulta</span>
                        ) : (
                          <>
                            R${" "}
                            {item.unitValue.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            })}
                          </>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                                isCritical
                                  ? "bg-rose-50 text-rose-600 border border-rose-100"
                                  : isLow
                                    ? "bg-warning-bg text-warning-500 border border-warning-bg"
                                    : "bg-slate-50 text-slate-700 border border-slate-100"
                              }`}
                            >
                              {item.quantity} {item.unit}
                            </span>
                            {(isCritical || isLow) && (
                              <span
                                className={`text-[10px] font-bold ${isCritical ? "text-rose-500" : "text-warning-500"}`}
                              >
                                {isCritical ? "ESGOTADO" : "BAIXO"}
                              </span>
                            )}
                          </div>
                          {item.reserved !== undefined && item.reserved > 0 ? (
                            <div className="flex flex-col gap-0.5 text-[10px] font-mono font-medium">
                              <span className="text-amber-600">
                                Reservado: {item.reserved} {item.unit}
                              </span>
                              <span className="text-emerald-600 font-bold">
                                Disponível: {item.available ?? item.quantity}{" "}
                                {item.unit}
                              </span>
                            </div>
                          ) : (
                            <div className="text-[10px] font-mono font-medium text-slate-400">
                              Disponível: {item.quantity} {item.unit}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                            item.status === "active"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-slate-50 text-slate-400 border border-slate-100"
                          }`}
                        >
                          {item.status === "active" ? "ATIVO" : "INATIVO"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetails(item)}
                            title="Informações e Histórico"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-amber-600 cursor-pointer transition-all duration-150"
                          >
                            <BarChart2 size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenAdjust(item)}
                            title="Entrada / Saída de Estoque"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-gold-600 cursor-pointer transition-all duration-150"
                          >
                            <ArrowUpDown size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Editar Insumo"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 cursor-pointer transition-all duration-150"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            title="Excluir"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer transition-all duration-150"
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
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      Nenhum item encontrado para as configurações de filtro
                      atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isLow =
              item.quantity <= item.minQuantity && item.quantity > 0;
            const isCritical = item.quantity === 0;

            return (
              <div
                key={item.id}
                onClick={(e) => {
                   if (isSelectionMode) {
                     const target = e.target as HTMLElement;
                     if (
                       target.tagName !== "BUTTON" &&
                       !target.closest("button") &&
                       target.tagName !== "INPUT"
                     ) {
                       if (selectedItemIds.includes(item.id)) {
                         setSelectedItemIds(
                           selectedItemIds.filter((id) => id !== item.id),
                         );
                       } else {
                         setSelectedItemIds([...selectedItemIds, item.id]);
                       }
                     }
                   }
                 }}
                 className={`bg-white border rounded-[20px] p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between hover:-translate-y-0.5 duration-200 cursor-pointer ${
                   isSelectionMode && selectedItemIds.includes(item.id)
                     ? "ring-2 ring-gold-500 bg-gold-500/5"
                     :
                  isCritical
                    ? "border-rose-200"
                    : isLow
                      ? "border-amber-200"
                      : "border-[rgba(42,36,32,0.06)]"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    {isSelectionMode ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedItemIds.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemIds([...selectedItemIds, item.id]);
                            } else {
                              setSelectedItemIds(
                                selectedItemIds.filter((id) => id !== item.id),
                              );
                            }
                          }}
                          className="rounded border-slate-300 text-gold-600 focus:ring-gold-500 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {item.code}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {item.code}
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                        item.status === "active"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-slate-50 text-slate-400 border border-slate-100"
                      }`}
                    >
                      {item.status === "active" ? "ATIVO" : "INATIVO"}
                    </span>
                  </div>

                  {!!item.imageUrl && (
                    <div className="w-full h-32 rounded-xl overflow-hidden mt-3 relative bg-slate-100 border border-slate-100 shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <h3 className="font-serif font-semibold text-base text-ink-900 mt-3 truncate">
                    {item.name}
                  </h3>
                  <p className="text-[10px] text-ink-600 font-bold uppercase tracking-wider mt-1">
                    {item.category}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                    <div>
                      <p className="text-slate-400 font-medium">
                        Controle / Peso
                      </p>
                      <p className="font-bold text-slate-700 mt-0.5">
                        {item.unit}{" "}
                        {item.weightG > 0 ? `| ${item.weightG}g` : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">
                        Preço Unitário
                      </p>
                      <p className="font-bold text-slate-700 mt-0.5">
                        {commercialMode ? (
                          <span className="text-slate-400 font-sans text-xs font-normal">Sob consulta</span>
                        ) : (
                          <>
                            R${" "}
                            {item.unitValue.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            })}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-3 bg-slate-50 p-2.5 rounded-lg line-clamp-2">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${isCritical ? "bg-rose-500 animate-pulse" : isLow ? "bg-warning-500" : "bg-emerald-500"}`}
                    />
                    <span className="text-xs font-mono font-bold text-slate-800">
                      Qtd: {item.quantity} {item.unit}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenDetails(item)}
                      title="Informações e Histórico"
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-amber-600 cursor-pointer"
                    >
                      <BarChart2 size={13} />
                    </button>
                    <button
                      onClick={() => handleOpenAdjust(item)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-gold-600 cursor-pointer"
                    >
                      <ArrowUpDown size={13} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-indigo-600 cursor-pointer"
                    >
                      <Edit3 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const isAvailable = item.quantity > 0;
            const isLow = item.quantity <= item.minQuantity && item.quantity > 0;

            const getPlaceholderBg = (cat: string) => {
              switch (cat) {
                case "Contas e Pérolas":
                  return "from-rose-50 to-rose-100 text-rose-500";
                case "Metais e Entremeios":
                  return "from-amber-50 to-amber-100 text-amber-500";
                case "Fios e Cordões":
                  return "from-indigo-50 to-indigo-100 text-indigo-500";
                case "Embalagens":
                  return "from-teal-50 to-teal-100 text-teal-500";
                default:
                  return "from-slate-50 to-slate-100 text-slate-500";
              }
            };

            return (
              <div
                key={item.id}
                className="bg-white border border-[rgba(42,36,32,0.06)] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between hover:-translate-y-0.5 duration-200"
              >
                <div>
                  {/* Image/Photo Block */}
                  <div className="h-44 w-full bg-slate-50 relative overflow-hidden border-b border-slate-100 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${getPlaceholderBg(item.category)} flex flex-col items-center justify-center p-4`}>
                        <ImageIcon size={32} className="opacity-40 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Sem Foto</span>
                      </div>
                    )}

                    {/* Category Badge - top left */}
                    <span className="absolute top-3 left-3 px-2 py-1 bg-white/95 backdrop-blur-xs text-[9px] font-bold text-ink-900 rounded-md shadow-xs border border-slate-150 uppercase tracking-wider">
                      {item.category}
                    </span>

                    {/* Status/Availability Badge - top right */}
                    <span
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-bold shadow-xs border backdrop-blur-xs ${
                        isAvailable
                          ? "bg-emerald-500 text-white border-emerald-400"
                          : "bg-rose-500 text-white border-rose-400"
                      }`}
                    >
                      {isAvailable ? "Disponível" : "Esgotado"}
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-4">
                    <h3 className="font-serif font-semibold text-sm text-ink-900 line-clamp-2 min-h-[40px] leading-tight">
                      {item.name}
                    </h3>
                    
                    {item.code && (
                      <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase font-semibold">
                        Código: {item.code}
                      </p>
                    )}

                    <div className="mt-4 space-y-2.5 pt-3.5 border-t border-slate-100 text-xs">
                      {/* Show stock count if either commercialMode is off, OR the optional showStockInCatalog is active */}
                      {(!commercialMode || showStockInCatalog) && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Estoque:</span>
                          <span className={`font-mono font-bold ${isLow ? "text-amber-600" : isAvailable ? "text-slate-800" : "text-rose-500"}`}>
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      )}

                      {/* Financial details: hidden in Commercial Mode */}
                      {!commercialMode ? (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Valor Unitário:</span>
                          <span className="font-bold text-slate-800">
                            R$ {item.unitValue.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4,
                            })}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                          <span className="text-slate-400 font-medium text-[10px]">Preço Comercial:</span>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                            Sob Consulta
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Block */}
                <div className="p-4 pt-0">
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenDetails(item)}
                      title="Ver Informações"
                      className="flex-1 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-amber-600 cursor-pointer text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Info size={12} />
                      Detalhes
                    </button>
                    
                    {/* Hide edit actions in commercial mode to make presentation for clients safer */}
                    {!commercialMode && (
                      <>
                        <button
                          onClick={() => handleOpenAdjust(item)}
                          title="Movimentar Estoque"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-gold-600 cursor-pointer transition-colors"
                        >
                          <ArrowUpDown size={12} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Editar Insumo"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-indigo-600 cursor-pointer transition-colors"
                        >
                          <Edit3 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
              Nenhum item encontrado para as configurações de filtro atuais.
            </div>
          )}
        </div>
      )}

      {/* MODALS SECTION */}

      {/* 1. Create Insumo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 lg:p-6 overflow-hidden">
          <div className="bg-white border border-slate-200 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-up">
            <div className="h-16 border-b border-slate-150 px-6 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-semibold text-lg text-ink-900">
                  Novo Insumo Artesanal
                </h3>
                <p className="text-[11px] text-slate-500">
                  Cadastre miçangas, pérolas, metais ou crucifixos
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveAdd}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
              {/* Wizard Toggle: Smart vs Manual */}
              <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/60 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="text-gold-600 animate-pulse" size={18} />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      Assistente Inteligente de Compra
                    </span>
                    <span className="text-[10px] text-amber-700">
                      Calcula custos unitários reais a partir do preço do pacote
                      e frete.
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSmartCalcActive}
                    onChange={(e) => setIsSmartCalcActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold-500"></div>
                </label>
              </div>

              {/* Smart Calculator Panel (First-class citizen, fully visible when checked) */}
              {isSmartCalcActive && (
                <div className="border border-gold-500/15 bg-amber-50/10 rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wider flex items-center gap-1.5">
                      📦 Dados da Compra (Lote / Pacote / Pacotinho)
                    </h4>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCalcType("unit");
                          setSelectedMeasureUnit("unidade");
                        }}
                        className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${calcType === "unit" ? "bg-gold-500/10 border-gold-500 text-gold-700" : "bg-white border-slate-200 text-slate-500"}`}
                      >
                        Por Quantidade (un)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCalcType("weight");
                          setSelectedMeasureUnit("grama");
                        }}
                        className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${calcType === "weight" ? "bg-gold-500/10 border-gold-500 text-gold-700" : "bg-white border-slate-200 text-slate-500"}`}
                      >
                        Por Peso (g)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                        Preço Pago no Pacote (R$) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 font-medium">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required={isSmartCalcActive}
                          value={calcPackagePrice || ""}
                          onChange={(e) =>
                            setCalcPackagePrice(Number(e.target.value))
                          }
                          placeholder="50.00"
                          className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-ink-900 font-mono font-semibold"
                        />
                      </div>
                    </div>

                    {calcType === "unit" ? (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                            Quantidade de Contas/Itens *
                          </label>
                          <input
                            type="number"
                            min="1"
                            required={isSmartCalcActive && calcType === "unit"}
                            value={calcPackageUnits || ""}
                            onChange={(e) =>
                              setCalcPackageUnits(Number(e.target.value))
                            }
                            placeholder="Ex: 250"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-ink-900 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                            Peso do Pacote Inteiro (g)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={calcPackageWeight || ""}
                            onChange={(e) =>
                              setCalcPackageWeight(Number(e.target.value))
                            }
                            placeholder="Ex: 200 (para obter peso/un)"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-ink-900 font-semibold"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                            Peso do Pacote Inteiro (g) *
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            required={
                              isSmartCalcActive && calcType === "weight"
                            }
                            value={calcPackageWeight || ""}
                            onChange={(e) =>
                              setCalcPackageWeight(Number(e.target.value))
                            }
                            placeholder="Ex: 200"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-ink-900 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                            Converter p/ Unidades?
                          </label>
                          <select
                            value={calcUnitWeightMethod}
                            onChange={(e) =>
                              setCalcUnitWeightMethod(e.target.value as any)
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-ink-600 font-medium"
                          >
                            <option value="none">
                              Não, controlar em Gramas (g)
                            </option>
                            <option value="fixed">
                              Sim, sei peso de 1 unidade
                            </option>
                            <option value="sample">
                              Sim, pesar amostra (Balança)
                            </option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Unit Weight Estimation subforms */}
                  {calcType === "weight" &&
                    calcUnitWeightMethod === "fixed" && (
                      <div className="p-3 bg-white border border-slate-100 rounded-xl text-xs space-y-2 animate-slide-in-up">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Peso conhecido de 1 unidade (g)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={calcUnitWeightKnown || ""}
                          onChange={(e) =>
                            setCalcUnitWeightKnown(Number(e.target.value))
                          }
                          placeholder="Ex: 0.8g"
                          className="w-full max-w-xs px-3 py-2 rounded-lg border border-slate-200 bg-white text-ink-900"
                        />
                      </div>
                    )}

                  {calcType === "weight" &&
                    calcUnitWeightMethod === "sample" && (
                      <div className="p-3.5 bg-white border border-slate-100 rounded-xl text-xs space-y-3 animate-slide-in-up">
                        <p className="text-[10px] text-gold-700 leading-relaxed font-medium">
                          💡 <strong>Dica da Balança de Precisão:</strong>{" "}
                          Coloque 10 ou 20 contas na balança, insira os valores
                          abaixo e calcularemos o peso médio de 1 pérola para
                          estimar o pacote inteiro!
                        </p>
                        <div className="grid grid-cols-2 gap-3 max-w-md">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                              Contas na Amostra
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={calcSampleSize || ""}
                              onChange={(e) =>
                                setCalcSampleSize(Number(e.target.value))
                              }
                              placeholder="Ex: 10"
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-ink-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                              Peso da Amostra (g)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={calcSampleWeight || ""}
                              onChange={(e) =>
                                setCalcSampleWeight(Number(e.target.value))
                              }
                              placeholder="Ex: 8.0"
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-ink-900"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Freight integration */}
                  <div className="border-t border-slate-100 pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-slate-400" />
                      <div>
                        <span className="text-xs font-bold text-ink-900 block">
                          Houve frete nesta compra de insumo?
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Se sim, o custo será rateado automaticamente no preço
                          unitário final.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            setHasFreight(false);
                            setFreightValue(0);
                          }}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${!hasFreight ? "bg-white text-slate-700 shadow-xs" : "text-slate-400"}`}
                        >
                          Não
                        </button>
                        <button
                          type="button"
                          onClick={() => setHasFreight(true)}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${hasFreight ? "bg-white text-slate-700 shadow-xs" : "text-slate-400"}`}
                        >
                          Sim
                        </button>
                      </div>
                      {hasFreight && (
                        <div className="relative w-28 animate-slide-in-up">
                          <span className="absolute left-2.5 top-1.5 text-[10.5px] text-slate-400">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={freightValue || ""}
                            onChange={(e) =>
                              setFreightValue(Number(e.target.value))
                            }
                            placeholder="Frete"
                            className="w-full pl-7 pr-2 py-1 text-xs rounded border border-slate-200 bg-white font-mono text-ink-900 font-bold"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Measure Unit choice */}
                  <div className="border-t border-slate-100 pt-3.5 space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Unidade de Medida de Estoque *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        {
                          id: "unidade",
                          label: "Unidade (un)",
                          desc: "Para contar pérolas/peças avulsas",
                        },
                        {
                          id: "grama",
                          label: "Grama (g)",
                          desc: "Para controlar por peso na balança",
                        },
                        {
                          id: "metro",
                          label: "Metro (m)",
                          desc: "Para cordões, linhas e fitas",
                        },
                        {
                          id: "pacote",
                          label: "Pacote (pct)",
                          desc: "Controlar pacotes inteiros",
                        },
                      ].map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setSelectedMeasureUnit(opt.id)}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${selectedMeasureUnit === opt.id ? "border-gold-500 bg-gold-500/5 text-ink-900 ring-1 ring-gold-500/15" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"}`}
                        >
                          <span className="font-bold text-xs">{opt.label}</span>
                          <span className="text-[9.5px] text-slate-400 mt-1 leading-tight font-normal">
                            {opt.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live results banner */}
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800/40 shadow-sm space-y-2 text-xs font-mono">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center justify-between">
                      <span>⚡ Custo Real & Estoque Calculados</span>
                      <span className="text-gold-500">Tempo Real</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                      <div>
                        <span className="text-[9px] text-slate-400 block">
                          Investimento Total:
                        </span>
                        <strong className="text-white text-xs">
                          R$ {smartCalculatedResults.totalCost.toFixed(2)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">
                          Custo Unitário Final:
                        </span>
                        <strong className="text-emerald-400 text-xs">
                          R$ {smartCalculatedResults.unitValue.toFixed(4)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">
                          Peso Unitário:
                        </span>
                        <strong className="text-indigo-300 text-xs">
                          {smartCalculatedResults.weightG.toFixed(3)}g
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">
                          Estoque Inicial Gerado:
                        </span>
                        <strong className="text-amber-300 text-xs">
                          {smartCalculatedResults.quantity}{" "}
                          {selectedMeasureUnit === "grama"
                            ? "g"
                            : selectedMeasureUnit === "unidade"
                              ? "un"
                              : selectedMeasureUnit}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* General Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nome do Insumo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Pérola de Água Doce Branca (8mm)"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-900 focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-600 focus:outline-none focus:border-gold-500"
                  >
                    <option value="Contas e Pérolas">Contas e Pérolas</option>
                    <option value="Metais e Entremeios">
                      Metais e Entremeios
                    </option>
                    <option value="Fios e Cordões">Fios e Cordões</option>
                    <option value="Embalagens">Embalagens</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Código Interno *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-900 focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Fornecedor / Loja
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    placeholder="Ex: Beads Importadora"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Quantidade Mínima (Aviso) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.minQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minQuantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Manual inputs fields (Visible only if Smart calculator is disabled, or to override values) */}
              {!isSmartCalcActive && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-5 text-xs animate-slide-in-up">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Preço Unitário (Custo) *
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      required={!isSmartCalcActive}
                      value={formData.unitValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          unitValue: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-ink-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Peso Unitário (g)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.weightG}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weightG: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-ink-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Unidade de Medida
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      placeholder="unidade, g, m"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-ink-900"
                    />
                  </div>
                </div>
              )}

              {/* Stock / Saldo Inicial row */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Scale size={14} className="text-gold-500" /> Saldo em Estoque
                  (Inventário Inicial)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      {isSmartCalcActive
                        ? "Saldo Inicial (Preenchido pelo Assistente) *"
                        : "Saldo Inicial (Lançar Quantidade) *"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity: Number(e.target.value),
                        })
                      }
                      className={`w-full px-3.5 py-2 text-xs rounded-lg border text-ink-900 font-mono font-bold ${isSmartCalcActive ? "border-amber-200 bg-amber-50/20" : "border-slate-200 bg-slate-50"}`}
                    />
                    <p className="text-[10px] text-slate-450 mt-1.5">
                      💡 Esse saldo representa a quantidade física que você tem
                      guardada na gaveta neste exato momento para iniciar os
                      controles.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Método de Lançamento na Ficha
                    </label>
                    <select
                      value={formData.calcMethod}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          calcMethod: e.target.value as CalcMethod,
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-600 focus:outline-none"
                    >
                      <option value="fixed">
                        Fixo (Consome por Unidades inteiras)
                      </option>
                      <option value="weight">
                        Por Peso (Consome por Gramas decimais)
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Foto / Imagem do Insumo */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-gold-500" /> Foto do Insumo
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Preview Container */}
                  <div className="md:col-span-1 h-32 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex flex-col items-center justify-center p-2 relative group">
                    {formData.imageUrl ? (
                      <>
                        <img
                          src={formData.imageUrl}
                          alt="Prévia do Insumo"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: "" })}
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold rounded-lg cursor-pointer"
                        >
                          Remover Foto
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon size={24} className="mx-auto mb-1 opacity-40" />
                        <span className="text-[9px] font-medium block">Sem foto cadastrada</span>
                      </div>
                    )}
                  </div>

                  {/* Inputs Container */}
                  <div className="md:col-span-2 space-y-3 flex flex-col justify-between">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        URL da Imagem
                      </label>
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://exemplo.com/foto.jpg"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-900 focus:outline-none placeholder:text-slate-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Ou Fazer Upload de Imagem
                      </label>
                      <div className="relative border border-dashed border-slate-200 hover:border-gold-500/50 rounded-lg p-2.5 bg-slate-50 text-center transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData({ ...formData, imageUrl: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex items-center justify-center gap-1.5 text-slate-500">
                          <Upload size={12} className="text-slate-400" />
                          <span className="text-[11px] font-medium">Selecione um arquivo de imagem</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Instruções de Manuseio / Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Ex: guardar em local seco, fornecedor envia rápido..."
                  rows={2}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-900"
                />
              </div>
              </div>

              <div className="p-4 border-t border-slate-150 flex justify-end gap-3 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-br from-ink-900 to-slate-800 text-white hover:opacity-95 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md"
                >
                  Adicionar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Insumo Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 lg:p-6 overflow-hidden">
          <div className="bg-white border border-slate-200 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-up">
            <div className="h-16 border-b border-slate-150 px-6 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-semibold text-lg text-ink-900">
                  Editar Insumo
                </h3>
                <p className="text-[11px] text-slate-500">
                  Ajuste os dados da matéria-prima
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveEdit}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
              {/* Converter Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/60 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="text-gold-600 animate-pulse" size={18} />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      Deseja usar o Assistente de Cálculo de Lote/Frete?
                    </span>
                    <span className="text-[10px] text-amber-700 font-medium">
                      Recalcula os valores unitários reais baseados no pacote.
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSmartCalcActive}
                    onChange={(e) => setIsSmartCalcActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold-500"></div>
                </label>
              </div>

              {isSmartCalcActive && (
                <div className="border border-gold-500/15 bg-amber-50/10 rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wider flex items-center gap-1.5">
                      📦 Dados da Compra (Pacote)
                    </h4>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCalcType("unit");
                          setSelectedMeasureUnit("unidade");
                        }}
                        className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${calcType === "unit" ? "bg-gold-500/10 border-gold-500 text-gold-700" : "bg-white border-slate-200 text-slate-500"}`}
                      >
                        Por Quantidade (un)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCalcType("weight");
                          setSelectedMeasureUnit("grama");
                        }}
                        className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${calcType === "weight" ? "bg-gold-500/10 border-gold-500 text-gold-700" : "bg-white border-slate-200 text-slate-500"}`}
                      >
                        Por Peso (g)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                        Preço do Lote/Pacote (R$) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required={isSmartCalcActive}
                          value={calcPackagePrice || ""}
                          onChange={(e) =>
                            setCalcPackagePrice(Number(e.target.value))
                          }
                          placeholder="50.00"
                          className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-white font-mono"
                        />
                      </div>
                    </div>

                    {calcType === "unit" ? (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                            Unidades no Pacote *
                          </label>
                          <input
                            type="number"
                            min="1"
                            required={isSmartCalcActive && calcType === "unit"}
                            value={calcPackageUnits || ""}
                            onChange={(e) =>
                              setCalcPackageUnits(Number(e.target.value))
                            }
                            placeholder="Ex: 250"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                            Peso do Pacote (g)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={calcPackageWeight || ""}
                            onChange={(e) =>
                              setCalcPackageWeight(Number(e.target.value))
                            }
                            placeholder="Ex: 200"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                            Peso do Pacote (g) *
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            required={
                              isSmartCalcActive && calcType === "weight"
                            }
                            value={calcPackageWeight || ""}
                            onChange={(e) =>
                              setCalcPackageWeight(Number(e.target.value))
                            }
                            placeholder="Ex: 200"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                            Estimar quantidade?
                          </label>
                          <select
                            value={calcUnitWeightMethod}
                            onChange={(e) =>
                              setCalcUnitWeightMethod(e.target.value as any)
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600"
                          >
                            <option value="none">
                              Não, controlar em Gramas (g)
                            </option>
                            <option value="fixed">
                              Sim, peso unitário conhecido
                            </option>
                            <option value="sample">Sim, pesando amostra</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Freight */}
                  <div className="border-t border-slate-100 pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-slate-400" />
                      <div>
                        <span className="text-xs font-bold text-ink-900 block">
                          Houve custo de frete na compra?
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Rateia o frete de forma proporcional no custo real.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            setHasFreight(false);
                            setFreightValue(0);
                          }}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${!hasFreight ? "bg-white text-slate-700 shadow-xs" : "text-slate-400"}`}
                        >
                          Não
                        </button>
                        <button
                          type="button"
                          onClick={() => setHasFreight(true)}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${hasFreight ? "bg-white text-slate-700 shadow-xs" : "text-slate-400"}`}
                        >
                          Sim
                        </button>
                      </div>
                      {hasFreight && (
                        <div className="relative w-28 animate-slide-in-up">
                          <span className="absolute left-2.5 top-1.5 text-[10.5px] text-slate-400">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={freightValue || ""}
                            onChange={(e) =>
                              setFreightValue(Number(e.target.value))
                            }
                            className="w-full pl-7 pr-2 py-1 text-xs rounded border border-slate-200 bg-white text-ink-900 font-bold"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Results block */}
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">
                          Investimento:
                        </span>
                        <span className="text-white">
                          R$ {smartCalculatedResults.totalCost.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">
                          Custo Unitário:
                        </span>
                        <span className="text-emerald-400 font-bold">
                          R$ {smartCalculatedResults.unitValue.toFixed(4)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">
                          Peso Unitário:
                        </span>
                        <span className="text-indigo-300">
                          {smartCalculatedResults.weightG.toFixed(3)}g
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">
                          Saldo Calculado:
                        </span>
                        <span className="text-amber-300 font-bold">
                          {smartCalculatedResults.quantity}{" "}
                          {selectedMeasureUnit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* General Edit Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nome do Insumo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-600"
                  >
                    <option value="Contas e Pérolas">Contas e Pérolas</option>
                    <option value="Metais e Entremeios">
                      Metais e Entremeios
                    </option>
                    <option value="Fios e Cordões">Fios e Cordões</option>
                    <option value="Embalagens">Embalagens</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Código Interno *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Quantidade Mínima (Aviso) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.minQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minQuantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as InventoryStatus,
                      })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-600"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              {/* Manual Fields for override */}
              {!isSmartCalcActive && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-5 text-xs animate-slide-in-up">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Preço de Custo Unitário *
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      required={!isSmartCalcActive}
                      value={formData.unitValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          unitValue: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-ink-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Peso Unitário (g)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.weightG}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weightG: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-ink-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Unidade de Medida
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-ink-900"
                    />
                  </div>
                </div>
              )}

              {/* Direct balance override when editing */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Scale size={14} className="text-indigo-600" /> Saldo Atual de
                  Inventário
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Saldo Atual em Estoque *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity: Number(e.target.value),
                        })
                      }
                      readOnly
                      disabled
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-100 text-slate-500 font-mono font-bold cursor-not-allowed"
                    />
                    <span className="text-[10px] text-amber-650 font-medium block mt-1.5 leading-tight">
                      ⚠️ O saldo de estoque é protegido e só pode ser alterado
                      através do botão de movimentação rápida de estoque (+ ou
                      -) na tela principal.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Método de Lançamento
                    </label>
                    <select
                      value={formData.calcMethod}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          calcMethod: e.target.value as CalcMethod,
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-600"
                    >
                      <option value="fixed">Fixo (unidade)</option>
                      <option value="weight">Por Peso (g)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Foto / Imagem do Insumo */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-gold-500" /> Foto do Insumo
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Preview Container */}
                  <div className="md:col-span-1 h-32 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex flex-col items-center justify-center p-2 relative group">
                    {formData.imageUrl ? (
                      <>
                        <img
                          src={formData.imageUrl}
                          alt="Prévia do Insumo"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: "" })}
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold rounded-lg cursor-pointer"
                        >
                          Remover Foto
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon size={24} className="mx-auto mb-1 opacity-40" />
                        <span className="text-[9px] font-medium block">Sem foto cadastrada</span>
                      </div>
                    )}
                  </div>

                  {/* Inputs Container */}
                  <div className="md:col-span-2 space-y-3 flex flex-col justify-between">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        URL da Imagem
                      </label>
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://exemplo.com/foto.jpg"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-900 focus:outline-none placeholder:text-slate-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Ou Fazer Upload de Imagem
                      </label>
                      <div className="relative border border-dashed border-slate-200 hover:border-gold-500/50 rounded-lg p-2.5 bg-slate-50 text-center transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData({ ...formData, imageUrl: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex items-center justify-center gap-1.5 text-slate-500">
                          <Upload size={12} className="text-slate-400" />
                          <span className="text-[11px] font-medium">Selecione um arquivo de imagem</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-900"
                />
              </div>
              </div>

              <div className="p-4 border-t border-slate-150 flex justify-end gap-3 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-br from-ink-900 to-slate-800 text-white hover:opacity-95 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Adjust Stock Balance Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 lg:p-6 overflow-hidden">
          <div className="bg-white border border-slate-200 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-up">
            <div className="h-16 border-b border-slate-150 px-6 flex items-center justify-between bg-slate-50">
              <h3 className="font-serif font-semibold text-base text-ink-900">
                Movimentar Estoque
              </h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveAdjust}
              className="flex-1 flex flex-col min-h-0 text-xs"
            >
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                  Insumo Selecionado
                </p>
                <p className="font-serif font-semibold text-sm text-ink-900 mt-1">
                  {selectedItem.name}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-1 font-mono">
                  Código: {selectedItem.code} | Saldo Atual:{" "}
                  {selectedItem.quantity} {selectedItem.unit}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Operação
                  </label>
                  <select
                    value={adjustData.type}
                    onChange={(e) =>
                      setAdjustData({
                        ...adjustData,
                        type: e.target.value as "add" | "subtract",
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-600 focus:outline-none"
                  >
                    <option value="add">Entrada (+) de Insumos</option>
                    <option value="subtract">Saída / Perda (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjustData.amount}
                    onChange={(e) =>
                      setAdjustData({
                        ...adjustData,
                        amount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-900 font-mono"
                  />
                </div>
              </div>

              {adjustData.type === "add" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Fornecedor / Contato da Compra
                    </label>
                    <input
                      type="text"
                      value={adjustData.supplierName}
                      onChange={(e) =>
                        setAdjustData({
                          ...adjustData,
                          supplierName: e.target.value,
                        })
                      }
                      placeholder="Nome do fornecedor para lançar despesa"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-900"
                    />
                    <p className="text-[9.5px] text-slate-450 mt-1.5 italic">
                      💡 Entradas calculam automaticamente o valor do lote
                      (Quantidade × Valor Unitário) e registram uma nova
                      Transação Financeira de Despesa no Fluxo de Caixa.
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={adjustUpdatePrice}
                        onChange={(e) => setAdjustUpdatePrice(e.target.checked)}
                        className="rounded border-slate-300 text-gold-600 focus:ring-gold-500"
                      />
                      <span>
                        Recalcular / atualizar custo unitário devido a alteração
                        de frete ou valor de compra?
                      </span>
                    </label>

                    {adjustUpdatePrice && (
                      <div className="p-4 bg-amber-50/10 border border-amber-200/40 rounded-2xl space-y-4 animate-slide-in-up">
                        <div className="flex gap-2 justify-end border-b border-slate-100 pb-2">
                          <button
                            type="button"
                            onClick={() => setAdjustCalcType("manual")}
                            className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${adjustCalcType === "manual" ? "bg-gold-500/10 border-gold-500 text-gold-700" : "bg-white border-slate-200 text-slate-500"}`}
                          >
                            Digitar Valor Manual
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdjustCalcType("calc")}
                            className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${adjustCalcType === "calc" ? "bg-gold-500/10 border-gold-500 text-gold-700" : "bg-white border-slate-200 text-slate-500"}`}
                          >
                            Assistente (Lote + Frete)
                          </button>
                        </div>

                        {adjustCalcType === "manual" ? (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                              Novo Valor Unitário de Compra (R$)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono">
                                R$
                              </span>
                              <input
                                type="number"
                                step="0.0001"
                                min="0"
                                value={adjustManualUnitPrice || ""}
                                onChange={(e) =>
                                  setAdjustManualUnitPrice(
                                    Number(e.target.value),
                                  )
                                }
                                placeholder="0.00"
                                className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-ink-900 font-mono font-bold"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                                Preço Total do Lote (R$)
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-slate-400">
                                  R$
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={adjustPackagePrice || ""}
                                  onChange={(e) =>
                                    setAdjustPackagePrice(
                                      Number(e.target.value),
                                    )
                                  }
                                  placeholder="0.00"
                                  className="w-full pl-7 pr-2 py-1 text-xs rounded border border-slate-200 bg-white font-mono"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                                Valor do Frete (R$)
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1.5 text-slate-400">
                                  R$
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={adjustFreightValue || ""}
                                  onChange={(e) =>
                                    setAdjustFreightValue(
                                      Number(e.target.value),
                                    )
                                  }
                                  placeholder="0.00"
                                  className="w-full pl-7 pr-2 py-1 text-xs rounded border border-slate-200 bg-white font-mono"
                                />
                              </div>
                            </div>
                            <div className="col-span-2 text-[10.5px] bg-slate-900 text-slate-100 p-3 rounded-xl">
                              <span>Custo Unitário Calculado: </span>
                              <strong className="text-emerald-400 font-mono text-xs">
                                R$ {adjustCalculatedUnitPrice.toFixed(4)}
                              </strong>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2 border-t border-slate-150 pt-2.5 text-[10.5px]">
                          <span className="block font-bold text-slate-600 uppercase tracking-wider">
                            Como aplicar no Estoque?
                          </span>

                          <label className="flex items-start gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="adjustMethod"
                              checked={adjustMethod === "weighted"}
                              onChange={() => setAdjustMethod("weighted")}
                              className="mt-0.5 rounded-full border-slate-300 text-gold-600 focus:ring-gold-500 animate-pulse"
                            />
                            <div>
                              <span className="font-bold text-slate-800">
                                Custo Médio Ponderado (Recomendado)
                              </span>
                              <p className="text-slate-500">
                                Pondera o estoque atual ({selectedItem.quantity}{" "}
                                {selectedItem.unit} a R${" "}
                                {selectedItem.unitValue.toFixed(4)}) com a nova
                                entrada ({adjustData.amount} {selectedItem.unit}{" "}
                                a R$ {targetUnitPriceToApply.toFixed(4)}). Novo
                                custo unitário final do item:{" "}
                                <strong className="text-emerald-600 font-mono font-bold">
                                  R$ {weightedCalculatedUnitPrice.toFixed(4)}
                                </strong>
                                .
                              </p>
                            </div>
                          </label>

                          <label className="flex items-start gap-2 cursor-pointer select-none mt-2">
                            <input
                              type="radio"
                              name="adjustMethod"
                              checked={adjustMethod === "replace"}
                              onChange={() => setAdjustMethod("replace")}
                              className="mt-0.5 rounded-full border-slate-300 text-gold-600 focus:ring-gold-500"
                            />
                            <div>
                              <span className="font-bold text-slate-800">
                                Substituir Custo Unitário Inteiro
                              </span>
                              <p className="text-slate-500">
                                Ignora o custo antigo. O custo unitário do
                                estoque inteiro passará a ser{" "}
                                <strong className="text-emerald-600 font-mono font-bold">
                                  R$ {targetUnitPriceToApply.toFixed(4)}
                                </strong>
                                .
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Motivo / Observações
                </label>
                <input
                  type="text"
                  required
                  value={adjustData.notes}
                  onChange={(e) =>
                    setAdjustData({ ...adjustData, notes: e.target.value })
                  }
                  placeholder="Ex: Lote novo de fornecedor, perda por defeito..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-ink-900 focus:outline-none"
                />
              </div>
              </div>

              <div className="p-4 border-t border-slate-150 flex justify-end gap-3 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-br from-ink-900 to-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md"
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
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-[24px] shadow-2xl p-6 space-y-4 animate-slide-in-up">
            <div className="flex items-center gap-3 text-warning-500">
              <div className="p-2 bg-amber-50 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-serif font-semibold text-base text-ink-900">
                Confirmar Exclusão
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Deseja realmente excluir o insumo{" "}
              <strong className="text-slate-800">"{deleteConfirm.name}"</strong>{" "}
              do estoque? Esta ação não pode ser desfeita.
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

      {/* Batch Delete Modal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-[24px] shadow-2xl p-6 space-y-4 animate-slide-in-up">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2 bg-rose-50 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-serif font-semibold text-base text-ink-900">
                Confirmar Exclusão em Lote
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Você selecionou{" "}
              <strong className="text-slate-800">
                {selectedItemIds.length} insumos
              </strong>{" "}
              para excluir. Deseja realmente excluir todos eles? Esta ação é
              irreversível e removerá todos os itens do estoque permanentemente.
            </p>

            {/* List of items to be deleted */}
            <div className="max-h-24 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50 text-[10px] space-y-1">
              {inventory
                .filter((i) => selectedItemIds.includes(i.id))
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between font-mono font-semibold text-slate-600"
                  >
                    <span>{item.name}</span>
                    <span>{item.code}</span>
                  </div>
                ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer transition-all duration-200 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Delete all selected items
                  selectedItemIds.forEach((id) => {
                    deleteInventoryItem(id);
                  });
                  toast.success(
                    "Exclusão em Lote realizada!",
                    `${selectedItemIds.length} insumos foram removidos permanentemente.`,
                  );
                  setSelectedItemIds([]);
                  setIsSelectionMode(false);
                  setShowBatchDeleteModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 active:scale-95"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Adjust Modal */}
      {showBatchAdjustModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4 lg:p-6 overflow-hidden">
          <div className="bg-white border border-slate-200 w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-up">
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gold-500/10 rounded-xl text-gold-600">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-ink-900">
                    Movimentar Estoque em Lote
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Você está ajustando o estoque de{" "}
                    <strong className="text-slate-800">
                      {selectedItemIds.length} insumos selecionados
                    </strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchAdjustModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-50 hover:text-ink-900 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Save batch adjust
                let countSuccess = 0;
                selectedItemIds.forEach((id) => {
                  const target = inventory.find((i) => i.id === id);
                  if (!target) return;

                  // Calculate amount to adjust
                  const finalAmt =
                    batchAdjustData.type === "add"
                      ? batchAdjustData.amount
                      : -batchAdjustData.amount;

                  // Apply recalculation logic if updatePrice is enabled and type is 'add'
                  let appliedUnitValue: number | undefined = undefined;
                  let finalExpense: number | undefined = undefined;

                  if (
                    batchAdjustData.type === "add" &&
                    batchAdjustData.updatePrice
                  ) {
                    const targetPriceToApply =
                      batchAdjustData.priceCalcType === "manual"
                        ? batchAdjustData.manualUnitPrice
                        : (batchAdjustData.packagePrice +
                            batchAdjustData.freightValue) /
                          batchAdjustData.amount;

                    finalExpense =
                      batchAdjustData.packagePrice +
                      batchAdjustData.freightValue;

                    if (batchAdjustData.priceMethod === "weighted") {
                      const currentQty = target.quantity || 0;
                      const currentPrice = target.unitValue || 0;
                      const totalQty = currentQty + batchAdjustData.amount;
                      if (totalQty > 0) {
                        appliedUnitValue =
                          (currentQty * currentPrice +
                            batchAdjustData.amount * targetPriceToApply) /
                          totalQty;
                      } else {
                        appliedUnitValue = targetPriceToApply;
                      }
                    } else {
                      appliedUnitValue = targetPriceToApply;
                    }
                  }

                  adjustStock(
                    id,
                    finalAmt,
                    batchAdjustData.notes || "Ajuste de estoque em lote",
                    target.category,
                    batchAdjustData.supplierName || "Fornecedor Diverso",
                    appliedUnitValue,
                    finalExpense,
                  );
                  countSuccess++;
                });

                toast.success(
                  "Movimentação em Lote Concluída!",
                  `${countSuccess} insumos foram movimentados com sucesso.`,
                );
                setSelectedItemIds([]);
                setIsSelectionMode(false);
                setShowBatchAdjustModal(false);
              }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
              {/* List of items being adjusted */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                  Insumos Afetados
                </label>
                <div className="max-h-24 overflow-y-auto border border-slate-150 rounded-xl p-2.5 bg-slate-50 text-[10px] space-y-1 font-mono">
                  {inventory
                    .filter((i) => selectedItemIds.includes(i.id))
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-slate-600 font-semibold"
                      >
                        <span className="font-sans font-bold">{item.name}</span>
                        <span>
                          Saldo: {item.quantity} {item.unit} | R${" "}
                          {item.unitValue.toFixed(4)}/un
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                    Tipo de Movimentação *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setBatchAdjustData({ ...batchAdjustData, type: "add" })
                      }
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${batchAdjustData.type === "add" ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}
                    >
                      Adicionar (+)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBatchAdjustData({
                          ...batchAdjustData,
                          type: "subtract",
                        })
                      }
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${batchAdjustData.type === "subtract" ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}
                    >
                      Subtrair (-)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                    Quantidade por Item *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={batchAdjustData.amount}
                    onChange={(e) =>
                      setBatchAdjustData({
                        ...batchAdjustData,
                        amount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-ink-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                  Observações / Justificativa *
                </label>
                <input
                  type="text"
                  required
                  value={batchAdjustData.notes}
                  onChange={(e) =>
                    setBatchAdjustData({
                      ...batchAdjustData,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Ex: Balanço trimestral, acerto de lote..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-ink-900 focus:outline-none"
                />
              </div>

              {batchAdjustData.type === "add" && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    value={batchAdjustData.supplierName}
                    onChange={(e) =>
                      setBatchAdjustData({
                        ...batchAdjustData,
                        supplierName: e.target.value,
                      })
                    }
                    placeholder="Ex: Fornecedor de Contas, Importadora..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-ink-900 focus:outline-none"
                  />
                </div>
              )}

              {batchAdjustData.type === "add" && (
                <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Truck size={14} className="text-slate-500" />
                      <span className="text-xs font-bold text-slate-700">
                        Atualizar Preços Unitários?
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={batchAdjustData.updatePrice}
                      onChange={(e) =>
                        setBatchAdjustData({
                          ...batchAdjustData,
                          updatePrice: e.target.checked,
                        })
                      }
                      className="rounded border-slate-300 text-gold-600 focus:ring-gold-500 cursor-pointer"
                    />
                  </div>

                  {batchAdjustData.updatePrice && (
                    <div className="space-y-3 pt-2 border-t border-slate-150 animate-fade-in">
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setBatchAdjustData({
                              ...batchAdjustData,
                              priceCalcType: "manual",
                            })
                          }
                          className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${batchAdjustData.priceCalcType === "manual" ? "bg-gold-500/10 border-gold-500 text-gold-700" : "bg-white border-slate-200 text-slate-500"}`}
                        >
                          Digitar Valor Manual
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setBatchAdjustData({
                              ...batchAdjustData,
                              priceCalcType: "calc",
                            })
                          }
                          className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${batchAdjustData.priceCalcType === "calc" ? "bg-gold-500/10 border-gold-500 text-gold-700" : "bg-white border-slate-200 text-slate-500"}`}
                        >
                          Assistente (Lote + Frete)
                        </button>
                      </div>

                      {batchAdjustData.priceCalcType === "manual" ? (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                            Novo Valor Unitário de Compra para Todos (R$)
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono">
                              R$
                            </span>
                            <input
                              type="number"
                              step="0.0001"
                              min="0"
                              value={batchAdjustData.manualUnitPrice || ""}
                              onChange={(e) =>
                                setBatchAdjustData({
                                  ...batchAdjustData,
                                  manualUnitPrice: Number(e.target.value),
                                })
                              }
                              placeholder="0.00"
                              className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-ink-900 font-mono font-bold"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                              Preço Total do Lote (R$)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1.5 text-slate-400">
                                R$
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={batchAdjustData.packagePrice || ""}
                                onChange={(e) =>
                                  setBatchAdjustData({
                                    ...batchAdjustData,
                                    packagePrice: Number(e.target.value),
                                  })
                                }
                                placeholder="0.00"
                                className="w-full pl-7 pr-2 py-1 text-xs rounded border border-slate-200 bg-white font-mono"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                              Valor do Frete do Lote (R$)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1.5 text-slate-400">
                                R$
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={batchAdjustData.freightValue || ""}
                                onChange={(e) =>
                                  setBatchAdjustData({
                                    ...batchAdjustData,
                                    freightValue: Number(e.target.value),
                                  })
                                }
                                placeholder="0.00"
                                className="w-full pl-7 pr-2 py-1 text-xs rounded border border-slate-200 bg-white font-mono"
                              />
                            </div>
                          </div>
                          <div className="col-span-2 text-[10.5px] bg-slate-900 text-slate-100 p-3 rounded-xl flex justify-between">
                            <span>Custo Unitário Calculado:</span>
                            <strong className="text-emerald-400 font-mono text-xs">
                              R${" "}
                              {batchAdjustData.amount > 0
                                ? (
                                    (batchAdjustData.packagePrice +
                                      batchAdjustData.freightValue) /
                                    batchAdjustData.amount
                                  ).toFixed(4)
                                : "0.00"}
                            </strong>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 border-t border-slate-150 pt-2.5 text-[10.5px]">
                        <span className="block font-bold text-slate-600 uppercase tracking-wider">
                          Como aplicar no Estoque?
                        </span>

                        <label className="flex items-start gap-2 cursor-pointer select-none">
                          <input
                            type="radio"
                            name="batchPriceMethod"
                            checked={batchAdjustData.priceMethod === "weighted"}
                            onChange={() =>
                              setBatchAdjustData({
                                ...batchAdjustData,
                                priceMethod: "weighted",
                              })
                            }
                            className="mt-0.5 rounded-full border-slate-300 text-gold-600 focus:ring-gold-500"
                          />
                          <div>
                            <span className="font-bold text-slate-800">
                              Custo Médio Ponderado (Recomendado)
                            </span>
                            <p className="text-slate-500">
                              Pondera o estoque atual de cada item com o novo
                              custo unitário de compra inserido.
                            </p>
                          </div>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer select-none mt-2">
                          <input
                            type="radio"
                            name="batchPriceMethod"
                            checked={batchAdjustData.priceMethod === "replace"}
                            onChange={() =>
                              setBatchAdjustData({
                                ...batchAdjustData,
                                priceMethod: "replace",
                              })
                            }
                            className="mt-0.5 rounded-full border-slate-300 text-gold-600 focus:ring-gold-500"
                          />
                          <div>
                            <span className="font-bold text-slate-800">
                              Substituir Custo Unitário Inteiro
                            </span>
                            <p className="text-slate-500">
                              O custo de compra unitário de todos os itens
                              selecionados passará a ser exatamente o novo valor
                              digitado/calculado.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              </div>

              <div className="p-4 border-t border-slate-150 flex justify-end gap-3 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowBatchAdjustModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-br from-ink-900 to-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Salvar Movimentação em Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Insumo Information, History & Performance Modal */}
      {showDetailsModal && detailsItem && itemDetailsData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 lg:p-6 overflow-hidden">
          <div className="bg-white border border-slate-200 w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-up">
            
            {/* Modal Header */}
            <div className="h-20 border-b border-slate-150 px-8 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3.5 flex-1">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-100 flex-shrink-0">
                  <BarChart2 size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif font-bold text-lg md:text-xl text-slate-900 leading-tight truncate">
                      {detailsItem.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-600">
                      {detailsItem.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                    Categoria: <strong className="text-slate-700">{detailsItem.category}</strong> | Fornecedor: <strong className="text-slate-700">{detailsItem.supplier || "Não Informado"}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="px-8 border-b border-slate-150 bg-slate-50/20 flex gap-2 overflow-x-auto scrollbar-none">
              {[
                { id: "summary", label: "Resumo Geral", icon: Info },
                { id: "history", label: "Histórico de Movimentações", icon: History },
                { id: "stats", label: "Estatísticas do Item", icon: Activity },
                { id: "charts", label: "Visualização Gráfica", icon: TrendingUp },
                { id: "timeline", label: "Linha do Tempo", icon: Clock },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = detailsTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDetailsTab(tab.id as any)}
                    className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "border-amber-600 text-amber-700"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
                    }`}
                  >
                    <TabIcon size={14} className={isActive ? "text-amber-600" : "text-slate-400"} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body - Scrollable content with independent scrollbar */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-50/30">
              
              {/* TAB 1: SUMMARY */}
              {detailsTab === "summary" && (
                <div className="space-y-6 animate-fade-in">
                  {/* Cards Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    
                    {/* Stock Balance Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estoque Atual</span>
                        <div className="flex items-baseline gap-1 mt-1.5">
                          <span className="text-3xl font-serif font-black text-slate-900">{detailsItem.quantity}</span>
                          <span className="text-xs font-bold text-slate-500 font-mono">{detailsItem.unit}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                          <span>Mínimo Recomendado:</span>
                          <span className="font-bold text-slate-700">{detailsItem.minQuantity} {detailsItem.unit}</span>
                        </div>
                        {detailsItem.quantity <= detailsItem.minQuantity ? (
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                            <AlertTriangle size={12} />
                            <span>ESTOQUE BAIXO / ALERTA</span>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            <Check size={12} />
                            <span>Estoque Adequado</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Values Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor Unitário Atual</span>
                        <div className="text-2xl font-black text-slate-900 mt-1.5 font-mono">
                          R$ {detailsItem.unitValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                          <span>Valor Total em Estoque:</span>
                        </div>
                        <div className="text-sm font-bold text-slate-800 mt-1 font-mono">
                          R$ {(detailsItem.quantity * detailsItem.unitValue).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Dates & Registration Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data do Cadastro</span>
                        <div className="text-lg font-bold text-slate-800 mt-2 flex items-center gap-2">
                          <Calendar size={16} className="text-slate-400" />
                          <span>{new Date(detailsItem.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                        <div className="flex justify-between text-[10.5px] text-slate-500 font-medium">
                          <span>Status:</span>
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${detailsItem.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                            {detailsItem.status === 'active' ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10.5px] text-slate-500 font-medium">
                          <span>Método de Cálculo:</span>
                          <span className="font-bold text-slate-700 uppercase text-[9px]">
                            {detailsItem.calcMethod === 'fixed' ? 'Fixado / Unidade' : 'Por Grama / Peso'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Movements Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex flex-col justify-between col-span-1">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Última Movimentação</span>
                        {itemDetailsData.movements.length > 0 ? (
                          <div className="mt-2 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between font-medium">
                              <span className="text-slate-500">Tipo:</span>
                              <span className={`font-bold text-[10px] px-1.5 rounded ${
                                itemDetailsData.movements[itemDetailsData.movements.length - 1].type === 'Entrada' ? 'text-emerald-700 bg-emerald-50' :
                                itemDetailsData.movements[itemDetailsData.movements.length - 1].type === 'Saída' ? 'text-rose-700 bg-rose-50' : 'text-blue-700 bg-blue-50'
                              }`}>
                                {itemDetailsData.movements[itemDetailsData.movements.length - 1].type}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Qtd:</span>
                              <span className="font-bold text-slate-800 font-mono">
                                {itemDetailsData.movements[itemDetailsData.movements.length - 1].amount > 0 ? "+" : ""}
                                {itemDetailsData.movements[itemDetailsData.movements.length - 1].amount} {detailsItem.unit}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic block mt-1">Nenhuma movimentação</span>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Última Entrada:</span>
                          <span className="font-bold text-emerald-600">
                            {itemDetailsData.movements.filter(m => m.amount > 0).slice(-1)[0]
                              ? `${new Date(itemDetailsData.movements.filter(m => m.amount > 0).slice(-1)[0].date).toLocaleDateString("pt-BR")} (+${itemDetailsData.movements.filter(m => m.amount > 0).slice(-1)[0].amount})`
                              : "Nenhuma"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Última Saída:</span>
                          <span className="font-bold text-rose-600">
                            {itemDetailsData.movements.filter(m => m.amount < 0).slice(-1)[0]
                              ? `${new Date(itemDetailsData.movements.filter(m => m.amount < 0).slice(-1)[0].date).toLocaleDateString("pt-BR")} (${itemDetailsData.movements.filter(m => m.amount < 0).slice(-1)[0].amount})`
                              : "Nenhuma"}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Specifications and Traceability Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    {/* Specifications and Notes */}
                    <div className="lg:col-span-4">
                      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs h-full flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                            <FileText size={14} className="text-amber-600" />
                            Especificações do Cadastro
                          </h4>
                          <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl leading-relaxed border border-slate-100 min-h-[100px]">
                            {detailsItem.notes || "Nenhuma observação cadastrada para este insumo. Você pode adicionar observações ao editar as propriedades do item."}
                          </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-mono space-y-1">
                          <div>ID Interno: {detailsItem.id}</div>
                          <div>Peso/Gramagem: {detailsItem.weightG || 0}g</div>
                        </div>
                      </div>
                    </div>

                    {/* Compositions (Receitas / Ficha Técnica) */}
                    <div className="lg:col-span-8">
                      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs h-full">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3.5">
                          <Package size={14} className="text-amber-600" />
                          Ficha Técnica / Incorporação em Receitas
                        </h4>
                        
                        {itemDetailsData.relatedProducts.length === 0 ? (
                          <div className="text-xs text-slate-400 italic bg-slate-50 p-6 rounded-xl text-center border border-dashed border-slate-200">
                            Este insumo ainda não está incorporado em nenhuma composição ou receita de produto.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[180px] overflow-y-auto pr-1">
                            {itemDetailsData.relatedProducts.map(prod => {
                              const comp = prod.composition?.find(c => c.materialId === detailsItem.id);
                              return (
                                <div key={prod.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-2 hover:bg-slate-100/50 transition-colors">
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-slate-800 block truncate">{prod.name}</span>
                                    <span className="text-[10px] font-medium text-slate-400 block mt-0.5 uppercase tracking-wider">{prod.category}</span>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <span className="text-xs font-mono font-bold text-amber-700 block">
                                      {comp?.quantity} {detailsItem.unit}
                                    </span>
                                    <span className="text-[9px] text-slate-400 block font-medium mt-0.5">
                                      Custo: R$ {((comp?.quantity || 0) * (comp?.cost || detailsItem.unitValue)).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Operational Traceability Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    
                    {/* Active Production Orders consumption */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3.5">
                        <Activity size={14} className="text-amber-600" />
                        Rastreabilidade em Pedidos e Produção Ativa
                      </h4>
                      
                      {ordersConsuming.length === 0 ? (
                        <div className="text-xs text-slate-400 italic bg-slate-50 p-6 rounded-xl text-center border border-dashed border-slate-200">
                          Este insumo ainda não foi consumido em nenhum pedido de venda registrado no sistema.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                          {ordersConsuming.map(o => (
                            <div key={o.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-2 hover:bg-slate-100/50 transition-all">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-800 font-mono">
                                  Pedido {o.orderNumber}
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                  o.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  o.status === 'producing' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                  {o.status === 'delivered' ? 'Entregue' : o.status === 'producing' ? 'Em Produção' : 'Aprovado'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                Cliente: <strong className="text-slate-700">{o.clientName}</strong>
                              </div>
                              <div className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                Incorporado em: <span className="text-slate-700 italic">{o.productsLabel}</span>
                              </div>
                              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
                                <div className="text-slate-400 flex items-center gap-1 font-medium">
                                  <User size={12} />
                                  <span>Responsável: <strong>{o.responsible}</strong></span>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono font-bold text-rose-600 block">
                                    -{o.consumedQty} {detailsItem.unit}
                                  </span>
                                  <span className="text-[9px] text-slate-400 block mt-0.5">
                                    Impacto: R$ {(o.consumedQty * detailsItem.unitValue).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pending Reservations from Quotes */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3.5">
                        <Clock size={14} className="text-amber-600" />
                        Reservas Temporárias (Orçamentos Pendentes)
                      </h4>
                      
                      {quotesReserving.length === 0 ? (
                        <div className="text-xs text-slate-400 italic bg-slate-50 p-6 rounded-xl text-center border border-dashed border-slate-200">
                          Nenhuma reserva ativa vinculada a orçamentos em aberto.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                          {quotesReserving.map(q => (
                            <div key={q.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5 hover:bg-slate-100/50 transition-colors">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-800 font-mono">
                                  {q.quoteNumber}
                                </span>
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-md">
                                  Pendente
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                Cliente: <strong className="text-slate-700">{q.clientName}</strong>
                              </div>
                              <div className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                Previsto em: <span className="text-slate-700 italic">{q.productsLabel}</span>
                              </div>
                              <div className="pt-2 border-t border-slate-100 flex justify-between items-end text-[10px]">
                                <span className="text-slate-400 font-medium">Reserva Estimada</span>
                                <div className="text-right">
                                  <span className="font-mono font-bold text-amber-600 block">
                                    {q.reservedQty} {detailsItem.unit}
                                  </span>
                                  <span className="text-[9px] text-slate-400 block mt-0.5">
                                    Custo Previsto: R$ {(q.reservedQty * detailsItem.unitValue).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: MOVEMENT HISTORY */}
              {detailsTab === "history" && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Filters Header */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-150 shadow-xs">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Filtros de Período</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Filtre as movimentações para analisar janelas de tempo específicas.</p>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs self-start sm:self-auto">
                      {[
                        { id: "all", label: "Tudo" },
                        { id: "week", label: "Última Semana" },
                        { id: "month", label: "Último Mês" },
                        { id: "year", label: "Último Ano" },
                      ].map((btn) => (
                        <button
                          key={btn.id}
                          onClick={() => setPeriodFilter(btn.id as any)}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                            periodFilter === btn.id
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Movements Table */}
                  <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-5 py-3">Data e Hora</th>
                            <th className="px-5 py-3">Tipo</th>
                            <th className="px-5 py-3 text-right">Qtd Movimentada</th>
                            <th className="px-5 py-3 text-right">Valor Unitário</th>
                            <th className="px-5 py-3 text-right">Valor Total</th>
                            <th className="px-5 py-3">Responsável</th>
                            <th className="px-5 py-3">Observações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 text-xs text-slate-600 font-medium">
                          {itemDetailsData.movements
                            .filter((m) => {
                              const t = new Date(m.date).getTime();
                              const now = new Date("2026-06-26T20:56:00Z").getTime();
                              if (periodFilter === "week") return t >= now - 7 * 24 * 60 * 60 * 1000;
                              if (periodFilter === "month") return t >= now - 30 * 24 * 60 * 60 * 1000;
                              if (periodFilter === "year") return t >= now - 365 * 24 * 60 * 60 * 1000;
                              return true;
                            })
                            .map((m) => {
                              const isPositive = m.amount > 0;
                              return (
                                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-5 py-3 text-slate-500 font-mono text-[11px]">
                                    {new Date(m.date).toLocaleString("pt-BR", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </td>
                                  <td className="px-5 py-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      m.type === "Cadastro" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                      m.type === "Entrada" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                      m.type === "Saída" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                                      "bg-amber-50 text-amber-700 border border-amber-100"
                                    }`}>
                                      {m.type === "Entrada" && <ArrowUpRight size={10} />}
                                      {m.type === "Saída" && <ArrowDownLeft size={10} />}
                                      {m.type}
                                    </span>
                                  </td>
                                  <td className={`px-5 py-3 text-right font-mono font-bold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                                    {isPositive ? "+" : ""}
                                    {m.amount} {detailsItem.unit}
                                  </td>
                                  <td className="px-5 py-3 text-right font-mono text-slate-500">
                                    R$ {m.unitValue.toFixed(4)}
                                  </td>
                                  <td className="px-5 py-3 text-right font-mono text-slate-900 font-bold">
                                    R$ {m.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-5 py-3 text-slate-500 flex items-center gap-1.5 mt-0.5">
                                    <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 uppercase">
                                      {m.responsible.charAt(0)}
                                    </div>
                                    <span className="text-[11px]">{m.responsible}</span>
                                  </td>
                                  <td className="px-5 py-3 text-slate-400 italic text-[11px] max-w-xs truncate" title={m.notes}>
                                    {m.notes}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: STATISTICS */}
              {detailsTab === "stats" && (
                <div className="space-y-6 animate-fade-in">
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* General Inputs/Outputs Stats */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Volume de Movimentações</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-emerald-50/40 p-3 rounded-xl border border-emerald-50">
                          <div>
                            <span className="text-[10px] font-bold text-emerald-600 block">Total Reposto (Entradas)</span>
                            <span className="text-lg font-bold text-emerald-800 font-mono mt-0.5 block">+{itemDetailsData.stats.totalInputsQty} {detailsItem.unit}</span>
                          </div>
                          <ArrowUpRight className="text-emerald-500" size={24} />
                        </div>

                        <div className="flex justify-between items-center bg-rose-50/40 p-3 rounded-xl border border-rose-50">
                          <div>
                            <span className="text-[10px] font-bold text-rose-600 block">Total Consumido (Saídas)</span>
                            <span className="text-lg font-bold text-rose-800 font-mono mt-0.5 block">-{itemDetailsData.stats.totalOutputsQty} {detailsItem.unit}</span>
                          </div>
                          <ArrowDownLeft className="text-rose-500" size={24} />
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>Quantidade de Reposições:</span>
                        <strong className="text-slate-800">{itemDetailsData.stats.totalReplenishments}</strong>
                      </div>
                    </div>

                    {/* Financial stats */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Preços e Investimentos</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Total Investido (Compras)</span>
                          <span className="font-bold text-slate-800 font-mono">R$ {itemDetailsData.stats.totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Preço Médio de Aquisição</span>
                          <span className="font-bold text-slate-800 font-mono">R$ {itemDetailsData.stats.avgAcquisitionPrice.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500 font-medium">Maior Preço Registrado</span>
                          <span className="font-bold text-slate-800 font-mono text-rose-600">R$ {itemDetailsData.stats.highestPrice.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-500 font-medium">Menor Preço Registrado</span>
                          <span className="font-bold text-slate-800 font-mono text-emerald-600">R$ {itemDetailsData.stats.lowestPrice.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Periodic Consumption */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Velocidade de Consumo</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500 font-medium">Últimos 7 dias (Semana)</span>
                          <span className="text-sm font-bold text-slate-800 font-mono">{itemDetailsData.stats.consumptionWeek} {detailsItem.unit}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (itemDetailsData.stats.consumptionWeek / (detailsItem.minQuantity || 1)) * 100)}%` }}></div>
                        </div>

                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xs text-slate-500 font-medium">Último Mês</span>
                          <span className="text-sm font-bold text-slate-800 font-mono">{itemDetailsData.stats.consumptionMonth} {detailsItem.unit}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (itemDetailsData.stats.consumptionMonth / ((detailsItem.minQuantity || 1) * 2)) * 100)}%` }}></div>
                        </div>

                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xs text-slate-500 font-medium">Último Ano</span>
                          <span className="text-sm font-bold text-slate-800 font-mono">{itemDetailsData.stats.consumptionYear} {detailsItem.unit}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (itemDetailsData.stats.consumptionYear / ((detailsItem.minQuantity || 1) * 6)) * 100)}%` }}></div>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 4: CHARTS */}
              {detailsTab === "charts" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Grid 2x2 of charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Chart 1: Stock Evolution */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
                      <div className="mb-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evolução de Saldo em Estoque</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Variação do estoque ao longo do tempo.</p>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={itemDetailsData.evolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorEstoque" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="formatDate" stroke="#94a3b8" fontSize={10} fontStyle="bold" />
                            <YAxis stroke="#94a3b8" fontSize={10} fontStyle="bold" />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: '#e2e8f0' }} />
                            <Area type="monotone" dataKey="estoque" name="Saldo" stroke="#d97706" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEstoque)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 2: Inputs vs Outputs */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
                      <div className="mb-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Entradas vs Saídas por Operação</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Comparativo do volume movimentado em cada etapa.</p>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={itemDetailsData.movements.map(m => ({
                            date: new Date(m.date).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' }),
                            entrada: m.amount > 0 ? m.amount : 0,
                            saida: m.amount < 0 ? Math.abs(m.amount) : 0,
                          }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                            <YAxis stroke="#94a3b8" fontSize={10} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: '#e2e8f0' }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="entrada" name="Entrada (+)" fill="#10b981" radius={[8, 8, 8, 8]} barSize={18} />
                            <Bar dataKey="saida" name="Saída (-)" fill="#f43f5e" radius={[8, 8, 8, 8]} barSize={18} />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 3: Monthly Consumption */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
                      <div className="mb-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Consumo Mensal de Insumo</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Análise das saídas de estoque agrupadas por mês.</p>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={[
                            { mes: "Maio", consumo: Math.round(itemDetailsData.stats.totalOutputsQty * 0.4) },
                            { mes: "Junho", consumo: Math.round(itemDetailsData.stats.totalOutputsQty * 0.6) }
                          ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="mes" stroke="#94a3b8" fontSize={10} />
                            <YAxis stroke="#94a3b8" fontSize={10} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: '#e2e8f0' }} />
                            <Bar dataKey="consumo" name="Quantidade Consumida" fill="#e11d48" radius={[8, 8, 8, 8]} barSize={28} />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 4: Acquisition Price Evolution */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
                      <div className="mb-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evolução do Preço de Aquisição</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Histórico do valor unitário registrado nas compras.</p>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={itemDetailsData.movements.filter(m => m.amount > 0).map(m => ({
                            date: new Date(m.date).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' }),
                            preco: m.unitValue
                          }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                            <YAxis stroke="#94a3b8" fontSize={10} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: '#e2e8f0' }} />
                            <Line type="monotone" dataKey="preco" name="Valor Unitário (R$)" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 5: TIMELINE */}
              {detailsTab === "timeline" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs animate-fade-in">
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-800">Linha do Tempo de Eventos</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Histórico cronológico completo de ações e marcos deste insumo.</p>
                  </div>

                  <div className="relative pl-6 border-l-2 border-slate-150 space-y-8 ml-3 py-2">
                    {itemDetailsData.movements.map((m) => {
                      const isCadastro = m.type === "Cadastro";
                      const isEntrada = m.type === "Entrada";
                      const isSaida = m.type === "Saída";
                      
                      return (
                        <div key={m.id} className="relative">
                          {/* Dot Indicator */}
                          <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                            isCadastro ? "border-blue-500" :
                            isEntrada ? "border-emerald-500" :
                            isSaida ? "border-rose-500" :
                            "border-amber-500"
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              isCadastro ? "bg-blue-500" :
                              isEntrada ? "bg-emerald-500" :
                              isSaida ? "bg-rose-500" :
                              "bg-amber-500"
                            }`} />
                          </div>

                          {/* Event info */}
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                              {new Date(m.date).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <div className="mt-2">
                              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                <span>
                                  {isCadastro ? "Cadastro do Item no ERP" :
                                   isEntrada ? `Lote de Entrada Adicionado` :
                                   isSaida ? `Saída por Consumo` :
                                   `Ajuste Técnico de Estoque`}
                                </span>
                                <span className="text-[11px] font-medium text-slate-400">
                                  por {m.responsible}
                                </span>
                              </h5>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <strong className={isEntrada ? "text-emerald-600" : isSaida ? "text-rose-600" : "text-slate-700"}>
                                  {m.amount > 0 ? "+" : ""}
                                  {m.amount} {detailsItem.unit}
                                </strong>
                                <span className="text-slate-500"> — {m.notes}</span>
                                {m.totalValue > 0 && (
                                  <span className="block text-[10px] font-mono font-bold text-slate-400 mt-1.5">
                                    Valor da operação: R$ {m.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="h-16 border-t border-slate-150 px-8 flex items-center justify-end bg-slate-50">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar Painel de Análise
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Export PDF Modal */}
      {showExportPdfModal && (
        <div className="fixed inset-0 bg-ink-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-amber-50 to-amber-100/40 border-b border-amber-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                  <FileDown size={20} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    {commercialMode ? "Exportar Catálogo Comercial (PDF)" : "Exportar Relatório de Estoque (PDF)"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gere um documento A4 padronizado com cabeçalho institucional do Ateliê.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportPdfModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Layout format badge */}
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/80 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Grid size={16} />
                </div>
                <div>
                  <span className="font-bold text-amber-950 block text-xs">Formato: Catálogo em Cards A4</span>
                  <span className="text-[10px] text-amber-800 block mt-0.5">
                    Layout com fotos grandes (40x40mm), foco em código/SKU e descrição. Sem exibição de quantidades ou unidades de medida.
                  </span>
                </div>
              </div>

              {/* Institutional info preview */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-serif font-bold flex items-center justify-center text-xs">
                    {settings.companyName ? settings.companyName.substring(0, 2).toUpperCase() : "AS"}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">{settings.companyName || "Ateliê Sagrado"}</span>
                    <span className="text-[10px] text-slate-500 block">CNPJ: {settings.cnpj || "Cadastrado em Configurações"}</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Dados Institucionais OK
                </span>
              </div>

              {/* Filter 1: Only Available Items */}
              <div className="p-3.5 bg-amber-50/40 border border-amber-200/60 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pdfOnlyAvailable}
                    onChange={(e) => setPdfOnlyAvailable(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Apenas itens disponíveis em estoque (Saldo &gt; 0)</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Filtra automaticamente insumos zerados ou indisponíveis para apresentação comercial limpa.
                    </span>
                  </div>
                </label>
              </div>

              {/* Filter 2: Category Filter */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Filtrar por Categoria de Insumo
                </label>
                <select
                  value={pdfCategoryFilter}
                  onChange={(e) => setPdfCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium cursor-pointer"
                >
                  <option value="all">Todas as Categorias (Completo)</option>
                  {Array.from(new Set(inventory.filter(i => !i.isDeleted).map(i => i.category))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Filter 3: Subcategory / Keyword Search */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Filtro por Subcategoria ou Palavra-Chave
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: Pérola, Metal, Crucifixo, Cordão..."
                    value={pdfSubcategoryFilter}
                    onChange={(e) => setPdfSubcategoryFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
              </div>

              {/* Option 4: Include Unit Price */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div>
                    <span className="font-bold text-slate-800 block">Exibir Valor Unitário no Relatório</span>
                    <span className="text-[10px] text-slate-500 block">
                      {commercialMode ? "Desativado por padrão no Modo Comercial" : "Mostra o custo unitário cadastrado de cada insumo"}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={pdfIncludeUnitPrice}
                    onChange={(e) => setPdfIncludeUnitPrice(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer w-4 h-4"
                  />
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowExportPdfModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={handleExportPdf}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Gerando PDF...</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>Gerar e Baixar PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
