/**
 * @file src/modules/teachers/mappers/teacher.mapper.ts
 *
 * Teacher module mapper — DTO ↔ UI form value transformations.
 *
 * ⚠️  DTO types are imported from two sources:
 *       • @generated/models — orval-generated types (TeacherDto, UpdateTeacherDto,
 *         AttendanceEntryDto). Do NOT write these types manually in this file.
 *       • ../types/teacher.types — module-level UI types (TeacherFormValues,
 *         AttendanceMarkEntry, ChatConversation).
 *       • @shared/types/attendance — AttendanceStatus union type shared between
 *         the student and teacher modules.
 *
 * Design rules (from the project prompt):
 *   - Pure functions only — no side effects, no API calls.
 *   - Fully typed — no `any`, no unsafe casts.
 *   - Under `exactOptionalPropertyTypes: true`, optional keys must be OMITTED
 *     entirely when absent, not set to `undefined`.
 *   - Unit-tested in src/__tests__/unit/mappers/teacher.mapper.test.ts.
 *     The three exported functions below must keep the same signatures.
 */

import type {
  TeacherDto,
  UpdateTeacherDto,
  AttendanceEntryDto,
} from '@generated/models';
import type {
  TeacherFormValues,
  AttendanceMarkEntry,
  ChatConversation,
} from '../types/teacher.types';
import type { AttendanceStatus } from '@shared/types/attendance';

// ─── TeacherDto ↔ TeacherFormValues ──────────────────────────────────────────

/**
 * Maps an API TeacherDto (from GET /teachers/:id) to the form value shape
 * consumed by TeacherProfileForm.
 *
 * Converts all nullable / undefined fields to safe empty-string / null defaults
 * so React Hook Form never receives `undefined` for a controlled input.
 * avatarKey is preserved as null when absent (signals "no avatar set").
 */
export function mapTeacherDtoToForm(dto: TeacherDto): TeacherFormValues {
  return {
    firstName: dto.firstName ?? '',
    lastName: dto.lastName ?? '',
    email: dto.email ?? '',
    phone: dto.phone ?? '',
    bio: dto.bio ?? '',
    qualifications: dto.qualifications ?? '',
    avatarKey: dto.avatarKey ?? null,
    languagePreference:
      (dto.languagePreference as TeacherFormValues['languagePreference']) ?? 'en',
    themePreference:
      (dto.themePreference as TeacherFormValues['themePreference']) ?? 'system',
  };
}

/**
 * Maps validated TeacherFormValues back to the UpdateTeacherDto shape required
 * by PATCH /teachers/:id.
 *
 * Optional fields (phone, bio, qualifications, avatarKey) are included only
 * when they carry a non-empty value so the backend treats absence as "no change"
 * (PATCH semantics).
 *
 * avatarKey === null is intentionally excluded (not sent) to avoid accidentally
 * clearing an avatar when the user has not changed that field. Pass an explicit
 * null in a separate "remove avatar" action if needed.
 */
export function mapTeacherFormToDto(form: TeacherFormValues): UpdateTeacherDto {
  return {
    firstName: form.firstName,
    lastName: form.lastName,
    ...(form.phone.length > 0 ? { phone: form.phone } : {}),
    ...(form.bio !== undefined && form.bio.length > 0 ? { bio: form.bio } : {}),
    ...(form.qualifications !== undefined && form.qualifications.length > 0
      ? { qualifications: form.qualifications }
      : {}),
    // avatarKey === null → omit (don't touch); truthy string → include
    ...(form.avatarKey !== null ? { avatarKey: form.avatarKey ?? undefined } : {}),
    languagePreference: form.languagePreference,
    themePreference: form.themePreference,
  };
}

// ─── AttendanceEntryDto ↔ AttendanceMarkEntry ─────────────────────────────────

/**
 * Normalises a raw AttendanceEntryDto (from GET /teachers/:id/groups or the
 * attendance marking endpoint) into the AttendanceMarkEntry shape used in
 * AttendanceMarkingUI.
 *
 * The `status` field is cast at runtime here — this is the single place where
 * that cast occurs, keeping components free of type gymnastics.
 *
 * avatarUrl and note are only included when they carry a non-empty string value
 * so the AttendanceMarkEntry type (which marks both as optional) is satisfied
 * under exactOptionalPropertyTypes.
 */
export function mapAttendanceEntryDto(dto: AttendanceEntryDto): AttendanceMarkEntry {
  return {
    studentId: dto.studentId,
    studentName: dto.studentName ?? '',
    ...(dto.avatarUrl !== undefined && dto.avatarUrl !== null
      ? { avatarUrl: dto.avatarUrl }
      : {}),
    status: (dto.status as AttendanceStatus) ?? 'present',
    ...(dto.note !== undefined && dto.note !== null && dto.note.length > 0
      ? { note: dto.note }
      : {}),
  };
}

// ─── Display formatters ───────────────────────────────────────────────────────

/**
 * Returns a display-safe full name string for a teacher.
 * Falls back to the email prefix when both names are empty.
 */
export function formatTeacherFullName(
  firstName: string,
  lastName: string,
  email?: string | null,
): string {
  const full = `${firstName} ${lastName}`.trim();
  if (full.length > 0) return full;
  if (email !== undefined && email !== null) return email.split('@')[0] ?? 'Teacher';
  return 'Unknown Teacher';
}

/**
 * Returns two-letter uppercase initials from a teacher's first and last name.
 * Falls back to '??' when both names are empty.
 */
export function getTeacherInitials(firstName: string, lastName: string): string {
  const first = firstName.trim()[0] ?? '';
  const last = lastName.trim()[0] ?? '';
  const initials = `${first}${last}`.toUpperCase();
  return initials.length > 0 ? initials : '??';
}

// ─── Chat helpers ─────────────────────────────────────────────────────────────

/**
 * Sorts ChatConversation[] by lastMessageAt descending (most recent first).
 * Conversations with no messages (lastMessageAt is undefined or null)
 * are placed at the end of the list.
 * Returns a new array — does NOT mutate the input.
 */
export function sortConversationsByRecency(
  conversations: ChatConversation[],
): ChatConversation[] {
  return [...conversations].sort((a, b) => {
    const aTime =
      a.lastMessageAt !== undefined && a.lastMessageAt !== null
        ? new Date(a.lastMessageAt).getTime()
        : 0;
    const bTime =
      b.lastMessageAt !== undefined && b.lastMessageAt !== null
        ? new Date(b.lastMessageAt).getTime()
        : 0;
    return bTime - aTime;
  });
}

/**
 * Counts the total number of unread messages across all conversations.
 * Returns 0 when the array is empty.
 */
export function getTotalUnreadCount(conversations: ChatConversation[]): number {
  return conversations.reduce((acc, c) => acc + c.unreadCount, 0);
}