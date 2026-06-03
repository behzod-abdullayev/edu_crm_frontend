import type { StudentDto, UpdateStudentDto, AttendanceDto } from '@generated/models';
import type { StudentFormValues, AttendanceRecord } from '../types/student.types';

export function mapStudentDtoToForm(dto: StudentDto): StudentFormValues {
  return {
    firstName: dto.firstName ?? '',
    lastName: dto.lastName ?? '',
    email: dto.email ?? '',
    phone: dto.phone ?? '',
    dateOfBirth: dto.dateOfBirth ?? '',
    address: dto.address ?? '',
    avatarKey: dto.avatarKey ?? null,
    languagePreference: (dto.languagePreference as StudentFormValues['languagePreference']) ?? 'en',
    themePreference: (dto.themePreference as StudentFormValues['themePreference']) ?? 'system',
  };
}

export function mapStudentFormToDto(form: StudentFormValues): UpdateStudentDto {
  return {
    firstName: form.firstName,
    lastName: form.lastName,
    ...(form.phone ? { phone: form.phone } : {}),
    ...(form.dateOfBirth ? { dateOfBirth: form.dateOfBirth } : {}),
    ...(form.address ? { address: form.address } : {}),
    ...(form.avatarKey !== null ? { avatarKey: form.avatarKey ?? undefined } : {}),
    languagePreference: form.languagePreference,
    themePreference: form.themePreference,
  };
}

export function mapAttendanceDto(dto: AttendanceDto): AttendanceRecord {
  return {
    date: dto.date,
    status: dto.status as AttendanceRecord['status'],
    courseId: dto.courseId,
    courseName: dto.courseName ?? '',
    teacherName: dto.teacherName ?? '',
    ...(dto.note ? { note: dto.note } : {}),
  };
}

export function getAttendanceRateFromRecords(records: AttendanceRecord[]): number {
  if (records.length === 0) return 0;
  const present = records.filter((r) => r.status === 'present').length;
  const late = records.filter((r) => r.status === 'late').length;
  return Math.round(((present + late * 0.5) / records.length) * 100);
}
