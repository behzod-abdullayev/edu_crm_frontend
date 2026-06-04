'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen } from 'lucide-react';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';
import { useDebounce } from '@shared/hooks/useDebounce';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { useStudentCourses } from '@/modules/students/hooks/useStudentCourses';
import { CourseCard } from './CourseCard';
import type { CourseListParams } from '../types/course.types';

// ─── Filter definitions ───────────────────────────────────────────────────────

type StatusFilter = CourseListParams['status'];

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
];

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// ─── Skeleton card ────────────────────────────────────────────────────────────

function CourseCardSkeleton() {
  return (
    <div
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden"
      aria-hidden="true"
    >
      {/* Thumbnail */}
      <div className="h-36 bg-[var(--bg-surface-hover)] relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded bg-[var(--bg-surface-hover)] relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="h-3 w-1/2 rounded bg-[var(--bg-surface-hover)] relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--bg-surface-hover)]" />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

interface EmptyCoursesProps {
  hasSearch: boolean;
}

function EmptyCourses({ hasSearch }: EmptyCoursesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 text-center space-y-3"
      role="status"
      aria-live="polite"
    >
      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface-secondary)] flex items-center justify-center">
        <BookOpen
          className="w-7 h-7 text-[var(--text-muted)]"
          aria-hidden="true"
        />
      </div>
      <p className="font-semibold text-[var(--text-primary)]">
        No courses found
      </p>
      <p className="text-sm text-[var(--text-muted)] max-w-xs">
        {hasSearch
          ? 'Try a different search term or clear the filters.'
          : "You haven't enrolled in any courses yet."}
      </p>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CourseListProps {
  className?: string;
}

export function CourseList({ className }: CourseListProps) {
  const { data: user } = useCurrentUser();
  const userId = user?.id;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const debouncedSearch = useDebounce(search, 350);

  const queryParams: Partial<CourseListParams> = {
    page: 1,
    pageSize: 50,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    status,
  };

  const { data, isLoading, isFetching } = useStudentCourses(
    userId ?? '',
    queryParams,
  );

  const courses = data?.data ?? [];
  const hasSearch = !!debouncedSearch || status !== 'all';

  return (
    <div className={cn('space-y-6', className)}>
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="pl-9"
            aria-label="Search courses"
            autoComplete="off"
          />
        </div>

        {/* Status filters */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-shrink-0"
          role="group"
          aria-label="Filter by status"
        >
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={status === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus(f.value)}
              className="flex-shrink-0"
              aria-pressed={status === f.value}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          // Skeleton grid
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            aria-busy="true"
            aria-label="Loading courses"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </motion.div>
        ) : courses.length === 0 ? (
          <EmptyCourses key="empty" hasSearch={hasSearch} />
        ) : (
          // Stagger grid
          <motion.div
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
              isFetching && 'opacity-60 pointer-events-none transition-opacity duration-200',
            )}
            aria-live="polite"
          >
            {courses.map((enrollment) => (
              <motion.div key={enrollment.courseId} variants={cardVariants}>
                <CourseCard
                  course={{
                    id: enrollment.courseId,
                    name: enrollment.courseName,
                    ...(enrollment.thumbnailUrl !== undefined
                      ? { thumbnailUrl: enrollment.thumbnailUrl }
                      : {}),
                    ...(enrollment.level !== undefined
                      ? { level: enrollment.level }
                      : {}),
                    enrollmentCount: 0,
                    ...(enrollment.lessonCount !== undefined
                      ? { lessonCount: enrollment.lessonCount }
                      : {}),
                  }}
                  href={`/student/courses/${enrollment.courseId}`}
                  showProgress
                  progressPercent={enrollment.progressPercent ?? 0}
                  {...(enrollment.nextLessonTitle
                    ? { nextLessonTitle: enrollment.nextLessonTitle }
                    : {})}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
