import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { AccountPayable } from '../../types/erp';
import { 
  Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, Calendar, 
  CreditCard, DollarSign, Trash2, ArrowDownRight, QrCode, Tag, Building2,
  FileCheck2, Check
} from 'lucide-react';
import { toast } from '../Toast';

export const PayablesTab: React.FC = () => {
  const { payables, addPayable, deletePayable, settlePayable } = useDb();
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [settleModalItem, setSettleModalItem] = useState<AccountPayable | null>(null);

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

  // Calculations & Filtering
  const nowStr = new Date().toISOString().split('T')[0];

  const filteredPayables = payables.filter(p => {
    // Dynamic status calculation
    const isOverdue = p.status !== 'paid' && p.dueDate < nowStr;
    const effectiveStatus = p.status === 'paid' ? 'paid' : (isOverdue ? 'overdue' : 'pending');

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

  const totalPending = payables
    .filter(p => p.status !== 'paid')
    .reduce((acc, p) => acc + (p.amount - (p.paidAmount || 0)), 0);

  const totalOverdue = payables
    .filter(p => p.status !== 'paid' && p.dueDate < nowStr)
    .reduce((acc, p) => acc + (p.amount - (p.paidAmount || 0)), 0);

  const totalPaid = payables
    .filter(p => p.status === 'paid')
    .reduce((acc, p) => acc + (p.paidAmount || p.amount), 0);

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

    setIsSubmitting(true);
    try {
      await addPayable({
        description: description.trim(),
        supplierName: supplierName.trim() || undefined,
        category,
        issueDate,
        dueDate: dueDate || issueDate,
        amount: numAmount,
        paidAmount: 0,
        installmentNumber: 1,
        totalInstallments: Number(totalInstallments) || 1,
        status: 'pending',
        barcode: barcode.trim() || undefined,
        pixKey: pixKey.trim() || undefined,
        notes: notes.trim() || undefined
      });

      toast.success('Conta a pagar registrada com sucesso!');
      setShowAddModal(false);
      // Reset
      setDescription('');
      setSupplierName('');
      setAmount('');
      setDueDate('');
      setBarcode('');
      setPixKey('');
      setNotes('');
      setTotalInstallments(1);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar conta a pagar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSettle = (p: AccountPayable) => {
    setSettleModalItem(p);
    const balance = p.amount - (p.paidAmount || 0);
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
      toast.error('Informe um valor de baixa válido.');
      return;
    }

    setIsSettling(true);
    try {
      const res = await settlePayable(
        settleModalItem.id,
        val,
        settleDate,
        settleMethod,
        settleNotes
      );

      if (res.success) {
        toast.success(`Baixa efetuada com sucesso! Lançamento gerado no fluxo de caixa.`);
        setSettleModalItem(null);
      } else {
        toast.error(res.error || 'Erro ao processar baixa do título.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro inesperado ao liquidar título.');
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-in-up">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total a Pagar (Pendente)</span>
            <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">
              R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-xs text-slate-500 mt-1 block">Compromissos futuros em aberto</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vencidas em Atraso</span>
            <h3 className="text-2xl font-bold font-mono text-rose-600 mt-1">
              R$ {totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-xs text-rose-500 mt-1 block">Exigem liquidação prioritária</span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pagas / Liquidadas</span>
            <h3 className="text-2xl font-bold font-mono text-emerald-600 mt-1">
              R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-xs text-slate-500 mt-1 block">Contas honradas no período</span>
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
              placeholder="Buscar título, fornecedor, categoria..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['all', 'pending', 'overdue', 'paid'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === st ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st === 'all' && 'Todos'}
                {st === 'pending' && 'A Vencer'}
                {st === 'overdue' && 'Vencidos'}
                {st === 'paid' && 'Pagos'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shadow-xs"
        >
          <Plus size={14} />
          <span>Novo Título a Pagar</span>
        </button>
      </div>

      {/* Payables Table */}
      <div className="bg-white border border-slate-200/85 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 bg-slate-50/75 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Descrição & Categoria</th>
                <th className="py-3 px-4">Fornecedor</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4">Parcela</th>
                <th className="py-3 px-4 text-right">Valor Título</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPayables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum compromisso a pagar encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredPayables.map(p => {
                  const isOverdue = p.status !== 'paid' && p.dueDate < nowStr;
                  const balance = p.amount - (p.paidAmount || 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex flex-col">
                          <span>{p.description}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Tag size={10} /> {p.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Building2 size={12} className="text-slate-400" />
                          <span>{p.supplierName || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                          {p.dueDate.split('-').reverse().join('/')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                          {p.installmentNumber || 1}/{p.totalInstallments || 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        R$ {p.amount.toFixed(2)}
                        {p.paidAmount && p.paidAmount > 0 && p.status !== 'paid' && (
                          <div className="text-[10px] text-emerald-600 font-normal">
                            Pago: R$ {p.paidAmount.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {p.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> Pago
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle size={11} /> Vencido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={11} /> A Vencer
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p.status !== 'paid' && (
                            <button
                              onClick={() => handleOpenSettle(p)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                              title="Dar baixa no título e lançar no caixa"
                            >
                              <FileCheck2 size={13} />
                              <span>Baixar</span>
                            </button>
                          )}
                          <button
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVO TÍTULO A PAGAR */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus size={16} className="text-gold-600" />
                Cadastrar Conta a Pagar
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePayable} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição do Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fornecedor de Crucifixos e Metais"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fornecedor / Favorecido</label>
                  <input
                    type="text"
                    placeholder="Ex: Metais Sacros LTDA"
                    value={supplierName}
                    onChange={e => setSupplierName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-white"
                  >
                    <option value="Compra de Materiais">Compra de Materiais</option>
                    <option value="Custos Fixos">Custos Fixos</option>
                    <option value="Serviços Terceiros">Serviços Terceiros</option>
                    <option value="Impostos e Taxas">Impostos e Taxas</option>
                    <option value="Marketing">Marketing & Vendas</option>
                    <option value="Outros Custos">Outros Custos</option>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código de Barras / Boleto</label>
                  <input
                    type="text"
                    placeholder="Linha digitável"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chave PIX do Fornecedor</label>
                  <input
                    type="text"
                    placeholder="CNPJ, e-mail ou aleatória"
                    value={pixKey}
                    onChange={e => setPixKey(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações Internas</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes adicionais do pagamento..."
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

      {/* MODAL: DAR BAIXA EM CONTA A PAGAR */}
      {settleModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-emerald-50/50">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileCheck2 size={16} className="text-emerald-600" />
                Liquidar Título (Baixa com Lançamento no Caixa)
              </h3>
              <button onClick={() => setSettleModalItem(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSettle} className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                <div className="font-bold text-slate-900">{settleModalItem.description}</div>
                <div className="text-slate-500">Fornecedor: {settleModalItem.supplierName || '—'}</div>
                <div className="text-slate-500">Vencimento: {settleModalItem.dueDate.split('-').reverse().join('/')}</div>
                <div className="font-mono font-bold text-slate-900 pt-1">
                  Saldo Restante: R$ {(settleModalItem.amount - (settleModalItem.paidAmount || 0)).toFixed(2)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valor Pago (R$) *</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data do Pagamento *</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Forma de Pagamento *</label>
                <select
                  value={settleMethod}
                  onChange={e => setSettleMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="pix">PIX</option>
                  <option value="bank_transfer">Transferência Bancária (TED/DOC)</option>
                  <option value="bank_slip">Boleto Bancário</option>
                  <option value="credit_card">Cartão Corporativo</option>
                  <option value="cash">Dinheiro em Espécie</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações da Liquidação</label>
                <input
                  type="text"
                  placeholder="Ex: Comprovante autenticado no banco"
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
