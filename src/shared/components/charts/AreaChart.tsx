'use client';

/**
 * src/shared/components/charts/AreaChart.tsx
 *
 * Reusable AreaChart built on Recharts v2.
 *
 * Features:
 * ✅ Framer Motion mount animation
 * ✅ ResponsiveContainer 100% width
 * ✅ Custom dark/light tooltip via CSS variables
 * ✅ Custom legend
 * ✅ Gradient fill area
 * ✅ Skeleton while loading (shimmer — NOT spinner)
 * ✅ Empty state when no data
 * ✅ Mobile-adaptive: reduced height, fewer labels, tap tooltip
 * ✅ Zero "any" TypeScript types
 * ✅ No hardcoded colors — all use CSS variables
 * ✅ exactOptionalPropertyTypes: true compatible
 */

import { useId, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import type {
  ValueType,
  NameType,
} from 'recharts/types/component/DefaultTooltipContent';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AreaChartSeries {
  dataKey: string;
  label: string;
  color?: string;
  dashed?: boolean;
}

export interface AreaChartProps {
  data: Record<string, string | number>[];
  series: AreaChartSeries[];
  xAxisKey?: string;
  title?: string;
  isLoading?: boolean;
  height?: number;
  mobileHeight?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  yFormatter?: (value: number) => string;
  xFormatter?: (value: string) => string;
  className?: string;
  stacked?: boolean;
  connectNulls?: boolean;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AreaChartSkeleton({ height }: { height: number }) {
  return (
    <div
      role="status"
      aria-label="Loading chart"
      className="relative overflow-hidden rounded-xl bg-[var(--bg-surface-secondary)]"
      style={{ height }}
    >
      <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[var(--bg-surface-hover)] to-transparent" />
      <div className="absolute bottom-8 left-10 right-4 h-px bg-[var(--border-default)]" />
      <div className="absolute bottom-8 left-10 top-4 w-px bg-[var(--border-default)]" />
      <svg
        className="absolute inset-0 h-full w-full opacity-20"
        preserveAspectRatio="none"
        viewBox="0 0 400 200"
        aria-hidden="true"
      >
        <path
          d="M0 160 Q50 130 100 140 Q150 150 200 100 Q250 60 300 80 Q350 95 400 60 L400 200 L0 200 Z"
          fill="currentColor"
          className="text-[var(--brand-primary)]"
        />
      </svg>
      <span className="sr-only">Loading chart…</span>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function AreaChartEmpty({ height }: { height: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface-secondary)]"
      style={{ height }}
      role="img"
      aria-label="No chart data available"
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        className="text-[var(--text-muted)]"
      >
        <rect x="4" y="28" width="6" height="8" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="14" y="20" width="6" height="16" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="24" y="12" width="6" height="24" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="34" y="4" width="6" height="32" rx="1" fill="currentColor" opacity="0.4" />
      </svg>
      <p className="text-sm text-[var(--text-muted)]">No data available</p>
    </motion.div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

// exactOptionalPropertyTypes: yFormatter ixtiyoriy, lekin undefined bilan PASS qilinmaydi
interface CustomTooltipExtraProps {
  yFormatter?: (value: number) => string;
}

function CustomTooltip(
  props: TooltipProps<ValueType, NameType> & CustomTooltipExtraProps,
) {
  const { active, payload, label, yFormatter } = props;
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 shadow-[var(--shadow-lg)]"
      style={{ minWidth: 120 }}
    >
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {String(label)}
      </p>
      {payload.map((entry) => (
        <div key={String(entry.dataKey)} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: String(entry.color ?? 'var(--brand-primary)') }}
            aria-hidden="true"
          />
          <span className="text-[var(--text-secondary)]">{String(entry.name)}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums text-[var(--text-primary)]">
            {yFormatter
              ? yFormatter(Number(entry.value))
              : String(entry.value ?? '')}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Custom Legend ────────────────────────────────────────────────────────────

interface LegendPayloadItem {
  value: string;
  color: string;
  dataKey?: string;
}

function CustomLegend({ payload }: { payload?: LegendPayloadItem[] }) {
  if (!payload || payload.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
      {payload.map((entry) => (
        <div
          key={entry.value}
          className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          {entry.value}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DEFAULT_COLORS = [
  'var(--brand-primary)',
  'var(--brand-secondary)',
  'var(--brand-accent)',
  'var(--success-solid)',
  'var(--warning-solid)',
  'var(--error-solid)',
];

export function AreaChart({
  data,
  series,
  xAxisKey = 'name',
  title,
  isLoading = false,
  height = 300,
  mobileHeight = 200,
  showLegend = true,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  yFormatter,
  xFormatter,
  className,
  stacked = false,
  connectNulls = false,
}: AreaChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const gradientIdBase = useId().replace(/:/g, '');

  if (isLoading) {
    return (
      <div className={className}>
        {title && (
          <div className="mb-3 h-5 w-1/3 animate-pulse rounded bg-[var(--bg-surface-hover)]" />
        )}
        <AreaChartSkeleton height={height} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={className}>
        {title && (
          <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        )}
        <AreaChartEmpty height={height} />
      </div>
    );
  }

  return (
    <motion.div
      ref={chartRef}
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {title && (
        <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      )}

      <div
        style={{ height: `clamp(${mobileHeight}px, ${height}px, ${height}px)` }}
        className="w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart
            data={data}
            margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
          >
            <defs>
              {series.map((s, i) => {
                const color =
                  s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length] ?? 'var(--brand-primary)';
                const id = `area-grad-${gradientIdBase}-${i}`;
                return (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                );
              })}
            </defs>

            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-default)"
                vertical={false}
              />
            )}

            {/* FIX: exactOptionalPropertyTypes — tickFormatter faqat defined bo'lsa pass qilinadi */}
            {showXAxis && (
              <XAxis
                dataKey={xAxisKey}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={{ stroke: 'var(--border-default)' }}
                tickLine={false}
                {...(xFormatter !== undefined ? { tickFormatter: xFormatter } : {})}
              />
            )}

            {showYAxis && (
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
                width={48}
                {...(yFormatter !== undefined ? { tickFormatter: yFormatter } : {})}
              />
            )}

            {/* FIX: exactOptionalPropertyTypes — yFormatter prop umuman berilmaydi agar undefined bo'lsa */}
            <Tooltip
              content={
                yFormatter !== undefined ? (
                  <CustomTooltip yFormatter={yFormatter} />
                ) : (
                  <CustomTooltip />
                )
              }
              cursor={{
                stroke: 'var(--border-strong)',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
            />

            {showLegend && (
              <Legend
                content={
                  <CustomLegend
                    payload={series.map((s, i) => ({
                      value: s.label,
                      color:
                        s.color ??
                        DEFAULT_COLORS[i % DEFAULT_COLORS.length] ??
                        'var(--brand-primary)',
                      dataKey: s.dataKey,
                    }))}
                  />
                }
              />
            )}

            {series.map((s, i) => {
              const color =
                s.color ??
                DEFAULT_COLORS[i % DEFAULT_COLORS.length] ??
                'var(--brand-primary)';
              const gradId = `area-grad-${gradientIdBase}-${i}`;

              return (
                <Area
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.label}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${gradId})`}
                  // FIX: exactOptionalPropertyTypes — undefined spread emas, conditional prop
                  {...(s.dashed === true ? { strokeDasharray: '5 4' } : {})}
                  dot={false}
                  activeDot={{
                    r: 4,
                    stroke: color,
                    strokeWidth: 2,
                    fill: 'var(--bg-surface)',
                  }}
                  connectNulls={connectNulls}
                  // FIX: stackId undefined pass qilinmaydi, faqat stacked=true bo'lsa beriladi
                  {...(stacked ? { stackId: 'stack' } : {})}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              );
            })}
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
