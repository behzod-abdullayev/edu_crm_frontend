"use client";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { httpClient } from "@/services/api/axios.instance";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { useState } from "react";
import { MobileBottomSheet } from "@shared/components/mobile/MobileBottomSheet";
import { cn } from "@shared/lib/utils";

export interface ScheduleEvent {
  id: string;
  courseName: string;
  teacherName: string;
  room: string;
  startTime: string;
  endTime: string;
  dayOfWeek?: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);

export function StudentScheduleClient() {
  const { data: user } = useCurrentUser();
  const isMobile = useIsMobile();
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ["students", user?.id, "schedule"],
    queryFn: async () => {
      const res = await httpClient.get<ScheduleEvent[]>(`/students/${user?.id}/schedule`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  const today = new Date().getDay();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="h-8 w-32 rounded bg-muted animate-pulse" />
        <div className="h-96 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const EventDetail = () => selectedEvent ? (
    <div className="space-y-3 p-1">
      <h3 className="font-semibold text-base">{selectedEvent.courseName}</h3>
      <div className="space-y-1.5 text-sm text-muted-foreground">
        <p>Teacher: <span className="text-foreground font-medium">{selectedEvent.teacherName}</span></p>
        <p>Room: <span className="text-foreground font-medium">{selectedEvent.room}</span></p>
        <p>Time: <span className="text-foreground font-medium">
          {new Date(selectedEvent.startTime).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})} –{" "}
          {new Date(selectedEvent.endTime).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}
        </span></p>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground text-sm mt-1">Your weekly class timetable.</p>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {(events ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No upcoming classes.</p>
          ) : (
            [...(events ?? [])].sort((a: ScheduleEvent, b: ScheduleEvent) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map((ev: ScheduleEvent) => {
              const start = new Date(ev.startTime);
              const isPast = start < new Date();
              return (
                <button key={ev.id} type="button" onClick={() => setSelectedEvent(ev)}
                  className={cn("w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors", isPast && "opacity-50")}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{ev.courseName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ev.teacherName} · Room {ev.room}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium">{start.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</p>
                      <p className="text-xs text-muted-foreground">{start.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-8 border-b border-border bg-muted/50">
            <div className="p-3 text-xs text-muted-foreground" />
            {WEEKDAYS.map((d, i) => (
              <div key={d} className={cn("p-3 text-center text-xs font-semibold", i === today && "text-primary bg-primary/5")}>
                {d}
              </div>
            ))}
          </div>
          <div className="divide-y divide-border">
            {HOURS.map(h => (
              <div key={h} className="grid grid-cols-8 min-h-[48px]">
                <div className="p-2 text-xs text-muted-foreground text-right pr-3 pt-1.5 border-r border-border">
                  {h === 12 ? "12 PM" : h > 12 ? `${h-12} PM` : `${h} AM`}
                </div>
                {WEEKDAYS.map((_, day) => {
                  const evs = (events ?? []).filter((e: ScheduleEvent) => {
                    const s = new Date(e.startTime);
                    return s.getDay() === day && s.getHours() === h;
                  });
                  return (
                    <div key={day} className={cn("relative border-r border-border last:border-r-0 p-1", day === today && "bg-primary/[0.03]")}>
                      {evs.map((ev: ScheduleEvent) => (
                        <button key={ev.id} type="button" onClick={() => setSelectedEvent(ev)}
                          className="w-full text-left rounded p-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium truncate">
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
      )}

      <MobileBottomSheet open={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Class Details">
        <EventDetail />
      </MobileBottomSheet>
    </div>
  );
}