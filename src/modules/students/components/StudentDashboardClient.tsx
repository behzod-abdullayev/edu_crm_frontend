"use client";

import dynamic from "next/dynamic";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useStudentCourses } from "@/modules/students/hooks/useStudentCourses";
import { useStudentAttendance } from "@/modules/students/hooks/useStudentAttendance";
import { useWebSocket } from "@shared/hooks/useWebSocket";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks/useToast";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/services/api/axios.instance";
import { CourseProgressCard } from "./CourseProgressCard";
import { cn } from "@shared/lib/utils";
import { useMemo } from "react";
import type { ActivityFeedItem, StudentKpiData, UpcomingClass } from "@/modules/students/types/student.types";

const AttendanceHeatmap = dynamic(() => import("./AttendanceHeatmapChart"), { ssr: false });
const GradeTrendChart = dynamic(() => import("./GradeTrendChart"), { ssr: false });

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function useStudentDashboardKpi(studentId: string) {
  return useQuery({
    queryKey: ["students", studentId, "kpi"],
    queryFn: async () => {
      const res = await httpClient.get<StudentKpiData>(`/students/${studentId}/kpi`);
      return res.data;
    },
    enabled: !!studentId,
  });
}

function useStudentSchedule(studentId: string) {
  return useQuery({
    queryKey: ["students", studentId, "schedule"],
    queryFn: async () => {
      const res = await httpClient.get<UpcomingClass[]>(`/students/${studentId}/schedule`);
      return res.data;
    },
    enabled: !!studentId,
  });
}

function useStudentActivity(studentId: string) {
  return useQuery({
    queryKey: ["students", studentId, "activity"],
    queryFn: async () => {
      const res = await httpClient.get<ActivityFeedItem[]>(`/students/${studentId}/activity`);
      return res.data;
    },
    enabled: !!studentId,
  });
}

interface KpiCardSimpleProps {
  label: string;
  value: number;
  suffix?: string;
  trend: number;
  icon: string;
  colorClass: string;
  isLoading?: boolean;
  countUp?: boolean;
}

function KpiCardSimple({ label, value, suffix, trend, isLoading }: KpiCardSimpleProps) {
  if (isLoading === true) {
    return <div className="h-28 rounded-xl bg-muted animate-pulse" />;
  }
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      <p className="text-3xl font-bold text-foreground tabular-nums">
        {value}{suffix ?? ""}
      </p>
      {trend !== 0 && (
        <p className={cn("text-xs font-medium", trend > 0 ? "text-green-600" : "text-red-600")}>
          {trend > 0 ? "+" : ""}{trend}% vs last month
        </p>
      )}
    </div>
  );
}

export function StudentDashboardClient() {
  const { data: user } = useCurrentUser();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: kpi, isLoading: kpiLoading } = useStudentDashboardKpi(user?.id ?? "");
  const { data: coursesData, isLoading: coursesLoading } = useStudentCourses(user?.id ?? "");
  const { data: attendanceData } = useStudentAttendance(user?.id ?? "");
  const { data: schedule, isLoading: scheduleLoading } = useStudentSchedule(user?.id ?? "");
  const { data: activity, isLoading: activityLoading } = useStudentActivity(user?.id ?? "");

  useWebSocket({
    events: {
      HOMEWORK_GRADED: () => {
        queryClient.invalidateQueries({ queryKey: ["students", user?.id, "kpi"] });
        toast({ title: "Homework graded!", description: "Your teacher has graded your submission." });
      },
      SCHEDULE_UPDATED: () => {
        queryClient.invalidateQueries({ queryKey: ["students", user?.id, "schedule"] });
        toast({ title: "Schedule updated" });
      },
    },
  });

  const upcomingClasses = useMemo(() => schedule?.slice(0, 3) ?? [], [schedule]);
  const recentActivity = useMemo(() => activity?.slice(0, 5) ?? [], [activity]);

  const kpiCards: KpiCardSimpleProps[] = [
    {
      label: "Courses Enrolled",
      value: kpi?.coursesEnrolled ?? 0,
      trend: kpi?.coursesEnrolledTrend ?? 0,
      icon: "BookOpen",
      colorClass: "text-blue-500",
      isLoading: kpiLoading,
      countUp: true,
    },
    {
      label: "Attendance Rate",
      value: kpi?.attendanceRate ?? 0,
      suffix: "%",
      trend: kpi?.attendanceRateTrend ?? 0,
      icon: "CheckCircle",
      colorClass: "text-green-500",
      isLoading: kpiLoading,
      countUp: true,
    },
    {
      label: "Homework Pending",
      value: kpi?.homeworkPending ?? 0,
      trend: kpi?.homeworkPendingTrend ?? 0,
      icon: "ClipboardList",
      colorClass: "text-amber-500",
      isLoading: kpiLoading,
      countUp: true,
    },
    {
      label: "Average Grade",
      value: kpi?.averageGrade ?? 0,
      trend: kpi?.averageGradeTrend ?? 0,
      icon: "Star",
      colorClass: "text-purple-500",
      isLoading: kpiLoading,
      countUp: true,
    },
  ];

  return (
    <div className="space-y-8 pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 animate-in slide-in-from-top-4 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {getGreeting()}, {user?.firstName ?? "Student"}!
        </h1>
        <p className="text-muted-foreground text-sm">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <div
            key={card.label}
            className="animate-in slide-in-from-bottom-4 fade-in duration-500"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <KpiCardSimple {...card} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cn("lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4", "animate-in slide-in-from-left-4 fade-in duration-500 delay-200")}>
          <h2 className="font-semibold text-base">Upcoming Classes</h2>
          {scheduleLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => (<div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />))}</div>
          ) : upcomingClasses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No upcoming classes.</p>
          ) : (
            <div className="space-y-3">
              {upcomingClasses.map((cls: UpcomingClass) => (
                <div key={cls.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-sm">{cls.courseName}</span>
                    <span className="text-xs text-muted-foreground">{cls.teacherName}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-xs font-medium text-foreground">
                      {new Date(cls.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-xs text-muted-foreground">Room {cls.room}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={cn("rounded-xl border border-border bg-card p-5 space-y-4", "animate-in slide-in-from-right-4 fade-in duration-500 delay-200")}>
          <h2 className="font-semibold text-base">Recent Activity</h2>
          {activityLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => (<div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />))}</div>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No recent activity.</p>
          ) : (
            <div className="relative space-y-0">
              {recentActivity.map((item: ActivityFeedItem, i: number) => (
                <div key={item.id} className="flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    {i < recentActivity.length - 1 && (<div className="w-px flex-1 bg-border mt-1" />)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(item.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <h2 className="font-semibold text-base">Course Progress</h2>
        {coursesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (<div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(coursesData?.data ?? []).slice(0, 6).map((enrollment) => (
              <CourseProgressCard key={enrollment.courseId} enrollment={enrollment} />
            ))}
          </div>
        )}
      </div>

      <div className={cn("grid gap-6 animate-in fade-in duration-500 delay-400", isMobile ? "grid-cols-1" : "grid-cols-2")}>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-base">Attendance (Last 30 Days)</h2>
          <AttendanceHeatmap records={attendanceData?.records ?? []} />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-base">Grade Trend</h2>
          <GradeTrendChart studentId={user?.id ?? ""} />
        </div>
      </div>
    </div>
  );
}