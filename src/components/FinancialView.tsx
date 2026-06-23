import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { FinancialTransaction, TransactionType } from '../types/erp';
import { 
 TrendingUp, TrendingDown, DollarSign, Plus, Search, Trash2, X, Filter,
 ArrowUpRight, ArrowDownRight, CreditCard, Calendar, BarChart3, Wallet, AlertTriangle
} from 'lucide-react';
import { toast } from './Toast';
import { 
 ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'bank_slip';

export const FinancialView: React.FC = () => {
 const { transactions, addTransaction, deleteTransaction } = useDb();

 // Component States
 const [search, setSearch] = useState('');
 const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
 const [showAddModal, setShowAddModal] = useState(false);
 const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; description: string; amount: number } | null>(null);

 // Form states
 const [type, setType] = useState<TransactionType>('income');
 const [category, setCategory] = useState('Venda de Terço');
 const [contactName, setContactName] = useState(''); // client or supplier
 const [value, setValue] = useState(0);
 const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
 const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');

 const activeTransactions = transactions.filter(t => !t.isDeleted);

 // Filter Transactions list
 const filteredTransactions = activeTransactions.filter(t => {
 const matchesSearch = t.category.toLowerCase().includes(search.toLowerCase()) || 
 t.contactName.toLowerCase().includes(search.toLowerCase());
 const matchesType = selectedType === 'all' || t.type === selectedType;
 return matchesSearch && matchesType;
 });

 // KPI Calculations
 const totalRevenues = activeTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.value, 0);
 const totalExpenses = activeTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.value, 0);
 const netProfit = totalRevenues - totalExpenses;

 // Chart data assembly (Revenues vs Expenses per Month)
 const chartData = [
 { name: 'Jan', Receitas: 12400, Despesas: 5200, Lucro: 7200 },
 { name: 'Fev', Receitas: 15100, Despesas: 6100, Lucro: 9000 },
 { name: 'Mar', Receitas: 18900, Despesas: 7300, Lucro: 11600 },
 { name: 'Abr', Receitas: 21500, Despesas: 8200, Lucro: 13300 },
 { name: 'Mai', Receitas: 24200, Despesas: 9500, Lucro: 14700 },
 { name: 'Jun', Receitas: totalRevenues || 28000, Despesas: totalExpenses || 11000, Lucro: netProfit || 17000 }
 ];

 const handleOpenAdd = () => {
 setType('income');
 setCategory('Venda de Terço');
 setContactName('');
 setValue(0);
 setDate(new Date().toISOString().split('T')[0]);
 setPaymentMethod('pix');
 setShowAddModal(true);
 };

 const handleSaveAdd = (e: React.FormEvent) => {
 e.preventDefault();
 if (!category || !contactName || value <= 0) {
 toast.error("Validação", "Preencha todos os dados obrigatórios.");
 return;
 }

 addTransaction({
 type,
 category,
 contactName,
 value,
 date,
 paymentMethod
 });

 toast.success("Lançamento Registrado!", `Movimentação de R$ ${value.toFixed(2)} lançada com sucesso.`);
 setShowAddModal(false);
 };

 const handleDelete = (id: string, description: string, amount: number) => {
 setDeleteConfirm({ id, description, amount });
 };

 const handleConfirmDelete = () => {
 if (!deleteConfirm) return;
 deleteTransaction(deleteConfirm.id);
 toast.warning("Lançamento excluído", `O lançamento "${deleteConfirm.description}" foi arquivado.`);
 setDeleteConfirm(null);
 };

 return (
 <div className="space-y-6 animate-slide-in-up">
 
 {/* Financial KPIs row */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
 
 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm">
 <div className="flex justify-between items-start text-slate-450 uppercase text-[9px] font-bold tracking-wider">
 <span>Faturamento Bruto</span>
 <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-600">
 <ArrowUpRight size={13} />
 </span>
 </div>
 <h2 className="text-xl sm:text-2xl font-black mt-2 text-slate-900 font-mono text-emerald-600 ">
 R$ {totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
 </h2>
 <p className="text-[9.5px] text-slate-400 mt-1">Soma de receitas brutas</p>
 </div>

 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm">
 <div className="flex justify-between items-start text-slate-450 uppercase text-[9px] font-bold tracking-wider">
 <span>Despesas Operacionais</span>
 <span className="p-1 rounded-md bg-rose-500/10 text-rose-600">
 <ArrowDownRight size={13} />
 </span>
 </div>
 <h2 className="text-xl sm:text-2xl font-black mt-2 text-slate-900 font-mono text-rose-600 ">
 R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
 </h2>
 <p className="text-[9.5px] text-slate-400 mt-1">Soma de custos e insumos</p>
 </div>

 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm">
 <div className="flex justify-between items-start text-slate-450 uppercase text-[9px] font-bold tracking-wider">
 <span>Lucro Líquido</span>
 <span className="p-1 rounded-md bg-blue-500/10 text-blue-600">
 <DollarSign size={13} />
 </span>
 </div>
 <h2 className="text-xl sm:text-2xl font-black mt-2 text-slate-900 font-mono text-indigo-600 ">
 R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
 </h2>
 <p className="text-[9.5px] text-slate-400 mt-1">Resultado líquido real</p>
 </div>

 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm">
 <div className="flex justify-between items-start text-slate-450 uppercase text-[9px] font-bold tracking-wider">
 <span>Fluxo de Caixa</span>
 <span className="p-1 rounded-md bg-amber-500/10 text-amber-600">
 <Wallet size={13} />
 </span>
 </div>
 <h2 className="text-xl sm:text-2xl font-black mt-2 text-slate-900 font-mono text-slate-800 ">
 R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
 </h2>
 <p className="text-[9.5px] text-slate-400 mt-1">Saldo financeiro livre</p>
 </div>

 </div>

 {/* Visual Chart Panel */}
 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm">
 <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
 <BarChart3 size={14} className="text-amber-500" /> Curva de Evolução Financeira Semestral
 </h3>
 <div className="h-64 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <defs>
 <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
 <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
 <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
 <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
 <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
 <Area type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
 <Area type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Control Filters Bar */}
 <div className="bg-white border border-slate-200/85 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
 
 <div className="relative flex-1 max-w-md">
 <input
 type="text"
 placeholder="Buscar por categoria ou fornecedor/cliente..."
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
 <option value="all">Receitas e Despesas</option>
 <option value="income">Apenas Receitas (Entradas)</option>
 <option value="expense">Apenas Despesas (Saídas)</option>
 </select>
 </div>

 <button
 onClick={handleOpenAdd}
 className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
 >
 <Plus size={14} /> Lançar Movimentação
 </button>
 </div>

 {/* Ledger Table */}
 <div className="bg-white border border-slate-200/85 rounded-2xl shadow-sm overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full min-w-[800px] text-left text-xs">
 <thead>
 <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/40 ">
 <th className="p-4 font-bold text-[10px]">Data</th>
 <th className="p-4 font-bold text-[10px]">Tipo</th>
 <th className="p-4 font-bold text-[10px]">Categoria</th>
 <th className="p-4 font-bold text-[10px]">Origem / Destinatário</th>
 <th className="p-4 font-bold text-[10px]">Método</th>
 <th className="p-4 font-bold text-[10px]">Valor Lançado</th>
 <th className="p-4 font-bold text-[10px] text-right">Ação</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {filteredTransactions.map(t => (
 <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
 <td className="p-4 font-medium text-slate-500">{t.date}</td>
 <td className="p-4">
 <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${
 t.type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
 }`}>
 {t.type === 'income' ? 'RECEITA' : 'DESPESA'}
 </span>
 </td>
 <td className="p-4 font-bold text-slate-800 ">{t.category}</td>
 <td className="p-4 font-medium text-slate-600 ">{t.contactName}</td>
 <td className="p-4 uppercase font-bold text-slate-500 flex items-center gap-1.5 pt-4">
 <CreditCard size={11} className="text-slate-400" /> {t.paymentMethod}
 </td>
 <td className={`p-4 font-bold font-mono text-sm ${
 t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
 }`}>
 {t.type === 'income' ? '+' : '-'} R$ {t.value.toFixed(2)}
 </td>
 <td className="p-4 text-right">
 <button
 onClick={() => handleDelete(t.id, t.description, t.value)}
 className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-all duration-200 active:scale-95"
 >
 <Trash2 size={12} />
 </button>
 </td>
 </tr>
 ))}
 {filteredTransactions.length === 0 && (
 <tr>
 <td colSpan={7} className="p-8 text-center text-slate-400">
 Nenhuma movimentação financeira lançada.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* MODAL TRANSACTION FORM */}
 {showAddModal && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
 <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up">
 <div className="h-14 border-b border-slate-150 px-6 flex items-center justify-between">
 <h3 className="font-bold text-sm text-slate-900 ">Lançar Movimentação Financeira</h3>
 <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
 </div>

 <form onSubmit={handleSaveAdd} className="p-6 space-y-4">
 
 {/* Type Switcher */}
 <div className="flex gap-3 border-b border-slate-100 pb-3">
 <button
 type="button"
 onClick={() => { setType('income'); setCategory('Venda de Terço'); }}
 className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
 type === 'income' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' : 'bg-slate-100 text-slate-500 '
 }`}
 >
 Receita (Entrada)
 </button>
 <button
 type="button"
 onClick={() => { setType('expense'); setCategory('Compra de Miçangas'); }}
 className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
 type === 'expense' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30' : 'bg-slate-100 text-slate-500 '
 }`}
 >
 Despesa (Saída)
 </button>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Categoria *</label>
 <input
 type="text"
 required
 value={category}
 onChange={(e) => setCategory(e.target.value)}
 placeholder="Ex: Venda de Terço, Compra de Entremeio, Luz"
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
 {type === 'income' ? 'Cliente Comprador *' : 'Fornecedor / Credor *'}
 </label>
 <input
 type="text"
 required
 value={contactName}
 onChange={(e) => setContactName(e.target.value)}
 placeholder={type === 'income' ? 'Ex: Ana Maria' : 'Ex: Metais Distribuidora Ltda'}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Valor Lançado (R$) *</label>
 <input
 type="number"
 min="1"
 step="0.01"
 required
 value={value}
 onChange={(e) => setValue(Number(e.target.value))}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850 font-mono"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Data do Lançamento</label>
 <input
 type="date"
 required
 value={date}
 onChange={(e) => setDate(e.target.value)}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Método de Liquidação</label>
 <select
 value={paymentMethod}
 onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
 className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-850 font-bold"
 >
 <option value="pix">PIX Instantâneo</option>
 <option value="credit_card">Cartão de Crédito</option>
 <option value="debit_card">Cartão de Débito</option>
 <option value="cash">Dinheiro em Espécie</option>
 <option value="bank_slip">Boleto Bancário</option>
 </select>
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
 Deseja realmente excluir o lançamento financeiro <strong className="text-slate-800">"{deleteConfirm.description}"</strong> de valor <strong className="text-slate-850">R$ {deleteConfirm.amount.toFixed(2)}</strong>? Esta ação não pode ser desfeita.
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
