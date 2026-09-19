import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { applyThemeColors } from '../utils/theme';
import { 
 Tenant,
 Client, 
 InventoryItem, 
 Product, 
 Quote, 
 Order, 
 ProductionTask, 
 FinancialTransaction, 
 SystemSettings,
 QuoteStatus,
 OrderStatus,
 ProductionStatus,
 OrderTimelineEvent,
 SystemNotification,
 AppUser,
 DocumentSnapshot,
 AgendaActivity,
 AuditLog,
 ReceiptOcrData,
 AccountPayable,
 AccountReceivable,
 OnlinePaymentCharge,
 OnlinePaymentConfig
} from '../types/erp';
import { roundCurrency, roundQty, safeNumber, calculateWeightedAverageCost, calculateOrderTotals } from '../utils/finance';

 interface DbContextType {
 // Multi-Tenant Core
 tenants: Tenant[];
 currentTenant: Tenant;
 switchTenant: (tenantId: string) => void;
 createTenant: (tenant: Omit<Tenant, 'id' | 'createdAt'>) => Promise<Tenant>;
 updateTenant: (id: string, tenant: Partial<Tenant>) => Promise<Tenant>;
 deleteTenant: (id: string) => Promise<boolean>;

 clients: Client[];
 inventory: InventoryItem[];
 products: Product[];
 quotes: Quote[];
 orders: Order[];
 productionTasks: ProductionTask[];
 transactions: FinancialTransaction[];
 settings: SystemSettings;
 notifications: SystemNotification[];
 
 // Auth simulation
 user: AppUser | null;
 users: AppUser[];
 login: (usernameOrEmail: string, password: string) => boolean;
 logout: () => void;
 recoverPassword: (email: string) => boolean;

 // User CRUD Methods
 addUser: (user: Omit<AppUser, 'id'>) => void;
 updateUser: (id: string, user: Partial<AppUser>) => void;
 deleteUser: (id: string) => void;

 // CRUD Methods
 addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
 updateClient: (id: string, client: Partial<Client>) => void;
 deleteClient: (id: string) => void;

 addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => void;
 updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
 deleteInventoryItem: (id: string) => void;
 adjustStock: (id: string, amount: number, notes: string, category: string, contactName: string) => void;

 addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
 updateProduct: (id: string, product: Partial<Product>) => void;
 deleteProduct: (id: string) => void;

 addQuote: (quote: Omit<Quote, 'id' | 'createdAt'>) => void;
 updateQuote: (id: string, quote: Partial<Quote>) => void;
 deleteQuote: (id: string) => void;
 duplicateQuote: (id: string) => void;
 convertToOrder: (id: string) => { success: boolean; error?: string; missingMaterials?: { name: string; required: number; available: number; unit: string }[] };

 addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'orderNumber' | 'timeline'>) => { success: boolean; error?: string; missingMaterials?: { name: string; required: number; available: number; unit: string }[] };
 updateOrder: (id: string, order: Partial<Order>) => void;
 deleteOrder: (id: string) => void;
 cancelOrder: (id: string) => void;
 addOrderTimeline: (id: string, description: string) => void;

 updateProductionTask: (id: string, task: Partial<ProductionTask>) => void;
 
 addTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'createdAt'>) => void;
 updateTransaction: (id: string, transaction: Partial<FinancialTransaction>) => void;
 deleteTransaction: (id: string) => void;

 updateSettings: (settings: Partial<SystemSettings>) => void;

 // Notification methods
 addNotification: (title: string, message: string, type: SystemNotification['type']) => void;
 toggleNotificationRead: (id: string) => void;
 markNotificationAsRead: (id: string) => void;
 markAllNotificationsAsRead: () => void;
 clearNotification: (id: string) => void;
 clearAllNotifications: () => void;
 scanReceipt: (imageBase64: string) => Promise<{ success: boolean; data?: ReceiptOcrData; error?: string }>;
 importFinancialFile: (fileType: 'csv' | 'ofx' | 'xlsx', fileContent: string) => Promise<{ success: boolean; count?: number; error?: string }>;
 resetSystem: () => void;

 // Agenda and Audit Log methods
 agendaActivities: AgendaActivity[];
 auditLogs: AuditLog[];
 addAgendaActivity: (activity: Omit<AgendaActivity, 'id' | 'createdAt'>) => void;
 updateAgendaActivity: (id: string, activity: Partial<AgendaActivity>) => void;
 deleteAgendaActivity: (id: string) => void;
 addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
 syncAllData: () => void;

 // Contas a Pagar, Contas a Receber e Gateway
 payables: AccountPayable[];
 receivables: AccountReceivable[];
 paymentCharges: OnlinePaymentCharge[];
 paymentConfig: OnlinePaymentConfig;
 addPayable: (payable: Omit<AccountPayable, 'id' | 'createdAt'>) => Promise<void>;
 updatePayable: (id: string, payable: Partial<AccountPayable>) => Promise<void>;
 deletePayable: (id: string) => Promise<void>;
 settlePayable: (id: string, paidAmount: number, paymentDate: string, paymentMethod: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
 addReceivable: (receivable: Omit<AccountReceivable, 'id' | 'createdAt'>) => Promise<void>;
 updateReceivable: (id: string, receivable: Partial<AccountReceivable>) => Promise<void>;
 deleteReceivable: (id: string) => Promise<void>;
 settleReceivable: (id: string, receivedAmount: number, receiptDate: string, paymentMethod: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
 createPaymentCheckout: (params: { receivableId?: string; orderId?: string; customerName: string; customerDocument?: string; amount: number; method: 'pix' | 'credit_card' | 'bank_slip'; installments?: number }) => Promise<OnlinePaymentCharge>;
 simulateWebhookPayment: (chargeId: string) => Promise<boolean>;
 refundCharge: (chargeId: string, reason?: string) => Promise<boolean>;
 updatePaymentConfig: (config: Partial<OnlinePaymentConfig>) => Promise<void>;
 exportFinancialReport: (type: 'transactions' | 'payables' | 'receivables' | 'cashflow') => Promise<{ success: boolean; filename?: string; error?: string }>;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

export const useDb = () => {
 const context = useContext(DbContext);
 if (!context) throw new Error('useDb must be used within a DbProvider');
 return context;
};

// Initial Seed Data
const defaultSettings: SystemSettings = {
 companyName: "",
 logo: "",
 slogan: "",
 razaoSocial: "",
 nomeFantasia: "",
 cnpj: "",
 inscricaoEstadual: "",
 address: "",
 phone: "",
 whatsapp: "",
 email: "",
 website: "",
 socialMedia: "",
 favicon: "",
 institutionalPhoto: "",
 firstSetup: true,
 userPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
 userName: "Admin",
 userRole: "Administrador",
 userEmail: "admin@atelie.com",
 userPhone: "",
 userLanguage: "pt-BR",
userTimezone: "GMT-3",
 laborHourlyRate: 25.00,
 indirectCosts: 5.50,
 defaultMarginPercent: 120,
 minMarginPercent: 50,
 idealMarginPercent: 120,
 taxPercent: 6,
 commissionPercent: 10,
 defaultDiscountPercent: 5,
 theme: 'light',
 primaryColor: '#D4AF37',
 cardStyle: 'modern',
 borderRadius: '16px',
 shadowStyle: 'soft',
 density: 'normal',
 typography: 'Inter',
 dashboardLayout: 'grid',
 docLogo: "📿",
 docHeader: "Ateliê Sagrado - Joias e Terços Religiosos",
 docFooter: "Agradecemos pela preferência! Feito sob encomenda com dedicação.",
 docFinalMessage: "Que esta peça traga paz e bênçãos para o seu lar.",
 docSignature: "Rosana Santos - Gestora de Vendas",
 docNotes: "Garantia permanente sobre o folheado a ouro e pérolas naturais.",
 backupFrequency: 'weekly',
 currencyFormat: 'BRL',
 dateFormat: 'DD/MM/YYYY',
 autoNumberingPattern: 'PED-YYYY-XXXX',
 notificationsEnabled: true
};

const initialTenants: Tenant[] = [
  {
    id: "tenant_atelie_sagrado",
    name: "Ateliê Sagrado",
    slug: "atelie-sagrado",
    document: "12.345.678/0001-90",
    razaoSocial: "Ateliê Sagrado Arte Sacra LTDA",
    nomeFantasia: "Ateliê Sagrado",
    email: "contato@ateliesagrado.com.br",
    phone: "(11) 98765-4321",
    address: "Rua das Flores, 120 - Centro, São Paulo/SP",
    primaryColor: "#D4AF37",
    planId: "professional",
    status: "active",
    ownerId: "user_admin",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "tenant_luz_divina",
    name: "Studio Luz Divina",
    slug: "luz-divina",
    document: "98.765.432/0001-10",
    razaoSocial: "Luz Divina Artesanatos ME",
    nomeFantasia: "Studio Luz Divina",
    email: "contato@luzdivina.com",
    phone: "(21) 98888-7777",
    address: "Rua do Rosário, 88 - Centro, Rio de Janeiro/RJ",
    primaryColor: "#10B981",
    planId: "basic",
    status: "active",
    ownerId: "user_admin_luz",
    createdAt: "2026-03-01T00:00:00.000Z"
  }
];

const initialClients: Client[] = [
  // --- ATELIÊ 1: ATELIÊ SAGRADO ---
  {
    id: "c1",
    tenantId: "tenant_atelie_sagrado",
    type: "PF",
    name: "Ana Maria de Sousa",
    cpf: "123.456.789-00",
    email: "anamaria@gmail.com",
    phone: "(11) 99111-2222",
    whatsapp: "(11) 99111-2222",
    cep: "04012-010",
    street: "Rua Domingos de Morais",
    number: "500",
    complement: "Apto 42",
    neighborhood: "Vila Mariana",
    city: "São Paulo",
    state: "SP",
    createdAt: "2026-05-10T10:00:00Z"
  },
  {
    id: "c2",
    tenantId: "tenant_atelie_sagrado",
    type: "PJ",
    name: "Paróquia Nossa Senhora da Paz",
    nomeFantasia: "Paróquia NS Paz",
    cnpj: "98.765.432/0001-11",
    responsavel: "Padre Julio Lancellotti",
    email: "contato@nspaz.org.br",
    phone: "(11) 3211-4400",
    whatsapp: "(11) 98222-3333",
    cep: "01519-000",
    street: "Rua do Glicério",
    number: "225",
    neighborhood: "Liberdade",
    city: "São Paulo",
    state: "SP",
    createdAt: "2026-05-15T14:30:00Z"
  },
  {
    id: "c3",
    tenantId: "tenant_atelie_sagrado",
    type: "PF",
    name: "Carlos Eduardo Santos",
    cpf: "987.654.321-11",
    email: "carlosedu@hotmail.com",
    phone: "(11) 97100-5050",
    whatsapp: "(11) 97100-5050",
    cep: "04530-001",
    street: "Rua Joaquim Floriano",
    number: "820",
    neighborhood: "Itaim Bibi",
    city: "São Paulo",
    state: "SP",
    createdAt: "2026-05-20T11:15:00Z"
  },
  // --- ATELIÊ 2: STUDIO LUZ DIVINA ---
  {
    id: "c_luz_1",
    tenantId: "tenant_luz_divina",
    type: "PJ",
    name: "Santuário Mãe de Deus - RJ",
    nomeFantasia: "Santuário Mãe de Deus",
    cnpj: "23.456.789/0001-99",
    responsavel: "Monsenhor Roberto",
    email: "contato@santuariomaededeus.org.br",
    phone: "(21) 3344-5566",
    whatsapp: "(21) 99888-4433",
    cep: "20040-002",
    street: "Praça XV de Novembro",
    number: "34",
    neighborhood: "Centro",
    city: "Rio de Janeiro",
    state: "RJ",
    createdAt: "2026-05-12T09:00:00Z"
  },
  {
    id: "c_luz_2",
    tenantId: "tenant_luz_divina",
    type: "PF",
    name: "Roberto Gonçalves Ribeiro",
    cpf: "456.789.012-34",
    email: "roberto.goncalves@uol.com.br",
    phone: "(21) 98765-1122",
    whatsapp: "(21) 98765-1122",
    cep: "22020-001",
    street: "Avenida Atlântica",
    number: "1702",
    neighborhood: "Copacabana",
    city: "Rio de Janeiro",
    state: "RJ",
    createdAt: "2026-05-18T16:00:00Z"
  }
];

const initialInventory: InventoryItem[] = [
  // --- ATELIÊ 1: ATELIÊ SAGRADO ---
  {
    id: "m1",
    tenantId: "tenant_atelie_sagrado",
    name: "Pérola de Água Doce Branca (8mm)",
    category: "Contas e Pérolas",
    code: "PER-001",
    description: "Pérolas naturais cultivadas em água doce, furo passante de 0.8mm.",
    supplier: "Beads Importadora",
    unit: "pacote (100 un)",
    weightG: 120,
    quantity: 4,
    minQuantity: 5,
    unitValue: 45.00,
    calcMethod: "fixed",
    notes: "Material de altíssima qualidade para terços de noivas.",
    status: "active",
    createdAt: "2026-05-01T09:00:00Z",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=300&auto=format&fit=crop"
  },
  {
    id: "m2",
    tenantId: "tenant_atelie_sagrado",
    name: "Crucifixo Clássico Folheado a Ouro",
    category: "Metais e Entremeios",
    code: "CRU-002",
    description: "Crucifixo decorado com detalhes barrocos, banho de 5 milésimos de ouro.",
    supplier: "Metais Sacros Ltda",
    unit: "unidade",
    weightG: 15,
    quantity: 12,
    minQuantity: 15,
    unitValue: 18.50,
    calcMethod: "fixed",
    notes: "Crucifixo para terços grandes e luxuosos.",
    status: "active",
    createdAt: "2026-05-01T09:15:00Z",
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop"
  },
  {
    id: "m3",
    tenantId: "tenant_atelie_sagrado",
    name: "Entremeio de Nossa Senhora das Graças Ouro Velho",
    category: "Metais e Entremeios",
    code: "ENT-012",
    description: "Entremeio resinado com imagem colorida de NS das Graças, banho ouro velho.",
    supplier: "Metais Sacros Ltda",
    unit: "unidade",
    weightG: 8,
    quantity: 35,
    minQuantity: 10,
    unitValue: 6.20,
    calcMethod: "fixed",
    notes: "Muito procurado para terços marianos comuns.",
    status: "active",
    createdAt: "2026-05-01T09:20:00Z",
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=300&auto=format&fit=crop"
  },
  {
    id: "m4",
    tenantId: "tenant_atelie_sagrado",
    name: "Fio de Alpaca Semi-Rígido (0.8mm)",
    category: "Fios e Cordões",
    code: "FIO-003",
    description: "Fio de alpaca excelente para contra-pino de terços duradouros.",
    supplier: "Joias do Vale",
    unit: "rolo (50m)",
    weightG: 300,
    quantity: 1,
    minQuantity: 3,
    unitValue: 28.00,
    calcMethod: "weight",
    notes: "Fácil de manusear com alicate de bico redondo.",
    status: "active",
    createdAt: "2026-05-01T09:30:00Z",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=300&auto=format&fit=crop"
  },
  {
    id: "m5",
    tenantId: "tenant_atelie_sagrado",
    name: "Caixa de Veludo Luxo - Ateliê",
    category: "Embalagens",
    code: "EMB-101",
    description: "Caixa rígida revestida de veludo azul marinho com gravação dourada do logotipo.",
    supplier: "Cartonagem Imperial",
    unit: "unidade",
    weightG: 85,
    quantity: 25,
    minQuantity: 8,
    unitValue: 12.00,
    calcMethod: "fixed",
    notes: "Embalagem premium para valorizar o produto final.",
    status: "active",
    createdAt: "2026-05-01T10:00:00Z",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=300&auto=format&fit=crop"
  },
  // --- ATELIÊ 2: STUDIO LUZ DIVINA ---
  {
    id: "m_luz_1",
    tenantId: "tenant_luz_divina",
    name: "Cristal Lapidado Aurora Boreal (8mm)",
    category: "Contas e Cristais",
    code: "CRI-001",
    description: "Cristais facetados importados com acabamento furta-cor e reflexo luminoso.",
    supplier: "Cristais & Brilhos RJ",
    unit: "fio (70 un)",
    weightG: 95,
    quantity: 8,
    minQuantity: 3,
    unitValue: 32.00,
    calcMethod: "fixed",
    notes: "Utilizado nos terços luminosos devocionais.",
    status: "active",
    createdAt: "2026-05-02T10:00:00Z",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=300&auto=format&fit=crop"
  },
  {
    id: "m_luz_2",
    tenantId: "tenant_luz_divina",
    name: "Contas de Madeira Nobre Imbuia (10mm)",
    category: "Madeiras e Sementes",
    code: "MAD-010",
    description: "Contas artesanais torneadas em madeira nobre com cera de abelha natural.",
    supplier: "Madeiras da Serra",
    unit: "pacote (100 un)",
    weightG: 140,
    quantity: 15,
    minQuantity: 5,
    unitValue: 24.50,
    calcMethod: "fixed",
    notes: "Ideal para decenários rústicos e masculinos.",
    status: "active",
    createdAt: "2026-05-02T10:30:00Z",
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop"
  },
  {
    id: "m_luz_3",
    tenantId: "tenant_luz_divina",
    name: "Crucifixo São Bento Prata Velha 6cm",
    category: "Metais e Entremeios",
    code: "CRU-SB-03",
    description: "Crucifixo de São Bento em liga metálica com banho de prata envelhecida e verniz italiano.",
    supplier: "Metais Carioca",
    unit: "unidade",
    weightG: 18,
    quantity: 20,
    minQuantity: 6,
    unitValue: 14.00,
    calcMethod: "fixed",
    notes: "Item de alta durabilidade e acabamento fosco.",
    status: "active",
    createdAt: "2026-05-02T11:00:00Z",
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=300&auto=format&fit=crop"
  }
];

const initialProducts: Product[] = [
  // --- ATELIÊ 1: ATELIÊ SAGRADO ---
  {
    id: "p1",
    tenantId: "tenant_atelie_sagrado",
    name: "Terço de Noiva Imperial - Pérola de Água Doce",
    category: "Terços de Noiva",
    sku: "TER-N-001",
    description: "Terço de luxo montado à mão com pérolas de água doce naturais de 8mm, crucifixo banhado a ouro barroco e entremeio de Nossa Senhora das Graças resinado. Acompanha caixa de veludo.",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop",
    productionTimeMin: 120,
    finalWeightG: 220,
    sellingPrice: 420.00,
    composition: [
      { materialId: "m1", quantity: 0.6, cost: 27.00 },
      { materialId: "m2", quantity: 1, cost: 18.50 },
      { materialId: "m3", quantity: 1, cost: 6.20 },
      { materialId: "m4", quantity: 0.1, cost: 2.80 },
      { materialId: "m5", quantity: 1, cost: 12.00 }
    ],
    status: "active",
    createdAt: "2026-05-05T11:00:00Z"
  },
  {
    id: "p2",
    tenantId: "tenant_atelie_sagrado",
    name: "Pulseira de Hematita São Bento",
    category: "Pulseiras",
    sku: "PUL-SB-002",
    description: "Pulseira masculina confeccionada com contas de hematita magnética e entremeios da medalha de São Bento em banho ouro velho.",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=300&auto=format&fit=crop",
    productionTimeMin: 30,
    finalWeightG: 45,
    sellingPrice: 65.00,
    composition: [
      { materialId: "m3", quantity: 2, cost: 12.40 },
      { materialId: "m4", quantity: 0.02, cost: 0.56 },
      { materialId: "m5", quantity: 1, cost: 12.00 }
    ],
    status: "active",
    createdAt: "2026-05-06T15:00:00Z"
  },
  // --- ATELIÊ 2: STUDIO LUZ DIVINA ---
  {
    id: "p_luz_1",
    tenantId: "tenant_luz_divina",
    name: "Terço Luminoso de Cristal Aurora Boreal",
    category: "Terços Especiais",
    sku: "TER-LUZ-01",
    description: "Terço devocional em cristais lapidados de 8mm que refratam a luz ambiente, com crucifixo de São Bento em prata velha.",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=300&auto=format&fit=crop",
    productionTimeMin: 90,
    finalWeightG: 160,
    sellingPrice: 280.00,
    composition: [
      { materialId: "m_luz_1", quantity: 1, cost: 32.00 },
      { materialId: "m_luz_3", quantity: 1, cost: 14.00 }
    ],
    status: "active",
    createdAt: "2026-05-08T10:00:00Z"
  },
  {
    id: "p_luz_2",
    tenantId: "tenant_luz_divina",
    name: "Decenário de Madeira Nobre Imbuia",
    category: "Decenários",
    sku: "DEC-MAD-02",
    description: "Decenário de bolso produzido com contas de imbuia torneadas à mão e cordão de alta tenacidade.",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop",
    productionTimeMin: 20,
    finalWeightG: 35,
    sellingPrice: 48.00,
    composition: [
      { materialId: "m_luz_2", quantity: 0.1, cost: 2.45 },
      { materialId: "m_luz_3", quantity: 1, cost: 14.00 }
    ],
    status: "active",
    createdAt: "2026-05-09T14:00:00Z"
  }
];

const initialQuotes: Quote[] = [
  // --- ATELIÊ 1 ---
  {
    id: "q1",
    tenantId: "tenant_atelie_sagrado",
    clientId: "c2",
    clientName: "Paróquia Nossa Senhora da Paz",
    items: [
      {
        productId: "p2",
        productName: "Pulseira de Hematita São Bento",
        quantity: 15,
        unitPrice: 55.00,
        total: 825.00
      }
    ],
    subtotal: 825.00,
    discount: 50.00,
    shipping: 25.00,
    total: 800.00,
    status: "pending",
    date: "2026-06-15",
    createdAt: "2026-06-15T10:00:00Z"
  },
  {
    id: "q2",
    tenantId: "tenant_atelie_sagrado",
    clientId: "c1",
    clientName: "Ana Maria de Sousa",
    items: [
      {
        productId: "p1",
        productName: "Terço de Noiva Imperial - Pérola de Água Doce",
        quantity: 1,
        unitPrice: 420.00,
        total: 420.00
      }
    ],
    subtotal: 420.00,
    discount: 20.00,
    shipping: 0.00,
    total: 400.00,
    status: "converted",
    date: "2026-06-18",
    createdAt: "2026-06-18T11:20:00Z"
  },
  // --- ATELIÊ 2 ---
  {
    id: "q_luz_1",
    tenantId: "tenant_luz_divina",
    clientId: "c_luz_1",
    clientName: "Santuário Mãe de Deus - RJ",
    items: [
      {
        productId: "p_luz_1",
        productName: "Terço Luminoso de Cristal Aurora Boreal",
        quantity: 5,
        unitPrice: 260.00,
        total: 1300.00
      }
    ],
    subtotal: 1300.00,
    discount: 100.00,
    shipping: 0.00,
    total: 1200.00,
    status: "approved",
    date: "2026-06-19",
    createdAt: "2026-06-19T14:00:00Z"
  }
];

const initialOrders: Order[] = [
  // --- ATELIÊ 1 ---
  {
    id: "o1",
    tenantId: "tenant_atelie_sagrado",
    orderNumber: "PED-2026-0001",
    clientId: "c1",
    clientName: "Ana Maria de Sousa",
    items: [
      {
        productId: "p1",
        productName: "Terço de Noiva Imperial - Pérola de Água Doce",
        quantity: 1,
        price: 400.00,
        total: 400.00
      }
    ],
    totalValue: 400.00,
    date: "2026-06-18",
    dueDate: "2026-06-28",
    status: "production",
    productionProgress: 40,
    timeline: [
      { id: "t1", date: "2026-06-18 11:30", description: "Pedido gerado a partir do orçamento Q-2026-0002", user: "Rosana Santos" },
      { id: "t2", date: "2026-06-18 11:32", description: "Status alterado de Recebido para Aprovado", user: "Rosana Santos" },
      { id: "t3", date: "2026-06-20 09:15", description: "Iniciada montagem física das contas", user: "Lucas Silva (Artesão)" }
    ],
    createdAt: "2026-06-18T11:30:00Z"
  },
  {
    id: "o2",
    tenantId: "tenant_atelie_sagrado",
    orderNumber: "PED-2026-0002",
    clientId: "c3",
    clientName: "Carlos Eduardo Santos",
    items: [
      {
        productId: "p2",
        productName: "Pulseira de Hematita São Bento",
        quantity: 2,
        price: 65.00,
        total: 130.00
      }
    ],
    totalValue: 130.00,
    date: "2026-06-22",
    dueDate: "2026-06-26",
    status: "received",
    productionProgress: 0,
    timeline: [
      { id: "t4", date: "2026-06-22 14:00", description: "Pedido criado via painel ERP", user: "Rosana Santos" }
    ],
    createdAt: "2026-06-22T14:00:00Z"
  },
  // --- ATELIÊ 2 ---
  {
    id: "o_luz_1",
    tenantId: "tenant_luz_divina",
    orderNumber: "LUZ-2026-0001",
    clientId: "c_luz_2",
    clientName: "Roberto Gonçalves Ribeiro",
    items: [
      {
        productId: "p_luz_1",
        productName: "Terço Luminoso de Cristal Aurora Boreal",
        quantity: 1,
        price: 280.00,
        total: 280.00
      }
    ],
    totalValue: 280.00,
    date: "2026-06-21",
    dueDate: "2026-06-27",
    status: "production",
    productionProgress: 50,
    timeline: [
      { id: "t_luz_1", date: "2026-06-21 10:00", description: "Pedido aprovado e pago via Pix", user: "Carlos Mendonça" },
      { id: "t_luz_2", date: "2026-06-21 14:30", description: "Iniciado encadeamento dos cristais lapidados", user: "Mariana Costa (Artesã)" }
    ],
    createdAt: "2026-06-21T10:00:00Z"
  }
];

const initialProductionTasks: ProductionTask[] = [
  // --- ATELIÊ 1 ---
  {
    id: "pt1",
    tenantId: "tenant_atelie_sagrado",
    orderId: "o1",
    orderNumber: "PED-2026-0001",
    productId: "p1",
    productName: "Terço de Noiva Imperial - Pérola de Água Doce",
    status: "producing",
    responsible: "Lucas Silva (Artesão)",
    startDate: "2026-06-20T09:15:00Z",
    endDate: null,
    timeSpentMinutes: 50,
    totalEstimatedMinutes: 120,
    createdAt: "2026-06-18T11:32:00Z"
  },
  {
    id: "pt2",
    tenantId: "tenant_atelie_sagrado",
    orderId: "o2",
    orderNumber: "PED-2026-0002",
    productId: "p2",
    productName: "Pulseira de Hematita São Bento",
    status: "todo",
    responsible: "Não Atribuído",
    startDate: null,
    endDate: null,
    timeSpentMinutes: 0,
    totalEstimatedMinutes: 30,
    createdAt: "2026-06-22T14:00:00Z"
  },
  // --- ATELIÊ 2 ---
  {
    id: "pt_luz_1",
    tenantId: "tenant_luz_divina",
    orderId: "o_luz_1",
    orderNumber: "LUZ-2026-0001",
    productId: "p_luz_1",
    productName: "Terço Luminoso de Cristal Aurora Boreal",
    status: "producing",
    responsible: "Mariana Costa (Artesã)",
    startDate: "2026-06-21T14:30:00Z",
    endDate: null,
    timeSpentMinutes: 45,
    totalEstimatedMinutes: 90,
    createdAt: "2026-06-21T10:00:00Z"
  }
];

const initialTransactions: FinancialTransaction[] = [
  // --- ATELIÊ 1 ---
  {
    id: "f1",
    tenantId: "tenant_atelie_sagrado",
    type: "income",
    category: "Venda de Produtos",
    contactName: "Ana Maria de Sousa",
    value: 400.00,
    date: "2026-06-18",
    paymentMethod: "Pix",
    notes: "Sinal de 100% pago na aprovação do terço",
    createdAt: "2026-06-18T11:30:00Z"
  },
  {
    id: "f2",
    tenantId: "tenant_atelie_sagrado",
    type: "expense",
    category: "Compra de Matéria-Prima",
    contactName: "Metais Sacros Ltda",
    value: 155.00,
    date: "2026-06-10",
    paymentMethod: "Boleto Bancário",
    notes: "Compra de crucifixos folheados",
    createdAt: "2026-06-10T15:00:00Z"
  },
  {
    id: "f3",
    tenantId: "tenant_atelie_sagrado",
    type: "expense",
    category: "Custos Operacionais",
    contactName: "Cartonagem Imperial",
    value: 120.00,
    date: "2026-06-12",
    paymentMethod: "Pix",
    notes: "Lote de 10 caixas rígidas de veludo",
    createdAt: "2026-06-12T16:30:00Z"
  },
  {
    id: "f4",
    tenantId: "tenant_atelie_sagrado",
    type: "income",
    category: "Venda de Produtos",
    contactName: "Vários Clientes (Consolidado)",
    value: 2850.00,
    date: "2026-05-28",
    paymentMethod: "Cartão de Crédito",
    createdAt: "2026-05-28T18:00:00Z"
  },
  // --- ATELIÊ 2 ---
  {
    id: "f_luz_1",
    tenantId: "tenant_luz_divina",
    type: "income",
    category: "Venda de Produtos",
    contactName: "Roberto Gonçalves Ribeiro",
    value: 280.00,
    date: "2026-06-21",
    paymentMethod: "Pix",
    notes: "Pagamento do Terço Luminoso de Cristal",
    createdAt: "2026-06-21T10:00:00Z"
  },
  {
    id: "f_luz_2",
    tenantId: "tenant_luz_divina",
    type: "expense",
    category: "Compra de Matéria-Prima",
    contactName: "Cristais & Brilhos RJ",
    value: 180.00,
    date: "2026-06-14",
    paymentMethod: "Pix",
    notes: "Lote de cristais facetados",
    createdAt: "2026-06-14T11:00:00Z"
  }
];

const initialUsers: AppUser[] = [
  // --- ATELIÊ 1: ATELIÊ SAGRADO ---
  {
   id: 'user_admin',
   tenantId: 'tenant_atelie_sagrado',
   isOwner: true,
   username: 'Admin',
   name: 'Administrador (Ateliê Sagrado)',
   email: 'admin@atelie.com',
   password: '301310Lr',
   role: 'Administrador',
   roleLabel: 'Administrador Titular',
   isActive: true,
   photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
   permissions: {
    dashboard: true, inventory: true, purchases: true, products: true, pricing: true, clients: true, quotes: true, orders: true, production: true, financial: true, users: true, settings: true
   }
  },
  {
   id: 'user_rosana',
   tenantId: 'tenant_atelie_sagrado',
   isOwner: false,
   username: 'Rosana',
   name: 'Rosana Santos',
   email: 'rosana@atelie.com',
   password: '123456',
   role: 'Vendedor',
   roleLabel: 'Vendedora / Comercial',
   isActive: true,
   photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
   permissions: {
    dashboard: true, inventory: false, purchases: false, products: true, pricing: true, clients: true, quotes: true, orders: true, production: false, financial: false, users: false, settings: false
   }
  },
  {
   id: 'user_lucas',
   tenantId: 'tenant_atelie_sagrado',
   isOwner: false,
   username: 'Lucas',
   name: 'Lucas Silva',
   email: 'lucas@atelie.com',
   password: '123456',
   role: 'Artesão',
   roleLabel: 'Artesão / Chão de Fábrica',
   isActive: true,
   photoUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150&auto=format&fit=crop',
   permissions: {
    dashboard: true, inventory: false, purchases: false, products: true, pricing: false, clients: false, quotes: false, orders: true, production: true, financial: false, users: false, settings: false
   }
  },
  {
   id: 'user_marcos',
   tenantId: 'tenant_atelie_sagrado',
   isOwner: false,
   username: 'Marcos',
   name: 'Marcos Lima',
   email: 'marcos@atelie.com',
   password: '123456',
   role: 'Estoquista',
   roleLabel: 'Almoxarife / Estoquista',
   isActive: true,
   photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
   permissions: {
    dashboard: true, inventory: true, purchases: true, products: true, pricing: false, clients: false, quotes: false, orders: false, production: false, financial: false, users: false, settings: false
   }
  },

  // --- ATELIÊ 2: STUDIO LUZ DIVINA ---
  {
   id: 'user_admin_luz',
   tenantId: 'tenant_luz_divina',
   isOwner: true,
   username: 'AdminLuz',
   name: 'Administrador (Luz Divina)',
   email: 'admin@luzdivina.com',
   password: '301310Lr',
   role: 'Administrador',
   roleLabel: 'Administrador Titular',
   isActive: true,
   photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop',
   permissions: {
    dashboard: true, inventory: true, purchases: true, products: true, pricing: true, clients: true, quotes: true, orders: true, production: true, financial: true, users: true, settings: true
   }
  },
  {
   id: 'user_carlos_luz',
   tenantId: 'tenant_luz_divina',
   isOwner: false,
   username: 'CarlosLuz',
   name: 'Carlos Mendonça',
   email: 'carlos@luzdivina.com',
   password: '123456',
   role: 'Vendedor',
   roleLabel: 'Vendedora / Comercial',
   isActive: true,
   photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
   permissions: {
    dashboard: true, inventory: false, purchases: false, products: true, pricing: true, clients: true, quotes: true, orders: true, production: false, financial: false, users: false, settings: false
   }
  },
  {
   id: 'user_mariana_luz',
   tenantId: 'tenant_luz_divina',
   isOwner: false,
   username: 'MarianaLuz',
   name: 'Mariana Costa',
   email: 'mariana@luzdivina.com',
   password: '123456',
   role: 'Artesão',
   roleLabel: 'Artesã / Chão de Fábrica',
   isActive: true,
   photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
   permissions: {
    dashboard: true, inventory: false, purchases: false, products: true, pricing: false, clients: false, quotes: false, orders: true, production: true, financial: false, users: false, settings: false
   }
  }
];

const initialPayables: AccountPayable[] = [
  {
    id: "pay1",
    tenantId: "tenant_atelie_sagrado",
    description: "Fornecedor de Metais e Cruzes (1/2)",
    supplierName: "Metais Sacros Brasil",
    category: "Compra de Materiais",
    issueDate: "2026-06-01",
    dueDate: "2026-06-20",
    amount: 450.00,
    paidAmount: 0,
    installmentNumber: 1,
    totalInstallments: 2,
    status: "overdue",
    barcode: "34191.79001 01043.510047 91020.150008 8 99800000045000",
    pixKey: "financeiro@metaissacros.com.br",
    notes: "Fatura de insumos de crucifixos em ouro velho",
    createdAt: "2026-06-01T10:00:00Z"
  },
  {
    id: "pay2",
    tenantId: "tenant_atelie_sagrado",
    description: "Fornecedor de Metais e Cruzes (2/2)",
    supplierName: "Metais Sacros Brasil",
    category: "Compra de Materiais",
    issueDate: "2026-06-01",
    dueDate: "2026-07-20",
    amount: 450.00,
    paidAmount: 0,
    installmentNumber: 2,
    totalInstallments: 2,
    status: "pending",
    barcode: "34191.79001 01043.510047 91020.150008 8 99800000045000",
    pixKey: "financeiro@metaissacros.com.br",
    notes: "Segunda parcela de crucifixos",
    createdAt: "2026-06-01T10:00:00Z"
  },
  {
    id: "pay3",
    tenantId: "tenant_atelie_sagrado",
    description: "Aluguel e Condomínio do Ateliê",
    supplierName: "Imobiliária São José",
    category: "Custos Fixos",
    issueDate: "2026-06-01",
    dueDate: "2026-06-10",
    amount: 1200.00,
    paidAmount: 1200.00,
    installmentNumber: 1,
    totalInstallments: 1,
    status: "paid",
    paymentDate: "2026-06-09",
    paymentMethod: "pix",
    notes: "Aluguel mensal quitado via PIX",
    createdAt: "2026-06-01T08:00:00Z"
  },
  {
    id: "pay_luz_1",
    tenantId: "tenant_luz_divina",
    description: "Fornecedor de Cera de Abelha",
    supplierName: "Apiários da Serra",
    category: "Compra de Materiais",
    issueDate: "2026-06-05",
    dueDate: "2026-06-25",
    amount: 320.00,
    paidAmount: 0,
    installmentNumber: 1,
    totalInstallments: 1,
    status: "pending",
    pixKey: "apiario@serra.com.br",
    createdAt: "2026-06-05T09:00:00Z"
  }
];

const initialReceivables: AccountReceivable[] = [
  {
    id: "rec1",
    tenantId: "tenant_atelie_sagrado",
    description: "Pedido #00101 - Terço Imperial (1/2)",
    clientName: "Paróquia Nossa Senhora da Paz",
    clientId: "c2",
    orderId: "o1",
    orderNumber: "00101",
    category: "Venda de Terço",
    issueDate: "2026-06-15",
    dueDate: "2026-06-15",
    amount: 320.00,
    receivedAmount: 320.00,
    installmentNumber: 1,
    totalInstallments: 2,
    status: "received",
    receiptDate: "2026-06-15",
    paymentMethod: "pix",
    notes: "Entrada do pedido recebida via PIX",
    createdAt: "2026-06-15T14:45:00Z"
  },
  {
    id: "rec2",
    tenantId: "tenant_atelie_sagrado",
    description: "Pedido #00101 - Terço Imperial (2/2)",
    clientName: "Paróquia Nossa Senhora da Paz",
    clientId: "c2",
    orderId: "o1",
    orderNumber: "00101",
    category: "Venda de Terço",
    issueDate: "2026-06-15",
    dueDate: "2026-06-30",
    amount: 320.00,
    receivedAmount: 0,
    installmentNumber: 2,
    totalInstallments: 2,
    status: "pending",
    paymentLink: "https://pay.ateliesagrado.com/c/rec2",
    pixCopyPaste: "00020126580014br.gov.bcb.pix0136pix@ateliesagrado.com.br5204000053039865406320.005802BR5921Atelie Sagrado LTDA6009Sao Paulo62070503REC26304E8A2",
    notes: "Saldo restante contra entrega do produto",
    createdAt: "2026-06-15T14:45:00Z"
  },
  {
    id: "rec3",
    tenantId: "tenant_atelie_sagrado",
    description: "Restauração de Crucifixo de Madeira",
    clientName: "Ana Maria de Sousa",
    clientId: "c1",
    category: "Restauração",
    issueDate: "2026-05-20",
    dueDate: "2026-06-05",
    amount: 280.00,
    receivedAmount: 0,
    installmentNumber: 1,
    totalInstallments: 1,
    status: "overdue",
    paymentLink: "https://pay.ateliesagrado.com/c/rec3",
    notes: "Cobrança vencida em atraso",
    createdAt: "2026-05-20T11:00:00Z"
  },
  {
    id: "rec_luz_1",
    tenantId: "tenant_luz_divina",
    description: "Vela Votiva Decorada",
    clientName: "Igreja de São Bento",
    category: "Velas",
    issueDate: "2026-06-10",
    dueDate: "2026-06-25",
    amount: 190.00,
    receivedAmount: 190.00,
    installmentNumber: 1,
    totalInstallments: 1,
    status: "received",
    receiptDate: "2026-06-12",
    paymentMethod: "pix",
    createdAt: "2026-06-10T09:00:00Z"
  }
];

const initialNotifications: SystemNotification[] = [
  {
    id: 'notif_1',
    tenantId: 'tenant_atelie_sagrado',
    title: '🎉 Bem-vindo ao Sistema do Ateliê Sagrado',
    message: 'Seu painel integrado está pronto! Acompanhe as suas vendas, estoque e produção em tempo real.',
    type: 'success',
    date: new Date().toISOString(),
    read: false
  }
];

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
 const [currentTenantId, setCurrentTenantId] = useState<string>('tenant_atelie_sagrado');
 const [clients, setClients] = useState<Client[]>([]);
 const [inventory, setInventory] = useState<InventoryItem[]>([]);
 const [products, setProducts] = useState<Product[]>([]);
 const [quotes, setQuotes] = useState<Quote[]>([]);
 const [orders, setOrders] = useState<Order[]>([]);
 const [productionTasks, setProductionTasks] = useState<ProductionTask[]>([]);
 const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
 const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
 const [user, setUser] = useState<AppUser | null>(null);
 const [users, setUsers] = useState<AppUser[]>([]);
 const [notifications, setNotifications] = useState<SystemNotification[]>([]);
 const [agendaActivities, setAgendaActivities] = useState<AgendaActivity[]>([]);
 const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
 const [payables, setPayables] = useState<AccountPayable[]>([]);
 const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
 const [paymentCharges, setPaymentCharges] = useState<OnlinePaymentCharge[]>([]);
 const [paymentConfig, setPaymentConfig] = useState<OnlinePaymentConfig>({
   enabled: false,
   gateway: 'pix_bacen',
   pixKey: 'pix@ateliesagrado.com.br',
   autoReconcile: true,
   sandbox: true
 });

 // Initialize and load from LocalStorage
 useEffect(() => {
 const localUser = localStorage.getItem('as_user');
 if (localUser) {
 try {
 setUser(JSON.parse(localUser));
 } catch (e) {
 setUser(null);
 }
 } else {
 // Keep user as null initially to force modern Auth Screen
 }

 const loadData = <T,>(key: string, initial: T[]): T[] => {
  const stored = localStorage.getItem(`as_${key}`);
  if (stored) {
   try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) return parsed;
    return initial;
   } catch (e) {
    return initial;
   }
  }
  localStorage.setItem(`as_${key}`, JSON.stringify(initial));
  return initial;
 };

 const loadedTenants = loadData('tenants', initialTenants);
 setTenants(loadedTenants);
 const storedActiveTenantId = localStorage.getItem('as_active_tenant_id');
 if (storedActiveTenantId && loadedTenants.some(t => t.id === storedActiveTenantId)) {
   setCurrentTenantId(storedActiveTenantId);
 } else if (loadedTenants.length > 0) {
   setCurrentTenantId(loadedTenants[0].id);
 }

 setClients(loadData('clients', initialClients));
 setInventory(loadData('inventory', initialInventory));
 setProducts(loadData('products', initialProducts));
 setQuotes(loadData('quotes', initialQuotes));
 setOrders(loadData('orders', initialOrders));
 setProductionTasks(loadData('production_tasks', initialProductionTasks));
 setTransactions(loadData('transactions', initialTransactions));
 setPayables(loadData('payables', initialPayables));
 setReceivables(loadData('receivables', initialReceivables));
 setPaymentCharges(loadData('payment_charges', []));
 const storedPayConfig = localStorage.getItem('as_payment_config');
 if (storedPayConfig) {
   try { setPaymentConfig(JSON.parse(storedPayConfig)); } catch (e) {}
 }

 const initialAgendaActivities: AgendaActivity[] = [];

 const initialAuditLogs: AuditLog[] = [];

 setAgendaActivities(loadData('agenda_activities', initialAgendaActivities));
 setAuditLogs(loadData('audit_logs', initialAuditLogs));
 setUsers(loadData('users', initialUsers));
 setNotifications(loadData('notifications', initialNotifications));

 const storedSettings = localStorage.getItem('as_settings');
 let loadedSettings = defaultSettings;
 if (storedSettings) {
 try {
 loadedSettings = JSON.parse(storedSettings);
 // Force 'light' theme as requested by user to appreciate clear colors
 loadedSettings.theme = 'light';
 localStorage.setItem('as_settings', JSON.stringify(loadedSettings));
 } catch (e) {
 loadedSettings = defaultSettings;
 }
 } else {
 localStorage.setItem('as_settings', JSON.stringify(defaultSettings));
 }
 loadedSettings.theme = 'light';
 setSettings(loadedSettings);
 }, []);

 // Real-time inter-tab storage synchronization
 useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
   if (e.key && e.key.startsWith('as_')) {
    syncAllData();
   }
  };
  window.addEventListener('storage', handleStorageChange);
  return () => {
   window.removeEventListener('storage', handleStorageChange);
  };
 }, []);

 // Sync theme class reactively with document root (always light as requested)
 useEffect(() => {
 const root = window.document.documentElement;
 root.classList.remove('dark');
 }, [settings.theme]);

 // Synchronize primary color with CSS variables & DOM dynamically
 useEffect(() => {
 if (settings?.primaryColor) {
 applyThemeColors(settings.primaryColor);
 }
 }, [settings?.primaryColor]);

 // Save states to local storage
 const saveToLocal = (key: string, data: any) => {
 localStorage.setItem(`as_${key}`, JSON.stringify(data));
 };

 // Auth actions
 const login = (usernameOrEmail: string, password: string): boolean => {
  const storedUsers = localStorage.getItem('as_users');
  const parsedUsers: AppUser[] = storedUsers ? JSON.parse(storedUsers) : [];
  
  const userMap = new Map<string, AppUser>();
  [
   ...initialUsers,
   ...parsedUsers,
   ...users
  ].forEach(u => userMap.set(u.id, u));

  const userList = Array.from(userMap.values());

  const foundUser = userList.find(u => 
   u.isActive && 
   ((u.username && u.username.toLowerCase() === usernameOrEmail.toLowerCase()) || 
    (u.email && u.email.toLowerCase() === usernameOrEmail.toLowerCase())) && 
   u.password === password
  );

  if (foundUser) {
   setUser(foundUser);
   localStorage.setItem('as_user', JSON.stringify(foundUser));
   if (foundUser.tenantId) {
     setCurrentTenantId(foundUser.tenantId);
     localStorage.setItem('as_active_tenant_id', foundUser.tenantId);
     const targetTenant = tenants.find(t => t.id === foundUser.tenantId);
     if (targetTenant?.primaryColor) {
       applyThemeColors(targetTenant.primaryColor);
       setSettings(prev => ({
         ...prev,
         primaryColor: targetTenant.primaryColor || prev.primaryColor,
         companyName: targetTenant.name || prev.companyName
       }));
     }
   }
   return true;
  }
  return false;
 };

 const loginWithGoogle = (googleData: { email: string; name?: string; photoUrl?: string; role?: string; token?: string }): AppUser => {
  const email = googleData.email || 'artsllumos@gmail.com';
  let found = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!found) {
   found = {
    id: 'user_g_' + Date.now(),
    username: email.split('@')[0],
    name: googleData.name || 'Arthur Santos',
    email: email,
    role: googleData.role || 'Administrador',
    isActive: true,
    photoUrl: googleData.photoUrl || 'https://lh3.googleusercontent.com/a/default-user',
    permissions: {
     dashboard: true, inventory: true, purchases: true, products: true, pricing: true, clients: true, quotes: true, orders: true, production: true, financial: true, settings: true
    }
   };
   const updated = [...users, found];
   setUsers(updated);
   saveToLocal('users', updated);
  }

  if (!found.permissions) {
   found.permissions = {
    dashboard: true, inventory: true, purchases: true, products: true, pricing: true, clients: true, quotes: true, orders: true, production: true, financial: true, settings: true
   };
  }

  setUser(found);
  localStorage.setItem('as_user', JSON.stringify(found));
  if (googleData.token) {
   localStorage.setItem('as_jwt', googleData.token);
  }
  return found;
 };

 const logout = () => {
  setUser(null);
  localStorage.removeItem('as_user');
 };

 const recoverPassword = (email: string): boolean => {
  return email.includes('@');
 };

 // User CRUD Methods
 const addUser = (userData: Omit<AppUser, 'id'>) => {
  const newUser: AppUser = {
   ...userData,
   tenantId: (userData as any).tenantId || currentTenantId,
   id: 'user_' + Date.now()
  };
  const updated = [...users, newUser];
  setUsers(updated);
  saveToLocal('users', updated);

  fetch('/api/users', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify(newUser)
  }).catch(() => {});
 };

 const updateUser = (id: string, updatedFields: Partial<AppUser>) => {
  const exists = users.some(u => u.id === id);
  let updatedUsers: AppUser[];

  if (exists) {
   updatedUsers = users.map(u => u.id === id ? { ...u, ...updatedFields } : u);
  } else {
   const base = (user && (user.id === id || user.email === updatedFields.email)) ? user : {
    id,
    username: updatedFields.username || 'user',
    name: updatedFields.name || 'Operador',
    email: updatedFields.email || '',
    role: updatedFields.role || 'Administrador',
    isActive: true,
    permissions: { dashboard: true, inventory: true, purchases: true, products: true, pricing: true, clients: true, quotes: true, orders: true, production: true, financial: true, settings: true }
   };
   updatedUsers = [...users, { ...base, ...updatedFields } as AppUser];
  }

  setUsers(updatedUsers);
  saveToLocal('users', updatedUsers);

  if (user && (user.id === id || (user.email && user.email.toLowerCase() === updatedFields.email?.toLowerCase()))) {
   const updatedCurrentUser = { ...user, ...updatedFields } as AppUser;
   setUser(updatedCurrentUser);
   localStorage.setItem('as_user', JSON.stringify(updatedCurrentUser));
  }

  fetch(`/api/users/${id}`, {
   method: 'PUT',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify(updatedFields)
  }).catch(() => {});
 };

 const deleteUser = (id: string) => {
  const updated = users.filter(u => u.id !== id);
  setUsers(updated);
  saveToLocal('users', updated);

  fetch(`/api/users/${id}`, {
   method: 'DELETE'
  }).catch(() => {});
 };

 // Agenda and Audit Log methods
 const addAuditLog = (logData: Omit<AuditLog, 'id' | 'timestamp'>) => {
  const newLog: AuditLog = {
   ...logData,
   tenantId: (logData as any).tenantId || currentTenantId,
   id: 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
   timestamp: new Date().toISOString()
  };
  setAuditLogs(prev => {
    if (prev.length > 0) {
     const lastLog = prev[0];
     const isDuplicate = lastLog.action === newLog.action && 
                         lastLog.user === newLog.user && 
                         Math.abs(new Date(lastLog.timestamp).getTime() - new Date(newLog.timestamp).getTime()) < 1000;
     if (isDuplicate) return prev;
    }
    const updated = [newLog, ...prev];
   saveToLocal('audit_logs', updated);
   return updated;
  });
 };

 const addAgendaActivity = (activityData: Omit<AgendaActivity, 'id' | 'createdAt'>) => {
  const newActivity: AgendaActivity = {
   ...activityData,
   tenantId: (activityData as any).tenantId || currentTenantId,
   id: 'activity_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
   createdAt: new Date().toISOString()
  };
  setAgendaActivities(prev => {
   const updated = [newActivity, ...prev];
   saveToLocal('agenda_activities', updated);
   return updated;
  });
 };

 const updateAgendaActivity = (id: string, updatedFields: Partial<AgendaActivity>) => {
  setAgendaActivities(prev => {
   const updated = prev.map(a => {
    if (a.id === id) {
     const updatedActivity = { ...a, ...updatedFields };
     if (updatedFields.status === 'Concluída' && a.status !== 'Concluída') {
      updatedActivity.completedAt = new Date().toLocaleString('pt-BR');
      addAuditLog({
       user: user?.name || 'Administrador',
       action: `Concluiu a atividade: "${a.title}"`,
       module: 'agenda'
      });
     } else if (updatedFields.status === 'Pendente' && a.status !== 'Pendente') {
      updatedActivity.completedAt = undefined;
      addAuditLog({
       user: user?.name || 'Administrador',
       action: `Reabriu a atividade (marcou como Pendente): "${a.title}"`,
       module: 'agenda'
      });
     }
     return updatedActivity;
    }
    return a;
   });
   saveToLocal('agenda_activities', updated);
   return updated;
  });
 };

 const deleteAgendaActivity = (id: string) => {
  setAgendaActivities(prev => {
   const target = prev.find(a => a.id === id);
   if (target) {
    addAuditLog({
     user: user?.name || 'Administrador',
     action: `Excluiu a atividade: "${target.title}"`,
     module: 'agenda'
    });
   }
   const updated = prev.filter(a => a.id !== id);
   saveToLocal('agenda_activities', updated);
   return updated;
  });
 };

 // CLIENTS CRUD
 const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
 const newClient: Client = {
 ...clientData,
 tenantId: (clientData as any).tenantId || currentTenantId,
 id: 'client_' + Date.now(),
 createdAt: new Date().toISOString()
 };
 const updated = [newClient, ...clients];
 setClients(updated);
 saveToLocal('clients', updated);

 // Generate automated audit log & agenda activity
 addAuditLog({
  user: user?.name || 'Administrador',
  action: `Cadastrou o cliente: "${newClient.name}"`,
  module: 'clients'
 });

 addAgendaActivity({
  time: '10:00',
  date: new Date().toISOString().split('T')[0],
  title: `Contato de Boas-Vindas: Cliente ${newClient.name}`,
  type: 'meeting',
  status: 'Pendente'
 });
 };

 const updateClient = (id: string, updatedFields: Partial<Client>) => {
 const updated = clients.map(c => c.id === id ? { ...c, ...updatedFields } : c);
 setClients(updated);
 saveToLocal('clients', updated);

 const target = clients.find(c => c.id === id);
 if (target) {
  addAuditLog({
   user: user?.name || 'Administrador',
   action: `Atualizou dados do cliente: "${target.name}"`,
   module: 'clients'
  });
 }
 };

 const deleteClient = (id: string) => {
 // Soft Delete
 const updated = clients.map(c => c.id === id ? { ...c, isDeleted: true } : c);
 setClients(updated);
 saveToLocal('clients', updated);

 const target = clients.find(c => c.id === id);
 if (target) {
  addAuditLog({
   user: user?.name || 'Administrador',
   action: `Excluiu o cliente (Inativado/Soft Delete): "${target.name}"`,
   module: 'clients'
  });
 }
 };

 // INVENTORY CRUD
 const addInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'createdAt'>) => {
 const newItem: InventoryItem = {
 ...itemData,
 quantity: roundQty(Math.max(0, safeNumber(itemData.quantity, 0))),
 unitValue: roundCurrency(Math.max(0, safeNumber(itemData.unitValue, 0))),
 minQuantity: roundQty(Math.max(0, safeNumber(itemData.minQuantity, 0))),
 tenantId: (itemData as any).tenantId || currentTenantId,
 id: 'inv_' + Date.now(),
 createdAt: new Date().toISOString()
 };
 const updated = [newItem, ...inventory];
 setInventory(updated);
 saveToLocal('inventory', updated);
 };

 const updateInventoryItem = (id: string, updatedFields: Partial<InventoryItem>) => {
  const itemBefore = inventory.find(i => i.id === id);
  const sanitizedFields = { ...updatedFields };
  if (sanitizedFields.quantity !== undefined) {
   sanitizedFields.quantity = roundQty(Math.max(0, safeNumber(sanitizedFields.quantity, 0)));
  }
  if (sanitizedFields.unitValue !== undefined) {
   sanitizedFields.unitValue = roundCurrency(Math.max(0, safeNumber(sanitizedFields.unitValue, 0)));
  }
  if (sanitizedFields.minQuantity !== undefined) {
   sanitizedFields.minQuantity = roundQty(Math.max(0, safeNumber(sanitizedFields.minQuantity, 0)));
  }
  const updated = inventory.map(i => i.id === id ? { ...i, ...sanitizedFields } : i);
  setInventory(updated);
  saveToLocal('inventory', updated);

  const itemAfter = updated.find(i => i.id === id);
  if (itemBefore && itemAfter && updatedFields.quantity !== undefined && updatedFields.quantity !== itemBefore.quantity) {
   const newQty = itemAfter.quantity;
   const minQty = itemAfter.minQuantity;
   if (newQty === 0 && itemBefore.quantity > 0) {
    addNotification(
     "🚨 Estoque Crítico",
     `O insumo "${itemAfter.name}" está totalmente esgotado (0 ${itemAfter.unit}). Providencie a reposição imediata!`,
     "critical_stock"
    );
    addAgendaActivity({
     time: '11:00',
     date: new Date().toISOString().split('T')[0],
     title: `COMPRA URGENTE: Reposição do insumo ESGOTADO "${itemAfter.name}"`,
     type: 'purchase',
     status: 'Pendente'
    });
   } else if (newQty <= minQty && itemBefore.quantity > minQty) {
    addNotification(
     "⚠️ Estoque Baixo",
     `O insumo "${itemAfter.name}" atingiu o nível mínimo. Quantidade atual: ${newQty} ${itemAfter.unit} (Mínimo: ${minQty} ${itemAfter.unit}).`,
     "low_stock"
    );
    addAgendaActivity({
     time: '11:00',
     date: new Date().toISOString().split('T')[0],
     title: `Compra: Reposição do insumo com estoque baixo "${itemAfter.name}"`,
     type: 'purchase',
     status: 'Pendente'
    });
   }
  }
 };

 const deleteInventoryItem = (id: string) => {
 // Soft delete
 const updated = inventory.map(i => i.id === id ? { ...i, isDeleted: true } : i);
 setInventory(updated);
 saveToLocal('inventory', updated);
 };

 const adjustStock = (id: string, amount: number, notes: string, category: string, contactName: string, newUnitValue?: number, customExpenseValue?: number) => {
 const target = inventory.find(i => i.id === id);
 if (!target) return;

 const safeAmount = safeNumber(amount, 0);
 if (safeAmount === 0) return;

 const newQty = roundQty(Math.max(0, target.quantity + safeAmount));
 const updatedFields: Partial<InventoryItem> = { quantity: newQty };
 if (safeAmount > 0 && newUnitValue !== undefined && newUnitValue > 0) {
  updatedFields.unitValue = calculateWeightedAverageCost(target.quantity, target.unitValue, safeAmount, newUnitValue);
 } else if (newUnitValue !== undefined && newUnitValue > 0) {
  updatedFields.unitValue = roundCurrency(newUnitValue);
 }
 updateInventoryItem(id, updatedFields);

 // Generate audit log
 addAuditLog({
  user: user?.name || 'Administrador',
  action: `Ajustou estoque de "${target.name}": de ${target.quantity} para ${newQty} ${target.unit} (Ajuste: ${amount > 0 ? '+' : ''}${amount}). Obs: ${notes || 'Sem observações'}`,
  module: 'inventory'
 });

 // Record financial transaction if buying stock
 if (safeAmount > 0) {
 const value = customExpenseValue !== undefined && customExpenseValue > 0
  ? customExpenseValue
  : safeAmount * (newUnitValue || target.unitValue);
 addTransaction({
 type: 'expense',
 category: 'Compra de Matéria-Prima',
 contactName: contactName || target.supplier || 'Fornecedor Diverso',
 value: roundCurrency(value),
 date: new Date().toISOString().split('T')[0],
 paymentMethod: 'Pix',
 notes: `Estoque+: ${safeAmount} ${target.unit} de ${target.name}. Obs: ${notes}`
 });
 } else if (safeAmount < 0) {
    addTransaction({
      type: 'expense',
      category: 'Perda/Ajuste de Estoque',
      contactName: contactName || 'Ateliê Sagrado',
      value: 0,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Outros',
      notes: `Estoque-: ${Math.abs(safeAmount)} ${target.unit} de ${target.name}. Obs: ${notes}`
    });
  } else if (false) {
 // Just stock correction/reduction log
 }
 };

 // PRODUCTS CRUD
 const addProduct = (productData: Omit<Product, 'id' | 'createdAt'>) => {
 const newProduct: Product = {
 ...productData,
 tenantId: (productData as any).tenantId || currentTenantId,
 id: 'prod_' + Date.now(),
 createdAt: new Date().toISOString()
 };
 const updated = [newProduct, ...products];
 setProducts(updated);
 saveToLocal('products', updated);
 };

 const updateProduct = (id: string, updatedFields: Partial<Product>) => {
 const updated = products.map(p => p.id === id ? { ...p, ...updatedFields } : p);
 setProducts(updated);
 saveToLocal('products', updated);
 };

 const deleteProduct = (id: string) => {
 const updated = products.map(p => p.id === id ? { ...p, isDeleted: true } : p);
 setProducts(updated);
 saveToLocal('products', updated);
 };

 // QUOTES CRUD
 const addQuote = (quoteData: Omit<Quote, 'id' | 'createdAt'>) => {
  const snapshot = {
    companyName: settings.companyName || 'Ateliê Sagrado',
    logo: settings.logo || '',
    address: settings.address || '',
    phone: settings.phone || '',
    email: settings.email || '',
    primaryColor: settings.primaryColor || '#D4AF37',
    laborHourlyRate: settings.laborHourlyRate || 0,
    indirectCosts: settings.indirectCosts || 0
  };
 const newQuote: Quote = {
 ...quoteData,
 tenantId: (quoteData as any).tenantId || currentTenantId,
 id: 'quote_' + Date.now(),
 createdAt: new Date().toISOString()
 };
 newQuote.snapshot = snapshot;
  const updated = [newQuote, ...quotes];
 setQuotes(updated);
 saveToLocal('quotes', updated);

 addNotification(
  "📝 Novo Orçamento",
  `Orçamento para o cliente "${quoteData.clientName}" registrado no valor de R$ ${quoteData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Insumos reservados para orçamento com sucesso!`,
  "info"
 );
 };

 const updateQuote = (id: string, updatedFields: Partial<Quote>) => {
 const updated = quotes.map(q => q.id === id ? { ...q, ...updatedFields } : q);
 setQuotes(updated);
 saveToLocal('quotes', updated);
 };

 const deleteQuote = (id: string) => {
 const updated = quotes.map(q => q.id === id ? { ...q, isDeleted: true } : q);
 setQuotes(updated);
 saveToLocal('quotes', updated);
 };

 const duplicateQuote = (id: string) => {
 const original = quotes.find(q => q.id === id);
 if (!original) return;

 const duplicated: Quote = {
 ...original,
 id: 'quote_' + Date.now(),
 status: 'pending',
 date: new Date().toISOString().split('T')[0],
 createdAt: new Date().toISOString()
 };
 const updated = [duplicated, ...quotes];
 setQuotes(updated);
 saveToLocal('quotes', updated);
 };

 const convertToOrder = (quoteId: string): { success: boolean; error?: string; missingMaterials?: { name: string; required: number; available: number; unit: string }[] } => {
 const quote = quotes.find(q => q.id === quoteId);
 if (!quote) return { success: false, error: 'Orçamento não encontrado.' };

 // 1. Check material requirements and inventory
 const materialRequirements: Record<string, { required: number; name: string; unit: string; available: number }> = {};

 for (const item of quote.items) {
 const prod = products.find(p => p.id === item.productId);
 if (prod && prod.composition) {
 for (const comp of prod.composition) {
 const mat = inventory.find(m => m.id === comp.materialId);
 if (mat) {
 const needed = comp.quantity * item.quantity;
 if (!materialRequirements[comp.materialId]) {
 materialRequirements[comp.materialId] = {
 required: 0,
 name: mat.name,
 unit: mat.unit,
 available: mat.quantity
 };
 }
 materialRequirements[comp.materialId].required += needed;
 }
 }
 }
 }

 // Verify if any requirement exceeds available stock
 const missing: { name: string; required: number; available: number; unit: string }[] = [];
 for (const matId of Object.keys(materialRequirements)) {
 const req = materialRequirements[matId];
 if (req.required > req.available) {
 missing.push({
 name: req.name,
 required: Number(req.required.toFixed(2)),
 available: Number(req.available.toFixed(2)),
 unit: req.unit
 });
 }
 }

 if (missing.length > 0) {
 return {
 success: false,
 error: 'Insumos insuficientes em estoque para realizar a conversão.',
 missingMaterials: missing
 };
 }

 // 2. Deduct materials from Inventory for this converted order
 let updatedInventory = [...inventory];
 quote.items.forEach(item => {
 const prod = products.find(p => p.id === item.productId);
 if (prod && prod.composition) {
 prod.composition.forEach(comp => {
 updatedInventory = updatedInventory.map(m => {
 if (m.id === comp.materialId) {
 const deductedQty = roundQty(comp.quantity * item.quantity);
 return {
 ...m,
 quantity: roundQty(Math.max(0, m.quantity - deductedQty))
 };
 }
 return m;
 });
 });
 }
 });
 setInventory(updatedInventory);
 saveToLocal('inventory', updatedInventory);

 // 3. Update quote status to converted
 updateQuote(quoteId, { status: 'converted' });

 // 4. Generate new Order
  const snapshot: DocumentSnapshot = quote.snapshot || {
    companyName: settings.companyName || 'Ateliê Sagrado',
    logo: settings.logo || '',
    address: settings.address || '',
    phone: settings.phone || '',
    email: settings.email || '',
    primaryColor: settings.primaryColor || '#D4AF37',
    laborHourlyRate: settings.laborHourlyRate || 0,
    indirectCosts: settings.indirectCosts || 0
  };
 const year = new Date().getFullYear();
 const orderNum = `PED-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
 const newOrder: Order = {
 id: 'order_' + Date.now(),
 tenantId: quote.tenantId || currentTenantId,
 orderNumber: orderNum,
 clientId: quote.clientId,
 clientName: quote.clientName,
 items: quote.items.map(i => ({
 productId: i.productId,
 productName: i.productName,
 quantity: i.quantity,
 price: i.unitPrice,
 total: i.total
 })),
 totalValue: quote.total,
 date: new Date().toISOString().split('T')[0],
 dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days default
 status: 'received',
 productionProgress: 0,
 timeline: [
 { 
 id: 't_' + Date.now(), 
 date: new Date().toISOString().replace('T', ' ').substring(0, 16), 
 description: `Pedido gerado a partir do orçamento Q-${quoteId.substring(6, 10)}`, 
 user: user?.name || "Ateliê Sagrado" 
 }
 ],
 createdAt: new Date().toISOString()
 };

 newOrder.snapshot = snapshot;
  const updatedOrders = [newOrder, ...orders];
 setOrders(updatedOrders);
 saveToLocal('orders', updatedOrders);

 // 5. Register a Production task for each item in the order
 const newTasks: ProductionTask[] = quote.items.map((item, idx) => {
 const prod = products.find(p => p.id === item.productId);
 return {
 id: `task_${Date.now()}_${idx}`,
 tenantId: quote.tenantId || currentTenantId,
 orderId: newOrder.id,
 orderNumber: newOrder.orderNumber,
 productId: item.productId,
 productName: item.productName,
 status: 'todo',
 responsible: 'Não Atribuído',
 startDate: null,
 endDate: null,
 timeSpentMinutes: 0,
 totalEstimatedMinutes: (prod?.productionTimeMin || 30) * item.quantity,
 createdAt: new Date().toISOString()
 };
 });

 const updatedTasks = [...newTasks, ...productionTasks];
 setProductionTasks(updatedTasks);
 saveToLocal('production_tasks', updatedTasks);

 // 6. Automatically post Financial Receipt (since we assume converting a quote into order is a confirmed sales value)
 addTransaction({
 type: 'income',
 category: 'Venda de Produtos',
 contactName: quote.clientName,
 value: quote.total,
 date: new Date().toISOString().split('T')[0],
 paymentMethod: 'Pix',
 notes: `Venda Ref. Pedido ${orderNum}`
 });

 addNotification(
  "🛒 Orçamento Convertido",
  `O orçamento do cliente "${quote.clientName}" foi convertido com sucesso no Pedido ${orderNum}. Insumos deduzidos do estoque.`,
  "success"
 );

 // Generate automated audit log & agenda activity
 addAuditLog({
  user: user?.name || 'Administrador',
  action: `Converteu o Orçamento Q-${quoteId.substring(6, 10)} no Pedido de Venda ${orderNum} para o cliente "${quote.clientName}"`,
  module: 'quotes'
 });

 addAgendaActivity({
  time: '09:00',
  date: new Date().toISOString().split('T')[0],
  title: `Produção: Iniciar separação de materiais para o Pedido ${orderNum} (${quote.clientName})`,
  type: 'production',
  status: 'Pendente'
 });

 return { success: true };
 };

 // ORDERS CRUD
 const addOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'orderNumber' | 'timeline'>): { success: boolean; error?: string; missingMaterials?: { name: string; required: number; available: number; unit: string }[] } => {
 // 1. Check material requirements and inventory
 const materialRequirements: Record<string, { required: number; name: string; unit: string; available: number }> = {};

 for (const item of orderData.items) {
 const prod = products.find(p => p.id === item.productId);
 if (prod && prod.composition) {
 for (const comp of prod.composition) {
 const mat = inventory.find(m => m.id === comp.materialId);
 if (mat) {
 const needed = comp.quantity * item.quantity;
 if (!materialRequirements[comp.materialId]) {
 materialRequirements[comp.materialId] = {
 required: 0,
 name: mat.name,
 unit: mat.unit,
 available: mat.quantity
 };
 }
 materialRequirements[comp.materialId].required += needed;
 }
 }
 }
 }

 // Verify if any requirement exceeds available stock
 const missing: { name: string; required: number; available: number; unit: string }[] = [];
 for (const matId of Object.keys(materialRequirements)) {
 const req = materialRequirements[matId];
 if (req.required > req.available) {
 missing.push({
 name: req.name,
 required: Number(req.required.toFixed(2)),
 available: Number(req.available.toFixed(2)),
 unit: req.unit
 });
 }
 }

 if (missing.length > 0) {
 return {
 success: false,
 error: 'Insumos insuficientes em estoque para realizar a venda do pedido.',
 missingMaterials: missing
 };
 }

 const year = new Date().getFullYear();
 const orderNum = `PED-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
 const newOrder: Order = {
 ...orderData,
 tenantId: (orderData as any).tenantId || currentTenantId,
 id: 'order_' + Date.now(),
 orderNumber: orderNum,
 timeline: [
 {
 id: 't_' + Date.now(),
 date: new Date().toISOString().replace('T', ' ').substring(0, 16),
 description: "Pedido recebido e cadastrado no sistema",
 user: user?.name || "Ateliê Sagrado"
 }
 ],
 createdAt: new Date().toISOString()
 };
 newOrder.snapshot = {
    companyName: settings.companyName || 'Ateliê Sagrado',
    logo: settings.logo || '',
    address: settings.address || '',
    phone: settings.phone || '',
    email: settings.email || '',
    primaryColor: settings.primaryColor || '#D4AF37',
    laborHourlyRate: settings.laborHourlyRate || 0,
    indirectCosts: settings.indirectCosts || 0
  };
  const updated = [newOrder, ...orders];
 setOrders(updated);
 saveToLocal('orders', updated);

 // Register Production tasks for items
 const newTasks: ProductionTask[] = orderData.items.map((item, idx) => {
 const prod = products.find(p => p.id === item.productId);
 return {
 id: `task_${Date.now()}_${idx}`,
 tenantId: (orderData as any).tenantId || currentTenantId,
 orderId: newOrder.id,
 orderNumber: newOrder.orderNumber,
 productId: item.productId,
 productName: item.productName,
 status: 'todo',
 responsible: 'Não Atribuído',
 startDate: null,
 endDate: null,
 timeSpentMinutes: 0,
 totalEstimatedMinutes: (prod?.productionTimeMin || 30) * item.quantity,
 createdAt: new Date().toISOString()
 };
 });
 const updatedTasks = [...newTasks, ...productionTasks];
 setProductionTasks(updatedTasks);
 saveToLocal('production_tasks', updatedTasks);

 // Deduct materials from Inventory for this order in batch
 let updatedInventory = [...inventory];
 orderData.items.forEach(item => {
 const prod = products.find(p => p.id === item.productId);
 if (prod && prod.composition) {
 prod.composition.forEach(comp => {
 updatedInventory = updatedInventory.map(m => {
 if (m.id === comp.materialId) {
 const deductedQty = roundQty(comp.quantity * item.quantity);
 return {
 ...m,
 quantity: roundQty(Math.max(0, m.quantity - deductedQty))
 };
 }
 return m;
 });
 });
 }
 });
 setInventory(updatedInventory);
 saveToLocal('inventory', updatedInventory);

 // Trigger notifications for depleted/low items based on the batch deduction
 updatedInventory.forEach(itemAfter => {
 const itemBefore = inventory.find(i => i.id === itemAfter.id);
 if (itemBefore && itemAfter.quantity < itemBefore.quantity) {
 const newQty = itemAfter.quantity;
 const minQty = itemAfter.minQuantity;
 if (newQty === 0 && itemBefore.quantity > 0) {
 addNotification(
 "🚨 Estoque Crítico",
 `O insumo "${itemAfter.name}" está totalmente esgotado (0 ${itemAfter.unit}). Providencie a reposição imediata!`,
 "critical_stock"
 );
 } else if (newQty <= minQty && itemBefore.quantity > minQty) {
 addNotification(
 "⚠️ Estoque Baixo",
 `O insumo "${itemAfter.name}" atingiu o nível mínimo. Quantidade atual: ${newQty} ${itemAfter.unit} (Mínimo: ${minQty} ${itemAfter.unit}).`,
 "low_stock"
 );
 }
 }
 });

 // Add financial entry
 addTransaction({
 type: 'income',
 category: 'Venda de Produtos',
 contactName: orderData.clientName,
 value: orderData.totalValue,
 date: new Date().toISOString().split('T')[0],
 paymentMethod: 'Pix',
 notes: `Venda Ref. Pedido ${orderNum}`
 });

 addNotification(
  "🛍️ Novo Pedido de Venda",
  `Pedido ${orderNum} para o cliente "${orderData.clientName}" foi cadastrado com sucesso (R$ ${orderData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Insumos deduzidos do estoque.`,
  "success"
 );

 // Generate automated audit log & agenda activity
 addAuditLog({
  user: user?.name || 'Administrador',
  action: `Criou o Pedido de Venda ${orderNum} para o cliente "${orderData.clientName}" no valor de R$ ${orderData.totalValue.toFixed(2)}`,
  module: 'orders'
 });

 addAgendaActivity({
  time: '09:00',
  date: new Date().toISOString().split('T')[0],
  title: `Produção: Iniciar separação de materiais para o Pedido ${orderNum} (${orderData.clientName})`,
  type: 'production',
  status: 'Pendente'
 });

 return { success: true };
 };

 const updateOrder = (id: string, updatedFields: Partial<Order>) => {
  let orderProgress = updatedFields.productionProgress;

  // Auto-calculate progress based on status if not provided
  if (updatedFields.status && orderProgress === undefined) {
   if (updatedFields.status === 'completed') {
    orderProgress = 100;
   } else if (updatedFields.status === 'ready') {
    orderProgress = 90;
   } else if (updatedFields.status === 'packing') {
    orderProgress = 80;
   } else if (updatedFields.status === 'finishing') {
    orderProgress = 65;
   } else if (updatedFields.status === 'production') {
    orderProgress = 40;
   } else if (updatedFields.status === 'approved') {
    orderProgress = 15;
   } else if (updatedFields.status === 'received') {
    orderProgress = 0;
   }
  }

  const fieldsToUpdate: Partial<Order> = {
   ...updatedFields,
   ...(orderProgress !== undefined ? { productionProgress: orderProgress } : {})
  };

  if (updatedFields.status === 'completed') {
   fieldsToUpdate.archivedAt = new Date().toISOString();
  }

  const updated = orders.map(o => {
   if (o.id === id) {
    const newTimeline = [...o.timeline];
    if (fieldsToUpdate.status && fieldsToUpdate.status !== o.status) {
     newTimeline.push({
      id: 't_' + Date.now() + '_status',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      description: `Status do pedido alterado para "${getStatusLabel(fieldsToUpdate.status)}"`,
      user: user?.name || "Ateliê Sagrado"
     });
    }
    return {
     ...o,
     ...fieldsToUpdate,
     timeline: newTimeline
    };
   }
   return o;
  });
  setOrders(updated);
  saveToLocal('orders', updated);

  const originalOrder = orders.find(o => o.id === id);
  if (originalOrder && fieldsToUpdate.isArchived !== undefined && fieldsToUpdate.isArchived !== originalOrder.isArchived) {
    if (fieldsToUpdate.isArchived) {
      addAuditLog({
        user: user?.name || 'Administrador',
        action: `Arquivou o pedido ${originalOrder.orderNumber} do cliente "${originalOrder.clientName}"`,
        module: 'production'
      });
    } else {
      addAuditLog({
        user: user?.name || 'Administrador',
        action: `Restaurou o pedido ${originalOrder.orderNumber} do cliente "${originalOrder.clientName}" do histórico de arquivados`,
        module: 'production'
      });
    }
  }
  if (originalOrder && fieldsToUpdate.status && fieldsToUpdate.status !== originalOrder.status) {
   const status = fieldsToUpdate.status;

   // Financial Hub Integration: Auto-register Production Costs
   if (status === 'production') {
    let rawMaterialCost = 0;
    let laborCost = 0;
    let indirectCost = 0;

    originalOrder.items.forEach(item => {
     const prod = products.find(p => p.id === item.productId);
     if (prod) {
      if (prod.composition) {
       prod.composition.forEach(comp => {
        const mat = inventory.find(m => m.id === comp.materialId);
        if (mat) {
         rawMaterialCost += (mat.unitValue || 0) * comp.quantity * item.quantity;
        }
       });
      }
      laborCost += (prod.productionTimeMin || 0) * (settings.laborHourlyRate / 60) * item.quantity;
     }
     indirectCost += (settings.indirectCosts || 0) * item.quantity;
    });

    if (rawMaterialCost > 0) {
     addTransaction({
      type: 'expense',
      category: 'Custo de Matéria-Prima (Produção)',
      contactName: originalOrder.clientName,
      value: Number(rawMaterialCost.toFixed(2)),
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Pix',
      notes: `Dedução de insumos para fabricação do Pedido ${originalOrder.orderNumber}`
     });
    }

    if (laborCost > 0) {
     addTransaction({
      type: 'expense',
      category: 'Custo de Mão de Obra (Produção)',
      contactName: originalOrder.clientName,
      value: Number(laborCost.toFixed(2)),
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Pix',
      notes: `Mão de obra direta alocada para o Pedido ${originalOrder.orderNumber}`
     });
    }

    if (indirectCost > 0) {
     addTransaction({
      type: 'expense',
      category: 'Custos Indiretos (Produção)',
      contactName: originalOrder.clientName,
      value: Number(indirectCost.toFixed(2)),
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Pix',
      notes: `Rateio de custos indiretos atribuídos ao Pedido ${originalOrder.orderNumber}`
     });
    }

    addNotification(
     "⚡ Custos de Produção Lançados",
     `O Pedido ${originalOrder.orderNumber} entrou em produção. Custos calculados e lançados no financeiro: Matérias-primas R$ ${rawMaterialCost.toFixed(2)}, Mão de Obra R$ ${laborCost.toFixed(2)}, Custos Indiretos R$ ${indirectCost.toFixed(2)}.`,
     "success"
    );
   }

   if (status === 'completed') {
    addNotification(
     "📦 Pedido Concluído",
     `O Pedido ${originalOrder.orderNumber} do cliente "${originalOrder.clientName}" foi concluído e está disponível para entrega.`,
     "success"
    );
   } else {
    addNotification(
     "ℹ️ Status de Pedido",
     `O Pedido ${originalOrder.orderNumber} avançou para o status "${getStatusLabel(status)}".`,
     "info"
    );
   }
  }

  // Sync to production tasks
  if (fieldsToUpdate.status) {
   let targetTaskStatus: ProductionStatus | null = null;
   if (fieldsToUpdate.status === 'completed') {
    targetTaskStatus = 'done';
   } else if (fieldsToUpdate.status === 'finishing' || fieldsToUpdate.status === 'packing' || fieldsToUpdate.status === 'ready') {
    targetTaskStatus = 'finishing';
   } else if (fieldsToUpdate.status === 'production') {
    targetTaskStatus = 'producing';
   } else if (fieldsToUpdate.status === 'received' || fieldsToUpdate.status === 'approved') {
    targetTaskStatus = 'todo';
   }

   if (targetTaskStatus) {
    const updatedT = productionTasks.map(t => {
     if (t.orderId === id) {
      if (targetTaskStatus === 'todo') {
       return { ...t, status: 'todo' as ProductionStatus, startDate: null, endDate: null };
      } else if (targetTaskStatus === 'done' && t.status !== 'done') {
       return { ...t, status: 'done' as ProductionStatus, endDate: new Date().toISOString().split('T')[0] };
      } else if (targetTaskStatus === 'finishing' && t.status !== 'done' && t.status !== 'finishing') {
       return { ...t, status: 'finishing' as ProductionStatus };
      } else if (targetTaskStatus === 'producing' && t.status === 'todo') {
       return { ...t, status: 'producing' as ProductionStatus, startDate: new Date().toISOString().split('T')[0] };
      }
     }
     return t;
    });
    setProductionTasks(updatedT);
    saveToLocal('production_tasks', updatedT);
   }
  }
 };

 const deleteOrder = (id: string) => {
   const order = orders.find(o => o.id === id);
   if (!order) return;

   // Refund stock if deleting an active, non-cancelled order
   if (!order.isCancelled && !order.isDeleted) {
     let updatedInventory = [...inventory];
     order.items.forEach(item => {
       const prod = products.find(p => p.id === item.productId);
       if (prod && prod.composition) {
         prod.composition.forEach(comp => {
           updatedInventory = updatedInventory.map(m => {
             if (m.id === comp.materialId) {
               const refundQty = comp.quantity * item.quantity;
               return {
                 ...m,
                 quantity: Number((m.quantity + refundQty).toFixed(2))
               };
             }
             return m;
           });
         });
       }
     });
     setInventory(updatedInventory);
     saveToLocal('inventory', updatedInventory);

     // Soft-delete transactions associated with this order number
     const updatedTransactions = transactions.map(t => {
       if (t.notes && t.notes.includes(order.orderNumber)) {
         return { ...t, isDeleted: true };
       }
       return t;
     });
     setTransactions(updatedTransactions);
     saveToLocal('transactions', updatedTransactions);

     // Remove associated production tasks
     const updatedTasks = productionTasks.filter(t => t.orderId !== id);
     setProductionTasks(updatedTasks);
     saveToLocal('production_tasks', updatedTasks);
   }

   const updated = orders.map(o => o.id === id ? { ...o, isDeleted: true } : o);
   setOrders(updated);
   saveToLocal('orders', updated);
 };

 const cancelOrder = (orderId: string) => {
   const order = orders.find(o => o.id === orderId);
   if (!order || order.isCancelled) return;

   // 1. Register complete cancellation action in timeline
   const cancelledTimeline = [
     ...order.timeline,
     {
       id: 't_' + Date.now() + '_cancel',
       date: new Date().toISOString().replace('T', ' ').substring(0, 16),
       description: `Pedido cancelado pelo usuário. Insumos estornados e receitas estornadas.`,
       user: user?.name || "Ateliê Sagrado"
     }
   ];

   // 2. Automatically refund/restore consumed or reserved materials back to inventory
   let updatedInventory = [...inventory];
   order.items.forEach(item => {
     const prod = products.find(p => p.id === item.productId);
     if (prod && prod.composition) {
       prod.composition.forEach(comp => {
         updatedInventory = updatedInventory.map(m => {
           if (m.id === comp.materialId) {
             const refundQty = comp.quantity * item.quantity;
             return {
               ...m,
               quantity: Number((m.quantity + refundQty).toFixed(2))
             };
           }
           return m;
         });
       });
     }
   });
   setInventory(updatedInventory);
   saveToLocal('inventory', updatedInventory);

   // 3. Financial Flow update: Soft-delete/remove any transactions (income/expense) linked to this order number
   const updatedTransactions = transactions.map(t => {
     if (t.notes && t.notes.includes(order.orderNumber)) {
       return { ...t, isDeleted: true };
     }
     return t;
   });
   setTransactions(updatedTransactions);
   saveToLocal('transactions', updatedTransactions);

   // 4. Update the order object to reflect cancelled state
   const updatedOrders = orders.map(o => {
     if (o.id === orderId) {
       return {
         ...o,
         status: 'cancelled' as OrderStatus,
         isCancelled: true,
         timeline: cancelledTimeline
       };
     }
     return o;
   });
   setOrders(updatedOrders);
   saveToLocal('orders', updatedOrders);

   // 5. Remove associated production tasks
     addAuditLog({
      user: user?.name || 'Administrador',
      action: `Cancelou o Pedido de Venda ${order.orderNumber} de "${order.clientName}". Insumos devolvidos ao estoque e receitas estornadas.`,
      module: 'orders'
    });

  const updatedTasks = productionTasks.filter(t => t.orderId !== orderId);
   setProductionTasks(updatedTasks);
   saveToLocal('production_tasks', updatedTasks);

   // 6. Send system notifications
   addNotification(
     "❌ Pedido Cancelado",
     `O Pedido ${order.orderNumber} do cliente "${order.clientName}" foi cancelado. Insumos devolvidos ao estoque e receitas correspondentes estornadas.`,
     "info"
   );
 };

 const addOrderTimeline = (orderId: string, description: string) => {
 const updated = orders.map(o => {
 if (o.id === orderId) {
 return {
 ...o,
 timeline: [
 ...o.timeline,
 {
 id: 't_' + Date.now(),
 date: new Date().toISOString().replace('T', ' ').substring(0, 16),
 description,
 user: user?.name || "Ateliê Sagrado"
 }
 ]
 };
 }
 return o;
 });
 setOrders(updated);
 saveToLocal('orders', updated);
 };

 // PRODUCTION TASKS
 const updateProductionTask = (id: string, updatedFields: Partial<ProductionTask>) => {
  let targetOrderId = "";
  let affectedTask: ProductionTask | null = null;

  const updated = productionTasks.map(t => {
   if (t.id === id) {
    affectedTask = { ...t, ...updatedFields };
    targetOrderId = t.orderId;
    return affectedTask;
   }
   return t;
  });

  setProductionTasks(updated);
  saveToLocal('production_tasks', updated);

  if (!affectedTask || !targetOrderId) return;

  setTimeout(() => {
   const parentOrder = orders.find(o => o.id === targetOrderId);
   if (!parentOrder) return;

   const siblings = updated.filter(pt => pt.orderId === targetOrderId);
   const siblingsCount = siblings.length;
   
   if (siblingsCount > 0) {
    const doneCount = siblings.reduce((acc, curr) => {
     if (curr.status === 'done') return acc + 1;
     if (curr.status === 'finishing') return acc + 0.85;
     if (curr.status === 'producing') return acc + 0.5;
     return acc;
    }, 0);
    const progress = Math.round((doneCount / siblingsCount) * 100);

    let orderStatus: OrderStatus = parentOrder.status;
    if (progress === 100) {
     orderStatus = 'completed';
    } else if (progress >= 85) {
     orderStatus = 'finishing';
    } else if (progress > 0) {
     if (parentOrder.status === 'received' || parentOrder.status === 'approved') {
      orderStatus = 'production';
     }
    }

    const timelineEventsToAdd: OrderTimelineEvent[] = [];
    const currentTask = productionTasks.find(pt => pt.id === id);
    
    if (updatedFields.status && currentTask && updatedFields.status !== currentTask.status) {
     const statusLabels: Record<ProductionStatus, string> = {
      todo: 'Pendente',
      producing: 'Em Produção',
      finishing: 'Em Acabamento',
      done: 'Concluído'
     };
     const newStatusLabel = statusLabels[updatedFields.status] || updatedFields.status;
     timelineEventsToAdd.push({
      id: 't_' + Date.now() + '_task_status',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      description: `Chão de Fábrica: Item "${affectedTask!.productName}" avançou para o estágio "${newStatusLabel}"`,
      user: user?.name || "Ateliê Sagrado"
     });

     if (updatedFields.status === 'done') {
      addNotification(
       "🛠️ Item Concluído",
       `Chão de Fábrica: O item "${affectedTask!.productName}" do Pedido ${affectedTask!.orderNumber} foi concluído!`,
       "success"
      );

      // Generate automated audit log & agenda activity for quality inspection
      addAuditLog({
       user: user?.name || 'Administrador',
       action: `Concluiu a fabricação do item "${affectedTask!.productName}" do Pedido ${affectedTask!.orderNumber}`,
       module: 'production'
      });

      addAgendaActivity({
       time: '15:00',
       date: new Date().toISOString().split('T')[0],
       title: `Controle de Qualidade: Item "${affectedTask!.productName}" do Pedido ${affectedTask!.orderNumber}`,
       type: 'production',
       status: 'Pendente'
      });
     } else {
      addNotification(
       "🛠️ Produção Avançou",
       `Chão de Fábrica: O item "${affectedTask!.productName}" do Pedido ${affectedTask!.orderNumber} avançou para "${newStatusLabel}".`,
       "info"
      );
     }
    }

    if (updatedFields.responsible && currentTask && updatedFields.responsible !== currentTask.responsible) {
     timelineEventsToAdd.push({
      id: 't_' + Date.now() + '_task_resp',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      description: `Chão de Fábrica: Artesão "${updatedFields.responsible}" vinculado como responsável pelo item "${affectedTask!.productName}"`,
      user: user?.name || "Ateliê Sagrado"
     });
    }

    const updatedOrders = orders.map(o => {
     if (o.id === targetOrderId) {
      return {
       ...o,
       productionProgress: progress,
       status: orderStatus,
       timeline: [...o.timeline, ...timelineEventsToAdd]
      };
     }
     return o;
    });

    setOrders(updatedOrders);
    saveToLocal('orders', updatedOrders);
   }
  }, 50);
 };

 // FINANCIAL TRANSACTIONS CRUD
 const addTransaction = (transData: Omit<FinancialTransaction, 'id' | 'createdAt'>) => {
 const safeVal = roundCurrency(Math.max(0, safeNumber(transData.value, 0)));
 const newTrans: FinancialTransaction = {
 ...transData,
 value: safeVal,
 tenantId: (transData as any).tenantId || currentTenantId,
 id: 'trans_' + Date.now(),
 createdAt: new Date().toISOString()
 };
 const updated = [newTrans, ...transactions];
 setTransactions(updated);
 saveToLocal('transactions', updated);
 };

 const updateTransaction = (id: string, updatedFields: Partial<FinancialTransaction>) => {
 const fieldsToUpdate = { ...updatedFields };
 if (fieldsToUpdate.value !== undefined) {
  fieldsToUpdate.value = roundCurrency(Math.max(0, safeNumber(fieldsToUpdate.value, 0)));
 }
 const updated = transactions.map(t => t.id === id ? { ...t, ...fieldsToUpdate } : t);
 setTransactions(updated);
 saveToLocal('transactions', updated);
 };

 const deleteTransaction = (id: string) => {
 const updated = transactions.map(t => t.id === id ? { ...t, isDeleted: true } : t);
 setTransactions(updated);
 saveToLocal('transactions', updated);
 };

 // ----------------------------------------------------
 // CONTAS A PAGAR, CONTAS A RECEBER E GATEWAY HANDLERS
 // ----------------------------------------------------
 const addPayable = async (payableData: Omit<AccountPayable, 'id' | 'createdAt'>) => {
   const token = localStorage.getItem('as_access_token');
   let serverItems: AccountPayable[] | null = null;
   if (token) {
     try {
       const res = await fetch('/api/financial/payables', {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'x-tenant-id': currentTenantId },
         body: JSON.stringify(payableData)
       });
       if (res.ok) {
         serverItems = await res.json();
       }
     } catch (e) {
       console.warn('API offline, saving payable locally');
     }
   }

   if (serverItems && Array.isArray(serverItems)) {
     setPayables(prev => [...serverItems!, ...prev]);
     saveToLocal('payables', [...serverItems, ...payables]);
   } else {
     const count = Math.max(1, payableData.totalInstallments || 1);
     const amount = Number(payableData.amount);
     const instAmount = Math.round((amount / count) * 100) / 100;
     const newItems: AccountPayable[] = [];
     const baseDate = new Date(payableData.dueDate || payableData.issueDate || new Date());

     for (let i = 1; i <= count; i++) {
       const instDueDate = new Date(baseDate);
       instDueDate.setMonth(instDueDate.getMonth() + (i - 1));
       newItems.push({
         ...payableData,
         id: 'pay_' + Date.now() + '_' + i,
         tenantId: currentTenantId,
         description: count > 1 ? `${payableData.description} (${i}/${count})` : payableData.description,
         amount: i === count ? Number((amount - (instAmount * (count - 1))).toFixed(2)) : instAmount,
         paidAmount: 0,
         installmentNumber: i,
         totalInstallments: count,
         status: 'pending',
         dueDate: instDueDate.toISOString().split('T')[0],
         createdAt: new Date().toISOString()
       });
     }
     const updated = [...newItems, ...payables];
     setPayables(updated);
     saveToLocal('payables', updated);
   }

   addNotification("📋 Conta a Pagar Cadastrada", `Título "${payableData.description}" registrado com sucesso.`, "info");
 };

 const updatePayable = async (id: string, updatedFields: Partial<AccountPayable>) => {
   const token = localStorage.getItem('as_access_token');
   if (token) {
     try {
       await fetch(`/api/financial/payables/${id}`, {
         method: 'PUT',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'x-tenant-id': currentTenantId },
         body: JSON.stringify(updatedFields)
       });
     } catch (e) {}
   }
   const updated = payables.map(p => p.id === id ? { ...p, ...updatedFields } : p);
   setPayables(updated);
   saveToLocal('payables', updated);
 };

 const deletePayable = async (id: string) => {
   const token = localStorage.getItem('as_access_token');
   if (token) {
     try {
       await fetch(`/api/financial/payables/${id}`, {
         method: 'DELETE',
         headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': currentTenantId }
       });
     } catch (e) {}
   }
   const updated = payables.filter(p => p.id !== id);
   setPayables(updated);
   saveToLocal('payables', updated);
 };

 const settlePayable = async (id: string, paidAmount: number, paymentDate: string, paymentMethod: string, notes?: string): Promise<{ success: boolean; error?: string }> => {
   const token = localStorage.getItem('as_access_token');
   if (token) {
     try {
       const res = await fetch(`/api/financial/payables/${id}/settle`, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'x-tenant-id': currentTenantId },
         body: JSON.stringify({ paidAmount, paymentDate, paymentMethod, notes })
       });
       if (res.ok) {
         const data = await res.json();
         setPayables(prev => prev.map(p => p.id === id ? { ...p, ...data.payable } : p));
         const trRes = await fetch('/api/financial', { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': currentTenantId } });
         if (trRes.ok) {
           const trData = await trRes.json();
           setTransactions(trData);
           saveToLocal('transactions', trData);
         }
         addNotification("💸 Título Liquidado", `Baixa realizada com sucesso no valor de R$ ${Number(paidAmount).toFixed(2)}.`, "success");
         return { success: true };
       }
     } catch (e) {
       console.warn('API error settling payable, running local fallback', e);
     }
   }

   const target = payables.find(p => p.id === id);
   if (!target) return { success: false, error: 'Título não localizado.' };
   const val = Number(paidAmount) || (target.amount - (target.paidAmount || 0));
   const newPaidAmount = Number(((target.paidAmount || 0) + val).toFixed(2));
   const newStatus = newPaidAmount >= target.amount ? 'paid' : 'partially_paid';

   const updatedPayables = payables.map(p => p.id === id ? {
     ...p,
     paidAmount: newPaidAmount,
     status: newStatus as any,
     paymentDate: paymentDate || new Date().toISOString().split('T')[0],
     paymentMethod: paymentMethod || 'pix'
   } : p);
   setPayables(updatedPayables);
   saveToLocal('payables', updatedPayables);

   addTransaction({
     type: 'expense',
     category: target.category || 'Contas a Pagar',
     contactName: target.supplierName,
     value: val,
     date: paymentDate || new Date().toISOString().split('T')[0],
     paymentMethod: paymentMethod || 'Pix',
     notes: `Baixa de título #${target.description} - ${notes || 'Liquidação'}`.trim()
   });

   addNotification("💸 Título Liquidado", `Baixa registrada no valor de R$ ${val.toFixed(2)}.`, "success");
   return { success: true };
 };

 const addReceivable = async (recData: Omit<AccountReceivable, 'id' | 'createdAt'>) => {
   const token = localStorage.getItem('as_access_token');
   let serverItems: AccountReceivable[] | null = null;
   if (token) {
     try {
       const res = await fetch('/api/financial/receivables', {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'x-tenant-id': currentTenantId },
         body: JSON.stringify(recData)
       });
       if (res.ok) {
         serverItems = await res.json();
       }
     } catch (e) {
       console.warn('API offline, saving receivable locally');
     }
   }

   if (serverItems && Array.isArray(serverItems)) {
     setReceivables(prev => [...serverItems!, ...prev]);
     saveToLocal('receivables', [...serverItems, ...receivables]);
   } else {
     const count = Math.max(1, recData.totalInstallments || 1);
     const amount = Number(recData.amount);
     const instAmount = Math.round((amount / count) * 100) / 100;
     const newItems: AccountReceivable[] = [];
     const baseDate = new Date(recData.dueDate || recData.issueDate || new Date());

     for (let i = 1; i <= count; i++) {
       const instDueDate = new Date(baseDate);
       instDueDate.setMonth(instDueDate.getMonth() + (i - 1));
       const instId = 'rec_' + Date.now() + '_' + i;
       newItems.push({
         ...recData,
         id: instId,
         tenantId: currentTenantId,
         description: count > 1 ? `${recData.description} (${i}/${count})` : recData.description,
         amount: i === count ? Number((amount - (instAmount * (count - 1))).toFixed(2)) : instAmount,
         receivedAmount: 0,
         installmentNumber: i,
         totalInstallments: count,
         status: 'pending',
         dueDate: instDueDate.toISOString().split('T')[0],
         paymentLink: `https://pay.ateliesagrado.com/c/${instId}`,
         createdAt: new Date().toISOString()
       });
     }
     const updated = [...newItems, ...receivables];
     setReceivables(updated);
     saveToLocal('receivables', updated);
   }

   addNotification("💰 Conta a Receber Cadastrada", `Título "${recData.description}" registrado com sucesso.`, "info");
 };

 const updateReceivable = async (id: string, updatedFields: Partial<AccountReceivable>) => {
   const token = localStorage.getItem('as_access_token');
   if (token) {
     try {
       await fetch(`/api/financial/receivables/${id}`, {
         method: 'PUT',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'x-tenant-id': currentTenantId },
         body: JSON.stringify(updatedFields)
       });
     } catch (e) {}
   }
   const updated = receivables.map(r => r.id === id ? { ...r, ...updatedFields } : r);
   setReceivables(updated);
   saveToLocal('receivables', updated);
 };

 const deleteReceivable = async (id: string) => {
   const token = localStorage.getItem('as_access_token');
   if (token) {
     try {
       await fetch(`/api/financial/receivables/${id}`, {
         method: 'DELETE',
         headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': currentTenantId }
       });
     } catch (e) {}
   }
   const updated = receivables.filter(r => r.id !== id);
   setReceivables(updated);
   saveToLocal('receivables', updated);
 };

 const settleReceivable = async (id: string, receivedAmount: number, receiptDate: string, paymentMethod: string, notes?: string): Promise<{ success: boolean; error?: string }> => {
   const token = localStorage.getItem('as_access_token');
   if (token) {
     try {
       const res = await fetch(`/api/financial/receivables/${id}/settle`, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'x-tenant-id': currentTenantId },
         body: JSON.stringify({ receivedAmount, receiptDate, paymentMethod, notes })
       });
       if (res.ok) {
         const data = await res.json();
         setReceivables(prev => prev.map(r => r.id === id ? { ...r, ...data.receivable } : r));
         const trRes = await fetch('/api/financial', { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': currentTenantId } });
         if (trRes.ok) {
           const trData = await trRes.json();
           setTransactions(trData);
           saveToLocal('transactions', trData);
         }
         addNotification("✅ Recebimento Confirmado", `Recebimento de R$ ${Number(receivedAmount).toFixed(2)} liquidado.`, "success");
         return { success: true };
       }
     } catch (e) {
       console.warn('API error settling receivable, running local fallback', e);
     }
   }

   const target = receivables.find(r => r.id === id);
   if (!target) return { success: false, error: 'Título não localizado.' };
   const val = Number(receivedAmount) || (target.amount - (target.receivedAmount || 0));
   const newReceived = Number(((target.receivedAmount || 0) + val).toFixed(2));
   const newStatus = newReceived >= target.amount ? 'received' : 'partially_received';

   const updatedReceivables = receivables.map(r => r.id === id ? {
     ...r,
     receivedAmount: newReceived,
     status: newStatus as any,
     receiptDate: receiptDate || new Date().toISOString().split('T')[0],
     paymentMethod: paymentMethod || 'pix'
   } : r);
   setReceivables(updatedReceivables);
   saveToLocal('receivables', updatedReceivables);

   addTransaction({
     type: 'income',
     category: target.category || 'Contas a Receber',
     contactName: target.clientName,
     value: val,
     date: receiptDate || new Date().toISOString().split('T')[0],
     paymentMethod: paymentMethod || 'Pix',
     notes: `Recebimento #${target.description} - ${notes || 'Liquidação'}`.trim()
   });

   addNotification("✅ Recebimento Confirmado", `Recebimento de R$ ${val.toFixed(2)} registrado.`, "success");
   return { success: true };
 };

 const createPaymentCheckout = async (params: { receivableId?: string; orderId?: string; customerName: string; customerDocument?: string; amount: number; method: 'pix' | 'credit_card' | 'bank_slip'; installments?: number }): Promise<OnlinePaymentCharge> => {
   const token = localStorage.getItem('as_access_token');
   if (token) {
     try {
       const res = await fetch('/api/financial/gateway/checkout', {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'x-tenant-id': currentTenantId },
         body: JSON.stringify(params)
       });
       if (res.ok) {
         const charge: OnlinePaymentCharge = await res.json();
         setPaymentCharges(prev => [charge, ...prev]);
         saveToLocal('payment_charges', [charge, ...paymentCharges]);
         return charge;
       }
     } catch (e) {
       console.warn('Gateway checkout API call failed, generating local charge', e);
     }
   }

   const chargeId = 'chg_' + Date.now();
   const cleanAmount = Number(params.amount).toFixed(2);
   const pixKey = paymentConfig.pixKey || 'pix@ateliesagrado.com.br';
   const pixCopyPaste = `00020126580014br.gov.bcb.pix0136${pixKey}520400005303986540${cleanAmount.length.toString().padStart(2, '0')}${cleanAmount}5802BR5921Atelie Sagrado LTDA6009Sao Paulo62190515${chargeId}6304E1F2`;

   const charge: OnlinePaymentCharge = {
     id: chargeId,
     tenantId: currentTenantId,
     receivableId: params.receivableId,
     orderId: params.orderId,
     customerName: params.customerName,
     customerDocument: params.customerDocument,
     amount: Number(params.amount),
     method: params.method,
     status: 'pending',
     pixCopyPaste,
     installments: params.installments || 1,
     gatewayName: paymentConfig.gateway || 'pix_bacen',
     idempotencyKey: 'idemp_' + chargeId,
     createdAt: new Date().toISOString()
   };

   setPaymentCharges(prev => [charge, ...prev]);
   saveToLocal('payment_charges', [charge, ...paymentCharges]);
   return charge;
 };

 const simulateWebhookPayment = async (chargeId: string): Promise<boolean> => {
   try {
     const res = await fetch('/api/financial/gateway/webhook', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         event: 'payment.confirmed',
         chargeId,
         status: 'paid',
         paymentDate: new Date().toISOString()
       })
     });
     if (res.ok) {
       const token = localStorage.getItem('as_access_token');
       if (token) {
         const recRes = await fetch('/api/financial/receivables', { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': currentTenantId } });
         if (recRes.ok) setReceivables(await recRes.json());
         const trRes = await fetch('/api/financial', { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': currentTenantId } });
         if (trRes.ok) setTransactions(await trRes.json());
       }
       setPaymentCharges(prev => prev.map(c => c.id === chargeId ? { ...c, status: 'paid', paidAt: new Date().toISOString() } : c));
       addNotification("✅ Pagamento Confirmado", `A cobrança #${chargeId} foi liquidada com sucesso via Webhook do gateway.`, "success");
       return true;
     }
   } catch (e) {
     console.error('Webhook simulation failed', e);
   }
   return false;
 };

 const refundCharge = async (chargeId: string, reason?: string): Promise<boolean> => {
   const token = localStorage.getItem('as_access_token');
   if (token) {
     try {
       const res = await fetch('/api/financial/gateway/refund', {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'x-tenant-id': currentTenantId },
         body: JSON.stringify({ chargeId, reason })
       });
       if (res.ok) {
         const trRes = await fetch('/api/financial', { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': currentTenantId } });
         if (trRes.ok) setTransactions(await trRes.json());
         setPaymentCharges(prev => prev.map(c => c.id === chargeId ? { ...c, status: 'refunded', refundedAt: new Date().toISOString(), refundReason: reason } : c));
         addNotification("↩️ Estorno Efetuado", `Cobrança #${chargeId} foi reembolsada e gerou lançamento de estorno no extrato.`, "info");
         return true;
       }
     } catch (e) {
       console.error('Refund failed', e);
     }
   }
   return false;
 };

 const updatePaymentConfig = async (configData: Partial<OnlinePaymentConfig>) => {
   const token = localStorage.getItem('as_access_token');
   if (token) {
     try {
       const res = await fetch('/api/financial/gateway/config', {
         method: 'PUT',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'x-tenant-id': currentTenantId },
         body: JSON.stringify(configData)
       });
       if (res.ok) {
         const updated = await res.json();
         setPaymentConfig(updated);
         localStorage.setItem('as_payment_config', JSON.stringify(updated));
         addNotification("⚙️ Configurações Salvas", "Gateway de pagamentos atualizado.", "success");
         return;
       }
     } catch (e) {
       console.warn('API config update failed', e);
     }
   }
   const updated = { ...paymentConfig, ...configData };
   setPaymentConfig(updated);
   localStorage.setItem('as_payment_config', JSON.stringify(updated));
 };

 const exportFinancialReport = async (type: 'transactions' | 'payables' | 'receivables' | 'cashflow'): Promise<{ success: boolean; filename?: string; error?: string }> => {
   const token = localStorage.getItem('as_access_token');
   try {
     const res = await fetch(`/api/financial/export?type=${type}`, {
       headers: {
         'Authorization': `Bearer ${token}`,
         'x-tenant-id': currentTenantId
       }
     });
     if (!res.ok) {
       return { success: false, error: 'Falha ao gerar relatório no servidor.' };
     }

     const blob = await res.blob();
     const contentDisp = res.headers.get('Content-Disposition');
     let filename = `relatorio-financeiro-${type}.csv`;
     if (contentDisp && contentDisp.includes('filename=')) {
       const match = contentDisp.match(/filename="?([^";]+)"?/);
       if (match && match[1]) filename = match[1];
     }

     const url = window.URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = filename;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     window.URL.revokeObjectURL(url);

     addNotification("📥 Download Concluído", `Arquivo ${filename} exportado com sucesso.`, "success");
     return { success: true, filename };
   } catch (e: any) {
     return { success: false, error: e.message || 'Erro durante a exportação.' };
   }
 };

 // SYSTEM SETTINGS
 const updateSettings = (updatedFields: Partial<SystemSettings>) => {
 const updated = { ...settings, ...updatedFields, theme: 'light' as const };
 setSettings(updated);
 localStorage.setItem('as_settings', JSON.stringify(updated));

 const root = window.document.documentElement;
 root.classList.remove('dark');
 };

 const getStatusLabel = (status: OrderStatus): string => {
 const labels: Record<OrderStatus, string> = {
 received: 'Pedido Recebido',
 approved: 'Separação de Materiais',
 production: 'Produção',
 finishing: 'Acabamento',
 packing: 'Embalagem',
 ready: 'Pronto para Entrega',
 completed: 'Concluído',
 cancelled: 'Cancelado'
 };
 return labels[status] || status;
 };

 // Dynamically compute reserved and available quantities in real-time
 const inventoryWithReserved = React.useMemo(() => {
  return inventory.map(item => {
   let reserved = 0;
   quotes.forEach(q => {
    if (!q.isDeleted && (q.status === 'pending' || q.status === 'analysis' || q.status === 'approved')) {
     q.items.forEach(qi => {
      const prod = products.find(p => p.id === qi.productId);
      if (prod && prod.composition) {
       prod.composition.forEach(comp => {
        if (comp.materialId === item.id) {
         reserved += comp.quantity * qi.quantity;
        }
       });
      }
     });
    }
   });
   const reservedRounded = Number(reserved.toFixed(2));
   return {
    ...item,
    reserved: reservedRounded,
    available: Math.max(0, Number((item.quantity - reservedRounded).toFixed(2)))
   };
  });
 }, [inventory, quotes, products]);

 // Notification Actions
 const addNotification = (title: string, message: string, type: SystemNotification['type']) => {
  const newNotif: SystemNotification = {
   id: 'notif_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
   tenantId: currentTenantId,
   title,
   message,
   type,
   date: new Date().toISOString(),
   read: false
  };
  setNotifications(prev => {
   const updated = [newNotif, ...prev];
   saveToLocal('notifications', updated);
   return updated;
  });
 };

 const toggleNotificationRead = (id: string) => {
  setNotifications(prev => {
   const updated = prev.map(n => n.id === id ? { ...n, read: !n.read } : n);
   saveToLocal('notifications', updated);
   return updated;
  });
 };

 const markNotificationAsRead = (id: string) => {
  setNotifications(prev => {
   const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
   saveToLocal('notifications', updated);
   return updated;
  });
 };

 const markAllNotificationsAsRead = () => {
  setNotifications(prev => {
   const updated = prev.map(n => ({ ...n, read: true }));
   saveToLocal('notifications', updated);
   return updated;
  });
 };

 const clearNotification = (id: string) => {
  setNotifications(prev => {
   const updated = prev.filter(n => n.id !== id);
   saveToLocal('notifications', updated);
   return updated;
  });
 };

 const clearAllNotifications = () => {
  setNotifications([]);
  saveToLocal('notifications', []);
 };

 const scanReceipt = async (imageBase64: string): Promise<{ success: boolean; data?: ReceiptOcrData; error?: string }> => {
  try {
   const token = localStorage.getItem('as_jwt');
   const res = await fetch('/api/ocr/receipt', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     'Authorization': token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify({ imageBase64 })
   });
   const data = await res.json();
   if (!res.ok) throw new Error(data.message || 'Erro ao processar recibo.');
   
   addNotification(
    "✨ Recibo Processado via IA",
    `Os dados do fornecedor "${data.data.vendorName}" de R$ ${data.data.totalAmount.toFixed(2)} foram extraídos com inteligência artificial.`,
    "success"
   );
   
   return { success: true, data: data.data };
  } catch (e: unknown) {
   const msg = e instanceof Error ? e.message : 'Erro ao processar recibo.';
   return { success: false, error: msg };
  }
 };

 const importFinancialFile = async (fileType: 'csv' | 'ofx' | 'xlsx', fileContent: string): Promise<{ success: boolean; count?: number; error?: string }> => {
  try {
   const token = localStorage.getItem('as_jwt');
   const res = await fetch('/api/financial/import', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     'Authorization': token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify({ fileType, fileContent })
   });
   const data = await res.json();
   if (!res.ok) throw new Error(data.message || 'Erro ao importar arquivo financeiro.');
   
   // Reload financial transactions to keep in sync if backend is active
   if (token) {
    const resTrans = await fetch('/api/financial', {
     headers: { 'Authorization': `Bearer ${token}` }
    });
    if (resTrans.ok) {
     const transList = await resTrans.json();
     setTransactions(transList);
     saveToLocal('transactions', transList);
    }
   }
   
   addNotification(
    "📂 Importação Concluída",
    `${data.count} lançamentos financeiros foram importados e reconciliados com sucesso do extrato bancário.`,
    "success"
   );
   
   return { success: true, count: data.count };
  } catch (e: any) {
   return { success: false, error: e.message };
  }
 };

  const currentTenant = useMemo(() => {
    return tenants.find(t => t.id === currentTenantId) || tenants[0] || initialTenants[0];
  }, [tenants, currentTenantId]);

  const switchTenant = (tenantId: string) => {
    const target = tenants.find(t => t.id === tenantId);
    if (target) {
      setCurrentTenantId(tenantId);
      localStorage.setItem('as_active_tenant_id', tenantId);
      if (target.primaryColor) {
        applyThemeColors(target.primaryColor);
        setSettings(prev => ({
          ...prev,
          primaryColor: target.primaryColor || prev.primaryColor,
          companyName: target.name || prev.companyName,
          razaoSocial: target.razaoSocial || prev.razaoSocial,
          nomeFantasia: target.nomeFantasia || prev.nomeFantasia,
          cnpj: target.document || prev.cnpj,
          address: target.address || prev.address,
          email: target.email || prev.email,
          phone: target.phone || prev.phone
        }));
      }
    }
  };

  const createTenant = async (newTenantData: Omit<Tenant, 'id' | 'createdAt'>): Promise<Tenant> => {
    const newTenant: Tenant = {
      ...newTenantData,
      id: 'tenant_' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    const updatedTenants = [...tenants, newTenant];
    setTenants(updatedTenants);
    localStorage.setItem('as_tenants', JSON.stringify(updatedTenants));
    try {
      await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTenant)
      });
    } catch (e) {}
    return newTenant;
  };

  const updateTenant = async (id: string, partial: Partial<Tenant>): Promise<Tenant> => {
    const updatedTenants = tenants.map(t => t.id === id ? { ...t, ...partial } : t);
    setTenants(updatedTenants);
    localStorage.setItem('as_tenants', JSON.stringify(updatedTenants));
    const updated = updatedTenants.find(t => t.id === id) || tenants[0];
    try {
      await fetch(`/api/tenants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial)
      });
    } catch (e) {}
    return updated;
  };

  const deleteTenant = async (id: string): Promise<boolean> => {
    if (tenants.length <= 1) return false;
    const filtered = tenants.filter(t => t.id !== id);
    setTenants(filtered);
    localStorage.setItem('as_tenants', JSON.stringify(filtered));
    if (currentTenantId === id) {
      setCurrentTenantId(filtered[0].id);
      localStorage.setItem('as_active_tenant_id', filtered[0].id);
    }
    try {
      await fetch(`/api/tenants/${id}`, { method: 'DELETE' });
    } catch (e) {}
    return true;
  };

  const syncAllData = () => {
    const loadLatest = <T,>(key: string): T[] => {
      const stored = localStorage.getItem(`as_${key}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
      return [];
    };

    setClients(loadLatest('clients'));
    setInventory(loadLatest('inventory'));
    setProducts(loadLatest('products'));
    setQuotes(loadLatest('quotes'));
    setOrders(loadLatest('orders'));
    setProductionTasks(loadLatest('production_tasks'));
    setTransactions(loadLatest('transactions'));
    setAgendaActivities(loadLatest('agenda_activities'));
    setAuditLogs(loadLatest('audit_logs'));
    setUsers(loadLatest('users'));
    setNotifications(loadLatest('notifications'));

    const storedSettings = localStorage.getItem('as_settings');
    if (storedSettings) {
      try {
        const loadedSettings = JSON.parse(storedSettings);
        loadedSettings.theme = 'light';
        setSettings(loadedSettings);
      } catch (e) {}
    }
  };

 const resetSystem = () => {
  Object.keys(localStorage).forEach(key => {
   if (key.startsWith('as_')) {
    localStorage.removeItem(key);
   }
  });
  window.location.reload();
 };

 // Filtered by currentTenantId for complete multi-tenant isolation
 const scopedClients = React.useMemo(() => {
  return clients.filter(c => !c.tenantId || c.tenantId === currentTenantId);
 }, [clients, currentTenantId]);

 const scopedInventory = React.useMemo(() => {
  return inventoryWithReserved.filter(i => !i.tenantId || i.tenantId === currentTenantId);
 }, [inventoryWithReserved, currentTenantId]);

 const scopedProducts = React.useMemo(() => {
  return products.filter(p => !p.tenantId || p.tenantId === currentTenantId);
 }, [products, currentTenantId]);

 const scopedQuotes = React.useMemo(() => {
  return quotes.filter(q => !q.tenantId || q.tenantId === currentTenantId);
 }, [quotes, currentTenantId]);

 const scopedOrders = React.useMemo(() => {
  return orders.filter(o => !o.tenantId || o.tenantId === currentTenantId);
 }, [orders, currentTenantId]);

 const scopedProductionTasks = React.useMemo(() => {
  return productionTasks.filter(t => !t.tenantId || t.tenantId === currentTenantId);
 }, [productionTasks, currentTenantId]);

 const scopedTransactions = React.useMemo(() => {
  return transactions.filter(t => !t.tenantId || t.tenantId === currentTenantId);
 }, [transactions, currentTenantId]);

 const scopedUsers = React.useMemo(() => {
  return users.filter(u => !u.tenantId || u.tenantId === currentTenantId);
 }, [users, currentTenantId]);

 const scopedAgendaActivities = React.useMemo(() => {
  return agendaActivities.filter(a => !a.tenantId || a.tenantId === currentTenantId);
 }, [agendaActivities, currentTenantId]);

 const scopedAuditLogs = React.useMemo(() => {
  return auditLogs.filter(l => !l.tenantId || l.tenantId === currentTenantId);
 }, [auditLogs, currentTenantId]);

 const scopedNotifications = React.useMemo(() => {
  return notifications.filter(n => !n.tenantId || n.tenantId === currentTenantId);
 }, [notifications, currentTenantId]);

 const scopedPayables = React.useMemo(() => {
  return payables.filter(p => !p.isDeleted && (!p.tenantId || p.tenantId === currentTenantId));
 }, [payables, currentTenantId]);

 const scopedReceivables = React.useMemo(() => {
  return receivables.filter(r => !r.isDeleted && (!r.tenantId || r.tenantId === currentTenantId));
 }, [receivables, currentTenantId]);

 const scopedPaymentCharges = React.useMemo(() => {
  return paymentCharges.filter(c => !c.tenantId || c.tenantId === currentTenantId);
 }, [paymentCharges, currentTenantId]);

 return (
 <DbContext.Provider value={{
 tenants: tenants || [],
 currentTenant: currentTenant || initialTenants[0],
 switchTenant,
 createTenant,
 updateTenant,
 deleteTenant,
 clients: scopedClients,
 inventory: scopedInventory,
 products: scopedProducts,
 quotes: scopedQuotes,
 orders: scopedOrders,
 productionTasks: scopedProductionTasks,
 transactions: scopedTransactions,
 settings,
 user,
 login,
 logout,
 resetSystem,
 syncAllData,
 recoverPassword,
  users: scopedUsers,
  addUser,
  updateUser,
  deleteUser,
 
 addClient,
 updateClient,
 deleteClient,

 addInventoryItem,
 updateInventoryItem,
 deleteInventoryItem,
 adjustStock,

 addProduct,
 updateProduct,
 deleteProduct,

 addQuote,
 updateQuote,
 deleteQuote,
 duplicateQuote,
 convertToOrder,

 addOrder,
 updateOrder,
 deleteOrder,
 cancelOrder,
 addOrderTimeline,

 updateProductionTask,

 addTransaction,
 updateTransaction,
 deleteTransaction,

 updateSettings,
 notifications: scopedNotifications,
 addNotification,
 toggleNotificationRead,
 markNotificationAsRead,
 markAllNotificationsAsRead,
 clearNotification,
 clearAllNotifications,
 scanReceipt,
 importFinancialFile,
 agendaActivities: scopedAgendaActivities,
 auditLogs: scopedAuditLogs,
 addAgendaActivity,
 updateAgendaActivity,
 deleteAgendaActivity,
 addAuditLog,

 // Financial & Gateway
 payables: scopedPayables,
 receivables: scopedReceivables,
 paymentCharges: scopedPaymentCharges,
 paymentConfig,
 addPayable,
 updatePayable,
 deletePayable,
 settlePayable,
 addReceivable,
 updateReceivable,
 deleteReceivable,
 settleReceivable,
 createPaymentCheckout,
 simulateWebhookPayment,
 refundCharge,
 updatePaymentConfig,
 exportFinancialReport
 }}>
 {children}
 </DbContext.Provider>
 );
};
