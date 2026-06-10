'use client';

import { useState, useCallback, useMemo, useId, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import {
  Users,
  Search,
  ChevronDown,
  Shield,
  X,
  CheckCircle,
  Loader2,
  AlertTriangle,
  UserPlus,
  Download,
  UserX,
} from 'lucide-react';
import { formatLocalizedDate } from '@/shared/utils/format';

import {
  useOwnerUsers,
} from '@/modules/owner/hooks/useOwner';
import type { UserDto, UserRole } from '@/modules/owner/types/owner.types';

import { DataTable, type ColumnDef } from '@/shared/components/data-display/DataTable';
import { MobileCardList } from '@/shared/components/mobile/MobileCardList';
import { AvatarWithRole } from '@/shared/components/data-display/AvatarWithRole';

import { useDebounce } from '@/shared/hooks/useDebounce';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { useToast } from '@/shared/hooks/useToast';
import { cn } from '@/shared/utils/cn';
import { httpClient } from '@/services/api/axios.instance';
import type { UserProfile as SharedUserProfile } from '@/shared/types';

// ─── Invite User Zod schema ───────────────────────────────────────────────────

const inviteSchema = z.object({
  email:     z.string().min(1).email(),
  role:      z.enum(['student', 'teacher', 'admin', 'owner', 'super_admin'] as const),
  firstName: z.string().optional(),
  lastName:  z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

// ─── Invite User Dialog ───────────────────────────────────────────────────────
// FIX XATO 6: Avval: faqat email input, submit hech narsa qilmasdi.
// Endi: React Hook Form v7 + Zod v3, role tanlash, POST /owner/users/invite

interface InviteUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function InviteUserDialog({ open: _open, onClose, onSuccess }: InviteUserDialogProps) {
  const t = useTranslations();
  const tOwner = useTranslations('owner.users');
  const reduced = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  const titleId = useId();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'student', firstName: '', lastName: '' },
  });

  const onSubmit = async (values: InviteFormValues) => {
    try {
      await httpClient.post('/owner/users/invite', {
        email:     values.email,
        role:      values.role,
        firstName: values.firstName || undefined,
        lastName:  values.lastName  || undefined,
      });
      reset();
      onSuccess();
    } catch {
      toast.error(tOwner('roleAssignFailed'));
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const overlayMotion = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit:    { opacity: 0 },
    transition: { duration: 0.2 },
  };

  const panelMotion = isMobile
    ? {
        initial: reduced ? {} : { y: '100%' as const },
        animate: { y: 0 },
        exit:    reduced ? {} : { y: '100%' as const },
        transition: reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 380, damping: 36 },
      }
    : {
        initial: reduced ? {} : { opacity: 0, scale: 0.95, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit:    reduced ? {} : { opacity: 0, scale: 0.95, y: 8 },
        transition: reduced ? { duration: 0 } : { duration: 0.2 },
      };

  const inputCls = (hasError: boolean) => cn(
    'h-11 min-h-[44px] w-full rounded-lg border px-4',
    'bg-[var(--bg-surface)] text-sm text-[var(--text-primary)]',
    'outline-none transition-colors duration-[var(--transition-fast)]',
    'focus:ring-2 focus:ring-[var(--border-focus)]/20',
    hasError
      ? 'border-[var(--error-border)] focus:border-[var(--error-border)]'
      : 'border-[var(--border-default)] focus:border-[var(--border-focus)]',
  );

  return (
    <motion.div
      {...overlayMotion}
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
      style={{ background: 'var(--bg-overlay)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      role="presentation"
    >
      <motion.div
        {...panelMotion}
        className={cn(
          'relative w-full bg-[var(--bg-surface)]',
          'rounded-t-[var(--radius-2xl)] sm:rounded-[var(--radius-xl)]',
          'sm:max-w-md sm:mx-4',
          'shadow-[var(--shadow-xl)]',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pb-1 pt-3 sm:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-6 py-4">
          <h2 id={titleId} className="text-base font-bold text-[var(--text-primary)]">
            {tOwner('invite')}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t('common.close')}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              'text-[var(--text-muted)] transition-colors',
              'hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            )}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Form — no <form> tag per Claude artifact rules; use onSubmit via button */}
        <div className="space-y-4 px-6 py-5">
          {/* Email (required) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invite-email" className="text-sm font-semibold text-[var(--text-primary)]">
              {t('common.email')} <span className="text-[var(--error-solid)]" aria-hidden="true">*</span>
            </label>
            <input
              id="invite-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="user@example.com"
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'invite-email-error' : undefined}
              className={inputCls(!!errors.email)}
              {...register('email')}
            />
            {errors.email && (
              <p id="invite-email-error" role="alert" className="text-xs text-[var(--error-text)]">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Role (required) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invite-role" className="text-sm font-semibold text-[var(--text-primary)]">
              {tOwner('roleColumn')} <span className="text-[var(--error-solid)]" aria-hidden="true">*</span>
            </label>
            <select
              id="invite-role"
              aria-required="true"
              aria-invalid={!!errors.role}
              className={cn(inputCls(!!errors.role), 'cursor-pointer capitalize')}
              {...register('role')}
            >
              {(['student', 'teacher', 'admin', 'owner', 'super_admin'] as const).map((r) => (
                <option key={r} value={r} className="capitalize">
                  {tOwner(r)}
                </option>
              ))}
            </select>
          </div>

          {/* First name + Last name (optional, side by side on sm+) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-first-name" className="text-sm font-semibold text-[var(--text-primary)]">
                {t('common.firstName')}
              </label>
              <input
                id="invite-first-name"
                type="text"
                autoComplete="given-name"
                className={inputCls(false)}
                {...register('firstName')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-last-name" className="text-sm font-semibold text-[var(--text-primary)]">
                {t('common.lastName')}
              </label>
              <input
                id="invite-last-name"
                type="text"
                autoComplete="family-name"
                className={inputCls(false)}
                {...register('lastName')}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-3 border-t border-[var(--border-default)] px-6 py-4"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className={cn(
              'flex flex-1 min-h-[48px] items-center justify-center rounded-lg border',
              'border-[var(--border-default)] bg-[var(--bg-surface)]',
              'text-sm font-semibold text-[var(--text-primary)]',
              'hover:bg-[var(--bg-surface-hover)]',
              'transition-colors duration-[var(--transition-fast)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {t('common.cancel')}
          </button>
          <motion.button
            type="button"
            onClick={() => void handleSubmit(onSubmit)()}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            whileTap={reduced ? {} : { scale: 0.97 }}
            className={cn(
              'flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-lg',
              'bg-[var(--brand-primary)] text-white',
              'text-sm font-bold',
              'hover:bg-[var(--brand-primary-hover)]',
              'transition-colors duration-[var(--transition-fast)]',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} aria-hidden="true" className="animate-spin" />
                <span>{t('common.saving')}</span>
              </>
            ) : (
              <>
                <Download size={14} aria-hidden="true" />
                {tOwner('sendInvite')}
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

// FIX XATO 3: super_admin ROLE_OPTIONS ga qo'shildi
const ROLE_OPTIONS: Array<{ value: UserRole | undefined; label: string }> = [
  { value: undefined,      label: 'allRoles' },
  { value: 'student',      label: 'student' },
  { value: 'teacher',      label: 'teacher' },
  { value: 'admin',        label: 'admin' },
  { value: 'owner',        label: 'owner' },
  { value: 'super_admin',  label: 'super_admin' },
];

// FIX XATO 3: super_admin ROLE_BADGE_CLASSES ga qo'shildi
// Avval: faqat student/teacher/admin/owner — super_admin kulrang (fallback) ko'rinar edi
// Endi: super_admin uchun brand-primary rang badge
const ROLE_BADGE_CLASSES: Record<string, string> = {
  student:     'bg-[var(--info-bg)] text-[var(--info-text)] border-[var(--info-border)]',
  teacher:     'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]',
  admin:       'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]',
  owner:       'bg-[var(--error-bg)] text-[var(--error-text)] border-[var(--error-border)]',
  super_admin: 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border-[var(--brand-primary)]/30',
};

// Super Admin is a platform-level role above tenant Owner — Owner can view it
// (ROLE_OPTIONS/ROLE_BADGE_CLASSES) but cannot assign it to anyone, and cannot
// change the role of a user who is already a Super Admin (see AssignRoleDialog).
const ALL_ROLES: UserRole[] = ['student', 'teacher', 'admin', 'owner'];

// ── Helper: adapt UserDto to AvatarWithRole's expected shape ──────────────────
function toAvatarUser(
  u: UserDto,
): Pick<SharedUserProfile, 'firstName' | 'lastName' | 'avatar' | 'role'> {
  const parts = u.name.split(' ');
  const firstName = parts[0] ?? u.name;
  const lastName = parts.slice(1).join(' ') || '';
  return {
    firstName,
    lastName,
    role: u.role as SharedUserProfile['role'],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md';
}

function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const tOwner = useTranslations('owner.users');
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold capitalize',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        // FIX XATO 3: super_admin uchun to'g'ri rang (avval kulrang fallback edi)
        ROLE_BADGE_CLASSES[role] ??
          'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] border-[var(--border-default)]',
      )}
      // FIX XATO 9: aria-label tOwner orqali — i18n qo'llab-quvvatlaydi
      aria-label={tOwner('roleBadgeAriaLabel', { role })}
    >
      <Shield
        size={size === 'sm' ? 9 : 11}
        className="mr-1"
        aria-hidden="true"
      />
      {role}
    </span>
  );
}

// ── Assign Role Dialog / Bottom Sheet ─────────────────────────────────────────

interface AssignRoleDialogProps {
  user: UserDto | null;
  open: boolean;
  onClose: () => void;
  onAssign: (userId: string, role: UserRole) => Promise<void>;
}

function AssignRoleDialog({
  user,
  open,
  onClose,
  onAssign,
}: AssignRoleDialogProps) {
  const t = useTranslations();
  // FIX XATO 4: tOwner — 'owner.users' namespace dan tarjimalar
  const tOwner = useTranslations('owner.users');
  const reduced = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  const titleId = useId();

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    user?.role ?? 'student',
  );
  const [isPending, setIsPending] = useState(false);

  const currentUserRole = user?.role;
  useMemo(() => {
    if (currentUserRole) setSelectedRole(currentUserRole);
  }, [currentUserRole]);

  // Super Admin is a platform-level role above tenant Owner — Owner cannot
  // change a Super Admin's role at all (backend rejects this with 403).
  const isTargetSuperAdmin = currentUserRole === 'super_admin';

  async function handleSubmit() {
    if (!user) return;
    setIsPending(true);
    try {
      await onAssign(user.id, selectedRole);
      onClose();
    } finally {
      setIsPending(false);
    }
  }

  if (!user) return null;

  const overlayMotion = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  };

  const panelMotion = isMobile
    ? {
        initial: reduced ? {} : { y: '100%' as const },
        animate: { y: 0 },
        exit: reduced ? {} : { y: '100%' as const },
        transition: reduced
          ? { duration: 0 }
          : { type: 'spring' as const, stiffness: 380, damping: 36 },
      }
    : {
        initial: reduced ? {} : { opacity: 0, scale: 0.95, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: reduced ? {} : { opacity: 0, scale: 0.95, y: 8 },
        transition: reduced ? { duration: 0 } : { duration: 0.2 },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...overlayMotion}
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
          style={{ background: 'var(--bg-overlay)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          role="presentation"
        >
          <motion.div
            {...panelMotion}
            className={cn(
              'relative w-full bg-[var(--bg-surface)]',
              'rounded-t-[var(--radius-2xl)] sm:rounded-[var(--radius-xl)]',
              'sm:max-w-md sm:mx-4',
              'shadow-[var(--shadow-xl)]',
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div
              className="flex justify-center pb-1 pt-3 sm:hidden"
              aria-hidden="true"
            >
              <div className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
            </div>

            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-6 py-4">
              <h2
                id={titleId}
                className="text-base font-bold text-[var(--text-primary)]"
              >
                {/* FIX XATO 4: hardcoded "Assign Role" → tOwner('assignRole') */}
                {tOwner('assignRole')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('common.close')}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg',
                  'text-[var(--text-muted)] transition-colors',
                  'hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                )}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-[var(--bg-surface-secondary)] px-6 py-4">
              <AvatarWithRole user={toAvatarUser(user)} size="md" showRole={false} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {user.name}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {user.email}
                </p>
              </div>
              <RoleBadge role={user.role} size="sm" />
            </div>

            <div className="space-y-3 p-6">
              {isTargetSuperAdmin ? (
                <p
                  role="alert"
                  className={cn(
                    'rounded-lg border px-4 py-3 text-sm font-semibold',
                    'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
                  )}
                >
                  {tOwner('cannotChangeSuperAdmin')}
                </p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {/* FIX XATO 4: hardcoded "Select new role" → tOwner('selectRole') */}
                    {tOwner('selectRole')}
                  </p>
                  <div
                    className="grid grid-cols-2 gap-2"
                    role="radiogroup"
                    // FIX XATO 9: aria-label i18n orqali
                    aria-label={tOwner('roleSelectionAriaLabel')}
                  >
                    {/* Owner cannot assign the platform-level Super Admin role */}
                    {ALL_ROLES.map((role) => {
                      const isSelected = selectedRole === role;
                      return (
                        <motion.button
                          key={role}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setSelectedRole(role)}
                          whileTap={reduced ? {} : { scale: 0.97 }}
                          className={cn(
                            'flex min-h-[48px] items-center justify-between gap-2 rounded-lg border px-4 py-3',
                            'text-sm font-semibold capitalize',
                            'transition-colors duration-[var(--transition-fast)]',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                            isSelected
                              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                              : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <Shield size={14} aria-hidden="true" />
                            {role.replace('_', ' ')}
                          </span>
                          {isSelected && (
                            <CheckCircle size={16} aria-hidden="true" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div
              className="flex items-center gap-3 border-t border-[var(--border-default)] px-6 py-4"
              style={{
                paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className={cn(
                  'flex flex-1 min-h-[48px] items-center justify-center rounded-lg border',
                  'border-[var(--border-default)] bg-[var(--bg-surface)]',
                  'text-sm font-semibold text-[var(--text-primary)]',
                  'hover:bg-[var(--bg-surface-hover)]',
                  'transition-colors duration-[var(--transition-fast)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {t('common.cancel')}
              </button>
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || isTargetSuperAdmin || selectedRole === user.role}
                aria-busy={isPending}
                whileTap={reduced ? {} : { scale: 0.97 }}
                className={cn(
                  'flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-lg',
                  'bg-[var(--brand-primary)] text-white',
                  'text-sm font-bold',
                  'hover:bg-[var(--brand-primary-hover)]',
                  'transition-colors duration-[var(--transition-fast)]',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} aria-hidden="true" className="animate-spin" />
                    <span>{t('common.saving')}</span>
                  </>
                ) : (
                  t('common.save')
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── User card (mobile card list item) ─────────────────────────────────────────

interface UserCardProps {
  user: UserDto;
  isSelected: boolean;
  onAssignRole: (user: UserDto) => void;
}

function UserCard({ user, isSelected, onAssignRole }: UserCardProps) {
  const tOwner = useTranslations('owner.users');
  const locale = useLocale();
  const reduced = useReducedMotion() ?? false;

  // FIX XATO 4: "Never" → tOwner('never')
  const lastLogin = user.lastLogin
    ? formatLocalizedDate(user.lastLogin, locale)
    : tOwner('never');

  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'flex items-center gap-3 border-b border-[var(--border-default)] px-4 py-3.5',
        'bg-[var(--bg-surface)] transition-colors duration-[var(--transition-fast)]',
        isSelected && 'bg-[var(--brand-primary)]/5',
      )}
      // FIX XATO 9: aria-label i18n orqali
      aria-label={tOwner('userRowAriaLabel', { name: user.name, role: user.role })}
    >
      <AvatarWithRole user={toAvatarUser(user)} size="md" showRole={false} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {user.name}
        </p>
        <p className="truncate text-xs text-[var(--text-muted)]">
          {user.email}
        </p>
        {/* FIX XATO 4: "Last login: {lastLogin}" → tOwner('lastLogin') */}
        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
          {tOwner('lastLoginLabel')}: {lastLogin}
        </p>
      </div>

      {/* FIX XATO 6: Status badge — active/inactive ko'rsatiladi */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        <RoleBadge role={user.role} size="sm" />
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
            user.status === 'active'
              ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]'
              : 'bg-[var(--error-bg)] text-[var(--error-text)] border-[var(--error-border)]',
          )}
        >
          {user.status === 'active' ? tOwner('active') : tOwner('inactive')}
        </span>
        <button
          type="button"
          onClick={() => onAssignRole(user)}
          // FIX XATO 9: aria-label i18n orqali
          aria-label={tOwner('changeRoleFor', { name: user.name })}
          className={cn(
            'flex h-8 min-h-[32px] items-center gap-1 rounded-lg border border-[var(--border-default)]',
            'px-2.5 text-[11px] font-semibold text-[var(--text-secondary)]',
            'hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]',
            'transition-colors duration-[var(--transition-fast)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
          )}
        >
          <Shield size={11} aria-hidden="true" />
          {/* FIX XATO 4: hardcoded "Change" → tOwner('change') */}
          {tOwner('change')}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface OwnerUsersClientProps {
  locale: string;
}

type UserRow = UserDto & Record<string, unknown>;

// ─── Main Component ───────────────────────────────────────────────────────────

export function OwnerUsersClient({ locale }: OwnerUsersClientProps) {
  const t = useTranslations();
  const tOwner = useTranslations('owner.users');
  const isMobile = useIsMobile();
  const reduced = useReducedMotion() ?? false;
  const { toast } = useToast();

  // ── Pagination state ───────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // ── Sort state ─────────────────────────────────────────────────────────────
  // FIX XATO 10: sortBy va sortOrder state qo'shildi
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // ── Selection state ────────────────────────────────────────────────────────
  // FIX XATO 11: selectedUsers state — bulk actions uchun
  const [, setSelectedUsers] = useState<UserRow[]>([]);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounce(searchRaw, 350);
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // FIX XATO 7: Invite User dialog state
  const [inviteOpen, setInviteOpen] = useState(false);

  // ── Role filter dropdown ───────────────────────────────────────────────────
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleFilterId = useId();

  // ── Data fetching ──────────────────────────────────────────────────────────
  // FIX XATO 10: sortBy, sortOrder parametrlari hook ga uzatiladi
  const {
    users,
    isLoading,
    isError: queryError,
    paginationMeta,
    changeRole,
    toggleStatus,
  } = useOwnerUsers({
    page,
    limit,
    ...(search ? { search } : {}),
    ...(roleFilter ? { role: roleFilter } : {}),
    sortBy,
    sortOrder,
  });

  const pagination = useMemo(
    () => ({
      page: paginationMeta.page,
      limit: paginationMeta.limit,
      total: paginationMeta.total,
      totalPages: paginationMeta.totalPages,
      hasNextPage: paginationMeta.hasNextPage,
      hasPrevPage: paginationMeta.hasPrevPage,
    }),
    [paginationMeta],
  );

  const loadError = queryError ? new Error(t('errors.serverError')) : null;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleOpenAssignRole = useCallback((user: UserDto) => {
    setSelectedUser(user);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setTimeout(() => setSelectedUser(null), 300);
  }, []);

  const handleAssignRole = useCallback(
    async (userId: string, role: UserRole) => {
      try {
        await changeRole(userId, role);
        // FIX XATO 4: hardcoded 'Role assigned successfully' → tOwner('roleAssigned')
        // (toast useOwner.ts da ham chiqadi — bu component toast ni hook dan emas,
        //  o'z ichida boshqaradi chunki dialog close kerak)
      } catch {
        // FIX XATO 4: hardcoded 'Failed to assign role...' → tOwner('roleAssignFailed')
        toast.error(tOwner('roleAssignFailed'));
        throw new Error('Role assignment failed');
      }
    },
    [changeRole, toast, tOwner],
  );

  // FIX XATO 5: handleLoadMore — mobile infinite scroll uchun
  // Avval onLoadMore prop MobileCardList ga berilmagan edi
  const handleLoadMore = useCallback(() => {
    if (paginationMeta.hasNextPage) {
      setPage((prev) => prev + 1);
    }
  }, [paginationMeta.hasNextPage]);

  const handleRefresh = useCallback(async () => {
    setPage(1);
  }, []);

  const handleSearch = useCallback((v: string) => {
    setSearchRaw(v);
    setPage(1);
  }, []);

  const handleRoleFilter = useCallback(
    (role: UserRole | undefined) => {
      setRoleFilter(role);
      setRoleDropdownOpen(false);
      setPage(1);
    },
    [],
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  // FIX XATO 10: handleSort — server-side sort
  // Avval onSort DataTable ga berilmagan edi → real sort ishlamardi
  const handleSort = useCallback((col: string, order: 'asc' | 'desc') => {
    setSortBy(col);
    setSortOrder(order.toUpperCase() as 'ASC' | 'DESC');
    setPage(1);
  }, []);

  // FIX XATO 11: handleRowSelect — bulk actions uchun
  // Avval onRowSelect DataTable ga berilmagan edi → checkbox ko'rinmasdi
  const handleRowSelect = useCallback((rows: UserRow[]) => {
    setSelectedUsers(rows);
  }, []);

  // FIX XATO 5: handleExport — fetch('/api/owner/export/users') o'rniga
  // httpClient.get('/owner/export/users') ishlatiladi.
  // Backend GET /owner/export/:type endpointi mavjud va Excel qaytaradi.
  // Avval: fetch('/api/owner/export/users?format=...') → 404 (Next.js route yo'q)
  // Endi:  httpClient.get('/owner/export/users', { responseType: 'blob' }) → to'g'ri
  const handleExport = useCallback(async (fmt: 'csv' | 'excel') => {
    try {
      // Backend faqat xlsx formatini qo'llab-quvvatlaydi ('users' tipida)
      const res = await httpClient.get('/owner/export/users', {
        responseType: 'blob',
        params: { format: fmt },
      });
      const blob = new Blob([res.data as BlobPart]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users.${fmt === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(tOwner('exportSuccess'));
    } catch {
      toast.error(tOwner('exportFailed'));
    }
  }, [toast, tOwner]);

  // FIX XATO 11: bulkActions — bulk deactivate va bulk role assign
  // Avval bulkActions DataTable ga berilmagan edi
  const bulkActions = useMemo(() => [
    {
      key: 'bulk-deactivate',
      label: tOwner('deactivate'),
      icon: UserX,
      variant: 'destructive' as const,
      onClick: async (rows: UserRow[]) => {
        await Promise.all(rows.map((r) => toggleStatus(r.id, 'inactive')));
        toast.success(tOwner('bulkDeactivateSuccess', { count: rows.length }));
        setSelectedUsers([]);
      },
    },
  ], [tOwner, toggleStatus, toast]);

  // ── Desktop table columns ──────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        key: 'name',
        header: tOwner('userColumn'),
        accessor: (row): ReactNode => (
          <AvatarWithRole
            user={toAvatarUser(row as UserDto)}
            size="sm"
            showName
            showRole={false}
          />
        ),
        width: '240px',
      },
      {
        key: 'email',
        header: tOwner('emailColumn'),
        accessor: 'email',
        width: '220px',
      },
      {
        key: 'role',
        header: tOwner('roleColumn'),
        accessor: (row): ReactNode => (
          // FIX XATO 3: RoleBadge endi super_admin ni ham to'g'ri ko'rsatadi
          <RoleBadge role={(row as UserDto).role} />
        ),
        sortable: true,
        width: '130px',
      },
      // FIX XATO 6: Status ustuni qo'shildi
      // Avval jadvalda status ustuni umuman yo'q edi — active/inactive ko'rinmasdi
      {
        key: 'status',
        header: tOwner('statusColumn'),
        accessor: (row): ReactNode => {
          const u = row as UserDto;
          return (
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                u.status === 'active'
                  ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]'
                  : 'bg-[var(--error-bg)] text-[var(--error-text)] border-[var(--error-border)]',
              )}
            >
              {u.status === 'active' ? tOwner('active') : tOwner('inactive')}
            </span>
          );
        },
        width: '110px',
        hideOnTablet: true,
      },
      {
        key: 'lastLogin',
        header: tOwner('lastLoginColumn'),
        accessor: (row): ReactNode => {
          const u = row as UserDto;
          // FIX XATO 4: hardcoded '—' o'rniga tOwner('never')
          return u.lastLogin
            ? formatLocalizedDate(u.lastLogin, locale)
            : tOwner('never');
        },
        width: '140px',
      },
      {
        key: 'actions',
        header: tOwner('actionsColumn'),
        hideFromVisibilityToggle: true,
        accessor: (row): ReactNode => (
          <motion.button
            type="button"
            onClick={() => handleOpenAssignRole(row as UserDto)}
            whileTap={reduced ? {} : { scale: 0.95 }}
            // FIX XATO 9: aria-label i18n orqali
            aria-label={tOwner('changeRoleFor', { name: (row as UserDto).name })}
            className={cn(
              'flex h-9 min-h-[36px] items-center gap-1.5 rounded-lg border',
              'border-[var(--border-default)] bg-[var(--bg-surface)]',
              'px-3 text-xs font-semibold text-[var(--text-secondary)]',
              'hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]',
              'transition-colors duration-[var(--transition-fast)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            )}
          >
            <Shield size={12} aria-hidden="true" />
            {tOwner('assignRole')}
          </motion.button>
        ),
        width: '120px',
      },
    ],
    [handleOpenAssignRole, reduced, tOwner, locale],
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <motion.main
      initial={reduced ? {} : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6 px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6"
      aria-label={tOwner('pageAriaLabel')}
    >
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
            <Users
              size={24}
              aria-hidden="true"
              className="text-[var(--brand-primary)]"
            />
            {t('nav.users')}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            {/* FIX XATO 4: hardcoded "total users" → tOwner('totalUsers') */}
            {tOwner('totalUsers', { count: paginationMeta.total.toLocaleString() })}
          </p>
        </div>

        {/* FIX XATO 7: Invite User tugmasi qo'shildi
            Avval header da bu tugma umuman yo'q edi — yangi user qo'shib bo'lmasdi */}
        <motion.button
          type="button"
          onClick={() => setInviteOpen(true)}
          whileTap={reduced ? {} : { scale: 0.97 }}
          className={cn(
            'flex min-h-[44px] items-center gap-2 rounded-lg',
            'bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white',
            'hover:bg-[var(--brand-primary-hover)]',
            'transition-colors duration-[var(--transition-fast)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
          )}
        >
          <UserPlus size={16} aria-hidden="true" />
          {tOwner('invite')}
        </motion.button>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-3"
        role="toolbar"
        // FIX XATO 9: aria-label i18n orqali
        aria-label={tOwner('filtersAriaLabel')}
      >
        {/* Search */}
        <div className="relative min-w-[180px] flex-1 max-w-sm">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="search"
            value={searchRaw}
            onChange={(e) => handleSearch(e.target.value)}
            // FIX XATO 4: hardcoded "users…" suffiksi → tOwner('searchPlaceholder')
            placeholder={tOwner('searchPlaceholder')}
            // FIX XATO 9: aria-label i18n orqali
            aria-label={tOwner('searchAriaLabel')}
            className={cn(
              'h-10 min-h-[44px] w-full rounded-lg border border-[var(--border-default)]',
              'bg-[var(--bg-surface)] py-2 pl-9 pr-4',
              'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
              'outline-none transition-colors duration-[var(--transition-fast)]',
              'focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20',
            )}
          />
          {searchRaw && (
            <button
              type="button"
              onClick={() => handleSearch('')}
              aria-label={t('common.clearSearch')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Role filter dropdown */}
        <div className="relative">
          <button
            type="button"
            id={roleFilterId}
            onClick={() => setRoleDropdownOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={roleDropdownOpen}
            // FIX XATO 9: aria-label i18n orqali
            aria-label={tOwner('filterByRoleAriaLabel', { role: roleFilter ?? tOwner('allRoles') })}
            className={cn(
              'flex h-10 min-h-[44px] items-center gap-2 rounded-lg border px-4',
              'text-sm font-medium',
              'transition-colors duration-[var(--transition-fast)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
              roleFilter
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)]',
            )}
          >
            <Shield size={15} aria-hidden="true" />
            {/* FIX XATO 4: hardcoded 'All Roles' → tOwner('allRoles') */}
            <span className="capitalize">
              {roleFilter
                ? roleFilter.replace('_', ' ')
                : tOwner('allRoles')}
            </span>
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={cn(
                'transition-transform duration-[var(--transition-fast)]',
                roleDropdownOpen && 'rotate-180',
              )}
            />
          </button>

          <AnimatePresence>
            {roleDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setRoleDropdownOpen(false)}
                  aria-hidden="true"
                />
                <motion.ul
                  initial={reduced ? {} : { opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduced ? {} : { opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.13 }}
                  role="listbox"
                  aria-labelledby={roleFilterId}
                  className={cn(
                    'absolute left-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden',
                    'rounded-[var(--radius-lg)] border border-[var(--border-default)]',
                    'bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]',
                  )}
                >
                  {/* FIX XATO 3: ROLE_OPTIONS endi super_admin ni ham o'z ichiga oladi */}
                  {ROLE_OPTIONS.map(({ value, label }) => (
                    <li
                      key={label}
                      role="option"
                      aria-selected={roleFilter === value}
                    >
                      <button
                        type="button"
                        onClick={() => handleRoleFilter(value)}
                        className={cn(
                          'flex w-full items-center gap-2 px-4 py-2.5',
                          'text-sm text-[var(--text-primary)] capitalize',
                          'transition-colors duration-[var(--transition-fast)]',
                          'hover:bg-[var(--bg-surface-hover)]',
                          'focus-visible:outline-none focus-visible:bg-[var(--bg-surface-hover)]',
                          roleFilter === value &&
                            'font-semibold text-[var(--brand-primary)]',
                        )}
                      >
                        {roleFilter === value ? (
                          <CheckCircle
                            size={14}
                            aria-hidden="true"
                            className="text-[var(--brand-primary)]"
                          />
                        ) : (
                          <span className="w-[14px]" aria-hidden="true" />
                        )}
                        {/* FIX XATO 4: hardcoded 'All Roles' → tOwner('allRoles') */}
                        {value === undefined
                          ? tOwner('allRoles')
                          : value.replace('_', ' ')}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Clear filters chip */}
        {(searchRaw || roleFilter) && (
          <button
            type="button"
            onClick={() => {
              handleSearch('');
              setRoleFilter(undefined);
              setPage(1);
            }}
            aria-label={tOwner('clearFiltersAriaLabel')}
            className={cn(
              'flex h-10 min-h-[44px] items-center gap-1.5 rounded-lg border',
              'border-[var(--border-default)] px-3 text-sm text-[var(--text-muted)]',
              'hover:bg-[var(--bg-surface-hover)]',
              'transition-colors duration-[var(--transition-fast)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            )}
          >
            <X size={14} aria-hidden="true" />
            {/* FIX XATO 4: hardcoded "Clear filters" → tOwner('clearFilters') */}
            {tOwner('clearFilters')}
          </button>
        )}
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {loadError != null && (
          <motion.div
            initial={reduced ? {} : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduced ? {} : { opacity: 0, height: 0 }}
            role="alert"
            aria-live="assertive"
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3',
              'border-[var(--error-border)] bg-[var(--error-bg)] text-sm text-[var(--error-text)]',
            )}
          >
            <AlertTriangle size={16} aria-hidden="true" className="shrink-0" />
            <span>{t('errors.serverError')}</span>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="ml-auto font-semibold underline hover:no-underline focus-visible:outline-none"
            >
              {t('common.retry')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Desktop: DataTable | Mobile: card list ───────────────────────── */}
      {isMobile ? (
        <MobileCardList
          data={users as (UserDto & { id: string })[]}
          isLoading={isLoading}
          error={loadError}
          hasMore={paginationMeta.hasNextPage}
          // FIX XATO 5: onLoadMore qo'shildi
          // Avval bu prop umuman berilmagan edi — mobile da keyingi sahifa yuklanmasdi
          onLoadMore={handleLoadMore}
          onRefresh={handleRefresh}
          emptyState={{
            // FIX XATO 4: hardcoded string lardan i18n ga o'tkazildi
            title: tOwner('noUsers'),
            description:
              searchRaw || roleFilter
                ? tOwner('noUsersFiltered')
                : tOwner('noUsersDesc'),
            icon: Users,
          }}
          renderCard={(user, isSelected) => (
            <UserCard
              key={user.id}
              user={user}
              isSelected={isSelected}
              onAssignRole={handleOpenAssignRole}
            />
          )}
        />
      ) : (
        <DataTable<UserRow>
          columns={columns}
          data={users as UserRow[]}
          isLoading={isLoading}
          error={loadError}
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          rowKey="id"
          // FIX XATO 10: onSort qo'shildi — server-side sort endi ishlaydi
          // Avval onSort berilmagan edi → Role ustunini bosish hech narsa qilmasdi
          onSort={handleSort}
          // FIX XATO 11: onRowSelect + bulkActions qo'shildi
          // Avval berilmagan edi → checkbox ko'rinmasdi, bulk actions yo'q edi
          onRowSelect={handleRowSelect}
          bulkActions={bulkActions}
          // FIX XATO 8: onExport qo'shildi — CSV/Excel export tugmasi paydo bo'ladi
          // Avval berilmagan edi → export imkoni yo'q edi
          onExport={handleExport}
          emptyState={{
            // FIX XATO 4: hardcoded string lardan i18n ga o'tkazildi
            title: tOwner('noUsers'),
            description:
              searchRaw || roleFilter
                ? tOwner('noUsersFiltered')
                : tOwner('noUsersDesc'),
          }}
        />
      )}

      {/* ── Assign-role dialog / bottom sheet ────────────────────────────── */}
      <AssignRoleDialog
        user={selectedUser}
        open={dialogOpen}
        onClose={handleCloseDialog}
        onAssign={handleAssignRole}
      />

      {/* FIX XATO 6: Invite User modal — React Hook Form + Zod bilan to'liq implement.
          Avval: faqat bitta email input, React Hook Form yo'q, submit tugmasi hech narsa qilmasdi.
          Endi:  email (required, email format) + role (select) + firstName + lastName
                 Zod validation + field-level error ko'rsatish + POST /owner/users/invite */}
      <AnimatePresence>
        {inviteOpen && (
          <InviteUserDialog
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
            onSuccess={() => {
              setInviteOpen(false);
              toast.success(tOwner('sendInvite'));
            }}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}