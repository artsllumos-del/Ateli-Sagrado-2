import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { toast } from './Toast';
import { KeyRound, Mail, Sparkles, Compass } from 'lucide-react';

export const AuthView: React.FC = () => {
 const { login, recoverPassword } = useDb();
 const [email, setEmail] = useState('artsllumos@gmail.com');
 const [password, setPassword] = useState('123456');
 const [isRecover, setIsRecover] = useState(false);
 const [isLoading, setIsLoading] = useState(false);

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 setIsLoading(true);

 setTimeout(() => {
 if (isRecover) {
 const ok = recoverPassword(email);
 if (ok) {
 toast.success("E-mail de recuperação", `Instruções enviadas para ${email}`);
 setIsRecover(false);
 } else {
 toast.error("Erro", "Insira um endereço de e-mail válido.");
 }
 } else {
 const success = login(email, password || "123456");
 if (success) {
 toast.success("Acesso Permitido", `Bem-vindo de volta ao Ateliê Sagrado ERP`);
 } else {
 toast.error("Erro de Autenticação", "Credenciais incorretas.");
 }
 }
 setIsLoading(false);
 }, 800);
 };

 return (
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#faf8f5] via-[#f7f2eb] to-[#f2eae1] p-6 relative overflow-hidden font-sans">
 
 {/* Decorative luxury radial glow blurs */}
 <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-amber-200/20 rounded-full blur-[120px] pointer-events-none"></div>
 <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-rose-100/30 rounded-full blur-[120px] pointer-events-none"></div>
 <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-100/20 rounded-full blur-[100px] pointer-events-none"></div>

 {/* Floating Sparkles and Icons */}
 <div className="absolute top-10 left-10 text-amber-500/20 animate-pulse">
 <Sparkles size={32} strokeWidth={1} />
 </div>
 <div className="absolute bottom-12 right-12 text-slate-400/20">
 <Compass size={40} strokeWidth={1} />
 </div>

 <div className="w-full max-w-md bg-white/80 backdrop-blur-md border border-amber-100/60 shadow-xl shadow-amber-900/5 rounded-3xl p-8 sm:p-10 relative z-10 transition-all border-t-4 border-t-amber-500/30">
 
 {/* Luxury Brand Header */}
 <div className="text-center mb-8">
 <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-50 via-amber-100/50 to-amber-50 border border-amber-200/50 text-slate-700 mb-5 shadow-sm">
 <span className="text-4xl filter drop-shadow-sm">📿</span>
 </div>
 <h1 className="text-4xl font-serif tracking-wide text-slate-900 font-medium">
 Ateliê Sagrado
 </h1>
 <span className="font-script text-4xl text-amber-600 block -mt-1 mb-2 select-none">
 Joias e Devoção
 </span>
 <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1 font-sans">
 Sistemas de Gestão & Joias Religiosas
 </p>
 <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-amber-300 to-transparent mx-auto mt-4"></div>
 </div>

 <form onSubmit={handleSubmit} className="space-y-5">
 {/* Email Input */}
 <div>
 <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
 <Mail size={12} className="text-amber-500/70" /> E-mail de Acesso
 </label>
 <div className="relative">
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="seu-email@atelie.com"
 required
 className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all text-sm font-medium"
 />
 <span className="absolute left-4 top-3.5 text-slate-400">@</span>
 </div>
 </div>

 {/* Password Input (Login only) */}
 {!isRecover && (
 <div>
 <div className="flex justify-between items-center mb-2">
 <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
 <KeyRound size={12} className="text-amber-500/70" /> Senha Secreta
 </label>
 <button
 type="button"
 onClick={() => setIsRecover(true)}
 className="text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
 >
 Esqueceu?
 </button>
 </div>
 <input
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="Insira qualquer senha para entrar"
 className="w-full px-4 py-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all text-sm font-medium"
 />
 <span className="text-[10px] text-amber-600/90 font-medium mt-1.5 block">
 ✨ Senha preenchida por padrão para o seu conforto (<strong>123456</strong>).
 </span>
 </div>
 )}

 {/* Submit Button */}
 <button
 type="submit"
 disabled={isLoading}
 className="w-full py-3.5 px-4 bg-gradient-to-r from-slate-950 to-slate-800 hover:from-slate-900 hover:to-slate-750 text-amber-100 hover:text-white font-bold rounded-2xl shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-slate-900/15 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm tracking-wide"
 >
 {isLoading ? (
 <span className="w-5 h-5 border-2 border-amber-200 border-t-transparent rounded-full animate-spin"></span>
 ) : isRecover ? (
 "Recuperar Acesso"
 ) : (
 "Entrar no Ateliê"
 )}
 </button>
 </form>

 {/* Footer Support Info */}
 <div className="mt-8 pt-6 border-t border-slate-100 text-center">
 {isRecover ? (
 <button
 onClick={() => setIsRecover(false)}
 className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 cursor-pointer"
 >
 Voltar ao Login
 </button>
 ) : (
 <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50">
 <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Acesso Demonstrativo Liberado</p>
 <div className="mt-1.5 flex flex-col items-center justify-center gap-1">
 <code className="text-amber-700 bg-amber-100/40 px-3 py-1 rounded-full text-xs font-bold font-mono">
 artsllumos@gmail.com
 </code>
 <p className="text-[10px] text-slate-450 mt-1">
 Pressione o botão de login para entrar imediatamente.
 </p>
 </div>
 </div>
 )}
 </div>

 </div>
 </div>
 );
};
