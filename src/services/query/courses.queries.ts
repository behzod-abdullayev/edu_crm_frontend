'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { queryKeys } from './keys.factory';
import {
  coursesApi,
  type Course,
  type CourseListParams,
  type CourseStatus,
  type CreateCourseDto,
  type UpdateCourseDto,
} from '@/services/api/courses.api';
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

export function useCourseList(params: CourseListParams) {
  return useQuery({
    queryKey: queryKeys.courses.list(params),
    queryFn: () => coursesApi.getList(params),
    ...QUERY_DEFAULTS,
  });
}

export function useCourseDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.courses.detail(id),
    queryFn: () => coursesApi.getById(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useCourseLessons(id: string) {
  return useQuery({
    queryKey: queryKeys.courses.lessons(id),
    queryFn: () => coursesApi.getLessons(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useCourseEnrollments(id: string) {
  return useQuery({
    queryKey: queryKeys.courses.enrollments(id),
    queryFn: () => coursesApi.getEnrollments(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const t = useTranslations('toast');

  return useMutation({
    mutationFn: (dto: CreateCourseDto) => coursesApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
      addToast({ type: 'success', title: t('createSuccess') });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({
        type: 'error',
        title: t('createError'),
        description: parsed.message,
      });
    },
  });
}

export function useUpdateCourse(id: string) {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const t = useTranslations('toast');

  return useMutation({
    mutationFn: (dto: UpdateCourseDto) => coursesApi.update(id, dto),
    onMutate: async (dto) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.courses.detail(id) });
      const previous = queryClient.getQueryData<Course>(
        queryKeys.courses.detail(id),
      );
      if (previous) {
        queryClient.setQueryData<Course>(queryKeys.courses.detail(id), {
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
      addToast({
        type: 'error',
        title: t('updateError'),
        description: parsed.message,
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Course>(queryKeys.courses.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
      addToast({ type: 'success', title: t('updateSuccess') });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const t = useTranslations('toast');

  return useMutation({
    mutationFn: (id: string) => coursesApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.courses.detail(id) });
      addToast({ type: 'success', title: t('deleteSuccess') });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({
        type: 'error',
        title: t('deleteError'),
        description: parsed.message,
      });
    },
  });
}

export function usePublishCourse() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const t = useTranslations('toast');

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CourseStatus }) =>
      coursesApi.publish(id, status),
    onSuccess: (updated, { id, status }) => {
      queryClient.setQueryData<Course>(queryKeys.courses.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
      addToast({
        type: 'success',
        title: status === 'published' ? t('publishSuccess') : t('unpublishSuccess'),
      });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({
        type: 'error',
        title: t('publishError'),
        description: parsed.message,
      });
    },
  });
}

export function useEnrollStudent() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const t = useTranslations('toast');

  return useMutation({
    mutationFn: ({ courseId, studentId }: { courseId: string; studentId: string }) =>
      coursesApi.enrollStudent(courseId, studentId),
    onSuccess: (_data, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrollments(courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
      addToast({ type: 'success', title: t('enrollSuccess') });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({
        type: 'error',
        title: t('enrollError'),
        description: parsed.message,
      });
    },
  });
}
