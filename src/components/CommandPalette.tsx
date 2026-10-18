import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { 
  Search, X, Package, ShoppingCart, FileText, Users, 
  Hammer, TrendingUp, CreditCard, Settings, ArrowRight,
  Plus, CornerDownLeft, Sparkles, AlertCircle
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { products, orders, quotes, clients, inventory } = useDb();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open & reset state
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered collections
  const activeProducts = useMemo(() => products.filter(p => !p.isDeleted), [products]);
  const activeOrders = useMemo(() => orders.filter(o => !o.isDeleted), [orders]);
  const activeQuotes = useMemo(() => quotes.filter(q => !q.isDeleted), [quotes]);
  const activeClients = useMemo(() => clients.filter(c => !c.isDeleted), [clients]);
  const activeInventory = useMemo(() => inventory.filter(i => !i.isDeleted), [inventory]);

  // System quick actions
  const quickActions = useMemo(() => [
    {
      id: 'action-new-order',
      title: 'Novo Pedido de Venda',
      subtitle: 'Registrar encomenda artesanal com timeline e reserva de estoque',
      icon: ShoppingCart,
      category: 'Ações Rápidas',
      action: () => { onNavigate('orders'); onClose(); }
    },
    {
      id: 'action-new-product',
      title: 'Novo Produto com Composição (BOM)',
      subtitle: 'Cadastrar artigo sacro com ficha técnica e custos de insumos',
      icon: Sparkles,
      category: 'Ações Rápidas',
      action: () => { onNavigate('products', { screen: 'create' }); onClose(); }
    },
    {
      id: 'action-new-quote',
      title: 'Novo Orçamento',
      subtitle: 'Simular orçamento personalizado para cliente ou evento',
      icon: FileText,
      category: 'Ações Rápidas',
      action: () => { onNavigate('quotes'); onClose(); }
    },
    {
      id: 'action-new-material',
      title: 'Cadastrar Matéria-Prima / Insumo',
      subtitle: 'Adicionar pérolas, metais, cordões ou crucifixos ao estoque',
      icon: Hammer,
      category: 'Ações Rápidas',
      action: () => { onNavigate('inventory'); onClose(); }
    },
    {
      id: 'action-new-client',
      title: 'Cadastrar Novo Cliente',
      subtitle: 'Inserir dados cadastrais de pessoa física, jurídica ou paróquia',
      icon: Users,
      category: 'Ações Rápidas',
      action: () => { onNavigate('clients'); onClose(); }
    },
    {
      id: 'action-financial-flow',
      title: 'Fluxo Financeiro & Conciliação',
      subtitle: 'Contas a pagar, receber, gateway e DRE do ateliê',
      icon: TrendingUp,
      category: 'Navegação do Sistema',
      action: () => { onNavigate('financial'); onClose(); }
    },
    {
      id: 'action-pricing-engine',
      title: 'Motor de Precificação',
      subtitle: 'Calcular margem de contribuição, taxas e custos diretos',
      icon: CreditCard,
      category: 'Navegação do Sistema',
      action: () => { onNavigate('pricing'); onClose(); }
    },
    {
      id: 'action-subscription',
      title: 'Assinatura & Renovação',
      subtitle: 'Verificar validade de 30 dias, faturas e renovação com desconto',
      icon: CreditCard,
      category: 'Navegação do Sistema',
      action: () => { onNavigate('subscription'); onClose(); }
    },
    {
      id: 'action-settings',
      title: 'Configurações do Ateliê',
      subtitle: 'Identidade visual, parâmetros de mão de obra e documentos',
      icon: Settings,
      category: 'Navegação do Sistema',
      action: () => { onNavigate('settings'); onClose(); }
    }
  ], [onNavigate, onClose]);

  // Search Results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // If query is empty, show default quick actions
      return quickActions.slice(0, 6).map(a => ({
        id: a.id,
        title: a.title,
        subtitle: a.subtitle,
        icon: a.icon,
        category: a.category,
        onSelect: a.action
      }));
    }

    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      icon: any;
      category: string;
      badge?: string;
      onSelect: () => void;
    }> = [];

    // 1. Matching Actions
    quickActions.forEach(a => {
      if (a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)) {
        items.push({
          id: a.id,
          title: a.title,
          subtitle: a.subtitle,
          icon: a.icon,
          category: a.category,
          onSelect: a.action
        });
      }
    });

    // 2. Matching Products
    activeProducts.forEach(p => {
      if (p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)) || (p.category && p.category.toLowerCase().includes(q))) {
        items.push({
          id: `prod-${p.id}`,
          title: p.name,
          subtitle: `SKU: ${p.sku} • R$ ${p.sellingPrice.toFixed(2)} • ${p.category}`,
          icon: Package,
          category: 'Produtos (Catálogo)',
          badge: `R$ ${p.sellingPrice.toFixed(2)}`,
          onSelect: () => { onNavigate('products'); onClose(); }
        });
      }
    });

    // 3. Matching Orders
    activeOrders.forEach(o => {
      if (o.orderNumber.toLowerCase().includes(q) || o.clientName.toLowerCase().includes(q)) {
        items.push({
          id: `order-${o.id}`,
          title: `Pedido ${o.orderNumber} - ${o.clientName}`,
          subtitle: `Total: R$ ${o.totalValue.toFixed(2)} • Emissão: ${new Date(o.date).toLocaleDateString('pt-BR')}`,
          icon: ShoppingCart,
          category: 'Pedidos de Venda',
          badge: o.status,
          onSelect: () => { onNavigate('orders'); onClose(); }
        });
      }
    });

    // 4. Matching Clients
    activeClients.forEach(c => {
      if (c.name.toLowerCase().includes(q) || (c.email && c.email.toLowerCase().includes(q)) || (c.phone && c.phone.includes(q))) {
        items.push({
          id: `client-${c.id}`,
          title: c.name,
          subtitle: `${c.phone || c.email || 'Cliente cadastrado'} • ${c.city ? `${c.city}/${c.state}` : 'Sem cidade'}`,
          icon: Users,
          category: 'Clientes',
          badge: c.type || 'PF',
          onSelect: () => { onNavigate('clients'); onClose(); }
        });
      }
    });

    // 5. Matching Inventory Items
    activeInventory.forEach(m => {
      if (m.name.toLowerCase().includes(q) || (m.code && m.code.toLowerCase().includes(q)) || (m.category && m.category.toLowerCase().includes(q))) {
        items.push({
          id: `inv-${m.id}`,
          title: m.name,
          subtitle: `Estoque: ${m.quantity} ${m.unit} • Custo: R$ ${m.unitValue.toFixed(2)}/${m.unit} • ${m.category}`,
          icon: Hammer,
          category: 'Estoque de Insumos',
          badge: `${m.quantity} ${m.unit}`,
          onSelect: () => { onNavigate('inventory'); onClose(); }
        });
      }
    });

    // 6. Matching Quotes
    activeQuotes.forEach(qt => {
      if (qt.quoteNumber?.toLowerCase().includes(q) || qt.clientName?.toLowerCase().includes(q)) {
        items.push({
          id: `quote-${qt.id}`,
          title: `Orçamento ${qt.quoteNumber || qt.id} - ${qt.clientName}`,
          subtitle: `Total: R$ ${qt.total.toFixed(2)} • Data: ${new Date(qt.date).toLocaleDateString('pt-BR')}`,
          icon: FileText,
          category: 'Orçamentos',
          badge: qt.status,
          onSelect: () => { onNavigate('quotes'); onClose(); }
        });
      }
    });

    return items.slice(0, 12);
  }, [query, quickActions, activeProducts, activeOrders, activeClients, activeInventory, activeQuotes, onNavigate, onClose]);

  // Arrow key navigation inside results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].onSelect();
      }
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-start justify-center p-2.5 sm:p-6 pt-6 sm:pt-20 animate-fade-in font-sans"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200/90 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[82dvh] animate-slide-in-up"
      >
        {/* Top Input Bar */}
        <div className="p-3.5 sm:p-5 border-b border-slate-150 flex items-center gap-2.5 sm:gap-3 bg-slate-50/50">
          <Search size={19} className="text-amber-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar produto, pedido, cliente, insumo..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder-slate-400 font-medium outline-none border-none shadow-none px-1 py-0.5"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
              aria-label="Limpar busca"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="sm:hidden px-2.5 py-1 rounded-lg bg-slate-200/70 text-slate-700 text-xs font-bold shrink-0 cursor-pointer"
          >
            Fechar
          </button>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/70 border border-slate-300 text-[10px] font-mono font-bold text-slate-600 shrink-0">
            ESC para sair
          </span>
        </div>

        {/* Results Body */}
        <div 
          ref={listRef}
          className="p-3 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-1"
        >
          {results.length === 0 ? (
            <div className="py-14 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Nenhum resultado encontrado</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Não encontramos correspondências para "{query}". Tente buscar por nome de produto, cliente, número do pedido ou insumo.
              </p>
            </div>
          ) : (
            results.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  data-index={index}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected 
                      ? 'bg-amber-500/10 text-slate-900 border border-amber-500/20 shadow-xs' 
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {item.category}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 text-slate-400">
                    {isSelected && (
                      <span className="text-[10px] font-semibold text-amber-800 hidden sm:inline flex items-center gap-1">
                        Acessar <CornerDownLeft size={11} />
                      </span>
                    )}
                    <ArrowRight size={14} className={isSelected ? 'text-amber-600' : 'text-slate-300'} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-150 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">Use as setas <kbd className="font-mono bg-white border px-1 py-0.5 rounded text-[10px] text-slate-600">↑</kbd> <kbd className="font-mono bg-white border px-1 py-0.5 rounded text-[10px] text-slate-600">↓</kbd> para navegar</span>
            <span>Pressione <kbd className="font-mono bg-white border px-1.5 py-0.5 rounded text-[10px] text-slate-600">ENTER</kbd> para abrir</span>
          </div>
          <span className="text-amber-800 font-semibold font-mono text-[10px]">
            Ateliê Sagrado ERP
          </span>
        </div>
      </div>
    </div>
  );
};
