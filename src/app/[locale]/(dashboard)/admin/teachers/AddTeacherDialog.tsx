'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Input, Textarea } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Button } from '@shared/components/ui/button';
import { useToast } from '@shared/hooks/useToast';
import { useAdminTeachers } from '@modules/admin/hooks/useAdmin';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const I18N = {
  uz: {
    title: "Yangi o'qituvchi qo'shish",
    description: "O'qituvchi hisobini yaratish uchun ma'lumotlarni kiriting.",
    firstName: 'Ism', lastName: 'Familiya', email: 'Email', phone: 'Telefon',
    password: 'Parol', subjects: 'Fanlar', subjectsHint: 'Vergul bilan ajratib yozing',
    bio: "Qisqacha ma'lumot",
    cancel: 'Bekor qilish', submit: "Qo'shish", submitting: 'Saqlanmoqda…',
    success: "O'qituvchi muvaffaqiyatli qo'shildi",
    error: "O'qituvchi qo'shishda xatolik yuz berdi",
    required: "Bu maydon to'ldirilishi shart",
    invalidEmail: "Email manzili noto'g'ri",
    passwordHint: 'Kamida 8 belgi',
  },
  en: {
    title: 'Add New Teacher',
    description: "Enter the teacher's details to create their account.",
    firstName: 'First Name', lastName: 'Last Name', email: 'Email', phone: 'Phone',
    password: 'Password', subjects: 'Subjects', subjectsHint: 'Separate with commas',
    bio: 'Bio',
    cancel: 'Cancel', submit: 'Add Teacher', submitting: 'Saving…',
    success: 'Teacher added successfully',
    error: 'Failed to add teacher',
    required: 'This field is required',
    invalidEmail: 'Invalid email address',
    passwordHint: 'Minimum 8 characters',
  },
  ru: {
    title: 'Добавить преподавателя',
    description: 'Введите данные преподавателя для создания аккаунта.',
    firstName: 'Имя', lastName: 'Фамилия', email: 'Email', phone: 'Телефон',
    password: 'Пароль', subjects: 'Предметы', subjectsHint: 'Разделите запятыми',
    bio: 'О себе',
    cancel: 'Отмена', submit: 'Добавить', submitting: 'Сохранение…',
    success: 'Преподаватель успешно добавлен',
    error: 'Не удалось добавить преподавателя',
    required: 'Это поле обязательно',
    invalidEmail: 'Неверный email адрес',
    passwordHint: 'Минимум 8 символов',
  },
} as const;

export type AddTeacherLocale = keyof typeof I18N;

// ─── Form schema ──────────────────────────────────────────────────────────────

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  subjects: z.string().optional(),
  bio: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  subjects: '',
  bio: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface AddTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: AddTeacherLocale;
}

export function AddTeacherDialog({ open, onOpenChange, locale }: AddTeacherDialogProps) {
  const t = I18N[locale];
  const { createTeacher, isCreatingTeacher } = useAdminTeachers();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createTeacher({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        ...(values.phone ? { phone: values.phone } : {}),
        password: values.password,
        ...(values.subjects
          ? { subjects: values.subjects.split(',').map((v) => v.trim()).filter(Boolean) }
          : {}),
        ...(values.bio ? { bio: values.bio } : {}),
      });
      toast.success(t.success);
      reset(DEFAULT_VALUES);
      onOpenChange(false);
    } catch {
      toast.error(t.error);
    }
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) reset(DEFAULT_VALUES);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="at-firstName" required>{t.firstName}</Label>
              <Input
                id="at-firstName"
                autoComplete="given-name"
                hasError={!!errors.firstName}
                aria-describedby={errors.firstName ? 'at-firstName-err' : undefined}
                {...register('firstName')}
              />
              {errors.firstName && (
                <p id="at-firstName-err" role="alert" className="text-xs text-[var(--error-text)]">
                  {t.required}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="at-lastName" required>{t.lastName}</Label>
              <Input
                id="at-lastName"
                autoComplete="family-name"
                hasError={!!errors.lastName}
                aria-describedby={errors.lastName ? 'at-lastName-err' : undefined}
                {...register('lastName')}
              />
              {errors.lastName && (
                <p id="at-lastName-err" role="alert" className="text-xs text-[var(--error-text)]">
                  {t.required}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="at-email" required>{t.email}</Label>
            <Input
              id="at-email"
              type="email"
              autoComplete="email"
              hasError={!!errors.email}
              aria-describedby={errors.email ? 'at-email-err' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="at-email-err" role="alert" className="text-xs text-[var(--error-text)]">
                {t.invalidEmail}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="at-phone">{t.phone}</Label>
              <Input id="at-phone" type="tel" autoComplete="tel" {...register('phone')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="at-password" required>{t.password}</Label>
              <Input
                id="at-password"
                type="password"
                showPasswordToggle
                autoComplete="new-password"
                hasError={!!errors.password}
                aria-describedby="at-password-hint"
                {...register('password')}
              />
              <p id="at-password-hint" className="text-xs text-[var(--text-muted)]">
                {errors.password ? t.passwordHint : t.passwordHint}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="at-subjects">{t.subjects}</Label>
            <Input id="at-subjects" placeholder={t.subjectsHint} {...register('subjects')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="at-bio">{t.bio}</Label>
            <Textarea id="at-bio" rows={3} {...register('bio')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" isLoading={isCreatingTeacher}>
              {isCreatingTeacher ? t.submitting : t.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
