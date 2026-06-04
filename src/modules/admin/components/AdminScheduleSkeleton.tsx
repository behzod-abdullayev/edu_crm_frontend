'use client';

// src/modules/admin/components/AdminScheduleSkeleton.tsx

function ShimmerBox({ className = '' }: { className?: string }) {
  return (
    <div
      className={`shimmer rounded-lg bg-[var(--bg-surface-hover)] ${className}`}
      aria-hidden="true"
      role="presentation"
    />
  );
}

export function AdminScheduleSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading schedule…">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <ShimmerBox className="h-7 w-32 sm:w-40" />
          <ShimmerBox className="h-4 w-64 sm:w-80" />
        </div>
        <ShimmerBox className="h-10 w-32 rounded-lg" />
      </div>

      {/* Calendar card */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5 space-y-4">

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShimmerBox className="h-9 w-9 rounded-lg" />
            <ShimmerBox className="h-5 w-44" />
            <ShimmerBox className="h-9 w-9 rounded-lg" />
            <ShimmerBox className="h-9 w-16 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <ShimmerBox className="hidden h-9 w-28 rounded-lg sm:block" />
            <ShimmerBox className="h-9 w-32 rounded-lg" />
          </div>
        </div>

        {/* Weekday header row (desktop) */}
        <div className="hidden md:grid md:grid-cols-7 gap-px rounded-xl overflow-hidden border border-[var(--border-default)]">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="bg-[var(--bg-surface-secondary)] px-2 py-2 flex justify-center"
            >
              <ShimmerBox className="h-3 w-8" />
            </div>
          ))}

          {/* Day cells */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={`cell-${i}`}
              className="min-h-28 bg-[var(--bg-surface)] p-2 space-y-2"
            >
              <ShimmerBox className="h-5 w-5 rounded-full" />
              {i % 3 === 0 && <ShimmerBox className="h-6 w-full rounded-md" />}
              {i % 4 === 1 && <ShimmerBox className="h-6 w-full rounded-md" />}
            </div>
          ))}
        </div>

        {/* Mobile list view skeleton */}
        <div className="md:hidden space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden"
            >
              <div className="border-b border-[var(--border-default)] px-4 py-2">
                <ShimmerBox className="h-4 w-40" />
              </div>
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="border-b border-[var(--border-default)] px-4 py-3 last:border-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <ShimmerBox className="h-4 w-32" />
                  </div>
                  <ShimmerBox className="h-3 w-48" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
