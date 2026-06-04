'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { httpClient } from '@/services/api/axios.instance';
import { queryKeys } from '@/services/query/keys.factory';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { useToast } from '@shared/hooks/useToast';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';
import type { LessonItem } from '../types/course.types';

// ─── Signed-URL refresh interval: 9 min (expires at 15 min) ──────────────────

const SIGNED_URL_REFRESH_MS = 9 * 60 * 1_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('?')[0] ?? null;
    }
    return parsed.searchParams.get('v');
  } catch {
    return null;
  }
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ContentSkeleton() {
  return (
    <div
      className="w-full aspect-video rounded-xl bg-[var(--bg-surface-hover)] flex items-center justify-center"
      aria-busy="true"
      aria-label="Loading lesson content"
    >
      <Loader2
        className="w-8 h-8 text-[var(--text-muted)] animate-spin"
        aria-hidden="true"
      />
    </div>
  );
}

interface EmptyStateProps {
  message: string;
}

function EmptyState({ message }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'w-full py-16 flex flex-col items-center justify-center gap-3',
        'rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-secondary)]',
      )}
      role="status"
    >
      <AlertCircle
        className="w-8 h-8 text-[var(--text-muted)]"
        aria-hidden="true"
      />
      <p className="text-sm text-[var(--text-muted)]">{message}</p>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LessonViewerProps {
  lesson: LessonItem;
  courseId: string;
  onComplete?: () => void;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LessonViewer({
  lesson,
  courseId,
  onComplete,
  className,
}: LessonViewerProps) {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState(false);

  // ── Fetch & auto-refresh signed URL ──────────────────────────────────────

  useEffect(() => {
    if (!lesson.fileKey) {
      setSignedUrl(null);
      setUrlError(false);
      return;
    }

    let cancelled = false;

    const fetchUrl = async () => {
      setUrlLoading(true);
      setUrlError(false);
      try {
        const res = await httpClient.get<{ url: string; expiresAt: string }>(
          `/files/${lesson.fileKey}/signed-url`,
        );
        if (!cancelled) setSignedUrl(res.data.url);
      } catch {
        if (!cancelled) {
          setSignedUrl(null);
          setUrlError(true);
        }
      } finally {
        if (!cancelled) setUrlLoading(false);
      }
    };

    void fetchUrl();

    // Refresh before expiry
    const interval = setInterval(() => {
      void httpClient
        .get<{ url: string }>(`/files/${lesson.fileKey}/signed-url`)
        .then((res) => {
          if (!cancelled) setSignedUrl(res.data.url);
        })
        .catch(() => {
          // silent refresh failure — user still has the current URL for now
        });
    }, SIGNED_URL_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [lesson.fileKey]);

  // ── Complete mutation ─────────────────────────────────────────────────────

  const completeMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!user?.id) return;
      await httpClient.post(
        `/students/${user.id}/courses/${courseId}/lessons/${lesson.id}/complete`,
      );
    },
    onSuccess: () => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.students.courses(user.id),
        });
      }
      toast.success('Lesson marked as complete!');
      onComplete?.();
    },
    onError: () => {
      toast.error('Failed to mark lesson as complete. Please try again.');
    },
  });

  const handleMarkComplete = useCallback(() => {
    completeMutation.mutate();
  }, [completeMutation]);

  const handleVideoEnded = useCallback(() => {
    if (!lesson.isCompleted) {
      completeMutation.mutate();
    }
  }, [lesson.isCompleted, completeMutation]);

  // ── Content renderer ──────────────────────────────────────────────────────

  const renderContent = () => {
    if (urlLoading) return <ContentSkeleton />;

    switch (lesson.type) {
      case 'video': {
        const src = lesson.videoUrl ?? signedUrl;

        if (!src) {
          return (
            <EmptyState
              message={
                urlError
                  ? 'Video could not be loaded. Please try again.'
                  : 'Video not available.'
              }
            />
          );
        }

        if (isYouTubeUrl(src)) {
          const videoId = extractYouTubeId(src);
          if (!videoId) return <EmptyState message="Invalid YouTube URL." />;
          return (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              className="w-full aspect-video rounded-xl border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={lesson.title}
              aria-label={`Video: ${lesson.title}`}
            />
          );
        }

        return (
          <video
            src={src}
            controls
            onEnded={handleVideoEnded}
            className="w-full rounded-xl bg-black max-h-[480px] focus-visible:outline-[var(--border-focus)]"
            aria-label={`Video: ${lesson.title}`}
          >
            <track kind="captions" label="Captions" default />
            Your browser does not support HTML5 video.
          </video>
        );
      }

      case 'pdf': {
        if (!signedUrl) {
          return (
            <EmptyState
              message={
                urlError
                  ? 'PDF could not be loaded. Please try again.'
                  : 'PDF not available.'
              }
            />
          );
        }

        return (
          <div className="space-y-3">
            <iframe
              src={`${signedUrl}#toolbar=1&navpanes=0`}
              className="w-full rounded-xl border border-[var(--border-default)] h-[min(calc(100vh-16rem),640px)]"
              title={lesson.title}
              aria-label={`PDF document: ${lesson.title}`}
            />
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]',
                  'hover:text-[var(--text-primary)] transition-colors duration-[var(--transition-fast)]',
                  'min-h-[44px] sm:min-h-0 focus-visible:outline-[var(--border-focus)]',
                )}
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                Open in new tab
              </a>
              <a
                href={signedUrl}
                download
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]',
                  'hover:text-[var(--text-primary)] transition-colors duration-[var(--transition-fast)]',
                  'min-h-[44px] sm:min-h-0 focus-visible:outline-[var(--border-focus)]',
                )}
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Download PDF
              </a>
            </div>
          </div>
        );
      }

      case 'text':
        return (
          <div
            className={cn(
              'prose prose-sm dark:prose-invert max-w-none',
              'rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6',
            )}
          >
            <p className="text-[var(--text-muted)] text-sm italic">
              Text lesson content is rendered from the lesson body.
            </p>
          </div>
        );

      case 'quiz':
        return (
          <EmptyState message="Quiz module coming soon." />
        );

      default:
        return <EmptyState message="Unsupported lesson type." />;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={cn('space-y-5', className)}>
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-1.5"
      >
        <h2 className="font-semibold text-lg leading-tight text-[var(--text-primary)]">
          {lesson.title}
        </h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          <span className="capitalize">{lesson.type}</span>
          {lesson.durationMinutes !== undefined && (
            <>
              <span aria-hidden="true">·</span>
              <span>{lesson.durationMinutes} min</span>
            </>
          )}
          {lesson.isCompleted && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1 text-[var(--success-text)] font-medium"
              role="status"
              aria-label="Lesson completed"
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              Completed
            </motion.span>
          )}
        </div>
      </motion.div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${lesson.id}-${urlLoading ? 'loading' : 'loaded'}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* ── Mark as Complete (non-video lessons only) ── */}
      {!lesson.isCompleted && lesson.type !== 'video' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.25 }}
          className="flex justify-end"
        >
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleMarkComplete}
              disabled={completeMutation.isPending}
              variant="outline"
              className={cn(
                'gap-2',
                // Mobile: full width for easier tapping
                'w-full sm:w-auto min-h-[44px]',
              )}
              aria-busy={completeMutation.isPending}
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    aria-hidden="true"
                  />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  Mark as Complete
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
