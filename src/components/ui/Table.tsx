import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxHeight?: string | number;
}

export const TableContainer: React.FC<TableContainerProps> = ({
  children,
  className = '',
  maxHeight,
  ...props
}) => {
  return (
    <div
      className={`w-full overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs ${className}`}
      style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <table className={`w-full text-left text-xs sm:text-sm border-collapse ${className}`} {...props}>
      {children}
    </table>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <thead className={`bg-slate-50/90 text-slate-600 border-b border-slate-200 sticky top-0 z-10 ${className}`} {...props}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
  align?: 'left' | 'center' | 'right';
}

export const TableHead: React.FC<TableHeadProps> = ({
  children,
  sortable = false,
  sortDirection,
  onSort,
  align = 'left',
  className = '',
  ...props
}) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <th
      onClick={sortable ? onSort : undefined}
      className={`
        px-3.5 sm:px-4 py-3 font-semibold text-[11px] sm:text-xs text-slate-600 uppercase tracking-wider
        ${sortable ? 'cursor-pointer hover:bg-slate-100/70 select-none' : ''}
        ${alignClass}
        ${className}
      `}
      {...props}
    >
      <div className={`inline-flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        <span>{children}</span>
        {sortable && (
          <span className="text-slate-400">
            {sortDirection === 'asc' ? (
              <ChevronUp size={14} className="text-amber-600" />
            ) : sortDirection === 'desc' ? (
              <ChevronDown size={14} className="text-amber-600" />
            ) : (
              <span className="opacity-40">↕</span>
            )}
          </span>
        )}
      </div>
    </th>
  );
};

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  clickable?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  selected = false,
  clickable = false,
  className = '',
  ...props
}) => {
  return (
    <tr
      className={`
        transition-colors duration-100
        ${selected ? 'bg-amber-50/60' : 'hover:bg-slate-50/60'}
        ${clickable ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </tr>
  );
};

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  align = 'left',
  className = '',
  ...props
}) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <td
      className={`px-3.5 sm:px-4 py-3 text-slate-800 text-xs sm:text-sm ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
};

export interface TableEmptyProps {
  colSpan: number;
  message?: string;
  icon?: React.ReactNode;
}

export const TableEmpty: React.FC<TableEmptyProps> = ({
  colSpan,
  message = 'Nenhum registro encontrado.',
  icon,
}) => {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-slate-400">
        <div className="flex flex-col items-center justify-center gap-2">
          {icon && <div className="text-slate-300">{icon}</div>}
          <p className="text-xs sm:text-sm font-medium">{message}</p>
        </div>
      </td>
    </tr>
  );
};
