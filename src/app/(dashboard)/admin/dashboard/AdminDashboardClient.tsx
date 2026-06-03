'use client';

import { useRouter } from 'next/navigation';
import { useAdminDashboard } from '@/modules/admin/hooks/useAdmin';
import { OperationalDashboard } from '@/modules/admin/components/OperationalDashboard';

export function AdminDashboardClient() {
  const { data, isLoading, error } = useAdminDashboard();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-96 items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Failed to load dashboard</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            type="button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your academy</p>
      </div>
      <OperationalDashboard data={data} onNavigate={(path) => router.push(path)} />
    </div>
  );
}
