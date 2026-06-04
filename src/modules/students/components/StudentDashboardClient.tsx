"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle,
  ClipboardList,
  Star,
  Calendar,
  TrendingUp,
  TrendingDown,
  Zap,
} from "lucide-react";

import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useStudentCourses } from "@/modules/students/hooks/useStudentCourses";
import { useStudentAttendance } from "@/modules/students/hooks/useStudentAttendance";
import { useSocketEvent } from "@shared/hooks/useWebSocket";
import { SocketEvent } from "@/services/websocket/socket.events";
import { useToast } from "@shared/hooks/useToast";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { httpClient } from "@/services/api/axios.instance";
import { CourseProgressCard } from "./CourseProgressCard";
import { cn } from "@shared/lib/utils";
import type {
  StudentKpiData,
  UpcomingClass,
  ActivityFeedItem,
} from "@/modules/students/types/student.types";

// ── Lazy charts ───────────────────────────────────────────────────────────────
const AttendanceHeatmap = dynamic(
  () => import("./AttendanceHeatmapChart"),
  { ssr: false },
);
const GradeTrendChart = dynamic(
  () => import("./GradeTrendChart"),
  { ssr: false },
);

// ── Greeting helper ───────────────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ── Shimmer skeleton ──────────────────────────────────────────────────────────
function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-xl overflow-hidden", className)}
      style={{
        background:
          "linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s linear infinite",
      }}
      aria-hidden="true"
    />
  );
}

// ── Local queries ─────────────────────────────────────────────────────────────
function useStudentKpi(studentId: string) {
  return useQuery({
    queryKey: ["students", studentId, "kpi"],
    queryFn: async () => {
      const res = await httpClient.get<StudentKpiData>(
        `/students/${studentId}/kpi`,
      );
      return res.data;
    },
    enabled: !!studentId,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

function useStudentScheduleQuery(studentId: string) {
  return useQuery({
    queryKey: ["students", studentId, "schedule"],
    queryFn: async () => {
      const res = await httpClient.get<UpcomingClass[]>(
        `/students/${studentId}/schedule`,
      );
      return res.data;
    },
    enabled: !!studentId,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

function useStudentActivity(studentId: string) {
  return useQuery({
    queryKey: ["students", studentId, "activity"],
    queryFn: async () => {
      const res = await httpClient.get<ActivityFeedItem[]>(
        `/students/${studentId}/activity`,
      );
      return res.data;
    },
    enabled: !!studentId,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// ── KPI card ──────────────────────────────────────────────────────────────────
interface KpiItem {
  label: string;
  value: number;
  suffix?: string;
  trend: number;
  icon: React.ReactNode;
  iconBg: string;
}

function KpiCard({
  item,
  isLoading,
  delay,
}: {
  item: KpiItem;
  isLoading: boolean;
  delay: number;
}) {
  if (isLoading) return <Shimmer className="h-32" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3 transition-shadow hover:shadow-[var(--shadow-md)]"
      role="region"
      aria-label={item.label}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
          {item.label}
        </p>
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            item.iconBg,
          )}
          aria-hidden="true"
        >
          {item.icon}
        </div>
      </div>

      <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
        {item.value}
        {item.suffix ?? ""}
      </p>

      {item.trend !== 0 && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            item.trend > 0
              ? "text-[var(--success-text)]"
              : "text-[var(--error-text)]",
          )}
          aria-label={`${item.trend > 0 ? "Increased" : "Decreased"} by ${Math.abs(item.trend)}% vs last month`}
        >
          {item.trend > 0 ? (
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          {item.trend > 0 ? "+" : ""}
          {item.trend}% vs last month
        </div>
      )}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function StudentDashboardClient() {
  const { user } = useCurrentUser();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const studentId = user?.id ?? "";

  const { data: kpi, isLoading: kpiLoading } = useStudentKpi(studentId);
  const { data: coursesData, isLoading: coursesLoading } =
    useStudentCourses(studentId);
  const { data: attendanceData } = useStudentAttendance(studentId);
  const { data: schedule, isLoading: scheduleLoading } =
    useStudentScheduleQuery(studentId);
  const { data: activity, isLoading: activityLoading } =
    useStudentActivity(studentId);

  // ── WebSocket subscriptions ─────────────────────────────────────────────────
  useSocketEvent(
    SocketEvent.HOMEWORK_GRADED,
    () => {
      void queryClient.invalidateQueries({
        queryKey: ["students", studentId, "kpi"],
      });
      toast({
        title: "Homework graded!",
        description: "Your teacher has graded your submission.",
        type: "success",
      });
    },
    !!studentId,
  );

  useSocketEvent(
    SocketEvent.SCHEDULE_UPDATED,
    () => {
      void queryClient.invalidateQueries({
        queryKey: ["students", studentId, "schedule"],
      });
      toast({ title: "Schedule updated", type: "info" });
    },
    !!studentId,
  );

  // ── Derived data ────────────────────────────────────────────────────────────
  const upcomingClasses = useMemo(
    () => schedule?.slice(0, 3) ?? [],
    [schedule],
  );
  const recentActivity = useMemo(() => activity?.slice(0, 5) ?? [], [activity]);

  const kpiItems: KpiItem[] = [
    {
      label: "Courses Enrolled",
      value: kpi?.coursesEnrolled ?? 0,
      trend: kpi?.coursesEnrolledTrend ?? 0,
      icon: <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Attendance Rate",
      value: kpi?.attendanceRate ?? 0,
      suffix: "%",
      trend: kpi?.attendanceRateTrend ?? 0,
      icon: (
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      ),
      iconBg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Homework Pending",
      value: kpi?.homeworkPending ?? 0,
      trend: kpi?.homeworkPendingTrend ?? 0,
      icon: (
        <ClipboardList className="w-5 h-5 text-amber-600 dark:text-amber-400" />
      ),
      iconBg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      label: "Average Grade",
      value: kpi?.averageGrade ?? 0,
      trend: kpi?.averageGradeTrend ?? 0,
      icon: <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      iconBg: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1"
      >
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
          {getGreeting()},{" "}
          <span className="text-[var(--brand-primary)]">
            {user?.firstName ?? "Student"}
          </span>
          !
        </h1>
        <p className="text-[var(--text-muted)] text-sm">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </motion.div>

      {/* KPI cards — 1 col / 2 col / 4 col */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiItems.map((item, i) => (
          <KpiCard
            key={item.label}
            item={item}
            isLoading={kpiLoading}
            delay={i * 0.07}
          />
        ))}
      </div>

      {/* Upcoming classes + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming classes — 2/3 width on desktop */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="lg:col-span-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Calendar
              className="w-4 h-4 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            <h2 className="font-semibold text-base text-[var(--text-primary)]">
              Upcoming Classes
            </h2>
          </div>

          {scheduleLoading ? (
            <div
              className="space-y-3"
              aria-busy="true"
              aria-label="Loading upcoming classes"
            >
              {[1, 2, 3].map((i) => (
                <Shimmer key={i} className="h-16" />
              ))}
            </div>
          ) : upcomingClasses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-10 flex flex-col items-center gap-2"
              role="status"
            >
              <Calendar
                className="w-10 h-10 text-[var(--text-muted)]"
                aria-hidden="true"
              />
              <p className="text-sm text-[var(--text-muted)]">
                No upcoming classes.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {upcomingClasses.map((cls, i) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium text-sm text-[var(--text-primary)] truncate">
                      {cls.courseName}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {cls.teacherName}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-3">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {new Date(cls.startTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      Room {cls.room}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent activity — 1/3 width on desktop */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Zap
              className="w-4 h-4 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            <h2 className="font-semibold text-base text-[var(--text-primary)]">
              Recent Activity
            </h2>
          </div>

          {activityLoading ? (
            <div
              className="space-y-3"
              aria-busy="true"
              aria-label="Loading recent activity"
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <Shimmer key={i} className="h-12" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-6 text-center" role="status">
              No recent activity.
            </p>
          ) : (
            <div className="relative space-y-0" role="list">
              {recentActivity.map((item, i) => (
                <motion.div
                  key={item.id}
                  role="listitem"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex gap-3 pb-4 last:pb-0"
                >
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-2 h-2 rounded-full bg-[var(--brand-primary)] mt-1.5"
                      aria-hidden="true"
                    />
                    {i < recentActivity.length - 1 && (
                      <div
                        className="w-px flex-1 bg-[var(--border-default)] mt-1"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {item.description}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Course progress grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="space-y-4"
      >
        <h2 className="font-semibold text-base text-[var(--text-primary)]">
          Course Progress
        </h2>

        {coursesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Shimmer key={i} className="h-44" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(coursesData?.data ?? []).slice(0, 6).map((enrollment, i) => (
              <motion.div
                key={enrollment.courseId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
              >
                <CourseProgressCard enrollment={enrollment} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Attendance heatmap + Grade trend */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.4 }}
        className={cn(
          "grid gap-6",
          isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2",
        )}
      >
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3">
          <h2 className="font-semibold text-sm text-[var(--text-primary)]">
            Attendance (Last 30 Days)
          </h2>
          <AttendanceHeatmap records={attendanceData?.records ?? []} />
        </div>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3">
          <h2 className="font-semibold text-sm text-[var(--text-primary)]">
            Grade Trend
          </h2>
          <GradeTrendChart studentId={studentId} />
        </div>
      </motion.div>
    </div>
  );
}
