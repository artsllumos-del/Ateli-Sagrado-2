import { InventoryItem, Product, ProductPaymentVariation, SystemSettings } from '../types/erp';

export interface CostBreakdownResult {
  materialsCost: number;
  materialsList: Array<{
    materialId: string;
    name: string;
    unit: string;
    unitValue: number;
    quantity: number;
    totalCost: number;
  }>;
  lossPercent: number;
  lossCost: number;
  laborTimeMin: number;
  laborHourlyRate: number;
  laborCost: number;
  costEmbalagem: number;
  costEnergia: number;
  costFerramentas: number;
  costOperacional: number;
  indirectCostsTotal: number;
  totalBaseCost: number;
  targetMarginPercent: number;
  paymentVariations: Array<{
    methodId: string;
    methodLabel: string;
    feePercent: number;
    suggestedPrice: number;
    appliedPrice: number;
    taxCost: number;
    totalCostWithTax: number;
    netProfit: number;
    marginPercent: number;
  }>;
}

export function calculateProductCostBreakdown(
  product: Partial<Product>,
  inventory: InventoryItem[],
  settings?: SystemSettings
): CostBreakdownResult {
  const defaultLaborRate = settings?.laborHourlyRate ?? 30;
  const defaultMargin = settings?.defaultMarginPercent ?? 50;

  // 1. Materials Composition
  const composition = product.composition || [];
  const materialsList = composition.map(c => {
    const mat = inventory.find(i => i.id === c.materialId);
    const unitVal = mat ? mat.unitValue : 0;
    const name = mat ? mat.name : 'Insumo indisponível';
    const unit = mat ? mat.unit : 'unid';
    const totalCost = Number((c.quantity * unitVal).toFixed(2));
    return {
      materialId: c.materialId,
      name,
      unit,
      unitValue: unitVal,
      quantity: c.quantity,
      totalCost
    };
  });

  const materialsCost = materialsList.reduce((acc, item) => acc + item.totalCost, 0);

  // 2. Loss cost (+ Perda %)
  const lossPercent = product.lossPercent !== undefined ? product.lossPercent : 5;
  const lossCost = materialsCost * (lossPercent / 100);

  // 3. Labor Cost
  const laborTimeMin = product.productionTimeMin || 20;
  const laborHourlyRate = product.laborHourlyRate !== undefined ? product.laborHourlyRate : defaultLaborRate;
  const laborCost = (laborTimeMin / 60) * laborHourlyRate;

  // 4. Indirect Costs
  const costEmbalagem = product.costEmbalagem !== undefined ? product.costEmbalagem : 2.5;
  const costEnergia = product.costEnergia !== undefined ? product.costEnergia : 1.0;
  const costFerramentas = product.costFerramentas !== undefined ? product.costFerramentas : 0.5;
  const costOperacional = product.costOperacional !== undefined ? product.costOperacional : 2.0;
  const indirectCostsTotal = costEmbalagem + costEnergia + costFerramentas + costOperacional;

  // 5. Total Base Production Cost (Custo Total Real)
  const totalBaseCost = materialsCost + lossCost + laborCost + indirectCostsTotal;

  // 6. Target Margin %
  const targetMarginPercent = product.targetMarginPercent !== undefined ? product.targetMarginPercent : defaultMargin;
  const marginFrac = Math.min(0.95, Math.max(0, targetMarginPercent / 100));

  // 7. Payment Methods Tax profiles
  const methodProfiles = [
    { id: 'pix', label: 'Pix / Dinheiro (À Vista)', defaultFee: settings?.taxPercent ?? 0 },
    { id: 'card_1x', label: 'Cartão de Crédito (1x à Vista)', defaultFee: 3.5 },
    { id: 'card_12x', label: 'Cartão Parcelado (12x Sem Juros)', defaultFee: 12.0 },
    { id: 'marketplace', label: 'Marketplace / Shopee / E-commerce', defaultFee: 16.0 }
  ];

  const basePrice = product.sellingPrice || 0;

  const paymentVariations = methodProfiles.map(m => {
    // Check if custom variation was saved
    const savedVar = product.paymentVariations?.find(v => v.methodId === m.id);
    const feePercent = savedVar ? savedVar.feePercent : m.defaultFee;
    const feeFrac = feePercent / 100;

    const taxCost = totalBaseCost * feeFrac;
    const totalCostWithTax = totalBaseCost + taxCost;

    // Suggested price for this payment method to preserve target margin:
    let suggestedPrice = marginFrac >= 0.95 ? totalCostWithTax * 10 : totalCostWithTax / (1 - marginFrac);
    if (isNaN(suggestedPrice) || suggestedPrice <= 0) suggestedPrice = totalCostWithTax * 1.5;

    // Applied price for this payment method
    let appliedPrice = savedVar ? savedVar.price : 0;
    if (appliedPrice <= 0) {
      if (m.id === 'pix' && basePrice > 0) {
        appliedPrice = basePrice;
      } else if (basePrice > 0) {
        // Automatically adjust price according to payment method tax so profit margin stays protected!
        // Price = basePrice / (1 - feeFrac)
        appliedPrice = basePrice / (1 - Math.min(0.8, feeFrac));
      } else {
        appliedPrice = suggestedPrice;
      }
    }

    const netProfit = appliedPrice - totalCostWithTax;
    const marginPercent = appliedPrice > 0 ? (netProfit / appliedPrice) * 100 : 0;

    return {
      methodId: m.id,
      methodLabel: m.label,
      feePercent,
      suggestedPrice,
      appliedPrice,
      taxCost,
      totalCostWithTax,
      netProfit,
      marginPercent
    };
  });

  return {
    materialsCost,
    materialsList,
    lossPercent,
    lossCost,
    laborTimeMin,
    laborHourlyRate,
    laborCost,
    costEmbalagem,
    costEnergia,
    costFerramentas,
    costOperacional,
    indirectCostsTotal,
    totalBaseCost,
    targetMarginPercent,
    paymentVariations
  };
}
