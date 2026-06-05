'use client';

import { useState, useId, useCallback } from 'react';
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
} from 'date-fns';
import { cn } from '@shared/utils/cn';
import type { ScheduleEvent, ScheduleEventForm, RepeatRule } from '../types/admin.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduleCalendarProps {
  events: ScheduleEvent[];
  /** List of {id, name} for teacher picker */
  teachers: Array<{ id: string; name: string }>;
  /** List of {id, name} for course picker */
  courses: Array<{ id: string; name: string }>;
  onCreateEvent: (form: ScheduleEventForm) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 – 20:00

const REPEAT_LABELS: Record<RepeatRule, string> = {
  daily:    'Daily',
  weekly:   'Weekly',
  biweekly: 'Bi-weekly',
  monthly:  'Monthly',
};

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

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 16);
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

// ─── Empty form ───────────────────────────────────────────────────────────────

function emptyForm(): ScheduleEventForm {
  return {
    courseId:   '',
    teacherId:  '',
    room:       '',
    startTime:  todayIsoDate(),
    endTime:    todayIsoDate(),
    repeatRule: null,
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn('overflow-hidden rounded', className)}
      style={{
        background: `linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s linear infinite',
      }}
      aria-hidden="true"
    />
  );
}

// ─── Event Detail Popover ─────────────────────────────────────────────────────

interface EventDetailProps {
  event: ScheduleEvent;
  onClose: () => void;
  onDelete: (id: string) => void;
  isDeletingId: string | null;
}

function EventDetail({ event, onClose, onDelete, isDeletingId }: EventDetailProps) {
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
      aria-label={`Event: ${event.courseName}`}
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
              {REPEAT_LABELS[event.repeatRule]}
            </span>
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
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
          aria-label={`Delete event: ${event.courseName}`}
        >
          {isDeletingId === event.id ? 'Deleting…' : 'Delete'}
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
          aria-label="Close event details"
        >
          Close
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Create Event Form ────────────────────────────────────────────────────────

interface CreateFormProps {
  courses: Array<{ id: string; name: string }>;
  teachers: Array<{ id: string; name: string }>;
  onSubmit: (form: ScheduleEventForm) => Promise<void>;
  onCancel: () => void;
}

function CreateEventForm({ courses, teachers, onSubmit, onCancel }: CreateFormProps) {
  const [form, setForm] = useState<ScheduleEventForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ScheduleEventForm, string>>>({});
  const uid = useId();

  const setField = <K extends keyof ScheduleEventForm>(
    key: K,
    value: ScheduleEventForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof ScheduleEventForm, string>> = {};
    if (!form.courseId)   errs.courseId  = 'Course is required.';
    if (!form.teacherId)  errs.teacherId = 'Teacher is required.';
    if (!form.room.trim()) errs.room     = 'Room is required.';
    if (!form.startTime)  errs.startTime = 'Start time is required.';
    if (!form.endTime)    errs.endTime   = 'End time is required.';
    if (form.startTime && form.endTime && form.startTime >= form.endTime)
      errs.endTime = 'End time must be after start time.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onSubmit(form);
      onCancel();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
      role="region"
      aria-label="Create new schedule event"
    >
      <div className="border-b border-[var(--border-default)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          New Event
        </h3>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2">

        {/* Course */}
        <div className="space-y-1.5">
          <label
            htmlFor={`${uid}-course`}
            className="text-xs font-medium text-[var(--text-secondary)]"
          >
            Course <span aria-hidden="true" className="text-[var(--error-solid)]">*</span>
          </label>
          <select
            id={`${uid}-course`}
            value={form.courseId}
            onChange={(e) => setField('courseId', e.target.value)}
            aria-required="true"
            aria-invalid={!!errors.courseId}
            aria-describedby={errors.courseId ? `${uid}-course-err` : undefined}
            className={cn(
              'w-full min-h-[44px] rounded-lg border bg-[var(--bg-surface)] px-3 py-2',
              'text-sm text-[var(--text-primary)]',
              'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]',
              'transition-[border-color,box-shadow] duration-[var(--transition-fast)]',
              errors.courseId
                ? 'border-[var(--error-solid)]'
                : 'border-[var(--border-default)]',
            )}
          >
            <option value="">Select course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.courseId && (
            <p id={`${uid}-course-err`} role="alert" className="text-xs text-[var(--error-solid)]">
              {errors.courseId}
            </p>
          )}
        </div>

        {/* Teacher */}
        <div className="space-y-1.5">
          <label
            htmlFor={`${uid}-teacher`}
            className="text-xs font-medium text-[var(--text-secondary)]"
          >
            Teacher <span aria-hidden="true" className="text-[var(--error-solid)]">*</span>
          </label>
          <select
            id={`${uid}-teacher`}
            value={form.teacherId}
            onChange={(e) => setField('teacherId', e.target.value)}
            aria-required="true"
            aria-invalid={!!errors.teacherId}
            aria-describedby={errors.teacherId ? `${uid}-teacher-err` : undefined}
            className={cn(
              'w-full min-h-[44px] rounded-lg border bg-[var(--bg-surface)] px-3 py-2',
              'text-sm text-[var(--text-primary)]',
              'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]',
              'transition-[border-color,box-shadow] duration-[var(--transition-fast)]',
              errors.teacherId
                ? 'border-[var(--error-solid)]'
                : 'border-[var(--border-default)]',
            )}
          >
            <option value="">Select teacher…</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {errors.teacherId && (
            <p id={`${uid}-teacher-err`} role="alert" className="text-xs text-[var(--error-solid)]">
              {errors.teacherId}
            </p>
          )}
        </div>

        {/* Room */}
        <div className="space-y-1.5">
          <label
            htmlFor={`${uid}-room`}
            className="text-xs font-medium text-[var(--text-secondary)]"
          >
            Room <span aria-hidden="true" className="text-[var(--error-solid)]">*</span>
          </label>
          <input
            id={`${uid}-room`}
            type="text"
            value={form.room}
            onChange={(e) => setField('room', e.target.value)}
            placeholder="e.g. Room 101"
            aria-required="true"
            aria-invalid={!!errors.room}
            aria-describedby={errors.room ? `${uid}-room-err` : undefined}
            className={cn(
              'w-full min-h-[44px] rounded-lg border bg-[var(--bg-surface)] px-3 py-2',
              'text-sm text-[var(--text-primary)]',
              'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]',
              'transition-[border-color,box-shadow] duration-[var(--transition-fast)]',
              errors.room
                ? 'border-[var(--error-solid)]'
                : 'border-[var(--border-default)]',
            )}
          />
          {errors.room && (
            <p id={`${uid}-room-err`} role="alert" className="text-xs text-[var(--error-solid)]">
              {errors.room}
            </p>
          )}
        </div>

        {/* Repeat rule */}
        <div className="space-y-1.5">
          <label
            htmlFor={`${uid}-repeat`}
            className="text-xs font-medium text-[var(--text-secondary)]"
          >
            Repeat
          </label>
          <select
            id={`${uid}-repeat`}
            value={form.repeatRule ?? ''}
            onChange={(e) =>
              setField('repeatRule', (e.target.value as RepeatRule) || null)
            }
            className={cn(
              'w-full min-h-[44px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2',
              'text-sm text-[var(--text-primary)]',
              'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]',
              'transition-[border-color,box-shadow] duration-[var(--transition-fast)]',
            )}
          >
            <option value="">No repeat</option>
            {(Object.keys(REPEAT_LABELS) as RepeatRule[]).map((r) => (
              <option key={r} value={r}>{REPEAT_LABELS[r]}</option>
            ))}
          </select>
        </div>

        {/* Start time */}
        <div className="space-y-1.5">
          <label
            htmlFor={`${uid}-start`}
            className="text-xs font-medium text-[var(--text-secondary)]"
          >
            Start Date &amp; Time <span aria-hidden="true" className="text-[var(--error-solid)]">*</span>
          </label>
          <input
            id={`${uid}-start`}
            type="datetime-local"
            value={form.startTime}
            onChange={(e) => setField('startTime', e.target.value)}
            aria-required="true"
            aria-invalid={!!errors.startTime}
            aria-describedby={errors.startTime ? `${uid}-start-err` : undefined}
            className={cn(
              'w-full min-h-[44px] rounded-lg border bg-[var(--bg-surface)] px-3 py-2',
              'text-sm text-[var(--text-primary)]',
              'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]',
              'transition-[border-color,box-shadow] duration-[var(--transition-fast)]',
              errors.startTime
                ? 'border-[var(--error-solid)]'
                : 'border-[var(--border-default)]',
            )}
          />
          {errors.startTime && (
            <p id={`${uid}-start-err`} role="alert" className="text-xs text-[var(--error-solid)]">
              {errors.startTime}
            </p>
          )}
        </div>

        {/* End time */}
        <div className="space-y-1.5">
          <label
            htmlFor={`${uid}-end`}
            className="text-xs font-medium text-[var(--text-secondary)]"
          >
            End Date &amp; Time <span aria-hidden="true" className="text-[var(--error-solid)]">*</span>
          </label>
          <input
            id={`${uid}-end`}
            type="datetime-local"
            value={form.endTime}
            min={form.startTime}
            onChange={(e) => setField('endTime', e.target.value)}
            aria-required="true"
            aria-invalid={!!errors.endTime}
            aria-describedby={errors.endTime ? `${uid}-end-err` : undefined}
            className={cn(
              'w-full min-h-[44px] rounded-lg border bg-[var(--bg-surface)] px-3 py-2',
              'text-sm text-[var(--text-primary)]',
              'focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]',
              'transition-[border-color,box-shadow] duration-[var(--transition-fast)]',
              errors.endTime
                ? 'border-[var(--error-solid)]'
                : 'border-[var(--border-default)]',
            )}
          />
          {errors.endTime && (
            <p id={`${uid}-end-err`} role="alert" className="text-xs text-[var(--error-solid)]">
              {errors.endTime}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 border-t border-[var(--border-default)] px-4 py-3 sm:flex-row sm:justify-end">
        <motion.button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          whileTap={{ scale: 0.97 }}
          className={cn(
            'w-full sm:w-auto min-h-[44px] rounded-xl border border-[var(--border-default)] px-5 py-2.5',
            'text-sm font-medium text-[var(--text-secondary)]',
            'hover:bg-[var(--bg-surface-hover)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            'disabled:opacity-50 transition-colors',
          )}
        >
          Cancel
        </motion.button>
        <motion.button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSaving}
          whileTap={{ scale: 0.97 }}
          className={cn(
            'w-full sm:w-auto min-h-[44px] rounded-xl bg-[var(--brand-primary)] px-5 py-2.5',
            'text-sm font-semibold text-white',
            'hover:bg-[var(--brand-primary-hover)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'transition-[background-color,opacity]',
          )}
          aria-busy={isSaving}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
              Creating…
            </span>
          ) : (
            'Create Event'
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Mobile event card (agenda view) ─────────────────────────────────────────

interface MobileEventCardProps {
  event: ScheduleEvent;
  onDelete: (id: string) => void;
  isDeletingId: string | null;
  index: number;
}

function MobileEventCard({ event, onDelete, isDeletingId, index }: MobileEventCardProps) {
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
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {event.courseName}
        </p>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
          {event.teacherName} · {event.room}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-[var(--text-muted)]">
          {format(parseISO(event.startTime), 'HH:mm')} –{' '}
          {format(parseISO(event.endTime), 'HH:mm')}
          {event.repeatRule && ` · ${REPEAT_LABELS[event.repeatRule]}`}
        </p>
      </div>
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
        aria-label={`Delete event: ${event.courseName}`}
      >
        {isDeletingId === event.id ? '…' : '✕'}
      </motion.button>
    </motion.div>
  );
}

// ─── ScheduleCalendar ─────────────────────────────────────────────────────────

export function ScheduleCalendar({
  events,
  teachers,
  courses,
  onCreateEvent,
  onDeleteEvent,
}: ScheduleCalendarProps) {
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
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

  const weekTitle = `${format(weekDays[0]!, 'MMM d')} – ${format(weekDays[6]!, 'MMM d, yyyy')}`;

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
            aria-label="Previous week"
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
            aria-label="Next week"
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
            aria-label="Go to today"
          >
            Today
          </motion.button>
        </div>

        <motion.button
          type="button"
          onClick={() => { setShowCreateForm((v) => !v); setSelectedEvent(null); }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            'flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] px-4 py-2',
            'text-sm font-semibold text-white',
            'hover:bg-[var(--brand-primary-hover)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            'transition-colors',
          )}
          aria-expanded={showCreateForm}
          aria-label={showCreateForm ? 'Hide create event form' : 'Create new event'}
        >
          <span aria-hidden="true">{showCreateForm ? '✕' : '+'}</span>
          {showCreateForm ? 'Cancel' : 'New Event'}
        </motion.button>
      </div>

      {/* ── Create form ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateForm && (
          <CreateEventForm
            courses={courses}
            teachers={teachers}
            onSubmit={onCreateEvent}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Desktop week grid (lg+) ──────────────────────────────────────────── */}
      <div
        className="hidden overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] lg:block"
        role="grid"
        aria-label={`Week schedule: ${weekTitle}`}
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
                aria-label={format(day, 'EEEE, MMMM d')}
              >
                <p className="text-xs text-[var(--text-muted)]">
                  {format(day, 'EEE')}
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
                  {format(day, 'd')}
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
                  aria-label={`${format(day, 'EEE')} ${hourLabel(hour)}`}
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
                  aria-label={`${event.courseName} at ${format(parseISO(event.startTime), 'HH:mm')} in ${event.room}`}
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
                  onClose={() => setSelectedEvent(null)}
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
              No events this week
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {weekEvents.map((event, index) => (
              <MobileEventCard
                key={event.id}
                event={event}
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
