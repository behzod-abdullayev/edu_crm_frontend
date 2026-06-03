"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import { FileUploadZone } from "@shared/components/FileUploadZone";
import { useLessonUpload, useTeacherGroups } from "@/modules/teachers/hooks/useTeacher";
import { useCurrentUser } from "@shared/hooks/useCurrentUser";
import { parseApiError } from "@shared/utils/api-error";
import type { LessonUploadFormValues } from "../types/teacher.types";
import type { FileUploadResponse } from "@shared/types";

// Named export → wrap in default so Next.js dynamic() can load it.
const RichTextEditor = dynamic(
  () => import("@shared/components/forms/RichTextEditor").then((m) => ({ default: m.RichTextEditor })),
  { ssr: false },
);

const schema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  groupId: z.string().min(1, "Group is required"),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  fileKey: z.string().optional(),
});

export function LessonUploader() {
  const { data: user } = useCurrentUser();
  const teacherId = user?.id ?? "";
  const router = useRouter();
  const { data: groups } = useTeacherGroups(teacherId);
  const uploadMutation = useLessonUpload(teacherId);
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<LessonUploadFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", groupId: "", videoUrl: "", fileKey: "" },
  });

  const description = watch("description");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await uploadMutation.mutateAsync(values);
      router.push("/teacher/lessons");
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      Object.entries(parsed.errors).forEach(([field, messages]) => {
        setError(field as keyof LessonUploadFormValues, {
          type: "server",
          message: (Array.isArray(messages) ? messages[0] : String(messages)) ?? "",
        });
      });
    }
  });

  const handleFileUpload = (files: FileUploadResponse[]) => {
    const key = files[0]?.url ?? "";
    setValue("fileKey", key, { shouldDirty: true });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="title">Lesson Title <span className="text-destructive">*</span></Label>
        <Input id="title" {...register("title")} placeholder="e.g. Introduction to Algebra" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Description <span className="text-destructive">*</span></Label>
        <RichTextEditor
          value={description}
          onChange={(v: string) => setValue("description", v, { shouldValidate: true })}
          placeholder="What will students learn in this lesson?"
          className="min-h-[140px] rounded-lg border border-border"
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

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

      {/* Upload mode selector */}
      <div className="space-y-3">
        <Label>Content</Label>
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setUploadMode("url")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              uploadMode === "url"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Video URL
          </button>
          <button
            type="button"
            onClick={() => setUploadMode("file")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              uploadMode === "file"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Upload File
          </button>
        </div>

        {uploadMode === "url" ? (
          <div className="space-y-1.5">
            <Input
              {...register("videoUrl")}
              type="url"
              placeholder="https://youtube.com/watch?v=..."
            />
            {errors.videoUrl && <p className="text-xs text-destructive">{errors.videoUrl.message}</p>}
          </div>
        ) : (
          <FileUploadZone
            onUpload={handleFileUpload}
            maxFiles={1}
            accept={{
              "application/pdf": [".pdf"],
              "video/*": [".mp4", ".webm", ".mov"],
            }}
          />
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={uploadMutation.isPending} className="min-w-[140px]">
          {uploadMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              Uploading…
            </span>
          ) : "Upload Lesson"}
        </Button>
      </div>
    </form>
  );
}
