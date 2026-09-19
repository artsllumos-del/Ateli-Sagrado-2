import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { AccountReceivable } from '../../types/erp';
import { 
  Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, Calendar, 
  CreditCard, DollarSign, Trash2, ArrowUpRight, QrCode, Tag, User,
  FileCheck2, Check, ExternalLink, Link2, Copy
} from 'lucide-react';
import { toast } from '../Toast';

interface ReceivablesTabProps {
  onOpenCheckout?: (rec: AccountReceivable) => void;
}

export const ReceivablesTab: React.FC<ReceivablesTabProps> = ({ onOpenCheckout }) => {
  const { receivables, addReceivable, deleteReceivable, settleReceivable, clients } = useDb();
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'received'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [settleModalItem, setSettleModalItem] = useState<AccountReceivable | null>(null);

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
    const effectiveStatus = r.status === 'received' ? 'received' : (isOverdue ? 'overdue' : 'pending');

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

  const totalPending = receivables
    .filter(r => r.status !== 'received')
    .reduce((acc, r) => acc + (r.amount - (r.receivedAmount || 0)), 0);

  const totalOverdue = receivables
    .filter(r => r.status !== 'received' && r.dueDate < nowStr)
    .reduce((acc, r) => acc + (r.amount - (r.receivedAmount || 0)), 0);

  const totalReceived = receivables
    .filter(r => r.status === 'received')
    .reduce((acc, r) => acc + (r.receivedAmount || r.amount), 0);

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

    setIsSubmitting(true);
    try {
      await addReceivable({
        description: description.trim(),
        clientName: clientName.trim() || undefined,
        clientId: clientId || undefined,
        category,
        issueDate,
        dueDate: dueDate || issueDate,
        amount: numAmount,
        receivedAmount: 0,
        installmentNumber: 1,
        totalInstallments: Number(totalInstallments) || 1,
        status: 'pending',
        notes: notes.trim() || undefined
      });

      toast.success('Conta a receber registrada com sucesso!');
      setShowAddModal(false);
      setDescription('');
      setClientName('');
      setClientId('');
      setAmount('');
      setDueDate('');
      setNotes('');
      setTotalInstallments(1);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar conta a receber.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSettle = (r: AccountReceivable) => {
    setSettleModalItem(r);
    const balance = r.amount - (r.receivedAmount || 0);
    setSettleAmount(balance.toFixed(2));
    setSettleDate(new Date().toISOString().split('T')[0]);
    setSettleMethod('pix');
    setSettleNotes('');
  };

  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModalItem) return;

    const val = parseFloat(settleAmount);
    if (isNaN(val) || val <= 0) {
      toast.error('Informe um valor de recebimento válido.');
      return;
    }

    setIsSettling(true);
    try {
      const res = await settleReceivable(
        settleModalItem.id,
        val,
        settleDate,
        settleMethod,
        settleNotes
      );

      if (res.success) {
        toast.success(`Recebimento liquidado com sucesso! Lançamento gerado no caixa.`);
        setSettleModalItem(null);
      } else {
        toast.error(res.error || 'Erro ao liquidar recebimento.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado ao liquidar recebimento.');
    } finally {
      setIsSettling(false);
    }
  };

  const handleCopyPaymentLink = (r: AccountReceivable) => {
    const link = r.paymentLink || `https://pay.ateliesagrado.com/c/${r.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Link de pagamento copiado para a área de transferência!');
  };

  return (
    <div className="space-y-6 animate-slide-in-up">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total a Receber (Pendente)</span>
            <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">
              R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-xs text-slate-500 mt-1 block">Receitas previstas em aberto</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vencidas / Em Atraso</span>
            <h3 className="text-2xl font-bold font-mono text-rose-600 mt-1">
              R$ {totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-xs text-rose-500 mt-1 block">Inadimplência sob cobrança</span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recebidas no Período</span>
            <h3 className="text-2xl font-bold font-mono text-emerald-600 mt-1">
              R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-xs text-slate-500 mt-1 block">Entradas confirmadas no caixa</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/85 p-4 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar título, cliente, categoria..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['all', 'pending', 'overdue', 'received'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === st ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st === 'all' && 'Todos'}
                {st === 'pending' && 'A Receber'}
                {st === 'overdue' && 'Vencidos'}
                {st === 'received' && 'Recebidos'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-xs"
        >
          <Plus size={14} />
          <span>Novo Título a Receber</span>
        </button>
      </div>

      {/* Receivables Table */}
      <div className="bg-white border border-slate-200/85 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 bg-slate-50/75 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Descrição & Categoria</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4">Parcela</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredReceivables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum título a receber encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredReceivables.map(r => {
                  const isOverdue = r.status !== 'received' && r.dueDate < nowStr;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex flex-col">
                          <span>{r.description}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Tag size={10} /> {r.category}
                            {r.orderNumber && (
                              <span className="text-gold-700 font-mono">#{r.orderNumber}</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <User size={12} className="text-slate-400" />
                          <span>{r.clientName || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                          {r.dueDate.split('-').reverse().join('/')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                          {r.installmentNumber || 1}/{r.totalInstallments || 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        R$ {r.amount.toFixed(2)}
                        {r.receivedAmount && r.receivedAmount > 0 && r.status !== 'received' && (
                          <div className="text-[10px] text-emerald-600 font-normal">
                            Recebido: R$ {r.receivedAmount.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {r.status === 'received' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> Recebido
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle size={11} /> Vencido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock size={11} /> A Receber
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status !== 'received' && (
                            <>
                              <button
                                onClick={() => handleOpenSettle(r)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                title="Confirmar recebimento manual e lançar no caixa"
                              >
                                <FileCheck2 size={12} />
                                <span>Baixar</span>
                              </button>

                              <button
                                onClick={() => onOpenCheckout ? onOpenCheckout(r) : handleCopyPaymentLink(r)}
                                className="px-2.5 py-1 bg-gold-600 hover:bg-gold-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                title="Gerar cobrança online com PIX / Cartão"
                              >
                                <QrCode size={12} />
                                <span>Cobrar</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Excluir o título "${r.description}"?`)) {
                                deleteReceivable(r.id);
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVO TÍTULO A RECEBER */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus size={16} className="text-gold-600" />
                Cadastrar Conta a Receber
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReceivable} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição do Recebimento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Terço São Bento - Encomenda Especial"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cliente</label>
                  <input
                    type="text"
                    list="clients-list"
                    placeholder="Nome do cliente"
                    value={clientName}
                    onChange={e => {
                      setClientName(e.target.value);
                      const found = clients.find(c => c.name.toLowerCase() === e.target.value.toLowerCase());
                      if (found) setClientId(found.id);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  />
                  <datalist id="clients-list">
                    {clients.map(c => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-white"
                  >
                    <option value="Venda de Terço">Venda de Terço</option>
                    <option value="Restauração">Restauração</option>
                    <option value="Lembrancinhas">Lembrancinhas / Eventos</option>
                    <option value="Consultoria">Consultoria Sacra</option>
                    <option value="Outras Receitas">Outras Receitas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valor Total (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={totalInstallments}
                    onChange={e => setTotalInstallments(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações Internas</label>
                <textarea
                  rows={2}
                  placeholder="Informações contratuais ou instruções..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-150 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Título'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DAR BAIXA EM CONTA A RECEBER */}
      {settleModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-emerald-50/50">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileCheck2 size={16} className="text-emerald-600" />
                Confirmar Recebimento (Baixa no Caixa)
              </h3>
              <button onClick={() => setSettleModalItem(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSettle} className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                <div className="font-bold text-slate-900">{settleModalItem.description}</div>
                <div className="text-slate-500">Cliente: {settleModalItem.clientName || '—'}</div>
                <div className="text-slate-500">Vencimento: {settleModalItem.dueDate.split('-').reverse().join('/')}</div>
                <div className="font-mono font-bold text-slate-900 pt-1">
                  Saldo em Aberto: R$ {(settleModalItem.amount - (settleModalItem.receivedAmount || 0)).toFixed(2)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valor Recebido (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={settleAmount}
                    onChange={e => setSettleAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data do Recebimento *</label>
                  <input
                    type="date"
                    required
                    value={settleDate}
                    onChange={e => setSettleDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Forma de Recebimento *</label>
                <select
                  value={settleMethod}
                  onChange={e => setSettleMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="pix">PIX Instantâneo</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="debit_card">Cartão de Débito</option>
                  <option value="bank_slip">Boleto Bancário</option>
                  <option value="cash">Dinheiro em Espécie</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações do Recebimento</label>
                <input
                  type="text"
                  placeholder="Ex: Recebido no balcão / Comprovante arquivado"
                  value={settleNotes}
                  onChange={e => setSettleNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-150 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSettleModalItem(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSettling}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSettling ? 'Registrando...' : (
                    <>
                      <Check size={14} />
                      Confirmar Baixa
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
