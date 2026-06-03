"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Play, FileText, HelpCircle, Lock } from "lucide-react";
import type { ModuleWithLessons, LessonItem } from "../types/course.types";
import { cn } from "@shared/lib/utils";

interface ModuleListProps {
  modules: ModuleWithLessons[];
  onLessonSelect?: (lesson: LessonItem) => void;
  activeLessonId?: string;
  className?: string;
}

const LESSON_ICONS: Record<LessonItem["type"], React.ReactNode> = {
  video: <Play className="w-3.5 h-3.5" />,
  pdf: <FileText className="w-3.5 h-3.5" />,
  text: <FileText className="w-3.5 h-3.5" />,
  quiz: <HelpCircle className="w-3.5 h-3.5" />,
};

export function ModuleList({ modules, onLessonSelect, activeLessonId, className }: ModuleListProps) {
  const [openModules, setOpenModules] = useState<Set<string>>(() => {
    // Open the first incomplete module by default
    const first = modules.find((m) => m.lessons.some((l) => !l.isCompleted));
    return new Set(first ? [first.id] : modules[0] ? [modules[0].id] : []);
  });

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      {modules.map((mod) => {
        const isOpen = openModules.has(mod.id);
        const completedCount = mod.lessons.filter((l) => l.isCompleted).length;
        const totalCount = mod.lessons.length;
        const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

        return (
          <div key={mod.id} className="rounded-xl border border-border overflow-hidden">
            {/* Module header */}
            <button
              type="button"
              onClick={() => toggleModule(mod.id)}
              className="w-full flex items-center gap-3 p-4 bg-muted/50 hover:bg-muted transition-colors text-left"
            >
              <div className="flex-shrink-0">
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{mod.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {completedCount}/{totalCount} completed
                </p>
              </div>
              {/* Module progress ring */}
              <div className="relative w-8 h-8 flex-shrink-0">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 12}`}
                    strokeDashoffset={`${2 * Math.PI * 12 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">
                  {progress}%
                </span>
              </div>
            </button>

            {/* Lessons */}
            {isOpen && (
              <div className="animate-in slide-in-from-top-1 fade-in duration-200 divide-y divide-border">
                {mod.lessons.map((lesson) => {
                  const isActive = lesson.id === activeLessonId;
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => onLessonSelect?.(lesson)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                        isActive ? "bg-primary/10" : "hover:bg-muted/50"
                      )}
                    >
                      {/* Completion indicator */}
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                        lesson.isCompleted ? "bg-green-500/15 text-green-600" : isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {lesson.isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          LESSON_ICONS[lesson.type]
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm truncate", isActive ? "font-semibold text-primary" : "font-medium text-foreground")}>
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground capitalize">{lesson.type}</span>
                          {lesson.durationMinutes && (
                            <>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">{lesson.durationMinutes} min</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
