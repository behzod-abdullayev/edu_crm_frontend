"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
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
import { FileUploadZone } from "@shared/components/FileUploadZone";
import { useLessonUpload, useTeacherGroups } from "@/modules/teachers/hooks/useTeacher";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { mapApiErrorsToForm } from "@shared/utils/api-error";
import type { LessonUploadFormValues } from "../types/teacher.types";
import type { UploadedFile } from "@shared/components/forms/FileUploadZone";
import { Link2, Upload, Loader2 } from "lucide-react";

// ─── Lazy-load rich-text editor to avoid heavy SSR bundle ────────────────────

const RichTextEditor = dynamic(
  () =>
    import("@shared/components/forms/RichTextEditor").then((m) => ({
      default: m.RichTextEditor,
    })),
  { ssr: false },
);

// ─── Zod validation schema ────────────────────────────────────────────────────

const schema = z
  .object({
    title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or fewer"),
    description: z.string().min(1, "Description is required"),
    groupId: z.string().min(1, "Group is required"),
    videoUrl: z
      .string()
      .max(500)
      .refine(
        (v) => v === "" || /^https?:\/\/.+/.test(v),
        "Must be a valid URL starting with http:// or https://",
      )
      .optional(),
    fileKey: z.string().optional(),
  })
  .refine(
    (data) => {
      // At least one of videoUrl or fileKey must be supplied
      const hasUrl = data.videoUrl !== undefined && data.videoUrl.trim() !== "";
      const hasFile = data.fileKey !== undefined && data.fileKey.trim() !== "";
      return hasUrl || hasFile;
    },
    {
      message: "Please provide a video URL or upload a file",
      path: ["videoUrl"],
    },
  );

type UploadMode = "url" | "file";

// ─── Skeleton for groups while loading ───────────────────────────────────────

function GroupSelectSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading groups"
      className="h-10 rounded-md bg-muted animate-[shimmer_1.5s_infinite]"
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LessonUploader() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const teacherId = user?.teacherId ?? "";

  const { data: groups, isLoading: groupsLoading } = useTeacherGroups(teacherId);
  const uploadMutation = useLessonUpload(teacherId);

  const [uploadMode, setUploadMode] = useState<UploadMode>("url");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LessonUploadFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      groupId: "",
      videoUrl: "",
      fileKey: "",
    },
  });

  const descriptionValue = watch("description");
  const groupIdValue = watch("groupId");
  const videoUrlValue = watch("videoUrl");

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleFileUpload = (file: UploadedFile) => {
    const key = file.url ?? "";
    setValue("fileKey", key, { shouldDirty: true, shouldValidate: true });
    if (key) clearErrors("videoUrl");
  };

  const switchMode = (mode: UploadMode) => {
    setUploadMode(mode);
    // Clear content-related values when switching modes
    if (mode === "url") {
      setValue("fileKey", "", { shouldDirty: true });
    } else {
      setValue("videoUrl", "", { shouldDirty: true });
    }
    clearErrors("videoUrl");
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await uploadMutation.mutateAsync(values);
      router.push("/teacher/lessons");
    } catch (err: unknown) {
      mapApiErrorsToForm(
        err instanceof Error
          ? { statusCode: 0, message: err.message, code: "CLIENT_ERROR", errors: {} }
          : { statusCode: 0, message: "Unknown error", code: "UNKNOWN_ERROR", errors: {} },
        setError,
      );
    }
  });

  const isPending = isSubmitting || uploadMutation.isPending;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <motion.form
      onSubmit={onSubmit}
      noValidate
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-2xl"
      aria-label="Upload lesson form"
    >
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="lesson-title">
          Lesson Title <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id="lesson-title"
          {...register("title")}
          placeholder="e.g. Introduction to Algebra"
          aria-required="true"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
          className={errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        <AnimatePresence initial={false}>
          {errors.title && (
            <motion.p
              id="title-error"
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-destructive"
            >
              {errors.title.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="lesson-description">
          Description <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <RichTextEditor
          value={descriptionValue}
          onChange={(v: string) =>
            setValue("description", v, { shouldValidate: true, shouldDirty: true })
          }
          placeholder="What will students learn in this lesson?"
          className={
            errors.description
              ? "min-h-[140px] rounded-lg border border-destructive"
              : "min-h-[140px] rounded-lg border border-border"
          }
        />
        <AnimatePresence initial={false}>
          {errors.description && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-destructive"
            >
              {errors.description.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Group selector */}
      <div className="space-y-1.5">
        <Label htmlFor="lesson-group">
          Group <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        {groupsLoading ? (
          <GroupSelectSkeleton />
        ) : (
          <Select
            value={groupIdValue}
            onValueChange={(v) =>
              setValue("groupId", v, { shouldValidate: true, shouldDirty: true })
            }
          >
            <SelectTrigger
              id="lesson-group"
              aria-required="true"
              aria-invalid={!!errors.groupId}
              aria-describedby={errors.groupId ? "group-error" : undefined}
              className={errors.groupId ? "border-destructive" : ""}
            >
              <SelectValue placeholder="Select group…" />
            </SelectTrigger>
            <SelectContent>
              {(groups ?? []).map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <AnimatePresence initial={false}>
          {errors.groupId && (
            <motion.p
              id="group-error"
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-destructive"
            >
              {errors.groupId.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Content — URL or file upload */}
      <div className="space-y-3">
        <Label id="content-mode-label">
          Content <span className="text-destructive" aria-hidden="true">*</span>
        </Label>

        {/* Mode toggle */}
        <div
          role="group"
          aria-labelledby="content-mode-label"
          className="flex rounded-lg border border-border overflow-hidden"
        >
          {(
            [
              { mode: "url" as const, label: "Video URL", icon: Link2 },
              { mode: "file" as const, label: "Upload File", icon: Upload },
            ] as { mode: UploadMode; label: string; icon: React.ElementType }[]
          ).map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => switchMode(mode)}
              aria-pressed={uploadMode === mode}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                uploadMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <AnimatePresence mode="wait" initial={false}>
          {uploadMode === "url" ? (
            <motion.div
              key="url-input"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-1.5"
            >
              <Input
                {...register("videoUrl")}
                type="url"
                inputMode="url"
                placeholder="https://youtube.com/watch?v=…"
                aria-label="Video URL"
                aria-invalid={!!errors.videoUrl}
                aria-describedby={errors.videoUrl ? "video-url-error" : undefined}
                value={videoUrlValue ?? ""}
                className={errors.videoUrl ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              <AnimatePresence initial={false}>
                {errors.videoUrl && (
                  <motion.p
                    id="video-url-error"
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="text-xs text-destructive"
                  >
                    {errors.videoUrl.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="file-upload"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <FileUploadZone
                onUpload={handleFileUpload}
                maxFiles={1}
                accept={{
                  "application/pdf": [".pdf"],
                  "video/mp4": [".mp4"],
                  "video/webm": [".webm"],
                  "video/quicktime": [".mov"],
                }}
              />
              <AnimatePresence initial={false}>
                {errors.videoUrl && (
                  <motion.p
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="text-xs text-destructive mt-1"
                  >
                    {errors.videoUrl.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Form actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto min-w-[160px]"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Uploading…
            </span>
          ) : (
            "Upload Lesson"
          )}
        </Button>
      </div>
    </motion.form>
  );
}