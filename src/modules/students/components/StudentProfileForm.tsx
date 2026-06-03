'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useStudentProfile } from '../hooks/useStudentProfile';
import { parseApiError } from '@shared/utils/api-error';
import type { StudentFormValues } from '../types/student.types';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(7, 'Phone is required'),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  avatarKey: z.string().nullable(),
  languagePreference: z.enum(['en', 'uz', 'ru']),
  themePreference: z.enum(['light', 'dark', 'system']),
});

interface StudentProfileFormProps {
  studentId: string;
}

export function StudentProfileForm({ studentId }: StudentProfileFormProps) {
  const { formValues, isLoading, update, isUpdating } = useStudentProfile(studentId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors, isDirty },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(schema),
    ...(formValues ? { defaultValues: formValues } : {}),
  });

  useEffect(() => {
    if (formValues) reset(formValues);
  }, [formValues, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await update(values);
    } catch (err: unknown) {
      const parsed = parseApiError(err as Record<string, unknown>);
      Object.entries(parsed.errors).forEach(([field, messages]) => {
        // exactOptionalPropertyTypes requires message to be string, not string | undefined
        const msg = (Array.isArray(messages) ? messages[0] : String(messages)) ?? 'Invalid value';
        setError(field as keyof StudentFormValues, {
          type: 'server',
          message: msg,
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

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
          Photo
        </div>
        <div>
          <p className="text-sm font-medium">Profile Photo</p>
          <p className="text-xs text-muted-foreground mt-0.5">PNG or JPG, max 2MB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" {...register('firstName')} placeholder="John" />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" {...register('lastName')} placeholder="Doe" />
          {errors.lastName && (
            <p className="text-xs text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          readOnly
          className="bg-muted cursor-not-allowed"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          {...register('phone')}
          placeholder="+998 90 123 4567"
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...register('address')} placeholder="123 Main St, City" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Language</Label>
          <Select
            value={watch('languagePreference')}
            onValueChange={(v) =>
              setValue('languagePreference', v as StudentFormValues['languagePreference'], {
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
              setValue('themePreference', v as StudentFormValues['themePreference'], {
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