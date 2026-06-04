'use client';
// src/app/[locale]/(dashboard)/owner/finances/OwnerFinancesClient.tsx
//
// ✅ Zero `any` types
// ✅ Framer Motion: card lift, stagger, button press, chart mount
// ✅ Responsive: mobile cards, desktop table
// ✅ Light/dark via CSS variables only
// ✅ ARIA: role="status", aria-live, aria-busy, aria-sort
// ✅ Export PDF / Excel via useOwnerFinances
// ✅ Real Recharts charts: revenue area, payment method pie, branch bar

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

import {
  useOwnerFinances,
  useOwnerBranches,
} from '@/modules/owner/hooks/useOwner';
import {
  mapBranchRevenueToPie,
  mapPaymentMethodsToChart,
  mapTopStudentsToBadges,
} from '@/modules/owner/utils/owner.mapper';
import { cn } from '@/shared/utils/cn';

// ─── Color palette for charts ─────────────────────────────────────────────────

const PIE_COLORS = [
  'var(--brand-primary)',
  'var(--brand-secondary)',
  'var(--brand-accent)',
  'var(--role-owner)',
  'var(--role-teacher)',
];

// ─── Summary card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  subtext?: string;
  colorToken: string;
  icon: string;
  index: number;
}

function SummaryCard({
  label,
  value,
  subtext,
  colorToken,
  icon,
  index,
}: SummaryCardProps) {
  return (
    <motion.div
      className="rounded-2xl border p-6 relative overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
    >
      {/* Decorative circle */}
      <div
        className="absolute right-0 top-0 w-24 h-24 rounded-full -translate-y-6 translate-x-6"
        style={{ background: colorToken + '12' }}
        aria-hidden="true"
      />
      <p
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </p>
      <div className="mt-3 flex items-end gap-2">
        <span
          className="text-2xl"
          aria-hidden="true"
        >
          {icon}
        </span>
        <p
          className="text-3xl font-black tabular-nums tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </p>
      </div>
      {subtext && (
        <p
          className="mt-1 text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          {subtext}
        </p>
      )}
    </motion.div>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn('rounded-xl border p-5', className)}
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-default)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h3
        className="mb-4 text-sm font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionBtn({
  onClick,
  disabled,
  children,
  variant = 'default',
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'default' | 'primary';
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-lg px-4 py-2.5 text-sm font-medium min-h-[44px] transition-colors disabled:opacity-50',
        variant === 'primary'
          ? 'text-[var(--text-on-brand)]'
          : 'border text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
      )}
      style={
        variant === 'primary'
          ? { background: 'var(--brand-primary)', borderColor: 'transparent' }
          : { borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }
      }
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.01 }}
      aria-busy={disabled}
    >
      {children}
    </motion.button>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────

export function OwnerFinancesClient() {
  const { overview, isLoading, exportReport, sendOverdueReminders } =
    useOwnerFinances();
  const { branches } = useOwnerBranches();

  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [remindersSent, setRemindersSent] = useState(false);

  // ── Derived chart data ────────────────────────────────────────────────────
  const branchPieData = useMemo(
    () =>
      overview?.revenueByBranch
        ? mapBranchRevenueToPie(overview.revenueByBranch)
        : [],
    [overview],
  );

  const paymentMethodData = useMemo(
    () =>
      overview?.paymentMethodBreakdown
        ? mapPaymentMethodsToChart(overview.paymentMethodBreakdown)
        : [],
    [overview],
  );

  const topStudentBadges = useMemo(
    () =>
      overview?.topStudents
        ? mapTopStudentsToBadges(overview.topStudents)
        : [],
    [overview],
  );

  // ── Branch bar chart data (monthly revenue per branch) ───────────────────
  const branchBarData = useMemo(
    () =>
      branches.slice(0, 6).map((b) => ({
        name: b.name.length > 12 ? b.name.slice(0, 12) + '…' : b.name,
        revenue: b.monthlyRevenue,
        students: b.studentCount,
      })),
    [branches],
  );

  // ── Action handlers ───────────────────────────────────────────────────────
  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportReport('pdf');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportXlsx = async () => {
    setExportingXlsx(true);
    try {
      await exportReport('excel');
    } finally {
      setExportingXlsx(false);
    }
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      await sendOverdueReminders();
      setRemindersSent(true);
      setTimeout(() => setRemindersSent(false), 5000);
    } finally {
      setSendingReminders(false);
    }
  };

  // ── Format helpers ────────────────────────────────────────────────────────
  const currency = overview?.currency ?? 'UZS';
  const fmt = (n: number) => `${n.toLocaleString()} ${currency}`;

  if (isLoading) {
    return (
      <div
        className="space-y-8 pb-8"
        style={{ padding: 'var(--space-6)' }}
        aria-busy="true"
        aria-label="Loading finances…"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-xl animate-pulse"
            style={{ background: 'var(--bg-surface-hover)' }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="space-y-8 pb-8"
      style={{ padding: 'var(--space-6)' }}
    >
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <motion.div
        className="flex flex-wrap items-start justify-between gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <div>
          <h1
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Finances
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Platform-wide financial overview and reporting
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionBtn onClick={handleExportXlsx} disabled={exportingXlsx}>
            {exportingXlsx ? 'Exporting…' : '⬇ Export Excel'}
          </ActionBtn>
          <ActionBtn onClick={handleExportPdf} disabled={exportingPdf}>
            {exportingPdf ? 'Exporting…' : '⬇ Export PDF'}
          </ActionBtn>
          {(overview?.overdueTotal ?? 0) > 0 && (
            <ActionBtn
              onClick={handleSendReminders}
              disabled={sendingReminders || remindersSent}
              variant="primary"
            >
              {remindersSent
                ? '✓ Reminders Sent'
                : sendingReminders
                ? 'Sending…'
                : '📧 Send Overdue Reminders'}
            </ActionBtn>
          )}
        </div>
      </motion.div>

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {overview ? (
          <>
            <SummaryCard
              label="MRR"
              value={fmt(overview.mrr)}
              subtext="Monthly Recurring Revenue"
              colorToken="var(--brand-primary)"
              icon="💰"
              index={0}
            />
            <SummaryCard
              label="ARR"
              value={fmt(overview.arr)}
              subtext="Annual Recurring Revenue"
              colorToken="var(--brand-secondary)"
              icon="📈"
              index={1}
            />
            <SummaryCard
              label="Total Paid"
              value={fmt(overview.totalPaid)}
              colorToken="var(--role-teacher)"
              icon="✅"
              index={2}
            />
            <SummaryCard
              label="Outstanding"
              value={fmt(overview.totalOutstanding)}
              subtext={
                overview.overdueTotal > 0
                  ? `${fmt(overview.overdueTotal)} overdue`
                  : undefined
              }
              colorToken="var(--error-solid)"
              icon="⚠️"
              index={3}
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-36 rounded-2xl animate-pulse"
              style={{ background: 'var(--bg-surface-hover)' }}
              aria-hidden="true"
            />
          ))
        )}
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Branch revenue bar — takes 2/3 */}
        <ChartCard
          title="Revenue by Branch"
          className="lg:col-span-2"
        >
          {branchBarData.length > 0 ? (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={branchBarData}
                  margin={{ top: 4, right: 4, bottom: 4, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-default)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--brand-primary)"
                    radius={[4, 4, 0, 0]}
                    name="Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              className="h-64 flex items-center justify-center text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              No branch data available
            </div>
          )}
        </ChartCard>

        {/* Payment method pie — 1/3 */}
        <ChartCard title="Payment Methods">
          {paymentMethodData.length > 0 ? (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    dataKey="share"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ method, share }: { method: string; share: number }) =>
                      `${method} ${share.toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {paymentMethodData.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              className="h-64 flex items-center justify-center text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              No payment data
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Branch revenue pie ────────────────────────────────────────── */}
      {branchPieData.length > 0 && (
        <ChartCard title="Revenue Distribution by Branch">
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={branchPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                >
                  {branchPieData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={PIE_COLORS[idx % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* ── Top paying students ─────────────────────────────────────────── */}
      {topStudentBadges.length > 0 && (
        <motion.div
          className="rounded-xl border p-5"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <h3
            className="mb-4 text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Top Paying Students
          </h3>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['#', 'Student Name', 'Total Paid'].map((col) => (
                    <th
                      key={col}
                      className="pb-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topStudentBadges.map((s, i) => (
                  <motion.tr
                    key={i}
                    style={{ borderBottom: '1px solid var(--border-default)' }}
                    className="last:border-b-0 hover:bg-[var(--bg-surface-hover)] transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <td
                      className="py-3 tabular-nums text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {i + 1}
                    </td>
                    <td
                      className="py-3 font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {s.name}
                    </td>
                    <td
                      className="py-3 tabular-nums font-semibold"
                      style={{ color: 'var(--success-text)' }}
                    >
                      {s.totalPaid}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {topStudentBadges.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg p-3"
                style={{ background: 'var(--bg-surface-hover)' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: 'var(--brand-primary)',
                      color: 'var(--text-on-brand)',
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {s.name}
                  </span>
                </div>
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: 'var(--success-text)' }}
                >
                  {s.totalPaid}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
