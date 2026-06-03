'use client';

import { useState } from 'react';
import { StaffDto, ContractStatus } from '../types/owner.types';
import { mapStaffDtoToRow } from '../utils/owner.mapper';

const CONTRACT_STATUS_CLASSES: Record<ContractStatus, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

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
  const [salaryInput, setSalaryInput] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const filtered = staff.filter((s) => {
    const matchBranch = branchFilter === 'all' || s.branchId === branchFilter;
    const matchRole = roleFilter === 'all' || s.role === roleFilter;
    const matchContract = contractFilter === 'all' || s.contractStatus === contractFilter;
    return matchBranch && matchRole && matchContract;
  });

  const rows = filtered.map(mapStaffDtoToRow);

  const startEditSalary = (s: StaffDto) => {
    setEditingSalaryId(s.id);
    setSalaryInput(String(s.salary));
  };

  const saveSalary = async (id: string) => {
    setSavingId(id);
    try {
      await onUpdateSalary(id, Number(salaryInput));
      setEditingSalaryId(null);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Roles</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>

        <select
          value={contractFilter}
          onChange={(e) => setContractFilter(e.target.value as typeof contractFilter)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Contracts</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="pending">Pending</option>
        </select>

        <span className="ml-auto flex items-center text-xs text-muted-foreground">
          {filtered.length} staff member{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-xl border border-border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {['Name', 'Role', 'Branch', 'Salary', 'Contract', 'Hired', 'Actions'].map((col) => (
                <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No staff found
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const s = filtered[i];
                if (!s) return null;
                const isEditing = editingSalaryId === s.id;
                return (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{row.role}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.branchName}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {isEditing ? (
                        <input
                          type="number"
                          value={salaryInput}
                          onChange={(e) => setSalaryInput(e.target.value)}
                          className="w-28 rounded-lg border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          min="0"
                        />
                      ) : (
                        <span>{row.salary}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={[
                        'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                        CONTRACT_STATUS_CLASSES[s.contractStatus],
                      ].join(' ')}>
                        {row.contractStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.hireDate}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveSalary(s.id)}
                            disabled={savingId === s.id}
                            className="text-xs text-green-600 hover:underline disabled:opacity-50"
                            type="button"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingSalaryId(null)}
                            className="text-xs text-muted-foreground hover:underline"
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditSalary(s)}
                          className="text-xs text-primary hover:underline"
                          type="button"
                        >
                          Edit Salary
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {rows.map((row, i) => {
          const s = filtered[i];
          if (!s) return null;
          return (
            <div key={row.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{row.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{row.role} · {row.branchName}</p>
                </div>
                <span className={[
                  'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                  CONTRACT_STATUS_CLASSES[s.contractStatus],
                ].join(' ')}>
                  {row.contractStatus}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">{row.salary}</p>
              <p className="text-xs text-muted-foreground">Hired: {row.hireDate}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
