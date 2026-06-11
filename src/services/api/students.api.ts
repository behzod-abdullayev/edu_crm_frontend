import { httpClient } from './axios.instance';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface StudentListParams extends PaginationParams {
  groupId?: string;
  courseId?: string;
  status?: StudentStatus;
  isActive?: boolean;
}

export type StudentStatus = 'active' | 'inactive' | 'suspended' | 'graduated';

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  status: StudentStatus;
  groupId?: string;
  groupName?: string;
  balance: number;
  debtAmount?: number;
  attendancePercent?: number;
  enrolledAt: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  groupId?: string;
  password?: string;
}

export interface UpdateStudentDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  groupId?: string;
  status?: StudentStatus;
  avatarUrl?: string;
}

export interface StudentCourse {
  id: string;
  courseId: string;
  courseName: string;
  teacherName: string;
  progress: number;
  grade?: number;
  enrolledAt: string;
  completedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  lessonId: string;
  lessonDate: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  note?: string;
}

export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  homeworkId?: string;
  examId?: string;
  score: number;
  maxScore: number;
  feedback?: string;
  gradedAt: string;
  gradedBy: string;
}

export interface ScheduleItem {
  id: string;
  courseId: string;
  courseName: string;
  teacherName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomNumber?: string;
}

export interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  courseName: string;
  issuedAt: string;
  downloadUrl: string;
}

export interface StudentNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

/** Shape returned by the backend for a single student (raw entity + `user` relation). */
interface RawStudent {
  id: string;
  tenantId: string;
  studentCode?: string;
  enrollmentDate?: string | null;
  graduationDate?: string | null;
  balance?: string | number | null;
  debtAmount?: string | number | null;
  totalAttendancePercent?: string | number | null;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
    avatarUrl?: string | null;
    status?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

/** Backend list responses are wrapped as `{ data, meta: { total, page, limit, totalPages } }`. */
interface RawPaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

/** Maps the raw backend student shape (entity + `user` relation) to the frontend `Student` view model. */
function mapStudent(raw: RawStudent): Student {
  const user = raw.user;
  const status: StudentStatus = raw.graduationDate
    ? 'graduated'
    : user?.status === 'active'
      ? 'active'
      : user?.status === 'suspended'
        ? 'suspended'
        : 'inactive';

  return {
    id: raw.id,
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    ...(user?.phone != null ? { phone: user.phone } : {}),
    ...(user?.avatarUrl != null ? { avatarUrl: user.avatarUrl } : {}),
    status,
    balance: raw.balance != null ? Number(raw.balance) : 0,
    debtAmount: raw.debtAmount != null ? Number(raw.debtAmount) : 0,
    attendancePercent:
      raw.totalAttendancePercent != null ? Number(raw.totalAttendancePercent) : 0,
    enrolledAt: raw.enrollmentDate ?? raw.createdAt,
    tenantId: raw.tenantId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const studentsApi = {
  getList: async (
    params: StudentListParams,
  ): Promise<PaginatedResponse<Student>> => {
    const { data } = await httpClient.get<RawPaginatedResponse<RawStudent>>(
      '/students',
      { params },
    );
    return {
      data: data.data.map(mapStudent),
      total: data.meta.total,
      page: data.meta.page,
      limit: data.meta.limit,
      totalPages: data.meta.totalPages,
    };
  },

  getById: async (id: string): Promise<Student> => {
    const { data } = await httpClient.get<RawStudent>(`/students/${id}`);
    return mapStudent(data);
  },

  create: async (dto: CreateStudentDto): Promise<Student> => {
    const { data } = await httpClient.post<RawStudent>('/students', dto);
    return mapStudent(data);
  },

  update: async (id: string, dto: UpdateStudentDto): Promise<Student> => {
    const { data } = await httpClient.patch<RawStudent>(`/students/${id}`, dto);
    return mapStudent(data);
  },

  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/students/${id}`);
  },

  getCourses: async (id: string): Promise<StudentCourse[]> => {
    const { data } = await httpClient.get<StudentCourse[]>(
      `/students/${id}/courses`,
    );
    return data;
  },

  getAttendance: async (
    id: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<AttendanceRecord>> => {
    const { data } = await httpClient.get<PaginatedResponse<AttendanceRecord>>(
      `/students/${id}/attendance`,
      { params },
    );
    return data;
  },

  getGrades: async (id: string): Promise<Grade[]> => {
    const { data } = await httpClient.get<Grade[]>(`/students/${id}/grades`);
    return data;
  },

  getSchedule: async (id: string): Promise<ScheduleItem[]> => {
    const { data } = await httpClient.get<ScheduleItem[]>(
      `/students/${id}/schedule`,
    );
    return data;
  },

  getCertificates: async (id: string): Promise<Certificate[]> => {
    const { data } = await httpClient.get<Certificate[]>(
      `/students/${id}/certificates`,
    );
    return data;
  },

  getNotifications: async (id: string): Promise<StudentNotification[]> => {
    const { data } = await httpClient.get<StudentNotification[]>(
      `/students/${id}/notifications`,
    );
    return data;
  },

  bulkImport: async (
    file: File,
  ): Promise<{ imported: number; errors: string[] }> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await httpClient.post<{
      imported: number;
      errors: string[];
    }>('/students/bulk-import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
