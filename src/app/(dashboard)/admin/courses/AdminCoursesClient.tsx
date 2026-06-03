'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminCourses } from '@/modules/admin/hooks/useAdmin';
import { mapCourseDtoToRow } from '@/modules/admin/utils/admin.mapper';
import { CourseStatus } from '@/modules/admin/types/admin.types';

// Assumes can() utility injected via auth context from Part 1–5
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { can } from '@/lib/permissions';

const STATUS_CLASSES: Record<CourseStatus, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  draft: 'bg-muted text-muted-foreground',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const STATUS_FILTERS: { label: string; value: CourseStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
  { label: 'Completed', value: 'completed' },
];

export function AdminCoursesClient() {
  const { user } = useAuth();
  const { courses, isLoading, deleteCourse } = useAdminCourses();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!can(user, 'course.view')) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to view courses.</p>
      </div>
    );
  }

  const filtered = courses.filter((c) => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.teacherName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const rows = filtered.map(mapCourseDtoToRow);

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    try {
      await deleteCourse(confirmDeleteId);
      setConfirmDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Teacher', 'Students', 'Price', 'Status', 'Start Date'];
    const csvRows = [
      headers.join(','),
      ...rows.map((r) =>
        [r.name, r.teacherName, r.studentsEnrolled, r.price, r.status, r.startDate].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `courses-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Courses</h1>
          <p className="text-sm text-muted-foreground">{courses.length} total courses</p>
        </div>
        <div className="flex gap-2">
          {can(user, 'course.create') && (
            <button
              onClick={() => router.push('/admin/courses/new')}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              type="button"
            >
              + Create Course
            </button>
          )}
          <button
            onClick={exportCSV}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            type="button"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search courses or teachers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-64"
        />
        <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={[
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                statusFilter === f.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-xl border border-border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {['Name', 'Teacher', 'Students', 'Price', 'Status', 'Start Date', 'Actions'].map((col) => (
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
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.teacherName}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.studentsEnrolled}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.price}</td>
                    <td className="px-4 py-3">
                      <span className={[
                        'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                        STATUS_CLASSES[row.status as CourseStatus],
                      ].join(' ')}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.startDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/admin/courses/${row.id}`)}
                          className="text-xs text-primary hover:underline"
                          type="button"
                        >
                          View
                        </button>
                        {can(user, 'course.update') && (
                          <button
                            onClick={() => router.push(`/admin/courses/${row.id}?edit=1`)}
                            className="text-xs text-foreground hover:underline"
                            type="button"
                          >
                            Edit
                          </button>
                        )}
                        {can(user, 'course.delete') && (
                          <button
                            onClick={() => setConfirmDeleteId(row.id)}
                            className="text-xs text-red-600 hover:underline dark:text-red-400"
                            type="button"
                          >
                            Delete
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
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="font-semibold text-foreground">{row.name}</p>
                <p className="text-xs text-muted-foreground">{row.teacherName}</p>
              </div>
              <span className={[
                'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                STATUS_CLASSES[row.status as CourseStatus],
              ].join(' ')}>
                {row.status}
              </span>
            </div>
            <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
              <span>{row.studentsEnrolled} students</span>
              <span>{row.price}</span>
              <span>{row.startDate}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => router.push(`/admin/courses/${row.id}`)} className="text-xs text-primary" type="button">View</button>
              {can(user, 'course.delete') && (
                <button onClick={() => setConfirmDeleteId(row.id)} className="text-xs text-red-600" type="button">Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirm */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-foreground">Delete Course?</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              This action cannot be undone. All enrollments and lesson data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                type="button"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
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
