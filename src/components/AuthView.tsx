import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { toast } from './Toast';
import { KeyRound, User, Compass, ShieldAlert, Sparkles, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const AuthView: React.FC = () => {
 const { settings, login, recoverPassword, tenants, users } = useDb();
 const [usernameOrEmail, setUsernameOrEmail] = useState('');
 const [password, setPassword] = useState('');
 const [isRecover, setIsRecover] = useState(false);
 const [isLoading, setIsLoading] = useState(false);

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  setTimeout(() => {
   if (isRecover) {
    const ok = recoverPassword(usernameOrEmail);
    if (ok) {
     toast.success("Recuperação de Acesso", `Instruções enviadas para ${usernameOrEmail}`);
     setIsRecover(false);
    } else {
     toast.error("Erro", "Insira um endereço de e-mail ou usuário válido.");
    }
   } else {
    const success = login(usernameOrEmail, password);
    if (success) {
     toast.success("Acesso Autorizado", `Redirecionando para o ambiente do seu ateliê...`);
    } else {
     toast.error("Erro de Autenticação", "Usuário/E-mail ou senha inválidos, ou conta inativa.");
    }
   }
   setIsLoading(false);
  }, 500);
 };

 const handleQuickLogin = (uname: string, pass: string) => {
  setUsernameOrEmail(uname);
  setPassword(pass);
  setIsLoading(true);
  setTimeout(() => {
   const success = login(uname, pass);
   if (success) {
    toast.success("Acesso Autorizado", `Login realizado com sucesso! Redirecionando para o seu ateliê.`);
   } else {
    toast.error("Erro", "Falha ao autenticar usuário de demonstração.");
   }
   setIsLoading(false);
  }, 400);
 };

 return (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6 relative overflow-hidden font-sans select-none">
   
   {/* Decorative visual backgrounds */}
   <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
   <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-slate-500/5 rounded-full blur-[120px] pointer-events-none"></div>

   <div className="w-full max-w-lg bg-white border border-slate-100 shadow-xl shadow-slate-900/5 rounded-2xl p-6 sm:p-10 relative z-10 transition-all border-t-4 border-t-amber-500">
    
    {/* Neutral Brand Header */}
    <div className="text-center mb-6">
     <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/40 text-amber-600 mb-3 shadow-sm relative overflow-hidden">
      {settings.logo ? (
        settings.logo.startsWith('http') || settings.logo.startsWith('data:image') ? (
         <img 
          src={settings.logo} 
          alt="Logo" 
          className="w-10 h-10 object-contain rounded-lg" 
          referrerPolicy="no-referrer"
         />
        ) : (
         <span className="text-2xl">{settings.logo}</span>
        )
       ) : (
        <Compass size={24} className="text-amber-600 animate-spin-slow" />
       )}
     </div>
     <h1 className="text-2xl sm:text-3xl font-sans tracking-tight text-slate-900 font-bold">
      Gestão de Ateliês
     </h1>
     <p className="text-xs text-amber-700 font-medium block mt-1">
      Cada ateliê conta com seu Administrador Geral e seus respectivos Operadores
     </p>
     <div className="w-12 h-[2px] bg-amber-500/20 mx-auto mt-3 rounded-full"></div>
    </div>

    <form onSubmit={handleSubmit} className="space-y-4">
     {/* Username or Email Input */}
     <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5 font-mono">
       <User size={12} className="text-amber-500" /> Usuário ou E-mail
      </label>
      <div className="relative">
       <input
        type="text"
        value={usernameOrEmail}
        onChange={(e) => setUsernameOrEmail(e.target.value)}
        placeholder="ex: Admin ou admin@atelie.com"
        required
        className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all text-sm font-medium"
       />
      </div>
     </div>

     {/* Password Input (Login only) */}
     {!isRecover && (
      <div>
       <div className="flex justify-between items-center mb-1.5">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 font-mono">
         <KeyRound size={12} className="text-amber-500" /> Senha Secreta
        </label>
        <button
         type="button"
         onClick={() => setIsRecover(true)}
         className="text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 hover:underline cursor-pointer font-mono"
        >
         Esqueceu?
        </button>
       </div>
       <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all text-sm font-medium"
       />
      </div>
     )}

     {/* Submit Button */}
     <button
      type="submit"
      disabled={isLoading}
      className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-amber-100 hover:text-white font-bold rounded-xl shadow-lg shadow-slate-900/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm tracking-wide mt-2"
     >
      {isLoading ? (
       <span className="w-5 h-5 border-2 border-amber-200 border-t-transparent rounded-full animate-spin"></span>
      ) : isRecover ? (
       "Recuperar Acesso"
      ) : (
       "Entrar no Meu Ateliê"
      )}
     </button>
    </form>

    {/* Quick Access by Ateliê */}
    {!isRecover && (
     <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
      <div className="flex items-center justify-between">
       <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
        <Sparkles size={11} className="text-amber-500" /> Acesso Rápido por Ateliê
       </span>
       <span className="text-[10px] text-slate-400">1 clique para entrar</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
       {/* Ateliê 1: Ateliê Sagrado */}
       <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
         <div className="w-2 h-2 rounded-full bg-amber-500" />
         <span>Ateliê Sagrado</span>
        </div>
        <div className="space-y-1">
         <button
          onClick={() => handleQuickLogin('Admin', '301310Lr')}
          className="w-full text-left px-2 py-1 rounded bg-white hover:bg-amber-100/50 border border-amber-200/50 text-[11px] font-medium text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
         >
          <span className="truncate">👑 <strong>Admin</strong> (Geral)</span>
          <ArrowRight size={10} className="text-slate-400" />
         </button>
         <button
          onClick={() => handleQuickLogin('Rosana', '123456')}
          className="w-full text-left px-2 py-1 rounded bg-white hover:bg-amber-100/50 border border-amber-200/50 text-[11px] font-medium text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
         >
          <span className="truncate">💼 <strong>Rosana</strong> (Vendas)</span>
          <ArrowRight size={10} className="text-slate-400" />
         </button>
         <button
          onClick={() => handleQuickLogin('Lucas', '123456')}
          className="w-full text-left px-2 py-1 rounded bg-white hover:bg-amber-100/50 border border-amber-200/50 text-[11px] font-medium text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
         >
          <span className="truncate">🔨 <strong>Lucas</strong> (Artesão)</span>
          <ArrowRight size={10} className="text-slate-400" />
         </button>
        </div>
       </div>

       {/* Ateliê 2: Studio Luz Divina */}
       <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
         <div className="w-2 h-2 rounded-full bg-emerald-500" />
         <span>Studio Luz Divina</span>
        </div>
        <div className="space-y-1">
         <button
          onClick={() => handleQuickLogin('AdminLuz', '301310Lr')}
          className="w-full text-left px-2 py-1 rounded bg-white hover:bg-emerald-100/50 border border-emerald-200/50 text-[11px] font-medium text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
         >
          <span className="truncate">👑 <strong>AdminLuz</strong> (Geral)</span>
          <ArrowRight size={10} className="text-slate-400" />
         </button>
         <button
          onClick={() => handleQuickLogin('CarlosLuz', '123456')}
          className="w-full text-left px-2 py-1 rounded bg-white hover:bg-emerald-100/50 border border-emerald-200/50 text-[11px] font-medium text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
         >
          <span className="truncate">💼 <strong>Carlos</strong> (Vendas)</span>
          <ArrowRight size={10} className="text-slate-400" />
         </button>
         <button
          onClick={() => handleQuickLogin('MarianaLuz', '123456')}
          className="w-full text-left px-2 py-1 rounded bg-white hover:bg-emerald-100/50 border border-emerald-200/50 text-[11px] font-medium text-slate-800 flex items-center justify-between transition-colors cursor-pointer"
         >
          <span className="truncate">🔨 <strong>Mariana</strong> (Artesã)</span>
          <ArrowRight size={10} className="text-slate-400" />
         </button>
        </div>
       </div>
      </div>
     </div>
    )}

    {isRecover && (
     <div className="mt-6 pt-4 border-t border-slate-100 text-center">
      <button
       onClick={() => setIsRecover(false)}
       className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 cursor-pointer"
      >
       Voltar ao Login
      </button>
     </div>
    )}

   </div>
  </div>
 );
};
