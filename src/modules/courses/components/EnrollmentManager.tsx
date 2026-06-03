"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/services/api/axios.instance";
import { useToast } from "@shared/hooks/useToast";
import { Avatar, AvatarFallback } from "@shared/components/ui/avatar";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { ConfirmDialog } from "@shared/components/feedback/ConfirmDialog";
import { UserPlus, UserMinus, Search } from "lucide-react";
import type { EnrollmentRecord } from "../types/course.types";
import { cn } from "@shared/lib/utils";

interface EnrollmentManagerProps {
  courseId: string;
  className?: string;
}

export function EnrollmentManager({ courseId, className }: EnrollmentManagerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [unenrollTarget, setUnenrollTarget] = useState<EnrollmentRecord | null>(null);

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["courses", courseId, "enrollments"],
    queryFn: async () => {
      const res = await httpClient.get<EnrollmentRecord[]>(`/courses/${courseId}/enrollments`);
      return res.data;
    },
    enabled: !!courseId,
  });

  const unenrollMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await httpClient.delete(`/courses/${courseId}/enrollments/${studentId}`);
    },
    onMutate: async (studentId) => {
      await queryClient.cancelQueries({ queryKey: ["courses", courseId, "enrollments"] });
      const previous = queryClient.getQueryData<EnrollmentRecord[]>(["courses", courseId, "enrollments"]);
      queryClient.setQueryData<EnrollmentRecord[]>(
        ["courses", courseId, "enrollments"],
        (old) => old?.filter((e) => e.studentId !== studentId) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["courses", courseId, "enrollments"], ctx.previous);
      toast.error("Failed to unenroll student");
    },
    onSuccess: () => {
      toast({ title: "Student unenrolled" });
      void queryClient.invalidateQueries({ queryKey: ["courses", courseId, "enrollments"] });
    },
  });

  const filtered = (enrollments ?? []).filter((e) =>
    e.studentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search enrolled students…"
          className="pl-9"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} student{filtered.length !== 1 ? "s" : ""} enrolled
      </p>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <UserPlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {search ? "No students match your search." : "No students enrolled yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((enrollment) => (
            <div
              key={enrollment.studentId}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
            >
              <Avatar className="w-9 h-9 flex-shrink-0">
                <AvatarFallback className="text-xs">
                  {enrollment.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{enrollment.studentName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${enrollment.progress}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{enrollment.progress}%</span>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setUnenrollTarget(enrollment)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label={`Unenroll ${enrollment.studentName}`}
              >
                <UserMinus className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!unenrollTarget}
        onCancel={() => setUnenrollTarget(null)}
        title="Unenroll Student"
        description={`Remove ${unenrollTarget?.studentName} from this course? Their progress will be lost.`}
        confirmLabel="Unenroll"
        variant="destructive"
        onConfirm={async () => {
          if (unenrollTarget) {
            await unenrollMutation.mutateAsync(unenrollTarget.studentId);
          }
          setUnenrollTarget(null);
        }}
      />
    </div>
  );
}