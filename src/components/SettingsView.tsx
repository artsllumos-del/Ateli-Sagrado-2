import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { AppUser, SystemSettings } from '../types/erp';
import { 
  Building, DollarSign, FileText, Sliders, User, Shield, 
  Plus, Edit3, Trash2, Key, Check, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { toast } from './Toast';
import { UsersPermissionsView } from './UsersPermissionsView';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, user, users, addUser, updateUser, deleteUser, resetSystem } = useDb();

  const isAdminRole = (role?: string) => {
    if (!role) return false;
    const r = role.toLowerCase();
    return r.includes('admin') || r.includes('gerente') || r === 'administrador';
  };

  // Active tab state: 'atelier' | 'financial' | 'documents' | 'system' | 'profile' | 'users'
  const [activeTab, setActiveTab] = useState<'atelier' | 'financial' | 'documents' | 'system' | 'profile' | 'users'>('atelier');

  // --- 1. ATELIER STATE ---
  const [companyName, setCompanyName] = useState(settings.companyName || '');
  const [razaoSocial, setRazaoSocial] = useState(settings.razaoSocial || '');
  const [cnpj, setCnpj] = useState(settings.cnpj || '');
  const [inscricaoEstadual, setInscricaoEstadual] = useState(settings.inscricaoEstadual || '');
  const [address, setAddress] = useState(settings.address || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || '');
  const [email, setEmail] = useState(settings.email || '');
  const [website, setWebsite] = useState(settings.website || '');
  const [socialMedia, setSocialMedia] = useState(settings.socialMedia || '');
  const [logo, setLogo] = useState(settings.logo || '');
  const [favicon, setFavicon] = useState(settings.favicon || '');
  const [slogan, setSlogan] = useState(settings.slogan || 'Artesanato com Amor');
  const [phrases, setPhrases] = useState(settings.phrases || 'Artesanato com Amor');
  const [nomeFantasia, setNomeFantasia] = useState(settings.nomeFantasia || '');
  const [institutionalPhoto, setInstitutionalPhoto] = useState(settings.institutionalPhoto || '');
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#D4AF37');

  // --- 2. FINANCIAL MOTOR STATE ---
  const [laborHourlyRate, setLaborHourlyRate] = useState(settings.laborHourlyRate || 0);
  const [indirectCosts, setIndirectCosts] = useState(settings.indirectCosts || 0);
  const [defaultMarginPercent, setDefaultMarginPercent] = useState(settings.defaultMarginPercent || 0);
  const [minMarginPercent, setMinMarginPercent] = useState(settings.minMarginPercent || 0);
  const [idealMarginPercent, setIdealMarginPercent] = useState(settings.idealMarginPercent || 0);
  const [taxPercent, setTaxPercent] = useState(settings.taxPercent || 0);
  const [commissionPercent, setCommissionPercent] = useState(settings.commissionPercent || 0);
  const [defaultDiscountPercent, setDefaultDiscountPercent] = useState(settings.defaultDiscountPercent || 0);

  // --- 3. DOCUMENTS STATE ---
  const [docLogo, setDocLogo] = useState(settings.docLogo || '');
  const [docHeader, setDocHeader] = useState(settings.docHeader || '');
  const [docFooter, setDocFooter] = useState(settings.docFooter || '');
  const [docFinalMessage, setDocFinalMessage] = useState(settings.docFinalMessage || '');
  const [docSignature, setDocSignature] = useState(settings.docSignature || '');
  const [docNotes, setDocNotes] = useState(settings.docNotes || '');

  // --- 4. SYSTEM OPTIONS STATE ---
  const [language, setLanguage] = useState(settings.language || 'pt-BR');
  const [currencyFormat, setCurrencyFormat] = useState(settings.currencyFormat || 'BRL');
  const [dateFormat, setDateFormat] = useState(settings.dateFormat || 'DD/MM/YYYY');
  const [autoNumberingPattern, setAutoNumberingPattern] = useState(settings.autoNumberingPattern || 'PED-YYYY-XXXX');
  const [backupFrequency, setBackupFrequency] = useState(settings.backupFrequency || 'weekly');
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled !== false);

  // --- 5. CURRENT USER PROFILE STATE ---
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.photoUrl || '');
  const [profilePassword, setProfilePassword] = useState(user?.password || '');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
      setProfilePhoto(user.photoUrl || '');
      setProfilePassword(user.password || '');
    }
  }, [user]);

  // --- 6. ADMIN USER MANAGEMENT FORM STATE ---
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [uUsername, setUUsername] = useState('');
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [uRole, setURole] = useState<'Administrador' | 'Vendedor' | 'Artesão' | 'Gerente'>('Vendedor');
  const [uIsActive, setUIsActive] = useState(true);
  const [uPhoto, setUPhoto] = useState('');
  // user permissions checkboxes
  const [perms, setPerms] = useState({
    dashboard: true,
    inventory: true,
    purchases: true,
    products: true,
    pricing: true,
    clients: true,
    quotes: true,
    orders: true,
    production: true,
    financial: true,
    settings: false,
  });

  const handleSaveAtelier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !nomeFantasia || !logo || !favicon || !address || !phone) {
      toast.error("Configuração Obrigatória", "Por favor, preencha os campos obrigatórios: Nome da Empresa, Nome Fantasia, Logo, Favicon, Endereço e Telefone.");
      return;
    }
    updateSettings({
      companyName,
      nomeFantasia,
      razaoSocial,
      cnpj,
      inscricaoEstadual,
      address,
      phone,
      whatsapp,
      email,
      website,
      socialMedia,
      logo,
      favicon,
      institutionalPhoto,
      slogan,
      phrases,
      primaryColor,
      firstSetup: false
    });
    toast.success("Ateliê Configurado!", "Seus dados foram sincronizados globalmente e a navegação foi liberada.");
  };

  const handleSaveFinancial = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      laborHourlyRate,
      indirectCosts,
      defaultMarginPercent,
      minMarginPercent,
      idealMarginPercent,
      taxPercent,
      commissionPercent,
      defaultDiscountPercent
    });
    toast.success("Parâmetros Salvos!", "As regras do motor financeiro foram consolidadas com sucesso.");
  };

  const handleSaveDocuments = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      docLogo,
      docHeader,
      docFooter,
      docFinalMessage,
      docSignature,
      docNotes
    });
    toast.success("Cabeçalhos Configurados!", "As variáveis dos documentos fiscais e recibos foram salvas.");
  };

  const handleSaveSystem = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      language,
      currencyFormat,
      dateFormat,
      autoNumberingPattern,
      backupFrequency,
      notificationsEnabled
    });
    toast.success("Interface Gravada!", "Configurações de layout, numeração de faturas e backup persistidas.");
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    updateUser(user.id, {
      name: profileName,
      email: profileEmail,
      phone: profilePhone,
      photoUrl: profilePhoto,
      password: profilePassword
    });
    toast.success("Perfil Atualizado!", "Suas informações de operador foram salvas.");
  };

  // --- USER CRUD OPERATIONS ---
  const handleOpenNewUser = () => {
    setEditingUser(null);
    setUUsername('');
    setUName('');
    setUEmail('');
    setUPassword('');
    setURole('Vendedor');
    setUIsActive(true);
    setUPhoto('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop');
    setPerms({
      dashboard: true,
      inventory: true,
      purchases: true,
      products: true,
      pricing: true,
      clients: true,
      quotes: true,
      orders: true,
      production: true,
      financial: false,
      settings: false,
    });
    setShowUserForm(true);
  };

  const handleOpenEditUser = (u: AppUser) => {
    setEditingUser(u);
    setUUsername(u.username);
    setUName(u.name);
    setUEmail(u.email);
    setUPassword(u.password);
    setURole(u.role as any);
    setUIsActive(u.isActive);
    setUPhoto(u.photoUrl || '');
    setPerms({
      dashboard: u.permissions?.dashboard !== false,
      inventory: u.permissions?.inventory !== false,
      purchases: u.permissions?.purchases !== false,
      products: u.permissions?.products !== false,
      pricing: u.permissions?.pricing !== false,
      clients: u.permissions?.clients !== false,
      quotes: u.permissions?.quotes !== false,
      orders: u.permissions?.orders !== false,
      production: u.permissions?.production !== false,
      financial: u.permissions?.financial !== false,
      settings: u.permissions?.settings !== false,
    });
    setShowUserForm(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uUsername || !uName || !uEmail || !uPassword) {
      toast.error("Validação", "Preencha todos os campos obrigatórios do usuário.");
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        username: uUsername,
        name: uName,
        email: uEmail,
        password: uPassword,
        role: uRole,
        isActive: uIsActive,
        photoUrl: uPhoto,
        permissions: perms
      });
      toast.success("Usuário Atualizado!", `Os acessos de ${uName} foram redefinidos.`);
    } else {
      addUser({
        username: uUsername,
        name: uName,
        email: uEmail,
        password: uPassword,
        role: uRole,
        isActive: uIsActive,
        photoUrl: uPhoto,
        permissions: perms
      });
      toast.success("Usuário Criado!", `${uName} agora possui credenciais ativas.`);
    }
    setShowUserForm(false);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (id === 'user_admin') {
      toast.error("Acesso Negado", "Não é permitido excluir o usuário Administrador Master do sistema.");
      return;
    }
    deleteUser(id);
    toast.warning("Usuário Removido", `${name} foi descadastrado.`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 select-none font-sans max-w-5xl mx-auto animate-slide-in-up">
      {/* Sidebar Navigation Tabs */}
      <div className="w-full md:w-64 bg-white border border-slate-100 rounded-2xl p-4 space-y-1 shadow-sm shrink-0 h-fit">
        <button
          onClick={() => { setActiveTab('atelier'); setShowUserForm(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
            activeTab === 'atelier'
              ? 'bg-amber-500/10 text-amber-700'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Building size={16} /> Dados do Ateliê
        </button>

        <button
          onClick={() => { setActiveTab('financial'); setShowUserForm(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
            activeTab === 'financial'
              ? 'bg-amber-500/10 text-amber-700'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <DollarSign size={16} /> Motor Financeiro
        </button>

        <button
          onClick={() => { setActiveTab('documents'); setShowUserForm(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
            activeTab === 'documents'
              ? 'bg-amber-500/10 text-amber-700'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <FileText size={16} /> Documentos Emitidos
        </button>

        <button
          onClick={() => { setActiveTab('system'); setShowUserForm(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
            activeTab === 'system'
              ? 'bg-amber-500/10 text-amber-700'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Sliders size={16} /> Interface & Sistema
        </button>

        <button
          onClick={() => { setActiveTab('profile'); setShowUserForm(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
            activeTab === 'profile'
              ? 'bg-amber-500/10 text-amber-700'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <User size={16} /> Meu Perfil
        </button>

        {isAdminRole(user?.role) && (
          <button
            onClick={() => { setActiveTab('users'); setShowUserForm(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === 'users'
                ? 'bg-amber-500/10 text-amber-700'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Shield size={16} /> Usuários & Permissões
          </button>
        )}
      </div>

      {/* Settings Tab Work Area Content */}
      <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm min-w-0">
        
        {/* TAB 1: DADOS INSTITUCIONAIS DO ATELIÊ */}
        {activeTab === 'atelier' && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900">Configurações de Identidade do Ateliê</h3>
              <p className="text-[11px] text-slate-500">Substitui as variáveis globais de cabeçalho, relatórios e recibos do sistema.</p>
            </div>

            <form onSubmit={handleSaveAtelier} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Nome da Empresa (Razão Social) *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                    placeholder="Ex: Ateliê Sagrado Ltda"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Nome Fantasia do Ateliê *</label>
                  <input
                    type="text"
                    required
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                    placeholder="Ex: Ateliê Sagrado"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">CNPJ do Ateliê</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                    placeholder="Ex: 00.000.000/0001-00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Inscrição Estadual (IE)</label>
                  <input
                    type="text"
                    value={inscricaoEstadual}
                    onChange={(e) => setInscricaoEstadual(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                    placeholder="Isento"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Endereço Comercial *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Telefone Principal *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">WhatsApp Comercial</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">E-mail para Orçamentos</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                    placeholder="exemplo@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Website do Ateliê</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                    placeholder="https://www.ateliersagrado.com"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Logotipo (Emoji ou Link URL da Imagem) *</label>
                  <input
                    type="text"
                    required
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none text-center text-lg"
                    placeholder="Ex: 📿 ou https://link.com/logo.png"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Favicon (Emoji ou Link URL do Favicon) *</label>
                  <input
                    type="text"
                    required
                    value={favicon}
                    onChange={(e) => setFavicon(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none text-center text-lg"
                    placeholder="Ex: 📿"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Foto Institucional (Link URL da Imagem)</label>
                  <input
                    type="text"
                    value={institutionalPhoto}
                    onChange={(e) => setInstitutionalPhoto(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Cor Principal (Identidade Visual) *</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      required
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      required
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-mono text-center"
                      placeholder="#D4AF37"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Slogan / Frase Padrão (Ex: Artesanato com Amor)</label>
                  <input
                    type="text"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Frases Institucionais Editáveis (Pé de Impressão)</label>
                  <input
                    type="text"
                    value={phrases}
                    onChange={(e) => setPhrases(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none italic"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Salvar Dados do Ateliê
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: PARÂMETROS DO MOTOR FINANCEIRO */}
        {activeTab === 'financial' && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900">Motor de Precificação & Finanças</h3>
              <p className="text-[11px] text-slate-500">Parâmetros centrais para cálculo de custos operacionais, impostos e rentabilidade ideal.</p>
            </div>

            <form onSubmit={handleSaveFinancial} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Valor da Hora do Artesão (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={laborHourlyRate}
                    onChange={(e) => setLaborHourlyRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-850"
                  />
                  <span className="text-[10px] text-slate-400 font-normal mt-1 block">Base para o cálculo de mão de obra direta.</span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Custos Indiretos Fixos Padrão (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={indirectCosts}
                    onChange={(e) => setIndirectCosts(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-850"
                  />
                  <span className="text-[10px] text-slate-400 font-normal mt-1 block">Apoio a despesas com energia, cola, embalagens secundárias.</span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Margem de Lucro Padrão (%)</label>
                  <input
                    type="number"
                    value={defaultMarginPercent}
                    onChange={(e) => setDefaultMarginPercent(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Margem Mínima Aceitável (%)</label>
                  <input
                    type="number"
                    value={minMarginPercent}
                    onChange={(e) => setMinMarginPercent(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Margem Ideal Almejada (%)</label>
                  <input
                    type="number"
                    value={idealMarginPercent}
                    onChange={(e) => setIdealMarginPercent(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Percentual de Impostos Médio (%)</label>
                  <input
                    type="number"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Comissão Comercial de Vendedores (%)</label>
                  <input
                    type="number"
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Desconto Padrão Autorizado (%)</label>
                  <input
                    type="number"
                    value={defaultDiscountPercent}
                    onChange={(e) => setDefaultDiscountPercent(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Salvar Margens e Custos
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: DOCUMENTOS EMITIDOS */}
        {activeTab === 'documents' && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900">Customização de Documentos & Recibos</h3>
              <p className="text-[11px] text-slate-500">Configure o cabeçalho e rodapé exibidos em orçamentos, termos de garantia e PDFs gerados para clientes.</p>
            </div>

            <form onSubmit={handleSaveDocuments} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Logotipo Opcional do Documento (Emoji ou URL)</label>
                  <input
                    type="text"
                    value={docLogo}
                    onChange={(e) => setDocLogo(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Título do Cabeçalho Comercial</label>
                  <input
                    type="text"
                    value={docHeader}
                    onChange={(e) => setDocHeader(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Mensagem Final de Encerramento (Ex: bênçãos para o seu lar)</label>
                  <input
                    type="text"
                    value={docFinalMessage}
                    onChange={(e) => setDocFinalMessage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Assinatura Padrão de Encerramento</label>
                  <input
                    type="text"
                    value={docSignature}
                    onChange={(e) => setDocSignature(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Garantia / Notas e Termos</label>
                  <textarea
                    rows={2}
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-sans font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Rodapé Padrão de Agradecimento</label>
                  <input
                    type="text"
                    value={docFooter}
                    onChange={(e) => setDocFooter(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Gravar Textos e Cláusulas
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: INTERFACE E SISTEMA */}
        {activeTab === 'system' && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900">Configurações Gerais de Sistema</h3>
              <p className="text-[11px] text-slate-500">Controles de moeda, alertas automáticos, idioma e rotinas de backups.</p>
            </div>

            <form onSubmit={handleSaveSystem} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Padrão Monetário / Moeda</label>
                  <select
                    value={currencyFormat}
                    onChange={(e) => setCurrencyFormat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="BRL">Real Brasileiro (R$)</option>
                    <option value="USD">Dólar Americano (US$)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Formatos de Data</label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Modelo de Numeração de Pedidos</label>
                  <input
                    type="text"
                    value={autoNumberingPattern}
                    onChange={(e) => setAutoNumberingPattern(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 font-normal mt-1 block">Sequencial ex: PED-2026-0001</span>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Rotinas de Segurança (Backup)</label>
                  <select
                    value={backupFrequency}
                    onChange={(e) => setBackupFrequency(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="daily">Backup Diário Automático</option>
                    <option value="weekly">Backup Semanal (Recomendado)</option>
                    <option value="monthly">Backup Mensal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Idioma Padrão</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Alertas de Sistema</label>
                  <select
                    value={notificationsEnabled ? 'yes' : 'no'}
                    onChange={(e) => setNotificationsEnabled(e.target.value === 'yes')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value="yes">Habilitar Sons e Notificações Flutuantes</option>
                    <option value="no">Silenciar Todas as Notificações</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("⚠️ ATENÇÃO: Isso irá apagar todos os registros de clientes, vendas, estoque, transações financeiras e redefinir o sistema ao estado inicial de primeiro acesso (onboarding). Deseja continuar?")) {
                      resetSystem();
                    }
                  }}
                  className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 font-bold rounded-xl cursor-pointer transition-all text-xs"
                >
                  Resetar Todo o Sistema
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Gravar Definições
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: MEU PERFIL */}
        {activeTab === 'profile' && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900">Editar Meu Perfil de Operador</h3>
              <p className="text-[11px] text-slate-500">Seus dados para login e rastreabilidade nos registros de auditoria do sistema.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-semibold">
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <img
                  src={profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop'}
                  alt="Avatar"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/20"
                />
                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <h4 className="font-serif font-bold text-sm text-slate-900">{profileName || "Nome Completo"}</h4>
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-500/10 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                    {user?.role || "Operador"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Seu Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Seu E-mail de Trabalho</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Telefone Comercial / WhatsApp</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">URL da Imagem de Perfil</label>
                  <input
                    type="text"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Alterar Senha de Acesso</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Salvar Perfil
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 6: USUÁRIOS E PERMISSÕES */}
        {activeTab === 'users' && (
          <UsersPermissionsView />
        )}

      </div>
    </div>
  );
};
