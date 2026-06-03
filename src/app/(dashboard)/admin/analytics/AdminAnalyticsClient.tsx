'use client';

import { Suspense, useEffect, useState } from 'react';
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
  ResponsiveContainer,
} from 'recharts';

const ChartSkeleton = () => (
  <div className="h-full w-full animate-pulse rounded-lg bg-muted" />
);

interface AnalyticsData {
  revenueByMonth: { month: string; revenue: number }[];
  enrollmentGrowth: { month: string; count: number }[];
  popularCourses: { course: string; students: number }[];
  teacherPerformance: { teacher: string; rating: number }[];
  attendanceByGroup: { group: string; percent: number }[];
}

// Correctly typed formatter for recharts Tooltip
const attendanceFormatter = (
  value: string | number | Array<string | number>,
): [string, string] => [`${String(value)}%`, 'Attendance'];

export function AdminAnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    fetch(`/api/admin/analytics?${params.toString()}`)
      .then((r) => r.json() as Promise<AnalyticsData>)
      .then(setData)
      .catch(() => null);
  }, [dateFrom, dateTo]);

  const handleExportPNG = async () => {
    if (typeof window === 'undefined' || window.innerWidth < 768) return;
    const { default: html2canvas } = await import('html2canvas');
    const el = document.getElementById('admin-analytics-charts');
    if (!el) return;
    const canvas = await html2canvas(el);
    const link = document.createElement('a');
    link.download = `analytics-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Detailed performance and trends</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-muted-foreground">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={handleExportPNG}
            className="hidden rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted md:block"
            type="button"
          >
            Export PNG
          </button>
        </div>
      </div>

      <div id="admin-analytics-charts" className="grid gap-4 lg:grid-cols-2">
        {/* Revenue trend */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Revenue Trend (12 months)</h3>
          <div className="h-64">
            {!data ? (
              <ChartSkeleton />
            ) : (
              <Suspense fallback={<ChartSkeleton />}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenueByMonth}>
                    <defs>
                      <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      fill="url(#revGrad2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Suspense>
            )}
          </div>
        </div>

        {/* Enrollment growth */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Enrollment Growth</h3>
          <div className="h-64">
            {!data ? (
              <ChartSkeleton />
            ) : (
              <Suspense fallback={<ChartSkeleton />}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.enrollmentGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Suspense>
            )}
          </div>
        </div>

        {/* Popular courses */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Course Popularity</h3>
          <div className="h-64">
            {!data ? (
              <ChartSkeleton />
            ) : (
              <Suspense fallback={<ChartSkeleton />}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.popularCourses} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="course" type="category" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="students" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Suspense>
            )}
          </div>
        </div>

        {/* Teacher performance */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Teacher Performance</h3>
          <div className="h-64">
            {!data ? (
              <ChartSkeleton />
            ) : (
              <Suspense fallback={<ChartSkeleton />}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.teacherPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="teacher" type="category" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="rating" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Suspense>
            )}
          </div>
        </div>

        {/* Attendance by group */}
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Attendance by Group</h3>
          <div className="h-64">
            {!data ? (
              <ChartSkeleton />
            ) : (
              <Suspense fallback={<ChartSkeleton />}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.attendanceByGroup}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="group" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={attendanceFormatter} />
                    <Bar dataKey="percent" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
