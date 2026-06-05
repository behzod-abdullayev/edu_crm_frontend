'use client';

import { useState, useId } from 'react';
import { motion } from 'framer-motion';
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
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import type { MultiTenantChartData } from '../types/owner.types';

// ── Constants ─────────────────────────────────────────────────────────────────

const BRANCH_COLORS: readonly string[] = [
  '#4F46E5',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#EC4899',
  '#14B8A6',
];

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

// ── Chart Card ────────────────────────────────────────────────────────────────

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  height: number;
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [exporting, setExporting] = useState(false);

  const fromId = useId();
  const toId = useId();
  const branchId = useId();

  // Responsive chart height: taller on full-page, shorter on dashboard widget
  const desktopHeight = isFullPage ? 280 : 220;
  const mobileHeight = isFullPage ? 200 : 160;

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
          <SkeletonLoader key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-default)] py-16 text-center">
        <BarChart2 size={36} className="mb-3 text-[var(--text-muted)]" aria-hidden="true" />
        <p className="font-semibold text-[var(--text-primary)]">No analytics data</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Data will appear once available.</p>
      </div>
    );
  }

  // Filter branch data when a specific branch is selected
  const displayBranches =
    selectedBranch === 'all'
      ? branches
      : branches.filter((b) => b === selectedBranch);

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
              From date
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
              aria-label="From date"
            />
            <span className="text-[var(--text-muted)]">—</span>
            <label htmlFor={toId} className="sr-only">
              To date
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
              aria-label="To date"
            />
          </div>

          {/* Branch filter */}
          <label htmlFor={branchId} className="sr-only">
            Filter by branch
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
            aria-label="Filter by branch"
          >
            <option value="all">All Branches</option>
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
            aria-label="Export analytics as PNG"
          >
            {exporting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
            ) : (
              <Download size={14} aria-hidden="true" />
            )}
            Export PNG
          </motion.button>
        </motion.div>
      )}

      {/* Chart grid */}
      <div
        id="analytics-charts"
        className="grid gap-4 lg:grid-cols-2"
        role="region"
        aria-label="Analytics charts"
      >
        {/* Global Revenue */}
        <ChartCard title="Global Revenue" height={desktopHeight} index={0}>
          <div
            className="w-full md:hidden"
            style={{ height: mobileHeight }}
            aria-label="Global Revenue chart"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.globalRevenue}>
                <defs>
                  <linearGradient id="globalRevGrad-mobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4F46E5"
                  fill="url(#globalRevGrad-mobile)"
                  strokeWidth={2}
                  isAnimationActive
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div
            className="hidden w-full md:block"
            style={{ height: desktopHeight }}
            aria-label="Global Revenue chart"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.globalRevenue}>
                <defs>
                  <linearGradient id="globalRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4F46E5"
                  fill="url(#globalRevGrad)"
                  strokeWidth={2}
                  isAnimationActive
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Branch Comparison */}
        <ChartCard title="Branch Comparison" height={desktopHeight} index={1}>
          <div
            className="w-full md:hidden"
            style={{ height: mobileHeight }}
            aria-label="Branch Comparison chart"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.branchComparison}>
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <Tooltip content={<CustomTooltip />} />
                {displayBranches.slice(0, 3).map((branch, idx) => (
                  <Bar
                    key={branch}
                    dataKey={branch}
                    fill={BRANCH_COLORS[idx % BRANCH_COLORS.length] ?? '#6366f1'}
                    radius={[3, 3, 0, 0]}
                    isAnimationActive
                    animationDuration={700 + idx * 100}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div
            className="hidden w-full md:block"
            style={{ height: desktopHeight }}
            aria-label="Branch Comparison chart"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.branchComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
                {displayBranches.map((branch, idx) => (
                  <Bar
                    key={branch}
                    dataKey={branch}
                    fill={BRANCH_COLORS[idx % BRANCH_COLORS.length] ?? '#6366f1'}
                    radius={[3, 3, 0, 0]}
                    isAnimationActive
                    animationDuration={700 + idx * 100}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* User Growth */}
        <ChartCard title="User Growth" height={desktopHeight} index={2}>
          <div
            className="w-full md:hidden"
            style={{ height: mobileHeight }}
            aria-label="User Growth chart"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.userGrowth}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div
            className="hidden w-full md:block"
            style={{ height: desktopHeight }}
            aria-label="User Growth chart"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#8B5CF6', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive
                  animationDuration={900}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Enrollment Trends */}
        <ChartCard title="Enrollment Trends" height={desktopHeight} index={3}>
          <div
            className="w-full md:hidden"
            style={{ height: mobileHeight }}
            aria-label="Enrollment Trends chart"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.enrollmentTrends}>
                <defs>
                  <linearGradient id="enrollGrad-mobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#22C55E"
                  fill="url(#enrollGrad-mobile)"
                  strokeWidth={2}
                  isAnimationActive
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div
            className="hidden w-full md:block"
            style={{ height: desktopHeight }}
            aria-label="Enrollment Trends chart"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.enrollmentTrends}>
                <defs>
                  <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#22C55E"
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