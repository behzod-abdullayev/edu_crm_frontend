'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  MapPin,
  Users,
  DollarSign,
  UserCircle,
  Plus,
  Pencil,
  AlertTriangle,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@shared/utils/cn';
import { mapBranchDtoToRow } from '../utils/owner.mapper';
import type { BranchDto, BranchForm } from '../types/owner.types';

// ── Zod Schema ────────────────────────────────────────────────────────────────

const branchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters'),
  address: z.string().min(3, 'Address must be at least 3 characters'),
  managerId: z.string().nullable(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

// ── Modal / Bottom-Sheet ───────────────────────────────────────────────────────

interface BranchFormModalProps {
  initial?: BranchDto;
  managers: { id: string; name: string }[];
  onSubmit: (form: BranchForm) => Promise<void>;
  onClose: () => void;
}

function BranchFormModal({ initial, managers, onSubmit, onClose }: BranchFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: initial?.name ?? '',
      address: initial?.address ?? '',
      managerId: initial?.managerId ?? null,
    },
  });

  const onValid = async (values: BranchFormValues) => {
    await onSubmit({ name: values.name, address: values.address, managerId: values.managerId });
    onClose();
  };

  const title = initial ? 'Edit Branch' : 'Create Branch';

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-[var(--bg-overlay)] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal — centered on md+, bottom sheet on mobile */}
      <motion.div
        key="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="branch-modal-title"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed z-50 w-full bg-[var(--bg-surface)] shadow-[var(--shadow-xl)]',
          // Desktop: centered
          'md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
          'md:max-w-md md:rounded-2xl md:border md:border-[var(--border-default)]',
          // Mobile: bottom sheet
          'bottom-0 left-0 right-0 rounded-t-2xl md:bottom-auto',
        )}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 md:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <h3
              id="branch-modal-title"
              className="text-lg font-semibold text-[var(--text-primary)]"
            >
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
              aria-label="Close modal"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onValid)} noValidate>
            <div className="space-y-4">
              {/* Branch Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="branch-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  Branch Name <span aria-hidden="true" className="text-[var(--error-solid)]">*</span>
                </label>
                <input
                  id="branch-name"
                  type="text"
                  autoComplete="off"
                  aria-required="true"
                  aria-invalid={errors.name !== undefined}
                  aria-describedby={errors.name ? 'branch-name-error' : undefined}
                  placeholder="e.g. Main Campus"
                  className={cn(
                    'w-full rounded-xl border bg-[var(--bg-surface-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]',
                    'min-h-[44px] placeholder:text-[var(--text-muted)]',
                    'transition-all duration-[var(--transition-fast)]',
                    'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]/20',
                    errors.name
                      ? 'border-[var(--error-border)] bg-[var(--error-bg)]'
                      : 'border-[var(--border-default)]',
                  )}
                  {...register('name')}
                />
                {errors.name && (
                  <motion.p
                    id="branch-name-error"
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1 text-xs text-[var(--error-text)]"
                  >
                    <AlertTriangle size={11} aria-hidden="true" />
                    {errors.name.message}
                  </motion.p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label
                  htmlFor="branch-address"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  Address <span aria-hidden="true" className="text-[var(--error-solid)]">*</span>
                </label>
                <input
                  id="branch-address"
                  type="text"
                  autoComplete="street-address"
                  aria-required="true"
                  aria-invalid={errors.address !== undefined}
                  aria-describedby={errors.address ? 'branch-address-error' : undefined}
                  placeholder="e.g. Tashkent, Chilanzar, 12A"
                  className={cn(
                    'w-full rounded-xl border bg-[var(--bg-surface-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]',
                    'min-h-[44px] placeholder:text-[var(--text-muted)]',
                    'transition-all duration-[var(--transition-fast)]',
                    'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]/20',
                    errors.address
                      ? 'border-[var(--error-border)] bg-[var(--error-bg)]'
                      : 'border-[var(--border-default)]',
                  )}
                  {...register('address')}
                />
                {errors.address && (
                  <motion.p
                    id="branch-address-error"
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1 text-xs text-[var(--error-text)]"
                  >
                    <AlertTriangle size={11} aria-hidden="true" />
                    {errors.address.message}
                  </motion.p>
                )}
              </div>

              {/* Manager */}
              <div className="space-y-1.5">
                <label
                  htmlFor="branch-manager"
                  className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  Manager
                </label>
                <select
                  id="branch-manager"
                  className={cn(
                    'w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-secondary)]',
                    'px-4 py-3 text-sm text-[var(--text-primary)] min-h-[44px]',
                    'transition-all duration-[var(--transition-fast)]',
                    'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]/20',
                  )}
                  {...register('managerId')}
                >
                  <option value="">— Unassigned —</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'flex flex-1 items-center justify-center rounded-xl py-3 text-sm font-semibold',
                  'bg-[var(--brand-primary)] text-[var(--text-on-brand)] min-h-[44px]',
                  'transition-colors hover:bg-[var(--brand-primary-hover)]',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={15} aria-hidden="true" />
                    {initial ? 'Save Changes' : 'Create Branch'}
                  </span>
                )}
              </motion.button>

              <motion.button
                type="button"
                onClick={onClose}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'flex-1 rounded-xl border border-[var(--border-default)] py-3 text-sm font-medium min-h-[44px]',
                  'text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface-hover)]',
                )}
              >
                Cancel
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Deactivate Confirm Dialog ─────────────────────────────────────────────────

interface ConfirmDeactivateProps {
  branch: BranchDto;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

function ConfirmDeactivateDialog({ branch, onConfirm, onCancel }: ConfirmDeactivateProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[var(--bg-overlay)] backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <motion.div
        key="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-deactivate-title"
        aria-describedby="confirm-deactivate-desc"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'fixed z-50 w-full max-w-sm bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-xl)]',
          'md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border md:border-[var(--border-default)]',
          'bottom-0 left-0 right-0 rounded-t-2xl md:bottom-auto',
        )}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--error-bg)]">
          <AlertTriangle size={22} className="text-[var(--error-solid)]" aria-hidden="true" />
        </div>

        <h3
          id="confirm-deactivate-title"
          className="mb-2 text-base font-semibold text-[var(--text-primary)]"
        >
          Deactivate Branch?
        </h3>
        <p id="confirm-deactivate-desc" className="mb-1 text-sm text-[var(--text-secondary)]">
          You are about to deactivate{' '}
          <strong className="text-[var(--text-primary)]">{branch.name}</strong>.
        </p>
        <p className="mb-6 text-sm text-[var(--warning-text)]">
          This will affect{' '}
          <strong>{branch.studentCount}</strong> students and{' '}
          <strong>{branch.teacherCount}</strong> teachers in this branch.
        </p>

        <div className="flex gap-3">
          <motion.button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'flex flex-1 items-center justify-center rounded-xl py-3 text-sm font-semibold min-h-[44px]',
              'bg-[var(--error-solid)] text-white hover:opacity-90',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              'Deactivate'
            )}
          </motion.button>
          <motion.button
            type="button"
            onClick={onCancel}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'flex-1 rounded-xl border border-[var(--border-default)] py-3 text-sm font-medium min-h-[44px]',
              'text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
            )}
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  return (
    <span
      role="status"
      aria-label={`Status: ${status}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        status === 'active'
          ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
          : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)]',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'active' ? 'bg-[var(--success-solid)]' : 'bg-[var(--text-muted)]',
        )}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}

// ── Mobile Branch Card ────────────────────────────────────────────────────────

interface MobileBranchCardProps {
  row: ReturnType<typeof mapBranchDtoToRow>;
  original: BranchDto;
  onEdit: (b: BranchDto) => void;
  onDeactivate: (b: BranchDto) => void;
}

function MobileBranchCard({ row, original, onEdit, onDeactivate }: MobileBranchCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden"
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10">
              <Building2 size={18} className="text-[var(--brand-primary)]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-[var(--text-primary)]">{row.name}</p>
              <p className="flex items-center gap-1 truncate text-xs text-[var(--text-muted)]">
                <MapPin size={11} aria-hidden="true" />
                {row.address}
              </p>
            </div>
          </div>
          <StatusBadge status={original.status} />
        </div>

        {/* Stats row */}
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-[var(--bg-surface-secondary)] p-2.5 text-center">
            <p className="text-xs text-[var(--text-muted)]">Students</p>
            <p className="text-sm font-bold text-[var(--text-primary)]">{row.studentCount}</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-surface-secondary)] p-2.5 text-center">
            <p className="text-xs text-[var(--text-muted)]">Revenue</p>
            <p className="truncate text-xs font-bold text-[var(--text-primary)]">{row.monthlyRevenue}</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-surface-secondary)] p-2.5 text-center">
            <p className="text-xs text-[var(--text-muted)]">Manager</p>
            <p className="truncate text-xs font-bold text-[var(--text-primary)]">{row.managerName}</p>
          </div>
        </div>
      </div>

      {/* Expandable details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border-default)] px-4 py-3">
              <p className="mb-1 text-xs text-[var(--text-muted)]">Teachers: {original.teacherCount}</p>
              <p className="text-xs text-[var(--text-muted)]">Courses: {original.courseCount}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action bar */}
      <div className="flex border-t border-[var(--border-default)]">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center justify-center gap-1 py-3 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse details' : 'Expand details'}
        >
          {expanded ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
          {expanded ? 'Less' : 'Details'}
        </button>
        <div className="w-px bg-[var(--border-default)]" />
        <button
          type="button"
          onClick={() => onEdit(original)}
          className="flex flex-1 items-center justify-center gap-1 py-3 text-xs font-medium text-[var(--brand-primary)] hover:bg-[var(--bg-surface-hover)]"
          aria-label={`Edit ${row.name}`}
        >
          <Pencil size={12} aria-hidden="true" />
          Edit
        </button>
        {original.status === 'active' && (
          <>
            <div className="w-px bg-[var(--border-default)]" />
            <button
              type="button"
              onClick={() => onDeactivate(original)}
              className="flex flex-1 items-center justify-center gap-1 py-3 text-xs font-medium text-[var(--error-text)] hover:bg-[var(--error-bg)]"
              aria-label={`Deactivate ${row.name}`}
            >
              <X size={12} aria-hidden="true" />
              Deactivate
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface BranchManagerProps {
  branches: BranchDto[];
  managers: { id: string; name: string }[];
  onCreateBranch: (form: BranchForm) => Promise<void>;
  onEditBranch: (id: string, form: BranchForm) => Promise<void>;
  onDeactivateBranch: (id: string) => Promise<void>;
}

export function BranchManager({
  branches,
  managers,
  onCreateBranch,
  onEditBranch,
  onDeactivateBranch,
}: BranchManagerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchDto | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<BranchDto | null>(null);

  const rows = branches.map(mapBranchDtoToRow);

  const activeBranches = branches.filter((b) => b.status === 'active').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">{branches.length}</span>{' '}
            branches total
          </p>
          <span className="rounded-full bg-[var(--success-bg)] px-2 py-0.5 text-xs font-medium text-[var(--success-text)]">
            {activeBranches} active
          </span>
        </div>
        <motion.button
          type="button"
          onClick={() => setShowCreate(true)}
          whileTap={{ scale: 0.97 }}
          className={cn(
            'flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold',
            'text-[var(--text-on-brand)] hover:bg-[var(--brand-primary-hover)] min-h-[40px]',
            'transition-colors',
          )}
        >
          <Plus size={15} aria-hidden="true" />
          Add Branch
        </motion.button>
      </div>

      {/* Empty state */}
      {branches.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-default)] py-16 text-center"
        >
          <Building2 size={36} className="mb-3 text-[var(--text-muted)]" aria-hidden="true" />
          <p className="font-semibold text-[var(--text-primary)]">No branches yet</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Add your first branch to get started.</p>
        </motion.div>
      )}

      {/* Desktop table */}
      {branches.length > 0 && (
        <div className="hidden overflow-hidden rounded-2xl border border-[var(--border-default)] md:block">
          <table className="w-full text-sm" role="table" aria-label="Branches table">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-secondary)]">
                {[
                  { label: 'Branch', icon: Building2 },
                  { label: 'Address', icon: MapPin },
                  { label: 'Manager', icon: UserCircle },
                  { label: 'Students', icon: Users },
                  { label: 'Revenue', icon: DollarSign },
                  { label: 'Status', icon: null },
                  { label: 'Actions', icon: null },
                ].map(({ label }) => (
                  <th
                    key={label}
                    scope="col"
                    className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {rows.map((row, i) => {
                const original = branches[i];
                if (!original) return null;
                return (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="group transition-colors hover:bg-[var(--bg-surface-hover)]"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)]/10">
                          <Building2 size={14} className="text-[var(--brand-primary)]" aria-hidden="true" />
                        </div>
                        <span className="font-semibold text-[var(--text-primary)]">{row.name}</span>
                      </div>
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3.5 text-[var(--text-secondary)]">
                      {row.address}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-secondary)]">{row.managerName}</td>
                    <td className="px-4 py-3.5 tabular-nums text-[var(--text-secondary)]">{row.studentCount}</td>
                    <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                      {row.monthlyRevenue}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={original.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingBranch(original)}
                          className="flex items-center gap-1 text-xs font-medium text-[var(--brand-primary)] hover:underline"
                          aria-label={`Edit ${row.name}`}
                        >
                          <Pencil size={11} aria-hidden="true" />
                          Edit
                        </button>
                        {original.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeactivate(original)}
                            className="flex items-center gap-1 text-xs font-medium text-[var(--error-text)] hover:underline"
                            aria-label={`Deactivate ${row.name}`}
                          >
                            <X size={11} aria-hidden="true" />
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {branches.length > 0 && (
        <div className="grid gap-3 md:hidden">
          {rows.map((row, i) => {
            const original = branches[i];
            if (!original) return null;
            return (
              <MobileBranchCard
                key={row.id}
                row={row}
                original={original}
                onEdit={setEditingBranch}
                onDeactivate={setConfirmDeactivate}
              />
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <BranchFormModal
          managers={managers}
          onSubmit={onCreateBranch}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Edit modal */}
      {editingBranch !== null && (
        <BranchFormModal
          initial={editingBranch}
          managers={managers}
          onSubmit={(form) => onEditBranch(editingBranch.id, form)}
          onClose={() => setEditingBranch(null)}
        />
      )}

      {/* Deactivate confirm */}
      {confirmDeactivate !== null && (
        <ConfirmDeactivateDialog
          branch={confirmDeactivate}
          onConfirm={() => onDeactivateBranch(confirmDeactivate.id)}
          onCancel={() => setConfirmDeactivate(null)}
        />
      )}
    </div>
  );
}