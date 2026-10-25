import { InventoryItem, Product, SystemSettings } from '../types/erp';

// -------------------------------------------------------------
// 1. CUSTO MÉDIO PONDERADO MÓVEL
// -------------------------------------------------------------
export interface MovingAverageCostParams {
  currentStock: number;
  currentAverageCost: number;
  incomingStock: number;
  incomingUnitCost: number;
}

export function calculateMovingAverageCost(params: MovingAverageCostParams): number {
  const currentStock = Math.max(0, params.currentStock || 0);
  const currentAvg = Math.max(0, params.currentAverageCost || 0);
  const incomingStock = Math.max(0, params.incomingStock || 0);
  const incomingCost = Math.max(0, params.incomingUnitCost || 0);

  const totalNewStock = currentStock + incomingStock;
  if (totalNewStock <= 0) return incomingCost > 0 ? incomingCost : currentAvg;

  const totalCurrentValue = currentStock * currentAvg;
  const totalIncomingValue = incomingStock * incomingCost;
  const weightedAverage = (totalCurrentValue + totalIncomingValue) / totalNewStock;

  return Number(weightedAverage.toFixed(4));
}

// -------------------------------------------------------------
// 2. FÓRMULA OFICIAL DE PRECIFICAÇÃO DE PRODUTO
// Preço de venda = (custo de fabricação + custos fixos ainda não incluídos e alocados por unidade)
//                  ÷ (1 − taxas variáveis − margem desejada).
// -------------------------------------------------------------
export interface PricingCalculationInput {
  manufacturingCost: number; // Materiais (com perdas) + Mão de Obra
  allocatedFixedCosts?: number; // Custos indiretos fixos alocados (embalagem, energia, ferramentas, operacional)
  variableTaxesPercent: number; // Taxas variáveis (impostos + gateway/cartão/marketplace)
  targetMarginPercent: number; // Margem líquida desejada sobre a receita
}

export interface PricingCalculationResult {
  suggestedPrice: number;
  manufacturingCost: number;
  allocatedFixedCosts: number;
  totalCostBase: number;
  variableTaxesPercent: number;
  variableTaxesAmount: number;
  targetMarginPercent: number;
  estimatedNetProfit: number;
  markupPercent: number;
  isValid: boolean;
  errorMessage?: string;
}

export function calculateOfficialProductPrice(
  input: PricingCalculationInput
): PricingCalculationResult {
  const mfgCost = Math.max(0, input.manufacturingCost || 0);
  const fixedCost = Math.max(0, input.allocatedFixedCosts || 0);
  const totalCostBase = mfgCost + fixedCost;

  const taxFrac = Math.max(0, (input.variableTaxesPercent || 0) / 100);
  const marginFrac = Math.max(0, (input.targetMarginPercent || 0) / 100);
  const deductionsSum = taxFrac + marginFrac;

  // Validação: Impedir percentuais cuja soma seja igual ou superior a 100%
  if (deductionsSum >= 0.999) {
    // Fallback defensivo com markup padrão para não quebrar a tela, mas alertando
    const safeMarkupPrice = totalCostBase * (1 + marginFrac) / Math.max(0.1, (1 - taxFrac));
    return {
      suggestedPrice: Number(safeMarkupPrice.toFixed(2)),
      manufacturingCost: mfgCost,
      allocatedFixedCosts: fixedCost,
      totalCostBase: Number(totalCostBase.toFixed(2)),
      variableTaxesPercent: input.variableTaxesPercent,
      variableTaxesAmount: Number((safeMarkupPrice * taxFrac).toFixed(2)),
      targetMarginPercent: input.targetMarginPercent,
      estimatedNetProfit: Number((safeMarkupPrice - (totalCostBase + safeMarkupPrice * taxFrac)).toFixed(2)),
      markupPercent: totalCostBase > 0 ? Number((((safeMarkupPrice - totalCostBase) / totalCostBase) * 100).toFixed(1)) : 0,
      isValid: false,
      errorMessage: `A soma de taxas variáveis (${input.variableTaxesPercent}%) e margem desejada (${input.targetMarginPercent}%) atinge ${Number((deductionsSum * 100).toFixed(1))}%, o que excede o limite de 99.9%.`
    };
  }

  // Fórmula solicitada:
  // Preço de venda = (custo de fabricação + custos fixos alocados) ÷ (1 − taxas variáveis − margem desejada)
  const divisor = 1 - deductionsSum;
  const suggestedPrice = totalCostBase / divisor;
  const variableTaxesAmount = suggestedPrice * taxFrac;
  const totalWithTax = totalCostBase + variableTaxesAmount;
  const estimatedNetProfit = suggestedPrice - totalWithTax;
  const markupPercent = totalCostBase > 0 ? ((suggestedPrice - totalCostBase) / totalCostBase) * 100 : 0;

  return {
    suggestedPrice: Number(suggestedPrice.toFixed(2)),
    manufacturingCost: Number(mfgCost.toFixed(2)),
    allocatedFixedCosts: Number(fixedCost.toFixed(2)),
    totalCostBase: Number(totalCostBase.toFixed(2)),
    variableTaxesPercent: input.variableTaxesPercent,
    variableTaxesAmount: Number(variableTaxesAmount.toFixed(2)),
    targetMarginPercent: input.targetMarginPercent,
    estimatedNetProfit: Number(estimatedNetProfit.toFixed(2)),
    markupPercent: Number(markupPercent.toFixed(1)),
    isValid: true
  };
}
