'use client';

import { useQuery } from '@tanstack/react-query';
import { getNotificationCount } from '@shared/api/notifications.api';

/**
 * Returns unread notification count.
 * Refetches every 60 s and on window focus.
 * Count increments immediately via WebSocket NOTIFICATION_NEW events.
 */
export function useNotificationCount(): { count: number } {
  const { data } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: getNotificationCount,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    initialData: 0,
  });

  return { count: data ?? 0 };
}
