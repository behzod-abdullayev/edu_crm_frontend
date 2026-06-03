'use client';

import { useState } from 'react';
import { useOwnerUsers, useOwnerBranches } from '@/modules/owner/hooks/useOwner';
import { mapUserDtoToRow } from '@/modules/owner/utils/owner.mapper';
import { UserRole } from '@/modules/owner/types/owner.types';

const ROLES: UserRole[] = ['student', 'teacher', 'admin', 'owner'];

const ROLE_BADGE: Record<UserRole, string> = {
  student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  teacher: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  owner: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export function OwnerUsersClient() {
  const { users, isLoading, changeRole, toggleStatus } = useOwnerUsers();
  const { branches } = useOwnerBranches();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchBranch = branchFilter === 'all' || u.branchId === branchFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchBranch && matchStatus;
  });

  const rows = filtered.map(mapUserDtoToRow);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setChangingRoleId(userId);
    try {
      await changeRole(userId, newRole);
    } finally {
      setChangingRoleId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">{users.length} total users across all branches</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          type="button"
        >
          + Create User
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-56"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r} className="capitalize">{r}</option>
          ))}
        </select>
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-xl border border-border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {['Name', 'Email', 'Role', 'Branch', 'Status', 'Last Login', 'Actions'].map((col) => (
                <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, i) => {
                  const user = filtered[i]; if (!user) return null;
                  return (
                    <tr key={row.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                      <td className="px-4 py-3">
                        {changingRoleId === row.id ? (
                          <select
                            defaultValue={user.role}
                            onChange={(e) => handleRoleChange(row.id, e.target.value as UserRole)}
                            className="rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                            autoFocus
                            onBlur={() => setChangingRoleId(null)}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r} className="capitalize">{r}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={[
                            'cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                            ROLE_BADGE[user.role],
                          ].join(' ')}
                            onClick={() => setChangingRoleId(row.id)}
                            title="Click to change role"
                          >
                            {row.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.branchName}</td>
                      <td className="px-4 py-3">
                        <span className={[
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          user.status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-muted text-muted-foreground',
                        ].join(' ')}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.lastLogin}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleStatus(row.id, user.status === 'active' ? 'inactive' : 'active')}
                          className="text-xs text-primary hover:underline"
                          type="button"
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {rows.map((row, i) => {
          const user = filtered[i]; if (!user) return null;
          return (
            <div key={row.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                </div>
                <span className={[
                  'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                  ROLE_BADGE[user.role],
                ].join(' ')}>
                  {row.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{row.branchName} · {row.lastLogin}</p>
                <button
                  onClick={() => toggleStatus(row.id, user.status === 'active' ? 'inactive' : 'active')}
                  className="text-xs text-primary"
                  type="button"
                >
                  {user.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create User Modal placeholder */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Create User</h3>
            <div className="space-y-4">
              {['Full Name', 'Email'].map((field) => (
                <div key={field} className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{field}</label>
                  <input
                    type={field === 'Email' ? 'email' : 'text'}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={field}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Role</label>
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="capitalize">{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground" type="button">
                Create
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
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
