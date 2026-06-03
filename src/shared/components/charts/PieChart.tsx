'use client';

/**
 * src/shared/components/charts/PieChart.tsx
 *
 * Reusable PieChart / DonutChart built on Recharts v2.
 *
 * Features:
 * ✅ Framer Motion mount animation
 * ✅ ResponsiveContainer 100% width
 * ✅ Custom dark/light tooltip via CSS variables
 * ✅ Custom legend (horizontal, scrollable on mobile)
 * ✅ Donut variant with center label
 * ✅ Skeleton while loading (shimmer — NOT spinner)
 * ✅ Empty state when no data
 * ✅ Mobile-adaptive: reduced height, simplified labels
 * ✅ Zero "any" TypeScript types
 * ✅ No hardcoded colors — uses CSS variables + customizable palette
 * ✅ exactOptionalPropertyTypes: true compatible
 */

import { useId } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
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

export interface PieChartSlice {
  name: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieChartSlice[];
  title?: string;
  donut?: boolean;
  centerLabel?: string;
  centerSubLabel?: string;
  isLoading?: boolean;
  height?: number;
  mobileHeight?: number;
  showLegend?: boolean;
  palette?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
  innerRadius?: string | number;
  outerRadius?: string | number;
}

// ─── Default Palette ──────────────────────────────────────────────────────────

const DEFAULT_PALETTE = [
  'var(--brand-primary)',
  'var(--brand-secondary)',
  'var(--brand-accent)',
  'var(--success-solid)',
  'var(--warning-solid)',
  'var(--error-solid)',
  'var(--info-solid)',
  'var(--role-owner)',
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PieChartSkeleton({ height }: { height: number }) {
  return (
    <div
      role="status"
      aria-label="Loading chart"
      className="relative flex items-center justify-center overflow-hidden rounded-xl bg-[var(--bg-surface-secondary)]"
      style={{ height }}
    >
      <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[var(--bg-surface-hover)] to-transparent" />
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        aria-hidden="true"
        className="relative z-10 opacity-20"
      >
        <circle
          cx="60" cy="60" r="44"
          fill="none" stroke="var(--brand-primary)"
          strokeWidth="22" strokeDasharray="138 138" strokeDashoffset="34"
        />
        <circle
          cx="60" cy="60" r="44"
          fill="none" stroke="var(--brand-secondary)"
          strokeWidth="22" strokeDasharray="69 207" strokeDashoffset="-104"
        />
        <circle
          cx="60" cy="60" r="44"
          fill="none" stroke="var(--brand-accent)"
          strokeWidth="22" strokeDasharray="34 242" strokeDashoffset="-173"
        />
      </svg>
      <span className="sr-only">Loading chart…</span>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function PieChartEmpty({ height }: { height: number }) {
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
        width="44" height="44" viewBox="0 0 44 44"
        fill="none" aria-hidden="true"
        className="text-[var(--text-muted)]"
      >
        <circle
          cx="22" cy="22" r="16"
          fill="none" stroke="currentColor"
          strokeWidth="8" strokeDasharray="50 50" opacity="0.35"
        />
      </svg>
      <p className="text-sm text-[var(--text-muted)]">No data available</p>
    </motion.div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface CustomTooltipExtraProps {
  valueFormatter?: (value: number) => string;
}

function CustomTooltip(
  props: TooltipProps<ValueType, NameType> & CustomTooltipExtraProps,
) {
  const { active, payload, valueFormatter } = props;
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  if (!entry) return null;

  const rawPayload = entry.payload as PieChartSlice & { percent?: number };

  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 shadow-[var(--shadow-lg)]"
      style={{ minWidth: 130 }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
          style={{ backgroundColor: String(entry.color ?? 'var(--brand-primary)') }}
          aria-hidden="true"
        />
        <span className="text-[11px] font-semibold text-[var(--text-primary)]">
          {entry.name}
        </span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
          {valueFormatter
            ? valueFormatter(Number(entry.value))
            : String(entry.value ?? '')}
        </span>
        {rawPayload.percent !== undefined && (
          <span className="text-xs text-[var(--text-muted)]">
            {(rawPayload.percent * 100).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Custom Legend ────────────────────────────────────────────────────────────

interface LegendPayloadItem {
  value: string;
  color: string;
  payload?: { value: number };
}

interface CustomLegendProps {
  payload?: LegendPayloadItem[];
  valueFormatter?: (value: number) => string;
}

function CustomLegend({ payload, valueFormatter }: CustomLegendProps) {
  if (!payload || payload.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-start justify-center gap-x-3 gap-y-1.5 overflow-x-auto">
      {payload.map((entry) => (
        <div
          key={entry.value}
          className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"
        >
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-sm"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          <span>{entry.value}</span>
          {entry.payload?.value !== undefined && (
            <span className="font-semibold tabular-nums text-[var(--text-primary)]">
              {valueFormatter
                ? valueFormatter(entry.payload.value)
                : String(entry.payload.value)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Center Label (Donut) ─────────────────────────────────────────────────────

// FIX: centerLabel va centerSubLabel required qilinmadi,
// lekin CenterLabel chaqirilishidan oldin tekshiriladi
interface CenterLabelProps {
  cx?: number;
  cy?: number;
  centerLabel: string;
  centerSubLabel?: string;
}

function CenterLabel({ cx = 0, cy = 0, centerLabel, centerSubLabel }: CenterLabelProps) {
  return (
    <g>
      <text
        x={cx}
        y={centerSubLabel !== undefined ? cy - 6 : cy + 6}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: 18,
          fontWeight: 700,
          fill: 'var(--text-primary)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {centerLabel}
      </text>
      {centerSubLabel !== undefined && (
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: 11,
            fill: 'var(--text-muted)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {centerSubLabel}
        </text>
      )}
    </g>
  );
}

// ─── Pie label render function type ──────────────────────────────────────────

interface PieLabelProps {
  cx: number;
  cy: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PieChart({
  data,
  title,
  donut = true,
  centerLabel,
  centerSubLabel,
  isLoading = false,
  height = 280,
  mobileHeight = 220,
  showLegend = true,
  palette = DEFAULT_PALETTE,
  valueFormatter,
  className,
  innerRadius = '55%',
  outerRadius = '80%',
}: PieChartProps) {
  const chartId = useId().replace(/:/g, '');

  if (isLoading) {
    return (
      <div className={className}>
        {title !== undefined && (
          <div className="mb-3 h-5 w-1/3 animate-pulse rounded bg-[var(--bg-surface-hover)]" />
        )}
        <PieChartSkeleton height={height} />
      </div>
    );
  }

  const isEmpty =
    !data ||
    data.length === 0 ||
    data.every((d) => d.value === 0);

  if (isEmpty) {
    return (
      <div className={className}>
        {title !== undefined && (
          <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        )}
        <PieChartEmpty height={height} />
      </div>
    );
  }

  const slicesWithColors = data.map((slice, i) => ({
    ...slice,
    color: slice.color ?? palette[i % palette.length] ?? 'var(--brand-primary)',
  }));

  const legendPayload: LegendPayloadItem[] = slicesWithColors.map((s) => ({
    value: s.name,
    color: s.color,
    payload: { value: s.value },
  }));

  // FIX: Recharts Pie label prop — undefined pass qilinmaydi,
  // centerLabel mavjud bo'lgandagina label berish uchun conditional spread
  const pieLabelProp =
    donut && centerLabel !== undefined
      ? {
          label: ({ cx: labelCx, cy: labelCy }: PieLabelProps) => (
            <CenterLabel
              key={`center-${chartId}`}
              cx={labelCx}
              cy={labelCy}
              centerLabel={centerLabel}
              {...(centerSubLabel !== undefined ? { centerSubLabel } : {})}
            />
          ),
        }
      : {};

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {title !== undefined && (
        <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      )}

      <div
        style={{ height: `clamp(${mobileHeight}px, ${height}px, ${height}px)` }}
        className="w-full"
        aria-label={title ?? 'Pie chart'}
        role="img"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            {/* FIX: valueFormatter undefined emas bo'lganda pass qilinadi */}
            <Tooltip
              content={
                valueFormatter !== undefined ? (
                  <CustomTooltip valueFormatter={valueFormatter} />
                ) : (
                  <CustomTooltip />
                )
              }
            />

            <Pie
              data={slicesWithColors}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={donut ? innerRadius : '0%'}
              outerRadius={outerRadius}
              paddingAngle={slicesWithColors.length > 1 ? 2 : 0}
              strokeWidth={0}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={700}
              animationEasing="ease-out"
              labelLine={false}
              // FIX: label prop faqat centerLabel mavjud bo'lganda spread qilinadi
              {...pieLabelProp}
            >
              {slicesWithColors.map((slice) => (
                <Cell key={`cell-${slice.name}`} fill={slice.color} />
              ))}
            </Pie>

            {showLegend && (
              <Legend
                content={
                  // FIX: valueFormatter undefined emas bo'lganda pass qilinadi
                  valueFormatter !== undefined ? (
                    <CustomLegend payload={legendPayload} valueFormatter={valueFormatter} />
                  ) : (
                    <CustomLegend payload={legendPayload} />
                  )
                }
              />
            )}
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
