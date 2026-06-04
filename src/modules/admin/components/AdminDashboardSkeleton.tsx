'use client';

// src/modules/admin/components/AdminDashboardSkeleton.tsx

/**
 * Skeleton placeholder for AdminDashboardClient.
 * Visually matches the real dashboard layout:
 *   - 6-column KPI grid
 *   - 2×2 chart grid
 *   - Quick actions row
 *   - Recent activity table
 *
 * Uses the global `shimmer` CSS animation defined in globals.css.
 */

function ShimmerBox({ className = '' }: { className?: string }) {
  return (
    <div
      className={`shimmer rounded-lg bg-[var(--bg-surface-hover)] ${className}`}
      aria-hidden="true"
      role="presentation"
    />
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard…">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <ShimmerBox className="h-7 w-48 sm:w-64" />
          <ShimmerBox className="h-4 w-32 sm:w-40" />
        </div>
        <ShimmerBox className="h-10 w-28 rounded-lg" />
      </div>

      {/* ── KPI grid — 2 col mobile, 3 col tablet, 6 col desktop ─────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-3"
          >
            <ShimmerBox className="h-3 w-20" />
            <ShimmerBox className="h-8 w-24" />
            <ShimmerBox className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* ── Charts grid — 2×2 ────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
          >
            <ShimmerBox className="mb-4 h-4 w-32" />
            <ShimmerBox className="h-56 w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ShimmerBox key={i} className="h-12 rounded-xl" />
        ))}
      </div>

      {/* ── Recent activity ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="border-b border-[var(--border-default)] px-4 py-3">
          <ShimmerBox className="h-4 w-32" />
        </div>
        <div className="divide-y divide-[var(--border-default)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <ShimmerBox className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <ShimmerBox className="h-3 w-48 sm:w-72" />
                <ShimmerBox className="h-3 w-24 sm:w-40" />
              </div>
              <ShimmerBox className="hidden h-3 w-20 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
