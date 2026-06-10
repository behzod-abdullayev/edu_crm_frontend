"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { httpClient } from "@/services/api/axios.instance";
import { ModuleList } from "./ModuleList";
import { LessonViewer } from "./LessonViewer";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import type { LessonItem, ModuleWithLessons } from "../types/course.types";
import { mapModuleDto, type ModuleDto } from "../utils/course.mapper";
import { cn } from "@shared/lib/utils";
import {
  ChevronLeft,
  BookOpen,
  CheckCircle2,
  ListVideo,
  X,
} from "lucide-react";
import Link from "next/link";

// ─── Local API response shapes ────────────────────────────────────────────────

interface CourseDetailResponse {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string | null;
  modules?: ModuleDto[];
  totalLessons?: number;
  estimatedHours?: number;
}

interface ProgressResponse {
  completedLessonIds: string[];
  progressPercent: number;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CourseDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading course">
      {/* Back link skeleton */}
      <div className="h-5 w-32 rounded-md bg-[var(--bg-surface-hover)]" />
      {/* Title skeleton */}
      <div className="h-8 w-2/3 rounded-md bg-[var(--bg-surface-hover)]" />
      {/* Progress bar skeleton */}
      <div className="h-2 w-full rounded-full bg-[var(--bg-surface-hover)]" />
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <div className="lg:col-span-2 h-96 rounded-xl bg-[var(--bg-surface-hover)]" />
        <div className="h-96 rounded-xl bg-[var(--bg-surface-hover)]" />
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  percent: number;
  completedCount: number;
  totalCount: number;
}

function ProgressBar({ percent, completedCount, totalCount }: ProgressBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[var(--success-solid)]" />
          {completedCount} / {totalCount} lessons completed
        </span>
        <span className="font-semibold text-[var(--text-primary)]">
          {percent}%
        </span>
      </div>
      <div
        className="h-2 w-full rounded-full bg-[var(--bg-surface-hover)] overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Course completion progress"
      >
        <motion.div
          className="h-full rounded-full bg-[var(--brand-primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </div>
  );
}

// ─── Mobile panel toggle button ───────────────────────────────────────────────

interface MobilePanelToggleProps {
  showModules: boolean;
  onToggle: () => void;
  completedCount: number;
  totalCount: number;
}

function MobilePanelToggle({
  showModules,
  onToggle,
  completedCount,
  totalCount,
}: MobilePanelToggleProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "w-full min-h-[44px] flex items-center justify-between gap-3",
        "px-4 py-2.5 rounded-xl border border-[var(--border-default)]",
        "bg-[var(--bg-surface)] text-sm font-medium",
        "hover:bg-[var(--bg-surface-hover)] transition-colors duration-[var(--transition-base)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2",
      )}
      aria-expanded={showModules}
      aria-controls="course-modules-panel"
    >
      <span className="flex items-center gap-2 text-[var(--text-primary)]">
        {showModules ? (
          <X className="w-4 h-4 text-[var(--text-secondary)]" />
        ) : (
          <ListVideo className="w-4 h-4 text-[var(--brand-primary)]" />
        )}
        {showModules ? "Hide Course Content" : "Course Content"}
      </span>
      <span className="text-xs text-[var(--text-muted)] font-normal">
        {completedCount}/{totalCount}
      </span>
    </motion.button>
  );
}

// ─── Empty lesson state ───────────────────────────────────────────────────────

function EmptyLessonState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        "rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]",
        "p-12 text-center",
      )}
    >
      <div className="w-14 h-14 rounded-full bg-[var(--bg-surface-hover)] flex items-center justify-center">
        <BookOpen className="w-7 h-7 text-[var(--text-muted)]" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          No lesson selected
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Choose a lesson from the course content panel to get started.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface StudentCourseDetailClientProps {
  courseId: string;
}

export function StudentCourseDetailClient({
  courseId,
}: StudentCourseDetailClientProps) {
  const { user } = useCurrentUser();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);
  const [showModules, setShowModules] = useState(false);

  // ── Course detail query ──────────────────────────────────────────────────
  const { data: courseData, isLoading: courseLoading } =
    useQuery<CourseDetailResponse>({
      queryKey: ["students", user?.id, "courses", courseId, "detail"],
      queryFn: async () => {
        const res = await httpClient.get<CourseDetailResponse>(
          `/students/${user?.id}/courses/${courseId}/detail`,
        );
        return res.data;
      },
      enabled: !!user?.id && !!courseId,
      staleTime: 5 * 60 * 1_000,
    });

  // ── Progress query ───────────────────────────────────────────────────────
  const { data: progressData, isLoading: progressLoading } =
    useQuery<ProgressResponse>({
      queryKey: ["students", user?.id, "courses", courseId, "progress"],
      queryFn: async () => {
        const res = await httpClient.get<ProgressResponse>(
          `/students/${user?.id}/courses/${courseId}/progress`,
        );
        return res.data;
      },
      enabled: !!user?.id && !!courseId,
      staleTime: 2 * 60 * 1_000,
    });

  // ── Mark lesson complete mutation ────────────────────────────────────────
  const completeMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      await httpClient.post(
        `/students/${user?.id}/courses/${courseId}/lessons/${lessonId}/complete`,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["students", user?.id, "courses", courseId, "progress"],
      });
    },
  });

  // ── Derived state ────────────────────────────────────────────────────────
  const completedIds = useMemo<Set<string>>(
    () => new Set<string>(progressData?.completedLessonIds ?? []),
    [progressData],
  );

  const modules: ModuleWithLessons[] = useMemo(
    () => (courseData?.modules ?? []).map((m) => mapModuleDto(m, completedIds)),
    [courseData, completedIds],
  );

  const allLessons = useMemo(
    () => modules.flatMap((m) => m.lessons),
    [modules],
  );

  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter((l) => l.isCompleted).length;
  const progressPercent =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const defaultLesson = useMemo<LessonItem | null>(() => {
    for (const mod of modules) {
      const lesson = mod.lessons.find((l) => !l.isCompleted);
      if (lesson) return lesson;
    }
    return modules[0]?.lessons[0] ?? null;
  }, [modules]);

  const currentLesson = activeLesson ?? defaultLesson;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLessonSelect = useCallback(
    (lesson: LessonItem) => {
      setActiveLesson(lesson);
      if (isMobile) setShowModules(false);
    },
    [isMobile],
  );

  const handleLessonComplete = useCallback(() => {
    if (!currentLesson) return;
    void completeMutation.mutateAsync(currentLesson.id);
    const idx = allLessons.findIndex((l) => l.id === currentLesson.id);
    const next = allLessons[idx + 1];
    if (next) setActiveLesson(next);
  }, [currentLesson, allLessons, completeMutation]);

  const toggleModules = useCallback(() => {
    setShowModules((v) => !v);
  }, []);

  // ── Loading state ────────────────────────────────────────────────────────
  const isLoading = courseLoading || progressLoading;

  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  // ── Mobile layout: lesson viewer and module list are toggled ─────────────
  const renderMobileLayout = () => (
    <div className="space-y-4">
      <MobilePanelToggle
        showModules={showModules}
        onToggle={toggleModules}
        completedCount={completedCount}
        totalCount={totalLessons}
      />

      <AnimatePresence mode="wait">
        {showModules ? (
          <motion.div
            key="modules-panel"
            id="course-modules-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <ModuleList
              modules={modules}
              onLessonSelect={handleLessonSelect}
              {...(currentLesson?.id !== undefined
                ? { activeLessonId: currentLesson.id }
                : {})}
            />
          </motion.div>
        ) : (
          <motion.div
            key="lesson-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {currentLesson ? (
              <LessonViewer
                lesson={currentLesson}
                courseId={courseId}
                onComplete={handleLessonComplete}
              />
            ) : (
              <EmptyLessonState />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── Desktop layout: side-by-side ─────────────────────────────────────────
  const renderDesktopLayout = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lesson viewer — takes 2/3 width */}
      <div className="lg:col-span-2">
        {currentLesson ? (
          <motion.div
            key={currentLesson.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <LessonViewer
              lesson={currentLesson}
              courseId={courseId}
              onComplete={handleLessonComplete}
            />
          </motion.div>
        ) : (
          <EmptyLessonState />
        )}
      </div>

      {/* Module list sidebar — takes 1/3 width */}
      <div className="lg:col-span-1">
        <ModuleList
          modules={modules}
          onLessonSelect={handleLessonSelect}
          {...(currentLesson?.id !== undefined
            ? { activeLessonId: currentLesson.id }
            : {})}
        />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Back link */}
      <Link
        href="/student/courses"
        className={cn(
          "inline-flex items-center gap-1.5 text-sm",
          "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
          "transition-colors duration-[var(--transition-fast)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]",
          "focus-visible:ring-offset-2 rounded-sm",
        )}
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to courses
      </Link>

      {/* Course title */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-[var(--text-primary)] leading-tight">
          {courseData?.name ?? "Course"}
        </h1>
        {courseData?.description && (
          <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
            {courseData.description}
          </p>
        )}
      </div>

      {/* Progress bar */}
      {totalLessons > 0 && (
        <ProgressBar
          percent={progressPercent}
          completedCount={completedCount}
          totalCount={totalLessons}
        />
      )}

      {/* Layout: mobile vs desktop */}
      {isMobile ? renderMobileLayout() : renderDesktopLayout()}
    </motion.div>
  );
}