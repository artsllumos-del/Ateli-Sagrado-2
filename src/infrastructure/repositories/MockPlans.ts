import { Plan } from '../../domain/types/auth';

export const PLANS_SEED: Plan[] = [
  {
    id: 'basic',
    name: 'Plano Ateliê Sagrado Completo',
    badge: 'Acesso Integral & Ilimitado',
    description: 'Acesso completo, irrestrito e ilimitado a todos os módulos, ferramentas e recursos do Ateliê Sagrado ERP por R$ 49,90/mês.',
    priceMonthly: 49.90,
    priceAnnual: 49.90,
    trialDays: 0,
    popular: true,
    limits: {
      maxUsers: 999999,
      maxProducts: 999999,
      maxOrdersPerMonth: 999999,
      maxQuotesPerMonth: 999999,
      maxStorageMb: 999999,
    },
    features: [
      'Acesso integral a todos os recursos do ERP',
      'Cadastro ilimitado de insumos e matérias-primas',
      'Catálogo ilimitado de produtos e fórmulas técnicas',
      'Pedidos de venda e ordens de produção ilimitados',
      'Orçamentos e motor de precificação sem limites',
      'Gestão completa de clientes e histórico comercial',
      'Chão de fábrica e fluxo de montagem',
      'Fluxo financeiro completo: contas a pagar, receber e conciliação Pix',
      'Emissão de recibos, relatórios e exportações',
      'Suporte humanizado e atualizações contínuas inclusas'
    ],
    permissions: [
      'dashboard:read',
      'inventory:read',
      'inventory:write',
      'purchases:read',
      'purchases:write',
      'products:read',
      'products:write',
      'pricing:read',
      'pricing:write',
      'clients:read',
      'clients:write',
      'quotes:read',
      'quotes:write',
      'orders:read',
      'orders:write',
      'production:read',
      'production:write',
      'financial:read',
      'financial:write',
      'settings:manage',
      'subscription:manage',
      'audit:read'
    ],
    creditsMonthly: 999999,
  }
];
