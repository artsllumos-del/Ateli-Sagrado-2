import React from 'react';
import { Search, X } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  filterOptions?: FilterOption[];
  extraFilters?: React.ReactNode;
  actions?: React.ReactNode;
  resultCount?: number;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  activeFilter,
  onFilterChange,
  filterOptions,
  extraFilters,
  actions,
  resultCount,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input if enabled */}
        {onSearchChange && (
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-white pl-9.5 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200/90 text-slate-850 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                title="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Extra selects, date pickers, or custom slots */}
        {extraFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {extraFilters}
          </div>
        )}

        {/* Action buttons (e.g. Export, New) */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Segmented Filter Pills (Tabs) */}
      {(filterOptions && filterOptions.length > 0 && onFilterChange) && (
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 shrink-0">
            {filterOptions.map((opt) => {
              const isActive = activeFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onFilterChange(opt.id)}
                  className={`
                    px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer flex items-center gap-1.5
                    ${isActive 
                      ? 'bg-white text-slate-900 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'}
                  `}
                >
                  <span>{opt.label}</span>
                  {typeof opt.count === 'number' && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isActive ? 'bg-amber-100/80 text-amber-900 font-bold' : 'bg-slate-200/80 text-slate-500'}`}>
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {typeof resultCount === 'number' && (
            <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap pl-2">
              {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
