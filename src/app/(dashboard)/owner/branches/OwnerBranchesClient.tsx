'use client';

import { useEffect, useState } from 'react';
import { useOwnerBranches } from '@/modules/owner/hooks/useOwner';
import { BranchManager } from '@/modules/owner/components/BranchManager';

export function OwnerBranchesClient() {
  const { branches, isLoading, createBranch, editBranch, deactivateBranch } = useOwnerBranches();
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/owner/users?role=admin&fields=id,name')
      .then((r) => r.json())
      .then((data: { id: string; name: string }[]) => setManagers(data));
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Branches</h1>
        <p className="text-sm text-muted-foreground">
          Manage physical locations and their performance
        </p>
      </div>

      {/* Summary stats */}
      {!isLoading && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Branches', value: branches.length },
            { label: 'Active', value: branches.filter((b) => b.status === 'active').length },
            { label: 'Total Students', value: branches.reduce((s, b) => s + b.studentCount, 0) },
            { label: 'Total Teachers', value: branches.reduce((s, b) => s + b.teacherCount, 0) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <BranchManager
          branches={branches}
          managers={managers}
          onCreateBranch={createBranch}
          onEditBranch={editBranch}
          onDeactivateBranch={deactivateBranch}
        />
      )}
    </div>
  );
}
