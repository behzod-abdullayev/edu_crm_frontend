'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import * as Popover from '@radix-ui/react-popover';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { cn } from '@/shared/utils/cn';
import { queryKeys } from '@/services/query/keys.factory';
import { SocketEvent, type NotificationNewPayload } from '@/services/websocket/socket.events';
import { socketClient } from '@/services/websocket/socket.client';
import {
  useUnreadNotificationCount,
  useNotificationList,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/services/query/notifications.queries';
import type { Notification } from '@/services/api/notifications.api';
import type { PaginatedResponse } from '@/services/api/students.api';

// ─── Notification type → icon/color mapping ───────────────────────────────────

const _NOTIFICATION_COLOR: Record<string, string> = {
  payment_received: 'text-[var(--success-solid)]',
  payment_overdue: 'text-[var(--error-solid)]',
  homework_graded: 'text-[var(--info-solid)]',
  homework_due: 'text-[var(--warning-solid)]',
  attendance_marked: 'text-[var(--success-solid)]',
  schedule_updated: 'text-[var(--info-solid)]',
  exam_started: 'text-[var(--warning-solid)]',
  certificate_issued: 'text-[var(--success-solid)]',
  broadcast: 'text-[var(--brand-primary)]',
  system: 'text-[var(--text-muted)]',
};

const NOTIFICATION_DOT: Record<string, string> = {
  payment_received: 'bg-[var(--success-solid)]',
  payment_overdue: 'bg-[var(--error-solid)]',
  homework_graded: 'bg-[var(--info-solid)]',
  homework_due: 'bg-[var(--warning-solid)]',
  attendance_marked: 'bg-[var(--success-solid)]',
  schedule_updated: 'bg-[var(--info-solid)]',
  exam_started: 'bg-[var(--warning-solid)]',
  certificate_issued: 'bg-[var(--success-solid)]',
  broadcast: 'bg-[var(--brand-primary)]',
  system: 'bg-[var(--text-muted)]',
};

// ─── Single notification row ──────────────────────────────────────────────────

interface NotificationRowProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationRow({ notification, onRead, onDelete }: NotificationRowProps) {
  const dotClass = NOTIFICATION_DOT[notification.type] ?? 'bg-[var(--brand-primary)]';
  const isUnread = !notification.isRead;

  const handleRead = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isUnread) onRead(notification.id);
    },
    [isUnread, notification.id, onRead],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(notification.id);
    },
    [notification.id, onDelete],
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.18 }}
      onClick={handleRead}
      role="listitem"
      aria-label={notification.title}
      className={cn(
        'group relative flex gap-3 px-4 py-3 cursor-pointer transition-colors duration-150',
        isUnread
          ? 'bg-[var(--info-bg)] hover:bg-[var(--bg-surface-hover)]'
          : 'hover:bg-[var(--bg-surface-hover)]',
      )}
    >
      {/* Unread dot */}
      <span
        aria-hidden="true"
        className={cn(
          'mt-1.5 h-2 w-2 shrink-0 rounded-full transition-opacity duration-200',
          dotClass,
          isUnread ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm leading-snug truncate',
            isUnread
              ? 'font-semibold text-[var(--text-primary)]'
              : 'font-medium text-[var(--text-secondary)]',
          )}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
          {notification.body}
        </p>
        <time
          className="mt-1 text-[10px] text-[var(--text-muted)]"
          dateTime={notification.createdAt}
        >
          {new Date(notification.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
      </div>

      {/* Action buttons — shown on hover */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {isUnread && (
          <button
            type="button"
            onClick={handleRead}
            aria-label="Mark as read"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] transition-colors"
          >
            <Check size={13} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Delete notification"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--error-bg)] hover:text-[var(--error-solid)] focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] transition-colors"
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationBell() {
  const t = useTranslations('notifications');
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // ── Unread count from React Query (backed by /notifications/unread-count) ──
  const { data: countData } = useUnreadNotificationCount();
  const count = countData?.count ?? 0;

  // ── Notification list (fetched only when popover is open) ─────────────────
  const { data: listData, isLoading: listLoading } = useNotificationList(
    { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' },
  );
  const notifications = listData?.data ?? [];

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();
  const { mutate: deleteNotif } = useDeleteNotification();

  // ── Badge bounce animation on new notification ────────────────────────────
  const [bouncing, setBouncing] = useState(false);
  const prevCountRef = useRef(count);

  useEffect(() => {
    if (count > prevCountRef.current) {
      setBouncing(true);
      const timer = setTimeout(() => setBouncing(false), 700);
      prevCountRef.current = count;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = count;
  }, [count]);

  // ── WebSocket cache patching ──────────────────────────────────────────────
  // Direct NOTIFICATION_NEW → prepend to list cache + increment count badge.
  // This is the "live" layer; React Query is the source of truth on mount.
  // Deduplication is handled by id comparison before prepending.
  useEffect(() => {
    const recentIds = new Set<string>();

    const handler = (payload: NotificationNewPayload) => {
      // Deduplication: ignore duplicate events within 5 s
      if (recentIds.has(payload.id)) return;
      recentIds.add(payload.id);
      setTimeout(() => recentIds.delete(payload.id), 5_000);

      const newNotification: Notification = {
        id: payload.id,
        type: payload.type as Notification['type'],
        title: payload.title,
        body: payload.body,
        isRead: false,
        createdAt: payload.createdAt,
        ...(payload.metadata !== undefined ? { metadata: payload.metadata } : {}),
      };

      // Patch every paginated notification list cache page
      queryClient.setQueriesData<PaginatedResponse<Notification>>(
        { queryKey: queryKeys.notifications.lists() },
        (old) => {
          if (!old) return old;
          // Deduplicate by id before prepending
          const withoutDup = old.data.filter((n) => n.id !== payload.id);
          return {
            ...old,
            data: [newNotification, ...withoutDup],
            total: old.total + 1,
          };
        },
      );

      // Increment unread count badge immediately — no round-trip needed
      queryClient.setQueryData<{ count: number }>(
        queryKeys.notifications.unreadCount(),
        (old) => ({ count: (old?.count ?? 0) + 1 }),
      );
    };

    socketClient.on(SocketEvent.NOTIFICATION_NEW, handler);
    return () => {
      socketClient.off(SocketEvent.NOTIFICATION_NEW, handler);
    };
  }, [queryClient]);

  // ── Mark all read when popover opens and there are unreads ────────────────
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
    },
    [],
  );

  const handleMarkAllRead = useCallback(() => {
    markAllRead();
  }, [markAllRead]);

  const handleMarkRead = useCallback(
    (id: string) => {
      markRead(id);
    },
    [markRead],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteNotif(id);
    },
    [deleteNotif],
  );

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <motion.button
          whileTap={{ scale: 0.93 }}
          aria-label={
            count > 0
              ? t('bellWithCount', { count })
              : t('bell')
          }
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            'relative flex h-9 w-9 items-center justify-center rounded-lg',
            'text-[var(--text-secondary)] transition-colors duration-150',
            'hover:bg-[var(--bg-surface-hover)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1',
            open && 'bg-[var(--bg-surface-hover)]',
          )}
        >
          <Bell size={18} aria-hidden="true" />

          <AnimatePresence>
            {count > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{
                  scale: bouncing ? [1, 1.35, 1] : 1,
                  opacity: 1,
                }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{
                  duration: bouncing ? 0.45 : 0.2,
                  times: bouncing ? [0, 0.5, 1] : undefined,
                }}
                aria-hidden="true"
                className={cn(
                  'absolute right-1 top-1',
                  'flex min-w-[16px] h-4 items-center justify-center rounded-full',
                  'bg-[var(--error-solid)] px-1',
                  'text-[9px] font-bold leading-none text-white',
                )}
              >
                {count > 99 ? '99+' : count}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="end"
          avoidCollisions
          collisionPadding={8}
          asChild
        >
          <motion.div
            role="dialog"
            aria-label={t('title')}
            aria-modal="false"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'z-50 w-80 sm:w-96 overflow-hidden rounded-xl outline-none',
              'bg-[var(--bg-surface)] border border-[var(--border-default)]',
              'shadow-[var(--shadow-xl)]',
            )}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {t('title')}
                </h3>
                {count > 0 && (
                  <span className="rounded-full bg-[var(--error-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--error-text)]">
                    {count}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {count > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    type="button"
                    onClick={handleMarkAllRead}
                    aria-label={t('markAllRead')}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-2 py-1',
                      'text-xs font-medium text-[var(--brand-primary)]',
                      'hover:bg-[var(--bg-surface-hover)] transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]',
                    )}
                  >
                    <CheckCheck size={12} aria-hidden="true" />
                    {t('markAllRead')}
                  </motion.button>
                )}

                <Popover.Close asChild>
                  <button
                    aria-label={t('close')}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-md',
                      'text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]',
                      'hover:text-[var(--text-primary)] transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]',
                    )}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </Popover.Close>
              </div>
            </div>

            {/* ── Body ── */}
            <ScrollArea.Root className="h-[min(360px,60vh)]" type="auto">
              <ScrollArea.Viewport className="h-full w-full">
                {listLoading ? (
                  // Skeleton shimmer — matches real notification rows
                  <div
                    aria-busy="true"
                    aria-live="polite"
                    className="space-y-px px-1 py-1"
                  >
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex gap-3 rounded-lg px-3 py-3 animate-pulse"
                      >
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--bg-surface-hover)]" />
                        <div className="flex-1 space-y-2">
                          <div
                            className="h-3 rounded bg-[var(--bg-surface-hover)]"
                            style={{ width: `${60 + i * 8}%` }}
                          />
                          <div className="h-2.5 w-4/5 rounded bg-[var(--bg-surface-hover)]" />
                          <div className="h-2 w-16 rounded bg-[var(--bg-surface-hover)]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  // Empty state
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div
                      aria-hidden="true"
                      className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-surface-secondary)]"
                    >
                      <Bell size={22} className="text-[var(--text-muted)]" />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                      {t('empty')}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {t('emptyDescription')}
                    </p>
                  </div>
                ) : (
                  // Notification list
                  <div role="list" aria-label={t('title')} className="divide-y divide-[var(--border-default)]">
                    <AnimatePresence initial={false} mode="popLayout">
                      {notifications.map((n) => (
                        <NotificationRow
                          key={n.id}
                          notification={n}
                          onRead={handleMarkRead}
                          onDelete={handleDelete}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar
                orientation="vertical"
                className="flex w-1.5 touch-none select-none p-px transition-colors"
              >
                <ScrollArea.Thumb className="relative flex-1 rounded-full bg-[var(--border-strong)]" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>

            {/* ── Footer ── */}
            {notifications.length > 0 && (
              <div className="border-t border-[var(--border-default)] px-4 py-2.5">
                <Link
                  href="/notifications"
                  className={cn(
                    'block w-full text-center text-xs font-medium',
                    'text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)]',
                    'transition-colors duration-150',
                    'focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] focus-visible:rounded-sm',
                  )}
                >
                  {t('viewAll')}
                </Link>
              </div>
            )}
          </motion.div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
