'use client';

import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import type { TooltipProps } from 'recharts';
import type {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';
import type { Locale as DateFnsLocale } from 'date-fns';
import { cn } from '@shared/utils/cn';
import type { AdminDashboardData } from '../types/admin.types';
import { mapActivityItemToDisplay } from '../utils/admin.mapper';

// ─── Lazy-loaded Recharts ─────────────────────────────────────────────────────

const AreaChart = lazy(() =>
  import('recharts').then((m) => ({
    default: m.AreaChart as React.ComponentType<
      React.ComponentProps<typeof m.AreaChart>
    >,
  })),
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Area = lazy(() =>
  import('recharts').then((m) => ({
    default: m.Area as unknown as React.ComponentType<React.ComponentProps<typeof m.Area>>,
  })),
);
const XAxis = lazy(() =>
  import('recharts').then((m) => ({
    default: m.XAxis as React.ComponentType<
      React.ComponentProps<typeof m.XAxis>
    >,
  })),
);
const YAxis = lazy(() =>
  import('recharts').then((m) => ({
    default: m.YAxis as React.ComponentType<
      React.ComponentProps<typeof m.YAxis>
    >,
  })),
);
const CartesianGrid = lazy(() =>
  import('recharts').then((m) => ({
    default: m.CartesianGrid as React.ComponentType<
      React.ComponentProps<typeof m.CartesianGrid>
    >,
  })),
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Tooltip = lazy(() =>
  import('recharts').then((m) => ({
    default: m.Tooltip as React.ComponentType<React.ComponentProps<typeof m.Tooltip>>,
  })),
);
const ResponsiveContainer = lazy(() =>
  import('recharts').then((m) => ({
    default: m.ResponsiveContainer as React.ComponentType<
      React.ComponentProps<typeof m.ResponsiveContainer>
    >,
  })),
);
const BarChart = lazy(() =>
  import('recharts').then((m) => ({
    default: m.BarChart as React.ComponentType<
      React.ComponentProps<typeof m.BarChart>
    >,
  })),
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Bar = lazy(() =>
  import('recharts').then((m) => ({
    default: m.Bar as unknown as React.ComponentType<React.ComponentProps<typeof m.Bar>>,
  })),
);
const PieChart = lazy(() =>
  import('recharts').then((m) => ({
    default: m.PieChart as React.ComponentType<
      React.ComponentProps<typeof m.PieChart>
    >,
  })),
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Pie = lazy(() =>
  import('recharts').then((m) => ({
    default: m.Pie as unknown as React.ComponentType<React.ComponentProps<typeof m.Pie>>,
  })),
);
const Cell = lazy(() =>
  import('recharts').then((m) => ({
    default: m.Cell as React.ComponentType<
      React.ComponentProps<typeof m.Cell>
    >,
  })),
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OperationalDashboardStrings {
  kpi: {
    students: string;
    teachers: string;
    courses: string;
    revenue: string;
    enrollments: string;
    pending: string;
  };
  kpiListAria: string;
  vsLastMonth: string;
  trendUp: string;
  trendDown: string;
  charts: {
    revenue: string;
    enrollments: string;
    attendanceByGroup: string;
    paymentStatus: string;
  };
  debt: {
    paid: string;
    pending: string;
    overdue: string;
  };
  attendanceTooltip: string;
  paymentLegendAria: string;
  quickActions: {
    createCourse: string;
    addTeacher: string;
    addStudent: string;
    viewReports: string;
  };
  quickActionsAria: string;
  recentActivity: string;
  recentActivityAria: string;
  recentActivityListAria: string;
  noRecentActivity: string;
}

export interface OperationalDashboardProps {
  data: AdminDashboardData;
  /** Called when the user clicks a quick-action button. */
  onNavigate: (path: string) => void;
  strings: OperationalDashboardStrings;
  dateLocale: DateFnsLocale;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIE_COLORS: [string, string, string] = [
  'var(--success-solid)',
  'var(--warning-solid)',
  'var(--error-solid)',
];

const QUICK_ACTIONS_CONFIG = [
  { key: 'createCourse', path: '/admin/courses',  icon: '📚' },
  { key: 'addTeacher',   path: '/admin/teachers', icon: '👨‍🏫' },
  { key: 'addStudent',   path: '/admin/students', icon: '🎓' },
  { key: 'viewReports',  path: '/admin/reports',  icon: '📊' },
] as const;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div
      className="h-full w-full overflow-hidden rounded-lg"
      style={{
        background: `linear-gradient(
          90deg,
          var(--bg-surface-hover) 25%,
          var(--bg-surface)       50%,
          var(--bg-surface-hover) 75%
        )`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s linear infinite',
      }}
      aria-hidden="true"
      role="presentation"
    />
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-xs shadow-[var(--shadow-md)]"
      role="tooltip"
    >
      {label !== undefined && (
        <p className="mb-1 font-semibold text-[var(--text-secondary)]">
          {String(label)}
        </p>
      )}
      {payload.map((entry, i) => (
        <p
          key={i}
          className="tabular-nums text-[var(--text-primary)]"
        >
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full"
            style={{
              backgroundColor: entry.color ?? 'var(--brand-primary)',
            }}
            aria-hidden="true"
          />
          {entry.value !== undefined
            ? typeof entry.value === 'number'
              ? entry.value.toLocaleString()
              : String(entry.value)
            : '—'}
        </p>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: number;
  trend: number;
  suffix?: string | undefined;
  index: number;
  vsLastMonth: string;
  trendUpLabel: string;
  trendDownLabel: string;
}

function KPICard({
  label,
  value,
  trend,
  suffix,
  index,
  vsLastMonth,
  trendUpLabel,
  trendDownLabel,
}: KPICardProps) {
  const isPositive = trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{
        y: -2,
        boxShadow: 'var(--shadow-md)',
        transition: { duration: 0.2, ease: 'easeOut' },
      }}
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
      role="region"
      aria-label={`${label}: ${value.toLocaleString()}${suffix ? ' ' + suffix : ''}`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.06 + 0.1 }}
        className="mt-2 text-3xl font-bold tabular-nums text-[var(--text-primary)]"
      >
        {value.toLocaleString()}
        {suffix && (
          <span className="ml-1 text-base font-normal text-[var(--text-muted)]">
            {suffix}
          </span>
        )}
      </motion.p>

      <p
        className={cn(
          'mt-1 flex items-center gap-1 text-xs font-medium',
          isPositive
            ? 'text-[var(--success-text)]'
            : 'text-[var(--error-text)]',
        )}
        aria-label={`${isPositive ? trendUpLabel : trendDownLabel} ${Math.abs(trend)}% ${vsLastMonth}`}
      >
        <span aria-hidden="true">{isPositive ? '↑' : '↓'}</span>
        {Math.abs(trend)}% {vsLastMonth}
      </p>
    </motion.div>
  );
}

// ─── Chart Card ───────────────────────────────────────────────────────────────

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

function ChartCard({
  title,
  children,
  className,
  delay = 0,
}: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className={cn(
        'rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4',
        className,
      )}
    >
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

// ─── OperationalDashboard ─────────────────────────────────────────────────────

export function OperationalDashboard({
  data,
  onNavigate,
  strings,
  dateLocale,
}: OperationalDashboardProps) {
  const attendanceFormatter = (
    v: ValueType,
    _n: NameType,
  ): [string, string] => [`${v}%`, strings.attendanceTooltip];

  const debtData: Array<{ name: string; value: number }> = [
    { name: strings.debt.paid,    value: data.debtBreakdown.paid },
    { name: strings.debt.pending, value: data.debtBreakdown.pending },
    { name: strings.debt.overdue, value: data.debtBreakdown.overdue },
  ];

  const recentItems = data.recentActivity.map((item) =>
    mapActivityItemToDisplay(item, dateLocale),
  );

  const kpiItems: Array<KPICardProps> = [
    {
      label: strings.kpi.students,
      value: data.totalStudents,
      trend: data.trends.studentsChange,
      index: 0,
      vsLastMonth: strings.vsLastMonth,
      trendUpLabel: strings.trendUp,
      trendDownLabel: strings.trendDown,
    },
    {
      label: strings.kpi.teachers,
      value: data.totalTeachers,
      trend: data.trends.teachersChange,
      index: 1,
      vsLastMonth: strings.vsLastMonth,
      trendUpLabel: strings.trendUp,
      trendDownLabel: strings.trendDown,
    },
    {
      label: strings.kpi.courses,
      value: data.totalCourses,
      trend: 0,
      index: 2,
      vsLastMonth: strings.vsLastMonth,
      trendUpLabel: strings.trendUp,
      trendDownLabel: strings.trendDown,
    },
    {
      label: strings.kpi.revenue,
      value: data.monthlyRevenue,
      trend: data.trends.revenueChange,
      suffix: 'UZS',
      index: 3,
      vsLastMonth: strings.vsLastMonth,
      trendUpLabel: strings.trendUp,
      trendDownLabel: strings.trendDown,
    },
    {
      label: strings.kpi.enrollments,
      value: data.newEnrollments,
      trend: data.trends.enrollmentChange,
      index: 4,
      vsLastMonth: strings.vsLastMonth,
      trendUpLabel: strings.trendUp,
      trendDownLabel: strings.trendDown,
    },
    {
      label: strings.kpi.pending,
      value: data.pendingPayments,
      trend: 0,
      index: 5,
      vsLastMonth: strings.vsLastMonth,
      trendUpLabel: strings.trendUp,
      trendDownLabel: strings.trendDown,
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── KPI Grid ───────────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"
        role="list"
        aria-label={strings.kpiListAria}
      >
        {kpiItems.map((item) => (
          <div key={item.label} role="listitem">
            <KPICard
              label={item.label}
              value={item.value}
              trend={item.trend}
              suffix={item.suffix}
              index={item.index}
              vsLastMonth={item.vsLastMonth}
              trendUpLabel={item.trendUpLabel}
              trendDownLabel={item.trendDownLabel}
            />
          </div>
        ))}
      </div>

      {/* ── Charts Grid ────────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Revenue — Area Chart */}
        <ChartCard title={strings.charts.revenue} delay={0.1}>
          <div className="h-56">
            <Suspense fallback={<ChartSkeleton />}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueHistory}>
                  <defs>
                    <linearGradient
                      id="revenueGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--brand-primary)"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--brand-primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-default)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={{ stroke: 'var(--border-default)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1_000_000
                        ? `${(v / 1_000_000).toFixed(1)}M`
                        : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}K`
                        : String(v)
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--brand-primary)"
                    fill="url(#revenueGrad)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: 'var(--brand-primary)' }}
                    isAnimationActive
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Suspense>
          </div>
        </ChartCard>

        {/* Enrollments — Bar Chart */}
        <ChartCard title={strings.charts.enrollments} delay={0.15}>
          <div className="h-56">
            <Suspense fallback={<ChartSkeleton />}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.enrollmentHistory}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-default)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={{ stroke: 'var(--border-default)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    fill="var(--brand-primary)"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive
                    animationDuration={700}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Suspense>
          </div>
        </ChartCard>

        {/* Attendance by Group — Horizontal Bar */}
        <ChartCard title={strings.charts.attendanceByGroup} delay={0.2}>
          <div className="h-56">
            <Suspense fallback={<ChartSkeleton />}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.attendanceByGroup} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-default)"
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={{ stroke: 'var(--border-default)' }}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <YAxis
                    dataKey="groupName"
                    type="category"
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    width={88}
                  />
                  <Tooltip
                    formatter={attendanceFormatter}
                    content={<CustomTooltip />}
                  />
                  <Bar
                    dataKey="attendancePercent"
                    fill="var(--brand-secondary)"
                    radius={[0, 4, 4, 0]}
                    isAnimationActive
                    animationDuration={700}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Suspense>
          </div>
        </ChartCard>

        {/* Payment Status — Pie Chart */}
        <ChartCard title={strings.charts.paymentStatus} delay={0.25}>
          <div className="flex h-56 items-center gap-4">
            <div className="min-w-0 flex-1">
              <Suspense fallback={<ChartSkeleton />}>
                <ResponsiveContainer width="100%" height={224}>
                  <PieChart>
                    <Pie
                      data={debtData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={2}
                      isAnimationActive
                      animationDuration={700}
                      animationEasing="ease-out"
                      label={({
                        name,
                        percent,
                      }: {
                        name: string;
                        percent: number;
                      }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {debtData.map((_, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={PIE_COLORS[i]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </Suspense>
            </div>

            <ul
              className="shrink-0 space-y-2"
              aria-label={strings.paymentLegendAria}
            >
              {debtData.map((item, i) => (
                <li
                  key={item.name}
                  className="flex items-center gap-2 text-xs"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i] }}
                    aria-hidden="true"
                  />
                  <span className="text-[var(--text-secondary)]">
                    {item.name}
                  </span>
                  <span className="ml-auto font-medium tabular-nums text-[var(--text-primary)]">
                    {item.value.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>
      </div>

      {/* ── Quick Actions ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        role="group"
        aria-label={strings.quickActionsAria}
      >
        {QUICK_ACTIONS_CONFIG.map((action) => {
          const label = strings.quickActions[action.key];
          return (
            <motion.button
              key={action.path}
              onClick={() => onNavigate(action.path)}
              whileHover={{
                y: -1,
                boxShadow: 'var(--shadow-md)',
                transition: { duration: 0.15 },
              }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'flex min-h-[44px] items-center gap-2 rounded-xl',
                'border border-[var(--border-default)] bg-[var(--bg-surface)]',
                'px-4 py-3 text-sm font-medium text-[var(--text-primary)]',
                'transition-colors',
                'hover:border-[var(--brand-primary)]',
                'hover:bg-[var(--bg-surface-hover)]',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
              )}
              type="button"
              aria-label={label}
            >
              <span aria-hidden="true" className="text-base">
                {action.icon}
              </span>
              <span className="truncate">{label}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── Recent Activity ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
        role="region"
        aria-label={strings.recentActivityAria}
      >
        <div className="border-b border-[var(--border-default)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {strings.recentActivity}
          </h3>
        </div>

        {recentItems.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
            {strings.noRecentActivity}
          </p>
        ) : (
          <>
            {/* Desktop table — hidden on mobile */}
            <table
              className="hidden w-full text-sm md:table"
              aria-label={strings.recentActivityListAria}
            >
              <tbody className="divide-y divide-[var(--border-default)]">
                {recentItems.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: Math.min(index * 0.04, 0.4),
                    }}
                    className="transition-colors hover:bg-[var(--bg-surface-hover)]"
                  >
                    <td
                      className="w-10 px-4 py-3 text-lg"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {item.actor}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[var(--text-muted)]">
                      <time dateTime={item.timeAgo}>{item.timeAgo}</time>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {/* Mobile card list — hidden on md+ */}
            <ul className="divide-y divide-[var(--border-default)] md:hidden">
              {recentItems.map((item, index) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: Math.min(index * 0.04, 0.4),
                  }}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <span
                    className="mt-0.5 shrink-0 text-lg"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--text-primary)]">
                      {item.description}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {item.actor} ·{' '}
                      <time dateTime={item.timeAgo}>{item.timeAgo}</time>
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </>
        )}
      </motion.div>
    </div>
  );
}