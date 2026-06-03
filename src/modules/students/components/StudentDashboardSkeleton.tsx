// ─── StudentDashboardSkeleton ─────────────────────────────────────────────────
//
// Pixel-accurate shimmer skeleton for the student dashboard page.
// Matches the exact layout of StudentDashboardClient.tsx:
//
//  • Page heading block
//  • 4 KPI cards (1 col → 2 col → 4 col at breakpoints)
//  • 2-column section: "Upcoming Classes" (2/3) + "Recent Activity" (1/3)
//  • "Course Progress" section: 3 cards grid
//  • 2-column section: "Attendance Heatmap" + "Grade Trend Chart"
//
// Uses the same shimmer CSS keyframe and CSS variables as SkeletonLoader.tsx.
// NO spinners — all loading states use the shimmer pulse animation.
// NO aria-hidden on the outer wrapper so assistive tech gets aria-busy.

// ─── Shimmer primitive ────────────────────────────────────────────────────────

interface ShimmerProps {
  className?: string;
  style?:     React.CSSProperties;
}

function Shimmer({ className = '', style }: ShimmerProps) {
  return (
    <div
      className={`rounded-[var(--radius-md)] overflow-hidden ${className}`}
      style={{
        background:     `linear-gradient(
          90deg,
          var(--bg-surface-hover) 25%,
          var(--bg-surface)       50%,
          var(--bg-surface-hover) 75%
        )`,
        backgroundSize: '200% 100%',
        animation:      'shimmer 2s linear infinite',
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

// ─── KPI card skeleton (matches real KpiCardSimple layout) ────────────────────

function KpiCardSkeleton() {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-xl)',
        border:       '1px solid var(--border-default)',
        background:   'var(--bg-surface)',
        padding:      '20px',
      }}
      aria-hidden="true"
    >
      <Shimmer style={{ height: 11, width: '50%', marginBottom: 10 }} />
      <Shimmer style={{ height: 36, width: '60%', marginBottom: 8,
                        borderRadius: 'var(--radius-md)' }} />
      <Shimmer style={{ height: 11, width: '40%' }} />
    </div>
  );
}

// ─── List item skeletons (upcoming classes, activity feed) ────────────────────

function ListItemSkeleton() {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-lg)',
        background:   'var(--bg-surface-hover)',
        padding:      '12px',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
        gap:          12,
      }}
      aria-hidden="true"
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Shimmer style={{ height: 13, width: '60%' }} />
        <Shimmer style={{ height: 10, width: '35%' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <Shimmer style={{ height: 12, width: 48 }} />
        <Shimmer style={{ height: 10, width: 40 }} />
      </div>
    </div>
  );
}

function ActivityItemSkeleton() {
  return (
    <div
      style={{ display: 'flex', gap: 12, paddingBottom: 16 }}
      aria-hidden="true"
    >
      {/* Timeline dot column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Shimmer
          className="rounded-full"
          style={{ width: 8, height: 8, flexShrink: 0, marginTop: 4 }}
        />
        <div
          style={{ width: 1, flex: 1, marginTop: 4,
                   background: 'var(--border-default)' }}
        />
      </div>
      {/* Text column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Shimmer style={{ height: 13, width: '70%' }} />
        <Shimmer style={{ height: 11, width: '85%' }} />
        <Shimmer style={{ height: 10, width: '30%' }} />
      </div>
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

interface SectionCardSkeletonProps {
  children: React.ReactNode;
  style?:   React.CSSProperties;
  className?: string;
}

function SectionCard({ children, style, className = '' }: SectionCardSkeletonProps) {
  return (
    <div
      className={className}
      style={{
        borderRadius: 'var(--radius-xl)',
        border:       '1px solid var(--border-default)',
        background:   'var(--bg-surface)',
        padding:      '20px',
        ...style,
      }}
      aria-hidden="true"
    >
      {/* Section title shimmer */}
      <Shimmer style={{ height: 16, width: 140, marginBottom: 16 }} />
      {children}
    </div>
  );
}

// ─── Course progress card skeleton ────────────────────────────────────────────

function CourseProgressCardSkeleton() {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-xl)',
        border:       '1px solid var(--border-default)',
        background:   'var(--bg-surface)',
        padding:      '16px',
        display:      'flex',
        flexDirection: 'column',
        gap:          12,
      }}
      aria-hidden="true"
    >
      {/* Course title + badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Shimmer style={{ height: 14, width: '55%' }} />
        <Shimmer
          style={{ height: 20, width: 56, borderRadius: 'var(--radius-full)' }}
        />
      </div>
      {/* Teacher name */}
      <Shimmer style={{ height: 11, width: '35%' }} />
      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <Shimmer style={{ height: 10, width: 60 }} />
          <Shimmer style={{ height: 10, width: 36 }} />
        </div>
        <div
          style={{
            height:       8,
            borderRadius: 'var(--radius-full)',
            background:   'var(--bg-surface-hover)',
            overflow:     'hidden',
          }}
        >
          <Shimmer style={{ height: '100%', width: '65%', borderRadius: 'var(--radius-full)' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Heatmap grid skeleton ────────────────────────────────────────────────────

function HeatmapSkeleton() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }} aria-hidden="true">
      {Array.from({ length: 30 }).map((_, i) => (
        <Shimmer
          key={i}
          style={{
            width:        20,
            height:       20,
            borderRadius: 'var(--radius-sm)',
          }}
        />
      ))}
    </div>
  );
}

// ─── Area chart skeleton ──────────────────────────────────────────────────────

function AreaChartSkeleton() {
  // Fake bar columns at varying heights to look like a wave
  const heights = [45, 60, 52, 75, 68, 82, 58];
  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140 }}
      aria-hidden="true"
    >
      {heights.map((h, i) => (
        <Shimmer
          key={i}
          style={{
            flex:         1,
            height:       `${h}%`,
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
          }}
        />
      ))}
    </div>
  );
}

// ─── Main skeleton export ─────────────────────────────────────────────────────

export function StudentDashboardSkeleton() {
  return (
    <div
      className="space-y-8 pb-8"
      aria-label="Loading dashboard…"
      aria-busy="true"
    >
      {/* ── Page heading ── */}
      <div className="space-y-2" aria-hidden="true">
        <Shimmer style={{ height: 28, width: 260, borderRadius: 'var(--radius-lg)' }} />
        <Shimmer style={{ height: 14, width: 160 }} />
      </div>

      {/* ── KPI cards: 1 col → sm:2 col → lg:4 col ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      {/* ── Upcoming Classes (2/3) + Recent Activity (1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-hidden="true">
        {/* Upcoming classes panel */}
        <SectionCard className="lg:col-span-2">
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        </SectionCard>

        {/* Recent activity panel */}
        <SectionCard>
          <div>
            {[0, 1, 2, 3, 4].map((i) => (
              <ActivityItemSkeleton key={i} />
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Course progress: 3-col grid ── */}
      <div className="space-y-4" aria-hidden="true">
        <Shimmer style={{ height: 16, width: 148 }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <CourseProgressCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* ── Attendance heatmap + Grade trend: 2-col grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-hidden="true">
        {/* Attendance heatmap */}
        <SectionCard>
          <HeatmapSkeleton />
          {/* Legend row */}
          <div
            style={{
              display:   'flex',
              flexWrap:  'wrap',
              gap:       '12px 16px',
              marginTop: 12,
            }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shimmer
                  className="rounded-sm"
                  style={{ width: 12, height: 12, flexShrink: 0 }}
                />
                <Shimmer style={{ height: 10, width: 44 }} />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Grade trend chart */}
        <SectionCard>
          <AreaChartSkeleton />
        </SectionCard>
      </div>
    </div>
  );
}