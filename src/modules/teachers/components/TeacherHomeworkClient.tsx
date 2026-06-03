"use client";

import { useState } from "react";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useTeacherHomework } from "@/modules/teachers/hooks/useTeacher";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { MobileCardList } from "@shared/components/MobileCardList";
import { Button } from "@shared/components/ui/button";
import Link from "next/link";
import { Plus, FileText, Calendar, CheckSquare } from "lucide-react";
import type { HomeworkDto } from "@generated/models";

function HomeworkRow({ hw }: { hw: HomeworkDto }) {
  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <Link
          href={`/teacher/homework/${hw.id}`}
          className="font-medium text-sm hover:underline text-foreground"
        >
          {hw.title}
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">{hw.groupName ?? "—"}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : "—"}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm tabular-nums">{hw.submissionsCount ?? 0}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm tabular-nums">{hw.gradedCount ?? 0}</span>
      </td>
    </tr>
  );
}

export function TeacherHomeworkClient() {
  const { data: user } = useCurrentUser();
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTeacherHomework(user?.id ?? "", { page, pageSize: 20 });

  const rows = data?.data ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Homework</h1>
          <p className="text-muted-foreground text-sm mt-1">Assignments you&apos;ve created.</p>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link href="/teacher/homework/create">
            <Plus className="w-4 h-4" />Create
          </Link>
        </Button>
      </div>

      {isMobile ? (
        <MobileCardList
          data={rows}
          isLoading={isLoading}
          hasMore={page < (data?.totalPages ?? 1)}
          onLoadMore={() => setPage((p) => p + 1)}
          emptyState={{
            title: "No homework yet",
            description: "Create your first assignment.",
          }}
          renderCard={(hw: HomeworkDto) => (
            <Link href={`/teacher/homework/${hw.id}`}>
              <div className="p-4 bg-card border border-border rounded-xl space-y-2 hover:border-primary/30 transition-colors active:scale-[0.99]">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="font-semibold text-sm leading-snug">{hw.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{hw.groupName ?? "—"}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-3 h-3" />
                    {hw.submissionsCount ?? 0} / {hw.gradedCount ?? 0} graded
                  </span>
                </div>
              </div>
            </Link>
          )}
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Title", "Group", "Due", "Submissions", "Graded"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-muted animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((hw) => <HomeworkRow key={hw.id} hw={hw} />)}
            </tbody>
          </table>

          {/* Pagination */}
          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Page {page} of {data?.totalPages}
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
                  disabled={page >= (data?.totalPages ?? 1)}
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
