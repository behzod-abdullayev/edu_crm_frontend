"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { httpClient } from "@/services/api/axios.instance";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { MobileBottomSheet } from "@shared/components/mobile/MobileBottomSheet";
import { cn } from "@shared/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduleEvent {
  id: string;
  courseName: string;
  teacherName: string;
  room: string;
  startTime: string;
  endTime: string;
  dayOfWeek?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM → 7 PM

function formatHour(h: number): string {
  if (h === 12) return "12 PM";
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
}

function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayShort(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── Event Detail (shared between mobile sheet and desktop tooltip) ────────────

function EventDetail({ event }: { event: ScheduleEvent }) {
  return (
    <div className="space-y-3 p-1">
      <h3 className="font-semibold text-base">{event.courseName}</h3>
      <div className="space-y-1.5 text-sm text-muted-foreground">
        <p>
          Teacher:{" "}
          <span className="text-foreground font-medium">{event.teacherName}</span>
        </p>
        <p>
          Room:{" "}
          <span className="text-foreground font-medium">{event.room}</span>
        </p>
        <p>
          Time:{" "}
          <span className="text-foreground font-medium">
            {formatTime(event.startTime)} – {formatTime(event.endTime)}
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ScheduleSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="h-8 w-32 rounded bg-muted animate-pulse" />
      <div className="h-96 rounded-xl bg-muted animate-pulse" />
    </div>
  );
}

// ─── Desktop Grid View ────────────────────────────────────────────────────────

function DesktopGrid({
  events,
  today,
  onSelectEvent,
}: {
  events: ScheduleEvent[];
  today: number;
  onSelectEvent: (ev: ScheduleEvent) => void;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-8 border-b border-border bg-muted/50">
        <div className="p-3 text-xs text-muted-foreground" />
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              "p-3 text-center text-xs font-semibold",
              i === today && "text-primary bg-primary/5",
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Hour rows */}
      <div className="divide-y divide-border">
        {HOURS.map((h) => (
          <div key={h} className="grid grid-cols-8 min-h-[48px]">
            {/* Hour label */}
            <div className="p-2 text-xs text-muted-foreground text-right pr-3 pt-1.5 border-r border-border">
              {formatHour(h)}
            </div>

            {/* Day cells */}
            {WEEKDAYS.map((_, day) => {
              const cellEvents = events.filter((e) => {
                const s = new Date(e.startTime);
                return s.getDay() === day && s.getHours() === h;
              });

              return (
                <div
                  key={day}
                  className={cn(
                    "relative border-r border-border last:border-r-0 p-1",
                    day === today && "bg-primary/[0.03]",
                  )}
                >
                  {cellEvents.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onSelectEvent(ev)}
                      className="w-full text-left rounded p-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium truncate"
                      title={ev.courseName}
                    >
                      {ev.courseName}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile List View ─────────────────────────────────────────────────────────

function MobileList({
  events,
  onSelectEvent,
}: {
  events: ScheduleEvent[];
  onSelectEvent: (ev: ScheduleEvent) => void;
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No upcoming classes.
      </p>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  return (
    <div className="space-y-3">
      {sorted.map((ev) => {
        const start = new Date(ev.startTime);
        const isPast = start < new Date();

        return (
          <button
            key={ev.id}
            type="button"
            onClick={() => onSelectEvent(ev)}
            className={cn(
              "w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors",
              isPast && "opacity-50",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm">{ev.courseName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ev.teacherName} · Room {ev.room}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium">{formatDayShort(ev.startTime)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(ev.startTime)}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StudentScheduleClient() {
  const { user } = useCurrentUser();
  const isMobile = useIsMobile();
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  const { data: events, isLoading } = useQuery<ScheduleEvent[]>({
    queryKey: ["students", user?.id, "schedule"],
    queryFn: async () => {
      const res = await httpClient.get<ScheduleEvent[]>(
        `/students/${user!.id}/schedule`,
      );
      return res.data;
    },
    enabled: !!user?.id,
  });

  const today = new Date().getDay();
  const safeEvents: ScheduleEvent[] = events ?? [];

  if (isLoading) {
    return <ScheduleSkeleton />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your weekly class timetable.
        </p>
      </div>

      {/* View */}
      {isMobile ? (
        <MobileList events={safeEvents} onSelectEvent={setSelectedEvent} />
      ) : (
        <DesktopGrid
          events={safeEvents}
          today={today}
          onSelectEvent={setSelectedEvent}
        />
      )}

      {/* Event detail bottom sheet (mobile) */}
      <MobileBottomSheet
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Class Details"
      >
        {selectedEvent && <EventDetail event={selectedEvent} />}
      </MobileBottomSheet>
    </div>
  );
}