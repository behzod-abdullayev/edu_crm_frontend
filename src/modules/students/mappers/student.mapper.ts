/**
 * Student module mapper — DTO ↔ UI form value transformations.
 *
 * ⚠️  All DTO types come from @generated/models (orval-generated).
 *     DO NOT write API types manually in this file.
 *
 * Design rules (from the project prompt):
 *   - Pure functions only — no side effects, no API calls.
 *   - Fully typed — no `any`, no unsafe casts.
 *   - Under `exactOptionalPropertyTypes: true`, optional keys must be
 *     OMITTED entirely when absent, not set to `undefined`.
 *   - Unit-tested in src/__tests__/unit/mappers/student.mapper.test.ts.
 *     The four exported functions below must keep the same signatures.
 */

import type { StudentDto, UpdateStudentDto, AttendanceDto } from '@generated/models';
import type {
  StudentFormValues,
  AttendanceRecord,
  StudentKpiData,
  ActivityFeedItem,
  UpcomingClass,
} from '../types/student.types';

// ─── StudentDto ↔ StudentFormValues ──────────────────────────────────────────

/**
 * Maps an API StudentDto to the form value shape consumed by StudentProfileForm.
 *
 * Converts all nullable / undefined fields to safe empty-string / null defaults
 * so React Hook Form never receives `undefined` for a controlled input.
 */
export function mapStudentDtoToForm(dto: StudentDto): StudentFormValues {
  return {
    firstName: dto.firstName ?? '',
    lastName: dto.lastName ?? '',
    email: dto.email ?? '',
    phone: dto.phone ?? '',
    dateOfBirth: dto.dateOfBirth ?? '',
    address: dto.address ?? '',
    avatarKey: dto.avatarKey ?? null,
    languagePreference:
      (dto.languagePreference as StudentFormValues['languagePreference']) ?? 'en',
    themePreference:
      (dto.themePreference as StudentFormValues['themePreference']) ?? 'system',
  };
}

/**
 * Maps validated StudentFormValues back to the UpdateStudentDto shape required
 * by PATCH /students/:id.
 *
 * Optional fields are included only when they carry a non-empty value so the
 * backend treats absence as "no change" (PATCH semantics).
 */
export function mapStudentFormToDto(form: StudentFormValues): UpdateStudentDto {
  return {
    firstName: form.firstName,
    lastName: form.lastName,
    ...(form.phone.length > 0 ? { phone: form.phone } : {}),
    ...(form.dateOfBirth !== undefined && form.dateOfBirth.length > 0
      ? { dateOfBirth: form.dateOfBirth }
      : {}),
    ...(form.address !== undefined && form.address.length > 0
      ? { address: form.address }
      : {}),
    // avatarKey === null → remove avatar; undefined → don't touch
    ...(form.avatarKey !== null ? { avatarKey: form.avatarKey ?? undefined } : {}),
    languagePreference: form.languagePreference,
    themePreference: form.themePreference,
  };
}

// ─── AttendanceDto ↔ AttendanceRecord ────────────────────────────────────────

/**
 * Normalises a raw AttendanceDto from GET /students/:id/attendance into the
 * AttendanceRecord shape used throughout the student attendance UI.
 *
 * The `status` field is cast at runtime here — this is the single place
 * that cast happens, keeping components free of type gymnastics.
 */
export function mapAttendanceDto(dto: AttendanceDto): AttendanceRecord {
  return {
    date: dto.date,
    status: dto.status as AttendanceRecord['status'],
    courseId: dto.courseId,
    courseName: dto.courseName ?? '',
    teacherName: dto.teacherName ?? '',
    ...(dto.note !== undefined && dto.note !== null && dto.note.length > 0
      ? { note: dto.note }
      : {}),
  };
}

// ─── Derived metrics ──────────────────────────────────────────────────────────

/**
 * Calculates the weighted attendance rate from an array of AttendanceRecord items.
 *
 * Weights:
 *   present → 1.0 point
 *   late    → 0.5 points
 *   absent  → 0.0 points
 *   excused → 0.0 points (not penalised, but not counted as present)
 *
 * Returns an integer percentage 0–100.
 * Returns 0 when the array is empty (avoids NaN).
 */
export function getAttendanceRateFromRecords(records: AttendanceRecord[]): number {
  if (records.length === 0) return 0;
  const present = records.filter((r) => r.status === 'present').length;
  const late = records.filter((r) => r.status === 'late').length;
  return Math.round(((present + late * 0.5) / records.length) * 100);
}

/**
 * Derives the percentage change between two numeric KPI values.
 *
 * Positive → improvement. Negative → regression.
 * Returns 0 when previous is 0 (avoids division-by-zero).
 */
export function deriveTrendPercent(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ─── KPI helpers ──────────────────────────────────────────────────────────────

/**
 * Creates a zero-initialised StudentKpiData placeholder — used while the real
 * data is loading so KPI cards can render skeletons without conditional logic.
 */
export function createEmptyStudentKpi(): StudentKpiData {
  return {
    coursesEnrolled: 0,
    attendanceRate: 0,
    homeworkPending: 0,
    averageGrade: 0,
    coursesEnrolledTrend: 0,
    attendanceRateTrend: 0,
    homeworkPendingTrend: 0,
    averageGradeTrend: 0,
  };
}

// ─── Display formatters ───────────────────────────────────────────────────────

/**
 * Returns a display-safe full name string.
 * Falls back to the email prefix when both names are empty.
 */
export function formatStudentFullName(
  firstName: string,
  lastName: string,
  email?: string | null,
): string {
  const full = `${firstName} ${lastName}`.trim();
  if (full.length > 0) return full;
  if (email !== undefined && email !== null) return email.split('@')[0] ?? 'Student';
  return 'Unknown Student';
}

/**
 * Returns two-letter uppercase initials from a student's first and last name.
 * Falls back to '??' when both names are empty.
 */
export function getStudentInitials(firstName: string, lastName: string): string {
  const first = firstName.trim()[0] ?? '';
  const last = lastName.trim()[0] ?? '';
  const initials = `${first}${last}`.toUpperCase();
  return initials.length > 0 ? initials : '??';
}

// ─── Activity feed helpers ────────────────────────────────────────────────────

/**
 * Sorts ActivityFeedItem[] by timestamp descending (newest first).
 * Returns a new array — does NOT mutate the input.
 */
export function sortActivityFeedByDate(items: ActivityFeedItem[]): ActivityFeedItem[] {
  return [...items].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

/**
 * Filters UpcomingClass[] to only those that occur today (matching dayOfWeek)
 * and whose start time is still in the future.
 *
 * Used by the student dashboard "Today's Classes" widget.
 */
export function filterTodaysClasses(classes: UpcomingClass[]): UpcomingClass[] {
  const todayDow = new Date().getDay();
  const nowMs = Date.now();

  return classes.filter((c) => {
    if (c.dayOfWeek !== todayDow) return false;
    const [hoursStr, minutesStr] = c.startTime.split(':');
    const hours = parseInt(hoursStr ?? '0', 10);
    const minutes = parseInt(minutesStr ?? '0', 10);
    const classStart = new Date();
    classStart.setHours(hours, minutes, 0, 0);
    return classStart.getTime() > nowMs;
  });
}
