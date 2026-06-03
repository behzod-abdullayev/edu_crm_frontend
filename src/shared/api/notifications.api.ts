/**
 * @file src/shared/api/notifications.api.ts
 *
 * Shared-layer façade for the Notifications API.
 *
 * All shared components (NotificationBell, etc.) and shared hooks
 * (useNotificationCount) import from here.  The canonical implementation
 * lives in src/services/api/notifications.api.ts; this file keeps the
 * internal surface stable and adds a lean helper for the unread count.
 */

// ── Re-export the full API object and its types ───────────────────────────────
export { notificationsApi } from '@/services/api/notifications.api';
export type {
  Notification,
  NotificationType,
  NotificationListParams,
  NotificationPreferences,
} from '@/services/api/notifications.api';

// ── Lightweight helpers used by shared hooks/components ──────────────────────
import { notificationsApi } from '@/services/api/notifications.api';

/**
 * Fetch the current unread notification count.
 *
 * Used by `useNotificationCount` (polled every 60 s) and patched
 * directly by the WebSocket NOTIFICATION_NEW event handler to keep
 * the badge in sync without a round-trip.
 *
 * @returns Unread notification count as a plain number.
 *
 * @example
 * const count = await getNotificationCount();
 */
export const getNotificationCount = async (): Promise<number> => {
  const { count } = await notificationsApi.getUnreadCount();
  return count;
};

/**
 * Mark a single notification as read.
 * Re-exported for convenience so components can call it without
 * reaching into the services layer.
 *
 * @param id - Notification ID.
 */
export const markAsRead = (id: string) => notificationsApi.markAsRead(id);

/**
 * Mark every unread notification as read in one call.
 * Typically called when the user opens the notification panel.
 */
export const markAllAsRead = () => notificationsApi.markAllAsRead();

/**
 * Delete a single notification.
 *
 * @param id - Notification ID to remove.
 */
export const deleteNotification = (id: string) => notificationsApi.delete(id);