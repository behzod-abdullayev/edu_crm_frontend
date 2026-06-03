"use client";

import Link from "next/link";
import { Users, Calendar, BookOpen, ChevronRight } from "lucide-react";
import { Badge } from "@shared/components/ui/badge";
import type { GroupDto } from "@generated/models";
import { cn } from "@shared/lib/utils";

interface GroupDashboardProps {
  group: GroupDto;
  className?: string;
}

export function GroupDashboard({ group, className }: GroupDashboardProps) {
  const isActive = group.status === "active";

  return (
    <Link href={`/teacher/groups/${group.id}`} className="block group">
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-5 space-y-4",
          "hover:border-primary/40 hover:shadow-md transition-all duration-300",
          "animate-in fade-in slide-in-from-bottom-2 duration-400",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-base leading-snug truncate group-hover:text-primary transition-colors">
              {group.name}
            </h3>
            {group.courseName && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{group.courseName}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={isActive ? "default" : "outline"} className="capitalize">
              {group.status ?? "active"}
            </Badge>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-base font-bold tabular-nums">{group.studentCount ?? 0}</span>
            <span className="text-xs text-muted-foreground">Students</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
            <BookOpen className="w-4 h-4 text-blue-500" />
            <span className="text-base font-bold tabular-nums">{group.lessonCount ?? 0}</span>
            <span className="text-xs text-muted-foreground">Lessons</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span className="text-base font-bold tabular-nums">{group.sessionsPerWeek ?? 0}</span>
            <span className="text-xs text-muted-foreground">Per week</span>
          </div>
        </div>

        {/* Next class */}
        {group.nextClassAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Next class:{" "}
              <span className="font-medium text-foreground">
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
