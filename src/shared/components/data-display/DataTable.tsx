'use client';

/**
 * DataTable — full-featured desktop data table.
 * @note Use MobileCardList for mobile viewports (< 640px).
 */

import { useState, useCallback, useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ChevronUp, ChevronDown, ChevronsUpDown, Download,
  Columns, CheckSquare, Square, Minus,
} from 'lucide-react';
import { SearchInput } from '@shared/components/forms/SearchInput';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { cn } from '@shared/utils/cn';
import type { EmptyStateProps, PaginationMeta, SortOrder } from '@shared/types';

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  width?: string;
  className?: string;
}

export interface BulkAction<T> {
  key: string;
  label: string;
  icon?: React.ElementType;
  variant?: 'default' | 'destructive';
  onClick: (rows: T[]) => void;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading: boolean;
  error?: Error | null;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSort?: (sortBy: string, order: SortOrder) => void;
  onSearch?: (query: string) => void;
  onRowSelect?: (rows: T[]) => void;
  bulkActions?: BulkAction<T>[];
  onExport?: (format: 'csv' | 'excel') => void;
  emptyState?: EmptyStateProps;
  rowKey: keyof T;
  className?: string;
  stickyHeader?: boolean;
}

const LIMIT_OPTIONS = [10, 25, 50, 100];

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading,
  error,
  pagination,
  onPageChange,
  onLimitChange,
  onSort,
  onSearch,
  onRowSelect,
  bulkActions,
  onExport,
  emptyState,
  rowKey,
  className,
  stickyHeader = true,
}: DataTableProps<T>) {
  const t = useTranslations('table');
  const tableId = useId();
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenCols.has(c.key)),
    [columns, hiddenCols]
  );

  const selectedRows = useMemo(
    () => data.filter((row) => selectedKeys.has(String(row[rowKey]))),
    [data, selectedKeys, rowKey]
  );

  const allSelected = data.length > 0 && selectedKeys.size === data.length;
  const someSelected = selectedKeys.size > 0 && !allSelected;

  const handleSort = useCallback(
    (key: string) => {
      const newOrder: SortOrder =
        sortBy === key ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc';
      setSortBy(key);
      setSortOrder(newOrder);
      onSort?.(key, newOrder);
    },
    [sortBy, sortOrder, onSort]
  );

  const toggleAll = useCallback(() => {
    const next = allSelected
      ? new Set<string>()
      : new Set(data.map((r) => String(r[rowKey])));
    setSelectedKeys(next);
    onRowSelect?.(allSelected ? [] : [...data]);
  }, [allSelected, data, rowKey, onRowSelect]);

  const toggleRow = useCallback(
    (row: T) => {
      const key = String(row[rowKey]);
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
      });
      onRowSelect?.(
        selectedKeys.has(String(row[rowKey]))
          ? selectedRows.filter((r) => r[rowKey] !== row[rowKey])
          : [...selectedRows, row]
      );
    },
    [rowKey, selectedKeys, selectedRows, onRowSelect]
  );

  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q);
      onSearch?.(q);
    },
    [onSearch]
  );

  const getCellValue = (col: ColumnDef<T>, row: T): React.ReactNode => {
    if (typeof col.accessor === 'function') return col.accessor(row);
    return String(row[col.accessor] ?? '');
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortBy !== colKey) return <ChevronsUpDown size={13} className="opacity-40" />;
    return sortOrder === 'asc'
      ? <ChevronUp size={13} className="text-[var(--color-accent)]" />
      : <ChevronDown size={13} className="text-[var(--color-accent)]" />;
  };

  if (error) {
    return <ErrorState error={error} onRetry={() => onSearch?.(searchQuery)} />;
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {onSearch && (
          <div className="flex-1 min-w-48">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder={t('searchPlaceholder')}
              isLoading={isLoading}
            />
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {/* Column visibility */}
          <div className="relative group">
            <button
              aria-label={t('toggleColumns')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] hover:bg-[var(--bg-sidebar-item-hover)] transition-colors text-[var(--color-text-secondary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              <Columns size={14} aria-hidden="true" />
              {t('columns')}
            </button>
            <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--bg-surface)] border border-[var(--color-border)] rounded-lg shadow-lg p-2 min-w-[160px] hidden group-focus-within:block">
              {columns.map((col) => (
                <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-[var(--bg-sidebar-item-hover)] rounded-md">
                  <input
                    type="checkbox"
                    checked={!hiddenCols.has(col.key)}
                    onChange={() => setHiddenCols((prev) => {
                      const next = new Set(prev);
                      next.has(col.key) ? next.delete(col.key) : next.add(col.key);
                      return next;
                    })}
                    className="accent-[var(--color-accent)]"
                  />
                  <span>{col.header}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Export */}
          {onExport && (
            <div className="relative group">
              <button
                aria-label={t('export')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] hover:bg-[var(--bg-sidebar-item-hover)] transition-colors text-[var(--color-text-secondary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                <Download size={14} aria-hidden="true" />
                {t('export')}
              </button>
              <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--bg-surface)] border border-[var(--color-border)] rounded-lg shadow-lg p-1 min-w-[120px] hidden group-focus-within:block">
                <button onClick={() => onExport('csv')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--bg-sidebar-item-hover)] rounded-md">CSV</button>
                <button onClick={() => onExport('excel')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--bg-sidebar-item-hover)] rounded-md">Excel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selectedKeys.size > 0 && bulkActions && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 overflow-hidden"
          >
            <span className="text-sm font-medium text-[var(--color-accent)]">
              {t('selectedCount', { count: selectedKeys.size })}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              {bulkActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.key}
                    onClick={() => action.onClick(selectedRows)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
                      action.variant === 'destructive'
                        ? 'bg-[var(--color-error)] text-white hover:bg-[var(--color-error-dark)]'
                        : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-dark)]'
                    )}
                  >
                    {Icon && <Icon size={14} aria-hidden="true" />}
                    {action.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table
            id={tableId}
            role="grid"
            aria-busy={isLoading}
            className="w-full text-sm"
          >
            <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
              <tr className="bg-[var(--bg-table-header)] border-b border-[var(--color-border)]">
                {onRowSelect && (
                  <th className="w-10 px-3 py-3 text-left" scope="col">
                    <button
                      onClick={toggleAll}
                      aria-label={allSelected ? t('deselectAll') : t('selectAll')}
                      className="text-[var(--color-text-secondary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] rounded"
                    >
                      {allSelected ? (
                        <CheckSquare size={16} className="text-[var(--color-accent)]" />
                      ) : someSelected ? (
                        <Minus size={16} className="text-[var(--color-accent)]" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                )}
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    className={cn(
                      'px-4 py-3 text-left font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wide whitespace-nowrap',
                      col.sortable && 'cursor-pointer select-none hover:text-[var(--color-text-primary)] transition-colors',
                      col.className
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                    aria-sort={sortBy === col.key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <span className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && <SortIcon colKey={col.key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                    {onRowSelect && <td className="px-3 py-3 w-10"><div className="h-4 w-4 rounded bg-[var(--color-skeleton)] animate-pulse" /></td>}
                    {visibleColumns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div
                          className="h-4 rounded bg-[var(--color-skeleton)] animate-pulse"
                          style={{ width: `${50 + Math.random() * 40}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + (onRowSelect ? 1 : 0)} className="py-16">
                    <EmptyState
                      title={emptyState?.title ?? t('noData')}
                      {...(emptyState?.description !== undefined ? { description: emptyState.description } : {})}
                      {...(emptyState?.action !== undefined ? { action: emptyState.action } : {})}
                      {...(emptyState?.icon !== undefined ? { icon: emptyState.icon as import('lucide-react').LucideIcon } : {})}
                    />
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => {
                  const key = String(row[rowKey]);
                  const isSelected = selectedKeys.has(key);
                  return (
                    <motion.tr
                      key={key}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx, 9) * 0.05, duration: 0.2 }}
                      className={cn(
                        'border-b border-[var(--color-border)] last:border-0 transition-colors',
                        isSelected ? 'bg-[var(--color-accent)]/5' : 'hover:bg-[var(--bg-sidebar-item-hover)]'
                      )}
                    >
                      {onRowSelect && (
                        <td className="px-3 py-3 w-10">
                          <button
                            onClick={() => toggleRow(row)}
                            aria-label={t('selectRow')}
                            className="text-[var(--color-text-secondary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] rounded"
                          >
                            {isSelected
                              ? <CheckSquare size={16} className="text-[var(--color-accent)]" />
                              : <Square size={16} />
                            }
                          </button>
                        </td>
                      )}
                      {visibleColumns.map((col) => (
                        <td
                          key={col.key}
                          className={cn('px-4 py-3 text-[var(--color-text-primary)]', col.className)}
                        >
                          {getCellValue(col, row)}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)] bg-[var(--bg-table-header)]">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <span>{t('rowsPerPage')}</span>
              <select
                value={pagination.limit}
                onChange={(e) => onLimitChange?.(Number(e.target.value))}
                aria-label={t('rowsPerPage')}
                className="border border-[var(--color-border)] rounded-md px-2 py-1 text-sm bg-[var(--bg-surface)] text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              >
                {LIMIT_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-[var(--color-text-muted)] mr-2">
                {t('pageInfo', { page: pagination.page, total: Math.ceil(pagination.total / pagination.limit) })}
              </span>
              <button
                onClick={() => onPageChange?.(pagination.page - 1)}
                disabled={pagination.page <= 1}
                aria-label={t('prevPage')}
                className="px-2.5 py-1 rounded-md border border-[var(--color-border)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg-sidebar-item-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(5, Math.ceil(pagination.total / pagination.limit)) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  aria-label={t('goToPage', { page: p })}
                  aria-current={p === pagination.page ? 'page' : undefined}
                  className={cn(
                    'w-8 h-8 rounded-md text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
                    p === pagination.page
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'hover:bg-[var(--bg-sidebar-item-hover)] text-[var(--color-text-primary)]'
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => onPageChange?.(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                aria-label={t('nextPage')}
                className="px-2.5 py-1 rounded-md border border-[var(--color-border)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg-sidebar-item-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
