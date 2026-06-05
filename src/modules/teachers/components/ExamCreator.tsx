"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { httpClient } from "@/services/api/axios.instance";
import { useToast } from "@shared/hooks/useToast";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useTeacherGroups } from "@/modules/teachers/hooks/useTeacher";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { parseApiError } from "@shared/utils/api-error";
import type { ExamCreateFormValues } from "../types/teacher.types";
import { cn } from "@shared/lib/utils";
import { ClipboardList, CalendarClock, Timer, BookOpen, Users } from "lucide-react";

// ─── Local DTO (not yet in generated models) ──────────────────────────────────

interface QuestionSetDto {
  id: string;
  name: string;
  questionCount?: number;
}

// Backend response for a created exam (mirrors ExamDto when available)
interface CreatedExamDto {
  id: string;
  title: string;
  groupId: string;
  teacherId: string;
  scheduledAt: string;
  durationMinutes: number;
  questionSetId: string;
  status: "draft" | "scheduled" | "active" | "completed";
  createdAt: string;
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  groupId: z.string().min(1, "Group is required"),
  scheduledAt: z.string().min(1, "Scheduled date and time is required"),
  durationMinutes: z
    .number({ invalid_type_error: "Duration must be a number" })
    .int("Duration must be a whole number")
    .min(5, "Duration must be at least 5 minutes")
    .max(480, "Duration must not exceed 480 minutes"),
  questionSetId: z.string().min(1, "Question set is required"),
});

// ─── Field error message ──────────────────────────────────────────────────────

interface FieldErrorProps {
  message?: string;
}

function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="text-xs text-[var(--error-solid)] mt-1"
      role="alert"
      aria-live="polite"
    >
      {message}
    </motion.p>
  );
}

// ─── Question set badge ───────────────────────────────────────────────────────

interface QuestionSetBadgeProps {
  count?: number;
}

function QuestionSetBadge({ count }: QuestionSetBadgeProps) {
  if (count === undefined) return null;
  return (
    <span className="ml-2 text-xs text-[var(--text-muted)] font-normal">
      ({count} questions)
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ExamCreatorProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ExamCreator({ onSuccess, onCancel }: ExamCreatorProps) {
  const { data: user } = useCurrentUser();
  const teacherId = user?.id ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ── Data queries ────────────────────────────────────────────────────
  const { data: groups, isLoading: groupsLoading } = useTeacherGroups(teacherId);

  const { data: questionSets, isLoading: setsLoading } = useQuery<
    QuestionSetDto[]
  >({
    queryKey: ["teachers", teacherId, "question-sets"],
    queryFn: () =>
      httpClient
        .get<QuestionSetDto[]>(`/teachers/${teacherId}/question-sets`)
        .then((r) => r.data),
    enabled: !!teacherId,
    staleTime: 5 * 60_000,
  });

  // ── Create mutation ─────────────────────────────────────────────────
  const createMutation = useMutation<
    CreatedExamDto,
    unknown,
    ExamCreateFormValues
  >({
    mutationFn: (values) =>
      httpClient
        .post<CreatedExamDto>("/exams", { ...values, teacherId })
        .then((r) => r.data),
    onSuccess: (created) => {
      toast.success("Exam created", `"${created.title}" scheduled successfully.`);
      void queryClient.invalidateQueries({
        queryKey: ["teachers", teacherId, "exams"],
      });
      onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to create exam", "Please check the form and try again.");
    },
  });

  // ── Form ────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<ExamCreateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      groupId: "",
      scheduledAt: "",
      durationMinutes: 60,
      questionSetId: "",
    },
  });

  // Minimum datetime-local value = now (rounded up 1 min)
  const minDateTime = (() => {
    const now = new Date();
    now.setSeconds(0, 0);
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  })();

  // ── Submit handler ──────────────────────────────────────────────────
  const onSubmit = handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values);
      reset();
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      Object.entries(parsed.errors).forEach(([field, messages]) => {
        const message =
          Array.isArray(messages)
            ? (messages[0] ?? "Invalid value")
            : String(messages);

        setError(field as keyof ExamCreateFormValues, {
          type: "server",
          message,
        });
      });
    }
  });

  // ── Cancel handler ──────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    reset();
    onCancel?.();
  }, [reset, onCancel]);

  // ── Derived values ──────────────────────────────────────────────────
  const watchedGroupId = watch("groupId");
  const watchedQuestionSetId = watch("questionSetId");
  const selectedQuestionSet = questionSets?.find(
    (qs) => qs.id === watchedQuestionSetId,
  );

  const isPending = createMutation.isPending;

  return (
    <motion.form
      onSubmit={onSubmit}
      className="space-y-5"
      noValidate
      aria-label="Create exam form"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* ── Exam title ──────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="examTitle" className="flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
          Exam Title{" "}
          <span className="text-[var(--error-solid)]" aria-hidden="true">
            *
          </span>
        </Label>
        <Input
          id="examTitle"
          {...register("title")}
          placeholder="e.g. Midterm Exam — Unit 3"
          aria-required="true"
          aria-describedby={errors.title ? "examTitle-error" : undefined}
          aria-invalid={!!errors.title}
          className={cn(
            "transition-all duration-[var(--transition-fast)]",
            errors.title && "border-[var(--error-solid)] focus-visible:ring-[var(--error-solid)]/30",
          )}
          disabled={isPending}
        />
        <FieldError message={errors.title?.message} />
      </div>

      {/* ── Group + Question Set ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Group */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
            Group{" "}
            <span className="text-[var(--error-solid)]" aria-hidden="true">
              *
            </span>
          </Label>
          <Select
            value={watchedGroupId}
            onValueChange={(v) =>
              setValue("groupId", v, { shouldValidate: true })
            }
            disabled={isPending || groupsLoading}
          >
            <SelectTrigger
              aria-required="true"
              aria-invalid={!!errors.groupId}
              className={cn(
                errors.groupId &&
                  "border-[var(--error-solid)] focus:ring-[var(--error-solid)]/30",
              )}
            >
              <SelectValue
                placeholder={groupsLoading ? "Loading groups…" : "Select group…"}
              />
            </SelectTrigger>
            <SelectContent>
              {(groups ?? []).map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.groupId?.message} />
        </div>

        {/* Question Set */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
            Question Set{" "}
            <span className="text-[var(--error-solid)]" aria-hidden="true">
              *
            </span>
            {selectedQuestionSet && (
              <QuestionSetBadge count={selectedQuestionSet.questionCount} />
            )}
          </Label>
          <Select
            value={watchedQuestionSetId}
            onValueChange={(v) =>
              setValue("questionSetId", v, { shouldValidate: true })
            }
            disabled={isPending || setsLoading}
          >
            <SelectTrigger
              aria-required="true"
              aria-invalid={!!errors.questionSetId}
              className={cn(
                errors.questionSetId &&
                  "border-[var(--error-solid)] focus:ring-[var(--error-solid)]/30",
              )}
            >
              <SelectValue
                placeholder={setsLoading ? "Loading sets…" : "Select set…"}
              />
            </SelectTrigger>
            <SelectContent>
              {(questionSets ?? []).map((qs) => (
                <SelectItem key={qs.id} value={qs.id}>
                  {qs.name}
                  {qs.questionCount !== undefined && (
                    <span className="ml-2 text-xs text-[var(--text-muted)]">
                      ({qs.questionCount}q)
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={errors.questionSetId?.message} />
        </div>
      </div>

      {/* ── Scheduled Date/Time + Duration ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Scheduled at */}
        <div className="space-y-1.5">
          <Label
            htmlFor="scheduledAt"
            className="flex items-center gap-1.5"
          >
            <CalendarClock
              className="w-3.5 h-3.5 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            Scheduled Date &amp; Time{" "}
            <span className="text-[var(--error-solid)]" aria-hidden="true">
              *
            </span>
          </Label>
          <input
            id="scheduledAt"
            type="datetime-local"
            min={minDateTime}
            aria-required="true"
            aria-describedby={
              errors.scheduledAt ? "scheduledAt-error" : undefined
            }
            aria-invalid={!!errors.scheduledAt}
            disabled={isPending}
            {...register("scheduledAt")}
            className={cn(
              "w-full h-10 rounded-lg border border-[var(--border-default)]",
              "bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]",
              "transition-all duration-[var(--transition-fast)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]",
              "focus:border-[var(--border-focus)] focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              errors.scheduledAt &&
                "border-[var(--error-solid)] focus:ring-[var(--error-solid)]/30",
            )}
          />
          <FieldError message={errors.scheduledAt?.message} />
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <Label
            htmlFor="durationMinutes"
            className="flex items-center gap-1.5"
          >
            <Timer
              className="w-3.5 h-3.5 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            Duration{" "}
            <span className="text-[var(--text-muted)] font-normal">
              (minutes)
            </span>{" "}
            <span className="text-[var(--error-solid)]" aria-hidden="true">
              *
            </span>
          </Label>
          <Input
            id="durationMinutes"
            type="number"
            min={5}
            max={480}
            step={5}
            inputMode="numeric"
            aria-required="true"
            aria-describedby={
              errors.durationMinutes ? "durationMinutes-error" : undefined
            }
            aria-invalid={!!errors.durationMinutes}
            disabled={isPending}
            {...register("durationMinutes", { valueAsNumber: true })}
            className={cn(
              errors.durationMinutes &&
                "border-[var(--error-solid)] focus-visible:ring-[var(--error-solid)]/30",
            )}
          />
          <FieldError message={errors.durationMinutes?.message} />
        </div>
      </div>

      {/* ── Duration hint ─────────────────────────────────────────────── */}
      {watch("durationMinutes") > 0 && !errors.durationMinutes && (
        <p className="text-xs text-[var(--text-muted)] -mt-2">
          Exam ends{" "}
          {watch("durationMinutes") >= 60
            ? `${Math.floor(watch("durationMinutes") / 60)}h ${watch("durationMinutes") % 60 > 0 ? `${watch("durationMinutes") % 60}m` : ""}`.trim()
            : `${watch("durationMinutes")}m`}{" "}
          after start.
        </p>
      )}

      {/* ── Action buttons ────────────────────────────────────────────── */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 border-t border-[var(--border-default)]">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
            className="min-h-[44px] sm:min-h-[40px]"
          >
            Cancel
          </Button>
        )}
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            type="submit"
            disabled={isPending || !isDirty}
            className="w-full sm:w-auto min-w-[140px] min-h-[44px] sm:min-h-[40px]"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Creating…
              </span>
            ) : (
              "Create Exam"
            )}
          </Button>
        </motion.div>
      </div>
    </motion.form>
  );
}
