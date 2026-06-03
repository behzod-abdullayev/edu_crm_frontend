'use client';

import { useState, useMemo } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { ScheduleEvent, ScheduleEventForm } from '../types/admin.types';

interface ScheduleCalendarProps {
  events: ScheduleEvent[];
  canManage: boolean;
  onCreateEvent: (form: ScheduleEventForm) => void;
  onEditEvent: (id: string, form: ScheduleEventForm) => void;
  onDeleteEvent: (id: string) => void;
}

type CalendarView = 'week' | 'month';

const HOUR_LABELS = Array.from({ length: 14 }, (_, i) => i + 7);

function detectConflict(events: ScheduleEvent[], target: ScheduleEvent): boolean {
  return events.some((e) => {
    if (e.id === target.id) return false;
    const sameTeacher = e.teacherId === target.teacherId;
    const sameRoom = e.room === target.room;
    if (!sameTeacher && !sameRoom) return false;
    const eStart = new Date(e.startTime).getTime();
    const eEnd = new Date(e.endTime).getTime();
    const tStart = new Date(target.startTime).getTime();
    const tEnd = new Date(target.endTime).getTime();
    return tStart < eEnd && tEnd > eStart;
  });
}

function EventCard({
  event,
  hasConflict,
  canManage,
  onEdit,
  onDelete,
}: {
  event: ScheduleEvent;
  hasConflict: boolean;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={[
        'group relative rounded-md px-2 py-1 text-xs',
        hasConflict
          ? 'border border-orange-400 bg-orange-50 text-orange-900 dark:bg-orange-950/40 dark:text-orange-300'
          : 'border border-primary/20 bg-primary/10 text-primary',
      ].join(' ')}
    >
      {hasConflict && (
        <span className="mr-1 text-orange-500" title="Scheduling conflict">
          ⚠
        </span>
      )}
      <span className="font-medium">{event.courseName}</span>
      <span className="ml-1 opacity-70">· {event.room}</span>
      {canManage && (
        <div className="absolute right-1 top-1 hidden gap-1 group-hover:flex">
          <button
            onClick={onEdit}
            className="rounded p-0.5 hover:bg-black/10"
            type="button"
            aria-label="Edit event"
          >
            ✎
          </button>
          <button
            onClick={onDelete}
            className="rounded p-0.5 hover:bg-black/10"
            type="button"
            aria-label="Delete event"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function DayEventList({
  day,
  events,
  canManage,
  allEvents,
  onEdit,
  onDelete,
}: {
  day: Date;
  events: ScheduleEvent[];
  canManage: boolean;
  allEvents: ScheduleEvent[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-1 p-2">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          hasConflict={detectConflict(allEvents, event)}
          canManage={canManage}
          onEdit={() => onEdit(event.id)}
          onDelete={() => onDelete(event.id)}
        />
      ))}
    </div>
  );
}

export function ScheduleCalendar({
  events,
  canManage,
  onCreateEvent,
  onEditEvent,
  onDeleteEvent,
}: ScheduleCalendarProps) {
  const [view, setView] = useState<CalendarView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = useMemo(() => {
    if (view === 'week') {
      return eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      });
    }
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    });
  }, [view, currentDate]);

  const navigate = (direction: 'prev' | 'next') => {
    if (view === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    }
  };

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(parseISO(e.startTime), day));

  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('prev')}
            className="rounded-lg border border-border p-2 hover:bg-muted"
            type="button"
            aria-label="Previous"
          >
            ←
          </button>
          <h3 className="min-w-48 text-center text-sm font-semibold text-foreground">
            {view === 'week'
              ? `${format(days[0] ?? new Date(), 'dd MMM')} – ${format(days[6] ?? new Date(), 'dd MMM yyyy')}`
              : format(currentDate, 'MMMM yyyy')}
          </h3>
          <button
            onClick={() => navigate('next')}
            className="rounded-lg border border-border p-2 hover:bg-muted"
            type="button"
            aria-label="Next"
          >
            →
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="rounded-lg border border-border px-3 py-2 text-xs hover:bg-muted"
            type="button"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <button
              onClick={() =>
                onCreateEvent({
                  courseId: '',
                  teacherId: '',
                  room: '',
                  startTime: new Date().toISOString(),
                  endTime: new Date().toISOString(),
                  repeatRule: null,
                })
              }
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              type="button"
            >
              + Add Event
            </button>
          )}
          <div className="flex rounded-lg border border-border">
            {(['week', 'month'] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={[
                  'px-3 py-2 text-xs font-medium capitalize transition-colors first:rounded-l-lg last:rounded-r-lg',
                  view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
                type="button"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop week grid */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-px rounded-xl border border-border bg-border overflow-hidden">
          {weekDayLabels.map((label) => (
            <div key={label} className="bg-muted/80 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
          ))}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className={[
                  'min-h-28 bg-card p-1',
                  isToday(day) && 'bg-primary/5',
                ].join(' ')}
              >
                <span
                  className={[
                    'mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                    isToday(day)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground',
                  ].join(' ')}
                >
                  {format(day, 'd')}
                </span>
                <DayEventList
                  day={day}
                  events={dayEvents}
                  canManage={canManage}
                  allEvents={events}
                  onEdit={(id) => {
                    const event = events.find((e) => e.id === id);
                    if (event) {
                      onEditEvent(id, {
                        courseId: event.courseId,
                        teacherId: event.teacherId,
                        room: event.room,
                        startTime: event.startTime,
                        endTime: event.endTime,
                        repeatRule: event.repeatRule,
                      });
                    }
                  }}
                  onDelete={onDeleteEvent}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile list view */}
      <div className="space-y-3 md:hidden">
        {days
          .filter((day) => getEventsForDay(day).length > 0)
          .map((day) => {
            const dayEvents = getEventsForDay(day);
            return (
              <div key={day.toISOString()} className="rounded-xl border border-border bg-card">
                <div
                  className={[
                    'rounded-t-xl border-b border-border px-4 py-2',
                    isToday(day) && 'bg-primary/10',
                  ].join(' ')}
                >
                  <span className="text-sm font-semibold text-foreground">
                    {isToday(day) ? 'Today — ' : ''}
                    {format(day, 'EEEE, dd MMM')}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {dayEvents.map((event) => (
                    <div key={event.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">{event.courseName}</p>
                        {detectConflict(events, event) && (
                          <span className="text-xs font-medium text-orange-600">
                            ⚠ Conflict
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(event.startTime), 'HH:mm')} –{' '}
                        {format(parseISO(event.endTime), 'HH:mm')} · {event.room} · {event.teacherName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        {days.every((day) => getEventsForDay(day).length === 0) && (
          <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            No events this {view}
          </div>
        )}
      </div>
    </div>
  );
}
