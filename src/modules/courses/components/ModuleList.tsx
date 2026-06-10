'use client';

import { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  CheckCircle2,
  Play,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@shared/utils/cn';
import type { ModuleWithLessons, LessonItem } from '../types/course.types';

// ─── Lesson type icon map ─────────────────────────────────────────────────────

const LESSON_TYPE_ICONS: Record<LessonItem['type'], React.ReactElement> = {
  video: <Play className="w-3.5 h-3.5" aria-hidden="true" />,
  pdf: <FileText className="w-3.5 h-3.5" aria-hidden="true" />,
  text: <FileText className="w-3.5 h-3.5" aria-hidden="true" />,
  quiz: <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />,
};

// ─── Animation variants ───────────────────────────────────────────────────────

const accordionVariants = {
  hidden: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.22, ease: 'easeIn' },
  },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

const lessonStaggerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const lessonItemVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

// ─── Circular progress ring ───────────────────────────────────────────────────

interface ProgressRingProps {
  progress: number; // 0–100
  size?: number;
  strokeWidth?: number;
}

function ProgressRing({
  progress,
  size = 32,
  strokeWidth = 3,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--bg-surface-hover)"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--brand-primary)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      />
    </svg>
  );
}

// ─── Lesson row ───────────────────────────────────────────────────────────────

interface LessonRowProps {
  lesson: LessonItem;
  isActive: boolean;
  onSelect: (lesson: LessonItem) => void;
}

function LessonRow({ lesson, isActive, onSelect }: LessonRowProps) {
  return (
    <motion.li variants={lessonItemVariants}>
      <button
        type="button"
        onClick={() => onSelect(lesson)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left',
          'transition-colors duration-[var(--transition-fast)]',
          // Active state
          isActive
            ? 'bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)]'
            : 'hover:bg-[var(--bg-surface-hover)]',
          // Minimum tap target (mobile)
          'min-h-[44px]',
          // Focus ring
          'outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--border-focus)]',
        )}
        aria-current={isActive ? 'true' : undefined}
        aria-label={`${lesson.isCompleted ? 'Completed: ' : ''}${lesson.title}${lesson.durationMinutes !== undefined ? `, ${lesson.durationMinutes} minutes` : ''}`}
      >
        {/* Status icon */}
        <span
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
            lesson.isCompleted
              ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
              : isActive
                ? 'bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] text-[var(--brand-primary)]'
                : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)]',
          )}
          aria-hidden="true"
        >
          {lesson.isCompleted ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            LESSON_TYPE_ICONS[lesson.type]
          )}
        </span>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm truncate',
              isActive
                ? 'font-semibold text-[var(--brand-primary)]'
                : lesson.isCompleted
                  ? 'font-medium text-[var(--text-secondary)]'
                  : 'font-medium text-[var(--text-primary)]',
            )}
          >
            {lesson.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[var(--text-muted)] capitalize">
              {lesson.type}
            </span>
            {lesson.durationMinutes !== undefined && (
              <>
                <span
                  className="text-xs text-[var(--text-muted)]"
                  aria-hidden="true"
                >
                  ·
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {lesson.durationMinutes} min
                </span>
              </>
            )}
          </div>
        </div>
      </button>
    </motion.li>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ModuleListProps {
  modules: ModuleWithLessons[];
  onLessonSelect?: (lesson: LessonItem) => void;
  activeLessonId?: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ModuleList({
  modules,
  onLessonSelect,
  activeLessonId,
  className,
}: ModuleListProps) {
  const baseId = useId();

  // Auto-open the first module that has an incomplete lesson
  const [openModules, setOpenModules] = useState<Set<string>>(() => {
    const first = modules.find((m) =>
      m.lessons.some((l) => !l.isCompleted),
    );
    return new Set(
      first
        ? [first.id]
        : modules[0]
          ? [modules[0].id]
          : [],
    );
  });

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleLessonSelect = (lesson: LessonItem) => {
    onLessonSelect?.(lesson);
  };

  return (
    <nav
      className={cn('space-y-2', className)}
      aria-label="Course modules and lessons"
    >
      {modules.map((mod, modIndex) => {
        const isOpen = openModules.has(mod.id);
        const completedCount = mod.lessons.filter((l) => l.isCompleted).length;
        const totalCount = mod.lessons.length;
        const progress =
          totalCount > 0
            ? Math.round((completedCount / totalCount) * 100)
            : 0;

        const headingId = `${baseId}-module-${mod.id}-heading`;
        const panelId = `${baseId}-module-${mod.id}-panel`;

        return (
          <div
            key={mod.id}
            className="rounded-xl border border-[var(--border-default)] overflow-hidden"
          >
            {/* ── Module header / toggle ── */}
            <button
              type="button"
              id={headingId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggleModule(mod.id)}
              className={cn(
                'w-full flex items-center gap-3 p-4 text-left',
                'bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-surface-hover)]',
                'transition-colors duration-[var(--transition-fast)]',
                'outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--border-focus)]',
                'min-h-[56px]',
              )}
              aria-label={`Module ${modIndex + 1}: ${mod.title} — ${completedCount} of ${totalCount} lessons completed`}
            >
              {/* Chevron */}
              <motion.span
                animate={{ rotate: isOpen ? 0 : -90 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 text-[var(--text-muted)]"
                aria-hidden="true"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.span>

              {/* Title + progress text */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
                  {mod.title}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {completedCount}/{totalCount} completed
                </p>
              </div>

              {/* Progress ring */}
              <div
                className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center"
                role="img"
                aria-label={`${progress}% complete`}
              >
                <ProgressRing progress={progress} size={32} strokeWidth={3} />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[var(--text-primary)] tabular-nums">
                  {progress}%
                </span>
              </div>
            </button>

            {/* ── Lessons accordion panel ── */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={headingId}
                  variants={accordionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="overflow-hidden border-t border-[var(--border-default)]"
                >
                  <motion.ul
                    variants={lessonStaggerVariants}
                    initial="hidden"
                    animate="visible"
                    className="divide-y divide-[var(--border-default)]"
                    role="list"
                  >
                    {mod.lessons.map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        isActive={lesson.id === activeLessonId}
                        onSelect={handleLessonSelect}
                      />
                    ))}
                  </motion.ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}
