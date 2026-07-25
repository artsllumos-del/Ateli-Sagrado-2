import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { AppUser } from '../types/erp';
import { 
  Shield, Users, Plus, Edit3, Trash2, Key, Check, Eye, EyeOff, 
  Search, RefreshCw, UserCheck, UserX, FileText, CheckCircle2, 
  XCircle, Sparkles, AlertTriangle, ArrowLeft, Layers, Lock
} from 'lucide-react';
import { toast } from './Toast';
import { Pagination } from './Pagination';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
];

const MODULE_LABELS: Record<string, { label: string; desc: string }> = {
  dashboard: { label: 'Painel Executivo', desc: 'Acesso às métricas, faturamento e agenda geral.' },
  inventory: { label: 'Insumos & Estoque', desc: 'Gestão de materiais, custos unitários e ajustes.' },
  purchases: { label: 'Compras Necessárias', desc: 'Listagem de reposição automática e ordem de compra.' },
  products: { label: 'Catálogo de Joias', desc: 'Cadastro de peças e fichas de composição.' },
  pricing: { label: 'Motor de Precificação', desc: 'Simulação de margens e margem de lucro.' },
  clients: { label: 'Clientes CRM', desc: 'Cadastro de clientes PF/PJ, histórico e múltiplos endereços.' },
  quotes: { label: 'Orçamentos', desc: 'Simulação de propostas e conversão em pedidos.' },
  orders: { label: 'Pedidos de Venda', desc: 'Gestão de faturamento, prazos e recibos.' },
  production: { label: 'Chão de Fábrica', desc: 'Controle de etapas de montagem e artesãos.' },
  financial: { label: 'Fluxo Financeiro', desc: 'Lançamentos de receitas, despesas e conciliação.' },
  settings: { label: 'Configurações Globais', desc: 'Dados do ateliê, backups e criação de operadores.' },
};

export const UsersPermissionsView: React.FC = () => {
  const { user, users, addUser, updateUser, deleteUser, auditLogs } = useDb();

  // Primary Module Tab State: 'users' | 'matrix' | 'audit'
  const [activeTab, setActiveTab] = useState<'users' | 'matrix' | 'audit'>('users');

  // Form Drawer / Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Pagination State for Users List
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(5);

  // Pagination State for Audit Log List
  const [auditPage, setAuditPage] = useState(1);
  const [auditPerPage, setAuditPerPage] = useState(10);
  const [auditSearch, setAuditSearch] = useState('');

  // Password Reset Modal State
  const [resetModalUser, setResetModalUser] = useState<AppUser | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');

  // --- FORM FIELDS STATE ---
  const [fUsername, setFUsername] = useState('');
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fRole, setFRole] = useState<'Administrador' | 'Gerente' | 'Vendedor' | 'Artesão'>('Vendedor');
  const [fIsActive, setFIsActive] = useState(true);
  const [fPhotoUrl, setFPhotoUrl] = useState(PRESET_AVATARS[0]);
  const [showPass, setShowPass] = useState(false);

  // Permission Checkboxes
  const [perms, setPerms] = useState<Record<string, boolean>>({
    dashboard: true,
    inventory: true,
    purchases: true,
    products: true,
    pricing: true,
    clients: true,
    quotes: true,
    orders: true,
    production: true,
    financial: false,
    settings: false,
  });

  // Apply Role Preset permissions automatically
  const applyRolePreset = (roleName: 'Administrador' | 'Gerente' | 'Vendedor' | 'Artesão') => {
    setFRole(roleName);
    switch (roleName) {
      case 'Administrador':
        setPerms({
          dashboard: true, inventory: true, purchases: true, products: true, pricing: true,
          clients: true, quotes: true, orders: true, production: true, financial: true, settings: true
        });
        break;
      case 'Gerente':
        setPerms({
          dashboard: true, inventory: true, purchases: true, products: true, pricing: true,
          clients: true, quotes: true, orders: true, production: true, financial: true, settings: false
        });
        break;
      case 'Vendedor':
        setPerms({
          dashboard: true, inventory: true, purchases: true, products: true, pricing: true,
          clients: true, quotes: true, orders: true, production: false, financial: false, settings: false
        });
        break;
      case 'Artesão':
        setPerms({
          dashboard: true, inventory: true, purchases: true, products: true, pricing: false,
          clients: false, quotes: false, orders: false, production: true, financial: false, settings: false
        });
        break;
    }
  };

  // Generate strong random password
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFPassword(res);
    toast.info("Senha Gerada", `Senha provisória: ${res}`);
  };

  // Open Form for Creation
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFUsername('');
    setFName('');
    setFEmail('');
    setFPassword('123456');
    setFPhone('');
    setFPhotoUrl(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]);
    setFIsActive(true);
    applyRolePreset('Vendedor');
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (u: AppUser) => {
    setEditingUser(u);
    setFUsername(u.username || '');
    setFName(u.name || '');
    setFEmail(u.email || '');
    setFPassword(u.password || '');
    setFPhone(u.phone || '');
    setFPhotoUrl(u.photoUrl || PRESET_AVATARS[0]);
    setFIsActive(u.isActive !== false);
    setFRole((u.role as any) || 'Vendedor');
    setPerms({
      dashboard: u.permissions?.dashboard !== false,
      inventory: u.permissions?.inventory !== false,
      purchases: u.permissions?.purchases !== false,
      products: u.permissions?.products !== false,
      pricing: u.permissions?.pricing !== false,
      clients: u.permissions?.clients !== false,
      quotes: u.permissions?.quotes !== false,
      orders: u.permissions?.orders !== false,
      production: u.permissions?.production !== false,
      financial: u.permissions?.financial !== false,
      settings: u.permissions?.settings !== false,
    });
    setIsFormOpen(true);
  };

  // Submit User Form
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fUsername || !fName || !fEmail || !fPassword) {
      toast.error("Campos Obrigatórios", "Por favor, preencha nome, username, e-mail e senha.");
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        username: fUsername,
        name: fName,
        email: fEmail,
        password: fPassword,
        phone: fPhone,
        role: fRole,
        isActive: fIsActive,
        photoUrl: fPhotoUrl,
        permissions: perms as any,
      });
      toast.success("Operador Atualizado!", `As permissões e cadastro de ${fName} foram gravadas.`);
    } else {
      addUser({
        username: fUsername,
        name: fName,
        email: fEmail,
        password: fPassword,
        phone: fPhone,
        role: fRole,
        isActive: fIsActive,
        photoUrl: fPhotoUrl,
        permissions: perms as any,
      });
      toast.success("Operador Cadastrado!", `A conta de ${fName} está ativa com sucesso.`);
    }
    setIsFormOpen(false);
  };

  // Toggle User Active Status
  const handleToggleStatus = (u: AppUser) => {
    if (u.id === 'user_admin') {
      toast.error("Acesso Protegido", "Não é possível desativar a conta Administrador Master.");
      return;
    }
    const newStatus = !u.isActive;
    updateUser(u.id, { isActive: newStatus });
    toast.info(
      newStatus ? "Conta Ativada" : "Conta Inativada",
      `O operador ${u.name} agora está ${newStatus ? 'ativo' : 'desativado'}.`
    );
  };

  // Delete User
  const handleDeleteUserTrigger = (u: AppUser) => {
    if (u.id === 'user_admin' || u.id === user?.id) {
      toast.error("Acesso Protegido", "Você não pode excluir sua própria conta ou o Administrador Master.");
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir o operador "${u.name}"? Esta ação removerá as credenciais de acesso.`)) {
      deleteUser(u.id);
      toast.warning("Operador Removido", `${u.name} foi excluído do sistema.`);
    }
  };

  // Quick Password Reset Submit
  const handleConfirmPasswordReset = () => {
    if (!resetModalUser || !newResetPassword) return;
    updateUser(resetModalUser.id, { password: newResetPassword });
    toast.success("Senha Redefinida", `A nova senha de ${resetModalUser.name} foi atualizada com sucesso.`);
    setResetModalUser(null);
    setNewResetPassword('');
  };

  // Filtered Users List
  const filteredUsers = (users || []).filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = (u.name || '').toLowerCase().includes(q) ||
                          (u.email || '').toLowerCase().includes(q) ||
                          (u.username || '').toLowerCase().includes(q);
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || 
                          (selectedStatus === 'active' && u.isActive) || 
                          (selectedStatus === 'inactive' && !u.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Paginated Users List
  const paginatedUsers = filteredUsers.slice(
    (usersPage - 1) * usersPerPage,
    usersPage * usersPerPage
  );

  // Filtered Audit Logs
  const filteredAuditLogs = (auditLogs || []).filter(log => {
    const q = auditSearch.toLowerCase();
    return (log.user || '').toLowerCase().includes(q) ||
           (log.action || '').toLowerCase().includes(q) ||
           (log.module || '').toLowerCase().includes(q);
  });

  const paginatedAuditLogs = filteredAuditLogs.slice(
    (auditPage - 1) * auditPerPage,
    auditPage * auditPerPage
  );

  // Calculate Active Stats
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter(u => u.isActive).length;
  const adminUsersCount = users.filter(u => (u.role || '').toLowerCase().includes('admin')).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans animate-slide-in-up">
      {/* Top Header & Summary Stats */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700">
              <Shield size={22} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl text-slate-900">
                Operadores & Permissões
              </h2>
              <p className="text-xs text-slate-500">
                Gestão centralizada de credenciais, cargos e matriz de controle de acesso ao sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[100px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total</span>
            <span className="text-base font-extrabold text-slate-800">{totalUsersCount}</span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center min-w-[100px]">
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Ativos</span>
            <span className="text-base font-extrabold text-emerald-700">{activeUsersCount}</span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-center min-w-[100px]">
            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Admins</span>
            <span className="text-base font-extrabold text-amber-700">{adminUsersCount}</span>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
          >
            <Plus size={16} /> Novo Operador
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-amber-500/10 text-amber-700 border border-amber-300/50 shadow-xs'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          <Users size={16} /> Operadores Cadastrados
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white font-extrabold text-slate-700 border border-slate-200">
            {filteredUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'bg-amber-500/10 text-amber-700 border border-amber-300/50 shadow-xs'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          <Layers size={16} /> Matriz de Permissões
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-amber-500/10 text-amber-700 border border-amber-300/50 shadow-xs'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          <FileText size={16} /> Histórico de Auditoria
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white font-extrabold text-slate-700 border border-slate-200">
            {filteredAuditLogs.length}
          </span>
        </button>
      </div>

      {/* --- TAB 1: OPERADORES CADASTRADOS --- */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 border border-slate-200/80 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setUsersPage(1); }}
                placeholder="Buscar por nome, e-mail ou username..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Filter by Role */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                <span>Cargo:</span>
                <select
                  value={selectedRole}
                  onChange={(e) => { setSelectedRole(e.target.value); setUsersPage(1); }}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold py-1.5 px-3 text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="all">Todos os Cargos</option>
                  <option value="Administrador">Administrador</option>
                  <option value="Gerente">Gerente</option>
                  <option value="Vendedor">Vendedor</option>
                  <option value="Artesão">Artesão</option>
                </select>
              </div>

              {/* Filter by Status */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                <span>Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setUsersPage(1); }}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold py-1.5 px-3 text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Somente Ativos</option>
                  <option value="inactive">Somente Inativos</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Cards / List */}
          {paginatedUsers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
              <UserX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">Nenhum operador localizado</h3>
              <p className="text-xs text-slate-500 mt-1">Tente ajustar os termos de busca ou filtros aplicados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedUsers.map((u) => {
                const activePermsCount = Object.values(u.permissions || {}).filter(Boolean).length;
                const isCurrentLoggedIn = user?.id === u.id;

                return (
                  <div
                    key={u.id}
                    className={`p-5 rounded-2xl border transition-all bg-white shadow-xs flex flex-col justify-between ${
                      !u.isActive
                        ? 'border-slate-200 bg-slate-50/70 opacity-75'
                        : isCurrentLoggedIn
                        ? 'border-amber-300 ring-2 ring-amber-500/10'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Avatar, Info & Status */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={u.photoUrl || PRESET_AVATARS[0]}
                            alt={u.name}
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-100 shadow-xs shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif font-bold text-sm text-slate-900 leading-tight">
                                {u.name}
                              </h4>
                              {isCurrentLoggedIn && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-[9px] font-black uppercase tracking-wider">
                                  Você
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              Login: <strong className="text-slate-700">{u.username}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                            u.isActive
                              ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-500/10 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.isActive ? 'Ativo' : 'Bloqueado'}
                        </span>
                      </div>

                      {/* Cargo and Permissions Summary */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 font-extrabold text-[10px] uppercase">
                            {u.role || 'Operador'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            <strong className="text-slate-800">{activePermsCount}</strong> de 11 módulos
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions Toolbar */}
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            u.isActive
                              ? 'border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600'
                              : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                          title={u.isActive ? 'Inativar e bloquear login' : 'Reativar conta de operador'}
                        >
                          {u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                          <span>{u.isActive ? 'Desativar' : 'Ativar'}</span>
                        </button>

                        <button
                          onClick={() => { setResetModalUser(u); setNewResetPassword('123456'); }}
                          className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer flex items-center gap-1.5"
                          title="Redefinir Senha do Operador"
                        >
                          <Key size={13} />
                          <span>Senha</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                          title="Editar Credenciais & Permissões"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteUserTrigger(u)}
                          className="p-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition-all cursor-pointer"
                          title="Excluir Operador"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Standardized Pagination */}
          <Pagination
            currentPage={usersPage}
            totalPages={Math.ceil(filteredUsers.length / usersPerPage)}
            totalItems={filteredUsers.length}
            itemsPerPage={usersPerPage}
            onPageChange={setUsersPage}
            onItemsPerPageChange={(val) => { setUsersPerPage(val); setUsersPage(1); }}
            labelSingular="operador"
            labelPlural="operadores"
          />
        </div>
      )}

      {/* --- TAB 2: MATRIZ DE PERMISSÕES --- */}
      {activeTab === 'matrix' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif font-bold text-base text-slate-900">
              Matriz Comparativa de Perfis de Acesso
            </h3>
            <p className="text-xs text-slate-500">
              Visualização das permissões padrão recomendadas para cada perfil operacional do ateliê.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Módulo do Sistema</th>
                  <th className="p-3.5 text-center">Administrador Master</th>
                  <th className="p-3.5 text-center">Gerente Operacional</th>
                  <th className="p-3.5 text-center">Vendedor / Comercial</th>
                  <th className="p-3.5 text-center">Artesão / Fábrica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {Object.keys(MODULE_LABELS).map((modKey) => {
                  const info = MODULE_LABELS[modKey];
                  return (
                    <tr key={modKey} className="hover:bg-slate-50/60 transition-all">
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block text-xs">{info.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{info.desc}</span>
                      </td>
                      <td className="p-3.5 text-center">
                        <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                      </td>
                      <td className="p-3.5 text-center">
                        {modKey === 'settings' ? (
                          <XCircle size={16} className="text-slate-300 mx-auto" />
                        ) : (
                          <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {['dashboard', 'inventory', 'purchases', 'products', 'pricing', 'clients', 'quotes', 'orders'].includes(modKey) ? (
                          <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle size={16} className="text-slate-300 mx-auto" />
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {['dashboard', 'inventory', 'purchases', 'products', 'production'].includes(modKey) ? (
                          <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle size={16} className="text-slate-300 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: HISTÓRICO DE AUDITORIA --- */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200/80 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
                placeholder="Filtrar logs por usuário, ação ou módulo..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Rastreabilidade de alterações com carimbo de data e hora.
            </span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            {paginatedAuditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Nenhum registro de auditoria encontrado para o filtro.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3.5">Data & Hora</th>
                    <th className="p-3.5">Operador / Usuário</th>
                    <th className="p-3.5">Ação Realizada</th>
                    <th className="p-3.5">Módulo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-all">
                      <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{log.user}</td>
                      <td className="p-3.5">{log.action}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold uppercase text-slate-600 border border-slate-200">
                          {log.module || 'sistema'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Audit Pagination */}
          <Pagination
            currentPage={auditPage}
            totalPages={Math.ceil(filteredAuditLogs.length / auditPerPage)}
            totalItems={filteredAuditLogs.length}
            itemsPerPage={auditPerPage}
            onPageChange={setAuditPage}
            onItemsPerPageChange={(val) => { setAuditPerPage(val); setAuditPage(1); }}
            labelSingular="log"
            labelPlural="logs de auditoria"
          />
        </div>
      )}

      {/* --- MODAL / DRAWER FORM FOR CREATING & EDITING OPERATORS --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-scale-in my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700">
                  <Shield size={20} />
                </div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  {editingUser ? `Editar Operador: ${editingUser.name}` : 'Cadastrar Novo Operador'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-5 text-xs font-semibold">
              {/* Presets and Avatar Row */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase font-bold text-slate-500">
                  Foto de Perfil do Operador
                </label>
                <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <img
                    src={fPhotoUrl || PRESET_AVATARS[0]}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500/30 shrink-0"
                  />
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={fPhotoUrl}
                      onChange={(e) => setFPhotoUrl(e.target.value)}
                      placeholder="Cole a URL de uma imagem..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Sugestões rápidas:</span>
                      {PRESET_AVATARS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFPhotoUrl(url)}
                          className="w-6 h-6 rounded-full overflow-hidden border border-slate-300 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Credentials Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Username de Login *
                  </label>
                  <input
                    type="text"
                    required
                    value={fUsername}
                    onChange={(e) => setFUsername(e.target.value)}
                    placeholder="Ex: joao.silva"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    E-mail de Trabalho *
                  </label>
                  <input
                    type="email"
                    required
                    value={fEmail}
                    onChange={(e) => setFEmail(e.target.value)}
                    placeholder="exemplo@atelie.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">
                      Senha *
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[10px] font-extrabold text-amber-600 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles size={11} /> Gerar Senha
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      value={fPassword}
                      onChange={(e) => setFPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={fPhone}
                    onChange={(e) => setFPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                    Status da Conta
                  </label>
                  <select
                    value={fIsActive ? 'yes' : 'no'}
                    onChange={(e) => setFIsActive(e.target.value === 'yes')}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800"
                  >
                    <option value="yes">Conta Ativa (Acesso Liberado)</option>
                    <option value="no">Conta Bloqueada (Inativa)</option>
                  </select>
                </div>
              </div>

              {/* Role Preset Selector */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="block text-[10px] uppercase font-bold text-slate-500">
                  Perfil de Cargo e Predefinição Automática
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Administrador', 'Gerente', 'Vendedor', 'Artesão'] as const).map((roleName) => (
                    <button
                      key={roleName}
                      type="button"
                      onClick={() => applyRolePreset(roleName)}
                      className={`p-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer text-center ${
                        fRole === roleName
                          ? 'bg-amber-500/10 border-amber-400 text-amber-800 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {roleName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fine-grained Module Permissions Matrix Checkboxes */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase font-bold text-slate-500">
                    Controle Fino de Módulos Permitidos (11 Módulos)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allOn: Record<string, boolean> = {};
                        Object.keys(MODULE_LABELS).forEach(k => allOn[k] = true);
                        setPerms(allOn);
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Marcar Todos
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allOff: Record<string, boolean> = {};
                        Object.keys(MODULE_LABELS).forEach(k => allOff[k] = false);
                        setPerms(allOff);
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  {Object.keys(MODULE_LABELS).map((modKey) => {
                    const info = MODULE_LABELS[modKey];
                    const isChecked = Boolean(perms[modKey]);
                    return (
                      <label
                        key={modKey}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-white border-amber-300 shadow-2xs'
                            : 'bg-slate-100/60 border-slate-200 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setPerms({ ...perms, [modKey]: e.target.checked })}
                          className="mt-0.5 rounded border-slate-300 text-amber-500 focus:ring-amber-500/20"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">{info.label}</span>
                          <span className="text-[10px] text-slate-400 font-normal leading-snug block">
                            {info.desc}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Salvar Operador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- QUICK PASSWORD RESET MODAL --- */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700">
                <Key size={20} />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900">
                Redefinir Senha do Operador
              </h3>
            </div>

            <p className="text-xs text-slate-500">
              Digite uma nova senha provisória para <strong>{resetModalUser.name}</strong> ({resetModalUser.username}).
            </p>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                Nova Senha
              </label>
              <input
                type="text"
                value={newResetPassword}
                onChange={(e) => setNewResetPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-900 font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPasswordReset}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Confirmar Nova Senha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
