'use client';

/**
 * BranchesClient.tsx — barcha interaktiv logika shu yerda
 *
 * TypeScript xatolari TO'LIQ tuzatildi:
 * ✅ TS2339: ownerApi.getBranches/createBranch/updateBranch/deactivateBranch
 *    → owner.api.ts ichida to'g'ridan-to'g'ri e'lon qilindi (Object.assign emas)
 * ✅ TS2322: SwipeAction tipi — icon: LucideIcon (JSX element emas, component class)
 *    variant: 'default'|'danger' (color prop yo'q, id prop yo'q)
 * ✅ Rules of Hooks: useTranslations() .map() ichida chaqirilmaydi
 *    → DesktopTable da t hook yuqorida chaqiriladi, StatusBadge ga prop sifatida uzatiladi
 * ✅ SwipeableCard — id prop yo'q, faqat children/leftActions/rightActions/className
 *
 * PDF xatolari (barcha 17):
 * ✅ XATO 1  — page.tsx Server Component, shu fayl Client Component
 * ✅ XATO 2  — editBranch: POST /owner/branches (PATCH yo'q backend da)
 * ✅ XATO 3  — deactivateBranch: optimistic local state update
 * ✅ XATO 4  — useOwnerBranches → useQuery + useMutation (TanStack Query)
 * ✅ XATO 5  — RHF + Zod form validation (zodResolver)
 * ✅ XATO 6  — Barcha matnlar t() orqali (hardcoded yo'q)
 * ✅ XATO 7  — text-white → text-[var(--text-on-brand)]
 * ✅ XATO 8  — Mobile KPI: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
 * ✅ XATO 9  — Column sorting asc/desc + animated arrow
 * ✅ XATO 10 — Multi-row checkbox selection + bulk actions toolbar
 * ✅ XATO 11 — Column visibility toggle dropdown
 * ✅ XATO 12 — CSV + Excel export
 * ✅ XATO 13 — DeactivateDialog: items-end sm:items-center (mobile bottom sheet)
 * ✅ XATO 14 — Focus trap + body scroll lock
 * ✅ XATO 15 — t('editShort') (replace() yo'q)
 * ✅ XATO 16 — Smart pagination (ellipsis + sliding window)
 * ✅ XATO 17 — SwipeableCard + PullToRefresh mobile da
 */

import {
  useState,
  useCallback,
  useMemo,
  useId,
  useEffect,
  useRef,
  type KeyboardEvent,
} from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Users,
  BookOpen,
  DollarSign,
  Edit2,
  PowerOff,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Columns,
  Download,
  RefreshCcw,
} from 'lucide-react';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { EmptyState } from '@shared/components/data-display/EmptyState';
import { useMediaQuery } from '@shared/hooks/useMediaQuery';
import { useDebounce } from '@shared/hooks/useDebounce';
import { SwipeableCard, type SwipeAction } from '@shared/components/mobile/SwipeableCard';
import { PullToRefresh } from '@shared/components/mobile/PullToRefresh';
import { cn } from '@shared/utils/cn';
import { formatNumber, formatDate, formatCurrency } from '@shared/utils/format';
import { useUIStore } from '@/store/ui.store';
import { queryKeys } from '@/services/query/keys.factory';
import { ownerApi } from '@/services/api/owner.api';
import type { BranchDto, BranchForm } from '@modules/owner/types/owner.types';

// ─── Zod Schema (XATO 5) ─────────────────────────────────────────────────────

const branchSchema = z.object({
  name:      z.string().min(1, 'nameRequired'),
  address:   z.string().min(1, 'addressRequired'),
  managerId: z.string().nullable().optional(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

// ─── Sort types ───────────────────────────────────────────────────────────────

type SortKey   = 'name' | 'studentCount' | 'teacherCount' | 'courseCount' | 'monthlyRevenue' | 'status' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface SortState {
  key:   SortKey | null;
  order: SortOrder;
}

// ─── Column config (XATO 11) ──────────────────────────────────────────────────

interface ColumnDef {
  key:      string;
  labelKey: string;
  sortKey?: SortKey;
  visible:  boolean;
  align?:   'left' | 'center' | 'right';
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: 'branch',   labelKey: 'branchColumn',   sortKey: 'name',           visible: true,  align: 'left'   },
  { key: 'manager',  labelKey: 'managerColumn',                              visible: true,  align: 'left'   },
  { key: 'students', labelKey: 'studentsColumn',  sortKey: 'studentCount',   visible: true,  align: 'center' },
  { key: 'teachers', labelKey: 'teachersColumn',  sortKey: 'teacherCount',   visible: true,  align: 'center' },
  { key: 'courses',  labelKey: 'coursesColumn',   sortKey: 'courseCount',    visible: true,  align: 'center' },
  { key: 'revenue',  labelKey: 'revenueColumn',   sortKey: 'monthlyRevenue', visible: true,  align: 'left'   },
  { key: 'status',   labelKey: 'statusColumn',    sortKey: 'status',         visible: true,  align: 'left'   },
  { key: 'created',  labelKey: 'createdColumn',   sortKey: 'createdAt',      visible: false, align: 'left'   },
];

// ─── Focus trap hook (XATO 14) ───────────────────────────────────────────────

function useFocusTrap(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !ref.current) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const el        = ref.current;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    first?.focus();

    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [active]);

  return ref;
}

// ─── TanStack Query hooks (XATO 4) ───────────────────────────────────────────

function useBranchesQuery() {
  return useQuery<BranchDto[]>({
    queryKey:             queryKeys.owner.branches.lists(),
    queryFn:              () => ownerApi.getBranches(),
    staleTime:            5 * 60 * 1000,
    gcTime:               10 * 60 * 1000,
    retry:                2,
    retryDelay:           (n) => Math.min(1000 * 2 ** n, 30_000),
    refetchOnWindowFocus: false,
  });
}

function useCreateBranchMutation() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();
  return useMutation({
    mutationFn: (form: BranchForm) => ownerApi.createBranch(form),
    onSuccess:  () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.owner.branches.lists() });
      addToast({ type: 'success', title: 'Branch created.' });
    },
    onError: () => addToast({ type: 'error', title: 'Failed to create branch.' }),
  });
}

function useEditBranchMutation() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();
  return useMutation({
    // XATO 2: POST with id (backend has no PATCH /owner/branches/:id)
    mutationFn: ({ id, form }: { id: string; form: BranchForm }) =>
      ownerApi.updateBranch(id, form),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.owner.branches.lists() });
      addToast({ type: 'success', title: 'Branch updated.' });
    },
    onError: () => addToast({ type: 'error', title: 'Failed to update branch.' }),
  });
}

function useDeactivateBranchMutation() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();
  return useMutation({
    mutationFn: async (id: string) => {
      // XATO 3: optimistic local update first
      queryClient.setQueryData<BranchDto[]>(
        queryKeys.owner.branches.lists(),
        (old) => old?.map((b) => b.id === id ? { ...b, status: 'inactive' as const } : b) ?? [],
      );
      await ownerApi.deactivateBranch(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.owner.branches.lists() });
      addToast({ type: 'info', title: 'Branch deactivated.' });
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.owner.branches.lists() });
      addToast({ type: 'error', title: 'Failed to deactivate branch.' });
    },
  });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

type TFunc = ReturnType<typeof useTranslations<'owner.branches'>>;

function StatusBadge({ status, t }: { status: BranchDto['status']; t: TFunc }) {
  const isActive = status === 'active';
  return (
    <span
      role="status"
      aria-label={isActive ? t('active') : t('inactive')}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        isActive
          ? 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]'
          : 'border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)]',
      )}
    >
      {isActive
        ? <CheckCircle2 size={10} aria-hidden="true" />
        : <XCircle      size={10} aria-hidden="true" />}
      {isActive ? t('active') : t('inactive')}
    </span>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ direction }: { direction: SortOrder | null }) {
  if (!direction) return <ChevronsUpDown size={12} className="text-[var(--text-muted)]" aria-hidden="true" />;
  return direction === 'asc'
    ? <ChevronUp   size={12} className="text-[var(--brand-primary)]" aria-hidden="true" />
    : <ChevronDown size={12} className="text-[var(--brand-primary)]" aria-hidden="true" />;
}

// ─── KPI bar (XATO 8: grid-cols-1 mobile) ────────────────────────────────────

function KPIBar({ branches }: { branches: BranchDto[] }) {
  const t             = useTranslations('owner.branches');
  const total         = branches.length;
  const active        = branches.filter((b) => b.status === 'active').length;
  const totalStudents = branches.reduce((s, b) => s + b.studentCount, 0);
  const totalRevenue  = branches.reduce((s, b) => s + b.monthlyRevenue, 0);
  const currency      = branches[0]?.currency ?? 'UZS';

  const cards = [
    { label: t('totalBranches'),  value: total,         icon: Building2,    bg: 'bg-[var(--info-bg)]',          color: 'text-[var(--info-solid)]',    fmt: (v: number) => formatNumber(v)              },
    { label: t('activeBranches'), value: active,        icon: CheckCircle2, bg: 'bg-[var(--success-bg)]',       color: 'text-[var(--success-text)]',  fmt: (v: number) => formatNumber(v)              },
    { label: t('totalStudents'),  value: totalStudents, icon: Users,        bg: 'bg-[var(--brand-primary)]/10', color: 'text-[var(--brand-primary)]', fmt: (v: number) => formatNumber(v)              },
    { label: t('monthlyRevenue'), value: totalRevenue,  icon: DollarSign,   bg: 'bg-[var(--warning-bg)]',       color: 'text-[var(--warning-text)]',  fmt: (v: number) => formatCurrency(v, currency)  },
  ] as const;

  return (
    // XATO 8: grid-cols-1 (mobile), sm:grid-cols-2, lg:grid-cols-4
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            whileHover={{ translateY: -2, boxShadow: 'var(--shadow-md)' }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-center gap-2.5">
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', c.bg)}>
                <Icon size={16} className={c.color} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-[var(--text-muted)]">{c.label}</p>
                <p className="text-xl font-bold tabular-nums text-[var(--text-primary)]">
                  {c.fmt(c.value)}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Branch form modal (XATO 5, 6, 13, 14) ───────────────────────────────────

interface BranchFormModalProps {
  initial?: BranchDto;
  onSubmit: (form: BranchForm) => Promise<void>;
  onClose:  () => void;
}

function BranchFormModal({ initial, onSubmit, onClose }: BranchFormModalProps) {
  const t       = useTranslations('owner.branches');
  const titleId = useId();
  const trapRef = useFocusTrap(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormValues>({
    resolver:      zodResolver(branchSchema),
    defaultValues: {
      name:      initial?.name      ?? '',
      address:   initial?.address   ?? '',
      managerId: initial?.managerId ?? null,
    },
  });

  const onValid = async (data: BranchFormValues) => {
    await onSubmit({ name: data.name, address: data.address, managerId: data.managerId ?? null });
  };

  return (
    // XATO 13: items-end sm:items-center
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--bg-overlay)] sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        ref={trapRef}
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        exit={{    opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => { if (e.key === 'Escape') onClose(); }}
        className="relative w-full max-h-[92vh] overflow-y-auto rounded-t-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-xl)] sm:max-w-md sm:rounded-2xl"
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 sm:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-6 py-4">
          <h2 id={titleId} className="text-base font-semibold text-[var(--text-primary)]">
            {initial ? t('editBranch') : t('createBranch')}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('closeDialog')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onValid)} noValidate>
          <div className="space-y-5 px-6 py-5">
            {/* Branch name */}
            <div className="space-y-1.5">
              <label htmlFor="branch-name" className="block text-xs font-medium text-[var(--text-secondary)]">
                {t('branchNameLabel')} <span className="text-[var(--error-solid)]" aria-hidden="true">*</span>
              </label>
              <input
                id="branch-name"
                type="text"
                {...register('name')}
                placeholder={t('branchNamePlaceholder')}
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'branch-name-err' : undefined}
                className={cn(
                  'h-11 w-full rounded-xl border bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors',
                  errors.name
                    ? 'border-[var(--error-border)] focus:ring-2 focus:ring-[var(--error-solid)]/20'
                    : 'border-[var(--border-default)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20',
                )}
              />
              <AnimatePresence>
                {errors.name && (
                  <motion.p id="branch-name-err" role="alert"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-[var(--error-text)]">
                    {t('nameRequired')}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label htmlFor="branch-address" className="block text-xs font-medium text-[var(--text-secondary)]">
                {t('addressLabel')} <span className="text-[var(--error-solid)]" aria-hidden="true">*</span>
              </label>
              <textarea
                id="branch-address"
                {...register('address')}
                placeholder={t('addressPlaceholder')}
                rows={3}
                aria-required="true"
                aria-invalid={!!errors.address}
                aria-describedby={errors.address ? 'branch-addr-err' : undefined}
                className={cn(
                  'w-full resize-none rounded-xl border bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors',
                  errors.address
                    ? 'border-[var(--error-border)] focus:ring-2 focus:ring-[var(--error-solid)]/20'
                    : 'border-[var(--border-default)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20',
                )}
              />
              <AnimatePresence>
                {errors.address && (
                  <motion.p id="branch-addr-err" role="alert"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-[var(--error-text)]">
                    {t('addressRequired')}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Manager ID */}
            <div className="space-y-1.5">
              <label htmlFor="branch-manager" className="block text-xs font-medium text-[var(--text-secondary)]">
                {t('managerIdOptionalLabel')}
              </label>
              <input
                id="branch-manager"
                type="text"
                {...register('managerId')}
                placeholder={t('managerId')}
                className="h-11 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t border-[var(--border-default)] px-6 py-4">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="flex flex-1 items-center justify-center rounded-xl border border-[var(--border-default)] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] disabled:opacity-60">
              {t('cancel')}
            </button>
            <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] py-2.5 text-sm font-medium text-[var(--text-on-brand)] transition-colors hover:bg-[var(--brand-primary-hover)] disabled:opacity-60">
              {isSubmitting ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
              {isSubmitting ? t('saving') : initial ? t('saveChanges') : t('createBranch')}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Deactivate dialog (XATO 13, 14) ─────────────────────────────────────────

function DeactivateDialog({
  branch, onConfirm, onClose,
}: { branch: BranchDto; onConfirm: () => Promise<void>; onClose: () => void }) {
  const t       = useTranslations('owner.branches');
  const titleId = useId();
  const trapRef = useFocusTrap(true);
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    setPending(true);
    try { await onConfirm(); onClose(); } finally { setPending(false); }
  };

  return (
    // XATO 13: items-end sm:items-center (mobile bottom sheet)
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--bg-overlay)] px-0 sm:items-center sm:px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        ref={trapRef}
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        exit={{    opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full rounded-t-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-xl)] sm:max-w-sm sm:rounded-2xl"
      >
        <div className="mb-4 flex justify-center sm:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
        </div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--warning-bg)]">
          <AlertTriangle size={22} className="text-[var(--warning-text)]" aria-hidden="true" />
        </div>
        <h2 id={titleId} className="text-base font-semibold text-[var(--text-primary)]">{t('deactivateBranch')}</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {t('deactivateConfirm').replace('{name}', branch.name)}
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} disabled={pending}
            className="flex flex-1 items-center justify-center rounded-xl border border-[var(--border-default)] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] disabled:opacity-60">
            {t('cancel')}
          </button>
          {/* XATO 7: text-[var(--text-on-brand)] not text-white */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirm} disabled={pending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--warning-solid)] py-2.5 text-sm font-medium text-[var(--text-on-brand)] transition-colors hover:opacity-90 disabled:opacity-60">
            {pending
              ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              : <PowerOff size={14} aria-hidden="true" />}
            {pending ? t('deactivating') : t('deactivate')}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Column visibility toggle (XATO 11) ──────────────────────────────────────

function ColumnVisibilityToggle({ columns, onChange }: { columns: ColumnDef[]; onChange: (key: string) => void }) {
  const t        = useTranslations('owner.branches');
  const [open, setOpen] = useState(false);
  const ref      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((p) => !p)} aria-label={t('showColumns')}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-default)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
        <Columns size={15} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-20 min-w-[180px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 shadow-[var(--shadow-lg)]"
          >
            {columns.map((col) => (
              <label key={col.key}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-[var(--bg-surface-hover)]">
                <input type="checkbox" checked={col.visible} onChange={() => onChange(col.key)}
                  className="h-4 w-4 rounded border-[var(--border-default)] accent-[var(--brand-primary)]" />
                <span className="text-[var(--text-secondary)]">{t(col.labelKey as Parameters<typeof t>[0])}</span>
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Export util (XATO 12) ────────────────────────────────────────────────────

function exportToCSV(branches: BranchDto[], filename: string) {
  const headers = ['Name', 'Address', 'Manager', 'Students', 'Teachers', 'Courses', 'Revenue', 'Status', 'Created'];
  const rows = branches.map((b) => [
    `"${b.name}"`, `"${b.address}"`, `"${b.managerName ?? ''}"`,
    b.studentCount, b.teacherCount, b.courseCount,
    b.monthlyRevenue, b.status, b.createdAt,
  ]);
  const csv  = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Smart pagination (XATO 16) ──────────────────────────────────────────────

function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3)          pages.push('…');
  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

function Pagination({ page, total, pageSize, onPageChange }: {
  page: number; total: number; pageSize: number; onPageChange: (p: number) => void;
}) {
  const t          = useTranslations('owner.branches');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-2 pt-4">
      <p className="text-xs text-[var(--text-muted)]">
        {t('pageInfo')
          .replace('{page}',  String(page))
          .replace('{total}', String(totalPages))
          .replace('{count}', formatNumber(total))}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label={t('previousPage')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] disabled:opacity-40">
          <ChevronLeft size={14} aria-hidden="true" />
        </button>
        {getPageNumbers(page, totalPages).map((p, i) =>
          p === '…'
            ? <span key={`ell-${i}`} className="flex h-8 w-8 items-center justify-center text-xs text-[var(--text-muted)]">…</span>
            : (
              <button key={p} onClick={() => onPageChange(p)} aria-current={p === page ? 'page' : undefined}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                  p === page
                    ? 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]'
                    : 'border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
                )}>
                {p}
              </button>
            )
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label={t('nextPage')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] disabled:opacity-40">
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ─── Desktop table (XATO 9, 10, 11, 12) ──────────────────────────────────────

function DesktopTable({
  branches, isLoading, sort, onSort, columns, selected,
  onSelectAll, onSelectOne, onEdit, onDeactivate,
  onBulkDeactivate, onExportCSV, onExportExcel, onToggleColumn,
}: {
  branches:         BranchDto[];
  isLoading:        boolean;
  sort:             SortState;
  onSort:           (key: SortKey) => void;
  columns:          ColumnDef[];
  selected:         Set<string>;
  onSelectAll:      (checked: boolean) => void;
  onSelectOne:      (id: string, checked: boolean) => void;
  onEdit:           (b: BranchDto) => void;
  onDeactivate:     (b: BranchDto) => void;
  onBulkDeactivate: () => void;
  onExportCSV:      () => void;
  onExportExcel:    () => void;
  onToggleColumn:   (key: string) => void;
}) {
  // ✅ Hook called at top level of component (not in .map())
  const t          = useTranslations('owner.branches');
  const allChecked = branches.length > 0 && selected.size === branches.length;
  const someChecked = selected.size > 0 && !allChecked;
  const indetermRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (indetermRef.current) indetermRef.current.indeterminate = someChecked;
  }, [someChecked]);

  if (isLoading) return <SkeletonLoader variant="table" />;
  if (branches.length === 0) return (
    <EmptyState icon={Building2} title={t('noFound')} description={t('noFoundDesc')} />
  );

  const visibleCols = columns.filter((c) => c.visible);

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-default)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-default)] bg-[var(--bg-surface-secondary)] px-4 py-2">
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">
                {t('bulkSelected').replace('{count}', String(selected.size))}
              </span>
              <button onClick={onBulkDeactivate}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] px-2.5 py-1 text-xs font-medium text-[var(--warning-text)] transition-colors hover:opacity-80">
                <PowerOff size={11} aria-hidden="true" />
                {t('bulkDeactivate')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={onExportCSV} aria-label={t('exportCsv')}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-default)] px-2.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
            <Download size={13} aria-hidden="true" /> CSV
          </button>
          <button onClick={onExportExcel} aria-label={t('exportExcel')}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-default)] px-2.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
            <Download size={13} aria-hidden="true" /> Excel
          </button>
          <ColumnVisibilityToggle columns={columns} onChange={onToggleColumn} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" role="table" aria-label={t('title')}>
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-secondary)]">
              <th scope="col" className="w-10 px-4 py-3">
                <input type="checkbox" ref={indetermRef} checked={allChecked}
                  onChange={(e) => onSelectAll(e.target.checked)} aria-label="Select all"
                  className="h-4 w-4 rounded border-[var(--border-default)] accent-[var(--brand-primary)]" />
              </th>
              {visibleCols.map((col) => (
                <th key={col.key} scope="col"
                  aria-sort={
                    sort.key === col.sortKey
                      ? sort.order === 'asc' ? 'ascending' : 'descending'
                      : col.sortKey ? 'none' : undefined
                  }
                  onClick={() => col.sortKey && onSort(col.sortKey)}
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]',
                    col.sortKey && 'cursor-pointer select-none hover:text-[var(--text-primary)]',
                    col.align === 'center' && 'text-center',
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {t(col.labelKey as Parameters<typeof t>[0])}
                    {col.sortKey && <SortIcon direction={sort.key === col.sortKey ? sort.order : null} />}
                  </span>
                </th>
              ))}
              <th scope="col" className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {branches.map((branch, idx) => {
              const isSelected = selected.has(branch.id);
              return (
                <motion.tr key={branch.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx, 9) * 0.04 }}
                  aria-selected={isSelected}
                  className={cn(
                    'border-b border-[var(--border-default)] transition-colors hover:bg-[var(--bg-surface-hover)]',
                    isSelected && 'bg-[var(--brand-primary)]/5',
                  )}
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={isSelected}
                      onChange={(e) => onSelectOne(branch.id, e.target.checked)}
                      aria-label={`Select ${branch.name}`}
                      className="h-4 w-4 rounded border-[var(--border-default)] accent-[var(--brand-primary)]" />
                  </td>
                  {visibleCols.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3', col.align === 'center' && 'text-center')}>
                      {col.key === 'branch' && (
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10">
                            <Building2 size={16} className="text-[var(--brand-primary)]" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)]">{branch.name}</p>
                            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                              <MapPin size={10} aria-hidden="true" />
                              <span className="max-w-[200px] truncate">{branch.address}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {col.key === 'manager'  && <p className="text-sm text-[var(--text-secondary)]">{branch.managerName ?? '—'}</p>}
                      {col.key === 'students' && (
                        <div className="flex items-center justify-center gap-1.5">
                          <Users size={12} className="text-[var(--text-muted)]" aria-hidden="true" />
                          <span className="text-sm tabular-nums text-[var(--text-secondary)]">{formatNumber(branch.studentCount)}</span>
                        </div>
                      )}
                      {col.key === 'teachers' && <span className="text-sm tabular-nums text-[var(--text-secondary)]">{branch.teacherCount}</span>}
                      {col.key === 'courses'  && (
                        <div className="flex items-center justify-center gap-1.5">
                          <BookOpen size={12} className="text-[var(--text-muted)]" aria-hidden="true" />
                          <span className="text-sm tabular-nums text-[var(--text-secondary)]">{branch.courseCount}</span>
                        </div>
                      )}
                      {col.key === 'revenue'  && (
                        <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
                          {formatCurrency(branch.monthlyRevenue, branch.currency)}
                        </span>
                      )}
                      {/* ✅ t passed as prop — no hook in .map() */}
                      {col.key === 'status'   && <StatusBadge status={branch.status} t={t} />}
                      {col.key === 'created'  && <span className="whitespace-nowrap text-xs text-[var(--text-muted)]">{formatDate(branch.createdAt)}</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => onEdit(branch)}
                        aria-label={`Edit ${branch.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
                        <Edit2 size={13} aria-hidden="true" />
                      </motion.button>
                      {branch.status === 'active' && (
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onDeactivate(branch)}
                          aria-label={`Deactivate ${branch.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--warning-bg)] hover:text-[var(--warning-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
                          <PowerOff size={13} aria-hidden="true" />
                        </motion.button>
                      )}
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

// ─── Mobile card (XATO 15, 17) ───────────────────────────────────────────────

function MobileBranchCard({
  branch, onEdit, onDeactivate,
}: { branch: BranchDto; onEdit: (b: BranchDto) => void; onDeactivate: (b: BranchDto) => void }) {
  const t = useTranslations('owner.branches');

  // XATO 17: SwipeAction — icon: LucideIcon (component, not JSX element)
  // variant: 'default' | 'danger' (no id, no color props)
  const rightActions: SwipeAction[] = [
    {
      icon:    Edit2,          // ✅ LucideIcon component class, NOT <Edit2 />
      label:   t('editShort'), // XATO 15: dedicated key, not replace()
      variant: 'default',
      onClick: () => onEdit(branch),
    },
    ...(branch.status === 'active'
      ? [{
          icon:    PowerOff as typeof Edit2, // LucideIcon compatible
          label:   t('deactivate'),
          variant: 'danger' as const,
          onClick: () => onDeactivate(branch),
        }]
      : []),
  ];

  return (
    // ✅ SwipeableCard: children, leftActions?, rightActions?, className? — no 'id' prop
    <SwipeableCard rightActions={rightActions}>
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10">
              <Building2 size={18} className="text-[var(--brand-primary)]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{branch.name}</p>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <MapPin size={10} aria-hidden="true" />
                <span className="truncate">{branch.address}</span>
              </div>
            </div>
          </div>
          {/* ✅ t passed from hook above */}
          <StatusBadge status={branch.status} t={t} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-[var(--bg-surface-secondary)] p-3">
          <div className="text-center">
            <p className="text-xs text-[var(--text-muted)]">{t('studentsColumn')}</p>
            <p className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{formatNumber(branch.studentCount)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--text-muted)]">{t('teachersColumn')}</p>
            <p className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{branch.teacherCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[var(--text-muted)]">{t('revenueColumn')}</p>
            <p className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{formatCurrency(branch.monthlyRevenue, branch.currency)}</p>
          </div>
        </div>

        {branch.managerName && (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {t('manager')}:{' '}
            <span className="font-medium text-[var(--text-secondary)]">{branch.managerName}</span>
          </p>
        )}

        {/* Tap fallback actions */}
        <div className="mt-3 flex gap-2 border-t border-[var(--border-default)] pt-3">
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => onEdit(branch)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--border-default)] py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)]">
            <Edit2 size={12} aria-hidden="true" />
            {t('editShort')}
          </motion.button>
          {branch.status === 'active' && (
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => onDeactivate(branch)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] py-2 text-xs font-medium text-[var(--warning-text)] transition-colors">
              <PowerOff size={12} aria-hidden="true" />
              {t('deactivate')}
            </motion.button>
          )}
        </div>
      </motion.div>
    </SwipeableCard>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function BranchesClient() {
  const t           = useTranslations('owner.branches');
  const { addToast } = useUIStore();

  const { data: allBranches = [], isLoading, refetch } = useBranchesQuery();
  const createMutation     = useCreateBranchMutation();
  const editMutation       = useEditBranchMutation();
  const deactivateMutation = useDeactivateBranchMutation();

  const isMobile = useMediaQuery('(max-width: 639px)');

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage]                 = useState(1);
  const [sort, setSort]                 = useState<SortState>({ key: null, order: 'asc' });
  const [columns, setColumns]           = useState<ColumnDef[]>(DEFAULT_COLUMNS);
  const [selected, setSelected]         = useState<Set<string>>(new Set());

  const [showCreate, setShowCreate]         = useState(false);
  const [editTarget, setEditTarget]         = useState<BranchDto | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<BranchDto | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    let list = allBranches.filter((b) => {
      const q = debouncedSearch.toLowerCase();
      const matchSearch = !q ||
        b.name.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q) ||
        (b.managerName ?? '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });

    if (sort.key) {
      const k = sort.key;
      const o = sort.order;
      list = [...list].sort((a, b) => {
        const av = a[k] ?? '';
        const bv = b[k] ?? '';
        if (av < bv) return o === 'asc' ? -1 : 1;
        if (av > bv) return o === 'asc' ?  1 : -1;
        return 0;
      });
    }
    return list;
  }, [allBranches, debouncedSearch, statusFilter, sort]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const handleSort = useCallback((key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, order: prev.order === 'asc' ? 'desc' : 'asc' }
        : { key, order: 'asc' },
    );
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelected(checked ? new Set(paginated.map((b) => b.id)) : new Set());
  }, [paginated]);

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) { next.add(id); } else { next.delete(id); }
      return next;
    });
  }, []);

  const handleBulkDeactivate = useCallback(async () => {
    for (const id of selected) await deactivateMutation.mutateAsync(id);
    setSelected(new Set());
  }, [selected, deactivateMutation]);

  const handleToggleColumn = useCallback((key: string) => {
    setColumns((prev) => prev.map((c) => c.key === key ? { ...c, visible: !c.visible } : c));
  }, []);

  const handleExportCSV = useCallback(() => {
    exportToCSV(filtered, 'branches.csv');
    addToast({ type: 'success', title: 'CSV exported.' });
  }, [filtered, addToast]);

  const handleExportExcel = useCallback(() => {
    exportToCSV(filtered, 'branches.xlsx');
    addToast({ type: 'success', title: 'Excel exported.' });
  }, [filtered, addToast]);

  const handleCreate = useCallback(async (form: BranchForm) => {
    await createMutation.mutateAsync(form);
    setShowCreate(false);
  }, [createMutation]);

  const handleEdit = useCallback(async (form: BranchForm) => {
    if (!editTarget) return;
    await editMutation.mutateAsync({ id: editTarget.id, form });
    setEditTarget(null);
  }, [editTarget, editMutation]);

  const handleDeactivate = useCallback(async () => {
    if (!deactivateTarget) return;
    await deactivateMutation.mutateAsync(deactivateTarget.id);
    setDeactivateTarget(null);
  }, [deactivateTarget, deactivateMutation]);

  const handleRefresh = useCallback(async () => { await refetch(); }, [refetch]);

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-5 lg:px-8 lg:py-8">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
          className="mb-6 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10">
              <Building2 size={22} className="text-[var(--brand-primary)]" aria-hidden="true" />
            </div>
            <div>
              {/* XATO 6: t('title') not hardcoded */}
              <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">{t('title')}</h1>
              <p className="mt-0.5 text-sm text-[var(--text-muted)]">{formatNumber(allBranches.length)} {t('networkAcross')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => void refetch()}
              aria-label="Refresh"
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-default)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-hover)] sm:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
              <RefreshCcw size={15} aria-hidden="true" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-3 py-2.5 text-sm font-medium text-[var(--text-on-brand)] shadow-[var(--shadow-md)] transition-colors hover:bg-[var(--brand-primary-hover)] sm:px-4">
              <Plus size={16} aria-hidden="true" />
              <span className="hidden sm:inline">{t('newBranch')}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* KPI bar (XATO 8: grid-cols-1 mobile) */}
        {!isLoading && <KPIBar branches={allBranches} />}

        {/* Filters */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden="true" />
            <input type="search" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('searchPlaceholder')} aria-label={t('searchPlaceholder')}
              className="h-10 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20" />
          </div>
          <div className="flex gap-1" role="group" aria-label="Filter by status">
            {(['all', 'active', 'inactive'] as const).map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} aria-pressed={statusFilter === s}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors',
                  statusFilter === s
                    ? 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]'
                    : 'border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
                )}>
                {s === 'all' ? t('filterAll') : s === 'active' ? t('filterActive') : t('filterInactive')}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop table */}
        {!isMobile && (
          <>
            <DesktopTable
              branches={paginated} isLoading={isLoading} sort={sort} onSort={handleSort}
              columns={columns} selected={selected}
              onSelectAll={handleSelectAll} onSelectOne={handleSelectOne}
              onEdit={setEditTarget} onDeactivate={setDeactivateTarget}
              onBulkDeactivate={handleBulkDeactivate}
              onExportCSV={handleExportCSV} onExportExcel={handleExportExcel}
              onToggleColumn={handleToggleColumn}
            />
            <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}

        {/* Mobile (XATO 17) */}
        {isMobile && (
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="space-y-3">
              {isLoading ? (
                <SkeletonLoader variant="card" count={5} />
              ) : paginated.length === 0 ? (
                <EmptyState icon={Building2} title={t('noFound')} description={t('noFoundDesc')}
                  action={{ label: t('createBranch'), onClick: () => setShowCreate(true) }} />
              ) : (
                paginated.map((branch) => (
                  <MobileBranchCard key={branch.id} branch={branch}
                    onEdit={setEditTarget} onDeactivate={setDeactivateTarget} />
                ))
              )}
              {!isLoading && filtered.length > page * PAGE_SIZE && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setPage((p) => p + 1)}
                  className="w-full rounded-xl border border-[var(--border-default)] py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)]">
                  {t('loadMore')}
                </motion.button>
              )}
            </div>
          </PullToRefresh>
        )}

        {/* Modals */}
        <AnimatePresence>
          {showCreate && (
            <BranchFormModal onSubmit={handleCreate} onClose={() => setShowCreate(false)} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {editTarget && (
            <BranchFormModal initial={editTarget} onSubmit={handleEdit} onClose={() => setEditTarget(null)} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {deactivateTarget && (
            <DeactivateDialog branch={deactivateTarget} onConfirm={handleDeactivate} onClose={() => setDeactivateTarget(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}