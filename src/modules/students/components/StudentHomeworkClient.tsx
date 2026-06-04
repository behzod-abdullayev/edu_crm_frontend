"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { httpClient } from "@/services/api/axios.instance";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import Link from "next/link";
import { cn } from "@shared/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeworkSubmissionSummary {
  grade?: number;
  submittedAt?: string;
  teacherFeedback?: string;
}

interface HomeworkDto {
  id: string;
  title: string;
  courseName?: string;
  dueDate?: string;
  maxPoints?: number;
  mySubmission?: HomeworkSubmissionSummary;
}

interface HomeworkListResponse {
  data: HomeworkDto[];
  total: number;
  totalPages?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ["pending", "submitted", "graded"] as const;
type TabType = (typeof TABS)[number];

const PAGE_SIZE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatus(hw: HomeworkDto): TabType {
  const s = hw.mySubmission;
  if (s?.grade !== undefined) return "graded";
  if (s?.submittedAt) return "submitted";
  return "pending";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HomeworkRow({ hw }: { hw: HomeworkDto }) {
  const status = getStatus(hw);
  const dueDate = hw.dueDate ? new Date(hw.dueDate) : null;
  const overdue = dueDate && dueDate < new Date() && status === "pending";

  const badgeVariant =
    status === "graded" ? "success" : status === "submitted" ? "info" : "outline";

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">{hw.courseName ?? "—"}</span>
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/student/homework/${hw.id}`}
          className="font-medium text-sm hover:underline text-foreground"
        >
          {hw.title}
        </Link>
      </td>
      <td className="px-4 py-3">
        {dueDate ? (
          <span className={cn("text-sm", overdue && "text-destructive font-medium")}>
            {formatDate(hw.dueDate!)}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge variant={badgeVariant} className="capitalize">
          {status}
        </Badge>
      </td>
      <td className="px-4 py-3">
        {hw.mySubmission?.grade !== undefined ? (
          <span className="font-semibold text-sm">
            {hw.mySubmission.grade}/{hw.maxPoints ?? "?"}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </td>
    </tr>
  );
}

function HomeworkRowSkeleton() {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: 5 }).map((_, j) => (
        <td key={j} className="px-4 py-3">
          <div className="h-4 rounded bg-muted animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

function HomeworkMobileCard({ hw }: { hw: HomeworkDto }) {
  const status = getStatus(hw);
  const dueDate = hw.dueDate ? new Date(hw.dueDate) : null;
  const badgeVariant =
    status === "graded" ? "success" : status === "submitted" ? "info" : "outline";

  return (
    <Link href={`/student/homework/${hw.id}`}>
      <div className="p-4 bg-card border border-border rounded-xl space-y-2 active:scale-[0.99] transition-transform">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{hw.title}</p>
            <p className="text-xs text-muted-foreground">{hw.courseName ?? ""}</p>
          </div>
          <Badge variant={badgeVariant} className="capitalize text-xs flex-shrink-0">
            {status}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{dueDate ? `Due ${formatDate(hw.dueDate!)}` : ""}</span>
          {hw.mySubmission?.grade !== undefined && (
            <span className="font-semibold text-foreground">
              {hw.mySubmission.grade}/{hw.maxPoints ?? "?"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StudentHomeworkClient() {
  const { data: user } = useCurrentUser();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<TabType>("pending");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<HomeworkListResponse>({
    queryKey: ["students", user?.id, "homework", tab, page],
    queryFn: async () => {
      const res = await httpClient.get<HomeworkListResponse>(
        `/students/${user!.id}/homework`,
        { params: { status: tab, page, pageSize: PAGE_SIZE } },
      );
      return res.data;
    },
    enabled: !!user?.id,
  });

  const rows: HomeworkDto[] = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  function handleTabChange(t: TabType) {
    setTab(t);
    setPage(1);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Homework</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your assignments.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-4">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTabChange(t)}
            className={cn(
              "pb-2 text-sm font-medium border-b-2 capitalize transition-colors",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      {isMobile ? (
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
              ))
            : rows.length === 0
            ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                No {tab} assignments.
              </p>
            )
            : rows.map((hw) => <HomeworkMobileCard key={hw.id} hw={hw} />)}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Course", "Title", "Due", "Status", "Grade"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-medium text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <HomeworkRowSkeleton key={i} />)
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No {tab} assignments.
                  </td>
                </tr>
              ) : (
                rows.map((hw) => <HomeworkRow key={hw.id} hw={hw} />)
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}