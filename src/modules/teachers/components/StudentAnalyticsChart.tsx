"use client";

import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/services/api/axios.instance";
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
} from "recharts";
import { cn } from "@shared/lib/utils";

export interface StudentAnalyticsChartProps {
  studentId?: string | undefined;
  groupId?: string | undefined;
  className?: string | undefined;
}

export function StudentAnalyticsChart({ studentId, groupId, className }: StudentAnalyticsChartProps) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics", studentId ?? groupId, "performance"],
    queryFn: () =>
      httpClient
        .get(`/analytics/performance`, { params: { studentId, groupId } })
        .then((r) => r.data),
    enabled: !!(studentId ?? groupId),
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const gradeTrend =
    (analytics as { gradeTrend?: { month: string; average: number }[] } | undefined)?.gradeTrend ?? [];
  const attendanceTrend =
    (analytics as { attendanceTrend?: { month: string; rate: number }[] } | undefined)?.attendanceTrend ?? [];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Grade trend */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Grade Trend</h4>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={gradeTrend}>
            <defs>
              <linearGradient id="gradeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="average"
              stroke="#6366f1"
              fill="url(#gradeGrad)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Attendance trend */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Attendance Rate</h4>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={attendanceTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <Tooltip
              formatter={(v: number) => [`${v}%`, "Attendance"]}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Bar dataKey="rate" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
