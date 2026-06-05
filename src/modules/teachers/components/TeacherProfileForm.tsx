'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dynamic from 'next/dynamic';
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
import { useTeacherProfile } from '@/modules/teachers/hooks/useTeacher';
import { mapApiErrorsToForm, parseApiError } from '@shared/utils/api-error';
import type { TeacherFormValues } from '../types/teacher.types';

// ─── Lazy-load RichTextEditor (heavy, browser-only dependency) ────────────────
// Named export → wrap in default so Next.js dynamic() can load it.
const RichTextEditor = dynamic(
  () =>
    import('@shared/components/forms/RichTextEditor').then((m) => ({
      default: m.RichTextEditor,
    })),
  { ssr: false },
);

// ─── Zod schema ───────────────────────────────────────────────────────────────
//
// ✅ FIX: `bio` and `qualifications` MUST be `z.string()` — NOT `z.string().optional()`.
//
// `TeacherFormValues` declares both fields as `string` (non-optional):
//   bio: string;
//   qualifications: string;
//
// Using `.optional()` would infer `string | undefined`, which conflicts with the
// interface and causes a TypeScript type-mismatch error when the schema type is
// passed to `zodResolver<TeacherFormValues>`.  `z.string()` allows empty strings
// (which is the correct default) while staying compatible with the interface.
const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Must be a valid email'),
  phone: z.string().min(7, 'Phone must be at least 7 characters'),
  bio: z.string(),               // allows empty string — matches `bio: string`
  qualifications: z.string(),    // allows empty string — matches `qualifications: string`
  avatarKey: z.string().nullable(),
  languagePreference: z.enum(['en', 'uz', 'ru']),
  themePreference: z.enum(['light', 'dark', 'system']),
});

// ─── Component ────────────────────────────────────────────────────────────────

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
    // Provide stable defaults so controlled inputs are never uncontrolled.
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      bio: '',
      qualifications: '',
      avatarKey: null,
      languagePreference: 'en',
      themePreference: 'system',
    },
  });

  // Populate form when API data arrives (or after a profile update).
  useEffect(() => {
    if (formValues) reset(formValues);
  }, [formValues, reset]);

  const onSubmit = handleSubmit(async (values: TeacherFormValues) => {
    try {
      await update(values);
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      if (Object.keys(parsed.errors).length > 0) {
        // ✅ Use the shared utility — handles nested paths (address.city)
        // and array paths (items.0.price) automatically.
        mapApiErrorsToForm(parsed, setError);
      }
    }
  });

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div
        className="space-y-4"
        role="status"
        aria-busy="true"
        aria-label="Loading profile"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-lg bg-[var(--bg-surface-secondary)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  const avatarKey = watch('avatarKey');

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {/* ── Avatar preview row ── */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full bg-[var(--bg-surface-secondary)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] text-sm select-none shrink-0"
          aria-hidden="true"
        >
          {avatarKey !== null ? '📷' : 'Photo'}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Profile Photo
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            PNG or JPG, max 5 MB
          </p>
        </div>
      </div>

      {/* ── Name row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="tpf-firstName">
            First Name <span aria-hidden="true" className="text-[var(--error-solid)]">*</span>
          </Label>
          <Input
            id="tpf-firstName"
            autoComplete="given-name"
            aria-required="true"
            aria-invalid={errors.firstName !== undefined}
            aria-describedby={errors.firstName ? 'tpf-firstName-err' : undefined}
            {...register('firstName')}
          />
          {errors.firstName && (
            <p
              id="tpf-firstName-err"
              role="alert"
              className="text-xs text-[var(--error-text)]"
            >
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tpf-lastName">
            Last Name <span aria-hidden="true" className="text-[var(--error-solid)]">*</span>
          </Label>
          <Input
            id="tpf-lastName"
            autoComplete="family-name"
            aria-required="true"
            aria-invalid={errors.lastName !== undefined}
            aria-describedby={errors.lastName ? 'tpf-lastName-err' : undefined}
            {...register('lastName')}
          />
          {errors.lastName && (
            <p
              id="tpf-lastName-err"
              role="alert"
              className="text-xs text-[var(--error-text)]"
            >
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      {/* ── Email (read-only) ── */}
      <div className="space-y-1.5">
        <Label htmlFor="tpf-email">Email</Label>
        <Input
          id="tpf-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          readOnly
          aria-readonly="true"
          className="bg-[var(--bg-surface-secondary)] cursor-not-allowed opacity-60"
          {...register('email')}
        />
      </div>

      {/* ── Phone ── */}
      <div className="space-y-1.5">
        <Label htmlFor="tpf-phone">
          Phone <span aria-hidden="true" className="text-[var(--error-solid)]">*</span>
        </Label>
        <Input
          id="tpf-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-required="true"
          aria-invalid={errors.phone !== undefined}
          aria-describedby={errors.phone ? 'tpf-phone-err' : undefined}
          {...register('phone')}
        />
        {errors.phone && (
          <p
            id="tpf-phone-err"
            role="alert"
            className="text-xs text-[var(--error-text)]"
          >
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* ── Bio (rich text) ── */}
      <div className="space-y-1.5">
        <Label htmlFor="tpf-bio">Bio</Label>
        <RichTextEditor
          value={watch('bio')}
          onChange={(v: string) => setValue('bio', v, { shouldDirty: true })}
          placeholder="Tell students about yourself…"
          className="min-h-[120px] rounded-lg border border-[var(--border-default)]"
        />
      </div>

      {/* ── Qualifications ── */}
      <div className="space-y-1.5">
        <Label htmlFor="tpf-qualifications">Qualifications</Label>
        <Input
          id="tpf-qualifications"
          placeholder="e.g. M.Sc. Mathematics, Certified Educator"
          {...register('qualifications')}
        />
      </div>

      {/* ── Language + Theme preferences ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Language</Label>
          <Select
            value={watch('languagePreference')}
            onValueChange={(v) =>
              setValue(
                'languagePreference',
                v as TeacherFormValues['languagePreference'],
                { shouldDirty: true },
              )
            }
          >
            <SelectTrigger aria-label="Select interface language">
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
              setValue(
                'themePreference',
                v as TeacherFormValues['themePreference'],
                { shouldDirty: true },
              )
            }
          >
            <SelectTrigger aria-label="Select colour theme">
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

      {/* ── Submit button ── */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={!isDirty || isUpdating}
          aria-busy={isUpdating}
          className="min-w-[120px] sm:min-w-[140px] w-full sm:w-auto"
        >
          {isUpdating ? (
            <span className="flex items-center gap-2">
              <span
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
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