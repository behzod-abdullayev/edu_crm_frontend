'use client';

import { useEffect } from 'react';
import { useAdminSchedule } from '@/modules/admin/hooks/useAdmin';
import { ScheduleCalendar } from '@/modules/admin/components/ScheduleCalendar';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { can } from '@/lib/permissions';
import { ScheduleEventForm } from '@/modules/admin/types/admin.types';

export function AdminScheduleClient() {
  const { user } = useAuth();
  const { events, isLoading, deleteEvent, refresh } = useAdminSchedule();

  // WebSocket: subscribe to SCHEDULE_UPDATED
  useEffect(() => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000'}/schedule`
    );
    ws.onmessage = (msg) => {
      if ((JSON.parse(msg.data) as { type: string }).type === 'SCHEDULE_UPDATED') {
        void refresh();
      }
    };
    return () => ws.close();
  }, [refresh]);

  const handleCreate = async (form: ScheduleEventForm) => {
    await fetch('/api/admin/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    void refresh();
  };

  const handleEdit = async (id: string, form: ScheduleEventForm) => {
    await fetch(`/api/admin/schedule/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    void refresh();
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
        <p className="text-sm text-muted-foreground">Manage class schedules and room bookings</p>
      </div>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      ) : (
        <ScheduleCalendar
          events={events}
          canManage={can(user, 'schedule.manage')}
          onCreateEvent={handleCreate}
          onEditEvent={handleEdit}
          onDeleteEvent={deleteEvent}
        />
      )}
    </div>
  );
}
