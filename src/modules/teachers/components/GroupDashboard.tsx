"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Users, Calendar, BookOpen, ChevronRight } from "lucide-react";
import { Badge } from "@shared/components/ui/badge";
import type { GroupDto } from "@generated/models";
import { cn } from "@shared/lib/utils";

interface GroupDashboardProps {
  group: GroupDto;
  className?: string;
}

export function GroupDashboard({ group, className }: GroupDashboardProps) {
  const locale = useLocale();
  const isActive = group.status === "active";

  return (
    <Link
      href={`/${locale}/teacher/groups/${group.id}`}
      className="block group"
    >
      <div
        className={cn(
          "rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-4",
          "hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)] transition-all duration-300",
          "animate-in fade-in slide-in-from-bottom-2 duration-400",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-base leading-snug truncate text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">
              {group.name}
            </h3>
            {group.courseName !== undefined && group.courseName !== null && (
              <p className="text-sm text-[var(--text-secondary)] mt-0.5 truncate">
                {group.courseName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant={isActive ? "success" : "default"}
              className="capitalize"
            >
              {group.status ?? "active"}
            </Badge>
            <ChevronRight
              className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[var(--bg-surface-secondary)]">
            <Users
              className="w-4 h-4 text-[var(--brand-primary)]"
              aria-hidden="true"
            />
            <span className="text-base font-bold tabular-nums text-[var(--text-primary)]">
              {group.studentCount ?? 0}
            </span>
            <span className="text-xs text-[var(--text-muted)]">Students</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[var(--bg-surface-secondary)]">
            <BookOpen
              className="w-4 h-4 text-[var(--info-solid)]"
              aria-hidden="true"
            />
            <span className="text-base font-bold tabular-nums text-[var(--text-primary)]">
              {group.lessonCount ?? 0}
            </span>
            <span className="text-xs text-[var(--text-muted)]">Lessons</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[var(--bg-surface-secondary)]">
            <Calendar
              className="w-4 h-4 text-[var(--warning-solid)]"
              aria-hidden="true"
            />
            <span className="text-base font-bold tabular-nums text-[var(--text-primary)]">
              {group.sessionsPerWeek ?? 0}
            </span>
            <span className="text-xs text-[var(--text-muted)]">Per week</span>
          </div>
        </div>

        {/* Next class */}
        {group.nextClassAt !== undefined && group.nextClassAt !== null && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-surface-secondary)] rounded-lg px-3 py-2">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span>
              Next class:{" "}
              <span className="font-medium text-[var(--text-primary)]">
                {new Date(group.nextClassAt).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
