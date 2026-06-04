'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { BookOpen, PlayCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import type { CourseEnrollmentDto } from '../hooks/useStudentCourses';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CourseProgressCardProps {
  enrollment: CourseEnrollmentDto;
  className?: string | undefined;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProgressColor(progress: number): string {
  if (progress >= 80) return 'var(--success-solid)';
  if (progress >= 40) return 'var(--brand-primary)';
  return 'var(--warning-solid)';
}

function getCTALabel(progress: number): string {
  if (progress === 0) return 'Start Learning';
  if (progress >= 100) return 'Review';
  return 'Continue';
}

// ─── Progress badge overlay ───────────────────────────────────────────────────

interface ProgressBadgeProps {
  progress: number;
}

function ProgressBadge({ progress }: ProgressBadgeProps) {
  const isComplete = progress >= 100;
  return (
    <div
      className={cn(
        'absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center',
        'rounded-full border-2 bg-[var(--bg-surface)] text-xs font-bold tabular-nums',
        'shadow-[var(--shadow-sm)]',
        isComplete
          ? 'border-[var(--success-solid)] text-[var(--success-solid)]'
          : 'border-[var(--brand-primary)] text-[var(--brand-primary)]',
      )}
      aria-hidden="true"
    >
      {isComplete ? (
        <CheckCircle2 size={18} strokeWidth={2.5} />
      ) : (
        `${progress}%`
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CourseProgressCard({
  enrollment,
  className,
}: CourseProgressCardProps) {
  const t = useTranslations('student.courses');
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const reduced = useReducedMotion() ?? false;

  const progress = Math.min(
    100,
    Math.max(0, Math.round(enrollment.progressPercent ?? 0)),
  );
  const isComplete = progress >= 100;
  const courseName = enrollment.courseName ?? 'Untitled Course';
  const thumbnail = enrollment.thumbnailUrl ?? null;
  const initial =
    courseName.length > 0 ? (courseName[0]?.toUpperCase() ?? '?') : '?';
  const progressColor = getProgressColor(progress);
  const btnLabel = getCTALabel(progress);
  const courseHref = `/${locale}/student/courses/${enrollment.courseId}`;

  return (
    <motion.article
      initial={reduced ? {} : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduced ? {} : { y: -2 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[var(--radius-xl)]',
        'border border-[var(--border-default)] bg-[var(--bg-surface)]',
        'shadow-[var(--shadow-sm)] transition-shadow duration-[var(--transition-base)]',
        'hover:shadow-[var(--shadow-lg)]',
        className,
      )}
      aria-label={`Course: ${courseName}, ${progress}% complete`}
    >
      {/* ── Thumbnail ──────────────────────────────────────────────────── */}
      <div className="relative h-28 w-full flex-shrink-0 overflow-hidden bg-[var(--bg-surface-hover)]">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={courseName}
            fill
            className={cn(
              'object-cover transition-transform duration-500',
              !reduced && 'group-hover:scale-105',
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, var(--bg-surface-hover) 0%, var(--bg-surface-secondary) 100%)',
            }}
            aria-hidden="true"
          >
            <span
              className="select-none text-4xl font-black opacity-20"
              style={{ color: 'var(--brand-primary)' }}
            >
              {initial}
            </span>
          </div>
        )}

        <ProgressBadge progress={progress} />

        {isComplete && (
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 bg-[var(--success-solid)]/90 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm"
            aria-hidden="true"
          >
            <CheckCircle2 size={11} strokeWidth={2.5} />
            Completed
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Course name */}
        <div className="min-h-[2.5rem]">
          <h3
            className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)]"
            title={courseName}
          >
            {courseName}
          </h3>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
          {enrollment.lessonCount != null && (
            <span className="flex items-center gap-1">
              <BookOpen size={11} aria-hidden="true" />
              {enrollment.lessonCount} lessons
            </span>
          )}
          {enrollment.nextLessonTitle && (
            <span className="truncate max-w-[120px]">
              Next: {enrollment.nextLessonTitle}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div
          className="space-y-1"
          aria-label={`${t('progress')}: ${progress}%`}
        >
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-hover)]"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progress}% complete`}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: progressColor }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={
                reduced ? { duration: 0 } : { duration: 0.7, ease: 'easeOut' }
              }
            />
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
            <span>{t('progress')}</span>
            <span className="font-semibold tabular-nums">{progress}%</span>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize',
              enrollment.status === 'completed'
                ? 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]'
                : enrollment.status === 'dropped'
                  ? 'border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)]'
                  : 'border-[var(--info-border)] bg-[var(--info-bg)] text-[var(--info-text)]',
            )}
          >
            {enrollment.status}
          </span>
        </div>

        {/* CTA */}
        <Link
          href={courseHref}
          className={cn(
            'mt-auto flex min-h-[44px] w-full items-center justify-center gap-2',
            'rounded-lg px-4 text-sm font-semibold',
            'transition-colors duration-[var(--transition-fast)]',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1',
            isComplete
              ? [
                  'bg-[var(--success-bg)] text-[var(--success-text)]',
                  'hover:bg-[var(--success-solid)] hover:text-white',
                ]
              : [
                  'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]',
                  'hover:bg-[var(--brand-primary)] hover:text-white',
                ],
          )}
          aria-label={`${btnLabel}: ${courseName}`}
        >
          <PlayCircle size={15} aria-hidden="true" />
          {btnLabel}
        </Link>
      </div>
    </motion.article>
  );
}
