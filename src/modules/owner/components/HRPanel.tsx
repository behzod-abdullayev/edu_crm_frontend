'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import {
  UserCircle,
  DollarSign,
  FileCheck,
  Building2,
  SlidersHorizontal,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@shared/utils/cn';
import { mapStaffDtoToRow } from '../utils/owner.mapper';
import type { StaffDto, ContractStatus } from '../types/owner.types';

// ── Zod ───────────────────────────────────────────────────────────────────────

const salarySchema = z
  .string()
  .min(1, 'Required')
  .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Must be a valid positive number');

// ── Status badge ──────────────────────────────────────────────────────────────

const CONTRACT_BADGE: Record<ContractStatus, string> = {
  active: 'bg-[var(--success-bg)] text-[var(--success-text)]',
  expired: 'bg-[var(--error-bg)] text-[var(--error-text)]',
  pending: 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
};

function ContractBadge({ status }: { status: ContractStatus }) {
  return (
    <span
      role="status"
      aria-label={`Contract: ${status}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
        CONTRACT_BADGE[status],
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'active'
            ? 'bg-[var(--success-solid)]'
            : status === 'expired'
              ? 'bg-[var(--error-solid)]'
              : 'bg-[var(--warning-solid)]',
        )}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}

// ── Inline salary editor ──────────────────────────────────────────────────────

interface SalaryEditorProps {
  staffId: string;
  currentSalary: string;
  onSave: (id: string, salary: number) => Promise<void>;
  onCancel: () => void;
}

function SalaryEditor({ staffId, currentSalary, onSave, onCancel }: SalaryEditorProps) {
  const rawDefault = currentSalary.replace(/[^\d]/g, '');
  const [value, setValue] = useState(rawDefault);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const result = salarySchema.safeParse(value);
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? 'Invalid');
      return;
    }
    setSaving(true);
    try {
      await onSave(staffId, Number(value));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          inputMode="numeric"
          aria-label="New salary"
          aria-invalid={error !== null}
          min={0}
          className={cn(
            'w-28 rounded-lg border bg-[var(--bg-surface-secondary)] px-2.5 py-1.5 text-sm text-[var(--text-primary)]',
            'min-h-[36px] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]/20',
            error ? 'border-[var(--error-border)]' : 'border-[var(--border-default)]',
          )}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--success-text)] hover:underline disabled:opacity-50"
          aria-label="Save salary"
        >
          {saving ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
          ) : (
            <CheckCircle2 size={13} aria-hidden="true" />
          )}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline"
          aria-label="Cancel editing salary"
        >
          <X size={13} aria-hidden="true" />
        </button>
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1 text-xs text-[var(--error-text)]">
          <AlertTriangle size={10} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── Mobile Staff Card ─────────────────────────────────────────────────────────

interface MobileStaffCardProps {
  row: ReturnType<typeof mapStaffDtoToRow>;
  original: StaffDto;
  editingSalaryId: string | null;
  onEditSalary: (s: StaffDto) => void;
  onSaveSalary: (id: string, salary: number) => Promise<void>;
  onCancelSalary: () => void;
}

function MobileStaffCard({
  row,
  original,
  editingSalaryId,
  onEditSalary,
  onSaveSalary,
  onCancelSalary,
}: MobileStaffCardProps) {
  const isEditing = editingSalaryId === original.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-accent)]/10">
            <UserCircle size={18} className="text-[var(--brand-accent)]" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)]">{row.name}</p>
            <p className="text-xs capitalize text-[var(--text-muted)]">
              {row.role} · {row.branchName}
            </p>
          </div>
        </div>
        <ContractBadge status={original.contractStatus} />
      </div>

      {/* Stats */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[var(--bg-surface-secondary)] p-2.5">
          <p className="text-xs text-[var(--text-muted)]">Salary</p>
          {isEditing ? (
            <SalaryEditor
              staffId={original.id}
              currentSalary={row.salary}
              onSave={onSaveSalary}
              onCancel={onCancelSalary}
            />
          ) : (
            <p className="text-sm font-bold text-[var(--text-primary)]">{row.salary}</p>
          )}
        </div>
        <div className="rounded-xl bg-[var(--bg-surface-secondary)] p-2.5">
          <p className="text-xs text-[var(--text-muted)]">Hired</p>
          <p className="text-sm font-bold text-[var(--text-primary)]">{row.hireDate}</p>
        </div>
      </div>

      {/* Actions */}
      {!isEditing && (
        <button
          type="button"
          onClick={() => onEditSalary(original)}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--brand-primary)] hover:underline"
          aria-label={`Edit salary for ${row.name}`}
        >
          <DollarSign size={12} aria-hidden="true" />
          Edit Salary
        </button>
      )}
    </motion.div>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────

interface FilterBarProps {
  branches: { id: string; name: string }[];
  branchFilter: string;
  roleFilter: 'all' | 'teacher' | 'admin';
  contractFilter: 'all' | ContractStatus;
  resultCount: number;
  onBranchChange: (v: string) => void;
  onRoleChange: (v: 'all' | 'teacher' | 'admin') => void;
  onContractChange: (v: 'all' | ContractStatus) => void;
}

function FilterBar({
  branches,
  branchFilter,
  roleFilter,
  contractFilter,
  resultCount,
  onBranchChange,
  onRoleChange,
  onContractChange,
}: FilterBarProps) {
  const selectCls = cn(
    'h-10 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-secondary)]',
    'px-3 text-sm text-[var(--text-primary)] min-w-[120px]',
    'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]/20',
    'transition-colors',
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
        <SlidersHorizontal size={13} aria-hidden="true" />
        Filters
      </div>

      <select
        value={branchFilter}
        onChange={(e) => onBranchChange(e.target.value)}
        className={selectCls}
        aria-label="Filter by branch"
      >
        <option value="all">All Branches</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <select
        value={roleFilter}
        onChange={(e) => onRoleChange(e.target.value as 'all' | 'teacher' | 'admin')}
        className={selectCls}
        aria-label="Filter by role"
      >
        <option value="all">All Roles</option>
        <option value="teacher">Teachers</option>
        <option value="admin">Admins</option>
      </select>

      <select
        value={contractFilter}
        onChange={(e) => onContractChange(e.target.value as 'all' | ContractStatus)}
        className={selectCls}
        aria-label="Filter by contract status"
      >
        <option value="all">All Contracts</option>
        <option value="active">Active</option>
        <option value="expired">Expired</option>
        <option value="pending">Pending</option>
      </select>

      <span className="ml-auto text-xs text-[var(--text-muted)]">
        <strong className="text-[var(--text-primary)]">{resultCount}</strong>{' '}
        staff member{resultCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface HRPanelProps {
  staff: StaffDto[];
  branches: { id: string; name: string }[];
  onUpdateSalary: (staffId: string, salary: number) => Promise<void>;
}

export function HRPanel({ staff, branches, onUpdateSalary }: HRPanelProps) {
  const [branchFilter, setBranchFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'admin'>('all');
  const [contractFilter, setContractFilter] = useState<'all' | ContractStatus>('all');
  const [editingSalaryId, setEditingSalaryId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      staff.filter((s) => {
        // BUG FIX: users.branch DB maydoni NULL bo'lishi mumkin,
        // shuning uchun s.branchId bo'sh ('') keladi.
        // Filtr UUID (branchFilter) bilan taqqoslaydi → match topilmaydi → 0 natija.
        // Yechim: branchId YOKI branchName orqali solishtirish (ism bo'yicha fallback).
        const selectedBranch = branches.find((b) => b.id === branchFilter);
        const matchBranch =
          branchFilter === 'all' ||
          s.branchId === branchFilter ||
          (selectedBranch !== undefined &&
            s.branchName.toLowerCase() === selectedBranch.name.toLowerCase());
        const matchRole = roleFilter === 'all' || s.role === roleFilter;
        const matchContract = contractFilter === 'all' || s.contractStatus === contractFilter;
        return matchBranch && matchRole && matchContract;
      }),
    [staff, branches, branchFilter, roleFilter, contractFilter],
  );

  const rows = useMemo(() => filtered.map(mapStaffDtoToRow), [filtered]);

  const handleSaveSalary = async (id: string, salary: number) => {
    await onUpdateSalary(id, salary);
    setEditingSalaryId(null);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <FilterBar
        branches={branches}
        branchFilter={branchFilter}
        roleFilter={roleFilter}
        contractFilter={contractFilter}
        resultCount={filtered.length}
        onBranchChange={setBranchFilter}
        onRoleChange={setRoleFilter}
        onContractChange={setContractFilter}
      />

      {/* Empty state */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-default)] py-14 text-center"
          >
            <FileCheck size={32} className="mb-3 text-[var(--text-muted)]" aria-hidden="true" />
            <p className="font-semibold text-[var(--text-primary)]">No staff found</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Try adjusting the filters above.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop table */}
      {filtered.length > 0 && (
        <div className="hidden overflow-hidden rounded-2xl border border-[var(--border-default)] md:block">
          <table className="w-full text-sm" role="table" aria-label="Staff table">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-secondary)]">
                {['Name', 'Role', 'Branch', 'Salary', 'Contract', 'Hired', 'Actions'].map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {rows.map((row, i) => {
                const s = filtered[i];
                if (!s) return null;
                const isEditing = editingSalaryId === s.id;

                return (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="group transition-colors hover:bg-[var(--bg-surface-hover)]"
                  >
                    {/* Name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-accent)]/10">
                          <UserCircle
                            size={14}
                            className="text-[var(--brand-accent)]"
                            aria-hidden="true"
                          />
                        </div>
                        <span className="font-semibold text-[var(--text-primary)]">{row.name}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5 capitalize text-[var(--text-secondary)]">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                          s.role === 'teacher'
                            ? 'bg-[var(--role-teacher)]/10 text-[var(--role-teacher)]'
                            : 'bg-[var(--role-admin)]/10 text-[var(--role-admin)]',
                        )}
                      >
                        {row.role}
                      </span>
                    </td>

                    {/* Branch */}
                    <td className="px-4 py-3.5 text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Building2 size={12} aria-hidden="true" className="text-[var(--text-muted)]" />
                        {row.branchName}
                      </span>
                    </td>

                    {/* Salary */}
                    <td className="px-4 py-3.5 tabular-nums">
                      {isEditing ? (
                        <SalaryEditor
                          staffId={s.id}
                          currentSalary={row.salary}
                          onSave={handleSaveSalary}
                          onCancel={() => setEditingSalaryId(null)}
                        />
                      ) : (
                        <span className="font-mono text-xs text-[var(--text-secondary)]">
                          {row.salary}
                        </span>
                      )}
                    </td>

                    {/* Contract */}
                    <td className="px-4 py-3.5">
                      <ContractBadge status={s.contractStatus} />
                    </td>

                    {/* Hire date */}
                    <td className="px-4 py-3.5 tabular-nums text-[var(--text-muted)]">
                      {row.hireDate}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => setEditingSalaryId(s.id)}
                          className="flex items-center gap-1 text-xs font-medium text-[var(--brand-primary)] hover:underline"
                          aria-label={`Edit salary for ${row.name}`}
                        >
                          <DollarSign size={12} aria-hidden="true" />
                          Edit Salary
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {filtered.length > 0 && (
        <div className="grid gap-3 md:hidden">
          {rows.map((row, i) => {
            const original = filtered[i];
            if (!original) return null;
            return (
              <MobileStaffCard
                key={row.id}
                row={row}
                original={original}
                editingSalaryId={editingSalaryId}
                onEditSalary={(s) => setEditingSalaryId(s.id)}
                onSaveSalary={handleSaveSalary}
                onCancelSalary={() => setEditingSalaryId(null)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}