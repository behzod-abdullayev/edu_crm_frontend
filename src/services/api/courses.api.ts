import { httpClient } from './axios.instance';
import type { PaginatedResponse, PaginationParams } from './students.api';

export interface CourseListParams extends PaginationParams {
  teacherId?: string;
  status?: CourseStatus;
  categoryId?: string;
  isPublished?: boolean;
}

export type CourseStatus = 'draft' | 'active' | 'archived' | 'completed';

export interface Course {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  teacherId: string;
  teacherName: string;
  categoryId?: string;
  categoryName?: string;
  status: CourseStatus;
  price?: number;
  currency?: string;
  duration?: number;
  studentCount: number;
  maxStudents?: number;
  startDate?: string;
  endDate?: string;
  schedule?: CourseSchedule[];
  tenantId: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomNumber?: string;
}

export interface CreateCourseDto {
  name: string;
  description?: string;
  teacherId: string;
  categoryId?: string;
  price?: number;
  currency?: string;
  maxStudents?: number;
  startDate?: string;
  endDate?: string;
  schedule?: CourseSchedule[];
}

export interface UpdateCourseDto {
  name?: string;
  description?: string;
  thumbnailUrl?: string;
  teacherId?: string;
  categoryId?: string;
  status?: CourseStatus;
  price?: number;
  currency?: string;
  maxStudents?: number;
  startDate?: string;
  endDate?: string;
  schedule?: CourseSchedule[];
  isPublished?: boolean;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  duration?: number;
  videoUrl?: string;
  materials?: LessonMaterial[];
  homeworkId?: string;
  scheduledAt?: string;
  completedAt?: string;
}

export interface LessonMaterial {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'link' | 'file';
  url: string;
  size?: number;
}

export interface HomeworkSubmission {
  id: string;
  studentId: string;
  studentName: string;
  homeworkId: string;
  content?: string;
  attachments?: string[];
  grade?: number;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface CourseEnrollment {
  id: string;
  studentId: string;
  studentName: string;
  enrolledAt: string;
  progress: number;
  grade?: number;
}

export const coursesApi = {
  getList: async (
    params: CourseListParams,
  ): Promise<PaginatedResponse<Course>> => {
    const { data } = await httpClient.get<PaginatedResponse<Course>>(
      '/courses',
      { params },
    );
    return data;
  },

  getById: async (id: string): Promise<Course> => {
    const { data } = await httpClient.get<Course>(`/courses/${id}`);
    return data;
  },

  create: async (dto: CreateCourseDto): Promise<Course> => {
    const { data } = await httpClient.post<Course>('/courses', dto);
    return data;
  },

  update: async (id: string, dto: UpdateCourseDto): Promise<Course> => {
    const { data } = await httpClient.patch<Course>(`/courses/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/courses/${id}`);
  },

  publish: async (id: string): Promise<Course> => {
    const { data } = await httpClient.post<Course>(`/courses/${id}/publish`);
    return data;
  },

  getLessons: async (id: string): Promise<Lesson[]> => {
    const { data } = await httpClient.get<Lesson[]>(`/courses/${id}/lessons`);
    return data;
  },

  createLesson: async (
    courseId: string,
    dto: Omit<Lesson, 'id' | 'courseId'>,
  ): Promise<Lesson> => {
    const { data } = await httpClient.post<Lesson>(
      `/courses/${courseId}/lessons`,
      dto,
    );
    return data;
  },

  updateLesson: async (
    courseId: string,
    lessonId: string,
    dto: Partial<Omit<Lesson, 'id' | 'courseId'>>,
  ): Promise<Lesson> => {
    const { data } = await httpClient.patch<Lesson>(
      `/courses/${courseId}/lessons/${lessonId}`,
      dto,
    );
    return data;
  },

  deleteLesson: async (courseId: string, lessonId: string): Promise<void> => {
    await httpClient.delete(`/courses/${courseId}/lessons/${lessonId}`);
  },

  getEnrollments: async (
    id: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<CourseEnrollment>> => {
    const { data } = await httpClient.get<PaginatedResponse<CourseEnrollment>>(
      `/courses/${id}/enrollments`,
      { params },
    );
    return data;
  },

  enrollStudent: async (courseId: string, studentId: string): Promise<void> => {
    await httpClient.post(`/courses/${courseId}/enrollments`, { studentId });
  },

  unenrollStudent: async (
    courseId: string,
    studentId: string,
  ): Promise<void> => {
    await httpClient.delete(
      `/courses/${courseId}/enrollments/${studentId}`,
    );
  },

  getHomeworkSubmissions: async (
    courseId: string,
    homeworkId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<HomeworkSubmission>> => {
    const { data } = await httpClient.get<
      PaginatedResponse<HomeworkSubmission>
    >(`/courses/${courseId}/homeworks/${homeworkId}/submissions`, { params });
    return data;
  },

  gradeSubmission: async (
    courseId: string,
    homeworkId: string,
    submissionId: string,
    grade: number,
    feedback?: string,
  ): Promise<HomeworkSubmission> => {
    const { data } = await httpClient.post<HomeworkSubmission>(
      `/courses/${courseId}/homeworks/${homeworkId}/submissions/${submissionId}/grade`,
      { grade, feedback },
    );
    return data;
  },
};
