import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
  labelSingular?: string;
  labelPlural?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50],
  labelSingular = 'registro',
  labelPlural = 'registros',
}) => {
  if (totalItems === 0) return null;

  const validTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), validTotalPages);

  const startItem = (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safeCurrentPage * itemsPerPage, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 1;

    for (let i = 1; i <= validTotalPages; i++) {
      if (
        i === 1 ||
        i === validTotalPages ||
        (i >= safeCurrentPage - delta && i <= safeCurrentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3.5 px-4 bg-white/80 backdrop-blur-xs border border-slate-200/80 rounded-2xl shadow-xs text-xs font-medium text-slate-600 select-none transition-all">
      {/* Left: Summary text & page size selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-slate-500">
          Exibindo <strong className="font-bold text-slate-800">{startItem}</strong> a{' '}
          <strong className="font-bold text-slate-800">{endItem}</strong> de{' '}
          <strong className="font-bold text-slate-800">{totalItems}</strong>{' '}
          {totalItems === 1 ? labelSingular : labelPlural}
        </span>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span className="text-[11px] text-slate-400">Exibir:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-xs font-bold py-1 px-2 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {itemsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / pág
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 cursor-pointer disabled:cursor-not-allowed transition-all"
          title="Primeira Página"
        >
          <ChevronsLeft size={15} />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 cursor-pointer disabled:cursor-not-allowed transition-all mr-1"
          title="Página Anterior"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Numeric Page Buttons */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 font-bold">
                  ...
                </span>
              );
            }
            const pageNum = p as number;
            const isActive = pageNum === safeCurrentPage;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[30px] h-[30px] px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs scale-105'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === validTotalPages}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 cursor-pointer disabled:cursor-not-allowed transition-all ml-1"
          title="Próxima Página"
        >
          <ChevronRight size={15} />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(validTotalPages)}
          disabled={safeCurrentPage === validTotalPages}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 cursor-pointer disabled:cursor-not-allowed transition-all"
          title="Última Página"
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
};
