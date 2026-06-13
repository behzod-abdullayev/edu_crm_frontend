'use client';

/**
 * src/app/[locale]/(dashboard)/admin/profile/AdminProfileClient.tsx
 *
 * Editable Admin profile page:
 *  - First/last name + phone are editable and persisted via PATCH /users/me
 *    (see useUpdateProfile).
 *  - Avatar can be uploaded (POST /files/upload) and saved as avatarUrl.
 *  - "Member Since" reads `user.createdAt`.
 *  - All UI text uses next-intl translations.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Shield, Camera, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations, useLocale } from 'next-intl';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useUpdateProfile, useUploadAvatar, resolveFileUrl } from '@/shared/hooks/useUpdateProfile';
import { useToast } from '@/shared/hooks/useToast';
import { ChangePasswordForm } from '@/shared/components/ChangePasswordForm';
import { AvatarWithRole } from '@/shared/components/data-display/AvatarWithRole';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { formatLocalizedDate } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

type TabId = 'profile' | 'password';

// ─── Animation variants ───────────────────────────────────────────────────────

const panelVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
};

// ─── Form schema ──────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const MAX_AVATAR_MB = 5;

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminProfileClient() {
  const { user } = useCurrentUser();
  const { updateProfile, isUpdating } = useUpdateProfile();
  const { uploadAvatar, isUploading } = useUploadAvatar();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const TABS = [
    { id: 'profile' as const, label: t('title'), icon: User },
    { id: 'password' as const, label: t('security'), icon: Lock },
  ];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '', phone: '' },
  });

  // Populate form once the current user has loaded (or after a refetch).
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phone: user.phone ?? '',
      });
    }
  }, [user, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProfile(values);
      toast.success(t('profileUpdated'));
    } catch {
      toast.error(tc('error'));
    }
  });

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(te('invalidFileType'));
      e.target.value = '';
      return;
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      toast.error(te('fileTooLarge', { max: MAX_AVATAR_MB }));
      e.target.value = '';
      return;
    }

    try {
      const result = await uploadAvatar(file);
      await updateProfile({ avatarUrl: resolveFileUrl(result.url) });
      toast.success(t('profileUpdated'));
    } catch {
      toast.error(te('uploadFailed'));
    } finally {
      e.target.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6 max-w-2xl px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6"
    >
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          {t('title')}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* ── Avatar + name card ── */}
      {user && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, duration: 0.25 }}
          className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="relative shrink-0">
            <AvatarWithRole user={user} size="lg" />
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploading}
              aria-label={t('uploadAvatar')}
              className={cn(
                'absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center',
                'bg-[var(--brand-primary)] text-white border-2 border-[var(--bg-surface)]',
                'hover:bg-[var(--brand-primary-hover)] transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
              )}
            >
              {isUploading ? (
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              ) : (
                <Camera size={12} aria-hidden="true" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => void handleAvatarChange(e)}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{user.email}</p>
            <span
              className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
              style={{ background: 'var(--role-admin)' }}
            >
              <Shield size={11} aria-hidden="true" />
              {t('adminRole')}
            </span>
          </div>
        </motion.div>
      )}

      {/* ── Tab bar ── */}
      <nav
        role="tablist"
        aria-label={t('sectionsAria')}
        className="flex gap-1 border-b border-[var(--border-default)] relative"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              type="button"
              id={`tab-${id}`}
              aria-selected={isActive}
              aria-controls={`panel-${id}`}
              onClick={() => setActiveTab(id)}
              className={cn(
                'relative flex items-center gap-2 px-4 pb-3 pt-1 text-sm font-medium',
                'transition-colors duration-150 focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
                isActive
                  ? 'text-[var(--brand-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              )}
            >
              <Icon
                size={14}
                aria-hidden="true"
                className={isActive ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'}
              />
              {label}

              {isActive && (
                <motion.span
                  layoutId="admin-profile-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[var(--brand-primary)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Tab panels ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            id="panel-profile"
            role="tabpanel"
            aria-labelledby="tab-profile"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <div
              className="px-5 py-3.5 border-b border-[var(--border-default)]"
              style={{ background: 'var(--bg-surface-secondary)' }}
            >
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {t('personalInfo')}
              </h3>
            </div>

            <form onSubmit={(e) => void onSubmit(e)} className="px-5 py-5 space-y-5" noValidate>
              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ap-firstName" required>
                    {t('firstName')}
                  </Label>
                  <Input
                    id="ap-firstName"
                    autoComplete="given-name"
                    aria-required="true"
                    hasError={!!errors.firstName}
                    aria-describedby={errors.firstName ? 'ap-firstName-err' : undefined}
                    {...register('firstName')}
                  />
                  {errors.firstName && (
                    <p id="ap-firstName-err" role="alert" className="text-xs text-[var(--error-text)]">
                      {te('required')}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ap-lastName" required>
                    {t('lastName')}
                  </Label>
                  <Input
                    id="ap-lastName"
                    autoComplete="family-name"
                    aria-required="true"
                    hasError={!!errors.lastName}
                    aria-describedby={errors.lastName ? 'ap-lastName-err' : undefined}
                    {...register('lastName')}
                  />
                  {errors.lastName && (
                    <p id="ap-lastName-err" role="alert" className="text-xs text-[var(--error-text)]">
                      {te('required')}
                    </p>
                  )}
                </div>
              </div>

              {/* Email (read-only) */}
              <div className="space-y-1.5">
                <Label htmlFor="ap-email">{tc('email')}</Label>
                <Input
                  id="ap-email"
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  disabled
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="ap-phone">{t('phone')}</Label>
                <Input
                  id="ap-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  {...register('phone')}
                />
              </div>

              {/* Member Since */}
              <div className="space-y-1.5">
                <Label htmlFor="ap-memberSince">{t('memberSince')}</Label>
                <Input
                  id="ap-memberSince"
                  value={user?.createdAt ? formatLocalizedDate(user.createdAt, locale, 'long') : '—'}
                  readOnly
                  disabled
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={!isDirty || isUpdating}
                  isLoading={isUpdating}
                  className="min-w-[120px] sm:min-w-[140px] w-full sm:w-auto"
                >
                  {isUpdating ? tc('saving') : t('saveChanges')}
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'password' && (
          <motion.div
            key="password"
            id="panel-password"
            role="tabpanel"
            aria-labelledby="tab-password"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ChangePasswordForm userId={user?.id ?? ''} role="admin" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
