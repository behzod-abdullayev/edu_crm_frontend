'use client';

import { useState } from 'react';
import { BranchDto, BranchForm } from '../types/owner.types';
import { mapBranchDtoToRow } from '../utils/owner.mapper';

interface BranchManagerProps {
  branches: BranchDto[];
  managers: { id: string; name: string }[];
  onCreateBranch: (form: BranchForm) => Promise<void>;
  onEditBranch: (id: string, form: BranchForm) => Promise<void>;
  onDeactivateBranch: (id: string) => Promise<void>;
}

function BranchFormModal({
  initial,
  managers,
  onSubmit,
  onClose,
}: {
  initial?: BranchDto;
  managers: { id: string; name: string }[];
  onSubmit: (form: BranchForm) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [managerId, setManagerId] = useState(initial?.managerId ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit({ name, address, managerId: managerId || null });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? 'Edit Branch' : 'Create Branch'}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          {initial ? 'Edit Branch' : 'Create Branch'}
        </h3>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Branch Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Main Branch"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="City, Street, Building"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Manager</label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Unassigned</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving || !name}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            type="button"
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Branch'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
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
  const [deactivating, setDeactivating] = useState(false);

  const rows = branches.map(mapBranchDtoToRow);

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    setDeactivating(true);
    try {
      await onDeactivateBranch(confirmDeactivate.id);
      setConfirmDeactivate(null);
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{branches.length} branches total</p>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          type="button"
        >
          + Add Branch
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-xl border border-border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {['Branch', 'Address', 'Manager', 'Students', 'Revenue', 'Status', 'Actions'].map((col) => (
                <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, i) => (
              <tr key={row.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                <td className="max-w-40 truncate px-4 py-3 text-muted-foreground">{row.address}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.managerName}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.studentCount}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.monthlyRevenue}</td>
                <td className="px-4 py-3">
                  <span className={[
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    row.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted text-muted-foreground',
                  ].join(' ')}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { const b = branches[i]; if (b) setEditingBranch(b); }}
                      className="text-xs text-primary hover:underline"
                      type="button"
                    >
                      Edit
                    </button>
                    {row.status === 'active' && (
                      <button
                        onClick={() => { const b = branches[i]; if (b) setConfirmDeactivate(b); }}
                        className="text-xs text-red-600 hover:underline dark:text-red-400"
                        type="button"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {rows.map((row, i) => (
          <div key={row.id} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="font-semibold text-foreground">{row.name}</p>
                <p className="text-xs text-muted-foreground">{row.address}</p>
              </div>
              <span className={[
                'rounded-full px-2 py-0.5 text-xs font-medium',
                row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground',
              ].join(' ')}>
                {row.status}
              </span>
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Manager</p>
                <p className="font-medium text-foreground">{row.managerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Students</p>
                <p className="font-medium text-foreground">{row.studentCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Revenue</p>
                <p className="font-medium text-foreground">{row.monthlyRevenue}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { const b = branches[i]; if (b) setEditingBranch(b); }} className="text-xs text-primary" type="button">Edit</button>
              {row.status === 'active' && (
                <button onClick={() => { const b = branches[i]; if (b) setConfirmDeactivate(b); }} className="text-xs text-red-600" type="button">Deactivate</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showCreate && (
        <BranchFormModal
          managers={managers}
          onSubmit={onCreateBranch}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editingBranch && (
        <BranchFormModal
          initial={editingBranch}
          managers={managers}
          onSubmit={(form) => onEditBranch(editingBranch.id, form)}
          onClose={() => setEditingBranch(null)}
        />
      )}

      {/* Deactivate Confirm */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-foreground">Deactivate Branch?</h3>
            <p className="mb-1 text-sm text-muted-foreground">
              You are about to deactivate <strong>{confirmDeactivate.name}</strong>.
            </p>
            <p className="mb-6 text-sm text-orange-600 dark:text-orange-400">
              This will affect {confirmDeactivate.studentCount} students and {confirmDeactivate.teacherCount} teachers in this branch.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeactivate}
                disabled={deactivating}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                type="button"
              >
                {deactivating ? 'Deactivating…' : 'Deactivate'}
              </button>
              <button
                onClick={() => setConfirmDeactivate(null)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
