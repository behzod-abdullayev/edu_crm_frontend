"use client";

import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/services/api/axios.instance";
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

interface Props {
  teacherId: string;
  chartType: "bar" | "area";
}

export default function TeacherPerformanceChart({ teacherId, chartType }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["teachers", teacherId, "analytics-chart", chartType],
    queryFn: () =>
      httpClient
        .get<{ label: string; value: number }[]>(`/teachers/${teacherId}/analytics/chart`, {
          params: { type: chartType },
        })
        .then((r) => r.data),
    enabled: !!teacherId,
  });

  if (isLoading) {
    return <div className="h-40 rounded-lg bg-muted animate-pulse" />;
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      {chartType === "bar" ? (
        <BarChart data={data ?? []}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : (
        <AreaChart data={data ?? []}>
          <defs>
            <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
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
            dataKey="value"
            stroke="#22c55e"
            fill="url(#tGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}
