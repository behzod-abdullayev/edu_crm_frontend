'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { GradesList } from '@/modules/students/components/GradesList';
import { AttendanceCalendar } from '@/modules/students/components/AttendanceCalendar';
import { StudentAnalyticsChart } from './StudentAnalyticsChart';
import { httpClient } from '@/services/api/axios.instance';
import { cn } from '@shared/lib/utils';
// ✅ FIX: use `import type` for type-only imports (required with isolatedModules).
import type { StudentDetailDto } from '@generated/models';
import type { CourseGradesSummaryDto } from '@/modules/students/components/GradesList';
// ✅ FIX: import AttendanceRecord from student.types — same source that
// AttendanceCalendar uses — to satisfy its `records: AttendanceRecord[]` prop.
import type { AttendanceRecord } from '@/modules/students/types/student.types';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = ['Overview', 'Grades', 'Attendance', 'Analytics'] as const;
type Tab = (typeof TABS)[number];

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

const panelVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Produces a 1–2 character initials string from a full name.
 *
 * ✅ FIX: With `noUncheckedIndexedAccess: true`, indexing a string (`n[0]`)
 * returns `string | undefined`.  The `?? ''` fallback converts undefined to an
 * empty string so the resulting array is `string[]` and TypeScript is satisfied.
 */
function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TeacherStudentDetailClient({ studentId }: { studentId: string }) {
  const [tab, setTab] = useState<Tab>('Overview');

  // ── Student detail ──────────────────────────────────────────────────────────
  const { data: student, isLoading } = useQuery<StudentDetailDto>({
    queryKey: ['students', studentId, 'detail'],
    queryFn: () =>
      httpClient
        .get<StudentDetailDto>(`/students/${studentId}`)
        .then((r) => r.data),
    enabled: !!studentId,
  });

  // ── Grades (lazy — only fetched when tab is active) ─────────────────────────
  const { data: grades } = useQuery<CourseGradesSummaryDto[]>({
    queryKey: ['students', studentId, 'grades'],
    queryFn: () =>
      httpClient
        .get<CourseGradesSummaryDto[]>(`/students/${studentId}/grades`)
        .then((r) => r.data),
    enabled: !!studentId && tab === 'Grades',
  });

  // ── Attendance (lazy) ───────────────────────────────────────────────────────
  // ✅ FIX: type the query as `AttendanceRecord[]` (same type that
  // AttendanceCalendar expects) so TypeScript is satisfied at the call-site.
  // Without the explicit generic, the inferred type is `unknown` which is NOT
  // assignable to `AttendanceRecord[]`.
  const { data: attendanceRecords = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ['students', studentId, 'attendance'],
    queryFn: () =>
      httpClient
        .get<AttendanceRecord[]>(`/students/${studentId}/attendance`)
        .then((r) => r.data),
    enabled: !!studentId && tab === 'Attendance',
  });

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="space-y-4"
        role="status"
        aria-busy="true"
        aria-label="Loading student details"
      >
        <div className="h-8 w-48 rounded-lg bg-[var(--bg-surface-secondary)] animate-pulse" />
        <div className="h-64 rounded-xl bg-[var(--bg-surface-secondary)] animate-pulse" />
      </div>
    );
  }

  const fullName = student
    ? `${student.firstName} ${student.lastName}`.trim()
    : '';

  // Compute a percentage average grade from recent grades (if available).
  const avgGrade =
    student?.recentGrades && student.recentGrades.length > 0
      ? (
          student.recentGrades.reduce(
            (sum, g) => sum + (g.maxGrade > 0 ? (g.grade / g.maxGrade) * 100 : 0),
            0,
          ) / student.recentGrades.length
        ).toFixed(1)
      : '—';

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Back link ── */}
      <Link
        href="/teacher/students"
        className={cn(
          'inline-flex items-center gap-1.5 text-sm',
          'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[var(--border-focus)] rounded',
        )}
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to Students
      </Link>

      {/* ── Student header ── */}
      <div className="flex items-center gap-4">
        <Avatar className="w-14 h-14 shrink-0">
          <AvatarImage src={student?.avatarUrl ?? undefined} alt={fullName} />
          <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-[var(--text-primary)] truncate">
            {fullName}
          </h1>
          <p className="text-sm text-[var(--text-muted)] truncate">{student?.email}</p>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div
        role="tablist"
        aria-label="Student details sections"
        className="flex border-b border-[var(--border-default)] overflow-x-auto scrollbar-none"
      >
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            id={`student-tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`student-panel-${t}`}
            onClick={() => setTab(t)}
            className={cn(
              'shrink-0 px-4 pb-2.5 pt-1 text-sm font-medium',
              'transition-colors duration-150 border-b-2',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-[var(--border-focus)]',
              tab === t
                ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab panels ── */}
      <AnimatePresence mode="wait">
        {/* Overview */}
        {tab === 'Overview' && (
          <motion.div
            key="overview"
            role="tabpanel"
            id="student-panel-Overview"
            aria-labelledby="student-tab-Overview"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(
                [
                  {
                    label: 'Attendance',
                    value: `${student?.attendanceSummary?.rate ?? 0}%`,
                  },
                  { label: 'Avg. Grade', value: `${avgGrade}%` },
                  {
                    label: 'Submissions',
                    value: student?.recentGrades?.length ?? 0,
                  },
                  { label: 'Courses', value: student?.courses?.length ?? 0 },
                ] satisfies ReadonlyArray<{ label: string; value: string | number }>
              ).map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-center"
                >
                  <p className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">
                    {stat.value}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Grades */}
        {tab === 'Grades' && (
          <motion.div
            key="grades"
            role="tabpanel"
            id="student-panel-Grades"
            aria-labelledby="student-tab-Grades"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <GradesList summaries={grades ?? []} />
          </motion.div>
        )}

        {/* Attendance */}
        {tab === 'Attendance' && (
          <motion.div
            key="attendance"
            role="tabpanel"
            id="student-panel-Attendance"
            aria-labelledby="student-tab-Attendance"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
              {/* attendanceRecords is AttendanceRecord[] — type-safe */}
              <AttendanceCalendar records={attendanceRecords} />
            </div>
          </motion.div>
        )}

        {/* Analytics */}
        {tab === 'Analytics' && (
          <motion.div
            key="analytics"
            role="tabpanel"
            id="student-panel-Analytics"
            aria-labelledby="student-tab-Analytics"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <StudentAnalyticsChart studentId={studentId} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}