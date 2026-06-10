'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { queryKeys } from './keys.factory';
import {
  studentsApi,
  type Student,
  type StudentListParams,
  type CreateStudentDto,
  type UpdateStudentDto,
} from '@/services/api/students.api';
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

export function useStudentList(params: StudentListParams) {
  return useQuery({
    queryKey: queryKeys.students.list(params),
    queryFn: () => studentsApi.getList(params),
    ...QUERY_DEFAULTS,
  });
}

export function useStudentDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.students.detail(id),
    queryFn: () => studentsApi.getById(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useStudentCourses(id: string) {
  return useQuery({
    queryKey: queryKeys.students.courses(id),
    queryFn: () => studentsApi.getCourses(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useStudentAttendance(id: string) {
  return useQuery({
    queryKey: queryKeys.students.attendance(id),
    queryFn: () => studentsApi.getAttendance(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useStudentGrades(id: string) {
  return useQuery({
    queryKey: queryKeys.students.grades(id),
    queryFn: () => studentsApi.getGrades(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useStudentSchedule(id: string) {
  return useQuery({
    queryKey: queryKeys.students.schedule(id),
    queryFn: () => studentsApi.getSchedule(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useStudentCertificates(id: string) {
  return useQuery({
    queryKey: queryKeys.students.certificates(id),
    queryFn: () => studentsApi.getCertificates(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (dto: CreateStudentDto) => studentsApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
      addToast({ type: 'success', title: 'students.createSuccess' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({
        type: 'error',
        title: 'students.createFailed',
        description: parsed.message,
      });
    },
  });
}

export function useUpdateStudent(id: string) {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (dto: UpdateStudentDto) => studentsApi.update(id, dto),
    onMutate: async (dto) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.students.detail(id) });
      const previous = queryClient.getQueryData<Student>(
        queryKeys.students.detail(id),
      );
      if (previous) {
        queryClient.setQueryData<Student>(queryKeys.students.detail(id), {
          ...previous,
          ...dto,
        });
      }
      return { previous };
    },
    onError: (error: unknown, _dto, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.students.detail(id), context.previous);
      }
      const parsed = parseApiError(error);
      addToast({
        type: 'error',
        title: 'students.updateFailed',
        description: parsed.message,
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Student>(queryKeys.students.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (id: string) => studentsApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.students.detail(id) });
      addToast({ type: 'success', title: 'students.deleteSuccess' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({
        type: 'error',
        title: 'students.deleteFailed',
        description: parsed.message,
      });
    },
  });
}
