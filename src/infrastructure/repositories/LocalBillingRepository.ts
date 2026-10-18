import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { BillingInvoice, PaymentMethod } from '../../domain/types/auth';

const INVOICES_KEY = 'as_billing_invoices';
const PAYMENT_METHODS_KEY = 'as_payment_methods';

export class LocalBillingRepository implements IBillingRepository {
  async getInvoices(userId: string): Promise<BillingInvoice[]> {
    const raw = localStorage.getItem(INVOICES_KEY + '_' + userId);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Sanitize: filter out any obsolete test plans like 'Plano Profissional' or amount 119
        const sanitized = (parsed || []).filter((inv: any) => 
          inv && inv.planName && !inv.planName.includes('Profissional') && inv.amount !== 119
        );
        if (sanitized.length > 0) {
          return sanitized;
        }
      } catch { /* ignore */ }
    }

    // Default authentic invoice for the 30-day initial period of Plano Ateliê Sagrado
    const defaultInvoices: BillingInvoice[] = [
      {
        id: 'inv_' + Date.now(),
        number: `FAT-${new Date().getFullYear()}-001`,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 49.90,
        status: 'paid',
        planName: 'Plano Ateliê Sagrado (30 dias)',
        billingCycle: 'monthly'
      }
    ];

    localStorage.setItem(INVOICES_KEY + '_' + userId, JSON.stringify(defaultInvoices));
    return defaultInvoices;
  }

  async addInvoice(userId: string, invoice: BillingInvoice): Promise<BillingInvoice> {
    const invoices = await this.getInvoices(userId);
    const updated = [invoice, ...invoices];
    localStorage.setItem(INVOICES_KEY + '_' + userId, JSON.stringify(updated));
    return invoice;
  }

  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const raw = localStorage.getItem(PAYMENT_METHODS_KEY + '_' + userId);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Filter out any mock card with foreign holder name
        const sanitized = (parsed || []).filter((pm: any) => pm && pm.holderName !== 'ARTHUR SANTOS');
        return sanitized;
      } catch { /* ignore */ }
    }

    return [];
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
