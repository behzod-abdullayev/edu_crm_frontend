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
import { useLocale } from 'next-intl';
import { useAdminStudents } from '@modules/admin/hooks/useAdmin';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { EmptyState } from '@shared/components/data-display/EmptyState';
import { useMediaQuery } from '@shared/hooks/useMediaQuery';
import { useDebounce } from '@shared/hooks/useDebounce';
import { cn } from '@shared/utils/cn';
import { formatNumber } from '@shared/utils/format';
import type { StudentDto } from '@modules/admin/types/admin.types';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const I18N = {
  uz: {
    title: 'Talabalar',
    totalStudents: (n: number) => `Jami ${n} ta talaba`,
    refresh: 'Yangilash', refreshAria: 'Talabalar ro\'yxatini yangilash',
    addStudent: "Talaba qo'shish",
    kpiTotal: 'Jami talabalar', kpiActive: 'Faol', kpiOverdue: "To'lov muddati o'tgan", kpiPending: 'Kutilmoqda',
    searchPlaceholder: 'Talabalarni qidirish…', searchAria: 'Talabalarni qidirish',
    filterAllStatus: 'Barcha holatlar', filterActive: 'Faol', filterInactive: 'Nofaol',
    filterAllPayments: "Barcha to'lovlar", filterPaid: "To'langan", filterPending: 'Kutilmoqda', filterOverdue: "Muddati o'tgan",
    export: 'Eksport', exportAria: 'Talabalarni CSV formatda eksport qilish',
    colStudent: 'Talaba', colEmail: 'Email', colCourses: 'Kurslar', colAttendance: 'Davomat',
    colBalance: 'Balans', colStatus: 'Holat', colPayment: "To'lov",
    selectAll: 'Barcha talabalarni tanlash', selectOne: (name: string) => `${name}ni tanlash`,
    bulkSelected: (n: number) => `${n} ta tanlandi`, deactivateSelected: 'Tanlanganlarni faolsizlantirish',
    coursesCount: (n: number) => `${n} ta kurs`,
    viewAria: (name: string) => `${name} profilini ko'rish`,
    toggleAria: (name: string, active: boolean) => active ? `${name}ni faolsizlantirish` : `${name}ni faollashtirish`,
    view: "Ko'rish", activate: 'Faollashtirish', deactivate: 'Faolsizlantirish',
    statusActive: 'Faol', statusInactive: 'Nofaol',
    paymentPaid: "To'langan", paymentPending: 'Kutilmoqda', paymentOverdue: "Muddati o'tgan",
    emptyTitle: 'Talabalar topilmadi', emptyDescTable: "Qidiruv yoki filtr shartlarini o'zgartirib ko'ring.", emptyDescMobile: "Qidiruvni o'zgartirib ko'ring.",
    noStudentsTitle: 'Hozircha talabalar yo\'q', noStudentsDesc: "Boshlash uchun birinchi talabani qo'shing.",
    pageOf: (page: number, total: number) => `${page} / ${total}-sahifa`,
    studentsCount: (n: number) => `${n} ta talaba`,
    prevPage: 'Oldingi sahifa', nextPage: 'Keyingi sahifa', loadMore: "Ko'proq yuklash",
  },
  en: {
    title: 'Students',
    totalStudents: (n: number) => `${n} total students`,
    refresh: 'Refresh', refreshAria: 'Refresh students',
    addStudent: 'Add Student',
    kpiTotal: 'Total Students', kpiActive: 'Active', kpiOverdue: 'Overdue Payment', kpiPending: 'Pending',
    searchPlaceholder: 'Search students…', searchAria: 'Search students',
    filterAllStatus: 'All Status', filterActive: 'Active', filterInactive: 'Inactive',
    filterAllPayments: 'All Payments', filterPaid: 'Paid', filterPending: 'Pending', filterOverdue: 'Overdue',
    export: 'Export', exportAria: 'Export students CSV',
    colStudent: 'Student', colEmail: 'Email', colCourses: 'Courses', colAttendance: 'Attendance',
    colBalance: 'Balance', colStatus: 'Status', colPayment: 'Payment',
    selectAll: 'Select all students', selectOne: (name: string) => `Select ${name}`,
    bulkSelected: (n: number) => `${n} selected`, deactivateSelected: 'Deactivate selected',
    coursesCount: (n: number) => `${n} course${n !== 1 ? 's' : ''}`,
    viewAria: (name: string) => `View ${name}`,
    toggleAria: (name: string, active: boolean) => `${active ? 'Deactivate' : 'Activate'} ${name}`,
    view: 'View', activate: 'Activate', deactivate: 'Deactivate',
    statusActive: 'Active', statusInactive: 'Inactive',
    paymentPaid: 'Paid', paymentPending: 'Pending', paymentOverdue: 'Overdue',
    emptyTitle: 'No students found', emptyDescTable: 'Try adjusting your search or filter criteria.', emptyDescMobile: 'Try adjusting your search.',
    noStudentsTitle: 'No students yet', noStudentsDesc: 'Add your first student to get started.',
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
    studentsCount: (n: number) => `${n} students`,
    prevPage: 'Previous page', nextPage: 'Next page', loadMore: 'Load more',
  },
  ru: {
    title: 'Студенты',
    totalStudents: (n: number) => `Всего студентов: ${n}`,
    refresh: 'Обновить', refreshAria: 'Обновить список студентов',
    addStudent: 'Добавить студента',
    kpiTotal: 'Всего студентов', kpiActive: 'Активные', kpiOverdue: 'Просрочена оплата', kpiPending: 'В ожидании',
    searchPlaceholder: 'Поиск студентов…', searchAria: 'Поиск студентов',
    filterAllStatus: 'Все статусы', filterActive: 'Активные', filterInactive: 'Неактивные',
    filterAllPayments: 'Все платежи', filterPaid: 'Оплачено', filterPending: 'В ожидании', filterOverdue: 'Просрочено',
    export: 'Экспорт', exportAria: 'Экспортировать студентов в CSV',
    colStudent: 'Студент', colEmail: 'Email', colCourses: 'Курсы', colAttendance: 'Посещаемость',
    colBalance: 'Баланс', colStatus: 'Статус', colPayment: 'Оплата',
    selectAll: 'Выбрать всех студентов', selectOne: (name: string) => `Выбрать ${name}`,
    bulkSelected: (n: number) => `Выбрано: ${n}`, deactivateSelected: 'Деактивировать выбранных',
    coursesCount: (n: number) => `${n} курс(ов)`,
    viewAria: (name: string) => `Просмотреть ${name}`,
    toggleAria: (name: string, active: boolean) => active ? `Деактивировать ${name}` : `Активировать ${name}`,
    view: 'Просмотр', activate: 'Активировать', deactivate: 'Деактивировать',
    statusActive: 'Активен', statusInactive: 'Неактивен',
    paymentPaid: 'Оплачено', paymentPending: 'В ожидании', paymentOverdue: 'Просрочено',
    emptyTitle: 'Студенты не найдены', emptyDescTable: 'Попробуйте изменить поиск или фильтры.', emptyDescMobile: 'Попробуйте изменить поиск.',
    noStudentsTitle: 'Пока нет студентов', noStudentsDesc: 'Добавьте первого студента, чтобы начать.',
    pageOf: (page: number, total: number) => `Страница ${page} из ${total}`,
    studentsCount: (n: number) => `Студентов: ${n}`,
    prevPage: 'Предыдущая страница', nextPage: 'Следующая страница', loadMore: 'Загрузить ещё',
  },
} as const;

type Locale = keyof typeof I18N;
type I18NShape = (typeof I18N)[Locale];

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

function statusLabel(status: StudentDto['status'], s: I18NShape) {
  return status === 'active' ? s.statusActive : s.statusInactive;
}

function paymentLabel(paymentStatus: StudentDto['paymentStatus'], s: I18NShape) {
  if (paymentStatus === 'paid') return s.paymentPaid;
  if (paymentStatus === 'pending') return s.paymentPending;
  return s.paymentOverdue;
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
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
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
  s: I18NShape;
}

function KPIBar({ total, active, overdue, s }: KPIBarProps) {
  const pending = total - active - overdue;

  const cards = [
    {
      label: s.kpiTotal,
      value: total,
      icon: GraduationCap,
      color: 'text-[var(--info-solid)]',
      bg: 'bg-[var(--info-bg)]',
    },
    {
      label: s.kpiActive,
      value: active,
      icon: CheckCircle2,
      color: 'text-[var(--success-text)]',
      bg: 'bg-[var(--success-bg)]',
    },
    {
      label: s.kpiOverdue,
      value: overdue,
      icon: XCircle,
      color: 'text-[var(--error-text)]',
      bg: 'bg-[var(--error-bg)]',
    },
    {
      label: s.kpiPending,
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
  s: I18NShape;
}

function DesktopTable({ students, isLoading, onToggleStatus, s }: DesktopTableProps) {
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
        title={s.emptyTitle}
        description={s.emptyDescTable}
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
              {s.bulkSelected(selectedIds.size)}
            </span>
            <button className="ml-auto flex items-center gap-1.5 rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] px-3 py-1.5 text-xs font-medium text-[var(--error-text)] transition-colors hover:bg-[var(--error-solid)] hover:text-white">
              <Trash2 size={12} aria-hidden="true" />
              {s.deactivateSelected}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <table className="w-full" role="table" aria-label={s.title}>
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
                  aria-label={s.selectAll}
                  className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-primary)]"
                />
              </th>
              {[
                s.colStudent,
                s.colEmail,
                s.colCourses,
                s.colAttendance,
                s.colBalance,
                s.colStatus,
                s.colPayment,
                '',
              ].map((h, i) => (
                <th
                  key={`${h}-${i}`}
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
                      aria-label={s.selectOne(student.name)}
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
                      {s.coursesCount(student.courses.length)}
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
                      {statusLabel(student.status, s)}
                    </InlineBadge>
                  </td>

                  {/* Payment */}
                  <td className="px-4 py-3">
                    <InlineBadge variant={getPaymentVariant(student.paymentStatus)}>
                      {paymentLabel(student.paymentStatus, s)}
                    </InlineBadge>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                        aria-label={s.viewAria(student.name)}
                      >
                        <Eye size={14} aria-hidden="true" />
                      </Link>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggleStatus(student.id, student.status)}
                        disabled={isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] disabled:opacity-50"
                        aria-label={s.toggleAria(student.name, student.status === 'active')}
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
  s,
}: {
  student: StudentDto;
  onToggleStatus: (id: string, status: 'active' | 'inactive') => Promise<void>;
  s: I18NShape;
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
              {statusLabel(student.status, s)}
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
              {paymentLabel(student.paymentStatus, s)}
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
          {s.view}
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
          {student.status === 'active' ? s.deactivate : s.activate}
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
  s: I18NShape;
}

function Pagination({ page, total, pageSize, onPageChange, s }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-2 pt-4">
      <p className="text-xs text-[var(--text-muted)]">
        {s.pageOf(page, totalPages)} · {s.studentsCount(total)}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label={s.prevPage}
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
          aria-label={s.nextPage}
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
  s: I18NShape;
}

function FilterBar({
  search,
  onSearch,
  statusFilter,
  onStatusChange,
  paymentFilter,
  onPaymentChange,
  onExport,
  s,
}: FilterBarProps) {
  const statusLabels: Record<StatusFilter, string> = {
    all: s.filterAllStatus,
    active: s.filterActive,
    inactive: s.filterInactive,
  };
  const paymentLabels: Record<PaymentFilter, string> = {
    all: s.filterAllPayments,
    paid: s.filterPaid,
    pending: s.filterPending,
    overdue: s.filterOverdue,
  };

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
          placeholder={s.searchPlaceholder}
          aria-label={s.searchAria}
          className="h-10 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-1 overflow-x-auto">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => onStatusChange(f)}
            aria-pressed={statusFilter === f}
            className={cn(
              'whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors',
              statusFilter === f
                ? 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]'
                : 'border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
            )}
          >
            {statusLabels[f]}
          </button>
        ))}
      </div>

      {/* Payment filter */}
      <div className="flex gap-1 overflow-x-auto">
        {PAYMENT_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => onPaymentChange(f)}
            aria-pressed={paymentFilter === f}
            className={cn(
              'whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors',
              paymentFilter === f
                ? 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]'
                : 'border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
            )}
          >
            {paymentLabels[f]}
          </button>
        ))}
      </div>

      {/* Export */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onExport}
        className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)]"
        aria-label={s.exportAria}
      >
        <Download size={13} aria-hidden="true" />
        {s.export}
      </motion.button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminStudentsPage() {
  const { students, isLoading, toggleStatus, refresh } = useAdminStudents();

  const rawLocale = useLocale();
  const locale: Locale = rawLocale in I18N ? (rawLocale as Locale) : 'en';
  const s = I18N[locale];

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

  const handleStatusChange = useCallback((value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handlePaymentChange = useCallback((value: PaymentFilter) => {
    setPaymentFilter(value);
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

  // True empty-data state (no students at all, regardless of filters)
  const hasNoData = !isLoading && students.length === 0;

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
              {s.title}
            </h1>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">
              {s.totalStudents(totalStudents)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => void refresh()}
              className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border-default)] px-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] sm:px-4"
              aria-label={s.refreshAria}
            >
              <Filter size={14} aria-hidden="true" />
              <span className="hidden sm:inline">{s.refresh}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              className="flex h-10 items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-3 text-sm font-medium text-[var(--text-on-brand)] transition-colors hover:bg-[var(--brand-primary-hover)] sm:px-4"
            >
              <Plus size={14} aria-hidden="true" />
              <span className="hidden sm:inline">{s.addStudent}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ── KPI bar ─────────────────────────────────────────────────── */}
        {!isLoading && !hasNoData && (
          <KPIBar
            total={totalStudents}
            active={activeStudents}
            overdue={overdueStudents}
            s={s}
          />
        )}

        {/* ── Filter bar ───────────────────────────────────────────────── */}
        {!hasNoData && (
          <FilterBar
            search={search}
            onSearch={handleSearch}
            statusFilter={statusFilter}
            onStatusChange={handleStatusChange}
            paymentFilter={paymentFilter}
            onPaymentChange={handlePaymentChange}
            onExport={handleExport}
            s={s}
          />
        )}

        {/* ── Empty / loading / data ───────────────────────────────────── */}
        {hasNoData ? (
          <EmptyState
            icon={GraduationCap}
            title={s.noStudentsTitle}
            description={s.noStudentsDesc}
            action={{ label: s.addStudent, onClick: () => {} }}
          />
        ) : !isMobile ? (
          <>
            <DesktopTable
              students={paginated}
              isLoading={isLoading}
              onToggleStatus={toggleStatus}
              s={s}
            />
            <Pagination
              page={page}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              s={s}
            />
          </>
        ) : (
          <div className="space-y-3">
            {isLoading ? (
              <SkeletonLoader variant="card" count={6} />
            ) : paginated.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title={s.emptyTitle}
                description={s.emptyDescMobile}
              />
            ) : (
              paginated.map((student) => (
                <MobileStudentCard
                  key={student.id}
                  student={student}
                  onToggleStatus={toggleStatus}
                  s={s}
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
                {s.loadMore}
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
