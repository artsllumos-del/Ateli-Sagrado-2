import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { toast } from '../Toast';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Camera, 
  ShieldCheck, 
  CheckCircle2, 
  Save,
  KeyRound,
  Smartphone,
  Laptop,
  Globe,
  Trash2,
  LogOut,
  Lock,
  UserCheck
} from 'lucide-react';

export const UserProfileView: React.FC = () => {
  const { 
    user, 
    updateProfile, 
    activeSessions, 
    revokeSession, 
    revokeAllOtherSessions, 
    changePassword 
  } = useAuth();
  const { permissions } = usePermissions();

  // Profile State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  // Security & Password State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  // Active sub-tab inside the profile page if user wants to switch or scroll
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'permissions'>('profile');

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name,
        email,
        phone,
        companyName,
        photoUrl
      });
      toast.success('Perfil Atualizado', 'Seus dados foram salvos com sucesso.');
    } catch (err) {
      toast.error('Erro', 'Não foi possível salvar as alterações do perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
    }
  };

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
    <div className="space-y-8 pb-12 font-sans select-none">
      
      {/* Profile & Security Main Header */}
      <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-500/20 shadow-md bg-stone-100 flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-stone-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-stone-900 text-amber-400 rounded-full cursor-pointer shadow-md hover:bg-stone-800 transition-all" title="Alterar foto">
                <Camera size={14} />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
              </label>
            </div>

            <div className="text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-black text-stone-900">{user?.name}</h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {user?.roleLabel || user?.role || 'Usuário'}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">{user?.email}</p>
              <p className="text-[11px] text-stone-400 mt-0.5 font-mono">
                Membro desde {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'Hoje'}
              </p>
            </div>
          </div>

          {/* Quick Sub-navigation tabs on the same page */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/60 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <UserCheck size={14} />
              <span>Dados Pessoais</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <ShieldCheck size={14} />
              <span>Segurança & Sessões</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('permissions')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'permissions'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Lock size={14} />
              <span>Permissões (RBAC)</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Page Content - Shows integrated sections */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <h3 className="text-base font-bold text-stone-900 mb-6 pb-3 border-b border-stone-100 flex items-center gap-2">
            <User size={18} className="text-amber-600" />
            Informações Pessoais & do Ateliê
          </h3>

          <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                  <User size={13} className="text-amber-600" /> Nome Completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 text-xs focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                  <Mail size={13} className="text-amber-600" /> Endereço de E-mail *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 text-xs focus:bg-white font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                  <Phone size={13} className="text-amber-600" /> Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(11) 99999-8888"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 text-xs focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                  <Building2 size={13} className="text-amber-600" /> Nome da Empresa / Ateliê
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Ex: Ateliê Sagrado"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 text-xs focus:bg-white font-medium"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-md text-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save size={15} />
                <span>{isSaving ? 'Salvando...' : 'Salvar Dados do Perfil'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Active Sessions Card */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Laptop size={16} className="text-amber-600" />
                    Sessões e Dispositivos Conectados
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Aparelhos com login ativo e autorizado no sistema.
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
                        title="Encerrar esta sessão"
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
            <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-xs">
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
            <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-xs flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-amber-600" />
                  Autenticação em Duas Etapas (2FA)
                </h4>
                <p className="text-[11px] text-stone-500 mt-1">
                  Exija confirmação via dispositivo seguro ao acessar.
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
      )}

      {activeTab === 'permissions' && (
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
          <h3 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-600" />
            Matriz de Permissões de Acesso (RBAC)
          </h3>
          <p className="text-xs text-stone-500 mb-6">
            Módulos liberados para o seu operador no Ateliê Sagrado ERP:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(permissions).map(([key, enabled]) => (
              <div 
                key={key} 
                className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                  enabled 
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-medium' 
                    : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
                }`}
              >
                <span className="font-mono text-[11px] font-bold">{key}</span>
                {enabled ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <span className="text-[10px] uppercase font-bold text-stone-400">Restrito</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
