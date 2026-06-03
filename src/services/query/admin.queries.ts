'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { queryKeys } from './keys.factory';
import {
  adminApi,
  type AdminListParams,
  type CreateStaffDto,
  type UpdateStaffDto,
  type CreateGroupDto,
  type UpdateGroupDto,
} from '@/services/api/admin.api';
import { useUIStore } from '@/store/ui.store';
import { parseApiError } from '@/shared/utils/api-error';
import type { PaginationParams } from './keys.factory';

const QUERY_DEFAULTS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  retry: 2,
  retryDelay: (n: number) => Math.min(1000 * 2 ** n, 30_000),
  refetchOnWindowFocus: false,
  refetchOnMount: true,
} as const;

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function useAdminDashboard() {
  return useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: () => adminApi.getDashboard(),
    ...QUERY_DEFAULTS,
  });
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export function useAdminStaffList(params: AdminListParams) {
  return useQuery({
    queryKey: queryKeys.admin.staff.list(params),
    queryFn: () => adminApi.getStaff(params),
    ...QUERY_DEFAULTS,
  });
}

export function useAdminStaffDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.staff.detail(id),
    queryFn: () => adminApi.getStaffById(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (dto: CreateStaffDto) => adminApi.createStaff(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.staff.lists(),
      });
      addToast({ type: 'success', title: 'Staff member created successfully.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

export function useUpdateStaff(id: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (dto: UpdateStaffDto) => adminApi.updateStaff(id, dto),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.admin.staff.detail(id), updated);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.staff.lists(),
      });
      addToast({ type: 'success', title: 'Staff member updated.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteStaff(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.admin.staff.detail(id) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.staff.lists(),
      });
      addToast({ type: 'success', title: 'Staff member removed.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

// ── Groups ────────────────────────────────────────────────────────────────────

export function useAdminGroupList(params: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.admin.groups.list(params),
    queryFn: () => adminApi.getGroups(params),
    ...QUERY_DEFAULTS,
  });
}

export function useAdminGroupDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.groups.detail(id),
    queryFn: () => adminApi.getGroupById(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (dto: CreateGroupDto) => adminApi.createGroup(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.groups.lists(),
      });
      addToast({ type: 'success', title: 'Group created successfully.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

export function useUpdateGroup(id: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (dto: UpdateGroupDto) => adminApi.updateGroup(id, dto),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.admin.groups.detail(id), updated);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.groups.lists(),
      });
      addToast({ type: 'success', title: 'Group updated.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteGroup(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.admin.groups.detail(id) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.groups.lists(),
      });
      addToast({ type: 'success', title: 'Group deleted.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

// ── Audit Logs ────────────────────────────────────────────────────────────────

export function useAdminAuditLogs(
  params?: PaginationParams & { userId?: string; resource?: string },
) {
  return useQuery({
    queryKey: queryKeys.admin.auditLogs(params),
    queryFn: () => adminApi.getAuditLogs(params ?? {}),
    ...QUERY_DEFAULTS,
    staleTime: 60 * 1000, // 1 min — logs change frequently
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function useAdminAnalytics(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.analytics(params),
    queryFn: () => adminApi.getAnalytics(params),
    ...QUERY_DEFAULTS,
  });
}
