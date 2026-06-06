'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserMinus, Search, Users } from 'lucide-react';
import { httpClient } from '@/services/api/axios.instance';
import { queryKeys } from '@/services/query/keys.factory';
import { useToast } from '@shared/hooks/useToast';
import { useDebounce } from '@shared/hooks/useDebounce';
import { Avatar, AvatarFallback } from '@shared/components/ui/avatar';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { ConfirmDialog } from '@shared/components/feedback/ConfirmDialog';
import { cn } from '@shared/utils/cn';
import type { EnrollmentRecord } from '../types/course.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ─── Animation variants ───────────────────────────────────────────────────────

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: 8, transition: { duration: 0.15 } },
};

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function EnrollmentRowSkeleton() {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-default)]"
      aria-hidden="true"
    >
      <div className="w-9 h-9 rounded-full bg-[var(--bg-surface-hover)] flex-shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-2/5 rounded bg-[var(--bg-surface-hover)] relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="h-2 w-1/4 rounded-full bg-[var(--bg-surface-hover)]" />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

interface EmptyEnrollmentsProps {
  hasSearch: boolean;
}

function EmptyEnrollments({ hasSearch }: EmptyEnrollmentsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center py-14 text-center space-y-2"
      role="status"
      aria-live="polite"
    >
      <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-secondary)] flex items-center justify-center mb-1">
        <Users className="w-6 h-6 text-[var(--text-muted)]" aria-hidden="true" />
      </div>
      <p className="font-medium text-sm text-[var(--text-primary)]">
        {hasSearch ? 'No students match your search' : 'No students enrolled yet'}
      </p>
      <p className="text-xs text-[var(--text-muted)] max-w-[200px]">
        {hasSearch
          ? 'Try a different name.'
          : 'Enroll students to get started.'}
      </p>
    </motion.div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface EnrollmentManagerProps {
  courseId: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EnrollmentManager({
  courseId,
  className,
}: EnrollmentManagerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [unenrollTarget, setUnenrollTarget] =
    useState<EnrollmentRecord | null>(null);

  // ── Query — use queryKeys factory ────────────────────────────────────────

  const enrollmentsKey = queryKeys.courses.enrollments(courseId);

  const { data: enrollments, isLoading } = useQuery({
    queryKey: enrollmentsKey,
    queryFn: async () => {
      const res = await httpClient.get<EnrollmentRecord[]>(
        `/courses/${courseId}/enrollments`,
      );
      return res.data;
    },
    enabled: !!courseId,
  });

  // ── Unenroll mutation with optimistic update ──────────────────────────────

  const unenrollMutation = useMutation({
    mutationFn: async (studentId: string): Promise<void> => {
      await httpClient.delete(
        `/courses/${courseId}/enrollments/${studentId}`,
      );
    },

    onMutate: async (studentId) => {
      await queryClient.cancelQueries({ queryKey: enrollmentsKey });
      const previous =
        queryClient.getQueryData<EnrollmentRecord[]>(enrollmentsKey);

      // Optimistic remove
      queryClient.setQueryData<EnrollmentRecord[]>(
        enrollmentsKey,
        (old) => old?.filter((e) => e.studentId !== studentId) ?? [],
      );

      return { previous };
    },

    onError: (_err, _id, ctx) => {
      // Rollback on error
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(enrollmentsKey, ctx.previous);
      }
      toast.error('Failed to unenroll student. Please try again.');
    },

    onSuccess: () => {
      toast.success('Student unenrolled successfully');
      void queryClient.invalidateQueries({ queryKey: enrollmentsKey });
    },
  });

  // ── Filter logic ──────────────────────────────────────────────────────────

  const filtered = (enrollments ?? []).filter((e) =>
    e.studentName.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleUnenrollConfirm = useCallback(async () => {
    if (!unenrollTarget) return;
    await unenrollMutation.mutateAsync(unenrollTarget.studentId);
    setUnenrollTarget(null);
  }, [unenrollMutation, unenrollTarget]);

  const handleUnenrollCancel = useCallback(() => {
    setUnenrollTarget(null);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={cn('space-y-4', className)}>
      {/* ── Search ── */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search enrolled students…"
          className="pl-9"
          aria-label="Search enrolled students"
          autoComplete="off"
        />
      </div>

      {/* ── Count ── */}
      {!isLoading && (
        <p
          className="text-sm text-[var(--text-muted)]"
          aria-live="polite"
          aria-atomic="true"
        >
          {filtered.length}{' '}
          {filtered.length === 1 ? 'student' : 'students'} enrolled
        </p>
      )}

      {/* ── List ── */}
      {isLoading ? (
        <div
          className="space-y-2"
          aria-busy="true"
          aria-label="Loading enrolled students"
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <EnrollmentRowSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyEnrollments hasSearch={!!debouncedSearch} />
      ) : (
        <motion.ul
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
          role="list"
          aria-label="Enrolled students list"
        >
          <AnimatePresence initial={false}>
            {filtered.map((enrollment) => (
              <motion.li
                key={enrollment.studentId}
                variants={rowVariants}
                exit="exit"
                layout
              >
                <div
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl',
                    'border border-[var(--border-default)] bg-[var(--bg-surface)]',
                    'hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-strong)]',
                    'transition-colors duration-[var(--transition-fast)]',
                    // Mobile: ensure tap target height
                    'min-h-[56px]',
                  )}
                >
                  {/* Avatar */}
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarFallback
                      className="text-xs font-semibold"
                      aria-hidden="true"
                    >
                      {getInitials(enrollment.studentName)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[var(--text-primary)] truncate">
                      {enrollment.studentName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="h-1.5 w-16 rounded-full bg-[var(--bg-surface-hover)] overflow-hidden"
                        role="progressbar"
                        aria-valuenow={enrollment.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${enrollment.studentName} progress`}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${enrollment.progress}%`,
                          }}
                          transition={{
                            duration: 0.6,
                            ease: 'easeOut',
                            delay: 0.1,
                          }}
                          className="h-full rounded-full bg-[var(--brand-primary)]"
                        />
                      </div>
                      <span className="text-xs text-[var(--text-muted)] tabular-nums">
                        {enrollment.progress}%
                      </span>
                    </div>
                  </div>

                  {/* Unenroll button */}
                  <motion.div whileTap={{ scale: 0.92 }} className="flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setUnenrollTarget(enrollment)}
                      className={cn(
                        'h-9 w-9 text-[var(--text-muted)]',
                        'hover:text-[var(--error-text)] hover:bg-[var(--error-bg)]',
                        'transition-colors duration-[var(--transition-fast)]',
                      )}
                      aria-label={`Unenroll ${enrollment.studentName}`}
                    >
                      <UserMinus className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </motion.div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      {/* ── Confirm dialog ── */}
      <ConfirmDialog
        open={!!unenrollTarget}
        onCancel={handleUnenrollCancel}
        onConfirm={handleUnenrollConfirm}
        title="Unenroll Student"
        {...(unenrollTarget
          ? {
              description: `Remove ${unenrollTarget.studentName} from this course? Their progress will be permanently lost.`,
            }
          : {})}
        confirmLabel="Unenroll"
        variant="destructive"
        isLoading={unenrollMutation.isPending}
      />
    </div>
  );
}