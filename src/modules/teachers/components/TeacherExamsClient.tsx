"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  GraduationCap,
  CalendarClock,
  Clock,
  Users,
} from "lucide-react";
import { format } from "date-fns";

import { httpClient } from "@/services/api/axios.instance";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { useFeatureFlag } from "@shared/hooks/useFeatureFlag";
import { useSocketEvent } from "@shared/hooks/useWebSocket";
import { ExamCreator } from "./ExamCreator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { MobileBottomSheet } from "@shared/components/MobileBottomSheet";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@shared/components/ui/badge";
import {
  SocketEvent,
  type ExamStartedPayload,
} from "@/services/websocket/socket.events";
import type { ExamDto } from "@generated/models";

// ─── Status badge variant mapping ─────────────────────────────────────────────
type BadgeVariant = "default" | "warning" | "destructive" | "outline";

function getStatusVariant(status: ExamDto["status"]): BadgeVariant {
  switch (status) {
    case "active":
      return "destructive";
    case "completed":
      return "default";
    case "cancelled":
      return "warning";
    default:
      return "outline";
  }
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function ExamSkeleton({ index }: { readonly index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="h-[72px] rounded-2xl bg-[var(--bg-surface-secondary)] animate-pulse"
      aria-hidden="true"
    />
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function ExamsEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 gap-4 text-center"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: "rgba(99,102,241,0.10)" }}
        aria-hidden="true"
      >
        <GraduationCap
          size={26}
          className="text-[var(--brand-primary)]"
          aria-hidden="true"
        />
      </div>
      <div>
        <p className="font-semibold text-[var(--text-primary)]">
          No exams yet
        </p>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Create your first exam to get started.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Feature disabled state ───────────────────────────────────────────────────
function ExamFeatureDisabled() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center py-20 gap-3"
      role="status"
      aria-live="polite"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: "rgba(148,163,184,0.10)" }}
        aria-hidden="true"
      >
        <GraduationCap
          size={24}
          className="text-[var(--text-muted)]"
          aria-hidden="true"
        />
      </div>
      <p className="text-sm text-[var(--text-muted)] text-center max-w-xs">
        Exam engine is not enabled for your organisation.
        <br />
        Contact your administrator to enable this feature.
      </p>
    </motion.div>
  );
}

// ─── Stagger animation variants ───────────────────────────────────────────────
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  TeacherExamsClient
// ─────────────────────────────────────────────────────────────────────────────

export function TeacherExamsClient() {
  const { user } = useCurrentUser();
  const teacherId = user?.teacherId ?? "";
  const isMobile = useIsMobile();
  const examEnabled = useFeatureFlag("examEngine");
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const examsQueryKey = ["teachers", teacherId, "exams"] as const;

  // ── Exams list ─────────────────────────────────────────────────────────
  const { data: exams, isLoading } = useQuery({
    queryKey: examsQueryKey,
    queryFn: () =>
      httpClient
        .get<ExamDto[]>(`/teachers/${teacherId}/exams`)
        .then((r) => r.data),
    enabled: !!teacherId && examEnabled,
    staleTime: 5 * 60 * 1_000,
  });

  // ── WebSocket: exam started → invalidate list ─────────────────────────
  useSocketEvent(
    SocketEvent.EXAM_STARTED,
    (_payload: ExamStartedPayload) => {
      void queryClient.invalidateQueries({ queryKey: examsQueryKey });
    },
    !!teacherId && examEnabled,
  );

  // ── Feature gate ───────────────────────────────────────────────────────
  if (!examEnabled) {
    return <ExamFeatureDisabled />;
  }

  // ── Create form (shared between Dialog and BottomSheet) ────────────────
  const createForm = (
    <ExamCreator
      onSuccess={() => setShowCreate(false)}
      onCancel={() => setShowCreate(false)}
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-6 pb-8"
    >
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(139,92,246,0.12)" }}
            aria-hidden="true"
          >
            <GraduationCap
              size={20}
              className="text-[var(--brand-accent)]"
              aria-hidden="true"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
              Exams
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Manage and schedule exams for your groups.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          className="gap-2 shrink-0 min-h-[44px] sm:min-h-[36px]"
          onClick={() => setShowCreate(true)}
          aria-label="Create new exam"
        >
          <Plus size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Create Exam</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* ── Exam list ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <div
          className="space-y-3"
          aria-busy="true"
          aria-label="Loading exams"
        >
          {[0, 1, 2].map((i) => (
            <ExamSkeleton key={i} index={i} />
          ))}
        </div>
      ) : (exams ?? []).length === 0 ? (
        <ExamsEmptyState />
      ) : (
        <motion.ul
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
          aria-label="Exam list"
        >
          <AnimatePresence initial={false}>
            {(exams ?? []).map((exam: ExamDto) => {
              const scheduledDate = exam.scheduledAt
                ? format(new Date(exam.scheduledAt), "MMM d, yyyy · h:mm a")
                : "—";

              return (
                <motion.li
                  key={exam.id}
                  variants={rowVariants}
                  layout
                  className={[
                    "rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]",
                    "p-4 flex items-center justify-between gap-4",
                    "shadow-[var(--shadow-sm)]",
                    "hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]",
                    "transition-all duration-[var(--transition-base)]",
                  ].join(" ")}
                >
                  {/* Left: icon + text */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
                      style={{ backgroundColor: "rgba(139,92,246,0.10)" }}
                      aria-hidden="true"
                    >
                      <GraduationCap
                        size={16}
                        className="text-[var(--brand-accent)]"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
                        {exam.title}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {exam.groupName !== undefined && (
                          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <Users size={11} aria-hidden="true" />
                            {exam.groupName}
                          </span>
                        )}
                        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                          <CalendarClock size={11} aria-hidden="true" />
                          {scheduledDate}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                          <Clock size={11} aria-hidden="true" />
                          {exam.durationMinutes} min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: status badge */}
                  <Badge
                    variant={getStatusVariant(exam.status)}
                    className="capitalize shrink-0 text-xs"
                    aria-label={`Status: ${exam.status}`}
                  >
                    {exam.status}
                  </Badge>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      )}

      {/* ── Create exam — Desktop: Dialog / Mobile: BottomSheet ─────────── */}
      {isMobile ? (
        <MobileBottomSheet
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="Create Exam"
        >
          {createForm}
        </MobileBottomSheet>
      ) : (
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Exam</DialogTitle>
            </DialogHeader>
            {createForm}
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
