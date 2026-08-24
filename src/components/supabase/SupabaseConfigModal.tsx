import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  RefreshCw, 
  X, 
  ExternalLink, 
  ShieldCheck, 
  DownloadCloud, 
  UploadCloud, 
  Key, 
  Layers, 
  Check, 
  Sparkles,
  Server
} from 'lucide-react';
import { toast } from '../Toast';
import { 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  testSupabaseConnection, 
  isSupabaseConfigured,
  getSupabaseClient
} from '../../lib/supabase';
import { useDb } from '../../context/DbContext';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const { 
    tenants, 
    clients, 
    inventory, 
    products, 
    quotes, 
    orders, 
    productionTasks, 
    transactions,
    settings,
    users
  } = useDb();

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'schema' | 'sync'>('credentials');

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url || '');
      setAnonKey(creds.anonKey || '');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      toast.warning('Aviso', 'Informe a URL e a Anon Key do seu projeto Supabase.');
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(url.trim(), anonKey.trim());
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      toast.success('Supabase Conectado', result.message);
      saveSupabaseCredentials(url.trim(), anonKey.trim());
    } else {
      toast.error('Falha na Conexão', result.message);
    }
  };

  const handleSave = () => {
    saveSupabaseCredentials(url.trim(), anonKey.trim());
    toast.success('Configurações Salvas', 'Parâmetros de conexão com Supabase foram registrados.');
  };

  const handleCopySql = () => {
    const sqlSchema = `-- Script SQL para criação das tabelas no Supabase SQL Editor:
-- Execute este script no painel do Supabase > SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.tenants (
    id TEXT PRIMARY KEY,
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
    status TEXT DEFAULT 'active',
    owner_id TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Vendedor',
    is_active BOOLEAN DEFAULT TRUE,
    photo_url TEXT,
    permissions JSONB,
    preferences JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    type TEXT NOT NULL DEFAULT 'PF',
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
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
    calc_method TEXT DEFAULT 'fixed',
    notes TEXT,
    status TEXT DEFAULT 'active',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Terços',
    sku TEXT NOT NULL,
    description TEXT,
    image TEXT,
    production_time_min NUMERIC(10, 2) DEFAULT 0,
    final_weight_g NUMERIC(10, 2) DEFAULT 0,
    selling_price NUMERIC(10, 2) DEFAULT 0,
    composition JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quotes (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    client_id TEXT,
    client_name TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) DEFAULT 0,
    discount NUMERIC(10, 2) DEFAULT 0,
    shipping NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    date DATE DEFAULT CURRENT_DATE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    order_number TEXT NOT NULL,
    client_id TEXT,
    client_name TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    total_value NUMERIC(10, 2) DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    due_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'received',
    production_progress NUMERIC(5, 2) DEFAULT 0,
    responsible TEXT,
    timeline JSONB DEFAULT '[]'::jsonb,
    snapshot JSONB DEFAULT '{}'::jsonb,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.production_tasks (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    order_id TEXT,
    order_number TEXT NOT NULL,
    product_id TEXT,
    product_name TEXT NOT NULL,
    status TEXT DEFAULT 'todo',
    responsible TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    time_spent_minutes NUMERIC(10, 2) DEFAULT 0,
    total_estimated_minutes NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    contact_name TEXT,
    value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'pix',
    notes TEXT,
    reconciled BOOLEAN DEFAULT FALSE,
    receipt_url TEXT,
    order_id TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
    tenant_id TEXT PRIMARY KEY,
    company_name TEXT DEFAULT 'Ateliê Sagrado',
    logo TEXT DEFAULT '📿',
    doc_logo TEXT,
    cnpj TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    primary_color TEXT DEFAULT '#D4AF37',
    default_margin_percent NUMERIC(5, 2) DEFAULT 120.00,
    indirect_costs NUMERIC(10, 2) DEFAULT 5.50,
    labor_hourly_rate NUMERIC(10, 2) DEFAULT 25.00,
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'pt-BR',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    toast.success('Copiado com Sucesso!', 'Script SQL copiado para a área de transferência. Cole no SQL Editor do Supabase.');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSyncToSupabase = async () => {
    const client = getSupabaseClient();
    if (!client) {
      toast.error('Não Conectado', 'Configure e teste a conexão com o Supabase antes de sincronizar.');
      return;
    }

    setIsSyncing(true);
    try {
      // 1. Sync tenants
      for (const t of tenants) {
        await client.from('tenants').upsert({
          id: t.id,
          name: t.name,
          slug: t.slug,
          document: t.document || null,
          razao_social: t.razaoSocial || null,
          nome_fantasia: t.nomeFantasia || t.name,
          email: t.email || null,
          phone: t.phone || null,
          address: t.address || null,
          primary_color: t.primaryColor || '#D4AF37',
          plan_id: t.planId || 'professional',
          status: t.status || 'active',
          owner_id: t.ownerId || 'admin'
        });
      }

      // 2. Sync clients
      for (const c of clients) {
        await client.from('clients').upsert({
          id: c.id,
          tenant_id: c.tenantId || 'tenant_atelie_sagrado',
          type: c.type || 'PF',
          name: c.name,
          nome_fantasia: c.nomeFantasia || null,
          responsavel: c.responsavel || null,
          cpf: c.cpf || null,
          cnpj: c.cnpj || null,
          email: c.email || '',
          phone: c.phone || null,
          whatsapp: c.whatsapp || null,
          cep: c.cep || null,
          street: c.street || null,
          number: c.number || null,
          complement: c.complement || null,
          neighborhood: c.neighborhood || null,
          city: c.city || null,
          state: c.state || null,
          is_deleted: Boolean(c.isDeleted)
        });
      }

      // 3. Sync inventory
      for (const m of inventory) {
        await client.from('inventory').upsert({
          id: m.id,
          tenant_id: m.tenantId || 'tenant_atelie_sagrado',
          code: m.code,
          name: m.name,
          category: m.category || 'Geral',
          description: m.description || null,
          supplier: m.supplier || null,
          unit: m.unit || 'unidade',
          weight_g: m.weightG || 0,
          quantity: m.quantity || 0,
          min_quantity: m.minQuantity || 0,
          unit_value: m.unitValue || 0,
          calc_method: m.calcMethod || 'fixed',
          notes: m.notes || null,
          status: m.status || 'active',
          is_deleted: Boolean(m.isDeleted)
        });
      }

      // 4. Sync products
      for (const p of products) {
        await client.from('products').upsert({
          id: p.id,
          tenant_id: p.tenantId || 'tenant_atelie_sagrado',
          name: p.name,
          category: p.category || 'Terços',
          sku: p.sku,
          description: p.description || null,
          image: p.image || null,
          production_time_min: p.productionTimeMin || 0,
          final_weight_g: p.finalWeightG || 0,
          selling_price: p.sellingPrice || 0,
          composition: p.composition || [],
          status: p.status || 'active',
          is_deleted: Boolean(p.isDeleted)
        });
      }

      // 5. Sync orders
      for (const o of orders) {
        await client.from('orders').upsert({
          id: o.id,
          tenant_id: o.tenantId || 'tenant_atelie_sagrado',
          order_number: o.orderNumber,
          client_id: o.clientId || null,
          client_name: o.clientName,
          items: o.items || [],
          total_value: o.totalValue || 0,
          date: o.date || new Date().toISOString().split('T')[0],
          due_date: o.dueDate || new Date().toISOString().split('T')[0],
          status: o.status || 'received',
          production_progress: o.productionProgress || 0,
          responsible: o.responsible || null,
          timeline: o.timeline || [],
          snapshot: o.snapshot || {},
          is_archived: Boolean(o.isArchived),
          is_deleted: Boolean(o.isDeleted),
          is_cancelled: Boolean(o.isCancelled)
        });
      }

      // 6. Sync quotes
      for (const q of quotes) {
        await client.from('quotes').upsert({
          id: q.id,
          tenant_id: q.tenantId || 'tenant_atelie_sagrado',
          client_id: q.clientId || null,
          client_name: q.clientName,
          items: q.items || [],
          subtotal: q.subtotal || 0,
          discount: q.discount || 0,
          shipping: q.shipping || 0,
          total: q.total || 0,
          status: q.status || 'pending',
          date: q.date || new Date().toISOString().split('T')[0],
          is_deleted: Boolean(q.isDeleted)
        });
      }

      // 7. Sync financial
      for (const tr of transactions) {
        await client.from('financial_transactions').upsert({
          id: tr.id,
          tenant_id: tr.tenantId || 'tenant_atelie_sagrado',
          type: tr.type,
          category: tr.category,
          contact_name: tr.contactName || null,
          value: tr.value || 0,
          date: tr.date || new Date().toISOString().split('T')[0],
          payment_method: tr.paymentMethod || 'pix',
          notes: tr.notes || null,
          reconciled: Boolean(tr.reconciled),
          receipt_url: tr.receiptUrl || null,
          order_id: tr.orderId || null,
          is_deleted: Boolean(tr.isDeleted)
        });
      }

      // 8. Sync settings
      await client.from('settings').upsert({
        tenant_id: 'tenant_atelie_sagrado',
        company_name: settings.companyName || 'Ateliê Sagrado',
        logo: settings.logo || '📿',
        doc_logo: settings.docLogo || null,
        cnpj: settings.cnpj || null,
        phone: settings.phone || null,
        email: settings.email || null,
        address: settings.address || null,
        primary_color: settings.primaryColor || '#D4AF37',
        default_margin_percent: settings.defaultMarginPercent || 120,
        indirect_costs: settings.indirectCosts || 5.50,
        labor_hourly_rate: settings.laborHourlyRate || 25.00,
        theme: settings.theme || 'light',
        language: settings.language || 'pt-BR',
        notifications_enabled: settings.notificationsEnabled !== false
      });

      toast.success('Sincronização Concluída!', 'Todos os dados locais foram exportados com sucesso para o banco de dados Supabase.');
    } catch (err: any) {
      toast.error('Erro na Sincronização', err.message || 'Falha ao sincronizar dados com o Supabase.');
    } finally {
      setIsSyncing(false);
    }
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Database size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-stone-900">Conexão com Supabase</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isConfigured 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {isConfigured ? 'Pronto / Configurado' : 'Modo Offline / Local'}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Conecte seu banco de dados PostgreSQL na nuvem para persistência definitiva.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200/80 px-6 bg-stone-50/30 text-xs font-bold gap-2">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'border-amber-600 text-amber-700 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Key size={14} />
            <span>Credenciais & API</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'schema'
                ? 'border-amber-600 text-amber-700 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers size={14} />
            <span>Script SQL (Tabelas)</span>
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sync'
                ? 'border-amber-600 text-amber-700 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <UploadCloud size={14} />
            <span>Sincronizar Dados</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed flex items-start gap-3">
                <Sparkles size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Como obter suas chaves do Supabase:</p>
                  <p className="mt-1 text-amber-800 text-[11px]">
                    1. Acesse seu painel em <strong>app.supabase.com</strong> &gt; crie ou selecione seu projeto.<br/>
                    2. Vá em <strong>Project Settings &gt; API</strong>.<br/>
                    3. Copie a <strong>Project URL</strong> e a chave pública <strong>anon / public key</strong>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Project URL (URL do Projeto Supabase)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 text-xs focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Anon Key / Public Key (Chave Pública Anônima)
                </label>
                <textarea
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 text-xs focus:bg-white font-mono break-all"
                />
              </div>

              {testResult && (
                <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                  testResult.success 
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                    : 'bg-rose-50/70 border-rose-200 text-rose-900'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold">{testResult.success ? 'Conexão Bem-Sucedida' : 'Falha na Verificação'}</p>
                    <p className="text-[11px] mt-0.5 opacity-90">{testResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">DDL Schema para o Supabase SQL Editor</h4>
                  <p className="text-[11px] text-stone-500">Crie todas as tabelas, índices e relacionamentos em 1 comando.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {copiedSql ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedSql ? 'Copiado!' : 'Copiar Script SQL'}</span>
                </button>
              </div>

              <div className="bg-stone-900 text-stone-100 rounded-2xl p-4 font-mono text-[11px] max-h-64 overflow-y-auto leading-relaxed border border-stone-800">
                <pre>{`-- ATELIÊ SAGRADO ERP SCHEMA
CREATE TABLE public.tenants (...);
CREATE TABLE public.users (...);
CREATE TABLE public.clients (...);
CREATE TABLE public.inventory (...);
CREATE TABLE public.products (...);
CREATE TABLE public.quotes (...);
CREATE TABLE public.orders (...);
CREATE TABLE public.production_tasks (...);
CREATE TABLE public.financial_transactions (...);
CREATE TABLE public.settings (...);`}</pre>
              </div>

              <p className="text-[11px] text-stone-500">
                💡 O arquivo completo com todas as definições está disponível no projeto em <code className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-800 font-mono">/supabase/schema.sql</code>.
              </p>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-2 mb-2">
                  <Server size={15} className="text-amber-600" />
                  Estatísticas dos Dados Locais Prontos para Migração
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-xl border border-stone-200/60 text-center">
                    <span className="text-[10px] text-stone-400 font-bold block">Clientes</span>
                    <span className="text-sm font-black text-stone-800">{clients.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-stone-200/60 text-center">
                    <span className="text-[10px] text-stone-400 font-bold block">Insumos</span>
                    <span className="text-sm font-black text-stone-800">{inventory.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-stone-200/60 text-center">
                    <span className="text-[10px] text-stone-400 font-bold block">Produtos</span>
                    <span className="text-sm font-black text-stone-800">{products.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-stone-200/60 text-center">
                    <span className="text-[10px] text-stone-400 font-bold block">Pedidos</span>
                    <span className="text-sm font-black text-stone-800">{orders.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-stone-200/60 text-center">
                    <span className="text-[10px] text-stone-400 font-bold block">Orçamentos</span>
                    <span className="text-sm font-black text-stone-800">{quotes.length}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-stone-200/60 text-center">
                    <span className="text-[10px] text-stone-400 font-bold block">Transações</span>
                    <span className="text-sm font-black text-stone-800">{transactions.length}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Exportar & Sincronizar Tudo com 1 Clique</h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Envia todos os registros do Ateliê diretamente para suas tabelas no Supabase.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSyncToSupabase}
                  disabled={isSyncing}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50 shrink-0"
                >
                  <UploadCloud size={15} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Migrar para Supabase'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={isTesting ? 'animate-spin' : ''} />
              <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-stone-200/60 text-stone-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                handleSave();
                onClose();
              }}
              className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <ShieldCheck size={14} />
              <span>Salvar & Ativar</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
