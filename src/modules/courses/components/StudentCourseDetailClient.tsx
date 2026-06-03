"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { httpClient } from "@/services/api/axios.instance";
import { ModuleList } from "./ModuleList";
import { LessonViewer } from "./LessonViewer";
import { useIsMobile } from "@shared/hooks/useIsMobile";
import type { LessonItem, ModuleWithLessons } from "../types/course.types";
import { mapModuleDto, type ModuleDto } from "../utils/course.mapper";
import { cn } from "@shared/lib/utils";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface StudentCourseDetailClientProps {
  courseId: string;
}

interface CourseDetailResponse {
  name?: string;
  modules?: ModuleDto[];
}

interface ProgressResponse {
  completedLessonIds: string[];
}

export function StudentCourseDetailClient({ courseId }: StudentCourseDetailClientProps) {
  const currentUserQuery = useCurrentUser();
  const user = currentUserQuery.data;
  const isMobile = useIsMobile();
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);
  const [showModules, setShowModules] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["students", user?.id, "courses", courseId, "detail"],
    queryFn: async () => {
      const res = await httpClient.get<CourseDetailResponse>(
        `/students/${user?.id}/courses/${courseId}/detail`
      );
      return res.data;
    },
    enabled: !!user?.id && !!courseId,
  });

  const { data: progressData } = useQuery({
    queryKey: ["students", user?.id, "courses", courseId, "progress"],
    queryFn: async () => {
      const res = await httpClient.get<ProgressResponse>(
        `/students/${user?.id}/courses/${courseId}/progress`
      );
      return res.data;
    },
    enabled: !!user?.id && !!courseId,
  });

  const completedIds = useMemo(
    () => new Set<string>(progressData?.completedLessonIds ?? []),
    [progressData]
  );

  const modules: ModuleWithLessons[] = useMemo(
    () => (data?.modules ?? []).map((m) => mapModuleDto(m, completedIds)),
    [data, completedIds]
  );

  const defaultLesson = useMemo(() => {
    for (const mod of modules) {
      const lesson = mod.lessons.find((l) => !l.isCompleted);
      if (lesson) return lesson;
    }
    return modules[0]?.lessons[0] ?? null;
  }, [modules]);

  const currentLesson = activeLesson ?? defaultLesson;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-xl bg-muted animate-pulse" />
          <div className="h-96 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <Link
        href="/student/courses"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to courses
      </Link>

      <h1 className="text-xl font-semibold">{data?.name}</h1>

      {isMobile && (
        <button
          type="button"
          onClick={() => setShowModules((v) => !v)}
          className="w-full py-2.5 px-4 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
        >
          {showModules ? "Hide" : "Show"} Course Content
        </button>
      )}

      <div className={cn("grid gap-6", isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3")}>
        {(!isMobile || !showModules) && (
          <div className={cn(isMobile ? "" : "lg:col-span-2")}>
            {currentLesson ? (
              <LessonViewer
                lesson={currentLesson}
                courseId={courseId}
                onComplete={() => {
                  const allLessons = modules.flatMap((m) => m.lessons);
                  const idx = allLessons.findIndex((l) => l.id === currentLesson.id);
                  const next = allLessons[idx + 1];
                  if (next) setActiveLesson(next);
                }}
              />
            ) : (
              <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground text-sm">
                Select a lesson to begin.
              </div>
            )}
          </div>
        )}

        {(!isMobile || showModules) && (
          <div>
            <ModuleList
              modules={modules}
              onLessonSelect={(lesson) => {
                setActiveLesson(lesson);
                if (isMobile) setShowModules(false);
              }}
              {...(currentLesson?.id !== undefined ? { activeLessonId: currentLesson.id } : {})}
            />
          </div>
        )}
      </div>
    </div>
  );
}