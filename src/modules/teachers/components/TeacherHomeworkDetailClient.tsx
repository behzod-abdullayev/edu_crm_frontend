"use client";

import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/services/api/axios.instance";
import { HomeworkGradingTable } from "./HomeworkGradingTable";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@shared/components/ui/badge";
import type { HomeworkDetailDto } from "@generated/models";

export function TeacherHomeworkDetailClient({ homeworkId }: { homeworkId: string }) {
  const { data: hw, isLoading } = useQuery({
    queryKey: ["homework", homeworkId, "teacher-detail"],
    queryFn: () =>
      httpClient
        .get<HomeworkDetailDto>(`/homework/${homeworkId}/teacher-detail`)
        .then((r) => r.data),
    enabled: !!homeworkId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link
        href="/teacher/homework"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />Back to Homework
      </Link>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-semibold">{hw?.title}</h1>
          <Badge variant="outline">
            {hw?.submissionsCount ?? 0} / {(hw as (HomeworkDetailDto & { totalStudents?: number }) | undefined)?.totalStudents ?? 0} submitted
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Group:</span>{" "}
            <span className="font-medium">{hw?.groupName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Max pts:</span>{" "}
            <span className="font-medium">{hw?.maxPoints}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Due:</span>{" "}
            <span className="font-medium">
              {hw?.dueDate ? new Date(hw.dueDate).toLocaleDateString() : "—"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Graded:</span>{" "}
            <span className="font-medium">{hw?.gradedCount ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-base">Submissions</h2>
        <HomeworkGradingTable homeworkId={homeworkId} maxPoints={hw?.maxPoints ?? 100} />
      </div>
    </div>
  );
}
