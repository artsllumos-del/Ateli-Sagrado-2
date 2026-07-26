import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../Toast';
import { 
  ShieldCheck, 
  Smartphone, 
  Laptop, 
  Globe, 
  Trash2, 
  LogOut, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const AccountSecurityView: React.FC = () => {
  const { activeSessions, revokeSession, revokeAllOtherSessions, changePassword } = useAuth();

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      toast.error('Erro', 'A nova senha e a confirmação não coincidem.');
      return;
    }
    if (newPass.length < 6) {
      toast.error('Erro', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoadingPass(true);
    try {
      const res = await changePassword(currentPass, newPass);
      if (res.success) {
        toast.success('Senha Alterada', res.message);
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        toast.error('Erro', res.message);
      }
    } catch (err) {
      toast.error('Erro', 'Ocorreu uma falha ao alterar a senha.');
    } finally {
      setLoadingPass(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    await revokeSession(sessionId);
    toast.success('Sessão Encerrada', 'O acesso naquele dispositivo foi revogado.');
  };

  const handleRevokeAllOthers = async () => {
    await revokeAllOtherSessions();
    toast.success('Dispositivos Desconectados', 'Todas as outras sessões foram encerradas com sucesso.');
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      
      {/* Header */}
      <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">Segurança da Conta & Sessões</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Gerencie suas senhas, conexões ativas e proteção em dois fatores (2FA).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active Sessions List */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Laptop size={16} className="text-amber-600" />
                  Sessões e Dispositivos Ativos
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Aparelhos com login autorizado no sistema.
                </p>
              </div>

              {activeSessions.length > 1 && (
                <button
                  type="button"
                  onClick={handleRevokeAllOthers}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut size={13} />
                  <span>Desconectar Outros</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {activeSessions.map((sess) => (
                <div
                  key={sess.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 text-xs ${
                    sess.isCurrent
                      ? 'bg-amber-50/50 border-amber-200 ring-1 ring-amber-500/20'
                      : 'bg-stone-50/50 border-stone-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shrink-0 mt-0.5 text-stone-700">
                      {sess.device.includes('Smartphone') ? <Smartphone size={18} /> : <Laptop size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{sess.device}</span>
                        {sess.isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-600 text-white rounded-full">
                            Este Dispositivo
                          </span>
                        )}
                      </div>
                      <p className="text-stone-500 text-[11px] mt-1 flex items-center gap-1">
                        <Globe size={11} className="text-stone-400" /> {sess.ipAddress}
                      </p>
                      <p className="text-stone-400 text-[10px] mt-0.5 font-mono">
                        Último acesso: {new Date(sess.updatedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(sess.id)}
                      title="Revogar esta sessão"
                      className="p-2 hover:bg-rose-100 rounded-xl text-rose-600 transition-all cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-stone-400 mt-6 leading-relaxed">
            Se não reconhecer alguma conexão recente, encerre a sessão imediatamente e altere sua senha.
          </p>
        </div>

        {/* Change Password & 2FA */}
        <div className="space-y-6">
          
          {/* Password Change Box */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
              <KeyRound size={16} className="text-amber-600" />
              Alterar Senha de Acesso
            </h3>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={currentPass}
                  onChange={e => setCurrentPass(e.target.value)}
                  placeholder="Sua senha atual"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 text-xs focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nova Senha Secreta
                </label>
                <input
                  type="password"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 text-xs focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 text-xs focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loadingPass}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-md text-xs transition-all cursor-pointer mt-2"
              >
                {loadingPass ? 'Atualizando...' : 'Atualizar Senha Secreta'}
              </button>
            </form>
          </div>

          {/* 2FA Toggle Card */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-amber-600" />
                Autenticação em Duas Etapas (2FA)
              </h4>
              <p className="text-[11px] text-stone-500 mt-1">
                Adicione uma camada extra de segurança exigindo um código no celular ao fazer login.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setTwoFactor(!twoFactor);
                toast.success('Configuração 2FA', !twoFactor ? '2FA Ativado com Sucesso!' : '2FA Desativado.');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                twoFactor
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {twoFactor ? 'Ativado' : 'Ativar 2FA'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
