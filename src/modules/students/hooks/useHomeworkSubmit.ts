'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@shared/hooks/useToast';
import { httpClient } from '@/services/api/axios.instance';
import type { HomeworkSubmissionFormValues } from '../types/student.types';

export interface HomeworkSubmissionDto {
  id: string;
  homeworkId: string;
  studentId: string;
  textAnswer?: string;
  attachedFileKeys: string[];
  grade?: number;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
}

export function useHomeworkSubmit(homeworkId: string, studentId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: async (values: Omit<HomeworkSubmissionFormValues, 'homeworkId'>) => {
      const res = await httpClient.post<HomeworkSubmissionDto>(
        `/homework/${homeworkId}/submissions`,
        {
          textAnswer: values.textAnswer,
          attachedFileKeys: values.attachedFileKeys,
        },
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Homework submitted successfully!');
      void queryClient.invalidateQueries({ queryKey: ['homework', homeworkId] });
      void queryClient.invalidateQueries({ queryKey: ['students', studentId, 'homework'] });
    },
    onError: () => {
      toast.error('Submission failed', 'Please try again.');
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: async (values: Omit<HomeworkSubmissionFormValues, 'homeworkId'>) => {
      const res = await httpClient.patch<HomeworkSubmissionDto>(
        `/homework/${homeworkId}/submissions/latest`,
        {
          textAnswer: values.textAnswer,
          attachedFileKeys: values.attachedFileKeys,
        },
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Homework resubmitted successfully!');
      void queryClient.invalidateQueries({ queryKey: ['homework', homeworkId] });
    },
    onError: () => {
      toast.error('Resubmission failed', 'Please try again.');
    },
  });

  return {
    submit: submitMutation.mutateAsync,
    resubmit: resubmitMutation.mutateAsync,
    isSubmitting: submitMutation.isPending,
    isResubmitting: resubmitMutation.isPending,
    submitError: submitMutation.error,
  };
}
