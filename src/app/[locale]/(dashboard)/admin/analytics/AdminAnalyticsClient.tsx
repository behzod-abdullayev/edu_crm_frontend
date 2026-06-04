'use client';

/**
 * AdminAnalyticsClient — Admin Analytics Dashboard
 *
 * Uses AdminAnalyticsData from admin.api.ts which has:
 *   revenue  { total, monthly, currency, trend[] }
 *   students { total, active, new }
 *   attendance { rate, trend[] }
 *
 * NOTE: AdminAnalyticsData does NOT have students.growth or courses.active —
 * those live in the richer AdminAnalytics type from analytics.api.ts.
 * We fall back to zeros for missing fields and skip the growth chart.
 *
 * Fixes applied vs initial version:
 *  1. KPICardProps.trend is `number` (not optional) → pass 0 when no trend data
 *  2. `courses` field doesn't exist on AdminAnalyticsData → removed KPI card
 *     or replaced with student `new` count
 *  3. `students.growth` doesn't exist → empty array for that chart
 *  4. Framer Motion props built with conditional spreads (exactOptionalPropertyTypes)
 */

import { useState, lazy, Suspense } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, TrendingUp, CalendarRange } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useAdminAnalytics } from '@/services/query/admin.queries';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { SkeletonLoader } from '@/shared/components/feedback/SkeletonLoader';
import { ErrorState } from '@/shared/components/data-display/ErrorState';
import { CountUp } from '@/shared/components/animations/CountUp';

// ─── Lazy Recharts ────────────────────────────────────────────────────────────

const ResponsiveContainer = lazy(() =>
  import('recharts').then((m) => ({ default: m.ResponsiveContainer })),
);
const AreaChart = lazy(() =>
  import('recharts').then((m) => ({ default: m.AreaChart })),
);
/* eslint-disable @typescript-eslint/no-explicit-any */
const Area = lazy(() =>
  import('recharts').then((m) => ({ default: m.Area as unknown as React.ComponentType<any> })),
);
const BarChart = lazy(() =>
  import('recharts').then((m) => ({ default: m.BarChart })),
);
const Bar = lazy(() =>
  import('recharts').then((m) => ({ default: m.Bar as unknown as React.ComponentType<any> })),
);
const PieChart = lazy(() =>
  import('recharts').then((m) => ({ default: m.PieChart })),
);
const Pie = lazy(() =>
  import('recharts').then((m) => ({ default: m.Pie as unknown as React.ComponentType<any> })),
);
const Cell = lazy(() =>
  import('recharts').then((m) => ({ default: m.Cell })),
);
const XAxis = lazy(() =>
  import('recharts').then((m) => ({ default: m.XAxis })),
);
const YAxis = lazy(() =>
  import('recharts').then((m) => ({ default: m.YAxis })),
);
const CartesianGrid = lazy(() =>
  import('recharts').then((m) => ({ default: m.CartesianGrid })),
);
const Tooltip = lazy(() =>
  import('recharts').then((m) => ({ default: m.Tooltip as React.ComponentType<any> })),
);
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── i18n ─────────────────────────────────────────────────────────────────────

const I18N = {
  uz: {
    title: "Tahlillar",
    subtitle: "Platforma ishlash ko'rsatkichlari va tendentsiyalari",
    filterLabels: { '7d': 'Oxirgi 7 kun', '30d': 'Oxirgi 30 kun', '90d': 'Oxirgi 90 kun', '365d': 'Oxirgi 1 yil' },
    kpi: {
      revenue: "Umumiy daromad",
      students: "Jami talabalar",
      newStudents: "Yangi talabalar",
      attendance: "Davomat darajasi",
    },
    charts: {
      revenueTitle: "Daromad tendentsiyasi",
      attendanceTitle: "Davomat statistikasi",
      debtTitle: "To'lov holati",
    },
    currency: "so'm",
    paid: "To'langan",
    pending: "Kutilmoqda",
    overdue: "Muddati o'tgan",
    noData: "Ma'lumot yo'q",
  },
  en: {
    title: "Analytics",
    subtitle: "Platform performance metrics and trends",
    filterLabels: { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', '365d': 'Last 1 year' },
    kpi: {
      revenue: "Total Revenue",
      students: "Total Students",
      newStudents: "New Students",
      attendance: "Attendance Rate",
    },
    charts: {
      revenueTitle: "Revenue Trend",
      attendanceTitle: "Attendance Statistics",
      debtTitle: "Payment Status",
    },
    currency: "UZS",
    paid: "Paid",
    pending: "Pending",
    overdue: "Overdue",
    noData: "No data available",
  },
  ru: {
    title: "Аналитика",
    subtitle: "Показатели производительности платформы и тренды",
    filterLabels: { '7d': 'Последние 7 дней', '30d': 'Последние 30 дней', '90d': 'Последние 90 дней', '365d': 'Последний год' },
    kpi: {
      revenue: "Общий доход",
      students: "Всего студентов",
      newStudents: "Новые студенты",
      attendance: "Посещаемость",
    },
    charts: {
      revenueTitle: "Динамика дохода",
      attendanceTitle: "Статистика посещаемости",
      debtTitle: "Статус платежей",
    },
    currency: "сум",
    paid: "Оплачено",
    pending: "Ожидание",
    overdue: "Просрочено",
    noData: "Нет данных",
  },
} as const;

type Locale = keyof typeof I18N;
type FilterRange = '7d' | '30d' | '90d' | '365d';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rangeToDateParams(range: FilterRange): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  const days: Record<FilterRange, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
  from.setDate(from.getDate() - (days[range] ?? 30));
  return {
    from: from.toISOString().split('T')[0] ?? '',
    to: to.toISOString().split('T')[0] ?? '',
  };
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipEntry {
  dataKey?: string;
  name: string;
  value: number | string;
  color?: string;
  fill?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-sm"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}
    >
      {label && <p className="font-semibold text-[var(--text-primary)] mb-1.5 text-xs">{label}</p>}
      {payload.map((entry) => (
        <div key={entry.dataKey ?? entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color ?? entry.fill ?? 'var(--brand-primary)' }} aria-hidden="true" />
          <span className="text-[var(--text-muted)]">{entry.name}:</span>
          <span className="font-semibold text-[var(--text-primary)]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div style={{ height }} className="relative overflow-hidden rounded-xl" aria-hidden="true">
      <div className="absolute inset-0 rounded-xl" style={{ background: 'var(--bg-surface-secondary)' }} />
      <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[var(--bg-surface-hover)] to-transparent" />
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

// trend is required (use 0 if no real trend data) — avoids exactOptionalPropertyTypes issue
interface KPICardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: React.ElementType;
  iconColor: string;
  isLoading: boolean;
  trend: number;
  index: number;
}

function KPICard({ title, value, suffix, prefix, icon: Icon, iconColor, isLoading, trend, index }: KPICardProps) {
  if (isLoading) return <SkeletonLoader variant="kpi" />;
  const trendPositive = trend >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-lg)' }}
      whileTap={{ scale: 0.98 }}
      className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 flex flex-col gap-4 cursor-default"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${iconColor}20` }} aria-hidden="true">
          <Icon size={20} style={{ color: iconColor }} />
        </div>
        {trend !== 0 && (
          <span
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
            style={{
              color: trendPositive ? 'var(--success-text)' : 'var(--error-text)',
              background: trendPositive ? 'var(--success-bg)' : 'var(--error-bg)',
              border: `1px solid ${trendPositive ? 'var(--success-border)' : 'var(--error-border)'}`,
            }}
            aria-label={`Trend: ${trendPositive ? '+' : ''}${trend}%`}
          >
            {trendPositive ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wide">{title}</p>
        <div className="flex items-baseline gap-1">
          {prefix && <span className="text-lg font-semibold text-[var(--text-secondary)]">{prefix}</span>}
          <CountUp to={value} duration={1.2} className="text-3xl font-bold text-[var(--text-primary)] tabular-nums" />
          {suffix && <span className="text-sm font-medium text-[var(--text-muted)]">{suffix}</span>}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Chart Card ───────────────────────────────────────────────────────────────

function ChartCard({ title, children, isLoading, chartHeight = 260, index = 0 }: {
  title: string; children: React.ReactNode; isLoading: boolean; chartHeight?: number; index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.35 }}
      className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{title}</h3>
      {isLoading ? <ChartSkeleton height={chartHeight} /> : (
        <Suspense fallback={<ChartSkeleton height={chartHeight} />}>{children}</Suspense>
      )}
    </motion.div>
  );
}

// ─── Pie Legend ───────────────────────────────────────────────────────────────

interface PieLegendItem { label: string; value: number; color: string; }

function PieLegend({ items }: { items: PieLegendItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="flex flex-col gap-2 mt-3">
      {items.map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <div key={item.label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} aria-hidden="true" />
              <span className="text-xs text-[var(--text-secondary)] truncate">{item.label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-[var(--text-primary)] tabular-nums">{formatCurrency(item.value)}</span>
              <span className="text-xs text-[var(--text-muted)] tabular-nums w-10 text-right">{pct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminAnalyticsClient() {
  const locale = useLocale() as Locale;
  const s = I18N[locale in I18N ? locale : 'en'];
  const isMobile = useIsMobile();

  const [filterRange, setFilterRange] = useState<FilterRange>('30d');
  const dateParams = rangeToDateParams(filterRange);

  const { data, isLoading, error, refetch } = useAdminAnalytics(dateParams);

  const FILTER_RANGES: FilterRange[] = ['7d', '30d', '90d', '365d'];

  // AdminAnalyticsData shapes:
  //   revenue.trend:    Array<{ month: string; amount: number }>
  //   attendance.trend: Array<{ date: string; rate: number }>
  //   students:         { total, active, new } — NO .growth

  const revenueTrend = (data?.revenue.trend ?? []).map((d) => ({
    label: d.month,
    value: d.amount,
  }));

  const attendanceTrend = (data?.attendance.trend ?? []).map((d) => ({
    label: d.date,
    value: Math.round(d.rate * 100),
  }));

  const debtItems: PieLegendItem[] = [
    { label: s.paid, value: (data?.revenue.total ?? 0) - (data?.revenue.monthly ?? 0), color: 'var(--success-solid)' },
    { label: s.pending, value: data?.revenue.monthly ?? 0, color: 'var(--warning-solid)' },
    { label: s.overdue, value: 0, color: 'var(--error-solid)' },
  ];

  const chartHeight = isMobile ? 200 : 260;

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorState error={error instanceof Error ? error : new Error('Failed to load analytics')} onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 lg:p-6 max-w-[1400px] mx-auto">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-primary)]">{s.title}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{s.subtitle}</p>
        </div>

        {/* Date range filter */}
        <div
          className="flex items-center gap-1 p-1 rounded-[var(--radius-md)] overflow-x-auto"
          style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-default)' }}
          role="group"
          aria-label="Date range filter"
        >
          {FILTER_RANGES.map((range) => (
            <motion.button
              key={range}
              onClick={() => setFilterRange(range)}
              whileTap={{ scale: 0.96 }}
              aria-pressed={filterRange === range}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-all duration-[var(--transition-base)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] whitespace-nowrap"
              style={{
                background: filterRange === range ? 'var(--brand-primary)' : 'transparent',
                color: filterRange === range ? 'var(--text-on-brand)' : 'var(--text-secondary)',
              }}
            >
              {filterRange === range && <CalendarRange size={12} aria-hidden="true" />}
              {s.filterLabels[range]}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* KPI Cards — 4 columns */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title={s.kpi.revenue}
          value={data?.revenue.total ?? 0}
          suffix={` ${s.currency}`}
          icon={DollarSign}
          iconColor="var(--brand-primary)"
          isLoading={isLoading}
          trend={0}
          index={0}
        />
        <KPICard
          title={s.kpi.students}
          value={data?.students.total ?? 0}
          icon={Users}
          iconColor="var(--brand-secondary)"
          isLoading={isLoading}
          trend={0}
          index={1}
        />
        <KPICard
          title={s.kpi.newStudents}
          value={data?.students.new ?? 0}
          icon={Users}
          iconColor="var(--brand-accent)"
          isLoading={isLoading}
          trend={0}
          index={2}
        />
        <KPICard
          title={s.kpi.attendance}
          value={Math.round((data?.attendance.rate ?? 0) * 100)}
          suffix="%"
          icon={TrendingUp}
          iconColor="var(--success-solid)"
          isLoading={isLoading}
          trend={0}
          index={3}
        />
      </div>

      {/* Charts Row 1: Revenue + Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Revenue Area Chart */}
        <ChartCard title={s.charts.revenueTitle} isLoading={isLoading} chartHeight={chartHeight} index={0}>
          {revenueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: string) => isMobile ? v.slice(0, 3) : v} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCurrency(v)} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" name={s.kpi.revenue} stroke="var(--brand-primary)" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: 'var(--brand-primary)' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)]">{s.noData}</div>
          )}
        </ChartCard>

        {/* Attendance Bar Chart */}
        <ChartCard title={s.charts.attendanceTitle} isLoading={isLoading} chartHeight={chartHeight} index={1}>
          {attendanceTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={attendanceTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: string) => isMobile ? v.slice(0, 3) : v} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} width={36} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name={s.kpi.attendance} fill="var(--success-solid)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)]">{s.noData}</div>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2: Payment Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <ChartCard title={s.charts.debtTitle} isLoading={isLoading} chartHeight={chartHeight} index={2}>
            <div className="flex flex-col">
              <div style={{ height: isMobile ? 160 : 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={debtItems.map((item) => ({ name: item.label, value: item.value }))}
                      cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={3} dataKey="value"
                    >
                      {debtItems.map((item, i) => <Cell key={`cell-${i}`} fill={item.color} stroke="none" />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <PieLegend items={debtItems} />
            </div>
          </ChartCard>
        </div>

        {/* Summary stats */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36, duration: 0.35 }}
            className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 h-full"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: s.kpi.revenue, value: `${formatCurrency(data?.revenue.total ?? 0)} ${s.currency}` },
                { label: 'Monthly Revenue', value: `${formatCurrency(data?.revenue.monthly ?? 0)} ${s.currency}` },
                { label: s.kpi.students, value: `${data?.students.total ?? 0}` },
                { label: s.kpi.attendance, value: `${Math.round((data?.attendance.rate ?? 0) * 100)}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[var(--bg-surface-secondary)] rounded-xl p-3">
                  <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
                  <p className="text-base font-bold text-[var(--text-primary)] tabular-nums">{isLoading ? '—' : value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
