'use client';

import { Suspense, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useOwnerFinances } from '@/modules/owner/hooks/useOwner';
import { mapBranchRevenueToPie, mapTopStudentsToBadges } from '@/modules/owner/utils/owner.mapper';

const PIE_COLORS = [
  'hsl(var(--primary))', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
];

const ChartSkeleton = () => <div className="h-full w-full animate-pulse rounded-lg bg-muted" />;

// Correctly typed tooltip formatter
const revenueFormatter = (
  value: string | number | Array<string | number>,
  _name: string | number,
): [string, string] => [`${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, 'Revenue'];

export function OwnerFinancesClient() {
  const { overview, isLoading, exportReport, sendOverdueReminders } = useOwnerFinances();
  const [sendingReminders, setSendingReminders] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExporting(true);
    try {
      await exportReport(format);
    } finally {
      setExporting(false);
    }
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      await sendOverdueReminders();
    } finally {
      setSendingReminders(false);
    }
  };

  if (isLoading || !overview) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const pieData = mapBranchRevenueToPie(overview.revenueByBranch);
  const topStudents = mapTopStudentsToBadges(overview.topStudents);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finances</h1>
          <p className="text-sm text-muted-foreground">Global financial overview</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            type="button"
          >
            Export PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            type="button"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'MRR', value: overview.mrr, highlight: true, warn: false },
          { label: 'ARR', value: overview.arr, highlight: false, warn: false },
          { label: 'Total Paid', value: overview.totalPaid, highlight: false, warn: false },
          { label: 'Outstanding', value: overview.totalOutstanding, highlight: false, warn: true },
        ].map((stat) => (
          <div
            key={stat.label}
            className={[
              'rounded-xl border p-4',
              stat.highlight ? 'border-primary/30 bg-primary/5' :
              stat.warn ? 'border-red-300/50 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20' :
              'border-border bg-card',
            ].join(' ')}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </p>
            <p className={[
              'mt-2 text-2xl font-bold tabular-nums',
              stat.highlight ? 'text-primary' :
              stat.warn ? 'text-red-600 dark:text-red-400' :
              'text-foreground',
            ].join(' ')}>
              {stat.value.toLocaleString()}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                {overview.currency}
              </span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue by Branch pie */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Revenue by Branch</h3>
          <div className="h-64">
            <Suspense fallback={<ChartSkeleton />}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }: { name: string; percent: number }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={revenueFormatter} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Suspense>
          </div>
        </div>

        {/* Payment methods */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Payment Methods</h3>
          <div className="space-y-3">
            {overview.paymentMethodBreakdown.map((m) => (
              <div key={m.method}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="capitalize text-foreground">{m.method}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {m.percent}% · {m.amount.toLocaleString()} {overview.currency}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${m.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top students */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Top Paying Students</h3>
          <div className="space-y-2">
            {topStudents.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-foreground">{s.name}</span>
                <span className="tabular-nums text-sm text-muted-foreground">{s.totalPaid}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Overdue summary */}
        <div className={[
          'rounded-xl border p-4',
          overview.overdueTotal > 0
            ? 'border-red-300/50 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20'
            : 'border-border bg-card',
        ].join(' ')}>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Overdue Payments</h3>
          <p className={[
            'text-3xl font-bold tabular-nums',
            overview.overdueTotal > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground',
          ].join(' ')}>
            {overview.overdueTotal.toLocaleString()}
            <span className="ml-1 text-base font-normal text-muted-foreground">
              {overview.currency}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Total across all branches</p>
          {overview.overdueTotal > 0 && (
            <button
              onClick={handleSendReminders}
              disabled={sendingReminders}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              type="button"
            >
              {sendingReminders ? 'Sending…' : 'Send Reminders to All'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
