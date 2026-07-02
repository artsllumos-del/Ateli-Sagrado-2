import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingCart, Users, Edit2, Check, RotateCcw, Image, Palette, Eye, EyeOff } from 'lucide-react';
import { useDb } from '../../context/DbContext';
import { Order, Quote } from '../../types/erp';

interface DashboardHeaderProps {
  onQuickAction: (actionType: 'order' | 'client' | 'product' | 'quote') => void;
  activeOrders: Order[];
  quotes: Quote[];
  bannerConfig: BannerConfig;
  setBannerConfig: React.Dispatch<React.SetStateAction<BannerConfig>>;
}

export interface BannerConfig {
  title: string;
  description: string;
  highlightColor: string;
  bgImage: string;
  showBanner: boolean;
  showBtn1: boolean;
  btn1Text: string;
  btn1Icon: string;
  showBtn2: boolean;
  btn2Text: string;
  btn2Icon: string;
  showBtn3: boolean;
  btn3Text: string;
  btn3Icon: string;
  showBtn4: boolean;
  btn4Text: string;
  btn4Icon: string;
}

export const DEFAULT_BANNER: BannerConfig = {
  title: "Gestão Ateliê Sagrado",
  description: "Bem-vindo ao painel de controle do seu ERP. Acompanhe a produção, nível dos insumos de pérolas, faturamento em tempo real e saúde financeira.",
  highlightColor: "#D4A039",
  bgImage: "",
  showBanner: true,
  showBtn1: true,
  btn1Text: "Novo Pedido",
  btn1Icon: "ShoppingCart",
  showBtn2: true,
  btn2Text: "Novo Cliente",
  btn2Icon: "Users",
  showBtn3: true,
  btn3Text: "Novo Produto",
  btn3Icon: "Sparkles",
  showBtn4: true,
  btn4Text: "Preço Inteligente",
  btn4Icon: "DollarSign",
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onQuickAction,
  activeOrders,
  quotes,
  bannerConfig,
  setBannerConfig,
}) => {
  const { settings, updateSettings } = useDb();
  const [isEditingName, setIsEditingName] = useState(false);
  const [companyNameInput, setCompanyNameInput] = useState(settings?.companyName || "Ateliê Sagrado");

  useEffect(() => {
    if (settings?.companyName) {
      setCompanyNameInput(settings.companyName);
    }
  }, [settings?.companyName]);

  // Determine dynamic Catholic traditional salutation
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = "bom dia";
    if (hour >= 12 && hour < 18) {
      timeGreeting = "boa tarde";
    } else if (hour >= 18 || hour < 5) {
      timeGreeting = "boa noite";
    }
    return `Salve Maria! Muito ${timeGreeting}`;
  };

  const handleSaveCompanyName = () => {
    if (companyNameInput.trim()) {
      updateSettings({ companyName: companyNameInput.trim() });
      setIsEditingName(false);
    }
  };

  // Format today's date
  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Quantitatives for production queue and daily deliveries
  const todayStr = new Date().toISOString().split('T')[0];
  const inProductionCount = activeOrders.filter(o => ['production', 'finishing'].includes(o.status)).length;
  const deliveriesTodayCount = activeOrders.filter(o => o.dueDate === todayStr).length;

  const handleAction = (btnIcon: string) => {
    if (btnIcon === "ShoppingCart") onQuickAction('order');
    else if (btnIcon === "Users") onQuickAction('client');
    else if (btnIcon === "Sparkles") onQuickAction('product');
    else if (btnIcon === "DollarSign") onQuickAction('quote');
  };

  return (
    <div className="space-y-4 no-print">
      {/* 1. Smart Header / Cabeçalho Inteligente */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {getGreeting()}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {capitalizedDate}
            </span>
          </div>
          
          <div className="flex items-center gap-2.5">
            {isEditingName ? (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  className="px-2.5 py-1 text-sm font-serif font-semibold border border-slate-200 rounded-lg text-slate-900 bg-slate-50 focus:ring-2 focus:ring-amber-500/20"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCompanyName(); }}
                />
                <button
                  onClick={handleSaveCompanyName}
                  className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <h1 className="text-xl sm:text-2xl font-serif font-semibold text-slate-900">
                  {settings?.companyName || "Ateliê Sagrado"}
                </h1>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors"
                  title="Editar nome do ateliê"
                >
                  <Edit2 size={13} />
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Atividades de hoje: <strong className="text-amber-700 font-semibold">{inProductionCount}</strong> pedidos em produção • <strong className="text-amber-700 font-semibold">{deliveriesTodayCount}</strong> entregas programadas para hoje.
          </p>
        </div>

        {/* Quick Access stats row */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-center min-w-[100px]">
            <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">Na Produção</span>
            <span className="text-lg font-mono font-black text-slate-800">{inProductionCount}</span>
          </div>
          <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-center min-w-[100px]">
            <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">Para Hoje</span>
            <span className="text-lg font-mono font-black text-slate-800">{deliveriesTodayCount}</span>
          </div>
        </div>
      </div>

      {/* 2. Customizable Banner / Banner Personalizável */}
      {bannerConfig.showBanner && (
        <div
          className="relative overflow-hidden p-8 sm:p-10 rounded-2xl border border-slate-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-8"
          style={{
            backgroundColor: bannerConfig.bgImage ? 'transparent' : '#FFFDF9',
            backgroundImage: bannerConfig.bgImage ? `linear-gradient(rgba(255,253,249,0.92), rgba(255,253,249,0.95)), url(${bannerConfig.bgImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderColor: bannerConfig.highlightColor ? `${bannerConfig.highlightColor}20` : 'rgba(212,160,57,0.15)'
          }}
        >
          {/* Accent blur elements */}
          <div 
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-40"
            style={{ backgroundColor: bannerConfig.highlightColor || '#D4A039' }}
          />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3.5 relative z-10 max-w-xl">
            <span 
              className="inline-flex items-center px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full border"
              style={{
                borderColor: `${bannerConfig.highlightColor}35`,
                backgroundColor: `${bannerConfig.highlightColor}08`,
                color: bannerConfig.highlightColor || '#D4A039'
              }}
            >
              <Sparkles size={11} className="mr-1 animate-pulse" /> Ateliê de Artes Sacras & Joias
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-semibold tracking-tight text-slate-900">
              {bannerConfig.title || "Gestão Ateliê Sagrado"}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              {bannerConfig.description || "Acompanhe seus pedidos, estoque de insumos e faturamento em tempo real."}
            </p>
          </div>

          {/* Quick Buttons List */}
          <div className="grid grid-cols-2 gap-3 shrink-0 relative z-10 w-full md:w-auto">
            {bannerConfig.showBtn1 && (
              <button
                onClick={() => handleAction(bannerConfig.btn1Icon)}
                className="px-5 py-3 text-white font-semibold text-xs rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:brightness-105"
                style={{ backgroundColor: bannerConfig.highlightColor || '#D4A039' }}
              >
                {bannerConfig.btn1Text}
              </button>
            )}
            {bannerConfig.showBtn2 && (
              <button
                onClick={() => handleAction(bannerConfig.btn2Icon)}
                className="px-5 py-3 bg-white text-slate-900 hover:bg-slate-50 font-semibold text-xs rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 shadow-xs"
              >
                {bannerConfig.btn2Text}
              </button>
            )}
            {bannerConfig.showBtn3 && (
              <button
                onClick={() => handleAction(bannerConfig.btn3Icon)}
                className="px-5 py-3 bg-white text-slate-900 hover:bg-slate-50 font-semibold text-xs rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 shadow-xs"
              >
                {bannerConfig.btn3Text}
              </button>
            )}
            {bannerConfig.showBtn4 && (
              <button
                onClick={() => handleAction(bannerConfig.btn4Icon)}
                className="px-5 py-3 bg-slate-900 text-white hover:bg-slate-800 font-semibold text-xs rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {bannerConfig.btn4Text}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
