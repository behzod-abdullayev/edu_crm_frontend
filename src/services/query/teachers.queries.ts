'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { queryKeys } from './keys.factory';
import {
  teachersApi,
  type Teacher,
  type TeacherListParams,
  type CreateTeacherDto,
  type UpdateTeacherDto,
} from '@/services/api/teachers.api';
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

export function useTeacherList(params: TeacherListParams) {
  return useQuery({
    queryKey: queryKeys.teachers.list(params),
    queryFn: () => teachersApi.getList(params),
    ...QUERY_DEFAULTS,
  });
}

export function useTeacherDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.teachers.detail(id),
    queryFn: () => teachersApi.getById(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useTeacherCourses(id: string) {
  return useQuery({
    queryKey: queryKeys.teachers.courses(id),
    queryFn: () => teachersApi.getCourses(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useTeacherSchedule(id: string) {
  return useQuery({
    queryKey: queryKeys.teachers.schedule(id),
    queryFn: () => teachersApi.getSchedule(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useTeacherSalary(id: string) {
  return useQuery({
    queryKey: queryKeys.teachers.salary(id),
    queryFn: () => teachersApi.getSalaryHistory(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useTeacherAnalytics(id: string) {
  return useQuery({
    queryKey: queryKeys.teachers.analytics(id),
    queryFn: () => teachersApi.getAnalytics(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const t = useTranslations('toast');

  return useMutation({
    mutationFn: (dto: CreateTeacherDto) => teachersApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.lists() });
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

export function useUpdateTeacher(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateTeacherDto) => teachersApi.update(id, dto),
    onMutate: async (dto) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.teachers.detail(id) });
      const previous = queryClient.getQueryData<Teacher>(
        queryKeys.teachers.detail(id),
      );
      if (previous) {
        queryClient.setQueryData<Teacher>(queryKeys.teachers.detail(id), {
          ...previous,
          ...dto,
        });
      }
      return { previous };
    },
    onError: (_error: unknown, _dto, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.teachers.detail(id), context.previous);
      }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Teacher>(queryKeys.teachers.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.lists() });
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teachersApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.teachers.detail(id) });
    },
  });
}
