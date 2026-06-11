'use client';

// src/app/[locale]/(dashboard)/admin/analytics/AdminAnalyticsClient.tsx
//
// Uses AdminAnalyticsData from admin.api.ts (GET /admin/analytics), which returns:
//   revenueByMonth, enrollmentsByMonth, attendanceByMonth: Array<{ month, value }>
//   avgAttendanceRate, totalRevenue, totalEnrollments: number
// The date range filter is forwarded to the backend as from/to and controls how
// many monthly buckets are returned (clamped between 1 and 12).

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
      newStudents: "Yangi talabalar",
      attendance: "Davomat darajasi",
    },
    charts: {
      revenueTitle: "Daromad tendentsiyasi",
      enrollmentsTitle: "Yangi talabalar tendentsiyasi",
      attendanceTitle: "Davomat statistikasi",
    },
    currency: "so'm",
    noData: "Ma'lumot yo'q",
  },
  en: {
    title: "Analytics",
    subtitle: "Platform performance metrics and trends",
    filterLabels: { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', '365d': 'Last 1 year' },
    kpi: {
      revenue: "Total Revenue",
      newStudents: "New Students",
      attendance: "Attendance Rate",
    },
    charts: {
      revenueTitle: "Revenue Trend",
      enrollmentsTitle: "New Students Trend",
      attendanceTitle: "Attendance Statistics",
    },
    currency: "UZS",
    noData: "No data available",
  },
  ru: {
    title: "Аналитика",
    subtitle: "Показатели производительности платформы и тренды",
    filterLabels: { '7d': 'Последние 7 дней', '30d': 'Последние 30 дней', '90d': 'Последние 90 дней', '365d': 'Последний год' },
    kpi: {
      revenue: "Общий доход",
      newStudents: "Новые студенты",
      attendance: "Посещаемость",
    },
    charts: {
      revenueTitle: "Динамика дохода",
      enrollmentsTitle: "Динамика новых студентов",
      attendanceTitle: "Статистика посещаемости",
    },
    currency: "сум",
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

interface KPICardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: React.ElementType;
  iconColor: string;
  isLoading: boolean;
  index: number;
}

function KPICard({ title, value, suffix, prefix, icon: Icon, iconColor, isLoading, index }: KPICardProps) {
  if (isLoading) return <SkeletonLoader variant="kpi" />;
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
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${iconColor}20` }} aria-hidden="true">
        <Icon size={20} style={{ color: iconColor }} />
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminAnalyticsClient() {
  const locale = useLocale() as Locale;
  const s = I18N[locale in I18N ? locale : 'en'];
  const isMobile = useIsMobile();

  const [filterRange, setFilterRange] = useState<FilterRange>('30d');
  const dateParams = rangeToDateParams(filterRange);

  const { data, isLoading, error, refetch } = useAdminAnalytics(dateParams);

  const FILTER_RANGES: FilterRange[] = ['7d', '30d', '90d', '365d'];

  const revenueTrend = (data?.revenueByMonth ?? []).map((d) => ({
    label: d.month,
    value: d.value,
  }));

  const enrollmentsTrend = (data?.enrollmentsByMonth ?? []).map((d) => ({
    label: d.month,
    value: d.value,
  }));

  const attendanceTrend = (data?.attendanceByMonth ?? []).map((d) => ({
    label: d.month,
    value: Math.round(d.value),
  }));

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

      {/* KPI Cards — 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KPICard
          title={s.kpi.revenue}
          value={data?.totalRevenue ?? 0}
          suffix={` ${s.currency}`}
          icon={DollarSign}
          iconColor="var(--brand-primary)"
          isLoading={isLoading}
          index={0}
        />
        <KPICard
          title={s.kpi.newStudents}
          value={data?.totalEnrollments ?? 0}
          icon={Users}
          iconColor="var(--brand-secondary)"
          isLoading={isLoading}
          index={1}
        />
        <KPICard
          title={s.kpi.attendance}
          value={Math.round(data?.avgAttendanceRate ?? 0)}
          suffix="%"
          icon={TrendingUp}
          iconColor="var(--success-solid)"
          isLoading={isLoading}
          index={2}
        />
      </div>

      {/* Charts Row 1: Revenue + New Students */}
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
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: string) => isMobile ? v.slice(5) : v} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCurrency(v)} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" name={s.kpi.revenue} stroke="var(--brand-primary)" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: 'var(--brand-primary)' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)]">{s.noData}</div>
          )}
        </ChartCard>

        {/* New Students Bar Chart */}
        <ChartCard title={s.charts.enrollmentsTitle} isLoading={isLoading} chartHeight={chartHeight} index={1}>
          {enrollmentsTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={enrollmentsTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: string) => isMobile ? v.slice(5) : v} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={36} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name={s.kpi.newStudents} fill="var(--brand-secondary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)]">{s.noData}</div>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2: Attendance */}
      <ChartCard title={s.charts.attendanceTitle} isLoading={isLoading} chartHeight={chartHeight} index={2}>
        {attendanceTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={attendanceTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: string) => isMobile ? v.slice(5) : v} />
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
  );
}
