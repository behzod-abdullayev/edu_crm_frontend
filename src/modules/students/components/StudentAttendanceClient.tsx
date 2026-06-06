"use client";
import { useState } from "react";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useStudentAttendance } from "../hooks/useStudentAttendance";
import { AttendanceCalendar } from "./AttendanceCalendar";

export function StudentAttendanceClient() {
  const { user } = useCurrentUser();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading } = useStudentAttendance(user?.id ?? "", { year, month });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground text-sm mt-1">Your attendance record by month.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Rate", value: `${data?.rate ?? 0}%`, color: "text-green-600" },
          { label: "Present", value: data?.totalPresent ?? 0, color: "text-green-600" },
          { label: "Absent", value: data?.totalAbsent ?? 0, color: "text-red-600" },
          { label: "Late", value: data?.totalLate ?? 0, color: "text-amber-600" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
            {isLoading ? (
              <div className="h-8 w-16 mx-auto rounded bg-muted animate-pulse" />
            ) : (
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            )}
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        {isLoading ? (
          <div className="h-72 rounded-lg bg-muted animate-pulse" />
        ) : (
          <AttendanceCalendar
            records={data?.records ?? []}
            onMonthChange={(y, m) => { setYear(y); setMonth(m); }}
          />
        )}
      </div>
    </div>
  );
}