/**
 * FINANCE & BUSINESS LOGIC ENGINE
 * Centralized, battle-tested financial mathematics, rounding, validations and DRE/KPI calculations.
 * 
 * Rules:
 * - Strategy: Cent-perfect 2-decimal rounding with Math.round((n + Number.EPSILON) * 100) / 100
 * - Division-by-zero guards on all percentage and ratio calculations
 * - Strict non-negative constraints on prices, quantities, costs, shipping and discounts
 * - Discount cannot exceed subtotal
 * - Payment fees apply to the gross selling price, not raw manufacturing cost
 * - Installment split distributes remainder cents to avoid any lost pennies
 */

/**
 * Rounds a monetary number to exactly 2 decimal places with EPSILON protection against IEEE-754 precision issues.
 */
export function roundCurrency(value: number): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Rounds a quantity to a specified number of decimal places (default 2 for units/pieces, up to 4 for kg/m).
 */
export function roundQty(value: number, decimals: number = 2): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Safely sanitizes any value into a finite number.
 */
export function safeNumber(value: any, fallback: number = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  return isNaN(num) || !isFinite(num) ? fallback : num;
}

/**
 * Performs division with a zero and NaN guard.
 */
export function safeDiv(numerator: number, denominator: number, fallback: number = 0): number {
  const num = safeNumber(numerator, 0);
  const den = safeNumber(denominator, 0);
  if (den === 0 || isNaN(den) || !isFinite(den)) return fallback;
  const res = num / den;
  return isNaN(res) || !isFinite(res) ? fallback : res;
}

/**
 * Clamps a number between a minimum and maximum boundary.
 */
export function clamp(value: number, min: number, max: number): number {
  const num = safeNumber(value, min);
  return Math.max(min, Math.min(max, num));
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export interface ValidationResult<T> {
  isValid: boolean;
  value: T;
  error?: string;
}

export function validatePositiveNumber(value: any, fieldName: string, allowZero: boolean = true): ValidationResult<number> {
  const num = safeNumber(value, -1);
  if (allowZero ? num < 0 : num <= 0) {
    return {
      isValid: false,
      value: allowZero ? 0 : 1,
      error: `${fieldName} deve ser ${allowZero ? 'maior ou igual a zero' : 'maior que zero'}.`
    };
  }
  return { isValid: true, value: num };
}

export function validateDiscount(subtotal: number, discountInput: any): ValidationResult<number> {
  const safeSubtotal = Math.max(0, safeNumber(subtotal, 0));
  const rawDiscount = safeNumber(discountInput, 0);

  if (rawDiscount < 0) {
    return {
      isValid: false,
      value: 0,
      error: 'O desconto não pode ser um valor negativo.'
    };
  }

  if (rawDiscount > safeSubtotal) {
    return {
      isValid: false,
      value: safeSubtotal,
      error: `O desconto (R$ ${rawDiscount.toFixed(2)}) não pode ser superior ao subtotal (R$ ${safeSubtotal.toFixed(2)}).`
    };
  }

  return { isValid: true, value: roundCurrency(rawDiscount) };
}

// ============================================================================
// ORDERS & QUOTES CALCULATIONS
// ============================================================================

export interface CalculatedOrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  addition: number;
  total: number;
}

/**
 * Calculates line item total with monetary rounding.
 */
export function calculateItemTotal(quantity: number, price: number): number {
  const safeQuantity = Math.max(0, safeNumber(quantity, 0));
  const safePrice = Math.max(0, safeNumber(price, 0));
  return roundCurrency(safeQuantity * safePrice);
}

/**
 * Calculates complete order/quote totals.
 * Flow:
 * ENTRADA (items, discount, shipping, addition)
 * ↓
 * VALIDAÇÃO (clamping >= 0, discount <= subtotal)
 * ↓
 * REGRA: subtotal = sum(item.total); total = max(0, subtotal - discount + shipping + addition)
 * ↓
 * RESULTADO (2-decimal rounded)
 */
export function calculateOrderTotals(params: {
  items: Array<{ quantity: number; price?: number; unitPrice?: number; total?: number }>;
  discount?: number;
  shipping?: number;
  addition?: number;
}): CalculatedOrderTotals {
  let subtotal = 0;
  for (const item of (params.items || [])) {
    const qty = Math.max(0, safeNumber(item.quantity, 0));
    const price = Math.max(0, safeNumber(item.price ?? item.unitPrice, 0));
    subtotal += calculateItemTotal(qty, price);
  }
  subtotal = roundCurrency(subtotal);

  const safeShipping = roundCurrency(Math.max(0, safeNumber(params.shipping, 0)));
  const safeAddition = roundCurrency(Math.max(0, safeNumber(params.addition, 0)));

  // Validate discount: 0 <= discount <= subtotal
  const rawDiscount = safeNumber(params.discount, 0);
  const safeDiscount = roundCurrency(Math.max(0, Math.min(subtotal, rawDiscount)));

  const total = roundCurrency(Math.max(0, subtotal - safeDiscount + safeShipping + safeAddition));

  return {
    subtotal,
    discount: safeDiscount,
    shipping: safeShipping,
    addition: safeAddition,
    total
  };
}

// ============================================================================
// INSTALLMENTS (PARCELAMENTO) ENGINE
// ============================================================================

export interface Installment {
  installmentNumber: number;
  value: number;
  dueDate: string;
}

/**
 * Breaks down a total amount into N installments with cent-perfect precision.
 * Distributes remainder cents onto earlier installments so that sum(installments) === total exactly.
 */
export function calculateInstallments(
  totalAmount: number,
  installmentCount: number,
  startDateStr?: string,
  intervalDays: number = 30
): Installment[] {
  const safeTotal = roundCurrency(Math.max(0, safeNumber(totalAmount, 0)));
  const count = Math.max(1, Math.min(36, Math.floor(safeNumber(installmentCount, 1))));

  if (count === 1) {
    const baseDate = startDateStr ? new Date(startDateStr + 'T12:00:00') : new Date();
    return [{
      installmentNumber: 1,
      value: safeTotal,
      dueDate: baseDate.toISOString().split('T')[0]
    }];
  }

  // Integer cents math to avoid any floating-point drift
  const totalCents = Math.round(safeTotal * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainderCents = totalCents % count;

  const baseDate = startDateStr ? new Date(startDateStr + 'T12:00:00') : new Date();
  const installments: Installment[] = [];

  for (let i = 0; i < count; i++) {
    // Distribute 1 extra cent to the first remainderCents installments
    const itemCents = baseCents + (i < remainderCents ? 1 : 0);
    const itemDate = new Date(baseDate);
    itemDate.setDate(baseDate.getDate() + (i * intervalDays));

    installments.push({
      installmentNumber: i + 1,
      value: itemCents / 100,
      dueDate: itemDate.toISOString().split('T')[0]
    });
  }

  return installments;
}

// ============================================================================
// INVENTORY & STOCK VALUATION ENGINE
// ============================================================================

/**
 * Calculates new Weighted Average Cost (Custo Médio Ponderado - CMP) when adding stock.
 * Formula: ((currentQty * currentUnitValue) + (incomingQty * incomingUnitValue)) / (currentQty + incomingQty)
 */
export function calculateWeightedAverageCost(
  currentQty: number,
  currentUnitValue: number,
  incomingQty: number,
  incomingUnitValue: number
): number {
  const cQty = Math.max(0, safeNumber(currentQty, 0));
  const cVal = Math.max(0, safeNumber(currentUnitValue, 0));
  const inQty = Math.max(0, safeNumber(incomingQty, 0));
  const inVal = Math.max(0, safeNumber(incomingUnitValue, 0));

  const totalQty = cQty + inQty;
  if (totalQty <= 0) return inVal > 0 ? inVal : cVal;

  const currentTotalCost = cQty * cVal;
  const incomingTotalCost = inQty * inVal;
  const newAverage = (currentTotalCost + incomingTotalCost) / totalQty;

  return roundCurrency(newAverage);
}

/**
 * Calculates stock balance and required purchase quantity (MRP).
 */
export function calculatePurchaseNeed(
  stockAvailable: number,
  minStock: number,
  requiredByOrders: number,
  unitValue: number
): {
  shortfall: number;
  totalCost: number;
  status: 'ok' | 'low' | 'critical';
} {
  const available = Math.max(0, safeNumber(stockAvailable, 0));
  const min = Math.max(0, safeNumber(minStock, 0));
  const required = Math.max(0, safeNumber(requiredByOrders, 0));
  const cost = Math.max(0, safeNumber(unitValue, 0));

  // The deficit occurs when available stock does not cover current order needs + safety min stock
  const targetStock = required + min;
  const shortfall = Math.max(0, targetStock - available);
  const roundedShortfall = roundQty(shortfall, 2);
  const totalCost = roundCurrency(roundedShortfall * cost);

  let status: 'ok' | 'low' | 'critical' = 'ok';
  if (available < required) {
    status = 'critical';
  } else if (available <= min) {
    status = 'low';
  }

  return {
    shortfall: roundedShortfall,
    totalCost,
    status
  };
}

// ============================================================================
// PRODUCT PRICING & PAYMENT METHOD MARGINS
// ============================================================================

export interface PaymentMethodPricingResult {
  methodId: string;
  methodLabel: string;
  feePercent: number;
  feeAmount: number;
  finalPrice: number;
  totalCostWithFee: number;
  netProfit: number;
  marginPercent: number;
}

/**
 * Calculates the accurate price, intermediary fee, and net profit for a payment method.
 * Rule: The payment processor fee (Pix, Credit Card, Shopee/Mercado Livre) is deducted
 * from the GROSS SELLING PRICE received from the customer, NOT from the raw production cost!
 */
export function calculatePaymentMethodPricing(
  baseSellingPrice: number,
  totalBaseCost: number,
  feePercent: number,
  customPrice?: number,
  autoPassOnFees: boolean = true
): PaymentMethodPricingResult {
  const basePrice = Math.max(0, safeNumber(baseSellingPrice, 0));
  const baseCost = Math.max(0, safeNumber(totalBaseCost, 0));
  const feePct = clamp(safeNumber(feePercent, 0), 0, 99.9);
  const feeFrac = feePct / 100;

  let finalPrice = basePrice;
  const custom = safeNumber(customPrice, 0);

  if (custom > 0) {
    finalPrice = custom;
  } else if (autoPassOnFees && feeFrac > 0 && basePrice > 0) {
    // To preserve the original net margin, pass on the fee: Price = Base / (1 - feeFrac)
    finalPrice = basePrice / (1 - feeFrac);
  }

  finalPrice = roundCurrency(finalPrice);
  const feeAmount = roundCurrency(finalPrice * feeFrac);
  const totalCostWithFee = roundCurrency(baseCost + feeAmount);
  const netProfit = roundCurrency(finalPrice - totalCostWithFee);
  const marginPercent = finalPrice > 0 ? roundCurrency(safeDiv(netProfit, finalPrice) * 100) : 0;

  return {
    methodId: '',
    methodLabel: '',
    feePercent: feePct,
    feeAmount,
    finalPrice,
    totalCostWithFee,
    netProfit,
    marginPercent
  };
}
