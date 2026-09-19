import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { Tenant } from '../../types/erp';
import { 
  Building2, 
  Plus, 
  Check, 
  Layers, 
  Sparkles, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Globe,
  Palette,
  ExternalLink,
  Shield,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { toast } from '../Toast';

export const TenantsManagementView: React.FC = () => {
  const { 
    tenants, 
    currentTenant, 
    switchTenant, 
    createTenant, 
    updateTenant, 
    deleteTenant,
    clients,
    inventory,
    products,
    orders,
    transactions
  } = useDb();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDocument, setFormDocument] = useState('');
  const [formRazaoSocial, setFormRazaoSocial] = useState('');
  const [formNomeFantasia, setFormNomeFantasia] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formColor, setFormColor] = useState('#D4AF37');
  const [formPlan, setFormPlan] = useState<'free_trial' | 'basic' | 'professional' | 'enterprise'>('professional');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const resetForm = () => {
    setFormName('');
    setFormSlug('');
    setFormDocument('');
    setFormRazaoSocial('');
    setFormNomeFantasia('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setFormColor('#D4AF37');
    setFormPlan('professional');
    setEditingTenant(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEdit = (t: Tenant) => {
    setEditingTenant(t);
    setFormName(t.name);
    setFormSlug(t.slug);
    setFormDocument(t.document || '');
    setFormRazaoSocial(t.razaoSocial || '');
    setFormNomeFantasia(t.nomeFantasia || '');
    setFormEmail(t.email || '');
    setFormPhone(t.phone || '');
    setFormAddress(t.address || '');
    setFormColor(t.primaryColor || '#D4AF37');
    setFormPlan(t.planId || 'professional');
    setShowCreateModal(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingTenant) {
      const generatedSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Erro', 'Informe o nome do Ateliê / Filial.');
      return;
    }
    if (!formSlug.trim()) {
      toast.error('Erro', 'Informe o identificador / slug da unidade.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTenant) {
        await updateTenant(editingTenant.id, {
          name: formName,
          slug: formSlug,
          document: formDocument,
          razaoSocial: formRazaoSocial,
          nomeFantasia: formNomeFantasia || formName,
          email: formEmail,
          phone: formPhone,
          address: formAddress,
          primaryColor: formColor,
          planId: formPlan
        });
        toast.success('Ateliê Atualizado', `As informações de "${formName}" foram salvas.`);
      } else {
        const newT = await createTenant({
          name: formName,
          slug: formSlug,
          document: formDocument,
          razaoSocial: formRazaoSocial,
          nomeFantasia: formNomeFantasia || formName,
          email: formEmail,
          phone: formPhone,
          address: formAddress,
          primaryColor: formColor,
          planId: formPlan,
          status: 'active'
        });
        toast.success('Novo Ateliê Criado!', `A unidade "${newT.name}" já está disponível para uso.`);
      }
      setShowCreateModal(false);
      resetForm();
    } catch (err: unknown) {
      toast.error('Erro', err instanceof Error ? err.message : 'Falha ao salvar ateliê.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Copiado', 'ID da Unidade copiado para a área de transferência.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (t: Tenant) => {
    if (tenants.length <= 1) {
      toast.error('Operação Bloqueada', 'Você não pode excluir a única unidade ativa do sistema.');
      return;
    }
    if (t.id === currentTenant.id) {
      toast.error('Atenção', 'Troque para outra unidade antes de excluir esta.');
      return;
    }
    if (confirm(`Tem certeza que deseja excluir a unidade "${t.name}"? Os registros locais associados serão limpos.`)) {
      await deleteTenant(t.id);
      toast.success('Unidade Removida', `O Ateliê "${t.name}" foi removido com sucesso.`);
    }
  };

  // Metrics for active tenant
  const activeClientsCount = clients.length;
  const activeInventoryCount = inventory.length;
  const activeProductsCount = products.length;
  const activeOrdersCount = orders.filter(o => o.status !== 'completed').length;
  const totalRevenue = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.value, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanation */}
      <div className="bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 border border-gold-500/20 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-700 shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-bold text-ink-900">
                  Gestão Multi-Tenant & Filiais
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Multi-Unidades Ativo
                </span>
              </div>
              <p className="text-xs text-ink-500 mt-1 max-w-2xl leading-relaxed">
                Cada ateliê ou filial possui seu próprio banco de dados isolado com clientes, estoque de materiais, composição de terços, precificação, pedidos de venda e fluxo de caixa segregados.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            Novo Ateliê / Filial
          </button>
        </div>
      </div>

      {/* Active Workspace Stats Banner */}
      <div className="bg-white border border-[rgba(42,36,32,0.08)] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[rgba(42,36,32,0.06)] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-3.5 h-3.5 rounded-full shadow-xs" 
              style={{ backgroundColor: currentTenant?.primaryColor || '#D4AF37' }}
            />
            <div>
              <span className="text-2xs font-semibold uppercase tracking-wider text-ink-400">Ateliê Conectado no Momento</span>
              <h4 className="text-base font-serif font-bold text-ink-900 flex items-center gap-2">
                {currentTenant?.name}
                <span className="text-xs font-mono font-normal text-slate-500 px-2 py-0.5 rounded bg-slate-100">
                  {currentTenant?.slug}
                </span>
              </h4>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold-50 text-gold-800 border border-gold-200/60">
            Plano {currentTenant?.planId?.toUpperCase() || 'PROFESSIONAL'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
            <span className="text-2xs font-medium text-slate-500 block mb-1">Clientes Isolados</span>
            <span className="text-lg font-bold text-ink-900">{activeClientsCount}</span>
          </div>
          <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
            <span className="text-2xs font-medium text-slate-500 block mb-1">Itens em Estoque</span>
            <span className="text-lg font-bold text-ink-900">{activeInventoryCount}</span>
          </div>
          <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
            <span className="text-2xs font-medium text-slate-500 block mb-1">Produtos no Catálogo</span>
            <span className="text-lg font-bold text-ink-900">{activeProductsCount}</span>
          </div>
          <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
            <span className="text-2xs font-medium text-slate-500 block mb-1">Pedidos Ativos</span>
            <span className="text-lg font-bold text-ink-900">{activeOrdersCount}</span>
          </div>
          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 col-span-2 sm:col-span-1">
            <span className="text-2xs font-medium text-amber-700 block mb-1">Faturamento da Unidade</span>
            <span className="text-lg font-bold text-amber-900">
              {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>
      </div>

      {/* List of all registered tenants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(tenants || []).map((t) => {
          const isCurrent = t.id === currentTenant?.id;
          return (
            <div 
              key={t.id}
              className={`bg-white border rounded-2xl p-5 transition-all flex flex-col justify-between ${
                isCurrent 
                  ? 'border-gold-500 ring-2 ring-gold-500/10 shadow-md' 
                  : 'border-[rgba(42,36,32,0.08)] hover:border-slate-300 shadow-xs hover:shadow'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                      style={{ backgroundColor: t.primaryColor || '#D4AF37' }}
                    >
                      {t.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-ink-900 text-sm leading-snug">
                        {t.name}
                      </h4>
                      <span className="text-2xs font-mono text-slate-500 block">
                        slug: /{t.slug}
                      </span>
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-gold-100 text-gold-800 border border-gold-200 shrink-0 flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      Conectado
                    </span>
                  )}
                </div>

                {/* Details list */}
                <div className="space-y-2 text-xs text-ink-600 my-4 pt-3 border-t border-slate-100">
                  {t.document && (
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-slate-400 shrink-0" />
                      <span className="font-mono text-2xs text-slate-700">{t.document}</span>
                    </div>
                  )}
                  {t.address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-2xs text-slate-600 line-clamp-1">{t.address}</span>
                    </div>
                  )}
                  {t.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span className="text-2xs text-slate-600">{t.phone}</span>
                    </div>
                  )}
                  {t.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="text-2xs text-slate-600 truncate">{t.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopyId(t.id)}
                    title="Copiar ID do Tenant"
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-2xs flex items-center gap-1"
                  >
                    <Copy size={13} />
                    {copiedId === t.id ? 'Copiado!' : 'ID'}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(t)}
                    title="Editar informações do Ateliê"
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <Edit3 size={14} />
                  </button>
                  {!isCurrent && (
                    <button
                      onClick={() => handleDelete(t)}
                      title="Excluir este ateliê"
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {isCurrent ? (
                  <span className="text-2xs font-semibold text-gold-700 bg-gold-50 px-2.5 py-1 rounded-lg">
                    Ambiente Ativo
                  </span>
                ) : (
                  <button
                    onClick={() => switchTenant(t.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    <span>Acessar</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Create / Edit Tenant */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-[rgba(42,36,32,0.1)] flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold-500/10 text-gold-700 flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-ink-900 text-base">
                    {editingTenant ? 'Editar Unidade' : 'Novo Ateliê / Filial'}
                  </h3>
                  <p className="text-2xs text-slate-500">Configuração de isolamento de dados multi-tenant</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome do Ateliê / Filial *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Ateliê Sagrado (Filial Campinas)"
                  value={formName}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Slug / Identificador *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="filial-campinas"
                    value={formSlug}
                    onChange={e => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    CNPJ / CPF
                  </label>
                  <input 
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={formDocument}
                    onChange={e => setFormDocument(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Razão Social
                  </label>
                  <input 
                    type="text"
                    placeholder="Nome Empresarial Ltda"
                    value={formRazaoSocial}
                    onChange={e => setFormRazaoSocial(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nome Fantasia
                  </label>
                  <input 
                    type="text"
                    placeholder="Marca da Unidade"
                    value={formNomeFantasia}
                    onChange={e => setFormNomeFantasia(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    E-mail Comercial
                  </label>
                  <input 
                    type="email"
                    placeholder="contato@filial.com.br"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input 
                    type="text"
                    placeholder="(11) 99999-0000"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Endereço Completo
                </label>
                <input 
                  type="text"
                  placeholder="Rua, número, bairro, cidade - UF"
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Palette size={13} className="text-gold-600" />
                    Cor Primária
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      value={formColor}
                      onChange={e => setFormColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                    />
                    <input 
                      type="text"
                      value={formColor}
                      onChange={e => setFormColor(e.target.value)}
                      className="w-full px-2.5 py-1.5 font-mono text-xs rounded-lg border border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Plano Atribuído
                  </label>
                  <select
                    value={formPlan}
                    onChange={e => setFormPlan(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-white"
                  >
                    <option value="free_trial">Degustação (10 dias)</option>
                    <option value="basic">Básico</option>
                    <option value="professional">Profissional (Recomendado)</option>
                    <option value="enterprise">Empresarial / Franquia</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-gold-600 hover:bg-gold-700 text-white font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? 'Salvando...' : (editingTenant ? 'Atualizar Ateliê' : 'Criar Unidade')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
