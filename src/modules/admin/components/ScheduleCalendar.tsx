'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  addWeeks,
  subWeeks,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
  type Locale as DateFnsLocale,
} from 'date-fns';
import { cn } from '@shared/utils/cn';
import type { ScheduleEvent, RepeatRule } from '../types/admin.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduleCalendarStrings {
  previousWeek: string;
  nextWeek: string;
  today: string;
  goToToday: string;
  noEvents: string;
  weekSchedule: (range: string) => string;
  daily: string;
  weekly: string;
  biweekly: string;
  monthly: string;
  delete: string;
  deleting: string;
  close: string;
  edit: string;
  deleteEventAria: (name: string) => string;
  eventAria: (name: string) => string;
}

export interface ScheduleCalendarProps {
  events: ScheduleEvent[];
  s: ScheduleCalendarStrings;
  dateLocale: DateFnsLocale;
  onEditEvent: (event: ScheduleEvent) => void;
  onDeleteEvent: (id: string) => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 – 20:00

const EVENT_PALETTE = [
  '#4F46E5',
  '#06B6D4',
  '#8B5CF6',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function eventColor(event: ScheduleEvent): string {
  if (event.color) return event.color;
  // Deterministic color from courseId hash
  let hash = 0;
  for (let i = 0; i < event.courseId.length; i++) {
    hash = (hash * 31 + event.courseId.charCodeAt(i)) & 0xffff;
  }
  return EVENT_PALETTE[hash % EVENT_PALETTE.length]!;
}

function repeatLabel(rule: RepeatRule, s: ScheduleCalendarStrings): string {
  switch (rule) {
    case 'daily':    return s.daily;
    case 'weekly':   return s.weekly;
    case 'biweekly': return s.biweekly;
    case 'monthly':  return s.monthly;
    default:         return rule;
  }
}

function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function eventsOnDay(events: ScheduleEvent[], day: Date): ScheduleEvent[] {
  return events.filter((e) => {
    const start = parseISO(e.startTime);
    return isSameDay(start, day);
  });
}

function eventTopPercent(startTime: string): number {
  const d = parseISO(startTime);
  const minutesSince8 = (d.getHours() - 8) * 60 + d.getMinutes();
  return Math.max(0, (minutesSince8 / (13 * 60)) * 100);
}

function eventHeightPercent(startTime: string, endTime: string): number {
  const start = parseISO(startTime);
  const end   = parseISO(endTime);
  const diff  = (end.getTime() - start.getTime()) / 60_000; // minutes
  return Math.max(2, (diff / (13 * 60)) * 100);
}

// ─── Event Detail Popover ─────────────────────────────────────────────────────

interface EventDetailProps {
  event: ScheduleEvent;
  s: ScheduleCalendarStrings;
  onClose: () => void;
  onEdit: (event: ScheduleEvent) => void;
  onDelete: (id: string) => void;
  isDeletingId: string | null;
}

function EventDetail({ event, s, onClose, onEdit, onDelete, isDeletingId }: EventDetailProps) {
  const color = eventColor(event);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn(
        'absolute z-50 min-w-[240px] max-w-[300px] rounded-xl',
        'border border-[var(--border-default)] bg-[var(--bg-surface)]',
        'p-4 shadow-[var(--shadow-lg)]',
        'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
      )}
      role="dialog"
      aria-modal="true"
      aria-label={s.eventAria(event.courseName)}
    >
      {/* Color stripe */}
      <div
        className="mb-3 h-1 w-full rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      <p className="text-sm font-semibold text-[var(--text-primary)]">
        {event.courseName}
      </p>
      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
        {event.teacherName}
      </p>

      <div className="mt-3 space-y-1 text-xs text-[var(--text-muted)]">
        <p>
          🏫{' '}
          <span className="text-[var(--text-secondary)]">{event.room}</span>
        </p>
        <p>
          🕐{' '}
          <span className="text-[var(--text-secondary)]">
            {format(parseISO(event.startTime), 'HH:mm')} –{' '}
            {format(parseISO(event.endTime), 'HH:mm')}
          </span>
        </p>
        {event.repeatRule && (
          <p>
            🔁{' '}
            <span className="text-[var(--text-secondary)]">
              {repeatLabel(event.repeatRule, s)}
            </span>
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <motion.button
          type="button"
          onClick={() => onEdit(event)}
          whileTap={{ scale: 0.97 }}
          className={cn(
            'flex-1 min-h-[36px] rounded-lg border border-[var(--border-default)] px-3 py-1.5',
            'text-xs font-medium text-[var(--text-secondary)]',
            'hover:bg-[var(--bg-surface-hover)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            'transition-colors',
          )}
        >
          {s.edit}
        </motion.button>
        <motion.button
          type="button"
          onClick={() => onDelete(event.id)}
          disabled={isDeletingId === event.id}
          whileTap={{ scale: 0.97 }}
          className={cn(
            'flex-1 min-h-[36px] rounded-lg border border-[var(--error-border)] px-3 py-1.5',
            'text-xs font-medium text-[var(--error-solid)]',
            'hover:bg-[var(--error-bg)] disabled:opacity-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--error-solid)]',
            'transition-colors',
          )}
          aria-label={s.deleteEventAria(event.courseName)}
        >
          {isDeletingId === event.id ? s.deleting : s.delete}
        </motion.button>
        <motion.button
          type="button"
          onClick={onClose}
          whileTap={{ scale: 0.97 }}
          className={cn(
            'flex-1 min-h-[36px] rounded-lg border border-[var(--border-default)] px-3 py-1.5',
            'text-xs font-medium text-[var(--text-secondary)]',
            'hover:bg-[var(--bg-surface-hover)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            'transition-colors',
          )}
          aria-label={s.close}
        >
          {s.close}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Mobile event card (agenda view) ─────────────────────────────────────────

interface MobileEventCardProps {
  event: ScheduleEvent;
  s: ScheduleCalendarStrings;
  onEdit: (event: ScheduleEvent) => void;
  onDelete: (id: string) => void;
  isDeletingId: string | null;
  index: number;
}

function MobileEventCard({ event, s, onEdit, onDelete, isDeletingId, index }: MobileEventCardProps) {
  const color = eventColor(event);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.3) }}
      className="flex gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3"
    >
      {/* Color bar */}
      <div
        className="mt-0.5 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => onEdit(event)}
        className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded-lg"
        aria-label={s.eventAria(event.courseName)}
      >
        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {event.courseName}
        </p>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
          {event.teacherName} · {event.room}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-[var(--text-muted)]">
          {format(parseISO(event.startTime), 'HH:mm')} –{' '}
          {format(parseISO(event.endTime), 'HH:mm')}
          {event.repeatRule && ` · ${repeatLabel(event.repeatRule, s)}`}
        </p>
      </button>
      <motion.button
        type="button"
        onClick={() => onDelete(event.id)}
        disabled={isDeletingId === event.id}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'shrink-0 min-h-[44px] min-w-[44px] rounded-lg border border-[var(--error-border)]',
          'px-2 text-xs font-medium text-[var(--error-solid)]',
          'hover:bg-[var(--error-bg)] disabled:opacity-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--error-solid)]',
          'transition-colors',
        )}
        aria-label={s.deleteEventAria(event.courseName)}
      >
        {isDeletingId === event.id ? '…' : '✕'}
      </motion.button>
    </motion.div>
  );
}

// ─── ScheduleCalendar ─────────────────────────────────────────────────────────

export function ScheduleCalendar({
  events,
  s,
  dateLocale,
  onEditEvent,
  onDeleteEvent,
}: ScheduleCalendarProps) {
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const weekDays = getWeekDays(anchor);

  const handleDelete = useCallback(
    async (id: string) => {
      setIsDeletingId(id);
      try {
        await onDeleteEvent(id);
        if (selectedEvent?.id === id) setSelectedEvent(null);
      } finally {
        setIsDeletingId(null);
      }
    },
    [onDeleteEvent, selectedEvent],
  );

  const handleEdit = useCallback(
    (event: ScheduleEvent) => {
      setSelectedEvent(null);
      onEditEvent(event);
    },
    [onEditEvent],
  );

  const weekTitle = `${format(weekDays[0]!, 'MMM d', { locale: dateLocale })} – ${format(weekDays[6]!, 'MMM d, yyyy', { locale: dateLocale })}`;

  // ── Events for entire week (agenda fallback) ─────────────────────────────
  const weekEvents = events.filter((e) => {
    const start = parseISO(e.startTime);
    return isWithinInterval(start, {
      start: startOfDay(weekDays[0]!),
      end:   endOfDay(weekDays[6]!),
    });
  });

  return (
    <div className="space-y-4">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={() => setAnchor((d) => subWeeks(d, 1))}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)]',
              'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
              'transition-colors',
            )}
            aria-label={s.previousWeek}
          >
            ‹
          </motion.button>

          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {weekTitle}
          </span>

          <motion.button
            type="button"
            onClick={() => setAnchor((d) => addWeeks(d, 1))}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)]',
              'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
              'transition-colors',
            )}
            aria-label={s.nextWeek}
          >
            ›
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setAnchor(new Date())}
            whileTap={{ scale: 0.96 }}
            className={cn(
              'rounded-lg border border-[var(--border-default)] px-3 py-1.5',
              'text-xs font-medium text-[var(--text-secondary)]',
              'hover:bg-[var(--bg-surface-hover)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
              'transition-colors',
            )}
            aria-label={s.goToToday}
          >
            {s.today}
          </motion.button>
        </div>
      </div>

      {/* ── Desktop week grid (lg+) ──────────────────────────────────────────── */}
      <div
        className="hidden overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] lg:block"
        role="grid"
        aria-label={s.weekSchedule(weekTitle)}
      >
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--border-default)] bg-[var(--bg-surface-secondary)]">
          <div className="px-2 py-2" aria-hidden="true" />
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className="border-l border-[var(--border-default)] px-2 py-2 text-center"
                role="columnheader"
                aria-label={format(day, 'EEEE, MMMM d', { locale: dateLocale })}
              >
                <p className="text-xs text-[var(--text-muted)]">
                  {format(day, 'EEE', { locale: dateLocale })}
                </p>
                <p
                  className={cn(
                    'mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full',
                    'text-sm font-semibold',
                    isToday
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'text-[var(--text-primary)]',
                  )}
                  aria-current={isToday ? 'date' : undefined}
                >
                  {format(day, 'd', { locale: dateLocale })}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="relative grid grid-cols-[60px_repeat(7,1fr)] overflow-y-auto">
          {/* Hour rows */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="contents"
              role="row"
              aria-label={hourLabel(hour)}
            >
              <div className="border-b border-[var(--border-default)] px-2 py-1 text-right text-[10px] text-[var(--text-muted)]">
                {hourLabel(hour)}
              </div>
              {weekDays.map((day) => (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="relative border-b border-l border-[var(--border-default)] min-h-[48px]"
                  role="gridcell"
                  aria-label={`${format(day, 'EEE', { locale: dateLocale })} ${hourLabel(hour)}`}
                />
              ))}
            </div>
          ))}

          {/* Event pills — positioned absolutely over grid */}
          {weekDays.map((day, dayIndex) => {
            const dayEvents = eventsOnDay(events, day);
            return dayEvents.map((event) => {
              const top    = eventTopPercent(event.startTime);
              const height = eventHeightPercent(event.startTime, event.endTime);
              const color  = eventColor(event);

              // Column offset: 60px label col + dayIndex * (1/7 remaining)
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedEvent((prev) => prev?.id === event.id ? null : event)}
                  style={{
                    position: 'absolute',
                    top:    `${top}%`,
                    height: `${height}%`,
                    left:   `calc(60px + ${dayIndex} * (100% - 60px) / 7 + 4px)`,
                    width:  `calc((100% - 60px) / 7 - 8px)`,
                    backgroundColor: `${color}22`,
                    borderLeft: `3px solid ${color}`,
                    zIndex: 10,
                  }}
                  className={cn(
                    'overflow-hidden rounded-r-lg px-1.5 py-1 text-left',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                    'hover:brightness-95 transition-[filter]',
                  )}
                  aria-label={`${s.eventAria(event.courseName)} · ${format(parseISO(event.startTime), 'HH:mm')} · ${event.room}`}
                >
                  <p
                    className="truncate text-[10px] font-semibold"
                    style={{ color }}
                  >
                    {event.courseName}
                  </p>
                  <p className="truncate text-[10px] text-[var(--text-muted)]">
                    {format(parseISO(event.startTime), 'HH:mm')}
                  </p>
                </button>
              );
            });
          })}

          {/* Event detail popover */}
          <AnimatePresence>
            {selectedEvent && (
              <>
                {/* Backdrop */}
                <div
                  className="absolute inset-0 z-40"
                  onClick={() => setSelectedEvent(null)}
                  aria-hidden="true"
                />
                <EventDetail
                  event={selectedEvent}
                  s={s}
                  onClose={() => setSelectedEvent(null)}
                  onEdit={handleEdit}
                  onDelete={(id) => void handleDelete(id)}
                  isDeletingId={isDeletingId}
                />
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Mobile agenda list (< lg) ─────────────────────────────────────────── */}
      <div className="lg:hidden">
        {weekEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] py-12 text-center"
          >
            <span className="text-3xl" aria-hidden="true">📅</span>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {s.noEvents}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {weekEvents.map((event, index) => (
              <MobileEventCard
                key={event.id}
                event={event}
                s={s}
                onEdit={handleEdit}
                onDelete={(id) => void handleDelete(id)}
                isDeletingId={isDeletingId}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
