import { httpClient } from './axios.instance';
import type { PaginatedResponse, PaginationParams } from './students.api';

export type NotificationType =
  | 'payment_received'
  | 'payment_overdue'
  | 'homework_graded'
  | 'homework_due'
  | 'attendance_marked'
  | 'schedule_updated'
  | 'exam_started'
  | 'certificate_issued'
  | 'broadcast'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string;
}

export interface NotificationListParams extends PaginationParams {
  isRead?: boolean;
  type?: NotificationType;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  types: Partial<Record<NotificationType, boolean>>;
}

export const notificationsApi = {
  getList: async (
    params: NotificationListParams,
  ): Promise<PaginatedResponse<Notification>> => {
    const { data } = await httpClient.get<PaginatedResponse<Notification>>(
      '/notifications',
      { params },
    );
    return data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const { data } = await httpClient.get<{ count: number }>(
      '/notifications/unread-count',
    );
    return data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const { data } = await httpClient.post<Notification>(
      `/notifications/${id}/read`,
    );
    return data;
  },

  markAllAsRead: async (): Promise<void> => {
    await httpClient.post('/notifications/read-all');
  },

  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/notifications/${id}`);
  },

  deleteAll: async (): Promise<void> => {
    await httpClient.delete('/notifications');
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    const { data } = await httpClient.get<NotificationPreferences>(
      '/notifications/preferences',
    );
    return data;
  },

  updatePreferences: async (
    dto: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> => {
    const { data } = await httpClient.patch<NotificationPreferences>(
      '/notifications/preferences',
      dto,
    );
    return data;
  },

  registerPushToken: async (token: string, platform: 'web' | 'ios' | 'android'): Promise<void> => {
    await httpClient.post('/notifications/push-token', { token, platform });
  },
};
