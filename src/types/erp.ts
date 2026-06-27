export type ClientType = 'PF' | 'PJ';

export interface Client {
 id: string;
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
}

export type CalcMethod = 'fixed' | 'weight';
export type InventoryStatus = 'active' | 'inactive';

export interface InventoryItem {
 id: string;
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
}

export interface ProductMaterialComposition {
 materialId: string;
 quantity: number; // Quantity of inventory item used
 cost: number; // Calculated cost based on quantity and material unitValue/weight
}

export type ProductStatus = 'active' | 'inactive';

export interface Product {
 id: string;
 name: string;
 category: string;
 sku: string;
 description: string;
 image: string;
 productionTimeMin: number;
 finalWeightG: number;
 sellingPrice: number;
 composition: ProductMaterialComposition[];
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

export interface Quote {
 id: string;
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
}

export type OrderStatus = 'received' | 'approved' | 'production' | 'finishing' | 'completed' | 'shipped' | 'delivered';

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
}

export type ProductionStatus = 'todo' | 'producing' | 'finishing' | 'done';

export interface ProductionTask {
 id: string;
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

export interface FinancialTransaction {
 id: string;
 type: TransactionType;
 category: string;
 contactName: string; // client name or supplier name
 value: number;
 date: string;
 paymentMethod: string;
 notes?: string;
 isDeleted?: boolean;
 createdAt: string;
}

export interface SystemSettings {
 companyName: string;
 logo: string;
 cnpj: string;
 phone: string;
 address: string;
 defaultMarginPercent: number; // e.g. 50%
 indirectCosts: number; // flat rate added or percent
 laborHourlyRate: number; // BRL per hour
 theme: 'light' | 'dark';
 language: 'pt-BR' | 'en';
 notificationsEnabled: boolean;
}

export interface SystemNotification {
 id: string;
 title: string;
 message: string;
 type: 'low_stock' | 'critical_stock' | 'delayed_order' | 'info' | 'success';
 date: string;
 read: boolean;
 isDeleted?: boolean;
}

