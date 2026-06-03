'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CountUp } from '@shared/components/animations/CountUp';
import { SparklineChart } from '@shared/components/charts/SparklineChart';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { cn } from '@shared/utils/cn';
import type { LucideIcon } from 'lucide-react';

interface TrendConfig {
  value: number;
  label: string;
  direction: 'up' | 'down' | 'neutral';
}

interface KPICardProps {
  title: string;
  value: number;
  unit?: string;
  prefix?: string;
  trend?: TrendConfig;
  sparklineData?: { value: number }[];
  icon: LucideIcon;
  iconColor?: string;
  isLoading?: boolean;
  comparePeriod?: string;
  className?: string;
}

const trendColors: Record<TrendConfig['direction'], string> = {
  up: 'text-[var(--color-success)]',
  down: 'text-[var(--color-error)]',
  neutral: 'text-[var(--color-text-muted)]',
};

const trendBg: Record<TrendConfig['direction'], string> = {
  up: 'bg-[var(--color-success)]/10',
  down: 'bg-[var(--color-error)]/10',
  neutral: 'bg-[var(--color-text-muted)]/10',
};

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

  if (isLoading) {
    return <SkeletonLoader variant="kpi" {...(className !== undefined ? { className } : {})} />;
  }

  const TrendIcon =
    trend?.direction === 'up'
      ? TrendingUp
      : trend?.direction === 'down'
        ? TrendingDown
        : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px var(--shadow-md)' }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl p-5 flex flex-col gap-4 cursor-default transition-shadow',
        className,
      )}
    >
      {/* Top row: icon + trend badge */}
      <div className="flex items-start justify-between">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconColor ? `${iconColor}20` : 'var(--color-accent-subtle)' }}
        >
          <Icon
            size={20}
            aria-hidden="true"
            style={{ color: iconColor ?? 'var(--color-accent)' }}
          />
        </div>
        {trend && (
          <span
            className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
              trendColors[trend.direction],
              trendBg[trend.direction],
            )}
            aria-label={t('trend', { value: trend.value, label: trend.label })}
          >
            <TrendIcon size={12} aria-hidden="true" />
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
          {title}
        </p>
        <div className="flex items-baseline gap-1">
          {prefix && (
            <span className="text-lg font-semibold text-[var(--color-text-secondary)]">
              {prefix}
            </span>
          )}
          <CountUp
            to={value}
            duration={1.2}
            className="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums"
          />
          {unit && (
            <span className="text-sm font-medium text-[var(--color-text-muted)]">{unit}</span>
          )}
        </div>
        {(trend?.label !== undefined || comparePeriod !== undefined) && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {trend?.label ?? comparePeriod}
          </p>
        )}
      </div>

      {/* Sparkline */}
      {/* FIX: number[] emas, SparklineDataPoint[] pass qilinadi */}
      {sparklineData !== undefined && sparklineData.length > 0 && (
        <SparklineChart
          data={sparklineData}
          height={40}
          {...(iconColor !== undefined ? { color: iconColor } : {})}
        />
      )}
    </motion.div>
  );
}
