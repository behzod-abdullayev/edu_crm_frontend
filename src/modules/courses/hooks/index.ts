'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { queryKeys } from '@/services/query/keys.factory';
import {
  coursesApi,
  type CourseListParams,
  type CreateCourseDto,
  type UpdateCourseDto,
  type Course,
  type Lesson,
} from '@/services/api/courses.api';
import type { PaginationParams } from '@/services/query/keys.factory';
import { useUIStore } from '@/store/ui.store';
import { parseApiError } from '@/shared/utils/api-error';

const QUERY_DEFAULTS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  retry: 2,
  retryDelay: (n: number) => Math.min(1000 * 2 ** n, 30_000),
  refetchOnWindowFocus: false,
  refetchOnMount: true,
} as const;

// ── Course List ───────────────────────────────────────────────────────────────

export function useCourseList(params: CourseListParams) {
  return useQuery({
    queryKey: queryKeys.courses.list(params),
    queryFn: () => coursesApi.getList(params),
    ...QUERY_DEFAULTS,
  });
}

// ── Course Detail ─────────────────────────────────────────────────────────────

export function useCourseDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.courses.detail(id),
    queryFn: () => coursesApi.getById(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

// ── Create Course ─────────────────────────────────────────────────────────────

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (dto: CreateCourseDto) => coursesApi.create(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.courses.lists(),
      });
      addToast({ type: 'success', title: 'Course created successfully.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

// ── Update Course ─────────────────────────────────────────────────────────────

export function useUpdateCourse(id: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (dto: UpdateCourseDto) => coursesApi.update(id, dto),
    onMutate: async (dto) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.courses.detail(id) });
      const previous = queryClient.getQueryData<Course>(
        queryKeys.courses.detail(id),
      );
      if (previous) {
        queryClient.setQueryData(queryKeys.courses.detail(id), {
          ...previous,
          ...dto,
        });
      }
      return { previous };
    },
    onError: (error: unknown, _dto, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.courses.detail(id), context.previous);
      }
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.courses.detail(id), updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
      addToast({ type: 'success', title: 'Course updated.' });
    },
  });
}

// ── Delete Course ─────────────────────────────────────────────────────────────

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: string) => coursesApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.courses.detail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
      addToast({ type: 'success', title: 'Course deleted.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

// ── Publish Course ────────────────────────────────────────────────────────────

export function usePublishCourse(id: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: () => coursesApi.publish(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.courses.detail(id), updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
      addToast({ type: 'success', title: 'Course published.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

// ── Lessons ───────────────────────────────────────────────────────────────────

export function useCourseLessons(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courses.lessons(courseId),
    queryFn: () => coursesApi.getLessons(courseId),
    enabled: !!courseId,
    ...QUERY_DEFAULTS,
  });
}

export function useCreateLesson(courseId: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (dto: Omit<Lesson, 'id' | 'courseId'>) =>
      coursesApi.createLesson(courseId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.courses.lessons(courseId),
      });
      addToast({ type: 'success', title: 'Lesson created.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

export function useUpdateLesson(courseId: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: ({
      lessonId,
      dto,
    }: {
      lessonId: string;
      dto: Partial<Omit<Lesson, 'id' | 'courseId'>>;
    }) => coursesApi.updateLesson(courseId, lessonId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.courses.lessons(courseId),
      });
      addToast({ type: 'success', title: 'Lesson updated.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (lessonId: string) =>
      coursesApi.deleteLesson(courseId, lessonId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.courses.lessons(courseId),
      });
      addToast({ type: 'success', title: 'Lesson deleted.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

// ── Enrollments ───────────────────────────────────────────────────────────────

export function useCourseEnrollments(
  courseId: string,
  params?: PaginationParams,
) {
  return useQuery({
    queryKey: queryKeys.courses.enrollments(courseId),
    queryFn: () => coursesApi.getEnrollments(courseId, params),
    enabled: !!courseId,
    ...QUERY_DEFAULTS,
  });
}

export function useEnrollStudent(courseId: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (studentId: string) =>
      coursesApi.enrollStudent(courseId, studentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.courses.enrollments(courseId),
      });
      addToast({ type: 'success', title: 'Student enrolled.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

export function useUnenrollStudent(courseId: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (studentId: string) =>
      coursesApi.unenrollStudent(courseId, studentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.courses.enrollments(courseId),
      });
      addToast({ type: 'success', title: 'Student unenrolled.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

// ── Homework Submissions ──────────────────────────────────────────────────────

export function useCourseHomeworkSubmissions(
  courseId: string,
  homeworkId: string,
  params?: PaginationParams,
) {
  return useQuery({
    queryKey: queryKeys.courses.submissions(courseId, homeworkId),
    queryFn: () =>
      coursesApi.getHomeworkSubmissions(courseId, homeworkId, params),
    enabled: !!courseId && !!homeworkId,
    ...QUERY_DEFAULTS,
  });
}

export function useGradeSubmission(courseId: string, homeworkId: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: ({
      submissionId,
      grade,
      feedback,
    }: {
      submissionId: string;
      grade: number;
      feedback?: string;
    }) =>
      coursesApi.gradeSubmission(courseId, homeworkId, submissionId, grade, feedback),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.courses.submissions(courseId, homeworkId),
      });
      addToast({ type: 'success', title: 'Submission graded.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}
