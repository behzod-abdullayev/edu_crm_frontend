"use client";

import dynamic from "next/dynamic";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/services/api/axios.instance";
import { useWebSocket } from "@shared/hooks/useWebSocket";
import { useToast } from "@shared/hooks/useToast";
import { KPICard } from "@shared/components/data-display/KPICard";
import Link from "next/link";
import { Button } from "@shared/components/ui/button";
import { CheckSquare, PlusCircle, Upload, Users, GraduationCap, ClipboardList, Calendar } from "lucide-react";

const PerformanceChart = dynamic(() => import("./TeacherPerformanceChart"), { ssr: false });

interface TeacherKPI {
  activeGroups: number;
  totalStudents: number;
  pendingGrading: number;
  todaysClasses: number;
}

function isTeacherKPI(data: unknown): data is TeacherKPI {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.activeGroups === "number" &&
    typeof d.totalStudents === "number" &&
    typeof d.pendingGrading === "number" &&
    typeof d.todaysClasses === "number"
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function TeacherDashboardClient() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: kpiRaw, isLoading } = useQuery({
    queryKey: ["teachers", user?.id, "kpi"],
    queryFn: () =>
      httpClient.get(`/teachers/${user?.id}/kpi`).then((r) => r.data),
    enabled: !!user?.id,
  });

  const kpi: TeacherKPI | null = isTeacherKPI(kpiRaw) ? kpiRaw : null;

  useWebSocket({
    events: {
      HOMEWORK_SUBMITTED: () => {
        void queryClient.invalidateQueries({ queryKey: ["teachers", user?.id, "kpi"] });
        toast({ title: "New homework submission received" });
      },
      SCHEDULE_UPDATED: () =>
        void queryClient.invalidateQueries({ queryKey: ["teachers", user?.id, "kpi"] }),
    },
  });

  return (
    <div className="space-y-8 pb-8 animate-in fade-in duration-500">
      <div className="animate-in slide-in-from-top-4 duration-500">
        <h1 className="text-2xl font-semibold tracking-tight">
          {getGreeting()}, {user?.firstName ?? "Teacher"}!
        </h1>
        <p className="text-muted-foreground text-sm">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Active Groups", value: kpi?.activeGroups ?? 0, icon: Users, iconColor: "#3b82f6" },
          { title: "Total Students", value: kpi?.totalStudents ?? 0, icon: GraduationCap, iconColor: "#22c55e" },
          { title: "Pending Grading", value: kpi?.pendingGrading ?? 0, icon: ClipboardList, iconColor: "#f59e0b" },
          { title: "Today's Classes", value: kpi?.todaysClasses ?? 0, icon: Calendar, iconColor: "#8b5cf6" },
        ].map((card, i) => (
          <div
            key={card.title}
            className="animate-in slide-in-from-bottom-4 fade-in duration-500"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <KPICard
              title={card.title}
              value={card.value}
              icon={card.icon}
              iconColor={card.iconColor}
              isLoading={isLoading}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 animate-in fade-in duration-500 delay-200">
        <Button asChild variant="outline" className="gap-2">
          <Link href="/teacher/attendance">
            <CheckSquare className="w-4 h-4" />Mark Attendance
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/teacher/homework/create">
            <PlusCircle className="w-4 h-4" />Create Homework
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/teacher/lessons/upload">
            <Upload className="w-4 h-4" />Upload Lesson
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500 delay-300">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-base">Student Performance</h2>
          <PerformanceChart teacherId={user?.id ?? ""} chartType="bar" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-base">Attendance Rate</h2>
          <PerformanceChart teacherId={user?.id ?? ""} chartType="area" />
        </div>
      </div>
    </div>
  );
}
