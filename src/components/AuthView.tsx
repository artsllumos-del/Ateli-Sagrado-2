import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { toast } from './Toast';
import { KeyRound, User, Compass, ShieldAlert } from 'lucide-react';

export const AuthView: React.FC = () => {
 const { settings, login, recoverPassword } = useDb();
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
     toast.success("Acesso Autorizado", `Bem-vindo de volta ao sistema do ${settings.companyName || "Ateliê Sagrado"}`);
    } else {
     toast.error("Erro de Autenticação", "Usuário/E-mail ou senha inválidos, ou conta inativa.");
    }
   }
   setIsLoading(false);
  }, 600);
 };

 return (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden font-sans select-none">
   
   {/* Decorative visual backgrounds */}
   <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
   <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-slate-500/5 rounded-full blur-[120px] pointer-events-none"></div>

   <div className="w-full max-w-md bg-white border border-slate-100 shadow-xl shadow-slate-900/5 rounded-2xl p-8 sm:p-10 relative z-10 transition-all border-t-4 border-t-amber-500">
    
    {/* Neutral Brand Header */}
    <div className="text-center mb-8">
     <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/40 text-amber-600 mb-4 shadow-sm relative overflow-hidden">
      {settings.logo ? (
        settings.logo.startsWith('http') || settings.logo.startsWith('data:image') ? (
         <img 
          src={settings.logo} 
          alt="Logo" 
          className="w-12 h-12 object-contain rounded-lg" 
          referrerPolicy="no-referrer"
         />
        ) : (
         <span className="text-3xl">{settings.logo}</span>
        )
       ) : (
        <Compass size={28} className="text-amber-600 animate-spin-slow" />
       )}
     </div>
     <h1 className="text-3xl font-sans tracking-tight text-slate-900 font-bold">
      {settings.companyName || "Ateliê Sagrado"}
     </h1>
     {settings.slogan && (
      <span className="text-sm text-amber-600 font-medium block mt-1">
       {settings.slogan}
      </span>
     )}
     <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-2 font-mono">
      Sistema de Gestão Empresarial ERP
     </p>
     <div className="w-12 h-[2px] bg-amber-500/20 mx-auto mt-4 rounded-full"></div>
    </div>

    <form onSubmit={handleSubmit} className="space-y-5">
     {/* Username or Email Input */}
     <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5 font-mono">
       <User size={12} className="text-amber-500" /> Usuário ou E-mail
      </label>
      <div className="relative">
       <input
        type="text"
        value={usernameOrEmail}
        onChange={(e) => setUsernameOrEmail(e.target.value)}
        placeholder="Admin ou admin@atelie.com"
        required
        className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all text-sm font-medium"
       />
      </div>
     </div>

     {/* Password Input (Login only) */}
     {!isRecover && (
      <div>
       <div className="flex justify-between items-center mb-2">
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
        className="w-full px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all text-sm font-medium"
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
       "Entrar no Sistema"
      )}
     </button>
    </form>

    {/* Info Panel explaining Admin user */}
    <div className="mt-8 pt-6 border-t border-slate-100">
     {isRecover ? (
      <div className="text-center">
       <button
        onClick={() => setIsRecover(false)}
        className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 cursor-pointer"
       >
        Voltar ao Login
       </button>
      </div>
     ) : (
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
       <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
       <div>
        <p className="text-[11px] text-slate-700 font-bold uppercase tracking-wide">Informação de Segurança</p>
        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
         Utilize credenciais cadastradas na base de dados para acessar. Para administração inicial, use as credenciais padrão do Administrador (User: <strong>Admin</strong>, Senha: <strong>301310Lr</strong>).
        </p>
       </div>
      </div>
     )}
    </div>

   </div>
  </div>
 );
};
