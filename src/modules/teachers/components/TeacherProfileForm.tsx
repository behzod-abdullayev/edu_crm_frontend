'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dynamic from 'next/dynamic';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { useTeacherProfile } from '@/modules/teachers/hooks/useTeacher';
import { parseApiError } from '@shared/utils/api-error';
import type { TeacherFormValues } from '../types/teacher.types';

// Named export → wrap in default so Next.js dynamic() can load it.
const RichTextEditor = dynamic(
  () => import('@shared/components/forms/RichTextEditor').then((m) => ({ default: m.RichTextEditor })),
  { ssr: false },
);

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7),
  bio: z.string().optional(),
  qualifications: z.string().optional(),
  avatarKey: z.string().nullable(),
  languagePreference: z.enum(['en', 'uz', 'ru']),
  themePreference: z.enum(['light', 'dark', 'system']),
});

export function TeacherProfileForm({ teacherId }: { teacherId: string }) {
  const { formValues, isLoading, update, isUpdating } = useTeacherProfile(teacherId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(schema),
    ...(formValues ? { defaultValues: formValues } : {}),
  });

  useEffect(() => {
    if (formValues) reset(formValues);
  }, [formValues, reset]);

  const onSubmit = handleSubmit(async (values: TeacherFormValues) => {
    try {
      await update(values);
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      Object.entries(parsed.errors).forEach(([field, messages]) => {
        setError(field as keyof TeacherFormValues, {
          type: 'server',
          message: (Array.isArray(messages) ? messages[0] : String(messages)) ?? '',
        });
      });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const avatarKey = watch('avatarKey');

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
          {avatarKey ? '📷' : 'Photo'}
        </div>
        <div>
          <p className="text-sm font-medium">Profile Photo</p>
          <p className="text-xs text-muted-foreground mt-0.5">PNG or JPG</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>First Name</Label>
          <Input {...register('firstName')} />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Last Name</Label>
          <Input {...register('lastName')} />
          {errors.lastName && (
            <p className="text-xs text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input {...register('email')} readOnly className="bg-muted cursor-not-allowed" />
      </div>

      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input type="tel" {...register('phone')} />
      </div>

      <div className="space-y-1.5">
        <Label>Bio</Label>
        <RichTextEditor
          value={watch('bio') ?? ''}
          onChange={(v: string) => setValue('bio', v, { shouldDirty: true })}
          placeholder="Tell students about yourself…"
          className="min-h-[120px] rounded-lg border border-border"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Qualifications</Label>
        <Input
          {...register('qualifications')}
          placeholder="e.g. M.Sc. Mathematics, Certified Educator"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Language</Label>
          <Select
            value={watch('languagePreference')}
            onValueChange={(v) =>
              setValue('languagePreference', v as TeacherFormValues['languagePreference'], {
                shouldDirty: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="uz">O&apos;zbek</SelectItem>
              <SelectItem value="ru">Русский</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Theme</Label>
          <Select
            value={watch('themePreference')}
            onValueChange={(v) =>
              setValue('themePreference', v as TeacherFormValues['themePreference'], {
                shouldDirty: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={!isDirty || isUpdating} className="min-w-[120px]">
          {isUpdating ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              Saving…
            </span>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
