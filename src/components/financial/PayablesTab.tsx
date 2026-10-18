import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { AccountPayable } from '../../types/erp';
import { 
  Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, Calendar, 
  CreditCard, DollarSign, Trash2, ArrowDownRight, Tag, Building2,
  FileCheck2, Check, ArrowLeft, ArrowRight
} from 'lucide-react';
import { toast } from '../Toast';
import { Pagination } from '../Pagination';
import { Button, Badge, EmptyState, StatCard } from '../ui';

export const PayablesTab: React.FC = () => {
  const { payables, addPayable, deletePayable, settlePayable } = useDb();
  
  // Screen state replacing popups/modals
  const [screen, setScreen] = useState<'list' | 'add' | 'settle'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [settleItem, setSettleItem] = useState<AccountPayable | null>(null);

  // Form State for New Payable
  const [description, setDescription] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [category, setCategory] = useState('Compra de Materiais');
  const [amount, setAmount] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [totalInstallments, setTotalInstallments] = useState(1);
  const [barcode, setBarcode] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settlement Form State
  const [settleAmount, setSettleAmount] = useState('');
  const [settleDate, setSettleDate] = useState(new Date().toISOString().split('T')[0]);
  const [settleMethod, setSettleMethod] = useState<'pix' | 'bank_transfer' | 'bank_slip' | 'cash' | 'credit_card'>('pix');
  const [settleNotes, setSettleNotes] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  // Date and Calculations
  const nowStr = new Date().toISOString().split('T')[0];

  const filteredPayables = payables.filter(p => {
    const isOverdue = p.status !== 'paid' && p.dueDate < nowStr;
    if (filterStatus !== 'all') {
      if (filterStatus === 'overdue' && !isOverdue) return false;
      if (filterStatus === 'pending' && (p.status === 'paid' || isOverdue)) return false;
      if (filterStatus === 'paid' && p.status !== 'paid') return false;
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchSupp = (p.supplierName || '').toLowerCase().includes(q);
      const matchCat = (p.category || '').toLowerCase().includes(q);
      if (!matchDesc && !matchSupp && !matchCat) return false;
    }

    return true;
  });

  // Pagination for Payables
  const [payablesPage, setPayablesPage] = useState(1);
  const [payablesPerPage, setPayablesPerPage] = useState(10);
  const paginatedPayables = filteredPayables.slice(
    (payablesPage - 1) * payablesPerPage,
    payablesPage * payablesPerPage
  );

  const totalPending = payables
    .filter(p => p.status !== 'paid')
    .reduce((acc, p) => acc + (p.amount - (p.paidAmount || 0)), 0);

  const totalOverdue = payables
    .filter(p => p.status !== 'paid' && p.dueDate < nowStr)
    .reduce((acc, p) => acc + (p.amount - (p.paidAmount || 0)), 0);

  const totalPaid = payables
    .filter(p => p.status === 'paid')
    .reduce((acc, p) => acc + (p.paidAmount || p.amount), 0);

  const handleOpenAdd = () => {
    setDescription('');
    setSupplierName('');
    setCategory('Compra de Materiais');
    setAmount('');
    setDueDate('');
    setTotalInstallments(1);
    setBarcode('');
    setPixKey('');
    setNotes('');
    setScreen('add');
  };

  const handleCreatePayable = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Informe um valor válido.');
      return;
    }
    if (!description.trim()) {
      toast.error('Informe uma descrição.');
      return;
    }
    if (!dueDate) {
      toast.error('Informe a data de vencimento.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addPayable({
        description: description.trim(),
        supplierName: supplierName.trim(),
        category,
        amount: numAmount,
        issueDate: issueDate || nowStr,
        dueDate,
        totalInstallments: Math.max(1, totalInstallments),
        barcode: barcode.trim(),
        pixKey: pixKey.trim(),
        notes: notes.trim(),
      });
      toast.success('Título a pagar cadastrado com sucesso!');
      setScreen('list');
    } catch {
      toast.error('Erro ao cadastrar título.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSettle = (p: AccountPayable) => {
    setSettleItem(p);
    setSettleAmount((p.amount - (p.paidAmount || 0)).toFixed(2));
    setSettleDate(nowStr);
    setSettleMethod('pix');
    setSettleNotes('');
    setScreen('settle');
  };

  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleItem) return;
    const numAmount = parseFloat(settleAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Informe um valor válido de liquidação.');
      return;
    }

    setIsSettling(true);
    try {
      await settlePayable(settleItem.id, {
        amount: numAmount,
        paymentDate: settleDate,
        paymentMethod: settleMethod,
        notes: settleNotes.trim(),
      });
      toast.success('Baixa efetuada com sucesso! Lançamento registrado no caixa.');
      setSettleItem(null);
      setScreen('list');
    } catch {
      toast.error('Erro ao registrar liquidação.');
    } finally {
      setIsSettling(false);
    }
  };

  // ----------------------------------------------------
  // SUB-VIEW: NOVO TÍTULO A PAGAR (SEM MODAL)
  // ----------------------------------------------------
  if (screen === 'add') {
    return (
      <div className="space-y-6 animate-slide-in-up max-w-4xl mx-auto">
        {/* Back navigation header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setScreen('list')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={15} />
            <span>Voltar para Contas a Pagar</span>
          </button>
          <span className="text-xs text-slate-500 font-medium">Novo Lançamento a Pagar</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Cadastrar Nova Conta a Pagar</h3>
            <p className="text-xs text-slate-500 mt-1">Registre títulos, faturas de fornecedores, insumos ou custos operacionais do ateliê.</p>
          </div>

          <form onSubmit={handleCreatePayable} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Descrição do Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fornecedor de Crucifixos e Metais"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Fornecedor / Favorecido</label>
                <input
                  type="text"
                  placeholder="Ex: Metais Sacros Ltda"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Categoria</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                >
                  <option value="Compra de Materiais">Compra de Materiais</option>
                  <option value="Embalagens">Embalagens</option>
                  <option value="Ferramentas">Ferramentas de Bancada</option>
                  <option value="Aluguel e Condomínio">Aluguel e Condomínio</option>
                  <option value="Energia e Água">Energia e Água</option>
                  <option value="Marketing & Vendas">Marketing & Vendas</option>
                  <option value="Serviços Terceirizados">Serviços Terceirizados</option>
                  <option value="Outros">Outras Despesas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Valor Total (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono tabular-nums text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Vencimento *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Data de Emissão</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Total de Parcelas</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={totalInstallments}
                  onChange={e => setTotalInstallments(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Chave PIX do Fornecedor</label>
                <input
                  type="text"
                  placeholder="CNPJ, e-mail ou celular"
                  value={pixKey}
                  onChange={e => setPixKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Linha Digitável / Código de Barras do Boleto</label>
              <input
                type="text"
                placeholder="Ex: 34191.79001 01043.510047..."
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Observações Adicionais</label>
              <textarea
                rows={3}
                placeholder="Detalhes ou condições da fatura..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
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
                variant="primary"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                icon={<Check size={15} />}
              >
                Salvar Conta a Pagar
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SUB-VIEW: LIQUIDAR CONTA A PAGAR (SEM MODAL)
  // ----------------------------------------------------
  if (screen === 'settle' && settleItem) {
    const remainingBalance = settleItem.amount - (settleItem.paidAmount || 0);

    return (
      <div className="space-y-6 animate-slide-in-up max-w-2xl mx-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <button
            type="button"
            onClick={() => { setSettleItem(null); setScreen('list'); }}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={15} />
            <span>Voltar para Contas a Pagar</span>
          </button>
          <span className="text-xs text-slate-500 font-medium">Liquidação de Título</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Liquidar Conta a Pagar</h3>
            <p className="text-xs text-slate-500 mt-1">Registrar pagamento e lançar automaticamente a saída no Fluxo de Caixa.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 text-xs space-y-2">
            <div className="font-bold text-sm text-slate-900">{settleItem.description}</div>
            <div className="text-slate-600">Fornecedor: <span className="font-semibold text-slate-800">{settleItem.supplierName || '—'}</span></div>
            <div className="text-slate-600">Vencimento: <span className="font-semibold text-slate-800">{settleItem.dueDate.split('-').reverse().join('/')}</span></div>
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Saldo Restante a Liquidar:</span>
              <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                R$ {remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          <form onSubmit={handleConfirmSettle} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Valor Pago (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={settleAmount}
                  onChange={e => setSettleAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono tabular-nums text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Data do Pagamento *</label>
                <input
                  type="date"
                  required
                  value={settleDate}
                  onChange={e => setSettleDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Forma de Pagamento *</label>
              <select
                value={settleMethod}
                onChange={e => setSettleMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value="pix">PIX</option>
                <option value="bank_transfer">Transferência Bancária (TED/DOC)</option>
                <option value="bank_slip">Boleto Bancário</option>
                <option value="credit_card">Cartão Corporativo</option>
                <option value="cash">Dinheiro em Espécie</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Observações da Baixa</label>
              <input
                type="text"
                placeholder="Ex: Comprovante arquivado, transação bancária #..."
                value={settleNotes}
                onChange={e => setSettleNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setSettleItem(null); setScreen('list'); }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="success"
                disabled={isSettling}
                isLoading={isSettling}
                icon={<Check size={15} />}
              >
                Confirmar Baixa e Lançar no Caixa
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LIST SCREEN: CONTAS A PAGAR RESPONSIVO (SEM MODAL)
  // ----------------------------------------------------
  return (
    <div className="space-y-6 select-none font-sans">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Pendente"
          value={`R$ ${totalPending.toFixed(2)}`}
          subtitle="Compromissos a liquidar"
          variant="gold"
          icon={<Clock size={18} />}
        />
        <StatCard
          title="Títulos Vencidos"
          value={`R$ ${totalOverdue.toFixed(2)}`}
          subtitle="Atenção necessária"
          variant="rose"
          icon={<AlertCircle size={18} />}
        />
        <StatCard
          title="Total Já Quitado"
          value={`R$ ${totalPaid.toFixed(2)}`}
          subtitle="Pagamentos confirmados"
          variant="emerald"
          icon={<CheckCircle2 size={18} />}
        />
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar título, fornecedor ou categoria..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPayablesPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => { setFilterStatus('all'); setPayablesPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => { setFilterStatus('pending'); setPayablesPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterStatus === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A Vencer
            </button>
            <button
              onClick={() => { setFilterStatus('overdue'); setPayablesPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterStatus === 'overdue' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vencidos
            </button>
            <button
              onClick={() => { setFilterStatus('paid'); setPayablesPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterStatus === 'paid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pagos
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenAdd}
          icon={<Plus size={15} />}
        >
          Nova Conta a Pagar
        </Button>
      </div>

      {/* Payables Data Container */}
      <div className="bg-white border border-slate-200/85 rounded-2xl shadow-xs overflow-hidden">
        {/* Mobile Cards (< sm) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {paginatedPayables.map(p => {
            const isOverdue = p.status !== 'paid' && p.dueDate < nowStr;
            return (
              <div key={p.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-slate-900 truncate">{p.description}</span>
                  <Badge variant={p.status === 'paid' ? 'success' : isOverdue ? 'danger' : 'warning'} size="xs">
                    {p.status === 'paid' ? 'Pago' : isOverdue ? 'Vencido' : 'A Vencer'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Fornecedor: {p.supplierName || '—'}</span>
                  <span>Vencimento: {p.dueDate.split('-').reverse().join('/')}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Valor</span>
                    <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                      R$ {p.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {p.status !== 'paid' && (
                      <Button
                        size="xs"
                        variant="success"
                        onClick={() => handleOpenSettle(p)}
                        icon={<FileCheck2 size={13} />}
                      >
                        Baixar
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Excluir o título "${p.description}"?`)) {
                          deletePayable(p.id);
                          toast.success('Título removido.');
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir título"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table (>= sm) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Fornecedor</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4">Parcela</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedPayables.map(p => {
                const isOverdue = p.status !== 'paid' && p.dueDate < nowStr;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900">{p.description}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.supplierName || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{p.category}</td>
                    <td className="py-3.5 px-4 font-mono">{p.dueDate.split('-').reverse().join('/')}</td>
                    <td className="py-3.5 px-4 font-mono">{p.installmentNumber || 1}/{p.totalInstallments || 1}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      R$ {p.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={p.status === 'paid' ? 'success' : isOverdue ? 'danger' : 'warning'} size="xs">
                        {p.status === 'paid' ? 'Pago' : isOverdue ? 'Vencido' : 'A Vencer'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status !== 'paid' && (
                          <Button
                            size="xs"
                            variant="success"
                            onClick={() => handleOpenSettle(p)}
                            icon={<FileCheck2 size={13} />}
                          >
                            Baixar
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Excluir o título "${p.description}"?`)) {
                              deletePayable(p.id);
                              toast.success('Título removido.');
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir título"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPayables.length === 0 && (
          <div className="p-8">
            <EmptyState
              icon={<CreditCard size={32} className="text-slate-400" />}
              title="Nenhuma conta a pagar encontrada"
              description={searchTerm || filterStatus !== 'all' ? "Ajuste os filtros de status ou o termo de busca." : "Cadastre sua primeira conta a pagar para controlar seus custos."}
              actionLabel={!searchTerm ? "Cadastrar Conta a Pagar" : undefined}
              onAction={!searchTerm ? handleOpenAdd : undefined}
            />
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={payablesPage}
        totalPages={Math.ceil(filteredPayables.length / payablesPerPage)}
        totalItems={filteredPayables.length}
        itemsPerPage={payablesPerPage}
        onPageChange={setPayablesPage}
        onItemsPerPageChange={(val) => { setPayablesPerPage(val); setPayablesPage(1); }}
        labelSingular="título a pagar"
        labelPlural="títulos a pagar"
      />
    </div>
  );
};
