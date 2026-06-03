"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useWebSocket } from "@shared/hooks/useWebSocket";
import { useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/services/api/axios.instance";
import { ExamParticipateView } from "./ExamParticipateView";
import { Badge } from "@shared/components/ui/badge";
import { useFeatureFlag } from "@shared/hooks/useFeatureFlag";
import type { ExamDto } from "./ExamParticipateView";
import { cn } from "@shared/lib/utils";

export function StudentExamsClient() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const examEnabled = useFeatureFlag("examEngine");
  const [activeExam, setActiveExam] = useState<ExamDto | null>(null);

  const { data: exams, isLoading } = useQuery({
    queryKey: ["students", user?.id, "exams"],
    queryFn: async () => {
      const res = await httpClient.get<ExamDto[]>(`/students/${user?.id}/exams`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  useWebSocket({
    events: {
      EXAM_STARTED: () => {
        queryClient.invalidateQueries({ queryKey: ["students", user?.id, "exams"] });
        setActiveExam(null);
      },
    },
  });

  if (!examEnabled) {
    return <div className="py-20 text-center text-muted-foreground text-sm">Exam engine is not enabled.</div>;
  }

  if (activeExam !== null) {
    return <ExamParticipateView exam={activeExam} studentId={user?.id ?? ""} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exams</h1>
        <p className="text-muted-foreground text-sm mt-1">Upcoming and past exams.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (exams ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">No exams found.</p>
      ) : (
        <div className="space-y-3">
          {(exams ?? []).map((exam: ExamDto) => {
            const scheduled = new Date(exam.scheduledAt ?? "");
            const now = new Date();
            const status = exam.status ?? (scheduled > now ? "upcoming" : "completed");
            return (
              <div key={exam.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="font-semibold text-sm truncate">{exam.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {scheduled.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                    {exam.durationMinutes !== undefined && ` · ${exam.durationMinutes} min`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={status === "upcoming" ? "default" : "outline"} className="capitalize">
                    {status}
                  </Badge>
                  {status === "upcoming" && (
                    <button
                      type="button"
                      onClick={() => setActiveExam(exam)}
                      className={cn("text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors")}
                    >
                      Start
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}