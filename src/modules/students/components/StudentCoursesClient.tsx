"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, Filter } from "lucide-react";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useStudentCourses } from "@/modules/students/hooks/useStudentCourses";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { CourseCard, type CourseCardData } from "@/modules/courses/components/CourseCard";
import { cn } from "@shared/lib/utils";
import type { CourseEnrollmentDto } from "@/modules/students/hooks/useStudentCourses";

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTER_TABS = ["All", "Active", "Completed"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

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

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-64 flex-col items-center justify-center gap-3 text-center py-16"
      role="status"
    >
      <div className="w-16 h-16 rounded-full bg-[var(--bg-surface-hover)] flex items-center justify-center">
        <BookOpen
          className="w-8 h-8 text-[var(--text-muted)]"
          aria-hidden="true"
        />
      </div>
      <p className="font-semibold text-[var(--text-primary)]">No courses found</p>
      <p className="text-sm text-[var(--text-muted)] max-w-xs">
        {hasSearch
          ? "Try a different search term or change the filter."
          : "You have not enrolled in any courses yet."}
      </p>
    </motion.div>
  );
}

// ── Map enrollment DTO → CourseCard props (exactOptionalPropertyTypes safe) ──
function toCourseCardData(e: CourseEnrollmentDto): CourseCardData {
  return {
    id: e.courseId,
    name: e.courseName,
    status: e.status,
    ...(e.thumbnailUrl !== undefined && { thumbnailUrl: e.thumbnailUrl }),
    ...(e.level !== undefined && { level: e.level }),
    ...(e.lessonCount !== undefined && { lessonCount: e.lessonCount }),
  };
}

// ── Main component ────────────────────────────────────────────────────────────
export function StudentCoursesClient() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [search, setSearch] = useState("");

  // Load all enrollments (client-side filter below)
  const { data: coursesData, isLoading } = useStudentCourses(
    user?.id ?? "",
    { pageSize: 100 },
  );

  const allEnrollments = coursesData?.data ?? [];

  // Client-side filter by search + active tab
  const filtered = useMemo<CourseEnrollmentDto[]>(() => {
    const q = search.toLowerCase().trim();
    return allEnrollments.filter((e) => {
      const matchSearch = !q || e.courseName.toLowerCase().includes(q);
      const matchFilter =
        activeFilter === "All" ||
        (activeFilter === "Active" && e.status === "active") ||
        (activeFilter === "Completed" && e.status === "completed");
      return matchSearch && matchFilter;
    });
  }, [allEnrollments, search, activeFilter]);

  return (
    <div className="space-y-6 pb-8">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
          My Courses
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {isLoading
            ? "Loading…"
            : `${allEnrollments.length} enrolled course${allEnrollments.length !== 1 ? "s" : ""}`}
        </p>
      </motion.div>

      {/* Search + filter toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={cn(
          "flex gap-3",
          isMobile ? "flex-col" : "flex-row items-center",
        )}
      >
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search courses"
            className={cn(
              "h-9 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]",
              "pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] transition-shadow",
            )}
          />
        </div>

        {/* Filter tabs */}
        <div
          className="flex gap-1.5"
          role="tablist"
          aria-label="Filter courses by status"
        >
          <Filter
            className="w-4 h-4 text-[var(--text-muted)] my-auto mr-1 flex-shrink-0"
            aria-hidden="true"
          />
          {FILTER_TABS.map((tab) => (
            <motion.button
              key={tab}
              role="tab"
              aria-selected={activeFilter === tab}
              onClick={() => setActiveFilter(tab)}
              type="button"
              whileTap={{ scale: 0.95 }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                activeFilter === tab
                  ? "bg-[var(--brand-primary)] text-[var(--text-on-brand)]"
                  : "border border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]",
              )}
            >
              {tab}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Course grid */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            aria-busy="true"
            aria-label="Loading courses"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Shimmer key={i} className="h-52" />
            ))}
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState hasSearch={!!search} />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.05 } },
              hidden: {},
            }}
          >
            {filtered.map((enrollment) => (
              <motion.div
                key={enrollment.courseId}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                }}
              >
                <CourseCard
                  course={toCourseCardData(enrollment)}
                  href={`/student/courses/${enrollment.courseId}`}
                  showProgress
                  progressPercent={enrollment.progressPercent ?? 0}
                  {...(enrollment.nextLessonTitle !== undefined && {
                    nextLessonTitle: enrollment.nextLessonTitle,
                  })}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
