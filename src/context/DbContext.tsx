import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
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
 ProductionStatus
} from '../types/erp';

interface DbContextType {
 clients: Client[];
 inventory: InventoryItem[];
 products: Product[];
 quotes: Quote[];
 orders: Order[];
 productionTasks: ProductionTask[];
 transactions: FinancialTransaction[];
 settings: SystemSettings;
 
 // Auth simulation
 user: { name: string; email: string } | null;
 login: (email: string, password: string) => boolean;
 logout: () => void;
 recoverPassword: (email: string) => boolean;

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
 convertToOrder: (id: string) => void;

 addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'orderNumber' | 'timeline'>) => void;
 updateOrder: (id: string, order: Partial<Order>) => void;
 deleteOrder: (id: string) => void;
 addOrderTimeline: (id: string, description: string) => void;

 updateProductionTask: (id: string, task: Partial<ProductionTask>) => void;
 
 addTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'createdAt'>) => void;
 updateTransaction: (id: string, transaction: Partial<FinancialTransaction>) => void;
 deleteTransaction: (id: string) => void;

 updateSettings: (settings: Partial<SystemSettings>) => void;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

export const useDb = () => {
 const context = useContext(DbContext);
 if (!context) throw new Error('useDb must be used within a DbProvider');
 return context;
};

// Initial Seed Data
const defaultSettings: SystemSettings = {
 companyName: "Ateliê Sagrado",
 logo: "📿",
 cnpj: "12.345.678/0001-90",
 phone: "(11) 98765-4321",
 address: "Rua das Rosas, 108, Bairro das Graças - São Paulo/SP",
 defaultMarginPercent: 120, // 120% margin
 indirectCosts: 5.50, // R$ 5,50 per item (packaging, electricity, etc)
 laborHourlyRate: 25.00, // R$ 25,00/hour
 theme: 'light',
 language: 'pt-BR',
 notificationsEnabled: true
};

const initialClients: Client[] = [
 {
 id: "c1",
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
 type: "PF",
 name: "Carlos Eduardo Santos",
 cpf: "987.654.321-11",
 email: "carlosedu@hotmail.com",
 phone: "(21) 97100-5050",
 whatsapp: "(21) 97100-5050",
 cep: "22020-001",
 street: "Avenida Atlântica",
 number: "1702",
 neighborhood: "Copacabana",
 city: "Rio de Janeiro",
 state: "RJ",
 createdAt: "2026-05-20T11:15:00Z"
 }
];

const initialInventory: InventoryItem[] = [
 {
 id: "m1",
 name: "Pérola de Água Doce Branca (8mm)",
 category: "Contas e Pérolas",
 code: "PER-001",
 description: "Pérolas naturais cultivadas em água doce, furo passante de 0.8mm.",
 supplier: "Beads Importadora",
 unit: "pacote (100 un)",
 weightG: 120,
 quantity: 4, // 400 beads total
 minQuantity: 5, // low stock alert!
 unitValue: 45.00, // R$ 45,00 per package of 100
 calcMethod: "fixed",
 notes: "Material de altíssima qualidade para terços de noivas.",
 status: "active",
 createdAt: "2026-05-01T09:00:00Z"
 },
 {
 id: "m2",
 name: "Crucifixo Clássico Folheado a Ouro",
 category: "Metais e Entremeios",
 code: "CRU-002",
 description: "Crucifixo decorado com detalhes barrocos, banho de 5 milésimos de ouro.",
 supplier: "Metais Sacros Ltda",
 unit: "unidade",
 weightG: 15,
 quantity: 12,
 minQuantity: 15, // low stock alert!
 unitValue: 18.50,
 calcMethod: "fixed",
 notes: "Crucifixo para terços grandes e luxuosos.",
 status: "active",
 createdAt: "2026-05-01T09:15:00Z"
 },
 {
 id: "m3",
 name: "Entremeio de Nossa Senhora das Graças Ouro Velho",
 category: "Metais e Entremeios",
 code: "ENT-012",
 description: "Entremeio resinado com imagem colorida de NS das Graças, banho ouro velho.",
 supplier: "Metais Sacros Ltda",
 unit: "unidade",
 weightG: 8,
 quantity: 35,
 minQuantity: 10, // normal stock
 unitValue: 6.20,
 calcMethod: "fixed",
 notes: "Muito procurado para terços marianos comuns.",
 status: "active",
 createdAt: "2026-05-01T09:20:00Z"
 },
 {
 id: "m4",
 name: "Fio de Alpaca Semi-Rígido (0.8mm)",
 category: "Fios e Cordões",
 code: "FIO-003",
 description: "Fio de alpaca excelente para contra-pino de terços duradouros.",
 supplier: "Joias do Vale",
 unit: "rolo (50m)",
 weightG: 300,
 quantity: 1, // critical stock!
 minQuantity: 3,
 unitValue: 28.00,
 calcMethod: "weight",
 notes: "Fácil de manusear com alicate de bico redondo.",
 status: "active",
 createdAt: "2026-05-01T09:30:00Z"
 },
 {
 id: "m5",
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
 createdAt: "2026-05-01T10:00:00Z"
 }
];

const initialProducts: Product[] = [
 {
 id: "p1",
 name: "Terço de Noiva Imperial - Pérola de Água Doce",
 category: "Terços de Noiva",
 sku: "TER-N-001",
 description: "Terço de luxo montado à mão com pérolas de água doce naturais de 8mm, crucifixo banhado a ouro barroco e entremeio de Nossa Senhora das Graças resinado. Acompanha caixa de veludo.",
 image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop",
 productionTimeMin: 120, // 2 hours
 finalWeightG: 220,
 sellingPrice: 420.00,
 composition: [
 { materialId: "m1", quantity: 0.6, cost: 27.00 }, // 60 beads = 0.6 package
 { materialId: "m2", quantity: 1, cost: 18.50 }, // 1 crucifixo
 { materialId: "m3", quantity: 1, cost: 6.20 }, // 1 entremeio
 { materialId: "m4", quantity: 0.1, cost: 2.80 }, // 5 meters of alpaca wire
 { materialId: "m5", quantity: 1, cost: 12.00 } // 1 velvet box
 ],
 status: "active",
 createdAt: "2026-05-05T11:00:00Z"
 },
 {
 id: "p2",
 name: "Pulseira de Hematita São Bento",
 category: "Pulseiras",
 sku: "PUL-SB-002",
 description: "Pulseira masculina confeccionada com contas de hematita magnética e entremeios da medalha de São Bento em banho ouro velho.",
 image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=300&auto=format&fit=crop",
 productionTimeMin: 30, // 30 mins
 finalWeightG: 45,
 sellingPrice: 65.00,
 composition: [
 { materialId: "m3", quantity: 2, cost: 12.40 }, // Uses 2 medals
 { materialId: "m4", quantity: 0.02, cost: 0.56 }, // a tiny bit of wire/cord
 { materialId: "m5", quantity: 1, cost: 12.00 } // packaging
 ],
 status: "active",
 createdAt: "2026-05-06T15:00:00Z"
 }
];

const initialQuotes: Quote[] = [
 {
 id: "q1",
 clientId: "c2",
 clientName: "Paróquia Nossa Senhora da Paz",
 items: [
 {
 productId: "p2",
 productName: "Pulseira de Hematita São Bento",
 quantity: 15,
 unitPrice: 55.00, // discounted
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
 }
];

const initialOrders: Order[] = [
 {
 id: "o1",
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
 { id: "t3", date: "2026-06-20 09:15", description: "Iniciada montagem física das contas", user: "Ana Paula (Artesã)" }
 ],
 createdAt: "2026-06-18T11:30:00Z"
 },
 {
 id: "o2",
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
 }
];

const initialProductionTasks: ProductionTask[] = [
 {
 id: "pt1",
 orderId: "o1",
 orderNumber: "PED-2026-0001",
 productId: "p1",
 productName: "Terço de Noiva Imperial - Pérola de Água Doce",
 status: "producing",
 responsible: "Ana Paula (Artesã)",
 startDate: "2026-06-20T09:15:00Z",
 endDate: null,
 timeSpentMinutes: 50,
 totalEstimatedMinutes: 120,
 createdAt: "2026-06-18T11:32:00Z"
 },
 {
 id: "pt2",
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
 }
];

const initialTransactions: FinancialTransaction[] = [
 {
 id: "f1",
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
 type: "expense",
 category: "Custos Operacionais",
 contactName: "Cartonagem Imperial",
 value: 120.00,
 date: "2026-06-12",
 paymentMethod: "Pix",
 notes: "Lote de 10 caixas rígidas de veludo",
 createdAt: "2026-06-12T16:30:00Z"
 },
 // Add some previous months transactions for nice charts
 {
 id: "f4",
 type: "income",
 category: "Venda de Produtos",
 contactName: "Vários Clientes (Consolidado)",
 value: 2850.00,
 date: "2026-05-28",
 paymentMethod: "Cartão de Crédito",
 createdAt: "2026-05-28T18:00:00Z"
 },
 {
 id: "f5",
 type: "expense",
 category: "Compra de Matéria-Prima",
 contactName: "Importadora Geral",
 value: 850.00,
 date: "2026-05-05",
 paymentMethod: "Transferência",
 createdAt: "2026-05-05T10:00:00Z"
 },
 {
 id: "f6",
 type: "income",
 category: "Venda de Produtos",
 contactName: "Paróquia NS Paz",
 value: 1500.00,
 date: "2026-05-16",
 paymentMethod: "Pix",
 createdAt: "2026-05-16T12:00:00Z"
 }
];

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [clients, setClients] = useState<Client[]>([]);
 const [inventory, setInventory] = useState<InventoryItem[]>([]);
 const [products, setProducts] = useState<Product[]>([]);
 const [quotes, setQuotes] = useState<Quote[]>([]);
 const [orders, setOrders] = useState<Order[]>([]);
 const [productionTasks, setProductionTasks] = useState<ProductionTask[]>([]);
 const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
 const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
 const [user, setUser] = useState<{ name: string; email: string } | null>(null);

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
 return JSON.parse(stored);
 } catch (e) {
 return initial;
 }
 }
 localStorage.setItem(`as_${key}`, JSON.stringify(initial));
 return initial;
 };

 setClients(loadData('clients', initialClients));
 setInventory(loadData('inventory', initialInventory));
 setProducts(loadData('products', initialProducts));
 setQuotes(loadData('quotes', initialQuotes));
 setOrders(loadData('orders', initialOrders));
 setProductionTasks(loadData('production_tasks', initialProductionTasks));
 setTransactions(loadData('transactions', initialTransactions));

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

 // Sync theme class reactively with document root (always light as requested)
 useEffect(() => {
 const root = window.document.documentElement;
 root.classList.remove('dark');
 }, [settings.theme]);

 // Save states to local storage
 const saveToLocal = (key: string, data: any) => {
 localStorage.setItem(`as_${key}`, JSON.stringify(data));
 };

 // Auth actions
 const login = (email: string, password: string): boolean => {
 if (email.toLowerCase() === 'artsllumos@gmail.com' || email.toLowerCase() === 'admin@ateliesagrado.com.br' || email.length > 3) {
 const loggedUser = { 
 name: email.toLowerCase() === 'artsllumos@gmail.com' ? "Ateliê Sagrado" : "Administrador", 
 email: email.toLowerCase() 
 };
 setUser(loggedUser);
 localStorage.setItem('as_user', JSON.stringify(loggedUser));
 return true;
 }
 return false;
 };

 const logout = () => {
 setUser(null);
 localStorage.removeItem('as_user');
 };

 const recoverPassword = (email: string): boolean => {
 // Simply return true for any valid email
 return email.includes('@');
 };

 // CLIENTS CRUD
 const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
 const newClient: Client = {
 ...clientData,
 id: 'client_' + Date.now(),
 createdAt: new Date().toISOString()
 };
 const updated = [newClient, ...clients];
 setClients(updated);
 saveToLocal('clients', updated);
 };

 const updateClient = (id: string, updatedFields: Partial<Client>) => {
 const updated = clients.map(c => c.id === id ? { ...c, ...updatedFields } : c);
 setClients(updated);
 saveToLocal('clients', updated);
 };

 const deleteClient = (id: string) => {
 // Soft Delete
 const updated = clients.map(c => c.id === id ? { ...c, isDeleted: true } : c);
 setClients(updated);
 saveToLocal('clients', updated);
 };

 // INVENTORY CRUD
 const addInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'createdAt'>) => {
 const newItem: InventoryItem = {
 ...itemData,
 id: 'inv_' + Date.now(),
 createdAt: new Date().toISOString()
 };
 const updated = [newItem, ...inventory];
 setInventory(updated);
 saveToLocal('inventory', updated);
 };

 const updateInventoryItem = (id: string, updatedFields: Partial<InventoryItem>) => {
 const updated = inventory.map(i => i.id === id ? { ...i, ...updatedFields } : i);
 setInventory(updated);
 saveToLocal('inventory', updated);
 };

 const deleteInventoryItem = (id: string) => {
 // Soft delete
 const updated = inventory.map(i => i.id === id ? { ...i, isDeleted: true } : i);
 setInventory(updated);
 saveToLocal('inventory', updated);
 };

 const adjustStock = (id: string, amount: number, notes: string, category: string, contactName: string) => {
 const target = inventory.find(i => i.id === id);
 if (!target) return;

 const newQty = Math.max(0, target.quantity + amount);
 updateInventoryItem(id, { quantity: newQty });

 // Record financial transaction if buying stock (negative amount means purchasing/expense)
 if (amount > 0) {
 const value = amount * target.unitValue;
 addTransaction({
 type: 'expense',
 category: 'Compra de Matéria-Prima',
 contactName: contactName || target.supplier || 'Fornecedor Diverso',
 value: Number(value.toFixed(2)),
 date: new Date().toISOString().split('T')[0],
 paymentMethod: 'Pix',
 notes: `Estoque+: ${amount} ${target.unit} de ${target.name}. Obs: ${notes}`
 });
 } else if (amount < 0) {
 // Just stock correction/reduction log
 }
 };

 // PRODUCTS CRUD
 const addProduct = (productData: Omit<Product, 'id' | 'createdAt'>) => {
 const newProduct: Product = {
 ...productData,
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
 const newQuote: Quote = {
 ...quoteData,
 id: 'quote_' + Date.now(),
 createdAt: new Date().toISOString()
 };
 const updated = [newQuote, ...quotes];
 setQuotes(updated);
 saveToLocal('quotes', updated);
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

 const convertToOrder = (quoteId: string) => {
 const quote = quotes.find(q => q.id === quoteId);
 if (!quote) return;

 // 1. Update quote status to converted
 updateQuote(quoteId, { status: 'converted' });

 // 2. Generate new Order
 const year = new Date().getFullYear();
 const orderNum = `PED-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
 const newOrder: Order = {
 id: 'order_' + Date.now(),
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

 const updatedOrders = [newOrder, ...orders];
 setOrders(updatedOrders);
 saveToLocal('orders', updatedOrders);

 // 3. Register a Production task for each item in the order
 const newTasks: ProductionTask[] = quote.items.map((item, idx) => {
 const prod = products.find(p => p.id === item.productId);
 return {
 id: `task_${Date.now()}_${idx}`,
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

 // 4. Automatically post Financial Receipt (since we assume converting a quote into order is a confirmed sales value)
 addTransaction({
 type: 'income',
 category: 'Venda de Produtos',
 contactName: quote.clientName,
 value: quote.total,
 date: new Date().toISOString().split('T')[0],
 paymentMethod: 'Pix',
 notes: `Venda Ref. Pedido ${orderNum}`
 });
 };

 // ORDERS CRUD
 const addOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'orderNumber' | 'timeline'>) => {
 const year = new Date().getFullYear();
 const orderNum = `PED-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
 const newOrder: Order = {
 ...orderData,
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
 const updated = [newOrder, ...orders];
 setOrders(updated);
 saveToLocal('orders', updated);

 // Register Production tasks for items
 const newTasks: ProductionTask[] = orderData.items.map((item, idx) => {
 const prod = products.find(p => p.id === item.productId);
 return {
 id: `task_${Date.now()}_${idx}`,
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

 // Also deduct materials from Inventory for this order!
 orderData.items.forEach(item => {
 const prod = products.find(p => p.id === item.productId);
 if (prod && prod.composition) {
 prod.composition.forEach(comp => {
 const mat = inventory.find(m => m.id === comp.materialId);
 if (mat) {
 const deductedQty = comp.quantity * item.quantity;
 updateInventoryItem(mat.id, {
 quantity: Math.max(0, mat.quantity - deductedQty)
 });
 }
 });
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
 };

 const updateOrder = (id: string, updatedFields: Partial<Order>) => {
 const updated = orders.map(o => {
 if (o.id === id) {
 const newTimeline = [...o.timeline];
 if (updatedFields.status && updatedFields.status !== o.status) {
 newTimeline.push({
 id: 't_' + Date.now(),
 date: new Date().toISOString().replace('T', ' ').substring(0, 16),
 description: `Status alterado de ${getStatusLabel(o.status)} para ${getStatusLabel(updatedFields.status)}`,
 user: user?.name || "Ateliê Sagrado"
 });
 }
 return {
 ...o,
 ...updatedFields,
 timeline: newTimeline
 };
 }
 return o;
 });
 setOrders(updated);
 saveToLocal('orders', updated);

 // Also update production tasks status if needed
 if (updatedFields.status === 'completed' || updatedFields.status === 'shipped' || updatedFields.status === 'delivered') {
 const updatedT = productionTasks.map(t => t.orderId === id ? { ...t, status: 'done' as ProductionStatus } : t);
 setProductionTasks(updatedT);
 saveToLocal('production_tasks', updatedT);
 }
 };

 const deleteOrder = (id: string) => {
 const updated = orders.map(o => o.id === id ? { ...o, isDeleted: true } : o);
 setOrders(updated);
 saveToLocal('orders', updated);
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
 const updated = productionTasks.map(t => {
 if (t.id === id) {
 const task = { ...t, ...updatedFields };
 
 // If status changed, update corresponding order progress
 if (updatedFields.status && updatedFields.status !== t.status) {
 setTimeout(() => {
 // Recalculate order overall progress
 const siblings = productionTasks.filter(pt => pt.orderId === t.orderId);
 const siblingsCount = siblings.length;
 if (siblingsCount > 0) {
 const doneCount = siblings.reduce((acc, curr) => {
 const checkId = curr.id === id ? updatedFields.status : curr.status;
 if (checkId === 'done') return acc + 1;
 if (checkId === 'finishing') return acc + 0.85;
 if (checkId === 'producing') return acc + 0.5;
 return acc;
 }, 0);
 const progress = Math.round((doneCount / siblingsCount) * 100);
 
 // Determine new order status based on task state
 let orderStatus: OrderStatus | undefined = undefined;
 if (progress === 100) {
 orderStatus = 'completed';
 } else if (progress > 50) {
 orderStatus = 'finishing';
 } else if (progress > 0) {
 orderStatus = 'production';
 }

 updateOrder(t.orderId, { 
 productionProgress: progress,
 ...(orderStatus ? { status: orderStatus } : {})
 });
 }
 }, 50);
 }

 return task;
 }
 return t;
 });
 setProductionTasks(updated);
 saveToLocal('production_tasks', updated);
 };

 // FINANCIAL TRANSACTIONS CRUD
 const addTransaction = (transData: Omit<FinancialTransaction, 'id' | 'createdAt'>) => {
 const newTrans: FinancialTransaction = {
 ...transData,
 id: 'trans_' + Date.now(),
 createdAt: new Date().toISOString()
 };
 const updated = [newTrans, ...transactions];
 setTransactions(updated);
 saveToLocal('transactions', updated);
 };

 const updateTransaction = (id: string, updatedFields: Partial<FinancialTransaction>) => {
 const updated = transactions.map(t => t.id === id ? { ...t, ...updatedFields } : t);
 setTransactions(updated);
 saveToLocal('transactions', updated);
 };

 const deleteTransaction = (id: string) => {
 const updated = transactions.map(t => t.id === id ? { ...t, isDeleted: true } : t);
 setTransactions(updated);
 saveToLocal('transactions', updated);
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
 received: 'Recebido',
 approved: 'Aprovado',
 production: 'Em Produção',
 finishing: 'Em Acabamento',
 completed: 'Finalizado',
 shipped: 'Enviado',
 delivered: 'Entregue'
 };
 return labels[status] || status;
 };

 return (
 <DbContext.Provider value={{
 clients,
 inventory,
 products,
 quotes,
 orders,
 productionTasks,
 transactions,
 settings,
 user,
 login,
 logout,
 recoverPassword,
 
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
 addOrderTimeline,

 updateProductionTask,

 addTransaction,
 updateTransaction,
 deleteTransaction,

 updateSettings
 }}>
 {children}
 </DbContext.Provider>
 );
};
