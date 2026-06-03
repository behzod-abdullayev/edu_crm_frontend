'use client';

/**
 * src/shared/components/charts/SparklineChart.tsx
 *
 * Compact inline sparkline chart for KPI cards and stat displays.
 *
 * ✅ No "any" TypeScript types.
 * ✅ No hardcoded colors — all use CSS variables or props.
 * ✅ Framer Motion mount animation.
 * ✅ exactOptionalPropertyTypes: true compatible.
 */

import { useId } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import type {
  ValueType,
  NameType,
} from 'recharts/types/component/DefaultTooltipContent';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SparklineVariant = 'line' | 'area';

export interface SparklineDataPoint {
  value: number;
  label?: string;
}

export interface SparklineChartProps {
  data: SparklineDataPoint[];
  variant?: SparklineVariant;
  /** CSS color for stroke and fill. Default: 'var(--brand-primary)' */
  color?: string;
  width?: number;
  height?: number;
  isLoading?: boolean;
  strokeWidth?: number;
  showTooltip?: boolean;
  valueFormatter?: (value: number) => string;
  ariaLabel?: string;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SparklineSkeleton({ width, height }: { width: number; height: number }) {
  return (
    <div
      role="status"
      aria-label="Loading sparkline"
      className="relative overflow-hidden rounded"
      style={{ width, height }}
    >
      <div
        className="absolute inset-0 rounded"
        style={{ background: 'var(--bg-surface-secondary)' }}
      />
      <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[var(--bg-surface-hover)] to-transparent" />
      <span className="sr-only">Loading sparkline…</span>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

// Separate interface so exactOptionalPropertyTypes is respected
interface SparklineTooltipExtraProps {
  valueFormatter?: (value: number) => string;
}

function SparklineTooltip(
  props: TooltipProps<ValueType, NameType> & SparklineTooltipExtraProps,
) {
  const { active, payload, valueFormatter } = props;
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0];
  const raw = point?.payload as SparklineDataPoint | undefined;

  return (
    <div
      className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 shadow-[var(--shadow-md)]"
      style={{ fontSize: 11 }}
    >
      {raw?.label && (
        <p className="text-[var(--text-muted)]">{raw.label}</p>
      )}
      <p className="font-semibold tabular-nums text-[var(--text-primary)]">
        {valueFormatter
          ? valueFormatter(Number(point?.value))
          : String(point?.value ?? '')}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SparklineChart({
  data,
  variant = 'area',
  color = 'var(--brand-primary)',
  width = 80,
  height = 36,
  isLoading = false,
  strokeWidth = 1.5,
  showTooltip = true,
  valueFormatter,
  ariaLabel = 'Sparkline chart',
}: SparklineChartProps) {
  const gradientId = useId().replace(/:/g, '');

  if (isLoading) {
    return <SparklineSkeleton width={width} height={height} />;
  }

  if (!data || data.length === 0) {
    return (
      <div
        role="img"
        aria-label="No sparkline data"
        className="rounded"
        style={{ width, height, background: 'var(--bg-surface-secondary)' }}
      />
    );
  }

  // FIX: exactOptionalPropertyTypes — tooltip content belgilanadi,
  // valueFormatter faqat defined bo'lsa pass qilinadi
  const tooltipContent =
    valueFormatter !== undefined ? (
      <SparklineTooltip valueFormatter={valueFormatter} />
    ) : (
      <SparklineTooltip />
    );

  const tooltipEl = showTooltip ? (
    <Tooltip
      content={tooltipContent}
      cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
    />
  ) : null;

  return (
    <motion.div
      role="img"
      aria-label={ariaLabel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      style={{ width, height }}
    >
      {variant === 'area' ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {tooltipEl}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={strokeWidth}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 2.5, fill: color, strokeWidth: 0 }}
              isAnimationActive={true}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
            {tooltipEl}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={strokeWidth}
              dot={false}
              activeDot={{ r: 2.5, fill: color, strokeWidth: 0 }}
              isAnimationActive={true}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}

// ─── SparklineGroup ───────────────────────────────────────────────────────────

interface SparklineGroupItem {
  label: string;
  data: SparklineDataPoint[];
  color?: string;
  valueFormatter?: (v: number) => string;
}

interface SparklineGroupProps {
  items: SparklineGroupItem[];
  height?: number;
  width?: number;
  variant?: SparklineVariant;
  className?: string;
}

export function SparklineGroup({
  items,
  height = 36,
  width = 80,
  variant = 'area',
  className,
}: SparklineGroupProps) {
  return (
    <div className={`flex items-center gap-4 ${className ?? ''}`}>
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-start gap-0.5">
          {/* FIX: color undefined ise prop hiç verilmez */}
          <SparklineChart
            data={item.data}
            height={height}
            width={width}
            variant={variant}
            ariaLabel={`${item.label} sparkline`}
            {...(item.color !== undefined ? { color: item.color } : {})}
            {...(item.valueFormatter !== undefined
              ? { valueFormatter: item.valueFormatter }
              : {})}
          />
          <p className="text-[10px] text-[var(--text-muted)]">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
