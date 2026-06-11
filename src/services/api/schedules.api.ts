import { httpClient } from './axios.instance';
import type { ScheduleEvent, ScheduleEventForm } from '@/modules/admin/types/admin.types';

export interface ScheduleCalendarParams {
  from: string;
  to: string;
  groupId?: string;
  teacherId?: string;
}

/** Shape returned by the backend for a single schedule entry (entity + relations). */
interface RawSchedule {
  id: string;
  groupId?: string | null;
  teacherId?: string | null;
  courseId?: string | null;
  startTime: string;
  endTime: string;
  room?: string | null;
  isRecurring: boolean;
  specificDate?: string | null;
  isCancelled: boolean;
  course?: { title?: string } | null;
  teacher?: { user?: { firstName?: string; lastName?: string } | null } | null;
}

/** Maps a raw backend schedule entry to the frontend `ScheduleEvent` view model. */
function mapSchedule(raw: RawSchedule): ScheduleEvent {
  const date = raw.specificDate ?? new Date().toISOString().slice(0, 10);
  const datePart = date.slice(0, 10);
  const teacherName = raw.teacher?.user
    ? `${raw.teacher.user.firstName ?? ''} ${raw.teacher.user.lastName ?? ''}`.trim()
    : '';

  return {
    id: raw.id,
    courseId: raw.courseId ?? '',
    courseName: raw.course?.title ?? '',
    teacherId: raw.teacherId ?? '',
    teacherName,
    room: raw.room ?? '',
    startTime: `${datePart}T${raw.startTime.slice(0, 5)}:00`,
    endTime: `${datePart}T${raw.endTime.slice(0, 5)}:00`,
    repeatRule: raw.isRecurring ? 'weekly' : null,
  };
}

/** Maps a frontend event form to the backend create/update schedule payload. */
function mapScheduleForm(form: ScheduleEventForm): Record<string, unknown> {
  const start = new Date(form.startTime);
  const end = new Date(form.endTime);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    teacherId: form.teacherId,
    courseId: form.courseId,
    classroom: form.room,
    date: form.startTime.slice(0, 10),
    startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
    isRecurring: form.repeatRule !== null,
  };
}

export const schedulesApi = {
  getCalendar: async (params: ScheduleCalendarParams): Promise<ScheduleEvent[]> => {
    const { data } = await httpClient.get<RawSchedule[]>('/schedules/calendar', { params });
    return data.map(mapSchedule);
  },

  create: async (form: ScheduleEventForm): Promise<ScheduleEvent> => {
    const { data } = await httpClient.post<RawSchedule>('/schedules', mapScheduleForm(form));
    return mapSchedule(data);
  },

  update: async (id: string, form: ScheduleEventForm): Promise<ScheduleEvent> => {
    const { data } = await httpClient.patch<RawSchedule>(`/schedules/${id}`, mapScheduleForm(form));
    return mapSchedule(data);
  },

  remove: async (id: string): Promise<void> => {
    await httpClient.delete(`/schedules/${id}`);
  },
};
