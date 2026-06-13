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
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Button } from '@shared/components/ui/button';
import { useToast } from '@shared/hooks/useToast';
import { useAdminStudents } from '@modules/admin/hooks/useAdmin';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const I18N = {
  uz: {
    title: "Yangi talaba qo'shish",
    description: "Talaba hisobini yaratish uchun ma'lumotlarni kiriting.",
    firstName: 'Ism', lastName: 'Familiya', email: 'Email', phone: 'Telefon',
    password: 'Parol',
    cancel: 'Bekor qilish', submit: "Qo'shish", submitting: 'Saqlanmoqda…',
    success: 'Talaba muvaffaqiyatli qo\'shildi',
    error: "Talaba qo'shishda xatolik yuz berdi",
    required: "Bu maydon to'ldirilishi shart",
    invalidEmail: "Email manzili noto'g'ri",
    passwordHint: 'Kamida 8 belgi',
  },
  en: {
    title: 'Add New Student',
    description: "Enter the student's details to create their account.",
    firstName: 'First Name', lastName: 'Last Name', email: 'Email', phone: 'Phone',
    password: 'Password',
    cancel: 'Cancel', submit: 'Add Student', submitting: 'Saving…',
    success: 'Student added successfully',
    error: 'Failed to add student',
    required: 'This field is required',
    invalidEmail: 'Invalid email address',
    passwordHint: 'Minimum 8 characters',
  },
  ru: {
    title: 'Добавить студента',
    description: 'Введите данные студента для создания аккаунта.',
    firstName: 'Имя', lastName: 'Фамилия', email: 'Email', phone: 'Телефон',
    password: 'Пароль',
    cancel: 'Отмена', submit: 'Добавить', submitting: 'Сохранение…',
    success: 'Студент успешно добавлен',
    error: 'Не удалось добавить студента',
    required: 'Это поле обязательно',
    invalidEmail: 'Неверный email адрес',
    passwordHint: 'Минимум 8 символов',
  },
} as const;

export type AddStudentLocale = keyof typeof I18N;

// ─── Form schema ──────────────────────────────────────────────────────────────

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: AddStudentLocale;
}

export function AddStudentDialog({ open, onOpenChange, locale }: AddStudentDialogProps) {
  const t = I18N[locale];
  const { createStudent, isCreatingStudent } = useAdminStudents();
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
      await createStudent({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        ...(values.phone ? { phone: values.phone } : {}),
        password: values.password,
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
              <Label htmlFor="as-firstName" required>{t.firstName}</Label>
              <Input
                id="as-firstName"
                autoComplete="given-name"
                hasError={!!errors.firstName}
                aria-describedby={errors.firstName ? 'as-firstName-err' : undefined}
                {...register('firstName')}
              />
              {errors.firstName && (
                <p id="as-firstName-err" role="alert" className="text-xs text-[var(--error-text)]">
                  {t.required}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="as-lastName" required>{t.lastName}</Label>
              <Input
                id="as-lastName"
                autoComplete="family-name"
                hasError={!!errors.lastName}
                aria-describedby={errors.lastName ? 'as-lastName-err' : undefined}
                {...register('lastName')}
              />
              {errors.lastName && (
                <p id="as-lastName-err" role="alert" className="text-xs text-[var(--error-text)]">
                  {t.required}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="as-email" required>{t.email}</Label>
            <Input
              id="as-email"
              type="email"
              autoComplete="email"
              hasError={!!errors.email}
              aria-describedby={errors.email ? 'as-email-err' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p id="as-email-err" role="alert" className="text-xs text-[var(--error-text)]">
                {t.invalidEmail}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="as-phone">{t.phone}</Label>
              <Input id="as-phone" type="tel" autoComplete="tel" {...register('phone')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="as-password" required>{t.password}</Label>
              <Input
                id="as-password"
                type="password"
                showPasswordToggle
                autoComplete="new-password"
                hasError={!!errors.password}
                aria-describedby="as-password-hint"
                {...register('password')}
              />
              <p id="as-password-hint" className="text-xs text-[var(--text-muted)]">
                {t.passwordHint}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" isLoading={isCreatingStudent}>
              {isCreatingStudent ? t.submitting : t.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
