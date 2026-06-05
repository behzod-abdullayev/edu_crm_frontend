'use client';

import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { Switch } from '@shared/components/ui/switch';
import {
  useHomeworkCreate,
  useTeacherGroups,
} from '@/modules/teachers/hooks/useTeacher';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { parseApiError } from '@shared/utils/api-error';
import type { HomeworkCreateFormValues } from '../types/teacher.types';
import { cn } from '@shared/lib/utils';
import {
  BookMarked,
  Users,
  CalendarClock,
  Star,
  RefreshCw,
  Paperclip,
  Upload,
} from 'lucide-react';
import { httpClient } from '@/services/api/axios.instance';

// ─── Lazy imports ─────────────────────────────────────────────────────────────

// RichTextEditor is a heavy dependency — lazy-load to keep initial bundle small
const RichTextEditor = dynamic(
  () =>
    import('@shared/components/forms/RichTextEditor').then((m) => ({
      default: m.RichTextEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[180px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] animate-pulse"
        aria-busy="true"
        aria-label="Loading editor…"
      />
    ),
  },
);

// ─── Zod schema ───────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const schema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(10_000, 'Description is too long'),
  groupId: z.string().min(1, 'Group is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  maxPoints: z
    .number({ invalid_type_error: 'Max points must be a number' })
    .int('Max points must be a whole number')
    .min(1, 'Must be at least 1 point')
    .max(1_000, 'Must not exceed 1000 points'),
  allowResubmit: z.boolean(),
  attachedFileKeys: z.array(z.string()),
});

// ─── Field error ──────────────────────────────────────────────────────────────

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

// ─── Uploaded file chip ───────────────────────────────────────────────────────

interface FileChipProps {
  fileName: string;
  onRemove: () => void;
}

function FileChip({ fileName, onRemove }: FileChipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg',
        'border border-[var(--border-default)] bg-[var(--bg-surface-secondary)]',
        'text-xs text-[var(--text-secondary)]',
      )}
    >
      <Paperclip className="w-3 h-3 text-[var(--text-muted)]" aria-hidden="true" />
      <span className="truncate max-w-[140px]">{fileName}</span>
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          'ml-1 rounded-full p-0.5 min-h-[20px] min-w-[20px] flex items-center justify-center',
          'hover:bg-[var(--error-bg)] hover:text-[var(--error-solid)]',
          'transition-colors duration-[var(--transition-fast)]',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-focus)]',
        )}
        aria-label={`Remove ${fileName}`}
      >
        ×
      </button>
    </motion.div>
  );
}

// ─── File upload zone ─────────────────────────────────────────────────────────

interface UploadedFile {
  key: string;
  name: string;
}

interface FileUploadAreaProps {
  uploadedFiles: UploadedFile[];
  onUpload: (file: File) => Promise<void>;
  onRemove: (key: string) => void;
  isUploading: boolean;
  disabled?: boolean;
}

function FileUploadArea({
  uploadedFiles,
  onUpload,
  onRemove,
  isUploading,
  disabled,
}: FileUploadAreaProps) {
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await onUpload(file);
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [onUpload],
  );

  return (
    <div className="space-y-3">
      {/* Drop / click area */}
      <label
        className={cn(
          'flex flex-col items-center justify-center gap-2',
          'min-h-[100px] sm:min-h-[88px] w-full rounded-xl',
          'border-2 border-dashed border-[var(--border-default)]',
          'bg-[var(--bg-surface-secondary)]',
          'cursor-pointer transition-all duration-[var(--transition-fast)]',
          'hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5',
          'focus-within:border-[var(--brand-primary)] focus-within:ring-2',
          'focus-within:ring-[var(--border-focus)] focus-within:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        )}
      >
        <input
          type="file"
          accept={ACCEPTED_MIME_TYPES.join(',')}
          onChange={(e) => void handleFileChange(e)}
          disabled={disabled || isUploading}
          className="sr-only"
          aria-label="Upload attachment"
          capture={undefined}
        />
        {isUploading ? (
          <span className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <span
              className="w-4 h-4 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            Uploading…
          </span>
        ) : (
          <>
            <Upload
              className="w-5 h-5 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            <span className="text-sm text-[var(--text-muted)] text-center px-3">
              <span className="text-[var(--brand-primary)] font-medium">
                Click to upload
              </span>{' '}
              or drag &amp; drop
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              PDF, images, DOC — max {MAX_FILE_SIZE_MB}MB
            </span>
          </>
        )}
      </label>

      {/* File chips */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap gap-2"
            role="list"
            aria-label="Attached files"
          >
            {uploadedFiles.map((f) => (
              <div key={f.key} role="listitem">
                <FileChip fileName={f.name} onRemove={() => onRemove(f.key)} />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HomeworkCreatorProps {
  onSuccess?: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HomeworkCreator({ onSuccess }: HomeworkCreatorProps) {
  const { data: currentUser } = useCurrentUser();
  const teacherId = currentUser?.id ?? '';
  const router = useRouter();

  const { data: groups, isLoading: groupsLoading } = useTeacherGroups(teacherId);
  const createMutation = useHomeworkCreate(teacherId);

  // Tracks uploaded file metadata for the UI chips
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ key: string; name: string }>
  >([]);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isDirty },
  } = useForm<HomeworkCreateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      groupId: '',
      dueDate: '',
      maxPoints: 100,
      allowResubmit: false,
      attachedFileKeys: [],
    },
  });

  const description = watch('description');
  const allowResubmit = watch('allowResubmit');
  const watchedGroupId = watch('groupId');

  // Minimum datetime-local = now + 1 minute
  const minDueDate = (() => {
    const now = new Date();
    now.setSeconds(0, 0);
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  })();

  // ── File upload handler ─────────────────────────────────────────────
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError('attachedFileKeys', {
          type: 'manual',
          message: `File size must not exceed ${MAX_FILE_SIZE_MB}MB`,
        });
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await httpClient.post<{ key: string; url: string }>(
          '/files/upload',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );

        const currentKeys = watch('attachedFileKeys');
        setValue('attachedFileKeys', [...currentKeys, data.key]);
        setUploadedFiles((prev) => [...prev, { key: data.key, name: file.name }]);
      } catch {
        setError('attachedFileKeys', {
          type: 'manual',
          message: 'Upload failed. Please try again.',
        });
      } finally {
        setIsUploading(false);
      }
    },
    [setValue, watch, setError],
  );

  // ── Remove file ─────────────────────────────────────────────────────
  const handleRemoveFile = useCallback(
    (key: string) => {
      const currentKeys = watch('attachedFileKeys');
      setValue(
        'attachedFileKeys',
        currentKeys.filter((k) => k !== key),
      );
      setUploadedFiles((prev) => prev.filter((f) => f.key !== key));
    },
    [setValue, watch],
  );

  // ── Submit ──────────────────────────────────────────────────────────
  const onSubmit = handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values);
      onSuccess?.();
      router.push('/teacher/homework');
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      Object.entries(parsed.errors).forEach(([field, messages]) => {
        const message = Array.isArray(messages)
          ? (messages[0] ?? 'Invalid value')
          : String(messages);

        setError(field as keyof HomeworkCreateFormValues, {
          type: 'server',
          message,
        });
      });
    }
  });

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const isPending = createMutation.isPending;

  return (
    <motion.form
      onSubmit={onSubmit}
      className="space-y-6"
      noValidate
      aria-label="Create homework form"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* ── Title ──────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="hwTitle" className="flex items-center gap-1.5">
          <BookMarked
            className="w-3.5 h-3.5 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          Title{' '}
          <span className="text-[var(--error-solid)]" aria-hidden="true">
            *
          </span>
        </Label>
        <Input
          id="hwTitle"
          {...register('title')}
          placeholder="e.g. Chapter 5 Problems"
          aria-required="true"
          aria-invalid={!!errors.title}
          disabled={isPending}
          className={cn(
            errors.title &&
              'border-[var(--error-solid)] focus-visible:ring-[var(--error-solid)]/30',
          )}
        />
        <FieldError message={errors.title?.message} />
      </div>

      {/* ── Description (rich text) ─────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          Description{' '}
          <span className="text-[var(--error-solid)]" aria-hidden="true">
            *
          </span>
        </Label>
        <div
          className={cn(
            'rounded-lg border border-[var(--border-default)]',
            'transition-colors duration-[var(--transition-fast)]',
            'focus-within:border-[var(--border-focus)]',
            errors.description && 'border-[var(--error-solid)]',
            isPending && 'opacity-50 pointer-events-none',
          )}
        >
          <RichTextEditor
            value={description}
            onChange={(v: string) =>
              setValue('description', v, { shouldValidate: true })
            }
            placeholder="Assignment instructions, requirements, hints…"
            className="min-h-[180px]"
          />
        </div>
        <FieldError message={errors.description?.message} />
      </div>

      {/* ── Group + Due Date ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Group */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Users
              className="w-3.5 h-3.5 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            Group{' '}
            <span className="text-[var(--error-solid)]" aria-hidden="true">
              *
            </span>
          </Label>
          <Select
            value={watchedGroupId}
            onValueChange={(v) =>
              setValue('groupId', v, { shouldValidate: true })
            }
            disabled={isPending || groupsLoading}
          >
            <SelectTrigger
              aria-required="true"
              aria-invalid={!!errors.groupId}
              className={cn(
                errors.groupId &&
                  'border-[var(--error-solid)] focus:ring-[var(--error-solid)]/30',
              )}
            >
              <SelectValue
                placeholder={groupsLoading ? 'Loading…' : 'Select group…'}
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

        {/* Due date */}
        <div className="space-y-1.5">
          <Label
            htmlFor="hwDueDate"
            className="flex items-center gap-1.5"
          >
            <CalendarClock
              className="w-3.5 h-3.5 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            Due Date{' '}
            <span className="text-[var(--error-solid)]" aria-hidden="true">
              *
            </span>
          </Label>
          <input
            id="hwDueDate"
            type="datetime-local"
            min={minDueDate}
            aria-required="true"
            aria-invalid={!!errors.dueDate}
            disabled={isPending}
            {...register('dueDate')}
            className={cn(
              'w-full h-10 rounded-lg border border-[var(--border-default)]',
              'bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]',
              'transition-all duration-[var(--transition-fast)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]',
              'focus:border-[var(--border-focus)] focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              errors.dueDate &&
                'border-[var(--error-solid)] focus:ring-[var(--error-solid)]/30',
            )}
          />
          <FieldError message={errors.dueDate?.message} />
        </div>
      </div>

      {/* ── Max points ─────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="hwMaxPoints" className="flex items-center gap-1.5">
          <Star
            className="w-3.5 h-3.5 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          Max Points{' '}
          <span className="text-[var(--text-muted)] font-normal text-xs">
            (1–1000)
          </span>
        </Label>
        <Input
          id="hwMaxPoints"
          type="number"
          min={1}
          max={1_000}
          step={1}
          inputMode="numeric"
          aria-invalid={!!errors.maxPoints}
          disabled={isPending}
          className={cn(
            'max-w-[180px]',
            errors.maxPoints &&
              'border-[var(--error-solid)] focus-visible:ring-[var(--error-solid)]/30',
          )}
          {...register('maxPoints', { valueAsNumber: true })}
        />
        <FieldError message={errors.maxPoints?.message} />
      </div>

      {/* ── Allow resubmit toggle ───────────────────────────────────── */}
      <div className="flex items-center gap-3 py-1">
        <Switch
          id="hwAllowResubmit"
          checked={allowResubmit}
          onCheckedChange={(checked) =>
            setValue('allowResubmit', checked)
          }
          disabled={isPending}
          aria-describedby="allowResubmit-desc"
        />
        <div>
          <Label
            htmlFor="hwAllowResubmit"
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw
              className="w-3.5 h-3.5 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            Allow resubmission
          </Label>
          <p
            id="allowResubmit-desc"
            className="text-xs text-[var(--text-muted)] mt-0.5"
          >
            Students can submit their homework multiple times.
          </p>
        </div>
      </div>

      {/* ── File attachments ────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <Paperclip
            className="w-3.5 h-3.5 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          Attachments{' '}
          <span className="text-[var(--text-muted)] font-normal text-xs">
            (optional)
          </span>
        </Label>
        <FileUploadArea
          uploadedFiles={uploadedFiles}
          onUpload={handleFileUpload}
          onRemove={handleRemoveFile}
          isUploading={isUploading}
          disabled={isPending}
        />
        <FieldError message={errors.attachedFileKeys?.message} />
      </div>

      {/* ── Action buttons ──────────────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-col-reverse sm:flex-row items-stretch sm:items-center',
          'justify-end gap-3 pt-4 border-t border-[var(--border-default)]',
        )}
      >
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isPending}
          className="min-h-[44px] sm:min-h-[40px]"
        >
          Cancel
        </Button>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            type="submit"
            disabled={isPending || !isDirty || isUploading}
            className="w-full sm:w-auto min-w-[160px] min-h-[44px] sm:min-h-[40px]"
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
              'Create Homework'
            )}
          </Button>
        </motion.div>
      </div>
    </motion.form>
  );
}
