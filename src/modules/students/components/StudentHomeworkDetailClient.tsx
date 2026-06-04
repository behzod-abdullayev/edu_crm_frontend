"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { httpClient } from "@/services/api/axios.instance";
import { HomeworkSubmitForm } from "./HomeworkSubmitForm";
import { Badge } from "@shared/components/ui/badge";
import Link from "next/link";
import { ChevronLeft, Paperclip } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeworkFile {
  key: string;
  url: string;
  name: string;
}

interface HomeworkSubmissionDetail {
  grade?: number;
  submittedAt?: string;
  textAnswer?: string;
  attachedFileKeys?: string[];
  teacherFeedback?: string;
}

interface HomeworkDetailDto {
  id: string;
  title: string;
  courseName?: string;
  maxPoints?: number;
  dueDate?: string;
  description?: string;
  allowResubmit?: boolean;
  attachedFiles?: HomeworkFile[];
  mySubmission?: HomeworkSubmissionDetail;
}

interface Props {
  homeworkId: string;
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function HomeworkDetailSkeleton() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="h-8 w-48 rounded bg-muted animate-pulse" />
      <div className="h-64 rounded-xl bg-muted animate-pulse" />
      <div className="h-96 rounded-xl bg-muted animate-pulse" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StudentHomeworkDetailClient({ homeworkId }: Props) {
  const { data: user } = useCurrentUser();

  const { data: hw, isLoading } = useQuery<HomeworkDetailDto>({
    queryKey: ["homework", homeworkId],
    queryFn: async () => {
      const res = await httpClient.get<HomeworkDetailDto>(`/homework/${homeworkId}`);
      return res.data;
    },
    enabled: !!homeworkId,
  });

  if (isLoading) {
    return <HomeworkDetailSkeleton />;
  }

  const submission = hw?.mySubmission;
  const isGraded = submission?.grade !== undefined;
  const isSubmitted = !!submission?.submittedAt;
  const dueDate = hw?.dueDate ? new Date(hw.dueDate) : null;
  const isOverdue = dueDate ? dueDate < new Date() : false;

  // Derive badge
  const badgeVariant = isGraded
    ? "success"
    : isSubmitted
    ? "info"
    : isOverdue
    ? "destructive"
    : "outline";

  const badgeLabel = isGraded
    ? "Graded"
    : isSubmitted
    ? "Submitted"
    : isOverdue
    ? "Overdue"
    : "Pending";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl pb-24 sm:pb-0">
      {/* Back link */}
      <Link
        href="/student/homework"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Homework
      </Link>

      {/* Homework info card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-semibold leading-snug">{hw?.title}</h1>
          <Badge variant={badgeVariant} className="capitalize flex-shrink-0">
            {badgeLabel}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {hw?.courseName && (
            <div>
              <span className="text-muted-foreground">Course: </span>
              <span className="font-medium">{hw.courseName}</span>
            </div>
          )}
          {hw?.maxPoints !== undefined && (
            <div>
              <span className="text-muted-foreground">Max pts: </span>
              <span className="font-medium">{hw.maxPoints}</span>
            </div>
          )}
          {dueDate && (
            <div>
              <span className="text-muted-foreground">Due: </span>
              <span className={`font-medium ${isOverdue ? "text-destructive" : ""}`}>
                {dueDate.toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {hw?.description && (
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: hw.description }}
          />
        )}

        {hw?.attachedFiles && hw.attachedFiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-muted-foreground">Attachments</p>
            {hw.attachedFiles.map((f) => (
              <a
                key={f.key}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Paperclip className="w-3.5 h-3.5" />
                {f.name}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Grade result card */}
      {isGraded && submission && (
        <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-5 space-y-2 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-green-800 dark:text-green-300">Grade</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {submission.grade}/{hw?.maxPoints ?? "?"}
            </p>
          </div>
          {submission.teacherFeedback && (
            <p className="text-sm text-green-700 dark:text-green-400">
              {submission.teacherFeedback}
            </p>
          )}
        </div>
      )}

      {/* Submission form card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Your Submission</h2>
        <HomeworkSubmitForm
          homeworkId={homeworkId}
          studentId={user?.id ?? ""}
          isSubmitted={isSubmitted}
          allowResubmit={hw?.allowResubmit ?? false}
          existingAnswer={submission?.textAnswer ?? undefined}
          existingFileKeys={submission?.attachedFileKeys ?? undefined}
        />
      </div>
    </div>
  );
}