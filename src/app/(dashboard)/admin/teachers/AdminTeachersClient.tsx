'use client';

import { useState } from 'react';
import { useAdminTeachers } from '@/modules/admin/hooks/useAdmin';
import { mapTeacherDtoToRow } from '@/modules/admin/utils/admin.mapper';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { can } from '@/lib/permissions';

export function AdminTeachersClient() {
  const { user } = useAuth();
  const { teachers, isLoading, toggleStatus } = useAdminTeachers();
  const [search, setSearch] = useState('');

  if (!can(user, 'teacher.view')) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to view teachers.</p>
      </div>
    );
  }

  const filtered = teachers.filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
  );

  const rows = filtered.map(mapTeacherDtoToRow);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teachers</h1>
          <p className="text-sm text-muted-foreground">{teachers.length} teachers</p>
        </div>
        {can(user, 'teacher.update') && (
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            type="button"
          >
            + Invite Teacher
          </button>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search teachers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full max-w-xs rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-xl border border-border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {['Name', 'Email', 'Phone', 'Groups', 'Joined', 'Status', 'Actions'].map((col) => (
                <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, i) => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.phone}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.groupsAssigned}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.joinedDate}</td>
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
                      {can(user, 'teacher.update') && (
                        <button
                          onClick={() => toggleStatus(row.id, row.status === 'active' ? 'inactive' : 'active')}
                          className="text-xs text-primary hover:underline"
                          type="button"
                        >
                          {row.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
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
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-foreground">{row.name}</p>
                <p className="text-xs text-muted-foreground">{row.email}</p>
                <p className="text-xs text-muted-foreground">{row.phone}</p>
              </div>
              <span className={[
                'rounded-full px-2 py-0.5 text-xs font-medium',
                row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground',
              ].join(' ')}>
                {row.status}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{row.groupsAssigned} groups · Since {row.joinedDate}</span>
              {can(user, 'teacher.update') && (
                <button
                  onClick={() => toggleStatus(row.id, row.status === 'active' ? 'inactive' : 'active')}
                  className="text-xs text-primary"
                  type="button"
                >
                  {row.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
