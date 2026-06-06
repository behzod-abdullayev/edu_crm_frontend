"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { httpClient } from "@/services/api/axios.instance";
import { HomeworkGradingTable } from "./HomeworkGradingTable";
import { Badge } from "@shared/components/ui/badge";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { cn } from "@shared/lib/utils";
import {
  ChevronLeft,
  FileText,
  Users,
  Star,
  Calendar,
  CheckCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import type { HomeworkDetailDto } from "@generated/models";

// ─── Type alias & status enum ─────────────────────────────────────────────────
type HomeworkDetail = HomeworkDetailDto & { status: "published" | "draft" | "closed"; maxScore?: number };

const HomeworkStatus = {
  published: "published",
  draft: "draft",
  closed: "closed",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function HwStatusBadge({ status }: { status: HomeworkDetail["status"] }) {
  const map: Record<string, { label: string; className: string }> = {
    [HomeworkStatus.published]: {
      label: "Published",
      className:
        "bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]",
    },
    [HomeworkStatus.draft]: {
      label: "Draft",
      className:
        "bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border-[var(--border-default)]",
    },
    [HomeworkStatus.closed]: {
      label: "Closed",
      className:
        "bg-[var(--error-bg)] text-[var(--error-text)] border-[var(--error-border)]",
    },
  };

  const config = map[status] ?? map[HomeworkStatus.draft]!;

  return (
    <span
      role="status"
      aria-label={`Status: ${config.label}`}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading homework details">
      {/* Back link skeleton */}
      <div className="skeleton h-4 w-36 rounded-md" aria-hidden="true" />

      {/* Header card skeleton */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="skeleton h-6 rounded-md w-3/5" aria-hidden="true" />
          <div className="skeleton h-6 rounded-full w-28" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="skeleton h-3 rounded-md w-16" aria-hidden="true" />
              <div className="skeleton h-4 rounded-md w-24" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>

      {/* Submissions skeleton */}
      <div className="space-y-3">
        <div className="skeleton h-5 rounded-md w-28" aria-hidden="true" />
        <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex gap-4 px-4 py-3 border-b border-[var(--border-default)] last:border-0"
              aria-hidden="true"
            >
              <div className="skeleton h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 rounded-md w-1/3" />
                <div className="skeleton h-3 rounded-md w-1/4" />
              </div>
              <div className="skeleton h-8 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stat Item ────────────────────────────────────────────────────────────────

interface StatItemProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  highlight?: boolean;
}

function StatItem({ label, value, icon: Icon, iconColor, highlight }: StatItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">
        <Icon
          className="w-3.5 h-3.5"
          style={{ color: iconColor }}
          aria-hidden="true"
        />
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-semibold",
          highlight
            ? "text-[var(--error-text)]"
            : "text-[var(--text-primary)]"
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Submission Progress Bar ──────────────────────────────────────────────────

interface ProgressBarProps {
  submitted: number;
  total: number;
}

function SubmissionProgress({ submitted, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)]">Submission rate</span>
        <span className="font-semibold text-[var(--text-primary)] tabular-nums">
          {submitted}/{total} ({pct}%)
        </span>
      </div>
      <div
        className="h-2 rounded-full bg-[var(--bg-surface-secondary)] overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% submission rate`}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className={cn(
            "h-full rounded-full",
            pct >= 80
              ? "bg-[var(--success-solid)]"
              : pct >= 50
              ? "bg-[var(--warning-solid)]"
              : "bg-[var(--brand-primary)]"
          )}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TeacherHomeworkDetailClientProps {
  homeworkId: string;
}

export function TeacherHomeworkDetailClient({
  homeworkId,
}: TeacherHomeworkDetailClientProps) {
  const isMobile = useIsMobile();

  const {
    data: hw,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["homework", homeworkId, "teacher-detail"],
    queryFn: async () => {
      const r = await httpClient.get<HomeworkDetail>(
        `/homework/${homeworkId}`
      );
      return r.data;
    },
    enabled: !!homeworkId,
    staleTime: 2 * 60 * 1000,
  });

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return <DetailSkeleton />;
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError || !hw) {
    return (
      <div className="space-y-4">
        <Link
          href="/teacher/homework"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          Back to Homework
        </Link>
        <div
          role="alert"
          className="rounded-xl border border-[var(--error-border)] bg-[var(--error-bg)] p-5 text-[var(--error-text)] text-sm"
        >
          {error instanceof Error
            ? error.message
            : "Failed to load homework details. Please try again."}
        </div>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const submissionsCount = hw.submissions?.length ?? 0;
  const gradedCount =
    hw.submissions?.filter((s: { status: string }) => s.status === "graded").length ?? 0;
  const overdueFlag = hw.dueDate && isOverdue(hw.dueDate);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* ── Back Link ──────────────────────────────────────────────────────── */}
      <Link
        href="/teacher/homework"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-[var(--transition-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded"
        aria-label="Back to homework list"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to Homework
      </Link>

      {/* ── Header Card ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center shrink-0 mt-0.5">
              <FileText
                className="w-4.5 h-4.5 text-[var(--brand-primary)]"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <h1
                className={cn(
                  "font-bold text-[var(--text-primary)] leading-snug",
                  isMobile ? "text-lg" : "text-2xl"
                )}
              >
                {hw.title}
              </h1>
              {hw.description && (
                <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                  {hw.description}
                </p>
              )}
            </div>
          </div>
          <HwStatusBadge status={hw.status} />
        </div>

        {/* Stats grid */}
        <div
          className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
          )}
        >
          <StatItem
            label="Group"
            value={hw.groupName ?? "—"}
            icon={Users}
            iconColor="var(--brand-secondary)"
          />
          <StatItem
            label="Max Score"
            value={hw.maxScore != null ? `${hw.maxScore} pts` : "—"}
            icon={Star}
            iconColor="var(--role-owner)"
          />
          <StatItem
            label="Due Date"
            value={hw.dueDate ? formatDate(hw.dueDate) : "—"}
            icon={Calendar}
            iconColor={
              overdueFlag
                ? "var(--error-solid)"
                : "var(--text-muted)"
            }
            highlight={!!overdueFlag}
          />
          <StatItem
            label="Graded"
            value={`${gradedCount} / ${submissionsCount}`}
            icon={CheckCircle}
            iconColor="var(--success-solid)"
          />
        </div>

        {/* Submission progress */}
        {submissionsCount > 0 && (
          <SubmissionProgress
            submitted={submissionsCount}
            total={submissionsCount}
          />
        )}

        {/* Overdue notice */}
        {overdueFlag && hw.status === HomeworkStatus.published && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 text-xs text-[var(--warning-text)] bg-[var(--warning-bg)] border border-[var(--warning-border)] rounded-lg px-3 py-2"
            role="alert"
          >
            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            This assignment is past the due date. Consider closing it or extending the deadline.
          </motion.div>
        )}
      </div>

      {/* ── Submissions Section ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base text-[var(--text-primary)] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--brand-primary)]" aria-hidden="true" />
            Submissions
            {submissionsCount > 0 && (
              <Badge variant="outline" className="tabular-nums">
                {submissionsCount}
              </Badge>
            )}
          </h2>

          {gradedCount > 0 && (
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <CheckCircle
                className="w-3.5 h-3.5 text-[var(--success-solid)]"
                aria-hidden="true"
              />
              {gradedCount} graded
            </span>
          )}
        </div>

        <HomeworkGradingTable
          homeworkId={homeworkId}
          maxPoints={hw.maxScore ?? 100}
        />
      </div>
    </motion.div>
  );
}
