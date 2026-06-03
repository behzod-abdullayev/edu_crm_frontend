"use client";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { httpClient } from "@/services/api/axios.instance";
import { GradesList } from "./GradesList";
import dynamic from "next/dynamic";
import type { CourseGradesSummaryDto } from "./GradesList";

const GradeTrendChart = dynamic(() => import("./GradeTrendChart"), { ssr: false });

export function StudentGradesClient() {
  const { data: user } = useCurrentUser();

  const { data: summaries, isLoading } = useQuery({
    queryKey: ["students", user?.id, "grades"],
    queryFn: async () => {
      const res = await httpClient.get<CourseGradesSummaryDto[]>(`/students/${user?.id}/grades`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  const overallAvg = summaries?.length
    ? Math.round(summaries.reduce((acc: number, s: CourseGradesSummaryDto) => acc + (s.averageScore ?? 0), 0) / summaries.length)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Grades</h1>
          <p className="text-muted-foreground text-sm mt-1">All your graded assessments.</p>
        </div>
        {!isLoading && (
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{overallAvg}%</p>
            <p className="text-xs text-muted-foreground">Overall average</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold text-sm">Grade Trend</h2>
        <GradeTrendChart studentId={user?.id ?? ""} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <GradesList summaries={summaries ?? []} />
      )}
    </div>
  );
}