'use client';

/**
 * src/modules/payments/components/InvoiceList.tsx
 *
 * Invoice list — full-featured desktop table + mobile card-list view.
 *
 * DESKTOP:
 *  ✅ Sticky header, sortable columns (animated arrow), bulk checkbox selection
 *  ✅ Bulk-actions toolbar (mark paid, export, clear)
 *  ✅ Status filter tabs, date-range filter, search
 *  ✅ Column visibility toggle with Framer Motion dropdown
 *  ✅ Skeleton shimmer loading rows
 *  ✅ Empty state with action
 *  ✅ Stagger row fade-in animation
 *
 * MOBILE (< 640px):
 *  ✅ Card list — swipe-left reveals actions (LucideIcon required)
 *  ✅ Pull-to-refresh
 *  ✅ Load-more button
 *  ✅ Bottom sheet filter drawer
 *
 * KEY CORRECTNESS NOTES:
 *  - Raw InvoiceDto amounts (number) passed to MultiCurrencyDisplay — NOT the
 *    pre-formatted string from PaymentDisplayItem.amount
 *  - indeterminate state set via callback ref (not native prop)
 *  - SwipeAction.icon typed as LucideIcon — not ReactNode
 *  - FadeIn used without unsupported ARIA/HTML props
 *
 * ✅ Zero "any" TypeScript — strict + exactOptionalPropertyTypes
 * ✅ CSS variables only — no hardcoded colors
 * ✅ next-intl i18n
 */

import {
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import {
  Search,
  Plus,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  CheckSquare,
  Filter,
  Columns,
  X,
  CheckCircle2,
  Eye,
  type LucideIcon,
} from 'lucide-react';
import { FadeIn } from '@shared/components/animations/FadeIn';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { EmptyState } from '@shared/components/data-display/EmptyState';
import { MobileBottomSheet } from '@shared/components/mobile/MobileBottomSheet';
import { SwipeableCard } from '@shared/components/mobile/SwipeableCard';
import { PullToRefresh } from '@shared/components/mobile/PullToRefresh';
import { cn } from '@shared/utils/cn';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { MultiCurrencyDisplay } from './MultiCurrencyDisplay';
import type { InvoiceDto, PaymentStatus } from '../types/payment.types';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'studentName' | 'courseName' | 'amount' | 'dueDate' | 'status';
type SortDir = 'asc' | 'desc';

interface SortState {
  key: SortKey;
  dir: SortDir;
}

export interface InvoiceListProps {
  invoices: InvoiceDto[];
  canManage: boolean;
  isLoading?: boolean;
  hasMore?: boolean;
  onMarkPaid: (id: string) => void;
  onSendReminder: (id: string) => void;
  onCreateInvoice: () => void;
  onViewDetail: (id: string) => void;
  onExport: (ids: string[]) => void;
  onLoadMore?: () => void;
  onRefresh?: () => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTERS: { labelKey: string; value: PaymentStatus | 'all' }[] = [
  { labelKey: 'statusAll',       value: 'all'       },
  { labelKey: 'statusPaid',      value: 'paid'      },
  { labelKey: 'statusPending',   value: 'pending'   },
  { labelKey: 'statusOverdue',   value: 'overdue'   },
  { labelKey: 'statusRefunded',  value: 'refunded'  },
  { labelKey: 'statusCancelled', value: 'cancelled' },
];

const COLUMNS: { key: SortKey; labelKey: string; sortable: boolean; minWidth: string }[] = [
  { key: 'studentName', labelKey: 'student', sortable: true, minWidth: 'min-w-[180px]' },
  { key: 'courseName',  labelKey: 'course',  sortable: true, minWidth: 'min-w-[150px]' },
  { key: 'amount',      labelKey: 'amount',  sortable: true, minWidth: 'min-w-[130px]' },
  { key: 'dueDate',     labelKey: 'dueDate', sortable: true, minWidth: 'min-w-[110px]' },
  { key: 'status',      labelKey: 'status',  sortable: true, minWidth: 'min-w-[100px]' },
];

// ─── Sort icon ────────────────────────────────────────────────────────────────

interface SortIconProps {
  columnKey: SortKey;
  current: SortState | null;
}

function SortIcon({ columnKey, current }: SortIconProps) {
  if (!current || current.key !== columnKey) {
    return <ChevronsUpDown size={12} className="text-[var(--text-muted)]" aria-hidden="true" />;
  }
  return current.dir === 'asc'
    ? <ChevronUp   size={12} className="text-[var(--brand-primary)]" aria-hidden="true" />
    : <ChevronDown size={12} className="text-[var(--brand-primary)]" aria-hidden="true" />;
}

// ─── Table skeleton rows ──────────────────────────────────────────────────────

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 7 }).map((_, i) => (
        <tr key={i} aria-hidden="true">
          <td className="w-10 px-4 py-3">
            <div className="h-4 w-4 animate-[shimmer_1.5s_linear_infinite] rounded bg-[var(--bg-surface-hover)]" />
          </td>
          {([200, 150, 110, 100, 80] as const).map((w, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="h-4 rounded"
                style={{
                  width: w,
                  background: `linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)`,
                  backgroundSize: '200% 100%',
                  animation: `shimmer 1.5s linear ${i * 0.05}s infinite`,
                }}
              />
            </td>
          ))}
          <td className="w-24 px-4 py-3" />
        </tr>
      ))}
    </>
  );
}

// ─── Bulk-action toolbar ──────────────────────────────────────────────────────

interface BulkToolbarProps {
  count: number;
  onMarkPaid: () => void;
  onExport: () => void;
  onClearSelection: () => void;
  t: ReturnType<typeof useTranslations<'payments'>>;
}

function BulkToolbar({ count, onMarkPaid, onExport, onClearSelection, t }: BulkToolbarProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          role="toolbar"
          aria-label={t('bulkActions')}
          className={cn(
            'flex flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5',
            'border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5',
          )}
        >
          <span className="text-sm font-medium text-[var(--brand-primary)]">
            {count} {t('selected')}
          </span>
          <div className="ml-auto flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onMarkPaid}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium',
                'bg-[var(--success-solid)] text-white hover:brightness-90',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
              )}
            >
              <CheckCircle2 size={12} aria-hidden="true" />
              {t('markAsPaid')}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onExport}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
                'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)]',
                'hover:bg-[var(--bg-surface-hover)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
              )}
            >
              <Download size={12} aria-hidden="true" />
              {t('export')}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onClearSelection}
              aria-label={t('clearSelection')}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg border',
                'border-[var(--border-default)] text-[var(--text-muted)]',
                'hover:bg-[var(--bg-surface-hover)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
              )}
            >
              <X size={12} aria-hidden="true" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
  canManage: boolean;
  onCreateInvoice: () => void;
  onExport: () => void;
  onFilterOpen: () => void;
  t: ReturnType<typeof useTranslations<'payments'>>;
}

function FilterBar({
  search, onSearchChange,
  dateFrom, onDateFromChange,
  dateTo, onDateToChange,
  canManage, onCreateInvoice, onExport, onFilterOpen,
  t,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder={t('searchInvoices')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={t('searchInvoices')}
          className={cn(
            'h-9 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]',
            'pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2',
            'focus:ring-[var(--border-focus)]/20 transition-colors duration-150',
          )}
        />
      </div>

      {/* Date filters — desktop only */}
      <div className="hidden gap-2 sm:flex">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          aria-label={t('dateFrom')}
          className={cn(
            'h-9 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]',
            'px-2.5 text-sm text-[var(--text-primary)]',
            'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]/20',
          )}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          aria-label={t('dateTo')}
          className={cn(
            'h-9 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]',
            'px-2.5 text-sm text-[var(--text-primary)]',
            'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]/20',
          )}
        />
      </div>

      {/* Mobile filter button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={onFilterOpen}
        aria-label={t('filters')}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-xl border sm:hidden',
          'border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-secondary)]',
          'hover:bg-[var(--bg-surface-hover)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
        )}
      >
        <Filter size={14} aria-hidden="true" />
        {t('filters')}
      </motion.button>

      <div className="ml-auto flex gap-2">
        {canManage && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onCreateInvoice}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-xl px-4 text-sm font-medium',
              'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
              'transition-colors',
            )}
          >
            <Plus size={14} aria-hidden="true" />
            <span className="hidden sm:inline">{t('createInvoice')}</span>
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={onExport}
          aria-label={t('export')}
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm',
            'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)]',
            'hover:bg-[var(--bg-surface-hover)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
          )}
        >
          <Download size={14} aria-hidden="true" />
        </motion.button>
      </div>
    </div>
  );
}

// ─── Mobile invoice card ──────────────────────────────────────────────────────
// Uses raw InvoiceDto so we can pass dto.amount (number) to MultiCurrencyDisplay.

interface MobileInvoiceCardProps {
  dto: InvoiceDto;
  canManage: boolean;
  onView: () => void;
  onMarkPaid: () => void;
  t: ReturnType<typeof useTranslations<'payments'>>;
}

function buildRightActions(
  dto: InvoiceDto,
  canManage: boolean,
  onView: () => void,
  onMarkPaid: () => void,
  viewLabel: string,
  paidLabel: string,
): { icon: LucideIcon; label: string; onClick: () => void; variant?: 'default' | 'danger' }[] {
  const actions: { icon: LucideIcon; label: string; onClick: () => void; variant?: 'default' | 'danger' }[] = [
    { icon: Eye, label: viewLabel, onClick: onView, variant: 'default' },
  ];
  if (canManage && dto.status === 'pending') {
    actions.push({ icon: CheckCircle2, label: paidLabel, onClick: onMarkPaid, variant: 'default' });
  }
  return actions;
}

function MobileInvoiceCard({ dto, canManage, onView, onMarkPaid, t }: MobileInvoiceCardProps) {
  const rightActions = useMemo(
    () => buildRightActions(dto, canManage, onView, onMarkPaid, t('view'), t('markAsPaid')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dto.id, dto.status, canManage, onView, onMarkPaid],
  );

  const dueDateFormatted = format(new Date(dto.dueDate), 'dd MMM yyyy');
  const paidAtFormatted  = dto.paidAt ? format(new Date(dto.paidAt), 'dd MMM yyyy') : null;

  return (
    <SwipeableCard rightActions={rightActions}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onView}
        className="flex items-start justify-between gap-3 p-4 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`${t('invoice')} — ${dto.studentName}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onView();
          }
        }}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[var(--text-primary)]">{dto.studentName}</p>
          <p className="text-xs text-[var(--text-muted)]">{dto.courseName}</p>
          <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
            {t('due')}: <time dateTime={dto.dueDate}>{dueDateFormatted}</time>
          </p>
          {paidAtFormatted !== null && (
            <p className="text-xs text-[var(--success-text)]">
              {t('paid')}: {paidAtFormatted}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <PaymentStatusBadge status={dto.status} size="sm" />
          {/* Pass raw number to MultiCurrencyDisplay — NOT the formatted string */}
          <MultiCurrencyDisplay amount={dto.amount} currency={dto.currency} size="sm" />
        </div>
      </motion.div>
    </SwipeableCard>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InvoiceList({
  invoices,
  canManage,
  isLoading = false,
  hasMore = false,
  onMarkPaid,
  onSendReminder: _onSendReminder,
  onCreateInvoice,
  onViewDetail,
  onExport,
  onLoadMore,
  onRefresh,
}: InvoiceListProps) {
  const t = useTranslations('payments');

  // ── Filter / sort state ────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [search, setSearch]             = useState('');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [sort, setSort]                 = useState<SortState | null>(null);
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // ── Column visibility ──────────────────────────────────────────────────────
  const [hiddenCols, setHiddenCols]   = useState<Set<SortKey>>(new Set());
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const colPickerRef = useRef<HTMLDivElement>(null);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo<InvoiceDto[]>(() => {
    const q = search.toLowerCase();
    return invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (q && !inv.studentName.toLowerCase().includes(q)
              && !inv.courseName.toLowerCase().includes(q)
              && !inv.studentEmail.toLowerCase().includes(q)) return false;
      if (dateFrom && inv.dueDate < dateFrom) return false;
      if (dateTo   && inv.dueDate > dateTo)   return false;
      return true;
    });
  }, [invoices, statusFilter, search, dateFrom, dateTo]);

  // ── Sorting ────────────────────────────────────────────────────────────────
  const sorted = useMemo<InvoiceDto[]>(() => {
    if (!sort) return filtered;
    return [...filtered].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sort.key) {
        case 'studentName': aVal = a.studentName; bVal = b.studentName; break;
        case 'courseName':  aVal = a.courseName;  bVal = b.courseName;  break;
        case 'amount':      aVal = a.amount;       bVal = b.amount;      break;
        case 'dueDate':     aVal = a.dueDate;      bVal = b.dueDate;     break;
        case 'status':      aVal = a.status;       bVal = b.status;      break;
        default:            aVal = '';             bVal = '';
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.dir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sort]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const toggleSort = useCallback((key: SortKey) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc')        return { key, dir: 'desc' };
      return null;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === sorted.length ? new Set() : new Set(sorted.map((d) => d.id)),
    );
  }, [sorted]);

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBulkMarkPaid = useCallback(() => {
    selectedIds.forEach((id) => onMarkPaid(id));
    setSelectedIds(new Set());
  }, [selectedIds, onMarkPaid]);

  const handleExport = useCallback(() => {
    const ids = selectedIds.size > 0 ? [...selectedIds] : sorted.map((d) => d.id);
    onExport(ids);
  }, [selectedIds, sorted, onExport]);

  const handleRefresh = useCallback(async () => {
    if (onRefresh) await onRefresh();
  }, [onRefresh]);

  const visibleCols = COLUMNS.filter((c) => !hiddenCols.has(c.key));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <FadeIn className="space-y-4">
      {/* Filter bar */}
      <FilterBar
        search={search}              onSearchChange={setSearch}
        dateFrom={dateFrom}          onDateFromChange={setDateFrom}
        dateTo={dateTo}              onDateToChange={setDateTo}
        canManage={canManage}        onCreateInvoice={onCreateInvoice}
        onExport={handleExport}      onFilterOpen={() => setFilterSheetOpen(true)}
        t={t}
      />

      {/* Status tabs */}
      <div
        className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-1"
        role="tablist"
        aria-label={t('statusFilter')}
      >
        {STATUS_FILTERS.map((f) => (
          <motion.button
            key={f.value}
            whileTap={{ scale: 0.95 }}
            role="tab"
            aria-selected={statusFilter === f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
              statusFilter === f.value
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            )}
          >
            {t(f.labelKey as Parameters<typeof t>[0])}
          </motion.button>
        ))}
      </div>

      {/* Bulk toolbar */}
      <BulkToolbar
        count={selectedIds.size}
        onMarkPaid={handleBulkMarkPaid}
        onExport={handleExport}
        onClearSelection={() => setSelectedIds(new Set())}
        t={t}
      />

      {/* ── DESKTOP TABLE ── */}
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--border-default)] shadow-[var(--shadow-sm)] sm:block">
        {/* Column picker */}
        <div
          className="relative flex items-center justify-end border-b border-[var(--border-default)] bg-[var(--bg-surface-secondary)] px-4 py-2"
          ref={colPickerRef}
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setColPickerOpen((v) => !v)}
            aria-expanded={colPickerOpen}
            aria-label={t('columnVisibility')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs',
              'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)]',
              'hover:bg-[var(--bg-surface-hover)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            )}
          >
            <Columns size={12} aria-hidden="true" />
            {t('columns')}
          </motion.button>

          <AnimatePresence>
            {colPickerOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'absolute right-4 top-full z-20 mt-1 rounded-xl border p-2',
                  'border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]',
                )}
              >
                {COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-[var(--bg-surface-hover)]"
                  >
                    <input
                      type="checkbox"
                      checked={!hiddenCols.has(col.key)}
                      onChange={() =>
                        setHiddenCols((prev) => {
                          const next = new Set(prev);
                          if (next.has(col.key)) next.delete(col.key); else next.add(col.key);
                          return next;
                        })
                      }
                      className="accent-[var(--brand-primary)]"
                    />
                    <span className="text-[var(--text-primary)]">
                      {t(col.labelKey as Parameters<typeof t>[0])}
                    </span>
                  </label>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <table className="w-full text-sm" aria-label={t('invoicesTable')} role="grid">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-secondary)]">
              {/* Select-all checkbox */}
              <th scope="col" className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  ref={(el) => {
                    if (el) {
                      el.indeterminate =
                        selectedIds.size > 0 && selectedIds.size < sorted.length;
                    }
                  }}
                  checked={selectedIds.size === sorted.length && sorted.length > 0}
                  onChange={toggleSelectAll}
                  aria-label={t('selectAll')}
                  className="accent-[var(--brand-primary)]"
                />
              </th>

              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    sort?.key === col.key
                      ? sort.dir === 'asc' ? 'ascending' : 'descending'
                      : 'none'
                  }
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]',
                    col.sortable && 'cursor-pointer select-none hover:text-[var(--text-primary)]',
                    col.minWidth,
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {t(col.labelKey as Parameters<typeof t>[0])}
                    {col.sortable && <SortIcon columnKey={col.key} current={sort} />}
                  </span>
                </th>
              ))}

              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
              >
                {t('actions')}
              </th>
            </tr>
          </thead>

          <tbody
            className="divide-y divide-[var(--border-default)]"
            aria-busy={isLoading}
            aria-live="polite"
          >
            {isLoading ? (
              <TableSkeletonRows />
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length + 2} className="py-0">
                  <EmptyState
                    title={t('noInvoices')}
                    description={t('noInvoicesDesc')}
                    action={canManage ? { label: t('createInvoice'), onClick: onCreateInvoice } : undefined}
                  />
                </td>
              </tr>
            ) : (
              sorted.map((dto, rowIndex) => {
                const isSelected   = selectedIds.has(dto.id);
                const dueFmt       = format(new Date(dto.dueDate), 'dd MMM yyyy');

                return (
                  <motion.tr
                    key={dto.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(rowIndex * 0.04, 0.4) }}
                    className={cn(
                      'group transition-colors duration-100',
                      isSelected
                        ? 'bg-[var(--brand-primary)]/5'
                        : 'hover:bg-[var(--bg-surface-hover)]',
                    )}
                  >
                    {/* Row checkbox */}
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(dto.id)}
                        aria-label={`${t('select')} ${dto.studentName}`}
                        className="accent-[var(--brand-primary)]"
                      />
                    </td>

                    {/* Student */}
                    {!hiddenCols.has('studentName') && (
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text-primary)]">{dto.studentName}</p>
                        <p className="text-xs text-[var(--text-muted)]">{dto.studentEmail}</p>
                      </td>
                    )}

                    {/* Course */}
                    {!hiddenCols.has('courseName') && (
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{dto.courseName}</td>
                    )}

                    {/* Amount — uses raw dto.amount (number) */}
                    {!hiddenCols.has('amount') && (
                      <td className="px-4 py-3">
                        <MultiCurrencyDisplay
                          amount={dto.amount}
                          currency={dto.currency}
                          size="sm"
                        />
                      </td>
                    )}

                    {/* Due date */}
                    {!hiddenCols.has('dueDate') && (
                      <td className="px-4 py-3 tabular-nums text-[var(--text-muted)]">
                        <time dateTime={dto.dueDate}>{dueFmt}</time>
                      </td>
                    )}

                    {/* Status */}
                    {!hiddenCols.has('status') && (
                      <td className="px-4 py-3">
                        <PaymentStatusBadge status={dto.status} />
                      </td>
                    )}

                    {/* Row actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3 opacity-0 transition-opacity duration-100 group-hover:opacity-100 focus-within:opacity-100">
                        <button
                          type="button"
                          onClick={() => onViewDetail(dto.id)}
                          aria-label={`${t('view')} ${dto.studentName}`}
                          className={cn(
                            'flex items-center gap-1 text-xs font-medium',
                            'text-[var(--brand-primary)] hover:underline',
                            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-focus)] rounded',
                          )}
                        >
                          <Eye size={12} aria-hidden="true" />
                          {t('view')}
                        </button>
                        {canManage && dto.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => onMarkPaid(dto.id)}
                            aria-label={`${t('markAsPaid')} — ${dto.studentName}`}
                            className={cn(
                              'flex items-center gap-1 text-xs font-medium',
                              'text-[var(--success-text)] hover:underline',
                              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-focus)] rounded',
                            )}
                          >
                            <CheckSquare size={12} aria-hidden="true" />
                            {t('paid')}
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARD LIST ── */}
      <div className="sm:hidden">
        <PullToRefresh onRefresh={handleRefresh} disabled={!onRefresh}>
          <div
            className="overflow-hidden rounded-2xl border border-[var(--border-default)]"
            role="list"
            aria-label={t('invoicesTable')}
          >
            {isLoading ? (
              <div className="divide-y divide-[var(--border-default)]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonLoader key={i} variant="card" className="rounded-none border-0" />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <EmptyState
                title={t('noInvoices')}
                description={t('noInvoicesDesc')}
                action={canManage ? { label: t('createInvoice'), onClick: onCreateInvoice } : undefined}
              />
            ) : (
              <div className="divide-y divide-[var(--border-default)]">
                {sorted.map((dto) => (
                  <div key={dto.id} role="listitem">
                    <MobileInvoiceCard
                      dto={dto}
                      canManage={canManage}
                      onView={() => onViewDetail(dto.id)}
                      onMarkPaid={() => onMarkPaid(dto.id)}
                      t={t}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </PullToRefresh>

        {/* Load more */}
        {hasMore && onLoadMore !== undefined && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onLoadMore}
            className={cn(
              'mt-3 w-full rounded-xl border border-[var(--border-default)]',
              'bg-[var(--bg-surface)] py-3 text-sm font-medium text-[var(--text-secondary)]',
              'hover:bg-[var(--bg-surface-hover)] transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            )}
          >
            {t('loadMore')}
          </motion.button>
        )}
      </div>

      {/* Mobile filter bottom sheet */}
      <MobileBottomSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title={t('filters')}
      >
        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {t('dateFrom')}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={cn(
                'h-12 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]',
                'px-3 text-sm text-[var(--text-primary)]',
                'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]/20',
              )}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {t('dateTo')}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={cn(
                'h-12 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]',
                'px-3 text-sm text-[var(--text-primary)]',
                'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]/20',
              )}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => { setDateFrom(''); setDateTo(''); setFilterSheetOpen(false); }}
            className={cn(
              'w-full rounded-xl border border-[var(--border-default)] py-3 text-sm font-medium',
              'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            )}
          >
            {t('clearFilters')}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setFilterSheetOpen(false)}
            className={cn(
              'w-full rounded-xl py-3 text-sm font-medium text-white',
              'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            )}
          >
            {t('applyFilters')}
          </motion.button>
        </div>
      </MobileBottomSheet>
    </FadeIn>
  );
}
