'use client';

/**
 * Owner Branches Page
 * Route: /[locale]/(dashboard)/owner/branches
 *
 * Full branch management: list, create, edit, deactivate — with KPI bar,
 * search, status filter, desktop table + mobile card list.
 */

import type { Metadata } from 'next';
import { useState, useCallback, useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { useOwnerBranches } from '@modules/owner/hooks/useOwner';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { EmptyState } from '@shared/components/data-display/EmptyState';
import { useMediaQuery } from '@shared/hooks/useMediaQuery';
import { useDebounce } from '@shared/hooks/useDebounce';
import { cn } from '@shared/utils/cn';
import { formatNumber, formatDate } from '@shared/utils/format';
import type { BranchDto, BranchForm } from '@modules/owner/types/owner.types';

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Branches | Owner — EduCRM',
  robots: { index: false, follow: false },
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const EMPTY_FORM: BranchForm = {
  name: '',
  address: '',
  managerId: null,
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BranchDto['status'] }) {
  const isActive = status === 'active';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        isActive
          ? 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]'
          : 'border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)]',
      )}
    >
      {isActive ? (
        <CheckCircle2 size={10} aria-hidden="true" />
      ) : (
        <XCircle size={10} aria-hidden="true" />
      )}
      {status}
    </span>
  );
}

// ─── KPI bar ──────────────────────────────────────────────────────────────────

function KPIBar({ branches }: { branches: BranchDto[] }) {
  const total = branches.length;
  const active = branches.filter((b) => b.status === 'active').length;
  const totalStudents = branches.reduce((s, b) => s + b.studentCount, 0);
  const totalRevenue = branches.reduce((s, b) => s + b.monthlyRevenue, 0);

  const cards = [
    {
      label: 'Total Branches',
      value: total,
      icon: Building2,
      bg: 'bg-[var(--info-bg)]',
      color: 'text-[var(--info-solid)]',
      format: (v: number) => formatNumber(v),
    },
    {
      label: 'Active Branches',
      value: active,
      icon: CheckCircle2,
      bg: 'bg-[var(--success-bg)]',
      color: 'text-[var(--success-text)]',
      format: (v: number) => formatNumber(v),
    },
    {
      label: 'Total Students',
      value: totalStudents,
      icon: Users,
      bg: 'bg-[var(--brand-primary)]/10',
      color: 'text-[var(--brand-primary)]',
      format: (v: number) => formatNumber(v),
    },
    {
      label: 'Monthly Revenue',
      value: totalRevenue,
      icon: DollarSign,
      bg: 'bg-[var(--warning-bg)]',
      color: 'text-[var(--warning-text)]',
      format: (v: number) => `$${formatNumber(v)}`,
    },
  ] as const;

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            whileHover={{ translateY: -2, boxShadow: 'var(--shadow-md)' }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  c.bg,
                )}
              >
                <Icon size={16} className={c.color} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-[var(--text-muted)]">{c.label}</p>
                <p className="text-xl font-bold tabular-nums text-[var(--text-primary)]">
                  {c.format(c.value)}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Branch form modal ────────────────────────────────────────────────────────

interface BranchFormModalProps {
  initial?: BranchDto;
  onSubmit: (form: BranchForm) => Promise<void>;
  onClose: () => void;
}

function BranchFormModal({ initial, onSubmit, onClose }: BranchFormModalProps) {
  const titleId = useId();
  const [form, setForm] = useState<BranchForm>({
    name: initial?.name ?? '',
    address: initial?.address ?? '',
    managerId: initial?.managerId ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof BranchForm, string>>>({});

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Branch name is required.';
    if (!form.address.trim()) next.address = 'Address is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch {
      setErrors({ name: 'Failed to save branch. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Close on Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--bg-overlay)] sm:items-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className="relative w-full max-h-[92vh] overflow-y-auto rounded-t-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-xl)] sm:max-w-md sm:rounded-2xl"
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[var(--border-strong)]" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-6 py-4">
          <h2
            id={titleId}
            className="text-base font-semibold text-[var(--text-primary)]"
          >
            {initial ? 'Edit Branch' : 'Create Branch'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Branch name */}
          <div className="space-y-1.5">
            <label
              htmlFor="branch-name"
              className="block text-xs font-medium text-[var(--text-secondary)]"
            >
              Branch Name <span className="text-[var(--error-solid)]" aria-hidden="true">*</span>
            </label>
            <input
              id="branch-name"
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm((p) => ({ ...p, name: e.target.value }));
                setErrors((p) => ({ ...p, name: undefined }));
              }}
              placeholder="Main Campus"
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'branch-name-error' : undefined}
              className={cn(
                'h-11 w-full rounded-xl border bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors',
                errors.name
                  ? 'border-[var(--error-border)] focus:ring-2 focus:ring-[var(--error-solid)]/20'
                  : 'border-[var(--border-default)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20',
              )}
            />
            <AnimatePresence>
              {errors.name && (
                <motion.p
                  id="branch-name-error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  role="alert"
                  className="text-xs text-[var(--error-text)]"
                >
                  {errors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label
              htmlFor="branch-address"
              className="block text-xs font-medium text-[var(--text-secondary)]"
            >
              Address <span className="text-[var(--error-solid)]" aria-hidden="true">*</span>
            </label>
            <textarea
              id="branch-address"
              value={form.address}
              onChange={(e) => {
                setForm((p) => ({ ...p, address: e.target.value }));
                setErrors((p) => ({ ...p, address: undefined }));
              }}
              placeholder="123 Education Street, Tashkent"
              rows={3}
              aria-required="true"
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? 'branch-address-error' : undefined}
              className={cn(
                'w-full resize-none rounded-xl border bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors',
                errors.address
                  ? 'border-[var(--error-border)] focus:ring-2 focus:ring-[var(--error-solid)]/20'
                  : 'border-[var(--border-default)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20',
              )}
            />
            <AnimatePresence>
              {errors.address && (
                <motion.p
                  id="branch-address-error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  role="alert"
                  className="text-xs text-[var(--error-text)]"
                >
                  {errors.address}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Manager ID (optional free text — production would use a dropdown) */}
          <div className="space-y-1.5">
            <label
              htmlFor="branch-manager"
              className="block text-xs font-medium text-[var(--text-secondary)]"
            >
              Manager ID{' '}
              <span className="text-[var(--text-muted)]">(optional)</span>
            </label>
            <input
              id="branch-manager"
              type="text"
              value={form.managerId ?? ''}
              onChange={(e) =>
                setForm((p) => ({ ...p, managerId: e.target.value || null }))
              }
              placeholder="user-uuid"
              className="h-11 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-[var(--border-default)] px-6 py-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex flex-1 items-center justify-center rounded-xl border border-[var(--border-default)] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] disabled:opacity-60"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] py-2.5 text-sm font-medium text-[var(--text-on-brand)] transition-colors hover:bg-[var(--brand-primary-hover)] disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Save size={14} aria-hidden="true" />
            )}
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Branch'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Deactivate confirm dialog ────────────────────────────────────────────────

function DeactivateDialog({
  branch,
  onConfirm,
  onClose,
}: {
  branch: BranchDto;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const titleId = useId();
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    setPending(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-xl)]"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--warning-bg)]">
          <AlertTriangle size={22} className="text-[var(--warning-text)]" aria-hidden="true" />
        </div>

        <h2 id={titleId} className="text-base font-semibold text-[var(--text-primary)]">
          Deactivate Branch
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Are you sure you want to deactivate{' '}
          <strong className="text-[var(--text-primary)]">{branch.name}</strong>? This will hide
          it from active operations but preserve all data.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={pending}
            className="flex flex-1 items-center justify-center rounded-xl border border-[var(--border-default)] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] disabled:opacity-60"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            disabled={pending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--warning-solid)] py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {pending ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <PowerOff size={14} aria-hidden="true" />
            )}
            {pending ? 'Deactivating…' : 'Deactivate'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Desktop table row ────────────────────────────────────────────────────────

function BranchTableRow({
  branch,
  idx,
  onEdit,
  onDeactivate,
}: {
  branch: BranchDto;
  idx: number;
  onEdit: (b: BranchDto) => void;
  onDeactivate: (b: BranchDto) => void;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx, 9) * 0.04 }}
      className="border-b border-[var(--border-default)] transition-colors hover:bg-[var(--bg-surface-hover)]"
    >
      {/* Name + address */}
      <td className="px-4 py-3">
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
      </td>

      {/* Manager */}
      <td className="px-4 py-3">
        <p className="text-sm text-[var(--text-secondary)]">
          {branch.managerName ?? '—'}
        </p>
      </td>

      {/* Students */}
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Users size={12} className="text-[var(--text-muted)]" aria-hidden="true" />
          <span className="text-sm tabular-nums text-[var(--text-secondary)]">
            {formatNumber(branch.studentCount)}
          </span>
        </div>
      </td>

      {/* Teachers */}
      <td className="px-4 py-3 text-center">
        <span className="text-sm tabular-nums text-[var(--text-secondary)]">
          {branch.teacherCount}
        </span>
      </td>

      {/* Courses */}
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <BookOpen size={12} className="text-[var(--text-muted)]" aria-hidden="true" />
          <span className="text-sm tabular-nums text-[var(--text-secondary)]">
            {branch.courseCount}
          </span>
        </div>
      </td>

      {/* Revenue */}
      <td className="px-4 py-3">
        <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
          ${formatNumber(branch.monthlyRevenue)}{' '}
          <span className="text-xs font-normal text-[var(--text-muted)]">{branch.currency}</span>
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={branch.status} />
      </td>

      {/* Created */}
      <td className="px-4 py-3">
        <span className="whitespace-nowrap text-xs text-[var(--text-muted)]">
          {formatDate(branch.createdAt)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(branch)}
            aria-label={`Edit ${branch.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          >
            <Edit2 size={13} aria-hidden="true" />
          </motion.button>

          {branch.status === 'active' && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onDeactivate(branch)}
              aria-label={`Deactivate ${branch.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--warning-bg)] hover:text-[var(--warning-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              <PowerOff size={13} aria-hidden="true" />
            </motion.button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Desktop table ─────────────────────────────────────────────────────────────

function DesktopTable({
  branches,
  isLoading,
  onEdit,
  onDeactivate,
}: {
  branches: BranchDto[];
  isLoading: boolean;
  onEdit: (b: BranchDto) => void;
  onDeactivate: (b: BranchDto) => void;
}) {
  if (isLoading) return <SkeletonLoader variant="table" />;
  if (branches.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No branches found"
        description="Try adjusting your search or filters."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-default)]">
      <div className="overflow-x-auto">
        <table className="w-full" role="table" aria-label="Branches">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-secondary)]">
              {[
                'Branch',
                'Manager',
                'Students',
                'Teachers',
                'Courses',
                'Monthly Revenue',
                'Status',
                'Created',
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
          <tbody>
            {branches.map((branch, idx) => (
              <BranchTableRow
                key={branch.id}
                branch={branch}
                idx={idx}
                onEdit={onEdit}
                onDeactivate={onDeactivate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Mobile branch card ───────────────────────────────────────────────────────

function MobileBranchCard({
  branch,
  onEdit,
  onDeactivate,
}: {
  branch: BranchDto;
  onEdit: (b: BranchDto) => void;
  onDeactivate: (b: BranchDto) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
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
        <StatusBadge status={branch.status} />
      </div>

      {/* Stats grid */}
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-[var(--bg-surface-secondary)] p-3">
        <div className="text-center">
          <p className="text-xs text-[var(--text-muted)]">Students</p>
          <p className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
            {formatNumber(branch.studentCount)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[var(--text-muted)]">Teachers</p>
          <p className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
            {branch.teacherCount}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[var(--text-muted)]">Revenue</p>
          <p className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
            ${formatNumber(branch.monthlyRevenue)}
          </p>
        </div>
      </div>

      {branch.managerName && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Manager:{' '}
          <span className="font-medium text-[var(--text-secondary)]">{branch.managerName}</span>
        </p>
      )}

      {/* Actions */}
      <div className="mt-3 flex gap-2 border-t border-[var(--border-default)] pt-3">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onEdit(branch)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--border-default)] py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)]"
        >
          <Edit2 size={12} aria-hidden="true" />
          Edit
        </motion.button>

        {branch.status === 'active' && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onDeactivate(branch)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] py-2 text-xs font-medium text-[var(--warning-text)] transition-colors"
          >
            <PowerOff size={12} aria-hidden="true" />
            Deactivate
          </motion.button>
        )}
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
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex items-center justify-between gap-2 pt-4">
      <p className="text-xs text-[var(--text-muted)]">
        Page {page} of {totalPages} · {formatNumber(total)} branches
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OwnerBranchesPage() {
  const { branches, isLoading, createBranch, editBranch, deactivateBranch } =
    useOwnerBranches();

  const isMobile = useMediaQuery('(max-width: 639px)');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<BranchDto | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<BranchDto | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Client-side filter
  const filtered = useMemo(() => {
    return branches.filter((b) => {
      const matchesSearch =
        !debouncedSearch ||
        b.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        b.address.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (b.managerName ?? '').toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [branches, debouncedSearch, statusFilter]);

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

  const handleCreate = useCallback(
    async (form: BranchForm) => {
      await createBranch(form);
      setShowCreateModal(false);
    },
    [createBranch],
  );

  const handleEdit = useCallback(
    async (form: BranchForm) => {
      if (!editTarget) return;
      await editBranch(editTarget.id, form);
      setEditTarget(null);
    },
    [editTarget, editBranch],
  );

  const handleDeactivate = useCallback(async () => {
    if (!deactivateTarget) return;
    await deactivateBranch(deactivateTarget.id);
    setDeactivateTarget(null);
  }, [deactivateTarget, deactivateBranch]);

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
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10">
                <Building2 size={22} className="text-[var(--brand-primary)]" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
                  Branches
                </h1>
                <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                  {formatNumber(branches.length)} branches across the network
                </p>
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-3 py-2.5 text-sm font-medium text-[var(--text-on-brand)] shadow-[var(--shadow-md)] transition-colors hover:bg-[var(--brand-primary-hover)] sm:px-4"
          >
            <Plus size={16} aria-hidden="true" />
            <span className="hidden sm:inline">New Branch</span>
          </motion.button>
        </motion.div>

        {/* ── KPI bar ─────────────────────────────────────────────────── */}
        {!isLoading && <KPIBar branches={branches} />}

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
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
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search branches…"
              aria-label="Search branches"
              className="h-10 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1" role="group" aria-label="Filter by status">
            {(['all', 'active', 'inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                aria-pressed={statusFilter === s}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors',
                  statusFilter === s
                    ? 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]'
                    : 'border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
                )}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Desktop table ────────────────────────────────────────────── */}
        {!isMobile && (
          <>
            <DesktopTable
              branches={paginated}
              isLoading={isLoading}
              onEdit={setEditTarget}
              onDeactivate={setDeactivateTarget}
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
              <SkeletonLoader variant="card" count={5} />
            ) : paginated.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No branches found"
                description="Try adjusting your search."
                action={{ label: 'Create Branch', onClick: () => setShowCreateModal(true) }}
              />
            ) : (
              paginated.map((branch) => (
                <MobileBranchCard
                  key={branch.id}
                  branch={branch}
                  onEdit={setEditTarget}
                  onDeactivate={setDeactivateTarget}
                />
              ))
            )}

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

        {/* ── Modals ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showCreateModal && (
            <BranchFormModal
              onSubmit={handleCreate}
              onClose={() => setShowCreateModal(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editTarget && (
            <BranchFormModal
              initial={editTarget}
              onSubmit={handleEdit}
              onClose={() => setEditTarget(null)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {deactivateTarget && (
            <DeactivateDialog
              branch={deactivateTarget}
              onConfirm={handleDeactivate}
              onClose={() => setDeactivateTarget(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
