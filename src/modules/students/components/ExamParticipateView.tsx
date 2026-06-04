"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks/useToast";
import { useSocketEvent } from "@shared/hooks/useWebSocket";
import { SocketEvent } from "@/services/websocket/socket.events";
import { httpClient } from "@/services/api/axios.instance";
import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

// ── Exported types ─────────────────────────────────────────────────────────────
export interface ExamQuestionOption {
  id: string;
  text: string;
}

export interface ExamQuestionDto {
  id: string;
  text: string;
  options?: ExamQuestionOption[];
}

export interface ExamDto {
  id: string;
  title: string;
  scheduledAt?: string;
  durationMinutes?: number;
  status?: string;
  questions?: ExamQuestionDto[];
  endsAt?: string;
}

interface ExamParticipateViewProps {
  exam: ExamDto;
  studentId: string;
}

// ── Zod schema ─────────────────────────────────────────────────────────────────
const schema = z.object({
  answers: z.record(z.string(), z.string()),
});

type FormValues = z.infer<typeof schema>;

// ── Countdown hook ─────────────────────────────────────────────────────────────
function useCountdown(endsAt: string) {
  const [remaining, setRemaining] = useState<number>(() => {
    const diff = new Date(endsAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return {
    remaining,
    formatted: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
  };
}

// ── Submitted success screen ───────────────────────────────────────────────────
function SubmittedScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 space-y-4"
      role="status"
      aria-live="polite"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        className="w-16 h-16 rounded-full bg-[var(--success-bg)] border border-[var(--success-border)] flex items-center justify-center"
      >
        <CheckCircle
          className="w-8 h-8 text-[var(--success-solid)]"
          aria-hidden="true"
        />
      </motion.div>
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
        Exam Submitted!
      </h2>
      <p className="text-[var(--text-muted)] text-sm text-center max-w-xs">
        Your answers have been recorded. Results will be available after grading.
      </p>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ExamParticipateView({
  exam,
  studentId,
}: ExamParticipateViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions: ExamQuestionDto[] = exam.questions ?? [];
  const totalQuestions = questions.length;

  const endsAtFallback = new Date(Date.now() + 3_600_000).toISOString();
  const { formatted: timeLeft, remaining } = useCountdown(
    exam.endsAt ?? endsAtFallback,
  );

  const { handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { answers: {} },
  });

  const answers = watch("answers");

  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (isSubmitted) return;
      try {
        await httpClient.post(`/exams/${exam.id}/submissions`, {
          studentId,
          answers: values.answers,
        });
        setIsSubmitted(true);
        void queryClient.invalidateQueries({
          queryKey: ["students", studentId, "exams"],
        });
        toast({ title: "Exam submitted successfully!", type: "success" });
      } catch {
        toast.error("Failed to submit exam. Please try again.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exam.id, studentId, isSubmitted],
  );

  // Auto-submit when timer reaches zero
  useEffect(() => {
    if (remaining === 0 && !isSubmitted) {
      void handleSubmit(onSubmit)();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  // Teacher ends exam early via WebSocket
  useSocketEvent(
    SocketEvent.EXAM_STARTED,
    () => {
      if (!isSubmitted) {
        toast({ title: "Exam ended by teacher", type: "warning" });
        void handleSubmit(onSubmit)();
      }
    },
  );

  if (isSubmitted) {
    return <SubmittedScreen />;
  }

  // noUncheckedIndexedAccess: question can be undefined
  const question: ExamQuestionDto | undefined = questions[currentQuestion];

  return (
    <div className="space-y-6">
      {/* Sticky header */}
      <div className="flex items-center justify-between sticky top-0 bg-[var(--bg-page)]/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-[var(--border-default)] z-10">
        <div>
          <h1 className="font-semibold text-base text-[var(--text-primary)]">
            {exam.title}
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Question {currentQuestion + 1} of {totalQuestions}
          </p>
        </div>

        {/* Countdown timer */}
        <div
          className={cn(
            "font-mono text-lg font-bold tabular-nums px-3 py-1.5 rounded-lg transition-colors",
            remaining < 300
              ? "bg-[var(--error-bg)] text-[var(--error-text)] animate-pulse"
              : "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]",
          )}
          role="timer"
          aria-label={`Time remaining: ${timeLeft}`}
          aria-live="off"
        >
          {timeLeft}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 w-full rounded-full bg-[var(--bg-surface-hover)] overflow-hidden"
        role="progressbar"
        aria-valuenow={currentQuestion + 1}
        aria-valuemin={1}
        aria-valuemax={totalQuestions}
      >
        <motion.div
          className="h-full rounded-full bg-[var(--brand-primary)]"
          animate={{
            width: `${((currentQuestion + 1) / Math.max(totalQuestions, 1)) * 100}%`,
          }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Question */}
      {question !== undefined && (
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <h2 className="font-medium text-base leading-relaxed text-[var(--text-primary)]">
            {question.text}
          </h2>

          {/* Multiple choice */}
          {question.options !== undefined && question.options.length > 0 && (
            <div className="space-y-2" role="radiogroup" aria-label={question.text}>
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.id;
                return (
                  <motion.button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() =>
                      setValue(`answers.${question.id}`, option.id, {
                        shouldDirty: true,
                      })
                    }
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-150 min-h-[44px]",
                      isSelected
                        ? "border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)] text-[var(--brand-primary)] font-medium"
                        : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--brand-primary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)]",
                    )}
                  >
                    {option.text}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Free-text answer */}
          {(question.options === undefined || question.options.length === 0) && (
            <textarea
              aria-label={`Answer for question ${currentQuestion + 1}`}
              className={cn(
                "w-full min-h-[120px] rounded-lg border border-[var(--border-default)]",
                "bg-[var(--bg-surface)] text-[var(--text-primary)] p-3 text-sm resize-none",
                "focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]",
                "placeholder:text-[var(--text-muted)] transition-shadow",
              )}
              placeholder="Type your answer here…"
              value={answers[question.id] ?? ""}
              onChange={(e) =>
                setValue(`answers.${question.id}`, e.target.value, {
                  shouldDirty: true,
                })
              }
            />
          )}
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>

        {currentQuestion < totalQuestions - 1 ? (
          <Button
            type="button"
            onClick={() =>
              setCurrentQuestion((p) => Math.min(totalQuestions - 1, p + 1))
            }
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void handleSubmit(onSubmit)()}
            className="bg-[var(--success-solid)] hover:opacity-90 text-white"
          >
            Submit Exam
          </Button>
        )}
      </div>

      {/* Question navigator */}
      <div
        className="flex flex-wrap gap-2 pt-2"
        role="navigation"
        aria-label="Question navigator"
      >
        {questions.map((q, i) => {
          const isAnswered = answers[q.id] !== undefined && answers[q.id] !== "";
          const isCurrent = i === currentQuestion;
          return (
            <motion.button
              key={q.id}
              type="button"
              onClick={() => setCurrentQuestion(i)}
              whileTap={{ scale: 0.9 }}
              aria-label={`Go to question ${i + 1}${isAnswered ? ", answered" : ""}`}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "w-8 h-8 rounded text-xs font-medium transition-colors min-h-[32px]",
                isCurrent
                  ? "bg-[var(--brand-primary)] text-[var(--text-on-brand)]"
                  : isAnswered
                    ? "bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)]"
                    : "bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)]",
              )}
            >
              {i + 1}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
