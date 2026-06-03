'use client';

import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/services/api/axios.instance';
import type { PaginatedResponse } from '@/services/api/students.api';
import type { CourseListParams } from '../../courses/types/course.types';

// Local enrollment DTO (not yet in generated models)
export interface CourseEnrollmentDto {
  courseId: string;
  courseName: string;
  thumbnailUrl?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  progressPercent?: number;
  lessonCount?: number;
  nextLessonTitle?: string;
  enrolledAt: string;
  status: 'active' | 'completed' | 'dropped';
}

export function useStudentCourses(studentId: string, params?: Partial<CourseListParams>) {
  return useQuery({
    queryKey: ['students', studentId, 'courses', params],
    queryFn: async () => {
      const res = await httpClient.get<PaginatedResponse<CourseEnrollmentDto>>(
        `/students/${studentId}/courses`,
        {
          params: {
            page: params?.page ?? 1,
            pageSize: params?.pageSize ?? 20,
            ...(params?.search ? { search: params.search } : {}),
            ...(params?.status && params.status !== 'all' ? { status: params.status } : {}),
          },
        },
      );
      return res.data;
    },
    enabled: !!studentId,
  });
}

export function useStudentCourseDetail(studentId: string, courseId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'courses', courseId],
    queryFn: async () => {
      const res = await httpClient.get(`/students/${studentId}/courses/${courseId}`);
      return res.data;
    },
    enabled: !!studentId && !!courseId,
  });
}
