"use client";
import { AttendanceMarkingUI } from "./AttendanceMarkingUI";

export function TeacherAttendanceClient() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mark Attendance</h1>
        <p className="text-muted-foreground text-sm mt-1">Record student attendance for a group session.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <AttendanceMarkingUI />
      </div>
    </div>
  );
}
