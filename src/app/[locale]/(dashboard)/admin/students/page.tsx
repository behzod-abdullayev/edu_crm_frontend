'use client';

/**
 * Admin Students Page
 * Route: /[locale]/(dashboard)/admin/students
 *
 * Desktop  → full DataTable with sorting, bulk selection, export
 * Mobile   → card list with swipe actions, pull-to-refresh, infinite scroll
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search,
  GraduationCap,
  Plus,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Minus,
} from 'lucide-react';
import { useAdminStudents } from '@modules/admin/hooks/useAdmin';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { EmptyState } from '@shared/components/data-display/EmptyState';
import { useMediaQuery } from '@shared/hooks/useMediaQuery';
import { useDebounce } from '@shared/hooks/useDebounce';
import { cn } from '@shared/utils/cn';
import { formatNumber } from '@shared/utils/format';
import type { StudentDto } from '@modules/admin/types/admin.types';

// ─── Metadata ────────────────────────────────────────────────────────────────


// ─── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusVariant(status: StudentDto['status']) {
  if (status === 'active') return 'success';
  return 'error';
}

function getPaymentVariant(paymentStatus: StudentDto['paymentStatus']) {
  if (paymentStatus === 'paid') return 'success';
  if (paymentStatus === 'pending') return 'warning';
  return 'error';
}

// ─── Inline badge ─────────────────────────────────────────────────────────────

interface InlineBadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'default';
  children: React.ReactNode;
  className?: string;
}

function InlineBadge({ variant, children, className }: InlineBadgeProps) {
  const variantClass = {
    success: 'bg-[var(--success-bg)] border-[var(--success-border)] text-[var(--success-text)]',
    warning: 'bg-[var(--warning-bg)] border-[var(--warning-border)] text-[var(--warning-text)]',
    error:   'bg-[var(--error-bg)]   border-[var(--error-border)]   text-[var(--error-text)]',
    info:    'bg-[var(--info-bg)]    border-[var(--info-border)]    text-[var(--info-text)]',
    default: 'bg-[var(--bg-surface-hover)] border-[var(--border-default)] text-[var(--text-secondary)]',
  }[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
        variantClass,
        className,
      )}
    >
      {children}
    </span>
  );
}

// ─── KPI summary row ──────────────────────────────────────────────────────────

interface KPIBarProps {
  total: number;
  active: number;
  overdue: number;
}

function KPIBar({ total, active, overdue }: KPIBarProps) {
  const pending = total - active - overdue;

  const cards = [
    {
      label: 'Total Students',
      value: total,
      icon: GraduationCap,
      color: 'text-[var(--info-solid)]',
      bg: 'bg-[var(--info-bg)]',
    },
    {
      label: 'Active',
      value: active,
      icon: CheckCircle2,
      color: 'text-[var(--success-text)]',
      bg: 'bg-[var(--success-bg)]',
    },
    {
      label: 'Overdue Payment',
      value: overdue,
      icon: XCircle,
      color: 'text-[var(--error-text)]',
      bg: 'bg-[var(--error-bg)]',
    },
    {
      label: 'Pending',
      value: pending > 0 ? pending : 0,
      icon: Minus,
      color: 'text-[var(--warning-text)]',
      bg: 'bg-[var(--warning-bg)]',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            whileHover={{ translateY: -2, boxShadow: 'var(--shadow-md)' }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
          >
            <div className="flex items-center gap-2.5">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', c.bg)}>
                <Icon size={16} className={c.color} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-muted)] truncate">{c.label}</p>
                <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                  {formatNumber(c.value)}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Desktop table ─────────────────────────────────────────────────────────────

interface DesktopTableProps {
  students: StudentDto[];
  isLoading: boolean;
  onToggleStatus: (id: string, status: 'active' | 'inactive') => Promise<void>;
}

function DesktopTable({ students, isLoading, onToggleStatus }: DesktopTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === students.length
        ? new Set()
        : new Set(students.map((s) => s.id)),
    );
  }, [students]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleStatus = useCallback(
    async (id: string, current: 'active' | 'inactive') => {
      setPendingId(id);
      try {
        await onToggleStatus(id, current === 'active' ? 'inactive' : 'active');
      } finally {
        setPendingId(null);
      }
    },
    [onToggleStatus],
  );

  if (isLoading) {
    return <SkeletonLoader variant="table" />;
  }

  if (students.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No students found"
        description="Try adjusting your search or filter criteria."
      />
    );
  }

  const allSelected = selectedIds.size === students.length && students.length > 0;
  const someSelected = selectedIds.size > 0 && selectedIds.size < students.length;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-default)]">
      {/* Bulk toolbar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-3 border-b border-[var(--border-default)] bg-[var(--brand-primary)]/5 px-4 py-2 overflow-hidden"
          >
            <span className="text-sm font-medium text-[var(--brand-primary)]">
              {selectedIds.size} selected
            </span>
            <button className="ml-auto flex items-center gap-1.5 rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] px-3 py-1.5 text-xs font-medium text-[var(--error-text)] transition-colors hover:bg-[var(--error-solid)] hover:text-white">
              <Trash2 size={12} aria-hidden="true" />
              Deactivate selected
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <table className="w-full" role="table" aria-label="Students">
          {/* Header */}
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-secondary)]">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  aria-label="Select all students"
                  className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-primary)]"
                />
              </th>
              {[
                'Student',
                'Email',
                'Courses',
                'Attendance',
                'Balance',
                'Status',
                'Payment',
                '',
              ].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          {/* Rows */}
          <tbody>
            {students.map((student, idx) => {
              const isSelected = selectedIds.has(student.id);
              const isPending = pendingId === student.id;
              const initials = `${student.name.split(' ')[0]?.[0] ?? ''}${student.name.split(' ')[1]?.[0] ?? ''}`.toUpperCase();

              return (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx, 9) * 0.04 }}
                  className={cn(
                    'border-b border-[var(--border-default)] transition-colors',
                    isSelected
                      ? 'bg-[var(--brand-primary)]/5'
                      : 'hover:bg-[var(--bg-surface-hover)]',
                  )}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(student.id)}
                      aria-label={`Select ${student.name}`}
                      className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-primary)]"
                    />
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-xs font-semibold text-[var(--brand-primary)]">
                        {initials}
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {student.name}
                      </p>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-[var(--text-secondary)] truncate max-w-[180px]">
                      {student.email}
                    </p>
                  </td>

                  {/* Courses */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-[var(--text-secondary)]">
                      {student.courses.length} course{student.courses.length !== 1 ? 's' : ''}
                    </p>
                  </td>

                  {/* Attendance */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--bg-surface-hover)]">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            student.attendancePercent >= 75
                              ? 'bg-[var(--success-solid)]'
                              : student.attendancePercent >= 50
                              ? 'bg-[var(--warning-solid)]'
                              : 'bg-[var(--error-solid)]',
                          )}
                          style={{ width: `${student.attendancePercent}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-[var(--text-secondary)]">
                        {student.attendancePercent}%
                      </span>
                    </div>
                  </td>

                  {/* Balance */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'text-sm font-medium tabular-nums',
                        student.balance < 0
                          ? 'text-[var(--error-text)]'
                          : 'text-[var(--text-primary)]',
                      )}
                    >
                      {student.balance < 0 ? '−' : ''}{formatNumber(Math.abs(student.balance))}{' '}
                      {student.currency}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <InlineBadge variant={getStatusVariant(student.status)}>
                      {student.status}
                    </InlineBadge>
                  </td>

                  {/* Payment */}
                  <td className="px-4 py-3">
                    <InlineBadge variant={getPaymentVariant(student.paymentStatus)}>
                      {student.paymentStatus}
                    </InlineBadge>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                        aria-label={`View ${student.name}`}
                      >
                        <Eye size={14} aria-hidden="true" />
                      </Link>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggleStatus(student.id, student.status)}
                        disabled={isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] disabled:opacity-50"
                        aria-label={`${student.status === 'active' ? 'Deactivate' : 'Activate'} ${student.name}`}
                      >
                        {isPending ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
                        ) : student.status === 'active' ? (
                          <XCircle size={14} aria-hidden="true" />
                        ) : (
                          <CheckCircle2 size={14} aria-hidden="true" />
                        )}
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Mobile student card ───────────────────────────────────────────────────────

function MobileStudentCard({
  student,
  onToggleStatus,
}: {
  student: StudentDto;
  onToggleStatus: (id: string, status: 'active' | 'inactive') => Promise<void>;
}) {
  const [isPending, setIsPending] = useState(false);
  const initials = `${student.name.split(' ')[0]?.[0] ?? ''}${student.name.split(' ')[1]?.[0] ?? ''}`.toUpperCase();

  const toggle = async () => {
    setIsPending(true);
    try {
      await onToggleStatus(student.id, student.status === 'active' ? 'inactive' : 'active');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-sm font-semibold text-[var(--brand-primary)]">
          {initials}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
              {student.name}
            </p>
            <InlineBadge variant={getStatusVariant(student.status)}>
              {student.status}
            </InlineBadge>
          </div>
          <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{student.email}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {/* Attendance */}
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[var(--bg-surface-hover)]">
                <div
                  className={cn(
                    'h-full rounded-full',
                    student.attendancePercent >= 75
                      ? 'bg-[var(--success-solid)]'
                      : student.attendancePercent >= 50
                      ? 'bg-[var(--warning-solid)]'
                      : 'bg-[var(--error-solid)]',
                  )}
                  style={{ width: `${student.attendancePercent}%` }}
                />
              </div>
              <span className="text-xs text-[var(--text-secondary)]">
                {student.attendancePercent}%
              </span>
            </div>

            {/* Payment badge */}
            <InlineBadge variant={getPaymentVariant(student.paymentStatus)}>
              {student.paymentStatus}
            </InlineBadge>

            {/* Balance */}
            <span
              className={cn(
                'text-xs font-medium tabular-nums',
                student.balance < 0 ? 'text-[var(--error-text)]' : 'text-[var(--text-secondary)]',
              )}
            >
              {formatNumber(Math.abs(student.balance))} {student.currency}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2 border-t border-[var(--border-default)] pt-3">
        <Link
          href={`/admin/students/${student.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--border-default)] py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)]"
        >
          <Eye size={12} aria-hidden="true" />
          View
        </Link>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={toggle}
          disabled={isPending}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors disabled:opacity-60',
            student.status === 'active'
              ? 'border border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)]'
              : 'border border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
          )}
        >
          {isPending ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
          ) : student.status === 'active' ? (
            <XCircle size={12} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={12} aria-hidden="true" />
          )}
          {student.status === 'active' ? 'Deactivate' : 'Activate'}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function Pagination({ page, total, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-2 pt-4">
      <p className="text-xs text-[var(--text-muted)]">
        Page {page} of {totalPages} · {formatNumber(total)} students
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] disabled:opacity-40"
        >
          <ChevronLeft size={14} aria-hidden="true" />
        </button>

        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                p === page
                  ? 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]'
                  : 'border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
              )}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] disabled:opacity-40"
        >
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ─── Filter bar ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = ['all', 'active', 'inactive'] as const;
const PAYMENT_FILTERS = ['all', 'paid', 'pending', 'overdue'] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];
type PaymentFilter = (typeof PAYMENT_FILTERS)[number];

interface FilterBarProps {
  search: string;
  onSearch: (q: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  paymentFilter: PaymentFilter;
  onPaymentChange: (p: PaymentFilter) => void;
  onExport: () => void;
}

function FilterBar({
  search,
  onSearch,
  statusFilter,
  onStatusChange,
  paymentFilter,
  onPaymentChange,
  onExport,
}: FilterBarProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search students…"
          aria-label="Search students"
          className="h-10 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-1 overflow-x-auto">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            aria-pressed={statusFilter === s}
            className={cn(
              'whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors',
              statusFilter === s
                ? 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]'
                : 'border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
            )}
          >
            {s === 'all' ? 'All Status' : s}
          </button>
        ))}
      </div>

      {/* Payment filter */}
      <div className="flex gap-1 overflow-x-auto">
        {PAYMENT_FILTERS.map((p) => (
          <button
            key={p}
            onClick={() => onPaymentChange(p)}
            aria-pressed={paymentFilter === p}
            className={cn(
              'whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors',
              paymentFilter === p
                ? 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]'
                : 'border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
            )}
          >
            {p === 'all' ? 'All Payments' : p}
          </button>
        ))}
      </div>

      {/* Export */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onExport}
        className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)]"
        aria-label="Export students CSV"
      >
        <Download size={13} aria-hidden="true" />
        Export
      </motion.button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminStudentsPage() {
  const { students, isLoading, toggleStatus, refresh } = useAdminStudents();

  const isMobile = useMediaQuery('(max-width: 639px)');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  // Client-side filter (production would do server-side)
  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        !debouncedSearch ||
        s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.phone.includes(debouncedSearch);
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || s.paymentStatus === paymentFilter;
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [students, debouncedSearch, statusFilter, paymentFilter]);

  // Pagination slice
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // Reset page on filter change
  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((s: StatusFilter) => {
    setStatusFilter(s);
    setPage(1);
  }, []);

  const handlePaymentChange = useCallback((p: PaymentFilter) => {
    setPaymentFilter(p);
    setPage(1);
  }, []);

  const handleExport = useCallback(() => {
    const csv = [
      'Name,Email,Phone,Courses,Attendance,Balance,Status,Payment',
      ...filtered.map((s) =>
        [s.name, s.email, s.phone, s.courses.join(';'), s.attendancePercent, s.balance, s.status, s.paymentStatus].join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  // KPI counts
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === 'active').length;
  const overdueStudents = students.filter((s) => s.paymentStatus === 'overdue').length;

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-5 lg:px-8 lg:py-8">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-6 flex items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
              Students
            </h1>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">
              {formatNumber(totalStudents)} total students
            </p>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={refresh}
              className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border-default)] px-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] sm:px-4"
              aria-label="Refresh students"
            >
              <Filter size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Refresh</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              className="flex h-10 items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-3 text-sm font-medium text-[var(--text-on-brand)] transition-colors hover:bg-[var(--brand-primary-hover)] sm:px-4"
            >
              <Plus size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Add Student</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ── KPI bar ─────────────────────────────────────────────────── */}
        {!isLoading && (
          <KPIBar
            total={totalStudents}
            active={activeStudents}
            overdue={overdueStudents}
          />
        )}

        {/* ── Filter bar ───────────────────────────────────────────────── */}
        <FilterBar
          search={search}
          onSearch={handleSearch}
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
          paymentFilter={paymentFilter}
          onPaymentChange={handlePaymentChange}
          onExport={handleExport}
        />

        {/* ── Error state ─────────────────────────────────────────────── */}
        {!isLoading && students.length === 0 && !debouncedSearch && (
          <EmptyState
            icon={GraduationCap}
            title="No students yet"
            description="Add your first student to get started."
            action={{ label: 'Add Student', onClick: () => {} }}
          />
        )}

        {/* ── Desktop table ────────────────────────────────────────────── */}
        {!isMobile && (
          <>
            <DesktopTable
              students={paginated}
              isLoading={isLoading}
              onToggleStatus={toggleStatus}
            />
            <Pagination
              page={page}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}

        {/* ── Mobile card list ─────────────────────────────────────────── */}
        {isMobile && (
          <div className="space-y-3">
            {isLoading ? (
              <SkeletonLoader variant="card" count={6} />
            ) : paginated.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No students found"
                description="Try adjusting your search."
              />
            ) : (
              paginated.map((student) => (
                <MobileStudentCard
                  key={student.id}
                  student={student}
                  onToggleStatus={toggleStatus}
                />
              ))
            )}

            {/* Load more */}
            {!isLoading && filtered.length > paginated.length && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setPage((p) => p + 1)}
                className="w-full rounded-xl border border-[var(--border-default)] py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)]"
              >
                Load more
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}