"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/services/api/axios.instance";
import { GradesList } from "@/modules/students/components/GradesList";
import { AttendanceCalendar } from "@/modules/students/components/AttendanceCalendar";
import { StudentAnalyticsChart } from "./StudentAnalyticsChart";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/components/ui/avatar";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@shared/lib/utils";
import type { StudentDetailDto } from "@generated/models";
import type { CourseGradesSummaryDto } from "@/modules/students/components/GradesList";

const TABS = ["Overview", "Grades", "Attendance", "Analytics"] as const;
type Tab = (typeof TABS)[number];

interface StudentSummary {
  firstName?: string | undefined;
  lastName?: string | undefined;
  email?: string | undefined;
  avatarUrl?: string | undefined;
  attendanceRate?: number | undefined;
  averageGrade?: number | undefined;
  submissionsCount?: number | undefined;
  groupCount?: number | undefined;
}

function toStudentSummary(data: unknown): StudentSummary {
  if (!data || typeof data !== "object") return {};
  return data as StudentSummary;
}

export function TeacherStudentDetailClient({ studentId }: { studentId: string }) {
  const [tab, setTab] = useState<Tab>("Overview");

  const { data: studentRaw, isLoading } = useQuery({
    queryKey: ["students", studentId, "detail"],
    queryFn: () =>
      httpClient.get<StudentDetailDto>(`/students/${studentId}`).then((r) => r.data),
    enabled: !!studentId,
  });

  const { data: grades } = useQuery({
    queryKey: ["students", studentId, "grades"],
    queryFn: () =>
      httpClient
        .get<CourseGradesSummaryDto[]>(`/students/${studentId}/grades`)
        .then((r) => r.data),
    enabled: !!studentId && tab === "Grades",
  });

  const { data: attendanceRaw } = useQuery({
    queryKey: ["students", studentId, "attendance"],
    queryFn: () =>
      httpClient.get(`/students/${studentId}/attendance`).then((r) => r.data),
    enabled: !!studentId && tab === "Attendance",
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const student = toStudentSummary(studentRaw);
  const attendanceRecords = Array.isArray(attendanceRaw) ? attendanceRaw : [];
  const name = `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link
        href="/teacher/students"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />Back to Students
      </Link>

      <div className="flex items-center gap-4">
        <Avatar className="w-14 h-14">
          <AvatarImage src={student.avatarUrl} />
          <AvatarFallback>
            {name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold">{name}</h1>
          <p className="text-sm text-muted-foreground">{student.email}</p>
        </div>
      </div>

      <div className="flex border-b border-border gap-4">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "pb-2 text-sm font-medium border-b-2 transition-colors",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Attendance", value: `${student.attendanceRate ?? 0}%` },
            { label: "Avg. Grade", value: student.averageGrade?.toFixed(1) ?? "—" },
            { label: "Submissions", value: student.submissionsCount ?? 0 },
            { label: "Groups", value: student.groupCount ?? 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "Grades" && <GradesList summaries={grades ?? []} />}

      {tab === "Attendance" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <AttendanceCalendar records={attendanceRecords} />
        </div>
      )}

      {tab === "Analytics" && <StudentAnalyticsChart studentId={studentId} />}
    </div>
  );
}
