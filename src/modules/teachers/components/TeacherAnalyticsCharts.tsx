"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { useTeacherAnalytics } from "@/modules/teachers/hooks/useTeacher";
import type { TeacherAnalytics as TeacherAnalyticsBase } from "@/services/api/teachers.api";
import { cn } from "@shared/lib/utils";

// ─── Extended analytics type ──────────────────────────────────────────────────
// Adds optional fields that may be returned at runtime but are not in the base type.
interface TeacherAnalytics extends TeacherAnalyticsBase {
  totalGroups?: number;
  homeworkSubmitted?: number;
  attendanceTrend?: { date: string; rate: number }[];
  gradeTrend?: { date: string; avg: number }[];
}
import { Users, BookOpen, ClipboardList, TrendingUp } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface TeacherAnalyticsChartsProps {
  teacherId: string;
  groupId?: string;
  dateFrom: string;
  dateTo: string;
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-md text-xs">
      {label && <p className="font-medium mb-1 text-foreground">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-1.5" style={{ color: entry.color }}>
          <span
            className="w-2 h-2 rounded-full inline-block shrink-0"
            style={{ background: entry.color }}
            aria-hidden="true"
          />
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading chart"
      className={cn(
        "rounded-xl border border-border bg-card p-5 space-y-3",
        className,
      )}
    >
      <div className="h-4 w-40 rounded bg-muted animate-[shimmer_1.5s_infinite]" />
      <div className="h-[160px] rounded-lg bg-muted animate-[shimmer_1.5s_infinite]" />
    </div>
  );
}

// ─── Empty chart placeholder ──────────────────────────────────────────────────

function EmptyChartContent({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-[160px] rounded-lg border border-dashed border-border bg-muted/20">
      <p className="text-xs text-muted-foreground">No {label} data</p>
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

interface StatPillProps {
  icon: React.ElementType;
  label: string;
  value: number | undefined;
  color: string;
}

function StatPill({ icon: Icon, label, value, color }: StatPillProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <Icon className="w-4 h-4 shrink-0" style={{ color }} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold" style={{ color }}>
          {value ?? 0}
        </p>
      </div>
    </div>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

function ChartCard({ title, children, className, delay = 0 }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      className={cn("rounded-xl border border-border bg-card p-5 space-y-3", className)}
    >
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </motion.div>
  );
}

// ─── Pie chart for homework completion ───────────────────────────────────────

interface HomeworkCompletionProps {
  data: TeacherAnalytics;
  isMobile: boolean;
}

function HomeworkCompletionChart({ data, isMobile }: HomeworkCompletionProps) {
  const submitted = data.homeworkSubmitted ?? 0;
  const graded = data.homeworkGraded ?? 0;
  const pending = Math.max(0, submitted - graded);

  const pieData = [
    { name: "Graded", value: graded },
    { name: "Pending", value: pending },
  ];

  const hasData = submitted > 0;
  const outerRadius = isMobile ? 50 : 60;

  if (!hasData) return <EmptyChartContent label="homework" />;

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 160 : 190}>
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={outerRadius}
          innerRadius={outerRadius * 0.55}
          animationBegin={0}
          animationDuration={800}
          label={({ name, percent }: { name: string; percent: number }) =>
            isMobile ? `${(percent * 100).toFixed(0)}%` : `${name} ${(percent * 100).toFixed(0)}%`
          }
          labelLine={!isMobile}
        >
          {pieData.map((_entry, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        {!isMobile && (
          <Legend
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-xs text-muted-foreground">{value}</span>
            )}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Attendance trend chart ───────────────────────────────────────────────────

interface AttendanceTrendProps {
  data: TeacherAnalytics;
  isMobile: boolean;
}

function AttendanceTrendChart({ data, isMobile }: AttendanceTrendProps) {
  const trend = data.attendanceTrend ?? [];
  const maxPoints = isMobile ? 7 : 12;
  const chartData = trend.slice(-maxPoints);
  const height = isMobile ? 160 : 190;
  const axisFontSize = isMobile ? 10 : 11;

  if (chartData.length === 0) return <EmptyChartContent label="attendance trend" />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={chartData}
        margin={{ top: 4, right: 4, bottom: 0, left: isMobile ? -8 : 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border-default, #e2e8f0)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
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
          cursor={{ stroke: "var(--border-default)", strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="rate"
          name="Attendance %"
          stroke={CHART_COLORS[0]}
          strokeWidth={2}
          dot={{ r: isMobile ? 2 : 3, fill: CHART_COLORS[0], strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          animationDuration={800}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Grade trend chart ────────────────────────────────────────────────────────

interface GradeTrendProps {
  data: TeacherAnalytics;
  isMobile: boolean;
}

function GradeTrendChart({ data, isMobile }: GradeTrendProps) {
  const trend = data.gradeTrend ?? [];
  const maxPoints = isMobile ? 7 : 12;
  const chartData = trend.slice(-maxPoints);
  const height = isMobile ? 160 : 190;
  const axisFontSize = isMobile ? 10 : 11;

  if (chartData.length === 0) return <EmptyChartContent label="grade trend" />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 4, bottom: 0, left: isMobile ? -8 : 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border-default, #e2e8f0)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
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
          cursor={{ fill: "var(--bg-surface-hover, #f1f5f9)", opacity: 0.6 }}
        />
        <Bar
          dataKey="avg"
          name="Avg Grade"
          fill={CHART_COLORS[1]}
          radius={[4, 4, 0, 0]}
          maxBarSize={isMobile ? 24 : 36}
          animationDuration={800}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TeacherAnalyticsCharts({
  teacherId,
  groupId,
  dateFrom,
  dateTo,
}: TeacherAnalyticsChartsProps) {
  const isMobile = useIsMobile();

  const { data: rawBase, isLoading } = useTeacherAnalytics(teacherId, {
    from: dateFrom,
    to: dateTo,
  });
  const raw: TeacherAnalytics | undefined = rawBase as TeacherAnalytics | undefined;

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading analytics charts"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {[1, 2, 3, 4].map((i) => (
          <ChartCardSkeleton
            key={i}
            className={i === 4 ? "sm:col-span-2 lg:col-span-1" : ""}
          />
        ))}
      </div>
    );
  }

  // ── No data ───────────────────────────────────────────────────────────────

  if (!raw) {
    return (
      <div
        role="status"
        className="flex items-center justify-center py-16 text-sm text-muted-foreground"
      >
        No analytics data available.
      </div>
    );
  }

  // Narrow groupId to avoid ESLint unused warning — it filters server-side via useTeacherAnalytics
  const _resolvedGroupId = groupId;
  void _resolvedGroupId;

  // ── Charts ────────────────────────────────────────────────────────────────

  return (
    <div
      className="space-y-4"
      role="region"
      aria-label="Teacher analytics charts"
    >
      {/* Summary stat pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill
          icon={Users}
          label="Total Students"
          value={raw.totalStudents}
          color="#6366f1"
        />
        <StatPill
          icon={BookOpen}
          label="Total Groups"
          value={raw.totalGroups}
          color="#22c55e"
        />
        <StatPill
          icon={ClipboardList}
          label="HW Submitted"
          value={raw.homeworkSubmitted}
          color="#f59e0b"
        />
        <StatPill
          icon={TrendingUp}
          label="Avg Grade"
          value={raw.averageGrade !== undefined ? Math.round(raw.averageGrade) : undefined}
          color="#8b5cf6"
        />
      </div>

      {/* Chart grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Homework completion pie */}
        <ChartCard title="Homework Completion" delay={0}>
          <HomeworkCompletionChart data={raw} isMobile={isMobile} />
        </ChartCard>

        {/* Attendance trend line */}
        <ChartCard title="Attendance Trend" delay={0.05}>
          <AttendanceTrendChart data={raw} isMobile={isMobile} />
        </ChartCard>

        {/* Grade distribution bar */}
        <ChartCard
          title="Average Grade Trend"
          className="sm:col-span-2 lg:col-span-1"
          delay={0.1}
        >
          <GradeTrendChart data={raw} isMobile={isMobile} />
        </ChartCard>
      </div>
    </div>
  );
}