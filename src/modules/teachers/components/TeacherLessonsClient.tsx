"use client";

import { useState } from "react";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useTeacherLessons } from "@/modules/teachers/hooks/useTeacher";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import { MobileCardList } from "@shared/components/MobileCardList";
import { Button } from "@shared/components/ui/button";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import type { LessonDto } from "@generated/models";

function LessonRow({ lesson }: { lesson: LessonDto }) {
  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <span className="font-medium text-sm">{lesson.title}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">{lesson.groupName ?? "—"}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground capitalize">{lesson.type ?? "—"}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString() : "—"}
        </span>
      </td>
    </tr>
  );
}

export function TeacherLessonsClient() {
  const { data: user } = useCurrentUser();
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTeacherLessons(user?.id ?? "", { page });

  const rows = data?.data ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lessons</h1>
          <p className="text-muted-foreground text-sm mt-1">Uploaded lesson materials.</p>
        </div>
        <Button asChild size="sm" className="gap-2">
          <Link href="/teacher/lessons/upload">
            <Plus className="w-4 h-4" />Upload
          </Link>
        </Button>
      </div>

      {isMobile ? (
        <MobileCardList
          data={rows}
          isLoading={isLoading}
          hasMore={page < (data?.totalPages ?? 1)}
          onLoadMore={() => setPage((p) => p + 1)}
          emptyState={{ title: "No lessons yet", description: "Upload your first lesson." }}
          renderCard={(lesson: LessonDto) => (
            <div className="p-4 bg-card border border-border rounded-xl space-y-2 active:scale-[0.99] transition-transform">
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="font-semibold text-sm leading-snug">{lesson.title}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{lesson.groupName ?? "—"}</span>
                {lesson.type && (
                  <>
                    <span>·</span>
                    <span className="capitalize">{lesson.type}</span>
                  </>
                )}
                {lesson.createdAt && (
                  <>
                    <span>·</span>
                    <span>{new Date(lesson.createdAt).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          )}
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Title", "Group", "Type", "Uploaded"].map((h) => (
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
                      {Array.from({ length: 4 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-muted animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((l) => <LessonRow key={l.id} lesson={l} />)}
            </tbody>
          </table>

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
