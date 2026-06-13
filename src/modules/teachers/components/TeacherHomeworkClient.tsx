"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useTeacherHomework } from "@/modules/teachers/hooks/useTeacher";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { MobileCardList } from "@shared/components/mobile/MobileCardList";
import { EmptyState } from "@shared/components/data-display/EmptyState";
import { ErrorState } from "@shared/components/data-display/ErrorState";
import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import {
  Plus,
  FileText,
  Calendar,
  CheckSquare,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { HomeworkDto } from "@generated/models";

// ─── Homework type alias & status enum ───────────────────────────────────────

type Homework = HomeworkDto & {
  status: "published" | "draft" | "closed";
  submissionCount?: number;
};

const HomeworkStatus = {
  published: "published",
  draft: "draft",
  closed: "closed",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function HomeworkStatusBadge({ status }: { status: Homework["status"] }) {
  const map: Record<Homework["status"], { label: string; className: string }> =
    {
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
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

// ─── Desktop Table Row ────────────────────────────────────────────────────────

const rowVariants = {
  hidden: { opacity: 0, x: -4 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: Math.min(i * 0.05, 0.5), duration: 0.25 },
  }),
};

interface HomeworkRowProps {
  hw: Homework;
  index: number;
  locale: string;
}

function HomeworkRow({ hw, index, locale }: HomeworkRowProps) {
  const overdue =
    hw.dueDate &&
    hw.status === HomeworkStatus.published &&
    isOverdue(hw.dueDate);

  return (
    <motion.tr
      custom={index}
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      className="border-b border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-colors duration-[var(--transition-fast)] group"
    >
      {/* Title */}
      <td className="px-4 py-3">
        <Link
          href={`/${locale}/teacher/homework/${hw.id}`}
          className="font-medium text-sm text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded"
        >
          {hw.title}
        </Link>
      </td>

      {/* Group */}
      <td className="px-4 py-3">
        <span className="text-sm text-[var(--text-secondary)]">
          {hw.groupName ?? "—"}
        </span>
      </td>

      {/* Due */}
      <td className="px-4 py-3">
        <span
          className={cn(
            "text-sm tabular-nums",
            overdue
              ? "text-[var(--error-text)] font-medium"
              : "text-[var(--text-secondary)]"
          )}
        >
          {hw.dueDate ? formatDate(hw.dueDate) : "—"}
          {overdue && (
            <span className="ml-1 text-xs text-[var(--error-solid)]">
              Overdue
            </span>
          )}
        </span>
      </td>

      {/* Submissions */}
      <td className="px-4 py-3">
        <span className="text-sm tabular-nums text-[var(--text-secondary)]">
          {hw.submissionCount ?? 0}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <HomeworkStatusBadge status={hw.status} />
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <Link
          href={`/${locale}/teacher/homework/${hw.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`View homework: ${hw.title}`}
        >
          View
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </td>
    </motion.tr>
  );
}

// ─── Desktop Skeleton ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr
          key={i}
          className="border-b border-[var(--border-default)]"
          aria-hidden="true"
        >
          {[70, 50, 45, 30, 40, 24].map((w, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="skeleton h-4 rounded-md"
                style={{ width: `${w}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

interface MobileHomeworkCardProps {
  hw: Homework;
  locale: string;
}

function MobileHomeworkCard({ hw, locale }: MobileHomeworkCardProps) {
  const overdue =
    hw.dueDate &&
    hw.status === HomeworkStatus.published &&
    isOverdue(hw.dueDate);

  return (
    <Link
      href={`/${locale}/teacher/homework/${hw.id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded-xl"
      aria-label={`Homework: ${hw.title}`}
    >
      <motion.div
        whileTap={{ scale: 0.985 }}
        className="p-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl space-y-2.5 hover:border-[var(--brand-primary)]/30 transition-colors active:bg-[var(--bg-surface-hover)]"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <FileText
              className="w-4 h-4 text-[var(--brand-primary)] mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="font-semibold text-sm leading-snug text-[var(--text-primary)] line-clamp-2">
              {hw.title}
            </p>
          </div>
          <HomeworkStatusBadge status={hw.status} />
        </div>

        {hw.groupName && (
          <p className="text-xs text-[var(--text-muted)] pl-6">
            {hw.groupName}
          </p>
        )}

        <div className="flex items-center gap-3 pl-6 flex-wrap">
          {hw.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                overdue
                  ? "text-[var(--error-text)] font-medium"
                  : "text-[var(--text-muted)]"
              )}
            >
              <Calendar className="w-3 h-3" aria-hidden="true" />
              {overdue ? "Overdue · " : "Due "}
              {formatDate(hw.dueDate)}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <CheckSquare className="w-3 h-3" aria-hidden="true" />
            {hw.submissionCount ?? 0} submission
            {hw.submissionCount !== 1 ? "s" : ""}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const COLS = ["Title", "Group", "Due Date", "Submissions", "Status", ""];

export function TeacherHomeworkClient() {
  const { user } = useCurrentUser();
  const locale = useLocale();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const teacherId = user?.teacherId ?? "";

  const { data, isLoading, isError, error, refetch } = useTeacherHomework(
    teacherId,
    { page, pageSize: PAGE_SIZE }
  );

  const rows = (data?.data ?? []) as Homework[];
  const totalPages = data?.totalPages ?? 1;

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["teachers", teacherId, "homework"],
    });
  }, [queryClient, teacherId]);

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const goToPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const goToNext = useCallback(
    () => setPage((p) => Math.min(totalPages, p + 1)),
    [totalPages]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className={cn(
              "font-bold tracking-tight text-[var(--text-primary)]",
              isMobile ? "text-xl" : "text-3xl"
            )}
          >
            Homework
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Assignments you&apos;ve created
            {data?.total != null ? ` · ${data.total} total` : ""}
          </p>
        </div>

        <Button asChild size="sm" className="gap-1.5 shrink-0">
          <Link href={`/${locale}/teacher/homework/create`}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Create
          </Link>
        </Button>
      </div>

      {/* ── Error / Mobile / Desktop ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {isError && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ErrorState
              error={
                error instanceof Error
                  ? error
                  : new Error("Failed to load homework")
              }
              title="Could not load homework"
              onRetry={() => void refetch()}
            />
          </motion.div>
        )}

        {/* ── Mobile Card List ─────────────────────────────────────────────── */}
        {isMobile && !isError && (
          <motion.div
            key="mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MobileCardList
              data={rows}
              isLoading={isLoading}
              hasMore={page < totalPages}
              onLoadMore={handleLoadMore}
              onRefresh={handleRefresh}
              emptyState={{
                title: "No homework yet",
                description: "Create your first assignment to get started.",
              }}
              renderCard={(hw: Homework) => (
                <MobileHomeworkCard hw={hw} locale={locale} />
              )}
            />
          </motion.div>
        )}

        {/* ── Desktop Table ────────────────────────────────────────────────── */}
        {!isMobile && !isError && (
          <motion.div
            key="desktop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-[var(--border-default)] overflow-hidden bg-[var(--bg-surface)]"
          >
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                role="table"
                aria-label="Homework list"
                aria-busy={isLoading}
              >
                <thead className="bg-[var(--bg-surface-secondary)] border-b border-[var(--border-default)]">
                  <tr>
                    {COLS.map((col) => (
                      <th
                        key={col}
                        scope="col"
                        className="text-left px-4 py-3 font-medium text-[var(--text-muted)] text-xs uppercase tracking-wide whitespace-nowrap"
                      >
                        {col ? (
                          <span className="flex items-center gap-1">
                            {col}
                            {col === "Due Date" && (
                              <ArrowUpDown
                                className="w-3 h-3 opacity-40"
                                aria-hidden="true"
                              />
                            )}
                          </span>
                        ) : null}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <TableSkeleton />
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={COLS.length} className="py-0">
                        <EmptyState
                          icon={FileText}
                          title="No homework yet"
                          description="Create your first assignment."
                          action={{
                            label: "Create homework",
                            onClick: () => void 0,
                          }}
                        />
                      </td>
                    </tr>
                  ) : (
                    rows.map((hw, i) => (
                      <HomeworkRow
                        key={hw.id}
                        hw={hw}
                        index={i}
                        locale={locale}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && !isLoading && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-default)] bg-[var(--bg-surface-secondary)]">
                <span className="text-sm text-[var(--text-muted)]">
                  Page{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {page}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {totalPages}
                  </span>
                  {data?.total != null && <> · {data.total} total</>}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrev}
                    disabled={page <= 1}
                    aria-label="Previous page"
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </Button>

                  {Array.from(
                    { length: Math.min(totalPages, 5) },
                    (_, i) => {
                      const pageNum =
                        totalPages <= 5
                          ? i + 1
                          : page <= 3
                          ? i + 1
                          : page >= totalPages - 2
                          ? totalPages - 4 + i
                          : page - 2 + i;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          aria-label={`Go to page ${pageNum}`}
                          aria-current={
                            pageNum === page ? "page" : undefined
                          }
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNext}
                    disabled={page >= totalPages}
                    aria-label="Next page"
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
