"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@shared/components/ui/button";
import { Label } from "@shared/components/ui/label";
import { useHomeworkSubmit } from "../hooks/useHomeworkSubmit";
import { parseApiError } from "@shared/utils/api-error";
import { cn } from "@shared/lib/utils";

// Fix: import the named export and wrap in a default-export module so
// dynamic()'s Loader<{}> signature is satisfied without type gymnastics.
const RichTextEditor = dynamic(
  () =>
    import("@shared/components/forms/RichTextEditor").then((mod) => ({
      default: mod.RichTextEditor,
    })),
  { ssr: false }
);

const schema = z.object({
  textAnswer: z.string().min(1, "Answer is required"),
  attachedFileKeys: z.array(z.string()).max(5, "Max 5 files"),
});

type FormValues = z.infer<typeof schema>;

interface HomeworkSubmitFormProps {
  homeworkId: string;
  studentId: string;
  isSubmitted: boolean;
  allowResubmit: boolean;
  existingAnswer?: string | undefined;
  existingFileKeys?: string[] | undefined;
  className?: string | undefined;
}

export function HomeworkSubmitForm({
  homeworkId,
  studentId,
  isSubmitted,
  allowResubmit,
  existingAnswer,
  existingFileKeys,
  className,
}: HomeworkSubmitFormProps) {
  const { submit, resubmit, isSubmitting, isResubmitting, submitError } = useHomeworkSubmit(
    homeworkId,
    studentId
  );

  const {
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitSuccessful },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      textAnswer: existingAnswer ?? "",
      attachedFileKeys: existingFileKeys ?? [],
    },
  });

  useEffect(() => {
    if (submitError) {
      const parsed = parseApiError(submitError as unknown as Record<string, unknown>);
      Object.entries(parsed.errors).forEach(([field, messages]) => {
        const msg = Array.isArray(messages) ? messages[0] : String(messages);
        setError(field as keyof FormValues, {
          type: "server",
          message: msg ?? "Invalid value",
        });
      });
    }
  }, [submitError, setError]);

  const textAnswer = watch("textAnswer");
  const attachedFileKeys = watch("attachedFileKeys");

  const isReadOnly = isSubmitted && !allowResubmit;
  const isLoading = isSubmitting || isResubmitting;

  const onSubmit = handleSubmit(async (values) => {
    if (isSubmitted && allowResubmit) {
      await resubmit(values);
    } else {
      await submit(values);
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className={cn("space-y-6", className)}
      aria-label="Homework submission form"
    >
      <div className="space-y-2">
        <Label htmlFor="textAnswer" className="text-sm font-medium">
          Your Answer
        </Label>
        {/* Fix: RichTextEditor has no readOnly prop — use disabled instead */}
        <RichTextEditor
          value={textAnswer}
          onChange={(val: string) => setValue("textAnswer", val, { shouldValidate: true })}
          disabled={isReadOnly}
          placeholder="Write your answer here..."
          className={cn(
            "min-h-[200px] rounded-lg border border-border",
            errors.textAnswer && "border-destructive"
          )}
        />
        {errors.textAnswer && (
          <p className="text-xs text-destructive">{errors.textAnswer.message}</p>
        )}
      </div>

      {!isReadOnly && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Attachments (max 5 files — upload via file manager)
          </Label>
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground text-center">
            {attachedFileKeys.length > 0
              ? `${attachedFileKeys.length} file(s) attached`
              : "No files attached"}
          </div>
          {errors.attachedFileKeys && (
            <p className="text-xs text-destructive">{errors.attachedFileKeys.message}</p>
          )}
        </div>
      )}

      {!isReadOnly && (
        <div className="flex justify-end sm:static fixed bottom-0 left-0 right-0 sm:p-0 p-4 sm:bg-transparent bg-background border-t border-border sm:border-none">
          <Button
            type="submit"
            disabled={isLoading || isSubmitSuccessful}
            className="w-full sm:w-auto min-w-[120px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                {isSubmitted ? "Resubmitting…" : "Submitting…"}
              </span>
            ) : isSubmitted && allowResubmit ? (
              "Resubmit"
            ) : (
              "Submit Homework"
            )}
          </Button>
        </div>
      )}

      {isReadOnly && (
        <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground text-center">
          Submission closed. Resubmission is not allowed for this assignment.
        </div>
      )}
    </form>
  );
}