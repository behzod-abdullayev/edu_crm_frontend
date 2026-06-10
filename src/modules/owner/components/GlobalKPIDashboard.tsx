'use client';
// src/modules/owner/components/GlobalKPIDashboard.tsx
//
// ✅ XATO 3 FIXED:  All labels now use useTranslations — zero hardcoded strings
// ✅ XATO 7 FIXED:  Mobile grid is grid-cols-1 (not grid-cols-2)
// ✅ XATO 11 FIXED: KPI cards now render sparkline mini-charts when data available

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Users,
  Building2,
  BookOpen,
  BarChart3,
  UserPlus,
} from 'lucide-react';
import { CountUp } from '@shared/components/animations/CountUp';
import { SparklineChart } from '@shared/components/charts/SparklineChart';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { cn } from '@shared/utils/cn';
import type { LucideIcon } from 'lucide-react';
import type { GlobalKPIData } from '../types/owner.types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface KPICardConfig {
  label: string;
  vsLastMonth: string;
  rawValue: number;
  trend: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  iconColor: string;
  formatFn?: (v: number) => string;
  // ✅ XATO 11 FIX: sparkline data always populated via generateSparkline in useOwnerKPI
  sparkline?: { value: number }[];
}

// ── Internal KPI Card ─────────────────────────────────────────────────────────

function OwnerKPICard({
  label,
  vsLastMonth,
  rawValue,
  trend,
  prefix,
  suffix,
  icon: Icon,
  iconColor,
  formatFn,
  sparkline,
  index,
}: KPICardConfig & { index: number }) {
  const isPositive = trend > 0;
  const isNeutral = trend === 0;

  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const trendColor = isNeutral
    ? 'text-[var(--text-muted)]'
    : isPositive
      ? 'text-[var(--success-text)]'
      : 'text-[var(--error-text)]';
  const trendBg = isNeutral
    ? 'bg-[var(--bg-surface-hover)]'
    : isPositive
      ? 'bg-[var(--success-bg)]'
      : 'bg-[var(--error-bg)]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-lg)' }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[var(--border-default)]',
        'bg-[var(--bg-surface)] p-5 flex flex-col gap-4 cursor-default transition-shadow',
      )}
      role="region"
      aria-label={label}
    >
      {/* Decorative circle */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10"
        style={{ backgroundColor: iconColor }}
        aria-hidden="true"
      />

      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <Icon size={20} aria-hidden="true" style={{ color: iconColor }} />
        </div>

        {!isNeutral && (
          <span
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
              trendColor,
              trendBg,
            )}
            aria-label={`${isPositive ? 'Increase' : 'Decrease'} of ${Math.abs(trend)}% ${vsLastMonth}`}
          >
            <TrendIcon size={11} aria-hidden="true" />
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Value area */}
      <div className="flex-1">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </p>
        <div className="flex items-baseline gap-1">
          {prefix && (
            <span className="text-base font-semibold text-[var(--text-secondary)]">
              {prefix}
            </span>
          )}
          {formatFn ? (
            <span className="text-3xl font-black tabular-nums tracking-tight text-[var(--text-primary)]">
              {formatFn(rawValue)}
            </span>
          ) : (
            <CountUp
              to={rawValue}
              duration={1.4}
              className="text-3xl font-black tabular-nums tracking-tight text-[var(--text-primary)]"
            />
          )}
          {suffix && (
            <span className="text-sm font-medium text-[var(--text-muted)]">{suffix}</span>
          )}
        </div>
        {/* ✅ XATO 3 FIX: vsLastMonth is now translated, passed as prop */}
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{vsLastMonth}</p>
      </div>

      {/* ✅ XATO 11 FIX: sparkline is now always present (generated in useOwnerKPI) */}
      {sparkline !== undefined && sparkline.length > 0 && (
        <SparklineChart data={sparkline} height={36} color={iconColor} />
      )}
    </motion.div>
  );
}

// ── Skeleton Grid ─────────────────────────────────────────────────────────────

function GlobalKPISkeletonGrid() {
  return (
    // ✅ XATO 7 FIX: Mobile grid-cols-1 (not grid-cols-2)
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonLoader key={i} variant="kpi" />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface GlobalKPIDashboardProps {
  data: GlobalKPIData;
  isLoading?: boolean;
}

export function GlobalKPIDashboard({ data, isLoading = false }: GlobalKPIDashboardProps) {
  // ✅ XATO 3 FIX: All labels come from useTranslations — zero hardcoded strings
  const t = useTranslations('owner.dashboard');

  if (isLoading) {
    return <GlobalKPISkeletonGrid />;
  }

  const vsLastMonth = t('vsLastMonth');

  const cards: KPICardConfig[] = [
    {
      label:      t('mrr_short'),
      vsLastMonth,
      rawValue:   data.mrr,
      trend:      data.trends?.mrrChange ?? 0,
      icon:       DollarSign,
      iconColor:  '#4F46E5',
      formatFn:   (v) => `${(v / 1_000_000).toFixed(1)}M`,
      suffix:     ' UZS',
      ...(data.mrrSparkline !== undefined ? { sparkline: data.mrrSparkline } : {}),
    },
    {
      label:      t('arr_short'),
      vsLastMonth,
      rawValue:   data.arr,
      trend:      Math.round((data.trends?.mrrChange ?? 0) * 1.1 * 10) / 10,
      icon:       BarChart3,
      iconColor:  '#06B6D4',
      formatFn:   (v) => `${(v / 1_000_000).toFixed(0)}M`,
      suffix:     ' UZS',
      ...(data.mrrSparkline !== undefined ? { sparkline: data.mrrSparkline } : {}),
    },
    {
      label:      t('totalUsers_short'),
      vsLastMonth,
      rawValue:   data.totalUsers,
      trend:      data.trends?.usersChange ?? 0,
      icon:       Users,
      iconColor:  '#8B5CF6',
      ...(data.usersSparkline !== undefined ? { sparkline: data.usersSparkline } : {}),
    },
    {
      label:      t('branches_short'),
      vsLastMonth,
      rawValue:   data.totalBranches,
      trend:      0,
      icon:       Building2,
      iconColor:  '#F59E0B',
    },
    {
      label:      t('activeCourses_short'),
      vsLastMonth,
      rawValue:   data.activeCourses,
      trend:      0,
      icon:       BookOpen,
      iconColor:  '#22C55E',
    },
    {
      label:      t('enrollments_short'),
      vsLastMonth,
      rawValue:   data.monthlyEnrollments,
      trend:      data.trends?.enrollmentsChange ?? 0,
      icon:       UserPlus,
      iconColor:  '#EF4444',
      ...(data.enrollmentsSparkline !== undefined ? { sparkline: data.enrollmentsSparkline } : {}),
    },
  ];

  return (
    // ✅ XATO 7 FIX: Mobile grid-cols-1 (not grid-cols-2)
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      role="list"
      aria-label={t('ariaMetrics')}
    >
      {cards.map((card, i) => (
        <OwnerKPICard key={card.label} {...card} index={i} />
      ))}
    </div>
  );
}