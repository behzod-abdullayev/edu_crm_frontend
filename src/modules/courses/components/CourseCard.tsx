'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Users, Clock, ChevronRight, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@shared/components/ui/badge';
import { cn } from '@shared/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CourseCardData {
  id: string;
  name: string;
  description?: string | undefined;
  thumbnailUrl?: string | null | undefined;
  thumbnailKey?: string | null | undefined;
  level?: 'beginner' | 'intermediate' | 'advanced' | undefined;
  enrollmentCount?: number | undefined;
  lessonCount?: number | undefined;
  durationHours?: number | undefined;
  status?: string | undefined;
  teacherId?: string | undefined;
  teacherName?: string | undefined;
}

interface CourseCardProps {
  course: CourseCardData;
  /** Override the default href (defaults to /student/courses/:id) */
  href?: string | undefined;
  /** Show progress bar at the bottom of the card */
  showProgress?: boolean | undefined;
  /** 0–100 */
  progressPercent?: number | undefined;
  /** Label shown next to progress bar */
  nextLessonTitle?: string | undefined;
  className?: string | undefined;
  /** Stagger index for list animations — delay = index * 0.05s */
  index?: number | undefined;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<NonNullable<CourseCardData['level']>, string> = {
  beginner:     'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]',
  intermediate: 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]',
  advanced:     'bg-[var(--error-bg)]   text-[var(--error-text)]   border-[var(--error-border)]',
};

const LEVEL_LABELS: Record<NonNullable<CourseCardData['level']>, string> = {
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  advanced:     'Advanced',
};

// ─── Animation variants ───────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay:    i * 0.05,
      duration: 0.3,
      ease:     'easeOut',
    },
  }),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CourseThumbnail({
  thumbnailUrl,
  name,
}: {
  thumbnailUrl: string | null | undefined;
  name: string;
}) {
  if (thumbnailUrl) {
    return (
      <Image
        src={thumbnailUrl}
        alt={name}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
      />
    );
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-accent)]/10"
      aria-hidden="true"
    >
      <GraduationCap
        className="h-10 w-10 text-[var(--brand-primary)]/30"
        aria-hidden="true"
      />
    </div>
  );
}

function ProgressBar({
  progressPercent,
  nextLessonTitle,
}: {
  progressPercent: number;
  nextLessonTitle?: string | undefined;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-secondary)] truncate max-w-[70%]">
          {nextLessonTitle ? `Next: ${nextLessonTitle}` : 'Progress'}
        </span>
        <span className="font-semibold tabular-nums text-[var(--text-primary)]">
          {progressPercent}%
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-hover)]"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Course progress: ${progressPercent}%`}
      >
        <motion.div
          className="h-full rounded-full bg-[var(--brand-primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CourseCard({
  course,
  href,
  showProgress = false,
  progressPercent = 0,
  nextLessonTitle,
  className,
  index = 0,
}: CourseCardProps) {
  const cardHref = href ?? `/student/courses/${course.id}`;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={cardHref}
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 rounded-xl"
        aria-label={`View course: ${course.name}`}
      >
        <div
          className={cn(
            'overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]',
            'shadow-[var(--shadow-sm)] transition-all duration-200',
            'hover:border-[var(--brand-primary)]/40 hover:shadow-[var(--shadow-md)]',
            className,
          )}
        >
          {/* ── Thumbnail ───────────────────────────────────────────────── */}
          <div className="relative h-36 overflow-hidden bg-[var(--bg-surface-secondary)] sm:h-40">
            <CourseThumbnail
              thumbnailUrl={course.thumbnailUrl}
              name={course.name}
            />

            {/* Level badge */}
            {course.level && (
              <div className="absolute left-2 top-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize',
                    LEVEL_COLORS[course.level],
                  )}
                >
                  {LEVEL_LABELS[course.level]}
                </span>
              </div>
            )}

            {/* Status badge */}
            {course.status && course.status !== 'active' && (
              <div className="absolute right-2 top-2">
                <Badge
                  variant="outline"
                  className="capitalize text-[11px] bg-[var(--bg-surface)]/90 backdrop-blur-sm"
                >
                  {course.status}
                </Badge>
              </div>
            )}
          </div>

          {/* ── Content ─────────────────────────────────────────────────── */}
          <div className="space-y-3 p-4">
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--brand-primary)]">
                {course.name}
              </h3>
              <ChevronRight
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </div>

            {/* Description */}
            {course.description && (
              <p className="line-clamp-2 text-xs text-[var(--text-secondary)]">
                {course.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
              {course.enrollmentCount !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{course.enrollmentCount}</span>
                </span>
              )}
              {course.lessonCount !== undefined && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{course.lessonCount} lessons</span>
                </span>
              )}
              {course.durationHours !== undefined && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{course.durationHours}h</span>
                </span>
              )}
              {course.teacherName && (
                <span className="text-xs text-[var(--text-muted)] truncate max-w-[120px]">
                  {course.teacherName}
                </span>
              )}
            </div>

            {/* Progress bar (student view) */}
            {showProgress && (
              <ProgressBar
                progressPercent={progressPercent}
                nextLessonTitle={nextLessonTitle}
              />
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}