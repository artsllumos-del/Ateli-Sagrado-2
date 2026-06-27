import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { 
 Building, DollarSign, Globe, Bell, Palette, Sparkles, CheckCircle2, 
 RefreshCw, Shield, HelpCircle
} from 'lucide-react';
import { toast } from './Toast';

export const SettingsView: React.FC = () => {
 const { settings, updateSettings } = useDb();

 // Company Form states
 const [companyName, setCompanyName] = useState(settings.companyName);
 const [cnpj, setCnpj] = useState(settings.cnpj || '12.345.678/0001-90');
 const [phone, setPhone] = useState(settings.phone || '(11) 98765-4321');
 const [address, setAddress] = useState(settings.address || 'Rua das Rosas, 108 - São Paulo - SP');

 // Financial Pricing Engine constants
 const [laborHourlyRate, setLaborHourlyRate] = useState(settings.laborHourlyRate);
 const [indirectCosts, setIndirectCosts] = useState(settings.indirectCosts);
 const [defaultMarginPercent, setDefaultMarginPercent] = useState(settings.defaultMarginPercent);

 // System states
 const [theme, setTheme] = useState(settings.theme);
 const [language, setLanguage] = useState(settings.language);
 const [notifications, setNotifications] = useState(settings.notifications);

 const handleSaveCompany = (e: React.FormEvent) => {
 e.preventDefault();
 updateSettings({
 companyName,
 cnpj,
 phone,
 address
 });
 toast.success("Salvo!", "Informações institucionais da empresa atualizadas.");
 };

 const handleSaveFinancial = (e: React.FormEvent) => {
 e.preventDefault();
 updateSettings({
 laborHourlyRate,
 indirectCosts,
 defaultMarginPercent
 });
 toast.success("Parâmetros Salvos!", "As taxas padrão do motor de precificação foram redefinidas.");
 };

 const handleSaveSystem = (e: React.FormEvent) => {
 e.preventDefault();
 updateSettings({
 theme: 'light',
 language,
 notifications
 });
 
 // Always keep it light
 document.documentElement.classList.remove('dark');

 toast.success("Preferências Gravadas", "Configurações de interface e idioma salvas.");
 };

 return (
 <div className="space-y-6 max-w-4xl animate-slide-in-up">
 
 {/* Grid of config sections */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 
 {/* Company Settings */}
 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm space-y-4">
 <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
 <Building className="text-amber-500" size={18} />
 <h3 className="font-bold text-sm text-slate-900 ">Dados Institucionais / Ateliê</h3>
 </div>

 <form onSubmit={handleSaveCompany} className="space-y-3 text-xs font-semibold">
 <div>
 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Nome Fantasia do Ateliê</label>
 <input
 type="text"
 value={companyName}
 onChange={(e) => setCompanyName(e.target.value)}
 className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">CNPJ (MEI ou Empresa)</label>
 <input
 type="text"
 value={cnpj}
 onChange={(e) => setCnpj(e.target.value)}
 className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">WhatsApp / Telefone de Contato</label>
 <input
 type="text"
 value={phone}
 onChange={(e) => setPhone(e.target.value)}
 className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <div>
 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Endereço Físico</label>
 <input
 type="text"
 value={address}
 onChange={(e) => setAddress(e.target.value)}
 className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <button
 type="submit"
 className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer transition-all"
 >
 Salvar Dados do Ateliê
 </button>
 </form>
 </div>

 {/* Pricing Engine Config */}
 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm space-y-4">
 <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
 <DollarSign className="text-amber-500" size={18} />
 <h3 className="font-bold text-sm text-slate-900 ">Custos Padrão e Motor Financeiro</h3>
 </div>

 <form onSubmit={handleSaveFinancial} className="space-y-3 text-xs font-semibold">
 <div>
 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Valor da Hora do Artesão (R$)</label>
 <input
 type="number"
 value={laborHourlyRate}
 onChange={(e) => setLaborHourlyRate(Number(e.target.value))}
 className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-850 font-mono"
 />
 <span className="text-[10px] text-slate-450 mt-1 block font-normal">Base do cálculo operacional por peça</span>
 </div>

 <div>
 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Custos Indiretos Padrão (R$)</label>
 <input
 type="number"
 value={indirectCosts}
 onChange={(e) => setIndirectCosts(Number(e.target.value))}
 className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-850 font-mono"
 />
 </div>

 <div>
 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Margem de Lucro Sugerida (%)</label>
 <input
 type="number"
 value={defaultMarginPercent}
 onChange={(e) => setDefaultMarginPercent(Number(e.target.value))}
 className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-850"
 />
 </div>

 <button
 type="submit"
 className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer transition-all"
 >
 Salvar Parâmetros
 </button>
 </form>
 </div>

 {/* System Settings */}
 <div className="bg-white border border-slate-200/85 p-5 rounded-2xl shadow-sm space-y-4 md:col-span-2">
 <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
 <Palette className="text-amber-500" size={18} />
 <h3 className="font-bold text-sm text-slate-900 ">Interface & Preferências de Sistema</h3>
 </div>

 <form onSubmit={handleSaveSystem} className="space-y-4 text-xs font-semibold">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 
 <div>
 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Tom Visual do Ateliê</label>
 <select
 value="light"
 disabled
 className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold opacity-90 cursor-not-allowed"
 >
 <option value="light">Marfim Clássico & Ouro Real</option>
 </select>
 <span className="text-[10px] text-amber-600 font-medium mt-1.5 block">
 <Sparkles size={10} className="text-amber-500 inline mr-1 animate-pulse" /> Estilo claro luxuoso ativo por padrão!
 </span>
 </div>

 <div>
 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Idioma / Região</label>
 <select
 value={language}
 onChange={(e) => setLanguage(e.target.value)}
 className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-850 font-bold"
 >
 <option value="pt-BR">Português (Brasil)</option>
 <option value="en-US">English (US)</option>
 </select>
 </div>

 <div>
 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Notificações e Alertas</label>
 <select
 value={notifications ? 'yes' : 'no'}
 onChange={(e) => setNotifications(e.target.value === 'yes')}
 className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-850 font-bold"
 >
 <option value="yes">Habilitar Alertas Sonoros e Toasts</option>
 <option value="no">Desativar Alertas</option>
 </select>
 </div>

 </div>

 <div className="pt-2 border-t border-slate-100 flex justify-end">
 <button
 type="submit"
 className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer transition-all"
 >
 Gravar Preferências
 </button>
 </div>
 </form>
 </div>

 </div>

 </div>
 );
};
