"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GraduationCap, TrendingUp } from "lucide-react";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { httpClient } from "@/services/api/axios.instance";
import { GradesList, type CourseGradesSummaryDto } from "./GradesList";
import { cn } from "@shared/lib/utils";

// Lazy-load heavy chart (Recharts)
const GradeTrendChart = dynamic(() => import("./GradeTrendChart"), {
  ssr: false,
});

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

// ── Average badge ─────────────────────────────────────────────────────────────
function AverageBadge({ avg }: { avg: number }) {
  const color =
    avg >= 80
      ? "text-[var(--success-text)] bg-[var(--success-bg)] border-[var(--success-border)]"
      : avg >= 60
        ? "text-[var(--warning-text)] bg-[var(--warning-bg)] border-[var(--warning-border)]"
        : "text-[var(--error-text)] bg-[var(--error-bg)] border-[var(--error-border)]";

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn(
        "rounded-xl border px-5 py-3 text-right",
        color,
      )}
      aria-label={`Overall average grade: ${avg}%`}
    >
      <p className="text-3xl font-bold tabular-nums">{avg}%</p>
      <p className="text-xs font-medium mt-0.5 opacity-80">Overall average</p>
    </motion.div>
  );
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
        <GraduationCap
          className="w-8 h-8 text-[var(--text-muted)]"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-[var(--text-primary)]">No grades yet</p>
        <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">
          Your graded homework and exam results will appear here.
        </p>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function StudentGradesClient() {
  const { user } = useCurrentUser();

  const studentId = user?.id ?? "";

  const { data: summaries, isLoading } = useQuery({
    queryKey: ["students", studentId, "grades"],
    queryFn: async () => {
      const res = await httpClient.get<CourseGradesSummaryDto[]>(
        `/students/${studentId}/grades`,
      );
      return res.data;
    },
    enabled: !!studentId,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Compute overall average across all course summaries
  const overallAvg =
    summaries !== undefined && summaries.length > 0
      ? Math.round(
          summaries.reduce(
            (acc: number, s: CourseGradesSummaryDto) =>
              acc + (s.averageScore ?? 0),
            0,
          ) / summaries.length,
        )
      : 0;

  const hasSummaries = !isLoading && summaries !== undefined && summaries.length > 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            Grades
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {isLoading
              ? "Loading…"
              : `${summaries?.length ?? 0} course${(summaries?.length ?? 0) !== 1 ? "s" : ""} with graded assessments`}
          </p>
        </div>

        {/* Overall average — only shown once data is loaded */}
        {hasSummaries && <AverageBadge avg={overallAvg} />}
      </motion.div>

      {/* Grade trend chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3"
      >
        <div className="flex items-center gap-2">
          <TrendingUp
            className="w-4 h-4 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          <h2 className="font-semibold text-sm text-[var(--text-primary)]">
            Grade Trend
          </h2>
        </div>
        <GradeTrendChart studentId={studentId} />
      </motion.div>

      {/* Grades list */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        {isLoading ? (
          <div
            className="space-y-3"
            aria-busy="true"
            aria-label="Loading grades"
          >
            {[1, 2, 3].map((i) => (
              <Shimmer key={i} className="h-14" />
            ))}
          </div>
        ) : !hasSummaries ? (
          <EmptyState />
        ) : (
          <GradesList summaries={summaries ?? []} />
        )}
      </motion.div>
    </div>
  );
}
