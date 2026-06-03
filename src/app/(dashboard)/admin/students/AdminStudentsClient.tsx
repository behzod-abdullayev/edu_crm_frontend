'use client';

import { useState } from 'react';
import { useAdminStudents } from '@/modules/admin/hooks/useAdmin';
import { mapStudentDtoToRow } from '@/modules/admin/utils/admin.mapper';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { can } from '@/lib/permissions';

type PaymentFilter = 'all' | 'paid' | 'pending' | 'overdue';

const PAYMENT_BADGE: Record<string, string> = {
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function AdminStudentsClient() {
  const { user } = useAuth();
  const { students, isLoading, toggleStatus } = useAdminStudents();
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  if (!can(user, 'student.view')) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to view students.</p>
      </div>
    );
  }

  const filtered = students.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchPayment = paymentFilter === 'all' || s.paymentStatus === paymentFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchPayment && matchStatus;
  });

  const rows = filtered.map(mapStudentDtoToRow);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDeactivate = async () => {
    await Promise.all(
      Array.from(selectedIds).map((id) => toggleStatus(id, 'inactive'))
    );
    setSelectedIds(new Set());
    setShowBulkConfirm(false);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground">{students.length} total students</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && can(user, 'student.view') && (
            <button
              onClick={() => setShowBulkConfirm(true)}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
              type="button"
            >
              Deactivate {selectedIds.size} selected
            </button>
          )}
          {can(user, 'student.view') && (
            <button
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              type="button"
            >
              + Add Student
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search students…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-56"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-xl border border-border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-10 px-4 py-3" aria-label="Select" />
              {['Name', 'Email', 'Courses', 'Attendance', 'Balance', 'Status', 'Payment', 'Actions'].map((col) => (
                <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, i) => (
                  <tr key={row.id} className={['hover:bg-muted/30', selectedIds.has(row.id) && 'bg-primary/5'].join(' ')}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.courseCount}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.attendancePercent}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.balance}</td>
                    <td className="px-4 py-3">
                      <span className={[
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground',
                      ].join(' ')}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={['rounded-full px-2 py-0.5 text-xs font-medium capitalize', PAYMENT_BADGE[row.paymentStatus] ?? ''].join(' ')}>
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {can(user, 'student.view') && (
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
          <div key={row.id} className={['rounded-xl border bg-card p-4', selectedIds.has(row.id) ? 'border-primary' : 'border-border'].join(' ')}>
            <div className="mb-2 flex items-start gap-3">
              <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)} className="mt-1 rounded" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">{row.name}</p>
                <p className="text-xs text-muted-foreground">{row.email}</p>
              </div>
              <span className={['rounded-full px-2 py-0.5 text-xs font-medium capitalize', PAYMENT_BADGE[row.paymentStatus] ?? ''].join(' ')}>
                {row.paymentStatus}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {row.courseCount} courses · {row.attendancePercent} attendance · {row.balance}
            </div>
          </div>
        ))}
      </div>

      {/* Bulk confirm dialog */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="alertdialog">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-2 font-semibold text-foreground">Deactivate {selectedIds.size} students?</h3>
            <p className="mb-6 text-sm text-muted-foreground">These students will lose access to the platform.</p>
            <div className="flex gap-3">
              <button onClick={handleBulkDeactivate} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white" type="button">
                Confirm
              </button>
              <button onClick={() => setShowBulkConfirm(false)} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground" type="button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
