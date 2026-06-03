"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { useIsMobile } from "@shared/hooks/useIsMobile";

export interface GradeDto {
  id: string;
  grade: number;
  maxGrade: number;
  homeworkId?: string;
  examId?: string;
  courseName?: string;
  gradedAt?: string;
  feedback?: string;
}

export interface CourseGradesSummaryDto {
  courseId: string;
  courseName: string;
  averageScore: number;
  grades: GradeDto[];
}

interface GradesListProps {
  summaries: CourseGradesSummaryDto[];
  className?: string;
}

function getPct(grade: GradeDto): number | null {
  if (!grade.maxGrade) return null;
  return Math.round((grade.grade / grade.maxGrade) * 100);
}

function GradeRow({ grade }: { grade: GradeDto }) {
  const pct = getPct(grade);
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3">
        <span className="font-medium text-sm">{grade.homeworkId ? "Homework" : grade.examId ? "Exam" : "Grade"}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">{grade.courseName ?? "—"}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold tabular-nums text-sm">{grade.grade}/{grade.maxGrade}</span>
          {pct !== null && (
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full font-medium",
              pct >= 80
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : pct >= 60
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {pct}%
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString() : "—"}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground line-clamp-2">{grade.feedback ?? "—"}</span>
      </td>
    </tr>
  );
}

function GradeMobileItem({ grade }: { grade: GradeDto }) {
  const pct = getPct(grade);
  const label = grade.homeworkId ? "Homework" : grade.examId ? "Exam" : "Grade";
  return (
    <div className="p-4 space-y-1 border-b border-border last:border-0">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{label}</span>
        <span className={cn(
          "text-sm font-bold",
          pct !== null && pct >= 80 ? "text-green-600"
            : pct !== null && pct >= 60 ? "text-amber-600"
            : "text-red-600"
        )}>
          {grade.grade}/{grade.maxGrade}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{grade.courseName ?? "—"}</span>
        <span className="text-xs text-muted-foreground">
          {grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString() : "—"}
        </span>
      </div>
      {grade.feedback && (
        <p className="text-xs text-muted-foreground line-clamp-2 pt-1">{grade.feedback}</p>
      )}
    </div>
  );
}

export function GradesList({ summaries, className }: GradesListProps) {
  const isMobile = useIsMobile();
  const [openCourses, setOpenCourses] = useState<Set<string>>(new Set());

  const toggleCourse = (courseId: string) => {
    setOpenCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {summaries.map((summary) => {
        const isOpen = openCourses.has(summary.courseId);
        const avg = summary.averageScore;

        return (
          <div key={summary.courseId} className="rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCourse(summary.courseId)}
              className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors text-left"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                {isOpen
                  ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                <span className="font-semibold text-sm">{summary.courseName}</span>
                <span className="text-xs text-muted-foreground">{summary.grades.length} items</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Average:</span>
                <span className={cn(
                  "text-sm font-bold tabular-nums",
                  avg >= 80 ? "text-green-600" : avg >= 60 ? "text-amber-600" : "text-red-600"
                )}>
                  {avg.toFixed(1)}%
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                {isMobile ? (
                  <div className="divide-y divide-border">
                    {summary.grades.map((grade) => (
                      <GradeMobileItem key={grade.id} grade={grade} />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30">
                        <tr>
                          {["Item", "Course", "Score", "Date", "Feedback"].map((h) => (
                            <th key={h} className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {summary.grades.map((grade) => (
                          <GradeRow key={grade.id} grade={grade} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}