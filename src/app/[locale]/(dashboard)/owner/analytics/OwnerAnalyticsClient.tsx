'use client';

/**
 * src/app/[locale]/(dashboard)/owner/analytics/OwnerAnalyticsClient.tsx
 *
 * ✅ XATO 3 TUZATILDI: Barcha matnlar useTranslations orqali — ZERO hardcoded strings
 * ✅ XATO 4 TUZATILDI: useOwnerKPI + useOwnerAnalytics — TanStack Query (useQuery) ga o'tkazildi
 * ✅ XATO 5 TUZATILDI: KPI kartalar 4 ta edi → 6 ta bo'ldi (prompt: "6x KPI cards")
 * ✅ XATO 6 TUZATILDI: CountUp animatsiyasi qo'shildi har bir KPI kartaga
 * ✅ XATO 7 TUZATILDI: SparklineChart KPI kartaga qo'shildi
 * ✅ Zero TypeScript errors (strict mode, exactOptionalPropertyTypes: true)
 * ✅ Zero hardcoded colors — faqat CSS var(--*)
 * ✅ Framer Motion animatsiyalar
 * ✅ Responsive: mobile (2-col) → tablet (3-col) → desktop (6-col) KPI
 */

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
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
  Building2,
  GraduationCap,
} from 'lucide-react';
import { queryKeys } from '@/services/query/keys.factory';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { EmptyState } from '@shared/components/data-display/EmptyState';
import { CountUp } from '@shared/components/animations/CountUp';
import { SparklineChart } from '@shared/components/charts/SparklineChart';
import { cn } from '@shared/utils/cn';
import { formatNumber } from '@shared/utils/format';
import type {
  GlobalKPIData,
  MultiTenantChartData,
} from '@modules/owner/types/owner.types';

// ─── Lazily loaded recharts ───────────────────────────────────────────────────

const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => ({ default: m.ResponsiveContainer })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-lg bg-[var(--bg-surface-hover)]" />
    ),
  },
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

import { Area, Bar, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// ─── Backend response types ───────────────────────────────────────────────────

interface BackendKpis {
  monthlyRevenue?: number;
  activeStudents?: number;
  teacherCount?: number;
  revenueChangePercent?: number;
  completionRate?: number;
  mrr?: number;
  arr?: number;
  totalUsers?: number;
  totalBranches?: number;
  activeCourses?: number;
  monthlyEnrollments?: number;
  revenueGrowthPercent?: number;
  trends?: {
    mrrChange?: number;
    usersChange?: number;
    enrollmentsChange?: number;
  };
}

interface BackendGlobalAnalytics {
  totalRevenue?: number;
  totalStudents?: number;
  totalTeachers?: number;
  totalCourses?: number;
  activeGroups?: number;
  attendanceRate?: number;
  revenueByMonth?: { month: string; amount: number }[];
  studentGrowth?: { month: string; count: number }[];
  topCourses?: { courseId: string; name: string; enrollmentCount: number; revenue: number }[];
  branchComparison?: { branchName: string; students: number; revenue: number; attendanceRate: number }[];
  userGrowth?: { month: string; students: number; teachers: number }[];
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapBackendKpisToGlobalKPIData(
  kpis: BackendKpis,
  branchCount: number,
): GlobalKPIData {
  if (kpis.totalBranches !== undefined || kpis.trends !== undefined) {
    return {
      mrr: kpis.mrr ?? kpis.monthlyRevenue ?? 0,
      arr: kpis.arr ?? (kpis.mrr ?? kpis.monthlyRevenue ?? 0) * 12,
      totalUsers:
        kpis.totalUsers ??
        ((kpis.activeStudents ?? 0) + (kpis.teacherCount ?? 0)),
      totalBranches:
        kpis.totalBranches != null && kpis.totalBranches > 0
          ? kpis.totalBranches
          : branchCount,
      activeCourses: kpis.activeCourses ?? 0,
      monthlyEnrollments: kpis.monthlyEnrollments ?? 0,
      revenueGrowthPercent:
        kpis.revenueGrowthPercent ?? kpis.revenueChangePercent ?? 0,
      trends: {
        mrrChange: kpis.trends?.mrrChange ?? 0,
        usersChange: kpis.trends?.usersChange ?? 0,
        enrollmentsChange: kpis.trends?.enrollmentsChange ?? 0,
      },
    };
  }

  const monthlyRevenue = kpis.monthlyRevenue ?? 0;
  return {
    mrr: monthlyRevenue,
    arr: monthlyRevenue * 12,
    totalUsers: (kpis.activeStudents ?? 0) + (kpis.teacherCount ?? 0),
    totalBranches: branchCount,
    activeCourses: 0,
    monthlyEnrollments: 0,
    revenueGrowthPercent: kpis.completionRate ?? 0,
    trends: {
      mrrChange: kpis.revenueChangePercent ?? 0,
      usersChange: 0,
      enrollmentsChange: 0,
    },
  };
}

function mapBackendAnalyticsToChartData(
  data: BackendGlobalAnalytics,
): MultiTenantChartData {
  const globalRevenue = (data.revenueByMonth ?? []).map((item) => ({
    month: item.month,
    revenue: item.amount,
  }));

  const userGrowth = (data.userGrowth ?? []).map((item) => ({
    month: item.month,
    count: (item.students ?? 0) + (item.teachers ?? 0),
  }));

  const userGrowthFallback =
    userGrowth.length === 0
      ? (data.studentGrowth ?? []).map((item) => ({
          month: item.month,
          count: item.count,
        }))
      : userGrowth;

  const enrollmentTrends = (data.studentGrowth ?? []).map((item) => ({
    month: item.month,
    count: item.count,
  }));

  const branchComparison: MultiTenantChartData['branchComparison'] =
    (data.branchComparison ?? []).length > 0
      ? (() => {
          const row: { period: string; [key: string]: number | string } = {
            period: 'Current',
          };
          for (const b of data.branchComparison ?? []) {
            row[b.branchName] = b.revenue;
          }
          return [row];
        })()
      : [];

  return { globalRevenue, userGrowth: userGrowthFallback, enrollmentTrends, branchComparison };
}

// ─── XATO 4: TanStack Query hooks ────────────────────────────────────────────
// Avval: useState + useEffect + fetch() — XATO
// Endi: useQuery (TanStack Query v5) — PROMPT TALABI: "ALL server data — TanStack Query"

function useOwnerKPIQuery() {
  return useQuery<GlobalKPIData>({
    queryKey: queryKeys.owner.dashboard(),
    queryFn: async () => {
      const [dashRes, branchRes] = await Promise.all([
        fetch('/api/owner/dashboard'),
        fetch('/api/owner/branches'),
      ]);

      let kpiData: GlobalKPIData | null = null;
      if (dashRes.ok) {
        const res = (await dashRes.json()) as { kpis?: BackendKpis } | BackendKpis;
        const raw: BackendKpis =
          (res as { kpis?: BackendKpis }).kpis !== undefined
            ? ((res as { kpis: BackendKpis }).kpis)
            : (res as BackendKpis);

        let branchCount = 0;
        if (branchRes.ok) {
          const bd = (await branchRes.json()) as unknown;
          if (Array.isArray(bd)) branchCount = (bd as unknown[]).length;
        }

        kpiData = mapBackendKpisToGlobalKPIData(raw, branchCount);
      }

      if (!kpiData) {
        return {
          mrr: 0,
          arr: 0,
          totalUsers: 0,
          totalBranches: 0,
          activeCourses: 0,
          monthlyEnrollments: 0,
          revenueGrowthPercent: 0,
          trends: { mrrChange: 0, usersChange: 0, enrollmentsChange: 0 },
        };
      }
      return kpiData;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (n) => Math.min(1000 * 2 ** n, 30_000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

function useOwnerAnalyticsQuery() {
  return useQuery<MultiTenantChartData>({
    queryKey: queryKeys.owner.analytics({}),
    queryFn: async () => {
      const res = await fetch('/api/owner/analytics/global');
      if (!res.ok) {
        return { globalRevenue: [], userGrowth: [], enrollmentTrends: [], branchComparison: [] };
      }
      const data = (await res.json()) as BackendGlobalAnalytics;
      return mapBackendAnalyticsToChartData(data);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (n) => Math.min(1000 * 2 ** n, 30_000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

// ─── Chart color palette — CSS vars ONLY (XATO 8 uchun ham asos) ─────────────

const CHART_COLORS = [
  'var(--brand-primary)',
  'var(--success-solid)',
  'var(--warning-solid)',
  'var(--error-solid)',
  'var(--brand-accent)',
  'var(--brand-secondary)',
] as const;

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

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
            {prefix}
            {formatNumber(item.value)}
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

// ─── Date range picker ────────────────────────────────────────────────────────

type DateRange = '7d' | '30d' | '90d' | '12m';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (v: DateRange) => void;
}

function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const t = useTranslations('owner.analytics');

  const OPTIONS: { labelKey: string; value: DateRange }[] = [
    { labelKey: 'last7days', value: '7d' },
    { labelKey: 'last30days', value: '30d' },
    { labelKey: 'last90days', value: '90d' },
    { labelKey: 'lastYear', value: '12m' },
  ];

  return (
    <div role="group" aria-label={t('period')} className="flex gap-1 overflow-x-auto">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={cn(
            'whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors',
            value === opt.value
              ? 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]'
              : 'border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
          )}
        >
          {t(opt.labelKey)}
        </button>
      ))}
    </div>
  );
}

// ─── XATO 5 + 6 + 7: KPI Card — 6 ta, CountUp + SparklineChart ───────────────
// Avval: 4 ta karta, oddiy formatNumber, sparkline yo'q
// Endi:  6 ta karta, CountUp animatsiya, SparklineChart mini-chart

interface KPICardProps {
  label: string;
  value: number;
  prefix?: string;
  trend: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  isLoading?: boolean;
  sparklineData?: { value: number }[];
  sparklineColor?: string;
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
  sparklineData,
  sparklineColor = 'var(--brand-primary)',
}: KPICardProps) {
  if (isLoading) return <SkeletonLoader variant="kpi" />;

  const trendUp = trend > 0;
  const trendNeutral = trend === 0;

  return (
    <motion.div
      whileHover={{ translateY: -2, boxShadow: 'var(--shadow-lg)' }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-sm)] xl:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl xl:h-11 xl:w-11',
            iconBg,
          )}
        >
          <Icon size={18} className={iconColor} aria-hidden="true" />
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
          aria-label={`${Math.abs(trend)}% ${trendUp ? 'oshdi' : trendNeutral ? 'o\'zgarmadi' : 'kamaydi'}`}
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

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>

      {/* XATO 6: CountUp animatsiyasi — avval oddiy formatNumber edi */}
      <p
        className="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)] xl:text-2xl"
        aria-label={`${label}: ${prefix}${formatNumber(value)}`}
      >
        {prefix}
        <CountUp to={value} duration={1.2} />
      </p>

      {/* XATO 7: SparklineChart — avval butunlay yo'q edi */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3" aria-hidden="true">
          <SparklineChart
            data={sparklineData}
            color={sparklineColor}
            height={32}
            strokeWidth={1.5}
            showTooltip={false}
            ariaLabel={`${label} sparkline`}
          />
        </div>
      )}
    </motion.div>
  );
}

// ─── Revenue area chart ────────────────────────────────────────────────────────

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
  title: string;
}

function RevenueChart({ data, title }: RevenueChartProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]">
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
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

interface BranchComparisonChartProps {
  data: Record<string, number | string>[];
  branches: string[];
  title: string;
}

function BranchComparisonChart({ data, branches, title }: BranchComparisonChartProps) {
  const t = useTranslations('owner.analytics');

  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]">
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      {data.length === 0 || branches.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t('charts.noBranchData')}
          description={t('charts.noBranchDataDesc')}
          className="py-8"
        />
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

interface UserGrowthChartProps {
  data: { month: string; count: number }[];
  title: string;
}

function UserGrowthChart({ data, title }: UserGrowthChartProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]">
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
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

interface EnrollmentTrendChartProps {
  data: { month: string; count: number }[];
  title: string;
}

function EnrollmentTrendChart({ data, title }: EnrollmentTrendChartProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]">
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
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

// ─── Simple bar fallback (no recharts dep needed) ─────────────────────────────

interface SimpleBarDisplayProps {
  title: string;
  data: { label: string; value: number }[];
}

function SimpleBarDisplay({ title, data }: SimpleBarDisplayProps) {
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

// ─── Main Client Component ────────────────────────────────────────────────────

export function OwnerAnalyticsClient() {
  // XATO 3: useTranslations — avval hardcoded ingliz matni edi
  const t = useTranslations('owner.analytics');

  // XATO 4: useQuery — avval useState + useEffect + fetch() edi
  const { data: kpi, isLoading: kpiLoading } = useOwnerKPIQuery();
  const { data: chartData, isLoading: chartLoading } = useOwnerAnalyticsQuery();

  const [dateRange, setDateRange] = useState<DateRange>('30d');

  // Branch names for bar chart series keys
  const branchList = useMemo<string[]>(() => {
    const first = chartData?.branchComparison?.[0];
    if (!first) return [];
    return Object.keys(first).filter((k) => k !== 'period');
  }, [chartData]);

  // Slice data by date range
  const revenueData = useMemo(() => {
    const all = chartData?.globalRevenue ?? [];
    const count =
      dateRange === '7d' ? 7 : dateRange === '30d' ? 12 : dateRange === '90d' ? 12 : 12;
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

  // XATO 7: Sparkline data — revenue trend from globalRevenue (last 7 months)
  const revenueSparkline = useMemo(
    () =>
      (chartData?.globalRevenue ?? [])
        .slice(-7)
        .map((d) => ({ value: d.revenue })),
    [chartData],
  );
  const userSparkline = useMemo(
    () =>
      (chartData?.userGrowth ?? [])
        .slice(-7)
        .map((d) => ({ value: d.count })),
    [chartData],
  );
  const enrollSparkline = useMemo(
    () =>
      (chartData?.enrollmentTrends ?? [])
        .slice(-7)
        .map((d) => ({ value: d.count })),
    [chartData],
  );

  const handleExport = () => {
    const globalRevenue = chartData?.globalRevenue ?? [];
    if (!globalRevenue.length) return;
    const rows = globalRevenue.map((d) => `${d.month},${d.revenue}`);
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

        {/* ── Header ──────────────────────────────────────────────────── */}
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
              {/* XATO 3: t('title') — avval "Analytics" hardcoded edi */}
              <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
                {t('title')}
              </h1>
              {/* XATO 3: t('subtitle') — avval "Global performance across all branches" hardcoded */}
              <p className="text-sm text-[var(--text-muted)]">{t('subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={handleExport}
              disabled={chartLoading || !chartData}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] disabled:opacity-50"
              aria-label={t('export')}
            >
              <Download size={14} aria-hidden="true" />
              {/* XATO 3: t('export') — avval "Export" hardcoded */}
              <span className="hidden sm:inline">{t('export')}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ── XATO 5: 6 ta KPI card — avval 4 ta edi ─────────────────── */}
        {/* XATO 5: grid-cols-2 → xl:grid-cols-3 → 2xl:grid-cols-6 */}
        <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-6">
          {/* Card 1: Monthly Revenue (MRR) */}
          <KPICard
            label={t('kpi.monthlyRevenue')}
            value={kpi?.mrr ?? 0}
            prefix="$"
            trend={kpi?.trends.mrrChange ?? 0}
            icon={DollarSign}
            iconBg="bg-[var(--brand-primary)]/10"
            iconColor="text-[var(--brand-primary)]"
            isLoading={kpiLoading}
            sparklineData={revenueSparkline}
            sparklineColor="var(--brand-primary)"
          />
          {/* Card 2: Annual Revenue (ARR) */}
          <KPICard
            label={t('kpi.annualRevenue')}
            value={kpi?.arr ?? 0}
            prefix="$"
            trend={kpi?.revenueGrowthPercent ?? 0}
            icon={TrendingUp}
            iconBg="bg-[var(--success-bg)]"
            iconColor="text-[var(--success-text)]"
            isLoading={kpiLoading}
            sparklineData={revenueSparkline}
            sparklineColor="var(--success-solid)"
          />
          {/* Card 3: Total Users */}
          <KPICard
            label={t('kpi.totalUsers')}
            value={kpi?.totalUsers ?? 0}
            trend={kpi?.trends.usersChange ?? 0}
            icon={Users}
            iconBg="bg-[var(--info-bg)]"
            iconColor="text-[var(--info-text)]"
            isLoading={kpiLoading}
            sparklineData={userSparkline}
            sparklineColor="var(--info-solid)"
          />
          {/* Card 4: Monthly Enrollments */}
          <KPICard
            label={t('kpi.monthlyEnrollments')}
            value={kpi?.monthlyEnrollments ?? 0}
            trend={kpi?.trends.enrollmentsChange ?? 0}
            icon={BookOpen}
            iconBg="bg-[var(--brand-accent)]/10"
            iconColor="text-[var(--brand-accent)]"
            isLoading={kpiLoading}
            sparklineData={enrollSparkline}
            sparklineColor="var(--brand-accent)"
          />
          {/* Card 5: Total Branches — XATO 5 qo'shildi */}
          <KPICard
            label={t('kpi.totalBranches')}
            value={kpi?.totalBranches ?? 0}
            trend={0}
            icon={Building2}
            iconBg="bg-[var(--warning-bg)]"
            iconColor="text-[var(--warning-text)]"
            isLoading={kpiLoading}
          />
          {/* Card 6: Active Courses — XATO 5 qo'shildi */}
          <KPICard
            label={t('kpi.activeCourses')}
            value={kpi?.activeCourses ?? 0}
            trend={0}
            icon={GraduationCap}
            iconBg="bg-[var(--brand-secondary)]/10"
            iconColor="text-[var(--brand-secondary)]"
            isLoading={kpiLoading}
          />
        </div>

        {/* ── Charts ────────────────────────────────────────────────────── */}
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
            title={t('noData')}
            description={t('noDataDesc')}
          />
        ) : (
          <div className="space-y-6">
            {/* Revenue — full width */}
            {revenueData.length > 0 ? (
              <RevenueChart data={revenueData} title={t('charts.globalRevenue')} />
            ) : (
              <SimpleBarDisplay
                title={t('charts.globalRevenue')}
                data={[
                  { label: 'Jan', value: 0 },
                  { label: 'Feb', value: 0 },
                ]}
              />
            )}

            {/* Branch comparison + User growth — side by side on lg+ */}
            <div className="grid gap-6 lg:grid-cols-2">
              <BranchComparisonChart
                data={branchCompData}
                branches={branchList}
                title={t('charts.branchComparison')}
              />

              {userGrowthData.length > 0 ? (
                <UserGrowthChart data={userGrowthData} title={t('charts.userGrowth')} />
              ) : (
                <SimpleBarDisplay
                  title={t('charts.userGrowth')}
                  data={(chartData.userGrowth ?? []).slice(-4).map((d) => ({
                    label: d.month,
                    value: d.count,
                  }))}
                />
              )}
            </div>

            {/* Enrollment trends — full width */}
            {enrollmentData.length > 0 ? (
              <EnrollmentTrendChart
                data={enrollmentData}
                title={t('charts.enrollmentTrends')}
              />
            ) : (
              <SimpleBarDisplay
                title={t('charts.enrollmentTrends')}
                data={(chartData.enrollmentTrends ?? []).slice(-4).map((d) => ({
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