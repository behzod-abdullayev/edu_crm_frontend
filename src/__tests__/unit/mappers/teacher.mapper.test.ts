import { describe, it, expect } from 'vitest';
import {
  mapTeacherDtoToForm,
  mapTeacherFormToDto,
  mapAttendanceEntryDto,
} from '@/modules/teachers/mappers/teacher.mapper';
import type { TeacherFormValues, AttendanceMarkEntry } from '@/modules/teachers/types/teacher.types';

/**
 * Local TeacherDto shape — mirrors what the mapper reads from the API response.
 * Fields are optional/nullable to cover partial backend responses.
 */
interface LocalTeacherDto {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  qualifications?: string | null;
  avatarKey?: string | null;
  languagePreference?: string | null;
  themePreference?: string | null;
  status?: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Local AttendanceEntryDto shape — mirrors the backend attendance entry.
 */
interface LocalAttendanceEntryDto {
  studentId: string;
  studentName?: string | null;
  avatarUrl?: string | null;
  status?: string | null;
  note?: string | null;
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockTeacherDto: LocalTeacherDto = {
  id: 'teacher-1',
  firstName: 'Dilnoza',
  lastName: 'Yusupova',
  email: 'dilnoza@example.com',
  phone: '+998901112233',
  bio: 'Experienced math teacher with 8 years of practice.',
  qualifications: 'MSc Mathematics, Tashkent State University',
  avatarKey: 'avatars/teacher-1.jpg',
  languagePreference: 'uz',
  themePreference: 'dark',
  status: 'active',
  createdAt: '2020-09-01T00:00:00Z',
};

const minimalTeacherDto: LocalTeacherDto = {
  id: 'teacher-min',
  firstName: 'Min',
  lastName: 'Teacher',
  email: 'min@test.com',
  phone: '+998900000002',
  status: 'active',
};

const mockTeacherForm: TeacherFormValues = {
  firstName: 'Dilnoza',
  lastName: 'Yusupova',
  email: 'dilnoza@example.com',
  phone: '+998901112233',
  bio: 'Experienced math teacher with 8 years of practice.',
  qualifications: 'MSc Mathematics, Tashkent State University',
  avatarKey: 'avatars/teacher-1.jpg',
  languagePreference: 'uz',
  themePreference: 'dark',
};

// ─── mapTeacherDtoToForm ──────────────────────────────────────────────────────

describe('mapTeacherDtoToForm', () => {
  it('maps firstName correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapTeacherDtoToForm(mockTeacherDto as any).firstName).toBe('Dilnoza');
  });

  it('maps lastName correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapTeacherDtoToForm(mockTeacherDto as any).lastName).toBe('Yusupova');
  });

  it('maps email correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapTeacherDtoToForm(mockTeacherDto as any).email).toBe('dilnoza@example.com');
  });

  it('maps phone correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapTeacherDtoToForm(mockTeacherDto as any).phone).toBe('+998901112233');
  });

  it('maps bio correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapTeacherDtoToForm(mockTeacherDto as any).bio).toBe(
      'Experienced math teacher with 8 years of practice.'
    );
  });

  it('maps qualifications correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapTeacherDtoToForm(mockTeacherDto as any).qualifications).toBe(
      'MSc Mathematics, Tashkent State University'
    );
  });

  it('maps avatarKey correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapTeacherDtoToForm(mockTeacherDto as any).avatarKey).toBe('avatars/teacher-1.jpg');
  });

  it('maps languagePreference correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapTeacherDtoToForm(mockTeacherDto as any).languagePreference).toBe('uz');
  });

  it('maps themePreference correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapTeacherDtoToForm(mockTeacherDto as any).themePreference).toBe('dark');
  });

  describe('null / undefined field handling', () => {
    it('defaults firstName to empty string when null', () => {
      const dto = { ...minimalTeacherDto, firstName: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapTeacherDtoToForm(dto as any).firstName).toBe('');
    });

    it('defaults lastName to empty string when null', () => {
      const dto = { ...minimalTeacherDto, lastName: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapTeacherDtoToForm(dto as any).lastName).toBe('');
    });

    it('defaults email to empty string when null', () => {
      const dto = { ...minimalTeacherDto, email: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapTeacherDtoToForm(dto as any).email).toBe('');
    });

    it('defaults phone to empty string when null', () => {
      const dto = { ...minimalTeacherDto, phone: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapTeacherDtoToForm(dto as any).phone).toBe('');
    });

    it('defaults bio to empty string when null', () => {
      const dto = { ...minimalTeacherDto, bio: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapTeacherDtoToForm(dto as any).bio).toBe('');
    });

    it('defaults qualifications to empty string when null', () => {
      const dto = { ...minimalTeacherDto, qualifications: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapTeacherDtoToForm(dto as any).qualifications).toBe('');
    });

    it('defaults avatarKey to null when null', () => {
      const dto = { ...minimalTeacherDto, avatarKey: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapTeacherDtoToForm(dto as any).avatarKey).toBeNull();
    });

    it('defaults languagePreference to "en" when undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapTeacherDtoToForm(minimalTeacherDto as any).languagePreference).toBe('en');
    });

    it('defaults themePreference to "system" when undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(mapTeacherDtoToForm(minimalTeacherDto as any).themePreference).toBe('system');
    });
  });
});

// ─── mapTeacherFormToDto ──────────────────────────────────────────────────────

describe('mapTeacherFormToDto', () => {
  it('maps firstName to DTO correctly', () => {
    expect(mapTeacherFormToDto(mockTeacherForm).firstName).toBe('Dilnoza');
  });

  it('maps lastName to DTO correctly', () => {
    expect(mapTeacherFormToDto(mockTeacherForm).lastName).toBe('Yusupova');
  });

  it('maps phone to DTO correctly', () => {
    expect(mapTeacherFormToDto(mockTeacherForm).phone).toBe('+998901112233');
  });

  it('maps languagePreference to DTO correctly', () => {
    expect(mapTeacherFormToDto(mockTeacherForm).languagePreference).toBe('uz');
  });

  it('maps themePreference to DTO correctly', () => {
    expect(mapTeacherFormToDto(mockTeacherForm).themePreference).toBe('dark');
  });

  it('includes bio when provided', () => {
    const dto = mapTeacherFormToDto(mockTeacherForm);
    expect(dto.bio).toBe('Experienced math teacher with 8 years of practice.');
  });

  it('omits bio when empty string', () => {
    const form: TeacherFormValues = { ...mockTeacherForm, bio: '' };
    const dto = mapTeacherFormToDto(form);
    expect(dto.bio == null || dto.bio === '').toBe(true);
  });

  it('includes qualifications when provided', () => {
    const dto = mapTeacherFormToDto(mockTeacherForm);
    expect(dto.qualifications).toBe('MSc Mathematics, Tashkent State University');
  });

  it('omits qualifications when empty string', () => {
    const form: TeacherFormValues = { ...mockTeacherForm, qualifications: '' };
    const dto = mapTeacherFormToDto(form);
    expect(dto.qualifications == null || dto.qualifications === '').toBe(true);
  });

  it('includes avatarKey when non-null', () => {
    const dto = mapTeacherFormToDto(mockTeacherForm);
    expect(dto.avatarKey).toBe('avatars/teacher-1.jpg');
  });

  it('omits avatarKey when null', () => {
    const form: TeacherFormValues = { ...mockTeacherForm, avatarKey: null };
    const dto = mapTeacherFormToDto(form);
    expect(dto.avatarKey).toBeUndefined();
  });

  it('includes all required DTO fields', () => {
    const dto = mapTeacherFormToDto(mockTeacherForm);
    expect(dto.firstName).toBeTruthy();
    expect(dto.lastName).toBeTruthy();
    expect(dto.phone).toBeTruthy();
    expect(dto.languagePreference).toBeDefined();
    expect(dto.themePreference).toBeDefined();
  });
});

// ─── mapAttendanceEntryDto ───────────────────────────────────────────────────

describe('mapAttendanceEntryDto', () => {
  const mockEntryDto: LocalAttendanceEntryDto = {
    studentId: 'student-1',
    studentName: 'Aziz Karimov',
    avatarUrl: 'https://cdn.example.com/avatar-1.jpg',
    status: 'present',
    note: 'Participated actively',
  };

  it('maps studentId correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapAttendanceEntryDto(mockEntryDto as any).studentId).toBe('student-1');
  });

  it('maps studentName correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapAttendanceEntryDto(mockEntryDto as any).studentName).toBe('Aziz Karimov');
  });

  it('maps avatarUrl when present', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapAttendanceEntryDto(mockEntryDto as any).avatarUrl).toBe(
      'https://cdn.example.com/avatar-1.jpg'
    );
  });

  it('omits avatarUrl when null', () => {
    const dto = { ...mockEntryDto, avatarUrl: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = mapAttendanceEntryDto(dto as any);
    expect(result.avatarUrl).toBeUndefined();
  });

  it('maps status correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapAttendanceEntryDto(mockEntryDto as any).status).toBe('present');
  });

  it('defaults status to "present" when null', () => {
    const dto = { ...mockEntryDto, status: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapAttendanceEntryDto(dto as any).status).toBe('present');
  });

  it('maps note when present', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapAttendanceEntryDto(mockEntryDto as any).note).toBe('Participated actively');
  });

  it('omits note when null', () => {
    const dto = { ...mockEntryDto, note: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = mapAttendanceEntryDto(dto as any);
    expect(result.note).toBeUndefined();
  });

  it('defaults studentName to empty string when null', () => {
    const dto = { ...mockEntryDto, studentName: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapAttendanceEntryDto(dto as any).studentName).toBe('');
  });

  it('returns a valid AttendanceMarkEntry shape', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: AttendanceMarkEntry = mapAttendanceEntryDto(mockEntryDto as any);
    expect(result.studentId).toBeDefined();
    expect(result.studentName).toBeDefined();
    expect(result.status).toBeDefined();
  });
});