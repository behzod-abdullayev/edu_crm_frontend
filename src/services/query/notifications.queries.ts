'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys.factory';
import {
  notificationsApi,
  type Notification,
  type NotificationListParams,
} from '@/services/api/notifications.api';
import type { PaginatedResponse } from '@/services/api/students.api';
import { useUIStore } from '@/store/ui.store';
import { parseApiError } from '@/shared/utils/api-error';

const QUERY_DEFAULTS = {
  staleTime: 1 * 60 * 1000,
  gcTime: 5 * 60 * 1000,
  retry: 2,
  retryDelay: (n: number) => Math.min(1000 * 2 ** n, 30_000),
  refetchOnWindowFocus: true,
  refetchOnMount: true,
} as const;

export function useNotificationList(params: NotificationListParams) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => notificationsApi.getList(params),
    ...QUERY_DEFAULTS,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: queryKeys.notifications.preferences(),
    queryFn: () => notificationsApi.getPreferences(),
    ...QUERY_DEFAULTS,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: (updated) => {
      // Patch the notification in all list caches
      queryClient.setQueriesData<PaginatedResponse<Notification>>(
        { queryKey: queryKeys.notifications.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((n) =>
              n.id === updated.id ? { ...n, isRead: true } : n,
            ),
          };
        },
      );
      // Decrement unread count
      queryClient.setQueryData<{ count: number }>(
        queryKeys.notifications.unreadCount(),
        (old) => (old ? { count: Math.max(0, old.count - 1) } : { count: 0 }),
      );
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.setQueriesData<PaginatedResponse<Notification>>(
        { queryKey: queryKeys.notifications.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((n) => ({ ...n, isRead: true })),
          };
        },
      );
      queryClient.setQueryData<{ count: number }>(
        queryKeys.notifications.unreadCount(),
        { count: 0 },
      );
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({
        type: 'error',
        title: 'notifications.markAllReadFailed',
        description: parsed.message,
      });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.setQueriesData<PaginatedResponse<Notification>>(
        { queryKey: queryKeys.notifications.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((n) => n.id !== id),
            total: old.total - 1,
          };
        },
      );
    },
  });
}
