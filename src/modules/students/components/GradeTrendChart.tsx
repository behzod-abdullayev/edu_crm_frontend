'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { httpClient } from '@/services/api/axios.instance';
import { useIsMobile } from '@shared/hooks/useIsMobile';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  studentId: string;
}

interface GradeTrendPoint {
  month:   string;
  average: number;
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  const value = payload[0]?.value;

  return (
    <div
      role="tooltip"
      style={{
        background:    'var(--bg-surface)',
        border:        '1px solid var(--border-default)',
        borderRadius:  'var(--radius-md)',
        padding:       '8px 12px',
        boxShadow:     'var(--shadow-md)',
      }}
    >
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</p>
      {value !== undefined && (
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-primary)' }}>
          {value.toFixed(1)}%
        </p>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      aria-hidden="true"
      aria-label="Loading grade trend chart"
      style={{
        height,
        borderRadius:      'var(--radius-md)',
        background:        `linear-gradient(
          90deg,
          var(--bg-surface-hover) 25%,
          var(--bg-surface)       50%,
          var(--bg-surface-hover) 75%
        )`,
        backgroundSize:    '200% 100%',
        animation:         'shimmer 2s linear infinite',
      }}
    />
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ height }: { height: number }) {
  return (
    <div
      style={{ height }}
      className="flex flex-col items-center justify-center gap-2"
    >
      <p className="text-sm text-[var(--text-muted)] text-center">
        No grade data available yet.
      </p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GradeTrendChart({ studentId }: Props) {
  const isMobile = useIsMobile();
  const chartHeight = isMobile ? 160 : 200;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['students', studentId, 'grade-trend'],
    queryFn:  async () => {
      const res = await httpClient.get<GradeTrendPoint[]>(
        `/students/${studentId}/grade-trend`,
      );
      return res.data;
    },
    enabled:             !!studentId,
    staleTime:           5 * 60 * 1000,
    gcTime:              10 * 60 * 1000,
    retry:               2,
    refetchOnWindowFocus: false,
  });

  // On mobile show only last 7 months, on desktop show all (up to 12)
  const chartData = useMemo<GradeTrendPoint[]>(() => {
    if (!data || data.length === 0) return [];
    return isMobile ? data.slice(-7) : data;
  }, [data, isMobile]);

  if (isLoading) {
    return <ChartSkeleton height={chartHeight} />;
  }

  if (isError || !data || data.length === 0) {
    return <EmptyState height={chartHeight} />;
  }

  // Compute domain so chart is never squished to 0–0
  const maxValue  = Math.max(...chartData.map((d) => d.average), 0);
  const yDomainMax = Math.min(100, Math.max(100, Math.ceil(maxValue / 10) * 10));

  return (
    <div aria-label="Grade trend area chart" role="img">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
        >
          <defs>
            <linearGradient id="grade-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--brand-primary)" stopOpacity={0.22} />
              <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}    />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border-default)"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            tick={{
              fontSize: isMobile ? 10 : 11,
              fill:     'var(--text-muted)',
            }}
            axisLine={false}
            tickLine={false}
            // On mobile, show fewer ticks to avoid clutter
            interval={isMobile ? 'preserveStartEnd' : 0}
          />

          <YAxis
            domain={[0, yDomainMax]}
            tick={{
              fontSize: isMobile ? 10 : 11,
              fill:     'var(--text-muted)',
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
            width={36}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke:      'var(--brand-primary)',
              strokeWidth: 1,
              strokeDasharray: '4 4',
            }}
          />

          <Area
            type="monotone"
            dataKey="average"
            stroke="var(--brand-primary)"
            strokeWidth={2}
            fill="url(#grade-gradient)"
            dot={{
              r:           isMobile ? 2 : 3,
              fill:        'var(--brand-primary)',
              strokeWidth: 0,
            }}
            activeDot={{
              r:           5,
              fill:        'var(--brand-primary)',
              stroke:      'var(--bg-surface)',
              strokeWidth: 2,
            }}
            isAnimationActive={true}
            animationDuration={600}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}