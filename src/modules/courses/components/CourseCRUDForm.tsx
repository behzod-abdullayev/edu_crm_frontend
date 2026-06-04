'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ImageIcon, Loader2, Save, X } from 'lucide-react';
import { httpClient } from '@/services/api/axios.instance';
import { queryKeys } from '@/services/query/keys.factory';
import { useToast } from '@shared/hooks/useToast';
import { parseApiError, mapApiErrorsToForm } from '@shared/utils/api-error';
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
import { cn } from '@shared/utils/cn';
import {
  mapCourseDtoToForm,
  mapCourseFormToDto,
  type CourseDto,
} from '../utils/course.mapper';
import type { CourseFormValues } from '../types/course.types';

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const courseSchema = z.object({
  name: z
    .string()
    .min(1, 'Course name is required')
    .max(200, 'Course name must be 200 characters or fewer'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be 2000 characters or fewer'),
  thumbnailKey: z.string().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  isPublished: z.boolean(),
});

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_OPTIONS: { value: CourseFormValues['level']; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const DEFAULT_VALUES: CourseFormValues = {
  name: '',
  description: '',
  thumbnailKey: null,
  categoryId: '',
  level: 'beginner',
  isPublished: false,
};

// ─── Animation variants ───────────────────────────────────────────────────────

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.25, ease: 'easeOut' },
  }),
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface CourseCRUDFormProps {
  course?: CourseDto;
  onSuccess?: () => void;
  /** Called when the user explicitly cancels */
  onCancel?: () => void;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CourseCRUDForm({
  course,
  onSuccess,
  onCancel,
  className,
}: CourseCRUDFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!course;

  // ── Mutation ──────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async (values: CourseFormValues): Promise<CourseDto> => {
      const dto = mapCourseFormToDto(values);
      if (isEdit) {
        const res = await httpClient.patch<CourseDto>(`/courses/${course.id}`, dto);
        return res.data;
      }
      const res = await httpClient.post<CourseDto>('/courses', dto);
      return res.data;
    },
    onSuccess: (updated) => {
      if (isEdit) {
        // Targeted cache patch — avoid blanket invalidation
        queryClient.setQueryData(
          queryKeys.courses.detail(updated.id),
          updated,
        );
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
      toast.success(isEdit ? 'Course updated successfully' : 'Course created successfully');
      onSuccess?.();
      if (!isEdit) router.push('/admin/courses');
    },
  });

  // ── Form ──────────────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: course ? mapCourseDtoToForm(course) : DEFAULT_VALUES,
  });

  // Sync when course prop changes (e.g. parent re-fetches)
  useEffect(() => {
    if (course) reset(mapCourseDtoToForm(course));
  }, [course, reset]);

  const isPublished = watch('isPublished');
  const currentLevel = watch('level');
  const isBusy = saveMutation.isPending || isSubmitting;

  // ── Submit handler ────────────────────────────────────────────────────────

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveMutation.mutateAsync(values);
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      // Map field-level API errors → React Hook Form
      mapApiErrorsToForm(parsed, setError);
      // Show toast only if there are no field errors to display inline
      if (Object.keys(parsed.errors).length === 0) {
        toast.error(parsed.message || `Failed to ${isEdit ? 'update' : 'create'} course`);
      }
    }
  });

  // ── Cancel handler ────────────────────────────────────────────────────────

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn('space-y-6', className)}
      aria-label={isEdit ? 'Edit course form' : 'Create course form'}
    >
      {/* ── Thumbnail ── */}
      <motion.div
        custom={0}
        variants={fieldVariants}
        initial="hidden"
        animate="visible"
        className="space-y-1.5"
      >
        <Label>Course Thumbnail</Label>
        <motion.div
          whileHover={{ borderColor: 'var(--border-focus)' }}
          transition={{ duration: 0.15 }}
          className={cn(
            'relative h-36 rounded-xl border-2 border-dashed border-[var(--border-default)]',
            'flex flex-col items-center justify-center gap-2',
            'cursor-pointer bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-surface-hover)]',
            'transition-colors duration-[var(--transition-base)]',
          )}
          role="button"
          tabIndex={0}
          aria-label="Upload course thumbnail"
        >
          <ImageIcon
            className="w-8 h-8 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          <p className="text-sm text-[var(--text-muted)]">
            Click or drag to upload thumbnail
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            PNG, JPG, WebP — max 5 MB
          </p>
        </motion.div>
      </motion.div>

      {/* ── Course Name ── */}
      <motion.div
        custom={1}
        variants={fieldVariants}
        initial="hidden"
        animate="visible"
        className="space-y-1.5"
      >
        <Label htmlFor="courseName">
          Course Name{' '}
          <span className="text-[var(--error-solid)]" aria-hidden="true">
            *
          </span>
        </Label>
        <Input
          id="courseName"
          {...register('name')}
          placeholder="e.g. Advanced Mathematics"
          aria-required="true"
          aria-describedby={errors.name ? 'courseName-error' : undefined}
          aria-invalid={!!errors.name}
          inputState={errors.name ? 'error' : 'default'}
          autoComplete="off"
        />
        {errors.name && (
          <motion.p
            id="courseName-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-[var(--error-text)]"
            role="alert"
          >
            {errors.name.message}
          </motion.p>
        )}
      </motion.div>

      {/* ── Description ── */}
      <motion.div
        custom={2}
        variants={fieldVariants}
        initial="hidden"
        animate="visible"
        className="space-y-1.5"
      >
        <Label htmlFor="courseDescription">
          Description{' '}
          <span className="text-[var(--error-solid)]" aria-hidden="true">
            *
          </span>
        </Label>
        <textarea
          id="courseDescription"
          {...register('description')}
          placeholder="What will students learn in this course?"
          rows={4}
          aria-required="true"
          aria-describedby={errors.description ? 'courseDescription-error' : undefined}
          aria-invalid={!!errors.description}
          className={cn(
            'w-full min-h-[44px] rounded-[var(--radius-md)] border bg-[var(--bg-surface)]',
            'px-3 py-2.5 text-sm text-[var(--text-primary)]',
            'placeholder:text-[var(--text-muted)]',
            'resize-none outline-none',
            'transition-[border-color,box-shadow] duration-[var(--transition-fast)]',
            'focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:border-[var(--border-focus)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            errors.description
              ? 'border-[var(--error-border)] hover:border-[var(--error-border)]'
              : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
          )}
        />
        {errors.description && (
          <motion.p
            id="courseDescription-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-[var(--error-text)]"
            role="alert"
          >
            {errors.description.message}
          </motion.p>
        )}
      </motion.div>

      {/* ── Level + Category ── */}
      <motion.div
        custom={3}
        variants={fieldVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {/* Level */}
        <div className="space-y-1.5">
          <Label htmlFor="courseLevel">Level</Label>
          <Select
            value={currentLevel}
            onValueChange={(v) =>
              setValue('level', v as CourseFormValues['level'], {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger
              id="courseLevel"
              aria-label="Select course level"
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label htmlFor="categoryId">
            Category{' '}
            <span className="text-[var(--error-solid)]" aria-hidden="true">
              *
            </span>
          </Label>
          <Input
            id="categoryId"
            {...register('categoryId')}
            placeholder="e.g. Mathematics"
            aria-required="true"
            aria-describedby={errors.categoryId ? 'categoryId-error' : undefined}
            aria-invalid={!!errors.categoryId}
            inputState={errors.categoryId ? 'error' : 'default'}
            autoComplete="off"
          />
          {errors.categoryId && (
            <motion.p
              id="categoryId-error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-[var(--error-text)]"
              role="alert"
            >
              {errors.categoryId.message}
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* ── Published toggle ── */}
      <motion.div
        custom={4}
        variants={fieldVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          'flex items-center gap-3 p-4 rounded-xl border border-[var(--border-default)]',
          'bg-[var(--bg-surface-secondary)]',
          isPublished &&
            'border-[var(--success-border)] bg-[var(--success-bg)]',
          'transition-colors duration-[var(--transition-base)]',
        )}
      >
        <Switch
          id="isPublished"
          checked={isPublished}
          onCheckedChange={(v) =>
            setValue('isPublished', v, { shouldDirty: true })
          }
          aria-describedby="isPublished-hint"
        />
        <div className="min-w-0">
          <Label
            htmlFor="isPublished"
            className="cursor-pointer font-medium text-sm"
          >
            {isPublished ? 'Published' : 'Draft'}
          </Label>
          <p
            id="isPublished-hint"
            className="text-xs text-[var(--text-muted)] mt-0.5"
          >
            {isPublished
              ? 'Visible to enrolled students'
              : 'Hidden from students until published'}
          </p>
        </div>
      </motion.div>

      {/* ── Actions ── */}
      <motion.div
        custom={5}
        variants={fieldVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          'flex items-center gap-3 pt-2',
          // Mobile: stack vertically, full-width buttons
          'flex-col sm:flex-row sm:justify-end',
        )}
      >
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isBusy}
          className="w-full sm:w-auto gap-2"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          Cancel
        </Button>

        <motion.div
          whileTap={{ scale: 0.97 }}
          className="w-full sm:w-auto"
        >
          <Button
            type="submit"
            disabled={isBusy || (!isDirty && isEdit)}
            className="w-full sm:w-auto min-w-[140px] gap-2"
            aria-busy={isBusy}
          >
            {isBusy ? (
              <>
                <Loader2
                  className="w-4 h-4 animate-spin"
                  aria-hidden="true"
                />
                {isEdit ? 'Saving…' : 'Creating…'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" aria-hidden="true" />
                {isEdit ? 'Save Changes' : 'Create Course'}
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </form>
  );
}
