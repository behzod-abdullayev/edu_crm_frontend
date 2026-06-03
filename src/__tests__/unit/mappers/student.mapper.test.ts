import { describe, it, expect } from 'vitest';
import {
  mapStudentDtoToForm,
  mapStudentFormToDto,
  mapAttendanceDto,
  getAttendanceRateFromRecords,
} from '@/modules/students/mappers/student.mapper';
import type { StudentFormValues, AttendanceRecord } from '@/modules/students/types/student.types';

/**
 * Local StudentDto shape — mirrors what the mapper reads from the API response.
 * Fields are optional/nullable to cover partial backend responses.
 */
interface LocalStudentDto {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  avatarKey?: string | null;
  languagePreference?: string | null;
  themePreference?: string | null;
  status?: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Local AttendanceDto shape — mirrors the backend attendance response.
 */
interface LocalAttendanceDto {
  date: string;
  status: string;
  courseId: string;
  courseName?: string | null;
  teacherName?: string | null;
  note?: string | null;
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockStudentDto: LocalStudentDto = {
  id: 'student-1',
  firstName: 'Aziz',
  lastName: 'Karimov',
  email: 'aziz@example.com',
  phone: '+998901234567',
  dateOfBirth: '2000-05-15',
  address: '12 Amir Temur, Tashkent',
  avatarKey: 'avatars/student-1.jpg',
  languagePreference: 'uz',
  themePreference: 'light',
  status: 'active',
  createdAt: '2024-01-10T00:00:00Z',
};

const minimalStudentDto: LocalStudentDto = {
  id: 'student-2',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@test.com',
  phone: '+998900000001',
  status: 'active',
};

const mockStudentForm: StudentFormValues = {
  firstName: 'Aziz',
  lastName: 'Karimov',
  email: 'aziz@example.com',
  phone: '+998901234567',
  dateOfBirth: '2000-05-15',
  address: '12 Amir Temur, Tashkent',
  avatarKey: 'avatars/student-1.jpg',
  languagePreference: 'uz',
  themePreference: 'light',
};

// ─── mapStudentDtoToForm ──────────────────────────────────────────────────────

describe('mapStudentDtoToForm', () => {
  it('maps firstName correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapStudentDtoToForm(mockStudentDto as any).firstName).toBe('Aziz');
  });

  it('maps lastName correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapStudentDtoToForm(mockStudentDto as any).lastName).toBe('Karimov');
  });

  it('maps email correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapStudentDtoToForm(mockStudentDto as any).email).toBe('aziz@example.com');
  });

  it('maps phone correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapStudentDtoToForm(mockStudentDto as any).phone).toBe('+998901234567');
  });

  it('maps dateOfBirth correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapStudentDtoToForm(mockStudentDto as any).dateOfBirth).toBe('2000-05-15');
  });

  it('maps address correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapStudentDtoToForm(mockStudentDto as any).address).toBe('12 Amir Temur, Tashkent');
  });

  it('maps avatarKey correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapStudentDtoToForm(mockStudentDto as any).avatarKey).toBe('avatars/student-1.jpg');
  });

  it('maps languagePreference correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapStudentDtoToForm(mockStudentDto as any).languagePreference).toBe('uz');
  });

  it('maps themePreference correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapStudentDtoToForm(mockStudentDto as any).themePreference).toBe('light');
  });

  describe('null / undefined field handling', () => {
    it('defaults firstName to empty string when null', () => {
      const dto = { ...minimalStudentDto, firstName: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapStudentDtoToForm(dto as any).firstName).toBe('');
    });

    it('defaults lastName to empty string when null', () => {
      const dto = { ...minimalStudentDto, lastName: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapStudentDtoToForm(dto as any).lastName).toBe('');
    });

    it('defaults email to empty string when null', () => {
      const dto = { ...minimalStudentDto, email: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapStudentDtoToForm(dto as any).email).toBe('');
    });

    it('defaults phone to empty string when null', () => {
      const dto = { ...minimalStudentDto, phone: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapStudentDtoToForm(dto as any).phone).toBe('');
    });

    it('defaults dateOfBirth to empty string when null', () => {
      const dto = { ...minimalStudentDto, dateOfBirth: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapStudentDtoToForm(dto as any).dateOfBirth).toBe('');
    });

    it('defaults address to empty string when null', () => {
      const dto = { ...minimalStudentDto, address: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapStudentDtoToForm(dto as any).address).toBe('');
    });

    it('defaults avatarKey to null when null', () => {
      const dto = { ...minimalStudentDto, avatarKey: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapStudentDtoToForm(dto as any).avatarKey).toBeNull();
    });

    it('defaults languagePreference to "en" when undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapStudentDtoToForm(minimalStudentDto as any).languagePreference).toBe('en');
    });

    it('defaults themePreference to "system" when undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapStudentDtoToForm(minimalStudentDto as any).themePreference).toBe('system');
    });
  });
});

// ─── mapStudentFormToDto ──────────────────────────────────────────────────────

describe('mapStudentFormToDto', () => {
  it('maps firstName to DTO correctly', () => {
    expect(mapStudentFormToDto(mockStudentForm).firstName).toBe('Aziz');
  });

  it('maps lastName to DTO correctly', () => {
    expect(mapStudentFormToDto(mockStudentForm).lastName).toBe('Karimov');
  });

  it('maps languagePreference to DTO correctly', () => {
    expect(mapStudentFormToDto(mockStudentForm).languagePreference).toBe('uz');
  });

  it('maps themePreference to DTO correctly', () => {
    expect(mapStudentFormToDto(mockStudentForm).themePreference).toBe('light');
  });

  it('includes phone when provided', () => {
    const dto = mapStudentFormToDto(mockStudentForm);
    expect(dto.phone).toBe('+998901234567');
  });

  it('omits phone when empty string', () => {
    const form: StudentFormValues = { ...mockStudentForm, phone: '' };
    const dto = mapStudentFormToDto(form);
    expect(dto.phone == null || dto.phone === '').toBe(true);
  });

  it('includes dateOfBirth when provided', () => {
    const dto = mapStudentFormToDto(mockStudentForm);
    expect(dto.dateOfBirth).toBe('2000-05-15');
  });

  it('omits dateOfBirth when empty string', () => {
    const form: StudentFormValues = { ...mockStudentForm, dateOfBirth: '' };
    const dto = mapStudentFormToDto(form);
    expect(dto.dateOfBirth == null || dto.dateOfBirth === '').toBe(true);
  });

  it('includes address when provided', () => {
    const dto = mapStudentFormToDto(mockStudentForm);
    expect(dto.address).toBe('12 Amir Temur, Tashkent');
  });

  it('omits address when empty string', () => {
    const form: StudentFormValues = { ...mockStudentForm, address: '' };
    const dto = mapStudentFormToDto(form);
    expect(dto.address == null || dto.address === '').toBe(true);
  });

  it('includes avatarKey when non-null', () => {
    const dto = mapStudentFormToDto(mockStudentForm);
    expect(dto.avatarKey).toBe('avatars/student-1.jpg');
  });

  it('omits avatarKey when null', () => {
    const form: StudentFormValues = { ...mockStudentForm, avatarKey: null };
    const dto = mapStudentFormToDto(form);
    expect(dto.avatarKey).toBeUndefined();
  });
});

// ─── mapAttendanceDto ────────────────────────────────────────────────────────

describe('mapAttendanceDto', () => {
  const mockAttendanceDto: LocalAttendanceDto = {
    date: '2024-03-15',
    status: 'present',
    courseId: 'course-1',
    courseName: 'Advanced Math',
    teacherName: 'Dilnoza Yusupova',
    note: 'On time',
  };

  it('maps date correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapAttendanceDto(mockAttendanceDto as any).date).toBe('2024-03-15');
  });

  it('maps status correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapAttendanceDto(mockAttendanceDto as any).status).toBe('present');
  });

  it('maps courseId correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapAttendanceDto(mockAttendanceDto as any).courseId).toBe('course-1');
  });

  it('maps courseName correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapAttendanceDto(mockAttendanceDto as any).courseName).toBe('Advanced Math');
  });

  it('maps teacherName correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapAttendanceDto(mockAttendanceDto as any).teacherName).toBe('Dilnoza Yusupova');
  });

  it('maps note when present', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapAttendanceDto(mockAttendanceDto as any).note).toBe('On time');
  });

  it('omits note when null', () => {
    const dto = { ...mockAttendanceDto, note: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = mapAttendanceDto(dto as any);
    expect(result.note).toBeUndefined();
  });

  it('defaults courseName to empty string when null', () => {
    const dto = { ...mockAttendanceDto, courseName: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapAttendanceDto(dto as any).courseName).toBe('');
  });

  it('defaults teacherName to empty string when null', () => {
    const dto = { ...mockAttendanceDto, teacherName: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapAttendanceDto(dto as any).teacherName).toBe('');
  });
});

// ─── getAttendanceRateFromRecords ────────────────────────────────────────────

describe('getAttendanceRateFromRecords', () => {
  it('returns 0 for empty records array', () => {
    expect(getAttendanceRateFromRecords([])).toBe(0);
  });

  it('returns 100 when all records are present', () => {
    const records: AttendanceRecord[] = [
      { date: '2024-03-01', status: 'present', courseId: 'c1', courseName: 'Math', teacherName: 'T1' },
      { date: '2024-03-02', status: 'present', courseId: 'c1', courseName: 'Math', teacherName: 'T1' },
    ];
    expect(getAttendanceRateFromRecords(records)).toBe(100);
  });

  it('returns 0 when all records are absent', () => {
    const records: AttendanceRecord[] = [
      { date: '2024-03-01', status: 'absent', courseId: 'c1', courseName: 'Math', teacherName: 'T1' },
      { date: '2024-03-02', status: 'absent', courseId: 'c1', courseName: 'Math', teacherName: 'T1' },
    ];
    expect(getAttendanceRateFromRecords(records)).toBe(0);
  });

  it('counts late as 0.5 weight', () => {
    const records: AttendanceRecord[] = [
      { date: '2024-03-01', status: 'present', courseId: 'c1', courseName: 'Math', teacherName: 'T1' },
      { date: '2024-03-02', status: 'late', courseId: 'c1', courseName: 'Math', teacherName: 'T1' },
      { date: '2024-03-03', status: 'absent', courseId: 'c1', courseName: 'Math', teacherName: 'T1' },
      { date: '2024-03-04', status: 'absent', courseId: 'c1', courseName: 'Math', teacherName: 'T1' },
    ];
    // (1 + 0.5) / 4 * 100 = 37.5 → Math.round = 38
    expect(getAttendanceRateFromRecords(records)).toBe(38);
  });

  it('returns a number between 0 and 100', () => {
    const records: AttendanceRecord[] = [
      { date: '2024-03-01', status: 'present', courseId: 'c1', courseName: 'Math', teacherName: 'T1' },
      { date: '2024-03-02', status: 'absent', courseId: 'c1', courseName: 'Math', teacherName: 'T1' },
    ];
    const rate = getAttendanceRateFromRecords(records);
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(100);
  });
});