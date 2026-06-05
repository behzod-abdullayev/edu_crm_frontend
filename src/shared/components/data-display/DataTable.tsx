'use client';

/**
 * DataTable — full-featured desktop data table.
 * Mobile: use MobileCardList (< 640px).
 * Tablet: horizontal scroll with reduced columns (640–1023px).
 * Desktop: full features — sorting, pagination, bulk select, export (≥ 1024px).
 */

import {
  useState,
  useCallback,
  useMemo,
  useId,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  Columns,
  CheckSquare,
  Square,
  Minus,
  AlertCircle,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@shared/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortOrder = 'asc' | 'desc';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ColumnDef<T> {
  /** Unique column identifier — used as sort key */
  key: string;
  /** Column header label */
  header: string;
  /** Field key or render function */
  accessor: keyof T | ((row: T) => ReactNode);
  sortable?: boolean;
  /** Optional fixed width (e.g. "120px", "10%") */
  width?: string;
  /** Extra className applied to both th and td */
  className?: string;
  /** Hide on tablet (640–1023px) to reduce column count */
  hideOnTablet?: boolean;
}

export interface BulkAction<T> {
  key: string;
  label: string;
  icon?: React.ElementType;
  variant?: 'default' | 'destructive';
  onClick: (rows: T[]) => void;
}

export interface DataTableProps<T extends Record<string, unknown>> {
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
  /** Property of T used as the unique row identifier */
  rowKey: keyof T;
  className?: string;
  /** Whether to stick the header while scrolling (default: true) */
  stickyHeader?: boolean;
  /** Initial sort column key */
  defaultSortBy?: string;
  /** Initial sort order */
  defaultSortOrder?: SortOrder;
  /** Debounce delay in ms for the search input (default: 300) */
  searchDebounce?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LIMIT_OPTIONS = [10, 25, 50, 100] as const;
const MAX_PAGE_BUTTONS = 5;
const ROW_SKELETON_COUNT = 6;
const ANIMATION_DELAY_PER_ROW = 0.04;
const MAX_ANIMATED_ROWS = 10;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonCell({ width }: { width: string }) {
  return (
    <div
      className="h-4 rounded-md bg-[var(--bg-surface-hover)] relative overflow-hidden"
      style={{ width }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

function SortIcon({
  colKey,
  sortBy,
  sortOrder,
}: {
  colKey: string;
  sortBy: string | null;
  sortOrder: SortOrder;
}) {
  if (sortBy !== colKey) {
    return (
      <ChevronsUpDown
        size={13}
        className="opacity-30 shrink-0"
        aria-hidden="true"
      />
    );
  }
  return sortOrder === 'asc' ? (
    <ChevronUp
      size={13}
      className="text-[var(--brand-primary)] shrink-0"
      aria-hidden="true"
    />
  ) : (
    <ChevronDown
      size={13}
      className="text-[var(--brand-primary)] shrink-0"
      aria-hidden="true"
    />
  );
}

function EmptyStateView({
  title,
  description,
  icon: Icon,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3"
      role="status"
      aria-live="polite"
    >
      {Icon ? (
        <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-hover)] flex items-center justify-center">
          <Icon
            size={24}
            className="text-[var(--text-muted)]"
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-hover)] flex items-center justify-center">
          <Search
            size={22}
            className="text-[var(--text-muted)]"
            aria-hidden="true"
          />
        </div>
      )}
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </p>
      {description && (
        <p className="text-xs text-[var(--text-muted)] max-w-xs">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-1 text-xs font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded-md px-2 py-1"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

function ErrorStateView({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  const t = useTranslations('table');
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3"
      role="alert"
    >
      <div className="w-12 h-12 rounded-xl bg-[var(--error-bg)] flex items-center justify-center">
        <AlertCircle
          size={22}
          className="text-[var(--error-solid)]"
          aria-hidden="true"
        />
      </div>
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        {t('errorTitle')}
      </p>
      <p className="text-xs text-[var(--text-muted)] max-w-xs">
        {error.message || t('errorDesc')}
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 mt-1 text-xs font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded-md px-2 py-1"
      >
        <RefreshCw size={12} aria-hidden="true" />
        {t('retry')}
      </button>
    </motion.div>
  );
}

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
  defaultSortBy = null,
  defaultSortOrder = 'asc',
  searchDebounce = 300,
}: DataTableProps<T>) {
  const t = useTranslations('table');
  const tableId = useId();
  const searchRef = useRef<HTMLInputElement>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<string | null>(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, searchDebounce);

  // Propagate debounced search to parent
  useEffect(() => {
    onSearch?.(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  // Close menus on outside click
  const colMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        colMenuRef.current &&
        !colMenuRef.current.contains(e.target as Node)
      ) {
        setColMenuOpen(false);
      }
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(e.target as Node)
      ) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
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

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
    : 1;

  // ── Handlers ───────────────────────────────────────────────────────────────
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
    if (allSelected) {
      setSelectedKeys(new Set());
      onRowSelect?.([]);
    } else {
      setSelectedKeys(new Set(data.map((r) => String(r[rowKey]))));
      onRowSelect?.([...data]);
    }
  }, [allSelected, data, rowKey, onRowSelect]);

  const toggleRow = useCallback(
    (row: T) => {
      const key = String(row[rowKey]);
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
      // Compute next selected rows synchronously
      const isCurrentlySelected = selectedKeys.has(String(row[rowKey]));
      const nextRows = isCurrentlySelected
        ? selectedRows.filter((r) => r[rowKey] !== row[rowKey])
        : [...selectedRows, row];
      onRowSelect?.(nextRows);
    },
    [rowKey, selectedKeys, selectedRows, onRowSelect]
  );

  const handleClearSelection = useCallback(() => {
    setSelectedKeys(new Set());
    onRowSelect?.([]);
  }, [onRowSelect]);

  const getCellValue = useCallback(
    (col: ColumnDef<T>, row: T): ReactNode => {
      if (typeof col.accessor === 'function') return col.accessor(row);
      const val = row[col.accessor as keyof T];
      return val == null ? '—' : String(val);
    },
    []
  );

  const buildPageButtons = useCallback(() => {
    if (!pagination) return [];
    const half = Math.floor(MAX_PAGE_BUTTONS / 2);
    let start = Math.max(1, pagination.page - half);
    const end = Math.min(totalPages, start + MAX_PAGE_BUTTONS - 1);
    start = Math.max(1, end - MAX_PAGE_BUTTONS + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [pagination, totalPages]);

  // ── Column Visibility ──────────────────────────────────────────────────────
  const toggleColumn = useCallback((key: string) => {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className={cn(
          'border border-[var(--border-default)] rounded-xl overflow-hidden bg-[var(--bg-surface)]',
          className
        )}
      >
        <ErrorStateView
          error={error}
          onRetry={() => onSearch?.(searchQuery)}
        />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={cn('flex flex-col gap-3', className)}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        {onSearch !== undefined && (
          <div className="flex-1 min-w-[180px] relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={searchRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              className={cn(
                'w-full h-9 pl-8 pr-8 text-sm rounded-lg',
                'border border-[var(--border-default)] bg-[var(--bg-surface)]',
                'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
                'transition-colors duration-[var(--transition-fast)]',
                'outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20'
              )}
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => {
                    setSearchQuery('');
                    searchRef.current?.focus();
                  }}
                  aria-label={t('clearSelection')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-focus)]"
                >
                  <X size={13} aria-hidden="true" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Column visibility */}
          <div className="relative" ref={colMenuRef}>
            <button
              onClick={() => {
                setColMenuOpen((v) => !v);
                setExportMenuOpen(false);
              }}
              aria-label={t('toggleColumns')}
              aria-expanded={colMenuOpen}
              aria-haspopup="menu"
              className={cn(
                'flex items-center gap-1.5 h-9 px-3 text-sm rounded-lg',
                'border border-[var(--border-default)] bg-[var(--bg-surface)]',
                'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
                'transition-colors duration-[var(--transition-fast)]',
                'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]'
              )}
            >
              <Columns size={14} aria-hidden="true" />
              <span className="hidden sm:inline">{t('columns')}</span>
            </button>

            <AnimatePresence>
              {colMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  role="menu"
                  aria-label={t('columnVisibility')}
                  className="absolute right-0 top-full mt-1.5 z-30 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-[var(--shadow-lg)] p-1.5 min-w-[180px]"
                >
                  {columns.map((col) => (
                    <label
                      key={col.key}
                      role="menuitemcheckbox"
                      aria-checked={!hiddenCols.has(col.key)}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-sm cursor-pointer hover:bg-[var(--bg-surface-hover)] rounded-lg text-[var(--text-primary)] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={!hiddenCols.has(col.key)}
                        onChange={() => toggleColumn(col.key)}
                        className="w-3.5 h-3.5 accent-[var(--brand-primary)] rounded"
                      />
                      <span>{col.header}</span>
                    </label>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Export */}
          {onExport !== undefined && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => {
                  setExportMenuOpen((v) => !v);
                  setColMenuOpen(false);
                }}
                aria-label={t('export')}
                aria-expanded={exportMenuOpen}
                aria-haspopup="menu"
                className={cn(
                  'flex items-center gap-1.5 h-9 px-3 text-sm rounded-lg',
                  'border border-[var(--border-default)] bg-[var(--bg-surface)]',
                  'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
                  'transition-colors duration-[var(--transition-fast)]',
                  'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]'
                )}
              >
                <Download size={14} aria-hidden="true" />
                <span className="hidden sm:inline">{t('export')}</span>
              </button>

              <AnimatePresence>
                {exportMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    role="menu"
                    className="absolute right-0 top-full mt-1.5 z-30 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-[var(--shadow-lg)] p-1.5 min-w-[140px]"
                  >
                    <button
                      role="menuitem"
                      onClick={() => {
                        onExport('csv');
                        setExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-surface-hover)] rounded-lg text-[var(--text-primary)] transition-colors"
                    >
                      {t('exportCsv')}
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        onExport('excel');
                        setExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-surface-hover)] rounded-lg text-[var(--text-primary)] transition-colors"
                    >
                      {t('exportExcel')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── Bulk actions bar ── */}
      <AnimatePresence>
        {selectedKeys.size > 0 && bulkActions !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20">
              <span className="text-sm font-medium text-[var(--brand-primary)]">
                {t('selectedCount', { count: selectedKeys.size })}
              </span>
              <button
                onClick={handleClearSelection}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-focus)] rounded"
              >
                {t('clearSelection')}
              </button>
              <div className="flex items-center gap-2 ml-auto">
                {bulkActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.key}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => action.onClick(selectedRows)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors',
                        'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                        action.variant === 'destructive'
                          ? 'bg-[var(--error-solid)] text-white hover:bg-[var(--error-solid)]/90'
                          : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]'
                      )}
                    >
                      {Icon !== undefined && (
                        <Icon size={14} aria-hidden="true" />
                      )}
                      {action.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table container ── */}
      <div className="border border-[var(--border-default)] rounded-xl overflow-hidden bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
        <div className="overflow-x-auto">
          <table
            id={tableId}
            role="grid"
            aria-busy={isLoading}
            aria-label={t('noData')}
            className="w-full text-sm border-collapse"
          >
            {/* ── Head ── */}
            <thead
              className={cn(
                stickyHeader &&
                  'sticky top-0 z-10 bg-[var(--bg-surface-secondary)]'
              )}
            >
              <tr className="border-b border-[var(--border-default)]">
                {/* Checkbox column */}
                {onRowSelect !== undefined && (
                  <th
                    scope="col"
                    className="w-10 px-3 py-3 text-left bg-[var(--bg-surface-secondary)]"
                  >
                    <button
                      onClick={toggleAll}
                      aria-label={
                        allSelected ? t('deselectAll') : t('selectAll')
                      }
                      className="text-[var(--text-secondary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded"
                    >
                      {allSelected ? (
                        <CheckSquare
                          size={16}
                          className="text-[var(--brand-primary)]"
                          aria-hidden="true"
                        />
                      ) : someSelected ? (
                        <Minus
                          size={16}
                          className="text-[var(--brand-primary)]"
                          aria-hidden="true"
                        />
                      ) : (
                        <Square
                          size={16}
                          className="text-[var(--text-muted)]"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </th>
                )}

                {/* Data columns */}
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    aria-sort={
                      sortBy === col.key
                        ? sortOrder === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : col.sortable
                          ? 'none'
                          : undefined
                    }
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap',
                      'text-[var(--text-muted)] bg-[var(--bg-surface-secondary)]',
                      col.sortable &&
                        'cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors duration-[var(--transition-fast)]',
                      col.hideOnTablet && 'hidden lg:table-cell',
                      col.className
                    )}
                    onClick={() => col.sortable === true && handleSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.header}
                      {col.sortable === true && (
                        <SortIcon
                          colKey={col.key}
                          sortBy={sortBy}
                          sortOrder={sortOrder}
                        />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            {/* ── Body ── */}
            <tbody>
              {/* Loading skeleton */}
              {isLoading &&
                Array.from({ length: ROW_SKELETON_COUNT }).map((_, i) => (
                  <tr
                    key={`skeleton-${i}`}
                    className="border-b border-[var(--border-default)] last:border-0"
                    aria-hidden="true"
                  >
                    {onRowSelect !== undefined && (
                      <td className="px-3 py-3.5 w-10">
                        <div className="h-4 w-4 rounded bg-[var(--bg-surface-hover)] animate-pulse" />
                      </td>
                    )}
                    {visibleColumns.map((col, colIdx) => (
                      <td
                        key={`skeleton-cell-${colIdx}`}
                        className={cn(
                          'px-4 py-3.5',
                          col.hideOnTablet && 'hidden lg:table-cell'
                        )}
                      >
                        <SkeletonCell
                          width={`${45 + ((i * 13 + colIdx * 17) % 40)}%`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

              {/* Empty state */}
              {!isLoading && data.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      visibleColumns.length + (onRowSelect !== undefined ? 1 : 0)
                    }
                  >
                    <EmptyStateView
                      title={emptyState?.title ?? t('noData')}
                      description={emptyState?.description}
                      icon={emptyState?.icon}
                      action={emptyState?.action}
                    />
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!isLoading &&
                data.map((row, idx) => {
                  const key = String(row[rowKey]);
                  const isSelected = selectedKeys.has(key);
                  return (
                    <motion.tr
                      key={key}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: Math.min(idx, MAX_ANIMATED_ROWS - 1) * ANIMATION_DELAY_PER_ROW,
                        duration: 0.18,
                      }}
                      className={cn(
                        'border-b border-[var(--border-default)] last:border-0',
                        'transition-colors duration-[var(--transition-fast)]',
                        isSelected
                          ? 'bg-[var(--brand-primary)]/5'
                          : 'hover:bg-[var(--bg-surface-hover)]'
                      )}
                    >
                      {/* Row checkbox */}
                      {onRowSelect !== undefined && (
                        <td className="px-3 py-3 w-10">
                          <button
                            onClick={() => toggleRow(row)}
                            aria-label={t('selectRow')}
                            className="text-[var(--text-secondary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded"
                          >
                            {isSelected ? (
                              <CheckSquare
                                size={16}
                                className="text-[var(--brand-primary)]"
                                aria-hidden="true"
                              />
                            ) : (
                              <Square
                                size={16}
                                className="text-[var(--text-muted)]"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        </td>
                      )}

                      {/* Data cells */}
                      {visibleColumns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            'px-4 py-3 text-[var(--text-primary)]',
                            col.hideOnTablet && 'hidden lg:table-cell',
                            col.className
                          )}
                        >
                          {getCellValue(col, row)}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {pagination !== undefined && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[var(--border-default)] bg-[var(--bg-surface-secondary)]">
            {/* Rows per page + info */}
            <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <label
                  htmlFor={`${tableId}-limit`}
                  className="whitespace-nowrap"
                >
                  {t('rowsPerPage')}
                </label>
                <select
                  id={`${tableId}-limit`}
                  value={pagination.limit}
                  onChange={(e) => onLimitChange?.(Number(e.target.value))}
                  className={cn(
                    'h-8 px-2 text-sm rounded-lg border border-[var(--border-default)]',
                    'bg-[var(--bg-surface)] text-[var(--text-primary)]',
                    'outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-[var(--border-focus)]',
                    'cursor-pointer'
                  )}
                >
                  {LIMIT_OPTIONS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <span className="hidden sm:inline whitespace-nowrap">
                {t('pageInfo', {
                  page: pagination.page,
                  total: totalPages,
                })}
              </span>
            </div>

            {/* Page buttons */}
            <nav
              aria-label="Pagination"
              className="flex items-center gap-1"
            >
              {/* Prev */}
              <button
                onClick={() => onPageChange?.(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
                aria-label={t('prevPage')}
                className={cn(
                  'h-8 w-8 flex items-center justify-center rounded-lg text-sm',
                  'border border-[var(--border-default)] transition-colors duration-[var(--transition-fast)]',
                  'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                  pagination.hasPrevPage
                    ? 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)]'
                    : 'opacity-40 cursor-not-allowed text-[var(--text-muted)]'
                )}
              >
                ‹
              </button>

              {/* Page number buttons */}
              {buildPageButtons().map((p) => (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  aria-label={t('goToPage', { page: p })}
                  aria-current={p === pagination.page ? 'page' : undefined}
                  className={cn(
                    'h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium',
                    'transition-colors duration-[var(--transition-fast)]',
                    'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                    p === pagination.page
                      ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                      : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-default)]'
                  )}
                >
                  {p}
                </button>
              ))}

              {/* Next */}
              <button
                onClick={() => onPageChange?.(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                aria-label={t('nextPage')}
                className={cn(
                  'h-8 w-8 flex items-center justify-center rounded-lg text-sm',
                  'border border-[var(--border-default)] transition-colors duration-[var(--transition-fast)]',
                  'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                  pagination.hasNextPage
                    ? 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)]'
                    : 'opacity-40 cursor-not-allowed text-[var(--text-muted)]'
                )}
              >
                ›
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}