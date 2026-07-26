import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { toast } from '../Toast';
import { 
  KeyRound, 
  User, 
  Mail, 
  Building2, 
  Phone, 
  CheckCircle2, 
  Sparkles, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Compass,
  AlertCircle
} from 'lucide-react';
import { PlanId } from '../../domain/types/auth';

interface ModernAuthViewProps {
  onSuccess?: () => void;
}

export const ModernAuthView: React.FC<ModernAuthViewProps> = ({ onSuccess }) => {
  const { login, loginWithGoogle, register, recoverPassword, resetPassword, loading } = useAuth();
  const { availablePlans } = useSubscription();

  const [mode, setMode] = useState<'login' | 'register' | 'recover' | 'reset'>('login');

  // Form States
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPlanId, setRegPlanId] = useState<PlanId>('free_trial');
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Recover / Reset State
  const [recoverEmail, setRecoverEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername) {
      toast.error('Erro', 'Por favor, informe o e-mail ou usuário.');
      return;
    }
    const res = await login({ emailOrUsername, password, rememberMe });
    if (res.success) {
      toast.success('Acesso Autorizado', 'Bem-vindo de volta ao Ateliê Sagrado ERP!');
      if (onSuccess) onSuccess();
    } else {
      toast.error('Falha de Autenticação', res.error || 'Credenciais inválidas.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      toast.error('Erro', 'Preencha os campos obrigatórios (Nome, E-mail e Senha).');
      return;
    }
    if (!acceptTerms) {
      toast.error('Erro', 'Você precisa aceitar os termos para continuar.');
      return;
    }

    const res = await register({
      name: regName,
      email: regEmail,
      password: regPassword,
      companyName: regCompany,
      phone: regPhone,
      planId: regPlanId,
      acceptTerms: true
    });

    if (res.success) {
      toast.success('Conta Criada!', 'Sua conta foi criada e o seu plano está ativado.');
      if (onSuccess) onSuccess();
    } else {
      toast.error('Erro no Cadastro', res.error || 'Não foi possível cadastrar.');
    }
  };

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoverEmail) {
      toast.error('Erro', 'Informe o seu e-mail cadastrado.');
      return;
    }
    const res = await recoverPassword(recoverEmail);
    if (res.success) {
      toast.success('Código Enviado', res.message);
      setMode('reset');
    } else {
      toast.error('Atenção', res.message);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !newPassword) {
      toast.error('Erro', 'Informe o código de redefinição e a nova senha.');
      return;
    }
    const res = await resetPassword(resetCode, newPassword);
    if (res.success) {
      toast.success('Senha Redefinida', res.message);
      setMode('login');
      setPassword(newPassword);
    } else {
      toast.error('Erro na Redefinição', res.message);
    }
  };

  const handleGoogleClick = async () => {
    const res = await loginWithGoogle();
    if (res.success) {
      toast.success('Login com Google', 'Acesso realizado com sucesso!');
      if (onSuccess) onSuccess();
    } else {
      toast.error('Erro', res.error || 'Falha ao conectar via Google');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-stone-50 p-4 sm:p-6 my-auto relative overflow-y-auto font-sans select-none py-8 sm:py-12">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-stone-400/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl bg-white border border-stone-200/80 shadow-2xl shadow-stone-900/10 rounded-3xl p-6 sm:p-10 relative z-10 transition-all border-t-4 border-t-amber-600">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-600 mb-4 shadow-sm relative overflow-hidden">
            <Compass size={32} className="animate-spin-slow text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            Ateliê Sagrado ERP
          </h1>
          <p className="text-xs uppercase tracking-widest text-amber-600 font-bold mt-1">
            Gestão Inteligente de Ateliês & Produção
          </p>
          <div className="w-12 h-[2px] bg-amber-500/30 mx-auto mt-3 rounded-full" />
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex bg-stone-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'login' 
                ? 'bg-white text-stone-900 shadow-sm' 
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'register' 
                ? 'bg-white text-stone-900 shadow-sm' 
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Criar Conta (10d Grátis)
          </button>
        </div>

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-amber-600" /> E-mail ou Usuário
              </label>
              <input
                type="text"
                value={emailOrUsername}
                onChange={e => setEmailOrUsername(e.target.value)}
                placeholder="Ex: admin@atelie.com ou Admin"
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 focus:bg-white text-sm transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <KeyRound size={14} className="text-amber-600" /> Senha Secreta
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setRecoverEmail(emailOrUsername);
                    setMode('recover');
                  }}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 focus:bg-white text-sm transition-all"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                Lembrar deste dispositivo
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-amber-50 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-amber-200 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Quick Demo Credentials Info */}
            <div className="mt-4 p-3 bg-amber-50/80 rounded-xl border border-amber-200/60 flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Acesso Rápido Master:</span> Usuário: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">Admin</code> | Senha: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">301310Lr</code>
              </div>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <User size={13} className="text-amber-600" /> Nome Completo *
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Mail size={13} className="text-amber-600" /> E-mail Profissional *
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="seu@atelie.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Lock size={13} className="text-amber-600" /> Senha Secreta *
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Building2 size={13} className="text-amber-600" /> Nome do Ateliê / Empresa
                </label>
                <input
                  type="text"
                  value={regCompany}
                  onChange={e => setRegCompany(e.target.value)}
                  placeholder="Ex: Ateliê das Flores"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 text-sm"
                />
              </div>
            </div>

            {/* Plan selection box */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                <Sparkles size={13} className="text-amber-600" /> Escolha seu Plano Inicial
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availablePlans.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setRegPlanId(p.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                      regPlanId === p.id 
                        ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20' 
                        : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/80'
                    }`}
                  >
                    <div className="text-xs font-bold text-stone-900 flex items-center justify-between">
                      <span>{p.name}</span>
                      {regPlanId === p.id && <CheckCircle2 size={14} className="text-amber-600 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">
                      {p.priceMonthly === 0 ? 'Grátis (10 dias)' : `R$ ${p.priceMonthly}/mês`}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-600 pt-1">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={e => setAcceptTerms(e.target.checked)}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              Concordo com os Termos de Uso e Política de Privacidade.
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Criar Minha Conta Grátis'
              )}
            </button>
          </form>
        )}

        {/* RECOVER FORM */}
        {mode === 'recover' && (
          <form onSubmit={handleRecoverSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                <Mail size={14} className="text-amber-600" /> E-mail Cadastrado
              </label>
              <input
                type="email"
                value={recoverEmail}
                onChange={e => setRecoverEmail(e.target.value)}
                placeholder="seu@atelie.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-amber-50 font-bold rounded-xl shadow-lg transition-all cursor-pointer text-sm"
            >
              {loading ? 'Enviando...' : 'Enviar Código de Recuperação'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-bold text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                Voltar ao Login
              </button>
            </div>
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Código / Token de Redefinição
              </label>
              <input
                type="text"
                value={resetCode}
                onChange={e => setResetCode(e.target.value)}
                placeholder="Ex: RST_ABC123 ou 123456"
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 text-sm font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nova Senha Secreta
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer text-sm"
            >
              Redefinir Senha
            </button>
          </form>
        )}

        {/* GOOGLE DIRECT LOGIN BUTTON */}
        <div className="mt-6 pt-6 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-400 mb-3 font-medium">Ou conecte-se rapidamente com</p>
          <button
            type="button"
            onClick={handleGoogleClick}
            className="w-full py-3 px-4 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer text-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Entrar com Google
          </button>
        </div>

      </div>
    </div>
  );
};
