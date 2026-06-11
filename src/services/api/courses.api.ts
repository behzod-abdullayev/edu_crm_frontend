import { httpClient } from './axios.instance';
import type { PaginatedResponse, PaginationParams } from './students.api';

export interface CourseListParams extends PaginationParams {
  teacherId?: string;
  status?: CourseStatus;
  categoryId?: string;
  isPublished?: boolean;
}

export type CourseStatus = 'draft' | 'published' | 'archived';

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

/** Shape returned by the backend for a single course (raw entity + relations). */
interface RawCourse {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  coverUrl?: string | null;
  status: CourseStatus;
  teacherId?: string | null;
  teacher?: { user?: { firstName?: string; lastName?: string } | null } | null;
  categoryId?: string | null;
  price?: string | number | null;
  currency?: string;
  durationHours?: number;
  enrolledCount?: number;
  maxStudents?: number;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

/** Backend list responses are wrapped as `{ data, meta: { total, page, limit, totalPages } }`. */
interface RawPaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

/** Maps the raw backend course shape to the frontend `Course` view model. */
function mapCourse(raw: RawCourse): Course {
  const teacherUser = raw.teacher?.user;
  const teacherName = teacherUser
    ? `${teacherUser.firstName ?? ''} ${teacherUser.lastName ?? ''}`.trim()
    : '';
  const thumbnailUrl = raw.thumbnailUrl ?? raw.coverUrl ?? undefined;
  const price = raw.price != null ? Number(raw.price) : undefined;

  return {
    id: raw.id,
    name: raw.title,
    ...(raw.description != null ? { description: raw.description } : {}),
    ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
    teacherId: raw.teacherId ?? '',
    teacherName,
    ...(raw.categoryId != null ? { categoryId: raw.categoryId } : {}),
    status: raw.status,
    ...(price !== undefined ? { price } : {}),
    ...(raw.currency !== undefined ? { currency: raw.currency } : {}),
    ...(raw.durationHours != null ? { duration: raw.durationHours } : {}),
    studentCount: raw.enrolledCount ?? 0,
    ...(raw.maxStudents != null ? { maxStudents: raw.maxStudents } : {}),
    tenantId: raw.tenantId,
    isPublished: raw.status === 'published',
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export const coursesApi = {
  getList: async (
    params: CourseListParams,
  ): Promise<PaginatedResponse<Course>> => {
    const { data } = await httpClient.get<RawPaginatedResponse<RawCourse>>(
      '/courses',
      { params },
    );
    return {
      data: data.data.map(mapCourse),
      total: data.meta.total,
      page: data.meta.page,
      limit: data.meta.limit,
      totalPages: data.meta.totalPages,
    };
  },

  getById: async (id: string): Promise<Course> => {
    const { data } = await httpClient.get<RawCourse>(`/courses/${id}`);
    return mapCourse(data);
  },

  create: async (dto: CreateCourseDto): Promise<Course> => {
    const { data } = await httpClient.post<RawCourse>('/courses', dto);
    return mapCourse(data);
  },

  update: async (id: string, dto: UpdateCourseDto): Promise<Course> => {
    const { data } = await httpClient.patch<RawCourse>(`/courses/${id}`, dto);
    return mapCourse(data);
  },

  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/courses/${id}`);
  },

  publish: async (id: string): Promise<Course> => {
    const { data } = await httpClient.post<RawCourse>(`/courses/${id}/publish`);
    return mapCourse(data);
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
