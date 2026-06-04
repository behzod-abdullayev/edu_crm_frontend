'use client';

// src/modules/admin/components/AdminPaymentsSkeleton.tsx

function ShimmerBox({ className = '' }: { className?: string }) {
  return (
    <div
      className={`shimmer rounded-lg bg-[var(--bg-surface-hover)] ${className}`}
      aria-hidden="true"
      role="presentation"
    />
  );
}

export function AdminPaymentsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading payments…">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <ShimmerBox className="h-7 w-32 sm:w-44" />
          <ShimmerBox className="h-4 w-52 sm:w-72" />
        </div>
        <div className="flex gap-2">
          <ShimmerBox className="h-10 w-24 rounded-lg" />
          <ShimmerBox className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* KPI overview — 4 cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-3"
          >
            <ShimmerBox className="h-3 w-20" />
            <ShimmerBox className="h-7 w-24" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)] pb-0">
        <ShimmerBox className="h-10 w-24 rounded-t-lg" />
        <ShimmerBox className="h-10 w-20 rounded-t-lg" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
        {/* Table header */}
        <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface-secondary)] px-4 py-3">
          <div className="flex items-center gap-3">
            <ShimmerBox className="h-8 w-56 rounded-lg" />
            <ShimmerBox className="h-8 w-28 rounded-lg" />
            <ShimmerBox className="ml-auto h-8 w-20 rounded-lg" />
          </div>
        </div>
        {/* Rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-[var(--border-default)] px-4 py-3 last:border-0"
          >
            <ShimmerBox className="h-4 w-32 sm:w-40" />
            <ShimmerBox className="hidden h-4 w-28 sm:block" />
            <ShimmerBox className="hidden h-4 w-20 lg:block" />
            <ShimmerBox className="ml-auto h-5 w-16 rounded-full" />
            <ShimmerBox className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
