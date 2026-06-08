"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import {
  Users,
  GraduationCap,
  ClipboardList,
  Calendar,
  CheckSquare,
  PlusCircle,
  Upload,
} from "lucide-react";

import { httpClient } from "@/services/api/axios.instance";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useSocketEvent } from "@shared/hooks/useWebSocket";
import { useToast } from "@shared/hooks/useToast";
import { KPICard } from "@shared/components/data-display/KPICard";
import { Button } from "@shared/components/ui/button";
import {
  SocketEvent,
  type HomeworkSubmittedPayload,
  type ScheduleUpdatedPayload,
} from "@/services/websocket/socket.events";
import type { TeacherKpiData } from "../types/teacher.types";

// ─── Lazy-loaded chart (heavy Recharts bundle) ────────────────────────────────
const TeacherPerformanceChart = dynamic(
  () => import("./TeacherPerformanceChart"),
  { ssr: false },
);

// ─── Runtime type guard for KPI response ─────────────────────────────────────
function isTeacherKpiData(data: unknown): data is TeacherKpiData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.activeGroups === "number" &&
    typeof d.totalStudents === "number" &&
    typeof d.pendingGrading === "number" &&
    typeof d.todaysClasses === "number"
  );
}

// ─── Greeting helper ──────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─── KPI card configuration ───────────────────────────────────────────────────
interface KpiConfig {
  title: string;
  icon: typeof Users;
  iconColor: string;
  kpiKey: keyof TeacherKpiData;
  trendKey?: keyof TeacherKpiData;
}

const KPI_CARDS: KpiConfig[] = [
  {
    title: "Active Groups",
    icon: Users,
    iconColor: "var(--role-student)",
    kpiKey: "activeGroups",
    trendKey: "activeGroupsTrend",
  },
  {
    title: "Total Students",
    icon: GraduationCap,
    iconColor: "var(--role-teacher)",
    kpiKey: "totalStudents",
    trendKey: "totalStudentsTrend",
  },
  {
    title: "Pending Grading",
    icon: ClipboardList,
    iconColor: "var(--role-owner)",
    kpiKey: "pendingGrading",
    trendKey: "pendingGradingTrend",
  },
  {
    title: "Today's Classes",
    icon: Calendar,
    iconColor: "var(--brand-accent)",
    kpiKey: "todaysClasses",
    trendKey: "todaysClassesTrend",
  },
];

// ─── Stagger animation variants ───────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// ─────────────────────────────────────────────────────────────────────────────
//  TeacherDashboardClient
// ─────────────────────────────────────────────────────────────────────────────

export function TeacherDashboardClient() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const locale = useLocale();

  const teacherId = user?.id ?? "";

  // ── KPI data ──────────────────────────────────────────────────────────────
  const { data: kpiRaw, isLoading } = useQuery({
    queryKey: ["teachers", teacherId, "kpi"],
    queryFn: () =>
      httpClient
        .get<unknown>(`/teachers/${teacherId}/kpi`)
        .then((r) => r.data),
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1_000,
  });

  const kpi: TeacherKpiData | null = isTeacherKpiData(kpiRaw) ? kpiRaw : null;

  // ── WebSocket: homework submitted → refresh KPI + toast ──────────────────
  useSocketEvent(
    SocketEvent.HOMEWORK_SUBMITTED,
    (_payload: HomeworkSubmittedPayload) => {
      void queryClient.invalidateQueries({
        queryKey: ["teachers", teacherId, "kpi"],
      });
      toast({ title: "New homework submission received", type: "info" });
    },
    !!teacherId,
  );

  // ── WebSocket: schedule updated → refresh KPI ────────────────────────────
  useSocketEvent(
    SocketEvent.SCHEDULE_UPDATED,
    (_payload: ScheduleUpdatedPayload) => {
      void queryClient.invalidateQueries({
        queryKey: ["teachers", teacherId, "kpi"],
      });
    },
    !!teacherId,
  );

  // ── Today's date label ────────────────────────────────────────────────────
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-8"
    >
      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
          {getGreeting()},{" "}
          <span className="text-[var(--brand-primary)]">
            {user?.firstName ?? "Teacher"}
          </span>
          !
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{dateLabel}</p>
      </motion.div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        aria-label="Key performance indicators"
      >
        {KPI_CARDS.map((card) => {
          const value = kpi?.[card.kpiKey] ?? 0;
          const trendValue =
            card.trendKey !== undefined ? (kpi?.[card.trendKey] ?? 0) : undefined;

          return (
            <motion.div key={card.title} variants={itemVariants}>
              <KPICard
                title={card.title}
                value={value as number}
                icon={card.icon}
                iconColor={card.iconColor}
                isLoading={isLoading}
                {...(trendValue !== undefined
                  ? {
                      trend: {
                        value: trendValue as number,
                        label: "vs last week",
                        direction:
                          (trendValue as number) > 0
                            ? "up"
                            : (trendValue as number) < 0
                              ? "down"
                              : "neutral",
                      },
                    }
                  : {})}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap gap-3"
        role="group"
        aria-label="Quick actions"
      >
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-2 h-9 min-h-[44px] sm:min-h-[36px]"
        >
          <Link href={`/${locale}/teacher/attendance`}>
            <CheckSquare size={16} aria-hidden="true" />
            Mark Attendance
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-2 h-9 min-h-[44px] sm:min-h-[36px]"
        >
          <Link href={`/${locale}/teacher/homework/create`}>
            <PlusCircle size={16} aria-hidden="true" />
            Create Homework
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-2 h-9 min-h-[44px] sm:min-h-[36px]"
        >
          <Link href={`/${locale}/teacher/lessons/upload`}>
            <Upload size={16} aria-hidden="true" />
            Upload Lesson
          </Link>
        </Button>
      </motion.div>

      {/* ── Charts ──────────────────────────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Student Performance */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3 shadow-[var(--shadow-sm)]"
        >
          <h2 className="font-semibold text-base text-[var(--text-primary)]">
            Student Performance
          </h2>
          <TeacherPerformanceChart teacherId={teacherId} chartType="bar" />
        </motion.div>

        {/* Attendance Rate */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3 shadow-[var(--shadow-sm)]"
        >
          <h2 className="font-semibold text-base text-[var(--text-primary)]">
            Attendance Rate
          </h2>
          <TeacherPerformanceChart teacherId={teacherId} chartType="area" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
