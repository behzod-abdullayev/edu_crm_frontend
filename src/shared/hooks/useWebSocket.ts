'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketClient } from '@/services/websocket/socket.client';
import {
  SocketEvent,
  type SocketEventPayloadMap,
  type NotificationNewPayload,
  type ChatMessagePayload,
} from '@/services/websocket/socket.events';
import { queryKeys } from '@/services/query/keys.factory';
import type { PaginatedResponse } from '@/services/api/students.api';
import type { Notification } from '@/services/api/notifications.api';
import { useUIStore } from '@/store/ui.store';
import type { ChatMessage } from '@/modules/teachers/types/teacher.types';

// ─── useSocketEvent ───────────────────────────────────────────────────────────

/**
 * Subscribe to a single typed socket event for the lifetime of the component.
 *
 * - Uses a stable `handlerRef` so that inline arrow functions passed as
 *   `handler` never cause spurious re-subscriptions.
 * - Automatically unsubscribes on unmount.
 *
 * @param event   - SocketEvent enum value to subscribe to.
 * @param handler - Typed payload handler. May be an inline function — it will
 *                  always see the latest closure via the ref.
 * @param enabled - When `false` the subscription is skipped entirely.
 *                  Useful for conditional subscriptions. Defaults to `true`.
 *
 * @example
 * useSocketEvent(SocketEvent.NOTIFICATION_NEW, (payload) => {
 *   console.log('New notification:', payload.title);
 * });
 */
export function useSocketEvent<E extends SocketEvent>(
  event: E,
  handler: (data: SocketEventPayloadMap[E]) => void,
  enabled = true,
): void {
  // Store latest handler in a ref to avoid re-subscribing on every render.
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    // Stable wrapper — identity never changes across renders.
    const stableHandler = (data: SocketEventPayloadMap[E]) => {
      handlerRef.current(data);
    };

    socketClient.on(event, stableHandler);

    return () => {
      socketClient.off(event, stableHandler);
    };
    // `event` and `enabled` are the only values that should trigger
    // a re-subscription. The handler is kept stable via the ref above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, enabled]);
}

// ─── useGlobalSocketHandlers ──────────────────────────────────────────────────

/**
 * Mounts all global WebSocket → React Query cache-patching handlers.
 *
 * Must be rendered:
 *  - Inside `<QueryProvider>` (needs `useQueryClient`)
 *  - After auth is resolved (needs `useAuthStore`)
 *  - Exactly **once** per app — mount at the `<SocketProvider>` level.
 *
 * Each handler follows the strategy from the prompt:
 *  - Direct cache patch for real-time data (no refetch): NOTIFICATION_NEW, CHAT_MESSAGE
 *  - Targeted invalidation for data that needs server confirmation: HOMEWORK_GRADED etc.
 *  - Toast notification for user-visible events.
 */
export function useGlobalSocketHandlers(): void {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  // ── NOTIFICATION_NEW ───────────────────────────────────────────────────────
  // Prepend new notification to every paginated list cache + increment badge.
  useSocketEvent(SocketEvent.NOTIFICATION_NEW, (payload: NotificationNewPayload) => {
    const newNotification: Notification = {
      id: payload.id,
      type: payload.type as Notification['type'],
      title: payload.title,
      body: payload.body,
      isRead: false,
      createdAt: payload.createdAt,
      // exactOptionalPropertyTypes: conditionally spread optional field
      ...(payload.metadata !== undefined ? { metadata: payload.metadata } : {}),
    };

    // Patch all paginated notification list caches.
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

    // Increment unread badge counter directly — no refetch needed.
    queryClient.setQueryData<{ count: number }>(
      queryKeys.notifications.unreadCount(),
      (old) => ({ count: (old?.count ?? 0) + 1 }),
    );
  });

  // ── NOTIFICATION_READ ──────────────────────────────────────────────────────
  // Mark a single notification as read (triggered by another browser session).
  useSocketEvent(SocketEvent.NOTIFICATION_READ, (payload) => {
    queryClient.setQueriesData<PaginatedResponse<Notification>>(
      { queryKey: queryKeys.notifications.lists() },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((n) =>
            n.id === payload.id
              ? { ...n, isRead: true, readAt: payload.readAt }
              : n,
          ),
        };
      },
    );

    // Decrement badge — floor at 0 to prevent negative counts.
    queryClient.setQueryData<{ count: number }>(
      queryKeys.notifications.unreadCount(),
      (old) => ({ count: Math.max(0, (old?.count ?? 1) - 1) }),
    );
  });

  // ── NOTIFICATION_ALL_READ ──────────────────────────────────────────────────
  // Mark every notification as read (server broadcast after "mark all read").
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

  // ── CHAT_MESSAGE ───────────────────────────────────────────────────────────
  // Append incoming message directly to the active conversation cache.
  // No network round-trip — data already arrives via WebSocket.
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

    // Append to the specific conversation message cache, deduplicating by id.
    queryClient.setQueryData<ChatMessage[]>(
      ['chat', 'messages', payload.roomId],
      (old) => {
        if (!old) return [chatMessage];
        const withoutDup = old.filter((m) => m.id !== chatMessage.id);
        return [...withoutDup, chatMessage];
      },
    );
  });

  // ── HOMEWORK_GRADED ────────────────────────────────────────────────────────
  // Invalidate the student's grades so the updated score is fetched fresh.
  useSocketEvent(SocketEvent.HOMEWORK_GRADED, (payload) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.students.grades(payload.studentId),
    });

    addToast({
      type: 'success',
      title: 'Homework graded',
      description: `Score: ${payload.grade}/${payload.maxScore}`,
      duration: 5_000,
    });
  });

  // ── HOMEWORK_SUBMITTED ─────────────────────────────────────────────────────
  // Invalidate homework submissions list so the teacher sees the new entry.
  useSocketEvent(SocketEvent.HOMEWORK_SUBMITTED, (payload) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.courses.submissions(payload.courseId, payload.homeworkId),
    });
  });

  // ── PAYMENT_RECEIVED ───────────────────────────────────────────────────────
  // Invalidate payments lists and summary after a new payment is recorded.
  useSocketEvent(SocketEvent.PAYMENT_RECEIVED, (_payload) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.summary() });
  });

  // ── PAYMENT_OVERDUE ────────────────────────────────────────────────────────
  // Invalidate debts cache and show a persistent warning toast.
  useSocketEvent(SocketEvent.PAYMENT_OVERDUE, (payload) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.debts() });

    addToast({
      type: 'warning',
      title: 'Payment overdue',
      description: payload.studentName,
      duration: 0, // Manual dismiss — this is an important financial notice.
    });
  });

  // ── ATTENDANCE_UPDATED ─────────────────────────────────────────────────────
  // Invalidate the affected student's attendance records.
  useSocketEvent(SocketEvent.ATTENDANCE_UPDATED, (payload) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.students.attendance(payload.studentId),
    });
  });

  // ── SCHEDULE_UPDATED ──────────────────────────────────────────────────────
  // Invalidate affected course detail and show an info toast.
  useSocketEvent(SocketEvent.SCHEDULE_UPDATED, (payload) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.courses.detail(payload.courseId),
    });

    addToast({
      type: 'info',
      title: 'Schedule updated',
      description: payload.courseName,
      duration: 5_000,
    });
  });

  // ── EXAM_STARTED ───────────────────────────────────────────────────────────
  // Show a persistent warning toast — exam requires immediate student action.
  useSocketEvent(SocketEvent.EXAM_STARTED, (payload) => {
    addToast({
      type: 'warning',
      title: 'Exam started',
      description: `${payload.title} — ${payload.durationMinutes} min`,
      duration: 0, // Manual dismiss — student must act.
    });
  });
}
