"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { httpClient } from "@/services/api/axios.instance";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { StudentTable } from "@/modules/students/components/StudentTable";
import { StudentCardList } from "@/modules/students/components/StudentCardList";
import { AttendanceCalendar } from "@/modules/students/components/AttendanceCalendar";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@shared/lib/utils";
import type { GroupDetailDto, HomeworkDto } from "@generated/models";
import type { StudentListDto } from "@/modules/students/components/StudentTable";
import type { AttendanceRecord } from "@/modules/students/types/student.types";

const TABS = ["Students", "Attendance", "Homework"] as const;
type Tab = (typeof TABS)[number];

interface AttendanceResponse {
  records: AttendanceRecord[];
}

function isGroupDetail(data: unknown): data is GroupDetailDto {
  return !!data && typeof data === "object";
}

function isAttendanceResponse(data: unknown): data is AttendanceResponse {
  if (!data || typeof data !== "object") return false;
  return "records" in data && Array.isArray((data as AttendanceResponse).records);
}

export function TeacherGroupDetailClient({ groupId }: { groupId: string }) {
  const { data: user } = useCurrentUser();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<Tab>("Students");
  const [studentPage, setStudentPage] = useState(1);

  const { data: groupRaw, isLoading } = useQuery({
    queryKey: ["groups", groupId],
    queryFn: () =>
      httpClient.get<GroupDetailDto>(`/groups/${groupId}`).then((r) => r.data),
    enabled: !!groupId,
  });

  const { data: students, isLoading: studLoading } = useQuery({
    queryKey: ["groups", groupId, "students", studentPage],
    queryFn: () =>
      httpClient
        .get<{ data: StudentListDto[]; total: number }>(`/groups/${groupId}/students`, {
          params: { page: studentPage, pageSize: 20 },
        })
        .then((r) => r.data),
    enabled: !!groupId && tab === "Students",
  });

  const { data: attendanceRaw } = useQuery({
    queryKey: ["groups", groupId, "attendance"],
    queryFn: () =>
      httpClient.get(`/groups/${groupId}/attendance`).then((r) => r.data),
    enabled: !!groupId && tab === "Attendance",
  });

  const { data: homework } = useQuery({
    queryKey: ["groups", groupId, "homework"],
    queryFn: () =>
      httpClient.get<HomeworkDto[]>(`/groups/${groupId}/homework`).then((r) => r.data),
    enabled: !!groupId && tab === "Homework",
  });

  // Suppress unused variable warning — user may be used for permissions in future.
  void user;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const group = isGroupDetail(groupRaw) ? groupRaw : null;
  const attendanceRecords = isAttendanceResponse(attendanceRaw) ? attendanceRaw.records : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link
        href="/teacher/groups"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />Back to Groups
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">{group?.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {group?.studentCount ?? 0} students · {group?.courseName}
        </p>
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

      {tab === "Students" &&
        (isMobile ? (
          <StudentCardList
            students={students?.data ?? []}
            isLoading={studLoading}
            totalCount={students?.total ?? 0}
            page={studentPage}
            pageSize={20}
            onPageChange={setStudentPage}
            basePath="/teacher/students"
          />
        ) : (
          <StudentTable
            data={students?.data ?? []}
            isLoading={studLoading}
            totalCount={students?.total ?? 0}
            page={studentPage}
            pageSize={20}
            onPageChange={setStudentPage}
            basePath="/teacher/students"
          />
        ))}

      {tab === "Attendance" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <AttendanceCalendar records={attendanceRecords} />
        </div>
      )}

      {tab === "Homework" && (
        <div className="space-y-3">
          {(homework ?? []).map((hw: HomeworkDto) => (
            <Link key={hw.id} href={`/teacher/homework/${hw.id}`}>
              <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                <p className="font-semibold text-sm">{hw.title}</p>
                <p className="text-xs text-muted-foreground">
                  {hw.submissionsCount ?? 0} submissions · Due{" "}
                  {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : "—"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
