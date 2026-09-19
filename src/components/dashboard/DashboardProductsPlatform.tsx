import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, ShoppingBag, CreditCard, Tag, ArrowRight, ExternalLink } from 'lucide-react';
import { Order, Product, InventoryItem, FinancialTransaction } from '../../types/erp';
import { roundCurrency, safeNumber } from '../../utils/finance';

interface DashboardProductsPlatformProps {
  activeOrders: Order[];
  products: Product[];
  inventory: InventoryItem[];
  transactions?: FinancialTransaction[];
  onViewChange?: (view: string, params?: Record<string, any>) => void;
}

export const DashboardProductsPlatform: React.FC<DashboardProductsPlatformProps> = ({
  activeOrders,
  products,
  inventory,
  transactions = [],
  onViewChange,
}) => {
  // Editorial colors for chart segments
  const CHART_COLORS = ['#D4A039', '#B5563D', '#3B82F6', '#10B981', '#8B5CF6', '#64748B'];

  // Toggle between Category view and Payment Method view
  const [distributionMode, setDistributionMode] = useState<'category' | 'payment'>('category');

  // 1. Calculate best sellers ranking with real profit margins based on composition cost
  const rankingData = useMemo(() => {
    const productSales: Record<string, { qty: number; revenue: number; id: string; category: string }> = {};

    activeOrders.forEach(o => {
      o.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId || p.sku === item.productId || p.name === item.productName);
        const name = item.productName || prod?.name || 'Produto Não Identificado';
        
        if (!productSales[name]) {
          productSales[name] = { 
            qty: 0, 
            revenue: 0, 
            id: item.productId,
            category: prod?.category || 'Geral'
          };
        }
        productSales[name].qty += safeNumber(item.quantity, 1);
        productSales[name].revenue += safeNumber(item.total, 0);
      });
    });

    return Object.keys(productSales).map(name => {
      const sales = productSales[name];
      const prod = products.find(p => p.id === sales.id || p.name === name);

      // Calculate real production material costs from composition
      let costPerUnit = 0;
      if (prod && prod.composition && Array.isArray(prod.composition)) {
        prod.composition.forEach(comp => {
          const mat = inventory.find(i => i.id === comp.materialId);
          costPerUnit += safeNumber(comp.quantity, 0) * safeNumber(mat?.unitValue, 0);
        });
      }

      const totalCost = costPerUnit * sales.qty;
      const profit = Math.max(0, sales.revenue - totalCost);

      return {
        id: sales.id,
        name,
        category: sales.category,
        qty: sales.qty,
        revenue: roundCurrency(sales.revenue),
        profit: roundCurrency(profit),
        image: prod?.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=150&auto=format&fit=crop'
      };
    }).sort((a, b) => b.qty - a.qty).slice(0, 4);
  }, [activeOrders, products, inventory]);

  // 2. Real Sales by Product Category
  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    activeOrders.forEach(o => {
      o.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId || p.sku === item.productId || p.name === item.productName);
        const cat = prod?.category || 'Geral';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + safeNumber(item.total, 0);
      });
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value: roundCurrency(value) }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [activeOrders, products]);

  // 3. Real Income by Payment Method (from transactions)
  const paymentMethodData = useMemo(() => {
    const methodLabels: Record<string, string> = {
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      cash: 'Dinheiro / Espécie',
      bank_slip: 'Boleto Bancário',
      transfer: 'Transferência / TED'
    };

    const methodTotals: Record<string, number> = {};

    transactions
      .filter(t => !t.isDeleted && t.type === 'income')
      .forEach(t => {
        const key = t.paymentMethod || 'pix';
        const label = methodLabels[key] || key;
        methodTotals[label] = (methodTotals[label] || 0) + safeNumber(t.value, 0);
      });

    return Object.entries(methodTotals)
      .map(([name, value]) => ({ name, value: roundCurrency(value) }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const activeDistributionData = distributionMode === 'category' ? categoryData : paymentMethodData;
  const totalDistributionValue = activeDistributionData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 1. WIDGET: PRODUTOS MAIS VENDIDOS */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-serif font-semibold text-base text-slate-900 flex items-center gap-1.5">
                <ShoppingBag size={16} className="text-amber-600" /> Produtos Mais Vendidos
              </h3>
              <p className="text-[11px] text-slate-500">Ranking e lucratividade baseada no consumo real de insumos</p>
            </div>
            {onViewChange && (
              <button
                onClick={() => onViewChange('products')}
                className="text-[10px] font-bold text-slate-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
              >
                Catálogo <ExternalLink size={11} />
              </button>
            )}
          </div>

          <div className="space-y-3 mt-4">
            {rankingData.map((item, idx) => (
              <div 
                key={item.id || idx} 
                onClick={() => onViewChange?.('products')}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50/80 transition-all border border-slate-100/60 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200/50 shrink-0 overflow-hidden relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute top-0 left-0 bg-slate-900 text-white font-mono font-black text-[9px] w-4 h-4 flex items-center justify-center rounded-br-lg">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-800 leading-snug truncate max-w-[180px] sm:max-w-[260px] group-hover:text-amber-800 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1.5">
                      <span>{item.qty} un vendidas</span>
                      <span>•</span>
                      <span className="text-slate-500">{item.category}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-mono font-black text-xs text-slate-900">
                    R$ {item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[9.5px] text-emerald-600 font-bold mt-0.5" title="Lucro líquido est. deduzindo insumos">
                    Lucro: R$ {item.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}

            {rankingData.length === 0 && (
              <div className="text-center py-10 space-y-2">
                <ShoppingBag size={24} className="mx-auto text-slate-300" />
                <p className="text-xs text-slate-500">Nenhum pedido de venda registrado até o momento.</p>
                {onViewChange && (
                  <button
                    onClick={() => onViewChange('orders')}
                    className="mt-2 text-xs font-bold text-amber-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    Criar Primeiro Pedido <ArrowRight size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {rankingData.length > 0 && onViewChange && (
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => onViewChange('orders')}
              className="text-[10.5px] font-bold text-slate-700 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              Ver todos os pedidos de venda <ArrowRight size={11} />
            </button>
          </div>
        )}
      </div>

      {/* 2. WIDGET: DISTRIBUIÇÃO REAL (CATEGORIAS E MEIOS DE PAGAMENTO) */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-serif font-semibold text-base text-slate-900">
                {distributionMode === 'category' ? 'Vendas por Categoria' : 'Receitas por Pagamento'}
              </h3>
              <p className="text-[11px] text-slate-500">Origem real das vendas do ateliê</p>
            </div>
            
            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setDistributionMode('category')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  distributionMode === 'category' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Tag size={10} /> Categorias
              </button>
              <button
                type="button"
                onClick={() => setDistributionMode('payment')}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  distributionMode === 'payment' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <CreditCard size={10} /> Pagamentos
              </button>
            </div>
          </div>

          {activeDistributionData.length > 0 ? (
            <>
              <div className="h-44 flex items-center justify-center relative mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {activeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: number) => [`R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
                      contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center select-none pointer-events-none">
                  <span className="text-base font-serif font-black text-slate-900">
                    R$ {totalDistributionValue > 1000 ? `${(totalDistributionValue / 1000).toFixed(1)}k` : totalDistributionValue.toFixed(0)}
                  </span>
                  <span className="text-[8.5px] uppercase tracking-wider text-slate-400 font-bold">Total</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                {activeDistributionData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-semibold text-slate-700 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                    <span className="truncate">{item.name}</span>
                    <span className="ml-auto font-mono text-[9px] text-slate-500 shrink-0 font-bold">
                      {totalDistributionValue > 0 ? `${Math.round((item.value / totalDistributionValue) * 100)}%` : '0%'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 space-y-2">
              <Sparkles size={22} className="mx-auto text-slate-300" />
              <p className="text-xs text-slate-500">
                {distributionMode === 'category' 
                  ? 'Aguardando primeiros pedidos para consolidar categorias.' 
                  : 'Nenhuma transação financeira classificada por meio de pagamento.'}
              </p>
            </div>
          )}
        </div>

        {onViewChange && (
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => onViewChange(distributionMode === 'category' ? 'products' : 'financial')}
              className="text-[10.5px] font-bold text-slate-700 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              Ver detalhamento em {distributionMode === 'category' ? 'Produtos' : 'Financeiro'} <ArrowRight size={11} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
