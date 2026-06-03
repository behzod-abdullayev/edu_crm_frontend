'use client';

import { useOwnerHR, useOwnerBranches } from '@/modules/owner/hooks/useOwner';
import { HRPanel } from '@/modules/owner/components/HRPanel';

export function OwnerHRClient() {
  const { staff, isLoading, updateSalary } = useOwnerHR();
  const { branches } = useOwnerBranches();

  const staffSummary = {
    total: staff.length,
    teachers: staff.filter((s) => s.role === 'teacher').length,
    admins: staff.filter((s) => s.role === 'admin').length,
    activeContracts: staff.filter((s) => s.contractStatus === 'active').length,
    expiredContracts: staff.filter((s) => s.contractStatus === 'expired').length,
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Human Resources</h1>
        <p className="text-sm text-muted-foreground">
          Staff management across all branches
        </p>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total Staff', value: staffSummary.total },
          { label: 'Teachers', value: staffSummary.teachers },
          { label: 'Admins', value: staffSummary.admins },
          { label: 'Active Contracts', value: staffSummary.activeContracts },
          {
            label: 'Expired Contracts',
            value: staffSummary.expiredContracts,
            warn: staffSummary.expiredContracts > 0,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={[
              'rounded-xl border p-3',
              stat.warn
                ? 'border-red-300/50 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20'
                : 'border-border bg-card',
            ].join(' ')}
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={[
              'mt-1 text-2xl font-bold tabular-nums',
              stat.warn ? 'text-red-600 dark:text-red-400' : 'text-foreground',
            ].join(' ')}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <HRPanel
          staff={staff}
          branches={branches.map((b) => ({ id: b.id, name: b.name }))}
          onUpdateSalary={updateSalary}
        />
      )}
    </div>
  );
}
