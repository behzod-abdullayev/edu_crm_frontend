"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks/useToast";
import { useWebSocket } from "@shared/hooks/useWebSocket";
import { httpClient } from "@/services/api/axios.instance";
import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";

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

const schema = z.object({
  answers: z.record(z.string(), z.string()),
});

type FormValues = z.infer<typeof schema>;

function useCountdown(endsAt: string) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(endsAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return { remaining, formatted: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` };
}

export function ExamParticipateView({ exam, studentId }: ExamParticipateViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const questions: ExamQuestionDto[] = exam.questions ?? [];

  const { formatted: timeLeft, remaining } = useCountdown(exam.endsAt ?? new Date(Date.now() + 3600000).toISOString());

  const { handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { answers: {} },
  });

  const answers = watch("answers");

  const onSubmit = useCallback(async (values: FormValues) => {
    if (isSubmitted) return;
    try {
      await httpClient.post(`/exams/${exam.id}/submissions`, {
        studentId,
        answers: values.answers,
      });
      setIsSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["students", studentId, "exams"] });
      toast({ title: "Exam submitted successfully!" });
    } catch {
      toast.error("Failed to submit exam");
    }
  }, [exam.id, studentId, isSubmitted, queryClient, toast]);

  useEffect(() => {
    if (remaining === 0 && !isSubmitted) {
      void handleSubmit(onSubmit)();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  useWebSocket({
    events: {
      EXAM_STARTED: () => {
        if (!isSubmitted) {
          toast({ title: "Exam ended by teacher" });
          void handleSubmit(onSubmit)();
        }
      },
    },
  });

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-in zoom-in-95 fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Exam Submitted!</h2>
        <p className="text-muted-foreground text-sm text-center">
          Your answers have been recorded. Results will be available after grading.
        </p>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-border z-10">
        <div>
          <h1 className="font-semibold text-base">{exam.title}</h1>
          <p className="text-xs text-muted-foreground">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>
        <div
          className={cn(
            "font-mono text-lg font-bold tabular-nums px-3 py-1.5 rounded-lg",
            remaining < 300 ? "bg-red-100 text-red-700 animate-pulse" : "bg-muted text-foreground"
          )}
        >
          {timeLeft}
        </div>
      </div>

      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${((currentQuestion + 1) / Math.max(questions.length, 1)) * 100}%` }}
        />
      </div>

      {question && (
        <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300" key={question.id}>
          <h2 className="font-medium text-base leading-relaxed">{question.text}</h2>

          {question.options && (
            <div className="space-y-2">
              {question.options.map((option: ExamQuestionOption) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setValue(`answers.${question.id}`, option.id, { shouldDirty: true })}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-150",
                    answers[question.id] === option.id
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted"
                  )}
                >
                  {option.text}
                </button>
              ))}
            </div>
          )}

          {!question.options && (
            <textarea
              className="w-full min-h-[120px] rounded-lg border border-border bg-card p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Type your answer here..."
              value={answers[question.id] ?? ""}
              onChange={(e) => setValue(`answers.${question.id}`, e.target.value, { shouldDirty: true })}
            />
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentQuestion((p) => Math.max(0, p - 1))}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>
        {currentQuestion < questions.length - 1 ? (
          <Button
            type="button"
            onClick={() => setCurrentQuestion((p) => Math.min(questions.length - 1, p + 1))}
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void handleSubmit(onSubmit)()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Submit Exam
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setCurrentQuestion(i)}
            className={cn(
              "w-8 h-8 rounded text-xs font-medium transition-colors",
              i === currentQuestion ? "bg-primary text-primary-foreground" : answers[q.id] ? "bg-green-100 text-green-700 border border-green-300" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}