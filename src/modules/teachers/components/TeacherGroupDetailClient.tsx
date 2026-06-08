"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Users, BookOpen, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

import { httpClient } from "@/services/api/axios.instance";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { cn } from "@shared/lib/utils";
import { StudentTable } from "@/modules/students/components/StudentTable";
import { StudentCardList } from "@/modules/students/components/StudentCardList";
import { AttendanceCalendar } from "@/modules/students/components/AttendanceCalendar";
import type { StudentListDto } from "@/modules/students/components/StudentTable";
import type { AttendanceRecord } from "@/modules/students/types/student.types";
import type { GroupDetailDto, HomeworkDto } from "@generated/models";
import { format } from "date-fns";

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = ["Students", "Attendance", "Homework"] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, typeof Users> = {
  Students: Users,
  Attendance: ClipboardList,
  Homework: BookOpen,
};

// ─── Runtime type guards ──────────────────────────────────────────────────────
function isGroupDetailDto(data: unknown): data is GroupDetailDto {
  return !!data && typeof data === "object" && "name" in data;
}

interface AttendanceResponse {
  records: AttendanceRecord[];
}

function isAttendanceResponse(data: unknown): data is AttendanceResponse {
  if (!data || typeof data !== "object") return false;
  return (
    "records" in data &&
    Array.isArray((data as AttendanceResponse).records)
  );
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function GroupDetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading group">
      <div className="h-4 w-28 rounded-full bg-[var(--bg-surface-secondary)] animate-pulse" />
      <div className="h-8 w-56 rounded-lg bg-[var(--bg-surface-secondary)] animate-pulse" />
      <div className="h-4 w-36 rounded-full bg-[var(--bg-surface-secondary)] animate-pulse" />
      <div className="h-64 rounded-2xl bg-[var(--bg-surface-secondary)] animate-pulse" />
    </div>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────
interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Group sections"
      className="flex border-b border-[var(--border-default)] gap-1"
    >
      {TABS.map((tab) => {
        const Icon = TAB_ICONS[tab];
        const isActive = tab === activeTab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab}`}
            id={`tab-${tab}`}
            onClick={() => onTabChange(tab)}
            className={cn(
              "relative flex items-center gap-1.5 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors duration-[var(--transition-fast)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded-t-md",
              "min-h-[44px] sm:min-h-[36px]",
              isActive
                ? "text-[var(--brand-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            )}
          >
            <Icon size={14} aria-hidden="true" />
            {tab}
            {/* Animated active indicator */}
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[var(--brand-primary)]"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Tab content animation variants ─────────────────────────────────────────
const tabContentVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

// ─────────────────────────────────────────────────────────────────────────────
//  TeacherGroupDetailClient
// ─────────────────────────────────────────────────────────────────────────────

export function TeacherGroupDetailClient({
  groupId,
}: {
  readonly groupId: string;
}) {
  const locale = useLocale();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<Tab>("Students");
  const [studentPage, setStudentPage] = useState(1);
  const PAGE_SIZE = 20;

  // ── Group details ─────────────────────────────────────────────────────
  const { data: groupRaw, isLoading: groupLoading } = useQuery({
    queryKey: ["groups", groupId],
    queryFn: () =>
      httpClient
        .get<GroupDetailDto>(`/groups/${groupId}`)
        .then((r) => r.data),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1_000,
  });

  // ── Students list (paginated) ─────────────────────────────────────────
  const { data: studentsData, isLoading: studLoading } = useQuery({
    queryKey: ["groups", groupId, "students", studentPage],
    queryFn: () =>
      httpClient
        .get<{ data: StudentListDto[]; total: number }>(
          `/groups/${groupId}/students`,
          { params: { page: studentPage, pageSize: PAGE_SIZE } },
        )
        .then((r) => r.data),
    enabled: !!groupId && activeTab === "Students",
    staleTime: 5 * 60 * 1_000,
  });

  // ── Attendance records ────────────────────────────────────────────────
  const { data: attendanceRaw, isLoading: attendanceLoading } = useQuery({
    queryKey: ["groups", groupId, "attendance"],
    queryFn: () =>
      httpClient.get(`/groups/${groupId}/attendance`).then((r) => r.data),
    enabled: !!groupId && activeTab === "Attendance",
    staleTime: 5 * 60 * 1_000,
  });

  // ── Homework list ─────────────────────────────────────────────────────
  const { data: homework, isLoading: homeworkLoading } = useQuery({
    queryKey: ["groups", groupId, "homework"],
    queryFn: () =>
      httpClient
        .get<HomeworkDto[]>(`/groups/${groupId}/homework`)
        .then((r) => r.data),
    enabled: !!groupId && activeTab === "Homework",
    staleTime: 5 * 60 * 1_000,
  });

  // ── Skeleton while group details load ─────────────────────────────────
  if (groupLoading) {
    return <GroupDetailSkeleton />;
  }

  const group = isGroupDetailDto(groupRaw) ? groupRaw : null;
  const attendanceRecords = isAttendanceResponse(attendanceRaw)
    ? attendanceRaw.records
    : [];
  const studentList: StudentListDto[] = studentsData?.data ?? [];
  const studentTotal: number = studentsData?.total ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-6 pb-8"
    >
      {/* ── Back link ───────────────────────────────────────────────────── */}
      <Link
        href={`/${locale}/teacher/groups`}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)]",
          "hover:text-[var(--text-primary)] transition-colors duration-[var(--transition-fast)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded",
          "min-h-[44px] sm:min-h-auto",
        )}
      >
        <ChevronLeft size={16} aria-hidden="true" />
        Back to Groups
      </Link>

      {/* ── Group header ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
      >
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
          {group?.name ?? "Group Details"}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1">
            <Users size={13} aria-hidden="true" />
            {group?.studentCount ?? 0} students
          </span>
          {group?.courseName !== undefined && (
            <>
              <span className="text-[var(--border-strong)]" aria-hidden="true">
                ·
              </span>
              <span className="flex items-center gap-1">
                <BookOpen size={13} aria-hidden="true" />
                {group.courseName}
              </span>
            </>
          )}
        </p>
      </motion.div>

      {/* ── Tab navigation ──────────────────────────────────────────────── */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── Tab panels ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* STUDENTS tab */}
        {activeTab === "Students" && (
          <motion.div
            key="students"
            id="tabpanel-Students"
            role="tabpanel"
            aria-labelledby="tab-Students"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {isMobile ? (
              <StudentCardList
                students={studentList}
                isLoading={studLoading}
                totalCount={studentTotal}
                page={studentPage}
                pageSize={PAGE_SIZE}
                onPageChange={setStudentPage}
                basePath={`/${locale}/teacher/students`}
              />
            ) : (
              <StudentTable
                data={studentList}
                isLoading={studLoading}
                totalCount={studentTotal}
                page={studentPage}
                pageSize={PAGE_SIZE}
                onPageChange={setStudentPage}
                basePath={`/${locale}/teacher/students`}
              />
            )}
          </motion.div>
        )}

        {/* ATTENDANCE tab */}
        {activeTab === "Attendance" && (
          <motion.div
            key="attendance"
            id="tabpanel-Attendance"
            role="tabpanel"
            aria-labelledby="tab-Attendance"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {attendanceLoading ? (
              <div
                className="h-64 rounded-2xl bg-[var(--bg-surface-secondary)] animate-pulse"
                aria-busy="true"
                aria-label="Loading attendance"
              />
            ) : (
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)]">
                <AttendanceCalendar records={attendanceRecords} />
              </div>
            )}
          </motion.div>
        )}

        {/* HOMEWORK tab */}
        {activeTab === "Homework" && (
          <motion.div
            key="homework"
            id="tabpanel-Homework"
            role="tabpanel"
            aria-labelledby="tab-Homework"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-3"
          >
            {homeworkLoading ? (
              <div className="space-y-3" aria-busy="true" aria-label="Loading homework">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-2xl bg-[var(--bg-surface-secondary)] animate-pulse"
                    aria-hidden="true"
                  />
                ))}
              </div>
            ) : (homework ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(99,102,241,0.10)" }}
                  aria-hidden="true"
                >
                  <BookOpen
                    size={22}
                    className="text-[var(--brand-primary)]"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  No homework assigned yet.
                </p>
              </div>
            ) : (
              <ul className="space-y-3" aria-label="Homework assignments">
                {(homework ?? []).map((hw: HomeworkDto) => (
                  <li key={hw.id}>
                    <Link
                      href={`/${locale}/teacher/homework/${hw.id}`}
                      className={cn(
                        "block rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4",
                        "hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]",
                        "transition-all duration-[var(--transition-base)]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]",
                      )}
                    >
                      <p className="font-semibold text-sm text-[var(--text-primary)]">
                        {hw.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="text-xs text-[var(--text-muted)]">
                          {hw.submissionsCount ?? 0} submissions
                        </span>
                        {hw.dueDate !== undefined && (
                          <>
                            <span
                              className="text-[var(--border-strong)]"
                              aria-hidden="true"
                            >
                              ·
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">
                              Due{" "}
                              {format(new Date(hw.dueDate), "MMM d, yyyy")}
                            </span>
                          </>
                        )}
                        {hw.gradedCount !== undefined && (
                          <>
                            <span
                              className="text-[var(--border-strong)]"
                              aria-hidden="true"
                            >
                              ·
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">
                              {hw.gradedCount} graded
                            </span>
                          </>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
