'use client';

import { useRouter } from 'next/navigation';
import { useOwnerKPI, useOwnerAnalytics, useOwnerBranches } from '@/modules/owner/hooks/useOwner';
import { GlobalKPIDashboard } from '@/modules/owner/components/GlobalKPIDashboard';
import { MultiTenantAnalytics } from '@/modules/owner/components/MultiTenantAnalytics';
import { mapBranchDtoToRow } from '@/modules/owner/utils/owner.mapper';

const QUICK_LINKS = [
  { label: 'Users', path: '/owner/users', icon: '👥' },
  { label: 'Branches', path: '/owner/branches', icon: '🏢' },
  { label: 'Finances', path: '/owner/finances', icon: '💰' },
  { label: 'Analytics', path: '/owner/analytics', icon: '📊' },
  { label: 'HR', path: '/owner/hr', icon: '👷' },
  { label: 'System', path: '/owner/system', icon: '⚙️' },
];

export function OwnerDashboardClient() {
  const router = useRouter();
  const { data: kpi, isLoading: kpiLoading } = useOwnerKPI();
  const { chartData, isLoading: chartLoading } = useOwnerAnalytics();
  const { branches } = useOwnerBranches();

  const topBranches = branches
    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
    .slice(0, 5)
    .map(mapBranchDtoToRow);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Owner Dashboard</h1>
        <p className="text-sm text-muted-foreground">Global overview across all branches</p>
      </div>

      {/* KPI */}
      {kpiLoading || !kpi ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <GlobalKPIDashboard data={kpi} />
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {QUICK_LINKS.map((link) => (
          <button
            key={link.path}
            onClick={() => router.push(link.path)}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-center transition-all hover:border-primary/50 hover:shadow-sm"
            type="button"
          >
            <span className="text-2xl" aria-hidden="true">{link.icon}</span>
            <span className="text-xs font-medium text-foreground">{link.label}</span>
          </button>
        ))}
      </div>

      {/* Analytics preview */}
      {!chartLoading && chartData && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-foreground">Analytics Overview</h2>
          <MultiTenantAnalytics
            data={chartData}
            branches={branches.map((b) => b.name)}
            isFullPage={false}
          />
        </div>
      )}

      {/* Top branches */}
      {topBranches.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-foreground">Top Performing Branches</h2>
          <div className="rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {['Branch', 'Students', 'Revenue', 'Manager'].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topBranches.map((row, i) => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <span className="font-medium text-foreground">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.studentCount}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.monthlyRevenue}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.managerName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
