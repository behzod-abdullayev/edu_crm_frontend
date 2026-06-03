'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@shared/hooks/useToast';
import { httpClient } from '@/services/api/axios.instance';
import type { Student } from '@/services/api/students.api';
import { mapStudentDtoToForm, mapStudentFormToDto } from '../utils/student.mapper';
import type { StudentFormValues } from '../types/student.types';

// StudentDto is Student from students.api
export type StudentDto = Student;

export function useStudentProfile(studentId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['students', studentId],
    queryFn: async () => {
      const res = await httpClient.get<StudentDto>(`/students/${studentId}`);
      return res.data;
    },
    enabled: !!studentId,
  });

  const updateMutation = useMutation({
    mutationFn: async (form: StudentFormValues) => {
      const res = await httpClient.patch<StudentDto>(
        `/students/${studentId}`,
        mapStudentFormToDto(form),
      );
      return res.data;
    },
    onMutate: async (form) => {
      await queryClient.cancelQueries({ queryKey: ['students', studentId] });
      const previous = queryClient.getQueryData<StudentDto>(['students', studentId]);
      queryClient.setQueryData<StudentDto>(['students', studentId], (old) =>
        old ? { ...old, ...mapStudentFormToDto(form) } : old,
      );
      return { previous };
    },
    onError: (_err: unknown, _form: StudentFormValues, ctx?: { previous: StudentDto | undefined }) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['students', studentId], ctx.previous);
      }
      toast.error('Failed to update profile');
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      void queryClient.invalidateQueries({ queryKey: ['students', studentId] });
    },
  });

  const formValues = query.data ? mapStudentDtoToForm(query.data) : null;

  return {
    student: query.data,
    formValues,
    isLoading: query.isLoading,
    isError: query.isError,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
