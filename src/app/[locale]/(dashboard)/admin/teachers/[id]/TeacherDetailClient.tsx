'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, Calendar, Star, Pencil, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useTeacherDetail,
  useUpdateTeacher,
  useDeleteTeacher,
} from '@/services/query/teachers.queries';
import type { TeacherStatus } from '@/services/api/teachers.api';
import { useToast } from '@shared/hooks/useToast';
import { resolveFileUrl } from '@shared/hooks/useUpdateProfile';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { ErrorState } from '@shared/components/data-display/ErrorState';
import { ConfirmDialog } from '@shared/components/feedback/ConfirmDialog';
import { AvatarWithRole } from '@shared/components/data-display/AvatarWithRole';
import { Button } from '@shared/components/ui/button';
import { Input, Textarea } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { formatLocalizedDate } from '@shared/utils/format';
import { cn } from '@shared/utils/cn';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const I18N = {
  uz: {
    backToList: "O'qituvchilarga qaytish",
    loadErrorTitle: "O'qituvchi topilmadi",
    loadErrorDesc: "Ma'lumotlarni yuklab bo'lmadi yoki bunday o'qituvchi mavjud emas.",
    retry: 'Qayta urinish',
    edit: 'Tahrirlash',
    cancel: 'Bekor qilish',
    save: 'Saqlash',
    saving: 'Saqlanmoqda…',
    deleteBtn: "O'chirish",
    fields: {
      firstName: 'Ism', lastName: 'Familiya', email: 'Email', phone: 'Telefon',
      bio: 'Bio', status: 'Holat', subjects: 'Fanlar', joined: "Qo'shilgan sana",
      rating: 'Reyting', noBio: "Bio kiritilmagan", noSubjects: "Fanlar belgilanmagan",
    },
    statusOptions: { active: 'Faol', inactive: 'Nofaol', on_leave: 'Ta\'tilda' },
    required: "Bu maydon to'ldirilishi shart",
    updateSuccess: "O'qituvchi ma'lumotlari yangilandi",
    updateError: 'Yangilashda xatolik yuz berdi',
    deleteConfirmTitle: "O'qituvchini o'chirishni tasdiqlaysizmi?",
    deleteConfirmMessage: (name: string) =>
      `"${name}" o'qituvchisi tizimdan o'chiriladi. Bu amalni bekor qilib bo'lmaydi.`,
    deleteConfirmBtn: "O'chirish",
    deleteSuccess: "O'qituvchi o'chirildi",
    deleteError: "O'chirishda xatolik yuz berdi",
    profileTitle: "O'qituvchi profili",
    danger: 'Xavfli hudud',
    dangerDesc: "O'qituvchini butunlay o'chirish.",
  },
  en: {
    backToList: 'Back to teachers',
    loadErrorTitle: 'Teacher not found',
    loadErrorDesc: "We couldn't load this teacher, or they don't exist.",
    retry: 'Retry',
    edit: 'Edit',
    cancel: 'Cancel',
    save: 'Save changes',
    saving: 'Saving…',
    deleteBtn: 'Delete',
    fields: {
      firstName: 'First Name', lastName: 'Last Name', email: 'Email', phone: 'Phone',
      bio: 'Bio', status: 'Status', subjects: 'Subjects', joined: 'Joined',
      rating: 'Rating', noBio: 'No bio provided', noSubjects: 'No subjects assigned',
    },
    statusOptions: { active: 'Active', inactive: 'Inactive', on_leave: 'On Leave' },
    required: 'This field is required',
    updateSuccess: 'Teacher updated successfully',
    updateError: 'Failed to update teacher',
    deleteConfirmTitle: 'Delete this teacher?',
    deleteConfirmMessage: (name: string) =>
      `"${name}" will be permanently removed. This action cannot be undone.`,
    deleteConfirmBtn: 'Delete',
    deleteSuccess: 'Teacher deleted successfully',
    deleteError: 'Failed to delete teacher',
    profileTitle: 'Teacher Profile',
    danger: 'Danger Zone',
    dangerDesc: 'Permanently delete this teacher.',
  },
  ru: {
    backToList: 'Назад к преподавателям',
    loadErrorTitle: 'Преподаватель не найден',
    loadErrorDesc: 'Не удалось загрузить данные или преподаватель не существует.',
    retry: 'Повторить',
    edit: 'Редактировать',
    cancel: 'Отмена',
    save: 'Сохранить',
    saving: 'Сохранение…',
    deleteBtn: 'Удалить',
    fields: {
      firstName: 'Имя', lastName: 'Фамилия', email: 'Email', phone: 'Телефон',
      bio: 'Биография', status: 'Статус', subjects: 'Предметы', joined: 'Дата найма',
      rating: 'Рейтинг', noBio: 'Биография не указана', noSubjects: 'Предметы не назначены',
    },
    statusOptions: { active: 'Активен', inactive: 'Неактивен', on_leave: 'В отпуске' },
    required: 'Это поле обязательно',
    updateSuccess: 'Данные преподавателя обновлены',
    updateError: 'Не удалось обновить данные',
    deleteConfirmTitle: 'Удалить этого преподавателя?',
    deleteConfirmMessage: (name: string) =>
      `"${name}" будет удалён без возможности восстановления.`,
    deleteConfirmBtn: 'Удалить',
    deleteSuccess: 'Преподаватель удалён',
    deleteError: 'Не удалось удалить преподавателя',
    profileTitle: 'Профиль преподавателя',
    danger: 'Опасная зона',
    dangerDesc: 'Полностью удалить этого преподавателя.',
  },
} as const;

type Locale = keyof typeof I18N;

// ─── Form schema ──────────────────────────────────────────────────────────────

const editSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  bio: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on_leave']),
});

type EditFormValues = z.infer<typeof editSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

interface TeacherDetailClientProps {
  teacherId: string;
  locale: string;
}

export function TeacherDetailClient({ teacherId, locale }: TeacherDetailClientProps) {
  const t = I18N[(locale as Locale) in I18N ? (locale as Locale) : 'en'];
  const router = useRouter();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: teacher, isLoading, isError, refetch } = useTeacherDetail(teacherId);
  const updateMutation = useUpdateTeacher(teacherId);
  const deleteMutation = useDeleteTeacher();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { firstName: '', lastName: '', phone: '', bio: '', status: 'active' },
  });

  useEffect(() => {
    if (teacher) {
      reset({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phone: teacher.phone ?? '',
        bio: teacher.bio ?? '',
        status: teacher.status === 'on_leave' ? 'on_leave' : teacher.status,
      });
    }
  }, [teacher, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone ?? '',
        bio: values.bio ?? '',
        status: values.status as TeacherStatus,
      });
      toast.success(t.updateSuccess);
      setIsEditing(false);
    } catch {
      toast.error(t.updateError);
    }
  });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(teacherId);
      toast.success(t.deleteSuccess);
      router.push(`/${locale}/admin/teachers`);
    } catch {
      toast.error(t.deleteError);
      setIsDeleteOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        <SkeletonLoader variant="card" count={1} />
        <SkeletonLoader variant="card" count={1} />
      </div>
    );
  }

  if (isError || !teacher) {
    return (
      <div className="max-w-3xl px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        <ErrorState
          title={t.loadErrorTitle}
          error={t.loadErrorDesc}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const fullName = `${teacher.firstName} ${teacher.lastName}`.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6 max-w-3xl px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6"
    >
      {/* Back link */}
      <Link
        href={`/${locale}/admin/teachers`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        {t.backToList}
      </Link>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <div
          className="px-5 py-3.5 border-b border-[var(--border-default)] flex items-center justify-between"
          style={{ background: 'var(--bg-surface-secondary)' }}
        >
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t.profileTitle}</h3>
          {!isEditing && (
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil size={13} className="mr-1.5" aria-hidden="true" />
              {t.edit}
            </Button>
          )}
        </div>

        {!isEditing ? (
          <div className="px-5 py-5 space-y-5">
            <div className="flex items-center gap-4">
              <AvatarWithRole
                user={{
                  firstName: teacher.firstName,
                  lastName: teacher.lastName,
                  role: 'teacher',
                  avatar: teacher.avatarUrl ? resolveFileUrl(teacher.avatarUrl) : null,
                }}
                size="lg"
              />
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">{fullName}</h2>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 mt-1.5 text-xs font-medium',
                    teacher.status === 'active'
                      ? 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]'
                      : 'border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)]',
                  )}
                >
                  {t.statusOptions[teacher.status === 'on_leave' ? 'on_leave' : teacher.status]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={Mail} label={t.fields.email} value={teacher.email} />
              <InfoRow icon={Phone} label={t.fields.phone} value={teacher.phone || '—'} />
              <InfoRow
                icon={Calendar}
                label={t.fields.joined}
                value={formatLocalizedDate(teacher.createdAt, locale, 'long')}
              />
              {teacher.rating !== undefined && (
                <InfoRow icon={Star} label={t.fields.rating} value={teacher.rating.toFixed(1)} />
              )}
            </div>

            <div className="space-y-1.5">
              <Label>{t.fields.subjects}</Label>
              {teacher.subjects.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {teacher.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="inline-flex items-center rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-2.5 py-0.5 text-xs font-medium"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">{t.fields.noSubjects}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>{t.fields.bio}</Label>
              <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                {teacher.bio || t.fields.noBio}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)} className="px-5 py-5 space-y-5" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="td-firstName" required>{t.fields.firstName}</Label>
                <Input
                  id="td-firstName"
                  hasError={!!errors.firstName}
                  aria-describedby={errors.firstName ? 'td-firstName-err' : undefined}
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p id="td-firstName-err" role="alert" className="text-xs text-[var(--error-text)]">
                    {t.required}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="td-lastName" required>{t.fields.lastName}</Label>
                <Input
                  id="td-lastName"
                  hasError={!!errors.lastName}
                  aria-describedby={errors.lastName ? 'td-lastName-err' : undefined}
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p id="td-lastName-err" role="alert" className="text-xs text-[var(--error-text)]">
                    {t.required}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="td-email">{t.fields.email}</Label>
                <Input id="td-email" type="email" value={teacher.email} readOnly disabled />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="td-phone">{t.fields.phone}</Label>
                <Input id="td-phone" type="tel" inputMode="tel" {...register('phone')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="td-status">{t.fields.status}</Label>
              <select
                id="td-status"
                {...register('status')}
                className="flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors hover:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:border-[var(--border-focus)]"
              >
                <option value="active">{t.statusOptions.active}</option>
                <option value="inactive">{t.statusOptions.inactive}</option>
                <option value="on_leave">{t.statusOptions.on_leave}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="td-bio">{t.fields.bio}</Label>
              <Textarea id="td-bio" {...register('bio')} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  reset({
                    firstName: teacher.firstName,
                    lastName: teacher.lastName,
                    phone: teacher.phone ?? '',
                    bio: teacher.bio ?? '',
                    status: teacher.status === 'on_leave' ? 'on_leave' : teacher.status,
                  });
                }}
              >
                <X size={14} className="mr-1.5" aria-hidden="true" />
                {t.cancel}
              </Button>
              <Button type="submit" isLoading={updateMutation.isPending}>
                {updateMutation.isPending ? t.saving : t.save}
              </Button>
            </div>
          </form>
        )}
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.25 }}
        className="rounded-2xl border border-[var(--error-border)] bg-[var(--error-bg)]/30 px-5 py-4 flex items-center justify-between gap-4"
      >
        <div>
          <h3 className="text-sm font-semibold text-[var(--error-text)]">{t.danger}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{t.dangerDesc}</p>
        </div>
        <Button type="button" variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)}>
          <Trash2 size={13} className="mr-1.5" aria-hidden="true" />
          {t.deleteBtn}
        </Button>
      </motion.div>

      <ConfirmDialog
        open={isDeleteOpen}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteOpen(false)}
        title={t.deleteConfirmTitle}
        description={t.deleteConfirmMessage(fullName)}
        confirmLabel={t.deleteConfirmBtn}
        cancelLabel={t.cancel}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </motion.div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="mt-0.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{value}</p>
      </div>
    </div>
  );
}
