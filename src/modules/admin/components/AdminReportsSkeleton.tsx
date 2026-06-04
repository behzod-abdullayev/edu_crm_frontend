'use client';

// src/modules/admin/components/AdminReportsSkeleton.tsx

function ShimmerBox({ className = '' }: { className?: string }) {
  return (
    <div
      className={`shimmer rounded-lg bg-[var(--bg-surface-hover)] ${className}`}
      aria-hidden="true"
      role="presentation"
    />
  );
}

export function AdminReportsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading reports…">
      {/* Page header */}
      <div className="space-y-2">
        <ShimmerBox className="h-7 w-32 sm:w-40" />
        <ShimmerBox className="h-4 w-64 sm:w-96" />
      </div>

      {/* Report generator card */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-6">

        {/* Report type section */}
        <div className="space-y-3">
          <ShimmerBox className="h-4 w-28" />
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-4 space-y-2"
              >
                <ShimmerBox className="h-4 w-32" />
                <ShimmerBox className="h-3 w-full" />
                <ShimmerBox className="h-3 w-4/5" />
              </div>
            ))}
          </div>
        </div>

        {/* Filters row */}
        <div className="grid gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <ShimmerBox className="h-3 w-16" />
              <ShimmerBox className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>

        {/* Format + Generate button */}
        <div className="flex items-center gap-3">
          <ShimmerBox className="h-10 w-36 rounded-lg" />
          <ShimmerBox className="h-10 w-32 rounded-lg" />
        </div>

        {/* Recent reports table */}
        <div className="space-y-3">
          <ShimmerBox className="h-4 w-32" />
          <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
            {/* Table header */}
            <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface-secondary)] px-4 py-3 flex gap-4">
              {['Name', 'Type', 'Generated', 'By', 'Download'].map((col) => (
                <ShimmerBox key={col} className="h-3 w-16 flex-1" />
              ))}
            </div>
            {/* Table rows */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-[var(--border-default)] px-4 py-3 last:border-0"
              >
                <ShimmerBox className="h-4 w-32 flex-1" />
                <ShimmerBox className="h-4 w-20 flex-1" />
                <ShimmerBox className="h-4 w-24 flex-1" />
                <ShimmerBox className="h-4 w-20 flex-1" />
                <ShimmerBox className="h-4 w-16 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
