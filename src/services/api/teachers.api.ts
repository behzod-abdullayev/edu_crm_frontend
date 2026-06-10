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

export const teachersApi = {
  getList: async (
    params: TeacherListParams,
  ): Promise<PaginatedResponse<Teacher>> => {
    const { data } = await httpClient.get<PaginatedResponse<Teacher>>(
      '/teachers',
      { params },
    );
    return data;
  },

  getById: async (id: string): Promise<Teacher> => {
    const { data } = await httpClient.get<Teacher>(`/teachers/${id}`);
    return data;
  },

  create: async (dto: CreateTeacherDto): Promise<Teacher> => {
    const { data } = await httpClient.post<Teacher>('/teachers', dto);
    return data;
  },

  update: async (id: string, dto: UpdateTeacherDto): Promise<Teacher> => {
    const { data } = await httpClient.patch<Teacher>(`/teachers/${id}`, dto);
    return data;
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
