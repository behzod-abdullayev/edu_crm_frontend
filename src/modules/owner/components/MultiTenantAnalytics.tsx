'use client';

import { useState, Suspense } from 'react';
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
import { MultiTenantChartData } from '../types/owner.types';

const ChartSkeleton = () => (
  <div className="h-full w-full animate-pulse rounded-lg bg-muted" />
);

const BRANCH_COLORS = [
  'hsl(var(--primary))',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
];

interface MultiTenantAnalyticsProps {
  data: MultiTenantChartData;
  branches: string[];
  isFullPage?: boolean;
}

export function MultiTenantAnalytics({
  data,
  branches,
  isFullPage = false,
}: MultiTenantAnalyticsProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');

  const chartHeight = isFullPage ? 280 : 200;

  return (
    <div className="space-y-6">
      {isFullPage && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="From date"
            />
            <span className="text-muted-foreground">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="To date"
            />
          </div>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                import('html2canvas').then(({ default: html2canvas }) => {
                  const el = document.getElementById('analytics-charts');
                  if (el) {
                    html2canvas(el).then((canvas) => {
                      const link = document.createElement('a');
                      link.download = 'analytics-export.png';
                      link.href = canvas.toDataURL('image/png');
                      link.click();
                    });
                  }
                });
              }
            }}
            className="ml-auto hidden rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted md:block"
            type="button"
          >
            Export PNG
          </button>
        </div>
      )}

      <div id="analytics-charts" className="grid gap-4 lg:grid-cols-2">
        {/* Global Revenue */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Global Revenue</h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.globalRevenue}>
                <defs>
                  <linearGradient id="globalRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#globalRevGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch Comparison */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Branch Comparison</h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.branchComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {branches.map((branch, idx) => (
                  <Bar
                    key={branch}
                    dataKey={branch}
                    fill={BRANCH_COLORS[idx % BRANCH_COLORS.length] ?? '#6366f1'}
                    radius={[3, 3, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">User Growth</h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enrollment Trends */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Enrollment Trends</h3>
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.enrollmentTrends}>
                <defs>
                  <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#22c55e" fill="url(#enrollGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}