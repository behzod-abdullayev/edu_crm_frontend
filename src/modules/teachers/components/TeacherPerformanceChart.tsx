"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { httpClient } from "@/services/api/axios.instance";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { cn } from "@shared/lib/utils";
import { TrendingUp, BarChart2, AlertTriangle } from "lucide-react";
import { TeacherAnalyticsAttendanceTrendItem } from "@/generated/models/teacherAnalyticsAttendanceTrendItem";
import { TeacherAnalyticsGradeTrendItem } from "@/generated/models/teacherAnalyticsGradeTrendItem";


// ─── Types ────────────────────────────────────────────────────────────────────

type ChartDataPoint = {
  label: string;
  value: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLabel(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function mapAttendanceTrend(
  items: TeacherAnalyticsAttendanceTrendItem[]
): ChartDataPoint[] {
  return items.map((item) => ({
    label: formatLabel(item.date),
    value: Math.round(item.rate * 100) / 100,
  }));
}

function mapGradeTrend(
  items: TeacherAnalyticsGradeTrendItem[]
): ChartDataPoint[] {
  return items.map((item) => ({
    label: formatLabel(item.date),
    value: Math.round(item.avg * 100) / 100,
  }));
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{ height }}
      aria-hidden="true"
      aria-label="Loading chart"
    >
      {/* Shimmer base */}
      <div className="absolute inset-0 skeleton" />

      {/* Fake bar/area shapes for visual fidelity */}
      <div className="absolute inset-0 flex items-end justify-around px-4 pb-4 gap-1.5">
        {[0.6, 0.8, 0.5, 0.9, 0.7, 0.85, 0.65].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-[var(--bg-surface)] opacity-30"
            style={{ height: `${h * 70}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface CustomTooltipProps {
  active: boolean | undefined;
  payload: { value: number | undefined }[] | undefined;
  label: string | undefined;
  unit: string | undefined;
  chartType: "bar" | "area";
}

function CustomTooltip({
  active,
  payload,
  label,
  unit,
  chartType,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const value = payload[0]?.value;
  const color =
    chartType === "bar"
      ? "var(--brand-primary)"
      : "var(--role-teacher)";

  return (
    <div
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] px-3 py-2.5 text-xs"
      role="tooltip"
    >
      <p className="font-semibold text-[var(--text-primary)] mb-1">{label}</p>
      <p className="font-bold tabular-nums" style={{ color }}>
        {value != null ? `${value}${unit ?? ""}` : "—"}
      </p>
    </div>
  );
}

// ─── Empty Chart State ────────────────────────────────────────────────────────

function ChartEmpty({ height }: { height: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-[var(--border-default)]"
      style={{ height }}
      role="status"
      aria-label="No chart data available"
    >
      <BarChart2
        className="w-8 h-8 text-[var(--text-muted)] mb-2"
        aria-hidden="true"
      />
      <p className="text-xs text-[var(--text-muted)]">No data available</p>
    </div>
  );
}

// ─── Chart Error ──────────────────────────────────────────────────────────────

function ChartError({ height }: { height: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)]"
      style={{ height }}
      role="alert"
    >
      <AlertTriangle
        className="w-6 h-6 text-[var(--error-text)] mb-1.5"
        aria-hidden="true"
      />
      <p className="text-xs text-[var(--error-text)]">Failed to load chart</p>
    </div>
  );
}

// ─── Bar Chart View ───────────────────────────────────────────────────────────

interface BarChartViewProps {
  data: ChartDataPoint[];
  height: number;
  isMobile: boolean;
}

function BarChartView({ data, height, isMobile }: BarChartViewProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{
          top: 4,
          right: isMobile ? 4 : 8,
          bottom: 0,
          left: isMobile ? -16 : -8,
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border-default)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{
            fontSize: isMobile ? 10 : 11,
            fill: "var(--text-muted)",
          }}
          axisLine={false}
          tickLine={false}
          interval={isMobile ? "preserveStartEnd" : 0}
        />
        <YAxis
          tick={{
            fontSize: isMobile ? 10 : 11,
            fill: "var(--text-muted)",
          }}
          axisLine={false}
          tickLine={false}
          width={isMobile ? 28 : 36}
        />
        <Tooltip
          content={(props) => (
            <CustomTooltip
              active={props.active}
              payload={props.payload as { value: number | undefined }[] | undefined}
              label={props.label as string | undefined}
              unit={undefined}
              chartType="bar"
            />
          )}
          cursor={{ fill: "var(--bg-surface-hover)", radius: 4 }}
        />
        <Bar
          dataKey="value"
          fill="var(--brand-primary)"
          radius={[4, 4, 0, 0]}
          maxBarSize={isMobile ? 28 : 40}
          isAnimationActive={true}
          animationDuration={600}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Area Chart View ──────────────────────────────────────────────────────────

interface AreaChartViewProps {
  data: ChartDataPoint[];
  height: number;
  isMobile: boolean;
}

function AreaChartView({ data, height, isMobile }: AreaChartViewProps) {
  const gradientId = "teacherAreaGradient";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{
          top: 4,
          right: isMobile ? 4 : 8,
          bottom: 0,
          left: isMobile ? -16 : -8,
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--role-teacher)"
              stopOpacity={0.25}
            />
            <stop
              offset="95%"
              stopColor="var(--role-teacher)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border-default)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{
            fontSize: isMobile ? 10 : 11,
            fill: "var(--text-muted)",
          }}
          axisLine={false}
          tickLine={false}
          interval={isMobile ? "preserveStartEnd" : 0}
        />
        <YAxis
          domain={[0, 100]}
          tick={{
            fontSize: isMobile ? 10 : 11,
            fill: "var(--text-muted)",
          }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}%`}
          width={isMobile ? 32 : 40}
        />
        <Tooltip
          content={(props) => (
            <CustomTooltip
              active={props.active}
              payload={props.payload as { value: number | undefined }[] | undefined}
              label={props.label as string | undefined}
              unit="%"
              chartType="area"
            />
          )}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--role-teacher)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{
            r: 4,
            fill: "var(--role-teacher)",
            stroke: "var(--bg-surface)",
            strokeWidth: 2,
          }}
          isAnimationActive={true}
          animationDuration={700}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Props & Main Component ───────────────────────────────────────────────────

interface TeacherPerformanceChartProps {
  teacherId: string;
  chartType: "bar" | "area";
  /** Optional height override. Defaults: mobile=180, desktop=220 */
  height?: number;
  /** Optional title shown above chart */
  title?: string;
  /** Optional CSS class for the wrapper */
  className?: string;
}

export default function TeacherPerformanceChart({
  teacherId,
  chartType,
  height: heightProp,
  title,
  className,
}: TeacherPerformanceChartProps) {
  const isMobile = useIsMobile();
  const chartHeight = heightProp ?? (isMobile ? 180 : 220);

  // ── Attendance trend (area chart) ──────────────────────────────────────────
  const attendanceQuery = useQuery({
    queryKey: ["teachers", teacherId, "analytics-chart", "attendance"],
    queryFn: async () => {
      const r = await httpClient.get<{ attendanceTrend?: TeacherAnalyticsAttendanceTrendItem[] }>(
        `/teachers/${teacherId}/analytics`
      );
      return mapAttendanceTrend(r.data.attendanceTrend ?? []);
    },
    enabled: !!teacherId && chartType === "area",
    staleTime: 5 * 60 * 1000,
  });

  // ── Grade trend (bar chart) ────────────────────────────────────────────────
  const gradeQuery = useQuery({
    queryKey: ["teachers", teacherId, "analytics-chart", "grades"],
    queryFn: async () => {
      const r = await httpClient.get<{ gradeTrend?: TeacherAnalyticsGradeTrendItem[] }>(
        `/teachers/${teacherId}/analytics`
      );
      return mapGradeTrend(r.data.gradeTrend ?? []);
    },
    enabled: !!teacherId && chartType === "bar",
    staleTime: 5 * 60 * 1000,
  });

  const activeQuery = chartType === "area" ? attendanceQuery : gradeQuery;
  const { data, isLoading, isError } = activeQuery;

  // ── Chart labels ──────────────────────────────────────────────────────────
  const chartLabel =
    chartType === "area"
      ? "Attendance Rate (%)"
      : "Average Grade";

  const chartIcon =
    chartType === "area" ? TrendingUp : BarChart2;

  const ChartIcon = chartIcon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className={cn("space-y-2", className)}
    >
      {/* ── Optional header ──────────────────────────────────────────────── */}
      {(title ?? true) && (
        <div className="flex items-center gap-1.5">
          <ChartIcon
            className="w-3.5 h-3.5"
            style={{
              color:
                chartType === "area"
                  ? "var(--role-teacher)"
                  : "var(--brand-primary)",
            }}
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
            {title ?? chartLabel}
          </span>
        </div>
      )}

      {/* ── Chart content ────────────────────────────────────────────────── */}
      <div
        aria-label={`${title ?? chartLabel} chart`}
        aria-busy={isLoading}
        role="img"
      >
        {isLoading && <ChartSkeleton height={chartHeight} />}

        {isError && !isLoading && (
          <ChartError height={chartHeight} />
        )}

        {!isLoading && !isError && (data == null || data.length === 0) && (
          <ChartEmpty height={chartHeight} />
        )}

        {!isLoading && !isError && data != null && data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {chartType === "bar" ? (
              <BarChartView
                data={data}
                height={chartHeight}
                isMobile={isMobile}
              />
            ) : (
              <AreaChartView
                data={data}
                height={chartHeight}
                isMobile={isMobile}
              />
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}