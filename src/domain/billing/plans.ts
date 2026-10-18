import { BillingPlan } from './types';

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: 'basic',
    name: 'Plano Ateliê Sagrado Completo',
    badge: 'Acesso Integral & Ilimitado',
    description: 'Acesso completo, irrestrito e ilimitado a todos os módulos, ferramentas e recursos do Ateliê Sagrado ERP por R$ 49,90/mês.',
    priceMonthly: 49.90,
    priceAnnual: 49.90,
    currency: 'BRL',
    trialDays: 0,
    popular: true,
    active: true,
    features: {
      customers: true,
      products: true,
      inventory: true,
      purchases: true,
      sales: true,
      quotes: true,
      production: true,
      financial: true,
      advancedPricing: true,
      multiAtelier: true,
      auditLogs: true,
      exportReports: true,
      apiAccess: true,
    },
    limits: {
      maxUsers: 999999,
      maxAteliers: 999999,
      maxProducts: 999999,
      maxOrdersPerMonth: 999999,
      maxQuotesPerMonth: 999999,
      maxStorageMb: 999999,
    },
    featureBulletPoints: [
      'Acesso integral aos 11 módulos do ERP',
      'Cadastro ilimitado de produtos e fórmulas',
      'Controle completo e ilimitado de insumos',
      'Pedidos de venda e ordens ilimitados',
      'Precificação inteligente e orçamentos sem limites',
      'Gestão de clientes com histórico de compras',
      'Chão de fábrica e fluxo de montagem',
      'Fluxo financeiro com conciliação Pix',
      'Emissão de recibos digitais e relatórios',
      'Sem bloqueios nem limites ocultos'
    ]
  }
];

export const getPlanById = (planId?: string): BillingPlan => {
  return BILLING_PLANS[0];
};
