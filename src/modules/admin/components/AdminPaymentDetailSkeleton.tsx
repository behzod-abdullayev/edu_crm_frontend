'use client';

// src/modules/admin/components/AdminPaymentDetailSkeleton.tsx

function ShimmerBox({ className = '' }: { className?: string }) {
  return (
    <div
      className={`shimmer rounded-lg bg-[var(--bg-surface-hover)] ${className}`}
      aria-hidden="true"
      role="presentation"
    />
  );
}

export function AdminPaymentDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading invoice…">
      {/* Back button + breadcrumb */}
      <div className="flex items-center gap-2">
        <ShimmerBox className="h-9 w-24 rounded-lg" />
        <ShimmerBox className="h-3 w-3 rounded" />
        <ShimmerBox className="h-4 w-36" />
      </div>

      {/* Invoice header card */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <ShimmerBox className="h-6 w-48" />
              <ShimmerBox className="h-5 w-16 rounded-full" />
            </div>
            <ShimmerBox className="h-4 w-36" />
          </div>
          <div className="flex gap-2">
            <ShimmerBox className="h-9 w-28 rounded-lg" />
            <ShimmerBox className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Student + Course info grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-3"
          >
            <ShimmerBox className="h-3 w-16" />
            <ShimmerBox className="h-5 w-36" />
            <ShimmerBox className="h-4 w-44" />
          </div>
        ))}
      </div>

      {/* Payment details */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-4">
        <ShimmerBox className="h-4 w-28" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <ShimmerBox className="h-3 w-16" />
              <ShimmerBox className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Payment history */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="border-b border-[var(--border-default)] px-4 py-3">
          <ShimmerBox className="h-4 w-32" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-[var(--border-default)] px-4 py-3 last:border-0"
          >
            <ShimmerBox className="h-4 w-24" />
            <ShimmerBox className="h-4 w-32 sm:w-48" />
            <ShimmerBox className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
