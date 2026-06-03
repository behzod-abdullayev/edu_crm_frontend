import type { TeacherDto, UpdateTeacherDto, AttendanceEntryDto } from '@generated/models';
import type { TeacherFormValues, AttendanceMarkEntry } from '../types/teacher.types';
import type { AttendanceStatus } from '@shared/types/attendance';

export function mapTeacherDtoToForm(dto: TeacherDto): TeacherFormValues {
  return {
    firstName: dto.firstName ?? '',
    lastName: dto.lastName ?? '',
    email: dto.email ?? '',
    phone: dto.phone ?? '',
    bio: dto.bio ?? '',
    qualifications: dto.qualifications ?? '',
    avatarKey: dto.avatarKey ?? null,
    languagePreference: (dto.languagePreference as TeacherFormValues['languagePreference']) ?? 'en',
    themePreference: (dto.themePreference as TeacherFormValues['themePreference']) ?? 'system',
  };
}

export function mapTeacherFormToDto(form: TeacherFormValues): UpdateTeacherDto {
  return {
    firstName: form.firstName,
    lastName: form.lastName,
    phone: form.phone,
    ...(form.bio ? { bio: form.bio } : {}),
    ...(form.qualifications ? { qualifications: form.qualifications } : {}),
    ...(form.avatarKey !== null ? { avatarKey: form.avatarKey ?? undefined } : {}),
    languagePreference: form.languagePreference,
    themePreference: form.themePreference,
  };
}

export function mapAttendanceEntryDto(dto: AttendanceEntryDto): AttendanceMarkEntry {
  return {
    studentId: dto.studentId,
    studentName: dto.studentName ?? '',
    ...(dto.avatarUrl ? { avatarUrl: dto.avatarUrl } : {}),
    status: (dto.status as AttendanceStatus) ?? 'present',
    ...(dto.note ? { note: dto.note } : {}),
  };
}
