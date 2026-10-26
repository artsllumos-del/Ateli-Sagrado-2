import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  Plus, 
  ExternalLink,
  Shield,
  Layers,
  Clock,
  DollarSign,
  Package,
  CheckCircle2,
  Share2,
  Send,
  Search,
  RotateCcw,
  Hammer,
  TrendingUp,
  FileText,
  ShoppingCart,
  Users,
  Settings,
  HelpCircle,
  AlertTriangle,
  Boxes,
  Calculator,
  Compass
} from 'lucide-react';

export interface LandingPageViewProps {
  onLogin: () => void;
  onRegister: (planId?: string) => void;
  onOpenApp: () => void;
  isAuthenticated?: boolean;
  userName?: string;
}

interface KanbanItem {
  id: string;
  code: string;
  title: string;
  client: string;
  price: number;
  step: number; // 1: Aguardando Insumos, 2: Na Bancada, 3: Embalagem & Certificado, 4: Pronto p/ Envio
  tag?: string;
  tagColor?: string;
}

interface StockItem {
  code: string;
  name: string;
  category: string;
  unitBuy: string;
  unitStock: string;
  unitConsume: string;
  conversionFactor: number;
  physicalQty: number;
  reservedQty: number;
  availableQty: number;
  avgCost: number;
  status: 'critical' | 'warning' | 'normal';
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onLogin,
  onRegister,
  onOpenApp,
  isAuthenticated = false,
  userName = ''
}) => {
  // Navigation tabs for the interactive ERP showcase
  const [activeTab, setActiveTab] = useState<'dashboard' | 'estoque' | 'produtos' | 'precificacao' | 'orcamentos' | 'kanban'>('dashboard');
  
  // UI states
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showNewSupplyModal, setShowNewSupplyModal] = useState(false);
  const [newSupplyName, setNewSupplyName] = useState('');
  const [newSupplyQty, setNewSupplyQty] = useState('200');
  const [newSupplyPrice, setNewSupplyPrice] = useState('0.45');
  const [stockSearch, setStockSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' | 'error' } | null>(null);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Stardust canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Scientific Pricing Calculator State
  const [calcModel, setCalcModel] = useState<'noiva' | 'tradicional' | 'dezena' | 'sacerdotal'>('noiva');
  const [calcBead, setCalcBead] = useState<'cristal' | 'perola' | 'madeira' | 'hematita'>('cristal');
  const [calcMetal, setCalcMetal] = useState<'folheado18k' | 'envelhecido' | 'prata925' | 'niquel'>('folheado18k');
  const [calcLaborHours, setCalcLaborHours] = useState(1.5);
  const [calcHourRate, setCalcHourRate] = useState(25.0);
  const [calcLossPct, setCalcLossPct] = useState(2.0); // 2% perda técnica
  const [calcTaxPct, setCalcTaxPct] = useState(8.0); // taxas comerciais/cartão
  const [calcMargin, setCalcMargin] = useState(60.0); // margem desejada

  // Quote Generator State
  const [quoteClient, setQuoteClient] = useState('Maria Eduarda de Alencar');
  const [quoteOccasion, setQuoteOccasion] = useState('Casamento na Catedral da Sé • Dezembro/2026');
  const [quoteItemDesc, setQuoteItemDesc] = useState('Terço de Noiva Cristal Checo 10mm, Crucifixo Barroco Ouro 18k');
  const [quoteItemPrice, setQuoteItemPrice] = useState(380);
  const [quoteFreight, setQuoteFreight] = useState(35);

  // Kanban State (Chão de Fábrica)
  const [kanbanItems, setKanbanItems] = useState<KanbanItem[]>([
    { id: '1', code: '#PED-108', title: 'Terço Crisma Prata de Lei 925', client: 'Helena Ramos', price: 240, step: 1, tag: 'Aguardando Cruz Prata', tagColor: 'text-amber-700 bg-amber-50' },
    { id: '2', code: '#PED-109', title: '10 Dezenas Batizado Imbuia', client: 'Batizado do Bernardo', price: 190, step: 1, tag: 'Fio Separado', tagColor: 'text-stone-600 bg-stone-100' },
    { id: '3', code: '#PED-104', title: 'Terço Noiva Cristal Checo 10mm', client: 'Maria Eduarda Costa', price: 380, step: 2, tag: 'Noiva Urgente', tagColor: 'text-emerald-800 bg-emerald-50 font-bold' },
    { id: '4', code: '#PED-105', title: 'Terço Sacerdotal Hematita 8mm', client: 'Pe. Gabriel Rezende', price: 175, step: 2, tag: 'Nó Franciscano', tagColor: 'text-stone-600 bg-stone-100' },
    { id: '5', code: '#PED-102', title: 'Terço São Bento Madeira Nobre', client: 'Diácono Tiago', price: 150, step: 3, tag: 'Estojo de Veludo', tagColor: 'text-purple-700 bg-purple-50' },
    { id: '6', code: '#PED-100', title: 'Terço Família Folheado Ouro 18k', client: 'Sra. Teresa Vasconcelos', price: 290, step: 4, tag: 'Pronto p/ Despacho', tagColor: 'text-emerald-700 bg-emerald-50' },
  ]);

  // Inventory Table State (with 3 units of measure and reservations)
  const [stockItems, setStockItems] = useState<StockItem[]>([
    { 
      code: 'INS-001', 
      name: 'Cristal Checo Lapidado Aurora Boreal 8mm', 
      category: 'Contas & Cristais',
      unitBuy: 'Pacote 500g',
      unitStock: 'unidade',
      unitConsume: 'unidade',
      conversionFactor: 2000,
      physicalQty: 240,
      reservedQty: 180,
      availableQty: 60, // 240 - 180
      avgCost: 0.45,
      status: 'critical'
    },
    { 
      code: 'INS-002', 
      name: 'Crucifixo Barroco Folheado a Ouro 18k 5.5cm', 
      category: 'Metais Litúrgicos',
      unitBuy: 'Dúzia',
      unitStock: 'unidade',
      unitConsume: 'unidade',
      conversionFactor: 12,
      physicalQty: 32,
      reservedQty: 8,
      availableQty: 24,
      avgCost: 48.00,
      status: 'normal'
    },
    { 
      code: 'INS-003', 
      name: 'Fio Cordone Poliamida 210/16 Marrom Franciscano', 
      category: 'Fios & Cordões',
      unitBuy: 'Carretel 500m',
      unitStock: 'metro',
      unitConsume: 'metro',
      conversionFactor: 500,
      physicalQty: 120,
      reservedQty: 45,
      availableQty: 75,
      avgCost: 0.35,
      status: 'warning'
    },
    { 
      code: 'INS-004', 
      name: 'Entremeio Sagrada Família Resinado Ouro 18k', 
      category: 'Metais Litúrgicos',
      unitBuy: 'Pacote 50un',
      unitStock: 'unidade',
      unitConsume: 'unidade',
      conversionFactor: 50,
      physicalQty: 45,
      reservedQty: 12,
      availableQty: 33,
      avgCost: 18.00,
      status: 'normal'
    },
    { 
      code: 'INS-005', 
      name: 'Pérola Barroca Natural de Água Doce 10mm', 
      category: 'Pérolas Naturais',
      unitBuy: 'Fio 40cm',
      unitStock: 'unidade',
      unitConsume: 'unidade',
      conversionFactor: 38,
      physicalQty: 160,
      reservedQty: 30,
      availableQty: 130,
      avgCost: 0.85,
      status: 'normal'
    },
    { 
      code: 'INS-006', 
      name: 'Estojo de Veludo Luxo com Berço Personalizado', 
      category: 'Embalagens',
      unitBuy: 'Caixa 20un',
      unitStock: 'unidade',
      unitConsume: 'unidade',
      conversionFactor: 20,
      physicalQty: 22,
      reservedQty: 15,
      availableQty: 7,
      avgCost: 8.50,
      status: 'warning'
    },
  ]);

  const showToast = (type: 'success' | 'info' | 'error', title: string, desc: string) => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Global mousemove spotlight tracking for .flashlight-card in Light Mode
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll<HTMLElement>('.flashlight-card');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Subtle Golden Stardust Canvas (light theme)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Array<{ x: number; y: number; radius: number; vx: number; vy: number; alpha: number }> = [];

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 1.5 + 0.6,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.35 + 0.15
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 160, 57, ${p.alpha})`;
        ctx.fill();

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(212, 160, 57, ${0.08 * (1 - dist / 90)})`;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Compute Scientific Pricing Formula
  const modelSpecs = {
    noiva: { name: 'Terço de Noiva Luxo (59 Contas Cristal + Strass)', beads: 59, wire: 2.4, packaging: 8.50 },
    tradicional: { name: 'Terço Mariano Tradicional (59 Contas)', beads: 59, wire: 1.8, packaging: 5.00 },
    dezena: { name: 'Dezena Automotiva / Lembrança (11 Contas)', beads: 11, wire: 0.6, packaging: 3.50 },
    sacerdotal: { name: 'Terço Sacerdotal Hematita Nobre (59 Contas)', beads: 59, wire: 2.0, packaging: 8.50 },
  };

  const beadCosts = {
    cristal: { name: 'Cristal Checo 8mm', cost: 0.45 },
    perola: { name: 'Pérola Barroca 10mm', cost: 0.85 },
    madeira: { name: 'Madeira Imbuia 8mm', cost: 0.22 },
    hematita: { name: 'Pedra Natural Hematita 8mm', cost: 0.55 },
  };

  const metalCosts = {
    folheado18k: { name: 'Crucifixo Barroco e Entremeio Folheado Ouro 18k', cost: 66.00 },
    envelhecido: { name: 'Conjunto Ouro Envelhecido Italiano', cost: 16.50 },
    prata925: { name: 'Crucifixo Prata de Lei 925 com Banho Protetor', cost: 72.00 },
    niquel: { name: 'Conjunto Níquel Básico Resinado', cost: 7.20 },
  };

  const currentModelSpec = modelSpecs[calcModel];
  const currentBeadSpec = beadCosts[calcBead];
  const currentMetalSpec = metalCosts[calcMetal];

  // Raw Materials Cost
  const rawBeadsCost = currentModelSpec.beads * currentBeadSpec.cost;
  const rawWireCost = currentModelSpec.wire * 2.50; // R$ 2,50/metro
  const rawMaterialsTotal = rawBeadsCost + currentMetalSpec.cost + rawWireCost;

  // Technical Loss (2% de perda sem duplicar saídas físicas)
  const lossAmount = rawMaterialsTotal * (calcLossPct / 100);
  const materialsWithLoss = rawMaterialsTotal + lossAmount;

  // Labor Cost
  const laborCost = calcLaborHours * calcHourRate;

  // Total Manufacturing Cost
  const totalMfgCost = materialsWithLoss + laborCost + currentModelSpec.packaging;

  // Scientific Pricing Formula: Preço de Venda = Custo / (1 - taxas - margem)
  const denominator = 1 - (calcTaxPct / 100) - (calcMargin / 100);
  const validDenominator = denominator > 0.05 ? denominator : 0.05;
  const suggestedPrice = totalMfgCost / validDenominator;
  const netProfit = suggestedPrice * (calcMargin / 100);
  const commercialTaxes = suggestedPrice * (calcTaxPct / 100);

  // Kanban Handlers
  const moveKanban = (id: string, currentStep: number) => {
    if (currentStep >= 4) return;
    setKanbanItems(prev => prev.map(item => item.id === id ? { ...item, step: currentStep + 1 } : item));
    showToast('success', 'Chão de Fábrica Atualizado', 'A ordem avançou na bancada e atualizou a alocação de insumos!');
  };

  const handleAddNewKanban = () => {
    const newId = String(Date.now());
    const nextCode = `#PED-${Math.floor(110 + Math.random() * 890)}`;
    setKanbanItems(prev => [
      {
        id: newId,
        code: nextCode,
        title: 'Terço Mariano Pérolas Barrocas',
        client: 'Encomenda Balcão Ateliê',
        price: 215,
        step: 1,
        tag: 'Insumos Reservados',
        tagColor: 'text-blue-700 bg-blue-50 font-bold'
      },
      ...prev
    ]);
    showToast('success', 'Pedido Criado no Chão de Fábrica', 'Materiais reservados no estoque físico e ordem aberta.');
  };

  // Inventory Save Handler
  const handleSaveNewSupply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplyName.trim()) {
      showToast('error', 'Nome Obrigatório', 'Informe o nome do insumo.');
      return;
    }
    const newCode = `INS-00${stockItems.length + 1}`;
    const qty = parseInt(newSupplyQty) || 100;
    const cost = parseFloat(newSupplyPrice) || 0.45;
    setStockItems(prev => [
      {
        code: newCode,
        name: newSupplyName.trim(),
        category: 'Insumo Cadastrado',
        unitBuy: 'Pacote',
        unitStock: 'unidade',
        unitConsume: 'unidade',
        conversionFactor: 100,
        physicalQty: qty,
        reservedQty: 0,
        availableQty: qty,
        avgCost: cost,
        status: 'normal'
      },
      ...prev
    ]);
    setNewSupplyName('');
    setShowNewSupplyModal(false);
    showToast('success', 'Insumo Cadastrado', `${newSupplyName} agora está ativo com custo médio móvel.`);
  };

  const filteredStock = stockItems.filter(item => 
    item.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
    item.category.toLowerCase().includes(stockSearch.toLowerCase()) ||
    item.code.toLowerCase().includes(stockSearch.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#FAF7F2] text-[#2A2420] font-sans selection:bg-amber-500/20 selection:text-amber-950 overflow-x-hidden antialiased">
      
      {/* ================= BACKGROUND STARDUST CANVAS & WARM GLOWS ================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="glow-point -top-24 -left-24 opacity-60" />
        <div className="glow-point top-1/3 -right-32 opacity-40" />
        <div className="glow-point bottom-10 left-1/4 opacity-30" />
        <div className="absolute inset-0 bg-grid pointer-events-none opacity-25" />
      </div>

      {/* Authenticated banner if already logged in */}
      {isAuthenticated && (
        <div className="relative z-50 bg-[#FAF3E7] border-b border-amber-200 text-stone-900 px-4 py-2.5 text-center text-xs font-medium flex items-center justify-center gap-3 shadow-xs">
          <span>Você está conectado ao sistema como <strong>{userName || 'Mestre Artesão'}</strong>.</span>
          <button
            onClick={onOpenApp}
            className="px-3.5 py-1 rounded-full bg-stone-900 text-amber-300 text-[11px] font-bold hover:bg-stone-800 cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5 shadow-xs"
          >
            <span>Voltar ao Painel do ERP</span>
            <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* ================= TOP FLOATING GLASS DOCK (NAVIGATION) ================= */}
      <header className="sticky top-4 z-40 px-4 sm:px-8 max-w-7xl mx-auto">
        <nav className="glass-nav rounded-full px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg transition-all border border-[rgba(42,36,32,0.08)] bg-white/90 backdrop-blur-md">
          
          {/* Brand Emblem */}
          <a href="#hero" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-stone-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M5 8h14" />
                <circle cx="12" cy="8" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-stone-900 flex items-center gap-1.5">
                Ateliê Sagrado
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200/80">ERP Artesanal</span>
              </span>
              <span className="block text-[10px] text-stone-500 tracking-wider uppercase font-mono">Gestão & Produção Devocional</span>
            </div>
          </a>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-medium text-stone-600">
            <a href="#visao-geral" className="hover:text-amber-700 transition-colors">Visão Geral</a>
            <a href="#workspace" className="hover:text-amber-700 transition-colors">ERP Interativo</a>
            <a href="#modulos" className="hover:text-amber-700 transition-colors">Módulos Reais</a>
            <a href="#precificacao" className="hover:text-amber-700 transition-colors">Precificação</a>
            <a href="#fluxo" className="hover:text-amber-700 transition-colors">Fluxo Integrado</a>
            <a href="#planos" className="hover:text-amber-700 transition-colors">Plano & Valores</a>
            <a href="#faq" className="hover:text-amber-700 transition-colors">Dúvidas</a>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <button 
                  onClick={onLogin} 
                  className="text-xs font-semibold text-stone-700 hover:text-amber-700 transition-colors px-3 py-1.5 cursor-pointer"
                >
                  Entrar
                </button>
                <div className="btn-beam-container lz-halo">
                  <div className="beam-border" />
                  <button 
                    onClick={onLogin} 
                    className="btn-beam px-4 sm:px-5 py-2 sm:py-2.5 bg-gold-gradient text-stone-950 font-bold text-xs sm:text-sm tracking-tight flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Abrir o Ateliê ERP</span>
                    <ArrowRight size={14} className="stroke-[2.5]" />
                  </button>
                </div>
              </>
            ) : (
              <button 
                onClick={onOpenApp} 
                className="px-4 py-2 rounded-full bg-gold-gradient text-stone-950 font-bold text-xs tracking-tight shadow-sm hover:brightness-105 cursor-pointer flex items-center gap-2"
              >
                <span>Acessar Meu Painel</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* ================= DOBRA 1: HERO DE ALTO IMPACTO (LIGHT MODE) ================= */}
      <section id="hero" className="relative z-10 pt-14 sm:pt-20 pb-16 px-4 sm:px-8 max-w-7xl mx-auto text-center">
        
        {/* Floating Badges in Clean Light Mode */}
        <div className="lz2-float hidden lg:flex items-center gap-2 absolute left-2 top-28 px-4 py-2 rounded-full bg-white text-stone-900 border border-amber-200/90 font-bold text-xs shadow-md" style={{ ['--r' as any]: '-5deg' }}>
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>✨ Custo Médio Móvel & Perdas Reais</span>
        </div>

        <div className="lz2-float hidden lg:flex items-center gap-2 absolute right-4 top-24 px-4 py-2 rounded-full bg-white text-stone-900 border border-stone-200 font-bold text-xs shadow-md" style={{ ['--r' as any]: '4deg' }}>
          <span>📿 Controle de Físico vs Reservado</span>
        </div>

        <div className="lz2-float hidden lg:flex items-center gap-2 absolute left-6 bottom-16 px-4 py-2 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-xs shadow-md" style={{ ['--r' as any]: '3deg' }}>
          <span>⚡ Orçamento Formal com Envio WhatsApp</span>
        </div>

        <div className="lz2-float hidden lg:flex items-center gap-2 absolute right-8 bottom-20 px-4 py-2 rounded-full bg-amber-50 text-amber-950 border border-amber-200 font-bold text-xs shadow-md" style={{ ['--r' as any]: '-3deg' }}>
          <span>📦 Chão de Fábrica & Kanban da Bancada</span>
        </div>

        {/* Small Header Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-xs font-mono uppercase tracking-wider mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          SISTEMA DE GESTÃO INTEGRADA PARA ATELIÊS SACROS
        </div>

        {/* Main Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-[1.12] mb-6 text-stone-900">
          A Arte Sacra da Criação com a <br />
          <span className="text-gold-gradient font-serif italic">Precisão Exata do ERP.</span>
        </h1>

        <p className="max-w-3xl mx-auto text-base sm:text-lg lg:text-xl text-stone-600 leading-relaxed font-light mb-10">
          O primeiro ERP concebido especificamente para artesãos de terços marianos, de noiva, joias devocionais e produção litúrgica.
          Controle o saldo disponível e reservas de insumos, monte fichas técnicas com perdas reais, precifique com rigor matemático e acompanhe cada peça na bancada sem perda de tempo.
        </p>

        {/* CTAs Cluster */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="btn-beam-container lz-halo">
            <div className="beam-border" />
            <button 
              onClick={isAuthenticated ? onOpenApp : onLogin} 
              className="btn-beam px-7 py-3.5 bg-gold-gradient text-stone-950 font-bold text-base tracking-tight flex items-center gap-2.5 shadow-lg cursor-pointer hover:brightness-105"
            >
              <span>{isAuthenticated ? 'Abrir Meu Painel do ERP' : 'Acessar o ERP'}</span>
              <ArrowRight size={18} className="stroke-[2.5]" />
            </button>
          </div>

          <a 
            href="#workspace" 
            className="px-6 py-3.5 rounded-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-semibold text-sm transition-all hover:scale-105 flex items-center gap-2 shadow-xs"
          >
            <Compass size={16} className="text-amber-600" />
            <span>Explorar o ERP Interativo</span>
          </a>
        </div>

        {/* 4 Feature Highlights */}
        <div className="mt-14 max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-left">
          <div className="p-4 rounded-2xl bg-white border border-[rgba(42,36,32,0.08)] shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center font-bold text-xs shrink-0">✓</div>
            <div className="text-xs">
              <p className="font-bold text-stone-900">3 Unidades de Medida</p>
              <p className="text-[11px] text-stone-500">Compra, Estoque e Consumo</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[rgba(42,36,32,0.08)] shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center font-bold text-xs shrink-0">✓</div>
            <div className="text-xs">
              <p className="font-bold text-stone-900">Custo Médio Ponderado</p>
              <p className="text-[11px] text-stone-500">Móvel a cada compra</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[rgba(42,36,32,0.08)] shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center font-bold text-xs shrink-0">✓</div>
            <div className="text-xs">
              <p className="font-bold text-stone-900">Reserva em Orçamentos</p>
              <p className="text-[11px] text-stone-500">Vira pedido sem duplicar</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[rgba(42,36,32,0.08)] shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center font-bold text-xs shrink-0">✓</div>
            <div className="text-xs">
              <p className="font-bold text-stone-900">Chão de Fábrica Kanban</p>
              <p className="text-[11px] text-stone-500">Consumo real na bancada</p>
            </div>
          </div>
        </div>

        {/* Flagship Hero Visual: Real ERP Dashboard Showcase in Light Mode */}
        <div className="mt-14 max-w-6xl mx-auto rounded-[32px] sm:rounded-[36px] bg-white border border-stone-200/90 shadow-2xl shadow-stone-900/10 overflow-hidden text-left relative transition-all">
          
          {/* Browser / Application Top Window Bar */}
          <div className="h-11 bg-stone-100/90 border-b border-stone-200/90 px-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="hidden sm:inline text-[11px] font-mono text-stone-400 ml-2">Ateliê Sagrado ERP • v2.4</span>
            </div>
            <div className="bg-white px-5 py-1 rounded-full border border-stone-200 text-[11px] font-mono text-stone-600 flex items-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-stone-400">https://</span>
              <strong className="text-stone-800">app.ateliesagrado.com.br</strong>
              <span className="text-stone-400">/painel</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
              <span>● Ambiente Ativo</span>
            </div>
          </div>

          {/* Full-Scale Real ERP Dashboard Layout */}
          <div className="flex flex-col lg:flex-row min-h-[640px] bg-[#FAF7F2]/50">
            
            {/* Authentic ERP Sidebar (Left Desktop Rail) */}
            <aside className="hidden lg:flex w-60 bg-white border-r border-stone-200/80 p-4 flex-col justify-between shrink-0">
              <div className="space-y-4">
                {/* Atelier Brand Header */}
                <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
                  <div className="w-8 h-8 rounded-xl bg-gold-gradient flex items-center justify-center text-stone-950 font-bold shadow-2xs shrink-0">
                    ✝
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-serif font-bold text-xs text-stone-900 truncate">Ateliê Mater Dei</h4>
                    <span className="text-[9.5px] uppercase font-mono text-amber-700 font-semibold block">Unidade Matriz</span>
                  </div>
                </div>

                {/* Sidebar Menu Items */}
                <nav className="space-y-1 text-xs">
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-950 font-bold border border-amber-200/80 shadow-2xs">
                    <Layers size={14} className="text-amber-700" />
                    <span>Início (Dashboard)</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors">
                    <Package size={14} className="text-stone-400" />
                    <span>Estoque de Insumos</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors">
                    <Boxes size={14} className="text-stone-400" />
                    <span>Compras Necessárias</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors">
                    <Sparkles size={14} className="text-stone-400" />
                    <span>Produtos (Composição)</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors">
                    <Calculator size={14} className="text-stone-400" />
                    <span>Motor de Precificação</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors">
                    <Users size={14} className="text-stone-400" />
                    <span>Gestão de Clientes</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors">
                    <FileText size={14} className="text-stone-400" />
                    <span>Orçamentos</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors">
                    <ShoppingCart size={14} className="text-stone-400" />
                    <span>Pedidos de Venda</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors">
                    <Hammer size={14} className="text-stone-400" />
                    <span>Chão de Fábrica</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors">
                    <TrendingUp size={14} className="text-stone-400" />
                    <span>Fluxo Financeiro</span>
                  </div>
                </nav>
              </div>

              {/* Sidebar Footer Profile */}
              <div className="pt-3 border-t border-stone-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center font-mono border border-amber-200">
                  IC
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-800 truncate">Irmã Clara M.</p>
                  <p className="text-[10px] text-stone-400 font-mono truncate">Artesã Chefe</p>
                </div>
              </div>
            </aside>

            {/* Dashboard Main Content Body */}
            <div className="flex-1 p-5 sm:p-7 space-y-5 overflow-hidden">
              
              {/* Top Navigation Bar of the ERP */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm text-stone-900">Painel Executivo</span>
                  <span className="text-stone-300">/</span>
                  <span className="text-xs text-amber-800 font-medium">Visão Geral Consolidada</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-400">
                    <Search size={13} />
                    <span>Pesquisar...</span>
                    <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-stone-200 text-stone-500 font-bold">Ctrl K</kbd>
                  </div>
                  <div className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5">
                    <Clock size={12} className="text-emerald-600" />
                    <span>15 dias restantes</span>
                  </div>
                </div>
              </div>

              {/* Smart Greeting & Action Banner (Matching DashboardHeader.tsx) */}
              <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      Salve Maria! Muito bom dia
                    </span>
                    <span className="text-[10.5px] font-mono text-stone-400">
                      Outubro de 2026
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-stone-900">
                    Ateliê Sagrado — Gestão & Produção
                  </h3>
                  <p className="text-xs text-stone-500">
                    Acompanhe em tempo real: <strong className="text-amber-800 font-semibold font-mono">18</strong> pedidos em produção e <strong className="text-amber-800 font-semibold font-mono">4</strong> entregas para hoje.
                  </p>
                </div>

                {/* Quick Action Button Cluster */}
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setActiveTab('kanban')}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <ShoppingCart size={13} className="text-amber-700" />
                    <span>Novo Pedido</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('orcamentos')}
                    className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FileText size={13} className="text-stone-500" />
                    <span>Novo Orçamento</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('estoque')}
                    className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Package size={13} className="text-stone-500" />
                    <span>Novo Insumo</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('precificacao')}
                    className="px-3 py-1.5 bg-gold-gradient text-stone-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:brightness-105"
                  >
                    <Calculator size={13} />
                    <span>Precificação</span>
                  </button>
                </div>
              </div>

              {/* 4 Authentic Flashlight KPI Cards in Light Mode */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="flashlight-card p-4 bg-white border border-stone-200/90 rounded-2xl shadow-xs group">
                  <div className="flashlight-border" />
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-1 relative z-10 font-mono">
                    <span className="uppercase text-[10px] font-bold">Faturamento Bruto</span>
                    <span className="text-emerald-700 font-bold">+24.5%</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-amber-800 relative z-10">R$ 14.850<span className="text-xs font-normal text-stone-400">,00</span></div>
                  <div className="text-[10px] text-stone-500 mt-1 relative z-10">82% da meta de R$ 18.000</div>
                  <div className="w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden relative z-10">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '82%' }} />
                  </div>
                </div>

                <div className="flashlight-card p-4 bg-white border border-stone-200/90 rounded-2xl shadow-xs group">
                  <div className="flashlight-border" />
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-1 relative z-10 font-mono">
                    <span className="uppercase text-[10px] font-bold">Na Bancada</span>
                    <span className="text-amber-800 font-bold">18 Ordens</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-stone-900 relative z-10">54 Peças</div>
                  <div className="text-[10px] text-stone-500 mt-1 relative z-10">6 aguardam crucifixo</div>
                  <div className="w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden relative z-10">
                    <div className="bg-amber-600 h-full rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>

                <div className="flashlight-card p-4 bg-white border border-stone-200/90 rounded-2xl shadow-xs group">
                  <div className="flashlight-border" />
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-1 relative z-10 font-mono">
                    <span className="uppercase text-[10px] font-bold">Lucro Médio / Peça</span>
                    <span className="text-emerald-700 font-bold">68.2%</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 relative z-10">R$ 62<span className="text-xs font-normal text-stone-400">,80</span></div>
                  <div className="text-[10px] text-stone-500 mt-1 relative z-10">Margem líquida assegurada</div>
                  <div className="w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden relative z-10">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>

                <div className="flashlight-card p-4 bg-white border border-stone-200/90 rounded-2xl shadow-xs group">
                  <div className="flashlight-border" />
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-1 relative z-10 font-mono">
                    <span className="uppercase text-[10px] font-bold">Saldo em Caixa</span>
                    <span className="text-amber-800 font-bold">Tesouraria</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-stone-900 relative z-10">R$ 11.430<span className="text-xs font-normal text-stone-400">,00</span></div>
                  <div className="text-[10px] text-stone-500 mt-1 relative z-10">Disponibilidade imediata</div>
                  <div className="w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden relative z-10">
                    <div className="bg-stone-700 h-full rounded-full" style={{ width: '90%' }} />
                  </div>
                </div>
              </div>

              {/* Split Operational Area: Production Queue & Financial Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Left 7 Cols: Chão de Fábrica Priority Table */}
                <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                      <h4 className="font-serif font-bold text-sm text-stone-900">Chão de Fábrica — Ordens em Execução</h4>
                    </div>
                    <span className="text-[10px] font-mono text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Bancada Ativa
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-100 text-stone-400 font-mono uppercase text-[9.5px]">
                          <th className="pb-2">ORDEM</th>
                          <th className="pb-2">CLIENTE</th>
                          <th className="pb-2">MODELO DE ARTIGO</th>
                          <th className="pb-2">VALOR</th>
                          <th className="pb-2">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-medium">
                        <tr>
                          <td className="py-2.5 font-mono font-bold text-amber-800">#PED-104</td>
                          <td className="text-stone-900 font-semibold">Noiva Maria Eduarda</td>
                          <td className="text-stone-600">Terço Noiva Cristal 10mm</td>
                          <td className="font-mono font-bold text-stone-900">R$ 380,00</td>
                          <td><span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[9.5px] font-bold">Montagem</span></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-mono font-bold text-amber-800">#PED-105</td>
                          <td className="text-stone-900 font-semibold">Paróquia N. Sra. Carmo</td>
                          <td className="text-stone-600">25 Dezenas Crisma Imbuia</td>
                          <td className="font-mono font-bold text-stone-900">R$ 625,00</td>
                          <td><span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[9.5px] font-bold">Separando</span></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-mono font-bold text-amber-800">#PED-106</td>
                          <td className="text-stone-900 font-semibold">Pe. Gabriel Rezende</td>
                          <td className="text-stone-600">Terço Hematita Cruz Prata</td>
                          <td className="font-mono font-bold text-stone-900">R$ 290,00</td>
                          <td><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[9.5px] font-bold">Finalizado</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right 5 Cols: Financial & Stock Health Summary */}
                <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                      <h4 className="font-serif font-bold text-sm text-stone-900">Saúde do Estoque & Reposição</h4>
                      <span className="text-[10px] font-mono font-bold text-stone-500">3 Unidades</span>
                    </div>

                    <div className="space-y-2.5 mt-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-rose-950 font-serif">Cristal Checo 8mm Aurora</p>
                          <p className="text-[10.5px] text-rose-800 font-mono">Físico: 240 un • Reservado: 180 un</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono font-bold text-[10px]">
                          Disponível: 60 un
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-amber-950 font-serif">Fio Cordone Poliamida 210</p>
                          <p className="text-[10.5px] text-amber-800 font-mono">Físico: 120m • Reservado: 45m</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold text-[10px]">
                          Disponível: 75m
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-emerald-950 font-serif">Crucifixo Barroco Ouro 18k</p>
                          <p className="text-[10.5px] text-emerald-800 font-mono">Físico: 32 un • Reservado: 8 un</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px]">
                          Disponível: 24 un
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-medium">Contas a Receber (Vendas Aprovadas):</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">R$ 4.280,00</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ================= DOBRA 2: MÉTRICAS & PROVA SOCIAL (MARQUEE) ================= */}
      <section id="visao-geral" className="relative z-10 py-12 border-y border-stone-200/90 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl sm:text-5xl font-extrabold text-amber-700 font-mono tracking-tight tabular-nums">+28.400</div>
              <div className="text-xs sm:text-sm text-stone-600 mt-1 font-medium">Terços e Artigos Confeccionados</div>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-extrabold text-amber-700 font-mono tracking-tight tabular-nums">100%</div>
              <div className="text-xs sm:text-sm text-stone-600 mt-1 font-medium">Fórmulas com Custo Médio e Perdas</div>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-extrabold text-amber-700 font-mono tracking-tight tabular-nums">R$ 1.8M+</div>
              <div className="text-xs sm:text-sm text-stone-600 mt-1 font-medium">Faturados com Margem Assegurada</div>
            </div>
            <div>
              <div className="text-3xl sm:text-5xl font-extrabold text-amber-700 font-mono tracking-tight tabular-nums">15 seg</div>
              <div className="text-xs sm:text-sm text-stone-600 mt-1 font-medium">Emissão de Proposta com Reserva</div>
            </div>
          </div>
        </div>

        {/* Proof Marquee */}
        <div className="overflow-hidden marquee-mask">
          <div className="lz2-proof-scroll">
            <div className="lz2-proof-row">
              
              <div className="w-64 h-36 rounded-2xl overflow-hidden relative border border-stone-200 group shrink-0 bg-stone-100 shadow-xs">
                <img 
                  src="https://images.unsplash.com/photo-1599351431202-1e0f013789da?w=500&auto=format&fit=crop&q=60" 
                  alt="Bancada de montagem de terço artesanal" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent p-3 flex flex-col justify-end">
                  <span className="text-xs font-bold text-white">Bancada de Montagem</span>
                  <span className="text-[10px] text-stone-200">Contas de Cristal 8mm Checo</span>
                </div>
              </div>

              <div className="w-64 h-36 rounded-2xl overflow-hidden relative border border-stone-200 group shrink-0 bg-stone-100 shadow-xs">
                <img 
                  src="https://images.unsplash.com/photo-1621605815971-fbc98d6650a6?w=500&auto=format&fit=crop&q=60" 
                  alt="Crucifixos folheados a ouro 18k" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent p-3 flex flex-col justify-end">
                  <span className="text-xs font-bold text-white">Metais Nobres & Crucifixos</span>
                  <span className="text-[10px] text-stone-200">Banho Ouro 18k e Verniz Cataforético</span>
                </div>
              </div>

              <div className="w-64 h-36 rounded-2xl overflow-hidden relative border border-stone-200 group shrink-0 bg-stone-100 shadow-xs">
                <img 
                  src="https://images.unsplash.com/photo-1557862921-37829c790f19?w=500&auto=format&fit=crop&q=60" 
                  alt="Mestre artesão em produção" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent p-3 flex flex-col justify-end">
                  <span className="text-xs font-bold text-white">Ateliê Mater Dei</span>
                  <span className="text-[10px] text-stone-200">+420 terços entregues este ano</span>
                </div>
              </div>

              <div className="w-64 h-36 rounded-2xl overflow-hidden relative border border-stone-200 group shrink-0 bg-stone-100 shadow-xs">
                <img 
                  src="https://images.unsplash.com/photo-1600180758890-6b94519a8b13?w=500&auto=format&fit=crop&q=60" 
                  alt="Ferramental de precisão" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent p-3 flex flex-col justify-end">
                  <span className="text-xs font-bold text-white">Ferramentaria & Fios</span>
                  <span className="text-[10px] text-stone-200">Cordone 210/16 e alicates especiais</span>
                </div>
              </div>

              <div className="w-64 h-36 rounded-2xl overflow-hidden relative border border-stone-200 group shrink-0 bg-stone-100 shadow-xs">
                <img 
                  src="https://images.unsplash.com/photo-1597116648852-75764ecaf60a?w=500&auto=format&fit=crop&q=60" 
                  alt="Terço para Noivas de Alta Joalheria" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent p-3 flex flex-col justify-end">
                  <span className="text-xs font-bold text-white">Terço para Noivas</span>
                  <span className="text-[10px] text-stone-200">Orçamento formal e aprovação rápida</span>
                </div>
              </div>

            </div>

            {/* Loop Duplication */}
            <div className="lz2-proof-row" aria-hidden="true">
              <div className="w-64 h-36 rounded-2xl overflow-hidden relative border border-stone-200 group shrink-0 bg-stone-100 shadow-xs">
                <img 
                  src="https://images.unsplash.com/photo-1599351431202-1e0f013789da?w=500&auto=format&fit=crop&q=60" 
                  alt="Bancada de montagem" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent p-3 flex flex-col justify-end">
                  <span className="text-xs font-bold text-white">Bancada de Montagem</span>
                  <span className="text-[10px] text-stone-200">Contas de Cristal 8mm Checo</span>
                </div>
              </div>
              <div className="w-64 h-36 rounded-2xl overflow-hidden relative border border-stone-200 group shrink-0 bg-stone-100 shadow-xs">
                <img 
                  src="https://images.unsplash.com/photo-1621605815971-fbc98d6650a6?w=500&auto=format&fit=crop&q=60" 
                  alt="Crucifixos folheados" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent p-3 flex flex-col justify-end">
                  <span className="text-xs font-bold text-white">Metais Nobres & Crucifixos</span>
                  <span className="text-[10px] text-stone-200">Banho Ouro 18k e Verniz Cataforético</span>
                </div>
              </div>
              <div className="w-64 h-36 rounded-2xl overflow-hidden relative border border-stone-200 group shrink-0 bg-stone-100 shadow-xs">
                <img 
                  src="https://images.unsplash.com/photo-1557862921-37829c790f19?w=500&auto=format&fit=crop&q=60" 
                  alt="Mestre artesão" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent p-3 flex flex-col justify-end">
                  <span className="text-xs font-bold text-white">Ateliê Mater Dei</span>
                  <span className="text-[10px] text-stone-200">+420 terços entregues este ano</span>
                </div>
              </div>
              <div className="w-64 h-36 rounded-2xl overflow-hidden relative border border-stone-200 group shrink-0 bg-stone-100 shadow-xs">
                <img 
                  src="https://images.unsplash.com/photo-1600180758890-6b94519a8b13?w=500&auto=format&fit=crop&q=60" 
                  alt="Ferramentas" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent p-3 flex flex-col justify-end">
                  <span className="text-xs font-bold text-white">Ferramentaria & Fios</span>
                  <span className="text-[10px] text-stone-200">Cordone 210/16 e alicates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= DOBRA 3: WORKSPACE ERP VIVO & FUNCIONAL (TELAS REAIS) ================= */}
      <section id="workspace" className="relative z-10 py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-xs font-mono uppercase tracking-wider mb-3">
            Interface Real & Interativa
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-stone-900">
            Experimente os Módulos do ERP <br /><span className="text-gold-gradient italic">Exatamente Como São.</span>
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-3">
            Navegue pelas abas da demonstração real abaixo. Teste o controle de insumos com 3 unidades, a fórmula de terço com perdas, o motor de precificação e o Kanban de bancada.
          </p>
        </div>

        {/* ERP Interactive Shell Container in 100% Light Mode */}
        <div className="bg-white rounded-[32px] sm:rounded-[36px] beautiful-shadow overflow-hidden border border-stone-200 flex flex-col lg:flex-row min-h-[760px] relative">
          
          {/* SIDEBAR DA DEMONSTRAÇÃO (Tree Navigation) */}
          <aside className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-stone-200 p-5 flex flex-col justify-between shrink-0">
            
            <div>
              {/* Account Header */}
              <div className="relative mb-6">
                <button 
                  type="button" 
                  onClick={() => setShowAccountMenu(!showAccountMenu)} 
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF7F2] border border-stone-200 hover:border-amber-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center text-stone-950 font-bold text-sm shadow-xs">
                      ✝
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-stone-900">Irmã Clara M.</div>
                      <div className="text-[10px] text-amber-700 font-mono">Ateliê Mater Dei</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className={`text-stone-400 transition-transform ${showAccountMenu ? 'rotate-90' : ''}`} />
                </button>

                {showAccountMenu && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white border border-stone-200 rounded-2xl shadow-xl z-30 text-xs">
                    <div className="pb-2 mb-2 border-b border-stone-100">
                      <p className="font-bold text-stone-800">Unidades do Ateliê</p>
                      <p className="text-[10px] text-stone-400 font-mono">contato@atelie.org</p>
                    </div>
                    <button 
                      className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-stone-50 text-stone-700 flex items-center gap-2 cursor-pointer" 
                      onClick={() => {
                        setShowAccountMenu(false);
                        showToast('info', 'Unidade Alternada', 'Você está agora na filial Basílica Central');
                      }}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Basílica Central
                    </button>
                    <button 
                      className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-stone-50 text-stone-700 flex items-center gap-2 cursor-pointer" 
                      onClick={() => {
                        setShowAccountMenu(false);
                        showToast('info', 'Unidade Alternada', 'Você está na filial Ateliê Matriz');
                      }}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ateliê Matriz
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1">
                <button 
                  type="button" 
                  onClick={() => setActiveTab('dashboard')} 
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all text-left cursor-pointer ${
                    activeTab === 'dashboard' 
                      ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200/90 shadow-2xs' 
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <Layers size={16} className={activeTab === 'dashboard' ? 'text-amber-700' : 'text-stone-400'} />
                  <span>Painel Executivo</span>
                </button>

                {/* Subgroup: Produção & Estoque */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-stone-400 font-semibold text-[10.5px] uppercase font-mono tracking-wider">
                    <span>Módulos Operacionais</span>
                  </div>
                  
                  <div className="relative ml-4 pl-3 pt-1 space-y-1">
                    <div className="tree-vertical" />
                    
                    {/* Estoque */}
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('estoque')} 
                      className={`relative w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs transition-colors text-left cursor-pointer ${
                        activeTab === 'estoque' 
                          ? 'text-amber-800 font-bold' 
                          : 'text-stone-600 hover:text-amber-700'
                      }`}
                    >
                      <div className="tree-line" />
                      <span>Estoque & Reservas</span>
                    </button>

                    {/* Produtos / Fórmulas */}
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('produtos')} 
                      className={`relative w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs transition-colors text-left cursor-pointer ${
                        activeTab === 'produtos' 
                          ? 'text-amber-800 font-bold' 
                          : 'text-stone-600 hover:text-amber-700'
                      }`}
                    >
                      <div className="tree-line" />
                      <span>Ficha Técnica do Terço</span>
                    </button>

                    {/* Precificação */}
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('precificacao')} 
                      className={`relative w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs transition-colors text-left cursor-pointer ${
                        activeTab === 'precificacao' 
                          ? 'text-amber-800 font-bold' 
                          : 'text-stone-600 hover:text-amber-700'
                      }`}
                    >
                      <div className="tree-line" />
                      <span>Motor de Precificação</span>
                      <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold">FÓRMULA</span>
                    </button>

                    {/* Chão de Fábrica */}
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('kanban')} 
                      className={`relative w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs transition-colors text-left cursor-pointer ${
                        activeTab === 'kanban' 
                          ? 'text-amber-800 font-bold' 
                          : 'text-stone-600 hover:text-amber-700'
                      }`}
                    >
                      <div className="tree-line" />
                      <span>Chão de Fábrica (Kanban)</span>
                    </button>
                  </div>
                </div>

                {/* Subgroup: Vendas & Propostas */}
                <button 
                  type="button" 
                  onClick={() => setActiveTab('orcamentos')} 
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all text-left cursor-pointer mt-2 ${
                    activeTab === 'orcamentos' 
                      ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200/90 shadow-2xs' 
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <DollarSign size={16} className={activeTab === 'orcamentos' ? 'text-amber-700' : 'text-stone-400'} />
                  <span>Orçamentos & WhatsApp</span>
                </button>
              </nav>
            </div>

            {/* Sidebar Footer Action */}
            <div className="pt-4 border-t border-stone-200">
              <button 
                type="button" 
                onClick={() => setShowNewSupplyModal(true)} 
                className="w-full py-2.5 px-3 rounded-xl bg-gold-gradient text-stone-950 font-bold text-xs flex items-center justify-center gap-2 hover:brightness-105 shadow-xs cursor-pointer transition-transform active:scale-95"
              >
                <Plus size={16} className="stroke-[2.5]" />
                <span>+ Novo Insumo no Estoque</span>
              </button>
            </div>
          </aside>

          {/* MAIN VIEWPORT CONTENT (100% LIGHT MODE) */}
          <main className="flex-1 p-5 sm:p-8 overflow-y-auto max-h-[760px] bg-[#FAF7F2]/40">

            {/* TAB 1: PAINEL EXECUTIVO */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">Painel Executivo do Ateliê</h3>
                    <p className="text-xs text-stone-500">Mês Vigente • Visão Consolidada de Faturamento, Produção e Estoque</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sincronizado
                    </span>
                    <button 
                      onClick={() => showToast('success', 'Dados Atualizados', 'Todos os módulos foram recalculados com sucesso.')} 
                      className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <RotateCcw size={12} />
                      <span>Recalcular</span>
                    </button>
                  </div>
                </div>

                {/* 4 Flashlight KPI Cards in Light Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flashlight-card p-5 group">
                    <div className="flashlight-border" />
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                      <span>Faturamento Bruto</span>
                      <span className="text-emerald-700 font-mono font-bold">+24.5%</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-amber-700">R$ 14.850<span className="text-sm font-normal text-stone-500">,00</span></div>
                    <div className="text-[11px] text-stone-500 mt-2">Meta de R$ 18.000 (82% atingido)</div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '82%' }} />
                    </div>
                  </div>

                  <div className="flashlight-card p-5 group">
                    <div className="flashlight-border" />
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                      <span>Terços em Confecção</span>
                      <span className="text-amber-800 font-mono font-bold">18 Ordens</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-stone-900">54 Peças</div>
                    <div className="text-[11px] text-stone-500 mt-2">6 aguardam crucifixo folheado</div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-amber-600 h-full rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>

                  <div className="flashlight-card p-5 group">
                    <div className="flashlight-border" />
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                      <span>Lucro Líquido Médio</span>
                      <span className="text-emerald-700 font-mono font-bold">68.2%</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-700">R$ 62<span className="text-sm font-normal text-stone-500">,80</span></div>
                    <div className="text-[11px] text-stone-500 mt-2">Margem líquida livre de insumos</div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>

                  <div className="flashlight-card p-5 group">
                    <div className="flashlight-border" />
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                      <span>Reposição de Insumos</span>
                      <span className="text-rose-700 font-mono font-bold">2 Itens</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-rose-700">Atenção</div>
                    <div className="text-[11px] text-stone-500 mt-2">Cristal 8mm + Fio 210 baixos</div>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: '88%' }} />
                    </div>
                  </div>
                </div>

                {/* Priority Production Table */}
                <div className="flashlight-card p-5">
                  <div className="flashlight-border" />
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                      <h4 className="font-serif font-bold text-base text-stone-900">Fila Prioritária de Encomendas de Noiva & Batismo</h4>
                    </div>
                    <button onClick={() => setActiveTab('kanban')} className="text-xs text-amber-800 font-bold hover:underline cursor-pointer">
                      Ver Kanban Completo da Bancada →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 text-stone-400 font-mono">
                          <th className="pb-2">PEDIDO</th>
                          <th className="pb-2">CLIENTE / DESTINATÁRIO</th>
                          <th className="pb-2">MODELO DE TERÇO</th>
                          <th className="pb-2">PRAZO</th>
                          <th className="pb-2">VALOR</th>
                          <th className="pb-2">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-medium">
                        <tr>
                          <td className="py-3 font-mono text-amber-800 font-bold">#PED-104</td>
                          <td className="py-3">Noiva Maria Eduarda Costa</td>
                          <td className="py-3 text-stone-700">Terço de Noiva Cristal Checo 10mm com Strass</td>
                          <td className="py-3 text-amber-700 font-mono">12/Nov (Em 3 dias)</td>
                          <td className="py-3 font-mono font-bold">R$ 380,00</td>
                          <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold">Na Bancada de Montagem</span></td>
                        </tr>
                        <tr>
                          <td className="py-3 font-mono text-amber-800 font-bold">#PED-105</td>
                          <td className="py-3">Paróquia N. Sra. do Carmo</td>
                          <td className="py-3 text-stone-700">25 Dezenas de Crisma Madeira Imbuia</td>
                          <td className="py-3 font-mono text-stone-600">18/Nov</td>
                          <td className="py-3 font-mono font-bold">R$ 625,00</td>
                          <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold">Insumos Separados</span></td>
                        </tr>
                        <tr>
                          <td className="py-3 font-mono text-amber-800 font-bold">#PED-106</td>
                          <td className="py-3">Pe. Gabriel Rezende</td>
                          <td className="py-3 text-stone-700">Terço Sacerdotal Hematita 8mm Cruz Prata 925</td>
                          <td className="py-3 text-emerald-700 font-mono">20/Nov</td>
                          <td className="py-3 font-mono font-bold">R$ 290,00</td>
                          <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">Pronto para Envio</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: ESTOQUE DE INSUMOS COM 3 UNIDADES DE MEDIDA & RESERVAS */}
            {activeTab === 'estoque' && (
              <div className="space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">Estoque Inteligente de Insumos</h3>
                    <p className="text-xs text-stone-500">Controle com 3 Unidades (Compra, Estoque, Consumo), Custo Médio Móvel e Separação de Reservas.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
                      <input 
                        type="text" 
                        value={stockSearch} 
                        onChange={(e) => setStockSearch(e.target.value)} 
                        placeholder="Buscar cristal, cruz, fio..." 
                        className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-900 text-xs w-56 focus:border-amber-500 focus:outline-none shadow-2xs" 
                      />
                    </div>
                    <button 
                      onClick={() => setShowNewSupplyModal(true)} 
                      className="px-3.5 py-1.5 rounded-xl bg-gold-gradient text-stone-950 text-xs font-bold hover:brightness-105 transition cursor-pointer shadow-xs"
                    >
                      + Novo Insumo
                    </button>
                  </div>
                </div>

                {/* Info Callout: 3 Units Rule */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">ℹ</div>
                  <div className="text-stone-700 leading-relaxed">
                    <strong>Regra de Reserva e Custeio:</strong> O <em>Saldo Disponível</em> é igual ao <em>Estoque Físico</em> menos as <em>Quantidades Reservadas</em> em orçamentos e pedidos. Retiradas físicas ou cancelamentos respeitam rigorosamente a trava de reserva para nunca gerar encomendas sem material.
                  </div>
                </div>

                {/* Inventory Table */}
                <div className="flashlight-card p-5 overflow-hidden">
                  <div className="flashlight-border" />
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 text-stone-400 font-mono">
                          <th className="pb-3">CÓDIGO</th>
                          <th className="pb-3">INSUMO / MATERIAL</th>
                          <th className="pb-3">UNID. COMPRA → CONSUMO</th>
                          <th className="pb-3">FÍSICO</th>
                          <th className="pb-3">RESERVADO</th>
                          <th className="pb-3">SALDO DISPONÍVEL</th>
                          <th className="pb-3">CUSTO MÉDIO</th>
                          <th className="pb-3 text-right">AÇÕES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-medium">
                        {filteredStock.map(item => (
                          <tr key={item.code}>
                            <td className="py-3 font-mono text-amber-800 font-bold">{item.code}</td>
                            <td className="py-3">
                              <p className="text-stone-900 font-semibold">{item.name}</p>
                              <span className="text-[10px] text-stone-400">{item.category}</span>
                            </td>
                            <td className="py-3 font-mono text-[11px] text-stone-600">
                              {item.unitBuy} → 1 = {item.conversionFactor} {item.unitConsume}
                            </td>
                            <td className="py-3 font-mono text-stone-700">
                              {item.physicalQty} {item.unitStock}
                            </td>
                            <td className="py-3 font-mono text-amber-800 font-bold">
                              {item.reservedQty} {item.unitStock}
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                                item.availableQty <= 20 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}>
                                {item.availableQty} {item.unitStock}
                              </span>
                            </td>
                            <td className="py-3 font-mono font-bold text-stone-900">
                              R$ {item.avgCost.toFixed(2).replace('.', ',')}
                            </td>
                            <td className="py-3 text-right">
                              <button 
                                onClick={() => showToast('info', 'Ficha Técnica Aberta', `Visualizando histórico e orçamentos vinculados de ${item.name}.`)} 
                                className="text-xs text-amber-800 font-semibold hover:underline cursor-pointer"
                              >
                                Ver Ficha
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: PRODUTOS & COMPOSIÇÃO (FICHA TÉCNICA REAL) */}
            {activeTab === 'produtos' && (
              <div className="space-y-6">
                
                <div className="pb-4 border-b border-stone-200">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">Ficha Técnica & Composição do Produto</h3>
                  <p className="text-xs text-stone-500">Composição real de materiais, tempo de mão de obra x valor-hora e perda técnica sem saídas fictícias.</p>
                </div>

                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded">
                        PROD-001 • ALTA JOALHERIA
                      </span>
                      <h4 className="font-serif text-lg font-bold text-stone-900 mt-1">Terço de Noiva Cristal Checo 10mm Aurora com Strass</h4>
                      <p className="text-xs text-stone-500">Crucifixo Barroco Ouro 18k, Entremeio Sagrada Família, Fio Cordone 210 e Berço de Veludo</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-stone-400 font-mono">CUSTO TOTAL DE FABRICAÇÃO</div>
                      <div className="text-2xl font-bold font-mono text-stone-900">R$ {totalMfgCost.toFixed(2).replace('.', ',')}</div>
                    </div>
                  </div>

                  {/* Components Breakdown Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 text-stone-400 font-mono uppercase text-[10px]">
                          <th className="pb-2">INSUMO CADASTRADO</th>
                          <th className="pb-2">QUANTIDADE UTILIZADA</th>
                          <th className="pb-2">UNID. CONSUMO</th>
                          <th className="pb-2">CUSTO MÉDIO UNIT.</th>
                          <th className="pb-2 text-right">SUBTOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-medium">
                        <tr>
                          <td className="py-2.5 font-semibold text-stone-800">Cristal Checo Lapidado Aurora Boreal 8mm</td>
                          <td className="font-mono">59</td>
                          <td className="font-mono text-stone-500">unidade</td>
                          <td className="font-mono">R$ 0,45</td>
                          <td className="font-mono text-right font-bold text-stone-900">R$ 26,55</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold text-stone-800">Crucifixo Barroco Folheado a Ouro 18k 5.5cm</td>
                          <td className="font-mono">1</td>
                          <td className="font-mono text-stone-500">unidade</td>
                          <td className="font-mono">R$ 48,00</td>
                          <td className="font-mono text-right font-bold text-stone-900">R$ 48,00</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold text-stone-800">Entremeio Sagrada Família Resinado Ouro 18k</td>
                          <td className="font-mono">1</td>
                          <td className="font-mono text-stone-500">unidade</td>
                          <td className="font-mono">R$ 18,00</td>
                          <td className="font-mono text-right font-bold text-stone-900">R$ 18,00</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold text-stone-800">Fio Cordone Poliamida 210/16 Marrom Franciscano</td>
                          <td className="font-mono">2.4</td>
                          <td className="font-mono text-stone-500">metro</td>
                          <td className="font-mono">R$ 2,50 /m</td>
                          <td className="font-mono text-right font-bold text-stone-900">R$ 6,00</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold text-stone-800">Estojo de Veludo com Gravação em Berço</td>
                          <td className="font-mono">1</td>
                          <td className="font-mono text-stone-500">unidade</td>
                          <td className="font-mono">R$ 8,50</td>
                          <td className="font-mono text-right font-bold text-stone-900">R$ 8,50</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Labor & Loss Addition Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-100 bg-[#FAF7F2] p-4 rounded-xl text-xs">
                    <div>
                      <span className="text-stone-500 font-mono uppercase text-[10px]">Perda Técnica Planejada (2%)</span>
                      <p className="font-bold text-stone-900 font-mono mt-0.5">+ R$ {lossAmount.toFixed(2).replace('.', ',')}</p>
                      <span className="text-[10px] text-stone-400">Desperdício real sem saídas fictícias</span>
                    </div>
                    <div>
                      <span className="text-stone-500 font-mono uppercase text-[10px]">Mão de Obra do Artesão</span>
                      <p className="font-bold text-stone-900 font-mono mt-0.5">1.5h × R$ 25,00/h = R$ 37,50</p>
                      <span className="text-[10px] text-stone-400">Valor-hora configurado no Ateliê</span>
                    </div>
                    <div>
                      <span className="text-stone-500 font-mono uppercase text-[10px]">Custo Total de Fabricação</span>
                      <p className="font-bold text-amber-800 font-mono text-base mt-0.5">R$ {totalMfgCost.toFixed(2).replace('.', ',')}</p>
                      <span className="text-[10px] text-stone-400">Base exata para precificação</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: MOTOR CIENTÍFICO DE PRECIFICAÇÃO */}
            {activeTab === 'precificacao' && (
              <div id="precificacao" className="space-y-6">
                
                <div className="pb-4 border-b border-stone-200">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
                    Motor Científico de Precificação
                    <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">Fórmula Automática</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Fórmula oficial: <code>Preço de Venda = Custo de Fabricação ÷ (1 − Taxas Comerciais − Margem Desejada)</code>.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Controls */}
                  <div className="lg:col-span-7 space-y-5 flashlight-card p-5 sm:p-6">
                    <div className="flashlight-border" />

                    <div>
                      <label className="block text-xs font-mono uppercase text-stone-500 mb-2">1. Modelo do Artigo Devocional</label>
                      <select 
                        value={calcModel} 
                        onChange={(e) => setCalcModel(e.target.value as any)} 
                        className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:border-amber-500 focus:outline-none transition"
                      >
                        <option value="noiva">Terço de Noiva Especial Luxo (59 Contas Cristal + Strass)</option>
                        <option value="tradicional">Terço Mariano Tradicional (59 Contas)</option>
                        <option value="dezena">Dezena Automotiva / Lembrança (11 Contas)</option>
                        <option value="sacerdotal">Terço Sacerdotal Nobre (59 Contas Hematita)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono uppercase text-stone-500 mb-2">2. Tipo de Conta</label>
                        <select 
                          value={calcBead} 
                          onChange={(e) => setCalcBead(e.target.value as any)} 
                          className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-3 py-2.5 text-xs focus:border-amber-500 focus:outline-none transition"
                        >
                          <option value="cristal">Cristal Checo 8mm (R$ 0,45 /un)</option>
                          <option value="perola">Pérola Barroca 10mm (R$ 0,85 /un)</option>
                          <option value="madeira">Madeira Imbuia 8mm (R$ 0,22 /un)</option>
                          <option value="hematita">Pedra Natural Hematita 8mm (R$ 0,55 /un)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase text-stone-500 mb-2">3. Metais & Crucifixo</label>
                        <select 
                          value={calcMetal} 
                          onChange={(e) => setCalcMetal(e.target.value as any)} 
                          className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-3 py-2.5 text-xs focus:border-amber-500 focus:outline-none transition"
                        >
                          <option value="folheado18k">Conjunto Folheado a Ouro 18k (R$ 66,00)</option>
                          <option value="envelhecido">Ouro Envelhecido Italiano (R$ 16,50)</option>
                          <option value="prata925">Crucifixo Prata de Lei 925 (R$ 72,00)</option>
                          <option value="niquel">Conjunto Níquel Resinado (R$ 7,20)</option>
                        </select>
                      </div>
                    </div>

                    {/* Sliders */}
                    <div className="space-y-4 pt-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-stone-700 font-medium">Tempo de Mão de Obra na Bancada:</span>
                          <span className="font-mono text-amber-800 font-bold">{calcLaborHours} hora{calcLaborHours > 1 ? 's' : ''} (R$ {(calcLaborHours * calcHourRate).toFixed(2).replace('.', ',')})</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="5.0" 
                          step="0.5" 
                          value={calcLaborHours} 
                          onChange={(e) => setCalcLaborHours(parseFloat(e.target.value))} 
                          className="w-full accent-amber-600 cursor-pointer" 
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-stone-700 font-medium">Taxas Comerciais / Cartão / Gateway:</span>
                          <span className="font-mono text-stone-700 font-bold">{calcTaxPct}% (R$ {commercialTaxes.toFixed(2).replace('.', ',')})</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="20" 
                          step="1" 
                          value={calcTaxPct} 
                          onChange={(e) => setCalcTaxPct(parseFloat(e.target.value))} 
                          className="w-full accent-stone-700 cursor-pointer" 
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-stone-700 font-medium">Margem de Lucro Desejada:</span>
                          <span className="font-mono text-emerald-700 font-bold">{calcMargin}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="20" 
                          max="80" 
                          step="5" 
                          value={calcMargin} 
                          onChange={(e) => setCalcMargin(parseFloat(e.target.value))} 
                          className="w-full accent-emerald-600 cursor-pointer" 
                        />
                      </div>
                    </div>

                  </div>

                  {/* Summary Card */}
                  <div className="lg:col-span-5 flashlight-card p-6 flex flex-col justify-between border-amber-300 bg-gradient-to-br from-white to-[#FAF7F2]">
                    <div className="flashlight-border" />

                    <div>
                      <span className="text-xs font-mono text-amber-800 uppercase tracking-widest block mb-1 font-bold">Composição do Preço</span>
                      <h4 className="font-serif text-lg font-bold text-stone-900">{currentModelSpec.name.split('(')[0]}</h4>
                      
                      <div className="space-y-2 mt-4 text-xs divide-y divide-stone-100">
                        <div className="flex justify-between pt-1.5">
                          <span className="text-stone-600">Contas ({currentModelSpec.beads} un):</span>
                          <span className="font-mono font-bold text-stone-900">R$ {rawBeadsCost.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-stone-600">Crucifixo & Entremeio:</span>
                          <span className="font-mono font-bold text-stone-900">R$ {currentMetalSpec.cost.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-stone-600">Fio Cordone Poliamida:</span>
                          <span className="font-mono font-bold text-stone-900">R$ {rawWireCost.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-stone-600">Perda Técnica ({calcLossPct}%):</span>
                          <span className="font-mono font-bold text-stone-900">R$ {lossAmount.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-stone-600">Mão de Obra ({calcLaborHours}h):</span>
                          <span className="font-mono font-bold text-stone-900">R$ {laborCost.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-stone-600">Embalagem & Certificado:</span>
                          <span className="font-mono font-bold text-stone-900">R$ {currentModelSpec.packaging.toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-stone-200">
                        <div className="flex justify-between text-xs text-stone-500 mb-1">
                          <span>CUSTO DE FABRICAÇÃO:</span>
                          <span className="font-mono font-bold text-stone-800">R$ {totalMfgCost.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between items-baseline mt-2">
                          <span className="text-sm font-bold text-stone-900">PREÇO SUGERIDO:</span>
                          <span className="text-3xl font-extrabold font-mono text-amber-700">R$ {suggestedPrice.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between text-xs text-emerald-700 font-mono mt-1 font-bold">
                          <span>LUCRO LÍQUIDO NO BOLSO:</span>
                          <span>+ R$ {netProfit.toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <button 
                        type="button" 
                        onClick={() => showToast('success', 'Tabela Atualizada', 'O preço científico foi fixado no catálogo de produtos.')} 
                        className="w-full py-3 rounded-xl bg-gold-gradient text-stone-950 font-bold text-xs uppercase tracking-wider hover:brightness-105 shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Check size={16} className="stroke-[3]" />
                        <span>Salvar Preço Oficial no Catálogo</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          setQuoteItemDesc(currentModelSpec.name);
                          setQuoteItemPrice(parseFloat(suggestedPrice.toFixed(2)));
                          setActiveTab('orcamentos');
                          showToast('info', 'Preço Importado', 'Valores transferidos para o orçamento formal.');
                        }} 
                        className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition cursor-pointer"
                      >
                        Gerar Orçamento com este Preço ➔
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* TAB 5: ORÇAMENTOS & PEDIDOS DE VENDA */}
            {activeTab === 'orcamentos' && (
              <div className="space-y-6">
                
                <div className="pb-4 border-b border-stone-200">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">Orçamentos Formais com Reserva Automática</h3>
                  <p className="text-xs text-stone-500">Ao criar o orçamento, o ERP verifica e reserva os insumos necessários. Ao aprovar, converte direto para Pedido de Venda.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Quote Form */}
                  <div className="lg:col-span-5 space-y-4 flashlight-card p-5">
                    <div className="flashlight-border" />
                    
                    <div>
                      <label className="block text-xs font-mono uppercase text-stone-500 mb-1">Nome da Noiva / Cliente</label>
                      <input 
                        type="text" 
                        value={quoteClient} 
                        onChange={(e) => setQuoteClient(e.target.value)} 
                        className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-3 py-2 text-xs focus:border-amber-500 focus:outline-none" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-stone-500 mb-1">Ocasião / Paróquia</label>
                      <input 
                        type="text" 
                        value={quoteOccasion} 
                        onChange={(e) => setQuoteOccasion(e.target.value)} 
                        className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-3 py-2 text-xs focus:border-amber-500 focus:outline-none" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-stone-500 mb-1">Artigo Devocional Solicitado</label>
                      <input 
                        type="text" 
                        value={quoteItemDesc} 
                        onChange={(e) => setQuoteItemDesc(e.target.value)} 
                        className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-3 py-2 text-xs focus:border-amber-500 focus:outline-none" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono uppercase text-stone-500 mb-1">Valor do Terço (R$)</label>
                        <input 
                          type="number" 
                          value={quoteItemPrice} 
                          onChange={(e) => setQuoteItemPrice(parseFloat(e.target.value) || 0)} 
                          className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-3 py-2 text-xs font-mono focus:border-amber-500 focus:outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono uppercase text-stone-500 mb-1">Estojo & Envio Seguro (R$)</label>
                        <input 
                          type="number" 
                          value={quoteFreight} 
                          onChange={(e) => setQuoteFreight(parseFloat(e.target.value) || 0)} 
                          className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-3 py-2 text-xs font-mono focus:border-amber-500 focus:outline-none" 
                        />
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <button 
                        type="button" 
                        onClick={() => showToast('success', 'Mensagem WhatsApp Pronta', 'Texto formatado para envio direto à noiva com foto e termos.')} 
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send size={15} />
                        <span>Enviar Orçamento no WhatsApp</span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          showToast('success', 'Orçamento Aprovado!', 'Convertido automaticamente em Pedido de Venda #PED-115.');
                          setActiveTab('kanban');
                        }} 
                        className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 size={15} />
                        <span>Aprovar & Gerar Pedido de Venda</span>
                      </button>
                    </div>
                  </div>

                  {/* Proposal Preview Sheet in Linho Texture */}
                  <div className="lg:col-span-7 bg-[#FAF7F2] text-stone-900 rounded-3xl p-6 sm:p-8 shadow-md border border-stone-300 font-serif relative">
                    <div className="flex justify-between items-start pb-4 border-b border-stone-300">
                      <div>
                        <h4 className="text-2xl font-bold tracking-tight text-stone-950">Ateliê Sagrado</h4>
                        <p className="text-xs font-sans text-stone-600">Alta Joalheria Devocional & Artigos Sacros</p>
                      </div>
                      <div className="text-right font-sans text-xs text-stone-500">
                        <p className="font-bold text-stone-900 font-mono">ORÇAMENTO #2026-94</p>
                        <p>Validade: 15 dias (Insumos Reservados)</p>
                      </div>
                    </div>

                    <div className="my-5 font-sans text-xs space-y-1">
                      <p><span className="text-stone-500">Prezada:</span> <strong className="text-stone-900 font-serif text-sm">{quoteClient}</strong></p>
                      <p><span className="text-stone-500">Ocasião:</span> <span className="text-stone-800">{quoteOccasion}</span></p>
                    </div>

                    <div className="my-6">
                      <table className="w-full font-sans text-xs">
                        <thead>
                          <tr className="border-b border-stone-300 text-stone-500 uppercase text-[10px] font-mono">
                            <th className="text-left pb-2">Item Confeccionado sob Medida</th>
                            <th className="text-right pb-2">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                          <tr>
                            <td className="py-3 pr-4">
                              <p className="font-bold text-stone-900">{quoteItemDesc}</p>
                              <p className="text-[11px] text-stone-500 italic font-serif">Confeccionado artesanalmente no fio reforçado, metais com banho nobre e certificado de oração.</p>
                            </td>
                            <td className="py-3 text-right font-mono font-bold text-stone-900">R$ {quoteItemPrice.toFixed(2).replace('.', ',')}</td>
                          </tr>
                          <tr>
                            <td className="py-2 text-stone-600">Estojo em Veludo Luxo com Berço Personalizado & Envio Seguro</td>
                            <td className="py-2 text-right font-mono font-bold text-stone-900">R$ {quoteFreight.toFixed(2).replace('.', ',')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-4 border-t-2 border-stone-900 flex justify-between items-baseline font-sans">
                      <span className="text-xs uppercase font-mono tracking-wider text-stone-600">Investimento Total:</span>
                      <span className="text-2xl font-bold font-mono text-amber-800">R$ {(quoteItemPrice + quoteFreight).toFixed(2).replace('.', ',')}</span>
                    </div>

                    <div className="mt-6 pt-4 border-t border-stone-200 text-center font-sans text-[11px] text-stone-500 italic">
                      "Tudo para a maior Glória de Deus e santificação da sua família."
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 6: CHÃO DE FÁBRICA (KANBAN INTERATIVO) */}
            {activeTab === 'kanban' && (
              <div className="space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">Chão de Fábrica — Kanban de Bancada</h3>
                    <p className="text-xs text-stone-500">Acompanhe as encomendas pelas etapas da bancada. Clique em "Avançar Etapa ➔" para movimentar.</p>
                  </div>
                  <button 
                    onClick={handleAddNewKanban} 
                    className="px-3.5 py-2 rounded-xl bg-gold-gradient text-stone-950 text-xs font-bold hover:brightness-105 transition cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Plus size={14} className="stroke-[2.5]" />
                    <span>+ Nova Ordem de Serviço</span>
                  </button>
                </div>

                {/* 4 Kanban Columns in Light Mode */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    { step: 1, title: '1. Insumos Separados', color: 'bg-blue-500' },
                    { step: 2, title: '2. Na Bancada de Montagem', color: 'bg-amber-500' },
                    { step: 3, title: '3. Embalagem & Bênção', color: 'bg-purple-500' },
                    { step: 4, title: '4. Pronto p/ Envio', color: 'bg-emerald-500' },
                  ].map(col => {
                    const colItems = kanbanItems.filter(item => item.step === col.step);
                    return (
                      <div key={col.step} className="bg-stone-50/80 rounded-2xl p-4 border border-stone-200 flex flex-col shadow-2xs">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200">
                          <span className="text-xs font-bold text-stone-800 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${col.color}`} /> {col.title}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-700 font-bold">
                            {colItems.length}
                          </span>
                        </div>
                        <div className="space-y-3 flex-1">
                          {colItems.map(item => (
                            <div key={item.id} className="flashlight-card p-3.5 bg-white border-stone-200 text-xs shadow-xs">
                              <div className="flashlight-border" />
                              <div className="flex justify-between text-[10px] font-mono mb-1">
                                <span className="font-bold text-amber-800">{item.code}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9.5px] ${item.tagColor}`}>{item.tag}</span>
                              </div>
                              <p className="font-bold text-stone-900">{item.title}</p>
                              <p className="text-[11px] text-stone-500">{item.client}</p>
                              <div className="mt-3 pt-2 border-t border-stone-100 flex justify-between items-center">
                                <span className="font-mono text-amber-800 font-bold">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                                {item.step < 4 ? (
                                  <button 
                                    onClick={() => moveKanban(item.id, item.step)} 
                                    className="px-2 py-1 rounded bg-stone-100 text-stone-800 hover:bg-gold-500 hover:text-stone-950 text-[10px] transition cursor-pointer font-bold border border-stone-200"
                                  >
                                    Avançar ➔
                                  </button>
                                ) : (
                                  <span className="text-emerald-700 text-[10px] font-bold">Concluído ✓</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </main>

        </div>
      </section>

      {/* ================= DOBRA 4: MÓDULOS REAIS DO ERP ================= */}
      <section id="modulos" className="relative z-10 py-20 px-4 sm:px-8 max-w-7xl mx-auto bg-white border-y border-stone-200/90 rounded-[40px] my-10 shadow-xs">
        
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-xs font-mono uppercase tracking-wider mb-3">
            Arquitetura & Módulos Efetivos
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-stone-900">
            Cada Módulo foi Feito para o <br /><span className="text-gold-gradient italic">Ofício Real do Ateliê.</span>
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-3">
            Sem sistemas genéricos ou ferramentas industriais deslocadas. Todos os recursos correspondem à rotina dos artesãos devocionais.
          </p>
        </div>

        {/* 6 Grid Cards for Real ERP Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Módulo 1 */}
          <div className="flashlight-card p-6 bg-white border border-stone-200 shadow-xs">
            <div className="flashlight-border" />
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-4">
              <Package size={20} />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">Estoque de Insumos & 3 Unidades</h3>
            <p className="text-stone-600 text-xs leading-relaxed mb-3">
              Unidades de compra, estoque e consumo independentes. Controle de saldo físico, quantidade reservada e saldo disponível com trava contra retiradas indevidas.
            </p>
            <span className="text-[11px] font-mono text-amber-800 font-semibold">Módulo: inventory</span>
          </div>

          {/* Módulo 2 */}
          <div className="flashlight-card p-6 bg-white border border-stone-200 shadow-xs">
            <div className="flashlight-border" />
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-4">
              <Sparkles size={20} />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">Fichas Técnicas & Perdas Reais</h3>
            <p className="text-stone-600 text-xs leading-relaxed mb-3">
              Receitas de terços com custos atualizados pelo custo médio ponderado móvel, horas de mão de obra e fator de perda técnica sem duplicar baixas físicas.
            </p>
            <span className="text-[11px] font-mono text-amber-800 font-semibold">Módulo: products</span>
          </div>

          {/* Módulo 3 */}
          <div className="flashlight-card p-6 bg-white border border-stone-200 shadow-xs">
            <div className="flashlight-border" />
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-4">
              <Calculator size={20} />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">Motor de Precificação Científica</h3>
            <p className="text-stone-600 text-xs leading-relaxed mb-3">
              Fórmula de venda: <code>Custo ÷ (1 − Taxas − Margem)</code>. Simulações sem alterar preço oficial, garantindo o lucro líquido real em cada modelo.
            </p>
            <span className="text-[11px] font-mono text-amber-800 font-semibold">Módulo: pricing</span>
          </div>

          {/* Módulo 4 */}
          <div className="flashlight-card p-6 bg-white border border-stone-200 shadow-xs">
            <div className="flashlight-border" />
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-4">
              <FileText size={20} />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">Orçamentos & Pedidos de Venda</h3>
            <p className="text-stone-600 text-xs leading-relaxed mb-3">
              Checagem imediata de saldo e criação de reserva automática. A aprovação converte no Pedido de Venda mantendo cliente, produtos e histórico.
            </p>
            <span className="text-[11px] font-mono text-amber-800 font-semibold">Módulos: quotes & orders</span>
          </div>

          {/* Módulo 5 */}
          <div className="flashlight-card p-6 bg-white border border-stone-200 shadow-xs">
            <div className="flashlight-border" />
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-4">
              <Hammer size={20} />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">Chão de Fábrica & Kanban</h3>
            <p className="text-stone-600 text-xs leading-relaxed mb-3">
              Fluxo visual das peças pelas bancadas de separação, montagem e acabamento. Registro do consumo efetivo com baixa no estoque físico.
            </p>
            <span className="text-[11px] font-mono text-amber-800 font-semibold">Módulo: production</span>
          </div>

          {/* Módulo 6 */}
          <div className="flashlight-card p-6 bg-white border border-stone-200 shadow-xs">
            <div className="flashlight-border" />
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-4">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">Fluxo Financeiro & Controladoria</h3>
            <p className="text-stone-600 text-xs leading-relaxed mb-3">
              Contas a pagar integradas com compras necessárias, contas a receber vinculadas a pedidos e DRE gerencial com lucratividade real da operação.
            </p>
            <span className="text-[11px] font-mono text-amber-800 font-semibold">Módulo: financial</span>
          </div>

        </div>
      </section>

      {/* ================= DOBRA 5: FLUXO OPERACIONAL INTEGRADO ================= */}
      <section id="fluxo" className="relative z-10 py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-stone-200">
            <div>
              <span className="text-xs font-mono text-amber-800 uppercase tracking-widest block mb-1 font-bold">Fluxo Contínuo</span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">Do Insumo ao Lucro Consagrado</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200">
                100% Integrado sem Redigitação
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            
            <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-stone-200/90 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-bold font-mono text-sm flex items-center justify-center mb-4 border border-amber-300">01</div>
              <h4 className="font-serif font-bold text-base text-stone-900 mb-1">Entrada de Insumos</h4>
              <p className="text-stone-600 text-xs leading-relaxed">Cadastre contas, metais e fios. O sistema converte compra para estoque e consumo, atualizando o custo médio móvel.</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-stone-200/90 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-bold font-mono text-sm flex items-center justify-center mb-4 border border-amber-300">02</div>
              <h4 className="font-serif font-bold text-base text-stone-900 mb-1">Ficha Técnica & Preço</h4>
              <p className="text-stone-600 text-xs leading-relaxed">Monte a receita do terço: materiais + 2% perda + tempo de bancada. O motor calcula o preço sugerido exato.</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-stone-200/90 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-bold font-mono text-sm flex items-center justify-center mb-4 border border-amber-300">03</div>
              <h4 className="font-serif font-bold text-base text-stone-900 mb-1">Orçamento com Reserva</h4>
              <p className="text-stone-600 text-xs leading-relaxed">O sistema checa o saldo disponível e cria reservas preventivas. Emita propostas em linho no WhatsApp da noiva.</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-stone-200/90 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-bold font-mono text-sm flex items-center justify-center mb-4 border border-amber-300">04</div>
              <h4 className="font-serif font-bold text-base text-stone-900 mb-1">Bancada & Financeiro</h4>
              <p className="text-stone-600 text-xs leading-relaxed">A aprovação do orçamento vira Pedido e Ordem de Produção no Kanban. A conclusão baixa o estoque e credita o financeiro.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ================= DOBRA 6: PLANOS & ASSINATURA REAL ================= */}
      <section id="planos" className="relative z-10 py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-xs font-mono uppercase tracking-wider mb-3">
            Plano Oficial do Sistema
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-stone-900">
            Acesso Integral. <span className="text-gold-gradient italic">Todos os Módulos Inclusos.</span>
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-3">
            Sem pegadinhas, sem planos fragmentados. Um único plano com acesso completo e irrestrito ao Ateliê Sagrado ERP.
          </p>
        </div>

        <div className="flashlight-card max-w-2xl mx-auto p-8 sm:p-10 flex flex-col bg-white border border-stone-200 shadow-md">
          <div className="flashlight-border" />
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <span className="text-xs font-mono text-amber-800 uppercase tracking-widest font-bold">Acesso Total & Ilimitado</span>
            <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200">
              Plano Único
            </span>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-4">Plano Ateliê Sagrado Completo</h3>
          <p className="text-sm text-stone-600 mt-2">Gestão completa e integrada de insumos, fórmulas, precificação, vendas, produção e finanças.</p>

          <div className="mt-6 mb-6">
            <span className="text-5xl font-extrabold font-mono text-amber-800">R$ 49,90</span>
            <span className="text-sm text-stone-500 font-mono"> / mês</span>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-700">
            <li className="flex items-start gap-2"><span className="text-amber-600 font-bold">✓</span> Acesso completo aos 11 módulos do ERP</li>
            <li className="flex items-start gap-2"><span className="text-amber-600 font-bold">✓</span> Cadastro ilimitado de insumos e matérias-primas</li>
            <li className="flex items-start gap-2"><span className="text-amber-600 font-bold">✓</span> Fórmulas de terços e perdas sem limites</li>
            <li className="flex items-start gap-2"><span className="text-amber-600 font-bold">✓</span> Motor de precificação científica e simulações</li>
            <li className="flex items-start gap-2"><span className="text-amber-600 font-bold">✓</span> Orçamentos formais com envio WhatsApp e PDF</li>
            <li className="flex items-start gap-2"><span className="text-amber-600 font-bold">✓</span> Gestão de clientes e histórico comercial</li>
            <li className="flex items-start gap-2"><span className="text-amber-600 font-bold">✓</span> Chão de fábrica e Kanban de bancada</li>
            <li className="flex items-start gap-2"><span className="text-amber-600 font-bold">✓</span> Fluxo financeiro, relatórios e exportações</li>
          </ul>

          <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col gap-3">
            <button 
              onClick={() => onRegister('basic')}
              className="w-full py-4 rounded-xl bg-gold-gradient text-stone-950 font-bold text-sm uppercase tracking-wider shadow-md text-center hover:brightness-105 transition cursor-pointer"
            >
              Criar Conta com o Plano Completo
            </button>
            <p className="text-[11px] text-stone-500 text-center leading-relaxed">
              Início imediato após o cadastro. Você terá acesso irrestrito a todas as funcionalidades do sistema.
            </p>
          </div>
        </div>
      </section>

      {/* ================= DOBRA 7: PERGUNTAS FREQUENTES (FAQ) ================= */}
      <section id="faq" className="relative z-10 py-16 px-4 sm:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h3 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900">Perguntas Frequentes</h3>
          <p className="text-stone-600 text-xs sm:text-sm mt-2">Dúvidas operacionais sobre o Ateliê Sagrado ERP e sua metodologia de custeio.</p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Como funciona a reserva de insumos ao criar um orçamento?',
              a: 'Quando você monta um orçamento no ERP, o sistema verifica se há saldo disponível. Se houver, as quantidades de contas, cruz e fios ficam reservadas preventivamente. O saldo físico continua no estoque, mas o saldo disponível para novos orçamentos é bloqueado, evitando que você venda um terço sem ter os materiais garantidos.'
            },
            {
              q: 'O que acontece quando o orçamento é aprovado ou cancelado?',
              a: 'Ao aprovar, o orçamento se transforma automaticamente em Pedido de Venda e entra no Chão de Fábrica, mantendo a reserva vinculada sem duplicá-la. Caso o orçamento seja cancelado, recusado ou expire a validade de 15 dias, os materiais são liberados imediatamente de volta ao saldo disponível.'
            },
            {
              q: 'Como o ERP trata o desperdício e perdas de contas e fios?',
              a: 'Na composição do produto, você define o percentual de perda técnica (ex: 2% a 5% para quebra de pedras ou sobras de nós). O ERP incorpora essa margem no custo de precificação, mas a baixa física real só ocorre no Chão de Fábrica quando o artesão conclui o terço, garantindo que previsões não virem saídas fictícias.'
            },
            {
              q: 'O sistema funciona em celular ou tablet na bancada de trabalho?',
              a: 'Sim! Toda a interface foi desenhada responsivamente para funcionar em computadores, tablets e smartphones. Você pode consultar medidas, arrastar pedidos no Kanban e conferir a lista de contas diretamente ao lado dos seus alicates e fios.'
            }
          ].map((faq, idx) => (
            <div 
              key={idx} 
              className="flashlight-card p-5 rounded-2xl cursor-pointer bg-white border border-stone-200 shadow-2xs" 
              onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
            >
              <div className="flex items-center justify-between font-bold text-sm text-stone-900">
                <span>{faq.q}</span>
                <span className="text-amber-800 text-lg transition-transform font-bold">
                  {expandedFaq === idx ? '−' : '+'}
                </span>
              </div>
              {expandedFaq === idx && (
                <div className="text-xs text-stone-600 border-stone-100 mt-3 pt-3 border-t leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ================= RODAPÉ INSTITUCIONAL (LIGHT MODE) ================= */}
      <footer className="relative z-10 border-t border-stone-200 bg-white py-12 px-4 sm:px-8 text-xs text-stone-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-stone-950 font-bold shadow-xs">
              ✝
            </div>
            <div>
              <span className="font-serif text-base font-bold text-stone-900">Ateliê Sagrado ERP</span>
              <p className="text-[11px] text-stone-500">Sistema ERP de Gestão Integrada para Ateliês & Produção Sacra</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-medium">
            <a href="#hero" className="hover:text-amber-700 transition">Início</a>
            <a href="#workspace" className="hover:text-amber-700 transition">ERP Interativo</a>
            <a href="#modulos" className="hover:text-amber-700 transition">Módulos</a>
            <a href="#precificacao" className="hover:text-amber-700 transition">Precificação</a>
            <a href="#planos" className="hover:text-amber-700 transition">Plano Oficial</a>
            <a href="#faq" className="hover:text-amber-700 transition">Dúvidas</a>
          </div>

          <div className="text-right text-[11px] font-mono text-stone-500">
            © 2026 Ateliê Sagrado. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* ================= MODAL: NOVO INSUMO NO ESTOQUE ================= */}
      {showNewSupplyModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 bg-white border border-stone-200 shadow-xl relative text-left">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-serif text-lg font-bold text-stone-900">Cadastrar Novo Insumo</h4>
              <button onClick={() => setShowNewSupplyModal(false)} className="text-stone-400 hover:text-stone-800 text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveNewSupply} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 mb-1 font-medium">Nome do Insumo</label>
                <input 
                  type="text" 
                  value={newSupplyName} 
                  onChange={(e) => setNewSupplyName(e.target.value)} 
                  placeholder="Ex: Pérola de Água Doce 8mm" 
                  className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 shadow-2xs" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Qtd em Estoque Físico</label>
                  <input 
                    type="number" 
                    value={newSupplyQty} 
                    onChange={(e) => setNewSupplyQty(e.target.value)} 
                    placeholder="Ex: 200" 
                    className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 font-mono shadow-2xs" 
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-medium">Custo Unitário Médio (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={newSupplyPrice} 
                    onChange={(e) => setNewSupplyPrice(e.target.value)} 
                    placeholder="Ex: 0.45" 
                    className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 font-mono shadow-2xs" 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-3 mt-4 rounded-xl bg-gold-gradient text-stone-950 font-bold text-xs uppercase tracking-wider hover:brightness-105 shadow-xs cursor-pointer"
              >
                Salvar Insumo no Estoque
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          <div className="pointer-events-auto p-4 rounded-2xl shadow-xl border text-xs max-w-sm flex items-start gap-3 bg-white text-stone-900 border-amber-300">
            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
              {toastMessage.type === 'success' ? '✓' : toastMessage.type === 'error' ? '⚠' : 'ℹ'}
            </div>
            <div>
              <p className="font-bold text-stone-900">{toastMessage.title}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">{toastMessage.desc}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
