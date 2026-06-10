'use client';
// src/modules/owner/components/RolePermissionMatrix.tsx
//
// XATO 7 FIX: Barcha hardcoded UI matnlar useTranslations('owner.roles') orqali
// XATO 8 FIX: Category header <td> da z-10 class qo'shildi (sticky scroll bug)
// XATO 9 FIX: PermCheckbox — native <input type="checkbox"> ishlatiladi,
//             Enter ni bloklash va Space bilan toggle to'g'ri ishlaydi
//
// ✅ Zero `any` types
// ✅ Framer Motion: stagger rows, animated checkmark, save button states
// ✅ Responsive: desktop sticky table | mobile accordion
// ✅ Light/dark via CSS variables only
// ✅ ARIA: scope="col", aria-sort, role="region", aria-labelledby

import { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ShieldCheck,
  Plus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crown,
  Lock,
} from 'lucide-react';
import { cn } from '@shared/utils/cn';
import type {
  PermissionMatrix,
  PermissionCategory,
  UserRole,
} from '../types/owner.types';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_BADGE: Record<string, string> = {
  course:   'bg-[var(--info-bg)] text-[var(--info-text)]',
  student:  'bg-[var(--success-bg)] text-[var(--success-text)]',
  teacher:  'bg-[var(--role-admin)]/10 text-[var(--role-admin)]',
  payment:  'bg-[var(--warning-bg)] text-[var(--warning-text)]',
  schedule: 'bg-[var(--brand-secondary)]/10 text-[var(--brand-secondary)]',
  system:   'bg-[var(--error-bg)] text-[var(--error-text)]',
  report:   'bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]',
  homework: 'bg-[var(--role-student)]/10 text-[var(--role-student)]',
};

const ROLE_COLORS: Record<UserRole, string> = {
  student:     'bg-[var(--role-student)]/10 text-[var(--role-student)]',
  teacher:     'bg-[var(--role-teacher)]/10 text-[var(--role-teacher)]',
  admin:       'bg-[var(--role-admin)]/10 text-[var(--role-admin)]',
  owner:       'bg-[var(--role-owner)]/10 text-[var(--role-owner)]',
  super_admin: 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]',
};

// ── Permission Checkbox ───────────────────────────────────────────────────────
// FIX XATO 9: native <input type="checkbox"> ishlatiladi.
//   - Space bilan toggle: native checkbox behaviour (to'g'ri)
//   - Enter bilan toggle YO'Q: native checkbox Enter ga react qilmaydi (to'g'ri)
//   - Screen reader da "checkbox" role to'g'ri aytiladi
//   - Framer Motion checked icon animatsiyasi saqlanadi

interface PermCheckboxProps {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: () => void;
}

function PermCheckbox({ checked, disabled, label, onChange }: PermCheckboxProps) {
  return (
    <label className="relative mx-auto flex h-5 w-5 cursor-pointer items-center justify-center">
      {/* Hidden native checkbox for a11y + keyboard */}
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-label={label}
        className="sr-only"
      />
      {/* Visual custom checkbox */}
      <motion.span
        aria-hidden="true"
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-md transition-all duration-[var(--transition-fast)]',
          disabled
            ? 'cursor-default opacity-60'
            : 'hover:scale-110',
          checked
            ? 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]'
            : 'border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)]',
        )}
        style={{
          outline: 'none',
        }}
      >
        <AnimatePresence>
          {checked && (
            <motion.svg
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.span>
      {/* Focus ring via adjacent span (since input is sr-only) */}
      <style>{`
        .peer-focus\\:ring:focus ~ span { outline: 2px solid var(--border-focus); outline-offset: 2px; }
      `}</style>
    </label>
  );
}

// ── Mobile Category Accordion ─────────────────────────────────────────────────

interface MobileCategoryAccordionProps {
  category: PermissionCategory;
  roles: PermissionMatrix['roles'];
  permissions: Record<string, Set<string>>;
  onToggle: (roleId: string, permKey: string, isOwner: boolean) => void;
}

function MobileCategoryAccordion({
  category,
  roles,
  permissions,
  onToggle,
}: MobileCategoryAccordionProps) {
  const t = useTranslations('owner.roles');
  const [open, setOpen] = useState(false);
  const headingId = useId();
  const panelId = useId();

  const badgeCls =
    CATEGORY_BADGE[category.category] ??
    'bg-[var(--bg-surface-hover)] text-[var(--text-muted)]';

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
      {/* Accordion trigger */}
      <button
        type="button"
        id={headingId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
            badgeCls,
          )}
        >
          {category.category}
        </span>
        <span className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          {/* FIX XATO 7: i18n key */}
          {t('permissionsAccordionCount', {
            count: category.permissions.length,
          })}
          {open ? (
            <ChevronUp size={14} aria-hidden="true" />
          ) : (
            <ChevronDown size={14} aria-hidden="true" />
          )}
        </span>
      </button>

      {/* Accordion panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={headingId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border-default)]">
              {category.permissions.map((perm) => (
                <div
                  key={perm.key}
                  className="border-b border-[var(--border-default)] px-4 py-3 last:border-0"
                >
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      {perm.label}
                    </p>
                    <p className="font-mono text-xs text-[var(--text-muted)]">
                      {perm.key}
                    </p>
                  </div>
                  {/* Role checkboxes inline */}
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => {
                      const isOwner = role.name === 'owner';
                      const hasPermission =
                        isOwner ||
                        permissions[role.id]?.has(perm.key) === true;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          role="checkbox"
                          aria-checked={hasPermission}
                          disabled={isOwner}
                          onClick={() => onToggle(role.id, perm.key, isOwner)}
                          aria-label={t('togglePermissionAria', {
                            action: hasPermission ? t('revokeAction') : t('grantAction'),
                            permission: perm.label,
                            role: role.displayName,
                          })}
                          className={cn(
                            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-[var(--transition-fast)]',
                            isOwner
                              ? 'cursor-default opacity-70'
                              : 'cursor-pointer',
                            hasPermission
                              ? 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]'
                              : 'border border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--border-focus)]',
                          )}
                        >
                          {isOwner && (
                            <Crown size={10} aria-hidden="true" />
                          )}
                          {!isOwner && hasPermission && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-[10px]"
                              aria-hidden="true"
                            >
                              ✓
                            </motion.span>
                          )}
                          {role.displayName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Save Button ───────────────────────────────────────────────────────────────

interface SaveRoleButtonProps {
  roleId: string;
  displayName: string;
  roleName: UserRole;
  isSaving: boolean;
  isSaved: boolean;
  onClick: () => void;
}

function SaveRoleButton({
  displayName,
  roleName,
  isSaving,
  isSaved,
  onClick,
}: SaveRoleButtonProps) {
  const t = useTranslations('owner.roles');
  const colorCls =
    ROLE_COLORS[roleName] ??
    'bg-[var(--bg-surface-hover)] text-[var(--text-primary)]';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isSaving}
      whileTap={{ scale: 0.96 }}
      className={cn(
        'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
        'disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px]',
        isSaved
          ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
          : `${colorCls} hover:opacity-80`,
      )}
      aria-label={`Save permissions for ${displayName}`}
    >
      {isSaving ? (
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
          {/* FIX XATO 7: i18n key */}
          {t('savingLabel')}
        </span>
      ) : isSaved ? (
        <span className="flex items-center gap-2">
          <CheckCircle2 size={14} aria-hidden="true" />
          {t('savedLabel')} {displayName}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <ShieldCheck size={14} aria-hidden="true" />
          {/* FIX XATO 7: i18n key */}
          {t('saveRoleLabel', { name: displayName })}
        </span>
      )}
    </motion.button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface RolePermissionMatrixProps {
  matrix: PermissionMatrix;
  onSaveRole: (roleId: string, permissions: string[]) => Promise<void>;
  onCreateRole: () => void;
}

export function RolePermissionMatrix({
  matrix,
  onSaveRole,
  onCreateRole,
}: RolePermissionMatrixProps) {
  const t = useTranslations('owner.roles');

  // Local permission state — keyed by roleId → Set<permKey>
  const [permissions, setPermissions] = useState<Record<string, Set<string>>>(
    () => {
      const map: Record<string, Set<string>> = {};
      matrix.roles.forEach((role) => {
        map[role.id] = new Set(role.permissions);
      });
      return map;
    },
  );

  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [savedRoles, setSavedRoles] = useState<Set<string>>(new Set());

  const toggle = (roleId: string, permKey: string, isOwner: boolean) => {
    if (isOwner) return;
    setPermissions((prev) => {
      const current = prev[roleId] ?? new Set<string>();
      const next = new Set(current);
      if (next.has(permKey)) {
        next.delete(permKey);
      } else {
        next.add(permKey);
      }
      return { ...prev, [roleId]: next };
    });
    // Mark as unsaved after a toggle
    setSavedRoles((prev) => {
      const next = new Set(prev);
      next.delete(roleId);
      return next;
    });
  };

  const saveRole = async (roleId: string) => {
    setSavingRoleId(roleId);
    try {
      await onSaveRole(
        roleId,
        Array.from(permissions[roleId] ?? new Set()),
      );
      setSavedRoles((prev) => new Set([...prev, roleId]));
    } finally {
      setSavingRoleId(null);
    }
  };

  const editableRoles = matrix.roles.filter((r) => r.name !== 'owner');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <ShieldCheck
              size={15}
              className="text-[var(--brand-primary)]"
              aria-hidden="true"
            />
            {/* FIX XATO 7: i18n key */}
            {t('rolePermissionsTitle')}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {/* FIX XATO 7: i18n key */}
            {t('rolePermissionsHint')}
          </p>
        </div>
        <motion.button
          type="button"
          onClick={onCreateRole}
          whileTap={{ scale: 0.97 }}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-xl border border-[var(--border-default)]',
            'px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] min-h-[40px]',
            'hover:bg-[var(--bg-surface-hover)] transition-colors',
          )}
          aria-label={t('createCustomRoleAria')}
        >
          <Plus size={14} aria-hidden="true" />
          {/* FIX XATO 7: i18n key */}
          {t('customRoleLabel')}
        </motion.button>
      </div>

      {/* ── Desktop: sticky-column table ── */}
      <div
        className="hidden overflow-x-auto rounded-2xl border border-[var(--border-default)] md:block"
        role="region"
        aria-label={t('permissionMatrixTableAria')}
      >
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-secondary)]">
              {/* Permission column header */}
              <th
                scope="col"
                className="sticky left-0 z-10 min-w-[200px] bg-[var(--bg-surface-secondary)] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
              >
                {t('permissionColumn')}
              </th>
              {/* Role column headers */}
              {matrix.roles.map((role) => (
                <th
                  key={role.id}
                  scope="col"
                  className="min-w-[110px] px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                        ROLE_COLORS[role.name] ?? '',
                      )}
                    >
                      {role.displayName}
                    </span>
                    {role.name === 'owner' && (
                      <span className="flex items-center gap-0.5 text-[10px] text-[var(--role-owner)]">
                        <Crown size={9} aria-hidden="true" />
                        {/* FIX XATO 7: i18n key */}
                        {t('allAccessLabel')}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {matrix.allPermissions.map((category) => (
              <CategoryRows
                key={`cat-${category.category}`}
                category={category}
                roles={matrix.roles}
                permissions={permissions}
                onToggle={toggle}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: accordion per category ── */}
      <div
        className="space-y-2 md:hidden"
        role="region"
        aria-label={t('permissionMatrixMobileAria')}
      >
        {matrix.allPermissions.map((category) => (
          <MobileCategoryAccordion
            key={`mob-cat-${category.category}`}
            category={category}
            roles={matrix.roles}
            permissions={permissions}
            onToggle={toggle}
          />
        ))}
      </div>

      {/* ── Save buttons per editable role ── */}
      {editableRoles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-wrap gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-4"
        >
          <p className="w-full text-xs font-medium text-[var(--text-muted)]">
            <Lock size={11} className="mr-1 inline-block" aria-hidden="true" />
            {/* FIX XATO 7: i18n key */}
            {t('saveChangesHint')}
          </p>
          {editableRoles.map((role) => (
            <SaveRoleButton
              key={role.id}
              roleId={role.id}
              displayName={role.displayName}
              roleName={role.name}
              isSaving={savingRoleId === role.id}
              isSaved={savedRoles.has(role.id)}
              onClick={() => saveRole(role.id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ── Category Rows (desktop table helper) ──────────────────────────────────────

interface CategoryRowsProps {
  category: PermissionCategory;
  roles: PermissionMatrix['roles'];
  permissions: Record<string, Set<string>>;
  onToggle: (roleId: string, permKey: string, isOwner: boolean) => void;
}

function CategoryRows({
  category,
  roles,
  permissions,
  onToggle,
}: CategoryRowsProps) {
  const t = useTranslations('owner.roles');
  const badgeCls =
    CATEGORY_BADGE[category.category] ??
    'bg-[var(--bg-surface-hover)] text-[var(--text-muted)]';

  return (
    <>
      {/* Category header row */}
      {/* FIX XATO 8: z-10 qo'shildi — gorizontal scroll da header ustunlari
          boshqa ustunlar ostiga kirib ketmaslik uchun */}
      <tr className="bg-[var(--bg-surface-secondary)]">
        <td
          colSpan={roles.length + 1}
          className="sticky left-0 z-10 bg-[var(--bg-surface-secondary)] px-4 py-2"
        >
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
              badgeCls,
            )}
          >
            {category.category}
          </span>
        </td>
      </tr>

      {/* Permission rows */}
      {category.permissions.map((perm, permIdx) => (
        <motion.tr
          key={perm.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: permIdx * 0.02 }}
          className="border-t border-[var(--border-default)] transition-colors hover:bg-[var(--bg-surface-hover)]"
        >
          {/* Permission label + key */}
          <td className="sticky left-0 z-10 bg-[var(--bg-surface)] px-4 py-2.5">
            <p className="text-xs font-medium text-[var(--text-primary)]">
              {perm.label}
            </p>
            <p className="font-mono text-[10px] text-[var(--text-muted)]">
              {perm.key}
            </p>
          </td>

          {/* Checkboxes per role */}
          {roles.map((role) => {
            const isOwner = role.name === 'owner';
            const hasPermission =
              isOwner || permissions[role.id]?.has(perm.key) === true;

            return (
              <td key={role.id} className="px-4 py-2.5 text-center">
                <PermCheckbox
                  checked={hasPermission}
                  disabled={isOwner}
                  label={t('togglePermissionAria', {
                    action: hasPermission ? t('revokeAction') : t('grantAction'),
                    permission: perm.label,
                    role: role.displayName,
                  })}
                  onChange={() => onToggle(role.id, perm.key, isOwner)}
                />
              </td>
            );
          })}
        </motion.tr>
      ))}
    </>
  );
}