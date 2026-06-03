'use client';

import { useOwnerAnalytics, useOwnerBranches } from '@/modules/owner/hooks/useOwner';
import { MultiTenantAnalytics } from '@/modules/owner/components/MultiTenantAnalytics';

export function OwnerAnalyticsClient() {
  const { chartData, isLoading } = useOwnerAnalytics();
  const { branches } = useOwnerBranches();

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Global performance metrics across all branches
        </p>
      </div>

      {isLoading || !chartData ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <MultiTenantAnalytics
          data={chartData}
          branches={branches.map((b) => b.name)}
          isFullPage
        />
      )}
    </div>
  );
}
