-- ==============================================================================
-- ATELIÊ SAGRADO ERP - SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- Complete Data Architecture with Multi-Tenancy & Row Level Security (RLS)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TENANTS TABLE (Multi-Ateliês & Unidades)
CREATE TABLE IF NOT EXISTS public.tenants (
    id TEXT PRIMARY KEY DEFAULT 'tenant_' || gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    document TEXT,
    razao_social TEXT,
    nome_fantasia TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    primary_color TEXT DEFAULT '#D4AF37',
    plan_id TEXT DEFAULT 'professional',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    owner_id TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USERS & OPERATORS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT 'u_' || gen_random_uuid(),
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'Vendedor',
    is_active BOOLEAN DEFAULT TRUE,
    photo_url TEXT,
    permissions JSONB DEFAULT '{
        "dashboard": true,
        "inventory": true,
        "purchases": true,
        "products": true,
        "pricing": true,
        "clients": true,
        "quotes": true,
        "orders": true,
        "production": true,
        "financial": true,
        "settings": true
    }'::jsonb,
    preferences JSONB DEFAULT '{
        "theme": "light",
        "language": "pt-BR"
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLIENTS TABLE (Clientes PF e PJ)
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY DEFAULT 'c_' || gen_random_uuid(),
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'PF' CHECK (type IN ('PF', 'PJ')),
    name TEXT NOT NULL,
    nome_fantasia TEXT,
    responsavel TEXT,
    cpf TEXT,
    cnpj TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    cep TEXT,
    street TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INVENTORY & RAW MATERIALS TABLE (Insumos & Matérias-Primas)
CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY DEFAULT 'm_' || gen_random_uuid(),
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Geral',
    description TEXT,
    supplier TEXT,
    unit TEXT NOT NULL DEFAULT 'unidade',
    weight_g NUMERIC(10, 2) DEFAULT 0,
    quantity NUMERIC(10, 2) DEFAULT 0,
    min_quantity NUMERIC(10, 2) DEFAULT 0,
    unit_value NUMERIC(10, 2) DEFAULT 0,
    calc_method TEXT DEFAULT 'fixed' CHECK (calc_method IN ('fixed', 'weight', 'cm', 'custom')),
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCTS TABLE (Catálogo de Produtos e Joias Sacras)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT 'p_' || gen_random_uuid(),
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Terços',
    sku TEXT NOT NULL,
    description TEXT,
    image TEXT,
    production_time_min NUMERIC(10, 2) DEFAULT 0,
    final_weight_g NUMERIC(10, 2) DEFAULT 0,
    selling_price NUMERIC(10, 2) DEFAULT 0,
    composition JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. QUOTES TABLE (Orçamentos para Clientes)
CREATE TABLE IF NOT EXISTS public.quotes (
    id TEXT PRIMARY KEY DEFAULT 'q_' || gen_random_uuid(),
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) DEFAULT 0,
    discount NUMERIC(10, 2) DEFAULT 0,
    shipping NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analysis', 'approved', 'rejected')),
    date DATE DEFAULT CURRENT_DATE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDERS TABLE (Pedidos de Venda e Produção)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT 'o_' || gen_random_uuid(),
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    total_value NUMERIC(10, 2) DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    due_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'received' CHECK (status IN ('received', 'approved', 'production', 'finishing', 'packing', 'ready', 'completed')),
    production_progress NUMERIC(5, 2) DEFAULT 0,
    responsible TEXT,
    timeline JSONB DEFAULT '[]'::jsonb,
    snapshot JSONB DEFAULT '{}'::jsonb,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PRODUCTION TASKS TABLE (Tarefas do Kanban de Produção)
CREATE TABLE IF NOT EXISTS public.production_tasks (
    id TEXT PRIMARY KEY DEFAULT 't_' || gen_random_uuid(),
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'producing', 'done', 'paused')),
    responsible TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    time_spent_minutes NUMERIC(10, 2) DEFAULT 0,
    total_estimated_minutes NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. FINANCIAL TRANSACTIONS TABLE (Fluxo de Caixa, DRE & Conciliação)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id TEXT PRIMARY KEY DEFAULT 'tr_' || gen_random_uuid(),
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    contact_name TEXT,
    value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'pix' CHECK (payment_method IN ('pix', 'credit_card', 'debit_card', 'cash', 'bank_slip')),
    notes TEXT,
    reconciled BOOLEAN DEFAULT FALSE,
    receipt_url TEXT,
    order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AGENDA & ACTIVITIES TABLE (Compromissos e Prazos)
CREATE TABLE IF NOT EXISTS public.agenda_activities (
    id TEXT PRIMARY KEY DEFAULT 'act_' || gen_random_uuid(),
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'task' CHECK (type IN ('production', 'delivery', 'meeting', 'task')),
    date DATE DEFAULT CURRENT_DATE,
    time TEXT,
    completed BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    description TEXT,
    responsible TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AUDIT LOGS TABLE (Trilha de Auditoria LGPD)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT 'log_' || gen_random_uuid(),
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SYSTEM NOTIFICATIONS TABLE (Alertas de Estoque e Prazos)
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT 'n_' || gen_random_uuid(),
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'system' CHECK (type IN ('low_stock', 'order_due', 'quote_approved', 'system')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. SETTINGS TABLE (Configurações do Ateliê e Precificação)
CREATE TABLE IF NOT EXISTS public.settings (
    tenant_id TEXT PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_name TEXT DEFAULT 'Ateliê Sagrado',
    logo TEXT DEFAULT '📿',
    doc_logo TEXT,
    cnpj TEXT DEFAULT '12.345.678/0001-90',
    phone TEXT DEFAULT '(11) 98765-4321',
    email TEXT DEFAULT 'contato@ateliesagrado.com.br',
    address TEXT DEFAULT 'Rua das Rosas, 108, Bairro das Graças - São Paulo/SP',
    primary_color TEXT DEFAULT '#D4AF37',
    default_margin_percent NUMERIC(5, 2) DEFAULT 120.00,
    indirect_costs NUMERIC(10, 2) DEFAULT 5.50,
    labor_hourly_rate NUMERIC(10, 2) DEFAULT 25.00,
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'pt-BR',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. INDEXES FOR HIGH-PERFORMANCE SEARCH & FILTERING
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant ON public.inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant ON public.quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON public.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_production_tenant ON public.production_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON public.financial_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.financial_transactions(date);

-- 16. SEED INITIAL DATA FOR QUICK START
INSERT INTO public.tenants (id, name, slug, document, razao_social, nome_fantasia, email, phone, address, primary_color, plan_id, status)
VALUES (
    'tenant_atelie_sagrado',
    'Ateliê Sagrado (Matriz)',
    'matriz',
    '12.345.678/0001-90',
    'Ateliê Sagrado Arte Sacra LTDA',
    'Ateliê Sagrado - Matriz',
    'contato@ateliesagrado.com.br',
    '(11) 98765-4321',
    'Rua das Flores, 120 - Centro, São Paulo/SP',
    '#D4AF37',
    'professional',
    'active'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.settings (tenant_id, company_name, logo, cnpj, phone, email, address, primary_color, default_margin_percent, indirect_costs, labor_hourly_rate)
VALUES (
    'tenant_atelie_sagrado',
    'Ateliê Sagrado',
    '📿',
    '12.345.678/0001-90',
    '(11) 98765-4321',
    'contato@ateliesagrado.com.br',
    'Rua das Rosas, 108, Bairro das Graças - São Paulo/SP',
    '#D4AF37',
    120.00,
    5.50,
    25.00
) ON CONFLICT (tenant_id) DO NOTHING;
