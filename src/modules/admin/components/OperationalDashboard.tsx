'use client';

import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import type { TooltipProps } from 'recharts';
import type {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';
import type { AdminDashboardData } from '../types/admin.types';
import { mapActivityItemToDisplay } from '../utils/admin.mapper';

// ─── Lazy-loaded Recharts ─────────────────────────────────────────────────────
// Recharts is a heavy library (~300 KB). Lazy-load every component so the
// dashboard page's initial bundle stays small.

const AreaChart = lazy(() =>
  import('recharts').then((m) => ({ default: m.AreaChart as React.ComponentType<React.ComponentProps<typeof m.AreaChart>> })),
);
const Area = lazy(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  import('recharts').then((m) => ({ default: m.Area as unknown as React.ComponentType<any> })),
);
const XAxis = lazy(() =>
  import('recharts').then((m) => ({ default: m.XAxis as React.ComponentType<React.ComponentProps<typeof m.XAxis>> })),
);
const YAxis = lazy(() =>
  import('recharts').then((m) => ({ default: m.YAxis as React.ComponentType<React.ComponentProps<typeof m.YAxis>> })),
);
const CartesianGrid = lazy(() =>
  import('recharts').then((m) => ({ default: m.CartesianGrid as React.ComponentType<React.ComponentProps<typeof m.CartesianGrid>> })),
);
const Tooltip = lazy(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  import('recharts').then((m) => ({ default: m.Tooltip as React.ComponentType<any> })),
);
const ResponsiveContainer = lazy(() =>
  import('recharts').then((m) => ({ default: m.ResponsiveContainer as React.ComponentType<React.ComponentProps<typeof m.ResponsiveContainer>> })),
);
const BarChart = lazy(() =>
  import('recharts').then((m) => ({ default: m.BarChart as React.ComponentType<React.ComponentProps<typeof m.BarChart>> })),
);
const Bar = lazy(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  import('recharts').then((m) => ({ default: m.Bar as unknown as React.ComponentType<any> })),
);
const PieChart = lazy(() =>
  import('recharts').then((m) => ({ default: m.PieChart as React.ComponentType<React.ComponentProps<typeof m.PieChart>> })),
);
const Pie = lazy(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  import('recharts').then((m) => ({ default: m.Pie as unknown as React.ComponentType<any> })),
);
const Cell = lazy(() =>
  import('recharts').then((m) => ({ default: m.Cell as React.ComponentType<React.ComponentProps<typeof m.Cell>> })),
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OperationalDashboardProps {
  data: AdminDashboardData;
  /** Called when the user clicks a quick-action button. */
  onNavigate: (path: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIE_COLORS: [string, string, string] = [
  'var(--success-solid)',
  'var(--warning-solid)',
  'var(--error-solid)',
];

const QUICK_ACTIONS = [
  { label: 'Create Course', path: '/admin/courses',  icon: '📚' },
  { label: 'Add Teacher',   path: '/admin/teachers', icon: '👨‍🏫' },
  { label: 'Add Student',   path: '/admin/students', icon: '🎓' },
  { label: 'View Reports',  path: '/admin/reports',  icon: '📊' },
] as const;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div
      className="h-full w-full rounded-lg shimmer"
      aria-hidden="true"
      role="presentation"
    />
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 shadow-md text-xs"
      role="tooltip"
    >
      {label !== undefined && (
        <p className="mb-1 font-semibold text-[var(--text-secondary)]">{String(label)}</p>
      )}
      {payload.map((entry, i) => (
        <p key={i} className="text-[var(--text-primary)] tabular-nums">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color ?? 'var(--brand-primary)' }}
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
  suffix?: string;
}

const cardVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function KPICard({ label, value, trend, suffix }: KPICardProps) {
  const isPositive = trend >= 0;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 transition-shadow"
      role="region"
      aria-label={`${label}: ${value.toLocaleString()}${suffix ? ' ' + suffix : ''}`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
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
        className={[
          'mt-1 flex items-center gap-1 text-xs font-medium',
          isPositive
            ? 'text-[var(--success-text)]'
            : 'text-[var(--error-text)]',
        ].join(' ')}
        aria-label={`${isPositive ? 'Up' : 'Down'} ${Math.abs(trend)}% vs last month`}
      >
        <span aria-hidden="true">{isPositive ? '↑' : '↓'}</span>
        {Math.abs(trend)}% vs last month
      </p>
    </motion.div>
  );
}

// ─── Chart Card wrapper ───────────────────────────────────────────────────────

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({ title, children, className = '' }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={[
        'rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4',
        className,
      ].join(' ')}
    >
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

// ─── Attendance Tooltip Formatter ─────────────────────────────────────────────

const attendanceFormatter = (
  v: ValueType,
  _n: NameType,
): [string, string] => [`${v}%`, 'Attendance'];

// ─── OperationalDashboard ─────────────────────────────────────────────────────

export function OperationalDashboard({ data, onNavigate }: OperationalDashboardProps) {
  const debtData: Array<{ name: string; value: number }> = [
    { name: 'Paid',    value: data.debtBreakdown.paid },
    { name: 'Pending', value: data.debtBreakdown.pending },
    { name: 'Overdue', value: data.debtBreakdown.overdue },
  ];

  const recentItems = data.recentActivity.map(mapActivityItemToDisplay);

  // Stagger animation for the KPI grid
  const containerVariants = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.06 } },
  };

  return (
    <div className="space-y-6">

      {/* ── KPI Grid ─────────────────────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6"
        role="list"
        aria-label="Key performance indicators"
      >
        <KPICard
          label="Students"
          value={data.totalStudents}
          trend={data.trends.studentsChange}
        />
        <KPICard
          label="Teachers"
          value={data.totalTeachers}
          trend={data.trends.teachersChange}
        />
        <KPICard
          label="Courses"
          value={data.totalCourses}
          trend={0}
        />
        <KPICard
          label="Revenue"
          value={data.monthlyRevenue}
          trend={data.trends.revenueChange}
          suffix="UZS"
        />
        <KPICard
          label="Enrollments"
          value={data.newEnrollments}
          trend={data.trends.enrollmentChange}
        />
        <KPICard
          label="Pending"
          value={data.pendingPayments}
          trend={0}
        />
      </motion.div>

      {/* ── Charts Grid ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Revenue — Area Chart */}
        <ChartCard title="Revenue (12 months)">
          <div className="h-56">
            <Suspense fallback={<ChartSkeleton />}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueHistory}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
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
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Suspense>
          </div>
        </ChartCard>

        {/* Enrollments — Bar Chart */}
        <ChartCard title="Enrollments (6 months)">
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
                    isAnimationActive={true}
                    animationDuration={700}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Suspense>
          </div>
        </ChartCard>

        {/* Attendance by Group — Horizontal Bar Chart */}
        <ChartCard title="Attendance by Group">
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
                    isAnimationActive={true}
                    animationDuration={700}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Suspense>
          </div>
        </ChartCard>

        {/* Payment Status — Pie Chart */}
        <ChartCard title="Payment Status">
          <div className="flex h-56 items-center gap-4">
            {/* Pie */}
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
                      isAnimationActive={true}
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
                        <Cell key={`cell-${i}`} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </Suspense>
            </div>

            {/* Legend */}
            <ul className="shrink-0 space-y-2" aria-label="Payment status legend">
              {debtData.map((item, i) => (
                <li key={item.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i] }}
                    aria-hidden="true"
                  />
                  <span className="text-[var(--text-secondary)]">{item.name}</span>
                  <span className="ml-auto font-medium tabular-nums text-[var(--text-primary)]">
                    {item.value.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        role="group"
        aria-label="Quick actions"
      >
        {QUICK_ACTIONS.map((action) => (
          <motion.button
            key={action.path}
            onClick={() => onNavigate(action.path)}
            whileHover={{ y: -1, boxShadow: 'var(--shadow-md)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="
              flex min-h-[44px] items-center gap-2 rounded-xl
              border border-[var(--border-default)] bg-[var(--bg-surface)]
              px-4 py-3 text-sm font-medium text-[var(--text-primary)]
              transition-colors hover:border-[var(--brand-primary)]
              hover:bg-[var(--bg-surface-hover)]
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2
            "
            type="button"
            aria-label={action.label}
          >
            <span aria-hidden="true" className="text-base">{action.icon}</span>
            <span className="truncate">{action.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
        role="region"
        aria-label="Recent activity"
      >
        <div className="border-b border-[var(--border-default)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Recent Activity
          </h3>
        </div>

        {recentItems.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
            No recent activity.
          </p>
        ) : (
          <>
            {/* Desktop table — hidden on mobile */}
            <table className="hidden w-full text-sm md:table" aria-label="Recent activity list">
              <tbody className="divide-y divide-[var(--border-default)]">
                {recentItems.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.4) }}
                    className="hover:bg-[var(--bg-surface-hover)] transition-colors"
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
                  transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.4) }}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <span className="mt-0.5 shrink-0 text-lg" aria-hidden="true">
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
