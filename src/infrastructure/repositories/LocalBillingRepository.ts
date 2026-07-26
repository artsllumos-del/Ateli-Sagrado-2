import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { BillingInvoice, PaymentMethod } from '../../domain/types/auth';

const INVOICES_KEY = 'as_billing_invoices';
const PAYMENT_METHODS_KEY = 'as_payment_methods';

export class LocalBillingRepository implements IBillingRepository {
  async getInvoices(userId: string): Promise<BillingInvoice[]> {
    const raw = localStorage.getItem(INVOICES_KEY + '_' + userId);
    if (raw) {
      try { return JSON.parse(raw); } catch { /* ignore */ }
    }

    const defaultInvoices: BillingInvoice[] = [
      {
        id: 'inv_2026_01',
        number: 'FAT-2026-001',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 119.00,
        status: 'paid',
        planName: 'Plano Profissional',
        billingCycle: 'monthly'
      },
      {
        id: 'inv_2025_12',
        number: 'FAT-2025-089',
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 119.00,
        status: 'paid',
        planName: 'Plano Profissional',
        billingCycle: 'monthly'
      }
    ];

    localStorage.setItem(INVOICES_KEY + '_' + userId, JSON.stringify(defaultInvoices));
    return defaultInvoices;
  }

  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const raw = localStorage.getItem(PAYMENT_METHODS_KEY + '_' + userId);
    if (raw) {
      try { return JSON.parse(raw); } catch { /* ignore */ }
    }

    const defaultMethods: PaymentMethod[] = [
      {
        id: 'pm_card_1',
        type: 'credit_card',
        last4: '4242',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2028,
        isDefault: true,
        holderName: 'ARTHUR SANTOS'
      },
      {
        id: 'pm_pix_1',
        type: 'pix',
        isDefault: false
      }
    ];

    localStorage.setItem(PAYMENT_METHODS_KEY + '_' + userId, JSON.stringify(defaultMethods));
    return defaultMethods;
  }

  async addPaymentMethod(userId: string, method: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> {
    const methods = await this.getPaymentMethods(userId);
    const newMethod: PaymentMethod = {
      ...method,
      id: 'pm_' + Date.now()
    };
    if (method.isDefault) {
      methods.forEach(m => m.isDefault = false);
    }
    methods.push(newMethod);
    localStorage.setItem(PAYMENT_METHODS_KEY + '_' + userId, JSON.stringify(methods));
    return newMethod;
  }

  async removePaymentMethod(userId: string, methodId: string): Promise<boolean> {
    const methods = await this.getPaymentMethods(userId);
    const filtered = methods.filter(m => m.id !== methodId);
    localStorage.setItem(PAYMENT_METHODS_KEY + '_' + userId, JSON.stringify(filtered));
    return true;
  }

  async setDefaultPaymentMethod(userId: string, methodId: string): Promise<boolean> {
    const methods = await this.getPaymentMethods(userId);
    methods.forEach(m => m.isDefault = (m.id === methodId));
    localStorage.setItem(PAYMENT_METHODS_KEY + '_' + userId, JSON.stringify(methods));
    return true;
  }

  async downloadInvoicePdf(invoiceId: string): Promise<string> {
    return `fatura_${invoiceId}.pdf`;
  }
}
