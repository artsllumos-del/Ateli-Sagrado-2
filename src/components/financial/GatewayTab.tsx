import React, { useState } from 'react';
import { useDb } from '../../context/DbContext';
import { OnlinePaymentCharge } from '../../types/erp';
import { 
  CreditCard, QrCode, Smartphone, RefreshCcw, ShieldCheck, CheckCircle2, 
  Clock, AlertTriangle, ExternalLink, RotateCcw, Copy, Check, Settings, 
  Send, FileText, Zap, DollarSign, Plus
} from 'lucide-react';
import { toast } from '../Toast';

interface GatewayTabProps {
  initialReceivableToCharge?: {
    id: string;
    description: string;
    amount: number;
    clientName?: string;
  } | null;
}

export const GatewayTab: React.FC<GatewayTabProps> = ({ initialReceivableToCharge }) => {
  const { 
    paymentCharges, 
    paymentConfig, 
    createPaymentCheckout, 
    simulateWebhookPayment, 
    refundCharge, 
    updatePaymentConfig,
    receivables
  } = useDb();

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'refunded'>('all');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showNewChargeModal, setShowNewChargeModal] = useState(!!initialReceivableToCharge);
  const [refundModalCharge, setRefundModalCharge] = useState<OnlinePaymentCharge | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);
  const [activeWebhookSimulatingId, setActiveWebhookSimulatingId] = useState<string | null>(null);

  // New Charge Form
  const [customerName, setCustomerName] = useState(initialReceivableToCharge?.clientName || '');
  const [customerDoc, setCustomerDoc] = useState('');
  const [chargeAmount, setChargeAmount] = useState(initialReceivableToCharge?.amount ? initialReceivableToCharge.amount.toFixed(2) : '');
  const [chargeMethod, setChargeMethod] = useState<'pix' | 'credit_card' | 'bank_slip'>('pix');
  const [installments, setInstallments] = useState(1);
  const [selectedReceivableId, setSelectedReceivableId] = useState(initialReceivableToCharge?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [createdChargeResult, setCreatedChargeResult] = useState<OnlinePaymentCharge | null>(null);

  // Gateway Config Form
  const [gwEnabled, setGwEnabled] = useState(paymentConfig.enabled ?? true);
  const [gwProvider, setGwProvider] = useState(paymentConfig.gateway || 'pix_bacen');
  const [gwPixKey, setGwPixKey] = useState(paymentConfig.pixKey || 'pix@ateliesagrado.com.br');
  const [gwAutoReconcile, setGwAutoReconcile] = useState(paymentConfig.autoReconcile ?? true);
  const [gwSandbox, setGwSandbox] = useState(paymentConfig.sandbox ?? true);

  const filteredCharges = paymentCharges.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  const totalProcessed = paymentCharges
    .filter(c => c.status === 'paid')
    .reduce((acc, c) => acc + c.amount, 0);

  const totalPending = paymentCharges
    .filter(c => c.status === 'pending')
    .reduce((acc, c) => acc + c.amount, 0);

  const handleGenerateCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(chargeAmount);
    if (isNaN(val) || val <= 0) {
      toast.error('Informe um valor válido para a cobrança.');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Informe o nome do cliente.');
      return;
    }

    setIsGenerating(true);
    try {
      const charge = await createPaymentCheckout({
        receivableId: selectedReceivableId || undefined,
        customerName: customerName.trim(),
        customerDocument: customerDoc.trim() || undefined,
        amount: val,
        method: chargeMethod,
        installments: Number(installments) || 1
      });

      setCreatedChargeResult(charge);
      toast.success('Cobrança online gerada com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar checkout online.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSimulateWebhook = async (chargeId: string) => {
    setActiveWebhookSimulatingId(chargeId);
    try {
      const success = await simulateWebhookPayment(chargeId);
      if (success) {
        toast.success(`Webhook recebido com idempotência! Pagamento confirmado e saldo reconciliado.`);
      } else {
        toast.error('Falha ao processar simulação de webhook.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro na chamada de webhook.');
    } finally {
      setActiveWebhookSimulatingId(null);
    }
  };

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalCharge) return;

    setIsRefunding(true);
    try {
      const success = await refundCharge(refundModalCharge.id, refundReason.trim() || 'Cancelamento solicitado pelo cliente');
      if (success) {
        toast.success(`Estorno processado no gateway e estornado no caixa!`);
        setRefundModalCharge(null);
        setRefundReason('');
      } else {
        toast.error('Não foi possível efetuar o reembolso.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro no estorno.');
    } finally {
      setIsRefunding(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePaymentConfig({
      enabled: gwEnabled,
      gateway: gwProvider as any,
      pixKey: gwPixKey.trim(),
      autoReconcile: gwAutoReconcile,
      sandbox: gwSandbox
    });
    setShowConfigModal(false);
    toast.success('Configurações do Gateway atualizadas com sucesso!');
  };

  return (
    <div className="space-y-6 animate-slide-in-up">
      {/* Gateway Status Header */}
      <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gold-500/10 text-gold-600 rounded-xl">
            <Zap size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Integração de Pagamentos Online & PIX</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                paymentConfig.sandbox ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {paymentConfig.sandbox ? 'Ambiente de Teste (Sandbox)' : 'Produção Ativa'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gateway ativo: <strong className="text-slate-800 capitalize">{paymentConfig.gateway?.replace('_', ' ') || 'PIX Bacen'}</strong> • Chave PIX: <span className="font-mono">{paymentConfig.pixKey || 'pix@ateliesagrado.com.br'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
          >
            <Settings size={14} />
            <span>Configurar Gateway</span>
          </button>
          <button
            onClick={() => {
              setCreatedChargeResult(null);
              setShowNewChargeModal(true);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-98 shadow-xs"
          >
            <Plus size={14} />
            <span>Nova Cobrança Online</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Liquidado via Gateway</span>
          <h4 className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            R$ {totalProcessed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h4>
          <span className="text-xs text-slate-500 mt-1 block">Reconciliado automaticamente no caixa</span>
        </div>

        <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cobranças Pendentes no Checkout</span>
          <h4 className="text-2xl font-bold font-mono text-amber-600 mt-1">
            R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h4>
          <span className="text-xs text-slate-500 mt-1 block">Aguardando leitura do PIX / cartão</span>
        </div>

        <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Segurança & Idempotência</span>
          <h4 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <ShieldCheck size={20} className="text-emerald-600" />
            Anti-Duplicação Ativo
          </h4>
          <span className="text-xs text-slate-500 mt-1 block">Webhooks idempotentes via UUID</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-white border border-slate-200/85 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['all', 'pending', 'paid', 'refunded'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === st ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {st === 'all' && 'Todas as Cobranças'}
              {st === 'pending' && 'Pendentes'}
              {st === 'paid' && 'Pagas'}
              {st === 'refunded' && 'Estornadas'}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {filteredCharges.length} registro(s)
        </span>
      </div>

      {/* Charges Table */}
      <div className="bg-white border border-slate-200/85 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 bg-slate-50/75 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">ID & Data</th>
                <th className="py-3 px-4">Cliente / Documento</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Idempotência</th>
                <th className="py-3 px-4 text-right">Ações do Gateway</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredCharges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhuma transação online registrada. Crie uma nova cobrança acima.
                  </td>
                </tr>
              ) : (
                filteredCharges.map(charge => (
                  <tr key={charge.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="font-bold text-slate-900">#{charge.id}</div>
                      <div className="text-slate-400 text-[10px]">
                        {new Date(charge.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{charge.customerName}</div>
                      {charge.customerDocument && (
                        <div className="font-mono text-[10px] text-slate-400">{charge.customerDocument}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 uppercase font-bold text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {charge.method === 'pix' && <QrCode size={11} className="text-emerald-600" />}
                        {charge.method === 'credit_card' && <CreditCard size={11} className="text-blue-600" />}
                        {charge.method === 'bank_slip' && <FileText size={11} className="text-amber-600" />}
                        {charge.method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      R$ {charge.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {charge.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} /> Pago
                        </span>
                      ) : charge.status === 'refunded' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <RotateCcw size={11} /> Estornado
                        </span>
                      ) : charge.status === 'cancelled' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Cancelado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={11} /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-[10px] text-slate-500">
                      {charge.idempotencyKey ? (
                        <span title={charge.idempotencyKey} className="cursor-help bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {charge.idempotencyKey.slice(0, 10)}...
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {charge.status === 'pending' && (
                          <button
                            onClick={() => handleSimulateWebhook(charge.id)}
                            disabled={activeWebhookSimulatingId === charge.id}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                            title="Simular disparo de Webhook do gateway confirmando pagamento"
                          >
                            <Send size={11} />
                            <span>{activeWebhookSimulatingId === charge.id ? 'Disparando...' : 'Simular Webhook'}</span>
                          </button>
                        )}

                        {charge.status === 'paid' && (
                          <button
                            onClick={() => setRefundModalCharge(charge)}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            title="Solicitar estorno/reembolso no gateway"
                          >
                            <RotateCcw size={11} />
                            <span>Estornar</span>
                          </button>
                        )}

                        {charge.pixCopyPaste && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(charge.pixCopyPaste!);
                              toast.success('Código PIX Copia e Cola copiado!');
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Copiar Chave PIX"
                          >
                            <Copy size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVA COBRANÇA ONLINE */}
      {showNewChargeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <QrCode size={16} className="text-gold-600" />
                Gerar Cobrança Online / PIX
              </h3>
              <button onClick={() => setShowNewChargeModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            {createdChargeResult ? (
              <div className="p-5 space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="font-bold text-slate-900">Cobrança Gerada com Sucesso!</h4>
                  <p className="text-xs text-slate-500">
                    Compartilhe a chave PIX ou envie o link de pagamento para o cliente.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-3">
                  <div className="text-xs text-slate-500">Valor da Cobrança</div>
                  <div className="text-3xl font-bold font-mono text-slate-900">
                    R$ {createdChargeResult.amount.toFixed(2)}
                  </div>

                  {createdChargeResult.pixCopyPaste && (
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        PIX Copia e Cola:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={createdChargeResult.pixCopyPaste}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 select-all"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(createdChargeResult.pixCopyPaste!);
                            toast.success('Código PIX copiado!');
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Copy size={12} />
                          <span>Copiar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => {
                      handleSimulateWebhook(createdChargeResult.id);
                      setShowNewChargeModal(false);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send size={13} />
                    <span>Simular Pagamento Imediato</span>
                  </button>

                  <button
                    onClick={() => setShowNewChargeModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerateCheckout} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vincular a Título a Receber (Opcional)</label>
                  <select
                    value={selectedReceivableId}
                    onChange={e => {
                      setSelectedReceivableId(e.target.value);
                      const rec = receivables.find(r => r.id === e.target.value);
                      if (rec) {
                        setChargeAmount((rec.amount - (rec.receivedAmount || 0)).toFixed(2));
                        if (rec.clientName) setCustomerName(rec.clientName);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-white"
                  >
                    <option value="">Cobrança Avulsa (Sem título prévio)</option>
                    {receivables.filter(r => r.status !== 'received').map(r => (
                      <option key={r.id} value={r.id}>
                        {r.description} — R$ {(r.amount - (r.receivedAmount || 0)).toFixed(2)} ({r.clientName || 'Cliente'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Cliente *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ana Maria Silva"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">CPF / CNPJ do Pagador</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={customerDoc}
                      onChange={e => setCustomerDoc(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Valor (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={chargeAmount}
                      onChange={e => setChargeAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Meio de Pagamento</label>
                    <select
                      value={chargeMethod}
                      onChange={e => setChargeMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-white"
                    >
                      <option value="pix">PIX Dinâmico</option>
                      <option value="credit_card">Cartão de Crédito</option>
                      <option value="bank_slip">Boleto Bancário</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Parcelas</label>
                    <select
                      value={installments}
                      onChange={e => setInstallments(parseInt(e.target.value) || 1)}
                      disabled={chargeMethod !== 'credit_card'}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-white disabled:opacity-50"
                    >
                      <option value="1">1x (À vista)</option>
                      <option value="2">2x</option>
                      <option value="3">3x</option>
                      <option value="6">6x</option>
                      <option value="12">12x</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-150 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewChargeModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Zap size={14} />
                    <span>{isGenerating ? 'Gerando...' : 'Gerar Cobrança'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAÇÃO DO GATEWAY */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Settings size={16} className="text-slate-600" />
                Configurar Gateway de Pagamentos
              </h3>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Provedor de Pagamento</label>
                <select
                  value={gwProvider}
                  onChange={e => setGwProvider(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 bg-white"
                >
                  <option value="pix_bacen">PIX Direto (Banco Central do Brasil)</option>
                  <option value="pagarme">Pagar.me / Stone</option>
                  <option value="asaas">Asaas Gestão Financeira</option>
                  <option value="mercadopago">Mercado Pago Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chave PIX Cadastrada</label>
                <input
                  type="text"
                  required
                  value={gwPixKey}
                  onChange={e => setGwPixKey(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gwAutoReconcile}
                    onChange={e => setGwAutoReconcile(e.target.checked)}
                    className="rounded border-slate-300 text-gold-600 focus:ring-gold-500"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Reconciliação automática (Dar baixa no título e lançar no caixa ao receber Webhook)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gwSandbox}
                    onChange={e => setGwSandbox(e.target.checked)}
                    className="rounded border-slate-300 text-gold-600 focus:ring-gold-500"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Modo Sandbox / Homologação (Sem cobrança real de cartões)
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-150 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ESTORNO / REEMBOLSO */}
      {refundModalCharge && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-purple-50/50">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <RotateCcw size={16} className="text-purple-600" />
                Confirmar Estorno / Reembolso
              </h3>
              <button onClick={() => setRefundModalCharge(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmRefund} className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                <div className="font-bold text-slate-900">Cobrança #{refundModalCharge.id}</div>
                <div className="text-slate-500">Cliente: {refundModalCharge.customerName}</div>
                <div className="font-mono font-bold text-purple-700 pt-1">
                  Valor a Estornar: R$ {refundModalCharge.amount.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo do Estorno *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Desistência da compra / Devolução de produto"
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-150 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRefundModalCharge(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRefunding}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isRefunding ? 'Processando...' : (
                    <>
                      <RotateCcw size={14} />
                      Confirmar Estorno
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
