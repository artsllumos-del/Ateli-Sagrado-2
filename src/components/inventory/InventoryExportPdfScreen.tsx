import React, { useState } from 'react';
import { InventoryItem } from '../../types/erp';
import { 
  ArrowLeft, FileDown, Download, Loader2, Filter, Search, 
  Image as ImageIcon, CheckCircle2, Eye, EyeOff, Layers, Sparkles, BookOpen, Table
} from 'lucide-react';
import { Button, Badge } from '../ui';

export interface ExportPdfOptions {
  format: 'catalog_visual' | 'table_report';
  category: string;
  subcategory: string;
  onlyAvailable: boolean;
  onlyWithPhotos: boolean;
  includePrice: boolean;
  showStockQuantity: boolean;
}

export interface InventoryExportPdfScreenProps {
  onBack: () => void;
  categories: string[];
  activeItems: InventoryItem[];
  commercialMode: boolean;
  onExport: (options: ExportPdfOptions) => Promise<void>;
  isGeneratingPdf: boolean;
}

export const InventoryExportPdfScreen: React.FC<InventoryExportPdfScreenProps> = ({
  onBack,
  categories,
  activeItems,
  commercialMode,
  onExport,
  isGeneratingPdf,
}) => {
  // Export parameters
  const [format, setFormat] = useState<'catalog_visual' | 'table_report'>('catalog_visual');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false);
  const [includeUnitPrice, setIncludeUnitPrice] = useState(!commercialMode);
  const [showStockQuantity, setShowStockQuantity] = useState(!commercialMode);

  // Filter count preview
  const previewItems = activeItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (onlyAvailable && item.quantity <= 0) return false;
    if (onlyWithPhotos && (!item.imageUrl || item.imageUrl.trim() === '')) return false;
    if (subcategoryFilter.trim()) {
      const q = subcategoryFilter.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchCode = (item.code || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCode) return false;
    }
    return true;
  });

  const handleGenerate = () => {
    onExport({
      format,
      category: selectedCategory,
      subcategory: subcategoryFilter,
      onlyAvailable,
      onlyWithPhotos,
      includePrice: includeUnitPrice,
      showStockQuantity,
    });
  };

  return (
    <div className="space-y-6 pb-16 font-sans select-none animate-slide-in-up">
      {/* Header with Back button */}
      <div className="bg-white border border-slate-200/80 p-5 sm:p-6 rounded-3xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-bold text-slate-500 hover:text-amber-800 transition-colors flex items-center gap-1.5 cursor-pointer mb-1"
            >
              <ArrowLeft size={14} />
              Voltar ao Estoque
            </button>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <BookOpen className="text-amber-600" size={24} />
              {commercialMode ? 'Catálogo Comercial de Matérias-Primas (PDF com Fotos)' : 'Exportação de Catálogo & Relatório em PDF'}
            </h2>
            <p className="text-xs text-slate-500">
              Gere um documento A4 elegante com fotos das matérias-primas para que seus clientes vejam todas as opções de cruzes, medalhas, contas e acabamentos disponíveis para montagem personalizada.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            leftIcon={<ArrowLeft size={14} />}
          >
            Cancelar e Voltar
          </Button>
        </div>
      </div>

      {/* Main Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Configuration Form */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Format Selection Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-600" />
              1. Formato do Documento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormat('catalog_visual')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  format === 'catalog_visual'
                    ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <ImageIcon size={18} />
                  </div>
                  {format === 'catalog_visual' && (
                    <Badge variant="gold" size="xs">Recomendado</Badge>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Catálogo Visual Ilustrado</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Grade com fotos das peças, nomes, categorias e códigos. Ideal para enviar ao cliente para ele escolher crucifixo, contas e medalhas.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('table_report')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  format === 'table_report'
                    ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                    <Table size={18} />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Relatório em Tabela Analítica</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Listagem tabular condensada para contagem física, conferência de estoque e auditoria contábil do ateliê.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Filtering Parameters Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            <h3 className="font-serif font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Filter size={16} className="text-amber-600" />
              2. Filtros e Seleção das Peças
            </h3>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Categoria Específica
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                  >
                    <option value="all">Todas as Categorias ({activeItems.length} insumos)</option>
                    {categories.map((cat) => {
                      const count = activeItems.filter(i => i.category === cat).length;
                      return (
                        <option key={cat} value={cat}>{cat} ({count})</option>
                      );
                    })}
                  </select>
                </div>

                {/* Subcategory / Keyword Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Busca por Nome ou Código
                  </label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={subcategoryFilter}
                      onChange={(e) => setSubcategoryFilter(e.target.value)}
                      placeholder="Ex: Crucifixo, Ouro Velho, 8mm..."
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                
                {/* Only Available Toggle */}
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                  <label className="flex items-start justify-between gap-3 cursor-pointer select-none">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">
                        Apenas Saldo Disponível (&gt; 0)
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Oculta matérias-primas esgotadas temporariamente.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={onlyAvailable}
                      onChange={(e) => setOnlyAvailable(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Only With Photos */}
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                  <label className="flex items-start justify-between gap-3 cursor-pointer select-none">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">
                        Apenas com Foto Cadastrada
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Garante um catálogo 100% visual para o cliente.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={onlyWithPhotos}
                      onChange={(e) => setOnlyWithPhotos(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Include Price Toggle */}
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                  <label className="flex items-start justify-between gap-3 cursor-pointer select-none">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">
                        Exibir Valores Unitários
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {commercialMode ? 'Recomenda-se desmarcar para clientes.' : 'Mostra o custo da matéria-prima.'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeUnitPrice}
                      onChange={(e) => setIncludeUnitPrice(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Show Stock Quantity */}
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                  <label className="flex items-start justify-between gap-3 cursor-pointer select-none">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">
                        Exibir Quantidade em Saldo
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Exibe o número de peças ou apenas o status &quot;Disponível&quot;.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showStockQuantity}
                      onChange={(e) => setShowStockQuantity(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </label>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Document Preview Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
            <h4 className="font-serif font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Resumo da Emissão</span>
              <FileDown size={18} className="text-amber-600" />
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Itens Selecionados:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {previewItems.length} peças
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Formato PDF:</span>
                <span className="font-bold text-slate-800">
                  {format === 'catalog_visual' ? 'Catálogo Visual com Fotos' : 'Tabela de Auditoria'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Valores Visíveis:</span>
                <span className={`font-bold ${includeUnitPrice ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {includeUnitPrice ? 'Sim (Exibir Preço)' : 'Ocultos (Sem Custo)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Saldo Numérico:</span>
                <span className="font-bold text-slate-800">
                  {showStockQuantity ? 'Exibir Quantidades' : 'Apenas "Disponível"'}
                </span>
              </div>
            </div>

            {/* Visual Sample Preview of First Items */}
            {previewItems.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Amostra das Peças no Documento:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {previewItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 text-center flex flex-col items-center">
                      <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden mb-1 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon size={18} className="text-slate-300" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-800 truncate w-full block">
                        {item.name}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {item.code}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 flex flex-col gap-2.5">
              <Button
                size="lg"
                className="w-full justify-center"
                disabled={isGeneratingPdf || previewItems.length === 0}
                onClick={handleGenerate}
                leftIcon={isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} className="text-amber-400" />}
              >
                {isGeneratingPdf ? 'Compilando e Gerando PDF...' : 'Gerar e Baixar Catálogo em PDF'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="w-full justify-center"
              >
                Voltar sem Gerar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
