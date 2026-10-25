import { InventoryItem } from '../types/erp';

export interface UnitDefinition {
  id: string;
  label: string;
  symbol: string;
  category: 'count' | 'weight' | 'length' | 'volume';
  baseFactor?: number; // relative to standard base unit in that category
}

// -------------------------------------------------------------
// CATÁLOGO PADRONIZADO DE UNIDADES
// -------------------------------------------------------------
export const PURCHASE_UNITS: UnitDefinition[] = [
  { id: 'pacote', label: 'Pacote (pct)', symbol: 'pct', category: 'count' },
  { id: 'rolo', label: 'Rolo', symbol: 'rolo', category: 'length' },
  { id: 'caixa', label: 'Caixa (cx)', symbol: 'cx', category: 'count' },
  { id: 'kg', label: 'Quilo (kg)', symbol: 'kg', category: 'weight', baseFactor: 1000 },
  { id: 'cento', label: 'Cento (100 unid)', symbol: 'cto', category: 'count', baseFactor: 100 },
  { id: 'milheiro', label: 'Milheiro (1.000 unid)', symbol: 'mil', category: 'count', baseFactor: 1000 },
  { id: 'cartela', label: 'Cartela', symbol: 'cart', category: 'count' },
  { id: 'tubo', label: 'Tubo', symbol: 'tubo', category: 'volume' },
  { id: 'unidade', label: 'Unidade individual', symbol: 'unid', category: 'count', baseFactor: 1 },
  { id: 'metro', label: 'Metro linear (m)', symbol: 'm', category: 'length', baseFactor: 100 }
];

export const STOCK_UNITS: UnitDefinition[] = [
  { id: 'unidade', label: 'Unidade (unid)', symbol: 'unid', category: 'count', baseFactor: 1 },
  { id: 'grama', label: 'Grama (g)', symbol: 'g', category: 'weight', baseFactor: 1 },
  { id: 'metro', label: 'Metro (m)', symbol: 'm', category: 'length', baseFactor: 100 },
  { id: 'cm', label: 'Centímetro (cm)', symbol: 'cm', category: 'length', baseFactor: 1 },
  { id: 'ml', label: 'Mililitro (ml)', symbol: 'ml', category: 'volume', baseFactor: 1 }
];

export const CONSUMPTION_UNITS: UnitDefinition[] = [
  { id: 'unidade', label: 'Unidade (unid)', symbol: 'unid', category: 'count' },
  { id: 'grama', label: 'Grama (g)', symbol: 'g', category: 'weight' },
  { id: 'cm', label: 'Centímetro (cm)', symbol: 'cm', category: 'length' },
  { id: 'metro', label: 'Metro (m)', symbol: 'm', category: 'length' },
  { id: 'ml', label: 'Mililitro (ml)', symbol: 'ml', category: 'volume' }
];

// Conversões matemáticas exatas entre grandezas de mesma categoria física
export function getExactMathematicalFactor(fromUnit: string, toUnit: string): number | null {
  const f = fromUnit.toLowerCase();
  const t = toUnit.toLowerCase();

  if (f === t) return 1;

  // Peso
  if (f === 'kg' && t === 'grama') return 1000;
  if (f === 'kg' && t === 'g') return 1000;
  if ((f === 'grama' || f === 'g') && t === 'kg') return 0.001;

  // Comprimento
  if ((f === 'metro' || f === 'm') && (t === 'cm' || t === 'centimetro')) return 100;
  if ((f === 'metro' || f === 'm') && t === 'mm') return 1000;
  if ((f === 'cm' || f === 'centimetro') && (t === 'metro' || t === 'm')) return 0.01;

  // Volume
  if ((f === 'litro' || f === 'l') && (t === 'ml' || t === 'mililitro')) return 1000;
  if ((f === 'ml' || f === 'mililitro') && (t === 'litro' || t === 'l')) return 0.001;

  // Contagem padronizada
  if (f === 'cento' && (t === 'unidade' || t === 'unid')) return 100;
  if (f === 'milheiro' && (t === 'unidade' || t === 'unid')) return 1000;

  return null;
}

// -------------------------------------------------------------
// CÁLCULO DE CUSTO DE AQUISIÇÃO E CUSTO UNITÁRIO INTELIGENTE
// -------------------------------------------------------------
export interface AcquisitionCalculationParams {
  purchasePrice: number; // Preço bruto pago na embalagem
  freightCost?: number; // Frete atribuível
  discountCost?: number; // Descontos concedidos
  taxCost?: number; // Tributos não recuperáveis
  additionalExpenses?: number; // Despesas acessórias adicionais
  packageQty: number; // Quantidade de peças ou conteúdo utilizável
  packageWeightG?: number; // Peso total da embalagem em gramas
  purchaseUnit?: string;
  stockUnit?: string;
  consumptionUnit?: string;
}

export interface AcquisitionCalculationResult {
  totalAcquisitionCost: number; // Preço - Desc + Frete + Impostos + Despesas
  unitCost: number; // Custo por unidade utilizável de estoque
  costPerGram: number; // Custo por grama de insumo
  weightPerUnitG: number; // Peso unitário derivado
  usableStockQuantity: number; // Quantidade utilizável convertida para o estoque
}

export function calculateAcquisitionBreakdown(
  params: AcquisitionCalculationParams
): AcquisitionCalculationResult {
  const price = Math.max(0, params.purchasePrice || 0);
  const discounts = Math.max(0, params.discountCost || 0);
  const freight = Math.max(0, params.freightCost || 0);
  const taxes = Math.max(0, params.taxCost || 0);
  const additional = Math.max(0, params.additionalExpenses || 0);

  // Fórmula oficial: Preço − descontos + frete + tributos não recuperáveis + despesas atribuíveis
  const totalAcquisitionCost = Math.max(0, price - discounts + freight + taxes + additional);

  const packageQty = Math.max(0, params.packageQty || 0);
  const packageWeightG = Math.max(0, params.packageWeightG || 0);

  let unitCost = 0;
  let costPerGram = 0;
  let weightPerUnitG = 0;
  let usableStockQuantity = packageQty;

  if (packageQty > 0) {
    unitCost = totalAcquisitionCost / packageQty;
  }

  if (packageWeightG > 0) {
    costPerGram = totalAcquisitionCost / packageWeightG;
    if (packageQty > 0) {
      weightPerUnitG = packageWeightG / packageQty;
    }
  }

  // Se a unidade de estoque for gramas e tivermos peso informado
  if (params.stockUnit === 'grama' && packageWeightG > 0) {
    usableStockQuantity = packageWeightG;
    unitCost = costPerGram;
  }

  return {
    totalAcquisitionCost: Number(totalAcquisitionCost.toFixed(4)),
    unitCost: Number(unitCost.toFixed(4)),
    costPerGram: Number(costPerGram.toFixed(6)),
    weightPerUnitG: Number(weightPerUnitG.toFixed(4)),
    usableStockQuantity: Math.round(usableStockQuantity * 100) / 100
  };
}

// -------------------------------------------------------------
// EXEMPLO DO PROMPT & CÁLCULO DE CONSUMO COM PERDAS
// -------------------------------------------------------------
export interface ComponentCostSimulation {
  consumedQty: number; // Ex: 30 unidades
  unitCost: number; // Ex: R$ 0,025
  lossPercent: number; // Ex: 2%
  baseCost: number; // Ex: 30 * 0.025 = 0.75
  costWithLoss: number; // Ex: 30 * 1.02 * 0.025 = 0.765
}

export function calculateComponentCostWithLoss(
  consumedQty: number,
  unitCost: number,
  lossPercent: number = 0
): ComponentCostSimulation {
  const safeQty = Math.max(0, consumedQty || 0);
  const safeUnitCost = Math.max(0, unitCost || 0);
  const safeLoss = Math.max(0, lossPercent || 0);

  const baseCost = safeQty * safeUnitCost;
  const costWithLoss = safeQty * (1 + safeLoss / 100) * safeUnitCost;

  return {
    consumedQty: safeQty,
    unitCost: safeUnitCost,
    lossPercent: safeLoss,
    baseCost: Number(baseCost.toFixed(4)),
    costWithLoss: Number(costWithLoss.toFixed(4))
  };
}
