import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { Client, ClientType, ClientAddress } from '../types/erp';
import { 
  Search, Plus, Edit3, Trash2, X, Users, MapPin, Phone, Mail, 
  Briefcase, FileText, ShoppingBag, DollarSign, Calendar, Eye, 
  AlertTriangle, ArrowLeft, Building, Star, Check, Loader2, Landmark
} from 'lucide-react';
import { toast } from './Toast';
import { Pagination } from './Pagination';

// Brazilian Zip Code (CEP) API fetch helper
const fetchCepData = async (cep: string) => {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || ''
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
};

// Brazilian Company (CNPJ) API fetch helper using public Receita/BrasilAPI
const fetchCnpjData = async (cnpj: string) => {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) return null;
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      name: data.razao_social || '',
      nomeFantasia: data.nome_fantasia || '',
      phone: data.ddd_telefone_1 || data.telefone || '',
      email: data.email || '',
      cep: data.cep || '',
      street: data.logradouro || '',
      number: data.numero || '',
      neighborhood: data.bairro || '',
      city: data.municipio || '',
      state: data.uf || ''
    };
  } catch (error) {
    console.error('Erro ao buscar CNPJ:', error);
    return null;
  }
};

export const ClientsView: React.FC = () => {
  const { clients, orders, quotes, addClient, updateClient, deleteClient } = useDb();

  // Screen state: 'list' | 'add' | 'edit' | 'detail' | 'delete-confirm'
  const [activeScreen, setActiveScreen] = useState<'list' | 'add' | 'edit' | 'detail' | 'delete-confirm'>('list');

  // Preserve filters in parent state so they never reset when navigating pages
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'PF' | 'PJ'>('all');

  // Client selected for detail, edit or deletion
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form Fields
  const [formType, setFormType] = useState<ClientType>('PF');
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    cnpj: '',
    email: '',
    phone: '',
    whatsapp: '',
    nomeFantasia: '',
    responsavel: ''
  });

  // Multiple Addresses local state
  const [addressesList, setAddressesList] = useState<ClientAddress[]>([]);

  // Address Sub-form state
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressCep, setAddressCep] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [addressNeighborhood, setAddressNeighborhood] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressLabel, setAddressLabel] = useState('Entrega');
  const [addressIsMain, setAddressIsMain] = useState(false);

  // Search spinners
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const activeClients = clients.filter(c => !c.isDeleted);

  // Filters logic
  const filteredClients = activeClients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.cnpj && c.cnpj.includes(search)) ||
      (c.cpf && c.cpf.includes(search));
    const matchesType = selectedType === 'all' || c.type === selectedType;
    return matchesSearch && matchesType;
  });

  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Client History calculations
  const getClientStats = (clientId: string) => {
    const clientOrders = orders.filter(o => !o.isDeleted && o.clientId === clientId);
    const clientQuotes = quotes.filter(q => !q.isDeleted && q.clientId === clientId);
    const totalSpent = clientOrders.reduce((sum, o) => sum + o.totalValue, 0);
    const ticketMedio = clientOrders.length > 0 ? totalSpent / clientOrders.length : 0;
    const openValue = clientOrders
      .filter(o => o.status !== 'completed')
      .reduce((sum, o) => sum + o.totalValue, 0);

    return {
      ordersCount: clientOrders.length,
      quotesCount: clientQuotes.length,
      totalSpent,
      ticketMedio,
      openValue,
      orders: clientOrders,
      quotes: clientQuotes
    };
  };

  // Navigations
  const handleOpenAdd = () => {
    setFormType('PF');
    setFormData({
      name: '',
      cpf: '',
      cnpj: '',
      email: '',
      phone: '',
      whatsapp: '',
      nomeFantasia: '',
      responsavel: ''
    });
    setAddressesList([]);
    clearAddressSubForm();
    setActiveScreen('add');
  };

  const handleOpenEdit = (client: Client) => {
    setSelectedClient(client);
    setFormType(client.type);
    setFormData({
      name: client.name,
      cpf: client.cpf || '',
      cnpj: client.cnpj || '',
      email: client.email,
      phone: client.phone,
      whatsapp: client.whatsapp,
      nomeFantasia: client.nomeFantasia || '',
      responsavel: client.responsavel || ''
    });

    // Populate addresses list
    const initialAddresses = client.addresses || [];
    if (initialAddresses.length === 0 && client.street) {
      initialAddresses.push({
        id: 'legacy-main',
        cep: client.cep || '',
        street: client.street || '',
        number: client.number || '',
        complement: client.complement || '',
        neighborhood: client.neighborhood || '',
        city: client.city || '',
        state: client.state || '',
        isMain: true,
        label: 'Entrega'
      });
    }
    setAddressesList(initialAddresses);
    clearAddressSubForm();
    setActiveScreen('edit');
  };

  const handleViewDetail = (client: Client) => {
    setSelectedClient(client);
    setActiveScreen('detail');
  };

  const handleDeleteTrigger = (client: Client) => {
    setSelectedClient(client);
    setActiveScreen('delete-confirm');
  };

  // CNPJ API Search handler
  const handleCnpjSearch = async () => {
    const clean = formData.cnpj.replace(/\D/g, '');
    if (clean.length !== 14) {
      toast.error("Validação", "CNPJ inválido. Digite 14 números.");
      return;
    }
    setIsSearchingCnpj(true);
    const data = await fetchCnpjData(clean);
    setIsSearchingCnpj(false);
    if (data) {
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        nomeFantasia: data.nomeFantasia || prev.nomeFantasia,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        whatsapp: data.phone || prev.whatsapp,
      }));
      
      if (data.cep && data.street) {
        const cnpjAddr: ClientAddress = {
          id: 'cnpj-addr-' + Date.now(),
          cep: data.cep,
          street: data.street,
          number: data.number || '',
          complement: '',
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          isMain: true,
          label: 'Sede'
        };
        setAddressesList(prev => {
          const reset = prev.map(a => ({ ...a, isMain: false }));
          return [...reset, cnpjAddr];
        });
        toast.success("Empresa Encontrada!", "Dados e endereço da sede preenchidos!");
      } else {
        toast.success("Empresa Encontrada!", "Dados preenchidos com sucesso.");
      }
    } else {
      toast.error("Não Encontrado", "Não foi possível buscar dados para este CNPJ.");
    }
  };

  // CEP change/typing auto search handler
  const handleCepChange = async (val: string) => {
    setAddressCep(val);
    const clean = val.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsSearchingCep(true);
      const data = await fetchCepData(clean);
      setIsSearchingCep(false);
      if (data) {
        setAddressStreet(data.street);
        setAddressNeighborhood(data.neighborhood);
        setAddressCity(data.city);
        setAddressState(data.state);
        toast.success("CEP Encontrado!", "Endereço preenchido automaticamente.");
      } else {
        toast.warning("CEP não encontrado", "Digite o endereço manualmente se necessário.");
      }
    }
  };

  const handleManualCepSearch = async () => {
    if (!addressCep) {
      toast.error("Erro", "Digite um CEP para buscar.");
      return;
    }
    setIsSearchingCep(true);
    const data = await fetchCepData(addressCep);
    setIsSearchingCep(false);
    if (data) {
      setAddressStreet(data.street);
      setAddressNeighborhood(data.neighborhood);
      setAddressCity(data.city);
      setAddressState(data.state);
      toast.success("CEP Encontrado!", "Endereço preenchido automaticamente.");
    } else {
      toast.error("Não encontrado", "CEP não localizado.");
    }
  };

  // Address subform list management
  const clearAddressSubForm = () => {
    setEditingAddressId(null);
    setAddressCep('');
    setAddressStreet('');
    setAddressNumber('');
    setAddressComplement('');
    setAddressNeighborhood('');
    setAddressCity('');
    setAddressState('');
    setAddressLabel('Entrega');
    setAddressIsMain(false);
  };

  const handleAddAddressToList = () => {
    if (!addressStreet || !addressCity || !addressState) {
      toast.error("Erro", "Rua, Cidade e Estado são obrigatórios.");
      return;
    }

    const newAddr: ClientAddress = {
      id: editingAddressId || 'addr-' + Date.now(),
      cep: addressCep,
      street: addressStreet,
      number: addressNumber,
      complement: addressComplement,
      neighborhood: addressNeighborhood,
      city: addressCity,
      state: addressState.toUpperCase().substring(0, 2),
      isMain: addressIsMain || addressesList.length === 0,
      label: addressLabel || 'Entrega'
    };

    setAddressesList(prev => {
      let updated = [...prev];
      if (editingAddressId) {
        updated = updated.map(a => a.id === editingAddressId ? newAddr : a);
      } else {
        updated.push(newAddr);
      }

      if (newAddr.isMain) {
        updated = updated.map(a => a.id === newAddr.id ? { ...a, isMain: true } : { ...a, isMain: false });
      }
      return updated;
    });

    clearAddressSubForm();
    toast.success(editingAddressId ? "Endereço atualizado!" : "Endereço adicionado à lista!");
  };

  const handleEditAddressFromList = (addr: ClientAddress) => {
    setEditingAddressId(addr.id);
    setAddressCep(addr.cep);
    setAddressStreet(addr.street);
    setAddressNumber(addr.number);
    setAddressComplement(addr.complement || '');
    setAddressNeighborhood(addr.neighborhood);
    setAddressCity(addr.city);
    setAddressState(addr.state);
    setAddressLabel(addr.label || 'Entrega');
    setAddressIsMain(addr.isMain);
  };

  const handleRemoveAddressFromList = (id: string) => {
    setAddressesList(prev => {
      const filtered = prev.filter(a => a.id !== id);
      if (filtered.length > 0 && !filtered.some(a => a.isMain)) {
        filtered[0].isMain = true;
      }
      return filtered;
    });
    toast.warning("Endereço removido.");
  };

  const handleSetMainAddress = (id: string) => {
    setAddressesList(prev => prev.map(a => ({
      ...a,
      isMain: a.id === id
    })));
    toast.success("Endereço principal atualizado!");
  };

  // Submit operations
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Validação", "Nome/Razão Social é obrigatório.");
      return;
    }

    const mainAddress = addressesList.find(a => a.isMain) || addressesList[0];

    addClient({
      type: formType,
      name: formData.name,
      cpf: formType === 'PF' ? formData.cpf : undefined,
      cnpj: formType === 'PJ' ? formData.cnpj : undefined,
      email: formData.email,
      phone: formData.phone,
      whatsapp: formData.whatsapp,
      nomeFantasia: formType === 'PJ' ? formData.nomeFantasia : undefined,
      responsavel: formType === 'PJ' ? formData.responsavel : undefined,
      
      // Map main address to root for old systems
      cep: mainAddress?.cep || '',
      street: mainAddress?.street || '',
      number: mainAddress?.number || '',
      complement: mainAddress?.complement || '',
      neighborhood: mainAddress?.neighborhood || '',
      city: mainAddress?.city || '',
      state: mainAddress?.state || '',
      addresses: addressesList
    });

    toast.success("Cliente adicionado!", `O contato ${formData.name} foi criado.`);
    setActiveScreen('list');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const mainAddress = addressesList.find(a => a.isMain) || addressesList[0];

    updateClient(selectedClient.id, {
      type: formType,
      name: formData.name,
      cpf: formType === 'PF' ? formData.cpf : undefined,
      cnpj: formType === 'PJ' ? formData.cnpj : undefined,
      email: formData.email,
      phone: formData.phone,
      whatsapp: formData.whatsapp,
      nomeFantasia: formType === 'PJ' ? formData.nomeFantasia : undefined,
      responsavel: formType === 'PJ' ? formData.responsavel : undefined,
      
      cep: mainAddress?.cep || '',
      street: mainAddress?.street || '',
      number: mainAddress?.number || '',
      complement: mainAddress?.complement || '',
      neighborhood: mainAddress?.neighborhood || '',
      city: mainAddress?.city || '',
      state: mainAddress?.state || '',
      addresses: addressesList
    });

    toast.success("Cliente salvo!", `Os dados de ${formData.name} foram atualizados.`);
    setActiveScreen('list');
  };

  const handleConfirmDelete = () => {
    if (!selectedClient) return;
    deleteClient(selectedClient.id);
    toast.warning("Cliente arquivado", `Contato "${selectedClient.name}" foi removido do catálogo ativo.`);
    setActiveScreen('list');
  };

  // RENDER LAYOUTS based on page screen
  return (
    <div className="space-y-6">

      {/* 1. LIST SCREEN */}
      {activeScreen === 'list' && (
        <div className="space-y-6 animate-slide-in-up">
          {/* Header & Filter Bar */}
          <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail, telefone, CPF, CNPJ..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
              </div>

              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value as any); setCurrentPage(1); }}
                className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Pessoa Física & Jurídica</option>
                <option value="PF">Apenas Pessoa Física (PF)</option>
                <option value="PJ">Apenas Pessoa Jurídica (PJ)</option>
              </select>
            </div>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus size={14} /> Novo Cliente
            </button>
          </div>

          {/* Grid list of Clients */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedClients.map(client => {
              const stats = getClientStats(client.id);
              const mainAddr = client.addresses?.find(a => a.isMain) || client;

              return (
                <div key={client.id} className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
                  <div>
                    {/* Badge type header */}
                    <div className="flex justify-between items-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                        client.type === 'PJ' ? 'bg-indigo-500/10 text-indigo-700' : 'bg-emerald-500/10 text-emerald-700'
                      }`}>
                        {client.type === 'PJ' ? 'PESSOA JURÍDICA' : 'PESSOA FÍSICA'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ID: {client.id.substring(7, 11)}
                      </span>
                    </div>

                    {/* Main Client Info */}
                    <div className="mt-3">
                      <h3 className="font-serif font-bold text-sm text-slate-900 truncate">{client.name}</h3>
                      {client.type === 'PJ' && client.nomeFantasia && (
                        <p className="text-[11px] text-slate-500 font-semibold truncate mt-0.5">{client.nomeFantasia}</p>
                      )}
                      {client.type === 'PJ' && client.responsavel && (
                        <p className="text-[10px] text-slate-450 mt-1 flex items-center gap-1.5 font-medium">
                          <Briefcase size={10} /> Resp: {client.responsavel}
                        </p>
                      )}
                    </div>

                    {/* Contacts info */}
                    <div className="mt-4 space-y-2 text-[11px] font-medium text-slate-600">
                      <p className="flex items-center gap-2 truncate">
                        <Mail size={12} className="text-slate-400" /> {client.email}
                      </p>
                      <p className="flex items-center gap-2 truncate">
                        <Phone size={12} className="text-slate-400" /> {client.whatsapp || client.phone}
                      </p>
                      {mainAddr.city && (
                        <p className="flex items-center gap-2 truncate">
                          <MapPin size={12} className="text-slate-400" /> {mainAddr.city} - {mainAddr.state}
                        </p>
                      )}
                    </div>

                    {/* Quick orders count info box */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100">
                      <div className="p-2 bg-slate-50 rounded-xl text-center">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Pedidos</p>
                        <p className="text-xs font-black text-slate-800 mt-1">{stats.ordersCount}</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl text-center">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total Compras</p>
                        <p className="text-xs font-black text-slate-800 mt-1 font-mono">
                          R$ {stats.totalSpent.toFixed(0)}
                        </p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl text-center">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Ticket Médio</p>
                        <p className="text-xs font-black text-slate-800 mt-1 font-mono">
                          R$ {stats.ticketMedio.toFixed(0)}
                        </p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl text-center">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Em Aberto</p>
                        <p className="text-xs font-black text-rose-600 mt-1 font-mono">
                          R$ {stats.openValue.toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleViewDetail(client)}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-650 rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-3xs"
                    >
                      <Eye size={12} /> Ver Histórico
                    </button>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-650 hover:text-amber-600 cursor-pointer transition-all duration-200 active:scale-95"
                        title="Editar"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteTrigger(client)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-650 hover:text-rose-600 cursor-pointer transition-all duration-200 active:scale-95"
                        title="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredClients.length === 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center text-slate-450 font-serif">
                Nenhum cliente artesanal cadastrado com esses parâmetros de busca.
              </div>
            )}
          </div>

          {/* Standardized Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredClients.length / itemsPerPage)}
            totalItems={filteredClients.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            labelSingular="cliente"
            labelPlural="clientes"
          />
        </div>
      )}


      {/* 2. ADD / EDIT SCREEN */}
      {(activeScreen === 'add' || activeScreen === 'edit') && (
        <div className="bg-white border border-slate-150 rounded-2xl p-6 space-y-6 shadow-xs max-w-4xl mx-auto animate-slide-in-up">
          {/* Page Title & Back Button */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveScreen('list')}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer transition-all active:scale-95 shadow-3xs"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  {activeScreen === 'add' ? 'Cadastrar Novo Cliente' : 'Editar Ficha Cadastral'}
                </h3>
                <p className="text-[10.5px] text-slate-500">Mantenha seu CRM de vendas atualizado</p>
              </div>
            </div>
            
            <button
              onClick={() => setActiveScreen('list')}
              className="text-xs font-bold text-slate-450 hover:text-slate-600 cursor-pointer flex items-center gap-1.5"
            >
              Voltar sem salvar
            </button>
          </div>

          <form onSubmit={activeScreen === 'add' ? handleSaveAdd : handleSaveEdit} className="space-y-6 text-xs">
            {/* PF vs PJ Selector */}
            <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 max-w-xs flex gap-1">
              <button
                type="button"
                onClick={() => setFormType('PF')}
                className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  formType === 'PF' ? 'bg-white text-slate-900 shadow-3xs border border-slate-150' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pessoa Física (PF)
              </button>
              <button
                type="button"
                onClick={() => setFormType('PJ')}
                className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  formType === 'PJ' ? 'bg-white text-slate-900 shadow-3xs border border-slate-150' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pessoa Jurídica (PJ)
              </button>
            </div>

            {/* General Identity Info block */}
            <div className="space-y-4">
              <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Users size={15} className="text-amber-500" /> Identificação e Contato
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formType === 'PF' ? (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Maria das Dores de Sousa"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-850 focus:ring-2 focus:ring-amber-500/10 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">CPF</label>
                      <input
                        type="text"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        placeholder="000.000.000-00"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-850 font-mono focus:ring-2 focus:ring-amber-500/10 focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">CNPJ</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.cnpj}
                          onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                          placeholder="00.000.000/0000-00"
                          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-850 font-mono focus:ring-2 focus:ring-amber-500/10 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleCnpjSearch}
                          disabled={isSearchingCnpj}
                          className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-3xs cursor-pointer disabled:opacity-50"
                        >
                          {isSearchingCnpj ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Landmark className="w-3.5 h-3.5" />
                          )}
                          Buscar Receita
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Busca automática na Receita Federal via BrasilAPI</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Razão Social (Nome Oficial) *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Ateliê das Flores Ltda"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-850 focus:ring-2 focus:ring-amber-500/10 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nome Fantasia</label>
                      <input
                        type="text"
                        value={formData.nomeFantasia}
                        onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                        placeholder="Ex: Ateliê Flores de Seda"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-850 focus:ring-2 focus:ring-amber-500/10 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Representante Legal / Responsável</label>
                      <input
                        type="text"
                        value={formData.responsavel}
                        onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                        placeholder="Ex: Pe. João Batista"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-850 focus:ring-2 focus:ring-amber-500/10 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Endereço de E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="exemplo@ateliermaster.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-850 focus:ring-2 focus:ring-amber-500/10 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Telefone Comercial</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 4500-0000"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-850 focus:ring-2 focus:ring-amber-500/10 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">WhatsApp Master</label>
                    <input
                      type="text"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-850 font-mono focus:ring-2 focus:ring-amber-500/10 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* MULTIPLE ADDRESSES CRM PANEL */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <MapPin size={15} className="text-amber-500" /> Endereços para Remessa / Logística
              </h4>

              {/* Saved Addresses list block */}
              <div className="space-y-2">
                {addressesList.map((addr, index) => (
                  <div key={addr.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all ${
                    addr.isMain ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-200 bg-white'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono uppercase">
                          {addr.label || 'Entrega'}
                        </span>
                        {addr.isMain && (
                          <span className="text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Star size={8} fill="currentColor" /> Principal de Entrega
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-800">
                        {addr.street}, nº {addr.number} {addr.complement && `- ${addr.complement}`}
                      </p>
                      <p className="text-slate-500 text-[10.5px]">
                        {addr.neighborhood} — {addr.city}/{addr.state} • CEP {addr.cep}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      {!addr.isMain && (
                        <button
                          type="button"
                          onClick={() => handleSetMainAddress(addr.id)}
                          className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-650 hover:text-amber-600 font-bold transition-all active:scale-95 text-[10px]"
                        >
                          Definir Principal
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEditAddressFromList(addr)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-amber-600 cursor-pointer transition-all active:scale-95"
                        title="Editar"
                      >
                        <Edit3 size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAddressFromList(addr.id)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 cursor-pointer transition-all active:scale-95"
                        title="Excluir"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}

                {addressesList.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    Nenhum endereço de entrega cadastrado para este cliente. Insira abaixo.
                  </p>
                )}
              </div>

              {/* Subform block for entering another address */}
              <div className="bg-slate-50/40 border border-slate-200/80 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h5 className="font-serif font-bold text-xs text-slate-800">
                    {editingAddressId ? '📝 Editar Endereço da Lista' : '➕ Adicionar Novo Endereço'}
                  </h5>
                  {editingAddressId && (
                    <button
                      type="button"
                      onClick={clearAddressSubForm}
                      className="text-[10px] font-bold text-rose-500 hover:underline"
                    >
                      Cancelar Edição de Endereço
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">CEP para Busca *</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={addressCep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-850 font-mono focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleManualCepSearch}
                        disabled={isSearchingCep}
                        className="px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center cursor-pointer disabled:opacity-50"
                      >
                        {isSearchingCep ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Buscar'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Tipo de Endereço / Label</label>
                    <select
                      value={addressLabel}
                      onChange={(e) => setAddressLabel(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="Entrega">Entrega Principal</option>
                      <option value="Sede">Sede Corporativa</option>
                      <option value="Cobrança">Cobrança / Faturamento</option>
                      <option value="Residencial">Residencial</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5 pl-2">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold text-[11px]">
                      <input
                        type="checkbox"
                        checked={addressIsMain}
                        onChange={(e) => setAddressIsMain(e.target.checked)}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-500/20 w-3.5 h-3.5 cursor-pointer"
                      />
                      Definir como entrega principal
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Logradouro (Rua, Avenida) *</label>
                    <input
                      type="text"
                      value={addressStreet}
                      onChange={(e) => setAddressStreet(e.target.value)}
                      placeholder="Ex: Rua de Santa Clara"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Número *</label>
                    <input
                      type="text"
                      value={addressNumber}
                      onChange={(e) => setAddressNumber(e.target.value)}
                      placeholder="Ex: 405"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Complemento</label>
                    <input
                      type="text"
                      value={addressComplement}
                      onChange={(e) => setAddressComplement(e.target.value)}
                      placeholder="Ex: Bloco B, Apt 101"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Bairro</label>
                    <input
                      type="text"
                      value={addressNeighborhood}
                      onChange={(e) => setAddressNeighborhood(e.target.value)}
                      placeholder="Ex: Jardins"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Cidade *</label>
                    <input
                      type="text"
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                      placeholder="Ex: São Paulo"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Estado (UF) *</label>
                    <input
                      type="text"
                      value={addressState}
                      onChange={(e) => setAddressState(e.target.value)}
                      placeholder="Ex: SP"
                      maxLength={2}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-850 focus:outline-none uppercase"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleAddAddressToList}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-3xs flex items-center gap-1.5 cursor-pointer text-[10.5px]"
                  >
                    <Check size={12} />
                    {editingAddressId ? 'Atualizar Endereço na Lista' : 'Salvar Endereço na Lista'}
                  </button>
                </div>
              </div>
            </div>

            {/* Form submit/cancel footer buttons */}
            <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 p-4 -mx-6 -mb-6 rounded-b-2xl mt-4">
              <button
                type="button"
                onClick={() => setActiveScreen('list')}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-500 cursor-pointer transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-br from-ink-900 to-slate-800 text-white hover:opacity-95 rounded-xl font-bold cursor-pointer transition-all active:scale-95 shadow-md flex items-center gap-2"
              >
                {activeScreen === 'add' ? 'Adicionar Novo Cliente' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      )}


      {/* 3. DETAIL VIEW SCREEN */}
      {activeScreen === 'detail' && selectedClient && (
        <div className="bg-white border border-slate-150 rounded-2xl p-6 space-y-6 shadow-xs max-w-4xl mx-auto animate-slide-in-up">
          {/* Header page details */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveScreen('list')}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer transition-all active:scale-95 shadow-3xs"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">Histórico & Dossiê do Cliente</h3>
                <p className="text-[10.5px] text-slate-500">Visualização de compras, pedidos e endereços</p>
              </div>
            </div>
            
            <button
              onClick={() => setActiveScreen('list')}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-600 text-xs flex items-center gap-1.5"
            >
              Voltar ao Catálogo
            </button>
          </div>

          {/* Profile overview card info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-150">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                  selectedClient.type === 'PJ' ? 'bg-indigo-500/10 text-indigo-700' : 'bg-emerald-500/10 text-emerald-700'
                }`}>
                  {selectedClient.type === 'PJ' ? 'PESSOA JURÍDICA' : 'PESSOA FÍSICA'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ID: {selectedClient.id.substring(7, 12)}
                </span>
              </div>
              <h4 className="font-serif font-bold text-base text-slate-900 leading-tight">{selectedClient.name}</h4>
              {selectedClient.nomeFantasia && (
                <p className="text-xs text-slate-500 font-semibold">{selectedClient.nomeFantasia}</p>
              )}
              {selectedClient.responsavel && (
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <Briefcase size={12} className="text-slate-400" /> Resp: {selectedClient.responsavel}
                </p>
              )}
              <div className="text-xs space-y-1.5 text-slate-600 pt-2 border-t border-slate-200/50">
                <p className="flex items-center gap-2">
                  <Mail size={12} className="text-slate-400" /> {selectedClient.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={12} className="text-slate-400" /> {selectedClient.whatsapp || selectedClient.phone}
                </p>
                {selectedClient.cpf && <p className="font-mono text-[10.5px] text-slate-500">CPF: {selectedClient.cpf}</p>}
                {selectedClient.cnpj && <p className="font-mono text-[10.5px] text-slate-500">CNPJ: {selectedClient.cnpj}</p>}
              </div>
            </div>

            {/* Address Overview List */}
            <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-200/70 pt-4 md:pt-0 md:pl-6">
              <h5 className="font-serif font-bold text-xs text-slate-800 flex items-center gap-1">
                <MapPin size={13} className="text-amber-500" /> Endereços de Remessa ({selectedClient.addresses?.length || 1})
              </h5>
              
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {selectedClient.addresses && selectedClient.addresses.length > 0 ? (
                  selectedClient.addresses.map(addr => (
                    <div key={addr.id} className={`p-2.5 rounded-xl border text-[10.5px] ${
                      addr.isMain ? 'border-amber-500/20 bg-amber-500/5' : 'border-slate-150 bg-white'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[9px] text-slate-400 uppercase">{addr.label || 'Entrega'}</span>
                        {addr.isMain && <span className="text-[8px] font-black text-amber-600">PRINCIPAL</span>}
                      </div>
                      <p className="font-medium text-slate-800 mt-1">
                        {addr.street}, nº {addr.number} {addr.complement && `(${addr.complement})`}
                      </p>
                      <p className="text-slate-500">{addr.neighborhood} — {addr.city}/{addr.state} • CEP {addr.cep}</p>
                    </div>
                  ))
                ) : (
                  selectedClient.street ? (
                    <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[10.5px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[9px] text-slate-400 uppercase">Entrega</span>
                        <span className="text-[8px] font-black text-amber-600">PRINCIPAL</span>
                      </div>
                      <p className="font-medium text-slate-800 mt-1">
                        {selectedClient.street}, nº {selectedClient.number} {selectedClient.complement && `(${selectedClient.complement})`}
                      </p>
                      <p className="text-slate-500">{selectedClient.neighborhood} — {selectedClient.city}/{selectedClient.state} • CEP {selectedClient.cep}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-450 italic">Nenhum endereço cadastrado para remessa.</p>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Detailed Financial Stats Panel */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pedidos Realizados</span>
              <span className="text-xl font-black text-slate-900 block mt-1.5 font-mono">
                {getClientStats(selectedClient.id).ordersCount}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Acúmulo histórico de vendas</p>
            </div>
            <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Comprado</span>
              <span className="text-xl font-black text-amber-600 block mt-1.5 font-mono">
                R$ {getClientStats(selectedClient.id).totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Faturamento total gerado</p>
            </div>
            <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Ticket Médio</span>
              <span className="text-xl font-black text-slate-900 block mt-1.5 font-mono">
                R$ {getClientStats(selectedClient.id).ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Valor médio por pedido</p>
            </div>
            <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl">
              <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block">Saldo em Aberto</span>
              <span className="text-xl font-black text-rose-600 block mt-1.5 font-mono">
                R$ {getClientStats(selectedClient.id).openValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] text-rose-500 mt-1">Pedidos pendentes de conclusão</p>
            </div>
          </div>

          {/* Core Orders & Quotes list history */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            {/* Orders History Panel */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-4 shadow-3xs">
              <h4 className="font-serif font-bold text-sm text-slate-900 uppercase tracking-tight flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                <ShoppingBag size={14} className="text-amber-500" /> Histórico de Pedidos ({getClientStats(selectedClient.id).ordersCount})
              </h4>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {getClientStats(selectedClient.id).orders.map(order => (
                  <div key={order.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800">{order.orderNumber}</p>
                      <p className="text-[10px] text-slate-450 mt-0.5">Vencimento: {order.dueDate} | Progresso: {order.productionProgress}%</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-mono text-slate-800">R$ {order.totalValue.toFixed(2)}</p>
                      <span className="inline-block px-1.5 py-0.5 mt-1 rounded bg-amber-500/10 text-[9px] font-bold uppercase text-amber-700">{order.status}</span>
                    </div>
                  </div>
                ))}
                {getClientStats(selectedClient.id).orders.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-8 text-center bg-slate-50/50 rounded-xl border border-slate-100">
                    Nenhum pedido praticado com este cliente ainda.
                  </p>
                )}
              </div>
            </div>

            {/* Quotes History Panel */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-4 shadow-3xs">
              <h4 className="font-serif font-bold text-sm text-slate-900 uppercase tracking-tight flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                <FileText size={14} className="text-amber-500" /> Histórico de Orçamentos ({getClientStats(selectedClient.id).quotesCount})
              </h4>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {getClientStats(selectedClient.id).quotes.map(quote => (
                  <div key={quote.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800">Orçamento #{quote.id.substring(6, 11).toUpperCase()}</p>
                      <p className="text-[10px] text-slate-450 mt-0.5">Emissão: {quote.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-mono text-slate-800">R$ {quote.total.toFixed(2)}</p>
                      <span className="inline-block px-1.5 py-0.5 mt-1 rounded bg-indigo-500/10 text-[9px] font-bold uppercase text-indigo-700">{quote.status}</span>
                    </div>
                  </div>
                ))}
                {getClientStats(selectedClient.id).quotes.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-8 text-center bg-slate-50/50 rounded-xl border border-slate-100">
                    Nenhum orçamento emitido para este cliente.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Back */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end bg-slate-50 p-4 -mx-6 -mb-6 rounded-b-2xl">
            <button
              onClick={() => setActiveScreen('list')}
              className="px-5 py-2.5 bg-gradient-to-br from-ink-900 to-slate-800 text-white hover:opacity-95 rounded-xl font-bold cursor-pointer transition-all active:scale-95 shadow-md"
            >
              Retornar ao CRM
            </button>
          </div>
        </div>
      )}


      {/* 4. DELETE / ARCHIVE CONFIRMATION SCREEN */}
      {activeScreen === 'delete-confirm' && selectedClient && (
        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs max-w-md mx-auto space-y-5 animate-scale-in">
          <div className="flex items-center gap-3 text-rose-650">
            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-slate-900">Confirmar Arquivamento</h3>
              <p className="text-[10.5px] text-slate-450">CRM e Controle Logístico Ativo</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Deseja realmente arquivar o cliente <strong className="text-slate-800 font-serif">"{selectedClient.name}"</strong>? O registro não será mais exibido nas listas ativas de pedidos e orçamentos.
          </p>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 text-[11px] text-slate-600">
            <strong>Dossiê resumido:</strong>
            <p className="mt-1">Compras acumuladas: R$ {getClientStats(selectedClient.id).totalSpent.toFixed(2)}</p>
            <p>Pedidos vinculados: {getClientStats(selectedClient.id).ordersCount}</p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveScreen('list')}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md"
            >
              Confirmar e Arquivar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
