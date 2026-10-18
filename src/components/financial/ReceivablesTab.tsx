import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { AccountReceivable } from '../../types/erp';
import { 
  Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, Calendar, 
  CreditCard, DollarSign, Trash2, ArrowUpRight, Tag, User,
  FileCheck2, Check, ArrowLeft, ArrowRight
} from 'lucide-react';
import { toast } from '../Toast';
import { Pagination } from '../Pagination';
import { Button, Badge, EmptyState, StatCard } from '../ui';

interface ReceivablesTabProps {
  onOpenCheckout?: (rec: AccountReceivable) => void;
}

export const ReceivablesTab: React.FC<ReceivablesTabProps> = () => {
  const { receivables, addReceivable, deleteReceivable, settleReceivable, clients } = useDb();
  
  // Screen state replacing popups/modals
  const [screen, setScreen] = useState<'list' | 'add' | 'settle'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'received'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [settleItem, setSettleItem] = useState<AccountReceivable | null>(null);

  // Form State for New Receivable
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');
  const [category, setCategory] = useState('Venda de Terço');
  const [amount, setAmount] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [totalInstallments, setTotalInstallments] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settlement Form State
  const [settleAmount, setSettleAmount] = useState('');
  const [settleDate, setSettleDate] = useState(new Date().toISOString().split('T')[0]);
  const [settleMethod, setSettleMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'bank_slip' | 'cash'>('pix');
  const [settleNotes, setSettleNotes] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  const nowStr = new Date().toISOString().split('T')[0];

  const filteredReceivables = receivables.filter(r => {
    const isOverdue = r.status !== 'received' && r.dueDate < nowStr;
    if (filterStatus !== 'all') {
      if (filterStatus === 'overdue' && !isOverdue) return false;
      if (filterStatus === 'pending' && (r.status === 'received' || isOverdue)) return false;
      if (filterStatus === 'received' && r.status !== 'received') return false;
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchDesc = r.description.toLowerCase().includes(q);
      const matchCli = (r.clientName || '').toLowerCase().includes(q);
      const matchCat = (r.category || '').toLowerCase().includes(q);
      if (!matchDesc && !matchCli && !matchCat) return false;
    }

    return true;
  });

  // Pagination
  const [receivablesPage, setReceivablesPage] = useState(1);
  const [receivablesPerPage, setReceivablesPerPage] = useState(10);
  const paginatedReceivables = filteredReceivables.slice(
    (receivablesPage - 1) * receivablesPerPage,
    receivablesPage * receivablesPerPage
  );

  const totalPending = receivables
    .filter(r => r.status !== 'received')
    .reduce((acc, r) => acc + (r.amount - (r.receivedAmount || 0)), 0);

  const totalOverdue = receivables
    .filter(r => r.status !== 'received' && r.dueDate < nowStr)
    .reduce((acc, r) => acc + (r.amount - (r.receivedAmount || 0)), 0);

  const totalReceived = receivables
    .filter(r => r.status === 'received')
    .reduce((acc, r) => acc + (r.receivedAmount || r.amount), 0);

  const handleOpenAdd = () => {
    setDescription('');
    setClientName('');
    setClientId('');
    setCategory('Venda de Terço');
    setAmount('');
    setDueDate('');
    setTotalInstallments(1);
    setNotes('');
    setScreen('add');
  };

  const handleSelectClient = (cId: string) => {
    setClientId(cId);
    const cli = clients.find(c => c.id === cId);
    if (cli) {
      setClientName(cli.name);
    }
  };

  const handleCreateReceivable = async (e: React.FormEvent) => {
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
      await addReceivable({
        description: description.trim(),
        clientName: clientName.trim() || 'Cliente Geral',
        clientId: clientId || undefined,
        category,
        amount: numAmount,
        issueDate: issueDate || nowStr,
        dueDate,
        totalInstallments: Math.max(1, totalInstallments),
        notes: notes.trim(),
      });
      toast.success('Conta a receber cadastrada com sucesso!');
      setScreen('list');
    } catch {
      toast.error('Erro ao cadastrar conta a receber.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSettle = (r: AccountReceivable) => {
    setSettleItem(r);
    setSettleAmount((r.amount - (r.receivedAmount || 0)).toFixed(2));
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
      toast.error('Informe um valor válido de recebimento.');
      return;
    }

    setIsSettling(true);
    try {
      await settleReceivable(settleItem.id, {
        amount: numAmount,
        paymentDate: settleDate,
        paymentMethod: settleMethod,
        notes: settleNotes.trim(),
      });
      toast.success('Recebimento confirmado! Entrada registrada no caixa.');
      setSettleItem(null);
      setScreen('list');
    } catch {
      toast.error('Erro ao registrar recebimento.');
    } finally {
      setIsSettling(false);
    }
  };

  // ----------------------------------------------------
  // SUB-VIEW: NOVA CONTA A RECEBER (SEM MODAL)
  // ----------------------------------------------------
  if (screen === 'add') {
    return (
      <div className="space-y-6 animate-slide-in-up max-w-4xl mx-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setScreen('list')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={15} />
            <span>Voltar para Contas a Receber</span>
          </button>
          <span className="text-xs text-slate-500 font-medium">Novo Recebível</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Cadastrar Nova Conta a Receber</h3>
            <p className="text-xs text-slate-500 mt-1">Registre pagamentos a prazo, encomendas, paróquias ou vendas diretas.</p>
          </div>

          <form onSubmit={handleCreateReceivable} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Descrição da Cobrança *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Parcela 1/2 Terço Noiva Imperial"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Vincular a um Cliente Existente</label>
                <select
                  value={clientId}
                  onChange={e => handleSelectClient(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                >
                  <option value="">(Digitar cliente avulso abaixo)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nome do Cliente / Paróquia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Paróquia São José"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Categoria</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                >
                  <option value="Venda de Terço">Venda de Terço</option>
                  <option value="Restauração Sacra">Restauração Sacra</option>
                  <option value="Imagens Religiosas">Imagens Religiosas</option>
                  <option value="Lembranças de Batizado">Lembranças de Batizado / Casamento</option>
                  <option value="Artigos Paroquiais">Artigos Paroquiais</option>
                  <option value="Outros">Outras Receitas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Valor (R$) *</label>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Vencimento da Cobrança *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Número de Parcelas</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={totalInstallments}
                  onChange={e => setTotalInstallments(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Observações Adicionais</label>
              <textarea
                rows={3}
                placeholder="Condições combinadas, número de pedido..."
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
                Salvar Conta a Receber
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SUB-VIEW: CONFIRMAR RECEBIMENTO (SEM MODAL)
  // ----------------------------------------------------
  if (screen === 'settle' && settleItem) {
    const remainingBalance = settleItem.amount - (settleItem.receivedAmount || 0);

    return (
      <div className="space-y-6 animate-slide-in-up max-w-2xl mx-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <button
            type="button"
            onClick={() => { setSettleItem(null); setScreen('list'); }}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={15} />
            <span>Voltar para Contas a Receber</span>
          </button>
          <span className="text-xs text-slate-500 font-medium">Baixa de Recebimento</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Registrar Recebimento</h3>
            <p className="text-xs text-slate-500 mt-1">Confirmar entrada financeira e creditar automaticamente no Fluxo de Caixa.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 text-xs space-y-2">
            <div className="font-bold text-sm text-slate-900">{settleItem.description}</div>
            <div className="text-slate-600">Cliente / Pagador: <span className="font-semibold text-slate-800">{settleItem.clientName}</span></div>
            <div className="text-slate-600">Vencimento Original: <span className="font-semibold text-slate-800">{settleItem.dueDate.split('-').reverse().join('/')}</span></div>
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Saldo Restante a Receber:</span>
              <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                R$ {remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          <form onSubmit={handleConfirmSettle} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Valor Recebido (R$) *</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Data do Recebimento *</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Forma de Pagamento Utilizada *</label>
              <select
                value={settleMethod}
                onChange={e => setSettleMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value="pix">PIX (Chave Instantânea)</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="debit_card">Cartão de Débito</option>
                <option value="bank_slip">Boleto Bancário</option>
                <option value="cash">Dinheiro em Espécie</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Anotações da Liquidação</label>
              <input
                type="text"
                placeholder="Ex: Comprovante enviado via WhatsApp"
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
                Confirmar Recebimento e Creditar no Caixa
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LIST SCREEN: CONTAS A RECEBER RESPONSIVO (SEM MODAL)
  // ----------------------------------------------------
  return (
    <div className="space-y-6 select-none font-sans">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total a Receber"
          value={`R$ ${totalPending.toFixed(2)}`}
          subtitle="Cobranças em aberto"
          variant="gold"
          icon={<Clock size={18} />}
        />
        <StatCard
          title="Recebíveis em Atraso"
          value={`R$ ${totalOverdue.toFixed(2)}`}
          subtitle="Aguardando liquidação"
          variant="rose"
          icon={<AlertCircle size={18} />}
        />
        <StatCard
          title="Total Já Recebido"
          value={`R$ ${totalReceived.toFixed(2)}`}
          subtitle="Entradas liquidadas"
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
              placeholder="Buscar por descrição, cliente ou categoria..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setReceivablesPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => { setFilterStatus('all'); setReceivablesPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => { setFilterStatus('pending'); setReceivablesPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterStatus === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A Receber
            </button>
            <button
              onClick={() => { setFilterStatus('overdue'); setReceivablesPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterStatus === 'overdue' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Em Atraso
            </button>
            <button
              onClick={() => { setFilterStatus('received'); setReceivablesPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterStatus === 'received' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recebidos
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenAdd}
          icon={<Plus size={15} />}
        >
          Nova Conta a Receber
        </Button>
      </div>

      {/* Receivables Data Container */}
      <div className="bg-white border border-slate-200/85 rounded-2xl shadow-xs overflow-hidden">
        {/* Mobile Cards (< sm) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {paginatedReceivables.map(r => {
            const isOverdue = r.status !== 'received' && r.dueDate < nowStr;
            return (
              <div key={r.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-slate-900 truncate">{r.description}</span>
                  <Badge variant={r.status === 'received' ? 'success' : isOverdue ? 'danger' : 'warning'} size="xs">
                    {r.status === 'received' ? 'Recebido' : isOverdue ? 'Em Atraso' : 'A Vencer'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Cliente: {r.clientName}</span>
                  <span>Vencimento: {r.dueDate.split('-').reverse().join('/')}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Valor</span>
                    <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                      R$ {r.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {r.status !== 'received' && (
                      <Button
                        size="xs"
                        variant="success"
                        onClick={() => handleOpenSettle(r)}
                        icon={<FileCheck2 size={13} />}
                      >
                        Baixar
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Excluir a conta a receber "${r.description}"?`)) {
                          deleteReceivable(r.id);
                          toast.success('Cobrança removida.');
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir cobrança"
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
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4">Parcela</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedReceivables.map(r => {
                const isOverdue = r.status !== 'received' && r.dueDate < nowStr;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900">{r.description}</td>
                    <td className="py-3.5 px-4 text-slate-600">{r.clientName}</td>
                    <td className="py-3.5 px-4 text-slate-500">{r.category}</td>
                    <td className="py-3.5 px-4 font-mono">{r.dueDate.split('-').reverse().join('/')}</td>
                    <td className="py-3.5 px-4 font-mono">{r.installmentNumber || 1}/{r.totalInstallments || 1}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      R$ {r.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={r.status === 'received' ? 'success' : isOverdue ? 'danger' : 'warning'} size="xs">
                        {r.status === 'received' ? 'Recebido' : isOverdue ? 'Em Atraso' : 'A Vencer'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.status !== 'received' && (
                          <Button
                            size="xs"
                            variant="success"
                            onClick={() => handleOpenSettle(r)}
                            icon={<FileCheck2 size={13} />}
                          >
                            Baixar
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Excluir a conta a receber "${r.description}"?`)) {
                              deleteReceivable(r.id);
                              toast.success('Cobrança removida.');
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir cobrança"
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

        {filteredReceivables.length === 0 && (
          <div className="p-8">
            <EmptyState
              icon={<CreditCard size={32} className="text-slate-400" />}
              title="Nenhuma conta a receber encontrada"
              description={searchTerm || filterStatus !== 'all' ? "Ajuste os filtros de status ou o termo de busca." : "Cadastre sua primeira conta a receber para gerenciar suas entradas."}
              actionLabel={!searchTerm ? "Cadastrar Conta a Receber" : undefined}
              onAction={!searchTerm ? handleOpenAdd : undefined}
            />
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={receivablesPage}
        totalPages={Math.ceil(filteredReceivables.length / receivablesPerPage)}
        totalItems={filteredReceivables.length}
        itemsPerPage={receivablesPerPage}
        onPageChange={setReceivablesPage}
        onItemsPerPageChange={(val) => { setReceivablesPerPage(val); setReceivablesPage(1); }}
        labelSingular="conta a receber"
        labelPlural="contas a receber"
      />
    </div>
  );
};
