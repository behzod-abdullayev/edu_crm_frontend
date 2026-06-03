"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { httpClient } from "@/services/api/axios.instance";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { ExamCreator } from "./ExamCreator";
import { Dialog } from "@shared/components/ui/dialog";
import { MobileBottomSheet } from "@shared/components/MobileBottomSheet";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@shared/components/ui/badge";
import { Plus } from "lucide-react";
import { useFeatureFlag } from "@shared/hooks/useFeatureFlag";
import type { ExamDto } from "@generated/models";

export function TeacherExamsClient() {
  const { data: user } = useCurrentUser();
  const isMobile = useIsMobile();
  const examEnabled = useFeatureFlag("examEngine");
  const [showCreate, setShowCreate] = useState(false);

  const { data: exams, isLoading } = useQuery({
    queryKey: ["teachers", user?.id, "exams"],
    queryFn: () =>
      httpClient
        .get<ExamDto[]>(`/teachers/${user?.id}/exams`)
        .then((r) => r.data),
    enabled: !!user?.id && examEnabled,
  });

  if (!examEnabled) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        Exam engine not enabled.
      </div>
    );
  }

  const CreateForm = (
    <ExamCreator
      onSuccess={() => setShowCreate(false)}
      onCancel={() => setShowCreate(false)}
    />
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Exams</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and schedule exams.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />Create Exam
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (exams ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">No exams yet.</p>
      ) : (
        <div className="space-y-3">
          {(exams ?? []).map((exam: ExamDto) => (
            <div
              key={exam.id}
              className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-semibold text-sm">{exam.title}</p>
                <p className="text-xs text-muted-foreground">
                  {exam.groupName} ·{" "}
                  {exam.scheduledAt ? new Date(exam.scheduledAt).toLocaleString() : "—"}
                </p>
              </div>
              <Badge
                variant={
                  exam.status === "active"
                    ? "destructive"
                    : exam.status === "completed"
                      ? "default"
                      : "outline"
                }
                className="capitalize flex-shrink-0"
              >
                {exam.status ?? "upcoming"}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {isMobile ? (
        <MobileBottomSheet open={showCreate} onClose={() => setShowCreate(false)} title="Create Exam">
          {CreateForm}
        </MobileBottomSheet>
      ) : (
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <div className="p-4 max-w-lg">{CreateForm}</div>
        </Dialog>
      )}
    </div>
  );
}
