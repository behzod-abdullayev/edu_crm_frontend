"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { useHomeworkGrade } from "@/modules/teachers/hooks/useTeacher";
import { httpClient } from "@/services/api/axios.instance";
import { MobileCardList } from "@shared/components/MobileCardList";
import { SwipeableCard } from "@shared/components/SwipeableCard";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/components/ui/avatar";
import type { HomeworkSubmissionDto } from "@generated/models";
import { cn } from "@shared/lib/utils";
import { CheckCircle, Clock, Star } from "lucide-react";

interface HomeworkGradingTableProps {
  homeworkId: string;
  maxPoints: number;
}

interface InlineGradeState {
  [submissionId: string]: { grade: string; feedback: string };
}

export function HomeworkGradingTable({ homeworkId, maxPoints }: HomeworkGradingTableProps) {
  const isMobile = useIsMobile();
  const gradeMutation = useHomeworkGrade();
  const [gradeState, setGradeState] = useState<InlineGradeState>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["homework", homeworkId, "submissions"],
    queryFn: () =>
      httpClient
        .get<HomeworkSubmissionDto[]>(`/homework/${homeworkId}/submissions`)
        .then((r) => r.data),
  });

  const updateGradeState = (submissionId: string, field: "grade" | "feedback", value: string) => {
    setGradeState((prev) => ({
      ...prev,
      [submissionId]: { ...(prev[submissionId] ?? { grade: "", feedback: "" }), [field]: value },
    }));
  };

  const saveGrade = async (submissionId: string) => {
    const state = gradeState[submissionId];
    if (!state) return;
    const grade = Number(state.grade);
    if (isNaN(grade) || grade < 0 || grade > maxPoints) return;
    setSaving((s) => new Set(s).add(submissionId));
    try {
      await gradeMutation.mutateAsync({
        homeworkId,
        submissionId,
        values: { grade, feedback: state.feedback },
      });
    } finally {
      setSaving((s) => {
        const next = new Set(s);
        next.delete(submissionId);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const data = submissions ?? [];

  function SubmissionRow({ sub }: { sub: HomeworkSubmissionDto }) {
    const state = gradeState[sub.id];
    const isSavingThis = saving.has(sub.id);
    return (
      <tr className="border-b border-border hover:bg-muted/30 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={sub.studentAvatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">{(sub.studentName ?? "?").slice(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{sub.studentName}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "—"}
          </span>
        </td>
        <td className="px-4 py-3">
          <Input
            type="number"
            min={0}
            max={maxPoints}
            value={state?.grade ?? String(sub.grade ?? "")}
            onChange={(e) => updateGradeState(sub.id, "grade", e.target.value)}
            className="w-20 h-8 text-sm"
            placeholder={`0–${maxPoints}`}
          />
        </td>
        <td className="px-4 py-3">
          <textarea
            value={state?.feedback ?? sub.teacherFeedback ?? ""}
            onChange={(e) => updateGradeState(sub.id, "feedback", e.target.value)}
            className="w-full min-h-[60px] text-xs border border-border rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 bg-background"
            placeholder="Optional feedback…"
          />
        </td>
        <td className="px-4 py-3">
          <Button size="sm" onClick={() => void saveGrade(sub.id)} disabled={isSavingThis} className="h-8">
            {isSavingThis ? (
              <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
            ) : "Save"}
          </Button>
        </td>
      </tr>
    );
  }

  if (isMobile) {
    return (
      <MobileCardList
        data={data}
        isLoading={isLoading}
        renderCard={(sub: HomeworkSubmissionDto) => {
          const state = gradeState[sub.id];
          const isSavingThis = saving.has(sub.id);
          return (
            <SwipeableCard
              rightActions={[
                {
                  icon: Star,
                  label: "Grade",
                  onClick: () => void saveGrade(sub.id),
                },
              ]}
            >
              <div className="p-4 space-y-3 bg-card border border-border rounded-xl">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={sub.studentAvatarUrl ?? undefined} />
                    <AvatarFallback>{(sub.studentName ?? "?").slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{sub.studentName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {sub.submittedAt ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {new Date(sub.submittedAt).toLocaleString()}
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-500" />
                          Not submitted
                        </>
                      )}
                    </p>
                  </div>
                  {sub.grade !== undefined && sub.grade !== null && (
                    <div className="ml-auto">
                      <span
                        className={cn(
                          "text-sm font-bold",
                          sub.grade / maxPoints >= 0.8
                            ? "text-green-600"
                            : sub.grade / maxPoints >= 0.6
                              ? "text-amber-600"
                              : "text-red-600",
                        )}
                      >
                        {sub.grade}/{maxPoints}
                      </span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Grade (0–{maxPoints})</label>
                    <Input
                      type="number"
                      min={0}
                      max={maxPoints}
                      value={state?.grade ?? String(sub.grade ?? "")}
                      onChange={(e) => updateGradeState(sub.id, "grade", e.target.value)}
                      className="mt-1 h-9 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      size="sm"
                      onClick={() => void saveGrade(sub.id)}
                      disabled={isSavingThis}
                      className="w-full h-9"
                    >
                      {isSavingThis ? (
                        <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                      ) : "Save"}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Feedback</label>
                  <textarea
                    value={state?.feedback ?? sub.teacherFeedback ?? ""}
                    onChange={(e) => updateGradeState(sub.id, "feedback", e.target.value)}
                    className="w-full mt-1 min-h-[60px] text-xs border border-border rounded-lg p-2 resize-none bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
                    placeholder="Optional feedback…"
                  />
                </div>
              </div>
            </SwipeableCard>
          );
        }}
        emptyState={{ title: "No submissions yet", description: "Students haven't submitted yet." }}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Submitted</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Grade (/{maxPoints})</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Feedback</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {data.map((sub) => (
            <SubmissionRow key={sub.id} sub={sub} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
