'use client';

/**
 * Admin Teachers Page
 * Route: /[locale]/(dashboard)/admin/teachers
 *
 * Desktop  → full data table with sorting, status toggle, export
 * Mobile   → card list with swipe actions and load-more
 */

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Search,
  UserCheck,
  UserX,
  Users,
  Layers,
  Plus,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useAdminTeachers } from '@modules/admin/hooks/useAdmin';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { EmptyState } from '@shared/components/data-display/EmptyState';
import { useMediaQuery } from '@shared/hooks/useMediaQuery';
import { useDebounce } from '@shared/hooks/useDebounce';
import { cn } from '@shared/utils/cn';
import { formatNumber, formatDate } from '@shared/utils/format';
import type { TeacherDto } from '@modules/admin/types/admin.types';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const I18N = {
  uz: {
    title: "O'qituvchilar",
    totalTeachers: (n: number) => `Jami ${n} ta o'qituvchi`,
    export: 'Eksport', exportAria: "O'qituvchilarni CSV formatda eksport qilish",
    addTeacher: "O'qituvchi qo'shish",
    kpiTotal: "Jami o'qituvchilar", kpiActive: 'Faol', kpiInactive: 'Nofaol', kpiAvgGroups: "O'rtacha guruhlar",
    searchPlaceholder: "O'qituvchilarni qidirish…", searchAria: "O'qituvchilarni qidirish",
    filterAll: 'Barcha holatlar', filterActive: 'Faol', filterInactive: 'Nofaol',
    colTeacher: "O'qituvchi", colEmail: 'Email', colPhone: 'Telefon', colGroups: 'Guruhlar',
    colBranch: 'Filial', colJoined: 'Qo\'shilgan sana', colStatus: 'Holat',
    selectAll: "Barcha o'qituvchilarni tanlash", selectOne: (name: string) => `${name}ni tanlash`,
    viewAria: (name: string) => `${name} profilini ko'rish`,
    toggleAria: (name: string, active: boolean) => active ? `${name}ni faolsizlantirish` : `${name}ni faollashtirish`,
    viewProfile: 'Profilni ko\'rish', activate: 'Faollashtirish', deactivate: 'Faolsizlantirish',
    groupsLabel: 'guruh',
    emptyTitle: "O'qituvchilar topilmadi", emptyDescTable: "Filtrlarni o'zgartirib ko'ring.", emptyDescMobile: "Qidiruvni o'zgartirib ko'ring.",
    statusActive: 'Faol', statusInactive: 'Nofaol',
    pageOf: (page: number, total: number) => `${page} / ${total}-sahifa`,
    teachersCount: (n: number) => `${n} ta o'qituvchi`,
    prevPage: 'Oldingi sahifa', nextPage: 'Keyingi sahifa', loadMore: "Ko'proq yuklash",
  },
  en: {
    title: 'Teachers',
    totalTeachers: (n: number) => `${n} total teachers`,
    export: 'Export', exportAria: 'Export teachers CSV',
    addTeacher: 'Add Teacher',
    kpiTotal: 'Total Teachers', kpiActive: 'Active', kpiInactive: 'Inactive', kpiAvgGroups: 'Avg Groups',
    searchPlaceholder: 'Search teachers…', searchAria: 'Search teachers',
    filterAll: 'All Status', filterActive: 'Active', filterInactive: 'Inactive',
    colTeacher: 'Teacher', colEmail: 'Email', colPhone: 'Phone', colGroups: 'Groups',
    colBranch: 'Branch', colJoined: 'Joined', colStatus: 'Status',
    selectAll: 'Select all teachers', selectOne: (name: string) => `Select ${name}`,
    viewAria: (name: string) => `View ${name}`,
    toggleAria: (name: string, active: boolean) => `${active ? 'Deactivate' : 'Activate'} ${name}`,
    viewProfile: 'View Profile', activate: 'Activate', deactivate: 'Deactivate',
    groupsLabel: 'groups',
    emptyTitle: 'No teachers found', emptyDescTable: 'Try adjusting your filters.', emptyDescMobile: 'Try adjusting your search.',
    statusActive: 'Active', statusInactive: 'Inactive',
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
    teachersCount: (n: number) => `${n} teachers`,
    prevPage: 'Previous page', nextPage: 'Next page', loadMore: 'Load more',
  },
  ru: {
    title: 'Преподаватели',
    totalTeachers: (n: number) => `Всего преподавателей: ${n}`,
    export: 'Экспорт', exportAria: 'Экспортировать преподавателей в CSV',
    addTeacher: 'Добавить преподавателя',
    kpiTotal: 'Всего преподавателей', kpiActive: 'Активные', kpiInactive: 'Неактивные', kpiAvgGroups: 'Среднее число групп',
    searchPlaceholder: 'Поиск преподавателей…', searchAria: 'Поиск преподавателей',
    filterAll: 'Все статусы', filterActive: 'Активные', filterInactive: 'Неактивные',
    colTeacher: 'Преподаватель', colEmail: 'Email', colPhone: 'Телефон', colGroups: 'Группы',
    colBranch: 'Филиал', colJoined: 'Дата найма', colStatus: 'Статус',
    selectAll: 'Выбрать всех преподавателей', selectOne: (name: string) => `Выбрать ${name}`,
    viewAria: (name: string) => `Просмотреть ${name}`,
    toggleAria: (name: string, active: boolean) => active ? `Деактивировать ${name}` : `Активировать ${name}`,
    viewProfile: 'Профиль', activate: 'Активировать', deactivate: 'Деактивировать',
    groupsLabel: 'групп',
    emptyTitle: 'Преподаватели не найдены', emptyDescTable: 'Попробуйте изменить фильтры.', emptyDescMobile: 'Попробуйте изменить поиск.',
    statusActive: 'Активен', statusInactive: 'Неактивен',
    pageOf: (page: number, total: number) => `Страница ${page} из ${total}`,
    teachersCount: (n: number) => `${n} преподавателей`,
    prevPage: 'Предыдущая страница', nextPage: 'Следующая страница', loadMore: 'Загрузить ещё',
  },
} as const;

type Locale = keyof typeof I18N;
type I18NShape = (typeof I18N)[Locale];

function toIntlLocale(locale: string): string {
  return locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, s }: { status: TeacherDto['status']; s: I18NShape }) {
  const isActive = status === 'active';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        isActive
          ? 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]'
          : 'border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)]',
      )}
    >
      {isActive ? s.statusActive : s.statusInactive}
    </span>
  );
}

// ─── KPI summary ──────────────────────────────────────────────────────────────

function KPIBar({ teachers, s }: { teachers: TeacherDto[]; s: I18NShape }) {
  const total = teachers.length;
  const active = teachers.filter((t) => t.status === 'active').length;
  const inactive = total - active;
  const avgGroups =
    total > 0
      ? Math.round(teachers.reduce((sum, t) => sum + t.groupsAssigned, 0) / total)
      : 0;

  const cards = [
    { label: s.kpiTotal, value: total, icon: Users, color: 'bg-[var(--info-bg)] text-[var(--info-solid)]' },
    { label: s.kpiActive, value: active, icon: UserCheck, color: 'bg-[var(--success-bg)] text-[var(--success-text)]' },
    { label: s.kpiInactive, value: inactive, icon: UserX, color: 'bg-[var(--error-bg)] text-[var(--error-text)]' },
    { label: s.kpiAvgGroups, value: avgGroups, icon: Layers, color: 'bg-[var(--warning-bg)] text-[var(--warning-text)]' },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <motion.div
          key={c.label}
          whileHover={{ translateY: -2, boxShadow: 'var(--shadow-md)' }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">{c.label}</p>
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', c.color)}>
              <c.icon size={16} aria-hidden="true" />
            </div>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">
            {formatNumber(c.value)}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Desktop table ─────────────────────────────────────────────────────────────

interface DesktopTableProps {
  teachers: TeacherDto[];
  isLoading: boolean;
  onToggleStatus: (id: string, status: 'active' | 'inactive') => Promise<void>;
  s: I18NShape;
  locale: string;
}

function DesktopTable({ teachers, isLoading, onToggleStatus, s, locale }: DesktopTableProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggle = useCallback(
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

  if (isLoading) return <SkeletonLoader variant="table" />;

  if (teachers.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title={s.emptyTitle}
        description={s.emptyDescTable}
      />
    );
  }

  const allSelected = selectedIds.size === teachers.length && teachers.length > 0;
  const someSelected = selectedIds.size > 0 && selectedIds.size < teachers.length;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-default)]">
      <div className="overflow-x-auto">
        <table className="w-full" role="table" aria-label="Teachers">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-secondary)]">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={() =>
                    setSelectedIds(
                      allSelected ? new Set() : new Set(teachers.map((t) => t.id)),
                    )
                  }
                  aria-label={s.selectAll}
                  className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-primary)]"
                />
              </th>
              {[s.colTeacher, s.colEmail, s.colPhone, s.colGroups, s.colBranch, s.colJoined, s.colStatus, ''].map(
                (h) => (
                  <th
                    key={h}
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {teachers.map((teacher, idx) => {
              const isSelected = selectedIds.has(teacher.id);
              const isPending = pendingId === teacher.id;
              const initials = teacher.name
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0] ?? '')
                .join('')
                .toUpperCase();

              return (
                <motion.tr
                  key={teacher.id}
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
                      onChange={() => toggleOne(teacher.id)}
                      aria-label={s.selectOne(teacher.name)}
                      className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--brand-primary)]"
                    />
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--role-teacher)]/10 text-xs font-semibold text-[var(--role-teacher)]">
                        {initials}
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)] whitespace-nowrap">
                        {teacher.name}
                      </p>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3">
                    <p className="max-w-[180px] truncate text-sm text-[var(--text-secondary)]">
                      {teacher.email}
                    </p>
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3">
                    <p className="whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {teacher.phone}
                    </p>
                  </td>

                  {/* Groups */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[var(--brand-primary)]/10 px-2 text-xs font-semibold text-[var(--brand-primary)]">
                      {teacher.groupsAssigned}
                    </span>
                  </td>

                  {/* Branch */}
                  <td className="px-4 py-3">
                    <p className="max-w-[120px] truncate text-sm text-[var(--text-secondary)]">
                      {teacher.branchId || '—'}
                    </p>
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3">
                    <p className="whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {formatDate(teacher.joinedDate, undefined, locale)}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={teacher.status} s={s} />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/teachers/${teacher.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                        aria-label={s.viewAria(teacher.name)}
                      >
                        <Eye size={14} aria-hidden="true" />
                      </Link>

                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggle(teacher.id, teacher.status)}
                        disabled={isPending}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] disabled:opacity-50',
                          teacher.status === 'active'
                            ? 'text-[var(--error-text)] hover:bg-[var(--error-bg)]'
                            : 'text-[var(--success-text)] hover:bg-[var(--success-bg)]',
                        )}
                        aria-label={s.toggleAria(teacher.name, teacher.status === 'active')}
                      >
                        {isPending ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : teacher.status === 'active' ? (
                          <UserX size={14} aria-hidden="true" />
                        ) : (
                          <UserCheck size={14} aria-hidden="true" />
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

// ─── Mobile teacher card ──────────────────────────────────────────────────────

function MobileTeacherCard({
  teacher,
  onToggleStatus,
  s,
  locale,
}: {
  teacher: TeacherDto;
  onToggleStatus: (id: string, status: 'active' | 'inactive') => Promise<void>;
  s: I18NShape;
  locale: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const initials = teacher.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase();

  const toggle = async () => {
    setIsPending(true);
    try {
      await onToggleStatus(teacher.id, teacher.status === 'active' ? 'inactive' : 'active');
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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--role-teacher)]/10 text-sm font-semibold text-[var(--role-teacher)]">
          {initials}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{teacher.name}</p>
            <StatusBadge status={teacher.status} s={s} />
          </div>

          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Mail size={11} aria-hidden="true" />
              <span className="truncate">{teacher.email}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Phone size={11} aria-hidden="true" />
              <span>{teacher.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <BookOpen size={11} aria-hidden="true" />
                <span>{teacher.groupsAssigned} {s.groupsLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Calendar size={11} aria-hidden="true" />
                <span>{formatDate(teacher.joinedDate, undefined, locale)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2 border-t border-[var(--border-default)] pt-3">
        <Link
          href={`/admin/teachers/${teacher.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--border-default)] py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)]"
        >
          <Eye size={12} aria-hidden="true" />
          {s.viewProfile}
        </Link>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={toggle}
          disabled={isPending}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors disabled:opacity-60',
            teacher.status === 'active'
              ? 'border border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)]'
              : 'border border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
          )}
        >
          {isPending ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
          ) : teacher.status === 'active' ? (
            <UserX size={12} aria-hidden="true" />
          ) : (
            <UserCheck size={12} aria-hidden="true" />
          )}
          {teacher.status === 'active' ? s.deactivate : s.activate}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  s,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  s: I18NShape;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex items-center justify-between gap-2 pt-4">
      <p className="text-xs text-[var(--text-muted)]">
        {s.pageOf(page, totalPages)} · {s.teachersCount(total)}
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminTeachersClient() {
  const { teachers, isLoading, toggleStatus, refresh: _refresh } = useAdminTeachers();

  const rawLocale = useLocale();
  const locale: Locale = rawLocale in I18N ? (rawLocale as Locale) : 'en';
  const s = I18N[locale];
  const intlLocale = toIntlLocale(locale);

  const isMobile = useMediaQuery('(max-width: 639px)');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    return teachers.filter((t) => {
      const matchesSearch =
        !debouncedSearch ||
        t.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.phone.includes(debouncedSearch);
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [teachers, debouncedSearch, statusFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((s: 'all' | 'active' | 'inactive') => {
    setStatusFilter(s);
    setPage(1);
  }, []);

  const handleExport = useCallback(() => {
    const csv = [
      'Name,Email,Phone,Groups,Status,Joined',
      ...filtered.map((t) =>
        [t.name, t.email, t.phone, t.groupsAssigned, t.status, t.joinedDate].join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-5 lg:px-8 lg:py-8">

        {/* ── Header ─────────────────────────────────────────────────── */}
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
              {s.totalTeachers(teachers.length)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleExport}
              className="hidden sm:flex items-center gap-2 rounded-xl border border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)]"
              aria-label={s.exportAria}
            >
              <Download size={14} aria-hidden="true" />
              {s.export}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-3 py-2 text-sm font-medium text-[var(--text-on-brand)] transition-colors hover:bg-[var(--brand-primary-hover)] sm:px-4"
            >
              <Plus size={14} aria-hidden="true" />
              <span className="hidden sm:inline">{s.addTeacher}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ── KPI bar ─────────────────────────────────────────────────── */}
        {!isLoading && <KPIBar teachers={teachers} s={s} />}

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={s.searchPlaceholder}
              aria-label={s.searchAria}
              className="h-10 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
            />
          </div>

          <div className="flex gap-1">
            {(['all', 'active', 'inactive'] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => handleStatusChange(filterKey)}
                aria-pressed={statusFilter === filterKey}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                  statusFilter === filterKey
                    ? 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]'
                    : 'border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
                )}
              >
                {filterKey === 'all' ? s.filterAll : filterKey === 'active' ? s.filterActive : s.filterInactive}
              </button>
            ))}
          </div>
        </div>

        {/* ── Desktop table ────────────────────────────────────────────── */}
        {!isMobile && (
          <>
            <DesktopTable
              teachers={paginated}
              isLoading={isLoading}
              onToggleStatus={toggleStatus}
              s={s}
              locale={intlLocale}
            />
            <Pagination
              page={page}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              s={s}
            />
          </>
        )}

        {/* ── Mobile cards ─────────────────────────────────────────────── */}
        {isMobile && (
          <div className="space-y-3">
            {isLoading ? (
              <SkeletonLoader variant="card" count={5} />
            ) : paginated.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={s.emptyTitle}
                description={s.emptyDescMobile}
              />
            ) : (
              paginated.map((teacher) => (
                <MobileTeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  onToggleStatus={toggleStatus}
                  s={s}
                  locale={intlLocale}
                />
              ))
            )}

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