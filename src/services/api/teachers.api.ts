import { httpClient } from './axios.instance';
import type { PaginatedResponse, PaginationParams, ScheduleItem } from './students.api';

export interface TeacherListParams extends PaginationParams {
  subjectId?: string;
  isActive?: boolean;
}

export type TeacherStatus = 'active' | 'inactive' | 'on_leave';

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  status: TeacherStatus;
  subjects: string[];
  bio?: string;
  tenantId: string;
  activeCourseCount: number;
  studentCount: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeacherDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subjects?: string[];
  bio?: string;
  password?: string;
}

export interface UpdateTeacherDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  subjects?: string[];
  bio?: string;
  status?: TeacherStatus;
  avatarUrl?: string;
}

export interface TeacherCourse {
  id: string;
  name: string;
  studentCount: number;
  progress: number;
  startDate: string;
  endDate?: string;
}

export interface TeacherSalary {
  id: string;
  teacherId: string;
  amount: number;
  currency: string;
  month: string;
  paidAt?: string;
  isPaid: boolean;
}

export interface TeacherAnalytics {
  avgGrade(avgGrade: unknown): number | undefined;
  totalStudents: number;
  activeCourses: number;
  averageAttendance: number;
  averageGrade: number;
  homeworkGraded: number;
  homeworkPending: number;
}

/** Shape returned by the backend for a single teacher (raw entity + `user` relation). */
interface RawTeacher {
  id: string;
  tenantId: string;
  subjects?: string[] | null;
  bio?: string | null;
  rating?: string | number | null;
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

/** Maps the raw backend teacher shape (entity + `user` relation) to the frontend `Teacher` view model. */
function mapTeacher(raw: RawTeacher): Teacher {
  const user = raw.user;
  const rating = raw.rating != null ? Number(raw.rating) : undefined;
  const status: TeacherStatus =
    user?.status === 'active'
      ? 'active'
      : user?.status === 'suspended'
        ? 'on_leave'
        : 'inactive';

  return {
    id: raw.id,
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    ...(user?.phone != null ? { phone: user.phone } : {}),
    ...(user?.avatarUrl != null ? { avatarUrl: user.avatarUrl } : {}),
    status,
    subjects: raw.subjects ?? [],
    ...(raw.bio != null ? { bio: raw.bio } : {}),
    tenantId: raw.tenantId,
    activeCourseCount: 0,
    studentCount: 0,
    ...(rating !== undefined ? { rating } : {}),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const teachersApi = {
  getList: async (
    params: TeacherListParams,
  ): Promise<PaginatedResponse<Teacher>> => {
    const { data } = await httpClient.get<RawPaginatedResponse<RawTeacher>>(
      '/teachers',
      { params },
    );
    return {
      data: data.data.map(mapTeacher),
      total: data.meta.total,
      page: data.meta.page,
      limit: data.meta.limit,
      totalPages: data.meta.totalPages,
    };
  },

  getById: async (id: string): Promise<Teacher> => {
    const { data } = await httpClient.get<RawTeacher>(`/teachers/${id}`);
    return mapTeacher(data);
  },

  create: async (dto: CreateTeacherDto): Promise<Teacher> => {
    const { data } = await httpClient.post<RawTeacher>('/teachers', dto);
    return mapTeacher(data);
  },

  update: async (id: string, dto: UpdateTeacherDto): Promise<Teacher> => {
    const { data } = await httpClient.patch<RawTeacher>(`/teachers/${id}`, dto);
    return mapTeacher(data);
  },

  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/teachers/${id}`);
  },

  getCourses: async (id: string): Promise<TeacherCourse[]> => {
    const { data } = await httpClient.get<TeacherCourse[]>(
      `/teachers/${id}/courses`,
    );
    return data;
  },

  getSchedule: async (id: string): Promise<ScheduleItem[]> => {
    const { data } = await httpClient.get<ScheduleItem[]>(
      `/teachers/${id}/schedule`,
    );
    return data;
  },

  getSalaryHistory: async (
    id: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<TeacherSalary>> => {
    const { data } = await httpClient.get<PaginatedResponse<TeacherSalary>>(
      `/teachers/${id}/salary`,
      { params },
    );
    return data;
  },

  getAnalytics: async (id: string): Promise<TeacherAnalytics> => {
    const { data } = await httpClient.get<TeacherAnalytics>(
      `/teachers/${id}/analytics`,
    );
    return data;
  },

  assignCourse: async (
    teacherId: string,
    courseId: string,
  ): Promise<void> => {
    await httpClient.post(`/teachers/${teacherId}/courses/${courseId}`);
  },

  removeCourse: async (
    teacherId: string,
    courseId: string,
  ): Promise<void> => {
    await httpClient.delete(`/teachers/${teacherId}/courses/${courseId}`);
  },
};
