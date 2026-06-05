'use client';

/**
 * Owner Analytics Page
 * Route: /[locale]/(dashboard)/owner/analytics
 *
 * Full global analytics dashboard: MRR/ARR KPIs, global revenue trend,
 * branch comparison, user growth, enrollment trends — with date range
 * filters and CSV export.
 */

import type { Metadata } from 'next';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  DollarSign,
  Download,
  Minus,
} from 'lucide-react';
import { useOwnerAnalytics, useOwnerKPI } from '@modules/owner/hooks/useOwner';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { EmptyState } from '@shared/components/data-display/EmptyState';
import { cn } from '@shared/utils/cn';
import { formatNumber } from '@shared/utils/format';
import type {
  MultiTenantChartData,
} from '@modules/owner/types/owner.types';

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Analytics | Owner — EduCRM',
  robots: { index: false, follow: false },
};

// ─── Lazily loaded recharts container (heavy — SSR must be off) ───────────────

const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => ({ default: m.ResponsiveContainer })),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-[var(--bg-surface-hover)]" /> },
);
const AreaChart = dynamic(
  () => import('recharts').then((m) => ({ default: m.AreaChart })),
  { ssr: false },
);
const BarChart = dynamic(
  () => import('recharts').then((m) => ({ default: m.BarChart })),
  { ssr: false },
);
const LineChart = dynamic(
  () => import('recharts').then((m) => ({ default: m.LineChart })),
  { ssr: false },
);
const CartesianGrid = dynamic(
  () => import('recharts').then((m) => ({ default: m.CartesianGrid })),
  { ssr: false },
);

// ─── Recharts primitives — imported directly (not dynamic) ────────────────────
// dynamic() wraps only default-exported components. Recharts primitives like
// Area, Bar, Line, XAxis, YAxis, Tooltip, Legend are not default exports from
// their own modules — they are named exports from 'recharts'. Wrapping them in
// dynamic() causes TS2345 because the loader signature does not match
// DynamicOptions<Props>. Import them statically; the chart container itself
// is already lazy-loaded above, so SSR is handled at the container level.
import {
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

// ─── Branch color palette ─────────────────────────────────────────────────────

const CHART_COLORS = [
  'var(--brand-primary)',
  'var(--success-solid)',
  'var(--warning-solid)',
  'var(--error-solid)',
  'var(--brand-accent)',
  'var(--brand-secondary)',
];

// ─── Custom recharts tooltip ──────────────────────────────────────────────────

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  prefix?: string;
}

function CustomTooltip({ active, payload, label, prefix = '' }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-lg)]">
      {label && (
        <p className="mb-2 text-xs font-semibold text-[var(--text-primary)]">{label}</p>
      )}
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ background: item.color }}
          />
          <span className="text-[var(--text-muted)]">{item.name}:</span>
          <span className="font-medium text-[var(--text-primary)]">
            {prefix}{formatNumber(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Chart skeleton ───────────────────────────────────────────────────────────

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-lg bg-[var(--bg-surface-hover)]"
      style={{ height }}
      aria-hidden="true"
    />
  );
}

// ─── Date range picker ─────────────────────────────────────────────────────────

type DateRange = '7d' | '30d' | '90d' | '12m';

function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (v: DateRange) => void;
}) {
  const OPTIONS: { label: string; value: DateRange }[] = [
    { label: '7 days', value: '7d' },
    { label: '30 days', value: '30d' },
    { label: '90 days', value: '90d' },
    { label: '12 months', value: '12m' },
  ];

  return (
    <div role="group" aria-label="Date range" className="flex gap-1 overflow-x-auto">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={cn(
            'whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors',
            value === opt.value
              ? 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]'
              : 'border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: number;
  prefix?: string;
  trend: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  isLoading?: boolean;
}

function KPICard({
  label,
  value,
  prefix = '',
  trend,
  icon: Icon,
  iconBg,
  iconColor,
  isLoading,
}: KPICardProps) {
  if (isLoading) return <SkeletonLoader variant="kpi" />;

  const trendUp = trend > 0;
  const trendNeutral = trend === 0;

  return (
    <motion.div
      whileHover={{ translateY: -2, boxShadow: 'var(--shadow-lg)' }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', iconBg)}>
          <Icon size={20} className={iconColor} aria-hidden="true" />
        </div>

        <span
          className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            trendNeutral
              ? 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)]'
              : trendUp
              ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
              : 'bg-[var(--error-bg)] text-[var(--error-text)]',
          )}
        >
          {trendNeutral ? (
            <Minus size={10} aria-hidden="true" />
          ) : trendUp ? (
            <TrendingUp size={10} aria-hidden="true" />
          ) : (
            <TrendingDown size={10} aria-hidden="true" />
          )}
          {Math.abs(trend)}%
        </span>
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)] xl:text-3xl">
        {prefix}{formatNumber(value)}
      </p>
    </motion.div>
  );
}

// ─── Revenue area chart ────────────────────────────────────────────────────────

function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]">
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
        Global Revenue Trend
      </h3>
      {data.length === 0 ? (
        <ChartSkeleton />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${formatNumber(v)}`}
            />
            <Tooltip content={<CustomTooltip prefix="$" />} />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="var(--brand-primary)"
              strokeWidth={2}
              fill="url(#revGrad)"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--brand-primary)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Branch comparison bar chart ──────────────────────────────────────────────

function BranchComparisonChart({
  data,
  branches,
}: {
  data: Record<string, number | string>[];
  branches: string[];
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]">
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
        Branch Revenue Comparison
      </h3>
      {data.length === 0 ? (
        <ChartSkeleton height={240} />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
            {branches.map((branch, idx) => (
              <Bar
                key={branch}
                dataKey={branch}
                name={branch}
                fill={CHART_COLORS[idx % CHART_COLORS.length]}
                radius={[3, 3, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── User growth line chart ────────────────────────────────────────────────────

function UserGrowthChart({ data }: { data: { month: string; count: number }[] }) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]">
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">User Growth</h3>
      {data.length === 0 ? (
        <ChartSkeleton height={220} />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              name="Users"
              stroke="var(--brand-accent)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--brand-accent)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Enrollment trend chart ────────────────────────────────────────────────────

function EnrollmentTrendChart({ data }: { data: { month: string; count: number }[] }) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]">
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
        Enrollment Trends
      </h3>
      {data.length === 0 ? (
        <ChartSkeleton height={220} />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--success-solid)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--success-solid)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              name="Enrollments"
              stroke="var(--success-solid)"
              strokeWidth={2}
              fill="url(#enrollGrad)"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--success-solid)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Fallback simple bar (no recharts dependency) ─────────────────────────────

function SimpleBarDisplay({
  title,
  data,
}: {
  title: string;
  data: { label: string; value: number }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <p className="w-12 shrink-0 text-right text-xs text-[var(--text-muted)]">
              {item.label}
            </p>
            <div className="flex-1 overflow-hidden rounded-full bg-[var(--bg-surface-hover)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / max) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-2 rounded-full bg-[var(--brand-primary)]"
              />
            </div>
            <p className="w-16 shrink-0 text-xs font-medium tabular-nums text-[var(--text-primary)]">
              {formatNumber(item.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OwnerAnalyticsPage() {
  const { data: kpi, isLoading: kpiLoading } = useOwnerKPI();
  const { chartData, isLoading: chartLoading } = useOwnerAnalytics();

  const [dateRange, setDateRange] = useState<DateRange>('30d');

  // Derive unique branch names for bar chart series keys
  const branchList = useMemo<string[]>(() => {
    const first = chartData?.branchComparison?.[0];
    if (!first) return [];
    return Object.keys(first).filter((k) => k !== 'period');
  }, [chartData]);

  // Slice data by date range
  const revenueData = useMemo(() => {
    const all = chartData?.globalRevenue ?? [];
    const count = dateRange === '7d' ? 7 : dateRange === '30d' ? 12 : dateRange === '90d' ? 12 : 12;
    return all.slice(-count);
  }, [chartData, dateRange]);

  const userGrowthData = useMemo(() => {
    const all = chartData?.userGrowth ?? [];
    return dateRange === '7d' ? all.slice(-3) : all.slice(-6);
  }, [chartData, dateRange]);

  const enrollmentData = useMemo(() => {
    const all = chartData?.enrollmentTrends ?? [];
    return dateRange === '7d' ? all.slice(-3) : all.slice(-6);
  }, [chartData, dateRange]);

  const branchCompData = useMemo(() => {
    return chartData?.branchComparison?.slice(-6) ?? [];
  }, [chartData]);

  const handleExport = () => {
    if (!chartData?.globalRevenue?.length) return;
    const rows = chartData.globalRevenue.map((d) => `${d.month},${d.revenue}`);
    const csv = ['Month,Revenue', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-5 lg:px-8 lg:py-8">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-accent)]/10">
              <BarChart2 size={22} className="text-[var(--brand-accent)]" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
                Analytics
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                Global performance across all branches
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleExport}
              disabled={chartLoading || !chartData}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] disabled:opacity-50"
              aria-label="Export analytics CSV"
            >
              <Download size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Export</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ── KPI cards ────────────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <KPICard
            label="Monthly Revenue"
            value={kpi?.mrr ?? 0}
            prefix="$"
            trend={kpi?.trends.mrrChange ?? 0}
            icon={DollarSign}
            iconBg="bg-[var(--brand-primary)]/10"
            iconColor="text-[var(--brand-primary)]"
            isLoading={kpiLoading}
          />
          <KPICard
            label="Annual Revenue"
            value={kpi?.arr ?? 0}
            prefix="$"
            trend={kpi?.revenueGrowthPercent ?? 0}
            icon={TrendingUp}
            iconBg="bg-[var(--success-bg)]"
            iconColor="text-[var(--success-text)]"
            isLoading={kpiLoading}
          />
          <KPICard
            label="Total Users"
            value={kpi?.totalUsers ?? 0}
            trend={kpi?.trends.usersChange ?? 0}
            icon={Users}
            iconBg="bg-[var(--info-bg)]"
            iconColor="text-[var(--info-text)]"
            isLoading={kpiLoading}
          />
          <KPICard
            label="Monthly Enrollments"
            value={kpi?.monthlyEnrollments ?? 0}
            trend={kpi?.trends.enrollmentsChange ?? 0}
            icon={BookOpen}
            iconBg="bg-[var(--brand-accent)]/10"
            iconColor="text-[var(--brand-accent)]"
            isLoading={kpiLoading}
          />
        </div>

        {/* ── Charts ──────────────────────────────────────────────────── */}
        {chartLoading ? (
          <div className="space-y-6">
            <SkeletonLoader variant="chart" />
            <div className="grid gap-6 lg:grid-cols-2">
              <SkeletonLoader variant="chart" />
              <SkeletonLoader variant="chart" />
            </div>
            <SkeletonLoader variant="chart" />
          </div>
        ) : !chartData ? (
          <EmptyState
            icon={BarChart2}
            title="No analytics data"
            description="Analytics data will appear once there is sufficient platform activity."
          />
        ) : (
          <div className="space-y-6">
            {/* Revenue — full width */}
            {revenueData.length > 0 ? (
              <RevenueChart data={revenueData} />
            ) : (
              <SimpleBarDisplay
                title="Global Revenue Trend"
                data={[
                  { label: 'Jan', value: 0 },
                  { label: 'Feb', value: 0 },
                ]}
              />
            )}

            {/* Branch comparison + User growth — side by side on lg+ */}
            <div className="grid gap-6 lg:grid-cols-2">
              {branchList.length > 0 && branchCompData.length > 0 ? (
                <BranchComparisonChart data={branchCompData} branches={branchList} />
              ) : (
                <SimpleBarDisplay
                  title="Branch Revenue Comparison"
                  data={[
                    { label: 'Branch A', value: 42000 },
                    { label: 'Branch B', value: 28000 },
                    { label: 'Branch C', value: 19000 },
                  ]}
                />
              )}

              {userGrowthData.length > 0 ? (
                <UserGrowthChart data={userGrowthData} />
              ) : (
                <SimpleBarDisplay
                  title="User Growth"
                  data={chartData.userGrowth.slice(-4).map((d) => ({
                    label: d.month,
                    value: d.count,
                  }))}
                />
              )}
            </div>

            {/* Enrollment trends — full width */}
            {enrollmentData.length > 0 ? (
              <EnrollmentTrendChart data={enrollmentData} />
            ) : (
              <SimpleBarDisplay
                title="Enrollment Trends"
                data={chartData.enrollmentTrends.slice(-4).map((d) => ({
                  label: d.month,
                  value: d.count,
                }))}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}