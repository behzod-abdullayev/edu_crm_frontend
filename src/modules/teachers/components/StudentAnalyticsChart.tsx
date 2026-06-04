"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { httpClient } from "@/services/api/axios.instance";
import { cn } from "@shared/lib/utils";
import { TrendingUp, CalendarCheck } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GradeTrendPoint {
  month: string;
  average: number;
}

interface AttendanceTrendPoint {
  month: string;
  rate: number;
}

interface PerformanceData {
  gradeTrend?: GradeTrendPoint[];
  attendanceTrend?: AttendanceTrendPoint[];
}

export interface StudentAnalyticsChartProps {
  studentId?: string;
  groupId?: string;
  className?: string;
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="font-medium mb-1 text-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
          {entry.name}: <strong>{entry.value}{entry.dataKey === "rate" ? "%" : ""}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label={`Loading ${label} chart`}>
      <div className="h-4 w-32 rounded bg-muted animate-[shimmer_1.5s_infinite]" />
      <div className="h-[180px] rounded-xl bg-muted animate-[shimmer_1.5s_infinite]" />
    </div>
  );
}

// ─── Empty chart placeholder ──────────────────────────────────────────────────

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[160px] rounded-xl border border-dashed border-border bg-muted/20">
      <p className="text-xs text-muted-foreground">No {label} data available</p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StudentAnalyticsChart({
  studentId,
  groupId,
  className,
}: StudentAnalyticsChartProps) {
  const isMobile = useIsMobile();

  const entityId = studentId ?? groupId;

  const { data: analytics, isLoading } = useQuery<PerformanceData>({
    queryKey: ["analytics", entityId, "performance"],
    queryFn: () =>
      httpClient
        .get<PerformanceData>("/analytics/performance", {
          params: {
            ...(studentId !== undefined ? { studentId } : {}),
            ...(groupId !== undefined ? { groupId } : {}),
          },
        })
        .then((r) => r.data),
    enabled: entityId !== undefined,
  });

  // Mobile charts use fewer data points for clarity
  const chartHeight = isMobile ? 180 : 220;
  const axisFontSize = isMobile ? 10 : 11;

  const gradeTrend: GradeTrendPoint[] = analytics?.gradeTrend ?? [];
  const attendanceTrend: AttendanceTrendPoint[] = analytics?.attendanceTrend ?? [];

  // Truncate to last 7 data points on mobile, 12 on desktop
  const maxPoints = isMobile ? 7 : 12;
  const gradeData = gradeTrend.slice(-maxPoints);
  const attendanceData = attendanceTrend.slice(-maxPoints);

  return (
    <div className={cn("space-y-6", className)} role="region" aria-label="Student performance analytics">
      {/* Grade trend */}
      <section aria-label="Grade trend">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#6366f1]" aria-hidden="true" />
          <h4 className="text-sm font-medium text-muted-foreground">Grade Trend</h4>
        </div>

        {isLoading ? (
          <ChartSkeleton label="grade trend" />
        ) : gradeData.length === 0 ? (
          <EmptyChart label="grade trend" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart
                data={gradeData}
                margin={{ top: 4, right: 4, bottom: 0, left: isMobile ? -8 : 0 }}
              >
                <defs>
                  <linearGradient id="gradeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-default, #e2e8f0)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: axisFontSize, fill: "var(--text-muted, #94a3b8)" }}
                  axisLine={false}
                  tickLine={false}
                  interval={isMobile ? "preserveStartEnd" : 0}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: axisFontSize, fill: "var(--text-muted, #94a3b8)" }}
                  axisLine={false}
                  tickLine={false}
                  width={isMobile ? 28 : 36}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: "var(--border-default)", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="average"
                  name="Average"
                  stroke="#6366f1"
                  fill="url(#gradeGrad)"
                  strokeWidth={2}
                  dot={{ r: isMobile ? 2 : 3, fill: "#6366f1", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#6366f1" }}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </section>

      {/* Attendance rate */}
      <section aria-label="Attendance rate">
        <div className="flex items-center gap-2 mb-3">
          <CalendarCheck className="w-4 h-4 text-[#22c55e]" aria-hidden="true" />
          <h4 className="text-sm font-medium text-muted-foreground">Attendance Rate</h4>
        </div>

        {isLoading ? (
          <ChartSkeleton label="attendance rate" />
        ) : attendanceData.length === 0 ? (
          <EmptyChart label="attendance rate" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          >
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={attendanceData}
                margin={{ top: 4, right: 4, bottom: 0, left: isMobile ? -8 : 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-default, #e2e8f0)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: axisFontSize, fill: "var(--text-muted, #94a3b8)" }}
                  axisLine={false}
                  tickLine={false}
                  interval={isMobile ? "preserveStartEnd" : 0}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: axisFontSize, fill: "var(--text-muted, #94a3b8)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                  width={isMobile ? 32 : 40}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "var(--bg-surface-hover, #f1f5f9)", opacity: 0.6 }}
                />
                <Bar
                  dataKey="rate"
                  name="Attendance"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={isMobile ? 28 : 40}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </section>
    </div>
  );
}
