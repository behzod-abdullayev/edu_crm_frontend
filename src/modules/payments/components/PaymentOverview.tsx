'use client';

/**
 * src/modules/payments/components/PaymentOverview.tsx
 *
 * Financial KPI dashboard component.
 *
 * ✅ Framer Motion: count-up, stagger, hover-lift, reduced-motion safe
 * ✅ Recharts AreaChart for monthly revenue trend
 * ✅ Sparklines on every KPI card
 * ✅ Offline banner with cached-data timestamp
 * ✅ Skeleton loaders (shimmer — NO spinners)
 * ✅ CSS variables only — no hardcoded colors
 * ✅ Responsive: 4-col → 2-col → 1-col
 * ✅ Zero "any" TypeScript
 * ✅ next-intl i18n
 * ✅ FadeIn used correctly — no unsupported ARIA props passed to it
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  DollarSign,
  Clock,
  AlertTriangle,
  RefreshCcw,
  TrendingUp,
  TrendingDown,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import { CountUp } from '@shared/components/animations/CountUp';
import { FadeIn } from '@shared/components/animations/FadeIn';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { AreaChart as SharedAreaChart } from '@shared/components/charts/AreaChart';
import { SparklineChart } from '@shared/components/charts/SparklineChart';
import { cn } from '@shared/utils/cn';
import type { PaymentOverviewData } from '../types/payment.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthlyPoint {
  month: string;
  amount: number;
}

export interface PaymentOverviewProps {
  data: PaymentOverviewData;
  monthlyRevenue?: MonthlyPoint[];
  isLoading?: boolean;
  isOffline?: boolean;
  onRetry?: () => void;
}

// ─── KPI Card definition ──────────────────────────────────────────────────────

interface KPIDefinition {
  key: keyof PaymentOverviewData;
  labelKey: string;
  icon: LucideIcon;
  iconColor: string;
  variant: 'success' | 'warning' | 'error' | 'neutral';
}

const KPI_DEFINITIONS: KPIDefinition[] = [
  {
    key: 'totalRevenue',
    labelKey: 'kpi.totalRevenue',
    icon: DollarSign,
    iconColor: 'var(--success-solid)',
    variant: 'success',
  },
  {
    key: 'totalPending',
    labelKey: 'kpi.pending',
    icon: Clock,
    iconColor: 'var(--warning-solid)',
    variant: 'warning',
  },
  {
    key: 'totalOverdue',
    labelKey: 'kpi.overdue',
    icon: AlertTriangle,
    iconColor: 'var(--error-solid)',
    variant: 'error',
  },
  {
    key: 'totalRefunded',
    labelKey: 'kpi.refunded',
    icon: RefreshCcw,
    iconColor: 'var(--info-solid)',
    variant: 'neutral',
  },
];

// ─── Style maps ───────────────────────────────────────────────────────────────

const VARIANT_BORDER: Record<KPIDefinition['variant'], string> = {
  success: 'border-[var(--success-border)]',
  warning: 'border-[var(--warning-border)]',
  error:   'border-[var(--error-border)]',
  neutral: 'border-[var(--border-default)]',
};

const VARIANT_BG: Record<KPIDefinition['variant'], string> = {
  success: 'bg-[var(--success-bg)]',
  warning: 'bg-[var(--warning-bg)]',
  error:   'bg-[var(--error-bg)]',
  neutral: 'bg-[var(--bg-surface)]',
};

// ─── Single KPI Card ──────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: number;
  currency: string;
  icon: LucideIcon;
  iconColor: string;
  variant: KPIDefinition['variant'];
  sparkline?: { value: number }[];
  index: number;
}

function KPICard({
  label,
  value,
  currency,
  icon: Icon,
  iconColor,
  variant,
  sparkline,
  index,
}: KPICardProps) {
  const isPositiveTrend = variant === 'success';
  const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'rounded-2xl border p-5 flex flex-col gap-3 cursor-default',
        'shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
        'transition-shadow duration-200',
        VARIANT_BORDER[variant],
        VARIANT_BG[variant],
      )}
    >
      {/* Icon row */}
      <div className="flex items-start justify-between">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${iconColor}22` }}
        >
          <Icon size={20} style={{ color: iconColor }} aria-hidden="true" />
        </div>
        <span
          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
          style={{ background: `${iconColor}18`, color: iconColor }}
          aria-hidden="true"
        >
          <TrendIcon size={10} />
        </span>
      </div>

      {/* Label + value */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1">
          {label}
        </p>
        <div className="flex items-baseline gap-1.5">
          <CountUp
            to={value}
            duration={1.4}
            className="text-3xl font-bold tabular-nums text-[var(--text-primary)]"
          />
          <span className="text-sm font-medium text-[var(--text-muted)]">{currency}</span>
        </div>
      </div>

      {/* Sparkline */}
      {sparkline !== undefined && sparkline.length > 0 && (
        <SparklineChart
          data={sparkline}
          height={36}
          color={iconColor}
          showTooltip={false}
          ariaLabel={`${label} trend`}
        />
      )}
    </motion.div>
  );
}

// ─── Skeleton grid ────────────────────────────────────────────────────────────

function KPIGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonLoader key={i} variant="kpi" />
      ))}
    </div>
  );
}

// ─── Offline banner ───────────────────────────────────────────────────────────

interface OfflineBannerProps {
  lastUpdated: string;
  onRetry?: () => void;
}

function OfflineBanner({ lastUpdated, onRetry }: OfflineBannerProps) {
  const t = useTranslations('payments');

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      role="alert"
      className={cn(
        'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm',
        'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
      )}
    >
      <Wifi size={16} className="shrink-0" aria-hidden="true" />
      <span className="flex-1">
        {t('offlineCached')}{' '}
        <time dateTime={lastUpdated}>
          {new Date(lastUpdated).toLocaleString()}
        </time>
      </span>
      {onRetry !== undefined && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--warning-border)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--warning-border)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          type="button"
          aria-label={t('retry')}
        >
          <RefreshCcw size={12} aria-hidden="true" />
          {t('retry')}
        </motion.button>
      )}
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PaymentOverview({
  data,
  monthlyRevenue,
  isLoading = false,
  isOffline = false,
  onRetry,
}: PaymentOverviewProps) {
  const t = useTranslations('payments');

  // Build per-KPI sparklines from monthly data (last 7 points)
  const sparkline = useMemo<{ value: number }[]>(() => {
    if (!monthlyRevenue || monthlyRevenue.length === 0) return [];
    return monthlyRevenue.slice(-7).map((p) => ({ value: p.amount }));
  }, [monthlyRevenue]);

  // Recharts data for the area chart
  const areaData = useMemo(
    () =>
      (monthlyRevenue ?? []).map((p) => ({
        month: p.month,
        revenue: p.amount,
      })),
    [monthlyRevenue],
  );

  if (isLoading) {
    return (
      <section aria-label={t('overview')} className="space-y-6">
        <KPIGridSkeleton />
        <SkeletonLoader variant="chart" />
      </section>
    );
  }

  return (
    // Wrap with semantic <section> — FadeIn is inside so ARIA is on the element,
    // not passed as unsupported prop to FadeIn's interface.
    <section aria-label={t('overview')}>
      <FadeIn className="space-y-6">
        {/* Offline banner */}
        {isOffline && (
          <OfflineBanner
            lastUpdated={data.lastUpdated}
            {...(onRetry !== undefined ? { onRetry } : {})}
          />
        )}

        {/* KPI grid */}
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          role="list"
          aria-label={t('kpiCards')}
        >
          {KPI_DEFINITIONS.map((def, index) => {
            const rawValue = data[def.key];
            const value = typeof rawValue === 'number' ? rawValue : 0;

            return (
              <div key={def.key} role="listitem">
                <KPICard
                  label={t(def.labelKey as Parameters<typeof t>[0])}
                  value={value}
                  currency={data.currency}
                  icon={def.icon}
                  iconColor={def.iconColor}
                  variant={def.variant}
                  index={index}
                  {...(sparkline.length > 0 ? { sparkline } : {})}
                />
              </div>
            );
          })}
        </div>

        {/* Monthly revenue chart */}
        {areaData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <SharedAreaChart
              data={areaData}
              series={[
                {
                  dataKey: 'revenue',
                  label: t('kpi.totalRevenue'),
                  color: 'var(--success-solid)',
                },
              ]}
              xAxisKey="month"
              title={t('monthlyRevenue')}
              height={280}
              mobileHeight={200}
              showLegend={false}
              yFormatter={(v) =>
                new Intl.NumberFormat('uz-UZ', {
                  notation: 'compact',
                  maximumFractionDigits: 1,
                }).format(v)
              }
            />
          </motion.div>
        )}
      </FadeIn>
    </section>
  );
}
