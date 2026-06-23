import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { InventoryItem, CalcMethod, InventoryStatus } from '../types/erp';
import { 
 Search, Grid, List, Filter, Plus, ArrowUpRight, ArrowDownRight, Edit3, Trash2, 
 Settings, Check, X, ShieldAlert, ArrowUpDown, ChevronDown, RefreshCw, AlertTriangle
} from 'lucide-react';
import { toast } from './Toast';

export const InventoryView: React.FC = () => {
 const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, adjustStock } = useDb();

 // Component States
 const [search, setSearch] = useState('');
 const [selectedCategory, setSelectedCategory] = useState('all');
 const [selectedStatus, setSelectedStatus] = useState('all');
 const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
 const [showAddModal, setShowAddModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [showAdjustModal, setShowAdjustModal] = useState(false);
 const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
 const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

 // Form states
 const [formData, setFormData] = useState({
 name: '',
 category: 'Contas e Pérolas',
 code: '',
 description: '',
 supplier: '',
 unit: 'unidade',
 weightG: 0,
 quantity: 0,
 minQuantity: 0,
 unitValue: 0,
 calcMethod: 'fixed' as CalcMethod,
 notes: '',
 status: 'active' as InventoryStatus
 });

 // Adjust Form state
 const [adjustData, setAdjustData] = useState({
 itemId: '',
 amount: 1,
 type: 'add' as 'add' | 'subtract',
 notes: '',
 supplierName: ''
 });

 // Unique categories & suppliers for filters
 const activeItems = inventory.filter(item => !item.isDeleted);
 const categories = Array.from(new Set(activeItems.map(i => i.category)));
 const suppliers = Array.from(new Set(activeItems.map(i => i.supplier).filter(Boolean)));

 // Indicators
 const totalItems = activeItems.length;
 const normalStock = activeItems.filter(i => i.quantity > i.minQuantity).length;
 const lowStock = activeItems.filter(i => i.quantity <= i.minQuantity && i.quantity > 0).length;
 const outOfStock = activeItems.filter(i => i.quantity === 0).length;

 // Filter & Search Logic
 const filteredItems = activeItems.filter(item => {
 const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
 item.code.toLowerCase().includes(search.toLowerCase()) || 
 item.supplier.toLowerCase().includes(search.toLowerCase());
 const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
 const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
 return matchesSearch && matchesCategory && matchesStatus;
 });

 // Form Handlers
 const handleOpenAdd = () => {
 setFormData({
 name: '',
 category: 'Contas e Pérolas',
 code: 'INS-' + Math.floor(100 + Math.random() * 900),
 description: '',
 supplier: '',
 unit: 'unidade',
 weightG: 0,
 quantity: 0,
 minQuantity: 5,
 unitValue: 0,
 calcMethod: 'fixed',
 notes: '',
 status: 'active'
 });
 setShowAddModal(true);
 };

 const handleOpenEdit = (item: InventoryItem) => {
 setSelectedItem(item);
 setFormData({
 name: item.name,
 category: item.category,
 code: item.code,
 description: item.description,
 supplier: item.supplier,
 unit: item.unit,
 weightG: item.weightG,
 quantity: item.quantity,
 minQuantity: item.minQuantity,
 unitValue: item.unitValue,
 calcMethod: item.calcMethod,
 notes: item.notes,
 status: item.status
 });
 setShowEditModal(true);
 };

 const handleOpenAdjust = (item: InventoryItem) => {
 setSelectedItem(item);
 setAdjustData({
 itemId: item.id,
 amount: 10,
 type: 'add',
 notes: 'Ajuste de estoque regular',
 supplierName: item.supplier || ''
 });
 setShowAdjustModal(true);
 };

 const handleSaveAdd = (e: React.FormEvent) => {
 e.preventDefault();
 if (!formData.name || !formData.code || formData.unitValue < 0) {
 toast.error("Validação", "Preencha todos os campos obrigatórios corretamente.");
 return;
 }
 addInventoryItem(formData);
 toast.success("Insumo cadastrado!", `Matéria-prima ${formData.name} adicionada ao estoque.`);
 setShowAddModal(false);
 };

 const handleSaveEdit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedItem) return;
 updateInventoryItem(selectedItem.id, formData);
 toast.success("Insumo atualizado!", `Dados de ${formData.name} foram salvos com sucesso.`);
 setShowEditModal(false);
 };

 const handleDelete = (id: string, name: string) => {
 setDeleteConfirm({ id, name });
 };

 const handleConfirmDelete = () => {
 if (!deleteConfirm) return;
 deleteInventoryItem(deleteConfirm.id);
 toast.warning("Insumo removido", `Insumo "${deleteConfirm.name}" foi marcado como excluído.`);
 setDeleteConfirm(null);
 };

 const handleSaveAdjust = (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedItem) return;
 const finalAmount = adjustData.type === 'add' ? adjustData.amount : -adjustData.amount;
 adjustStock(selectedItem.id, finalAmount, adjustData.notes, selectedItem.category, adjustData.supplierName);
 toast.success("Estoque Ajustado", `${selectedItem.name}: saldo atualizado em ${finalAmount > 0 ? '+' : ''}${finalAmount} ${selectedItem.unit}.`);
 setShowAdjustModal(false);
 };

 return (
 <div className="space-y-6 animate-slide-in-up">
 
 {/* Header Summary Cards / Indicators */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 
 <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-sm flex items-center justify-between">
 <div>
 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total de Insumos</span>
 <span className="text-xl sm:text-2xl font-black font-mono mt-1 block">{totalItems}</span>
 </div>
 <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-650">
 <Settings size={18} />
 </div>
 </div>

 <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-sm flex items-center justify-between">
 <div>
 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Estoque Saudável</span>
 <span className="text-xl sm:text-2xl font-black font-mono mt-1 block text-emerald-600">{normalStock}</span>
 </div>
 <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
 <Check size={18} />
 </div>
 </div>

 <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-sm flex items-center justify-between">
 <div>
 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Estoque Baixo</span>
 <span className="text-xl sm:text-2xl font-black font-mono mt-1 block text-amber-500">{lowStock}</span>
 </div>
 <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
 <Filter size={18} />
 </div>
 </div>

 <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-sm flex items-center justify-between">
 <div>
 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Esgotado / Crítico</span>
 <span className="text-xl sm:text-2xl font-black font-mono mt-1 block text-rose-500">{outOfStock}</span>
 </div>
 <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
 <X size={18} />
 </div>
 </div>

 </div>

 {/* Control Bar: Search, Filters & Views Toggles */}
 <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
 
 {/* Instant Search input */}
 <div className="relative flex-1 max-w-md">
 <input
 type="text"
 placeholder="Buscar insumo, código, fornecedor..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder-slate-400"
 />
 <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
 </div>

 {/* Category Dropdown */}
 <select
 value={selectedCategory}
 onChange={(e) => setSelectedCategory(e.target.value)}
 className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
 >
 <option value="all">Todas as Categorias</option>
 {categories.map(c => <option key={c} value={c}>{c}</option>)}
 </select>

 {/* Status filter */}
 <select
 value={selectedStatus}
 onChange={(e) => setSelectedStatus(e.target.value)}
 className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
 >
 <option value="all">Todos os Status</option>
 <option value="active">Ativo</option>
 <option value="inactive">Inativo</option>
 </select>
 </div>

 {/* View mode toggle and Add button */}
 <div className="flex items-center gap-3 shrink-0">
 <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 p-1">
 <button
 onClick={() => setViewMode('table')}
 className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white text-amber-500 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
 >
 <List size={14} />
 </button>
 <button
 onClick={() => setViewMode('cards')}
 className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'cards' ? 'bg-white text-amber-500 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
 >
 <Grid size={14} />
 </button>
 </div>

 <button
 onClick={handleOpenAdd}
 className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
 >
 <Plus size={14} /> Novo Insumo
 </button>
 </div>
 </div>

 {/* Main Inventory Listing Block */}
 {viewMode === 'table' ? (
 <div className="bg-white border border-slate-200/85 rounded-2xl shadow-sm overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full min-w-[800px] text-left text-xs">
 <thead>
 <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/40 ">
 <th className="p-4 font-bold text-[10px]">Cód Insumo</th>
 <th className="p-4 font-bold text-[10px]">Insumo / Nome</th>
 <th className="p-4 font-bold text-[10px]">Categoria</th>
 <th className="p-4 font-bold text-[10px]">Fornecedor</th>
 <th className="p-4 font-bold text-[10px]">Preço Unitário</th>
 <th className="p-4 font-bold text-[10px]">Saldo Atual</th>
 <th className="p-4 font-bold text-[10px]">Status</th>
 <th className="p-4 font-bold text-[10px] text-right">Ações</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {filteredItems.map(item => {
 const isLow = item.quantity <= item.minQuantity && item.quantity > 0;
 const isCritical = item.quantity === 0;

 return (
 <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
 <td className="p-4 font-mono font-bold text-slate-500">{item.code}</td>
 <td className="p-4">
 <div>
 <p className="font-bold text-slate-800 ">{item.name}</p>
 <p className="text-[10px] text-slate-450 mt-0.5">{item.unit} | {item.weightG}g por unidade</p>
 </div>
 </td>
 <td className="p-4 font-semibold text-slate-600 ">{item.category}</td>
 <td className="p-4 text-slate-500 font-medium">{item.supplier || '-'}</td>
 <td className="p-4 font-bold font-mono text-slate-800 ">
 R$ {item.unitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
 </td>
 <td className="p-4">
 <div className="flex items-center gap-2">
 <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
 isCritical ? 'bg-rose-500/10 text-rose-600' :
 isLow ? 'bg-amber-500/10 text-amber-600' :
 'bg-slate-100 text-slate-700 '
 }`}>
 {item.quantity}
 </span>
 {(isCritical || isLow) && (
 <span className={`text-[10px] font-bold ${isCritical ? 'text-rose-500' : 'text-amber-500'}`}>
 {isCritical ? 'CRÍTICO' : 'BAIXO'}
 </span>
 )}
 </div>
 </td>
 <td className="p-4">
 <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
 item.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-400'
 }`}>
 {item.status === 'active' ? 'ATIVO' : 'INATIVO'}
 </span>
 </td>
 <td className="p-4 text-right">
 <div className="flex justify-end gap-2">
 <button
 onClick={() => handleOpenAdjust(item)}
 title="Entrada/Saída"
 className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-amber-500 cursor-pointer transition-all duration-200 active:scale-95"
 >
 <ArrowUpDown size={12} />
 </button>
 <button
 onClick={() => handleOpenEdit(item)}
 title="Editar"
 className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-500 cursor-pointer transition-all duration-200 active:scale-95"
 >
 <Edit3 size={12} />
 </button>
 <button
 onClick={() => handleDelete(item.id, item.name)}
 title="Excluir"
 className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer transition-all duration-200 active:scale-95"
 >
 <Trash2 size={12} />
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 {filteredItems.length === 0 && (
 <tr>
 <td colSpan={8} className="p-8 text-center text-slate-400">
 Nenhum item encontrado para as configurações de filtro atuais.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredItems.map(item => {
 const isLow = item.quantity <= item.minQuantity && item.quantity > 0;
 const isCritical = item.quantity === 0;

 return (
 <div 
 key={item.id} 
 className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
 isCritical ? 'border-rose-200 ' :
 isLow ? 'border-amber-200 ' :
 'border-slate-200/85 '
 }`}
 >
 <div>
 <div className="flex justify-between items-start gap-2">
 <span className="text-[10px] font-mono font-bold text-slate-400">{item.code}</span>
 <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
 item.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-400'
 }`}>
 {item.status === 'active' ? 'ATIVO' : 'INATIVO'}
 </span>
 </div>

 <h3 className="font-bold text-sm text-slate-900 mt-2 truncate">{item.name}</h3>
 <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">{item.category}</p>
 
 <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-[11px]">
 <div>
 <p className="text-slate-400 font-medium">Unidade / Peso</p>
 <p className="font-bold text-slate-700 mt-0.5">{item.unit} | {item.weightG}g</p>
 </div>
 <div>
 <p className="text-slate-400 font-medium">Preço Unitário</p>
 <p className="font-bold text-slate-700 mt-0.5">R$ {item.unitValue.toFixed(2)}</p>
 </div>
 </div>

 {item.notes && (
 <p className="text-[10px] text-slate-450 italic mt-3 bg-slate-50 p-2 rounded-lg line-clamp-2">
 "{item.notes}"
 </p>
 )}
 </div>

 <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
 <div className="flex items-center gap-1.5">
 <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} />
 <span className="text-xs font-mono font-bold text-slate-850 ">
 Qtd: {item.quantity} {item.unit}
 </span>
 </div>

 <div className="flex gap-1.5">
 <button
 onClick={() => handleOpenAdjust(item)}
 className="p-1.5 rounded-lg border border-slate-150 hover:bg-slate-50 text-slate-600 hover:text-amber-500 cursor-pointer"
 >
 <ArrowUpDown size={12} />
 </button>
 <button
 onClick={() => handleOpenEdit(item)}
 className="p-1.5 rounded-lg border border-slate-150 hover:bg-slate-50 text-slate-600 hover:text-blue-500 cursor-pointer"
 >
 <Edit3 size={12} />
 </button>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* MODALS SECTION */}
 
 {/* 1. Create Insumo Modal */}
 {showAddModal && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
 <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up max-h-[90vh] flex flex-col">
 <div className="h-14 border-b border-slate-150 px-6 flex items-center justify-between">
 <h3 className="font-bold text-sm text-slate-900 ">Novo Insumo Artesanal</h3>
 <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
 </div>

 <form onSubmit={handleSaveAdd} className="p-6 space-y-4 overflow-y-auto flex-1">
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nome do Insumo *</label>
 <input
 type="text"
 required
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 placeholder="Ex: Pérola de Água Doce Branca (8mm)"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 "
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Categoria *</label>
 <select
 value={formData.category}
 onChange={(e) => setFormData({ ...formData, category: e.target.value })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 "
 >
 <option value="Contas e Pérolas">Contas e Pérolas</option>
 <option value="Metais e Entremeios">Metais e Entremeios</option>
 <option value="Fios e Cordões">Fios e Cordões</option>
 <option value="Embalagens">Embalagens</option>
 <option value="Outros">Outros</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Código Interno *</label>
 <input
 type="text"
 required
 value={formData.code}
 onChange={(e) => setFormData({ ...formData, code: e.target.value })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850 "
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Fornecedor</label>
 <input
 type="text"
 value={formData.supplier}
 onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
 placeholder="Ex: Beads Importadora"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Unidade de Medida</label>
 <input
 type="text"
 value={formData.unit}
 onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
 placeholder="Ex: unidade, pacote (100 un)"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Preço Unitário (Custo) *</label>
 <input
 type="number"
 step="0.01"
 min="0"
 required
 value={formData.unitValue}
 onChange={(e) => setFormData({ ...formData, unitValue: Number(e.target.value) })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850 font-mono"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Peso Unitário (g)</label>
 <input
 type="number"
 step="0.1"
 min="0"
 value={formData.weightG}
 onChange={(e) => setFormData({ ...formData, weightG: Number(e.target.value) })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Saldo Inicial (Quantidade) *</label>
 <input
 type="number"
 min="0"
 required
 value={formData.quantity}
 onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quantidade Mínima (Aviso) *</label>
 <input
 type="number"
 min="0"
 required
 value={formData.minQuantity}
 onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Método de Precificação</label>
 <select
 value={formData.calcMethod}
 onChange={(e) => setFormData({ ...formData, calcMethod: e.target.value as CalcMethod })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
 >
 <option value="fixed">Fixo (Valor por unidade)</option>
 <option value="weight">Por Peso (g)</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
 <select
 value={formData.status}
 onChange={(e) => setFormData({ ...formData, status: e.target.value as InventoryStatus })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
 >
 <option value="active">Ativo</option>
 <option value="inactive">Inativo</option>
 </select>
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Observações / Detalhes</label>
 <textarea
 value={formData.notes}
 onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
 placeholder="Instruções de manuseio ou notas adicionais..."
 rows={2}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div className="pt-4 border-t border-slate-150 flex justify-end gap-3">
 <button
 type="button"
 onClick={() => setShowAddModal(false)}
 className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
 >
 Adicionar Insumo
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* 2. Edit Insumo Modal */}
 {showEditModal && selectedItem && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
 <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up max-h-[90vh] flex flex-col">
 <div className="h-14 border-b border-slate-150 px-6 flex items-center justify-between">
 <h3 className="font-bold text-sm text-slate-900 ">Editar Insumo</h3>
 <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
 </div>

 <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nome do Insumo *</label>
 <input
 type="text"
 required
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Categoria *</label>
 <select
 value={formData.category}
 onChange={(e) => setFormData({ ...formData, category: e.target.value })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
 >
 <option value="Contas e Pérolas">Contas e Pérolas</option>
 <option value="Metais e Entremeios">Metais e Entremeios</option>
 <option value="Fios e Cordões">Fios e Cordões</option>
 <option value="Embalagens">Embalagens</option>
 <option value="Outros">Outros</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Código Interno *</label>
 <input
 type="text"
 required
 value={formData.code}
 onChange={(e) => setFormData({ ...formData, code: e.target.value })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Fornecedor</label>
 <input
 type="text"
 value={formData.supplier}
 onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Unidade de Medida</label>
 <input
 type="text"
 value={formData.unit}
 onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Preço Unitário (Custo) *</label>
 <input
 type="number"
 step="0.01"
 min="0"
 required
 value={formData.unitValue}
 onChange={(e) => setFormData({ ...formData, unitValue: Number(e.target.value) })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850 font-mono"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Peso Unitário (g)</label>
 <input
 type="number"
 step="0.1"
 min="0"
 value={formData.weightG}
 onChange={(e) => setFormData({ ...formData, weightG: Number(e.target.value) })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Saldo Atual *</label>
 <input
 type="number"
 min="0"
 required
 value={formData.quantity}
 onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quantidade Mínima *</label>
 <input
 type="number"
 min="0"
 required
 value={formData.minQuantity}
 onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Método de Precificação</label>
 <select
 value={formData.calcMethod}
 onChange={(e) => setFormData({ ...formData, calcMethod: e.target.value as CalcMethod })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
 >
 <option value="fixed">Fixo (Valor por unidade)</option>
 <option value="weight">Por Peso (g)</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
 <select
 value={formData.status}
 onChange={(e) => setFormData({ ...formData, status: e.target.value as InventoryStatus })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
 >
 <option value="active">Ativo</option>
 <option value="inactive">Inativo</option>
 </select>
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Observações / Detalhes</label>
 <textarea
 value={formData.notes}
 onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
 rows={2}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div className="pt-4 border-t border-slate-150 flex justify-end gap-3">
 <button
 type="button"
 onClick={() => setShowEditModal(false)}
 className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
 >
 Salvar Alterações
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* 3. Adjust Stock Balance (Entrada/Saída/Ajuste manual) Modal */}
 {showAdjustModal && selectedItem && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
 <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up max-h-[90vh] flex flex-col">
 <div className="h-14 border-b border-slate-150 px-6 flex items-center justify-between bg-slate-50 ">
 <h3 className="font-bold text-sm text-slate-900 ">Movimentar Estoque</h3>
 <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
 </div>

 <form onSubmit={handleSaveAdjust} className="p-6 space-y-4 overflow-y-auto flex-1">
 <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
 <p className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Insumo Selecionado</p>
 <p className="font-bold text-xs text-slate-800 mt-1">{selectedItem.name}</p>
 <p className="text-xs font-medium text-slate-500 mt-0.5 font-mono">Código: {selectedItem.code} | Saldo Atual: {selectedItem.quantity} {selectedItem.unit}</p>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Operação</label>
 <select
 value={adjustData.type}
 onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value as 'add' | 'subtract' })}
 className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
 >
 <option value="add">Entrada (+) de Insumos</option>
 <option value="subtract">Saída / Perda (-)</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quantidade *</label>
 <input
 type="number"
 min="1"
 required
 value={adjustData.amount}
 onChange={(e) => setAdjustData({ ...adjustData, amount: Number(e.target.value) })}
 className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850 font-mono"
 />
 </div>
 </div>

 {adjustData.type === 'add' && (
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Fornecedor / Contato da Compra</label>
 <input
 type="text"
 value={adjustData.supplierName}
 onChange={(e) => setAdjustData({ ...adjustData, supplierName: e.target.value })}
 placeholder="Nome do fornecedor para lançar despesa"
 className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 <p className="text-[9.5px] text-slate-450 mt-1.5 italic">
 💡 Entradas calculam automaticamente o valor do lote (Quantidade × Valor Unitário) e registram uma nova Transação Financeira de Despesa no Fluxo de Caixa.
 </p>
 </div>
 )}

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Motivo / Observações</label>
 <input
 type="text"
 required
 value={adjustData.notes}
 onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
 placeholder="Ex: Lote novo de fornecedor, perda por defeito..."
 className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div className="pt-4 border-t border-slate-150 flex justify-end gap-3">
 <button
 type="button"
 onClick={() => setShowAdjustModal(false)}
 className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
 >
 Confirmar Lançamento
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
 <h3 className="font-bold text-sm text-slate-900">Confirmar Exclusão</h3>
 </div>
 <p className="text-xs text-slate-500 leading-relaxed">
 Deseja realmente excluir o insumo <strong className="text-slate-800">"{deleteConfirm.name}"</strong> do estoque? Esta ação não pode ser desfeita.
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
