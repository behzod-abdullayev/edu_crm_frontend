/**
 * @file src/shared/types/attendance.ts
 *
 * Attendance-related types shared across modules.
 *
 * These types are kept in the shared layer because both the student module
 * (AttendanceCalendar, student.types.ts) and the teacher module
 * (AttendanceMarkingUI, teacher.types.ts, teacher.mapper.ts) depend on them.
 *
 * The generated model at src/generated/models/attendanceStatus.ts uses a
 * const-enum pattern; this file uses a plain union type so that module-level
 * components do not need to import from the generated directory directly.
 * The two representations are structurally identical.
 */

// ── Core status union ─────────────────────────────────────────────────────────

/**
 * All possible attendance statuses for a single session.
 *
 * - `present`  — Student attended and was on time.
 * - `absent`   — Student did not attend without a recorded excuse.
 * - `late`     — Student attended but arrived after the session started.
 * - `excused`  — Student was absent for an approved reason (illness, etc.).
 */
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

// ── Derived helpers ───────────────────────────────────────────────────────────

/** All valid AttendanceStatus values as a readonly array (useful for iteration). */
export const ATTENDANCE_STATUSES = [
  'present',
  'absent',
  'late',
  'excused',
] as const satisfies ReadonlyArray<AttendanceStatus>;

/**
 * Type guard — returns `true` when `value` is a valid AttendanceStatus.
 *
 * @example
 * if (isAttendanceStatus(dto.status)) {
 *   record.status = dto.status; // narrowed to AttendanceStatus
 * }
 */
export function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return (
    typeof value === 'string' &&
    (ATTENDANCE_STATUSES as ReadonlyArray<string>).includes(value)
  );
}

// ── UI metadata map ───────────────────────────────────────────────────────────

/**
 * Display metadata for each attendance status.
 * Centralised here so that all UI components render consistent
 * labels, colours, and icon hints without duplicating the mapping.
 *
 * Colors reference CSS custom properties defined in globals.css.
 */
export interface AttendanceStatusMeta {
  /** Human-readable label (i18n key suffix; prefix with 'attendance.'). */
  labelKey: string;
  /**
   * CSS custom-property name for the status colour (without var()).
   * Example: '--success-solid'  →  use as  var(--success-solid).
   */
  colorVar: string;
  /** Tailwind background class for pill/badge rendering. */
  bgClass: string;
  /** Tailwind text class for pill/badge rendering. */
  textClass: string;
  /** Tailwind border class for calendar cell outlines. */
  borderClass: string;
}

export const ATTENDANCE_STATUS_META: Record<
  AttendanceStatus,
  AttendanceStatusMeta
> = {
  present: {
    labelKey: 'present',
    colorVar: '--success-solid',
    bgClass: 'bg-[var(--success-bg)]',
    textClass: 'text-[var(--success-text)]',
    borderClass: 'border-[var(--success-border)]',
  },
  absent: {
    labelKey: 'absent',
    colorVar: '--error-solid',
    bgClass: 'bg-[var(--error-bg)]',
    textClass: 'text-[var(--error-text)]',
    borderClass: 'border-[var(--error-border)]',
  },
  late: {
    labelKey: 'late',
    colorVar: '--warning-solid',
    bgClass: 'bg-[var(--warning-bg)]',
    textClass: 'text-[var(--warning-text)]',
    borderClass: 'border-[var(--warning-border)]',
  },
  excused: {
    labelKey: 'excused',
    colorVar: '--info-solid',
    bgClass: 'bg-[var(--info-bg)]',
    textClass: 'text-[var(--info-text)]',
    borderClass: 'border-[var(--info-border)]',
  },
} as const;

// ── Domain record (used by student and teacher types) ─────────────────────────

/**
 * A single attendance record as stored/displayed on the frontend.
 * Produced by mapper functions from the raw DTO returned by the API.
 */
export interface AttendanceRecord {
  /** Unique attendance record ID. */
  id: string;
  /** ISO 8601 date string (YYYY-MM-DD) for the session. */
  date: string;
  /** Attendance outcome for this session. */
  status: AttendanceStatus;
  /** ID of the group this attendance belongs to. */
  groupId: string;
  /** Display name of the group / course. */
  groupName: string;
  /** Display name of the teacher who marked attendance. */
  teacherName: string;
  /** Optional teacher note (excuse reason, etc.). */
  note?: string | null;
}

// ── Aggregate stats (used by dashboard KPI cards and analytics charts) ────────

/**
 * Aggregated attendance statistics for a student or group.
 * Computed client-side from an array of AttendanceRecord values,
 * or fetched directly from an analytics endpoint.
 */
export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  /** Overall attendance rate (0–100). */
  rate: number;
}

/**
 * Compute an AttendanceSummary from a list of records.
 * Pure function — safe to use in mappers and unit tests.
 *
 * @example
 * const summary = computeAttendanceSummary(student.attendance);
 * // summary.rate → 91.3 (percentage)
 */
export function computeAttendanceSummary(
  records: ReadonlyArray<Pick<AttendanceRecord, 'status'>>,
): AttendanceSummary {
  const total = records.length;
  const counts = { present: 0, absent: 0, late: 0, excused: 0 };

  for (const r of records) {
    if (r.status in counts) counts[r.status]++;
  }

  const attended = counts.present + counts.late;
  const rate = total > 0 ? Math.round((attended / total) * 100 * 10) / 10 : 0;

  return { total, ...counts, rate };
}