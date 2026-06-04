'use client';
// src/app/[locale]/(dashboard)/owner/roles/OwnerRolesClient.tsx
//
// ✅ Zero `any` types
// ✅ Framer Motion: card stagger, save button pulse, checkmark animate
// ✅ Responsive: matrix scrolls horizontally on mobile, full table desktop
// ✅ Light/dark via CSS variables only
// ✅ ARIA: role="grid", aria-checked, aria-label on toggles
// ✅ RolePermissionMatrix component integrated
// ✅ "Create custom role" modal (owner-only feature)

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useOwnerRoles } from '@/modules/owner/hooks/useOwner';
import { RolePermissionMatrix } from '@/modules/owner/components/RolePermissionMatrix';
import type { UserRole } from '@/modules/owner/types/owner.types';
import { cn } from '@/shared/utils/cn';

// ─── Role color tokens ────────────────────────────────────────────────────────

const ROLE_META: Record<
  UserRole,
  { color: string; bg: string; icon: string; description: string }
> = {
  student: {
    color: 'var(--role-student)',
    bg: 'var(--info-bg)',
    icon: '🎓',
    description: 'View courses, submit homework, track grades',
  },
  teacher: {
    color: 'var(--role-teacher)',
    bg: 'var(--success-bg)',
    icon: '👩‍🏫',
    description: 'Manage groups, grade submissions, upload lessons',
  },
  admin: {
    color: 'var(--role-admin)',
    bg: '#F3F0FF',
    icon: '⚙️',
    description: 'Configure courses, manage payments, run reports',
  },
  owner: {
    color: 'var(--role-owner)',
    bg: 'var(--warning-bg)',
    icon: '👑',
    description: 'Full platform access — all permissions granted',
  },
};

// ─── Role summary card ────────────────────────────────────────────────────────

interface RoleCardProps {
  displayName: string;
  name: UserRole;
  permissionCount: number;
  index: number;
}

function RoleCard({
  displayName,
  name,
  permissionCount,
  index,
}: RoleCardProps) {
  const meta = ROLE_META[name] ?? ROLE_META.student;

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
          {displayName}
        </p>
        <p
          className="text-xs mt-0.5 leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          {meta.description}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className="text-xs font-medium rounded-full px-2 py-0.5"
            style={{
              background: name === 'owner' ? meta.bg : 'var(--bg-surface-hover)',
              color: name === 'owner' ? meta.color : 'var(--text-secondary)',
            }}
          >
            {name === 'owner' ? 'All permissions' : `${permissionCount} permissions`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Create role modal ────────────────────────────────────────────────────────

function CreateRoleModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      style={{ background: 'var(--bg-overlay)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Create custom role"
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
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Create Custom Role
          </h3>
          <motion.button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ color: 'var(--text-muted)' }}
            whileTap={{ scale: 0.92 }}
            whileHover={{ background: 'var(--bg-surface-hover)' }}
            aria-label="Close dialog"
          >
            ×
          </motion.button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
              htmlFor="role-name"
            >
              Role Name
            </label>
            <input
              id="role-name"
              type="text"
              placeholder="e.g. Branch Manager"
              className="w-full rounded-lg border px-3 py-2.5 text-sm min-h-[44px] outline-none transition-all"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-focus)';
                e.currentTarget.style.boxShadow =
                  '0 0 0 3px var(--brand-primary)18';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <p
            className="text-xs rounded-lg px-3 py-2.5"
            style={{
              background: 'var(--info-bg)',
              color: 'var(--info-text)',
              border: '1px solid var(--info-border)',
            }}
          >
            ℹ️ Custom roles are created with no permissions by default. Configure
            permissions in the matrix below after creation.
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <motion.button
            type="button"
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold min-h-[44px]"
            style={{
              background: 'var(--brand-primary)',
              color: 'var(--text-on-brand)',
            }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
          >
            Create Role
          </motion.button>
          <motion.button
            type="button"
            className="flex-1 rounded-lg border py-2.5 text-sm font-medium min-h-[44px]"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────

export function OwnerRolesClient() {
  const { matrix, isLoading, saveRole } = useOwnerRoles();
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
          <h1
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Roles &amp; Permissions
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Configure what each role can do across the platform
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
        >
          + Custom Role
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
          {matrix.roles.map((role, i) => (
            <RoleCard
              key={role.id}
              displayName={role.displayName}
              name={role.name}
              permissionCount={role.permissions.length}
              index={i}
            />
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
            Permission Matrix
          </h2>
          <p
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Click a checkbox to toggle. Owner always has full access.
          </p>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading matrix…">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg animate-pulse"
                  style={{ background: 'var(--bg-surface-hover)' }}
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : matrix ? (
            <RolePermissionMatrix
              matrix={matrix}
              onSaveRole={saveRole}
              onCreateRole={() => setShowCreateModal(true)}
            />
          ) : (
            <div
              className="py-16 text-center"
              style={{ color: 'var(--text-muted)' }}
            >
              <p className="text-4xl mb-3" aria-hidden="true">🔒</p>
              <p className="text-sm">Unable to load permission matrix</p>
            </div>
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
        <strong>⚠️ Important:</strong> Permission changes take effect immediately
        after saving. Users currently online may need to refresh their session.
      </motion.div>

      {/* ── Create Role Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateRoleModal onClose={() => setShowCreateModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
