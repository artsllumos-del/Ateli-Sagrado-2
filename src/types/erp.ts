export type ClientType = 'PF' | 'PJ';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  document?: string; // CNPJ / CPF
  razaoSocial?: string;
  nomeFantasia?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  planId?: 'free_trial' | 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'trial' | 'suspended';
  ownerId?: string;
  createdAt: string;
  settings?: SystemSettings;
}

export interface ClientAddress {
  id: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isMain: boolean;
  label?: string;
}

export interface Client {
  id: string;
  tenantId?: string;
  type: ClientType;
  name: string; // Used for PF Name or PJ Razão Social
  cpf?: string;
  cnpj?: string;
  email: string;
  phone: string;
  whatsapp: string;
  nomeFantasia?: string;
  responsavel?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  isDeleted?: boolean;
  createdAt: string;
  addresses?: ClientAddress[];
}

export type CalcMethod = 'fixed' | 'weight';
export type InventoryStatus = 'active' | 'inactive';

export interface InventoryItem {
 id: string;
 tenantId?: string;
 name: string;
 category: string;
 code: string;
 description: string;
 supplier: string;
 unit: string; // e.g. 'unidade', 'grama', 'pacote'
 weightG: number; // weight in grams per unit
 quantity: number;
 minQuantity: number;
 unitValue: number;
 calcMethod: CalcMethod;
 notes: string;
 status: InventoryStatus;
 isDeleted?: boolean;
 createdAt: string;
 reserved?: number;
 available?: number;
 imageUrl?: string;
}

export interface ProductMaterialComposition {
 materialId: string;
 quantity: number; // Quantity of inventory item used
 cost: number; // Calculated cost based on quantity and material unitValue/weight
}

export interface ProductPaymentVariation {
  methodId: string;
  methodLabel: string;
  feePercent: number;
  price: number;
  taxCost: number;
  totalCostWithTax: number;
  profit: number;
  marginPercent: number;
}

export type ProductStatus = 'active' | 'inactive';

export interface Product {
 id: string;
 tenantId?: string;
 name: string;
 category: string;
 sku: string;
 description: string;
 image: string;
 productionTimeMin: number;
 finalWeightG: number;
 sellingPrice: number;
 composition: ProductMaterialComposition[];
 
 // Detailed Cost breakdown parameters
 lossPercent?: number; // % perda (ex: 5%)
 laborHourlyRate?: number; // R$/hora (ex: R$ 30,00/h)
 costEmbalagem?: number; // R$ Embalagem
 costEnergia?: number; // R$ Energia
 costFerramentas?: number; // R$ Ferramentas
 costOperacional?: number; // R$ Operacional
 targetMarginPercent?: number; // % Margem desejada (ex: 50%)
 
 // Payment method variations (Pix, Cartão 1x, Cartão 12x, Marketplace)
 paymentVariations?: ProductPaymentVariation[];

 status: ProductStatus;
 isDeleted?: boolean;
 createdAt: string;
}

export type QuoteStatus = 'analysis' | 'pending' | 'approved' | 'rejected' | 'converted';

export interface QuoteItem {
 productId: string;
 productName: string;
 quantity: number;
 unitPrice: number;
 total: number;
}

export interface DocumentSnapshot {
  companyName: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  primaryColor: string;
  laborHourlyRate: number;
  indirectCosts: number;
}

export interface Quote {
 id: string;
 tenantId?: string;
 clientId: string;
 clientName: string;
 items: QuoteItem[];
 subtotal: number;
 discount: number;
 shipping: number;
 total: number;
 status: QuoteStatus;
 date: string;
 isDeleted?: boolean;
 createdAt: string;
 snapshot?: DocumentSnapshot;
}

export type OrderStatus = 'received' | 'approved' | 'production' | 'finishing' | 'packing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItem {
 productId: string;
 productName: string;
 quantity: number;
 price: number;
 total: number;
}

export interface OrderTimelineEvent {
 id: string;
 date: string;
 description: string;
 user: string;
}

export interface Order {
 id: string;
 tenantId?: string;
 orderNumber: string;
 clientId: string;
 clientName: string;
 items: OrderItem[];
 totalValue: number;
 date: string;
 dueDate: string;
 status: OrderStatus;
 productionProgress: number; // 0 to 100
 timeline: OrderTimelineEvent[];
 isDeleted?: boolean;
 createdAt: string;
 responsible?: string;
 priority?: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
 snapshot?: DocumentSnapshot;
 archivedAt?: string;
 isArchived?: boolean;
 isCancelled?: boolean;
}

export type ProductionStatus = 'todo' | 'producing' | 'finishing' | 'done';

export interface ProductionTask {
 id: string;
 tenantId?: string;
 orderId: string;
 orderNumber: string;
 productId: string;
 productName: string;
 status: ProductionStatus;
 responsible: string;
 startDate: string | null;
 endDate: string | null;
 timeSpentMinutes: number;
 totalEstimatedMinutes: number;
 createdAt: string;
}

export type TransactionType = 'income' | 'expense';

export type FinancialStatus = 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
export type ReceivableStatus = 'pending' | 'received' | 'partially_received' | 'overdue' | 'cancelled';

export interface AccountPayable {
  id: string;
  tenantId?: string;
  description: string;
  supplierName: string;
  supplierId?: string;
  category: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  installmentNumber: number;
  totalInstallments: number;
  status: FinancialStatus;
  barcode?: string;
  pixKey?: string;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  reconciled?: boolean;
  createdAt: string;
}

export interface AccountReceivable {
  id: string;
  tenantId?: string;
  description: string;
  clientName: string;
  clientId?: string;
  orderId?: string;
  orderNumber?: string;
  category: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  receivedAmount: number;
  installmentNumber: number;
  totalInstallments: number;
  status: ReceivableStatus;
  paymentMethod?: string;
  receiptDate?: string;
  paymentLink?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  barcode?: string;
  notes?: string;
  reconciled?: boolean;
  createdAt: string;
}

export interface OnlinePaymentCharge {
  id: string;
  tenantId?: string;
  receivableId?: string;
  orderId?: string;
  customerName: string;
  customerDocument?: string;
  amount: number;
  method: 'pix' | 'credit_card' | 'bank_slip';
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  pixQrCodeBase64?: string;
  pixCopyPaste?: string;
  bankSlipBarcode?: string;
  bankSlipUrl?: string;
  creditCardBrand?: string;
  creditCardLast4?: string;
  installments?: number;
  gatewayName: 'asaas' | 'mercadopago' | 'pix_bacen';
  idempotencyKey: string;
  paidAt?: string;
  refundedAt?: string;
  refundReason?: string;
  webhookReceivedAt?: string;
  createdAt: string;
}

export interface OnlinePaymentConfig {
  enabled: boolean;
  gateway: 'asaas' | 'mercadopago' | 'pix_bacen';
  apiKey?: string;
  webhookSecret?: string;
  pixKey: string;
  autoReconcile: boolean;
  sandbox: boolean;
}

export interface FinancialTransaction {
 id: string;
 tenantId?: string;
 type: TransactionType;
 category: string;
 contactName: string; // client name or supplier name
 value: number;
 date: string;
 paymentMethod: string;
 notes?: string;
 isDeleted?: boolean;
 createdAt: string;
 reconciled?: boolean;
 reconciledToId?: string;
 reconciledToType?: 'order' | 'purchase' | 'payable' | 'receivable' | 'manual';
 reconciledToNumber?: string;
 payableId?: string;
 receivableId?: string;
 chargeId?: string;
}

export interface SystemSettings {
 tenantId?: string;
 // Dados Institucionais
 companyName: string;
 logo: string;
 slogan: string;
 razaoSocial: string;
 nomeFantasia: string;
 cnpj: string;
 inscricaoEstadual: string;
 address: string;
 phone: string;
 whatsapp: string;
 email: string;
 website: string;
 socialMedia: string;
 favicon: string;
 institutionalPhoto?: string;
 firstSetup?: boolean;

 // Perfil do Usuário
 userPhoto: string;
 userName: string;
 userRole: string;
 userEmail: string;
 userPhone: string;
 userPassword?: string;
 userLanguage: string;
 userTimezone: string;

 // Motor Financeiro
 laborHourlyRate: number;
 indirectCosts: number;
 defaultMarginPercent: number;
 minMarginPercent: number;
 idealMarginPercent: number;
 taxPercent: number;
 commissionPercent: number;
 defaultDiscountPercent: number;

 // Interface e Preferências
 theme: 'light' | 'dark';
 primaryColor: string;
 cardStyle: string;
 borderRadius: string;
 shadowStyle: string;
 density: 'compact' | 'normal' | 'relaxed';
 typography: string;
 dashboardLayout: string;

 // Documentos Emitidos
 docLogo: string;
 docHeader: string;
 docFooter: string;
 docFinalMessage: string;
 docSignature: string;
 docNotes: string;

 // Outros Sugeridos
 backupFrequency: 'daily' | 'weekly' | 'monthly' | 'manual';
 currencyFormat: string;
 dateFormat: string;
 autoNumberingPattern: string;
 notificationsEnabled: boolean;
}

export interface AppUser {
  id: string;
  tenantId: string;
  isOwner?: boolean;
  username: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: string;
  roleLabel?: string;
  isActive: boolean;
  photoUrl?: string;
  createdAt?: string;
  lastLoginAt?: string;
  permissions: {
    dashboard: boolean;
    inventory: boolean;
    purchases: boolean;
    products: boolean;
    pricing: boolean;
    clients: boolean;
    quotes: boolean;
    orders: boolean;
    production: boolean;
    financial: boolean;
    settings: boolean;
    subscription?: boolean;
    users?: boolean;
  };
}

export interface SystemNotification {
 id: string;
 tenantId?: string;
 title: string;
 message: string;
 type: 'low_stock' | 'critical_stock' | 'delayed_order' | 'info' | 'success';
 date: string;
 read: boolean;
 isDeleted?: boolean;
}

export interface AgendaActivity {
  id: string;
  tenantId?: string;
  time: string; // e.g. "14:00"
  date: string; // e.g. "YYYY-MM-DD"
  title: string;
  type: 'delivery' | 'meeting' | 'purchase' | 'production' | 'system' | 'manual';
  status: 'Pendente' | 'Concluída';
  completedAt?: string; // date and time of completion (e.g., "30/06/2026 14:05")
  createdAt: string;
}

export interface AuditLog {
  id: string;
  tenantId?: string;
  timestamp: string; // ISO date-time
  user: string;
  action: string;
  module: string; // e.g. 'agenda', 'clients', 'orders', 'financial', etc.
}

export interface ReceiptOcrItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface ReceiptOcrData {
  vendorName: string;
  date: string;
  totalAmount: number;
  category: 'materiais' | 'embalagens' | 'ferramentas' | 'indireto' | string;
  items: ReceiptOcrItem[];
}

