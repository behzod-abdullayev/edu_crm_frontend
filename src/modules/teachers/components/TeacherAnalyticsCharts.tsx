"use client";

import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/services/api/axios.instance";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  teacherId: string;
  groupId?: string | undefined;
  dateFrom: string;
  dateTo: string;
}

interface HomeworkCompletionItem {
  name: string;
  value: number;
}

interface GradeDistributionItem {
  range: string;
  count: number;
}

interface TeacherAnalyticsData {
  homeworkCompletion?: HomeworkCompletionItem[];
  gradeDistribution?: GradeDistributionItem[];
}

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

const DEFAULT_HOMEWORK_COMPLETION: HomeworkCompletionItem[] = [
  { name: "Completed", value: 0 },
  { name: "Missing", value: 0 },
];

function isAnalyticsData(data: unknown): data is TeacherAnalyticsData {
  return !!data && typeof data === "object";
}

export default function TeacherAnalyticsCharts({ teacherId, groupId, dateFrom, dateTo }: Props) {
  const { data: raw, isLoading } = useQuery({
    queryKey: ["teachers", teacherId, "analytics", groupId, dateFrom, dateTo],
    queryFn: () =>
      httpClient
        .get(`/teachers/${teacherId}/analytics`, { params: { groupId, dateFrom, dateTo } })
        .then((r) => r.data),
    enabled: !!teacherId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const analyticsData: TeacherAnalyticsData = isAnalyticsData(raw) ? raw : {};
  const homeworkCompletion: HomeworkCompletionItem[] =
    analyticsData.homeworkCompletion ?? DEFAULT_HOMEWORK_COMPLETION;
  const gradeDistribution: GradeDistributionItem[] = analyticsData.gradeDistribution ?? [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold">Homework Completion</h3>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={homeworkCompletion}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              label={({ name, percent }: { name: string; percent: number }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {homeworkCompletion.map((_item, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3 lg:col-span-2">
        <h3 className="text-sm font-semibold">Grade Distribution</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={gradeDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="range" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
