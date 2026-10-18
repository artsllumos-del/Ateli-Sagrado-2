import React, { useState, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { FinancialTransaction, TransactionType } from '../types/erp';
import { 
  TrendingUp, TrendingDown, DollarSign, Plus, Search, Trash2, X, Filter,
  ArrowUpRight, ArrowDownRight, CreditCard, Calendar, BarChart3, Wallet, AlertCircle,
  Clock, CheckCircle2, Check, ArrowLeft, ArrowRight
} from 'lucide-react';
import { toast } from './Toast';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { Pagination } from './Pagination';
import { PayablesTab } from './financial/PayablesTab';
import { ReceivablesTab } from './financial/ReceivablesTab';
import { PageHeader, FilterBar, EmptyState, StatCard, Button, Badge } from './ui';

type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'bank_slip' | 'bank_transfer';
type ActiveTab = 'dashboard' | 'payables' | 'receivables';

export interface FinancialViewProps {
  initialFilter?: {
    tab?: ActiveTab;
    type?: 'all' | 'income' | 'expense';
    search?: string;
  };
}

export const FinancialView: React.FC<FinancialViewProps> = ({ initialFilter }) => {
  const { 
    transactions, 
    addTransaction, 
    deleteTransaction, 
    orders, 
    quotes 
  } = useDb();

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialFilter?.tab || 'dashboard');
  
  // Screen state: 'list' | 'new_transaction' (eliminates modals!)
  const [screen, setScreen] = useState<'list' | 'new_transaction'>('list');

  // Search and filter state for transactions
  const [search, setSearch] = useState(initialFilter?.search || '');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>(initialFilter?.type || 'all');
  
  // Transaction Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // New Transaction Form State
  const [txType, setTxType] = useState<TransactionType>('income');
  const [txCategory, setTxCategory] = useState('Venda de Terço');
  const [txContact, setTxContact] = useState('');
  const [txValue, setTxValue] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txPaymentMethod, setTxPaymentMethod] = useState<PaymentMethod>('pix');
  const [txNotes, setTxNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Financial summary calculations
  const { totalIncome, totalExpense, currentBalance, netResult } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    transactions.forEach(t => {
      if (t.isDeleted) return;
      if (t.type === 'income') {
        inc += Number(t.value) || 0;
      } else {
        exp += Number(t.value) || 0;
      }
    });
    return {
      totalIncome: inc,
      totalExpense: exp,
      currentBalance: inc - exp,
      netResult: inc - exp,
    };
  }, [transactions]);

  // Filtered transactions list
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (t.isDeleted) return false;
      if (selectedType !== 'all' && t.type !== selectedType) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchCategory = (t.category || '').toLowerCase().includes(q);
        const matchContact = (t.contactName || '').toLowerCase().includes(q);
        const matchNotes = (t.notes || '').toLowerCase().includes(q);
        if (!matchCategory && !matchContact && !matchNotes) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedType, search]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Chart data: Monthly flow
  const chartData = useMemo(() => {
    const monthlyMap: Record<string, { month: string; income: number; expense: number }> = {};
    
    // Sort transactions chronologically
    const sorted = [...transactions].filter(t => !t.isDeleted).sort((a, b) => a.date.localeCompare(b.date));
    
    sorted.forEach(t => {
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      if (!monthlyMap[monthKey]) {
        const [year, m] = monthKey.split('-');
        const dateObj = new Date(parseInt(year), parseInt(m) - 1, 1);
        const label = dateObj.toLocaleDateString('pt-BR', { month: 'short' });
        monthlyMap[monthKey] = { month: label, income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        monthlyMap[monthKey].income += Number(t.value) || 0;
      } else {
        monthlyMap[monthKey].expense += Number(t.value) || 0;
      }
    });

    const entries = Object.values(monthlyMap);
    return entries.length > 0 ? entries.slice(-6) : [
      { month: 'Atual', income: totalIncome, expense: totalExpense }
    ];
  }, [transactions, totalIncome, totalExpense]);

  const handleOpenNewTransaction = (defaultType: TransactionType = 'income') => {
    setTxType(defaultType);
    setTxCategory(defaultType === 'income' ? 'Venda de Terço' : 'Compra de Materiais');
    setTxContact('');
    setTxValue('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxPaymentMethod('pix');
    setTxNotes('');
    setScreen('new_transaction');
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(txValue);
    if (isNaN(numVal) || numVal <= 0) {
      toast.error('Informe um valor válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        type: txType,
        category: txCategory,
        contactName: txContact.trim() || (txType === 'income' ? 'Cliente Avulso' : 'Fornecedor Avulso'),
        value: numVal,
        date: txDate,
        paymentMethod: txPaymentMethod,
        notes: txNotes.trim(),
      });
      toast.success(
        txType === 'income' ? 'Entrada registrada com sucesso!' : 'Saída registrada com sucesso!'
      );
      setScreen('list');
    } catch {
      toast.error('Erro ao registrar transação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTx = (id: string, desc: string) => {
    if (confirm(`Deseja realmente excluir o lançamento "${desc}"?`)) {
      deleteTransaction(id);
      toast.success('Lançamento removido do fluxo de caixa.');
    }
  };

  // ----------------------------------------------------
  // SUB-VIEW: NOVA TRANSAÇÃO (SEM MODAL)
  // ----------------------------------------------------
  if (screen === 'new_transaction') {
    return (
      <div className="space-y-6 animate-slide-in-up max-w-3xl mx-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setScreen('list')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={15} />
            <span>Voltar para o Fluxo de Caixa</span>
          </button>
          <span className="text-xs text-slate-500 font-medium">Lançamento Financeiro</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Novo Lançamento no Fluxo de Caixa</h3>
            <p className="text-xs text-slate-500 mt-1">Registre entradas por vendas e encomendas ou despesas com matéria-prima e custos fixos.</p>
          </div>

          <form onSubmit={handleSaveTransaction} className="space-y-5">
            {/* Tipo Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Tipo de Movimentação *</label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('income');
                    setTxCategory('Venda de Terço');
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                    txType === 'income'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpRight size={16} className={txType === 'income' ? 'text-emerald-600' : 'text-slate-400'} />
                  <span>Entrada (Receita)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTxType('expense');
                    setTxCategory('Compra de Materiais');
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                    txType === 'expense'
                      ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowDownRight size={16} className={txType === 'expense' ? 'text-rose-600' : 'text-slate-400'} />
                  <span>Saída (Despesa)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {txType === 'income' ? 'Categoria da Receita *' : 'Categoria da Despesa *'}
                </label>
                <select
                  value={txCategory}
                  onChange={e => setTxCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                >
                  {txType === 'income' ? (
                    <>
                      <option value="Venda de Terço">Venda de Terço</option>
                      <option value="Restauração Sacra">Restauração Sacra</option>
                      <option value="Artigos Religiosos">Artigos Religiosos</option>
                      <option value="Lembranças de Batizado">Lembranças de Batizado / Casamento</option>
                      <option value="Artigos Paroquiais">Artigos Paroquiais</option>
                      <option value="Outras Receitas">Outras Receitas</option>
                    </>
                  ) : (
                    <>
                      <option value="Compra de Materiais">Compra de Pérolas, Cruzes e Metais</option>
                      <option value="Embalagens">Embalagens e Caixas de Veludo</option>
                      <option value="Ferramentas">Ferramentas de Ourivesaria</option>
                      <option value="Aluguel e Condomínio">Aluguel e Espaço do Ateliê</option>
                      <option value="Energia e Água">Energia e Água</option>
                      <option value="Marketing & Vendas">Marketing e Anúncios</option>
                      <option value="Transporte & Correios">Frete e Correios</option>
                      <option value="Outras Despesas">Outras Despesas</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {txType === 'income' ? 'Cliente / Pagador' : 'Fornecedor / Beneficiário'}
                </label>
                <input
                  type="text"
                  placeholder={txType === 'income' ? 'Ex: Paróquia Nossa Senhora da Paz' : 'Ex: Metais Sacros Ltda'}
                  value={txContact}
                  onChange={e => setTxContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0,00"
                  value={txValue}
                  onChange={e => setTxValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono tabular-nums text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Data da Operação *</label>
                <input
                  type="date"
                  required
                  value={txDate}
                  onChange={e => setTxDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Meio de Pagamento *</label>
                <select
                  value={txPaymentMethod}
                  onChange={e => setTxPaymentMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                >
                  <option value="pix">PIX</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="debit_card">Cartão de Débito</option>
                  <option value="bank_slip">Boleto Bancário</option>
                  <option value="bank_transfer">Transferência Bancária</option>
                  <option value="cash">Dinheiro em Espécie</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Observações ou Referência de Pedido</label>
              <textarea
                rows={3}
                placeholder="Detalhes adicionais, comprovante ou vínculo com pedido..."
                value={txNotes}
                onChange={e => setTxNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setScreen('list')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant={txType === 'income' ? 'success' : 'primary'}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                icon={<Check size={15} />}
              >
                Salvar Lançamento
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LIST SCREEN: 3 ABAS ESSENCIAIS DO NEGÓCIO
  // ----------------------------------------------------
  return (
    <div className="space-y-6 select-none font-sans">
      {/* PageHeader with Tab Switcher */}
      <PageHeader
        title="Núcleo Financeiro & Controladoria"
        description="Gestão de receitas, custos operacionais, fluxo de caixa e compromissos do ateliê"
        actions={
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet size={14} />
              <span>Fluxo de Caixa</span>
            </button>
            <button
              onClick={() => setActiveTab('payables')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'payables'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight size={14} className="text-rose-500" />
              <span>Contas a Pagar</span>
            </button>
            <button
              onClick={() => setActiveTab('receivables')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'receivables'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight size={14} className="text-emerald-500" />
              <span>Contas a Receber</span>
            </button>
          </div>
        }
      />

      {/* ------------------------------------------------ */}
      {/* ABA 1: FLUXO DE CAIXA (VISÃO GERAL & LANÇAMENTOS) */}
      {/* ------------------------------------------------ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-slide-in-up">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Saldo Atual em Caixa"
              value={`R$ ${currentBalance.toFixed(2)}`}
              subtitle="Disponibilidade líquida"
              variant="gold"
              icon={<Wallet size={18} />}
            />
            <StatCard
              title="Entradas Acumuladas"
              value={`R$ ${totalIncome.toFixed(2)}`}
              subtitle="Receitas realizadas"
              variant="emerald"
              icon={<TrendingUp size={18} />}
            />
            <StatCard
              title="Saídas Acumuladas"
              value={`R$ ${totalExpense.toFixed(2)}`}
              subtitle="Custos e compras pagos"
              variant="rose"
              icon={<TrendingDown size={18} />}
            />
            <StatCard
              title="Resultado Operacional"
              value={`R$ ${netResult.toFixed(2)}`}
              subtitle={netResult >= 0 ? "Superávit operacional" : "Déficit temporário"}
              variant={netResult >= 0 ? "emerald" : "rose"}
              icon={<DollarSign size={18} />}
            />
          </div>

          {/* Compact Monthly Flow Chart */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Evolução do Fluxo Financeiro (Últimos Meses)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Comparativo visual entre entradas e saídas</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Entradas
                </span>
                <span className="flex items-center gap-1.5 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Saídas
                </span>
              </div>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="flowIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="flowExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                  <Tooltip 
                    formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="income" name="Entradas" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#flowIncome)" />
                  <Area type="monotone" dataKey="expense" name="Saídas" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#flowExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filter Bar & Action Button */}
          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Buscar lançamento, categoria ou contato..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => { setSelectedType('all'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => { setSelectedType('income'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedType === 'income' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Entradas
                </button>
                <button
                  onClick={() => { setSelectedType('expense'); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedType === 'expense' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Saídas
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => handleOpenNewTransaction('income')}
              icon={<Plus size={15} />}
            >
              Novo Lançamento
            </Button>
          </div>

          {/* Transactions List Container */}
          <div className="bg-white border border-slate-200/85 rounded-2xl shadow-xs overflow-hidden">
            {/* Mobile View (< sm) */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {paginatedTransactions.map(tx => (
                <div key={tx.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">{tx.category}</span>
                    <Badge variant={tx.type === 'income' ? 'success' : 'danger'} size="xs">
                      {tx.type === 'income' ? '+ Entrada' : '- Saída'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{tx.contactName || '—'}</span>
                    <span className="font-mono">{tx.date.split('-').reverse().join('/')}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Valor</span>
                      <span className={`font-mono font-bold text-sm tabular-nums ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.value).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                        {tx.paymentMethod}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTx(tx.id, tx.category)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir lançamento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Contato / Cliente</th>
                    <th className="py-3 px-4">Meio</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {paginatedTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono">{tx.date.split('-').reverse().join('/')}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={tx.type === 'income' ? 'success' : 'danger'} size="xs">
                          {tx.type === 'income' ? 'Entrada' : 'Saída'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{tx.category}</td>
                      <td className="py-3.5 px-4 text-slate-600">{tx.contactName || '—'}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 uppercase text-[11px]">{tx.paymentMethod}</td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold tabular-nums ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.value).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteTx(tx.id, tx.category)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir lançamento"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="p-8">
                <EmptyState
                  icon={<Wallet size={32} className="text-slate-400" />}
                  title="Nenhum lançamento encontrado"
                  description={search || selectedType !== 'all' ? "Ajuste os filtros de busca para encontrar transações." : "Registre seu primeiro lançamento financeiro no caixa."}
                  actionLabel={!search ? "Registrar Entrada ou Saída" : undefined}
                  onAction={!search ? () => handleOpenNewTransaction('income') : undefined}
                />
              </div>
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredTransactions.length / itemsPerPage)}
            totalItems={filteredTransactions.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            labelSingular="lançamento"
            labelPlural="lançamentos"
          />
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* ABA 2: CONTAS A PAGAR */}
      {/* ------------------------------------------------ */}
      {activeTab === 'payables' && (
        <div className="animate-slide-in-up">
          <PayablesTab />
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* ABA 3: CONTAS A RECEBER */}
      {/* ------------------------------------------------ */}
      {activeTab === 'receivables' && (
        <div className="animate-slide-in-up">
          <ReceivablesTab />
        </div>
      )}
    </div>
  );
};
