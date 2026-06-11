'use client';

// src/modules/admin/components/AdminScheduleClient.tsx

import { useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { uz, ru, enUS } from 'date-fns/locale';
import type { Locale as DateFnsLocale } from 'date-fns';
import { ScheduleCalendar } from './ScheduleCalendar';
import { AdminScheduleSkeleton } from './AdminScheduleSkeleton';
import { useAdminSchedule, useAdminCourses, useAdminTeachers } from '../hooks/useAdmin';
import { useToast } from '@shared/hooks/useToast';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import type { ScheduleEvent, ScheduleEventForm } from '../types/admin.types';

// ─── i18n ───────────────────────────────────────────────────────────────────

const I18N = {
  uz: {
    title: 'Jadval',
    subtitle: "Dars jadvali, xonalar va o'qituvchilarni boshqaring",
    add: 'Tadbir qoʻshish',
    addAria: 'Yangi dars tadbirini qoʻshish',
    previousWeek: 'Oldingi hafta',
    nextWeek: 'Keyingi hafta',
    today: 'Bugun',
    goToToday: 'Bugungi kunga oʻtish',
    noEvents: 'Bu hafta tadbirlar yoʻq',
    weekSchedule: (range: string) => `Hafta jadvali: ${range}`,
    createTitle: 'Tadbir yaratish',
    editTitle: 'Tadbirni tahrirlash',
    createAria: 'Dars tadbirini yaratish',
    editAria: 'Dars tadbirini tahrirlash',
    course: 'Kurs',
    teacher: "O'qituvchi",
    room: 'Xona',
    repeat: 'Takrorlanish',
    startTime: 'Boshlanish vaqti',
    endTime: 'Tugash vaqti',
    selectCourse: 'Kursni tanlang…',
    selectTeacher: "O'qituvchini tanlang…",
    roomPlaceholder: 'masalan, 101-xona',
    noRepeat: 'Takrorlanmaydi',
    daily: 'Har kuni',
    weekly: 'Har hafta',
    biweekly: 'Ikki haftada bir',
    monthly: 'Har oy',
    requiredError: "Takrorlanishdan tashqari barcha maydonlar to'ldirilishi shart",
    endTimeError: 'Tugash vaqti boshlanish vaqtidan keyin boʻlishi kerak',
    cancel: 'Bekor qilish',
    save: 'Saqlash',
    saving: 'Saqlanmoqda…',
    create: 'Yaratish',
    creating: 'Yaratilmoqda…',
    delete: "O'chirish",
    deleting: "O'chirilmoqda…",
    close: 'Yopish',
    edit: 'Tahrirlash',
    toastEventDeleted: "Tadbir o'chirildi",
    toastDeleteFailed: "Tadbirni o'chirib bo'lmadi",
    toastEventUpdated: 'Tadbir yangilandi',
    toastEventCreated: 'Tadbir yaratildi',
    toastUpdateFailed: "Tadbirni yangilab bo'lmadi",
    toastCreateFailed: "Tadbirni yaratib bo'lmadi",
    deleteEventAria: (name: string) => `Tadbirni o'chirish: ${name}`,
    eventAria: (name: string) => `Tadbir: ${name}`,
  },
  en: {
    title: 'Schedule',
    subtitle: 'Manage class schedules, rooms, and teacher assignments',
    add: 'Add Event',
    addAria: 'Add new schedule event',
    previousWeek: 'Previous week',
    nextWeek: 'Next week',
    today: 'Today',
    goToToday: 'Go to today',
    noEvents: 'No events this week',
    weekSchedule: (range: string) => `Week schedule: ${range}`,
    createTitle: 'Create Event',
    editTitle: 'Edit Event',
    createAria: 'Create schedule event',
    editAria: 'Edit schedule event',
    course: 'Course',
    teacher: 'Teacher',
    room: 'Room',
    repeat: 'Repeat',
    startTime: 'Start Time',
    endTime: 'End Time',
    selectCourse: 'Select course…',
    selectTeacher: 'Select teacher…',
    roomPlaceholder: 'e.g. Room 101',
    noRepeat: 'No repeat',
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    requiredError: 'All fields except repeat rule are required',
    endTimeError: 'End time must be after start time',
    cancel: 'Cancel',
    save: 'Save Changes',
    saving: 'Saving…',
    create: 'Create Event',
    creating: 'Creating…',
    delete: 'Delete',
    deleting: 'Deleting…',
    close: 'Close',
    edit: 'Edit',
    toastEventDeleted: 'Event deleted',
    toastDeleteFailed: 'Failed to delete event',
    toastEventUpdated: 'Event updated',
    toastEventCreated: 'Event created',
    toastUpdateFailed: 'Failed to update event',
    toastCreateFailed: 'Failed to create event',
    deleteEventAria: (name: string) => `Delete event: ${name}`,
    eventAria: (name: string) => `Event: ${name}`,
  },
  ru: {
    title: 'Расписание',
    subtitle: 'Управление расписанием занятий, аудиториями и преподавателями',
    add: 'Добавить событие',
    addAria: 'Добавить новое событие расписания',
    previousWeek: 'Предыдущая неделя',
    nextWeek: 'Следующая неделя',
    today: 'Сегодня',
    goToToday: 'Перейти к сегодня',
    noEvents: 'На этой неделе нет занятий',
    weekSchedule: (range: string) => `Расписание недели: ${range}`,
    createTitle: 'Создать событие',
    editTitle: 'Редактировать событие',
    createAria: 'Создать событие расписания',
    editAria: 'Редактировать событие расписания',
    course: 'Курс',
    teacher: 'Преподаватель',
    room: 'Аудитория',
    repeat: 'Повтор',
    startTime: 'Время начала',
    endTime: 'Время окончания',
    selectCourse: 'Выберите курс…',
    selectTeacher: 'Выберите преподавателя…',
    roomPlaceholder: 'например, Аудитория 101',
    noRepeat: 'Без повтора',
    daily: 'Ежедневно',
    weekly: 'Еженедельно',
    biweekly: 'Раз в две недели',
    monthly: 'Ежемесячно',
    requiredError: 'Все поля, кроме правила повтора, обязательны',
    endTimeError: 'Время окончания должно быть позже времени начала',
    cancel: 'Отмена',
    save: 'Сохранить изменения',
    saving: 'Сохранение…',
    create: 'Создать событие',
    creating: 'Создание…',
    delete: 'Удалить',
    deleting: 'Удаление…',
    close: 'Закрыть',
    edit: 'Изменить',
    toastEventDeleted: 'Событие удалено',
    toastDeleteFailed: 'Не удалось удалить событие',
    toastEventUpdated: 'Событие обновлено',
    toastEventCreated: 'Событие создано',
    toastUpdateFailed: 'Не удалось обновить событие',
    toastCreateFailed: 'Не удалось создать событие',
    deleteEventAria: (name: string) => `Удалить событие: ${name}`,
    eventAria: (name: string) => `Событие: ${name}`,
  },
} as const;

type Locale = keyof typeof I18N;
type I18NShape = (typeof I18N)[Locale];

const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = { uz, en: enUS, ru };

// ─── Inline event form (modal-like panel) ────────────────────────────────────

interface EventFormPanelProps {
  s: I18NShape;
  initial?: Partial<ScheduleEventForm>;
  editingId?: string;
  courses: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  onSubmit: (form: ScheduleEventForm, id?: string) => Promise<void>;
  onCancel: () => void;
}

function EventFormPanel({
  s,
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
      setFormError(s.requiredError);
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      setFormError(s.endTimeError);
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
      aria-label={editingId !== undefined ? s.editAria : s.createAria}
    >
      <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
        {editingId !== undefined ? s.editTitle : s.createTitle}
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Course */}
        <div>
          <label className={labelClass} htmlFor="event-course">
            {s.course} <span className="text-[var(--error-solid)]" aria-hidden="true">*</span>
          </label>
          <select
            id="event-course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className={inputClass}
            aria-required="true"
          >
            <option value="">{s.selectCourse}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Teacher */}
        <div>
          <label className={labelClass} htmlFor="event-teacher">
            {s.teacher} <span className="text-[var(--error-solid)]" aria-hidden="true">*</span>
          </label>
          <select
            id="event-teacher"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className={inputClass}
            aria-required="true"
          >
            <option value="">{s.selectTeacher}</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
            ))}
          </select>
        </div>

        {/* Room */}
        <div>
          <label className={labelClass} htmlFor="event-room">
            {s.room} <span className="text-[var(--error-solid)]" aria-hidden="true">*</span>
          </label>
          <input
            id="event-room"
            type="text"
            placeholder={s.roomPlaceholder}
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className={inputClass}
            aria-required="true"
          />
        </div>

        {/* Repeat rule */}
        <div>
          <label className={labelClass} htmlFor="event-repeat">
            {s.repeat}
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
            <option value="">{s.noRepeat}</option>
            <option value="daily">{s.daily}</option>
            <option value="weekly">{s.weekly}</option>
            <option value="biweekly">{s.biweekly}</option>
            <option value="monthly">{s.monthly}</option>
          </select>
        </div>

        {/* Start time */}
        <div>
          <label className={labelClass} htmlFor="event-start">
            {s.startTime} <span className="text-[var(--error-solid)]" aria-hidden="true">*</span>
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
            {s.endTime} <span className="text-[var(--error-solid)]" aria-hidden="true">*</span>
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
          {s.cancel}
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
              ? s.saving
              : s.creating
            : editingId !== undefined
              ? s.save
              : s.create}
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
  const rawLocale = useLocale();
  const locale: Locale = rawLocale in I18N ? (rawLocale as Locale) : 'en';
  const s = I18N[locale];
  const dateLocale = DATE_FNS_LOCALES[locale];

  const { toast } = useToast();
  const isMobile  = useIsMobile();

  const {
    events,
    isLoading: scheduleLoading,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useAdminSchedule();
  const { courses, isLoading: coursesLoading }   = useAdminCourses();
  const { teachers, isLoading: teachersLoading } = useAdminTeachers();

  const isLoading = scheduleLoading || coursesLoading || teachersLoading;

  // ── Form state ────────────────────────────────────────────────────────────

  type FormMode = 'hidden' | 'create' | 'edit';

  const [formMode, setFormMode]         = useState<FormMode>('hidden');
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleEditEvent = useCallback((event: ScheduleEvent) => {
    setEditingEvent(event);
    setFormMode('edit');
  }, []);

  const handleDeleteEvent = useCallback(
    async (id: string) => {
      try {
        await deleteEvent(id);
        toast.success(s.toastEventDeleted);
      } catch {
        toast.error(s.toastDeleteFailed);
      }
    },
    [deleteEvent, toast, s],
  );

  const handleFormSubmit = useCallback(
    async (form: ScheduleEventForm, editId?: string) => {
      try {
        if (editId !== undefined) {
          await updateEvent(editId, form);
          toast.success(s.toastEventUpdated);
        } else {
          await createEvent(form);
          toast.success(s.toastEventCreated);
        }
        setFormMode('hidden');
        setEditingEvent(null);
      } catch {
        toast.error(editId !== undefined ? s.toastUpdateFailed : s.toastCreateFailed);
        throw new Error('submit failed');
      }
    },
    [createEvent, updateEvent, toast, s],
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
            {s.title}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            {s.subtitle}
          </p>
        </div>

        <motion.button
          whileHover={{ y: -1, boxShadow: 'var(--shadow-md)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { setEditingEvent(null); setFormMode('create'); }}
          className="
            flex min-h-[44px] items-center gap-2 rounded-lg
            bg-[var(--brand-primary)] px-4 py-2.5
            text-sm font-medium text-[var(--text-on-brand)]
            hover:bg-[var(--brand-primary-hover)] transition-colors
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2
          "
          type="button"
          aria-label={s.addAria}
        >
          <span aria-hidden="true">+</span>
          {!isMobile && <span>{s.add}</span>}
        </motion.button>
      </div>

      {/* ── Event form panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {formMode !== 'hidden' && (
          <EventFormPanel
            key={formMode === 'edit' ? `edit-${editingEvent?.id ?? ''}` : 'create'}
            s={s}
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
          s={s}
          dateLocale={dateLocale}
          events={events}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      </motion.div>
    </motion.div>
  );
}
