'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, Calendar, Wallet, AlertCircle, Pencil, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useStudentDetail,
  useUpdateStudent,
  useDeleteStudent,
} from '@/services/query/students.queries';
import type { StudentStatus } from '@/services/api/students.api';
import { useToast } from '@shared/hooks/useToast';
import { resolveFileUrl } from '@shared/hooks/useUpdateProfile';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { ErrorState } from '@shared/components/data-display/ErrorState';
import { ConfirmDialog } from '@shared/components/feedback/ConfirmDialog';
import { AvatarWithRole } from '@shared/components/data-display/AvatarWithRole';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { formatLocalizedDate, formatCurrency, formatPercentage } from '@shared/utils/format';
import { cn } from '@shared/utils/cn';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const I18N = {
  uz: {
    backToList: "O'quvchilarga qaytish",
    loadErrorTitle: "O'quvchi topilmadi",
    loadErrorDesc: "Ma'lumotlarni yuklab bo'lmadi yoki bunday o'quvchi mavjud emas.",
    retry: 'Qayta urinish',
    edit: 'Tahrirlash',
    cancel: 'Bekor qilish',
    save: 'Saqlash',
    saving: 'Saqlanmoqda…',
    deleteBtn: "O'chirish",
    fields: {
      firstName: 'Ism', lastName: 'Familiya', email: 'Email', phone: 'Telefon',
      status: 'Holat', group: 'Guruh', enrolled: "Ro'yxatga olingan sana",
      balance: 'Balans', debt: 'Qarzdorlik', attendance: 'Davomat', noGroup: 'Guruh tayinlanmagan',
    },
    statusOptions: { active: 'Faol', inactive: 'Nofaol', suspended: 'To\'xtatilgan', graduated: 'Bitirgan' },
    required: "Bu maydon to'ldirilishi shart",
    updateSuccess: "O'quvchi ma'lumotlari yangilandi",
    updateError: 'Yangilashda xatolik yuz berdi',
    deleteConfirmTitle: "O'quvchini o'chirishni tasdiqlaysizmi?",
    deleteConfirmMessage: (name: string) =>
      `"${name}" o'quvchisi tizimdan o'chiriladi. Bu amalni bekor qilib bo'lmaydi.`,
    deleteConfirmBtn: "O'chirish",
    deleteSuccess: "O'quvchi o'chirildi",
    deleteError: "O'chirishda xatolik yuz berdi",
    profileTitle: "O'quvchi profili",
    danger: 'Xavfli hudud',
    dangerDesc: "O'quvchini butunlay o'chirish.",
  },
  en: {
    backToList: 'Back to students',
    loadErrorTitle: 'Student not found',
    loadErrorDesc: "We couldn't load this student, or they don't exist.",
    retry: 'Retry',
    edit: 'Edit',
    cancel: 'Cancel',
    save: 'Save changes',
    saving: 'Saving…',
    deleteBtn: 'Delete',
    fields: {
      firstName: 'First Name', lastName: 'Last Name', email: 'Email', phone: 'Phone',
      status: 'Status', group: 'Group', enrolled: 'Enrolled',
      balance: 'Balance', debt: 'Debt', attendance: 'Attendance', noGroup: 'No group assigned',
    },
    statusOptions: { active: 'Active', inactive: 'Inactive', suspended: 'Suspended', graduated: 'Graduated' },
    required: 'This field is required',
    updateSuccess: 'Student updated successfully',
    updateError: 'Failed to update student',
    deleteConfirmTitle: 'Delete this student?',
    deleteConfirmMessage: (name: string) =>
      `"${name}" will be permanently removed. This action cannot be undone.`,
    deleteConfirmBtn: 'Delete',
    deleteSuccess: 'Student deleted successfully',
    deleteError: 'Failed to delete student',
    profileTitle: 'Student Profile',
    danger: 'Danger Zone',
    dangerDesc: 'Permanently delete this student.',
  },
  ru: {
    backToList: 'Назад к студентам',
    loadErrorTitle: 'Студент не найден',
    loadErrorDesc: 'Не удалось загрузить данные или студент не существует.',
    retry: 'Повторить',
    edit: 'Редактировать',
    cancel: 'Отмена',
    save: 'Сохранить',
    saving: 'Сохранение…',
    deleteBtn: 'Удалить',
    fields: {
      firstName: 'Имя', lastName: 'Фамилия', email: 'Email', phone: 'Телефон',
      status: 'Статус', group: 'Группа', enrolled: 'Дата зачисления',
      balance: 'Баланс', debt: 'Задолженность', attendance: 'Посещаемость', noGroup: 'Группа не назначена',
    },
    statusOptions: { active: 'Активен', inactive: 'Неактивен', suspended: 'Приостановлен', graduated: 'Выпускник' },
    required: 'Это поле обязательно',
    updateSuccess: 'Данные студента обновлены',
    updateError: 'Не удалось обновить данные',
    deleteConfirmTitle: 'Удалить этого студента?',
    deleteConfirmMessage: (name: string) =>
      `"${name}" будет удалён без возможности восстановления.`,
    deleteConfirmBtn: 'Удалить',
    deleteSuccess: 'Студент удалён',
    deleteError: 'Не удалось удалить студента',
    profileTitle: 'Профиль студента',
    danger: 'Опасная зона',
    dangerDesc: 'Полностью удалить этого студента.',
  },
} as const;

type Locale = keyof typeof I18N;

const STATUS_STYLES: Record<StudentStatus, string> = {
  active: 'border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]',
  graduated: 'border-[var(--info-border)] bg-[var(--info-bg)] text-[var(--info-text)]',
  inactive: 'border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)]',
  suspended: 'border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)]',
};

// ─── Form schema ──────────────────────────────────────────────────────────────

const editSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'graduated']),
});

type EditFormValues = z.infer<typeof editSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

interface StudentDetailClientProps {
  studentId: string;
  locale: string;
}

export function StudentDetailClient({ studentId, locale }: StudentDetailClientProps) {
  const t = I18N[(locale as Locale) in I18N ? (locale as Locale) : 'en'];
  const router = useRouter();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: student, isLoading, isError, refetch } = useStudentDetail(studentId);
  const updateMutation = useUpdateStudent(studentId);
  const deleteMutation = useDeleteStudent();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { firstName: '', lastName: '', phone: '', status: 'active' },
  });

  useEffect(() => {
    if (student) {
      reset({
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone ?? '',
        status: student.status,
      });
    }
  }, [student, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone ?? '',
        status: values.status,
      });
      toast.success(t.updateSuccess);
      setIsEditing(false);
    } catch {
      toast.error(t.updateError);
    }
  });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(studentId);
      toast.success(t.deleteSuccess);
      router.push(`/${locale}/admin/students`);
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

  if (isError || !student) {
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

  const fullName = `${student.firstName} ${student.lastName}`.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6 max-w-3xl px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6"
    >
      {/* Back link */}
      <Link
        href={`/${locale}/admin/students`}
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
                  firstName: student.firstName,
                  lastName: student.lastName,
                  role: 'student',
                  avatar: student.avatarUrl ? resolveFileUrl(student.avatarUrl) : null,
                }}
                size="lg"
              />
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">{fullName}</h2>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 mt-1.5 text-xs font-medium',
                    STATUS_STYLES[student.status],
                  )}
                >
                  {t.statusOptions[student.status]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={Mail} label={t.fields.email} value={student.email} />
              <InfoRow icon={Phone} label={t.fields.phone} value={student.phone || '—'} />
              <InfoRow
                icon={Calendar}
                label={t.fields.enrolled}
                value={formatLocalizedDate(student.enrolledAt, locale, 'long')}
              />
              <InfoRow icon={Wallet} label={t.fields.group} value={student.groupName || t.fields.noGroup} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoRow icon={Wallet} label={t.fields.balance} value={formatCurrency(student.balance)} />
              <InfoRow
                icon={AlertCircle}
                label={t.fields.debt}
                value={formatCurrency(student.debtAmount ?? 0)}
              />
              {student.attendancePercent !== undefined && (
                <InfoRow
                  icon={Calendar}
                  label={t.fields.attendance}
                  value={formatPercentage(student.attendancePercent, false)}
                />
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)} className="px-5 py-5 space-y-5" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sd-firstName" required>{t.fields.firstName}</Label>
                <Input
                  id="sd-firstName"
                  hasError={!!errors.firstName}
                  aria-describedby={errors.firstName ? 'sd-firstName-err' : undefined}
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p id="sd-firstName-err" role="alert" className="text-xs text-[var(--error-text)]">
                    {t.required}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sd-lastName" required>{t.fields.lastName}</Label>
                <Input
                  id="sd-lastName"
                  hasError={!!errors.lastName}
                  aria-describedby={errors.lastName ? 'sd-lastName-err' : undefined}
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p id="sd-lastName-err" role="alert" className="text-xs text-[var(--error-text)]">
                    {t.required}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sd-email">{t.fields.email}</Label>
                <Input id="sd-email" type="email" value={student.email} readOnly disabled />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sd-phone">{t.fields.phone}</Label>
                <Input id="sd-phone" type="tel" inputMode="tel" {...register('phone')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sd-status">{t.fields.status}</Label>
              <select
                id="sd-status"
                {...register('status')}
                className="flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors hover:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:border-[var(--border-focus)]"
              >
                <option value="active">{t.statusOptions.active}</option>
                <option value="inactive">{t.statusOptions.inactive}</option>
                <option value="suspended">{t.statusOptions.suspended}</option>
                <option value="graduated">{t.statusOptions.graduated}</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  reset({
                    firstName: student.firstName,
                    lastName: student.lastName,
                    phone: student.phone ?? '',
                    status: student.status,
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
