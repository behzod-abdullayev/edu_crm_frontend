"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCheck, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useSocketEvent } from "@shared/hooks/useWebSocket";
import { SocketEvent } from "@/services/websocket/socket.events";
import { httpClient } from "@/services/api/axios.instance";
import { ExamParticipateView, type ExamDto } from "./ExamParticipateView";
import { Badge } from "@shared/components/ui/badge";
import { useFeatureFlag } from "@shared/hooks/useFeatureFlag";
import { cn } from "@shared/lib/utils";

// ── Shimmer skeleton ──────────────────────────────────────────────────────────
function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-xl overflow-hidden", className)}
      style={{
        background:
          "linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s linear infinite",
      }}
      aria-hidden="true"
    />
  );
}

// ── Exam status helpers ───────────────────────────────────────────────────────
type ExamStatus = "upcoming" | "in_progress" | "completed" | "missed";

function resolveStatus(exam: ExamDto): ExamStatus {
  if (exam.status === "completed") return "completed";
  if (exam.status === "in_progress") return "in_progress";
  if (!exam.scheduledAt) return "upcoming";
  const now = Date.now();
  const start = new Date(exam.scheduledAt).getTime();
  const durationMs = (exam.durationMinutes ?? 60) * 60_000;
  if (now < start) return "upcoming";
  if (now < start + durationMs) return "in_progress";
  return "completed";
}

interface StatusCfg {
  label: string;
  badgeVariant: "success" | "warning" | "info" | "error" | "default";
  icon: React.ReactNode;
}

function getStatusConfig(status: ExamStatus): StatusCfg {
  switch (status) {
    case "upcoming":
      return {
        label: "Upcoming",
        badgeVariant: "info",
        icon: <Clock className="w-3.5 h-3.5" aria-hidden="true" />,
      };
    case "in_progress":
      return {
        label: "In Progress",
        badgeVariant: "warning",
        icon: <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />,
      };
    case "completed":
      return {
        label: "Completed",
        badgeVariant: "success",
        icon: <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />,
      };
    case "missed":
      return {
        label: "Missed",
        badgeVariant: "error",
        icon: <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />,
      };
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-20 flex flex-col items-center gap-4 text-center"
      role="status"
    >
      <div className="w-16 h-16 rounded-full bg-[var(--bg-surface-hover)] flex items-center justify-center">
        <ClipboardCheck
          className="w-8 h-8 text-[var(--text-muted)]"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-[var(--text-primary)]">No exams found</p>
        <p className="text-sm text-[var(--text-muted)]">
          Your upcoming and past exams will appear here.
        </p>
      </div>
    </motion.div>
  );
}

// ── Exam row ──────────────────────────────────────────────────────────────────
interface ExamRowProps {
  exam: ExamDto;
  onStart: (exam: ExamDto) => void;
  index: number;
}

function ExamRow({ exam, onStart, index }: ExamRowProps) {
  const status = resolveStatus(exam);
  const cfg = getStatusConfig(status);
  const canStart = status === "upcoming" || status === "in_progress";

  const scheduledDate = exam.scheduledAt
    ? new Date(exam.scheduledAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "TBD";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={cn(
        "rounded-xl border bg-[var(--bg-surface)] p-4",
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
        "transition-shadow hover:shadow-[var(--shadow-sm)]",
        status === "in_progress"
          ? "border-[var(--warning-border)]"
          : "border-[var(--border-default)]",
      )}
      role="article"
      aria-label={`Exam: ${exam.title}`}
    >
      {/* Left: info */}
      <div className="min-w-0 space-y-1.5">
        <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
          {exam.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            {scheduledDate}
          </span>
          {exam.durationMinutes !== undefined && (
            <span>· {exam.durationMinutes} min</span>
          )}
        </div>
      </div>

      {/* Right: badge + action */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant={cfg.badgeVariant} className="gap-1 capitalize">
          {cfg.icon}
          {cfg.label}
        </Badge>

        {canStart && (
          <motion.button
            type="button"
            onClick={() => onStart(exam)}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
              "min-h-[36px] min-w-[60px]",
              status === "in_progress"
                ? "bg-[var(--warning-solid)] text-white hover:opacity-90"
                : "bg-[var(--brand-primary)] text-[var(--text-on-brand)] hover:bg-[var(--brand-primary-hover)]",
            )}
            aria-label={`${status === "in_progress" ? "Continue" : "Start"} exam: ${exam.title}`}
          >
            {status === "in_progress" ? "Continue" : "Start"}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function StudentExamsClient() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const examEnabled = useFeatureFlag("examEngine");
  const [activeExam, setActiveExam] = useState<ExamDto | null>(null);

  const studentId = user?.id ?? "";

  const { data: exams, isLoading } = useQuery({
    queryKey: ["students", studentId, "exams"],
    queryFn: async () => {
      const res = await httpClient.get<ExamDto[]>(
        `/students/${studentId}/exams`,
      );
      return res.data;
    },
    enabled: !!studentId,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // WebSocket: refresh exam list when an exam starts / ends
  useSocketEvent(
    SocketEvent.EXAM_STARTED,
    () => {
      void queryClient.invalidateQueries({
        queryKey: ["students", studentId, "exams"],
      });
      // Close any active exam view so the student sees the updated list
      setActiveExam(null);
    },
    !!studentId,
  );

  // Feature flag guard
  if (!examEnabled) {
    return (
      <div
        className="py-20 text-center text-[var(--text-muted)] text-sm"
        role="status"
      >
        Exam engine is not enabled for this account.
      </div>
    );
  }

  // Active exam — render the participate view
  if (activeExam !== null) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="exam-view"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
        >
          <ExamParticipateView exam={activeExam} studentId={studentId} />
        </motion.div>
      </AnimatePresence>
    );
  }

  const examList = exams ?? [];

  // Split into upcoming/in-progress and completed for visual grouping
  const activeExams = examList.filter((e) => {
    const s = resolveStatus(e);
    return s === "upcoming" || s === "in_progress";
  });
  const pastExams = examList.filter((e) => {
    const s = resolveStatus(e);
    return s === "completed" || s === "missed";
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="exam-list"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-8 pb-8"
      >
        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            Exams
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {isLoading
              ? "Loading…"
              : `${examList.length} exam${examList.length !== 1 ? "s" : ""} total`}
          </p>
        </motion.div>

        {/* Loading skeletons */}
        {isLoading ? (
          <div
            className="space-y-3"
            aria-busy="true"
            aria-label="Loading exams"
          >
            {[1, 2, 3, 4].map((i) => (
              <Shimmer key={i} className="h-20" />
            ))}
          </div>
        ) : examList.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            {/* Upcoming / in-progress */}
            {activeExams.length > 0 && (
              <section aria-labelledby="upcoming-exams-heading">
                <h2
                  id="upcoming-exams-heading"
                  className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3"
                >
                  Upcoming & Active
                </h2>
                <div className="space-y-3">
                  {activeExams.map((exam, i) => (
                    <ExamRow
                      key={exam.id}
                      exam={exam}
                      onStart={setActiveExam}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past exams */}
            {pastExams.length > 0 && (
              <section aria-labelledby="past-exams-heading">
                <h2
                  id="past-exams-heading"
                  className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3"
                >
                  Past Exams
                </h2>
                <div className="space-y-3">
                  {pastExams.map((exam, i) => (
                    <ExamRow
                      key={exam.id}
                      exam={exam}
                      onStart={setActiveExam}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
