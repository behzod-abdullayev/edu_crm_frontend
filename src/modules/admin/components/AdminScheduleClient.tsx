'use client';

// src/modules/admin/components/AdminScheduleClient.tsx

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ScheduleCalendar } from './ScheduleCalendar';
import { AdminScheduleSkeleton } from './AdminScheduleSkeleton';
import { useAdminSchedule, useAdminCourses, useAdminTeachers } from '../hooks/useAdmin';
import { useToast } from '@shared/hooks/useToast';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import type { ScheduleEvent, ScheduleEventForm } from '../types/admin.types';

// ─── Inline event form (modal-like panel) ────────────────────────────────────

interface EventFormPanelProps {
  initial?: Partial<ScheduleEventForm>;
  editingId?: string;
  courses: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  onSubmit: (form: ScheduleEventForm, id?: string) => Promise<void>;
  onCancel: () => void;
}

function EventFormPanel({
  initial,
  editingId,
  courses,
  teachers,
  onSubmit,
  onCancel,
}: EventFormPanelProps) {
  const [courseId, setCourseId]     = useState(initial?.courseId ?? '');
  const [teacherId, setTeacherId]   = useState(initial?.teacherId ?? '');
  const [room, setRoom]             = useState(initial?.room ?? '');
  const [startTime, setStartTime]   = useState(
    initial?.startTime ? initial.startTime.slice(0, 16) : '',
  );
  const [endTime, setEndTime]       = useState(
    initial?.endTime ? initial.endTime.slice(0, 16) : '',
  );
  const [repeatRule, setRepeatRule] = useState<ScheduleEventForm['repeatRule']>(
    initial?.repeatRule ?? null,
  );
  const [isSaving, setIsSaving]     = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!courseId || !teacherId || !room || !startTime || !endTime) {
      setFormError('All fields except repeat rule are required');
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      setFormError('End time must be after start time');
      return;
    }
    setFormError(null);
    setIsSaving(true);
    try {
      await onSubmit(
        {
          courseId,
          teacherId,
          room,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          repeatRule,
        },
        editingId,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = `
    w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-secondary)]
    px-3 py-2.5 text-sm text-[var(--text-primary)]
    placeholder:text-[var(--text-muted)]
    focus:border-[var(--border-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]
    transition-colors min-h-[44px]
  `;

  const labelClass = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5"
      role="dialog"
      aria-modal="false"
      aria-label={editingId !== undefined ? 'Edit schedule event' : 'Create schedule event'}
    >
      <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
        {editingId !== undefined ? 'Edit Event' : 'Create Event'}
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Course */}
        <div>
          <label className={labelClass} htmlFor="event-course">
            Course <span className="text-[var(--error-solid)]" aria-hidden="true">*</span>
          </label>
          <select
            id="event-course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className={inputClass}
            aria-required="true"
          >
            <option value="">Select course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Teacher */}
        <div>
          <label className={labelClass} htmlFor="event-teacher">
            Teacher <span className="text-[var(--error-solid)]" aria-hidden="true">*</span>
          </label>
          <select
            id="event-teacher"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className={inputClass}
            aria-required="true"
          >
            <option value="">Select teacher…</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
            ))}
          </select>
        </div>

        {/* Room */}
        <div>
          <label className={labelClass} htmlFor="event-room">
            Room <span className="text-[var(--error-solid)]" aria-hidden="true">*</span>
          </label>
          <input
            id="event-room"
            type="text"
            placeholder="e.g. Room 101"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className={inputClass}
            aria-required="true"
          />
        </div>

        {/* Repeat rule */}
        <div>
          <label className={labelClass} htmlFor="event-repeat">
            Repeat
          </label>
          <select
            id="event-repeat"
            value={repeatRule ?? ''}
            onChange={(e) =>
              setRepeatRule(
                e.target.value === ''
                  ? null
                  : (e.target.value as ScheduleEventForm['repeatRule']),
              )
            }
            className={inputClass}
          >
            <option value="">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Start time */}
        <div>
          <label className={labelClass} htmlFor="event-start">
            Start Time <span className="text-[var(--error-solid)]" aria-hidden="true">*</span>
          </label>
          <input
            id="event-start"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={inputClass}
            aria-required="true"
          />
        </div>

        {/* End time */}
        <div>
          <label className={labelClass} htmlFor="event-end">
            End Time <span className="text-[var(--error-solid)]" aria-hidden="true">*</span>
          </label>
          <input
            id="event-end"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={inputClass}
            aria-required="true"
          />
        </div>
      </div>

      {/* Validation error */}
      <AnimatePresence>
        {formError !== null && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] px-3 py-2 text-sm text-[var(--error-text)]"
            role="alert"
            aria-live="assertive"
          >
            {formError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onCancel}
          disabled={isSaving}
          className="
            min-h-[44px] rounded-lg border border-[var(--border-default)]
            bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-medium
            text-[var(--text-primary)] transition-colors
            hover:bg-[var(--bg-surface-hover)] disabled:opacity-50
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2
          "
          type="button"
        >
          Cancel
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { void handleSubmit(); }}
          disabled={isSaving}
          className="
            min-h-[44px] rounded-lg bg-[var(--brand-primary)]
            px-5 py-2.5 text-sm font-medium text-[var(--text-on-brand)]
            transition-colors hover:bg-[var(--brand-primary-hover)]
            disabled:opacity-50
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2
          "
          type="button"
        >
          {isSaving
            ? editingId !== undefined
              ? 'Saving…'
              : 'Creating…'
            : editingId !== undefined
              ? 'Save Changes'
              : 'Create Event'}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Page transition ──────────────────────────────────────────────────────────

const pageVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ─── AdminScheduleClient ──────────────────────────────────────────────────────

export function AdminScheduleClient() {
  const t         = useTranslations('admin.schedule');
  const { toast } = useToast();
  const isMobile  = useIsMobile();

  const { events, isLoading: scheduleLoading, deleteEvent, refresh } = useAdminSchedule();
  const { courses, isLoading: coursesLoading }   = useAdminCourses();
  const { teachers, isLoading: teachersLoading } = useAdminTeachers();

  const isLoading = scheduleLoading || coursesLoading || teachersLoading;

  // ── Form state ────────────────────────────────────────────────────────────

  type FormMode = 'hidden' | 'create' | 'edit';

  const [formMode, setFormMode]         = useState<FormMode>('hidden');
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCreateEvent = useCallback(async (_form: ScheduleEventForm): Promise<void> => {
    setEditingEvent(null);
    setFormMode('create');
  }, []);

  const handleEditEvent = useCallback(
    (id: string, _form: ScheduleEventForm) => {
      const event = events.find((e) => e.id === id);
      if (event !== undefined) {
        setEditingEvent(event);
        setFormMode('edit');
      }
    },
    [events],
  );

  const handleDeleteEvent = useCallback(
    async (id: string) => {
      try {
        await deleteEvent(id);
        toast.success('Event deleted');
      } catch {
        toast.error('Failed to delete event');
      }
    },
    [deleteEvent, toast],
  );

  const handleFormSubmit = useCallback(
    async (form: ScheduleEventForm, editId?: string) => {
      try {
        if (editId !== undefined) {
          const res = await fetch(`/api/admin/schedule/${editId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          });
          if (!res.ok) throw new Error('Update failed');
          toast.success('Event updated');
        } else {
          const res = await fetch('/api/admin/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          });
          if (!res.ok) throw new Error('Creation failed');
          toast.success('Event created');
        }
        setFormMode('hidden');
        setEditingEvent(null);
        await refresh();
      } catch {
        toast.error(editId !== undefined ? 'Failed to update event' : 'Failed to create event');
        throw new Error('submit failed');
      }
    },
    [refresh, toast],
  );

  const handleFormCancel = useCallback(() => {
    setFormMode('hidden');
    setEditingEvent(null);
  }, []);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return <AdminScheduleSkeleton />;
  }

  // ── Course/teacher options for the form ───────────────────────────────────

  const courseOptions  = courses.map((c)       => ({ id: c.id, name: c.name }));
  const teacherOptions = teachers.map((teacher) => ({ id: teacher.id, name: teacher.name }));

  // ── Build optional props for EventFormPanel (fixes exactOptionalPropertyTypes) ──

  const editFormProps =
    formMode === 'edit' && editingEvent !== null
      ? {
          initial: {
            courseId:   editingEvent.courseId,
            teacherId:  editingEvent.teacherId,
            room:       editingEvent.room,
            startTime:  editingEvent.startTime,
            endTime:    editingEvent.endTime,
            repeatRule: editingEvent.repeatRule,
          },
          editingId: editingEvent.id,
        }
      : {};

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            Manage class schedules, rooms, and teacher assignments
          </p>
        </div>

        <motion.button
          whileHover={{ y: -1, boxShadow: 'var(--shadow-md)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setFormMode('create')}
          className="
            flex min-h-[44px] items-center gap-2 rounded-lg
            bg-[var(--brand-primary)] px-4 py-2.5
            text-sm font-medium text-[var(--text-on-brand)]
            hover:bg-[var(--brand-primary-hover)] transition-colors
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2
          "
          type="button"
          aria-label="Add new schedule event"
        >
          <span aria-hidden="true">+</span>
          {!isMobile && <span>{t('add')}</span>}
        </motion.button>
      </div>

      {/* ── Event form panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {formMode !== 'hidden' && (
          <EventFormPanel
            key={formMode === 'edit' ? `edit-${editingEvent?.id ?? ''}` : 'create'}
            {...editFormProps}
            courses={courseOptions}
            teachers={teacherOptions}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}
      </AnimatePresence>

      {/* ── Calendar ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5"
      >
        <ScheduleCalendar
          events={events}
          teachers={teacherOptions}
          courses={courseOptions}
          onCreateEvent={handleCreateEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      </motion.div>
    </motion.div>
  );
}