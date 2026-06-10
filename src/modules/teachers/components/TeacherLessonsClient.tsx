"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useTeacherLessons } from "@/modules/teachers/hooks/useTeacher";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { MobileCardList } from "@shared/components/mobile/MobileCardList";
import { EmptyState } from "@shared/components/data-display/EmptyState";
import { ErrorState } from "@shared/components/data-display/ErrorState";
import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import {
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  File,
  Radio,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react";
import type { LessonDto } from "@generated/models";

// ─── Lesson type alias & enum ─────────────────────────────────────────────────
type Lesson = LessonDto & { isPublished?: boolean };

const LessonType = {
  video: "video",
  text: "text",
  quiz: "quiz",
  file: "file",
  live: "live",
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

// ─── Lesson Type Icon & Label ─────────────────────────────────────────────────

type LessonTypeIcon = {
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
};

const LESSON_TYPE_MAP: Record<string, LessonTypeIcon> = {
  [LessonType.video]: {
    icon: Video,
    label: "Video",
    color: "var(--brand-primary)",
    bg: "var(--brand-primary)/10",
  },
  [LessonType.text]: {
    icon: FileText,
    label: "Text",
    color: "var(--brand-secondary)",
    bg: "var(--brand-secondary)/10",
  },
  [LessonType.quiz]: {
    icon: HelpCircle,
    label: "Quiz",
    color: "var(--brand-accent)",
    bg: "var(--brand-accent)/10",
  },
  [LessonType.file]: {
    icon: File,
    label: "File",
    color: "var(--role-owner)",
    bg: "var(--role-owner)/10",
  },
  [LessonType.live]: {
    icon: Radio,
    label: "Live",
    color: "var(--error-solid)",
    bg: "var(--error-solid)/10",
  },
};

function getLessonType(type: string | undefined): LessonTypeIcon {
  return (
    (type ? LESSON_TYPE_MAP[type] : undefined) ?? {
      icon: BookOpen,
      label: type ?? "Lesson",
      color: "var(--text-muted)",
      bg: "var(--bg-surface-secondary)",
    }
  );
}

// ─── Lesson Type Badge ────────────────────────────────────────────────────────

function LessonTypeBadge({ type }: { type: Lesson["type"] }) {
  const config = getLessonType(type);
  const Icon = config.icon;

  return (
    <span
      role="img"
      aria-label={`Type: ${config.label}`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-transparent"
      style={{
        backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)`,
        color: config.color,
      }}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      {config.label}
    </span>
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
          {[60, 45, 30, 40, 20].map((w, j) => (
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

// ─── Desktop Table Row ────────────────────────────────────────────────────────

const rowVariants = {
  hidden: { opacity: 0, x: -4 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: Math.min(i * 0.05, 0.5), duration: 0.25 },
  }),
};

interface LessonRowProps {
  lesson: Lesson;
  index: number;
}

function LessonRow({ lesson, index }: LessonRowProps) {
  return (
    <motion.tr
      custom={index}
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      className="border-b border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-colors duration-[var(--transition-fast)]"
    >
      {/* Title */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `color-mix(in srgb, ${getLessonType(lesson.type).color} 12%, transparent)`,
            }}
            aria-hidden="true"
          >
            {(() => {
              const { icon: Icon, color } = getLessonType(lesson.type);
              return <Icon className="w-3.5 h-3.5" style={{ color }} />;
            })()}
          </div>
          <span className="font-medium text-sm text-[var(--text-primary)] line-clamp-1">
            {lesson.title}
          </span>
        </div>
      </td>

      {/* Type */}
      <td className="px-4 py-3">
        <LessonTypeBadge type={lesson.type} />
      </td>

      {/* Duration */}
      <td className="px-4 py-3">
        <span className="text-sm text-[var(--text-secondary)] tabular-nums">
          {lesson.duration != null ? `${lesson.duration} min` : "—"}
        </span>
      </td>

      {/* Published */}
      <td className="px-4 py-3">
        <span
          role="status"
          aria-label={lesson.isPublished ? "Published" : "Unpublished"}
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
            lesson.isPublished
              ? "bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]"
              : "bg-[var(--bg-surface-secondary)] text-[var(--text-muted)] border-[var(--border-default)]"
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              lesson.isPublished ? "bg-[var(--success-solid)]" : "bg-[var(--text-muted)]"
            )}
            aria-hidden="true"
          />
          {lesson.isPublished ? "Published" : "Draft"}
        </span>
      </td>

      {/* Date */}
      <td className="px-4 py-3">
        <span className="text-sm text-[var(--text-secondary)]">
          {formatDate(lesson.createdAt)}
        </span>
      </td>
    </motion.tr>
  );
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function MobileLessonCard({ lesson }: { lesson: Lesson }) {
  const { icon: TypeIcon, color } = getLessonType(lesson.type);

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      className="p-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl space-y-2.5 active:bg-[var(--bg-surface-hover)] transition-colors"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
          }}
          aria-hidden="true"
        >
          <TypeIcon className="w-4 h-4" style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[var(--text-primary)] leading-snug line-clamp-2">
            {lesson.title}
          </p>
          {lesson.description && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
              {lesson.description}
            </p>
          )}
        </div>

        <span
          role="status"
          aria-label={lesson.isPublished ? "Published" : "Draft"}
          className={cn(
            "shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
            lesson.isPublished
              ? "bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]"
              : "bg-[var(--bg-surface-secondary)] text-[var(--text-muted)] border-[var(--border-default)]"
          )}
        >
          {lesson.isPublished ? "Published" : "Draft"}
        </span>
      </div>

      <div className="flex items-center gap-3 pl-12 flex-wrap">
        <LessonTypeBadge type={lesson.type} />
        {lesson.duration != null && (
          <span className="text-xs text-[var(--text-muted)] tabular-nums">
            {lesson.duration} min
          </span>
        )}
        <span className="text-xs text-[var(--text-muted)]">
          {formatDate(lesson.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Table Columns ────────────────────────────────────────────────────────────

const COLS = ["Title", "Type", "Duration", "Status", "Uploaded"];

// ─── Main Component ───────────────────────────────────────────────────────────

export function TeacherLessonsClient() {
  const { user } = useCurrentUser();
  const locale = useLocale();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const teacherId = user?.id ?? "";

  const { data, isLoading, isError, error, refetch } = useTeacherLessons(
    teacherId,
    { page }
  );

  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["teachers", teacherId, "lessons"],
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
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className={cn(
              "font-bold tracking-tight text-[var(--text-primary)]",
              isMobile ? "text-xl" : "text-3xl"
            )}
          >
            Lessons
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Uploaded lesson materials
            {data?.total != null ? ` · ${data.total} total` : ""}
          </p>
        </div>

        <Button
          asChild
          size="sm"
          className="gap-1.5 shrink-0"
        >
          <Link href={`/${locale}/teacher/lessons/upload`}>
            <Upload className="w-4 h-4" aria-hidden="true" />
            Upload
          </Link>
        </Button>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* Error */}
        {isError && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ErrorState
              error={error instanceof Error ? error : new Error("Failed to load lessons")}
              title="Could not load lessons"
              onRetry={() => void refetch()}
            />
          </motion.div>
        )}

        {/* Mobile Card List */}
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
                title: "No lessons yet",
                description: "Upload your first lesson to get started.",
                action: { label: "Upload lesson", onClick: () => void 0 },
              }}
              renderCard={(lesson: Lesson) => (
                <MobileLessonCard lesson={lesson} />
              )}
            />
          </motion.div>
        )}

        {/* Desktop Table */}
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
                aria-label="Lessons list"
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
                        {col}
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
                          icon={BookOpen}
                          title="No lessons yet"
                          description="Upload your first lesson material."
                          action={{
                            label: "Upload lesson",
                            onClick: () => void 0,
                          }}
                        />
                      </td>
                    </tr>
                  ) : (
                    rows.map((lesson, i) => (
                      <LessonRow key={lesson.id} lesson={lesson} index={i} />
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
                  {data?.total != null && (
                    <> · {data.total} total</>
                  )}
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

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                        aria-current={pageNum === page ? "page" : undefined}
                        className="h-8 w-8 p-0 text-xs"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

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
