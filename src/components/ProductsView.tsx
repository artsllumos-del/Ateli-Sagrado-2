import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Product, ProductMaterialComposition, ProductStatus } from '../types/erp';
import { 
 Search, Plus, Edit3, Trash2, X, Sparkles, AlertTriangle, HelpCircle, 
 Layers, Clock, DollarSign, Info, Eye, ArrowUpRight
} from 'lucide-react';
import { toast } from './Toast';

export const ProductsView: React.FC = () => {
 const { products, inventory, addProduct, updateProduct, deleteProduct, settings } = useDb();

 // View States
 const [search, setSearch] = useState('');
 const [selectedCategory, setSelectedCategory] = useState('all');
 const [showAddModal, setShowAddModal] = useState(false);
 const [showEditModal, setShowEditModal] = useState(false);
 const [showDetailModal, setShowDetailModal] = useState(false);
 const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
 const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

 // Form states for composition
 const [compositionItems, setCompositionItems] = useState<ProductMaterialComposition[]>([]);
 const [formData, setFormData] = useState({
 name: '',
 category: 'Terços de Noiva',
 sku: '',
 description: '',
 image: '',
 productionTimeMin: 60,
 finalWeightG: 100,
 sellingPrice: 150,
 status: 'active' as ProductStatus
 });

 // Material item selector state (temporary composition item)
 const [tempMaterialId, setTempMaterialId] = useState('');
 const [tempQty, setTempQty] = useState(1);

 // Active items
 const activeProducts = products.filter(p => !p.isDeleted);
 const categories = Array.from(new Set(activeProducts.map(p => p.category)));
 const activeInsumos = inventory.filter(i => !i.isDeleted && i.status === 'active');

 // Filter products list
 const filteredProducts = activeProducts.filter(p => {
 const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
 p.sku.toLowerCase().includes(search.toLowerCase());
 const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
 return matchesSearch && matchesCategory;
 });

 // Calculate dynamic costs for a given product composition
 const getProductCost = (composition: ProductMaterialComposition[]) => {
 return composition.reduce((total, comp) => {
 const material = inventory.find(m => m.id === comp.materialId);
 if (!material) return total;
 return total + (comp.quantity * material.unitValue);
 }, 0);
 };

 const handleOpenAdd = () => {
 setFormData({
 name: '',
 category: 'Terços',
 sku: 'PROD-' + Math.floor(1000 + Math.random() * 9000),
 description: '',
 image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop',
 productionTimeMin: 60,
 finalWeightG: 80,
 sellingPrice: 120,
 status: 'active'
 });
 setCompositionItems([]);
 setTempMaterialId(activeInsumos[0]?.id || '');
 setTempQty(1);
 setShowAddModal(true);
 };

 const handleOpenEdit = (prod: Product) => {
 setSelectedProduct(prod);
 setFormData({
 name: prod.name,
 category: prod.category,
 sku: prod.sku,
 description: prod.description,
 image: prod.image,
 productionTimeMin: prod.productionTimeMin,
 finalWeightG: prod.finalWeightG,
 sellingPrice: prod.sellingPrice,
 status: prod.status
 });
 setCompositionItems(prod.composition || []);
 setTempMaterialId(activeInsumos[0]?.id || '');
 setTempQty(1);
 setShowEditModal(true);
 };

 const handleAddCompositionItem = () => {
 if (!tempMaterialId) return;
 const mat = inventory.find(i => i.id === tempMaterialId);
 if (!mat) return;

 // Check if material is already added
 const existing = compositionItems.find(item => item.materialId === tempMaterialId);
 if (existing) {
 toast.warning("Material duplicado", "Você já adicionou esta matéria-prima. Altere a quantidade na lista.");
 return;
 }

 const cost = tempQty * mat.unitValue;
 setCompositionItems([...compositionItems, { materialId: tempMaterialId, quantity: tempQty, cost }]);
 toast.success("Adicionado à composição", `${mat.name} x ${tempQty}`);
 };

 const handleRemoveCompositionItem = (materialId: string) => {
 setCompositionItems(compositionItems.filter(item => item.materialId !== materialId));
 };

 const handleUpdateCompQty = (materialId: string, newQty: number) => {
 const mat = inventory.find(i => i.id === materialId);
 if (!mat) return;
 
 setCompositionItems(compositionItems.map(item => {
 if (item.materialId === materialId) {
 return {
 ...item,
 quantity: newQty,
 cost: Number((newQty * mat.unitValue).toFixed(2))
 };
 }
 return item;
 }));
 };

 const handleSaveAdd = (e: React.FormEvent) => {
 e.preventDefault();
 if (!formData.name || !formData.sku) {
 toast.error("Validação", "Informe os dados do produto.");
 return;
 }
 
 addProduct({
 ...formData,
 composition: compositionItems
 });
 
 toast.success("Produto criado!", `O produto artesanal ${formData.name} foi cadastrado.`);
 setShowAddModal(false);
 };

 const handleSaveEdit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedProduct) return;

 updateProduct(selectedProduct.id, {
 ...formData,
 composition: compositionItems
 });

 toast.success("Produto atualizado!", `Dados de ${formData.name} foram salvos.`);
 setShowEditModal(false);
 };

 const handleDelete = (id: string, name: string) => {
 setDeleteConfirm({ id, name });
 };

 const handleConfirmDelete = () => {
 if (!deleteConfirm) return;
 deleteProduct(deleteConfirm.id);
 toast.warning("Produto arquivado", `Produto "${deleteConfirm.name}" foi removido com sucesso.`);
 setDeleteConfirm(null);
 };

 const handleViewDetail = (prod: Product) => {
 setSelectedProduct(prod);
 setShowDetailModal(true);
 };

 return (
 <div className="space-y-6 animate-slide-in-up">
 
 {/* Control Bar: Search & Category filter */}
 <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
 
 <div className="relative flex-1 max-w-md">
 <input
 type="text"
 placeholder="Buscar por nome ou SKU..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
 />
 <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
 </div>

 <select
 value={selectedCategory}
 onChange={(e) => setSelectedCategory(e.target.value)}
 className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
 >
 <option value="all">Todas as Categorias</option>
 {categories.map(c => <option key={c} value={c}>{c}</option>)}
 </select>
 </div>

 <button
 onClick={handleOpenAdd}
 className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
 >
 <Plus size={14} /> Novo Produto
 </button>
 </div>

 {/* Products list - Cards bento format */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredProducts.map(prod => {
 const mCost = getProductCost(prod.composition || []);
 const totalCost = mCost + (prod.productionTimeMin / 60 * settings.laborHourlyRate) + settings.indirectCosts;
 const profit = prod.sellingPrice - totalCost;
 const margin = totalCost > 0 ? (profit / totalCost) * 100 : 0;
 const markup = prod.sellingPrice > 0 ? (profit / prod.sellingPrice) * 100 : 0;

 return (
 <div key={prod.id} className="bg-white border border-slate-200/85 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
 <div>
 {/* Product Thumbnail Banner */}
 <div className="relative h-44 w-full bg-slate-100 ">
 <img 
 src={prod.image || "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop"} 
 alt={prod.name}
 className="w-full h-full object-cover"
 referrerPolicy="no-referrer"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
 <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
 <span className="px-2.5 py-0.5 rounded-md bg-amber-500/80 backdrop-blur-xs text-[10px] font-bold text-slate-950 uppercase font-mono tracking-wider">
 {prod.sku}
 </span>
 <span className="text-white text-base font-black font-mono">
 R$ {prod.sellingPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
 </span>
 </div>
 </div>

 {/* Content info */}
 <div className="p-5 space-y-3">
 <div>
 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{prod.category}</span>
 <h3 className="font-bold text-base text-slate-900 mt-1 line-clamp-1">{prod.name}</h3>
 <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 h-8 font-medium leading-normal">{prod.description || 'Sem descrição cadastrada.'}</p>
 </div>

 {/* Indicators grid (Rentabilidade, margem, custo) */}
 <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
 <div>
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Custos</p>
 <p className="text-xs font-bold font-mono text-slate-800 mt-1">R$ {totalCost.toFixed(2)}</p>
 </div>
 <div>
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Lucro Est.</p>
 <p className={`text-xs font-bold font-mono mt-1 ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
 R$ {profit.toFixed(2)}
 </p>
 </div>
 <div>
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">M. Margem</p>
 <p className={`text-xs font-bold font-mono mt-1 ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
 {Math.round(markup)}%
 </p>
 </div>
 </div>

 {/* Production spec metadata */}
 <div className="flex justify-between text-[11px] font-medium text-slate-500 pt-1">
 <span className="flex items-center gap-1">
 <Clock size={12} className="text-slate-400" /> {prod.productionTimeMin} minutos
 </span>
 <span className="flex items-center gap-1">
 <Layers size={12} className="text-slate-400" /> {prod.composition?.length || 0} Insumos
 </span>
 </div>
 </div>
 </div>

 {/* Actions footer */}
 <div className="p-4 border-t border-slate-100 bg-slate-50/20 flex items-center justify-between">
 <button
 onClick={() => handleViewDetail(prod)}
 className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-650 rounded-lg flex items-center gap-1 cursor-pointer"
 >
 <Eye size={12} /> Composição
 </button>

 <div className="flex gap-2">
 <button
 onClick={() => handleOpenEdit(prod)}
 className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-500 cursor-pointer transition-all duration-200 active:scale-95"
 >
 <Edit3 size={12} />
 </button>
 <button
 onClick={() => handleDelete(prod.id, prod.name)}
 className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 cursor-pointer transition-all duration-200 active:scale-95"
 >
 <Trash2 size={12} />
 </button>
 </div>
 </div>

 </div>
 );
 })}
 {filteredProducts.length === 0 && (
 <div className="col-span-3 py-16 text-center text-slate-450">
 Nenhum produto artesanal cadastrado com esses parâmetros.
 </div>
 )}
 </div>

 {/* MODALS SECTION */}

 {/* 1. Detail and composition viewer overlay */}
 {showDetailModal && selectedProduct && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 lg:p-6 overflow-hidden">
 <div className="bg-white border border-slate-200 w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-up">
 <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between shrink-0 bg-slate-50/50">
 <h3 className="font-serif font-bold text-base text-slate-900">Ficha Técnica & Composição</h3>
 <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
 </div>

 <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
 <div>
 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selectedProduct.category} | {selectedProduct.sku}</p>
 <h4 className="font-bold text-lg text-slate-900 mt-1">{selectedProduct.name}</h4>
 <p className="text-xs text-slate-500 mt-2 leading-relaxed">{selectedProduct.description || 'Sem descrição cadastrada.'}</p>
 </div>

 <div className="border-t border-slate-100 pt-4">
 <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Composição de Matéria-Prima</h5>
 
 <div className="space-y-2 pr-1">
 {selectedProduct.composition?.map((comp, index) => {
 const mat = inventory.find(i => i.id === comp.materialId);
 return (
 <div key={index} className="flex justify-between items-center p-2 rounded-lg border border-slate-100 bg-slate-50/50 text-xs font-medium">
 <div>
 <p className="font-bold text-slate-800 ">{mat?.name || 'Insumo Removido'}</p>
 <p className="text-[10px] text-slate-450 mt-0.5">Custo Unit: R$ {mat?.unitValue.toFixed(2)} por {mat?.unit}</p>
 </div>
 <div className="text-right">
 <p className="font-bold text-slate-800 ">{comp.quantity} {mat?.unit}</p>
 <p className="text-[10px] text-slate-450 font-bold font-mono mt-0.5">R$ {comp.cost.toFixed(2)}</p>
 </div>
 </div>
 );
 })}
 {(!selectedProduct.composition || selectedProduct.composition.length === 0) && (
 <p className="text-xs text-slate-400 py-4 text-center">Nenhuma matéria-prima vinculada à composição deste produto.</p>
 )}
 </div>

 {/* Composition Totals summary */}
 <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs font-bold">
 <span className="text-slate-500">Custo Total dos Materiais</span>
 <span className="font-mono text-slate-900 ">
 R$ {getProductCost(selectedProduct.composition || []).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
 </span>
 </div>
 </div>

 <div className="px-6 py-4 border-t border-slate-150 flex items-center justify-end bg-slate-50 shrink-0">
 <button
 onClick={() => setShowDetailModal(false)}
 className="px-5 py-2.5 bg-gradient-to-br from-ink-900 to-slate-800 text-white hover:opacity-95 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md"
 >
 Fechar Ficha
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* 2. Create / Edit Product Modal */}
 {(showAddModal || showEditModal) && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 lg:p-6 overflow-hidden">
 <div className="bg-white border border-slate-200 w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-up">
 <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between shrink-0 bg-slate-50/50">
 <h3 className="font-serif font-bold text-base text-slate-900">
 {showAddModal ? 'Criar Novo Produto Artesanal' : 'Editar Produto'}
 </h3>
 <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
 </div>

 <form onSubmit={showAddModal ? handleSaveAdd : handleSaveEdit} className="flex-1 flex flex-col min-h-0">
  <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
 
 <div className="grid grid-cols-2 gap-4">
 <div className="col-span-2">
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nome do Produto *</label>
 <input
 type="text"
 required
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 placeholder="Ex: Terço de Noiva Imperial - Pérola Branca"
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
 <option value="Terços de Noiva">Terços de Noiva</option>
 <option value="Terços Comuns">Terços Comuns</option>
 <option value="Pulseiras">Pulseiras</option>
 <option value="Dezenas e Chaveiros">Dezenas e Chaveiros</option>
 <option value="Joias Religiosas">Joias Religiosas</option>
 <option value="Outros">Outros</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">SKU / Código Único *</label>
 <input
 type="text"
 required
 value={formData.sku}
 onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Preço de Venda Praticado (R$) *</label>
 <input
 type="number"
 step="0.01"
 min="0"
 required
 value={formData.sellingPrice}
 onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850 font-mono"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tempo Estimado de Produção (min)</label>
 <input
 type="number"
 min="1"
 value={formData.productionTimeMin}
 onChange={(e) => setFormData({ ...formData, productionTimeMin: Number(e.target.value) })}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div className="col-span-2">
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Link da Imagem / Foto do Produto</label>
 <input
 type="text"
 value={formData.image}
 onChange={(e) => setFormData({ ...formData, image: e.target.value })}
 placeholder="https://images.unsplash.com/photo-..."
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div className="col-span-2">
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Descrição Curta</label>
 <textarea
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 rows={2}
 placeholder="Especifique características do produto para os orçamentos..."
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>
 </div>

 {/* Composition Workspace inside Product Modal */}
 <div className="pt-4 border-t border-slate-100 ">
 <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
 <Layers size={14} className="text-amber-500" /> Montagem da Estrutura de Composição (Ficha Técnica)
 </h4>

 <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-end gap-3 mb-4">
 <div className="flex-1">
 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Escolher Matéria-Prima</label>
 <select
 value={tempMaterialId}
 onChange={(e) => setTempMaterialId(e.target.value)}
 className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
 >
 <option value="" disabled>Selecione um insumo...</option>
 {activeInsumos.map(i => (
 <option key={i.id} value={i.id}>
 {i.name} ({i.unit} - R$ {i.unitValue.toFixed(2)})
 </option>
 ))}
 </select>
 </div>

 <div className="w-32">
 <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quantidade Usada</label>
 <input
 type="number"
 step="0.01"
 min="0.01"
 value={tempQty}
 onChange={(e) => setTempQty(Number(e.target.value))}
 className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
 />
 </div>

 <button
 type="button"
 onClick={handleAddCompositionItem}
 className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:opacity-90 transition-all cursor-pointer h-9 shrink-0"
 >
 + Vincular
 </button>
 </div>

 {/* Active materials list in composer */}
 <div className="space-y-2 border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 ">
 {compositionItems.map((comp, idx) => {
 const mat = inventory.find(i => i.id === comp.materialId);
 return (
 <div key={idx} className="flex justify-between items-center px-4 py-2 bg-slate-50/20 text-xs font-semibold">
 <div>
 <p className="text-slate-800 ">{mat?.name || 'Insumo'}</p>
 <p className="text-[10px] text-slate-450 mt-0.5">R$ {mat?.unitValue.toFixed(2)} por {mat?.unit}</p>
 </div>
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-1.5">
 <input
 type="number"
 step="0.01"
 value={comp.quantity}
 onChange={(e) => handleUpdateCompQty(comp.materialId, Number(e.target.value))}
 className="w-16 px-2 py-1 text-center bg-white border border-slate-200 rounded text-xs text-slate-900"
 />
 <span className="text-slate-500 text-[10px]">{mat?.unit}</span>
 </div>
 
 <span className="font-mono text-slate-800 w-16 text-right">R$ {comp.cost.toFixed(2)}</span>

 <button
 type="button"
 onClick={() => handleRemoveCompositionItem(comp.materialId)}
 className="text-rose-500 hover:text-rose-600 font-bold text-lg px-2 cursor-pointer"
 >
 ×
 </button>
 </div>
 </div>
 );
 })}
 {compositionItems.length === 0 && (
 <div className="p-4 text-center text-slate-400 text-xs italic">
 Nenhum material vinculado à composição deste produto artesanal.
 </div>
 )}
 </div>

 {/* Subtotals summaries of the current creation */}
 <div className="mt-4 flex justify-between bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-xs font-bold text-amber-900 ">
 <span>SOMA DE MATÉRIA-PRIMA DO PRODUTO</span>
 <span>R$ {getProductCost(compositionItems).toFixed(2)}</span>
 </div>
 </div>

  </div>

 <div className="p-4 border-t border-slate-150 flex justify-end gap-3 bg-slate-50 shrink-0">
 <button
 type="button"
 onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
 className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer transition-all active:scale-95"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-5 py-2.5 bg-gradient-to-br from-ink-900 to-slate-800 text-white hover:opacity-95 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md"
 >
 {showAddModal ? 'Adicionar Produto' : 'Salvar Alterações'}
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
 Deseja realmente arquivar o produto <strong className="text-slate-800">"{deleteConfirm.name}"</strong>? O registro não será mais exibido no catálogo ativo.
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
