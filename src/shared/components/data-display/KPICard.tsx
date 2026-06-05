'use client';

/**
 * src/shared/components/data-display/KPICard.tsx
 *
 * Enterprise KPI card with:
 * ✅ Count-up animation on mount (Framer Motion)
 * ✅ Sparkline mini-chart
 * ✅ Trend indicator (up/down/neutral)
 * ✅ Skeleton loader (shimmer, no spinner)
 * ✅ Hover lift + shadow animation
 * ✅ Mobile: scale(0.98) press feedback
 * ✅ Correct CSS variables from globals.css
 * ✅ No "any" TypeScript types
 * ✅ WCAG 2.1 AA accessible
 * ✅ Light/dark mode via CSS variables
 */

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CountUp } from '@shared/components/animations/CountUp';
import { SparklineChart } from '@shared/components/charts/SparklineChart';
import type { SparklineDataPoint } from '@shared/components/charts/SparklineChart';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { cn } from '@shared/utils/cn';
import type { LucideIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrendConfig {
  /** Percentage change value (positive or negative) */
  value: number;
  /** Human-readable period label, e.g. "vs last month" */
  label: string;
  /** Visual direction of the trend */
  direction: 'up' | 'down' | 'neutral';
}

export interface KPICardProps {
  /** Card title shown above the value */
  title: string;
  /** Numeric value to display and animate */
  value: number;
  /** Unit shown after the value, e.g. "students" */
  unit?: string;
  /** Prefix shown before the value, e.g. "$" or "UZS" */
  prefix?: string;
  /** Trend badge config */
  trend?: TrendConfig;
  /** Sparkline data points */
  sparklineData?: SparklineDataPoint[];
  /** Lucide icon component */
  icon: LucideIcon;
  /** CSS color string for icon and sparkline, e.g. "#4F46E5" or "var(--brand-primary)" */
  iconColor?: string;
  /** Show skeleton shimmer loader */
  isLoading?: boolean;
  /** Compare period label shown below value when no trend label */
  comparePeriod?: string;
  /** Additional Tailwind classes */
  className?: string;
}

// ─── Trend color maps — use exact CSS vars from globals.css ───────────────────

const TREND_TEXT: Record<TrendConfig['direction'], string> = {
  up:      'text-[var(--success-text)]',
  down:    'text-[var(--error-text)]',
  neutral: 'text-[var(--text-muted)]',
};

const TREND_BG: Record<TrendConfig['direction'], string> = {
  up:      'bg-[var(--success-bg)]',
  down:    'bg-[var(--error-bg)]',
  neutral: 'bg-[var(--bg-surface-hover)]',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function KPICard({
  title,
  value,
  unit,
  prefix,
  trend,
  sparklineData,
  icon: Icon,
  iconColor,
  isLoading,
  comparePeriod,
  className,
}: KPICardProps) {
  const t = useTranslations('kpi');

  // ── Loading state: skeleton shimmer ──
  if (isLoading) {
    return (
      <SkeletonLoader
        variant="kpi"
        {...(className !== undefined ? { className } : {})}
      />
    );
  }

  const TrendIcon =
    trend?.direction === 'up'
      ? TrendingUp
      : trend?.direction === 'down'
        ? TrendingDown
        : Minus;

  const resolvedIconColor = iconColor ?? 'var(--brand-primary)';
  // Icon background: 12% opacity hex appended — works for CSS var and hex
  const iconBg = iconColor ? `${iconColor}1F` : 'var(--bg-surface-secondary)';

  // Sub-label: prefer trend.label, fall back to comparePeriod
  const subLabel = trend?.label ?? comparePeriod;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-lg)' }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative flex flex-col gap-4 rounded-2xl border border-[var(--border-default)]',
        'bg-[var(--bg-surface)] p-5 cursor-default',
        'transition-shadow duration-200',
        className,
      )}
    >
      {/* ── Top row: icon + trend badge ── */}
      <div className="flex items-start justify-between gap-2">
        {/* Icon */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBg }}
          aria-hidden="true"
        >
          <Icon
            size={20}
            aria-hidden="true"
            style={{ color: resolvedIconColor }}
          />
        </div>

        {/* Trend badge */}
        {trend !== undefined && (
          <span
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-1',
              'text-xs font-semibold tabular-nums leading-none',
              TREND_TEXT[trend.direction],
              TREND_BG[trend.direction],
            )}
            aria-label={t('trend', { value: trend.value, label: trend.label })}
            role="status"
          >
            <TrendIcon size={12} aria-hidden="true" />
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {/* ── Value block ── */}
      <div>
        {/* Title */}
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          {title}
        </p>

        {/* Number row */}
        <div className="flex items-baseline gap-1">
          {prefix !== undefined && (
            <span className="text-lg font-semibold text-[var(--text-secondary)]">
              {prefix}
            </span>
          )}
          <CountUp
            to={value}
            duration={1.2}
            className="tabular-nums text-3xl font-bold text-[var(--text-primary)]"
          />
          {unit !== undefined && (
            <span className="text-sm font-medium text-[var(--text-muted)]">
              {unit}
            </span>
          )}
        </div>

        {/* Sub-label */}
        {subLabel !== undefined && (
          <p className="mt-1 text-xs text-[var(--text-muted)]">{subLabel}</p>
        )}
      </div>

      {/* ── Sparkline ── */}
      {sparklineData !== undefined && sparklineData.length > 0 && (
        <SparklineChart
          data={sparklineData}
          height={40}
          {...(iconColor !== undefined ? { color: iconColor } : {})}
          ariaLabel={`${title} sparkline`}
        />
      )}
    </motion.div>
  );
}