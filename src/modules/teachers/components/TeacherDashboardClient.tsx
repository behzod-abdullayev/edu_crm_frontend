"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
  Users,
  GraduationCap,
  ClipboardList,
  Percent,
  CheckSquare,
  PlusCircle,
  Upload,
} from "lucide-react";

import { httpClient } from "@/services/api/axios.instance";
import { queryKeys } from "@/services/query/keys.factory";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useSocketEvent } from "@shared/hooks/useWebSocket";
import { useToast } from "@shared/hooks/useToast";
import { KPICard } from "@shared/components/data-display/KPICard";
import { Button } from "@shared/components/ui/button";
import { formatLocalizedDate } from "@shared/utils/format";
import {
  SocketEvent,
  type HomeworkSubmittedPayload,
  type ScheduleUpdatedPayload,
} from "@/services/websocket/socket.events";
import type { TeacherDashboardKpi } from "../types/teacher.types";

// ─── Lazy-loaded chart (heavy Recharts bundle) ────────────────────────────────
const TeacherPerformanceChart = dynamic(
  () => import("./TeacherPerformanceChart"),
  { ssr: false },
);

// ─── Runtime type guard for analytics response ───────────────────────────────
function isTeacherDashboardKpi(data: unknown): data is TeacherDashboardKpi {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (
    typeof d.totalGroups !== "number" ||
    typeof d.totalStudents !== "number" ||
    typeof d.avgAttendanceRate !== "number"
  ) {
    return false;
  }
  const hw = d.homeworkStats as Record<string, unknown> | undefined;
  return !!hw && typeof hw.pending === "number";
}

// ─── Greeting helper ──────────────────────────────────────────────────────────
function getGreetingKey(): "greetingMorning" | "greetingAfternoon" | "greetingEvening" {
  const h = new Date().getHours();
  if (h < 12) return "greetingMorning";
  if (h < 17) return "greetingAfternoon";
  return "greetingEvening";
}

// ─── KPI card configuration ───────────────────────────────────────────────────
interface KpiConfig {
  titleKey: "activeGroups" | "totalStudents" | "pendingHomework" | "averageAttendance";
  icon: typeof Users;
  iconColor: string;
  getValue: (kpi: TeacherDashboardKpi) => number;
  unit?: string;
}

const KPI_CARDS: KpiConfig[] = [
  {
    titleKey: "activeGroups",
    icon: Users,
    iconColor: "var(--role-student)",
    getValue: (kpi) => kpi.totalGroups,
  },
  {
    titleKey: "totalStudents",
    icon: GraduationCap,
    iconColor: "var(--role-teacher)",
    getValue: (kpi) => kpi.totalStudents,
  },
  {
    titleKey: "pendingHomework",
    icon: ClipboardList,
    iconColor: "var(--role-owner)",
    getValue: (kpi) => kpi.homeworkStats.pending,
  },
  {
    titleKey: "averageAttendance",
    icon: Percent,
    iconColor: "var(--brand-accent)",
    getValue: (kpi) => kpi.avgAttendanceRate,
    unit: "%",
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
  const t = useTranslations("teacher.dashboard");

  const teacherId = user?.teacherId ?? "";

  // ── KPI data (derived from teacher analytics) ────────────────────────────
  const { data: kpiRaw, isLoading } = useQuery({
    queryKey: queryKeys.teachers.analytics(teacherId),
    queryFn: () =>
      httpClient
        .get<unknown>(`/teachers/${teacherId}/analytics`)
        .then((r) => r.data),
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1_000,
  });

  const kpi: TeacherDashboardKpi | null = isTeacherDashboardKpi(kpiRaw) ? kpiRaw : null;

  // ── WebSocket: homework submitted → refresh KPI + toast ──────────────────
  useSocketEvent(
    SocketEvent.HOMEWORK_SUBMITTED,
    (_payload: HomeworkSubmittedPayload) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.teachers.analytics(teacherId),
      });
      toast({ title: t("newSubmissionToast"), type: "info" });
    },
    !!teacherId,
  );

  // ── WebSocket: schedule updated → refresh KPI ────────────────────────────
  useSocketEvent(
    SocketEvent.SCHEDULE_UPDATED,
    (_payload: ScheduleUpdatedPayload) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.teachers.analytics(teacherId),
      });
    },
    !!teacherId,
  );

  // ── Today's date label ────────────────────────────────────────────────────
  const dateLabel = formatLocalizedDate(new Date(), locale, "full");

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
          {t(getGreetingKey())},{" "}
          <span className="text-[var(--brand-primary)]">
            {user?.firstName ?? t("defaultName")}
          </span>
          !
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{dateLabel}</p>
      </motion.div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        aria-label={t("kpiAriaLabel")}
      >
        {KPI_CARDS.map((card) => (
          <motion.div key={card.titleKey} variants={itemVariants}>
            <KPICard
              title={t(card.titleKey)}
              value={kpi ? card.getValue(kpi) : 0}
              icon={card.icon}
              iconColor={card.iconColor}
              isLoading={isLoading}
              {...(card.unit !== undefined ? { unit: card.unit } : {})}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap gap-3"
        role="group"
        aria-label={t("quickActionsAriaLabel")}
      >
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-2 h-9 min-h-[44px] sm:min-h-[36px]"
        >
          <Link href={`/${locale}/teacher/attendance`}>
            <CheckSquare size={16} aria-hidden="true" />
            {t("quickMarkAttendance")}
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
            {t("quickCreateHomework")}
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
            {t("quickUploadLesson")}
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
            {t("studentPerformance")}
          </h2>
          <TeacherPerformanceChart teacherId={teacherId} chartType="bar" />
        </motion.div>

        {/* Attendance Rate */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-3 shadow-[var(--shadow-sm)]"
        >
          <h2 className="font-semibold text-base text-[var(--text-primary)]">
            {t("attendanceRateChart")}
          </h2>
          <TeacherPerformanceChart teacherId={teacherId} chartType="area" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
