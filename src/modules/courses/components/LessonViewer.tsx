"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/services/api/axios.instance";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { Button } from "@shared/components/ui/button";
import { CheckCircle2, Download, ExternalLink } from "lucide-react";
import type { LessonItem } from "../types/course.types";
import { cn } from "@shared/lib/utils";

interface LessonViewerProps {
  lesson: LessonItem;
  courseId: string;
  onComplete?: () => void;
  className?: string;
}

export function LessonViewer({ lesson, courseId, onComplete, className }: LessonViewerProps) {
  const currentUserQuery = useCurrentUser();
  const user = currentUserQuery.data;
  const queryClient = useQueryClient();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);

  useEffect(() => {
    if (!lesson.fileKey) { setSignedUrl(null); return; }
    let stale = false;
    setUrlLoading(true);
    httpClient
      .get<{ url: string; expiresAt: string }>(`/files/${lesson.fileKey}/signed-url`)
      .then((res) => { if (!stale) setSignedUrl(res.data.url); })
      .catch(() => { if (!stale) setSignedUrl(null); })
      .finally(() => { if (!stale) setUrlLoading(false); });

    const interval = setInterval(() => {
      httpClient
        .get<{ url: string }>(`/files/${lesson.fileKey}/signed-url`)
        .then((res) => { if (!stale) setSignedUrl(res.data.url); })
        .catch(() => { /* silent refresh failure */ });
    }, 9 * 60 * 1000);

    return () => { stale = true; clearInterval(interval); };
  }, [lesson.fileKey]);

  const completeMutation = useMutation({
    mutationFn: () =>
      httpClient.post(`/students/${user?.id}/courses/${courseId}/lessons/${lesson.id}/complete`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["students", user?.id, "courses", courseId] });
      onComplete?.();
    },
  });

  const renderContent = () => {
    if (urlLoading) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <span className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    switch (lesson.type) {
      case "video": {
        const src = lesson.videoUrl ?? signedUrl;
        if (!src) return <EmptyState message="Video not available." />;
        if (src.includes("youtube.com") || src.includes("youtu.be")) {
          const videoId = src.includes("youtu.be")
            ? src.split("youtu.be/")[1]?.split("?")[0]
            : new URL(src).searchParams.get("v");
          return (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0`}
              className="w-full aspect-video rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              allowFullScreen
              title={lesson.title}
            />
          );
        }
        return (
          <video
            src={src}
            controls
            className="w-full rounded-lg bg-black max-h-[480px]"
            onEnded={() => { if (!lesson.isCompleted) completeMutation.mutate(); }}
          />
        );
      }

      case "pdf": {
        const src = signedUrl;
        if (!src) return <EmptyState message="PDF not available." />;
        return (
          <div className="space-y-3">
            <iframe
              src={`${src}#toolbar=1`}
              className="w-full rounded-lg border border-border"
              style={{ height: "min(calc(100vh - 16rem), 640px)" }}
              title={lesson.title}
            />
            <div className="flex gap-2">
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in new tab
              </a>
              <a
                href={src}
                download
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </div>
          </div>
        );
      }

      case "text":
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border border-border bg-card p-6">
            <p className="text-muted-foreground text-sm italic">Text lesson content is rendered from the lesson body.</p>
          </div>
        );

      default:
        return <EmptyState message="Unsupported lesson type." />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h2 className="font-semibold text-lg leading-tight">{lesson.title}</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground capitalize">
          <span>{lesson.type}</span>
          {lesson.durationMinutes && <><span>·</span><span>{lesson.durationMinutes} min</span></>}
          {lesson.isCompleted && (
            <span className="flex items-center gap-1 text-green-600 font-medium ml-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </span>
          )}
        </div>
      </div>

      <div className="animate-in fade-in duration-300">{renderContent()}</div>

      {!lesson.isCompleted && lesson.type !== "video" && (
        <div className="flex justify-end">
          <Button
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
            variant="outline"
            className="gap-2"
          >
            {completeMutation.isPending ? (
              <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Mark as Complete
          </Button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="w-full py-16 flex items-center justify-center rounded-lg border border-border bg-muted/30">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}