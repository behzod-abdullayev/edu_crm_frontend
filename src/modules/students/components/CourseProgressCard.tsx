"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@shared/lib/utils";

interface CourseEnrollment {
  courseId: string;
  courseName?: string;
  progressPercent?: number;
  nextLessonTitle?: string;
  thumbnailUrl?: string;
}

interface CourseProgressCardProps {
  enrollment: CourseEnrollment;
  className?: string;
}

export function CourseProgressCard({ enrollment, className }: CourseProgressCardProps) {
  const progress = Math.round(enrollment.progressPercent ?? 0);
  // Fix: courseName may be undefined — provide fallback before indexing
  const initial = enrollment.courseName ? enrollment.courseName[0]?.toUpperCase() ?? "?" : "?";

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card overflow-hidden",
        "hover:border-primary/40 hover:shadow-md transition-all duration-300",
        "animate-in fade-in slide-in-from-bottom-2 duration-400",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-28 w-full bg-muted overflow-hidden">
        {enrollment.thumbnailUrl ? (
          <Image
            src={enrollment.thumbnailUrl}
            alt={enrollment.courseName ?? ""}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-3xl font-bold text-primary/40">{initial}</span>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-semibold text-foreground">
          {progress}%
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-medium text-sm leading-snug line-clamp-2 text-foreground">
            {enrollment.courseName}
          </h3>
          {enrollment.nextLessonTitle && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Next: {enrollment.nextLessonTitle}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Link
          href={`/student/courses/${enrollment.courseId}`}
          className={cn(
            "block w-full text-center text-xs font-medium py-1.5 px-3 rounded-lg",
            "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground",
            "transition-colors duration-200"
          )}
        >
          {progress === 0 ? "Start Course" : progress === 100 ? "Review" : "Continue"}
        </Link>
      </div>
    </div>
  );
}