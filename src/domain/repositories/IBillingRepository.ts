import { BillingInvoice, PaymentMethod } from '../types/auth';

export interface IBillingRepository {
  getInvoices(userId: string): Promise<BillingInvoice[]>;
  getPaymentMethods(userId: string): Promise<PaymentMethod[]>;
  addPaymentMethod(userId: string, method: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod>;
  removePaymentMethod(userId: string, methodId: string): Promise<boolean>;
  setDefaultPaymentMethod(userId: string, methodId: string): Promise<boolean>;
  downloadInvoicePdf(invoiceId: string): Promise<string>;
}
