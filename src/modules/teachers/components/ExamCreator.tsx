"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/services/api/axios.instance";
import { useToast } from "@shared/hooks/useToast";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { useTeacherGroups } from "@/modules/teachers/hooks/useTeacher";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import { parseApiError } from "@shared/utils/api-error";
import type { ExamDto } from "@generated/models";
import type { ExamCreateFormValues } from "../types/teacher.types";

// QuestionSetDto is not yet in generated models — defined locally.
interface QuestionSetDto {
  id: string;
  name: string;
  questionCount?: number;
}

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  groupId: z.string().min(1, "Group is required"),
  scheduledAt: z.string().min(1, "Scheduled date is required"),
  durationMinutes: z.number().int().min(5).max(480),
  questionSetId: z.string().min(1, "Question set is required"),
});

interface ExamCreatorProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExamCreator({ onSuccess, onCancel }: ExamCreatorProps) {
  const { data: user } = useCurrentUser();
  const teacherId = user?.id ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: groups } = useTeacherGroups(teacherId);
  const { data: questionSets } = useQuery({
    queryKey: ["teachers", teacherId, "question-sets"],
    queryFn: () =>
      httpClient
        .get<QuestionSetDto[]>(`/teachers/${teacherId}/question-sets`)
        .then((r) => r.data),
    enabled: !!teacherId,
  });

  const createMutation = useMutation({
    mutationFn: (values: ExamCreateFormValues) =>
      httpClient
        .post<ExamDto>(`/exams`, { ...values, teacherId })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success("Exam created");
      void queryClient.invalidateQueries({ queryKey: ["teachers", teacherId, "exams"] });
      onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to create exam");
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
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

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values);
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      Object.entries(parsed.errors).forEach(([field, messages]) => {
        setError(field as keyof ExamCreateFormValues, {
          type: "server",
          message: (Array.isArray(messages) ? messages[0] : String(messages)) ?? "",
        });
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="examTitle">Exam Title <span className="text-destructive">*</span></Label>
        <Input id="examTitle" {...register("title")} placeholder="e.g. Midterm Exam" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Group <span className="text-destructive">*</span></Label>
          <Select
            value={watch("groupId")}
            onValueChange={(v) => setValue("groupId", v, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select group…" />
            </SelectTrigger>
            <SelectContent>
              {(groups ?? []).map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.groupId && <p className="text-xs text-destructive">{errors.groupId.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Question Set <span className="text-destructive">*</span></Label>
          <Select
            value={watch("questionSetId")}
            onValueChange={(v) => setValue("questionSetId", v, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select set…" />
            </SelectTrigger>
            <SelectContent>
              {(questionSets ?? []).map((qs: QuestionSetDto) => (
                <SelectItem key={qs.id} value={qs.id}>{qs.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.questionSetId && <p className="text-xs text-destructive">{errors.questionSetId.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="scheduledAt">Scheduled Date &amp; Time <span className="text-destructive">*</span></Label>
          <Input
            id="scheduledAt"
            type="datetime-local"
            {...register("scheduledAt")}
            min={new Date().toISOString().slice(0, 16)}
          />
          {errors.scheduledAt && <p className="text-xs text-destructive">{errors.scheduledAt.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="durationMinutes">Duration (minutes) <span className="text-destructive">*</span></Label>
          <Input
            id="durationMinutes"
            type="number"
            min={5}
            max={480}
            {...register("durationMinutes", { valueAsNumber: true })}
          />
          {errors.durationMinutes && <p className="text-xs text-destructive">{errors.durationMinutes.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={createMutation.isPending} className="min-w-[120px]">
          {createMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              Creating…
            </span>
          ) : "Create Exam"}
        </Button>
      </div>
    </form>
  );
}
