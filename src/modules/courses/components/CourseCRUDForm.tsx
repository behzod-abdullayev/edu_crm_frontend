'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { ImageIcon, Loader2, Save, X } from 'lucide-react';
import { httpClient } from '@/services/api/axios.instance';
import { queryKeys } from '@/services/query/keys.factory';
import { resolveFileUrl } from '@/shared/hooks/useUpdateProfile';
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

// ─── i18n ─────────────────────────────────────────────────────────────────────

const I18N = {
  uz: {
    formAriaCreate: 'Kurs yaratish formasi', formAriaEdit: 'Kursni tahrirlash formasi',
    thumbnailLabel: 'Kurs rasmi', thumbnailUploadAria: 'Kurs rasmini yuklash',
    thumbnailHint: "Rasm yuklash uchun bosing yoki shu yerga tashlang",
    thumbnailSizeHint: 'PNG, JPG, WebP — maksimal 5 MB',
    thumbnailUploading: 'Yuklanmoqda…', thumbnailRemove: "Rasmni o'chirish",
    thumbnailInvalidType: 'Faqat rasm fayllarini yuklash mumkin',
    thumbnailTooLarge: "Fayl hajmi 5 MB dan oshmasligi kerak",
    thumbnailUploadFailed: "Rasmni yuklab bo'lmadi",
    nameLabel: 'Kurs nomi', namePlaceholder: 'Masalan: Oliy matematika',
    nameRequired: 'Kurs nomini kiriting', nameMaxLength: "Kurs nomi 200 belgidan oshmasligi kerak",
    descriptionLabel: 'Tavsif', descriptionPlaceholder: "Talabalar bu kursda nimani o'rganadi?",
    descriptionRequired: 'Tavsifni kiriting', descriptionMaxLength: "Tavsif 2000 belgidan oshmasligi kerak",
    levelLabel: 'Daraja', levelBeginner: "Boshlang'ich", levelIntermediate: "O'rta", levelAdvanced: 'Yuqori',
    categoryLabel: 'Kategoriya', categoryPlaceholder: 'Masalan: Matematika (ixtiyoriy)',
    publishedLabel: "E'lon qilingan", draftLabel: 'Qoralama',
    publishedHint: 'Talabalarga ko‘rinadi', draftHint: "E'lon qilinmaguncha talabalardan yashirin",
    cancelBtn: 'Bekor qilish', createBtn: 'Kurs yaratish', saveBtn: 'Saqlash',
    creatingBtn: 'Yaratilmoqda…', savingBtn: 'Saqlanmoqda…',
    createSuccess: 'Kurs muvaffaqiyatli yaratildi', updateSuccess: 'Kurs muvaffaqiyatli yangilandi',
    createError: "Kursni yaratib bo'lmadi", updateError: "Kursni yangilab bo'lmadi",
  },
  en: {
    formAriaCreate: 'Create course form', formAriaEdit: 'Edit course form',
    thumbnailLabel: 'Course Thumbnail', thumbnailUploadAria: 'Upload course thumbnail',
    thumbnailHint: 'Click or drag to upload thumbnail',
    thumbnailSizeHint: 'PNG, JPG, WebP — max 5 MB',
    thumbnailUploading: 'Uploading…', thumbnailRemove: 'Remove image',
    thumbnailInvalidType: 'Only image files can be uploaded',
    thumbnailTooLarge: 'File size must not exceed 5 MB',
    thumbnailUploadFailed: 'Failed to upload image',
    nameLabel: 'Course Name', namePlaceholder: 'e.g. Advanced Mathematics',
    nameRequired: 'Course name is required', nameMaxLength: 'Course name must be 200 characters or fewer',
    descriptionLabel: 'Description', descriptionPlaceholder: 'What will students learn in this course?',
    descriptionRequired: 'Description is required', descriptionMaxLength: 'Description must be 2000 characters or fewer',
    levelLabel: 'Level', levelBeginner: 'Beginner', levelIntermediate: 'Intermediate', levelAdvanced: 'Advanced',
    categoryLabel: 'Category', categoryPlaceholder: 'e.g. Mathematics (optional)',
    publishedLabel: 'Published', draftLabel: 'Draft',
    publishedHint: 'Visible to enrolled students', draftHint: 'Hidden from students until published',
    cancelBtn: 'Cancel', createBtn: 'Create Course', saveBtn: 'Save Changes',
    creatingBtn: 'Creating…', savingBtn: 'Saving…',
    createSuccess: 'Course created successfully', updateSuccess: 'Course updated successfully',
    createError: 'Failed to create course', updateError: 'Failed to update course',
  },
  ru: {
    formAriaCreate: 'Форма создания курса', formAriaEdit: 'Форма редактирования курса',
    thumbnailLabel: 'Изображение курса', thumbnailUploadAria: 'Загрузить изображение курса',
    thumbnailHint: 'Нажмите или перетащите файл для загрузки',
    thumbnailSizeHint: 'PNG, JPG, WebP — макс. 5 МБ',
    thumbnailUploading: 'Загрузка…', thumbnailRemove: 'Удалить изображение',
    thumbnailInvalidType: 'Можно загружать только файлы изображений',
    thumbnailTooLarge: 'Размер файла не должен превышать 5 МБ',
    thumbnailUploadFailed: 'Не удалось загрузить изображение',
    nameLabel: 'Название курса', namePlaceholder: 'например, Высшая математика',
    nameRequired: 'Введите название курса', nameMaxLength: 'Название курса не должно превышать 200 символов',
    descriptionLabel: 'Описание', descriptionPlaceholder: 'Что студенты изучат на этом курсе?',
    descriptionRequired: 'Введите описание', descriptionMaxLength: 'Описание не должно превышать 2000 символов',
    levelLabel: 'Уровень', levelBeginner: 'Начальный', levelIntermediate: 'Средний', levelAdvanced: 'Продвинутый',
    categoryLabel: 'Категория', categoryPlaceholder: 'например, Математика (необязательно)',
    publishedLabel: 'Опубликован', draftLabel: 'Черновик',
    publishedHint: 'Виден зачисленным студентам', draftHint: 'Скрыт от студентов до публикации',
    cancelBtn: 'Отмена', createBtn: 'Создать курс', saveBtn: 'Сохранить изменения',
    creatingBtn: 'Создание…', savingBtn: 'Сохранение…',
    createSuccess: 'Курс успешно создан', updateSuccess: 'Курс успешно обновлён',
    createError: 'Не удалось создать курс', updateError: 'Не удалось обновить курс',
  },
} as const;

type Locale = keyof typeof I18N;

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_VALUES: CourseFormValues = {
  title: '',
  description: '',
  thumbnailUrl: null,
  categoryId: '',
  difficultyLevel: 'beginner',
  isPublished: false,
};

const ACCEPTED_THUMBNAIL_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024;

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
  const locale = useLocale();
  const s = I18N[locale as Locale] ?? I18N.en;
  const isEdit = !!course;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ── Zod schema (localized) ───────────────────────────────────────────────

  const courseSchema = useMemo(
    () =>
      z.object({
        title: z
          .string()
          .min(1, s.nameRequired)
          .max(200, s.nameMaxLength),
        description: z
          .string()
          .min(1, s.descriptionRequired)
          .max(2000, s.descriptionMaxLength),
        thumbnailUrl: z.string().nullable(),
        categoryId: z.string(),
        difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
        isPublished: z.boolean(),
      }),
    [s],
  );

  const LEVEL_OPTIONS: { value: CourseFormValues['difficultyLevel']; label: string }[] = [
    { value: 'beginner', label: s.levelBeginner },
    { value: 'intermediate', label: s.levelIntermediate },
    { value: 'advanced', label: s.levelAdvanced },
  ];

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
      toast.success(isEdit ? s.updateSuccess : s.createSuccess);
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
  const currentLevel = watch('difficultyLevel');
  const thumbnailUrl = watch('thumbnailUrl');
  const isBusy = saveMutation.isPending || isSubmitting;

  // ── Thumbnail upload ──────────────────────────────────────────────────────

  const handleFileSelect = async (file: File) => {
    if (!ACCEPTED_THUMBNAIL_TYPES.includes(file.type)) {
      toast.error(s.thumbnailInvalidType);
      return;
    }
    if (file.size > MAX_THUMBNAIL_SIZE) {
      toast.error(s.thumbnailTooLarge);
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await httpClient.post<{ url: string }>(
        '/files/upload?entity=course&public=true',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setValue('thumbnailUrl', resolveFileUrl(data.url), { shouldDirty: true, shouldValidate: true });
    } catch {
      toast.error(s.thumbnailUploadFailed);
    } finally {
      setIsUploading(false);
    }
  };

  const handleThumbnailDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFileSelect(file);
  };

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
        toast.error(parsed.message || (isEdit ? s.updateError : s.createError));
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
      aria-label={isEdit ? s.formAriaEdit : s.formAriaCreate}
    >
      {/* ── Thumbnail ── */}
      <motion.div
        custom={0}
        variants={fieldVariants}
        initial="hidden"
        animate="visible"
        className="space-y-1.5"
      >
        <Label>{s.thumbnailLabel}</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_THUMBNAIL_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFileSelect(file);
            e.target.value = '';
          }}
        />
        <motion.div
          whileHover={{ borderColor: 'var(--border-focus)' }}
          transition={{ duration: 0.15 }}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDrop={handleThumbnailDrop}
          onDragOver={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={cn(
            'relative h-36 rounded-xl border-2 border-dashed border-[var(--border-default)]',
            'flex flex-col items-center justify-center gap-2 overflow-hidden',
            'cursor-pointer bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-surface-hover)]',
            'transition-colors duration-[var(--transition-base)]',
          )}
          role="button"
          tabIndex={0}
          aria-label={s.thumbnailUploadAria}
        >
          {thumbnailUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setValue('thumbnailUrl', null, { shouldDirty: true });
                }}
                aria-label={s.thumbnailRemove}
                className="absolute top-2 right-2 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          ) : isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-[var(--text-muted)] animate-spin" aria-hidden="true" />
              <p className="text-sm text-[var(--text-muted)]">{s.thumbnailUploading}</p>
            </>
          ) : (
            <>
              <ImageIcon
                className="w-8 h-8 text-[var(--text-muted)]"
                aria-hidden="true"
              />
              <p className="text-sm text-[var(--text-muted)]">{s.thumbnailHint}</p>
              <p className="text-xs text-[var(--text-muted)]">{s.thumbnailSizeHint}</p>
            </>
          )}
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
        <Label htmlFor="courseTitle">
          {s.nameLabel}{' '}
          <span className="text-[var(--error-solid)]" aria-hidden="true">
            *
          </span>
        </Label>
        <Input
          id="courseTitle"
          {...register('title')}
          placeholder={s.namePlaceholder}
          aria-required="true"
          aria-describedby={errors.title ? 'courseTitle-error' : undefined}
          aria-invalid={!!errors.title}
          inputState={errors.title ? 'error' : 'default'}
          autoComplete="off"
        />
        {errors.title && (
          <motion.p
            id="courseTitle-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-[var(--error-text)]"
            role="alert"
          >
            {errors.title.message}
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
          {s.descriptionLabel}{' '}
          <span className="text-[var(--error-solid)]" aria-hidden="true">
            *
          </span>
        </Label>
        <textarea
          id="courseDescription"
          {...register('description')}
          placeholder={s.descriptionPlaceholder}
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
          <Label htmlFor="courseLevel">{s.levelLabel}</Label>
          <Select
            value={currentLevel}
            onValueChange={(v) =>
              setValue('difficultyLevel', v as CourseFormValues['difficultyLevel'], {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger
              id="courseLevel"
              aria-label={s.levelLabel}
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
          <Label htmlFor="categoryId">{s.categoryLabel}</Label>
          <Input
            id="categoryId"
            {...register('categoryId')}
            placeholder={s.categoryPlaceholder}
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
            {isPublished ? s.publishedLabel : s.draftLabel}
          </Label>
          <p
            id="isPublished-hint"
            className="text-xs text-[var(--text-muted)] mt-0.5"
          >
            {isPublished ? s.publishedHint : s.draftHint}
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
          {s.cancelBtn}
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
                {isEdit ? s.savingBtn : s.creatingBtn}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" aria-hidden="true" />
                {isEdit ? s.saveBtn : s.createBtn}
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </form>
  );
}
