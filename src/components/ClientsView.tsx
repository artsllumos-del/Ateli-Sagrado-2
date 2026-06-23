import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Client, ClientType } from '../types/erp';
import { 
 Search, Plus, Edit3, Trash2, X, Users, MapPin, Phone, Mail, 
 Briefcase, FileText, ShoppingBag, DollarSign, Calendar, Eye, AlertTriangle
} from 'lucide-react';
import { toast } from './Toast';

export const ClientsView: React.FC = () => {
 const { clients, orders, quotes, transactions, addClient, updateClient, deleteClient } = useDb();

 // View States
 const [search, setSearch] = useState('');
 const [selectedType, setSelectedType] = useState<'all' | 'PF' | 'PJ'>('all');
 const [showAddModal, setShowAddModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [showDetailModal, setShowDetailModal] = useState(false);
 const [selectedClient, setSelectedClient] = useState<Client | null>(null);
 const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

 // Form Fields
 const [formType, setFormType] = useState<ClientType>('PF');
 const [formData, setFormData] = useState({
 name: '',
 cpf: '',
 cnpj: '',
 email: '',
 phone: '',
 whatsapp: '',
 nomeFantasia: '',
 responsavel: '',
 cep: '',
 street: '',
 number: '',
 complement: '',
 neighborhood: '',
 city: '',
 state: ''
 });

 const activeClients = clients.filter(c => !c.isDeleted);

 // Filters logic
 const filteredClients = activeClients.filter(c => {
 const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
 c.email.toLowerCase().includes(search.toLowerCase()) ||
 (c.phone && c.phone.includes(search)) ||
 (c.cnpj && c.cnpj.includes(search)) ||
 (c.cpf && c.cpf.includes(search));
 const matchesType = selectedType === 'all' || c.type === selectedType;
 return matchesSearch && matchesType;
 });

 // Client History calculations
 const getClientStats = (clientId: string) => {
 const clientOrders = orders.filter(o => !o.isDeleted && o.clientId === clientId);
 const clientQuotes = quotes.filter(q => !q.isDeleted && q.clientId === clientId);
 const totalSpent = clientOrders.reduce((sum, o) => sum + o.totalValue, 0);
 return {
 ordersCount: clientOrders.length,
 quotesCount: clientQuotes.length,
 totalSpent,
 orders: clientOrders,
 quotes: clientQuotes
 };
 };

 const handleOpenAdd = () => {
 setFormType('PF');
 setFormData({
 name: '',
 cpf: '',
 cnpj: '',
 email: '',
 phone: '',
 whatsapp: '',
 nomeFantasia: '',
 responsavel: '',
 cep: '',
 street: '',
 number: '',
 complement: '',
 neighborhood: '',
 city: '',
 state: ''
 });
 setShowAddModal(true);
 };

 const handleOpenEdit = (client: Client) => {
 setSelectedClient(client);
 setFormType(client.type);
 setFormData({
 name: client.name,
 cpf: client.cpf || '',
 cnpj: client.cnpj || '',
 email: client.email,
 phone: client.phone,
 whatsapp: client.whatsapp,
 nomeFantasia: client.nomeFantasia || '',
 responsavel: client.responsavel || '',
 cep: client.cep || '',
 street: client.street || '',
 number: client.number || '',
 complement: client.complement || '',
 neighborhood: client.neighborhood || '',
 city: client.city || '',
 state: client.state || ''
 });
 setShowEditModal(true);
 };

 const handleSaveAdd = (e: React.FormEvent) => {
 e.preventDefault();
 if (!formData.name || !formData.email) {
 toast.error("Validação", "Nome/Razão Social e e-mail são obrigatórios.");
 return;
 }

 addClient({
 type: formType,
 name: formData.name,
 cpf: formType === 'PF' ? formData.cpf : undefined,
 cnpj: formType === 'PJ' ? formData.cnpj : undefined,
 email: formData.email,
 phone: formData.phone,
 whatsapp: formData.whatsapp,
 nomeFantasia: formType === 'PJ' ? formData.nomeFantasia : undefined,
 responsavel: formType === 'PJ' ? formData.responsavel : undefined,
 cep: formData.cep,
 street: formData.street,
 number: formData.number,
 complement: formData.complement,
 neighborhood: formData.neighborhood,
 city: formData.city,
 state: formData.state
 });

 toast.success("Cliente adicionado!", `O contato ${formData.name} foi criado.`);
 setShowAddModal(false);
 };

 const handleSaveEdit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedClient) return;

 updateClient(selectedClient.id, {
 type: formType,
 name: formData.name,
 cpf: formType === 'PF' ? formData.cpf : undefined,
 cnpj: formType === 'PJ' ? formData.cnpj : undefined,
 email: formData.email,
 phone: formData.phone,
 whatsapp: formData.whatsapp,
 nomeFantasia: formType === 'PJ' ? formData.nomeFantasia : undefined,
 responsavel: formType === 'PJ' ? formData.responsavel : undefined,
 cep: formData.cep,
 street: formData.street,
 number: formData.number,
 complement: formData.complement,
 neighborhood: formData.neighborhood,
 city: formData.city,
 state: formData.state
 });

 toast.success("Cliente salvo!", `Os dados de ${formData.name} foram atualizados.`);
 setShowEditModal(false);
 };

 const handleDelete = (id: string, name: string) => {
 setDeleteConfirm({ id, name });
 };

 const handleConfirmDelete = () => {
 if (!deleteConfirm) return;
 deleteClient(deleteConfirm.id);
 toast.warning("Cliente arquivado", `Contato "${deleteConfirm.name}" foi removido do catálogo ativo.`);
 setDeleteConfirm(null);
 };

 const handleViewDetail = (client: Client) => {
 setSelectedClient(client);
 setShowDetailModal(true);
 };

 return (
 <div className="space-y-6 animate-slide-in-up">
 
 {/* Control Filters Bar */}
 <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
 
 <div className="relative flex-1 max-w-md">
 <input
 type="text"
 placeholder="Buscar por nome, e-mail, telefone, CPF, CNPJ..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
 />
 <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
 </div>

 <select
 value={selectedType}
 onChange={(e) => setSelectedType(e.target.value as any)}
 className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
 >
 <option value="all">Pessoa Física & Jurídica</option>
 <option value="PF">Apenas Pessoa Física (PF)</option>
 <option value="PJ">Apenas Pessoa Jurídica (PJ)</option>
 </select>
 </div>

 <button
 onClick={handleOpenAdd}
 className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
 >
 <Plus size={14} /> Novo Cliente
 </button>
 </div>

 {/* Grid of Clients Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredClients.map(client => {
 const stats = getClientStats(client.id);

 return (
 <div key={client.id} className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
 <div>
 
 {/* Header line info type */}
 <div className="flex justify-between items-start">
 <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
 client.type === 'PJ' ? 'bg-indigo-500/10 text-indigo-650' : 'bg-emerald-500/10 text-emerald-600'
 }`}>
 {client.type === 'PJ' ? 'PESSOA JURÍDICA' : 'PESSOA FÍSICA'}
 </span>
 
 <span className="text-[10px] font-mono text-slate-400">
 ID: {client.id.substring(7, 11)}
 </span>
 </div>

 {/* Main Client Identity */}
 <div className="mt-3">
 <h3 className="font-bold text-sm text-slate-900 truncate">{client.name}</h3>
 {client.type === 'PJ' && client.nomeFantasia && (
 <p className="text-[11px] text-slate-500 font-semibold truncate mt-0.5">{client.nomeFantasia}</p>
 )}
 {client.type === 'PJ' && client.responsavel && (
 <p className="text-[10px] text-slate-450 mt-1 flex items-center gap-1.5 font-medium">
 <Briefcase size={10} /> Resp: {client.responsavel}
 </p>
 )}
 </div>

 {/* Direct info links contact */}
 <div className="mt-4 space-y-2 text-[11px] font-medium text-slate-600 ">
 <p className="flex items-center gap-2 truncate">
 <Mail size={12} className="text-slate-400" /> {client.email}
 </p>
 <p className="flex items-center gap-2 truncate">
 <Phone size={12} className="text-slate-400" /> {client.whatsapp || client.phone}
 </p>
 {client.city && (
 <p className="flex items-center gap-2 truncate">
 <MapPin size={12} className="text-slate-400" /> {client.city} - {client.state}
 </p>
 )}
 </div>

 {/* Historical counts stats block */}
 <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 ">
 <div className="p-2 bg-slate-50 rounded-xl text-center">
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total de Pedidos</p>
 <p className="text-sm font-black text-slate-800 mt-1">{stats.ordersCount}</p>
 </div>
 <div className="p-2 bg-slate-50 rounded-xl text-center">
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Compras</p>
 <p className="text-sm font-black text-amber-500 mt-1 font-mono">
 R$ {stats.totalSpent.toFixed(0)}
 </p>
 </div>
 </div>

 </div>

 {/* CRM Card Actions */}
 <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
 <button
 onClick={() => handleViewDetail(client)}
 className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-650 rounded-lg flex items-center gap-1 cursor-pointer"
 >
 <Eye size={12} /> Ver Histórico
 </button>

 <div className="flex gap-1.5">
 <button
 onClick={() => handleOpenEdit(client)}
 className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-500 cursor-pointer transition-all duration-200 active:scale-95"
 >
 <Edit3 size={12} />
 </button>
 <button
 onClick={() => handleDelete(client.id, client.name)}
 className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 cursor-pointer transition-all duration-200 active:scale-95"
 >
 <Trash2 size={12} />
 </button>
 </div>
 </div>

 </div>
 );
 })}
 {filteredClients.length === 0 && (
 <div className="col-span-3 py-16 text-center text-slate-450">
 Nenhum cliente artesanal cadastrado com esses parâmetros de busca.
 </div>
 )}
 </div>

 {/* MODALS CRM */}

 {/* 1. Client History / Detail Modal */}
 {showDetailModal && selectedClient && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
 <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up max-h-[85vh] flex flex-col">
 <div className="h-14 border-b border-slate-150 px-6 flex items-center justify-between">
 <h3 className="font-bold text-sm text-slate-900 ">Dossiê e Histórico do Cliente</h3>
 <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
 </div>

 <div className="p-6 space-y-5 overflow-y-auto flex-1">
 {/* Profile card summary */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150 ">
 <div>
 <h4 className="font-bold text-sm text-slate-900 ">{selectedClient.name}</h4>
 <p className="text-[10px] text-slate-450 mt-1">E-mail: {selectedClient.email}</p>
 <p className="text-[10px] text-slate-450">Whatsapp: {selectedClient.whatsapp}</p>
 {selectedClient.cpf && <p className="text-[10px] text-slate-450">CPF: {selectedClient.cpf}</p>}
 {selectedClient.cnpj && <p className="text-[10px] text-slate-450">CNPJ: {selectedClient.cnpj}</p>}
 </div>
 <div>
 <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wide">Endereço de Entrega</p>
 {selectedClient.street ? (
 <p className="text-[11px] text-slate-650 mt-1 leading-normal">
 {selectedClient.street}, nº {selectedClient.number} {selectedClient.complement && `(${selectedClient.complement})`} <br />
 {selectedClient.neighborhood} - {selectedClient.city}/{selectedClient.state} <br />
 CEP: {selectedClient.cep}
 </p>
 ) : (
 <p className="text-[11px] text-slate-450 italic mt-1">Nenhum endereço cadastrado.</p>
 )}
 </div>
 </div>

 {/* Orders History links */}
 <div>
 <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
 <ShoppingBag size={12} className="text-amber-500" /> Pedidos Praticados ({getClientStats(selectedClient.id).ordersCount})
 </h4>
 
 <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
 {getClientStats(selectedClient.id).orders.map(order => (
 <div key={order.id} className="flex justify-between items-center p-2.5 rounded-lg border border-slate-100 bg-slate-50/20 text-xs">
 <div>
 <p className="font-bold text-slate-750 ">{order.orderNumber}</p>
 <p className="text-[10px] text-slate-500">Prazo: {order.dueDate} | Progresso: {order.productionProgress}%</p>
 </div>
 <div className="text-right">
 <p className="font-bold text-slate-800 ">R$ {order.totalValue.toFixed(2)}</p>
 <span className="text-[9px] font-bold uppercase text-amber-600">{order.status}</span>
 </div>
 </div>
 ))}
 {getClientStats(selectedClient.id).orders.length === 0 && (
 <p className="text-xs text-slate-400 italic py-4 text-center">Nenhum pedido vinculado a este cliente.</p>
 )}
 </div>
 </div>

 {/* Quotes History */}
 <div>
 <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
 <FileText size={12} className="text-amber-500" /> Histórico de Orçamentos ({getClientStats(selectedClient.id).quotesCount})
 </h4>
 
 <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
 {getClientStats(selectedClient.id).quotes.map(quote => (
 <div key={quote.id} className="flex justify-between items-center p-2.5 rounded-lg border border-slate-100 bg-slate-50/20 text-xs">
 <div>
 <p className="font-bold text-slate-750 ">ORÇAMENTO #{quote.id.substring(6, 11)}</p>
 <p className="text-[10px] text-slate-500">Data de emissão: {quote.date}</p>
 </div>
 <div className="text-right">
 <p className="font-bold text-slate-800 font-mono">R$ {quote.total.toFixed(2)}</p>
 <span className="text-[9px] font-bold uppercase text-indigo-500">{quote.status}</span>
 </div>
 </div>
 ))}
 {getClientStats(selectedClient.id).quotes.length === 0 && (
 <p className="text-xs text-slate-400 italic py-4 text-center">Nenhum orçamento emitido para este cliente.</p>
 )}
 </div>
 </div>

 </div>

 <div className="h-14 border-t border-slate-150 px-6 flex items-center justify-end bg-slate-50 ">
 <button
 onClick={() => setShowDetailModal(false)}
 className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
 >
 Fechar Ficha
 </button>
 </div>
 </div>
 </div>
 )}

 {/* 2. Create / Edit Client Modal */}
 {(showAddModal || showEditModal) && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
 <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up max-h-[90vh] flex flex-col">
 <div className="h-14 border-b border-slate-150 px-6 flex items-center justify-between">
 <h3 className="font-bold text-sm text-slate-900 ">
 {showAddModal ? 'Adicionar Novo Cliente' : 'Editar Dados do Cliente'}
 </h3>
 <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
 </div>

 <form onSubmit={showAddModal ? handleSaveAdd : handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
 
 {/* Type selector: PF vs PJ */}
 <div className="flex gap-4 border-b border-slate-100 pb-3">
 <button
 type="button"
 onClick={() => setFormType('PF')}
 className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
 formType === 'PF' ? 'bg-slate-900 text-white ' : 'bg-slate-100 text-slate-500 '
 }`}
 >
 Pessoa Física (PF)
 </button>
 <button
 type="button"
 onClick={() => setFormType('PJ')}
 className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
 formType === 'PJ' ? 'bg-slate-900 text-white ' : 'bg-slate-100 text-slate-500 '
 }`}
 >
 Pessoa Jurídica (PJ)
 </button>
 </div>

 <div className="grid grid-cols-2 gap-4">
 
 {formType === 'PF' ? (
 <>
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nome Completo *</label>
 <input
 type="text"
 required
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 placeholder="Ex: Ana Maria de Sousa"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">CPF</label>
 <input
 type="text"
 value={formData.cpf}
 onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
 placeholder="000.000.000-00"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>
 </>
 ) : (
 <>
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Razão Social *</label>
 <input
 type="text"
 required
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 placeholder="Ex: Paróquia Nossa Senhora da Paz"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nome Fantasia</label>
 <input
 type="text"
 value={formData.nomeFantasia}
 onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
 placeholder="Ex: Paróquia NS Paz"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">CNPJ</label>
 <input
 type="text"
 value={formData.cnpj}
 onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
 placeholder="00.000.000/0000-00"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Responsável / Padre / Líder</label>
 <input
 type="text"
 value={formData.responsavel}
 onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
 placeholder="Ex: Padre Júlio Lancellotti"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>
 </>
 )}

 <div className="col-span-2 border-t border-slate-100 my-2 pt-2">
 <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Contato & Comunicação</h4>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Endereço de E-mail *</label>
 <input
 type="email"
 required
 value={formData.email}
 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 placeholder="contato@exemplo.com"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Telefone Comercial</label>
 <input
 type="text"
 value={formData.phone}
 onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
 placeholder="(00) 0000-0000"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">WhatsApp de Contato</label>
 <input
 type="text"
 value={formData.whatsapp}
 onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
 placeholder="(00) 90000-0000"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div className="col-span-2 border-t border-slate-100 my-2 pt-2">
 <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Endereço para Remessa</h4>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">CEP</label>
 <input
 type="text"
 value={formData.cep}
 onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
 placeholder="00000-000"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div className="col-span-2">
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Logradouro (Rua, Avenida)</label>
 <input
 type="text"
 value={formData.street}
 onChange={(e) => setFormData({ ...formData, street: e.target.value })}
 placeholder="Rua das Pérolas Sagradas"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Número</label>
 <input
 type="text"
 value={formData.number}
 onChange={(e) => setFormData({ ...formData, number: e.target.value })}
 placeholder="Ex: 108"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Complemento</label>
 <input
 type="text"
 value={formData.complement}
 onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
 placeholder="Ex: Apto 42, Bloco C"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Bairro</label>
 <input
 type="text"
 value={formData.neighborhood}
 onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
 placeholder="Ex: Centro"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cidade</label>
 <input
 type="text"
 value={formData.city}
 onChange={(e) => setFormData({ ...formData, city: e.target.value })}
 placeholder="Ex: São Paulo"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Estado (UF)</label>
 <input
 type="text"
 value={formData.state}
 onChange={(e) => setFormData({ ...formData, state: e.target.value })}
 placeholder="Ex: SP"
 maxLength={2}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>
 </div>

 <div className="pt-4 border-t border-slate-150 flex justify-end gap-3">
 <button
 type="button"
 onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
 className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
 >
 {showAddModal ? 'Adicionar Contato' : 'Salvar Alterações'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {deleteConfirm && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
 <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-slide-in-up">
 <div className="flex items-center gap-3 text-amber-600">
 <div className="p-2 bg-amber-50 rounded-lg">
 <AlertTriangle size={20} />
 </div>
 <h3 className="font-bold text-sm text-slate-900">Confirmar Arquivamento</h3>
 </div>
 <p className="text-xs text-slate-500 leading-relaxed">
 Deseja realmente arquivar o cliente <strong className="text-slate-800">"{deleteConfirm.name}"</strong>? O registro não será mais exibido na lista ativa.
 </p>
 <div className="flex justify-end gap-3 pt-2">
 <button
 onClick={() => setDeleteConfirm(null)}
 className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer transition-all duration-200 active:scale-95"
 >
 Cancelar
 </button>
 <button
 onClick={handleConfirmDelete}
 className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 active:scale-95"
 >
 Confirmar
 </button>
 </div>
 </div>
 </div>
 )}

 </div>
 );
};
