'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@shared/hooks/useToast';
import { httpClient } from '@/services/api/axios.instance';
import type { Teacher, TeacherAnalytics } from '@/services/api/teachers.api';
import type { PaginatedResponse } from '@generated/models';
import type {
  GroupDto,
  HomeworkDto,
  LessonDto,
} from '@generated/models';
import {
  mapTeacherDtoToForm,
  mapTeacherFormToDto,
  mapAttendanceEntryDto,
} from '../utils/teacher.mapper';
import type {
  TeacherFormValues,
  AttendanceMarkEntry,
  AttendanceMarkingFormValues,
  HomeworkCreateFormValues,
  HomeworkGradeFormValues,
  LessonUploadFormValues,
} from '../types/teacher.types';

// ─── Local DTOs (not in generated models) ────────────────────────────────────

export type { GroupDto, HomeworkDto, LessonDto };

export type TeacherDto = Teacher;

export interface HomeworkSubmissionDto {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  studentAvatarUrl?: string | undefined;
  textAnswer?: string | undefined;
  attachedFileKeys?: string[] | undefined;
  grade?: number | undefined;
  teacherFeedback?: string | undefined;
  feedback?: string | undefined;
  submittedAt: string;
  gradedAt?: string | undefined;
  status: 'pending' | 'graded' | 'late';
}

// ─── Teacher Profile ─────────────────────────────────────────────────────────

export function useTeacherProfile(teacherId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['teachers', teacherId],
    queryFn: async () => {
      const res = await httpClient.get<TeacherDto>(`/teachers/${teacherId}`);
      return res.data;
    },
    enabled: !!teacherId,
  });

  const updateMutation = useMutation({
    mutationFn: async (form: TeacherFormValues) => {
      const res = await httpClient.patch<TeacherDto>(
        `/teachers/${teacherId}`,
        mapTeacherFormToDto(form),
      );
      return res.data;
    },
    onMutate: async (form: TeacherFormValues) => {
      await queryClient.cancelQueries({ queryKey: ['teachers', teacherId] });
      const previous = queryClient.getQueryData<TeacherDto>(['teachers', teacherId]);
      queryClient.setQueryData<TeacherDto>(
        ['teachers', teacherId],
        (old) => (old ? { ...old, ...mapTeacherFormToDto(form) } : old),
      );
      return { previous };
    },
    onError: (_err: unknown, _form: TeacherFormValues, ctx?: { previous: TeacherDto | undefined }) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['teachers', teacherId], ctx.previous);
      }
      toast.error('Failed to update profile');
    },
    onSuccess: () => {
      toast.success('Profile updated');
      void queryClient.invalidateQueries({ queryKey: ['teachers', teacherId] });
    },
  });

  return {
    teacher: query.data,
    formValues: query.data ? mapTeacherDtoToForm(query.data) : null,
    isLoading: query.isLoading,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}

// ─── Teacher Groups ───────────────────────────────────────────────────────────

export function useTeacherGroups(
  teacherId: string,
  status?: 'active' | 'archived' | 'all',
) {
  return useQuery({
    queryKey: ['teachers', teacherId, 'groups', status],
    queryFn: async () => {
      const res = await httpClient.get<GroupDto[]>(`/teachers/${teacherId}/groups`, {
        params: { status: status !== 'all' ? status : undefined },
      });
      return res.data;
    },
    enabled: !!teacherId,
  });
}

// ─── Attendance Marking ───────────────────────────────────────────────────────

export function useAttendanceMarking(teacherId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const prefetchStudents = async (
    groupId: string,
    date: string,
  ): Promise<AttendanceMarkEntry[]> => {
    return queryClient.fetchQuery({
      queryKey: ['teachers', teacherId, 'attendance-students', groupId, date],
      queryFn: async () => {
        const res = await httpClient.get(
          `/teachers/${teacherId}/groups/${groupId}/attendance-sheet`,
          { params: { date } },
        );
        const dtos = res.data as Parameters<typeof mapAttendanceEntryDto>[0][];
        return dtos.map(mapAttendanceEntryDto);
      },
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (form: AttendanceMarkingFormValues) => {
      const res = await httpClient.post(`/teachers/${teacherId}/attendance`, {
        groupId: form.groupId,
        date: form.date,
        entries: form.entries.map((e) => ({
          studentId: e.studentId,
          status: e.status,
          ...(e.note !== undefined ? { note: e.note } : {}),
        })),
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Attendance saved');
      void queryClient.invalidateQueries({
        queryKey: ['teachers', teacherId, 'attendance'],
      });
    },
    onError: () => {
      toast.error('Failed to save attendance');
    },
  });

  return {
    prefetchStudents,
    save: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}

// ─── Homework (list) ──────────────────────────────────────────────────────────

export function useTeacherHomework(
  teacherId: string,
  params?: { page?: number; pageSize?: number },
) {
  return useQuery({
    queryKey: ['teachers', teacherId, 'homework', params],
    queryFn: async () => {
      const res = await httpClient.get<PaginatedResponse<HomeworkDto>>(
        `/teachers/${teacherId}/homework`,
        { params: { page: params?.page ?? 1, pageSize: params?.pageSize ?? 20 } },
      );
      return res.data;
    },
    enabled: !!teacherId,
  });
}

// ─── Homework create ──────────────────────────────────────────────────────────

export function useHomeworkCreate(teacherId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (form: HomeworkCreateFormValues) => {
      const res = await httpClient.post<HomeworkDto>('/homework', {
        ...form,
        teacherId,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Homework created');
      void queryClient.invalidateQueries({
        queryKey: ['teachers', teacherId, 'homework'],
      });
    },
    onError: () => {
      toast.error('Failed to create homework');
    },
  });
}

// ─── Homework grade ───────────────────────────────────────────────────────────

export function useHomeworkGrade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      homeworkId,
      submissionId,
      values,
    }: {
      homeworkId: string;
      submissionId: string;
      values: HomeworkGradeFormValues;
    }) => {
      const res = await httpClient.post<HomeworkSubmissionDto>(
        `/homework/${homeworkId}/grade/${submissionId}`,
        values,
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      toast.success('Grade saved');
      void queryClient.invalidateQueries({
        queryKey: ['homework', variables.homeworkId, 'submissions'],
      });
    },
    onError: () => {
      toast.error('Failed to save grade');
    },
  });
}

// ─── Lessons (list) ───────────────────────────────────────────────────────────

export function useTeacherLessons(
  teacherId: string,
  params?: { groupId?: string; page?: number },
) {
  return useQuery({
    queryKey: ['teachers', teacherId, 'lessons', params],
    queryFn: async () => {
      const res = await httpClient.get<PaginatedResponse<LessonDto>>(
        `/teachers/${teacherId}/lessons`,
        { params: { groupId: params?.groupId, page: params?.page ?? 1 } },
      );
      return res.data;
    },
    enabled: !!teacherId,
  });
}

// ─── Lesson upload ────────────────────────────────────────────────────────────

export function useLessonUpload(teacherId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (form: LessonUploadFormValues) => {
      const createRes = await httpClient.post<LessonDto>('/lessons', {
        ...form,
        teacherId,
      });
      const lesson = createRes.data;
      if (form.fileKey) {
        await httpClient.post(`/lessons/${lesson.id}/upload`, {
          fileKey: form.fileKey,
        });
      }
      return lesson;
    },
    onSuccess: () => {
      toast.success('Lesson uploaded');
      void queryClient.invalidateQueries({
        queryKey: ['teachers', teacherId, 'lessons'],
      });
    },
    onError: () => {
      toast.error('Failed to upload lesson');
    },
  });
}

// ─── Teacher Analytics ────────────────────────────────────────────────────────

export function useTeacherAnalytics(
  teacherId: string,
  params?: { from?: string; to?: string },
) {
  return useQuery({
    queryKey: ['teachers', teacherId, 'analytics', params],
    queryFn: async () => {
      const res = await httpClient.get<TeacherAnalytics>(`/teachers/${teacherId}/analytics`, {
        params,
      });
      return res.data;
    },
    enabled: !!teacherId,
  });
}
