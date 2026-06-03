'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketClient } from './socket.client';
import {
  SocketEvent,
  type SocketEventPayloadMap,
  type NotificationNewPayload,
  type ChatMessagePayload,
} from './socket.events';
import { queryKeys } from '@/services/query/keys.factory';
import type { PaginatedResponse } from '@/services/api/students.api';
import type { Notification } from '@/services/api/notifications.api';
import { useUIStore } from '@/store/ui.store';
import type { ChatMessage } from '@/modules/teachers/types/teacher.types';

// ─── Generic typed event subscription hook ───────────────────────────────────

/**
 * Subscribe to a single socket event for the lifetime of the component.
 * Automatically unsubscribes on unmount.
 *
 * @param event  - SocketEvent enum value
 * @param handler - Typed payload handler
 * @param enabled - When false the subscription is skipped (default: true)
 */
export function useSocketEvent<E extends SocketEvent>(
  event: E,
  handler: (data: SocketEventPayloadMap[E]) => void,
  enabled = true,
): void {
  // Keep a stable ref so that changes to handler don't trigger re-subscribe
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    const stableHandler = (data: SocketEventPayloadMap[E]) => {
      handlerRef.current(data);
    };

    socketClient.on(event, stableHandler);
    return () => {
      socketClient.off(event, stableHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, enabled]);
}

// ─── Global cache-patching handlers ──────────────────────────────────────────

/**
 * Mounts all global WebSocket → React Query cache handlers.
 * Must be rendered inside <QueryProvider> and after auth is resolved.
 * Mount exactly once at the SocketProvider level.
 */
export function useGlobalSocketHandlers(): void {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  // ── NOTIFICATION_NEW ─────────────────────────────────────────────────────
  // Prepend to every notification list cache + increment unread count.
  useSocketEvent(SocketEvent.NOTIFICATION_NEW, (payload: NotificationNewPayload) => {
    const newNotification: Notification = {
      id: payload.id,
      type: payload.type as Notification['type'],
      title: payload.title,
      body: payload.body,
      isRead: false,
      createdAt: payload.createdAt,
      // exactOptionalPropertyTypes: only spread when defined
      ...(payload.metadata !== undefined ? { metadata: payload.metadata } : {}),
    };

    // Patch all paginated notification list caches
    queryClient.setQueriesData<PaginatedResponse<Notification>>(
      { queryKey: queryKeys.notifications.lists() },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          data: [newNotification, ...old.data],
          total: old.total + 1,
        };
      },
    );

    // Increment unread badge counter
    queryClient.setQueryData<{ count: number }>(
      queryKeys.notifications.unreadCount(),
      (old) => ({ count: (old?.count ?? 0) + 1 }),
    );
  });

  // ── NOTIFICATION_READ ────────────────────────────────────────────────────
  // Mark single notification read in cache (triggered by another session).
  useSocketEvent(SocketEvent.NOTIFICATION_READ, (payload) => {
    queryClient.setQueriesData<PaginatedResponse<Notification>>(
      { queryKey: queryKeys.notifications.lists() },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((n) =>
            n.id === payload.id ? { ...n, isRead: true, readAt: payload.readAt } : n,
          ),
        };
      },
    );

    // Safe decrement — floor at 0
    queryClient.setQueryData<{ count: number }>(
      queryKeys.notifications.unreadCount(),
      (old) => ({ count: Math.max(0, (old?.count ?? 1) - 1) }),
    );
  });

  // ── NOTIFICATION_ALL_READ ─────────────────────────────────────────────────
  // Mark all notifications read (triggered by another session / server broadcast).
  useSocketEvent(SocketEvent.NOTIFICATION_ALL_READ, (_payload) => {
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
  });

  // ── CHAT_MESSAGE ──────────────────────────────────────────────────────────
  // Append incoming message directly to the active conversation cache.
  // No network round-trip needed — data already arrives via WS.
  useSocketEvent(SocketEvent.CHAT_MESSAGE, (payload: ChatMessagePayload) => {
    const chatMessage: ChatMessage = {
      id: payload.id,
      senderId: payload.senderId,
      senderName: payload.senderName,
      content: payload.body,
      sentAt: payload.createdAt,
      ...(payload.senderAvatar !== undefined
        ? { senderAvatarUrl: payload.senderAvatar }
        : {}),
    };

    // Append to the specific conversation message cache
    queryClient.setQueryData<ChatMessage[]>(
      ['chat', 'messages', payload.roomId],
      (old) => {
        if (!old) return [chatMessage];
        // Deduplicate by id before appending
        const withoutDup = old.filter((m) => m.id !== payload.id);
        return [...withoutDup, chatMessage];
      },
    );
  });

  // ── HOMEWORK_GRADED ───────────────────────────────────────────────────────
  // Invalidate the student's grades so the updated score is fetched.
  useSocketEvent(SocketEvent.HOMEWORK_GRADED, (payload) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.students.grades(payload.studentId),
    });

    addToast({
      type: 'success',
      title: 'homework.gradedTitle',
      description: payload.homeworkId,
      duration: 5_000,
    });
  });

  // ── HOMEWORK_SUBMITTED ────────────────────────────────────────────────────
  // Invalidate homework submissions list so teacher sees new submission.
  useSocketEvent(SocketEvent.HOMEWORK_SUBMITTED, (payload) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.courses.submissions(payload.courseId, payload.homeworkId),
    });
  });

  // ── PAYMENT_RECEIVED ──────────────────────────────────────────────────────
  // Invalidate payments lists and summary after a new payment lands.
  useSocketEvent(SocketEvent.PAYMENT_RECEIVED, (_payload) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.summary() });
  });

  // ── PAYMENT_OVERDUE ───────────────────────────────────────────────────────
  // Invalidate debts cache and show a persistent warning toast.
  useSocketEvent(SocketEvent.PAYMENT_OVERDUE, (payload) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.debts() });

    addToast({
      type: 'warning',
      title: 'payment.overdueTitle',
      description: payload.studentName,
      duration: 0, // manual dismiss — important notice
    });
  });

  // ── ATTENDANCE_UPDATED ────────────────────────────────────────────────────
  // Invalidate the student's attendance records.
  useSocketEvent(SocketEvent.ATTENDANCE_UPDATED, (payload) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.students.attendance(payload.studentId),
    });
  });

  // ── SCHEDULE_UPDATED ──────────────────────────────────────────────────────
  // Invalidate affected course detail + show info toast.
  useSocketEvent(SocketEvent.SCHEDULE_UPDATED, (payload) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.courses.detail(payload.courseId),
    });

    addToast({
      type: 'info',
      title: 'schedule.updatedTitle',
      description: payload.courseName,
      duration: 5_000,
    });
  });

  // ── EXAM_STARTED ──────────────────────────────────────────────────────────
  // Show a persistent warning toast — exam requires immediate attention.
  useSocketEvent(SocketEvent.EXAM_STARTED, (payload) => {
    addToast({
      type: 'warning',
      title: 'exam.startedTitle',
      description: payload.title,
      duration: 0, // manual dismiss
    });
  });
}