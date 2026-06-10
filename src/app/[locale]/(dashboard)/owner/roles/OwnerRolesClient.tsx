'use client';
// src/app/[locale]/(dashboard)/owner/roles/OwnerRolesClient.tsx
//
// XATO 1 FIX: Backend bo'sh array qaytarsa → system rollar fallback (owner.api.ts da)
// XATO 2 FIX: useOwnerRoles endi TanStack Query (useQuery) ishlatadi
// XATO 3 FIX: saveRole → useMutation + cache invalidation (useOwner.ts da)
// XATO 4 FIX: createRole → useMutation + POST /owner/roles + cache invalidation
// XATO 5 FIX: displayName → owner.api.ts mapRawRolesToMatrix da derive qilinadi
// XATO 6 FIX: admin.bg → 'var(--role-admin)'/10 (CSS variable, hardcoded hex yo'q)
// XATO 7 FIX: Barcha UI matnlar i18n orqali (useTranslations)
// XATO 10 FIX: CreateRoleModal → React Hook Form v7 + Zod v3 validation
//
// ✅ Zero `any` types
// ✅ Framer Motion: card stagger, save button pulse, checkmark animate
// ✅ Responsive: matrix scrolls horizontally on mobile, full table desktop
// ✅ Light/dark via CSS variables only
// ✅ ARIA: role="grid", aria-checked, aria-label on toggles

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useOwnerRoles } from '@/modules/owner/hooks/useOwner';
import { RolePermissionMatrix } from '@/modules/owner/components/RolePermissionMatrix';
import type {
  UserRole,
  RoleDto,
} from '@/modules/owner/types/owner.types';
import { cn } from '@/shared/utils/cn';

// ─── Role description keys (strongly typed subset) ───────────────────────────

const ROLE_DESC_KEYS = {
  student:     'roleDescStudent',
  teacher:     'roleDescTeacher',
  admin:       'roleDescAdmin',
  owner:       'roleDescOwner',
  super_admin: 'roleDescSuperAdmin',
} as const satisfies Record<UserRole, string>;

// ─── Role color tokens (CSS variables only — no hardcoded hex) ────────────────
// FIX XATO 6: admin.bg har doim CSS variable ishlatadi

const ROLE_META: Record<
  UserRole,
  { color: string; bg: string; icon: string }
> = {
  student: {
    color: 'var(--role-student)',
    bg: 'var(--info-bg)',
    icon: '🎓',
  },
  teacher: {
    color: 'var(--role-teacher)',
    bg: 'var(--success-bg)',
    icon: '👩‍🏫',
  },
  admin: {
    color: 'var(--role-admin)',
    // FIX XATO 6: '#F3F0FF' hardcoded edi → CSS variable
    bg: 'color-mix(in srgb, var(--role-admin) 10%, var(--bg-surface))',
    icon: '⚙️',
  },
  owner: {
    color: 'var(--role-owner)',
    bg: 'var(--warning-bg)',
    icon: '👑',
  },
  super_admin: {
    color: 'var(--brand-primary)',
    bg: 'color-mix(in srgb, var(--brand-primary) 10%, var(--bg-surface))',
    icon: '🛡️',
  },
};

// ─── Create role form schema (XATO 10 fix) ───────────────────────────────────

const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name must be at most 50 characters')
    .trim(),
});

type CreateRoleFormValues = z.infer<typeof createRoleSchema>;

// ─── Role summary card ────────────────────────────────────────────────────────

interface RoleCardProps {
  role: RoleDto;
  index: number;
}

function RoleCard({ role, index }: RoleCardProps) {
  const t = useTranslations('owner.roles');
  // FIX XATO 5: displayName → owner.api.ts da derive qilingan (role.displayName har doim mavjud)
  const meta = ROLE_META[role.name] ?? ROLE_META.student;

  return (
    <motion.div
      className="rounded-2xl border p-5 flex gap-4 items-start"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: meta.bg, color: meta.color }}
        aria-hidden="true"
      >
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {role.displayName}
        </p>
        <p
          className="text-xs mt-0.5 leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          {t(ROLE_DESC_KEYS[role.name] ?? ROLE_DESC_KEYS.student)}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className="text-xs font-medium rounded-full px-2 py-0.5"
            style={{
              background:
                role.name === 'owner' ? meta.bg : 'var(--bg-surface-hover)',
              color:
                role.name === 'owner' ? meta.color : 'var(--text-secondary)',
            }}
          >
            {role.name === 'owner'
              ? t('allPermissions')
              : t('permissionsCount', { count: role.permissions.length })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Create role modal (XATO 10 FIX: React Hook Form + Zod) ──────────────────

interface CreateRoleModalProps {
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  isSubmitting: boolean;
}

function CreateRoleModal({
  onClose,
  onSubmit,
  isSubmitting,
}: CreateRoleModalProps) {
  const t = useTranslations('owner.roles');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: '' },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onValid = async (values: CreateRoleFormValues) => {
    await onSubmit(values.name);
    reset();
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      style={{ background: 'var(--bg-overlay)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-role-modal-title"
    >
      <motion.div
        className="w-full max-w-md rounded-2xl border p-6 shadow-xl"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
        initial={{ scale: 0.95, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 24 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3
            id="create-role-modal-title"
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('createModalTitle')}
          </h3>
          <motion.button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ color: 'var(--text-muted)' }}
            whileTap={{ scale: 0.92 }}
            whileHover={{ backgroundColor: 'var(--bg-surface-hover)' }}
            aria-label="Close dialog"
          >
            ×
          </motion.button>
        </div>

        {/* FIX XATO 10: React Hook Form controlled form with Zod validation */}
        <form onSubmit={handleSubmit(onValid)} noValidate>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
                htmlFor="role-name-input"
              >
                {t('roleNameLabel')}
              </label>
              <input
                id="role-name-input"
                type="text"
                placeholder={t('roleNamePlaceholder')}
                aria-required="true"
                aria-describedby={errors.name ? 'role-name-error' : undefined}
                aria-invalid={errors.name ? 'true' : undefined}
                className={cn(
                  'w-full rounded-lg border px-3 py-2.5 text-sm min-h-[44px] outline-none transition-all',
                  errors.name
                    ? 'border-[var(--error-solid)] focus:ring-2 focus:ring-[var(--error-solid)]/20'
                    : 'border-[var(--border-default)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--brand-primary)]/15',
                )}
                style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                }}
                {...register('name')}
              />
              {errors.name && (
                <motion.p
                  id="role-name-error"
                  role="alert"
                  className="text-xs"
                  style={{ color: 'var(--error-text)' }}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {errors.name.message}
                </motion.p>
              )}
            </div>

            <p
              className="text-xs rounded-lg px-3 py-2.5"
              style={{
                background: 'var(--info-bg)',
                color: 'var(--info-text)',
                border: '1px solid var(--info-border)',
              }}
            >
              ℹ️ {t('createRoleInfo')}
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'var(--brand-primary)',
                color: 'var(--text-on-brand)',
              }}
              whileTap={{ scale: 0.97 }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t('savingLabel')}
                </span>
              ) : (
                t('createRoleButton')
              )}
            </motion.button>
            <motion.button
              type="button"
              className="flex-1 rounded-lg border py-2.5 text-sm font-medium min-h-[44px]"
              style={{
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              whileTap={{ scale: 0.97 }}
              onClick={handleClose}
            >
              {t('cancelButton')}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Empty / error state ──────────────────────────────────────────────────────

function MatrixEmptyState() {
  const t = useTranslations('owner.roles');
  return (
    <div
      className="py-16 text-center"
      style={{ color: 'var(--text-muted)' }}
    >
      <p className="text-4xl mb-3" aria-hidden="true">🔒</p>
      <p className="text-sm">{t('unableToLoad')}</p>
      <p className="text-xs mt-1 opacity-70">{t('unableToLoadDesc')}</p>
    </div>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────

export function OwnerRolesClient() {
  const t = useTranslations('owner.roles');

  // FIX XATO 2+3+4: useOwnerRoles endi TanStack Query ishlatadi
  const {
    matrix,
    isLoading,
    saveRole,
    createRole,
    isCreatingRole,
  } = useOwnerRoles();

  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div
      className="space-y-8 pb-8"
      style={{ padding: 'var(--space-6)' }}
    >
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <motion.div
        className="flex flex-wrap items-start justify-between gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <div>
          {/* FIX XATO 7: i18n keys — no hardcoded strings */}
          <h1
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('title')}
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('subtitle')}
          </p>
        </div>

        <motion.button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold min-h-[44px]"
          style={{
            background: 'var(--brand-primary)',
            color: 'var(--text-on-brand)',
          }}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.01 }}
          aria-label={t('addCustomRole')}
        >
          {t('addCustomRole')}
        </motion.button>
      </motion.div>

      {/* ── Role summary cards ───────────────────────────────────────────── */}
      {isLoading ? (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-hidden="true"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl animate-pulse"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
          ))}
        </div>
      ) : matrix ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {matrix.roles.map((role: RoleDto, i: number) => (
            <RoleCard key={role.id} role={role} index={i} />
          ))}
        </div>
      ) : null}

      {/* ── Permission matrix ────────────────────────────────────────────── */}
      <motion.div
        className="rounded-xl border overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--bg-surface-secondary)',
          }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('matrixTitle')}
          </h2>
          <p
            className="text-xs hidden sm:block"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('matrixHint')}
          </p>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div
              className="space-y-3"
              aria-busy="true"
              aria-label="Loading matrix…"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg animate-pulse"
                  style={{ background: 'var(--bg-surface-hover)' }}
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : matrix && matrix.allPermissions.length > 0 ? (
            <RolePermissionMatrix
              matrix={matrix}
              onSaveRole={saveRole}
              onCreateRole={() => setShowCreateModal(true)}
            />
          ) : (
            <MatrixEmptyState />
          )}
        </div>
      </motion.div>

      {/* ── Info note ────────────────────────────────────────────────────── */}
      <motion.div
        className="rounded-xl px-5 py-4 text-sm"
        style={{
          background: 'var(--warning-bg)',
          border: '1px solid var(--warning-border)',
          color: 'var(--warning-text)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        role="note"
      >
        <strong>⚠️</strong> {t('importantNote')}
      </motion.div>

      {/* ── Create Role Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateRoleModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={createRole}
            isSubmitting={isCreatingRole}
          />
        )}
      </AnimatePresence>
    </div>
  );
}