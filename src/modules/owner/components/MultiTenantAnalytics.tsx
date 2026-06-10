'use client';

/**
 * src/modules/owner/components/MultiTenantAnalytics.tsx
 *
 * ✅ XATO 4  FIXED: All chart titles and UI text use useTranslations
 * ✅ XATO 6  FIXED: ChartCard — unused `height` prop removed from interface
 * ✅ XATO 8  FIXED: All hardcoded hex colors → CSS var(--*)
 *                   mobile chart height minimum 180px (was 160px)
 * ✅ XATO 9  FIXED: Desktop chart height minimum 300px (was 220px)
 * ✅ XATO 10 FIXED: Date/branch filters actually filter displayed data via useMemo
 */

import { useState, useMemo, useId } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, CalendarDays, BarChart2 } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import type { MultiTenantChartData } from '../types/owner.types';

// ── Constants — XATO 8: CSS var, ZERO hardcoded hex ──────────────────────────

const BRANCH_COLORS: readonly string[] = [
  'var(--brand-primary)',
  'var(--success-solid)',
  'var(--warning-solid)',
  'var(--error-solid)',
  'var(--brand-accent)',
  'var(--brand-secondary)',
  'var(--info-solid)',
  'var(--text-secondary)',
];

const GLOBAL_REV_COLOR = 'var(--brand-primary)';
const ENROLL_COLOR     = 'var(--success-solid)';
const USER_COLOR       = 'var(--brand-accent)';

// ── Custom Tooltip ────────────────────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 shadow-[var(--shadow-lg)]">
      {label && (
        <p className="mb-1.5 text-xs font-semibold text-[var(--text-secondary)]">{label}</p>
      )}
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          <span className="text-[var(--text-muted)] capitalize">{entry.name}:</span>
          <span className="font-semibold tabular-nums text-[var(--text-primary)]">
            {typeof entry.value === 'number'
              ? entry.value.toLocaleString()
              : String(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Chart Card — XATO 6: `height` prop olib tashlandi ────────────────────────

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  index: number;
}

function ChartCard({ title, children, index }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
      className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
    >
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
        <BarChart2 size={14} className="text-[var(--brand-primary)]" aria-hidden="true" />
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

// ── Skeleton placeholder ──────────────────────────────────────────────────────

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-xl bg-[var(--bg-surface-secondary)]"
      style={{ height }}
      aria-hidden="true"
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface MultiTenantAnalyticsProps {
  data: MultiTenantChartData | null;
  branches: string[];
  isFullPage?: boolean;
  isLoading?: boolean;
}

export function MultiTenantAnalytics({
  data,
  branches,
  isFullPage = false,
  isLoading = false,
}: MultiTenantAnalyticsProps) {
  // XATO 4: All UI text from useTranslations
  const t = useTranslations('owner.analytics');

  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [exporting, setExporting]         = useState(false);

  const fromId   = useId();
  const toId     = useId();
  const branchId = useId();

  // XATO 8: mobile min 180px | XATO 9: desktop min 300px
  const desktopHeight = isFullPage ? 380 : 300;
  const mobileHeight  = isFullPage ? 220 : 180;

  // XATO 10: Date filters — globalRevenue
  const filteredRevenue = useMemo(() => {
    if (!data?.globalRevenue) return [];
    if (!dateFrom && !dateTo) return data.globalRevenue;
    return data.globalRevenue.filter((d) => {
      const m = d.month;
      if (dateFrom && m < dateFrom.slice(0, 7)) return false;
      if (dateTo   && m > dateTo.slice(0, 7))   return false;
      return true;
    });
  }, [data?.globalRevenue, dateFrom, dateTo]);

  // XATO 10: Date filters — userGrowth
  const filteredUserGrowth = useMemo(() => {
    if (!data?.userGrowth) return [];
    if (!dateFrom && !dateTo) return data.userGrowth;
    return data.userGrowth.filter((d) => {
      if (dateFrom && d.month < dateFrom.slice(0, 7)) return false;
      if (dateTo   && d.month > dateTo.slice(0, 7))   return false;
      return true;
    });
  }, [data?.userGrowth, dateFrom, dateTo]);

  // XATO 10: Date filters — enrollmentTrends
  const filteredEnrollments = useMemo(() => {
    if (!data?.enrollmentTrends) return [];
    if (!dateFrom && !dateTo) return data.enrollmentTrends;
    return data.enrollmentTrends.filter((d) => {
      if (dateFrom && d.month < dateFrom.slice(0, 7)) return false;
      if (dateTo   && d.month > dateTo.slice(0, 7))   return false;
      return true;
    });
  }, [data?.enrollmentTrends, dateFrom, dateTo]);

  // XATO 10: Branch filter — displayed branches
  const displayBranches = useMemo(
    () =>
      selectedBranch === 'all'
        ? branches
        : branches.filter((b) => b === selectedBranch),
    [branches, selectedBranch],
  );

  // XATO 10: Branch filter — branchComparison data keys
  const filteredBranchData = useMemo(() => {
    if (!data?.branchComparison) return [];
    if (selectedBranch === 'all') return data.branchComparison;
    return data.branchComparison.map((row) => {
      const filtered: { period: string; [key: string]: number | string } = {
        period: row.period,
      };
      if (selectedBranch in row) {
        filtered[selectedBranch] = row[selectedBranch] as number;
      }
      return filtered;
    });
  }, [data?.branchComparison, selectedBranch]);

  const handleExport = async () => {
    if (typeof window === 'undefined' || window.innerWidth < 768) return;
    setExporting(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const el = document.getElementById('analytics-charts');
      if (!el) return;
      const canvas = await html2canvas(el);
      const link = document.createElement('a');
      link.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <ChartSkeleton key={i} height={desktopHeight} />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-default)] py-16 text-center">
        <BarChart2 size={36} className="mb-3 text-[var(--text-muted)]" aria-hidden="true" />
        {/* XATO 4: i18n keys */}
        <p className="font-semibold text-[var(--text-primary)]">{t('noData')}</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t('noDataDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Controls (full-page only) */}
      {isFullPage && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-wrap items-center gap-3"
        >
          {/* Date range */}
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-[var(--text-muted)]" aria-hidden="true" />
            <label htmlFor={fromId} className="sr-only">
              {t('fromDate')}
            </label>
            <input
              id={fromId}
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={cn(
                'h-10 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-secondary)]',
                'px-3 text-sm text-[var(--text-primary)]',
                'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]/20',
              )}
              aria-label={t('fromDate')}
            />
            <span className="text-[var(--text-muted)]">—</span>
            <label htmlFor={toId} className="sr-only">
              {t('toDate')}
            </label>
            <input
              id={toId}
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={cn(
                'h-10 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-secondary)]',
                'px-3 text-sm text-[var(--text-primary)]',
                'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]/20',
              )}
              aria-label={t('toDate')}
            />
          </div>

          {/* Branch filter */}
          <label htmlFor={branchId} className="sr-only">
            {t('filterByBranch')}
          </label>
          <select
            id={branchId}
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className={cn(
              'h-10 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-secondary)]',
              'px-3 text-sm text-[var(--text-primary)]',
              'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]/20',
            )}
            aria-label={t('filterByBranch')}
          >
            {/* XATO 4: translated */}
            <option value="all">{t('allBranches')}</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* PNG export — desktop only */}
          <motion.button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'ml-auto hidden items-center gap-2 rounded-xl border border-[var(--border-default)] px-4 py-2.5',
              'text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
              'disabled:opacity-50 md:flex',
            )}
            aria-label={t('exportPng')}
          >
            {exporting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
            ) : (
              <Download size={14} aria-hidden="true" />
            )}
            {/* XATO 4: translated */}
            {exporting ? t('exporting') : t('exportPng')}
          </motion.button>
        </motion.div>
      )}

      {/* Chart grid */}
      <div
        id="analytics-charts"
        className="grid gap-4 lg:grid-cols-2"
        role="region"
        aria-label={t('title')}
      >
        {/* ── Global Revenue ──────────────────────────────────────────────── */}
        <ChartCard title={t('revenueOverTime')} index={0}>
          {/* Mobile */}
          <div
            className="w-full md:hidden"
            style={{ height: mobileHeight }}
            aria-label={t('revenueOverTime')}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredRevenue}>
                <defs>
                  {/* XATO 8: CSS var */}
                  <linearGradient id="globalRevGrad-mobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={GLOBAL_REV_COLOR} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={GLOBAL_REV_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={GLOBAL_REV_COLOR}
                  fill="url(#globalRevGrad-mobile)"
                  strokeWidth={2}
                  isAnimationActive
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Desktop */}
          <div
            className="hidden w-full md:block"
            style={{ height: desktopHeight }}
            aria-label={t('revenueOverTime')}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredRevenue}>
                <defs>
                  {/* XATO 8: CSS var */}
                  <linearGradient id="globalRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={GLOBAL_REV_COLOR} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={GLOBAL_REV_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={GLOBAL_REV_COLOR}
                  fill="url(#globalRevGrad)"
                  strokeWidth={2}
                  isAnimationActive
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* ── Branch Comparison ───────────────────────────────────────────── */}
        <ChartCard title={t('branchComparison')} index={1}>
          {/* Mobile */}
          <div
            className="w-full md:hidden"
            style={{ height: mobileHeight }}
            aria-label={t('branchComparison')}
          >
            <ResponsiveContainer width="100%" height="100%">
              {/* XATO 10: filteredBranchData */}
              <BarChart data={filteredBranchData}>
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <Tooltip content={<CustomTooltip />} />
                {/* XATO 8: CSS var; XATO 10: displayBranches */}
                {displayBranches.slice(0, 3).map((branch, idx) => (
                  <Bar
                    key={branch}
                    dataKey={branch}
                    fill={BRANCH_COLORS[idx % BRANCH_COLORS.length] ?? 'var(--brand-primary)'}
                    radius={[3, 3, 0, 0]}
                    isAnimationActive
                    animationDuration={700 + idx * 100}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Desktop */}
          <div
            className="hidden w-full md:block"
            style={{ height: desktopHeight }}
            aria-label={t('branchComparison')}
          >
            <ResponsiveContainer width="100%" height="100%">
              {/* XATO 10: filteredBranchData */}
              <BarChart data={filteredBranchData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                {/* XATO 8: CSS var; XATO 10: displayBranches */}
                {displayBranches.map((branch, idx) => (
                  <Bar
                    key={branch}
                    dataKey={branch}
                    fill={BRANCH_COLORS[idx % BRANCH_COLORS.length] ?? 'var(--brand-primary)'}
                    radius={[3, 3, 0, 0]}
                    isAnimationActive
                    animationDuration={700 + idx * 100}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* ── User Growth ─────────────────────────────────────────────────── */}
        <ChartCard title={t('userGrowth')} index={2}>
          {/* Mobile */}
          <div
            className="w-full md:hidden"
            style={{ height: mobileHeight }}
            aria-label={t('userGrowth')}
          >
            <ResponsiveContainer width="100%" height="100%">
              {/* XATO 10: filteredUserGrowth */}
              <LineChart data={filteredUserGrowth}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <Tooltip content={<CustomTooltip />} />
                {/* XATO 8: CSS var */}
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={USER_COLOR}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Desktop */}
          <div
            className="hidden w-full md:block"
            style={{ height: desktopHeight }}
            aria-label={t('userGrowth')}
          >
            <ResponsiveContainer width="100%" height="100%">
              {/* XATO 10: filteredUserGrowth */}
              <LineChart data={filteredUserGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* XATO 8: CSS var */}
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={USER_COLOR}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: USER_COLOR, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive
                  animationDuration={900}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* ── Enrollment Trends ───────────────────────────────────────────── */}
        <ChartCard title={t('enrollmentTrends')} index={3}>
          {/* Mobile */}
          <div
            className="w-full md:hidden"
            style={{ height: mobileHeight }}
            aria-label={t('enrollmentTrends')}
          >
            <ResponsiveContainer width="100%" height="100%">
              {/* XATO 10: filteredEnrollments */}
              <AreaChart data={filteredEnrollments}>
                <defs>
                  {/* XATO 8: CSS var */}
                  <linearGradient id="enrollGrad-mobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={ENROLL_COLOR} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={ENROLL_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={ENROLL_COLOR}
                  fill="url(#enrollGrad-mobile)"
                  strokeWidth={2}
                  isAnimationActive
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Desktop */}
          <div
            className="hidden w-full md:block"
            style={{ height: desktopHeight }}
            aria-label={t('enrollmentTrends')}
          >
            <ResponsiveContainer width="100%" height="100%">
              {/* XATO 10: filteredEnrollments */}
              <AreaChart data={filteredEnrollments}>
                <defs>
                  {/* XATO 8: CSS var */}
                  <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={ENROLL_COLOR} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={ENROLL_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={ENROLL_COLOR}
                  fill="url(#enrollGrad)"
                  strokeWidth={2.5}
                  isAnimationActive
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}