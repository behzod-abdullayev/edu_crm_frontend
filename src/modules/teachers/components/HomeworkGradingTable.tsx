"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { useHomeworkGrade } from "@/modules/teachers/hooks/useTeacher";
import { httpClient } from "@/services/api/axios.instance";
import { MobileCardList } from "@shared/components/MobileCardList";
import { SwipeableCard } from "@shared/components/SwipeableCard";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Badge } from "@shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/components/ui/avatar";
import type { HomeworkSubmissionDto } from "@generated/models";
import { cn } from "@shared/lib/utils";
import {
  CheckCircle,
  Clock,
  Star,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeworkGradingTableProps {
  homeworkId: string;
  maxPoints: number;
}

interface InlineGradeState {
  [submissionId: string]: { grade: string; feedback: string };
}

type FilterStatus = "all" | "pending" | "graded" | "late";
type SortField = "name" | "submittedAt" | "grade";
type SortDir = "asc" | "desc";

// ─── Status badge helper ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: HomeworkSubmissionDto["status"] }) {
  const map: Record<
    HomeworkSubmissionDto["status"],
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    pending: { label: "Pending", variant: "secondary" },
    graded: { label: "Graded", variant: "default" },
    late: { label: "Late", variant: "destructive" },
  };
  const cfg = map[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ─── Grade colour ─────────────────────────────────────────────────────────────

function gradeColor(score: number, max: number): string {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.8) return "text-green-600 dark:text-green-400";
  if (pct >= 0.6) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function TableRowSkeleton() {
  return (
    <tr>
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-5 rounded bg-muted animate-[shimmer_1.5s_infinite]" />
        </td>
      ))}
    </tr>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="p-4 space-y-3 border border-border rounded-xl bg-card">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted animate-[shimmer_1.5s_infinite]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-muted animate-[shimmer_1.5s_infinite]" />
          <div className="h-3 w-1/2 rounded bg-muted animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>
      <div className="h-8 rounded bg-muted animate-[shimmer_1.5s_infinite]" />
    </div>
  );
}

// ─── Desktop submission row ───────────────────────────────────────────────────

interface RowProps {
  sub: HomeworkSubmissionDto;
  maxPoints: number;
  gradeState: InlineGradeState;
  saving: Set<string>;
  onUpdate: (id: string, field: "grade" | "feedback", value: string) => void;
  onSave: (id: string) => Promise<void>;
}

function SubmissionRow({ sub, maxPoints, gradeState, saving, onUpdate, onSave }: RowProps) {
  const state = gradeState[sub.id];
  const isSavingThis = saving.has(sub.id);
  const displayGrade = state?.grade ?? (sub.grade !== undefined && sub.grade !== null ? String(sub.grade) : "");
  const displayFeedback = state?.feedback ?? sub.teacherFeedback ?? "";

  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-border hover:bg-muted/30 transition-colors"
    >
      {/* Student */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={sub.studentAvatarUrl ?? undefined} alt={sub.studentName} />
            <AvatarFallback className="text-xs">
              {(sub.studentName ?? "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm truncate max-w-[140px]">{sub.studentName}</span>
        </div>
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={sub.status} />
      </td>
      {/* Submitted at */}
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "—"}
        </span>
      </td>
      {/* Grade input */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            max={maxPoints}
            inputMode="numeric"
            aria-label={`Grade for ${sub.studentName}`}
            value={displayGrade}
            onChange={(e) => onUpdate(sub.id, "grade", e.target.value)}
            className="w-20 h-8 text-sm"
            placeholder={`0–${maxPoints}`}
          />
          {sub.grade !== undefined && sub.grade !== null && !state?.grade && (
            <span className={cn("text-xs font-semibold", gradeColor(sub.grade, maxPoints))}>
              {sub.grade}/{maxPoints}
            </span>
          )}
        </div>
      </td>
      {/* Feedback */}
      <td className="px-4 py-3 min-w-[200px]">
        <textarea
          aria-label={`Feedback for ${sub.studentName}`}
          value={displayFeedback}
          onChange={(e) => onUpdate(sub.id, "feedback", e.target.value)}
          className={cn(
            "w-full min-h-[60px] text-xs border border-border rounded-lg p-2 resize-none",
            "focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-[var(--border-focus)]",
            "bg-background transition-colors",
          )}
          placeholder="Optional feedback…"
        />
      </td>
      {/* Action */}
      <td className="px-4 py-3">
        <Button
          size="sm"
          onClick={() => void onSave(sub.id)}
          disabled={isSavingThis || !state}
          className="h-8 min-w-[64px]"
          aria-label={`Save grade for ${sub.studentName}`}
        >
          {isSavingThis ? (
            <span
              aria-hidden="true"
              className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full"
            />
          ) : (
            "Save"
          )}
        </Button>
      </td>
    </motion.tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HomeworkGradingTable({ homeworkId, maxPoints }: HomeworkGradingTableProps) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const gradeMutation = useHomeworkGrade();

  const [gradeState, setGradeState] = useState<InlineGradeState>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortField, setSortField] = useState<SortField>("submittedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: submissions, isLoading, error, refetch } = useQuery({
    queryKey: ["homework", homeworkId, "submissions"],
    queryFn: () =>
      httpClient
        .get<HomeworkSubmissionDto[]>(`/homework/${homeworkId}/submissions`)
        .then((r) => r.data),
  });

  const updateGradeState = (submissionId: string, field: "grade" | "feedback", value: string) => {
    setGradeState((prev) => ({
      ...prev,
      [submissionId]: {
        ...(prev[submissionId] ?? { grade: "", feedback: "" }),
        [field]: value,
      },
    }));
  };

  const saveGrade = async (submissionId: string) => {
    const state = gradeState[submissionId];
    if (!state) return;
    const grade = Number(state.grade);
    if (isNaN(grade) || grade < 0 || grade > maxPoints) return;

    setSaving((s) => new Set(s).add(submissionId));
    try {
      const saved = await gradeMutation.mutateAsync({
        homeworkId,
        submissionId,
        values: { grade, feedback: state.feedback },
      });
      // Optimistic cache patch — update submission in-place
      queryClient.setQueryData<HomeworkSubmissionDto[]>(
        ["homework", homeworkId, "submissions"],
        (old) =>
          old?.map((s) =>
            s.id === submissionId
              ? { ...s, grade: saved.grade ?? grade, teacherFeedback: saved.teacherFeedback ?? state.feedback, status: "graded" as const }
              : s,
          ) ?? [],
      );
      // Clear local state for this submission
      setGradeState((prev) => {
        const next = { ...prev };
        delete next[submissionId];
        return next;
      });
    } finally {
      setSaving((s) => {
        const next = new Set(s);
        next.delete(submissionId);
        return next;
      });
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  const raw = submissions ?? [];

  const filtered = raw.filter((s) => {
    if (filterStatus === "all") return true;
    return s.status === filterStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === "name") cmp = (a.studentName ?? "").localeCompare(b.studentName ?? "");
    else if (sortField === "submittedAt")
      cmp = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    else if (sortField === "grade") cmp = (a.grade ?? -1) - (b.grade ?? -1);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  // ── Error state ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 py-12 text-center"
      >
        <AlertCircle className="w-8 h-8 text-destructive" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Failed to load submissions.</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  // ── Toolbar ───────────────────────────────────────────────────────────────

  const Toolbar = (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Filter className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
      {(["all", "pending", "graded", "late"] as FilterStatus[]).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setFilterStatus(s)}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize",
            filterStatus === s
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
          aria-pressed={filterStatus === s}
        >
          {s}
          {s !== "all" && (
            <span className="ml-1 opacity-70">
              ({raw.filter((r) => r.status === s).length})
            </span>
          )}
        </button>
      ))}
      <span className="ml-auto text-xs text-muted-foreground">
        {sorted.length} / {raw.length} submission{raw.length !== 1 ? "s" : ""}
      </span>
    </div>
  );

  // ── Mobile ────────────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <div className="space-y-4">
        {Toolbar}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <MobileCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <MobileCardList
            data={sorted}
            isLoading={false}
            renderCard={(sub: HomeworkSubmissionDto) => {
              const state = gradeState[sub.id];
              const isSavingThis = saving.has(sub.id);
              const isExpanded = expandedId === sub.id;

              return (
                <SwipeableCard
                  rightActions={[
                    {
                      icon: Star,
                      label: "Save grade",
                      onClick: () => void saveGrade(sub.id),
                    },
                  ]}
                >
                  <div className="p-4 space-y-3 bg-card border border-border rounded-xl">
                    {/* Header row */}
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarImage src={sub.studentAvatarUrl ?? undefined} alt={sub.studentName} />
                        <AvatarFallback>
                          {(sub.studentName ?? "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{sub.studentName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          {sub.submittedAt ? (
                            <>
                              <CheckCircle
                                className="w-3 h-3 text-green-500 shrink-0"
                                aria-hidden="true"
                              />
                              {new Date(sub.submittedAt).toLocaleString()}
                            </>
                          ) : (
                            <>
                              <Clock
                                className="w-3 h-3 text-amber-500 shrink-0"
                                aria-hidden="true"
                              />
                              Not submitted
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={sub.status} />
                        {sub.grade !== undefined && sub.grade !== null && (
                          <span className={cn("text-sm font-bold", gradeColor(sub.grade, maxPoints))}>
                            {sub.grade}/{maxPoints}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expand / collapse */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" aria-hidden="true" />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" aria-hidden="true" />
                          Grade this submission
                        </>
                      )}
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key="grade-form"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 pt-1">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label
                                  htmlFor={`grade-${sub.id}`}
                                  className="text-xs text-muted-foreground block mb-1"
                                >
                                  Grade (0–{maxPoints})
                                </label>
                                <Input
                                  id={`grade-${sub.id}`}
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  max={maxPoints}
                                  value={state?.grade ?? (sub.grade !== undefined && sub.grade !== null ? String(sub.grade) : "")}
                                  onChange={(e) => updateGradeState(sub.id, "grade", e.target.value)}
                                  className="h-11 text-sm"
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  size="sm"
                                  onClick={() => void saveGrade(sub.id)}
                                  disabled={isSavingThis || !state}
                                  className="w-full h-11"
                                  aria-label={`Save grade for ${sub.studentName}`}
                                >
                                  {isSavingThis ? (
                                    <span
                                      aria-hidden="true"
                                      className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                                    />
                                  ) : (
                                    "Save"
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div>
                              <label
                                htmlFor={`feedback-${sub.id}`}
                                className="text-xs text-muted-foreground block mb-1"
                              >
                                Feedback
                              </label>
                              <textarea
                                id={`feedback-${sub.id}`}
                                value={state?.feedback ?? sub.teacherFeedback ?? ""}
                                onChange={(e) => updateGradeState(sub.id, "feedback", e.target.value)}
                                className={cn(
                                  "w-full min-h-[72px] text-xs border border-border rounded-lg p-2 resize-none bg-background",
                                  "focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-[var(--border-focus)] transition-colors",
                                )}
                                placeholder="Optional feedback…"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </SwipeableCard>
              );
            }}
            emptyState={{
              title: "No submissions yet",
              description: "Students haven't submitted anything for this homework.",
            }}
          />
        )}
      </div>
    );
  }

  // ── Desktop ───────────────────────────────────────────────────────────────

  function SortHeader({ field, label }: { field: SortField; label: string }) {
    const active = sortField === field;
    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1 text-left font-medium text-muted-foreground hover:text-foreground transition-colors text-sm"
        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ChevronUp className="w-3 h-3" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-3 h-3" aria-hidden="true" />
          )
        ) : (
          <span className="w-3 h-3 opacity-30">↕</span>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {Toolbar}

      <div
        role="region"
        aria-label="Homework submissions"
        className="overflow-x-auto rounded-xl border border-border"
      >
        <table className="w-full text-sm" aria-label="Homework grading table">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              <th className="text-left px-4 py-3" scope="col">
                <SortHeader field="name" label="Student" />
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground" scope="col">
                Status
              </th>
              <th className="text-left px-4 py-3" scope="col">
                <SortHeader field="submittedAt" label="Submitted" />
              </th>
              <th className="text-left px-4 py-3" scope="col">
                <SortHeader field="grade" label={`Grade (/${maxPoints})`} />
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground" scope="col">
                Feedback
              </th>
              <th className="px-4 py-3" scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [1, 2, 3, 4].map((i) => <TableRowSkeleton key={i} />)
              : sorted.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No submissions match the current filter.
                  </td>
                </tr>
              )
              : sorted.map((sub, idx) => (
                  <motion.tr
                    key={sub.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx, 9) * 0.05, duration: 0.2 }}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={sub.studentAvatarUrl ?? undefined} alt={sub.studentName} />
                          <AvatarFallback className="text-xs">
                            {(sub.studentName ?? "?").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium truncate max-w-[140px]">{sub.studentName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={maxPoints}
                          aria-label={`Grade for ${sub.studentName}`}
                          value={gradeState[sub.id]?.grade ?? (sub.grade !== undefined && sub.grade !== null ? String(sub.grade) : "")}
                          onChange={(e) => updateGradeState(sub.id, "grade", e.target.value)}
                          className="w-20 h-8 text-sm"
                          placeholder={`0–${maxPoints}`}
                        />
                        {sub.grade !== undefined && sub.grade !== null && !gradeState[sub.id]?.grade && (
                          <span className={cn("text-xs font-semibold", gradeColor(sub.grade, maxPoints))}>
                            /{maxPoints}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 min-w-[200px]">
                      <textarea
                        aria-label={`Feedback for ${sub.studentName}`}
                        value={gradeState[sub.id]?.feedback ?? sub.teacherFeedback ?? ""}
                        onChange={(e) => updateGradeState(sub.id, "feedback", e.target.value)}
                        className={cn(
                          "w-full min-h-[60px] text-xs border border-border rounded-lg p-2 resize-none bg-background",
                          "focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-[var(--border-focus)] transition-colors",
                        )}
                        placeholder="Optional feedback…"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        onClick={() => void saveGrade(sub.id)}
                        disabled={saving.has(sub.id) || !gradeState[sub.id]}
                        className="h-8 min-w-[64px]"
                        aria-label={`Save grade for ${sub.studentName}`}
                      >
                        {saving.has(sub.id) ? (
                          <span
                            aria-hidden="true"
                            className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                          />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
