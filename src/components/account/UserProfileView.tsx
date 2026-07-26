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
  Save 
} from 'lucide-react';

export const UserProfileView: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { permissions } = usePermissions();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="space-y-8 pb-12 font-sans">
      
      {/* Profile Header */}
      <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-500/20 shadow-md bg-stone-100 flex items-center justify-center">
              {photoUrl ? (
                <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-stone-400" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-stone-900 text-amber-400 rounded-full cursor-pointer shadow-md hover:bg-stone-800 transition-all">
              <Camera size={14} />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
            </label>
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-black text-stone-900">{user?.name}</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                {user?.roleLabel || user?.role || 'Usuário'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">{user?.email}</p>
            <p className="text-[11px] text-stone-400 mt-0.5 font-mono">
              Cadastrado em {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'Hoje'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Personal Details Form */}
        <div className="lg:col-span-2 bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-sm font-bold text-stone-900 mb-6 pb-3 border-b border-stone-100">
            Informações Pessoais & Ateliê
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <User size={13} className="text-amber-600" /> Nome Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 text-xs focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Mail size={13} className="text-amber-600" /> Endereço de E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 text-xs focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Phone size={13} className="text-amber-600" /> Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(11) 99999-8888"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 text-xs focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Building2 size={13} className="text-amber-600" /> Nome da Empresa / Ateliê
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Ex: Ateliê Sagrado"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-stone-900 text-xs focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-md text-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save size={14} />
                <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Permissions Overview Box */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-600" />
            Permissões de Acesso (RBAC)
          </h3>
          <p className="text-xs text-stone-500 mb-4">
            Recursos liberados para a sua conta de acordo com a sua função e plano ativo:
          </p>

          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {Object.entries(permissions).map(([key, enabled]) => (
              <div 
                key={key} 
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                  enabled 
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-medium' 
                    : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
                }`}
              >
                <span className="font-mono text-[11px]">{key}</span>
                {enabled ? (
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                ) : (
                  <span className="text-[10px] uppercase font-bold text-stone-400">Restrito</span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
