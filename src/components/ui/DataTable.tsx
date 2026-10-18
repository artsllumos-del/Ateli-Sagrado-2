import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow, TableEmpty } from './Table';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T, index: number) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  sortColumn?: string | null;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (columnKey: string) => void;
  onRowClick?: (row: T) => void;
  renderMobileCard?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  renderMobileCard,
  className = '',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={`space-y-2 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs ${className}`}>
        <Skeleton height={36} className="w-full rounded-xl" />
        <Skeleton height={44} className="w-full rounded-xl" />
        <Skeleton height={44} className="w-full rounded-xl" />
        <Skeleton height={44} className="w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Mobile Card List (if provided) */}
      {renderMobileCard && (
        <div className="block sm:hidden divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {data.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-400 text-xs font-medium">
              {emptyMessage}
            </div>
          ) : (
            data.map((row, idx) => (
              <div 
                key={keyExtractor(row, idx)} 
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer active:bg-slate-50 transition-colors' : ''}
              >
                {renderMobileCard(row, idx)}
              </div>
            ))
          )}
        </div>
      )}

      {/* Desktop Table View */}
      <div className={renderMobileCard ? 'hidden sm:block' : 'block'}>
        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    align={col.align}
                    style={col.width ? { width: col.width } : undefined}
                    sortable={col.sortable}
                    sortDirection={sortColumn === col.key ? sortDirection : null}
                    onSort={col.sortable && onSort ? () => onSort(col.key) : undefined}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </tr>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableEmpty colSpan={columns.length} message={emptyMessage} />
              ) : (
                data.map((row, idx) => (
                  <TableRow
                    key={keyExtractor(row, idx)}
                    clickable={Boolean(onRowClick)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key} align={col.align}>
                        {col.render
                          ? col.render(row, idx)
                          : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}
