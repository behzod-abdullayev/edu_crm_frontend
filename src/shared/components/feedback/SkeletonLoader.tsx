'use client';

import type { CSSProperties, ReactElement } from 'react';
import { cn } from '@shared/utils/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

type SkeletonVariant = 'text' | 'card' | 'table' | 'kpi' | 'chart' | 'avatar';

export interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  count?: number;
  className?: string | undefined;
}

// ─── Base shimmer element ─────────────────────────────────────────────────────
//
// Uses the project shimmer keyframe defined in globals.css + tailwind.config.ts:
//   shimmer: 0% { backgroundPosition: '-200% 0' } → 100% { '200% 0' }
// Falls back to --bg-surface-hover / --bg-surface via the .shimmer CSS class.
//
// We do NOT use `--color-skeleton` because that variable is not defined in
// globals.css.  Instead we inline the same gradient that `.shimmer` uses so
// that the component works without any additional CSS.

interface ShimmerProps {
  className?: string;
  style?: CSSProperties;
}

function Shimmer({ className, style }: ShimmerProps) {
  return (
    <div
      className={cn('rounded-[4px] overflow-hidden', className)}
      style={{
        background: `linear-gradient(
          90deg,
          var(--bg-surface-hover) 25%,
          var(--bg-surface)       50%,
          var(--bg-surface-hover) 75%
        )`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s linear infinite',
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

// ─── Variant implementations ─────────────────────────────────────────────────

function TextSkeleton() {
  return (
    <div className="space-y-2" aria-hidden="true">
      <Shimmer className="h-4 w-full" />
      <Shimmer className="h-4 w-5/6" />
      <Shimmer className="h-4 w-4/6" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
      aria-hidden="true"
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Shimmer style={{ height: 20, width: '33%' }} />
        <Shimmer className="rounded-full" style={{ height: 20, width: 64 }} />
      </div>
      {/* Body lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Shimmer style={{ height: 16, width: '100%' }} />
        <Shimmer style={{ height: 16, width: '83%' }} />
      </div>
      {/* Footer row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          paddingTop: 8,
          borderTop: '1px solid var(--border-default)',
        }}
      >
        <Shimmer className="rounded-full" style={{ width: 32, height: 32, flexShrink: 0 }} />
        <Shimmer style={{ height: 16, width: '25%' }} />
        <Shimmer className="rounded-full" style={{ height: 16, width: 64, marginLeft: 'auto' }} />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: '12px 16px',
          background: 'var(--bg-surface-secondary)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Shimmer key={i} style={{ height: 16, flex: 1 }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: 5 }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: 'flex',
            gap: 16,
            padding: '16px',
            borderBottom: rowIdx < 4 ? '1px solid var(--border-default)' : undefined,
          }}
        >
          {[40, 60, 50, 70, 45].map((w, colIdx) => (
            <Shimmer
              key={colIdx}
              style={{ height: 16, width: `${w}%`, flex: 'none' }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function KPISkeleton() {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
      aria-hidden="true"
    >
      {/* Icon + badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Shimmer style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)' }} />
        <Shimmer className="rounded-full" style={{ height: 24, width: 64 }} />
      </div>
      {/* Label + value + trend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Shimmer style={{ height: 12, width: 80 }} />
        <Shimmer style={{ height: 36, width: 128 }} />
        <Shimmer style={{ height: 12, width: 96 }} />
      </div>
      {/* Sparkline */}
      <Shimmer style={{ height: 40, width: '100%', borderRadius: 'var(--radius-md)' }} />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        padding: 20,
      }}
      aria-hidden="true"
    >
      {/* Chart header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <Shimmer style={{ height: 20, width: 128 }} />
        <Shimmer style={{ height: 32, width: 96, borderRadius: 'var(--radius-md)' }} />
      </div>
      {/* Chart area */}
      <div style={{ display: 'flex', gap: 12, height: 192 }}>
        {/* Y-axis labels */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingBlock: 4,
            width: 32,
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Shimmer key={i} style={{ height: 12, width: '100%' }} />
          ))}
        </div>
        {/* Bar columns */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
          }}
        >
          {[65, 85, 55, 90, 70, 45, 80].map((pct, i) => (
            <Shimmer
              key={i}
              style={{
                flex: 1,
                height: `${pct}%`,
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AvatarSkeleton() {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
      aria-hidden="true"
    >
      <Shimmer className="rounded-full shrink-0" style={{ width: 40, height: 40 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Shimmer style={{ height: 16, width: '50%' }} />
        <Shimmer style={{ height: 12, width: '33%' }} />
      </div>
    </div>
  );
}

// ─── Variant map ──────────────────────────────────────────────────────────────

const variantMap: Record<SkeletonVariant, () => ReactElement> = {
  text: TextSkeleton,
  card: CardSkeleton,
  table: TableSkeleton,
  kpi: KPISkeleton,
  chart: ChartSkeleton,
  avatar: AvatarSkeleton,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SkeletonLoader({
  variant = 'card',
  count = 1,
  className,
}: SkeletonLoaderProps) {
  const VariantComponent = variantMap[variant];

  if (count === 1) {
    return (
      <div className={className} aria-label="Loading…" aria-busy="true">
        <VariantComponent />
      </div>
    );
  }

  return (
    <div
      className={cn('space-y-3', className)}
      aria-label="Loading…"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <VariantComponent key={i} />
      ))}
    </div>
  );
}
