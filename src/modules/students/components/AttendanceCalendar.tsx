"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AttendanceRecord } from "../types/student.types";
import type { AttendanceStatus } from "@shared/types/attendance";
import { cn } from "@shared/lib/utils";

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  onMonthChange?: (year: number, month: number) => void;
  className?: string;
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-green-500 text-white",
  absent: "bg-red-500 text-white",
  late: "bg-amber-500 text-white",
  excused: "bg-gray-400 text-white",
};

const STATUS_DOT: Record<AttendanceStatus, string> = {
  present: "bg-green-500",
  absent: "bg-red-500",
  late: "bg-amber-500",
  excused: "bg-gray-400",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AttendanceCalendar({ records, onMonthChange, className }: AttendanceCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of records) {
      map.set(r.date, r);
    }
    return map;
  }, [records]);

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const result: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= totalDays; d++) result.push(d);
    // pad to 6 rows
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [year, month]);

  const navigateMonth = (dir: -1 | 1) => {
    let newMonth = month + dir;
    let newYear = year;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setMonth(newMonth);
    setYear(newYear);
    onMonthChange?.(newYear, newMonth + 1);
  };

  const monthName = new Date(year, month).toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-medium text-sm">{monthName}</span>
        <button
          onClick={() => navigateMonth(1)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          aria-label="Next month"
          disabled={year === now.getFullYear() && month === now.getMonth()}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const record = recordMap.get(dateStr);
          const isToday =
            day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
          const isPast = new Date(year, month, day) < now;

          return (
            <div
              key={i}
              className="relative flex flex-col items-center"
              onMouseEnter={() => setHoveredDate(dateStr)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              <div
                className={cn(
                  "w-full aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-200",
                  record ? STATUS_COLORS[record.status] : isToday ? "ring-2 ring-primary ring-offset-1 bg-primary/10 text-primary" : isPast ? "text-muted-foreground hover:bg-muted" : "text-foreground hover:bg-muted"
                )}
              >
                {day}
              </div>

              {/* Mobile: dot indicator */}
              {record && (
                <div className="sm:hidden mt-0.5">
                  <div className={cn("w-1 h-1 rounded-full", STATUS_DOT[record.status])} />
                </div>
              )}

              {/* Tooltip */}
              {hoveredDate === dateStr && record && (
                <div className="absolute z-10 bottom-full mb-1 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg px-2 py-1 text-xs shadow-md whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                  <div className="font-medium capitalize">{record.status}</div>
                  <div className="text-muted-foreground">{record.courseName}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap justify-center pt-2">
        {(Object.entries(STATUS_DOT) as [AttendanceStatus, string][]).map(([status, dot]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={cn("w-2.5 h-2.5 rounded-full", dot)} />
            <span className="capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
