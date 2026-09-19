/**
 * Automated Verification Suite for ERP Business Logic and Calculations
 * Tests edge cases: zero, negative, maximum discounts, decimals, high values,
 * null/undefined, cent-perfect installment splits, CMP, and margins.
 */

import {
  roundCurrency,
  roundQty,
  safeNumber,
  safeDiv,
  clamp,
  calculateItemTotal,
  calculateOrderTotals,
  calculateInstallments,
  calculateWeightedAverageCost,
  calculatePurchaseNeed,
  calculatePaymentMethodPricing,
  validateDiscount
} from '../src/utils/finance.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${testName} - ${detail || ''}`);
  }
}

console.log('\n--- 1. PRECISION & SANITIZATION TESTS ---');

assert(roundCurrency(0) === 0, 'Zero roundCurrency');
assert(roundCurrency(0.1 + 0.2) === 0.3, 'Floating point IEEE-754 precision (0.1 + 0.2 = 0.3)');
assert(roundCurrency(1.005) === 1.01, 'Midpoint rounding roundCurrency(1.005) === 1.01');
assert(roundCurrency(1234567.894) === 1234567.89, 'High value rounding');
assert(roundCurrency(NaN) === 0, 'NaN fallback to 0');
assert(roundCurrency(Infinity) === 0, 'Infinity fallback to 0');

assert(safeNumber(null, 10) === 10, 'safeNumber null with fallback');
assert(safeNumber(undefined, 5) === 5, 'safeNumber undefined with fallback');
assert(safeNumber('', 0) === 0, 'safeNumber empty string');
assert(safeNumber('123.45') === 123.45, 'safeNumber dot decimal string');
assert(safeNumber('123,45') === 123.45, 'safeNumber comma decimal string (pt-BR)');

assert(safeDiv(10, 0, 0) === 0, 'safeDiv division by zero guard');
assert(safeDiv(0, 0, 0) === 0, 'safeDiv 0 / 0');
assert(safeDiv(100, 4) === 25, 'safeDiv normal division');

assert(clamp(-5, 0, 100) === 0, 'clamp lower bound');
assert(clamp(150, 0, 100) === 100, 'clamp upper bound');
assert(clamp(50, 0, 100) === 50, 'clamp in-range');

console.log('\n--- 2. ORDER & QUOTE MATH (SUBTOTAL, DISCOUNT, FREIGHT, ADDITION) ---');

// Case: Zero values
const zeroOrder = calculateOrderTotals({ items: [], discount: 0, shipping: 0 });
assert(zeroOrder.subtotal === 0 && zeroOrder.total === 0, 'Empty items order has zero subtotal & total');

// Case: Normal order
const normalOrder = calculateOrderTotals({
  items: [
    { quantity: 2, price: 50 },
    { quantity: 3, price: 33.33 }
  ],
  discount: 10,
  shipping: 20
});
// Subtotal = (2 * 50) + (3 * 33.33) = 100 + 99.99 = 199.99
// Total = 199.99 - 10 + 20 = 209.99
assert(normalOrder.subtotal === 199.99, 'Subtotal decimal precision (199.99)');
assert(normalOrder.total === 209.99, 'Total with discount and shipping (209.99)');

// Case: Discount zero
const discountZero = calculateOrderTotals({
  items: [{ quantity: 1, price: 100 }],
  discount: 0
});
assert(discountZero.total === 100, 'Discount zero produces full total');

// Case: Discount equals subtotal (100% discount)
const discountMax = calculateOrderTotals({
  items: [{ quantity: 1, price: 100 }],
  discount: 100
});
assert(discountMax.total === 0 && discountMax.discount === 100, 'Maximum valid discount brings total to 0');

// Case: Discount exceeding subtotal (Invalid discount clamped)
const discountExcessive = calculateOrderTotals({
  items: [{ quantity: 1, price: 100 }],
  discount: 150
});
assert(discountExcessive.total === 0 && discountExcessive.discount === 100, 'Excessive discount is clamped to subtotal (cannot be negative)');

// Case: Negative discount input
const discountNegative = calculateOrderTotals({
  items: [{ quantity: 1, price: 100 }],
  discount: -25
});
assert(discountNegative.discount === 0 && discountNegative.total === 100, 'Negative discount is ignored and clamped to 0');

// Case: Negative shipping input
const shippingNegative = calculateOrderTotals({
  items: [{ quantity: 1, price: 100 }],
  shipping: -50
});
assert(shippingNegative.shipping === 0 && shippingNegative.total === 100, 'Negative shipping is clamped to 0');

// Validation helper test
const valResOk = validateDiscount(200, 50);
assert(valResOk.isValid && valResOk.value === 50, 'validateDiscount valid discount');
const valResOver = validateDiscount(100, 120);
assert(!valResOver.isValid && valResOver.value === 100, 'validateDiscount over subtotal fails');

console.log('\n--- 3. INSTALLMENT (PARCELAMENTO) CENT-PERFECT ENGINE ---');

// Case: R$ 100 in 3 installments -> 33.34 + 33.33 + 33.33 = 100.00
const split3 = calculateInstallments(100, 3);
assert(split3.length === 3, '3 installments created');
assert(split3[0].value === 33.34, 'First installment receives remainder cent (33.34)');
assert(split3[1].value === 33.33, 'Second installment (33.33)');
assert(split3[2].value === 33.33, 'Third installment (33.33)');
const sum3 = roundCurrency(split3.reduce((s, i) => s + i.value, 0));
assert(sum3 === 100.00, `Sum of 3 installments equals exactly 100.00 (got ${sum3})`);

// Case: R$ 100 in 6 installments -> 100 / 6 = 16.6666...
// 10000 cents / 6 = 1666 cents each, remainder 4 cents
// First 4 installments get 16.67, remaining 2 get 16.66
const split6 = calculateInstallments(100, 6);
const sum6 = roundCurrency(split6.reduce((s, i) => s + i.value, 0));
assert(sum6 === 100.00, `Sum of 6 installments equals exactly 100.00 (got ${sum6})`);
assert(split6[0].value === 16.67 && split6[5].value === 16.66, 'Remainder cents distributed onto earlier installments');

// Case: R$ 100 in 1 installment
const split1 = calculateInstallments(100, 1);
assert(split1.length === 1 && split1[0].value === 100, 'Single installment equals total');

// Case: Zero amount
const splitZero = calculateInstallments(0, 3);
assert(splitZero.reduce((s, i) => s + i.value, 0) === 0, 'Zero amount produces zero installments');

console.log('\n--- 4. INVENTORY & WEIGHTED AVERAGE COST (CMP) ---');

// Case: 10 units @ R$ 2.00 + 10 units @ R$ 4.00 -> 20 units @ R$ 3.00
const cmp1 = calculateWeightedAverageCost(10, 2.00, 10, 4.00);
assert(cmp1 === 3.00, `Weighted average cost: (10*2 + 10*4)/20 = 3.00 (got ${cmp1})`);

// Case: 0 existing stock + 5 incoming @ R$ 15.50
const cmpInitial = calculateWeightedAverageCost(0, 0, 5, 15.50);
assert(cmpInitial === 15.50, `Initial purchase average cost: 15.50 (got ${cmpInitial})`);

// Case: Stock deficit (MRP)
const deficit1 = calculatePurchaseNeed(10, 5, 20, 2.50);
// Target = 20 (required) + 5 (min) = 25. Available = 10. Shortfall = 15.
assert(deficit1.shortfall === 15, `Shortfall calculated: 15 units (got ${deficit1.shortfall})`);
assert(deficit1.totalCost === 37.50, `Shortfall total cost: 15 * 2.50 = 37.50 (got ${deficit1.totalCost})`);
assert(deficit1.status === 'critical', 'Deficit status is critical when available < required');

console.log('\n--- 5. PRICING & PAYMENT METHOD MARGINS ---');

// Case: Selling price R$ 100, manufacturing cost R$ 50, Marketplace fee 18%
// Intermediary fee is on SELLING price: 100 * 0.18 = 18.00
// Cost with fee: 50 + 18 = 68.00
// Net profit: 100 - 68 = 32.00
// Net margin: 32 / 100 = 32%
const pricingMkt = calculatePaymentMethodPricing(100, 50, 18, 100);
assert(pricingMkt.feeAmount === 18.00, `Marketplace fee on R$ 100 is R$ 18.00 (got ${pricingMkt.feeAmount})`);
assert(pricingMkt.totalCostWithFee === 68.00, `Total cost with fee is R$ 68.00 (got ${pricingMkt.totalCostWithFee})`);
assert(pricingMkt.netProfit === 32.00, `Net profit is R$ 32.00 (got ${pricingMkt.netProfit})`);
assert(pricingMkt.marginPercent === 32.00, `Net margin is 32% (got ${pricingMkt.marginPercent}%)`);

// Case: Auto pass-on fees
// Base price R$ 100, fee 10%. Passed on price = 100 / (1 - 0.1) = 111.11
const pricingPass = calculatePaymentMethodPricing(100, 50, 10, undefined, true);
assert(pricingPass.finalPrice === 111.11, `Passed on price is R$ 111.11 (got ${pricingPass.finalPrice})`);
// Fee = 111.11 * 0.1 = 11.11. Net revenue = 100.00. Cost = 50.00. Net profit = 50.00!
assert(pricingPass.netProfit === 50.00, `Net profit is preserved at R$ 50.00 (got ${pricingPass.netProfit})`);

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
